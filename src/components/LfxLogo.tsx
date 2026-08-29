import React from "react";

interface LfxLogoProps {
  variant?: "full" | "compact" | "icon-only";
  className?: string;
  height?: number | string;
}

export const LfxLogo: React.FC<LfxLogoProps> = ({
  variant = "full",
  className = "",
  height = 36,
}) => {
  if (variant === "icon-only") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full"
          style={{ maxHeight: height }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="lfxIconGlow" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#0a1526" />
              <stop offset="100%" stopColor="#020408" />
            </radialGradient>
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
            strokeOpacity="0.3"
            strokeWidth="3"
          />
          <g transform="translate(6, 65)">
            <path
              d="M 85 60 L 85 185 A 45 45 0 0 0 130 230 L 205 230 L 205 190 L 132 190 A 10 10 0 0 1 122 180 L 122 60 Z"
              fill="#FFFFFF"
            />
            <path
              d="M 218 60 L 328 60 L 328 98 L 255 98 L 255 130 L 315 130 L 315 165 L 255 165 L 255 230 L 218 230 Z"
              fill="#FFFFFF"
            />
            <path d="M 345 60 L 385 60 L 485 230 L 445 230 Z" fill="#FFFFFF" />
            <path d="M 480 60 L 440 60 L 340 230 L 380 230 Z" fill="#00E5B9" />
          </g>
          <g transform="translate(256, 385)" text-anchor="middle">
            <rect x="-190" y="-7" width="28" height="4" rx="2" fill="#00E5B9" />
            <text
              x="0"
              y="0"
              fontFamily="system-ui, sans-serif"
              fontSize="18"
              fontWeight="800"
              letterSpacing="6"
              fill="#FFFFFF"
            >
              TRADING SYSTEM
            </text>
            <rect x="162" y="-7" width="28" height="4" rx="2" fill="#00E5B9" />
          </g>
        </svg>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg
          viewBox="0 0 540 240"
          className="h-7 w-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 30 20 L 30 160 A 45 45 0 0 0 75 205 L 170 205 L 170 165 L 80 165 A 10 10 0 0 1 70 155 L 70 20 Z"
            fill="#FFFFFF"
          />
          <path
            d="M 185 20 L 305 20 L 305 60 L 225 60 L 225 95 L 290 95 L 290 132 L 225 132 L 225 205 L 185 205 Z"
            fill="#FFFFFF"
          />
          <path d="M 330 20 L 375 20 L 510 205 L 465 205 Z" fill="#FFFFFF" />
          <path d="M 505 20 L 460 20 L 325 205 L 370 205 Z" fill="#00E5B9" />
        </svg>
      </div>
    );
  }

  // Full Variant with "— TRADING SYSTEM —"
  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <svg
        viewBox="0 0 600 320"
        className="w-auto h-auto max-h-12"
        style={{ height }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(10, 10)">
          {/* L */}
          <path
            d="M 50 30 L 50 165 A 45 45 0 0 0 95 210 L 195 210 L 195 168 L 105 168 A 10 10 0 0 1 95 158 L 95 30 Z"
            fill="#FFFFFF"
          />
          {/* F */}
          <path
            d="M 215 30 L 345 30 L 345 72 L 260 72 L 260 108 L 330 108 L 330 148 L 260 148 L 260 210 L 215 210 Z"
            fill="#FFFFFF"
          />
          {/* X White */}
          <path d="M 370 30 L 415 30 L 545 210 L 500 210 Z" fill="#FFFFFF" />
          {/* X Cyan */}
          <path d="M 540 30 L 495 30 L 365 210 L 410 210 Z" fill="#00E5B9" />
        </g>
        {/* — TRADING SYSTEM — */}
        <g transform="translate(295, 280)" textAnchor="middle">
          <rect x="-240" y="-8" width="36" height="5" rx="2.5" fill="#00E5B9" />
          <text
            x="0"
            y="0"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="24"
            fontWeight="800"
            letterSpacing="8"
            fill="#FFFFFF"
          >
            TRADING SYSTEM
          </text>
          <rect x="204" y="-8" width="36" height="5" rx="2.5" fill="#00E5B9" />
        </g>
      </svg>
    </div>
  );
};
