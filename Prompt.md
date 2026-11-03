# MASTER SPECIFICATION & DEVELOPMENT PROMPT
## TEAM BIRTHDAY REMINDER DESKTOP APPLICATION (`Birthday Buddy`)

---

### PROMPT INSTRUCTION FOR THE AI AGENT / LLM:
> Act as an Elite Principal Software Architect, Full-Stack Desktop Engineer, and UI/UX Designer.
> Build a complete, production-grade Windows desktop application named **"Birthday Buddy — Team Birthday Reminder"**.
> This must be a fully functional, installable Windows application (`.exe`) with zero placeholders, zero mock data, and zero broken flows. Every feature described in this specification must be fully implemented, tested, and packaged.

---

## 1. Project Overview & Business Purpose

**Birthday Buddy** is an enterprise-grade Windows desktop application that manages employee birthday information via a robust Excel workflow and automatically reminds team leaders, HR, and colleagues about birthdays every day upon system boot.

### Core Value Propositions:
1. **Zero-Friction Template Workflow**: Teams maintain birthdays in a standardized Excel spreadsheet (`Team_Birthday_Template.xlsx`) with embedded employee portrait headshots.
2. **Automatic Daily Boot Reminders**: On Windows logon, the application silently initializes in the background, waits a configurable delay (default: 3 minutes), checks today's birthdays, and pops up a celebratory celebration window if birthdays exist today.
3. **5-Minute Snooze & Reliable Acknowledgement**: If the user closes the celebration window with `✕` without acknowledging, the app snoozes for 5 minutes and re-triggers until the user explicitly clicks **"Ok, Thank You!"**. Once acknowledged, it records `is_displayed = 1` for today and stays silent until the following day.
4. **Clean Windows Integration**: Flawless background lifecycle with zero CPU/memory leaks, instant Windows shutdown handling without "A background app is running" popups, and automatic boot registration directly during installation.
5. **Completely Local & Private**: 100% offline local SQLite database and local image vault. Zero cloud dependencies, zero external tracking.

---

## 2. Production Technology Stack

| Layer | Technology | Rationale & Specifications |
| :--- | :--- | :--- |
| **Desktop Runtime** | **Electron 34+ (Node.js 22 LTS)** | High performance, native Windows API bindings (`powerMonitor`, `app.setLoginItemSettings`, single instance locks). |
| **Language** | **TypeScript 5.7+** | Strict type safety across Main, Preload, and Renderer processes. |
| **Frontend Framework**| **React 19 + Vite 6** | Modern reactive UI, blazing fast HMR, optimized production chunks. |
| **Styling & Icons** | **Tailwind CSS 3.4 + Lucide React** | Polished enterprise UI, custom gradients, frosted glass cards, modern icons. |
| **Celebration Effects**| **Canvas-Confetti + Framer Motion**| Tasteful executive champagne/golden particle shower, smooth transitions. |
| **Database Engine** | **SQLite via `sql.js` (WebAssembly)** | Zero native C++ compilation issues; durable binary export to `%APPDATA%\birthday-buddy\birthday_buddy.db`. |
| **Excel Engine** | **`exceljs` 4.4 + `adm-zip` 0.5** | Generates OpenXML `.xlsx` with valid formula syntax; multi-strategy headshot extractor supporting drawings and modern "Place in Cell" `xl/cellimages.xml`. |
| **Image Processing** | **`jimp` 1.6** | Pure JavaScript image processing: auto-resizes headshots to 600x600, converts to high-quality JPEG, avoids native build failures. |
| **Packaging & Setup** | **`electron-builder` 25 + NSIS** | Generates strictly **ONE** standalone setup installer (`Birthday Buddy Setup 1.0.0.exe`) with custom startup script. |
| **Testing Suite** | **Vitest 3** | Automated unit tests covering SQLite migrations, date logic, leap-year handling, snooze cycles, and Excel photo extraction. |

---

## 3. Application Architecture & File Structure

