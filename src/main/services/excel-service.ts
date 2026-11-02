import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DbManager } from '../database/db-manager';
import { ImageService } from './image-service';
import { ImportPreviewRow, ImportSummary } from '../../shared/types';
import log from 'electron-log';

export class ExcelService {
  private static instance: ExcelService | null = null;

  private constructor() {}

  public static getInstance(): ExcelService {
    if (!ExcelService.instance) {
      ExcelService.instance = new ExcelService();
    }
    return ExcelService.instance;
  }

  public async generateTemplate(savePath: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Birthday Buddy';
    workbook.created = new Date();

    // 1. Employee Birthday Details Worksheet
    const ws = workbook.addWorksheet('Employee Birthday Details', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    ws.columns = [
      { header: 'Sl.No', key: 'slNo', width: 10 },
      { header: 'Employee Name', key: 'name', width: 32 },
      { header: 'Date of Birth (DD-MM-YYYY)', key: 'dob', width: 28 },
      { header: 'Employee Photo (Insert > Pictures)', key: 'photo', width: 36 }
    ];

    // Format Header Row
    const headerRow = ws.getRow(1);
    headerRow.height = 32;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4C1D95' } // Deep Purple
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.border = {
      top: { style: 'medium', color: { argb: 'FF2E1065' } },
      bottom: { style: 'medium', color: { argb: 'FF2E1065' } },
      left: { style: 'thin', color: { argb: 'FF7C3AED' } },
      right: { style: 'thin', color: { argb: 'FF7C3AED' } }
    };

    // Auto filter
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 4 }
    };

    // Populate 100 rows with styling, formula, and alternating colors
    for (let i = 2; i <= 101; i++) {
      const row = ws.getRow(i);
      row.height = 50; // Spacious for pictures
      const isEven = i % 2 === 0;

      // Formula for serial number: Row 2 has 1, subsequent rows check if name cell is non-empty
      if (i === 2) {
        row.getCell(1).value = 1;
      } else {
        row.getCell(1).value = {
          formula: `IF(B${i}<>""; A${i - 1}+1; "")`,
          date1904: false
        } as any;
      }

      // Placeholder hint for Photo cell
      row.getCell(4).value = 'Insert Photo Here';
      row.getCell(4).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 9, name: 'Segoe UI' };

      // Alternating row background
      const bgColor = isEven ? 'FFFFFFFF' : 'FFF9FAFB';

