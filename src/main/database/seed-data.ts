import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { app } from 'electron';
import { DbManager } from './db-manager';
import { ImageService } from '../services/image-service';
import { BirthdayService } from '../services/birthday-service';
import { AppPaths } from '../utils/paths';
import log from 'electron-log';

export interface DemoEmployeeDef {
  id: string;
  name: string;
  dob: string; // DD-MM
  dobDisplay: string; // DD-MM
  department: string;
  photoFileName: string;
}

export const DEMO_EMPLOYEES: DemoEmployeeDef[] = [
  {
    id: 'emp-john-doe',
    name: 'John Doe',
    dob: '03-11',
    dobDisplay: '03-11',
    department: 'Software Engineering',
    photoFileName: 'john-doe.jpg'
  },
  {
    id: 'emp-sarah-jenkins',
    name: 'Sarah Jenkins',
    dob: '03-11',
    dobDisplay: '03-11',
    department: 'Product Design',
    photoFileName: 'sarah-jenkins.jpg'
  },
  {
    id: 'emp-rahul-sharma',
    name: 'Rahul Sharma',
    dob: '06-11',
    dobDisplay: '06-11',
    department: 'Operations & Delivery',
    photoFileName: 'rahul-sharma.jpg'
  },
  {
    id: 'emp-emily-watson',
    name: 'Emily Watson',
    dob: '12-11',
    dobDisplay: '12-11',
    department: 'Human Resources',
    photoFileName: 'emily-watson.jpg'
  },
  {
    id: 'emp-michael-chang',
    name: 'Michael Chang',
    dob: '20-11',
    dobDisplay: '20-11',
    department: 'Financial Analysis',
    photoFileName: 'michael-chang.jpg'
  },
  {
    id: 'emp-priya-patel',
    name: 'Priya Patel',
    dob: '01-12',
    dobDisplay: '01-12',
    department: 'Marketing & Brand',
    photoFileName: 'priya-patel.jpg'
  }
];

function findDemoPhotoPath(fileName: string): string | null {
  const possiblePaths = [
    path.join(__dirname, '../../src/assets/demo-photos', fileName),
    path.join(app.getAppPath(), 'src/assets/demo-photos', fileName),
    path.join(process.cwd(), 'src/assets/demo-photos', fileName),
    path.join(__dirname, 'demo-photos', fileName)
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export async function generateDemoExcelFile(targetPath: string): Promise<string> {
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
    fgColor: { argb: 'FF1E1B4B' } // Deep Navy Indigo
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  for (let i = 0; i < DEMO_EMPLOYEES.length; i++) {
    const emp = DEMO_EMPLOYEES[i];
    const rowNum = i + 2;
    const row = ws.getRow(rowNum);
    row.height = 70;

    row.getCell(1).value = i + 1;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    row.getCell(2).value = emp.name;
    row.getCell(2).font = { bold: true, size: 11, name: 'Segoe UI' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    row.getCell(3).value = emp.dobDisplay;
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

    // Embed photo into worksheet cell if available
    const photoPath = findDemoPhotoPath(emp.photoFileName);
    if (photoPath && fs.existsSync(photoPath)) {
      try {
        const imageId = workbook.addImage({
          filename: photoPath,
          extension: 'jpeg'
        });
        ws.addImage(imageId, {
          tl: { col: 3.2, row: rowNum - 0.85 },
          ext: { width: 64, height: 64 },
          editAs: 'oneCell'
        });
      } catch (err) {
        log.warn('Could not embed photo in demo Excel row:', emp.name, err);
      }
    }

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
  const imageService = ImageService.getInstance();
  const photosDir = AppPaths.getPhotosDir();

  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }

  let count = 0;
  for (const emp of DEMO_EMPLOYEES) {
    try {
      const sourcePhotoPath = findDemoPhotoPath(emp.photoFileName);
      let savedPhotoFilename: string | null = null;

      if (sourcePhotoPath && fs.existsSync(sourcePhotoPath)) {
        const targetFilename = `${emp.id}.jpg`;
        const targetPath = path.join(photosDir, targetFilename);
        fs.copyFileSync(sourcePhotoPath, targetPath);
        savedPhotoFilename = targetFilename;
        log.info(`Copied portrait photo for ${emp.name} to ${targetPath}`);
      }

      // Check if employee already exists; if so, update. If not, create.
      const existing = db.getEmployeeById(emp.id);
      if (existing) {
        db.updateEmployee(emp.id, {
          employee_name: emp.name,
          date_of_birth: emp.dob,
          photo_path: savedPhotoFilename || existing.photo_path
        });
      } else {
        db.createEmployee({
          id: emp.id,
          employee_name: emp.name,
          date_of_birth: emp.dob,
          photo_path: savedPhotoFilename
        });
      }
      count++;
    } catch (err) {
      log.error(`Failed to seed employee ${emp.name}:`, err);
    }
  }

  // Generate Excel file in project root and userData directory
  try {
    const rootExcelPath = path.join(process.cwd(), 'Team_Birthdays.xlsx');
    await generateDemoExcelFile(rootExcelPath);

    const userExcelPath = path.join(AppPaths.getUserDataDir(), 'Team_Birthdays.xlsx');
    await generateDemoExcelFile(userExcelPath);
  } catch (err) {
    log.error('Failed to generate Team_Birthdays.xlsx demo file:', err);
  }

  // Reset today's reminder state so restarting or opening triggers the celebration cleanly!
  try {
    const today = BirthdayService.getInstance().getTodayDate().isoDate;
    db.resetDateDisplayed(today);
    db.resetDateDisplayed('2026-11-03');
    log.info(`Reset daily_reminder_state for ${today} and 2026-11-03 so celebration triggers.`);
  } catch (err) {
    log.warn('Could not reset daily_reminder_state:', err);
  }

  log.info(`Successfully seeded ${count} professional employee records with real portrait headshots!`);
  return count;
}