```
Birthday_reminder/
├── build/
│   └── installer.nsh                # Custom NSIS script: creates/removes shell:startup shortcut at install time
├── electron-builder.yml             # Single NSIS installer configuration (oneClick, no portable target)
├── package.json                     # Dependencies, scripts (dev:main, build, dist, test)
├── tsconfig.json                    # Base TypeScript compiler configuration
├── vite.config.ts                   # Vite bundler configuration with multiple HTML entry points
├── vitest.config.ts                 # Vitest automated test configuration
├── scripts/
│   └── build-main.js                # esbuild script: bundles main process, preloads, copies WASM and demo photos
├── src/
│   ├── assets/
│   │   ├── icons/birthday_buddy.ico # Windows multi-resolution icon (16, 32, 48, 256px)
│   │   └── demo-photos/             # 6 high-resolution professional demo portrait headshots
│   ├── main/
│   │   ├── index.ts                 # Main process entry: single-instance lock, boot delay, shutdown hooks, snooze
│   │   ├── ipc-handlers.ts          # IPC bridge handlers for CRUD, Excel, backups, celebration
│   │   ├── database/
│   │   │   ├── schema.sql           # SQLite DDL schema with default start_with_windows = 1
│   │   │   ├── db-manager.ts        # SQLite manager via sql.js with debounced disk persistence
│   │   │   └── seed-data.ts         # Pre-seeds 6 professional employees with real headshots & today's birthday
│   │   ├── services/
│   │   │   ├── birthday-service.ts  # Birthday detection, upcoming calculations, Feb 29 policy, date simulation
│   │   │   ├── reminder-service.ts  # Daily state tracker, celebration trigger, 5-minute snooze loop
│   │   │   ├── excel-service.ts     # Template generation & multi-strategy image extractor (drawings + cellimages)
│   │   │   ├── image-service.ts     # Jimp image validation, 600x600 resizing, local file vault, data URL generation
│   │   │   ├── backup-service.ts    # ZIP export and restore (database + photos directory)
│   │   │   └── startup-service.ts   # Windows shell:startup shortcut management (guarded against dev mode)
│   │   ├── utils/
│   │   │   └── paths.ts             # OS-safe paths (%APPDATA%\birthday-buddy\photos, logs, database)
│   │   └── windows/
│   │       ├── main-window.ts       # Main dashboard window (1280x820, autoHideMenuBar, menu=null)
│   │       └── celebration-window.ts# Frameless celebration popup (900x700, alwaysOnTop, menu=null)
│   ├── preload/
│   │   ├── index.ts                 # ContextBridge API for main dashboard
│   │   └── celebration-preload.ts   # ContextBridge API for celebration popup
│   ├── renderer/
│   │   ├── index.html               # Main dashboard HTML entry
│   │   ├── celebration.html         # Celebration popup HTML entry
│   │   └── src/
│   │       ├── App.tsx              # Main layout: fixed sidebar + active page router
│   │       ├── CelebrationApp.tsx   # Visual celebration banner: confetti, photo cards, "Ok, Thank You!"
│   │       ├── components/
│   │       │   └── Sidebar.tsx      # Sidebar navigation (Dashboard, Employees, Excel, History, Settings)
│   │       └── pages/
│   │           ├── Dashboard.tsx    # Summary metrics, today's stars, upcoming birthdays carousel
│   │           ├── EmployeeBirthdays.tsx # Employee directory table (Photo, Name, DOB, Actions), Add/Edit Modal
│   │           ├── ExcelImportExport.tsx # Template download, file upload, headshot preview table, conflict resolver
│   │           ├── ReminderHistory.tsx   # Historic celebration audit log with photos and timestamps
│   │           └── Settings.tsx     # Startup toggle, delay, backup/restore, Reset All Data, Load Demo Data
│   └── shared/
│       └── types.ts                 # Shared TypeScript interfaces (Employee, Settings, ImportPreviewRow, etc.)
└── tests/
    └── unit/
        ├── database.test.ts         # SQLite CRUD and settings persistence tests
        ├── birthday-service.test.ts # Birthday detection, date parsing, leap-year calculations
        ├── reminder-service.test.ts # Acknowledgement, snooze cycles, daily state verification
        └── excel-service.test.ts    # OpenXML template generation, multi-strategy headshot extraction
```

---

## 4. Database Architecture & Schema Specifications

The database must be persistent SQLite stored at `%APPDATA%\birthday-buddy\birthday_buddy.db`.

