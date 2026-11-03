import React, { useState, useEffect } from 'react';

interface FlyingParrotProps {
  onLanded?: () => void;
}

export const FlyingParrot: React.FC<FlyingParrotProps> = ({ onLanded }) => {
  const [hasLanded, setHasLanded] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    // Parrot flies in for 1.8 seconds, then lands
    const landTimer = setTimeout(() => {
      setHasLanded(true);
      if (onLanded) onLanded();
    }, 1800);

    // Speech bubble pops up 400ms after landing
    const bubbleTimer = setTimeout(() => {
      setShowBubble(true);
    }, 2200);

    return () => {
      clearTimeout(landTimer);
      clearTimeout(bubbleTimer);
    };
  }, [onLanded]);

  return (
    <div className="relative flex flex-col items-center justify-center pointer-events-none z-30 mb-2">
      {/* Speech Announcement Bubble */}
      <div
        className={`transition-all duration-700 transform ${
          showBubble
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-75 translate-y-4'
        } mb-3 pointer-events-auto`}
      >
        <div className="relative bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-gray-950 font-black px-6 py-3.5 rounded-3xl shadow-2xl shadow-amber-500/30 border-2 border-white/80 max-w-lg text-center">
          <p className="text-sm sm:text-base leading-snug drop-shadow-sm flex items-center justify-center gap-2">
            <span>🦜</span>
            <span>
              &ldquo;Dear Sir / Ma&apos;am, we have something special today! We have to celebrate these birthdays!&rdquo;
            </span>
            <span>🎉</span>
          </p>
          {/* Speech Bubble Arrow pointing to the parrot below */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-amber-400"></div>
        </div>
      </div>

      {/* Parrot Flight & Perch Container */}
      <div
        className={`transition-all duration-[1800ms] cubic-bezier(0.25, 1, 0.5, 1) transform ${
          hasLanded
            ? 'translate-x-0 translate-y-0 scale-100 rotate-0'
            : '-translate-x-[120vw] translate-y-16 scale-90 rotate-12'
        }`}
      >
        <div className="relative flex flex-col items-center">
          {/* Vector Illustrated Tropical Scarlet Macaw Parrot */}
          <div className={`relative ${hasLanded ? 'animate-bounce-gentle' : ''}`}>
            <svg
              width="140"
              height="150"
              viewBox="0 0 200 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              {/* Long Tail Feathers */}
              <g className={hasLanded ? '' : 'origin-top animate-pulse'}>
                <path d="M96 160 C90 190 75 220 70 240 C80 230 100 205 105 170 Z" fill="#DC2626" />
                <path d="M104 160 C108 195 118 225 125 245 C115 228 105 198 102 170 Z" fill="#2563EB" />
                <path d="M100 160 C100 195 98 230 96 250 C102 230 104 195 102 170 Z" fill="#FBBF24" />
              </g>

              {/* Parrot Body (Crimson / Scarlet Red) */}
              <ellipse cx="100" cy="120" rx="36" ry="46" fill="#EF4444" />
              <path d="M78 120 C78 155 90 170 100 170 C110 170 122 155 122 120 Z" fill="#DC2626" />

              {/* Left Wing (Flapping when in flight) */}
              <g
                style={{
                  transformOrigin: '70px 105px',
                  animation: hasLanded ? 'none' : 'wingFlapLeft 0.22s ease-in-out infinite alternate',
                }}
              >
                <path d="M70 100 C45 85 25 120 40 145 C55 160 75 140 78 120 Z" fill="#DC2626" />
                <path d="M60 115 C45 105 35 125 45 140 C55 150 68 135 70 125 Z" fill="#FBBF24" />
                <path d="M50 125 C40 120 32 135 40 145 C48 152 58 142 60 135 Z" fill="#2563EB" />
              </g>

              {/* Right Wing (Flapping when in flight) */}
              <g
                style={{
                  transformOrigin: '130px 105px',
                  animation: hasLanded ? 'none' : 'wingFlapRight 0.22s ease-in-out infinite alternate',
                }}
              >
                <path d="M130 100 C155 85 175 120 160 145 C145 160 125 140 122 120 Z" fill="#DC2626" />
                <path d="M140 115 C155 105 165 125 155 140 C145 150 132 135 130 125 Z" fill="#FBBF24" />
                <path d="M150 125 C160 120 168 135 160 145 C152 152 142 142 140 135 Z" fill="#2563EB" />
              </g>

              {/* Parrot Head */}
              <circle cx="100" cy="74" r="30" fill="#EF4444" />

              {/* White Cheek Patch */}
              <ellipse cx="112" cy="74" rx="14" ry="12" fill="#F8FAFC" />

              {/* Eye with sparkle */}
              <circle cx="114" cy="73" r="5" fill="#0F172A" />
              <circle cx="116" cy="71" r="1.8" fill="#FFFFFF" />

              {/* Hooked Beak (Golden Ivory / Black tip) */}
              <path d="M124 67 C140 70 145 80 138 90 C132 86 126 84 122 84 Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
              <path d="M134 76 C143 80 140 88 136 90 Z" fill="#1E293B" />
              <path d="M122 84 C128 84 132 88 128 92 C124 92 122 88 122 84 Z" fill="#1E293B" />

              {/* Little Party Hat on Parrot Head */}
              <polygon points="90,48 104,18 116,50" fill="#F59E0B" />
              <line x1="94" y1="40" x2="112" y2="44" stroke="#EC4899" strokeWidth="2.5" />
              <line x1="97" y1="30" x2="109" y2="33" stroke="#3B82F6" strokeWidth="2.5" />
              <circle cx="104" cy="16" r="4" fill="#FFFFFF" />

              {/* Feet Claws (Clutching branch when landed) */}
              <circle cx="92" cy="168" r="4" fill="#94A3B8" />
              <circle cx="98" cy="169" r="4" fill="#94A3B8" />
              <circle cx="104" cy="169" r="4" fill="#94A3B8" />
              <circle cx="110" cy="168" r="4" fill="#94A3B8" />
            </svg>
          </div>

          {/* Golden Celebration Branch Perch (Appears when landed) */}
          {hasLanded && (
            <div className="w-48 h-3 -mt-3 rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 shadow-lg flex items-center justify-between px-2">
              <span className="text-xs">🌿</span>
              <span className="text-xs">🌸</span>
              <span className="text-xs">🌿</span>
            </div>
          )}
        </div>
      </div>

      {/* Embedded CSS for natural wing flapping */}
      <style>{`
        @keyframes wingFlapLeft {
          0% { transform: rotate(0deg) scaleY(1); }
          100% { transform: rotate(-38deg) scaleY(0.75); }
        }
        @keyframes wingFlapRight {
          0% { transform: rotate(0deg) scaleY(1); }
          100% { transform: rotate(38deg) scaleY(0.75); }
        }
      `}</style>
    </div>
  );
};

