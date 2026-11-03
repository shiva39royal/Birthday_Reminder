import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { BirthdayEmployee, ApplicationSettings } from '../../shared/types';
import { Award, Check, Sparkles, X } from 'lucide-react';

export const CelebrationApp: React.FC = () => {
  const [birthdays, setBirthdays] = useState<BirthdayEmployee[]>([]);
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.celebrationAPI) {
      window.celebrationAPI.getCelebrationData().then(data => {
        setBirthdays(data.birthdays || []);
        setSettings(data.settings);
        setLoading(false);

        if (data.settings?.confetti_enabled !== false) {
          triggerExecutiveConfetti();
        }
      }).catch(err => {
        console.error('Failed to load celebration data:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const triggerExecutiveConfetti = () => {
    // Elegant, tasteful golden & champagne particle shower
    const count = 120;
    const defaults = { origin: { y: 0.6 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.3, { spread: 35, startVelocity: 45, colors: ['#f59e0b', '#fbbf24', '#ffffff'] });
    fire(0.25, { spread: 60, colors: ['#6366f1', '#38bdf8', '#fbbf24'] });
    fire(0.2, { spread: 90, decay: 0.92, scalar: 0.9, colors: ['#e0e7ff', '#fef3c7'] });
    fire(0.25, { spread: 110, startVelocity: 30, colors: ['#f59e0b', '#10b981'] });
  };

  const handleAcknowledge = async () => {
    try {
      if (window.celebrationAPI) {
        await window.celebrationAPI.acknowledge();
      }
    } catch (err) {
      console.error('Failed to acknowledge reminder:', err);
    }
  };

  const handleClose = () => {
    if (window.celebrationAPI) {
      window.celebrationAPI.closeWindow();
    }
  };

  const formatBirthDate = (isoStr: string) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-5xl mx-auto flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-500 flex items-center justify-center text-gray-950 shadow-lg shadow-amber-500/20">
            <Award className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-amber-400">
                Company Birthday Honors
              </span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span className="text-xs text-slate-400">{todayFormatted}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Honoring Our Team Members Today
            </h1>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Close (Will remind again in 5 minutes until you click 'Ok, Thank You!')"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Center Stage: Professional Employee Cards */}
      <main className="relative z-20 flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center py-6 px-2">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-300 text-sm">Loading celebration details...</p>
          </div>
        ) : birthdays.length > 0 ? (
          <div className="w-full flex flex-col items-center">
            {/* Cards Grid */}
            <div
              className={`w-full grid gap-8 items-stretch justify-center max-h-[58vh] overflow-y-auto px-4 py-2 ${
                birthdays.length === 1
                  ? 'grid-cols-1 max-w-md'
                  : birthdays.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl'
              }`}
            >
              {birthdays.map((emp) => (
                <div
                  key={emp.id}
                  className="relative group bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-2xl border border-white/15 rounded-3xl p-7 flex flex-col items-center text-center shadow-2xl transition-all duration-300 hover:border-amber-400/50 hover:shadow-amber-500/10"
                >
                  {/* Top Badge */}
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Birthday Star</span>
                  </div>

                  {/* Circular Portrait Photo */}
                  <div className="relative w-36 h-36 mb-5">
                    <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-xl overflow-hidden flex items-center justify-center">
                      {emp.photoUrl ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.employee_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-4xl font-extrabold text-amber-300">
                          {emp.employee_name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employee Name */}
                  <h2 className="text-2xl font-black text-white tracking-tight mb-1.5">
                    {emp.employee_name}
                  </h2>

                  {/* Age Milestone */}
                  {emp.age !== undefined && emp.age > 0 && (
                    <div className="inline-block px-3 py-1 rounded-lg bg-white/10 text-amber-300 text-xs font-bold tracking-wide mb-2">
                      Turning {emp.age} Years Today
                    </div>
                  )}

                  {/* Birth Date */}
                  <p className="text-xs text-slate-300 font-medium">
                    Born {formatBirthDate(emp.date_of_birth)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">No Birthdays Today</h3>
            <p className="text-xs text-slate-400">
              There are no team birthdays scheduled for today. Check upcoming dates on the dashboard.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Action Footer with Clean "Ok, Thank You!" Button */}
      <footer className="relative z-20 w-full max-w-xl mx-auto flex flex-col items-center gap-2 pt-4 border-t border-white/10">
        <button
          onClick={handleAcknowledge}
          className="group relative inline-flex items-center justify-center px-10 py-3.5 font-bold text-base text-white transition-all duration-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl shadow-xl shadow-teal-950/60 active:scale-95 border border-emerald-400/30 cursor-pointer"
        >
          <Check className="w-5 h-5 mr-2 stroke-[3]" />
          <span>Ok, Thank You!</span>
        </button>
        <p className="text-[11px] text-slate-400 text-center">
          Clicking "Ok, Thank You!" records today's celebration as completed. Closing with ✕ will remind again in 5 minutes.
        </p>
      </footer>
    </div>
  );
};

export default CelebrationApp;
