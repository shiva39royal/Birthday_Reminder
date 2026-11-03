import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Power,
  Clock,
  Sparkles,
  Database,
  Archive,
  RotateCcw,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Folder,
  PartyPopper,
  Users,
  Trash2
} from 'lucide-react';
import { ApplicationSettings, AppInfo } from '../../../shared/types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isStartupEnabled, setIsStartupEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Test mode simulated date
  const [simulatedDate, setSimulatedDate] = useState('');

  const loadData = async () => {
    try {
      const [s, info, startup] = await Promise.all([
        window.birthdayBuddyAPI.getSettings(),
        window.birthdayBuddyAPI.getAppInfo(),
        window.birthdayBuddyAPI.isStartupEnabled()
      ]);
      setSettings(s);
      setAppInfo(info);
      setIsStartupEnabled(startup);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const updateSetting = async <K extends keyof ApplicationSettings>(key: K, val: ApplicationSettings[K]) => {
    if (!settings) return;
    try {
      const updated = await window.birthdayBuddyAPI.updateSettings({ [key]: val });
      setSettings(updated);
      showToast('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const handleStartupToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await window.birthdayBuddyAPI.enableStartup(settings?.reminder_delay_minutes || 5);
        setIsStartupEnabled(true);
      } else {
        await window.birthdayBuddyAPI.disableStartup();
        setIsStartupEnabled(false);
      }
      showToast(enabled ? 'Windows startup enabled!' : 'Windows startup disabled!');
    } catch (err) {
      console.error('Failed to toggle startup:', err);
    }
  };

  const handleBackup = async () => {
    try {
      const res = await window.birthdayBuddyAPI.createBackup();
      if (res.success) {
        showToast('Backup archive created successfully!');
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
    }
  };

  const handleLoadDemoData = async () => {
    try {
      const count = await window.birthdayBuddyAPI.seedDemoEmployees();
      showToast(`Loaded ${count} demo records with photos and today's celebration!`);
      loadData();
    } catch (err) {
      console.error('Failed to load demo employees:', err);
      showToast('Failed to load demo employees.');
    }
  };

  const handleResetAllData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to RESET all data?\n\nThis will permanently delete all employee records, saved photos, and reminder history, returning the application to a completely clean, fresh state.'
    );
    if (!confirmed) return;

    try {
      await window.birthdayBuddyAPI.resetAllData();
      showToast('All data deleted! The application is fresh and clean.');
      loadData();
    } catch (err) {
      console.error('Failed to reset all data:', err);
      showToast('Failed to reset data.');
    }
  };

  const handleRestore = async () => {
    const confirm = window.confirm(
      'Restoring a backup will overwrite existing database records and replace photos. Do you wish to continue?'
    );
    if (!confirm) return;

    try {
      const res = await window.birthdayBuddyAPI.restoreBackup();
      if (res.success) {
        showToast('Backup restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else if (res.message !== 'Cancelled by user') {
        alert(res.message);
      }
    } catch (err) {
      console.error('Failed to restore backup:', err);
    }
  };

  const handleExportEmployees = async () => {
    try {
      const path = await window.birthdayBuddyAPI.exportEmployeesExcel();
      if (path) {
        showToast('Exported employees to Excel successfully!');
      }
    } catch (err) {
      console.error('Failed to export employees:', err);
    }
  };

  const handleApplySimulatedDate = async () => {
    try {
      await window.birthdayBuddyAPI.setSimulatedDate(simulatedDate || null);
      showToast(
        simulatedDate
          ? `Simulated date active: ${simulatedDate}`
          : 'Reverted to actual Windows local date.'
      );
    } catch (err) {
      console.error('Failed to set simulated date:', err);
    }
  };

  if (!settings) {
    return <div className="p-8 text-center text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Application Settings</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Configure startup behavior, reminder delays, celebratory animations, and data backups.
        </p>
      </div>

      {/* Section 1: Windows Startup & Daily Reminders */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Windows Startup & Scheduling</h2>
            <p className="text-xs text-gray-500">
              Control automatic background check on Windows logon with configurable delays.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Start with Windows */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-800">Start Birthday Buddy with Windows</p>
              <p className="text-xs text-gray-500">
                Automatically checks for birthdays when you log into Windows without showing dashboards.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isStartupEnabled}
                onChange={e => handleStartupToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Reminder Delay */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-800">Logon Reminder Delay (Minutes)</p>
              <p className="text-xs text-gray-500">
                Waits after system login before checking for birthdays (Default: 5 minutes).
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="60"
                value={settings.reminder_delay_minutes}
                onChange={e => updateSetting('reminder_delay_minutes', Number(e.target.value) || 0)}
                className="w-16 px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="text-xs font-semibold text-gray-500">min</span>
            </div>
          </div>

          {/* Notifications Enabled */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-800">Daily Celebration Alerts</p>
              <p className="text-xs text-gray-500">
                Enable celebration banner popup when a team member's birthday is detected today.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_enabled}
                onChange={e => updateSetting('notification_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Section 2: Celebration Banner Styling */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Celebration Window Display</h2>
            <p className="text-xs text-gray-500">
              Customize celebratory graphics, greeting text, and animation effects.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-800">Confetti Burst Animations</p>
              <p className="text-xs text-gray-500">Launch celebratory confetti shower on alert open.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.confetti_enabled}
                onChange={e => updateSetting('confetti_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-800">Floating Balloons Effect</p>
              <p className="text-xs text-gray-500">Display gently floating balloons across the celebration window.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.balloons_enabled}
                onChange={e => updateSetting('balloons_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Greeting message */}
          <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1.5">
            <label className="block text-sm font-bold text-gray-800">Default Birthday Wish Greeting</label>
            <textarea
              rows={2}
              value={settings.greeting_message}
              onChange={e => updateSetting('greeting_message', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Leap Year Date Policy */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Leap Year (February 29) Policy</h2>
            <p className="text-xs text-gray-500">
              Choose when to celebrate employees born on February 29 during non-leap years.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => updateSetting('feb29_policy', 'feb28')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              settings.feb29_policy === 'feb28'
                ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <p className="font-bold text-sm text-gray-900">Celebrate on February 28</p>
            <p className="text-xs text-gray-500 mt-0.5">Celebrates on the last day of February (Recommended).</p>
          </button>

          <button
            onClick={() => updateSetting('feb29_policy', 'mar1')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              settings.feb29_policy === 'mar1'
                ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <p className="font-bold text-sm text-gray-900">Celebrate on March 1</p>
            <p className="text-xs text-gray-500 mt-0.5">Celebrates on the first day of March.</p>
          </button>
        </div>
      </div>

      {/* Section 4: Local Storage & Backups */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Data Management & Backups</h2>
            <p className="text-xs text-gray-500">
              100% offline local SQLite storage. Create complete ZIP archives including photos.
            </p>
          </div>
        </div>

        {appInfo && (
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
            <div className="flex items-start space-x-2">
              <Folder className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-gray-700">Database File:</span>
                <p className="font-mono text-gray-500 break-all select-all">{appInfo.dbPath}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Folder className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-gray-700">Photos Storage:</span>
                <p className="font-mono text-gray-500 break-all select-all">{appInfo.photosPath}</p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Data & Factory Reset Actions */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Demo Data & App Reset</h3>
            <p className="text-xs text-gray-500">
              Easily load the 6 pre-configured sample employees or wipe everything to start completely fresh.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleLoadDemoData}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200 transition-all cursor-pointer"
              title="Load 6 pre-configured demo employees with real portraits and today's birthdays"
            >
              <Users className="w-4 h-4 text-purple-200" />
              <span>Load Demo Data</span>
            </button>

            <button
              onClick={handleResetAllData}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition-all cursor-pointer"
              title="Delete all employee records, photos, and history to make the app completely fresh"
            >
              <Trash2 className="w-4 h-4 text-rose-200" />
              <span>Reset All Data</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleBackup}
            className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Archive className="w-4 h-4 text-emerald-400" />
            <span>Create Backup (ZIP)</span>
          </button>

          <button
            onClick={handleRestore}
            className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-purple-600" />
            <span>Restore from ZIP...</span>
          </button>

          <button
            onClick={handleExportEmployees}
            className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>Export Employees (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Section 5: Development & QA Simulation Tool */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl border border-purple-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Developer & QA Date Simulator</h2>
              <p className="text-xs text-purple-700">
                Test birthday notifications for any specific date without altering Windows system time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center pt-1">
          <input
            type="date"
            value={simulatedDate}
            onChange={e => setSimulatedDate(e.target.value)}
            className="px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold focus:outline-none"
          />
          <button
            onClick={handleApplySimulatedDate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-200"
          >
            Set Simulated Date
          </button>
          {simulatedDate && (
            <button
              onClick={() => {
                setSimulatedDate('');
                window.birthdayBuddyAPI.setSimulatedDate(null);
                showToast('Reset to real Windows system clock.');
              }}
              className="text-xs text-purple-600 hover:underline font-bold"
            >
              Reset to Actual System Time
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

