import React, { useEffect, useState } from 'react';
import { Cake, ShieldCheck, Heart, Sparkles, Cpu, HardDrive } from 'lucide-react';
import { AppInfo } from '../../../shared/types';

export const About: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    window.birthdayBuddyAPI.getAppInfo().then(setAppInfo).catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Brand Hero Card */}
      <div className="text-center space-y-4 p-8 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 text-white shadow-xl shadow-purple-200">
        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md p-4 mx-auto shadow-inner flex items-center justify-center">
          <Cake className="w-12 h-12 text-white animate-bounce-gentle" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Birthday Buddy</h1>
          <p className="text-purple-100 font-semibold text-sm">Team Birthday Reminder Desktop Application</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-white">
            Version {appInfo?.version || '1.0.0'} (Production Release)
          </span>
        </div>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center space-x-3 text-emerald-600">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">100% Private, Offline & Secure</h2>
            <p className="text-xs text-gray-500">Your organization's employee records never leave this machine.</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed pl-13">
          Birthday Buddy is engineered to run entirely on your local Windows workstation. All employee names, dates of birth, and extracted photographs are stored in a local SQLite database in your Windows user AppData directory. There are zero cloud databases, zero external telemetry or tracking, and zero subscription requirements.
        </p>
      </div>

      {/* System Specifications */}
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-xs text-gray-400">
          Runtime Environment & Architecture
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-semibold text-[10px] uppercase">Framework</span>
            <p className="font-bold text-gray-800">Electron 34</p>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-semibold text-[10px] uppercase">Frontend</span>
            <p className="font-bold text-gray-800">React 19 + Vite</p>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-semibold text-[10px] uppercase">Database Engine</span>
            <p className="font-bold text-gray-800">SQLite (WASM/C)</p>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-semibold text-[10px] uppercase">Excel Engine</span>
            <p className="font-bold text-gray-800">ExcelJS</p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>© 2026 Birthday Buddy. Designed for reliable team celebrations.</p>
        <p className="flex items-center justify-center space-x-1">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
          <span>for Windows 10 & Windows 11</span>
        </p>
      </div>
    </div>
  );
};

