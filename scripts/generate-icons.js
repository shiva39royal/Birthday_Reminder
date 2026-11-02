const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

async function createIcon() {
  const iconDir = path.join(__dirname, '../src/assets/icons');
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  const size = 256;
  const img = new Jimp({ width: size, height: size, color: 0x00000000 });

  // 1. Draw rounded purple gradient background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Check rounded corner (radius 56)
      const r = 56;
      let inCorner = false;
      let dist = 0;

      if (x < r && y < r) dist = Math.hypot(x - r, y - r);
      else if (x > size - r && y < r) dist = Math.hypot(x - (size - r), y - r);
      else if (x < r && y > size - r) dist = Math.hypot(x - r, y - (size - r));
      else if (x > size - r && y > size - r) dist = Math.hypot(x - (size - r), y - (size - r));

      if (dist <= r) {
        // Linear gradient from #7C3AED (124, 58, 237) to #4C1D95 (76, 29, 149)
        const t = (x + y) / (size * 2);
        const red = Math.round(124 * (1 - t) + 76 * t);
        const green = Math.round(58 * (1 - t) + 29 * t);
        const blue = Math.round(237 * (1 - t) + 149 * t);
        const color = (red << 24) | (green << 16) | (blue << 8) | 0xff;
        img.setPixelColor(color, x, y);
      }
    }
  }

  // Helper to draw filled rectangle
  function fillRect(x1, y1, w, h, color) {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          img.setPixelColor(color, x, y);
        }
      }
    }
  }

  // Helper to draw filled circle
  function fillCircle(cx, cy, r, color) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (Math.hypot(x - cx, y - cy) <= r) {
          if (x >= 0 && x < size && y >= 0 && y < size) {
            img.setPixelColor(color, x, y);
          }
        }
      }
    }
  }

  // Confetti dots
  fillCircle(60, 60, 5, 0xfbbf24ff); // Gold
  fillCircle(200, 50, 6, 0x38bdf8ff); // Sky
  fillCircle(45, 120, 4, 0xec4899ff); // Pink
  fillCircle(215, 125, 5, 0x34d399ff); // Green
  fillCircle(55, 195, 4, 0xf43f5eff); // Rose
  fillCircle(205, 200, 5, 0xa78bfaff); // Purple

  // Balloons
  // Left Blue Balloon
  fillCircle(85, 90, 22, 0x0284c7ff);
  fillCircle(80, 85, 6, 0x38bdf8ff); // Highlight
  fillRect(83, 112, 4, 25, 0xe2e8f0aa); // String

  // Right Amber Balloon
  fillCircle(170, 85, 24, 0xd97706ff);
  fillCircle(165, 80, 7, 0xfbbf24ff);
  fillRect(168, 109, 4, 30, 0xe2e8f0aa);

  // Center Pink Balloon
  fillCircle(128, 75, 20, 0xdb2777ff);
  fillCircle(124, 70, 5, 0xf472b6ff);
  fillRect(126, 95, 4, 35, 0xe2e8f0aa);

  // Cake Plate
  fillRect(60, 215, 136, 8, 0xe2e8f0ff);
  fillRect(88, 223, 80, 6, 0xcbd5e1ff);

  // Cake Bottom Layer (Pink)
  fillRect(75, 170, 106, 45, 0xdb2777ff);
  // Bottom Frosting (White)
  fillRect(75, 170, 106, 12, 0xffffffff);
  for (let i = 0; i < 7; i++) {
    fillCircle(83 + i * 15, 182, 6, 0xffffffff);
  }
  // Bottom Frosting Accents
  for (let i = 0; i < 6; i++) {
    fillCircle(90 + i * 15, 198, 3, 0xffffffff);
  }

  // Cake Top Layer (Pink)
  fillRect(93, 135, 70, 35, 0xf472b6ff);
  // Top Frosting (White)
  fillRect(93, 135, 70, 10, 0xffffffff);
  for (let i = 0; i < 5; i++) {
    fillCircle(100 + i * 14, 145, 5, 0xffffffff);
  }

  // Cherries on top
  fillCircle(102, 132, 4, 0xe11d48ff);
  fillCircle(128, 130, 4, 0xe11d48ff);
  fillCircle(154, 132, 4, 0xe11d48ff);

  // Candle
  fillRect(124, 105, 8, 27, 0xffffffff);
  // Candle stripes
  fillRect(124, 112, 8, 3, 0xec4899ff);
  fillRect(124, 122, 8, 3, 0xec4899ff);

  // Wick
  fillRect(127, 98, 2, 7, 0x334155ff);

  // Flame
  fillCircle(128, 90, 8, 0xfbbf24cc); // Outer glow
  fillCircle(128, 91, 5, 0xea580cff); // Orange core
  fillCircle(128, 93, 3, 0xfef08aff); // Bright yellow center

  // Export 256x256 PNG
  const png256Buffer = await img.getBuffer('image/png');
  const pngPath = path.join(iconDir, 'birthday_buddy.png');
  fs.writeFileSync(pngPath, png256Buffer);
  console.log('Saved PNG icon to:', pngPath);

  // Generate 48x48, 32x32, 16x16 PNG buffers for ICO
  const img48 = img.clone();
  img48.resize({ w: 48, h: 48 });
  const png48Buffer = await img48.getBuffer('image/png');

  const img32 = img.clone();
  img32.resize({ w: 32, h: 32 });
  const png32Buffer = await img32.getBuffer('image/png');

  const img16 = img.clone();
  img16.resize({ w: 16, h: 16 });
  const png16Buffer = await img16.getBuffer('image/png');

  // Build standard ICO file containing 256, 48, 32, 16 sizes
  const images = [
    { size: 256, buffer: png256Buffer },
    { size: 48, buffer: png48Buffer },
    { size: 32, buffer: png32Buffer },
    { size: 16, buffer: png16Buffer }
  ];

  const headerSize = 6;
  const entrySize = 16;
  const entriesSize = images.length * entrySize;
  let currentOffset = headerSize + entriesSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(images.length, 4); // count

  const entries = [];
  const buffers = [];

  for (const item of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 0); // width
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset

    entries.push(entry);
    buffers.push(item.buffer);
    currentOffset += item.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...buffers]);
  const icoPath = path.join(iconDir, 'birthday_buddy.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('Saved multi-resolution Windows ICO to:', icoPath);
}

createIcon().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

