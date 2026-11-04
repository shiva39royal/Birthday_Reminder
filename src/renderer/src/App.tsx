import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { EmployeeBirthdays } from './pages/EmployeeBirthdays';
import { ExcelImportExport } from './pages/ExcelImportExport';
import { ReminderHistory } from './pages/ReminderHistory';
import { Settings } from './pages/Settings';
import { AppInfo } from '../../shared/types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    window.birthdayBuddyAPI.getAppInfo().then((info: AppInfo) => {
      if (info?.version) {
        setAppVersion(info.version);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        appVersion={appVersion}
      />

      {/* Main Dynamic Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigateToEmployees={() => setActiveTab('employees')}
            onNavigateToExcel={() => setActiveTab('excel')}
          />
        )}
        {activeTab === 'employees' && <EmployeeBirthdays />}
        {activeTab === 'excel' && <ExcelImportExport />}
        {activeTab === 'history' && <ReminderHistory />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
};