```sql
PRAGMA foreign_keys = ON;

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employee_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,          -- Format: YYYY-MM-DD
    photo_path TEXT,                      -- Filename in %APPDATA%/birthday-buddy/photos/<id>.jpg
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees (employee_name);
CREATE INDEX IF NOT EXISTS idx_employees_dob ON employees (date_of_birth);

-- 2. Daily Reminder State (Duplicate Prevention)
CREATE TABLE IF NOT EXISTS daily_reminder_state (
    reminder_date TEXT PRIMARY KEY,       -- Format: YYYY-MM-DD
    is_displayed INTEGER NOT NULL DEFAULT 0, -- 1 when acknowledged via "Ok, Thank You!"
    displayed_at TEXT,
    employee_count INTEGER NOT NULL DEFAULT 0
);

-- 3. Reminder Audit History
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

-- 4. Application Settings
CREATE TABLE IF NOT EXISTS application_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    start_with_windows INTEGER NOT NULL DEFAULT 1, -- MUST default to 1 (Enabled)
    reminder_delay_minutes INTEGER NOT NULL DEFAULT 3, -- Default 3-minute delay on boot
    show_birthday_animations INTEGER NOT NULL DEFAULT 1,
    confetti_enabled INTEGER NOT NULL DEFAULT 1,
    balloons_enabled INTEGER NOT NULL DEFAULT 1,
    show_employee_photos INTEGER NOT NULL DEFAULT 1,
    last_processed_date TEXT,
    notification_enabled INTEGER NOT NULL DEFAULT 1,
    feb29_policy TEXT NOT NULL DEFAULT 'feb28', -- 'feb28' or 'mar1' in non-leap years
    greeting_message TEXT NOT NULL DEFAULT 'May your day be filled with happiness, success and wonderful memories!'
);

-- Initial Settings Row
INSERT OR IGNORE INTO application_settings (
    id, start_with_windows, reminder_delay_minutes, show_birthday_animations,
    confetti_enabled, balloons_enabled, show_employee_photos, last_processed_date,
    notification_enabled, feb29_policy, greeting_message
) VALUES (
    1, 1, 3, 1, 1, 1, 1, NULL, 1, 'feb28', 'May your day be filled with happiness, success and wonderful memories!'
);
```

---

## 5. Excel Template & Multi-Strategy Image Extraction Engine

### 5.1 Template Generation (`Team_Birthday_Template.xlsx`)
1. **Worksheet 1**: `Employee Birthday Details`
   - **Column A**: `Sl.No` (Width: 10, Centered)
   - **Column B**: `Employee Name` (Width: 32, Left-aligned)
   - **Column C**: `Date of Birth (DD-MM-YYYY)` (Width: 28, Centered, Number Format: `DD-MM-YYYY`)
   - **Column D**: `Employee Photo (Insert > Pictures)` (Width: 36, Row Height: 50)
2. **Serial Number & Formula Safety**:
   - To guarantee zero repair warnings (`Removed Records: Formula from /xl/worksheets/sheet1.xml part`) across all Microsoft Excel versions, pre-number `Sl.No` (Rows 2 to 101) with clean integer values:
     ```ts
     row.getCell(1).value = i - 1; // 1 to 100
     ```
   - Never inject dynamic relative formulas across unpopulated rows in templates, as Excel calculation engines flag empty string concatenation errors or OpenXML formula discrepancies. Clean sequential integers open instantly with 0 alerts.
3. **Worksheet 2**: `Instructions`
   - Detailed visual guide explaining how to enter names, dates (`DD-MM-YYYY`), and insert photos using either **"Place in Cell"** or **"Place over Cells"**.

### 5.2 Multi-Strategy Image Extractor
To guarantee that employee photographs are never missed regardless of Excel version:
1. **Strategy 1 (ExcelJS Parser)**:
   - Call `worksheet.getImages()`.
   - Handle range strings (e.g. `"D2"`, `"D2:D2"`).
   - If anchors are present, compute the vertical center: `Math.round((tlRow + brRow) / 2)` to eliminate manual positioning alignment errors.
