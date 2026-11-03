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

  console.log('Main process & preload bundle completed successfully!');
}

buildMain().catch(err => {
  console.error('Build main failed:', err);
  process.exit(1);
});

