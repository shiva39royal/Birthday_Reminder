import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DbManager } from './database/db-manager';
import { ImageService } from './services/image-service';
import { ExcelService } from './services/excel-service';
import { BirthdayService } from './services/birthday-service';
import { ReminderService } from './services/reminder-service';
import { StartupService } from './services/startup-service';
import { BackupService } from './services/backup-service';
import { CelebrationWindowManager } from './windows/celebration-window';
import { seedDemoEmployees } from './database/seed-data';
import { AppPaths } from './utils/paths';
import log from 'electron-log';

export function registerIpcHandlers(): void {
  const db = DbManager.getInstance();
  const imageService = ImageService.getInstance();
  const excelService = ExcelService.getInstance();
  const birthdayService = BirthdayService.getInstance();
  const reminderService = ReminderService.getInstance();
  const startupService = StartupService.getInstance();
  const backupService = BackupService.getInstance();

  // --- Employees ---
  ipcMain.handle('db:employees:getAll', async () => {
    return db.getAllEmployees();
  });

  ipcMain.handle('db:employees:getById', async (_event, id: string) => {
    return db.getEmployeeById(id);
  });

  ipcMain.handle('db:employees:create', async (_event, data: { employee_name: string; date_of_birth: string; photo_data_url?: string }) => {
    const id = uuidv4();
    let photoPath: string | null = null;
    if (data.photo_data_url) {
      photoPath = await imageService.saveEmployeePhoto(data.photo_data_url, id);
    }
    return db.createEmployee({
      id,
      employee_name: data.employee_name,
      date_of_birth: data.date_of_birth,
      photo_path: photoPath
    });
  });

  ipcMain.handle('db:employees:update', async (_event, id: string, data: { employee_name?: string; date_of_birth?: string; photo_data_url?: string }) => {
    let photoPath: string | null | undefined = undefined;
    if (data.photo_data_url !== undefined) {
      if (data.photo_data_url === null || data.photo_data_url === '') {
        photoPath = null;
      } else {
        photoPath = await imageService.saveEmployeePhoto(data.photo_data_url, id);
      }
    }
    return db.updateEmployee(id, {
      employee_name: data.employee_name,
      date_of_birth: data.date_of_birth,
      photo_path: photoPath
    });
  });

  ipcMain.handle('db:employees:delete', async (_event, id: string) => {
    return db.deleteEmployee(id);
  });

  ipcMain.handle('db:employees:search', async (_event, query: string) => {
    return db.searchEmployees(query);
  });

  ipcMain.handle('db:seedDemoEmployees', async () => {
    return seedDemoEmployees();
  });

  // --- Birthdays ---
  ipcMain.handle('birthday:today', async () => {
    return birthdayService.getTodaysBirthdays();
  });

  ipcMain.handle('birthday:upcoming', async (_event, days?: number) => {
    return birthdayService.getUpcomingBirthdays(days || 30);
  });

  ipcMain.handle('birthday:stats', async () => {
    return birthdayService.getDashboardStats();
  });

  ipcMain.handle('birthday:setSimulatedDate', async (_event, dateStr: string | null) => {
    birthdayService.setSimulatedDate(dateStr);
  });

  // --- Excel ---
  ipcMain.handle('excel:generateTemplate', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Birthday Buddy Excel Template',
      defaultPath: 'Team_Birthday_Template.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Cancelled by user' };
    }

    try {
      await excelService.generateTemplate(filePath);
      return { success: true, filePath };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to generate template' };
    }
  });

  ipcMain.handle('excel:parseFile', async (_event, filePath: string) => {
    return excelService.parseExcelFile(filePath);
  });

  ipcMain.handle('excel:commitImport', async (_event, previewRows) => {
    return excelService.commitImport(previewRows);
  });

  ipcMain.handle('excel:exportErrors', async (_event, errors) => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Import Error Report',
      defaultPath: 'Birthday_Import_Errors.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) {
      return '';
    }

    await excelService.generateErrorReport(errors, filePath);
    return filePath;
  });

  // --- Reminders ---
  ipcMain.handle('reminder:acknowledge', async () => {
    reminderService.acknowledgeTodayReminders();
    CelebrationWindowManager.markAcknowledged();
  });

  ipcMain.handle('reminder:history', async (_event, options) => {
    const history = db.getReminderHistory(options);
    return history.map(item => ({
      ...item,
      photoUrl: item.photo_path ? imageService.getPhotoDataUrl(item.photo_path) : null
    }));
  });

  ipcMain.handle('reminder:testCelebration', async () => {
    let birthdays = birthdayService.getTodaysBirthdays();
    if (birthdays.length === 0) {
      // Create mock preview for testing celebration screen
      birthdays = [
        {
          id: 'mock-1',
          employee_name: 'Rahul Sharma',
          date_of_birth: '1995-05-15',
          photo_path: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          age: 31,
          daysRemaining: 0,
          nextBirthdayDate: '2026-05-15',
          isToday: true,
          photoUrl: null
        },
        {
          id: 'mock-2',
          employee_name: 'Priya Patel',
          date_of_birth: '1998-11-02',
          photo_path: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          age: 28,
          daysRemaining: 0,
          nextBirthdayDate: '2026-11-02',
          isToday: true,
          photoUrl: null
        }
      ];
    }
    CelebrationWindowManager.create(birthdays);
  });

  // --- Settings ---
  ipcMain.handle('settings:get', async () => {
    return db.getSettings();
  });

  ipcMain.handle('settings:update', async (_event, updates) => {
    const updated = db.updateSettings(updates);
    if (updates.start_with_windows !== undefined) {
      if (updates.start_with_windows) {
        await startupService.enableStartup(updated.reminder_delay_minutes);
      } else {
        await startupService.disableStartup();
      }
    }
    return updated;
  });

  // --- Startup ---
  ipcMain.handle('startup:isEnabled', async () => {
    return startupService.isStartupEnabled();
  });

  ipcMain.handle('startup:enable', async (_event, delayMinutes?: number) => {
    return startupService.enableStartup(delayMinutes || 5);
  });

  ipcMain.handle('startup:disable', async () => {
    return startupService.disableStartup();
  });

  // --- Backup ---
  ipcMain.handle('backup:create', async () => {
    const today = new Date().toISOString().split('T')[0];
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Birthday Buddy Backup',
      defaultPath: `BirthdayBuddy_Backup_${today}.zip`,
      filters: [{ name: 'ZIP Archives', extensions: ['zip'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Cancelled by user' };
    }

    return backupService.createBackup(filePath);
  });

  ipcMain.handle('backup:restore', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Select Birthday Buddy Backup ZIP',
      filters: [{ name: 'ZIP Archives', extensions: ['zip'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, message: 'Cancelled by user' };
    }

    return backupService.restoreBackup(filePaths[0]);
  });

  ipcMain.handle('backup:exportEmployees', async () => {
    const today = new Date().toISOString().split('T')[0];
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Export Employees to Excel',
      defaultPath: `Employees_Export_${today}.xlsx`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) {
      return '';
    }

    return backupService.exportEmployeesToExcel(filePath);
  });

  // --- Dialogs ---
  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const res = await dialog.showOpenDialog({
      title: options?.title || 'Select File',
      filters: options?.filters || [],
      properties: ['openFile']
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle('dialog:saveFile', async (_event, options) => {
    const res = await dialog.showSaveDialog({
      title: options?.title || 'Save File',
      defaultPath: options?.defaultPath,
      filters: options?.filters || []
    });
    if (res.canceled || !res.filePath) return null;
    return res.filePath;
  });

  // --- Photos & App Info ---
  ipcMain.handle('photos:getUrl', async (_event, photoFilename: string | null) => {
    return imageService.getPhotoDataUrl(photoFilename);
  });

  ipcMain.handle('app:getInfo', async () => {
    return {
      version: app.getVersion() || '1.0.0',
      dbPath: AppPaths.getDbPath(),
      photosPath: AppPaths.getPhotosDir(),
      isPackaged: app.isPackaged,
      platform: process.platform
    };
  });

  // --- Celebration Window specific ---
  ipcMain.handle('celebration:getData', async () => {
    return {
      birthdays: CelebrationWindowManager.getPendingBirthdays(),
      settings: db.getSettings()
    };
  });

  ipcMain.handle('celebration:acknowledge', async () => {
    reminderService.acknowledgeTodayReminders();
    CelebrationWindowManager.markAcknowledged();
  });

  ipcMain.on('celebration:close', () => {
    const win = CelebrationWindowManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });
}
