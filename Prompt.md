MASTER DEVELOPMENT PROMPT — TEAM BIRTHDAY REMINDER DESKTOP APPLICATION
1. Project overview

Act as a senior software architect, full-stack developer, desktop application developer and UI/UX designer.

Build a complete, production-quality Windows desktop application named:

Birthday Buddy — Team Birthday Reminder

The purpose of this application is to help a company or team maintain employee birthday information through an Excel template and automatically remind users about birthdays every day.

This must be a fully functional, installable desktop application, not just a prototype, UI mockup or demonstration.

All features must work properly, including:

Excel template generation and downloading.
Excel file uploading and validation.
Employee name and date-of-birth management.
Employee photo extraction and storage.
Automatic daily birthday detection.
Windows startup integration.
Background execution with minimal resource consumption.
Birthday notification banners.
Daily reminder acknowledgement.
Persistent local data storage.
Application settings and employee management.

Do not leave placeholder buttons, fake functionality, incomplete screens or simulated data in the final application.

2. Recommended technology stack

Build the application using the following architecture:

Component	Technology
Desktop framework	Python + PySide6
UI	PySide6 with modern QSS styling
Database	SQLite
Excel generation	openpyxl
Excel reading	openpyxl
Embedded image extraction	openpyxl image/drawing support
Image processing	Pillow
Background scheduling	Windows Task Scheduler integration
Application packaging	PyInstaller
Installer	Inno Setup
Animations	Qt animations and Lottie-compatible animations

Use modular, maintainable architecture.

The application should run entirely on the user's Windows computer. Do not require a cloud server, external database or paid subscription.

Target Windows 10 and Windows 11.

Use a local timezone-aware date calculation, with the Windows system's current local date.

3. Application branding and identity

Application name: Birthday Buddy

Tagline: Never Miss a Birthday!

Design a professional, attractive application identity.

Application icon

Create an original birthday-themed icon.

The icon should feature:

A beautiful birthday cake.
Colourful balloons.
Small confetti elements.
A birthday candle.
A clean, modern appearance.

Use a polished vector design and export:

birthday_buddy.ico
birthday_buddy.png
birthday_buddy.svg

The ICO must contain appropriate Windows icon sizes, including 16, 32, 48, 256 pixels.

Use the icon consistently for:

Desktop shortcut.
Start menu shortcut.
Application window.
Installer.
Notification area, if implemented.

Inside the application, use animated birthday illustrations, floating balloons, confetti and cake animations.

Do not use excessive animations on normal dashboard screens.

4. Main application layout

Create a clean, professional desktop interface.

Design inspiration:

Modern SaaS dashboard.
Minimalist enterprise software.
Rounded cards.
Soft shadows.
White and very light grey backgrounds.
Elegant typography.
Subtle purple, blue and pink accents.
Clear spacing and alignment.

Use a consistent design system.

Main navigation

Create a left sidebar containing:

Dashboard
Employee Birthdays
Excel Import / Export
Reminder History
Settings
About

At the bottom display:

Application version.
Database status.
Current date.

The main content area should dynamically change according to the selected navigation item.

The application should open maximized or in a suitably sized professional window.

5. Dashboard

The dashboard should be the main screen.

Display four summary cards:

Total Employees

Total number of employee records.

Today's Birthdays

Number of employees whose birthdays are today.

Upcoming Birthdays

Number of birthdays occurring within the next 30 days.

Next Birthday

Name and date of the next employee birthday.

Below the summary cards, display:

Today's birthdays

If someone has a birthday today, display their photo, name and birthday information.

If nobody has a birthday today, display a clean empty state:

"No birthdays today. You're all caught up!"

Upcoming birthdays

Show employees with upcoming birthdays in chronological order.

Each employee card should display:

Employee photograph.
Employee name.
Date of birth.
Upcoming birthday date.
Days remaining.

Do not show unnecessary empty cards or placeholder employee records.

6. Excel template generation and downloading

This is one of the most important features.

Create a dedicated Excel Import / Export page.

Provide a prominent button:

Download Excel Template

When clicked, generate and download a properly formatted Excel workbook named:

Team_Birthday_Template.xlsx

Excel workbook structure

Create a worksheet named:

Employee Birthday Details

The worksheet must have these columns:

Sl.No	Employee Name	Date of Birth	Employee Photo
1	Enter employee name	Select date	Insert photo
2			
3			
Excel formatting
Professional header row.
Different background colour for column headings.
Proper column widths.
Proper row heights.
Borders.
Readable font.
Freeze the header row.
Enable filters.
Apply date formatting as DD-MM-YYYY.
Use alternating row colours.
Add a short instruction section at the top or on a separate Instructions worksheet.
Serial number behaviour

