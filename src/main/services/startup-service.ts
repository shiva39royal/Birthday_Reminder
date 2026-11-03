import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { DbManager } from '../database/db-manager';
import log from 'electron-log';

const execAsync = promisify(exec);

export class StartupService {
  private static instance: StartupService | null = null;
  private readonly TASK_NAME = 'BirthdayBuddyDailyReminder';

  private constructor() {}

  public static getInstance(): StartupService {
    if (!StartupService.instance) {
      StartupService.instance = new StartupService();
    }
    return StartupService.instance;
  }

  private getStartupShortcutPath(): string {
    const appData = process.env.APPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Roaming') : '');
    return path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'Birthday Buddy.lnk');
  }

  public async isStartupEnabled(): Promise<boolean> {
    try {
      // 1. Check Windows Startup folder shortcut
      const shortcutPath = this.getStartupShortcutPath();
      if (fs.existsSync(shortcutPath)) {
        return true;
      }

      // 2. Check Electron / Registry Login Item
      const loginSettings = app.getLoginItemSettings();
      if (loginSettings.openAtLogin) {
        return true;
      }

      // 3. Fallback: check SQLite settings
      const db = DbManager.getInstance();
      return db.getSettings().start_with_windows;
    } catch (err) {
      log.warn('Error checking startup status:', err);
      return false;
    }
  }

  public async enableStartup(delayMinutes: number = 3): Promise<boolean> {
    try {
      // In unpackaged/development mode, never register startup to avoid bare electron.exe in Windows Startup
      if (!app.isPackaged) {
        log.info('Running in development mode; skipping Windows startup registration to prevent registering electron.exe.');
        try {
          app.setLoginItemSettings({ openAtLogin: false });
        } catch {}
        const db = DbManager.getInstance();
        db.updateSettings({ start_with_windows: true, reminder_delay_minutes: delayMinutes });
        return true;
      }

      const execPath = process.execPath;
      const appArgs = ['--reminder'];
      const shortcutPath = this.getStartupShortcutPath();

      // 1. Configure Electron / Windows Registry login item (HKCU\Software\Microsoft\Windows\CurrentVersion\Run)
      try {
        app.setLoginItemSettings({
          openAtLogin: true,
          path: execPath,
          args: appArgs
        });
        log.info('Configured Electron login item settings (openAtLogin = true).');
      } catch (loginErr) {
        log.warn('Could not set Electron login item settings:', loginErr);
      }

      // 2. Create Windows Startup folder shortcut (100% reliable for standard Windows user accounts)
      try {
        const startupDir = path.dirname(shortcutPath);
        if (!fs.existsSync(startupDir)) {
          fs.mkdirSync(startupDir, { recursive: true });
        }

        const psScript = `
          $WshShell = New-Object -ComObject WScript.Shell
          $Shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/'/g, "''")}')
          $Shortcut.TargetPath = '${execPath.replace(/'/g, "''")}'
          $Shortcut.Arguments = '--reminder'
          $Shortcut.WorkingDirectory = '${path.dirname(execPath).replace(/'/g, "''")}'
          $Shortcut.Description = 'Birthday Buddy Automatic Daily Reminder'
          $Shortcut.Save()
        `;
        await execAsync(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/\r?\n/g, ' ')}"`);
        log.info('Created Windows Startup folder shortcut at:', shortcutPath);
      } catch (shortcutErr) {
        log.warn('Could not create Windows Startup folder shortcut:', shortcutErr);
      }

      // 3. Optional: Attempt Task Scheduler only if running with appropriate rights, otherwise suppress noisy error
      try {
        const delayStr = `00${String(delayMinutes).padStart(2, '0')}:00`;
        const taskCmd = `\\"${execPath}\\" --reminder`;
        const schCmd = `schtasks /create /tn "${this.TASK_NAME}" /tr "${taskCmd}" /sc onlogon /delay ${delayStr} /f`;
        await execAsync(schCmd);
        log.info('Registered Task Scheduler job:', this.TASK_NAME);
      } catch {
        // Silently fall back to Login Item + Startup Folder shortcut which works without elevation
        log.info('Task Scheduler requires admin elevation; using Windows Startup shortcut and registry login item.');
      }

      // 4. Update DB settings
      const db = DbManager.getInstance();
      db.updateSettings({ start_with_windows: true, reminder_delay_minutes: delayMinutes });

      log.info('Startup enabled successfully.');
      return true;
    } catch (err) {
      log.error('Failed to enable startup:', err);
      return false;
    }
  }

  public async disableStartup(): Promise<boolean> {
    try {
      // 1. Remove Electron login item
      app.setLoginItemSettings({
        openAtLogin: false
      });

      // 2. Remove Windows Startup folder shortcut if present
      const shortcutPath = this.getStartupShortcutPath();
      if (fs.existsSync(shortcutPath)) {
        try {
          fs.unlinkSync(shortcutPath);
          log.info('Removed Windows Startup shortcut:', shortcutPath);
        } catch (unlinkErr) {
          log.warn('Could not remove Windows Startup shortcut:', unlinkErr);
        }
      }

      // 3. Remove Task Scheduler job if present
      try {
        await execAsync(`schtasks /delete /tn "${this.TASK_NAME}" /f`);
        log.info('Deleted Task Scheduler job:', this.TASK_NAME);
      } catch {
        // Ignored
      }

      const db = DbManager.getInstance();
      db.updateSettings({ start_with_windows: false });

      log.info('Startup disabled successfully.');
      return true;
    } catch (err) {
      log.error('Failed to disable startup:', err);
      return false;
    }
  }
}
