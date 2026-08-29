import fs from "fs";
import path from "path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Full Logo SVG (with "— TRADING SYSTEM —")
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="100%" height="100%" fill="#030712"/>
  
  <g transform="translate(100, 90)">
    <!-- Letter L -->
    <path d="M 60 40 
             L 60 170 
             A 50 50 0 0 0 110 220 
             L 200 220 
             L 200 175 
             L 115 175 
             A 10 10 0 0 1 105 165 
             L 105 40 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter F -->
    <path d="M 215 40 
             L 345 40 
             L 345 82 
             L 260 82 
             L 260 115 
             L 330 115 
             L 330 155 
             L 260 155 
             L 260 220 
             L 215 220 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter X (White diagonal: top-left to bottom-right) -->
    <path d="M 370 40 
             L 415 40 
             L 550 220 
             L 505 220 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter X (Cyan diagonal: top-right to bottom-left) -->
    <path d="M 545 40 
             L 500 40 
             L 365 220 
             L 410 220 
             Z" 
          fill="#00E5B9" />
  </g>

  <!-- Subtitle: — TRADING SYSTEM — -->
  <g transform="translate(400, 390)" text-anchor="middle">
    <!-- Left Dash -->
    <rect x="-240" y="-8" width="36" height="5" rx="2.5" fill="#00E5B9"/>
    
    <!-- Text -->
    <text x="0" y="0" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="24" 
          font-weight="800" 
          letter-spacing="9" 
          fill="#FFFFFF">TRADING SYSTEM</text>
    
    <!-- Right Dash -->
    <rect x="204" y="-8" width="36" height="5" rx="2.5" fill="#00E5B9"/>
  </g>
</svg>`;

// 2. Square App Icon SVG (Optimized for Mobile Homescreen & PWA)
const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stopColor="#0a1526" />
      <stop offset="100%" stopColor="#020408" />
    </radialGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="105" fill="url(#bgGlow)"/>
  <rect width="508" height="508" x="2" y="2" rx="103" fill="none" stroke="#00E5B9" stroke-opacity="0.25" stroke-width="3"/>

  <!-- Logo Group -->
  <g transform="translate(6, 65)">
    <!-- Letter L -->
    <path d="M 85 60 
             L 85 185 
             A 45 45 0 0 0 130 230 
             L 205 230 
             L 205 190 
             L 132 190 
             A 10 10 0 0 1 122 180 
             L 122 60 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter F -->
    <path d="M 218 60 
             L 328 60 
             L 328 98 
             L 255 98 
             L 255 130 
             L 315 130 
             L 315 165 
             L 255 165 
             L 255 230 
             L 218 230 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter X (White diagonal: top-left to bottom-right) -->
    <path d="M 345 60 
             L 385 60 
             L 485 230 
             L 445 230 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter X (Cyan diagonal: top-right to bottom-left with subtle neon glow) -->
    <path d="M 480 60 
             L 440 60 
             L 340 230 
             L 380 230 
             Z" 
          fill="#00E5B9" 
          filter="url(#neonGlow)" />
  </g>

  <!-- Subtitle: — TRADING SYSTEM — -->
  <g transform="translate(256, 385)" text-anchor="middle">
    <!-- Left Dash -->
    <rect x="-190" y="-7" width="28" height="4" rx="2" fill="#00E5B9"/>
    
    <!-- Text -->
    <text x="0" y="0" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="18" 
          font-weight="800" 
          letter-spacing="6" 
          fill="#FFFFFF">TRADING SYSTEM</text>
    
    <!-- Right Dash -->
    <rect x="162" y="-7" width="28" height="4" rx="2" fill="#00E5B9"/>
  </g>
</svg>`;

async function generate() {
  console.log("Generating LFX Trading System Assets...");

  // Write SVG files
  fs.writeFileSync(path.join(publicDir, "lfx-logo.svg"), fullLogoSvg);
  fs.writeFileSync(path.join(publicDir, "favicon.svg"), appIconSvg);
  fs.writeFileSync(path.join(publicDir, "app-icon.svg"), appIconSvg);

  const iconBuffer = Buffer.from(appIconSvg);
  const logoBuffer = Buffer.from(fullLogoSvg);

  // Generate PNGs
  await sharp(iconBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, "icon-512.png"));

  await sharp(iconBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, "icon-192.png"));

  await sharp(iconBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  await sharp(iconBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, "favicon.png"));

  await sharp(logoBuffer)
    .resize(800, 500)
    .png()
    .toFile(path.join(publicDir, "lfx-logo.png"));

  console.log("Assets generated successfully in public/!");
}

generate().catch(console.error);
