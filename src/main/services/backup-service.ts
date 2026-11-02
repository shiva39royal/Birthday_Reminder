import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as ExcelJS from 'exceljs';
import { app } from 'electron';
import { AppPaths } from '../utils/paths';
import { DbManager } from '../database/db-manager';
import { BackupResult } from '../../shared/types';
import log from 'electron-log';

export class BackupService {
  private static instance: BackupService | null = null;

  private constructor() {}

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  public async createBackup(targetZipPath: string): Promise<BackupResult> {
    try {
      const db = DbManager.getInstance();
      db.saveToDisk(); // Ensure latest data written to disk

      const zip = new AdmZip();
      const dbPath = AppPaths.getDbPath();
      const photosDir = AppPaths.getPhotosDir();

      // Add database file
      if (fs.existsSync(dbPath)) {
        zip.addLocalFile(dbPath, '', 'birthday_buddy.db');
      }

      // Add photos directory
      if (fs.existsSync(photosDir)) {
        const photoFiles = fs.readdirSync(photosDir);
        for (const photo of photoFiles) {
          const fullPath = path.join(photosDir, photo);
          if (fs.statSync(fullPath).isFile()) {
            zip.addLocalFile(fullPath, 'photos', photo);
          }
        }
      }

      // Add manifest
      const manifest = {
        appName: 'Birthday Buddy',
        version: app.getVersion() || '1.0.0',
        backupDate: new Date().toISOString(),
        totalEmployees: db.getAllEmployees().length,
        settings: db.getSettings()
      };
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));

      zip.writeZip(targetZipPath);
      log.info('Created complete backup at:', targetZipPath);

      return {
        success: true,
        filePath: targetZipPath,
        message: 'Backup created successfully!'
      };
    } catch (err: any) {
      log.error('Backup creation failed:', err);
      return {
        success: false,
        message: `Backup failed: ${err?.message || err}`
      };
    }
  }

  public async restoreBackup(zipPath: string): Promise<BackupResult> {
    try {
      if (!fs.existsSync(zipPath)) {
        return { success: false, message: 'Backup file does not exist' };
      }

      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();

      // Validate database exists in zip
      const dbEntry = entries.find(e => e.entryName === 'birthday_buddy.db');
      if (!dbEntry) {
        return { success: false, message: 'Invalid backup: missing birthday_buddy.db' };
      }

      const dbData = dbEntry.getData();
      if (dbData.length < 100) {
        return { success: false, message: 'Corrupted database file in backup' };
      }

      // Extract photos
      const photosDir = AppPaths.getPhotosDir();
      const photoEntries = entries.filter(e => e.entryName.startsWith('photos/') && !e.isDirectory);
      for (const p of photoEntries) {
        const filename = path.basename(p.entryName);
        if (filename) {
          fs.writeFileSync(path.join(photosDir, filename), p.getData());
        }
      }

      // Restore database
      const db = DbManager.getInstance();
      await db.restoreDatabaseFromBuffer(dbData);

      log.info('Backup restored successfully from:', zipPath);
      return {
        success: true,
        message: 'Database and photos restored successfully!'
      };
    } catch (err: any) {
      log.error('Backup restoration failed:', err);
      return {
        success: false,
        message: `Restore failed: ${err?.message || err}`
      };
    }
  }

  public async exportEmployeesToExcel(savePath: string): Promise<string> {
    const db = DbManager.getInstance();
    const employees = db.getAllEmployees();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Birthday Buddy';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Employees Export');
    ws.columns = [
      { header: 'ID', key: 'id', width: 38 },
      { header: 'Employee Name', key: 'name', width: 30 },
      { header: 'Date of Birth (YYYY-MM-DD)', key: 'dob', width: 25 },
      { header: 'Has Photo', key: 'hasPhoto', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 25 }
    ];

    const hRow = ws.getRow(1);
    hRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4C1D95' } };

    employees.forEach(emp => {
      ws.addRow({
        id: emp.id,
        name: emp.employee_name,
        dob: emp.date_of_birth,
        hasPhoto: emp.photo_path ? 'Yes' : 'No',
        createdAt: emp.created_at
      });
    });

    await workbook.xlsx.writeFile(savePath);
    log.info('Exported employees to:', savePath);
    return savePath;
  }
}