The first employee row must automatically display serial number 1.

The next serial number should appear only when the preceding employee row is completed.

Example:

Initially:

Sl.No	Employee Name	DOB	Photo
1			

After entering the first employee's name, DOB and photo, the next row becomes available:

Sl.No	Employee Name	DOB	Photo
1	Rahul	15-05-1995	Photo
2			

Continue this behaviour for additional employees.

The workbook should provide enough formatted rows for at least 100 employees.

Important technical requirement:

A normal XLSX cell cannot display a native operating-system file picker. Therefore, use embedded-image insertion in the workbook.

In the Employee Photo column:

Provide a clearly visible instruction such as "Insert Photo Here".
Explain how to use Excel → Insert → Pictures.
Users should insert the employee photograph into the matching row.
The application must extract the embedded photograph from the correct Excel row during import.
Resize the photo visually to fit inside the cell without distorting it.

Do not require users to rename image files manually.

Create a second worksheet called Instructions explaining the complete process with simple screenshots or illustrations where practical.

The workbook should be compatible with Microsoft Excel and commonly used spreadsheet applications.

Do not use VBA macros or require users to enable macros.

7. Excel upload functionality

On the Excel Import / Export page, provide:

Upload Completed Excel File

Support:

File picker.
Drag and drop.
XLSX file validation.
Excel worksheet validation.
Employee name validation.
Date-of-birth validation.
Employee photo validation.
Duplicate detection.

After selecting a workbook, show an import preview.

Import preview

Display a table containing:

Sl.No	Employee Name	DOB	Photo	Status
1	Rahul	15-05-1995	Thumbnail	Valid
2	Priya	20-11-1997	Thumbnail	Valid

The user must be able to review the records before importing.

Provide:

Import All.
Cancel.
Download Error Report.
Import validation rules
Employee name is mandatory.
Date of birth is mandatory.
DOB must be a valid date.
Reject future dates of birth.
Photos must be valid supported image formats.
Support JPG, JPEG and PNG.
Reject corrupted images.
Ignore completely empty rows.
Detect duplicate records.
Never silently overwrite existing employee records.

Use employee name + date of birth as an initial duplicate warning, but allow users to resolve legitimate same-name records.

If errors exist, show the exact row number and reason.

For successful imports, show:

"Employee birthday records imported successfully!"

The application must preserve employee photographs after the Excel file is moved or deleted.

Copy photos into the application's own managed local storage.

Use unique internal employee IDs to associate photos with employee records.

8. Employee Birthday Management

Create a dedicated Employee Birthdays page.

Display employees in a clean table or card layout.

Fields:

Employee ID.
Employee name.
Date of birth.
Employee photograph.
Created date.

Provide the following actions:

Add employee.
Edit employee.
Delete employee.
View employee.
Search employees.
Sort by name.
Sort by birthday.
Filter by upcoming birthdays.

For manual employee creation, provide:

Employee Name: Text input.

Date of Birth: Calendar date picker.

Employee Photo: Select Photo button.

The photo selection must open the Windows file picker.

Show a preview after selecting the image.

Allow users to replace or remove an existing photo.

Before deleting an employee, show a confirmation dialog.

All changes must be saved to SQLite immediately and safely.

9. Database architecture

Use SQLite for persistent storage.

Create the following tables:

employees
id: Primary key.
employee_name.
date_of_birth.
photo_path.
created_at.
updated_at.
reminder_history
id: Primary key.
reminder_date.
employee_id.
employee_name_snapshot.
acknowledged_at.
application_settings
id.
start_with_windows.
reminder_delay_minutes.
show_birthday_animations.
last_processed_date.
notification_enabled.

Use appropriate indexes.

Use transactions for bulk Excel imports.

Ensure the application never loses existing data when it is updated or restarted.

Store data in an appropriate Windows user application-data directory, not inside a temporary folder or the installation directory.

Keep database files and employee photographs in a predictable, documented folder structure.

10. Automatic birthday detection — MOST IMPORTANT FEATURE

Implement a reliable daily birthday reminder system.

The application must integrate with Windows startup.

Required behaviour

When Windows starts and the user logs in:

The Birthday Buddy background process should launch automatically.
It should wait five minutes.
After five minutes, it should check the SQLite database.
It should identify whether any employee has a birthday today.
If birthdays exist, display the birthday celebration window.
If no birthdays exist, exit silently.
The application must not continue running unnecessarily.

