import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { DbManager } from '../database/db-manager';
import { BirthdayService } from './birthday-service';
import { BirthdayEmployee } from '../../shared/types';
import log from 'electron-log';

export class ReminderService {
  private static instance: ReminderService | null = null;
  private isReminderMode = false;
  private onTriggerCelebrationCallback: ((birthdays: BirthdayEmployee[]) => void) | null = null;
  private snoozeTimer: NodeJS.Timeout | null = null;
  private snoozeMinutes = 5;

  private constructor() {}

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  public setReminderMode(val: boolean): void {
    this.isReminderMode = val;
  }

  public getIsReminderMode(): boolean {
    return this.isReminderMode;
  }

  public setSnoozeMinutes(min: number): void {
    this.snoozeMinutes = min;
  }

  public getSnoozeMinutes(): number {
    return this.snoozeMinutes;
  }

  public hasPendingSnooze(): boolean {
    return this.snoozeTimer !== null;
  }

  public clearSnooze(): void {
    if (this.snoozeTimer) {
      clearTimeout(this.snoozeTimer);
      this.snoozeTimer = null;
    }
  }

  public onTriggerCelebration(callback: (birthdays: BirthdayEmployee[]) => void): void {
    this.onTriggerCelebrationCallback = callback;
  }

  public async checkDailyReminders(): Promise<{ shouldCelebrate: boolean; birthdays: BirthdayEmployee[] }> {
    const db = DbManager.getInstance();
    const birthdayService = BirthdayService.getInstance();
    const settings = db.getSettings();
    const today = birthdayService.getTodayDate().isoDate;

    // 1. Check if already displayed / acknowledged today in daily_reminder_state
    if (db.isDateDisplayed(today)) {
      log.info(`Daily reminders for ${today} already marked as displayed/acknowledged. Skipping.`);
      return { shouldCelebrate: false, birthdays: [] };
    }

    // 2. Check if notifications are enabled
    if (!settings.notification_enabled) {
      log.info('Notifications are disabled in settings.');
      return { shouldCelebrate: false, birthdays: [] };
    }

    // 3. Find today's birthdays
    const birthdays = birthdayService.getTodaysBirthdays();
    if (birthdays.length === 0) {
      log.info(`No birthdays found for today (${today}). Remaining silent; is_displayed remains false.`);
      return { shouldCelebrate: false, birthdays: [] };
    }

    log.info(`Found ${birthdays.length} birthday(s) for today (${today}):`, birthdays.map(b => b.employee_name));

    // 4. Log reminder history entries if not already logged
    const existingHistory = db.getReminderHistory({ date: today });
    const existingEmpIds = new Set(existingHistory.map(h => h.employee_id));

    for (const b of birthdays) {
      if (!existingEmpIds.has(b.id)) {
        db.logReminder({
          id: uuidv4(),
          reminder_date: today,
          employee_id: b.id,
          employee_name_snapshot: b.employee_name,
          acknowledged_at: null
        });
      }
    }

    // Trigger celebration UI callback
    if (this.onTriggerCelebrationCallback) {
      this.onTriggerCelebrationCallback(birthdays);
    }

    return { shouldCelebrate: true, birthdays };
  }

  public acknowledgeTodayReminders(): void {
    this.clearSnooze();
    const db = DbManager.getInstance();
    const birthdayService = BirthdayService.getInstance();
    const today = birthdayService.getTodayDate().isoDate;
    const birthdays = birthdayService.getTodaysBirthdays();

    db.markRemindersAcknowledged(today, birthdays.length);
    log.info(`Acknowledged reminders for ${today}. Marked is_displayed = true.`);

    if (this.isReminderMode) {
      log.info('Reminder acknowledged in background mode. Quitting application.');
      setTimeout(() => {
        app.quit();
      }, 500);
    }
  }

  public handleCelebrationClosedWithoutAck(): void {
    const db = DbManager.getInstance();
    const birthdayService = BirthdayService.getInstance();
    const today = birthdayService.getTodayDate().isoDate;

    // If already acknowledged, do nothing
    if (db.isDateDisplayed(today)) {
      if (this.isReminderMode) {
        app.quit();
      }
      return;
    }

    log.info(
      `Celebration window closed without acknowledgement. Snoozing: will remind again in ${this.snoozeMinutes} minute(s) until user clicks "Ok, Thank You!".`
    );

    this.clearSnooze();

    const delayMs = this.snoozeMinutes * 60 * 1000;
    this.snoozeTimer = setTimeout(async () => {
      this.snoozeTimer = null;
      const curToday = birthdayService.getTodayDate().isoDate;

      // Re-check if acknowledged in the meantime
      if (db.isDateDisplayed(curToday)) {
        log.info(`Today (${curToday}) was acknowledged during snooze. Skipping re-trigger.`);
        if (this.isReminderMode) {
          app.quit();
        }
        return;
      }

      const birthdays = birthdayService.getTodaysBirthdays();
      if (birthdays.length > 0) {
        log.info(`${this.snoozeMinutes}-minute snooze expired. Re-triggering celebration reminder window!`);
        if (this.onTriggerCelebrationCallback) {
          this.onTriggerCelebrationCallback(birthdays);
        }
      } else if (this.isReminderMode) {
        app.quit();
      }
    }, delayMs);
  }
}