2. **Strategy 2 (Direct ZIP Drawings Parser via `AdmZip`)**:
   - Inspect `.xlsx` archive directly.
   - Read `xl/drawings/drawing1.xml` and relationships from `xl/drawings/_rels/drawing1.xml.rels`.
   - Extract `<xdr:from><xdr:row>N</xdr:row>` and `<a:blip r:embed="rIdX"/>`.
   - Map `rIdX` to `xl/media/imageX.ext` buffer.
3. **Strategy 3 (Modern Microsoft 365 "Place in Cell" Support)**:
   - Modern Excel embeds in-cell pictures in `xl/cellimages.xml` and `xl/_rels/cellimages.xml.rels`.
   - Read `xl/cellimages.xml` blip relationships.
   - Cross-reference `xl/worksheets/sheet1.xml` for cells containing `DISPIMG` or `cellImage` in Column D.
   - Fall back to sequential row assignment for unassigned cellimages.
4. **Strategy 4 (Media Vault Fallback)**:
   - If images exist in `xl/media/` and unassigned rows exist, map them in alphabetical/numerical order to populated employee rows.
5. **Image Processing Pipeline**:
   - Strip headers, validate with `jimp`, scale down to a maximum of 600x600 px (preserving aspect ratio), compress to JPEG, and save to `%APPDATA%\birthday-buddy\photos\<id>.jpg`.

---

## 6. Windows Startup & Background Lifecycle Architecture

### 6.1 Install-Time Startup Registration (`build/installer.nsh`)
Do not rely on the user manually launching the application to enable startup. The NSIS installer must write the startup shortcut directly during installation:
```nsis
!macro customInstall
  DetailPrint "Creating automatic startup shortcut for Birthday Buddy daily reminders..."
  CreateShortCut "$SMSTARTUP\Birthday Buddy.lnk" "$INSTDIR\Birthday Buddy.exe" "--reminder" "$INSTDIR\Birthday Buddy.exe" 0
!macroend

!macro customUnInstall
  DetailPrint "Removing automatic startup shortcut for Birthday Buddy..."
  Delete "$SMSTARTUP\Birthday Buddy.lnk"
!macroend
```

### 6.2 Preventing Duplicate Boot Execution
- **Single Authority**: Use the Windows Startup folder shortcut (`shell:startup`) as the canonical autostart mechanism.
- In `StartupService`, explicitly call `app.setLoginItemSettings({ openAtLogin: false })` to ensure no conflicting key is created in `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`. This prevents Windows from launching two simultaneous instances on boot.
- In development mode (`!app.isPackaged`), startup registration must be skipped to avoid registering development `electron.exe` binaries into the Windows registry.

### 6.3 Second-Instance Guarding
In `app.on('second-instance')`:
```ts
app.on('second-instance', (_event, commandLine) => {
  // If Windows boot launched a second instance with --reminder, ignore it completely
  if (commandLine.some(arg => arg.includes('--reminder'))) {
    return;
  }
  // Only restore or create the main GUI if the user explicitly clicked the application shortcut
  const mainWin = MainWindowManager.getWindow();
  if (mainWin && !mainWin.isDestroyed()) {
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.focus();
  } else {
    MainWindowManager.create();
  }
});
```

### 6.4 Background Process Lifecycle & Snooze Protection
- In background reminder mode (`--reminder`), no main window is created.
- The process starts a delay timer (default: 3 minutes).
- **Critical `window-all-closed` Rule**:
  ```ts
  app.on('window-all-closed', () => {
    // Keep process alive if waiting for initial boot delay OR if 5-minute snooze is active
    if (isWaitingInitialReminder || ReminderService.getInstance().hasPendingSnooze()) {
      return;
    }
    app.quit();
  });
  ```
- **Silent Exit**: If the initial check finds no birthdays today OR if today's birthdays have already been marked `is_displayed = 1`, the process cleanly calls `app.quit()` and exits immediately. Nothing lingers in memory.
- **5-Minute Snooze**: If the celebration window is closed via `✕` without acknowledgement:
  - `ReminderService` sets a 5-minute timer (`setTimeout` for 300,000 ms).
  - The process remains in the background without any visible windows.
  - When the timer fires, it checks if today was acknowledged in the meantime. If not, it re-opens the celebration window.