      for (let col = 1; col <= 4; col++) {
        const cell = row.getCell(col);
        if (col !== 4) {
          cell.font = { name: 'Segoe UI', size: 10 };
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: col === 1 ? 'center' : (col === 3 ? 'center' : 'left')
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };

        if (col === 3) {
          cell.numFmt = 'DD-MM-YYYY';
        }
      }
    }

    // 2. Instructions Worksheet
    const instrWs = workbook.addWorksheet('Instructions');
    instrWs.columns = [
      { header: '', key: 'colA', width: 5 },
      { header: '', key: 'colB', width: 85 }
    ];

    const instructions = [
      { text: 'Birthday Buddy — Excel Template Instructions', isTitle: true },
      { text: '', isBlank: true },
      { text: 'Follow these simple instructions to prepare your team birthday data:', isSubtitle: true },
      { text: '', isBlank: true },
      { text: '1. Employee Name (Column B):', isHeader: true },
      { text: '   • Enter the full name of the employee (e.g., John Doe, Priya Sharma).' },
      { text: '   • This field is mandatory.' },
      { text: '', isBlank: true },
      { text: '2. Date of Birth (Column C):', isHeader: true },
      { text: '   • Enter the birth date in DD-MM-YYYY format (e.g., 15-05-1995).' },
      { text: '   • Excel will automatically format it if entered as a standard date.' },
      { text: '   • Future dates are invalid and will be rejected during import.' },
      { text: '', isBlank: true },
      { text: '3. Employee Photo (Column D):', isHeader: true },
      { text: '   • To add a photo: Click the cell in Column D for that employee.' },
      { text: '   • In Excel, click on the "Insert" tab in the top ribbon.' },
      { text: '   • Click "Pictures" -> "Place in Cell" or "Place over Cells".' },
      { text: '   • Position or resize the photo to sit inside the matching employee row.' },
      { text: '   • Supported formats: JPG, JPEG, PNG.' },
      { text: '   • Photos are automatically extracted, optimized, and saved locally.' },
      { text: '', isBlank: true },
      { text: '4. Serial Numbers (Column A):', isHeader: true },
      { text: '   • Serial numbers generate automatically as you fill in employee names.' },
      { text: '', isBlank: true },
      { text: '5. Saving & Uploading:', isHeader: true },
      { text: '   • Save this workbook as .xlsx and upload it inside Birthday Buddy.' },
      { text: '   • You will get a preview where you can verify all records before importing.' }
    ];

    instructions.forEach((item, index) => {
      const r = instrWs.getRow(index + 2);
      r.getCell(2).value = item.text;

      if (item.isTitle) {
        r.height = 36;
        r.getCell(2).font = { bold: true, size: 16, color: { argb: 'FF4C1D95' }, name: 'Segoe UI' };
      } else if (item.isSubtitle) {
        r.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF374151' }, name: 'Segoe UI' };
      } else if (item.isHeader) {
        r.getCell(2).font = { bold: true, size: 11, color: { argb: 'FF1F2937' }, name: 'Segoe UI' };
      } else {
        r.getCell(2).font = { size: 10, color: { argb: 'FF4B5563' }, name: 'Segoe UI' };
      }
    });

    await workbook.xlsx.writeFile(savePath);
    log.info('Generated Excel template successfully at:', savePath);
    return savePath;
  }

  public async parseExcelFile(filePath: string): Promise<ImportPreviewRow[]> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Find the right sheet
    let worksheet = workbook.getWorksheet('Employee Birthday Details');
    if (!worksheet) {
      worksheet = workbook.worksheets[0];
    }

    if (!worksheet) {
      throw new Error('No worksheets found in the Excel workbook');
    }

    // Extract images and map to row numbers
    const imagesByRow = new Map<number, { buffer: Buffer; extension: string }>();
    try {
      const images = worksheet.getImages();
      for (const img of images) {
        const media = workbook.getImage(Number(img.imageId));
        if (media && media.buffer) {
          // Native row is 0-indexed; Excel row is nativeRow + 1
          const rawRow = (img.range?.tl as any)?.nativeRow !== undefined
            ? (img.range.tl as any).nativeRow + 1
            : (img.range?.tl?.row !== undefined ? Math.floor(img.range.tl.row) + 1 : null);

          if (rawRow !== null && rawRow >= 2) {
            imagesByRow.set(rawRow, { buffer: media.buffer as unknown as Buffer, extension: media.extension });
          }
        }
      }
    } catch (err) {
      log.warn('Could not extract images using worksheet.getImages():', err);
    }

    const db = DbManager.getInstance();
    const rows: ImportPreviewRow[] = [];
    const totalRows = worksheet.rowCount;

    for (let rowNum = 2; rowNum <= totalRows; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const nameVal = row.getCell(2).value;
      const dobVal = row.getCell(3).value;

      // Extract raw values
      const rawName = this.extractStringValue(nameVal);
      const rawDob = this.extractDateValue(dobVal);

      // Check if completely empty row
      const isPhotoPlaceholder = row.getCell(4).value === 'Insert Photo Here';
      const hasImage = imagesByRow.has(rowNum);

      if (!rawName && !rawDob && !hasImage) {
        continue; // Skip blank rows
      }

      const errors: string[] = [];

      // Validate Name
      if (!rawName || rawName.trim().length === 0) {
        errors.push('Employee name is required');
      }

      // Validate DOB
      let formattedDob = '';
      if (!rawDob) {
        errors.push('Date of birth is required');
      } else {
        const parsedDate = this.parseDateString(rawDob);
        if (!parsedDate.valid) {
          errors.push(parsedDate.error || 'Invalid date format (must be DD-MM-YYYY)');
        } else {
          formattedDob = parsedDate.isoDate!;
          // Validate not future date
          const today = new Date();
          const birthDate = new Date(formattedDob);
          if (birthDate > today) {
            errors.push('Date of birth cannot be in the future');
          }
        }
      }

      // Check Photo
      let photoBase64: string | null = null;
      if (hasImage) {
        const imgData = imagesByRow.get(rowNum)!;
        photoBase64 = `data:image/${imgData.extension};base64,${imgData.buffer.toString('base64')}`;
      }

      // Check Duplicate
      let isDuplicate = false;
      if (rawName && formattedDob) {
        const existing = db.findEmployeesByNameAndDob(rawName, formattedDob);
        if (existing.length > 0) {
          isDuplicate = true;
        }
      }

      let status: 'valid' | 'invalid' | 'warning' = 'valid';
      if (errors.length > 0) {
        status = 'invalid';
      } else if (isDuplicate) {
        status = 'warning';
      }

      rows.push({
        rowNumber: rowNum,
        employeeName: rawName || '',
        dob: formattedDob,
        photoBase64,
        status,
        errors,
        isDuplicate,
        duplicateResolution: isDuplicate ? 'skip' : 'add'
      });
    }

    return rows;
  }

  public async commitImport(previewRows: ImportPreviewRow[]): Promise<ImportSummary> {
    const db = DbManager.getInstance();
    const imageService = ImageService.getInstance();

    let imported = 0;
    let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    for (const row of previewRows) {
      if (row.status === 'invalid') {
        errors.push({ row: row.rowNumber, reason: row.errors.join('; ') });
        continue;
      }

      if (row.isDuplicate && row.duplicateResolution === 'skip') {
        skipped++;
        continue;
      }

      try {
        let photoPath: string | null = null;
        if (row.photoBase64) {
          try {
            const photoFilename = await imageService.saveEmployeePhoto(row.photoBase64);
            photoPath = photoFilename;
          } catch (imgErr: any) {
            log.warn(`Could not process photo for row ${row.rowNumber}:`, imgErr);
          }
        }

        if (row.isDuplicate && row.duplicateResolution === 'update') {
          const existingList = db.findEmployeesByNameAndDob(row.employeeName, row.dob);
          if (existingList.length > 0) {
            db.updateEmployee(existingList[0].id, {
              employee_name: row.employeeName,
              date_of_birth: row.dob,
              photo_path: photoPath || existingList[0].photo_path
            });
            imported++;
            continue;
          }
        }

        // Add new
        db.createEmployee({
          id: uuidv4(),
          employee_name: row.employeeName,
          date_of_birth: row.dob,
          photo_path: photoPath
        });
        imported++;
      } catch (err: any) {
        errors.push({ row: row.rowNumber, reason: err?.message || 'Database error' });
      }
    }

    db.saveToDisk();

    return {
      success: errors.length === 0,
      total: previewRows.length,
      imported,
      skipped,
      errors
    };
  }

  public async generateErrorReport(errors: { row: number; reason: string }[], savePath: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Import Errors');
    ws.columns = [
      { header: 'Row Number', key: 'row', width: 15 },
      { header: 'Error Description', key: 'reason', width: 60 }
    ];

    const hRow = ws.getRow(1);
    hRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };

    errors.forEach(err => {
      ws.addRow({ row: err.row, reason: err.reason });
    });

    await workbook.xlsx.writeFile(savePath);
    return savePath;
  }

  private extractStringValue(val: any): string | null {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (val.result !== undefined) return String(val.result).trim();
      if (val.richText) return val.richText.map((t: any) => t.text).join('').trim();
      if (val.text) return String(val.text).trim();
    }
    return String(val).trim();
  }

  private extractDateValue(val: any): string | null {
    if (val === null || val === undefined) return null;
    if (val instanceof Date) {
      return this.formatDateObjToIso(val);
    }
    if (typeof val === 'number') {
      // Excel serial date
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return this.formatDateObjToIso(date);
    }
    if (typeof val === 'string') {
      return val.trim();
    }
    if (typeof val === 'object' && val.result !== undefined) {
      return this.extractDateValue(val.result);
    }
    return String(val).trim();
  }

  private formatDateObjToIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateString(str: string): { valid: boolean; isoDate?: string; error?: string } {
    const cleanStr = str.trim();

    // Check ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [y, m, d] = cleanStr.split('-').map(Number);
      if (this.isValidCalendarDate(y, m, d)) {
        return { valid: true, isoDate: cleanStr };
      }
    }

    // Check DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
      const day = Number(dmyMatch[1]);
      const month = Number(dmyMatch[2]);
      const year = Number(dmyMatch[3]);
      if (this.isValidCalendarDate(year, month, day)) {
        const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { valid: true, isoDate: iso };
      }
      return { valid: false, error: 'Invalid calendar day or month in date' };
    }

    return { valid: false, error: 'Unrecognized date format. Please use DD-MM-YYYY' };
  }

  private isValidCalendarDate(year: number, month: number, day: number): boolean {
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
  }
}
