import { describe, it, expect, beforeEach } from 'vitest';
import { ReminderService } from '../../src/main/services/reminder-service';
import { BirthdayService } from '../../src/main/services/birthday-service';
import { DbManager } from '../../src/main/database/db-manager';

describe('ReminderService', () => {
  let reminderService: ReminderService;
  let birthdayService: BirthdayService;
  let db: DbManager;

  beforeEach(async () => {
    db = DbManager.getInstance();
    await db.initialize();
    birthdayService = BirthdayService.getInstance();
    reminderService = ReminderService.getInstance();
  });

  it('detects celebration when birthday exists on an unacknowledged day', async () => {
    const testDate = '2026-07-14';
    birthdayService.setSimulatedDate(testDate);

    // Create employee with birthday on July 14
    db.createEmployee({
      id: 'rem-emp-1',
      employee_name: 'Birthday Star',
      date_of_birth: '1995-07-14'
    });

    // Reset last processed date
    db.updateSettings({ last_processed_date: null });

    const result = await reminderService.checkDailyReminders();
    expect(result.shouldCelebrate).toBe(true);
    expect(result.birthdays.length).toBeGreaterThan(0);
    expect(result.birthdays.some(b => b.id === 'rem-emp-1')).toBe(true);
  });

  it('does NOT celebrate if today is already acknowledged', async () => {
    const testDate = '2026-07-14';
    birthdayService.setSimulatedDate(testDate);

    // Mark as acknowledged
    reminderService.acknowledgeTodayReminders();

    const result = await reminderService.checkDailyReminders();
    expect(result.shouldCelebrate).toBe(false);
  });
});