The five-minute delay should be configurable in Settings, with five minutes as the default.

Windows startup integration

Use Windows Task Scheduler or an equivalent reliable Windows startup mechanism.

Create an appropriately named scheduled task:

Birthday Buddy Daily Reminder

Requirements:

Start after user login.
Run with normal user privileges.
Avoid unnecessary administrator permission requirements.
Prevent multiple simultaneous instances.
Handle unexpected shutdowns.
Avoid launching multiple reminder windows.
Start silently without showing the dashboard.

The startup task must be registered when the user enables "Start with Windows".

Allow the user to disable automatic startup from Settings.

Provide a clear startup status indicator.

Daily processing logic

The application must compare the employee's birthday month and day against today's local month and day.

Do not compare the birth year.

Example:

Employee DOB: 15-05-1995

Today's date: 15-05-2026

Result: Birthday detected.

If multiple employees have birthdays on the same day, show all of them.

Important duplicate prevention

The application must remember whether today's reminder has already been acknowledged.

Use a date-based reminder state.

For example:

2026-11-02 = acknowledged

After acknowledgement:

Do not show the birthday window again that day.
Do not run the reminder process again unnecessarily.
Do not show repeated notifications.
Wait until the next scheduled startup check on the following day.

If no birthday exists:

Exit silently.
Do not show an empty notification.
Do not continue running a polling loop.
Do not create unnecessary background threads.

If the application is manually opened during the day, it should not show an already acknowledged birthday reminder again.

Important reliability behaviour

Do not use an infinite background loop.

Do not use continuous database polling.

Do not use unnecessary timers that remain active throughout the day.

The daily reminder should be a short-lived process.

Once the user acknowledges the reminder, terminate the reminder process cleanly.

Windows Task Scheduler can launch the application again at the next login.

If the computer is already running and the user logs in the following day, the task should trigger the next daily check.

If the computer remains continuously logged in across midnight, provide a reliable next-day trigger without keeping the main application continuously active. Use a lightweight scheduled task or a date-triggered Windows scheduled task.

The system must handle sleep, hibernation and missed scheduled triggers gracefully. A missed check should occur at the next available login or scheduled opportunity, without duplicating an already acknowledged reminder.

11. Birthday celebration window

This is the most visually important part of the application.

When today's birthdays are detected, show a beautiful birthday celebration window.

It should look like a professional birthday greeting banner rather than a plain Windows message box.

Overall design

Create:

Colourful birthday background.
Animated confetti.
Floating balloons.
Birthday cake illustration.
Subtle celebratory animations.
Attractive typography.
Beautiful employee cards.

Use a premium colour palette:

Purple.
Pink.
Soft blue.
Gold.
White.

Do not make the interface visually overwhelming.

Main heading

Display:

"🎉 TODAY IS A SPECIAL DAY! 🎂"

Subheading:

"Let's celebrate our team members!"

Employee birthday cards

For every employee with a birthday today, create a separate birthday card.

Each card should display:

Employee photograph prominently.
Employee name in large text.
"Happy Birthday!" message.
Birthday cake or balloon icon.
Date of birth or birthday date.

Example:

"Happy Birthday, Rahul! 🎂"

"May your day be filled with happiness, success and wonderful memories!"

Use the actual stored employee photo.

Do not use random photographs or unrelated stock images.

If an employee photo is missing, show an attractive default birthday avatar.

Multiple birthday handling

If three employees have birthdays today, show all three.

Do not display only the first employee.

If there are many birthdays, use a scrollable layout or a well-designed multi-card layout.

The window should adapt to screen resolution.

Acknowledgement button

At the bottom of the celebration window, display one prominent button:

Okay, Thanks for the Reminder!

When clicked:

Save the acknowledgement date to SQLite.
Save individual reminder-history entries.
Close the birthday celebration window.
Stop the reminder process.
Do not display the same reminder again that day.
Allow the next day's scheduled reminder to operate normally.

Do not close the reminder automatically before the user acknowledges it.

If the user closes the window using the X button, do not incorrectly mark the reminder as acknowledged. Provide a reliable way for the next login or manual opening to show the pending reminder again.

12. Special birthday date handling

Implement proper date handling.

Requirements:

Ignore birth years when detecting annual birthdays.
Handle different month lengths.
Handle February 29 birthdays consistently.
Provide a configurable February 29 policy:
Celebrate on February 28 in non-leap years.
Celebrate on March 1 in non-leap years.
Use local system dates.
Prevent timezone-related date shifts.
Do not treat invalid or incomplete DOB entries as birthdays.

