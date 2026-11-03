import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
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
          formula: `IF(B${i}<>"",A${i - 1}+1,"")`,
          result: i - 1
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
      { text: '   • Click the cell in Column D for that employee.' },
      { text: '   • Go to Insert > Pictures (Place in Cell or Place over Cells).' },
      { text: '   • Both "Place in Cell" and "Place over Cells" are fully supported!' },
      { text: '   • Supported formats: JPG, JPEG, PNG.' },
      { text: '   • Photos are automatically extracted, cropped, and displayed.' },
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

  private extractImagesFromWorkbook(
    workbook: ExcelJS.Workbook,
    filePath: string,
    worksheet: ExcelJS.Worksheet
  ): Map<number, { buffer: Buffer; extension: string }> {
    const imagesByRow = new Map<number, { buffer: Buffer; extension: string }>();

    // Strategy 1: ExcelJS getImages() parser
    try {
      const images = worksheet.getImages();
      for (const img of images) {
        const media = workbook.getImage(Number(img.imageId));
        if (media && media.buffer) {
          let targetRow: number | null = null;

          if (typeof (img as any).range === 'string') {
            const match = (img as any).range.match(/\d+/);
            if (match) targetRow = parseInt(match[0], 10);
          } else if (img.range?.tl) {
            const tlRow =
              (img.range.tl as any).nativeRow !== undefined
                ? (img.range.tl as any).nativeRow + 1
                : img.range.tl.row !== undefined
                ? Math.floor(img.range.tl.row) + 1
                : null;

            const brRow =
              (img.range.br as any)?.nativeRow !== undefined
                ? (img.range.br as any).nativeRow + 1
                : img.range.br?.row !== undefined
                ? Math.floor(img.range.br.row) + 1
                : null;

            if (tlRow !== null && brRow !== null) {
              targetRow = Math.round((tlRow + brRow) / 2);
            } else {
              targetRow = tlRow;
            }
          }

          if (targetRow !== null && targetRow >= 2) {
            const ext = (media.extension || 'jpeg').toLowerCase();
            const normalizedExt = ext === 'jpg' ? 'jpeg' : ext;
            imagesByRow.set(targetRow, {
              buffer: Buffer.from(media.buffer),
              extension: normalizedExt
            });
          }
        }
      }
    } catch (err) {
      log.warn('ExcelJS getImages() extraction warning:', err);
    }

    // Strategy 2: Direct Zip parsing via AdmZip
    // Catches modern Microsoft 365 "Place in Cell" (xl/cellimages.xml) and direct drawing relationships
    try {
      if (fs.existsSync(filePath)) {
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();
        const entryMap = new Map<string, AdmZip.IZipEntry>();
        for (const entry of zipEntries) {
          entryMap.set(entry.entryName.toLowerCase(), entry);
        }

        // 2A: Parse drawing1.xml and drawing1.xml.rels
        const drawingRelsEntry = entryMap.get('xl/drawings/_rels/drawing1.xml.rels');
        const drawingEntry = entryMap.get('xl/drawings/drawing1.xml');

        if (drawingEntry && drawingRelsEntry) {
          const relsXml = drawingRelsEntry.getData().toString('utf8');
          const drawingXml = drawingEntry.getData().toString('utf8');

          const relMap = new Map<string, string>();
          const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
          let relMatch: RegExpExecArray | null;
          while ((relMatch = relRegex.exec(relsXml)) !== null) {
            relMap.set(relMatch[1], relMatch[2].replace(/^(\.\.\/)+/, 'xl/'));
          }

          const anchorRegex = /<xdr:(twoCellAnchor|oneCellAnchor)[\s\S]*?<\/xdr:(twoCellAnchor|oneCellAnchor)>/g;
          let anchorMatch: RegExpExecArray | null;
          while ((anchorMatch = anchorRegex.exec(drawingXml)) !== null) {
            const anchorBlock = anchorMatch[0];
            const fromRowMatch = anchorBlock.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
            const toRowMatch = anchorBlock.match(/<xdr:to>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
            const blipMatch = anchorBlock.match(/<a:blip[^>]+r:embed="([^"]+)"/);

            if (fromRowMatch && blipMatch) {
              const fromRow = parseInt(fromRowMatch[1], 10) + 1;
              const toRow = toRowMatch ? parseInt(toRowMatch[1], 10) + 1 : fromRow;
              const targetRow = Math.round((fromRow + toRow) / 2);
              const rId = blipMatch[1];
              const targetPath = relMap.get(rId);

              if (targetRow >= 2 && targetPath && !imagesByRow.has(targetRow)) {
                const imgEntry = entryMap.get(targetPath.toLowerCase());
                if (imgEntry) {
                  const ext = path.extname(targetPath).replace('.', '').toLowerCase() || 'jpeg';
                  imagesByRow.set(targetRow, {
                    buffer: imgEntry.getData(),
                    extension: ext === 'jpg' ? 'jpeg' : ext
                  });
                }
              }
            }
          }
        }

        // 2B: Modern Excel "Place in Cell" support (xl/cellimages.xml)
        const cellimagesEntry = entryMap.get('xl/cellimages.xml');
        const cellimagesRelsEntry = entryMap.get('xl/_rels/cellimages.xml.rels');

        if (cellimagesEntry && cellimagesRelsEntry) {
          const cellXml = cellimagesEntry.getData().toString('utf8');
          const cellRelsXml = cellimagesRelsEntry.getData().toString('utf8');

          const cellRelMap = new Map<string, string>();
          const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
          let relMatch: RegExpExecArray | null;
          while ((relMatch = relRegex.exec(cellRelsXml)) !== null) {
            cellRelMap.set(relMatch[1], relMatch[2].replace(/^(\.\.\/)+/, 'xl/').replace(/^xl\//, 'xl/'));
          }

          const blipIds: string[] = [];
          const blipRegex = /<a:blip[^>]+r:embed="([^"]+)"/g;
          let bMatch: RegExpExecArray | null;
          while ((bMatch = blipRegex.exec(cellXml)) !== null) {
            blipIds.push(bMatch[1]);
          }

          // Try mapping by sheet1.xml formulas (e.g. <c r="D2"><f>_xlfn.DISPIMG(...) or vm=)
          const sheetEntry = entryMap.get('xl/worksheets/sheet1.xml');
          let mappedCount = 0;
          if (sheetEntry) {
            const sheetXml = sheetEntry.getData().toString('utf8');
            const cellRegex = /<c\s+r="([A-Z]+)(\d+)"[^>]*>[\s\S]*?(?:DISPIMG|cellImage|vm=)[\s\S]*?<\/c>/g;
            let cellMatch: RegExpExecArray | null;
            let idx = 0;
            while ((cellMatch = cellRegex.exec(sheetXml)) !== null && idx < blipIds.length) {
              const col = cellMatch[1];
              const row = parseInt(cellMatch[2], 10);
              if (col === 'D' && row >= 2 && !imagesByRow.has(row)) {
                const rId = blipIds[idx++];
                const targetPath = cellRelMap.get(rId);
                if (targetPath) {
                  const imgEntry = entryMap.get(targetPath.toLowerCase());
                  if (imgEntry) {
                    const ext = path.extname(targetPath).replace('.', '').toLowerCase() || 'jpeg';
                    imagesByRow.set(row, {
                      buffer: imgEntry.getData(),
                      extension: ext === 'jpg' ? 'jpeg' : ext
                    });
                    mappedCount++;
                  }
                }
              }
            }
          }

          // Fallback mapping: sequential cell images to rows
          if (mappedCount === 0 && blipIds.length > 0) {
            let curRow = 2;
            for (const rId of blipIds) {
              while (curRow <= worksheet.rowCount && imagesByRow.has(curRow)) {
                curRow++;
              }
              if (curRow <= worksheet.rowCount) {
                const targetPath = cellRelMap.get(rId);
                if (targetPath) {
                  const imgEntry = entryMap.get(targetPath.toLowerCase());
                  if (imgEntry) {
                    const ext = path.extname(targetPath).replace('.', '').toLowerCase() || 'jpeg';
                    imagesByRow.set(curRow, {
                      buffer: imgEntry.getData(),
                      extension: ext === 'jpg' ? 'jpeg' : ext
                    });
                  }
                }
                curRow++;
              }
            }
          }
        }

        // 2C: General fallback: If xl/media/ has images but imagesByRow is still empty, map sequentially to rows with employee names
        const mediaEntries = zipEntries
          .filter(e => e.entryName.toLowerCase().startsWith('xl/media/'))
          .sort((a, b) => a.entryName.localeCompare(b.entryName));

        if (mediaEntries.length > 0 && imagesByRow.size === 0) {
          log.info(`Found ${mediaEntries.length} media images in xl/media/; assigning sequentially to populated rows`);
          let mIdx = 0;
          for (let r = 2; r <= worksheet.rowCount && mIdx < mediaEntries.length; r++) {
            const rowObj = worksheet.getRow(r);
            const hasName = Boolean(rowObj.getCell(2).value);
            if (hasName && !imagesByRow.has(r)) {
              const entry = mediaEntries[mIdx++];
              const ext = path.extname(entry.entryName).replace('.', '').toLowerCase() || 'jpeg';
              imagesByRow.set(r, {
                buffer: entry.getData(),
                extension: ext === 'jpg' ? 'jpeg' : ext
              });
            }
          }
        }
      }
    } catch (zipErr) {
      log.warn('Zip extraction for Excel images encountered an issue:', zipErr);
    }

    log.info(`Extracted total ${imagesByRow.size} image(s) from Excel file`);
    return imagesByRow;
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

    // Extract images and map to row numbers using multi-strategy extractor
    const imagesByRow = this.extractImagesFromWorkbook(workbook, filePath, worksheet);

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
        const mimeExt = imgData.extension === 'jpg' ? 'jpeg' : imgData.extension;
        photoBase64 = `data:image/${mimeExt};base64,${imgData.buffer.toString('base64')}`;
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
