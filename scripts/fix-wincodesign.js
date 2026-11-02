const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const localAppData = process.env.LOCALAPPDATA;
const cacheDir = path.join(localAppData, 'electron-builder', 'Cache', 'winCodeSign');
const zaExe = path.join(__dirname, '../node_modules/7zip-bin/win/x64/7za.exe');

console.log('Cache dir:', cacheDir);
if (fs.existsSync(cacheDir)) {
  const files = fs.readdirSync(cacheDir);
  console.log('Files in cache:', files);
  const sevenZipFile = files.find(f => f.endsWith('.7z'));

  if (sevenZipFile) {
    const archivePath = path.join(cacheDir, sevenZipFile);
    const destDir = path.join(cacheDir, 'winCodeSign-2.6.0');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    console.log(`Extracting ${archivePath} into ${destDir} excluding darwin...`);
    try {
      execSync(`"${zaExe}" x -snld -bd "${archivePath}" "-o${destDir}" "-x!*darwin*" -y`, {
        stdio: 'inherit'
      });
      console.log('winCodeSign extracted successfully without symlink errors!');
    } catch (err) {
      console.error('Extraction error:', err);
    }
  }
} else {
  console.log('winCodeSign cache dir not found.');
}

