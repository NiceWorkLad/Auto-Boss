// Inlines the sources into template.html and writes index.html.
// node build.js [dir]   also writes the bare script to dir/check.js, for syntax checks
const fs = require('fs');
const strip = s => s.replace(/if \(typeof module[^\n]*\n?/g, '');
const js = ['rules.js', 'zones.js', 'items.js', 'cards.js', 'run.js', 'profile.js', 'sprites.js', 'sfx.js', 'render.js', 'ui.js'].map(f => strip(fs.readFileSync(f, 'utf8'))).join('\n');
// The fonts (fonts/, SIL OFL) are inlined too, so the page needs nothing from the network: the
// Android app runs offline.
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF';
const fonts = [['Press Start 2P', 'PressStart2P'], ['VT323', 'VT323']].flatMap(([family, file]) => [['latin', LATIN], ['latin-ext', LATIN_EXT]].map(([set, range]) =>
  `@font-face { font-family: '${family}'; font-style: normal; font-weight: 400; font-display: swap; unicode-range: ${range};
  src: url(data:font/woff2;base64,${fs.readFileSync(`fonts/${file}-${set}.woff2`).toString('base64')}) format('woff2'); }`)).join('\n');
const html = fs.readFileSync('template.html', 'utf8').replace('/*FONTS*/', () => fonts).replace('/*SCRIPT*/', () => js);
fs.writeFileSync('index.html', html);
// www/ is what the Android app (Capacitor) packages: the same page.
fs.mkdirSync('www', { recursive: true }); fs.writeFileSync('www/index.html', html);
if (process.argv[2]) fs.writeFileSync(process.argv[2] + '/check.js', js);
console.log('built index.html', html.length, 'bytes');
