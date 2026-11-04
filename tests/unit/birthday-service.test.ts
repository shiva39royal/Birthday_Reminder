import { describe, it, expect, beforeEach } from 'vitest';
import { BirthdayService } from '../../src/main/services/birthday-service';
import { DbManager } from '../../src/main/database/db-manager';

describe('BirthdayService', () => {
  let birthdayService: BirthdayService;
  let db: DbManager;

  beforeEach(async () => {
    db = DbManager.getInstance();
    await db.initialize();
    birthdayService = BirthdayService.getInstance();
  });

  it('correctly identifies leap years', () => {
    expect(birthdayService.isLeapYear(2024)).toBe(true);
    expect(birthdayService.isLeapYear(2028)).toBe(true);
    expect(birthdayService.isLeapYear(2000)).toBe(true);
    expect(birthdayService.isLeapYear(2026)).toBe(false);
    expect(birthdayService.isLeapYear(2100)).toBe(false);
    expect(birthdayService.isLeapYear(2025)).toBe(false);
  });

  it('detects a birthday when local month and day match regardless of birth year', () => {
    birthdayService.setSimulatedDate('2026-05-15');
    const today = birthdayService.getTodayDate();
    expect(today.isoDate).toBe('2026-05-15');
    expect(today.month).toBe(5);
    expect(today.day).toBe(15);

    // Create an employee with birth year 1995
    db.createEmployee({
      id: 'test-emp-1',
      employee_name: 'Rahul Sharma',
      date_of_birth: '1995-05-15'
    });

    const todaysBirthdays = birthdayService.getTodaysBirthdays();
    const found = todaysBirthdays.find(e => e.id === 'test-emp-1');

    expect(found).toBeDefined();
    expect(found?.employee_name).toBe('Rahul Sharma');
    expect(found?.age).toBe(31); // 2026 - 1995
    expect(found?.isToday).toBe(true);

    // Also verify DD-MM format without year
    db.createEmployee({
      id: 'test-emp-ddmm',
      employee_name: 'Priya Sharma',
      date_of_birth: '15-05'
    });

    const todaysWithDdmm = birthdayService.getTodaysBirthdays();
    const priya = todaysWithDdmm.find(e => e.id === 'test-emp-ddmm');
    expect(priya).toBeDefined();
    expect(priya?.employee_name).toBe('Priya Sharma');
    expect(priya?.age).toBeUndefined();
    expect(priya?.isToday).toBe(true);
  });

  it('handles multiple birthdays on the same day', () => {
    birthdayService.setSimulatedDate('2026-08-20');

    db.createEmployee({
      id: 'test-emp-multi-1',
      employee_name: 'Alice Cooper',
      date_of_birth: '1990-08-20'
    });

    db.createEmployee({
      id: 'test-emp-multi-2',
      employee_name: 'Bob Marley',
      date_of_birth: '1985-08-20'
    });

    const todaysBirthdays = birthdayService.getTodaysBirthdays();
    const alice = todaysBirthdays.find(e => e.id === 'test-emp-multi-1');
    const bob = todaysBirthdays.find(e => e.id === 'test-emp-multi-2');

    expect(alice).toBeDefined();
    expect(bob).toBeDefined();
  });

  it('returns empty array when no employee has a birthday today', () => {
    birthdayService.setSimulatedDate('2026-01-01');
    const todays = birthdayService.getTodaysBirthdays();
    const emp = todays.find(e => e.id === 'test-emp-1');
    expect(emp).toBeUndefined();
  });

  it('handles February 29 policy (feb28 vs mar1) in a non-leap year', () => {
    // 2026 is NOT a leap year
    db.createEmployee({
      id: 'test-leap-emp',
      employee_name: 'Leap Year Baby',
      date_of_birth: '2000-02-29'
    });

    // Default policy is 'feb28'
    db.updateSettings({ feb29_policy: 'feb28' });
    birthdayService.setSimulatedDate('2026-02-28');
    let todays = birthdayService.getTodaysBirthdays();
    expect(todays.some(e => e.id === 'test-leap-emp')).toBe(true);

    // If simulated date is Feb 27 or Mar 1 under feb28 policy, should be false
    birthdayService.setSimulatedDate('2026-03-01');
    todays = birthdayService.getTodaysBirthdays();
    expect(todays.some(e => e.id === 'test-leap-emp')).toBe(false);

    // Change policy to 'mar1'
    db.updateSettings({ feb29_policy: 'mar1' });
    todays = birthdayService.getTodaysBirthdays();
    expect(todays.some(e => e.id === 'test-leap-emp')).toBe(true);
  });

  it('calculates upcoming birthdays within 30 days and orders them chronologically', () => {
    birthdayService.setSimulatedDate('2026-11-01');

    db.createEmployee({
      id: 'test-up-1',
      employee_name: 'Near Birthday',
      date_of_birth: '1992-11-05' // In 4 days
    });

    db.createEmployee({
      id: 'test-up-2',
      employee_name: 'Far Birthday',
      date_of_birth: '1993-11-20' // In 19 days
    });

    db.createEmployee({
      id: 'test-up-3',
      employee_name: 'Too Far Birthday',
      date_of_birth: '1994-12-25' // > 30 days
    });

    const upcoming = birthdayService.getUpcomingBirthdays(30);
    const near = upcoming.find(e => e.id === 'test-up-1');
    const far = upcoming.find(e => e.id === 'test-up-2');
    const tooFar = upcoming.find(e => e.id === 'test-up-3');

    expect(near).toBeDefined();
    expect(near?.daysRemaining).toBe(4);
    expect(far).toBeDefined();
    expect(far?.daysRemaining).toBe(19);
    expect(tooFar).toBeUndefined();

    // Verify ordering
    const nearIdx = upcoming.findIndex(e => e.id === 'test-up-1');
    const farIdx = upcoming.findIndex(e => e.id === 'test-up-2');
    expect(nearIdx).toBeLessThan(farIdx);
  });
});

