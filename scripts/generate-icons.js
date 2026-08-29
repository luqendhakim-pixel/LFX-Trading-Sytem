import sharp from "sharp";
import fs from "fs";
import path from "path";

// Master SVG with all vector paths (no external font dependencies)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#0e172a" />
      <stop offset="60%" stop-color="#060b18" />
      <stop offset="100%" stop-color="#020409" />
    </radialGradient>
    
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F5FF" />
      <stop offset="100%" stop-color="#00D29E" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#EAB308" />
    </linearGradient>

    <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Solid Square with rounded corners for safe maskable area -->
  <rect width="512" height="512" fill="url(#bgGrad)"/>
  
  <!-- Subtle Hexagon / Shield Outer Glow Line -->
  <circle cx="256" cy="256" r="236" fill="none" stroke="#00F5FF" stroke-opacity="0.2" stroke-width="3"/>
  <circle cx="256" cy="256" r="230" fill="none" stroke="#00D29E" stroke-opacity="0.1" stroke-width="1.5"/>

  <!-- Logo Group centered inside 512x512 -->
  <g transform="translate(18, 50)">
    <!-- Letter L (Bold Pure White) -->
    <path d="M 85 80 
             L 85 210 
             A 35 35 0 0 0 120 245 
             L 195 245 
             L 195 205 
             L 130 205 
             A 10 10 0 0 1 120 195 
             L 120 80 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter F (Bold Pure White) -->
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

    <!-- Letter X - Left Arm (White) -->
    <path d="M 330 80 
             L 368 80 
             L 465 245 
             L 427 245 
             Z" 
          fill="#FFFFFF" />

    <!-- Letter X - Right Glowing Neon Cyan Arm -->
    <path d="M 460 80 
             L 422 80 
             L 325 245 
             L 363 245 
             Z" 
          fill="url(#cyanGrad)" 
          filter="url(#cyanGlow)" />

    <!-- Golden Upward Bullish Trend Spark / Arrow over the X -->
    <path d="M 425 60 
             L 468 60 
             L 468 103 
             L 452 87 
             L 395 144 
             L 375 124 
             L 432 67 
             Z" 
          fill="url(#goldGrad)" 
          filter="url(#goldGlow)" />
  </g>

  <!-- Bottom Badge: LFX GOLD SIGNAL -->
  <g transform="translate(256, 385)">
    <!-- Pill Container -->
    <rect x="-160" y="-18" width="320" height="36" rx="18" fill="#0b1329" stroke="#00F5FF" stroke-opacity="0.4" stroke-width="2"/>
    
    <!-- Left Accent Dot -->
    <circle cx="-135" cy="0" r="5" fill="#00F5FF" />
    
    <!-- Text Paths / Vectorized 'XAU/USD AI TERMINAL' -->
    <text x="0" y="6" 
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif" 
          font-size="16" 
          font-weight="900" 
          letter-spacing="4" 
          fill="#00F5FF">XAU/USD TERMINAL</text>

    <!-- Right Accent Dot -->
    <circle cx="135" cy="0" r="5" fill="#00D29E" />
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write SVG files
  fs.writeFileSync(path.join(publicDir, "favicon.svg"), svgContent);
  fs.writeFileSync(path.join(publicDir, "app-icon.svg"), svgContent);
  fs.writeFileSync(path.join(publicDir, "lfx-logo.svg"), svgContent);

  const svgBuffer = Buffer.from(svgContent);

  // Generate 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "icon-512.png"));

  // Generate 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "icon-192.png"));

  // Generate Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  // Generate Favicon PNG (64x64)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "favicon.png"));

  // Generate lfx-logo.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "lfx-logo.png"));

  console.log("Successfully generated all LFX PWA & Mobile Icons!");
}

main().catch(console.error);
