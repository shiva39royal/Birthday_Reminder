import React, { useEffect, useState } from 'react';
import { History, Search, Calendar, CheckCircle2, Clock, Check } from 'lucide-react';
import { ReminderHistoryRecord } from '../../../shared/types';

export const ReminderHistory: React.FC = () => {
  const [history, setHistory] = useState<ReminderHistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await window.birthdayBuddyAPI.getReminderHistory({
        search: searchQuery || undefined,
        date: dateFilter || undefined
      });
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [searchQuery, dateFilter]);

  const formatIsoDate = (isoStr: string) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (isoTimestamp: string | null) => {
    if (!isoTimestamp) return '—';
    try {
      const d = new Date(isoTimestamp);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoTimestamp;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reminder History</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Audit log of all daily birthday alerts shown and acknowledged by users.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Filter Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-xs focus:outline-none"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-purple-600 hover:underline font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-14 text-center">Photo</th>
                  <th className="py-3 px-4">Celebrated Employee</th>
                  <th className="py-3 px-4">Reminder Date</th>
                  <th className="py-3 px-4">Acknowledgement Status</th>
                  <th className="py-3 px-4 text-right">Acknowledged Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 mx-auto flex items-center justify-center overflow-hidden border border-purple-100">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.employee_name_snapshot}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-purple-600 text-sm">
                            {item.employee_name_snapshot.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">{item.employee_name_snapshot}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">
                      {formatIsoDate(item.reminder_date)}
                    </td>
                    <td className="py-3 px-4">
                      {item.acknowledged_at ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Acknowledged</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Pending Acknowledgement</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-gray-500">
                      {formatDateTime(item.acknowledged_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-xl">
              <History className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">No reminder history recorded yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Whenever birthdays are detected and celebrated on Windows login, an audit trail record will be preserved here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

