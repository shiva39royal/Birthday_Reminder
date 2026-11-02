import * as fs from 'fs';
import * as path from 'path';
import { Jimp } from 'jimp';
import { v4 as uuidv4 } from 'uuid';
import { AppPaths } from '../utils/paths';
import log from 'electron-log';

export class ImageService {
  private static instance: ImageService | null = null;

  private constructor() {}

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  public async validateImage(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Image buffer is empty' };
    }
    if (buffer.length > 15 * 1024 * 1024) {
      return { valid: false, error: 'Image size exceeds maximum limit of 15MB' };
    }

    try {
      const image = await Jimp.read(buffer);
      if (image.width <= 0 || image.height <= 0) {
        return { valid: false, error: 'Invalid image dimensions' };
      }
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: `Corrupted or unsupported image format: ${err?.message || err}` };
    }
  }

  public async saveEmployeePhoto(imageInput: Buffer | string, employeeId?: string): Promise<string> {
    const id = employeeId || uuidv4();
    const filename = `${id}.jpg`;
    const targetPath = path.join(AppPaths.getPhotosDir(), filename);

    let buffer: Buffer;
    if (typeof imageInput === 'string') {
      if (imageInput.startsWith('data:')) {
        const base64Data = imageInput.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = fs.readFileSync(imageInput);
      }
    } else {
      buffer = imageInput;
    }

    const validation = await this.validateImage(buffer);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image file');
    }

    const image = await Jimp.read(buffer);
    // Scale down if larger than 600x600, preserving aspect ratio
    if (image.width > 600 || image.height > 600) {
      image.scaleToFit({ w: 600, h: 600 });
    }

    const jpegBuffer = await image.getBuffer('image/jpeg');
    fs.writeFileSync(targetPath, jpegBuffer);
    log.info(`Saved employee photo: ${filename} (${image.width}x${image.height})`);

    return filename;
  }

  public getPhotoDataUrl(photoFilename: string | null): string | null {
    if (!photoFilename) return null;

    // Sanitize path against traversal
    const safeFilename = path.basename(photoFilename);
    const fullPath = path.join(AppPaths.getPhotosDir(), safeFilename);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    try {
      const fileData = fs.readFileSync(fullPath);
      return `data:image/jpeg;base64,${fileData.toString('base64')}`;
    } catch (err) {
      log.error('Error reading photo data URL:', err);
      return null;
    }
  }

  public deletePhoto(photoFilename: string | null): void {
    if (!photoFilename) return;
    const safeFilename = path.basename(photoFilename);
    const fullPath = path.join(AppPaths.getPhotosDir(), safeFilename);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        log.info('Deleted photo:', safeFilename);
      } catch (err) {
        log.warn('Could not delete photo:', fullPath, err);
      }
    }
  }
}

