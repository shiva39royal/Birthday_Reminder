import { app, powerMonitor, Menu } from 'electron';
import * as path from 'path';
import { DbManager } from './database/db-manager';
import { MainWindowManager } from './windows/main-window';
import { CelebrationWindowManager } from './windows/celebration-window';
import { registerIpcHandlers } from './ipc-handlers';
import { seedDemoEmployees } from './database/seed-data';
import { ReminderService } from './services/reminder-service';
import { BirthdayService } from './services/birthday-service';
import { StartupService } from './services/startup-service';
import { AppPaths } from './utils/paths';
import log from 'electron-log';

// Disable default menu bar across the entire application (File, Edit, View, Window, Help)
Menu.setApplicationMenu(null);

// Setup file logging
log.transports.file.resolvePathFn = () => path.join(AppPaths.getLogsDir(), 'birthday-buddy.log');
log.info('Birthday Buddy starting up...');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  log.info('Another instance is already running. Quitting duplicate.');
  app.quit();
} else {
  // Parse command line arguments
  const args = process.argv.slice(1);
  const isReminderMode = args.includes('--reminder');

  // Check for test date flag e.g. --test-date=2026-11-02 or --test-date 2026-11-02
  const testDateArg = args.find(a => a.startsWith('--test-date'));
  if (testDateArg) {
    let testDate = '';
    if (testDateArg.includes('=')) {
      testDate = testDateArg.split('=')[1];
    } else {
      const idx = args.indexOf(testDateArg);
      if (idx !== -1 && args[idx + 1]) {
        testDate = args[idx + 1];
      }
    }
    if (testDate) {
      log.info('Launching with simulated test date:', testDate);
      BirthdayService.getInstance().setSimulatedDate(testDate);
    }
  }

  ReminderService.getInstance().setReminderMode(isReminderMode);

  let isWaitingInitialReminder = isReminderMode;

  app.on('second-instance', (_event, commandLine) => {
    log.info('Second instance detected with args:', commandLine);
    // If second instance was started by Windows boot/startup with --reminder, ignore it completely
    const isReminderLaunch = commandLine.some(arg => arg.includes('--reminder'));
    if (isReminderLaunch) {
      log.info('Second instance is a background reminder launch; ignoring duplicate without opening main window.');
      return;
    }
    const mainWin = MainWindowManager.getWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
    } else {
      MainWindowManager.create();
    }
  });

  app.whenReady().then(async () => {
    try {
      // Initialize Database
      const db = DbManager.getInstance();
      await db.initialize();
      registerIpcHandlers();

      // Configure celebration callback
      ReminderService.getInstance().onTriggerCelebration(birthdays => {
        CelebrationWindowManager.create(birthdays);
      });

      let startupTimer: NodeJS.Timeout | null = null;

      // Handle clean, instant exit when Windows is shutting down, restarting, or logging off.
      // This completely eliminates any "A background app is running" shutdown warning.
      const handleCleanShutdown = () => {
        log.info('System shutdown/logoff signal received. Clearing timers and cleanly exiting immediately.');
        if (startupTimer) {
          clearTimeout(startupTimer);
          startupTimer = null;
        }
        ReminderService.getInstance().clearSnooze();
        app.exit(0);
      };

      powerMonitor.on('shutdown', handleCleanShutdown);
      app.on('session-end', handleCleanShutdown);
      app.on('before-quit', () => {
        if (startupTimer) {
          clearTimeout(startupTimer);
          startupTimer = null;
        }
        ReminderService.getInstance().clearSnooze();
      });

      if (isReminderMode) {
        log.info('Started in background reminder mode.');
        const settings = db.getSettings();
        const delayMs = (settings.reminder_delay_minutes || 3) * 60 * 1000;

        log.info(`Waiting ${settings.reminder_delay_minutes || 3} minute(s) before checking daily birthdays...`);
        startupTimer = setTimeout(async () => {
          startupTimer = null;
          isWaitingInitialReminder = false;
          const result = await ReminderService.getInstance().checkDailyReminders();
          if (!result.shouldCelebrate) {
            log.info('No reminders to show. Cleanly exiting background process.');
            app.quit();
          }
        }, delayMs);
      } else {
        // Normal GUI launch
        MainWindowManager.create();

        // In packaged mode, ensure Windows startup is registered if enabled in settings
        if (app.isPackaged) {
          const settings = db.getSettings();
          if (settings.start_with_windows !== false) {
            StartupService.getInstance().enableStartup(settings.reminder_delay_minutes || 3).catch(err => {
              log.warn('Could not auto-register startup on launch:', err);
            });
          }
        }

        // Check if there are unacknowledged birthdays for today and prompt celebration
        setTimeout(async () => {
          const result = await ReminderService.getInstance().checkDailyReminders();
          if (result.shouldCelebrate) {
            CelebrationWindowManager.create(result.birthdays);
          }
        }, 1500);
      }

      // Handle system wake/resume from sleep or hibernate
      powerMonitor.on('resume', async () => {
        log.info('System resumed from sleep. Checking daily birthdays...');
        const result = await ReminderService.getInstance().checkDailyReminders();
        if (result.shouldCelebrate) {
          CelebrationWindowManager.create(result.birthdays);
        }
      });
    } catch (err) {
      log.error('Fatal initialization error:', err);
    }
  });

  app.on('window-all-closed', () => {
    // Keep process alive if initial reminder delay is waiting OR if a 5-minute reminder snooze is pending
    if (isWaitingInitialReminder || ReminderService.getInstance().hasPendingSnooze()) {
      log.info('All windows closed, but background reminder check or 5-minute snooze is active. Keeping process alive.');
      return;
    }
    log.info('All windows closed and no reminder/snooze active. Exiting cleanly.');
    app.quit();
  });
}

