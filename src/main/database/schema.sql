-- Birthday Buddy Database Schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employee_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    photo_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_employees_name ON employees (employee_name);
CREATE INDEX IF NOT EXISTS idx_employees_dob ON employees (date_of_birth);

CREATE TABLE IF NOT EXISTS reminder_history (
    id TEXT PRIMARY KEY,
    reminder_date TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name_snapshot TEXT NOT NULL,
    acknowledged_at TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_date ON reminder_history (reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminder_emp_id ON reminder_history (employee_id);

CREATE TABLE IF NOT EXISTS daily_reminder_state (
    reminder_date TEXT PRIMARY KEY,
    is_displayed INTEGER NOT NULL DEFAULT 0,
    displayed_at TEXT,
    employee_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS application_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    start_with_windows INTEGER NOT NULL DEFAULT 1,
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

INSERT OR IGNORE INTO application_settings (
    id, start_with_windows, reminder_delay_minutes, show_birthday_animations,
    confetti_enabled, balloons_enabled, show_employee_photos, last_processed_date,
    notification_enabled, feb29_policy, greeting_message
) VALUES (
    1, 1, 3, 1, 1, 1, 1, NULL, 1, 'feb28', 'May your day be filled with happiness, success and wonderful memories!'
);
