import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  History,
  Settings,
  Info,
  Cake,
  Calendar,
  Database
} from 'lucide-react';

export type NavTab = 'dashboard' | 'employees' | 'excel' | 'history' | 'settings' | 'about';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  appVersion: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, appVersion }) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'employees', label: 'Employee Birthdays', icon: <Users className="w-5 h-5" /> },
    { id: 'excel', label: 'Excel Import / Export', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'history', label: 'Reminder History', icon: <History className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'about', label: 'About', icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between select-none shadow-sm h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-100 flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
            <Cake className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-base leading-tight">Birthday Buddy</h1>
            <p className="text-xs text-purple-600 font-medium">Never Miss a Birthday!</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-300 font-semibold'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-gray-600 font-medium">SQLite DB</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Connected</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-500 pt-1">
          <span className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            <span>Today</span>
          </span>
          <span className="font-medium text-gray-700">{currentDate}</span>
        </div>

        <div className="pt-2 text-center border-t border-gray-200/60 text-[11px] text-gray-400">
          Birthday Buddy v{appVersion}
        </div>
      </div>
    </aside>
  );
};

