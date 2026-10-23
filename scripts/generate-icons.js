import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#0c0a09" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Rounded Rect -->
  <rect width="512" height="512" rx="128" fill="url(#bg)" />

  <!-- Outer Subtle Ring -->
  <rect x="24" y="24" width="464" height="464" rx="108" fill="none" stroke="#292524" stroke-width="6" />

  <!-- Lock Shackle -->
  <path d="M192 230 V160 C192 124.65 220.65 96 256 96 C291.35 96 320 124.65 320 160 V230" 
        fill="none" stroke="url(#emeraldGrad)" stroke-width="36" stroke-linecap="round" />

  <!-- Lock Body -->
  <rect x="144" y="220" width="224" height="196" rx="36" fill="#292524" stroke="#44403c" stroke-width="4" />
  
  <!-- Glowing Checkmark / Reassurance Badge -->
  <circle cx="256" cy="318" r="48" fill="url(#emeraldGrad)" filter="url(#glow)" />
  <path d="M236 318 L250 332 L278 304" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Created public/icon.svg');

// Simple PNG encoder using Node native Buffer & zlib
function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}
const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generateRasterPNG(size, isMaskable = false) {
  // size x size RGBA buffer
  // row scanlines: 1 filter byte (0) + size * 4 bytes per row
  const rowLen = 1 + size * 4;
  const rawData = Buffer.alloc(rowLen * size);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * (isMaskable ? 0.48 : 0.42);

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: #0c0a09 (12, 10, 9)
      let r = 16;
      let g = 14;
      let b = 13;
      let a = 255;

      if (!isMaskable) {
        // Rounded corner container for normal icon
        const cornerR = size * 0.22;
        const qx = Math.max(0, Math.abs(dx) - (cx - cornerR));
        const qy = Math.max(0, Math.abs(dy) - (cy - cornerR));
        const cornerDist = Math.sqrt(qx * qx + qy * qy);
        if (cornerDist > cornerR) {
          a = 0; // transparent outside rounded rect
        }
      }

      if (a > 0) {
        // Inside icon: Draw Lock & Shackle
        // Lock body: rect [cx - 0.22*size, cy - 0.05*size] to [cx + 0.22*size, cy + 0.32*size]
        const bodyLeft = cx - size * 0.22;
        const bodyRight = cx + size * 0.22;
        const bodyTop = cy - size * 0.04;
        const bodyBottom = cy + size * 0.32;

        // Shackle: circle arc at (cx, cy - size * 0.16), outer radius size * 0.17, inner radius size * 0.10
        const shackleCy = cy - size * 0.15;
        const shackleDist = Math.sqrt(dx * dx + (y - shackleCy) * (y - shackleCy));
        const isShackleArch = y <= bodyTop + 4 && shackleDist <= size * 0.16 && shackleDist >= size * 0.09;

        if (isShackleArch) {
          // Emerald shackle
          r = 16;
          g = 185;
          b = 129;
        } else if (x >= bodyLeft && x <= bodyRight && y >= bodyTop && y <= bodyBottom) {
          // Body rect
          const checkCenterY = cy + size * 0.14;
          const checkDist = Math.sqrt(dx * dx + (y - checkCenterY) * (y - checkCenterY));

          if (checkDist <= size * 0.11) {
            // Emerald badge circle
            r = 16;
            g = 185;
            b = 129;

            // Simple white checkmark pixels
            const cdx = (x - cx) / (size * 0.1);
            const cdy = (y - checkCenterY) / (size * 0.1);
            // Checkmark coordinates: approx (-0.5, 0) to (-0.1, 0.4) to (0.5, -0.3)
            const d1 = Math.abs((cdx - (-0.5)) * 0.707 - (cdy - 0.0) * -0.707);
            const isLine1 = cdx >= -0.55 && cdx <= -0.05 && Math.abs(cdy - (cdx * 1.0 + 0.5)) < 0.22;
            const isLine2 = cdx >= -0.15 && cdx <= 0.6 && Math.abs(cdy - (-cdx * 1.1 + 0.3)) < 0.22;

            if (isLine1 || isLine2) {
              r = 255;
              g = 255;
              b = 255;
            }
          } else {
            // Dark stone lock body
            r = 41;
            g = 37;
            b = 36;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = writeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = writeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateRasterPNG(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateRasterPNG(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateRasterPNG(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateRasterPNG(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateRasterPNG(32, false));

console.log('Successfully generated all PWA icons in /public:');
console.log(' - icon.svg');
console.log(' - pwa-192x192.png');
console.log(' - pwa-512x512.png');
console.log(' - pwa-maskable-512x512.png');
console.log(' - apple-touch-icon.png');
console.log(' - favicon.ico');
