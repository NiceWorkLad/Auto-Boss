// Renders the Android app icons and splash screens from the game's own sprite code (drawHero in
// sprites.js), into android/app/src/main/res. Run after npm run build:
//   npx --yes playwright@1.48.2 install chromium   (once)
//   node tools/app-icon.js
// It needs the playwright package; npm i --no-save playwright@1.48.2 if it isn't installed.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), RES = path.join(ROOT, 'android/app/src/main/res');
const DPI = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const SPLASH = { 'drawable': [480, 320], 'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280], 'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920] };
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto('file://' + path.join(ROOT, 'index.html')); await p.waitForTimeout(300);
  const files = await p.evaluate(([DPI, SPLASH]) => {
    const N = 64, mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
    // background: an 80s sunset over the sea and a neon grid floor
    const [bc, bg] = mk(), P = pixels(bg), H = 40;
    ['#12052a', '#1e0838', '#2a0b4a', '#4a0e6b', '#6a1278', '#8e1a7a', '#b0207a', '#d82a7a', '#ff4a7a', '#ff6a7a'].forEach((c, k) => P.rect(0, k * 4, N, 4, c));
    for (let y = 0; y < 16; y++) { const w = Math.round(Math.sqrt(256 - (16 - y) * (16 - y))); if (y < 8 || y % 3 !== 1) P.rect(32 - w, H - 16 + y, w * 2, 1, y < 6 ? '#fff1a8' : y < 11 ? '#ffd04a' : '#ff9a6a'); }
    P.rect(0, H, N, 4, '#1a5a8a'); P.rect(4, H + 1, 8, 1, '#9fe8ff'); P.rect(44, H + 2, 10, 1, '#9fe8ff');
    P.rect(0, H + 4, N, N - H - 4, '#2a0b3a'); P.rect(0, H + 4, N, 1, '#ff2bd6');
    for (const yy of [H + 7, H + 11, H + 17]) P.rect(0, yy, N, 1, '#a0207a');
    for (let k = -8; k <= 8; k++) for (let y = H + 4; y < N; y++) { const x = Math.round(32 + k * 5 * (1 + (y - H - 4) / 5)); if (x >= 0 && x < N) P.rect(x, y, 1, 1, '#a0207a'); }
    // foreground: the hero with his sword, with the game's outline
    const [fc, fg] = mk(), s = makeSprite(64, 64);
    drawHero(s.P, 32, 60, 0, 0, 4, 3, 'sword', false, null);
    s.stamp(fg, 28, 51);
    const [cc, cg] = mk(); cg.drawImage(bc, 0, 0); cg.drawImage(fc, 0, 0);
    // scale a 64-pixel layer up with hard pixels; round: cut to a circle; tile: the icon on the splash colour
    const out = {}, put = (name, c) => { out[name] = c.toDataURL().split(',')[1]; };
    const scaled = (src, size, round) => {
      const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      if (round) { g.beginPath(); g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); g.clip(); }
      g.drawImage(src, 0, 0, size, size); return c;
    };
    for (const [d, k] of Object.entries(DPI)) {
      put(`mipmap-${d}/ic_launcher.png`, scaled(cc, 48 * k)); put(`mipmap-${d}/ic_launcher_round.png`, scaled(cc, 48 * k, true));
      put(`mipmap-${d}/ic_launcher_foreground.png`, scaled(fc, 108 * k)); put(`mipmap-${d}/ic_launcher_background.png`, scaled(bc, 108 * k));
    }
    for (const [d, [w, h]] of Object.entries(SPLASH)) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.fillStyle = '#07040f'; g.fillRect(0, 0, w, h);
      const n = Math.floor(Math.min(w, h) * 0.4 / 64) * 64 || 64, x = Math.round((w - n) / 2), y = Math.round((h - n) / 2);
      g.fillStyle = '#ff2bd6'; g.fillRect(x + n / 16, y + n / 16, n, n);
      g.fillStyle = '#000'; g.fillRect(x - n / 32, y - n / 32, n + n / 16, n + n / 16);
      g.drawImage(cc, x, y, n, n); put(`${d}/splash.png`, c);
    }
    return out;
  }, [DPI, SPLASH]);
  for (const [f, data] of Object.entries(files)) fs.writeFileSync(path.join(RES, f), Buffer.from(data, 'base64'));
  // the adaptive icon's background is the sunset layer, not a flat colour
  fs.writeFileSync(path.join(RES, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptive);
  fs.writeFileSync(path.join(RES, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptive);
  console.log('wrote', Object.keys(files).length, 'images');
  await b.close();
})();
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