- **Clean Windows Shutdown**:
  - Register listeners for `powerMonitor.on('shutdown')`, `app.on('session-end')`, and `app.on('before-quit')`.
  - In each listener, cancel all active timers (`clearTimeout`) and call `app.exit(0)`.
  - This eliminates Windows shutdown blocking prompts ("A background app is running").

---

## 7. UI/UX Page Specifications

### 7.1 Global Styling & Menu Rules
- **No Native Menus**: The application must globally remove standard menus (`File`, `Edit`, `View`, `Window`, `Help`) via `Menu.setApplicationMenu(null)`.
- **Palette**: Deep slate/indigo backgrounds for celebration mode (`#2e1065`), crisp clean light themes for dashboard and data management (`bg-gray-50/50`, border `border-gray-100`).
- **Sidebar**:
  - Items: **Dashboard**, **Employee Birthdays**, **Excel Import / Export**, **Reminder History**, **Settings**.
  - Footer: SQLite connection indicator (`Connected`), today's formatted date, application version (`v1.0.0`).
  - **No "About" sidebar option**.

### 7.2 Dashboard
- 4 Stat Cards: Total Employees, Today's Birthdays, Upcoming Birthdays (Next 30 Days), Next Birthday.
- Today's Birthday Section: If active, shows employee headshot, name, turning age, and celebration banner. If none: *"No birthdays today. You're all caught up!"*.
- Upcoming Birthdays Carousel: Chronological listing with headshot, name, formatted birthdate, and days remaining pill.

### 7.3 Employee Birthdays Directory
- **Columns**: `PHOTO` (40x40 rounded avatar), `EMPLOYEE NAME`, `DATE OF BIRTH` (DD Mon YYYY), `ACTIONS` (Edit, Delete).
- **Explicit Instruction**: Do **NOT** display an "Annual Birthday" column.
- **Actions**:
  - Add Employee Button: Opens modal with Name, Date of Birth picker, Photo file picker, and live preview.
  - Edit Employee: Pre-fills existing details and photo.
  - Delete Employee: Confirmation dialog with cascade cleanup of photos.
  - Search & Sorting: Live text search by name, sort by Name (Asc/Desc) and Birthday (Asc/Desc).

### 7.4 Excel Import / Export
- **Download Template Button**: Prompts save dialog for `Team_Birthday_Template.xlsx` with formatted headers, OpenXML-compliant formulas, and embedded instructions.
- **Upload Dropzone**: Accepts `.xlsx` files via drag-and-drop or browse.
- **Import Verification Table**:
  - Shows row number, extracted headshot thumbnail, employee name, parsed DOB, validation status (*Ready to Import*, *Duplicate*, *Invalid* with specific error reason).
  - Duplicate Resolution Dropdown: *Skip*, *Update Existing*, *Add As New*.
  - *Import All Valid* button commits to SQLite and updates photo vault.
  - *Download Error Report* button generates an error report spreadsheet if any rows failed validation.

### 7.5 Reminder History
- Audit log table displaying Reminder Date, Employee Headshot, Name, and Acknowledgement Timestamp.
- Search filter by name and date range selector.

### 7.6 Settings Page
- **Start with Windows**: Toggle switch (defaults to ON).
- **Reminder Delay**: Number input (default: 3 minutes).
- **Animations & Effects**: Confetti toggle, balloons toggle, photo display toggle.
- **Demo Data & App Reset**:
  - **"Load Demo Data" Button**: Seeds 6 diverse employees with real portrait headshots and sets one birthday to today's date, immediately prompting the celebration window for instant testing.
  - **"Reset All Data" Button**: Deletes all employee records, saved photos, and reminder history with a confirmation dialog, returning the app to a clean, fresh state.
- **Backup & Restore**:
  - *Create Backup (ZIP)*: Exports SQLite DB + `photos/` folder into a single ZIP.
  - *Restore from ZIP*: Validates and restores database and photos.
  - *Export Employees (.xlsx)*: Dumps full directory to Excel.
- **Developer & QA Simulation Tool**:
  - Allows entering a simulated date (e.g. `2026-11-03`) to test celebration mode without altering the system clock.

