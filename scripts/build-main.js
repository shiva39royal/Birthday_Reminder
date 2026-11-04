const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

async function buildMain() {
  const outDir = path.join(__dirname, '../out/main');
  const preloadDir = path.join(outDir, 'preload');

  if (!fs.existsSync(preloadDir)) {
    fs.mkdirSync(preloadDir, { recursive: true });
  }

  console.log('Bundling Main process with esbuild...');
  await build({
    entryPoints: [path.join(__dirname, '../src/main/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    outfile: path.join(outDir, 'index.js'),
    sourcemap: false,
    minify: false,
  });

  console.log('Bundling Preload scripts with esbuild...');
  await build({
    entryPoints: [path.join(__dirname, '../src/main/preload/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    outfile: path.join(preloadDir, 'index.js'),
    sourcemap: false,
    minify: false,
  });

  await build({
    entryPoints: [path.join(__dirname, '../src/main/preload/celebration-preload.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    outfile: path.join(preloadDir, 'celebration-preload.js'),
    sourcemap: false,
    minify: false,
  });

  // Copy sql-wasm.wasm
  const wasmSrc = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmDest = path.join(outDir, 'sql-wasm.wasm');
  if (fs.existsSync(wasmSrc)) {
    fs.copyFileSync(wasmSrc, wasmDest);
    console.log('Copied sql-wasm.wasm to out/main/');
  }

  // Copy demo photos to out/main/demo-photos
  const demoPhotosSrc = path.join(__dirname, '../src/assets/demo-photos');
  const demoPhotosDest = path.join(outDir, 'demo-photos');
  if (fs.existsSync(demoPhotosSrc)) {
    if (!fs.existsSync(demoPhotosDest)) {
      fs.mkdirSync(demoPhotosDest, { recursive: true });
    }
    const files = fs.readdirSync(demoPhotosSrc);
    for (const f of files) {
      fs.copyFileSync(path.join(demoPhotosSrc, f), path.join(demoPhotosDest, f));
    }
    console.log(`Copied ${files.length} demo photos to out/main/demo-photos`);
  }

  // Copy Team_Birthday_Template.xlsx to out/main/
  const templateSrc = path.join(__dirname, '../Team_Birthday_Template.xlsx');
  const templateDest = path.join(outDir, 'Team_Birthday_Template.xlsx');
  if (fs.existsSync(templateSrc)) {
    fs.copyFileSync(templateSrc, templateDest);
    console.log('Copied Team_Birthday_Template.xlsx to out/main/');
  }

  console.log('Main process & preload bundle completed successfully!');
}

buildMain().catch(err => {
  console.error('Build main failed:', err);
  process.exit(1);
});

