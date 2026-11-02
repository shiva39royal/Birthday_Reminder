import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export class AppPaths {
  private static _userDataDir: string | null = null;

  public static initialize(): void {
    try {
      if (app && typeof app.getPath === 'function') {
        this._userDataDir = app.getPath('userData');
      } else {
        this._userDataDir = path.join(process.cwd(), '.test_data');
      }
    } catch {
      this._userDataDir = path.join(process.cwd(), '.test_data');
    }

    const userData = this._userDataDir;

    // Ensure essential directories exist
    const dirs = [
      userData,
      this.getPhotosDir(),
      this.getLogsDir(),
      this.getTempDir(),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  public static getUserDataDir(): string {
    if (!this._userDataDir) {
      try {
        if (app && typeof app.getPath === 'function') {
          this._userDataDir = app.getPath('userData');
        } else {
          this._userDataDir = path.join(process.cwd(), '.test_data');
        }
      } catch {
        this._userDataDir = path.join(process.cwd(), '.test_data');
      }
    }
    return this._userDataDir;
  }

  public static getDbPath(): string {
    return path.join(this.getUserDataDir(), 'birthday_buddy.db');
  }

  public static getPhotosDir(): string {
    return path.join(this.getUserDataDir(), 'photos');
  }

  public static getLogsDir(): string {
    return path.join(this.getUserDataDir(), 'logs');
  }

  public static getTempDir(): string {
    return path.join(this.getUserDataDir(), 'temp');
  }

  public static getAssetsDir(): string {
    if (app && app.isPackaged) {
      return path.join(process.resourcesPath, 'assets');
    }
    const appPath = (app && typeof app.getAppPath === 'function') ? app.getAppPath() : process.cwd();
    return path.join(appPath, 'src/assets');
  }
}