Default February 29 policy: February 28.

13. Reminder history

Create a Reminder History page.

Display:

Reminder date.
Employee name.
Employee photograph.
Acknowledgement status.
Acknowledgement time.

Allow users to filter by date and search employee names.

Do not generate reminder-history entries when there was no birthday.

14. Settings

Create a clean settings screen.

Include:

General
Start with Windows: ON/OFF.
Automatic reminder: ON/OFF.
Reminder delay: Default 5 minutes.
Launch application minimized: ON/OFF.
Birthday display
Enable confetti animations: ON/OFF.
Enable balloon animations: ON/OFF.
Show employee photos: ON/OFF.
Birthday greeting message.
Data management
Database location.
Employee photo storage location.
Backup database.
Restore database.
Export employee information.
About
Application name.
Version.
Developer information.
Copyright.

Provide confirmation messages for important settings changes.

15. Backup and restore

Implement a complete local backup mechanism.

The backup must include:

SQLite database.
All employee photographs.
Application settings.
Reminder history.

Create a ZIP backup containing all required files.

Allow the user to:

Create backup.
Choose backup location.
Restore from backup.

Validate backups before restoration.

Never silently overwrite current data.

Provide a confirmation dialog before restoration.

16. User experience and error handling

The application should provide professional messages for all major operations.

Examples:

Excel:

"Template downloaded successfully."
"Please upload a valid Excel workbook."
"Some rows contain invalid dates."
"Employee photo is missing."
"Duplicate employee record detected."
"Import completed successfully."

Application:

"Settings saved successfully."
"Backup created successfully."
"Employee details updated."
"Employee deleted successfully."

Handle:

Missing database.
Corrupted database.
Missing photographs.
Invalid Excel files.
Invalid image files.
File permission problems.
Multiple application instances.
Windows startup task failures.
Unexpected application crashes.

The application should recover safely wherever possible.

Never delete existing employee records because an uploaded Excel file contains fewer rows.

The import workflow should clearly distinguish between:

Add new records.
Update existing records.
Skip existing records.
17. Security and privacy

All employee information is private.

Requirements:

Store all information locally.
No automatic cloud uploads.
No external analytics.
No unnecessary network connections.
Validate uploaded Excel files.
Validate image content and file size.
Protect against path traversal.
Use safe file naming for stored photographs.
Do not execute macros or embedded workbook code.
Prevent SQL injection using parameterized queries.

Provide a clear privacy statement in the About section.

18. Professional UI/UX requirements

The application must look like a finished commercial desktop product.

Use consistent:

Typography.
Colours.
Spacing.
Buttons.
Cards.
Dialogs.
Navigation.
Icons.
Table layouts.

Use clear visual hierarchy.

Every button must have a working function.

Every input must be validated.

Provide helpful empty states.

Use loading indicators for Excel imports and backups.

Use confirmation dialogs for destructive actions.

Use subtle hover effects.

Avoid:

Outdated Windows-style interfaces.
Excessively bright colours.
Cluttered screens.
Unnecessary gradients.
Oversized text.
Inconsistent margins.
Fake charts.
Unnecessary dashboard widgets.

The birthday celebration window should be visually more festive than the normal dashboard.

19. Recommended project folder structure

Organize the code professionally.

birthday_buddy/

main.py

requirements.txt

README.md

config/
    settings.py

database/
    db_manager.py
    schema.sql

models/
    employee.py
    reminder.py

services/
    excel_service.py
    image_service.py
    birthday_service.py
    reminder_service.py
    backup_service.py
    startup_service.py

ui/
    main_window.py
    dashboard.py
    employee_page.py
    excel_page.py
    history_page.py
    settings_page.py
    birthday_window.py

assets/
    icons/
    images/
    animations/
    styles/

utils/
    validators.py
    date_utils.py
    paths.py
    logging_config.py

tests/
    test_excel.py
    test_birthday.py
    test_database.py
    test_import.py
    test_reminder.py
    test_backup.py

installer/
    birthday_buddy.spec
    installer.iss


Use additional files where necessary.

Maintain separation between UI, database, business logic and Windows integration.

20. Testing requirements

Do not consider the application complete until the following scenarios have been tested.

