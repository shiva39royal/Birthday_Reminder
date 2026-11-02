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

  public onTriggerCelebration(callback: (birthdays: BirthdayEmployee[]) => void): void {
    this.onTriggerCelebrationCallback = callback;
  }

  public async checkDailyReminders(): Promise<{ shouldCelebrate: boolean; birthdays: BirthdayEmployee[] }> {
    const db = DbManager.getInstance();
    const birthdayService = BirthdayService.getInstance();
    const settings = db.getSettings();
    const today = birthdayService.getTodayDate().isoDate;

    // 1. Check if already acknowledged today
    if (settings.last_processed_date === today) {
      log.info(`Daily reminders for ${today} already acknowledged. Skipping.`);
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
      log.info(`No birthdays found for today (${today}).`);
      // Update last processed date so we don't repeat checks unnecessarily today
      db.updateSettings({ last_processed_date: today });
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
    const db = DbManager.getInstance();
    const birthdayService = BirthdayService.getInstance();
    const today = birthdayService.getTodayDate().isoDate;

    db.markRemindersAcknowledged(today);
    log.info(`Acknowledged reminders for ${today}`);

    if (this.isReminderMode) {
      log.info('Reminder acknowledged in background mode. Quitting application.');
      setTimeout(() => {
        app.quit();
      }, 500);
    }
  }

  public handleCelebrationClosedWithoutAck(): void {
    log.info('Celebration window was closed without explicit acknowledgement.');
    if (this.isReminderMode) {
      // In reminder mode, terminate process; reminder remains unacknowledged for next launch
      log.info('Background reminder mode finished without ack. Quitting.');
      app.quit();
    }
  }
}

