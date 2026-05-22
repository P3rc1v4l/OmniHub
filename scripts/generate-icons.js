const path = require('path');
const fs   = require('fs');
const src    = path.join(__dirname, '../src/assets/icon.png');
const outDir = path.join(__dirname, '../src-tauri/icons');
if (!fs.existsSync(src)) { console.warn('[Icons] icon.png nicht gefunden'); process.exit(0); }
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
async function main() {
  try {
    const sharp = require('sharp');
    const img = sharp(src);
    const meta = await img.metadata();
    const side = Math.min(meta.width, meta.height);
    const left = Math.floor((meta.width  - side) / 2);
    const top  = Math.floor((meta.height - side) / 2);
    const base = sharp(src).extract({ left, top, width: side, height: side });
    await base.clone().resize(32,  32).png().toFile(path.join(outDir, '32x32.png'));
    await base.clone().resize(128,128).png().toFile(path.join(outDir, '128x128.png'));
    await base.clone().resize(256,256).png().toFile(path.join(outDir, '128x128@2x.png'));
    await base.clone().resize(512,512).png().toFile(path.join(outDir, 'icon.png'));
    fs.copyFileSync(path.join(outDir,'icon.png'), path.join(outDir,'icon.icns'));
    console.log('[Icons] PNG-Icons erstellt');
    try {
      const pngToIco = require('png-to-ico');
      const buf = await pngToIco([src]);
      fs.writeFileSync(path.join(outDir, 'icon.ico'), buf);
      console.log('[Icons] icon.ico erstellt');
    } catch(e) { console.warn('[Icons] ico übersprungen:', e.message); }
    console.log('[Icons] ✓ Fertig');
  } catch(e) { console.warn('[Icons] sharp fehlt, übersprungen:', e.message); }
}
main();
