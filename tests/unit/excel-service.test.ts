import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import { ExcelService } from '../../src/main/services/excel-service';
import { DbManager } from '../../src/main/database/db-manager';

describe('ExcelService', () => {
  let excelService: ExcelService;
  const tempDir = path.join(__dirname, '../temp_excel');

  beforeEach(async () => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const db = DbManager.getInstance();
    await db.initialize();
    excelService = ExcelService.getInstance();
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('generates a properly formatted template with both sheets and formulas', async () => {
    const templatePath = path.join(tempDir, 'Team_Birthday_Template.xlsx');
    await excelService.generateTemplate(templatePath);

    expect(fs.existsSync(templatePath)).toBe(true);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);

    const empSheet = wb.getWorksheet('Employee Birthday Details');
    expect(empSheet).toBeDefined();

    const instrSheet = wb.getWorksheet('Instructions');
    expect(instrSheet).toBeDefined();

    // Check Headers
    expect(empSheet?.getCell('A1').value).toBe('Sl.No');
    expect(empSheet?.getCell('B1').value).toBe('Employee Name');
    expect(empSheet?.getCell('C1').value).toContain('Date of Birth');
    expect(empSheet?.getCell('D1').value).toContain('Employee Photo');

    // Check row 2 has serial number 1
    expect(empSheet?.getCell('A2').value).toBe(1);

    // Check row 3 has dynamic serial formula
    const row3Formula = empSheet?.getCell('A3').value as any;
    expect(row3Formula.formula).toContain('IF(B3<>""');
  });

  it('parses an uploaded workbook and validates records properly', async () => {
    const testFile = path.join(tempDir, 'test_upload.xlsx');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Employee Birthday Details');

    ws.columns = [
      { header: 'Sl.No', key: 'sl' },
      { header: 'Employee Name', key: 'name' },
      { header: 'Date of Birth', key: 'dob' },
      { header: 'Employee Photo', key: 'photo' }
    ];

    // Valid row
    ws.addRow([1, 'Valid User', '15-05-1995', '']);
    // Invalid row: Future date
    ws.addRow([2, 'Time Traveler', '15-05-2099', '']);
    // Invalid row: Missing name
    ws.addRow([3, '', '10-10-1990', '']);

    await wb.xlsx.writeFile(testFile);

    const preview = await excelService.parseExcelFile(testFile);
    expect(preview.length).toBe(3);

    // Valid
    expect(preview[0].employeeName).toBe('Valid User');
    expect(preview[0].dob).toBe('1995-05-15');
    expect(preview[0].status).toBe('valid');

    // Future date
    expect(preview[1].employeeName).toBe('Time Traveler');
    expect(preview[1].status).toBe('invalid');
    expect(preview[1].errors.some(e => e.includes('future'))).toBe(true);

    // Missing name
    expect(preview[2].status).toBe('invalid');
    expect(preview[2].errors.some(e => e.includes('name is required'))).toBe(true);
  });
});

