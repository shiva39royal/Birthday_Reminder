import React, { useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ImportPreviewRow, ImportSummary } from '../../../shared/types';

export const ExcelImportExport: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Template Download Handler
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      setDownloadMsg(null);
      const res = await window.birthdayBuddyAPI.generateTemplate();
      if (res.success && res.filePath) {
        setDownloadMsg({
          type: 'success',
          text: `Template saved successfully! Saved to: ${res.filePath}`
        });
      } else if (res.error !== 'Cancelled by user') {
        setDownloadMsg({
          type: 'error',
          text: res.error || 'Failed to generate template'
        });
      }
    } catch (err: any) {
      setDownloadMsg({
        type: 'error',
        text: err?.message || 'Error generating template'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Upload File Selection Handler
  const handleSelectFile = async () => {
    try {
      const filePath = await window.birthdayBuddyAPI.openFileDialog({
        title: 'Select Completed Birthday Excel File',
        filters: [{ name: 'Excel Workbooks', extensions: ['xlsx'] }]
      });
      if (filePath) {
        processUploadedFile(filePath);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx')) {
        // Electron web file path
        const path = (file as any).path;
        if (path) {
          processUploadedFile(path);
        }
      } else {
        setParseError('Please upload an .xlsx Excel file');
      }
    }
  };

  const processUploadedFile = async (filePath: string) => {
    try {
      setSelectedFile(filePath);
      setIsParsing(true);
      setParseError(null);
      setImportSummary(null);

      const rows = await window.birthdayBuddyAPI.parseExcelFile(filePath);
      setPreviewRows(rows);

      if (rows.length === 0) {
        setParseError('The uploaded workbook contains no data rows to import.');
      }
    } catch (err: any) {
      setParseError(err?.message || 'Failed to read Excel workbook');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDuplicateResolutionChange = (rowNum: number, res: 'add' | 'skip' | 'update') => {
    setPreviewRows(prev =>
      prev.map(r => (r.rowNumber === rowNum ? { ...r, duplicateResolution: res } : r))
    );
  };

  const handleCommitImport = async () => {
    try {
      setIsImporting(true);
      const summary = await window.birthdayBuddyAPI.commitImport(previewRows);
      setImportSummary(summary);
    } catch (err: any) {
      setParseError(err?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadErrorReport = async () => {
    if (!importSummary || importSummary.errors.length === 0) return;
    try {
      await window.birthdayBuddyAPI.exportErrors(importSummary.errors);
    } catch (err) {
      console.error('Failed to export error report:', err);
    }
  };

  const handleResetImport = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setImportSummary(null);
    setParseError(null);
  };

  const validCount = previewRows.filter(r => r.status === 'valid').length;
  const warningCount = previewRows.filter(r => r.status === 'warning').length;
  const errorCount = previewRows.filter(r => r.status === 'invalid').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Excel Import & Export</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Download standardized templates with embedded image instructions, and bulk import employee birthdays seamlessly.
        </p>
      </div>

      {/* Two Column Grid: Template Download & File Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Download Template Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-white to-pink-50 border border-purple-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100/70 px-2.5 py-0.5 rounded-full">
                Step 1: Download
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-1">Get Excel Template</h2>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Download <span className="font-semibold text-gray-800">Team_Birthday_Template.xlsx</span>. Features automatic serial numbers, pre-formatted date cells, and embedded photograph cells ready for your team.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-purple-100/80 text-xs text-gray-600 space-y-1.5 font-medium">
              <div className="flex items-center space-x-2 text-purple-700 font-semibold">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Template Features Included:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-gray-500 pl-1">
                <li>Dynamic serial numbers that populate as you type names</li>
                <li>Clear step-by-step instructions tab with image insertion guide</li>
                <li>Built-in validation styling and DD-MM-YYYY date formats</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="w-full flex items-center justify-center space-x-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-2xl shadow-md shadow-purple-200 transition-all transform active:scale-95 text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Generating Workbook...' : 'Download Excel Template'}</span>
            </button>

            {downloadMsg && (
              <p
                className={`text-xs text-center font-medium ${
                  downloadMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {downloadMsg.text}
              </p>
            )}
          </div>
        </div>

        {/* Step 2: Upload Completed File Card */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Step 2: Upload
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-1">Upload Completed File</h2>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Upload your completed Excel workbook. Photos will be automatically extracted, dates verified, and duplicate records detected.
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={handleSelectFile}
              className="border-2 border-dashed border-gray-200 hover:border-purple-400 bg-gray-50/60 hover:bg-purple-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
            >
              <FileSpreadsheet className="w-10 h-10 text-purple-500 mx-auto" />
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {selectedFile ? selectedFile.split(/[\\/]/).pop() : 'Click to select or drag & drop .xlsx'}
                </p>
                <p className="text-xs text-gray-400">Microsoft Excel (.xlsx) workbooks only</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSelectFile}
            disabled={isParsing}
            className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-black text-white font-bold py-3 px-5 rounded-2xl shadow-md transition-all text-sm disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isParsing ? 'Analyzing Workbook...' : 'Browse & Upload Excel'}</span>
          </button>
        </div>
      </div>

      {/* Parse Error Banner */}
      {parseError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center space-x-3 text-red-700 text-sm">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Import Preview Section */}
      {previewRows.length > 0 && !importSummary && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">Import Verification Preview</h2>
              <p className="text-xs text-gray-500">
                Review verified records and embedded photos before committing them to the local database.
              </p>
            </div>

            {/* Counts Pills */}
            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                ✓ {validCount} Valid
              </span>
              {warningCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                  ⚠ {warningCount} Duplicates
                </span>
              )}
              {errorCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
                  ✕ {errorCount} Errors
                </span>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-96 rounded-2xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">Row</th>
                  <th className="py-2.5 px-3 w-16 text-center">Photo</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Date of Birth</th>
                  <th className="py-2.5 px-3">Verification Status</th>
                  <th className="py-2.5 px-3 text-right">Duplicate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {previewRows.map(row => (
                  <tr
                    key={row.rowNumber}
                    className={
                      row.status === 'invalid'
                        ? 'bg-red-50/40'
                        : row.status === 'warning'
                        ? 'bg-amber-50/30'
                        : 'hover:bg-gray-50/60'
                    }
                  >
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-400">
                      #{row.rowNumber}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 mx-auto flex items-center justify-center overflow-hidden border border-gray-200">
                        {row.photoBase64 ? (
                          <img src={row.photoBase64} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{row.employeeName || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-600">{row.dob || '—'}</td>
                    <td className="py-2.5 px-3">
                      {row.status === 'valid' && (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ready to Import</span>
                        </span>
                      )}
                      {row.status === 'warning' && (
                        <span className="inline-flex items-center space-x-1 text-amber-600 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Already exists in database</span>
                        </span>
                      )}
                      {row.status === 'invalid' && (
                        <div className="text-red-600 font-medium space-y-0.5">
                          {row.errors.map((err, i) => (
                            <p key={i} className="flex items-center space-x-1">
                              <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                              <span>{err}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.isDuplicate ? (
                        <select
                          value={row.duplicateResolution || 'skip'}
                          onChange={e =>
                            handleDuplicateResolutionChange(
                              row.rowNumber,
                              e.target.value as 'add' | 'skip' | 'update'
                            )
                          }
                          className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none"
                        >
                          <option value="skip">Skip Record</option>
                          <option value="update">Update Existing</option>
                          <option value="add">Add as Duplicate</option>
                        </select>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleResetImport}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCommitImport}
                disabled={isImporting || validCount + warningCount === 0}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-200 disabled:opacity-50 transition-all transform active:scale-95"
              >
                <span>{isImporting ? 'Importing Records...' : `Import ${validCount + warningCount} Records`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Summary Card */}
      {importSummary && (
        <div className="rounded-3xl p-6 bg-white border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Employee Birthday Records Imported Successfully! 🎉
              </h2>
              <p className="text-xs text-gray-500">
                Processed {importSummary.total} rows: {importSummary.imported} imported, {importSummary.skipped} skipped.
              </p>
            </div>
          </div>

          {importSummary.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 space-y-2">
              <p className="text-xs font-bold text-red-700">
                {importSummary.errors.length} rows could not be imported due to validation errors.
              </p>
              <button
                onClick={handleDownloadErrorReport}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download Error Report (.xlsx)</span>
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleResetImport}
              className="flex items-center space-x-2 text-xs font-bold text-purple-600 hover:text-purple-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Import Another File</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

