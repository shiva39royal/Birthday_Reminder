import { contextBridge, ipcRenderer } from 'electron';
import { Employee, ApplicationSettings, BirthdayEmployee, DashboardStats, ImportPreviewRow, ImportSummary, ReminderHistoryRecord, BackupResult, AppInfo } from '../../shared/types';

const api = {
  // Employee DB
  getAllEmployees: (): Promise<Employee[]> => ipcRenderer.invoke('db:employees:getAll'),
  getEmployeeById: (id: string): Promise<Employee | null> => ipcRenderer.invoke('db:employees:getById', id),
  createEmployee: (data: { employee_name: string; date_of_birth: string; photo_data_url?: string }): Promise<Employee> =>
    ipcRenderer.invoke('db:employees:create', data),
  updateEmployee: (id: string, data: { employee_name?: string; date_of_birth?: string; photo_data_url?: string }): Promise<Employee | null> =>
    ipcRenderer.invoke('db:employees:update', id, data),
  deleteEmployee: (id: string): Promise<boolean> => ipcRenderer.invoke('db:employees:delete', id),
  searchEmployees: (query: string): Promise<Employee[]> => ipcRenderer.invoke('db:employees:search', query),
  seedDemoEmployees: (): Promise<number> => ipcRenderer.invoke('db:seedDemoEmployees'),
  resetAllData: (): Promise<boolean> => ipcRenderer.invoke('db:resetAllData'),

  // Birthdays
  getTodayBirthdays: (): Promise<BirthdayEmployee[]> => ipcRenderer.invoke('birthday:today'),
  getUpcomingBirthdays: (days?: number): Promise<BirthdayEmployee[]> => ipcRenderer.invoke('birthday:upcoming', days),
  getDashboardStats: (): Promise<DashboardStats> => ipcRenderer.invoke('birthday:stats'),
  setSimulatedDate: (dateStr: string | null): Promise<void> => ipcRenderer.invoke('birthday:setSimulatedDate', dateStr),

  // Excel
  generateTemplate: (): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('excel:generateTemplate'),
  parseExcelFile: (filePath: string): Promise<ImportPreviewRow[]> =>
    ipcRenderer.invoke('excel:parseFile', filePath),
  commitImport: (previewRows: ImportPreviewRow[]): Promise<ImportSummary> =>
    ipcRenderer.invoke('excel:commitImport', previewRows),
  exportErrors: (errors: { row: number; reason: string }[]): Promise<string> =>
    ipcRenderer.invoke('excel:exportErrors', errors),

  // Reminders
  acknowledgeToday: (): Promise<void> => ipcRenderer.invoke('reminder:acknowledge'),
  getReminderHistory: (options?: { date?: string; search?: string }): Promise<ReminderHistoryRecord[]> =>
    ipcRenderer.invoke('reminder:history', options),
  triggerCelebrationTest: (): Promise<void> => ipcRenderer.invoke('reminder:testCelebration'),

  // Settings
  getSettings: (): Promise<ApplicationSettings> => ipcRenderer.invoke('settings:get'),
  updateSettings: (updates: Partial<ApplicationSettings>): Promise<ApplicationSettings> =>
    ipcRenderer.invoke('settings:update', updates),

  // Startup
  isStartupEnabled: (): Promise<boolean> => ipcRenderer.invoke('startup:isEnabled'),
  enableStartup: (delayMinutes?: number): Promise<boolean> => ipcRenderer.invoke('startup:enable', delayMinutes),
  disableStartup: (): Promise<boolean> => ipcRenderer.invoke('startup:disable'),

  // Backup & Restore
  createBackup: (): Promise<BackupResult> => ipcRenderer.invoke('backup:create'),
  restoreBackup: (): Promise<BackupResult> => ipcRenderer.invoke('backup:restore'),
  exportEmployeesExcel: (): Promise<string> => ipcRenderer.invoke('backup:exportEmployees'),

  // System Dialogs
  openFileDialog: (options?: { title?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null> =>
    ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (options?: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null> =>
    ipcRenderer.invoke('dialog:saveFile', options),

  // App & Photo URL
  getPhotoDataUrl: (photoFilename: string | null): Promise<string | null> =>
    ipcRenderer.invoke('photos:getUrl', photoFilename),
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:getInfo'),
};

export type BirthdayBuddyAPI = typeof api;

contextBridge.exposeInMainWorld('birthdayBuddyAPI', api);

