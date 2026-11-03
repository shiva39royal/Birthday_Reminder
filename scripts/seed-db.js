const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const initSqlJs = require('sql.js');

const DEMO_EMPLOYEES = [
  {
    id: 'emp-john-doe',
    name: 'John Doe',
    dob: '1992-11-03',
    dobDisplay: '03-11-1992',
    department: 'Software Engineering',
    photo: 'john-doe.jpg'
  },
  {
    id: 'emp-sarah-jenkins',
    name: 'Sarah Jenkins',
    dob: '1996-11-03',
    dobDisplay: '03-11-1996',
    department: 'Product Design',
    photo: 'sarah-jenkins.jpg'
  },
  {
    id: 'emp-rahul-sharma',
    name: 'Rahul Sharma',
    dob: '1990-11-06',
    dobDisplay: '06-11-1990',
    department: 'Operations & Delivery',
    photo: 'rahul-sharma.jpg'
  },
  {
    id: 'emp-emily-watson',
    name: 'Emily Watson',
    dob: '1995-11-12',
    dobDisplay: '12-11-1995',
    department: 'Human Resources',
    photo: 'emily-watson.jpg'
  },
  {
    id: 'emp-michael-chang',
    name: 'Michael Chang',
    dob: '1988-11-20',
    dobDisplay: '20-11-1988',
    department: 'Financial Analysis',
    photo: 'michael-chang.jpg'
  },
  {
    id: 'emp-priya-patel',
    name: 'Priya Patel',
    dob: '1994-12-01',
    dobDisplay: '01-12-1994',
    department: 'Marketing & Brand',
    photo: 'priya-patel.jpg'
  }
];

async function run() {
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
  const userData = path.join(appData, 'birthday-buddy');
  console.log('App UserData path:', userData);

  if (!fs.existsSync(userData)) {
    fs.mkdirSync(userData, { recursive: true });
  }

  const photosDir = path.join(userData, 'photos');
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }

  const dbPath = path.join(userData, 'birthday_buddy.db');
  console.log('Database path:', dbPath);

  // 1. Copy photos
  const srcPhotosDir = path.join(__dirname, '../src/assets/demo-photos');
  for (const emp of DEMO_EMPLOYEES) {
    const src = path.join(srcPhotosDir, emp.photo);
    const dest = path.join(photosDir, `${emp.id}.jpg`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${emp.photo} -> ${dest}`);
    } else {
      console.warn(`Source photo not found: ${src}`);
    }
  }

  // 2. Open / initialize SQLite DB
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      employee_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      photo_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      start_with_windows INTEGER NOT NULL DEFAULT 1,
      reminder_delay_minutes INTEGER NOT NULL DEFAULT 3,
      show_birthday_animations INTEGER NOT NULL DEFAULT 1,
      confetti_enabled INTEGER NOT NULL DEFAULT 1,
      balloons_enabled INTEGER NOT NULL DEFAULT 1,
      greeting_message TEXT NOT NULL DEFAULT 'May your day be filled with happiness, success and wonderful memories!',
      feb29_policy TEXT NOT NULL DEFAULT 'feb28',
      startup_notification_type TEXT NOT NULL DEFAULT 'full_screen'
    );
    CREATE TABLE IF NOT EXISTS daily_reminder_state (
      reminder_date TEXT PRIMARY KEY,
      is_displayed INTEGER NOT NULL DEFAULT 0,
      acknowledged_at TEXT,
      employee_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reminder_history (
      id TEXT PRIMARY KEY,
      reminder_date TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      employee_name_snapshot TEXT NOT NULL,
      acknowledged_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Insert or update the 6 demo employees
  const now = new Date().toISOString();
  for (const emp of DEMO_EMPLOYEES) {
    const photoFilename = `${emp.id}.jpg`;
    db.run(
      `INSERT INTO employees (id, employee_name, date_of_birth, photo_path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         employee_name = excluded.employee_name,
         date_of_birth = excluded.date_of_birth,
         photo_path = excluded.photo_path,
         updated_at = excluded.updated_at`,
      [emp.id, emp.name, emp.dob, photoFilename, now, now]
    );
    console.log(`Inserted / Updated ${emp.name} (DOB: ${emp.dob})`);
  }

  // Reset reminder state for 2026-11-03 so it triggers immediately on next boot/launch!
  db.run(`DELETE FROM daily_reminder_state WHERE reminder_date = '2026-11-03'`);
  console.log(`Reset daily_reminder_state for 2026-11-03.`);

  // Save DB
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log('Saved SQLite database to disk.');

  // 3. Generate Team_Birthdays.xlsx in project root and userData
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Birthday Buddy';
  const ws = workbook.addWorksheet('Employee Birthday Details', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  ws.columns = [
    { header: 'Sl.No', key: 'slNo', width: 10 },
    { header: 'Employee Name', key: 'name', width: 32 },
    { header: 'Date of Birth (DD-MM-YYYY)', key: 'dob', width: 28 },
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
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

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

    const src = path.join(srcPhotosDir, emp.photo);
    if (fs.existsSync(src)) {
      try {
        const imageId = workbook.addImage({
          filename: src,
          extension: 'jpeg'
        });
        ws.addImage(imageId, {
          tl: { col: 3.2, row: rowNum - 0.85 },
          ext: { width: 64, height: 64 },
          editAs: 'oneCell'
        });
      } catch (err) {
        console.warn('Error adding image to excel:', err);
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

  const rootExcel = path.join(process.cwd(), 'Team_Birthdays.xlsx');
  await workbook.xlsx.writeFile(rootExcel);
  console.log('Saved demo Excel at:', rootExcel);

  const userExcel = path.join(userData, 'Team_Birthdays.xlsx');
  await workbook.xlsx.writeFile(userExcel);
  console.log('Saved demo Excel at:', userExcel);

  console.log('Seeding completed successfully!');
}

run().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
