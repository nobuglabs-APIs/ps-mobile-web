import React from 'react';

interface PSLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDarkBg?: boolean;
  className?: string;
}

export const PSLogo: React.FC<PSLogoProps> = ({
  variant = 'full',
  size = 'md',
  isDarkBg = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { iconSize: 32, textScale: 'scale-75 origin-left' },
    md: { iconSize: 44, textScale: 'scale-90 origin-left' },
    lg: { iconSize: 64, textScale: 'scale-100' },
    xl: { iconSize: 108, textScale: 'scale-110' },
  };

  const currentSize = sizeMap[size];

  // SVG PS Emblem Icon with high fidelity to image
  const Emblem = (
    <svg
      width={currentSize.iconSize}
      height={currentSize.iconSize}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300"
    >
      <defs>
        <linearGradient id="blueArcGrad" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0056d6" />
          <stop offset="60%" stopColor="#084298" />
          <stop offset="100%" stopColor="#0a1e42" />
        </linearGradient>
        <linearGradient id="goldArcGrad" x1="140" y1="20" x2="60" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="goldLetterGrad" x1="70" y1="40" x2="135" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="40%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="navyLetterGrad" x1="30" y1="30" x2="90" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#082f6f" />
          <stop offset="100%" stopColor="#091a38" />
        </linearGradient>
        <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Main outer dynamic swoosh - Blue Arc */}
      <path
        d="M 52 24 C 26 38 12 68 18 98 C 24 126 50 148 78 148 C 86 148 94 146 102 142 C 90 142 66 138 52 122 C 34 102 34 70 48 44 C 54 34 62 27 72 22 C 65 22 58 22 52 24 Z"
        fill="url(#blueArcGrad)"
        filter="url(#softGlow)"
      />

      {/* Golden secondary swoosh arc */}
      <path
        d="M 112 136 C 134 122 148 94 142 66 C 136 38 114 18 86 18 C 96 22 110 30 118 42 C 128 58 128 86 116 108 C 108 122 96 130 84 134 C 94 136 104 136 112 136 Z"
        fill="url(#goldArcGrad)"
      />

      {/* Digital pixel squares floating at upper-right */}
      <rect x="114" y="24" width="6" height="6" fill="#0056d6" rx="1" />
      <rect x="124" y="20" width="7" height="7" fill="#0284c7" rx="1" />
      <rect x="135" y="26" width="5" height="5" fill="#38bdf8" rx="1" />
      <rect x="128" y="32" width="6" height="6" fill="#0369a1" rx="1" />
      <rect x="138" y="36" width="7" height="7" fill="#0056d6" rx="1" />
      <rect x="146" y="28" width="5" height="5" fill="#0284c7" rx="1" />
      <rect x="142" y="46" width="6" height="6" fill="#0a1e42" rx="1" />
      <rect x="148" y="55" width="4" height="4" fill="#38bdf8" rx="1" />

      {/* Letter 'P' - stylized dynamic navy */}
      <path
        d="M 46 44 C 46 41 48 39 52 39 L 76 39 C 91 39 100 48 100 61 C 100 73 90 82 76 82 L 63 82 L 63 118 C 63 121 61 123 58 123 L 49 123 C 46 123 44 121 44 118 L 44 46 C 44 45 45 44 46 44 Z M 63 53 L 63 68 L 74 68 C 80 68 85 65 85 60.5 C 85 56 80 53 74 53 L 63 53 Z"
        fill="url(#navyLetterGrad)"
      />

      {/* Letter 'S' - dynamic intertwined vibrant gold */}
      <path
        d="M 98 56 C 105 56 112 59 116 64 C 117 66 117 68 115 69 L 108 74 C 106 75 104 75 102 73 C 98 69 94 67 89 67 C 82 67 77 71 77 76 C 77 82 82 85 91 88 L 96 90 C 109 94 118 100 118 111 C 118 123 107 131 93 131 C 83 131 74 127 68 120 C 67 118 67 116 69 115 L 77 109 C 78 108 81 108 83 110 C 86 115 91 118 96 118 C 103 118 107 114 107 109 C 107 103 101 100 93 97 L 88 95 C 76 91 67 85 67 74 C 67 63 78 56 98 56 Z"
        fill="url(#goldLetterGrad)"
        filter="url(#softGlow)"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {Emblem}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
        {Emblem}
        <div className="flex flex-col min-w-0">
          <span className={`font-black tracking-wide leading-none text-sm sm:text-base truncate ${isDarkBg ? 'text-white' : 'text-[#0a1e42]'}`}>
            PS COMÉRCIO
          </span>
          <span className={`text-[9px] font-bold tracking-wider leading-tight truncate mt-0.5 ${isDarkBg ? 'text-[#d49419]' : 'text-amber-600'}`}>
            & PRESTAÇÃO DE SERVIÇOS
          </span>
        </div>
      </div>
    );
  }

  // Full identity matching the login card and A4 header
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      <div className="mb-2 transition-transform hover:scale-105 duration-300">
        {Emblem}
      </div>

      <div className="flex flex-col items-center">
        <div className="text-xl font-black tracking-tight text-[#0a1e42] leading-none mb-1">
          COMÉRCIO &
        </div>
        <div className="text-sm font-extrabold tracking-wider text-[#0a1e42] leading-none mb-2">
          PRESTAÇÃO DE SERVIÇOS
        </div>

        {/* Gold accent line */}
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#d49419] to-transparent mb-1.5" />

        <div className="text-[8.5px] font-bold tracking-widest text-[#0056d6] uppercase">
          SOLUÇÕES INTELIGENTES COM
        </div>
        <div className="text-[8px] font-semibold tracking-wider text-[#0a1e42]/80 uppercase">
          QUALIDADE, RAPIDEZ E CONFIANÇA.
        </div>
      </div>
    </div>
  );
};
