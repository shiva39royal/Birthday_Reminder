import * as fs from 'fs';
import * as path from 'path';
import { Jimp } from 'jimp';
import { DbManager } from './db-manager';
import { AppPaths } from '../utils/paths';
import log from 'electron-log';

export interface DummyEmployeeDef {
  id: string;
  name: string;
  dob: string;
  gender: 'male' | 'female';
  bgGrad: [number, number]; // [topColor, bottomColor]
  skinColor: number;
  hairColor: number;
  shirtColor: number;
  hasGlasses?: boolean;
}

export const DUMMY_EMPLOYEES: DummyEmployeeDef[] = [
  {
    id: 'emp-john-doe',
    name: 'John Doe',
    dob: '1992-11-03', // TODAY
    gender: 'male',
    bgGrad: [0x4338ca, 0x1e1b4b], // Indigo gradient
    skinColor: 0xfbd2a9,
    hairColor: 0x3d2314, // Dark brown
    shirtColor: 0x2563eb, // Royal Blue
    hasGlasses: false
  },
  {
    id: 'emp-sarah-jenkins',
    name: 'Sarah Jenkins',
    dob: '1996-11-03', // TODAY
    gender: 'female',
    bgGrad: [0xdb2777, 0x831843], // Pink/Rose gradient
    skinColor: 0xfed7aa,
    hairColor: 0x92400e, // Auburn
    shirtColor: 0xec4899, // Pink
    hasGlasses: true
  },
  {
    id: 'emp-rahul-sharma',
    name: 'Rahul Sharma',
    dob: '1990-11-06', // Upcoming
    gender: 'male',
    bgGrad: [0x0d9488, 0x134e4a], // Teal gradient
    skinColor: 0xc68642,
    hairColor: 0x111827, // Black
    shirtColor: 0x0f766e,
    hasGlasses: false
  },
  {
    id: 'emp-emily-watson',
    name: 'Emily Watson',
    dob: '1995-11-12', // Upcoming
    gender: 'female',
    bgGrad: [0x7c3aed, 0x4c1d95], // Purple gradient
    skinColor: 0xffedd5,
    hairColor: 0xd97706, // Blonde/Gold
    shirtColor: 0x8b5cf6,
    hasGlasses: false
  },
  {
    id: 'emp-michael-chang',
    name: 'Michael Chang',
    dob: '1988-11-20', // Upcoming
    gender: 'male',
    bgGrad: [0xe11d48, 0x881337], // Crimson gradient
    skinColor: 0xfce7cf,
    hairColor: 0x18181b, // Jet black
    shirtColor: 0x475569, // Slate
    hasGlasses: true
  },
  {
    id: 'emp-priya-patel',
    name: 'Priya Patel',
    dob: '1994-12-01', // Upcoming
    gender: 'female',
    bgGrad: [0xf59e0b, 0x78350f], // Amber/Warm gradient
    skinColor: 0xbb7744,
    hairColor: 0x1c1917, // Raven black
    shirtColor: 0xd97706,
    hasGlasses: false
  }
];

