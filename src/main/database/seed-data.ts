import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { DbManager } from './db-manager';
import { BirthdayService } from '../services/birthday-service';
import { AppPaths } from '../utils/paths';
import log from 'electron-log';

function findTemplatePath(): string | null {
  const candidatePaths = [
    path.join(process.cwd(), 'Team_Birthday_Template.xlsx'),
    path.join(__dirname, 'Team_Birthday_Template.xlsx'),
    path.join(__dirname, '../../Team_Birthday_Template.xlsx')
  ];

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require('electron');
    const electronApp = electron?.app || electron?.remote?.app;
    if (electronApp?.getAppPath) {
      candidatePaths.unshift(path.join(electronApp.getAppPath(), 'Team_Birthday_Template.xlsx'));
      candidatePaths.unshift(path.join(electronApp.getAppPath(), 'out/main', 'Team_Birthday_Template.xlsx'));
    }
  } catch {
    // Non-electron test environment
  }

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function normalizeDobValue(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    const d = val.getUTCHours() === 0 ? val.getUTCDate() : val.getDate();
    const m = val.getUTCHours() === 0 ? val.getUTCMonth() + 1 : val.getMonth() + 1;
    return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  const match = str.match(/^(\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    const d = Number(match[1]);
    const m = Number(match[2]);
    return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
  }
  return str;
}

export async function generateDemoExcelFile(targetPath: string): Promise<string> {
  const templatePath = findTemplatePath();
  if (templatePath && fs.existsSync(templatePath)) {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(templatePath, targetPath);
    log.info(`Copied Team_Birthday_Template.xlsx to ${targetPath}`);
    return targetPath;
  }
  throw new Error('Team_Birthday_Template.xlsx not found to generate demo file');
}

export async function seedDemoEmployees(): Promise<number> {
  const db = DbManager.getInstance();
  const templatePath = findTemplatePath();

  if (!templatePath || !fs.existsSync(templatePath)) {
    log.warn('Team_Birthday_Template.xlsx not found for seeding.');
    return 0;
  }

  let count = 0;
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.getWorksheet('Employee Birthday Details') || wb.worksheets[0];
    if (ws) {
      for (let rNum = 2; rNum <= ws.rowCount; rNum++) {
        const row = ws.getRow(rNum);
        const nameVal = row.getCell(2).value;
        const dobVal = row.getCell(3).value;

        if (nameVal && dobVal) {
          const name = String(nameVal).trim();
          const dob = normalizeDobValue(dobVal);

          if (name && dob) {
            const id = `emp-template-${rNum - 1}`;
            const existing = db.getEmployeeById(id);
            if (existing) {
              db.updateEmployee(id, {
                employee_name: name,
                date_of_birth: dob,
                photo_path: existing.photo_path
              });
            } else {
              db.createEmployee({
                id,
                employee_name: name,
                date_of_birth: dob,
                photo_path: null
              });
            }
            count++;
          }
        }
      }
    }
  } catch (err) {
    log.error('Failed to seed employees from Team_Birthday_Template.xlsx:', err);
    return 0;
  }

  // Copy template file to user data & project root
  try {
    const rootExcelPath = path.join(process.cwd(), 'Team_Birthdays.xlsx');
    const userExcelPath = path.join(AppPaths.getUserDataDir(), 'Team_Birthdays.xlsx');
    await generateDemoExcelFile(rootExcelPath);
    await generateDemoExcelFile(userExcelPath);
  } catch (err) {
    log.error('Failed to copy demo Excel file:', err);
  }

  // Reset today's reminder state so restarting or opening triggers celebration cleanly
  try {
    const today = BirthdayService.getInstance().getTodayDate().isoDate;
    db.resetDateDisplayed(today);
  } catch (err) {
    log.warn('Could not reset daily_reminder_state:', err);
  }

  log.info(`Successfully loaded and seeded ${count} employee records dynamically from Team_Birthday_Template.xlsx!`);
  return count;
}
