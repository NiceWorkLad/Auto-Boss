// Inlines the sources into template.html and writes index.html.
// node build.js [dir]   also writes the bare script to dir/check.js, for syntax checks
const fs = require('fs');
const strip = s => s.replace(/if \(typeof module[^\n]*\n?/g, '');
const js = ['rules.js', 'zones.js', 'run.js', 'sprites.js', 'sfx.js', 'render.js', 'ui.js'].map(f => strip(fs.readFileSync(f, 'utf8'))).join('\n');
const html = fs.readFileSync('template.html', 'utf8').replace('/*SCRIPT*/', () => js);
fs.writeFileSync('index.html', html);
if (process.argv[2]) fs.writeFileSync(process.argv[2] + '/check.js', js);
console.log('built index.html', html.length, 'bytes');