export async function generateAvatarImage(def: DummyEmployeeDef): Promise<string> {
  const size = 300;
  const img = new Jimp({ width: size, height: size, color: 0x00000000 });

  function colorWithAlpha(hex: number, alpha = 0xff): number {
    return ((hex & 0xffffff) << 8) | (alpha & 0xff);
  }

  // 1. Draw rounded circular avatar background
  const r = size / 2;
  const cx = r;
  const cy = r;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r) {
        const t = y / size;
        const [top, bot] = def.bgGrad;
        const tr = Math.round(((top >> 16) & 0xff) * (1 - t) + ((bot >> 16) & 0xff) * t);
        const tg = Math.round(((top >> 8) & 0xff) * (1 - t) + ((bot >> 8) & 0xff) * t);
        const tb = Math.round((top & 0xff) * (1 - t) + (bot & 0xff) * t);
        img.setPixelColor(colorWithAlpha((tr << 16) | (tg << 8) | tb), x, y);
      }
    }
  }

  // Helpers
  function fillCircle(cx: number, cy: number, radius: number, hex: number) {
    const col = colorWithAlpha(hex);
    for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(size - 1, Math.ceil(cy + radius)); y++) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(size - 1, Math.ceil(cx + radius)); x++) {
        if (Math.hypot(x - cx, y - cy) <= radius && Math.hypot(x - 150, y - 150) <= 150) {
          img.setPixelColor(col, x, y);
        }
      }
    }
  }

  function fillRect(x1: number, y1: number, w: number, h: number, hex: number) {
    const col = colorWithAlpha(hex);
    for (let y = Math.max(0, y1); y < Math.min(size, y1 + h); y++) {
      for (let x = Math.max(0, x1); x < Math.min(size, x1 + w); x++) {
        if (Math.hypot(x - 150, y - 150) <= 150) {
          img.setPixelColor(col, x, y);
        }
      }
    }
  }

  // 2. Shoulders / Body
  fillCircle(150, 290, 95, def.shirtColor);

  // 3. Neck
  fillRect(132, 185, 36, 40, def.skinColor);

  // 4. Head / Face
  fillCircle(150, 140, 58, def.skinColor);

  // 5. Hair
  if (def.gender === 'female') {
    // Longer flowing hair
    fillCircle(150, 120, 64, def.hairColor);
    fillCircle(105, 165, 34, def.hairColor);
    fillCircle(195, 165, 34, def.hairColor);
    fillCircle(150, 140, 56, def.skinColor); // Retouch face
  } else {
    // Short stylish hair
    fillCircle(150, 115, 60, def.hairColor);
    fillCircle(150, 140, 56, def.skinColor); // Retouch face
    fillCircle(150, 98, 48, def.hairColor);
  }

  // 6. Eyes & Eyebrows
  fillCircle(130, 138, 5, 0x1f2937);
  fillCircle(170, 138, 5, 0x1f2937);
  fillCircle(128, 136, 2, 0xffffff); // Eye shine
  fillCircle(168, 136, 2, 0xffffff);
  fillRect(122, 128, 16, 3, def.hairColor); // Eyebrows
  fillRect(162, 128, 16, 3, def.hairColor);

  // 7. Smile
  for (let a = -0.8; a <= 0.8; a += 0.1) {
    const sx = Math.round(150 + a * 15);
    const sy = Math.round(168 + (a * a) * 8);
    fillCircle(sx, sy, 2.5, 0x991b1b);
  }

  // 8. Glasses (if specified)
  if (def.hasGlasses) {
    for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
      fillCircle(Math.round(130 + Math.cos(angle) * 14), Math.round(138 + Math.sin(angle) * 14), 1.8, 0x0f172a);
      fillCircle(Math.round(170 + Math.cos(angle) * 14), Math.round(138 + Math.sin(angle) * 14), 1.8, 0x0f172a);
    }
    fillRect(144, 137, 12, 2.5, 0x0f172a); // Bridge
  }

  // 9. Party Hat for Today's Birthday Employees!
  if (def.dob.endsWith('11-03')) {
    // Party hat triangle
    for (let hy = 0; hy < 65; hy++) {
      const hw = Math.round(hy * 0.45);
      fillRect(150 - hw, 92 - hy, hw * 2, 1, hy % 15 < 8 ? 0xf59e0b : 0xec4899);
    }
    fillCircle(150, 27, 8, 0xffffff); // Pom-pom on hat
  }

  const photosDir = AppPaths.getPhotosDir();
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }

  const filename = `${def.id}.jpg`;
  const targetPath = path.join(photosDir, filename);

  const jpegBuffer = await img.getBuffer('image/jpeg');
  fs.writeFileSync(targetPath, jpegBuffer);
  log.info(`Generated realistic employee avatar: ${filename}`);

  return filename;
}

export async function seedDemoEmployees(): Promise<number> {
  const db = DbManager.getInstance();
  let count = 0;

  for (const empDef of DUMMY_EMPLOYEES) {
    try {
      const photoFilename = await generateAvatarImage(empDef);
      const existing = db.getEmployeeById(empDef.id);

      if (existing) {
        db.updateEmployee(empDef.id, {
          employee_name: empDef.name,
          date_of_birth: empDef.dob,
          photo_path: photoFilename
        });
      } else {
        db.createEmployee({
          id: empDef.id,
          employee_name: empDef.name,
          date_of_birth: empDef.dob,
          photo_path: photoFilename
        });
      }
      count++;
    } catch (err) {
      log.error(`Failed to seed employee ${empDef.name}:`, err);
    }
  }

  db.saveToDisk();
  log.info(`Successfully seeded ${count} dummy employees!`);
  return count;
}

