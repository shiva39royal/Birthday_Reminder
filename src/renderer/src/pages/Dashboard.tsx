import React, { useEffect, useState } from 'react';
import { Cake, Calendar, Sparkles, ChevronRight, Gift } from 'lucide-react';
import { SummaryCard } from '../components/SummaryCard';
import { DashboardStats, BirthdayEmployee } from '../../../shared/types';

interface DashboardProps {
  onNavigateToEmployees: () => void;
  onNavigateToExcel: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToEmployees, onNavigateToExcel }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    todayCount: 0,
    upcomingCount: 0,
    nextBirthday: null
  });
  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayEmployee[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, today, up] = await Promise.all([
        window.birthdayBuddyAPI.getDashboardStats(),
        window.birthdayBuddyAPI.getTodayBirthdays(),
        window.birthdayBuddyAPI.getUpcomingBirthdays(30)
      ]);
      setStats(s);
      setTodayBirthdays(today);
      setUpcomingBirthdays(up);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDateDisplay = (dobStr: string) => {
    if (!dobStr) return '';
    const parts = dobStr.trim().split(/[-/.]/).map(Number);
    if (parts.length === 2) {
      const [d, m] = parts;
      const date = new Date(2024, m - 1, d);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    if (parts.length === 3) {
      const [y, m, d] = parts[0] > 1000 ? [parts[0], parts[1], parts[2]] : [parts[2], parts[1], parts[0]];
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    return dobStr;
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-purple-200">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-purple-100 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Daily Team Birthday Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome to Birthday Buddy! 🎉
          </h1>
          <p className="text-purple-100 text-sm max-w-xl">
            Track employee birthdays effortlessly, download templates, and get automatic daily celebration notifications.
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <SummaryCard
          title="Today's Birthdays"
          value={stats.todayCount}
          subtitle={stats.todayCount > 0 ? 'Ready to celebrate! 🎂' : 'No birthdays today'}
          icon={<Cake className="w-6 h-6" />}
          accentColor="pink"
        />
        <SummaryCard
          title="Upcoming (30 Days)"
          value={stats.upcomingCount}
          subtitle="Coming up next"
          icon={<Calendar className="w-6 h-6" />}
          accentColor="blue"
        />
        <SummaryCard
          title="Next Birthday"
          value={stats.nextBirthday ? stats.nextBirthday.name : 'None'}
          subtitle={
            stats.nextBirthday
              ? `In ${stats.nextBirthday.daysRemaining} day${stats.nextBirthday.daysRemaining === 1 ? '' : 's'} (${formatDateDisplay(stats.nextBirthday.date)})`
              : 'Upcoming celebration'
          }
          icon={<Gift className="w-6 h-6" />}
          accentColor="amber"
        />
      </div>

      {/* Today's Birthday Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
            <h2 className="text-lg font-bold text-gray-900">Today's Birthdays</h2>
          </div>
          {todayBirthdays.length > 0 && (
            <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-bold">
              Celebrations Today!
            </span>
          )}
        </div>

        {todayBirthdays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {todayBirthdays.map(emp => (
              <div
                key={emp.id}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 p-6 text-white shadow-lg shadow-purple-200 flex items-center space-x-5"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 p-1 backdrop-blur-md shadow-inner flex items-center justify-center overflow-hidden">
                    {emp.photoUrl ? (
                      <img
                        src={emp.photoUrl}
                        alt={emp.employee_name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-purple-200 text-purple-700 flex items-center justify-center font-bold text-xl">
                        {emp.employee_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-2xl">🎂</span>
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-gray-900 font-extrabold text-[11px] uppercase tracking-wider inline-block">
                    Happy Birthday!
                  </span>
                  <h3 className="text-xl font-black">{emp.employee_name}</h3>
                  <p className="text-purple-100 text-xs">
                    {emp.age && emp.age > 0 ? `Turning ${emp.age} today • ` : ''}Birthday: {formatDateDisplay(emp.date_of_birth)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center space-y-3 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-2xl">
              🎈
            </div>
            <h3 className="font-bold text-gray-800 text-base">No birthdays today</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You're all caught up for today! When team members have birthdays, they will proudly appear right here.
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Birthdays Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Upcoming Birthdays (Next 30 Days)</h2>
          </div>
          <button
            onClick={onNavigateToEmployees}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center space-x-1"
          >
            <span>View All Employees</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingBirthdays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {upcomingBirthdays.map(emp => (
              <div
                key={emp.id}
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center space-x-3.5"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden border border-purple-100 shrink-0">
                  {emp.photoUrl ? (
                    <img src={emp.photoUrl} alt={emp.employee_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-purple-600 text-base">
                      {emp.employee_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm truncate">{emp.employee_name}</p>
                  <p className="text-xs text-gray-500">{formatDateDisplay(emp.nextBirthdayDate)}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[10px]">
                    In {emp.daysRemaining} day{emp.daysRemaining === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center bg-gray-50/50 space-y-2">
            <p className="text-sm text-gray-500 font-medium">No upcoming birthdays in the next 30 days.</p>
            {stats.todayCount === 0 && stats.upcomingCount === 0 && !stats.nextBirthday && (
              <button
                onClick={onNavigateToExcel}
                className="text-xs font-bold text-purple-600 hover:underline inline-block mt-1"
              >
                Import employees via Excel to get started →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

