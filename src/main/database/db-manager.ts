import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { AppPaths } from '../utils/paths';
import { Employee, ApplicationSettings, ReminderHistoryRecord, DashboardStats } from '../../shared/types';
import log from 'electron-log';

export class DbManager {
  private static instance: DbManager | null = null;
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private isDirty = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): DbManager {
    if (!DbManager.instance) {
      DbManager.instance = new DbManager();
    }
    return DbManager.instance;
  }

  public async initialize(): Promise<void> {
    AppPaths.initialize();
    try {
      this.SQL = await initSqlJs({
        locateFile: file => {
          // 1. Check next to current bundled index.js
          const localPath = path.join(__dirname, file);
          if (fs.existsSync(localPath)) return localPath;

          // 2. Check in app.asar.unpacked
          const unpackedPath = path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), file);
          if (fs.existsSync(unpackedPath)) return unpackedPath;

          // 3. Check in out/main
          const outPath = path.join(process.cwd(), 'out/main', file);
          if (fs.existsSync(outPath)) return outPath;

          // 3. Check in node_modules/sql.js/dist (for tests/dev)
          const nmPath = path.join(process.cwd(), 'node_modules/sql.js/dist', file);
          if (fs.existsSync(nmPath)) return nmPath;

          // 4. Check in app root / out/main (Electron runtime)
          if (typeof app !== 'undefined' && app?.getAppPath) {
            const appPath = path.join(app.getAppPath(), 'out/main', file);
            if (fs.existsSync(appPath)) return appPath;
          }

          // 5. Check in resourcesPath (for packaged apps)
          if (typeof process !== 'undefined' && process.resourcesPath) {
            const resPath = path.join(process.resourcesPath, file);
            if (fs.existsSync(resPath)) return resPath;
          }

          return file;
        }
      });
    } catch (wasmErr) {
      log.warn('Path resolution WASM load failed, fallback:', wasmErr);
      this.SQL = await initSqlJs();
    }
    const dbPath = AppPaths.getDbPath();

    if (fs.existsSync(dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(dbPath);
        this.db = new this.SQL.Database(fileBuffer);
        log.info('Opened existing SQLite database at:', dbPath);
      } catch (err) {
        log.error('Failed to load existing database, creating fresh one:', err);
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
      log.info('Created new SQLite database in memory');
    }

    this.runMigrations();
    this.saveToDisk();
  }

  private runMigrations(): void {
    if (!this.db) return;

    this.db.run('PRAGMA foreign_keys = ON;');

    // Schema initialization
    this.db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        employee_name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        photo_path TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_employees_name ON employees (employee_name);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_employees_dob ON employees (date_of_birth);`);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS reminder_history (
        id TEXT PRIMARY KEY,
        reminder_date TEXT NOT NULL,
        employee_id TEXT NOT NULL,
        employee_name_snapshot TEXT NOT NULL,
        acknowledged_at TEXT,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      );
    `);

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_reminder_date ON reminder_history (reminder_date);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_reminder_emp_id ON reminder_history (employee_id);`);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS daily_reminder_state (
        reminder_date TEXT PRIMARY KEY,
        is_displayed INTEGER NOT NULL DEFAULT 0,
        displayed_at TEXT,
        employee_count INTEGER NOT NULL DEFAULT 0
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS application_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        start_with_windows INTEGER NOT NULL DEFAULT 0,
        reminder_delay_minutes INTEGER NOT NULL DEFAULT 3,
        show_birthday_animations INTEGER NOT NULL DEFAULT 1,
        confetti_enabled INTEGER NOT NULL DEFAULT 1,
        balloons_enabled INTEGER NOT NULL DEFAULT 1,
        show_employee_photos INTEGER NOT NULL DEFAULT 1,
        last_processed_date TEXT,
        notification_enabled INTEGER NOT NULL DEFAULT 1,
        feb29_policy TEXT NOT NULL DEFAULT 'feb28',
        greeting_message TEXT NOT NULL DEFAULT 'May your day be filled with happiness, success and wonderful memories!'
      );
    `);

    this.db.run(`
      INSERT OR IGNORE INTO application_settings (
        id, start_with_windows, reminder_delay_minutes, show_birthday_animations,
        confetti_enabled, balloons_enabled, show_employee_photos, last_processed_date,
        notification_enabled, feb29_policy, greeting_message
      ) VALUES (
        1, 0, 3, 1, 1, 1, 1, NULL, 1, 'feb28', 'May your day be filled with happiness, success and wonderful memories!'
      );
    `);

    this.markDirty();
  }

  public markDirty(): void {
    this.isDirty = true;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToDisk();
    }, 500);
  }

  public saveToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const dbPath = AppPaths.getDbPath();
      const tempPath = dbPath + '.tmp';

      fs.writeFileSync(tempPath, buffer);
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
      fs.renameSync(tempPath, dbPath);
      this.isDirty = false;
      log.info('Database saved to disk successfully');
    } catch (err) {
      log.error('Failed to save database to disk:', err);
    }
  }

  // --- Employee CRUD ---

  public getAllEmployees(): Employee[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM employees ORDER BY employee_name ASC');
    const employees: Employee[] = [];
    while (stmt.step()) {
      employees.push(stmt.getAsObject() as unknown as Employee);
    }
    stmt.free();
    return employees;
  }

  public getEmployeeById(id: string): Employee | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM employees WHERE id = ?');
    stmt.bind([id]);
    let employee: Employee | null = null;
    if (stmt.step()) {
      employee = stmt.getAsObject() as unknown as Employee;
    }
    stmt.free();
    return employee;
  }

  public findEmployeesByNameAndDob(name: string, dob: string): Employee[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM employees WHERE LOWER(TRIM(employee_name)) = LOWER(TRIM(?)) AND date_of_birth = ?');
    stmt.bind([name, dob]);
    const matches: Employee[] = [];
    while (stmt.step()) {
      matches.push(stmt.getAsObject() as unknown as Employee);
    }
    stmt.free();
    return matches;
  }

  public createEmployee(emp: { id: string; employee_name: string; date_of_birth: string; photo_path?: string | null }): Employee {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO employees (id, employee_name, date_of_birth, photo_path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [emp.id, emp.employee_name.trim(), emp.date_of_birth, emp.photo_path || null, now, now]
    );
    this.markDirty();
    return this.getEmployeeById(emp.id)!;
  }

  public updateEmployee(id: string, updates: { employee_name?: string; date_of_birth?: string; photo_path?: string | null }): Employee | null {
    if (!this.db) throw new Error('Database not initialized');
    const current = this.getEmployeeById(id);
    if (!current) return null;

    const name = updates.employee_name !== undefined ? updates.employee_name.trim() : current.employee_name;
    const dob = updates.date_of_birth !== undefined ? updates.date_of_birth : current.date_of_birth;
    const photo = updates.photo_path !== undefined ? updates.photo_path : current.photo_path;
    const now = new Date().toISOString();

    this.db.run(
      `UPDATE employees SET employee_name = ?, date_of_birth = ?, photo_path = ?, updated_at = ? WHERE id = ?`,
      [name, dob, photo, now, id]
    );
    this.markDirty();
    return this.getEmployeeById(id);
  }

  public deleteEmployee(id: string): boolean {
    if (!this.db) return false;
    const emp = this.getEmployeeById(id);
    if (!emp) return false;

    // Delete photo if exists
    if (emp.photo_path) {
      const fullPath = path.isAbsolute(emp.photo_path)
        ? emp.photo_path
        : path.join(AppPaths.getPhotosDir(), emp.photo_path);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          log.warn('Could not delete photo file:', fullPath, err);
        }
      }
    }

    this.db.run('DELETE FROM employees WHERE id = ?', [id]);
    this.markDirty();
    return true;
  }

  public searchEmployees(query: string): Employee[] {
    if (!this.db) return [];
    const q = `%${query.trim().toLowerCase()}%`;
    const stmt = this.db.prepare('SELECT * FROM employees WHERE LOWER(employee_name) LIKE ? ORDER BY employee_name ASC');
    stmt.bind([q]);
    const results: Employee[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as Employee);
    }
    stmt.free();
    return results;
  }

  // --- Settings CRUD ---

  public getSettings(): ApplicationSettings {
    if (!this.db) {
      return {
        start_with_windows: false,
        reminder_delay_minutes: 5,
        show_birthday_animations: true,
        confetti_enabled: true,
        balloons_enabled: true,
        show_employee_photos: true,
        last_processed_date: null,
        notification_enabled: true,
        feb29_policy: 'feb28',
        greeting_message: 'May your day be filled with happiness, success and wonderful memories!'
      };
    }

    const stmt = this.db.prepare('SELECT * FROM application_settings WHERE id = 1');
    let res: ApplicationSettings;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      res = {
        id: row.id,
        start_with_windows: Boolean(row.start_with_windows),
        reminder_delay_minutes: Number(row.reminder_delay_minutes) || 5,
        show_birthday_animations: Boolean(row.show_birthday_animations),
        confetti_enabled: Boolean(row.confetti_enabled),
        balloons_enabled: Boolean(row.balloons_enabled),
        show_employee_photos: Boolean(row.show_employee_photos),
        last_processed_date: row.last_processed_date || null,
        notification_enabled: Boolean(row.notification_enabled),
        feb29_policy: (row.feb29_policy === 'mar1' ? 'mar1' : 'feb28'),
        greeting_message: row.greeting_message || 'May your day be filled with happiness, success and wonderful memories!'
      };
    } else {
      res = {
        start_with_windows: false,
        reminder_delay_minutes: 5,
        show_birthday_animations: true,
        confetti_enabled: true,
        balloons_enabled: true,
        show_employee_photos: true,
        last_processed_date: null,
        notification_enabled: true,
        feb29_policy: 'feb28',
        greeting_message: 'May your day be filled with happiness, success and wonderful memories!'
      };
    }
    stmt.free();
    return res;
  }

  public updateSettings(updates: Partial<ApplicationSettings>): ApplicationSettings {
    if (!this.db) throw new Error('Database not initialized');
    const current = this.getSettings();
    const updated = { ...current, ...updates };

    this.db.run(
      `UPDATE application_settings SET
        start_with_windows = ?,
        reminder_delay_minutes = ?,
        show_birthday_animations = ?,
        confetti_enabled = ?,
        balloons_enabled = ?,
        show_employee_photos = ?,
        last_processed_date = ?,
        notification_enabled = ?,
        feb29_policy = ?,
        greeting_message = ?
       WHERE id = 1`,
      [
        updated.start_with_windows ? 1 : 0,
        updated.reminder_delay_minutes,
        updated.show_birthday_animations ? 1 : 0,
        updated.confetti_enabled ? 1 : 0,
        updated.balloons_enabled ? 1 : 0,
        updated.show_employee_photos ? 1 : 0,
        updated.last_processed_date,
        updated.notification_enabled ? 1 : 0,
        updated.feb29_policy,
        updated.greeting_message
      ]
    );
    this.markDirty();
    return this.getSettings();
  }

  // --- Reminder History CRUD ---

  public logReminder(record: { id: string; reminder_date: string; employee_id: string; employee_name_snapshot: string; acknowledged_at?: string | null }): void {
    if (!this.db) return;
    this.db.run(
      `INSERT INTO reminder_history (id, reminder_date, employee_id, employee_name_snapshot, acknowledged_at)
       VALUES (?, ?, ?, ?, ?)`,
      [record.id, record.reminder_date, record.employee_id, record.employee_name_snapshot, record.acknowledged_at || null]
    );
    this.markDirty();
  }

  public isDateDisplayed(date: string): boolean {
    if (!this.db) return false;
    const stmt = this.db.prepare('SELECT is_displayed FROM daily_reminder_state WHERE reminder_date = ?');
    stmt.bind([date]);
    let displayed = false;
    if (stmt.step()) {
      const row = stmt.getAsObject() as unknown as { is_displayed: number };
      displayed = row.is_displayed === 1;
    }
    stmt.free();
    return displayed;
  }

  public markDateDisplayed(date: string, employeeCount: number = 0): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO daily_reminder_state (reminder_date, is_displayed, displayed_at, employee_count)
       VALUES (?, 1, ?, ?)
       ON CONFLICT(reminder_date) DO UPDATE SET is_displayed = 1, displayed_at = ?, employee_count = ?`,
      [date, now, employeeCount, now, employeeCount]
    );
    this.updateSettings({ last_processed_date: date });
    this.markDirty();
    this.saveToDisk();
  }

  public resetDateDisplayed(date: string): void {
    if (!this.db) return;
    this.db.run(`DELETE FROM daily_reminder_state WHERE reminder_date = ?`, [date]);
    const settings = this.getSettings();
    if (settings.last_processed_date === date) {
      this.updateSettings({ last_processed_date: null });
    }
    this.markDirty();
    this.saveToDisk();
  }

  public markRemindersAcknowledged(date: string, employeeCount: number = 0): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      `UPDATE reminder_history SET acknowledged_at = ? WHERE reminder_date = ? AND acknowledged_at IS NULL`,
      [now, date]
    );
    this.markDateDisplayed(date, employeeCount);
  }

  public getReminderHistory(options?: { date?: string; search?: string }): ReminderHistoryRecord[] {
    if (!this.db) return [];
    let query = `
      SELECT r.id, r.reminder_date, r.employee_id, r.employee_name_snapshot, r.acknowledged_at, e.photo_path
      FROM reminder_history r
      LEFT JOIN employees e ON r.employee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.date) {
      query += ` AND r.reminder_date = ?`;
      params.push(options.date);
    }
    if (options?.search) {
      query += ` AND LOWER(r.employee_name_snapshot) LIKE ?`;
      params.push(`%${options.search.toLowerCase()}%`);
    }

    query += ` ORDER BY r.reminder_date DESC, r.acknowledged_at DESC`;

    const stmt = this.db.prepare(query);
    if (params.length > 0) {
      stmt.bind(params);
    }

    const records: ReminderHistoryRecord[] = [];
    while (stmt.step()) {
      records.push(stmt.getAsObject() as unknown as ReminderHistoryRecord);
    }
    stmt.free();
    return records;
  }

  public getDatabaseRaw(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  public async restoreDatabaseFromBuffer(buffer: Buffer): Promise<void> {
    if (!this.SQL) return;
    this.db = new this.SQL.Database(buffer);
    this.runMigrations();
    this.saveToDisk();
  }
}
