import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#0e172a" />
      <stop offset="60%" stop-color="#060c1c" />
      <stop offset="100%" stop-color="#020409" />
    </radialGradient>
    
    <!-- Neon Cyan Gradient -->
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F5FF" />
      <stop offset="100%" stop-color="#00D29E" />
    </linearGradient>

    <!-- Golden Spark Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#EAB308" />
    </linearGradient>

    <!-- Subtle Glow Filters -->
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Solid Background for Android Adaptive / Maskable Icon Safe Zone -->
  <rect width="512" height="512" fill="url(#bgGrad)"/>
  
  <!-- Outer Circuit Ring (Inside 80% Safe Zone) -->
  <circle cx="256" cy="256" r="215" fill="none" stroke="#00F5FF" stroke-opacity="0.25" stroke-width="3" stroke-dasharray="8 6"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#00D29E" stroke-opacity="0.15" stroke-width="1.5"/>

  <!-- Logo Group centered inside 512x512 with safe margins -->
  <g transform="translate(42, 85) scale(0.85)">
    <!-- Letter L (Bold Solid Pure White) -->
    <path d="M 85 80 
             L 85 215 
             A 30 30 0 0 0 115 245 
             L 190 245 
             L 190 205 
             L 125 205 
             A 10 10 0 0 1 115 195 
             L 115 80 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter F (Bold Solid Pure White) -->
    <path d="M 215 80 
             L 315 80 
             L 315 115 
             L 250 115 
             L 250 148 
             L 305 148 
             L 305 180 
             L 250 180 
             L 250 245 
             L 215 245 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter X - Left Arm (Pure White) -->
    <path d="M 330 80 
             L 368 80 
             L 465 245 
             L 427 245 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter X - Right Arm (Electric Cyan / Emerald Gradient Glow) -->
    <path d="M 460 80 
             L 422 80 
             L 325 245 
             L 363 245 
             Z" 
          fill="url(#cyanGrad)" 
          filter="url(#cyanGlow)" />

    <!-- Golden Upward Bullish Trend Spark / Arrow over the X -->
    <path d="M 425 55 
             L 472 55 
             L 472 102 
             L 454 84 
             L 395 143 
             L 375 123 
             L 434 64 
             Z" 
          fill="url(#goldGrad)" 
          filter="url(#goldGlow)" />
  </g>

  <!-- Bottom Badge: LFX TRADING SYSTEM -->
  <g transform="translate(256, 370)">
    <!-- Pill Container -->
    <rect x="-140" y="-16" width="280" height="32" rx="16" fill="#081022" stroke="#00F5FF" stroke-opacity="0.5" stroke-width="1.5"/>
    
    <!-- Left Accent Dot -->
    <circle cx="-118" cy="0" r="4" fill="#00F5FF" />
    
    <!-- Label -->
    <text x="0" y="5" 
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif" 
          font-size="14" 
          font-weight="900" 
          letter-spacing="3" 
          fill="#00F5FF">XAU/USD TERMINAL</text>

    <!-- Right Accent Dot -->
    <circle cx="118" cy="0" r="4" fill="#00D29E" />
  </g>
</svg>`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  
  // Save SVGs
  fs.writeFileSync(path.join(publicDir, 'app-icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'lfx-logo.svg'), svgContent);

  const svgBuffer = Buffer.from(svgContent);

  // Generate 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ palette: false, force: true })
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Generate 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ palette: false, force: true })
    .toFile(path.join(publicDir, 'icon-192.png'));

  // Generate Maskable 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ palette: false, force: true })
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));

  // Generate Maskable 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ palette: false, force: true })
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));

  // Generate Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ palette: false, force: true })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Generate Favicon (64x64)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ palette: false, force: true })
    .toFile(path.join(publicDir, 'favicon.png'));

  // Generate lfx-logo.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ palette: false, force: true })
    .toFile(path.join(publicDir, 'lfx-logo.png'));

  console.log('Successfully generated all LFX PWA icons!');
}

generate().catch(console.error);
