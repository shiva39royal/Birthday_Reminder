import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import { BirthdayEmployee } from '../../shared/types';
import { ReminderService } from '../services/reminder-service';
import log from 'electron-log';

export class CelebrationWindowManager {
  private static instance: BrowserWindow | null = null;
  private static pendingBirthdays: BirthdayEmployee[] = [];
  private static wasAcknowledged = false;

  public static getWindow(): BrowserWindow | null {
    return this.instance;
  }

  public static getPendingBirthdays(): BirthdayEmployee[] {
    return this.pendingBirthdays;
  }

  public static markAcknowledged(): void {
    this.wasAcknowledged = true;
    if (this.instance && !this.instance.isDestroyed()) {
      this.instance.close();
    }
  }

  public static create(birthdays: BirthdayEmployee[]): BrowserWindow {
    this.pendingBirthdays = birthdays;
    this.wasAcknowledged = false;

    if (this.instance && !this.instance.isDestroyed()) {
      if (this.instance.isMinimized()) this.instance.restore();
      this.instance.focus();
      return this.instance;
    }

    const iconPath = path.join(app.getAppPath(), 'src/assets/icons/birthday_buddy.ico');

    this.instance = new BrowserWindow({
      width: 900,
      height: 700,
      minWidth: 720,
      minHeight: 560,
      center: true,
      title: '🎉 Birthday Celebration — Birthday Buddy',
      icon: iconPath,
      resizable: true,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(app.getAppPath(), 'out/main/preload/celebration-preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false
      },
      show: false,
      backgroundColor: '#2e1065'
    });

    this.instance.once('ready-to-show', () => {
      this.instance?.show();
      this.instance?.focus();
    });

    this.instance.on('closed', () => {
      this.instance = null;
      if (!this.wasAcknowledged) {
        ReminderService.getInstance().handleCelebrationClosedWithoutAck();
      }
    });

    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      this.instance.loadURL(`${process.env.VITE_DEV_SERVER_URL}/celebration.html`);
    } else {
      const htmlPath = path.join(app.getAppPath(), 'out/renderer/celebration.html');
      this.instance.loadFile(htmlPath);
    }

    return this.instance;
  }
}
