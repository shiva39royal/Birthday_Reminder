import { DbManager } from '../database/db-manager';
import { ImageService } from './image-service';
import { Employee, BirthdayEmployee, DashboardStats } from '../../shared/types';
import log from 'electron-log';

export class BirthdayService {
  private static instance: BirthdayService | null = null;
  private simulatedDate: string | null = null;

  private constructor() {}

  public static getInstance(): BirthdayService {
    if (!BirthdayService.instance) {
      BirthdayService.instance = new BirthdayService();
    }
    return BirthdayService.instance;
  }

  public setSimulatedDate(dateStr: string | null): void {
    this.simulatedDate = dateStr;
    log.info('BirthdayService simulated date set to:', dateStr);
  }

  public getTodayDate(): { year: number; month: number; day: number; isoDate: string } {
    if (this.simulatedDate && /^\d{4}-\d{2}-\d{2}$/.test(this.simulatedDate)) {
      const [y, m, d] = this.simulatedDate.split('-').map(Number);
      return {
        year: y,
        month: m,
        day: d,
        isoDate: this.simulatedDate
      };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, isoDate };
  }

  public isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  public parseDob(dobStr: string): { day: number; month: number; year?: number } | null {
    if (!dobStr) return null;
    const parts = dobStr.trim().split(/[-/.]/).map(Number);
    if (parts.length === 2) {
      // DD-MM
      const [day, month] = parts;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { day, month };
      }
    } else if (parts.length === 3) {
      if (parts[0] > 1000) {
        // YYYY-MM-DD
        const [year, month, day] = parts;
        return { year, month, day };
      } else {
        // DD-MM-YYYY
        const [day, month, year] = parts;
        return { year, month, day };
      }
    }
    return null;
  }

  public getTodaysBirthdays(): BirthdayEmployee[] {
    const db = DbManager.getInstance();
    const imageService = ImageService.getInstance();
    const settings = db.getSettings();
    const employees = db.getAllEmployees();
    const today = this.getTodayDate();
    const leapYear = this.isLeapYear(today.year);

    const matches: BirthdayEmployee[] = [];

    for (const emp of employees) {
      const parsed = this.parseDob(emp.date_of_birth);
      if (!parsed) continue;

      const { day: birthDay, month: birthMonth, year: birthYear } = parsed;
      let isToday = false;

      // Regular date match
      if (birthMonth === today.month && birthDay === today.day) {
        // Special case: Leap year person on Feb 29
        if (birthMonth === 2 && birthDay === 29 && !leapYear) {
          isToday = false; // Won't happen naturally since Feb 29 doesn't occur in non-leap year
        } else {
          isToday = true;
        }
      }

      // Handle February 29 in non-leap years
      if (birthMonth === 2 && birthDay === 29 && !leapYear) {
        if (settings.feb29_policy === 'feb28' && today.month === 2 && today.day === 28) {
          isToday = true;
        } else if (settings.feb29_policy === 'mar1' && today.month === 3 && today.day === 1) {
          isToday = true;
        }
      }

      if (isToday) {
        const age = birthYear ? today.year - birthYear : undefined;
        const photoUrl = emp.photo_path ? imageService.getPhotoDataUrl(emp.photo_path) : null;

        matches.push({
          ...emp,
          age,
          daysRemaining: 0,
          nextBirthdayDate: today.isoDate,
          isToday: true,
          photoUrl
        });
      }
    }

    return matches;
  }

  public getUpcomingBirthdays(maxDays: number = 30): BirthdayEmployee[] {
    const db = DbManager.getInstance();
    const imageService = ImageService.getInstance();
    const settings = db.getSettings();
    const employees = db.getAllEmployees();
    const today = this.getTodayDate();

    const upcomingList: BirthdayEmployee[] = [];

    for (const emp of employees) {
      const parsed = this.parseDob(emp.date_of_birth);
      if (!parsed) continue;

      const { day: birthDay, month: birthMonth, year: birthYear } = parsed;
      const nextBday = this.calculateNextBirthday(today.year, birthMonth, birthDay, settings.feb29_policy);

      const daysRemaining = this.getDaysDifference(today.isoDate, nextBday.isoDate);

      // Only within (0, maxDays] — excludes today
      if (daysRemaining > 0 && daysRemaining <= maxDays) {
        const age = birthYear ? nextBday.year - birthYear : undefined;
        const photoUrl = emp.photo_path ? imageService.getPhotoDataUrl(emp.photo_path) : null;

        upcomingList.push({
          ...emp,
          age,
          daysRemaining,
          nextBirthdayDate: nextBday.isoDate,
          isToday: false,
          photoUrl
        });
      }
    }

    // Sort by days remaining (closest first), then name
    upcomingList.sort((a, b) => {
      if (a.daysRemaining !== b.daysRemaining) {
        return a.daysRemaining - b.daysRemaining;
      }
      return a.employee_name.localeCompare(b.employee_name);
    });

    return upcomingList;
  }

  public getDashboardStats(): DashboardStats {
    const db = DbManager.getInstance();
    const employees = db.getAllEmployees();
    const todayBirthdays = this.getTodaysBirthdays();
    const upcoming = this.getUpcomingBirthdays(30);

    let nextBirthday: DashboardStats['nextBirthday'] = null;
    if (upcoming.length > 0) {
      const nearest = upcoming[0];
      nextBirthday = {
        name: nearest.employee_name,
        date: nearest.nextBirthdayDate,
        daysRemaining: nearest.daysRemaining,
        photoUrl: nearest.photoUrl
      };
    }

    return {
      totalEmployees: employees.length,
      todayCount: todayBirthdays.length,
      upcomingCount: upcoming.length,
      nextBirthday
    };
  }

  private calculateNextBirthday(
    currentYear: number,
    birthMonth: number,
    birthDay: number,
    feb29Policy: 'feb28' | 'mar1'
  ): { year: number; month: number; day: number; isoDate: string } {
    let year = currentYear;
    let month = birthMonth;
    let day = birthDay;

    // Handle Feb 29
    if (birthMonth === 2 && birthDay === 29) {
      if (!this.isLeapYear(year)) {
        if (feb29Policy === 'mar1') {
          month = 3;
          day = 1;
        } else {
          month = 2;
          day = 28;
        }
      }
    }

    let bdayDate = new Date(year, month - 1, day);
    const today = new Date(this.getTodayDate().isoDate);

    // If birthday has already passed this year, it falls in next year
    if (bdayDate < today) {
      year = currentYear + 1;
      month = birthMonth;
      day = birthDay;

      if (birthMonth === 2 && birthDay === 29) {
        if (!this.isLeapYear(year)) {
          if (feb29Policy === 'mar1') {
            month = 3;
            day = 1;
          } else {
            month = 2;
            day = 28;
          }
        }
      }
    }

    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, isoDate };
  }

  private getDaysDifference(fromIso: string, toIso: string): number {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    const diffTime = to.getTime() - from.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }
}