### 7.7 Birthday Celebration Window
- Dimensions: 900x700, centered, `alwaysOnTop: true`, `resizable: true`, `backgroundColor: '#2e1065'`.
- Header: Elegant golden award icon, *"Company Birthday Honors"*, and today's formatted date.
- Animation: Automatic multi-stage golden and champagne confetti burst.
- Employee Cards:
  - Gradient ring framing employee headshot (or initial badge fallback).
  - *"Birthday Star"* badge with sparkles icon.
  - Employee name in bold tracking-tight typography.
  - Milestone age pill: *"Turning X Years Today"*.
  - Personalized birthday greeting message.
- Footer Action:
  - Large gradient button: **"Ok, Thank You!"** with checkmark icon.
  - Helper note: *"Clicking 'Ok, Thank You!' records today's celebration as completed. Closing with ✕ will remind again in 5 minutes."*

---

## 8. Build, Packaging & Release Specifications

### 8.1 Single Executable Setup
Configure `electron-builder.yml` to generate strictly **one** setup installer without generating redundant portable files:
```yaml
appId: com.birthdaybuddy.app
productName: Birthday Buddy
copyright: Copyright © 2026 Birthday Buddy
directories:
  output: dist
files:
  - "out/**/*"
  - "src/assets/**/*"
  - "package.json"
asarUnpack:
  - "**/*.wasm"
win:
  icon: src/assets/icons/birthday_buddy.ico
  target:
    - target: nsis
      arch:
        - x64
nsis:
  oneClick: true
  perMachine: false
  allowElevation: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Birthday Buddy
  installerIcon: src/assets/icons/birthday_buddy.ico
  uninstallerIcon: src/assets/icons/birthday_buddy.ico
  deleteAppDataOnUninstall: false
  include: build/installer.nsh
```

### 8.2 Build Commands
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Build frontend and backend bundles
npm run build

# 4. Generate the production installer (.exe)
npm run dist
```

Output binary:
`dist/Birthday Buddy Setup 1.0.0.exe` (~102 MB standalone installer).

---

## 9. Verification & Acceptance Checklist

To consider the implementation complete, every item on this checklist must pass:
- [x] **Single Setup File**: Running `npm run dist` produces only `dist/Birthday Buddy Setup 1.0.0.exe`.
- [x] **Install-Time Startup**: Installing the app immediately creates `Birthday Buddy.lnk` in `shell:startup` pointing to `Birthday Buddy.exe --reminder`.
- [x] **Silent Boot Execution**: On Windows startup, the app starts with `--reminder`, waits 3 minutes in the background with zero open windows, checks today's birthdays, and pops up the celebration window if unacknowledged birthdays exist.
- [x] **Duplicate Rejection**: If Windows triggers multiple boot shortcuts, the second instance is discarded without popping up the main dashboard window.
- [x] **5-Minute Snooze**: Closing the celebration window with `✕` keeps the background process alive for 5 minutes and re-triggers the celebration window until "Ok, Thank You!" is clicked.
- [x] **Clean Acknowledgment**: Clicking "Ok, Thank You!" marks `is_displayed = 1` for today and immediately terminates the background process.
- [x] **Clean Shutdown**: Restarting or shutting down Windows while the background process is running exits instantly without triggering Windows "A background app is running" dialogs.
- [x] **No Menu Bar**: Top menus (`File`, `Edit`, `View`, etc.) are completely absent across all windows.
- [x] **Clean Excel Template**: Downloaded `Team_Birthday_Template.xlsx` opens in Microsoft Excel with zero repair or formula syntax warnings.
- [x] **Multi-Strategy Headshot Import**: Excel files with images added via "Place in Cell", "Place over Cells", or copy-paste correctly extract headshots and display thumbnails in the import preview table and celebration window.
- [x] **Directory Table Cleanliness**: The Employee Birthdays directory does NOT display the "Annual Birthday" column.
- [x] **Sidebar Cleanliness**: The sidebar does NOT display the "About" option.
- [x] **Factory Reset & Demo Data**: Settings page includes working "Reset All Data" and "Load Demo Data" buttons.
- [x] **Automated Tests**: All 14 Vitest unit tests pass.
