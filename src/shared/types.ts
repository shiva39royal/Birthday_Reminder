export interface Employee {
  id: string;
  employee_name: string;
  date_of_birth: string; // YYYY-MM-DD
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface BirthdayEmployee extends Employee {
  age?: number;
  daysRemaining: number;
  nextBirthdayDate: string; // YYYY-MM-DD
  isToday: boolean;
  photoUrl?: string | null;
}

export interface DashboardStats {
  totalEmployees: number;
  todayCount: number;
  upcomingCount: number;
  nextBirthday: {
    name: string;
    date: string;
    daysRemaining: number;
    photoUrl?: string | null;
  } | null;
}

export interface ReminderHistoryRecord {
  id: string;
  reminder_date: string;
  employee_id: string;
  employee_name_snapshot: string;
  acknowledged_at: string | null;
  photo_path?: string | null;
  photoUrl?: string | null;
}

export interface ApplicationSettings {
  id?: number;
  start_with_windows: boolean;
  reminder_delay_minutes: number;
  show_birthday_animations: boolean;
  confetti_enabled: boolean;
  balloons_enabled: boolean;
  show_employee_photos: boolean;
  last_processed_date: string | null;
  notification_enabled: boolean;
  feb29_policy: 'feb28' | 'mar1';
  greeting_message: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  employeeName: string;
  dob: string;
  photoBase64: string | null;
  status: 'valid' | 'invalid' | 'warning';
  errors: string[];
  isDuplicate: boolean;
  duplicateResolution?: 'add' | 'skip' | 'update';
}

export interface ImportSummary {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export interface BackupResult {
  success: boolean;
  filePath?: string;
  message?: string;
}

export interface AppInfo {
  version: string;
  dbPath: string;
  photosPath: string;
  isPackaged: boolean;
  platform: string;
}

