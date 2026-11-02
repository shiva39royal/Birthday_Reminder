import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Cake, Sparkles, Heart, Check, X } from 'lucide-react';
import { BirthdayEmployee, ApplicationSettings } from '../../shared/types';

export const CelebrationApp: React.FC = () => {
  const [birthdays, setBirthdays] = useState<BirthdayEmployee[]>([]);
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.celebrationAPI.getCelebrationData().then(data => {
      setBirthdays(data.birthdays || []);
      setSettings(data.settings);
      setLoading(false);

      // Trigger Confetti if enabled in settings
      if (data.settings?.confetti_enabled !== false) {
        launchConfetti();
      }
    }).catch(console.error);
  }, []);

  const launchConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#a855f7', '#ec4899', '#f59e0b']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#3b82f6', '#10b981', '#f43f5e']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });
  };

  const handleAcknowledge = async () => {
    try {
      await window.celebrationAPI.acknowledge();
    } catch (err) {
      console.error('Failed to acknowledge reminder:', err);
    }
  };

  const handleClose = () => {
    window.celebrationAPI.closeWindow();
  };

  const greetingMessage =
    settings?.greeting_message || 'May your day be filled with happiness, success and wonderful memories!';

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white flex flex-col justify-between p-6 sm:p-8 overflow-hidden select-none">
      {/* Floating Balloons Background (if enabled) */}
      {settings?.balloons_enabled !== false && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="floating-balloon text-5xl left-[10%] [animation-delay:0s]">🎈</div>
          <div className="floating-balloon text-6xl left-[25%] [animation-delay:3s]">🎈</div>
          <div className="floating-balloon text-4xl left-[45%] [animation-delay:1.5s]">🎈</div>
          <div className="floating-balloon text-6xl left-[65%] [animation-delay:4.5s]">🎈</div>
          <div className="floating-balloon text-5xl left-[85%] [animation-delay:2s]">🎈</div>
        </div>
      )}

      {/* Top Bar with Close X */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300">
          <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
          <span>Birthday Alert Notification</span>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          title="Close (will remind again on next launch)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Banner Heading */}
      <div className="relative z-10 text-center space-y-2 my-auto py-4">
        <div className="inline-block animate-bounce-gentle">
          <span className="text-4xl">🎂</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-pink-300 to-purple-200 bg-clip-text text-transparent drop-shadow-md">
          🎉 TODAY IS A SPECIAL DAY! 🎂
        </h1>
        <p className="text-purple-200 font-semibold text-sm sm:text-base max-w-md mx-auto">
          Let's celebrate our awesome team members today!
        </p>

        {/* Birthday Employee Cards */}
        <div className="pt-6 pb-4 max-w-4xl mx-auto w-full">
          {birthdays.length > 0 ? (
            <div
              className={`grid gap-4 ${
                birthdays.length === 1
                  ? 'grid-cols-1 max-w-md mx-auto'
                  : birthdays.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {birthdays.map(emp => (
                <div
                  key={emp.id}
                  className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 text-center space-y-4 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform"
                >
                  {/* Glowing ambient ring */}
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-pink-500/20 rounded-full blur-2xl"></div>

                  {/* Photo Avatar */}
                  <div className="relative mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-400 shadow-xl shadow-purple-500/30">
                    <div className="w-full h-full rounded-full bg-purple-900 overflow-hidden flex items-center justify-center">
                      {emp.photoUrl ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.employee_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-black text-2xl text-amber-300">
                          {emp.employee_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 text-xl bg-purple-900 rounded-full p-0.5 border border-amber-400">
                      🎂
                    </span>
                  </div>

                  {/* Name & Greeting */}
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-gray-950 font-black text-[10px] uppercase tracking-wider inline-block">
                      Happy Birthday!
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">{emp.employee_name}</h3>
                    <p className="text-xs text-purple-200 italic px-2">
                      "{greetingMessage}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white/10 text-center">
              <p className="text-purple-200">No birthdays recorded for today.</p>
            </div>
          )}
        </div>
      </div>

      {/* Prominent Acknowledgement Button */}
      <div className="relative z-10 text-center pt-2">
        <button
          onClick={handleAcknowledge}
          className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-extrabold px-8 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all transform active:scale-95 text-base cursor-pointer"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>Okay, Thanks for the Reminder!</span>
        </button>
        <p className="text-[11px] text-purple-300/70 mt-2 font-medium">
          Acknowledging will dismiss today's alert and prevent repeated popups.
        </p>
      </div>
    </div>
  );
};

