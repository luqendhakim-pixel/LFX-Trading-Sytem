import React from "react";

interface LfxLogoProps {
  variant?: "full" | "compact" | "icon-only";
  className?: string;
  height?: number | string;
}

export const LfxLogo: React.FC<LfxLogoProps> = ({
  variant = "full",
  className = "",
  height,
}) => {
  if (variant === "icon-only") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full"
          style={height ? { maxHeight: height } : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="lfxIconGlow" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#0d1b33" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>
            <filter id="iconNeon" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00E5B9" floodOpacity="0.5" />
            </filter>
          </defs>
          <rect width="512" height="512" rx="100" fill="url(#lfxIconGlow)" />
          <rect
            width="508"
            height="508"
            x="2"
            y="2"
            rx="98"
            fill="none"
            stroke="#00E5B9"
            strokeOpacity="0.4"
            strokeWidth="4"
          />
          <g transform="translate(18, 70)">
            <path
              d="M 60 40 L 60 160 A 40 40 0 0 0 100 200 L 175 200 L 175 162 L 105 162 A 8 8 0 0 1 97 154 L 97 40 Z"
              fill="#FFFFFF"
            />
            <path
              d="M 195 40 L 295 40 L 295 72 L 230 72 L 230 102 L 285 102 L 285 132 L 230 132 L 230 200 L 195 200 Z"
              fill="#FFFFFF"
            />
            <path d="M 315 40 L 355 40 L 465 200 L 425 200 Z" fill="#FFFFFF" />
            <path d="M 460 40 L 420 40 L 310 200 L 350 200 Z" fill="#00E5B9" filter="url(#iconNeon)" />
          </g>
          <g transform="translate(256, 385)" textAnchor="middle">
            <rect x="-195" y="-8" width="38" height="6" rx="3" fill="#00E5B9" />
            <text
              x="0"
              y="0"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="24"
              fontWeight="900"
              letterSpacing="8"
              fill="#FFFFFF"
            >
              TRADING SYSTEM
            </text>
            <rect x="157" y="-8" width="38" height="6" rx="3" fill="#00E5B9" />
          </g>
        </svg>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <svg
          viewBox="0 0 460 115"
          className="h-full w-auto select-none"
          style={height ? { height } : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="lfxCompactGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00E5B9" floodOpacity="0.4" />
            </filter>
          </defs>
          <path
            d="M 24 10 L 24 74 A 32 32 0 0 0 56 106 L 132 106 L 132 76 L 62 76 A 8 8 0 0 1 54 68 L 54 10 Z"
            fill="#FFFFFF"
          />
          <path
            d="M 152 10 L 254 10 L 254 38 L 184 38 L 184 52 L 242 52 L 242 78 L 184 78 L 184 106 L 152 106 Z"
            fill="#FFFFFF"
          />
          <path d="M 276 10 L 316 10 L 442 106 L 402 106 Z" fill="#FFFFFF" />
          <path d="M 436 10 L 396 10 L 270 106 L 310 106 Z" fill="#00E5B9" filter="url(#lfxCompactGlow)" />
        </svg>
      </div>
    );
  }

  // Full Variant with crisp, large, highly legible "— TRADING SYSTEM —"
  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <svg
        viewBox="0 0 460 160"
        className="w-auto h-full select-none max-w-full"
        style={height ? { height } : undefined}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="lfxNeonGlowFull" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E5B9" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* L */}
        <path
          d="M 24 10 L 24 74 A 32 32 0 0 0 56 106 L 132 106 L 132 76 L 62 76 A 8 8 0 0 1 54 68 L 54 10 Z"
          fill="#FFFFFF"
        />

        {/* F */}
        <path
          d="M 152 10 L 254 10 L 254 38 L 184 38 L 184 52 L 242 52 L 242 78 L 184 78 L 184 106 L 152 106 Z"
          fill="#FFFFFF"
        />

        {/* X - White Diagonal (Back) */}
        <path
          d="M 276 10 L 316 10 L 442 106 L 402 106 Z"
          fill="#FFFFFF"
        />

        {/* X - Mint/Cyan Diagonal (Front) */}
        <path
          d="M 436 10 L 396 10 L 270 106 L 310 106 Z"
          fill="#00E5B9"
          filter="url(#lfxNeonGlowFull)"
        />

        {/* Subtitle: — TRADING SYSTEM — */}
        <g transform="translate(230, 142)" textAnchor="middle">
          {/* Left Teal Dash */}
          <rect x="-198" y="-9" width="38" height="6" rx="3" fill="#00E5B9" />

          {/* Text TRADING SYSTEM */}
          <text
            x="0"
            y="0"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="23"
            fontWeight="900"
            letterSpacing="7.5"
            fill="#FFFFFF"
          >
            TRADING SYSTEM
          </text>

          {/* Right Teal Dash */}
          <rect x="160" y="-9" width="38" height="6" rx="3" fill="#00E5B9" />
        </g>
      </svg>
    </div>
  );
};
