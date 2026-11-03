import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { BirthdayEmployee, ApplicationSettings } from '../../shared/types';
import { FlyingParrot } from './components/celebration/FlyingParrot';
import { SideBirthdayBlasts } from './components/celebration/SideBirthdayBlasts';

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
          launchConfetti();
        }
      }).catch(err => {
        console.error('Failed to load celebration data:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const launchConfetti = () => {
    const count = 180;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#a855f7', '#ec4899', '#f59e0b'] });
    fire(0.2, { spread: 60, colors: ['#3b82f6', '#10b981', '#f43f5e'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
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

  const greetingMessage =
    settings?.greeting_message || 'May your day be filled with joy, happiness, success, and wonderful memories!';

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Side Birthday Blasts & Wishes */}
      <SideBirthdayBlasts />

      {/* Close button in top-right corner */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={handleClose}
          className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          title="Dismiss Window"
        >
          <span className="text-xl">✕</span>
        </button>
      </div>

      {/* Top Section: Flying Parrot Mascot Announcement */}
      <div className="relative z-30 pt-1 pb-2">
        <FlyingParrot />
      </div>

      {/* Center Stage: Birthday Employee Cards */}
      <main className="relative z-20 flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center my-auto px-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-purple-200">Preparing celebration...</p>
          </div>
        ) : birthdays.length > 0 ? (
          <div className="w-full flex flex-col items-center">
            {/* Header Badge */}
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-xs font-bold uppercase tracking-wider shadow-sm">
                🎉 Honoring Today's Birthday Stars 🎉
              </span>
            </div>

            {/* Cards Grid */}
            <div
              className={`w-full grid gap-6 items-stretch justify-center max-h-[50vh] overflow-y-auto px-2 py-2 ${
                birthdays.length === 1
                  ? 'grid-cols-1 max-w-sm'
                  : birthdays.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-2xl'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl'
              }`}
            >
              {birthdays.map((emp) => (
                <div
                  key={emp.id}
                  className="relative group bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl transition-all duration-300 hover:scale-105 hover:border-pink-400/50"
                >
                  {/* Star Badge */}
                  <div className="absolute -top-3 right-5 bg-gradient-to-r from-amber-400 to-pink-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                    Birthday Star ⭐
                  </div>

                  {/* Photo or Initials */}
                  <div className="relative w-28 h-28 mb-3">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-400 animate-spin-slow blur-xs" />
                    <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-tr from-pink-500 to-amber-400 shadow-xl overflow-hidden flex items-center justify-center">
                      {emp.photoUrl ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.employee_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-indigo-900 flex items-center justify-center text-3xl font-extrabold text-pink-300">
                          {emp.employee_name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employee Info */}
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-pink-200 transition-colors">
                    {emp.employee_name}
                  </h3>
                  {emp.age !== undefined && emp.age > 0 && (
                    <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
                      Turning {emp.age} Today!
                    </p>
                  )}

                  {/* Greeting Text */}
                  <div className="mt-auto w-full pt-3 border-t border-white/10">
                    <p className="text-xs italic text-purple-200/90 font-medium">
                      "{greetingMessage}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-center shadow-2xl max-w-md">
            <div className="text-5xl mb-3 animate-bounce">🎈</div>
            <h2 className="text-2xl font-bold mb-2">No Birthdays Today</h2>
            <p className="text-sm text-purple-200/80">
              Everyone is hard at work! Check back tomorrow or seed sample records in Settings.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Action Footer with User-Requested "Ok, Thank You!" Button */}
      <footer className="relative z-30 w-full max-w-2xl mx-auto flex flex-col items-center gap-2 pb-2">
        <button
          onClick={handleAcknowledge}
          className="group relative inline-flex items-center justify-center px-10 py-3.5 font-bold text-lg text-white transition-all duration-300 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-xl shadow-teal-500/30 hover:scale-105 hover:shadow-teal-400/50 active:scale-95 border border-white/30 cursor-pointer"
        >
          <span className="mr-3 text-2xl group-hover:rotate-12 transition-transform">✅</span>
          <span>Ok, Thank You!</span>
        </button>
        <p className="text-[11px] text-purple-200/60 text-center">
          Clicking "Ok, Thank You!" records today's celebration as completed and closes the reminder.
        </p>
      </footer>
    </div>
  );
};

export default CelebrationApp;
