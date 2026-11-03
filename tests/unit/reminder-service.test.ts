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

    // Reset reminder state for test date
    db.resetDateDisplayed(testDate);

    const result = await reminderService.checkDailyReminders();
    expect(result.shouldCelebrate).toBe(true);
    expect(result.birthdays.length).toBeGreaterThan(0);
    expect(result.birthdays.some(b => b.id === 'rem-emp-1')).toBe(true);
  });

  it('does NOT mark acknowledged when window is closed without acknowledgment', async () => {
    const testDate = '2026-07-14';
    birthdayService.setSimulatedDate(testDate);
    db.resetDateDisplayed(testDate);

    db.createEmployee({
      id: 'rem-emp-2',
      employee_name: 'Birthday Star Two',
      date_of_birth: '1995-07-14'
    });

    // Simulate closing celebration window without clicking "Ok, Thank You!"
    reminderService.handleCelebrationClosedWithoutAck();

    // Verify isDateDisplayed remains false
    expect(db.isDateDisplayed(testDate)).toBe(false);

    // Check that reminder still wants to celebrate
    const result = await reminderService.checkDailyReminders();
    expect(result.shouldCelebrate).toBe(true);

    // Verify that snooze timer is active
    expect(reminderService.hasPendingSnooze()).toBe(true);
    reminderService.clearSnooze();
  });

  it('does NOT celebrate if today is already acknowledged', async () => {
    const testDate = '2026-07-14';
    birthdayService.setSimulatedDate(testDate);

    // Mark as acknowledged
    reminderService.acknowledgeTodayReminders();

    // Verify isDateDisplayed is true
    expect(db.isDateDisplayed(testDate)).toBe(true);

    const result = await reminderService.checkDailyReminders();
    expect(result.shouldCelebrate).toBe(false);
  });
});
