import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { DbManager } from './db-manager';
import { BirthdayService } from '../services/birthday-service';
import { AppPaths } from '../utils/paths';
import log from 'electron-log';

export interface DemoEmployeeDef {
  id: string;
  name: string;
  dob: string; // DD-MM
  dobDisplay: string; // DD-MM
  department?: string;
  photoFileName?: string;
}

// 21 team members from Team_Birthday_Template.xlsx
export const DEMO_EMPLOYEES: DemoEmployeeDef[] = [
  { id: 'emp-1', name: 'D. SHIVA KALYAN RAYAL', dob: '22-08', dobDisplay: '22-08' },
  { id: 'emp-2', name: 'M. JESHWANTH REDDY', dob: '09-12', dobDisplay: '09-12' },
  { id: 'emp-3', name: 'B. SAI ROHAN', dob: '08-02', dobDisplay: '08-02' },
  { id: 'emp-4', name: 'M. GNANASEKHAR', dob: '09-01', dobDisplay: '09-01' },
  { id: 'emp-5', name: 'B. BALA BHASKAR', dob: '17-10', dobDisplay: '17-10' },
  { id: 'emp-6', name: 'A. UMA DEVI', dob: '24-03', dobDisplay: '24-03' },
  { id: 'emp-7', name: 'M. RENUKA', dob: '11-11', dobDisplay: '11-11' },
  { id: 'emp-8', name: 'B. SRI LAKSHMI', dob: '04-04', dobDisplay: '04-04' },
  { id: 'emp-9', name: 'S. SRI RAM', dob: '28-01', dobDisplay: '28-01' },
  { id: 'emp-10', name: 'G. PAWAN KALYAN', dob: '24-10', dobDisplay: '24-10' },
  { id: 'emp-11', name: 'G. SRINEYYA', dob: '14-07', dobDisplay: '14-07' },
  { id: 'emp-12', name: 'P. RAMA DEVI', dob: '15-06', dobDisplay: '15-06' },
  { id: 'emp-13', name: 'K. VARDHAN', dob: '10-12', dobDisplay: '10-12' },
  { id: 'emp-14', name: 'R. PRASAD', dob: '16-08', dobDisplay: '16-08' },
  { id: 'emp-15', name: 'B. DILEEP KUMAR', dob: '11-08', dobDisplay: '11-08' },
  { id: 'emp-16', name: 'D. BHAVANI', dob: '11-08', dobDisplay: '11-08' },
  { id: 'emp-17', name: 'V. ASHVITHA', dob: '19-03', dobDisplay: '19-03' },
  { id: 'emp-18', name: 'S. SWATHI', dob: '20-02', dobDisplay: '20-02' },
  { id: 'emp-19', name: 'B. HEMALATHA', dob: '14-06', dobDisplay: '14-06' },
  { id: 'emp-20', name: 'R. JAGANNATH', dob: '30-04', dobDisplay: '30-04' },
  { id: 'emp-21', name: 'B. KUMAR', dob: '20-08', dobDisplay: '20-08' }
];

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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Birthday Buddy';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Employee Birthday Details', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  ws.columns = [
    { header: 'Sl.No', key: 'slNo', width: 10 },
    { header: 'Employee Name', key: 'name', width: 32 },
    { header: 'Date of Birth (DD-MM)', key: 'dob', width: 28 },
    { header: 'Employee Photo (Insert > Pictures)', key: 'photo', width: 36 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.height = 34;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E1B4B' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  for (let i = 0; i < DEMO_EMPLOYEES.length; i++) {
    const emp = DEMO_EMPLOYEES[i];
    const rowNum = i + 2;
    const row = ws.getRow(rowNum);
    row.height = 50;

    row.getCell(1).value = i + 1;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    row.getCell(2).value = emp.name;
    row.getCell(2).font = { bold: true, size: 11, name: 'Segoe UI' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    row.getCell(3).value = emp.dobDisplay;
    row.getCell(3).numFmt = '@';
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

    row.getCell(4).value = 'Insert Photo Here';
    row.getCell(4).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 9, name: 'Segoe UI' };

    const isEven = i % 2 === 0;
    const bgColor = isEven ? 'FFF8FAFC' : 'FFFFFFFF';
    for (let c = 1; c <= 4; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }
  }

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await workbook.xlsx.writeFile(targetPath);
  log.info('Generated demo Excel file at:', targetPath);
  return targetPath;
}

export async function seedDemoEmployees(): Promise<number> {
  const db = DbManager.getInstance();
  const templatePath = findTemplatePath();

  let count = 0;

  // 1. Try parsing directly from Team_Birthday_Template.xlsx
  if (templatePath && fs.existsSync(templatePath)) {
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
            const dob = String(dobVal).trim();
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
    } catch (err) {
      log.warn('Could not parse Team_Birthday_Template.xlsx directly:', err);
    }
  }

  // 2. Fallback to DEMO_EMPLOYEES (which also matches Team_Birthday_Template.xlsx)
  if (count === 0) {
    for (const emp of DEMO_EMPLOYEES) {
      const existing = db.getEmployeeById(emp.id);
      if (existing) {
        db.updateEmployee(emp.id, {
          employee_name: emp.name,
          date_of_birth: emp.dob,
          photo_path: existing.photo_path
        });
      } else {
        db.createEmployee({
          id: emp.id,
          employee_name: emp.name,
          date_of_birth: emp.dob,
          photo_path: null
        });
      }
      count++;
    }
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

  // Reset today's reminder state so restarting or opening triggers the celebration cleanly
  try {
    const today = BirthdayService.getInstance().getTodayDate().isoDate;
    db.resetDateDisplayed(today);
  } catch (err) {
    log.warn('Could not reset daily_reminder_state:', err);
  }

  log.info(`Successfully seeded ${count} employee records from Team_Birthday_Template.xlsx!`);
  return count;
}
