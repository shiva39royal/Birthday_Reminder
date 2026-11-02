# 🎂 Birthday Buddy — Team Birthday Reminder

> **Never Miss a Birthday!**  
> Complete, production-quality Windows desktop application for tracking employee birthdays and automatically celebrating them with daily notifications.

---

## ✨ Features

- 📊 **Executive Dashboard**: Real-time stats on total employees, today's birthdays, upcoming 30-day birthdays, and single next upcoming birthday.
- 📥 **Excel Template Generation**: One-click download of `Team_Birthday_Template.xlsx` featuring dynamic serial number formulas (`=IF(B3<>""; A2+1; "")`), formatted headers, DD-MM-YYYY date formats, and instructions.
- 📸 **Embedded Photograph Extraction**: Seamlessly extracts employee profile photos placed into Excel rows via `Insert > Pictures`.
- 🔍 **Strict Data Validation & Duplicate Prevention**: Validates dates of birth, rejects future dates, detects duplicate records, and provides interactive conflict resolution (Skip, Update, or Add).
- 🎈 **Festive Celebration Window**: Dedicated celebration window with animated confetti bursts, floating balloons, large employee portraits, and customizable birthday greetings.
- ⏰ **Windows Startup Integration**: Automatic login check with configurable delay (default 5 minutes). Runs silently in background if no birthdays exist, or displays celebration alert when team members celebrate today.
- 🛡️ **Duplicate Alert Suppression**: Automatically remembers when today's alert was acknowledged so you are never disturbed twice in the same day.
- 🔒 **100% Private & Offline**: Zero cloud tracking, zero external databases. All data is kept locally in SQLite in Windows user AppData.
- 💾 **Full ZIP Backup & Restore**: One-click complete archive containing the database and employee photos for disaster recovery or machine migration.
- 📅 **Leap Year Handling**: Configurable policy for February 29 birthdays during non-leap years (celebrate on Feb 28 or Mar 1).
- 🧪 **Developer / QA Date Simulator**: Simulate any calendar date directly from settings to preview alerts without changing Windows system time.

---

## 🚀 Installation & Downloads

The installer and portable builds are generated in `dist/`:

1. **Windows Installer (`Birthday Buddy Setup 1.0.0.exe`)**:
   - Double-click to run the NSIS installer.
   - Installs without requiring Administrator privileges.
   - Creates Desktop and Start Menu shortcuts.
   - Automatically initializes the local SQLite database and photo directory in `%APPDATA%\BirthdayBuddy`.

2. **Portable Executable (`Birthday Buddy 1.0.0.exe`)**:
   - No installation required; run directly from any folder or USB drive.

---

## 📖 User Guide

### 1. Excel Template Download & Editing
1. Navigate to **Excel Import / Export** from the sidebar.
2. Click **Download Excel Template** and choose where to save `Team_Birthday_Template.xlsx`.
3. Open the workbook in Microsoft Excel or compatible spreadsheet software.
4. Enter employee names in **Column B** and dates of birth in **Column C** (`DD-MM-YYYY`). Serial numbers in Column A will populate automatically.
5. To attach an employee photo, click the corresponding cell in **Column D**, go to **Insert > Pictures**, and place the picture into the cell.
6. Save the `.xlsx` file.

### 2. Uploading & Importing
1. On the **Excel Import / Export** page, click **Browse & Upload Excel** or drag and drop your `.xlsx` file.
2. Review the **Verification Preview**:
   - Valid records show a green checkmark.
   - Duplicate records are flagged with options to **Skip**, **Update Existing**, or **Add as Duplicate**.
   - Any validation errors (e.g. invalid date format or future date) are highlighted in red.
3. Click **Import Records** to commit to the local SQLite database.

### 3. Adding Employees Manually
1. Navigate to **Employee Birthdays**.
2. Click **Add Employee**.
3. Fill in the full name, select the date of birth, and optionally select a profile photo from your computer.
4. Click **Save Employee**.

### 4. Automatic Reminders & Windows Startup
1. Open **Settings**.
2. Toggle **Start Birthday Buddy with Windows** to **ON**.
3. Set your desired **Logon Reminder Delay** (default: 5 minutes).
4. On every Windows login, Birthday Buddy will launch silently, wait the configured delay, check for today's birthdays, and pop up the celebratory alert.
5. Click **"Okay, Thanks for the Reminder!"** to acknowledge and dismiss the alert for the rest of the day.

### 5. Backup & Disaster Recovery
1. Open **Settings** > **Data Management & Backups**.
2. Click **Create Full Backup (ZIP)** to export your entire database and photos into a timestamped `.zip` file.
3. To restore on another computer, click **Restore from ZIP...** and select your backup archive.

---

## 🛠️ Developer & Build Instructions

### Prerequisites
- Node.js 18+ (tested with v20 & v24)
- npm or pnpm

### Quick Start
```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Build application (Renderer + Main Process)
npm run build

# Package Windows NSIS Installer and Portable EXE
npm run dist
```

### Command Line Flags
- `--reminder`: Runs in silent background reminder mode (checks birthdays after delay and exits if none).
- `--test-date=YYYY-MM-DD`: Simulates any calendar date for testing birthday triggers without modifying the system clock.

---

## 📜 Technology Stack

- **Desktop Framework**: Electron 34
- **UI & Styling**: React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
- **Database**: SQLite (via WebAssembly `sql.js`, zero-native C++ build dependencies)
- **Excel Generation & Parsing**: ExcelJS (handles drawings, images, and formulas)
- **Image Processing**: Jimp (pure JS resizing, optimization, and photo pipeline)
- **Packaging**: electron-builder (NSIS installer + Portable)
- **Animations**: canvas-confetti & CSS floating balloon keyframes

---

## 📄 License
MIT License. Copyright © 2026 Birthday Buddy Team.

