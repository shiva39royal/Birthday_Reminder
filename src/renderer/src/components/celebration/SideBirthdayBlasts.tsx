import React from 'react';

export const SideBirthdayBlasts: React.FC = () => {
  const leftWishes = [
    { text: '🎂 Happy Birthday!', icon: '🎈', delay: '0s', color: 'from-pink-500 to-rose-600' },
    { text: '✨ Wishing You Success!', icon: '🌟', delay: '2.5s', color: 'from-amber-400 to-orange-500' },
    { text: '🎉 Celebrate Good Times!', icon: '🎁', delay: '5s', color: 'from-purple-500 to-indigo-600' },
  ];

  const rightWishes = [
    { text: '🌟 Have a Blast!', icon: '✨', delay: '1.2s', color: 'from-cyan-400 to-blue-600' },
    { text: '🎁 Best Wishes & Joy!', icon: '🎊', delay: '3.8s', color: 'from-emerald-400 to-teal-600' },
    { text: '🎈 Cheers to You!', icon: '🍰', delay: '6.2s', color: 'from-pink-500 to-purple-600' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Left Side Blasts & Floating Wishes */}
      <div className="absolute left-2 sm:left-6 top-0 bottom-0 w-44 sm:w-56 flex flex-col justify-around py-12">
        {leftWishes.map((w, idx) => (
          <div
            key={idx}
            className="animate-float-wish transform -rotate-3"
            style={{ animationDelay: w.delay }}
          >
            <div className="relative group flex items-center space-x-2">
              {/* Sparkle firework blast burst */}
              <div className="absolute -left-3 -top-3 text-2xl animate-spin text-amber-300">
                ✨
              </div>
              <div
                className={`bg-gradient-to-r ${w.color} text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-2xl shadow-xl shadow-purple-900/50 border border-white/30 flex items-center space-x-2`}
              >
                <span>{w.icon}</span>
                <span>{w.text}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right Side Blasts & Floating Wishes */}
      <div className="absolute right-2 sm:right-6 top-0 bottom-0 w-44 sm:w-56 flex flex-col justify-around py-12 items-end">
        {rightWishes.map((w, idx) => (
          <div
            key={idx}
            className="animate-float-wish transform rotate-3"
            style={{ animationDelay: w.delay }}
          >
            <div className="relative group flex items-center space-x-2">
              <div
                className={`bg-gradient-to-r ${w.color} text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-2xl shadow-xl shadow-purple-900/50 border border-white/30 flex items-center space-x-2`}
              >
                <span>{w.icon}</span>
                <span>{w.text}</span>
              </div>
              {/* Sparkle firework blast burst */}
              <div className="absolute -right-3 -top-3 text-2xl animate-spin text-pink-300">
                🌟
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Corner Fireworks / Particle Blasts */}
      <div className="absolute top-8 left-10 text-4xl animate-pulse">🎆</div>
      <div className="absolute top-12 right-12 text-4xl animate-pulse">🎇</div>
      <div className="absolute bottom-16 left-12 text-3xl animate-bounce">💥</div>
      <div className="absolute bottom-14 right-14 text-3xl animate-bounce">✨</div>

      {/* Embedded CSS for smooth upward floating wishes */}
      <style>{`
        @keyframes floatWish {
          0% {
            transform: translateY(20px) scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-15px) scale(1.03);
            opacity: 1;
          }
          100% {
            transform: translateY(20px) scale(0.9);
            opacity: 0.8;
          }
        }
        .animate-float-wish {
          animation: floatWish 4.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

