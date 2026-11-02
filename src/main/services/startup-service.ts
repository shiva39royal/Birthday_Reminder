import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
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

  public async isStartupEnabled(): Promise<boolean> {
    try {
      const loginSettings = app.getLoginItemSettings();
      if (loginSettings.openAtLogin) {
        return true;
      }

      // Check Task Scheduler
      try {
        const { stdout } = await execAsync(`schtasks /query /tn "${this.TASK_NAME}" /fo CSV`);
        if (stdout.includes(this.TASK_NAME)) {
          return true;
        }
      } catch {
        // Not in Task Scheduler
      }

      const db = DbManager.getInstance();
      return db.getSettings().start_with_windows;
    } catch (err) {
      log.warn('Error checking startup status:', err);
      return false;
    }
  }

  public async enableStartup(delayMinutes: number = 5): Promise<boolean> {
    try {
      const execPath = process.execPath;
      const appArgs = ['--reminder'];

      // 1. Configure Electron Login Item
      app.setLoginItemSettings({
        openAtLogin: true,
        path: execPath,
        args: appArgs
      });

      // 2. Also register in Windows Task Scheduler if possible (for scheduled logon trigger)
      try {
        const delayStr = `00${String(delayMinutes).padStart(2, '0')}:00`;
        const taskCmd = `"${execPath}" --reminder`;
        const schCmd = `schtasks /create /tn "${this.TASK_NAME}" /tr "${taskCmd}" /sc onlogon /delay ${delayStr} /f`;
        await execAsync(schCmd);
        log.info('Registered Task Scheduler job:', this.TASK_NAME);
      } catch (taskErr) {
        log.warn('Task Scheduler registration failed (using login item instead):', taskErr);
      }

      // 3. Update DB
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
      app.setLoginItemSettings({
        openAtLogin: false
      });

      try {
        await execAsync(`schtasks /delete /tn "${this.TASK_NAME}" /f`);
        log.info('Deleted Task Scheduler job:', this.TASK_NAME);
      } catch {
        // Ignored if wasn't registered
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

