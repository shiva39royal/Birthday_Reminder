import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import log from 'electron-log';

export class MainWindowManager {
  private static instance: BrowserWindow | null = null;

  public static getWindow(): BrowserWindow | null {
    return this.instance;
  }

  public static create(): BrowserWindow {
    if (this.instance && !this.instance.isDestroyed()) {
      if (this.instance.isMinimized()) this.instance.restore();
      this.instance.focus();
      return this.instance;
    }

    const iconPath = path.join(app.getAppPath(), 'src/assets/icons/birthday_buddy.ico');

    this.instance = new BrowserWindow({
      width: 1280,
      height: 820,
      minWidth: 1024,
      minHeight: 700,
      center: true,
      title: 'Birthday Buddy — Team Birthday Reminder',
      icon: iconPath,
      webPreferences: {
        preload: path.join(app.getAppPath(), 'out/main/preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false
      },
      show: false,
      backgroundColor: '#F9FAFB'
    });

    this.instance.once('ready-to-show', () => {
      this.instance?.show();
    });

    this.instance.on('closed', () => {
      this.instance = null;
    });

    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      this.instance.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      const htmlPath = path.join(app.getAppPath(), 'out/renderer/index.html');
      this.instance.loadFile(htmlPath);
    }

    return this.instance;
  }
}