Excel tests
Download a new template.
Enter one employee.
Insert an employee photograph.
Upload the workbook.
Verify that the employee is imported.
Verify that the photo is extracted correctly.
Enter multiple employees.
Upload multiple photographs.
Upload an empty workbook.
Upload an invalid workbook.
Upload a workbook containing duplicate records.
Verify that invalid rows produce useful error messages.
Birthday detection tests
One employee has a birthday today.
Three employees have birthdays today.
No employees have birthdays today.
An employee has a birthday tomorrow.
An employee has a birthday next month.
Test February 29.
Test a missing employee photo.
Test an employee with an invalid DOB.
Reminder tests
Windows startup launches the reminder process.
The process waits five minutes.
The application detects today's birthday.
The birthday banner appears.
The user clicks Okay, Thanks for the Reminder.
The reminder is marked acknowledged.
The process terminates.
Reopening the application does not show the same reminder again that day.
The following day's reminder works normally.
No-birthday days exit silently.
Closing the birthday window without acknowledgement does not mark it complete.
Multiple launches do not create duplicate windows.

For development and QA, implement a configurable test mode that can simulate dates and reminder delays without changing the actual system clock.

Never allow test mode to affect production reminder records.

Database tests

Test:

Application restart.
Employee updates.
Employee deletions.
Database backup.
Database restoration.
Missing photo files.
Corrupted database recovery.
21. Installation and delivery

The final deliverable must be an installable Windows application.

Generate:

BirthdayBuddy_Setup.exe
Desktop shortcut.
Start menu shortcut.
Proper application icon.
Automatic startup integration.
Uninstaller.
Local database initialization.
Required application directories.

The installer should:

Install the application properly.
Create the required data directories.
Register the Windows startup task only when the user enables the option.
Provide a clean uninstall process.
Avoid deleting user data by default during uninstallation.

Also provide a portable build if practical.

Create a README containing:

Installation instructions.
First-time setup.
Excel template usage.
How to upload employee details.
How automatic reminders work.
How to enable or disable Windows startup.
Backup and restore instructions.
Troubleshooting.
22. Development execution instructions

Follow this development sequence.

Phase 1 — Architecture

Set up the project.
Configure dependencies.
Design the database.
Establish the folder structure.

Phase 2 — UI

Build the main window.
Implement sidebar navigation.
Create the dashboard.
Build employee management.
Build settings and history pages.

Phase 3 — Excel integration

Generate the formatted workbook.
Implement image extraction.
Implement import preview.
Implement validation and database import.

Phase 4 — Birthday engine

Implement birthday detection.
Handle multiple birthdays.
Handle leap years.
Implement reminder acknowledgement.

Phase 5 — Birthday celebration

Design the celebration window.
Integrate employee photos.
Implement animations.
Add the acknowledgement button.

Phase 6 — Windows integration

Implement Windows startup.
Configure the five-minute delay.
Prevent duplicate instances.
Implement silent background execution.
Ensure processes terminate when finished.

Phase 7 — Testing

Run all unit tests.
Run Excel integration tests.
Run simulated birthday tests.
Test Windows startup behaviour.
Test resource consumption and process termination.

Phase 8 — Packaging

Build the executable.
Create the installer.
Verify installation and uninstallation.
Verify the desktop shortcut.
Verify the application icon.
Verify startup integration on a clean Windows installation.
23. Strict final acceptance criteria

The project is complete only when all of these requirements are satisfied:

The application installs successfully on Windows.
The user can download an Excel template.
The user can enter employee names and dates of birth.
The user can insert employee photos into the Excel workbook.
The user can upload the completed workbook.
Employee data and photographs are imported correctly.
The dashboard displays real employee records.
The application identifies birthdays accurately.
The Windows startup process works.
The reminder starts five minutes after login by default.
Multiple birthdays are displayed together.
Birthday banners show the correct employee photographs.
The acknowledgement button works.
Acknowledged reminders are not repeated that day.
No-birthday days remain completely silent.
The background process terminates after completing its work.
The next day's reminder works normally.
Data remains intact after restarting Windows.
Backup and restore work.
All navigation and buttons work.
No critical errors remain.
The installer and uninstaller work properly.
Final instruction to Antigravity

Do not stop after generating a project structure or an attractive frontend.

Actually implement the complete application.

Build the working database, Excel processing, photo extraction, Windows startup integration, scheduling, birthday detection, celebration interface and installer.

Test the complete workflow from downloading the Excel template to importing employee data and receiving a birthday reminder.

Where a technical limitation exists, implement the closest reliable solution and document it rather than leaving a non-functional feature.

Prioritize correctness, stability, data safety, low resource consumption and professional design.

The final result must be a complete, working, installable Birthday Buddy desktop application that a real team can start using immediately.