// Pixel art. Every sprite is drawn with whole-pixel primitives into a small canvas, outlined, and
// scaled up without smoothing, so the arena stays crisp and chunky at any screen size.
// Art functions take (P, x, y, a): x is the sprite's centre, y the ground under its feet, and
// a = { t: seconds, wind: 0..1 slam wind-up, atk: 0..1 attack lunge, fury: below half HP }.

const OUTLINE = '#120818';

function pixels(g) {
  const P = {
    rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    ell(cx, cy, rx, ry, c) {
      g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); rx = Math.round(rx); ry = Math.round(ry);
      for (let dy = -ry; dy <= ry; dy++) {
        const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / ((ry + 0.5) * (ry + 0.5)))));   // +0.5 avoids 1px nubs at the poles
        g.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
      }
    },
    disc(cx, cy, r, c) { P.ell(cx, cy, r, r, c); },
    line(x0, y0, x1, y1, c, t = 1) {
      g.fillStyle = c;
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
      for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n - t / 2), Math.round(y0 + (y1 - y0) * i / n - t / 2), t, t);
    },
    // A stick from (x, y) at angle th (0 = straight up, negative leans left); returns the far end.
    stick(x, y, th, len, c, t) { const ex = x + Math.sin(th) * len, ey = y - Math.cos(th) * len; P.line(x, y, ex, ey, c, t); return [ex, ey]; },
    // Ellipse outline; half -1 draws only the top half, 1 only the bottom.
    ring(cx, cy, rx, ry, c, t = 1, half = 0) {
      g.fillStyle = c;
      for (let k = 0; k < 160; k++) {
        const a = k / 160 * Math.PI * 2, s = Math.sin(a);
        if (half && Math.sign(s) !== half) continue;
        g.fillRect(Math.round(cx + Math.cos(a) * rx - t / 2), Math.round(cy + s * ry - t / 2), t, t);
      }
    },
    // A cartoon eye: white, with a pupil looking left toward the hero.
    eye(x, y, r, a, pupil) {
      P.disc(x, y, r, '#ffffff');
      const p = Math.max(1, Math.round(r * 0.6));
      P.rect(x - r + 1 - (r > 2 ? 0 : 1), y - Math.floor(p / 2), p, p + (r > 2 ? 1 : 0), pupil || (a && (a.fury || a.wind) ? '#e0102a' : '#140c1c'));
    },
    tri(x, y, w, h, c, dir = -1) {  // a spike pointing up (dir -1) or down (1), base centred on x
      for (let i = 0; i < h; i++) { const ww = Math.max(1, Math.round(w * (h - i) / h)); P.rect(x - ww / 2, y + dir * i, ww, 1, c); }
    },
  };
  return P;
}

// The zone 1 cast: original animal-and-object hybrids. Big sprites, about 60-80px tall.
// a.wind: 0..1 during a telegraphed wind-up; a.atk: 0..1 just after an attack; a.fury: past a phase line.
const CAST_ART = {
  // Pellicano Cannolino: a pelican pilot whose beak is a giant cannoli. Flies, so it hovers.
  pelican(P, x, y, a) {
    const h = y - 34 + Math.round(Math.sin(a.t * 2.4) * 3), flap = Math.sin(a.t * 7);
    P.line(x + 2, h - 6, x + 28, h - 16 - Math.round(flap * 10), '#c8c8d4', 5);
    P.line(x + 4, h - 2, x + 26, h - 8 - Math.round(flap * 8), '#e0e0e8', 3);
    P.rect(x + 16, h - 3, 8, 4, '#c8c8d4');
    P.line(x + 1, h + 9, x - 1, h + 18, '#ff9a3a', 2); P.line(x + 8, h + 9, x + 9, h + 18, '#ff9a3a', 2);
    P.rect(x - 3, h + 17, 4, 2, '#ff9a3a'); P.rect(x + 7, h + 17, 4, 2, '#ff9a3a');
    P.ell(x + 4, h, 16, 11, '#f4f4f0'); P.ell(x + 6, h + 4, 12, 6, '#e2e2da');
    P.ell(x - 9, h - 10, 6, 9, '#f4f4f0'); P.disc(x - 12, h - 19, 7, '#f4f4f0');
    P.rect(x - 19, h - 27, 14, 3, '#6b3a1a'); P.rect(x - 18, h - 29, 10, 2, '#8b5a2b');        // pilot cap
    P.rect(x - 20, h - 22, 13, 4, '#6b3a1a');                                                  // goggles strap
    P.disc(x - 16, h - 20, 2, '#29e7ff'); P.disc(x - 10, h - 20, 2, '#29e7ff');
    P.rect(x - 17, h - 21, 1, 1, a.fury || a.wind ? '#e0102a' : '#120818'); P.rect(x - 11, h - 21, 1, 1, a.fury || a.wind ? '#e0102a' : '#120818');
    const wave = Math.round(Math.sin(a.t * 9) * 2);
    P.rect(x - 11, h - 13, 9, 3, '#ff3b5c'); P.line(x - 3, h - 12, x + 10, h - 15 + wave, '#ff3b5c', 2);   // scarf
    const open = Math.round(a.atk * 3 + a.wind * 2);
    P.rect(x - 36, h - 19, 18, 6, '#e8b070');                                                  // the cannoli beak
    for (let k = 0; k < 4; k++) P.rect(x - 33 + k * 4, h - 19, 1, 6, '#c98a40');
    P.disc(x - 36, h - 16, 3, '#fff8e8'); P.rect(x - 37, h - 17, 1, 1, '#3a1a08'); P.rect(x - 35, h - 15, 1, 1, '#3a1a08');
    P.ell(x - 27, h - 11 + open, 9, 3 + open, '#ffb08a');                                    // pouch
    if (a.wind) for (let k = 0; k < 3; k++) P.rect(x - 40 - k * 3, h - 17 + k, 2, 1, '#fff8e8');
  },
  // Tartaruga Lasagnona: a slow tortoise whose shell is a tray-baked lasagna. Armoured; reheats itself.
  tortoise(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.6)), lift = Math.round(a.wind * 5) - Math.round(a.atk * 3);
    for (const [lx, w] of [[-22, 9], [12, 9], [-10, 7], [2, 7]]) { P.rect(x + lx, y - 15, w, 15, '#5a9a3a'); P.rect(x + lx, y - 2, w, 2, '#3a7a2a'); P.rect(x + lx + 1, y - 1, 2, 1, '#f4f4f0'); }
    const layers = ['#e8c070', '#d8402a', '#f4eee0', '#e8c070', '#d8402a', '#f4eee0', '#e8c070'];
    layers.forEach((c, k) => {
      const yy = y - 14 - k * 5 + b, w = 30 - k * 3;
      P.rect(x - w, yy - 5, 2 * w, 5, c);
      if (c === '#e8c070') for (let xx = 0; xx < 2 * w; xx += 3) P.rect(x - w + xx, yy - 6, 2, 1, c);   // wavy pasta edge
      if (c === '#d8402a') for (let xx = 2; xx < 2 * w; xx += 7) P.rect(x - w + xx, yy - 3, 2, 2, '#a8281a');
    });
    P.ell(x + 2, y - 52 + b, 5, 2, '#39a83a'); P.ell(x + 6, y - 53 + b, 3, 1, '#5ac85a');      // basil on top
    P.rect(x - 34, y - 22 + b - lift, 8, 4, '#6aaa4a');                                         // neck
    P.ell(x - 37, y - 25 + b - lift, 8, 6, '#6aaa4a'); P.ell(x - 38, y - 22 + b - lift, 5, 2, '#8aca6a');
    if (a.fury || a.wind) P.eye(x - 40, y - 28 + b - lift, 2, a);
    else P.rect(x - 42, y - 28 + b - lift, 4, 1, '#120818');                                     // sleepy eye
    P.rect(x - 44, y - 23 + b - lift, 5, 1, '#2a5a1a');
    P.rect(x - 41, y - 33 + b - lift, 7, 3, '#ffffff'); P.rect(x - 40, y - 36 + b - lift, 5, 3, '#ffffff');   // chef's hat
    if (a.wind) for (let k = 0; k < 3; k++) { const sx = x - 12 + k * 12, wob = Math.round(Math.sin(a.t * 8 + k) * 2); P.rect(sx + wob, y - 58 + b - k * 2, 2, 4, '#f4f4f0'); P.rect(sx - wob, y - 63 + b - k * 2, 2, 3, '#e0e0e8'); }
  },
  // Polpo Pianissimo: an octopus grown into an upright piano. The lid slams; the keys play volleys.
  octopus(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2) * 2), purple = '#a050c0', light = '#d090e8';
    for (let k = 0; k < 5; k++) {
      const x0 = x - 16 + k * 8, s = Math.round(Math.sin(a.t * 3 + k) * 2), curl = k % 2 ? 4 : -4;
      P.line(x0, y - 16, x0 + s, y - 6, purple, 4); P.line(x0 + s, y - 6, x0 + s + curl, y - 1, purple, 3);
      P.rect(x0 - 1, y - 11, 1, 1, light); P.rect(x0 + s, y - 5, 1, 1, light);
    }
    P.rect(x - 22, y - 48 + b, 44, 34, '#1c1424'); P.rect(x - 22, y - 48 + b, 44, 2, '#3a2a4a'); P.rect(x + 18, y - 46 + b, 2, 30, '#2e2238');
    P.rect(x - 18, y - 22 + b, 36, 6, '#2a2034'); P.rect(x - 2, y - 21 + b, 4, 4, '#ffe14d');         // the pedal board and a brass plate
    P.rect(x - 24, y - 31 + b, 48, 7, '#f4f4f0');
    for (let k = 0; k < 15; k++) if (k % 7 !== 2 && k % 7 !== 6) P.rect(x - 22 + k * 3, y - 31 + b, 2, 4, '#120818');
    const lid = Math.round(a.wind * 10) + (a.fury ? 7 : 0);          // FORTISSIMO: the lid stays propped open
    P.line(x - 22, y - 49 + b, x + 22, y - 49 + b - lid, '#2a2034', 3);
    P.ell(x, y - 61 + b, 18, 13, '#b060d0'); P.ell(x - 4, y - 66 + b, 8, 4, '#c070e0');
    P.disc(x + 9, y - 67 + b, 2, light); P.disc(x - 11, y - 64 + b, 1, light);
    P.eye(x - 7, y - 60 + b, 4, a); P.eye(x + 6, y - 60 + b, 4, a);
    if (a.fury) {                                  // angry brows, and the keys glow red
      P.line(x - 12, y - 67 + b, x - 3, y - 64 + b, '#3a1048', 2); P.line(x + 11, y - 67 + b, x + 2, y - 64 + b, '#3a1048', 2);
      for (let k = 0; k < 15; k++) if (Math.floor(a.t * 8 + k) % 4 === 0) P.rect(x - 22 + k * 3, y - 27 + b, 2, 2, '#ff3b5c');
    }
    P.ring(x - 1, y - 52 + b, 2, 2, '#5a2070', 1);
    P.line(x - 16, y - 52 + b, x - 20 - Math.round(a.atk * 4), y - 32 + b, purple, 3);
    P.line(x + 16, y - 52 + b, x + 19, y - 32 + b, purple, 3);
    if (Math.floor(a.t * 2) % 2) { P.rect(x - 30, y - 78 + b, 1, 5, '#ffe14d'); P.rect(x - 32, y - 74 + b, 2, 2, '#ffe14d'); P.rect(x - 29, y - 78 + b, 3, 1, '#ffe14d'); }
    if (a.fury) { P.rect(x + 24, y - 80 + b, 1, 6, '#ff3b5c'); P.rect(x + 22, y - 75 + b, 2, 2, '#ff3b5c'); P.rect(x + 27, y - 80 + b, 1, 6, '#ff3b5c'); P.rect(x + 25, y - 75 + b, 2, 2, '#ff3b5c'); P.rect(x + 24, y - 80 + b, 4, 1, '#ff3b5c'); }
  },
};
// Sprite heights for HP bars, and the ones that fly (no shadow on the sand).
const ART_HEIGHT = { pelican: 62, tortoise: 60, octopus: 80, seagull: 34, jelly: 28 };
const HOVER_ART = ['pelican', 'seagull'];

// Zone 1 minions: small sprites, about 20-30px tall.
const MINION_ART = {
  crab(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 6)), shell = '#ff7a4a', claw = Math.round(a.atk * 4);
    for (let k = 0; k < 3; k++) {
      const s = Math.round(Math.sin(a.t * 10 + k) * 1);
      P.line(x - 5 - k * 2, y - 5, x - 9 - k * 2, y - 1 + s, '#c4482a'); P.line(x + 5 + k * 2, y - 5, x + 9 + k * 2, y - 1 - s, '#c4482a');
    }
    P.ell(x, y - 7 + b, 9, 5, shell); P.ell(x, y - 5 + b, 7, 2, '#ffb08a');
    P.rect(x - 8, y - 14 + b, 16, 5, '#a0a0a8'); P.rect(x - 8, y - 14 + b, 16, 1, '#c8c8d0');
    P.rect(x - 3, y - 13 + b, 1, 3, '#70707a'); P.rect(x + 3, y - 14 + b, 1, 2, '#70707a');
    P.rect(x - 4, y - 18 + b, 1, 4, shell); P.rect(x + 2, y - 18 + b, 1, 4, shell);
    P.eye(x - 4, y - 19 + b, 1.5, a); P.eye(x + 2, y - 19 + b, 1.5, a);
    P.disc(x - 12 - claw, y - 9 + b, 4, shell); P.rect(x - 16 - claw, y - 10 + b, 3, 1, '#2a0a0a');
    P.disc(x + 11, y - 9 + b, 3, shell);
  },
  seagull(P, x, y, a) {
    const h = y - 22 + Math.round(Math.sin(a.t * 3) * 2), flap = Math.sin(a.t * 14);
    P.line(x - 1, h - 1, x - 11, h - 2 - Math.round(flap * 6), '#b8c4cc', 2);
    P.line(x + 2, h - 1, x + 11, h - 2 - Math.round(flap * 6), '#b8c4cc', 2);
    P.ell(x, h, 7, 4, '#f4f4f4'); P.rect(x + 6, h - 1, 4, 2, '#9aa4ae');
    P.disc(x - 6, h - 3, 3, '#ffffff'); P.eye(x - 7, h - 4, 1.5, a);
    P.rect(x - 12 - Math.round(a.atk * 3), h - 3, 4, 2, '#ffb020');
    P.line(x + 1, h + 4, x + 1, h + 6, '#5a5a66'); P.disc(x + 1, h + 8, 2, '#3a3a46'); P.rect(x + 2, h + 5, 1, 1, '#ff5a3a');
  },
  jelly(P, x, y, a) {
    const h = y - 16 + Math.round(Math.sin(a.t * 2.5) * 2), pink = '#ff8fc8';
    for (let k = 0; k < 4; k++) {
      const tx = x - 5 + k * 3.3;
      for (let s = 0; s < 9; s++) P.rect(tx + Math.round(Math.sin(a.t * 5 + s * 0.7 + k) * 1.2), h + 1 + s, 1, 1, k % 2 ? '#ffb8dc' : '#e06aa8');
    }
    for (let dy = -7; dy <= 0; dy++) { const w = Math.round(9 * Math.sqrt(1 - (dy / 7.5) * (dy / 7.5))); P.rect(x - w, h + dy, 2 * w + 1, 1, pink); }
    P.rect(x - 9, h, 19, 1, '#e06aa8'); P.rect(x - 4, h - 6, 3, 1, '#ffe0f0');
    P.eye(x - 3, h - 3, 1.5, a); P.eye(x + 3, h - 3, 1.5, a);
    if (Math.floor(a.t * 8) % 3 === 0) { P.rect(x + 7, h - 7, 1, 2, '#29e7ff'); P.rect(x - 9, h - 4, 2, 1, '#29e7ff'); }
  },
  coconut(P, x, y, a) {
    const b = Math.abs(Math.round(Math.sin(a.t * 5) * 2)), cy = y - 9 - b;
    P.disc(x, cy, 9, '#6b4226');
    for (let k = 0; k < 8; k++) P.rect(x - 7 + k * 2, cy - 9 + (k % 3), 1, 2, '#8b5a2b');
    P.ell(x + 3, cy + 3, 4, 3, '#7a4a2a');
    P.rect(x - 7, cy - 3, 6, 3, '#120818'); P.rect(x + 1, cy - 3, 6, 3, '#120818'); P.rect(x - 1, cy - 2, 2, 1, '#120818');
    P.rect(x - 6, cy - 3, 2, 1, '#5a8fc0'); P.rect(x + 2, cy - 3, 2, 1, '#5a8fc0');
    P.rect(x - 4, cy + 3, 7, 1, '#f4e4c4'); P.rect(x - 5, cy + 2, 1, 1, '#f4e4c4');
  },
  // card allies (cards.js SUMMON_UNITS)
  // Chicco Sprintino: a coffee bean in a sweatband, always running.
  bean(P, x, y, a) {
    const run = Math.round(Math.sin(a.t * 18) * 2), cy = y - 9 - Math.abs(Math.round(Math.sin(a.t * 18)));
    P.line(x - 1, cy + 4, x - 3 + run, y, '#2a1838', 1); P.line(x + 1, cy + 4, x + 3 - run, y, '#2a1838', 1);
    P.ell(x, cy, 5, 6, '#6b3a1a'); P.line(x, cy - 5, x + 1, cy + 5, '#3a1a08'); P.rect(x - 3, cy - 3, 2, 1, '#8b5a2b');
    P.rect(x - 5, cy - 4, 10, 2, '#ff3b5c'); P.rect(x + 4, cy - 3, 3, 1, '#ff3b5c');
    P.eye(x - 2, cy - 1, 1.5, a);
    for (let k = 0; k < 3; k++) P.rect(x + 7 + k * 2, cy - 2 + k * 2, 2, 1, '#c8c8d0');
    P.line(x - 5, cy + 1, x - 8 - Math.round(a.atk * 3), cy - 1, '#6b3a1a');
  },
  banana(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 6)), cy = y - 12 + b;
    P.rect(x - 2, y - 4, 1, 4, '#5a3a1e'); P.rect(x + 2, y - 4, 1, 4, '#5a3a1e');
    for (let k = 0; k < 10; k++) P.rect(x - 3 + Math.round(Math.sin(k * 0.3) * 2), cy - 6 + k, 6, 1, k < 2 ? '#7a5a2a' : '#ffe14d');
    P.rect(x - 3, cy - 1, 6, 1, '#c99a00');
    P.eye(x - 1, cy - 2, 1.5, a); P.eye(x + 2, cy - 2, 1.5, a);
    P.line(x - 3, cy + 1, x - 7 - Math.round(a.atk * 3), cy - 1, '#ffe14d');
  },
  // Polpettino: a baby octopus in a bow tie. Small, sturdy, draws fire.
  polpetto(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 5)), cy = y - 11 + b;
    for (let k = 0; k < 4; k++) { const lx = x - 5 + k * 3, s = Math.round(Math.sin(a.t * 7 + k)); P.line(lx, cy + 4, lx + s, y - 1, '#a050c0', 2); }
    P.ell(x, cy, 7, 6, '#b060d0'); P.disc(x + 3, cy - 3, 1, '#d090e8');
    P.eye(x - 3, cy - 1, 1.5, a); P.eye(x + 2, cy - 1, 1.5, a);
    P.rect(x - 3, cy + 4, 2, 2, '#ff3b5c'); P.rect(x + 1, cy + 4, 2, 2, '#ff3b5c'); P.rect(x - 1, cy + 4, 2, 2, '#c8203a');
    P.line(x - 6, cy + 2, x - 10 - Math.round(a.atk * 3), cy, '#a050c0', 2);
  },
};
// Every enemy's art by key (zones.js names the key).
const ENEMY_ART = { ...CAST_ART, ...MINION_ART };

const WEAPON_COLORS = ['#c9b79c', '#b07a4a', '#c8ccd4', '#e6eaf2', '#29e7ff', '#ff7a4a', '#ffe14d', '#ff2bd6'];
const ARMOR_COLORS = ['#8a7a68', '#8a5a34', '#9aa3ad', '#c9d1db', '#7fd3ff', '#39d98a', '#ffd76a', '#ffffff'];

// The hero faces right. swing runs 1 -> 0 after each attack; alt flips which glove punches.
// Tiers pick the armour colour and the weapon's accent colour.
// cos (optional): the profile's cosmetics (profile.js). The outfit recolours cape, legs, boots and armour;
// the weapon skin replaces the weapon's accent colour. Purely visual.
function drawHero(P, x, y, t, swing, wt, at, weapon, alt, cos) {
  const o = (cos && cos.outfit) || {}, skinFx = (cos && cos.weaponSkin) || {};
  const b = Math.round(Math.sin(t * (weapon === 'guitar' ? 9 : 4)) * 0.6), armor = o.armour || ARMOR_COLORS[Math.min(at, 7)], tint = skinFx.tint || WEAPON_COLORS[Math.min(wt, 7)];
  const skin = '#f2c9a0', pants = o.pants || '#2a2140', boots = o.boots || '#4a3a2a';
  P.rect(x - 9, y - 21 + b, 4, 13, o.cape || '#d0306a');
  P.rect(x - 4, y - 8, 3, 8, pants); P.rect(x + 1, y - 8, 3, 8, pants);
  P.rect(x - 5, y - 2, 4, 2, boots); P.rect(x + 1, y - 2, 4, 2, boots);
  P.rect(x - 5, y - 19 + b, 10, 11, armor); P.rect(x - 5, y - 10 + b, 10, 2, '#5a3a20'); P.rect(x - 3, y - 17 + b, 2, 4, 'rgba(255,255,255,.35)');
  P.rect(x - 4, y - 27 + b, 8, 8, skin);
  P.rect(x - 5, y - 29 + b, 10, 5, armor); P.rect(x + 1, y - 24 + b, 2, 2, '#1a1222');
  if (at >= 3) P.rect(x - 1, y - 32 + b, 2, 3, '#ff2bd6');
  HERO_WEAPONS[weapon || 'sword'](P, x, y + b, swing, wt, tint, alt);
}

const HERO_WEAPONS = {
  sword(P, x, y, swing, wt, tint) {
    const th = 0.5 + swing * 1.9, len = 11 + Math.min(wt, 8);
    P.line(x + 3, y - 16, x + 7, y - 14, '#f2c9a0', 2);
    if (wt >= 4) P.stick(x + 7, y - 14, th, len, 'rgba(255,255,255,.5)', 4);
    P.stick(x + 7, y - 14, th, len, tint, 2);
    P.stick(x + 7, y - 14, th + Math.PI / 2, 3, '#ffe14d', 1); P.stick(x + 7, y - 14, th - Math.PI / 2, 3, '#ffe14d', 1);
  },
  gloves(P, x, y, swing, wt, tint, alt) {
    const jab = Math.round(Math.sin(Math.PI * swing) * 9), red = wt >= 4 ? tint : '#e02a2a';
    const front = alt ? 0 : jab, back = alt ? jab : 0;
    P.line(x, y - 18, x + 4 + back, y - 18, '#f2c9a0', 2); P.disc(x + 6 + back, y - 18, 3, red); P.rect(x + 4 + back, y - 20, 1, 1, '#ffffff');
    P.line(x + 2, y - 14, x + 6 + front, y - 14, '#f2c9a0', 2); P.disc(x + 8 + front, y - 14, 3, red); P.rect(x + 6 + front, y - 16, 1, 1, '#ffffff');
  },
  uzi(P, x, y, swing, wt, tint) {
    const r = swing > 0.5 ? 1 : 0, gx = x + 6 - r;
    P.line(x + 2, y - 15, gx, y - 15, '#f2c9a0', 2);
    P.rect(gx, y - 17, 9, 3, '#3a3a46'); P.rect(gx, y - 17, 9, 1, tint); P.rect(gx + 9, y - 16, 3, 1, '#2a2a34');
    P.rect(gx + 1, y - 14, 2, 3, '#2a2a34'); P.rect(gx + 4, y - 14, 2, 4, '#55556a');
    if (swing > 0.6) { P.rect(gx + 12, y - 17, 3, 3, '#ffe14d'); P.rect(gx + 13, y - 18, 1, 5, '#fff8c0'); P.rect(gx + 12, y - 16, 5, 1, '#fff8c0'); }
  },
  wand(P, x, y, swing, wt, tint) {
    const th = 1.0 - swing * 0.7, [ex, ey] = P.stick(x + 6, y - 16, th, 10, '#6b3a1a', 2);
    P.line(x + 2, y - 16, x + 6, y - 16, '#f2c9a0', 2);
    const c = wt >= 1 ? tint : '#ff2bd6', big = swing > 0.3 ? 2 : 1;
    P.rect(ex - big, ey, 2 * big + 1, 1, c); P.rect(ex, ey - big, 1, 2 * big + 1, c); P.rect(ex, ey, 1, 1, '#ffffff');
    if (swing > 0.3) for (let k = 0; k < 3; k++) P.rect(ex + Math.round(Math.cos(k * 2.1 + swing * 9) * 4), ey + Math.round(Math.sin(k * 2.1 + swing * 9) * 4), 1, 1, '#29e7ff');
  },
  guitar(P, x, y, swing, wt, tint) {
    const body = wt >= 4 ? tint : ['#ff2bd6', '#ff3b5c', '#29e7ff', '#ffe14d'][wt];
    P.line(x + 2, y - 14, x + 14, y - 24, '#8a5a34', 2); P.rect(x + 13, y - 27, 3, 3, '#120818');
    P.ell(x, y - 11, 5, 4, body); P.ell(x + 3, y - 14, 3, 3, body); P.disc(x + 1, y - 12, 1, '#120818');
    P.line(x - 2, y - 13, x + 13, y - 25, '#e8e8f0', 1);
    P.rect(x - 1, y - 15 + Math.round(swing * 4), 3, 2, '#f2c9a0');
  },
  bazooka(P, x, y, swing, wt, tint) {
    const r = Math.round(swing * 3), bx = x - 7 - r, ty = y - 21;
    P.rect(bx, ty, 21, 5, '#5a6a3a'); P.rect(bx + 3, ty, 2, 5, wt >= 1 ? tint : '#ffe14d');
    P.rect(bx + 20, ty - 1, 2, 7, '#2a2a34'); P.rect(bx - 1, ty, 1, 5, '#2a2a34');
    P.rect(bx + 9, ty - 3, 3, 3, '#2a2a34'); P.rect(bx + 10, ty + 5, 2, 3, '#2a2a34');
    P.line(x + 2, y - 13, bx + 11, ty + 6, '#f2c9a0', 2);
    if (swing > 0.6) { P.disc(bx - 3, ty + 2, 3, '#c8c8d0'); P.disc(bx + 24, ty + 2, 2, '#ffe14d'); }
  },
};

// Where each ranged weapon's shots leave from, relative to the hero's feet.
const MUZZLE = { uzi: [18, -16], wand: [14, -24], guitar: [10, -15], bazooka: [16, -19] };

// 16×16 icons for weapons, items and map nodes, drawn with the same primitives and outlined like the sprites.
const ICONS = {
  brutal(P) { P.disc(8, 7, 5, '#efe8ff'); P.rect(5, 11, 7, 3, '#efe8ff'); P.rect(5, 6, 2, 3, '#120818'); P.rect(10, 6, 2, 3, '#120818'); P.rect(8, 9, 1, 1, '#120818'); P.rect(7, 12, 1, 2, '#120818'); P.rect(9, 12, 1, 2, '#120818'); },
  greed(P) { P.disc(8, 10, 5, '#c9935a'); P.rect(6, 2, 4, 4, '#c9935a'); P.rect(5, 5, 6, 1, '#5a3a1e'); P.rect(7, 7, 2, 7, '#ffe14d'); P.rect(6, 8, 4, 1, '#ffe14d'); P.rect(6, 10, 4, 1, '#ffe14d'); P.rect(6, 12, 4, 1, '#ffe14d'); },
  armor(P) { P.rect(3, 4, 10, 10, '#c9d1db'); P.rect(1, 3, 4, 4, '#9aa3ad'); P.rect(11, 3, 4, 4, '#9aa3ad'); P.rect(6, 4, 4, 2, '#7a8490'); P.rect(8, 6, 1, 7, '#9aa3ad'); P.rect(4, 6, 2, 1, '#ffffff'); },
  bucket(P) { P.rect(4, 4, 8, 6, '#f2e6b0'); P.rect(1, 10, 14, 3, '#e8d48a'); P.rect(4, 8, 8, 2, '#ff2bd6'); P.rect(5, 5, 2, 1, '#ffffff'); P.rect(1, 12, 14, 1, '#c9b46a'); },
  shades(P) { P.rect(1, 6, 6, 4, '#120818'); P.rect(9, 6, 6, 4, '#120818'); P.rect(7, 7, 2, 1, '#c8c8d0'); P.rect(2, 7, 2, 1, '#29e7ff'); P.rect(10, 7, 2, 1, '#29e7ff'); P.rect(0, 6, 1, 2, '#c8c8d0'); P.rect(15, 6, 1, 2, '#c8c8d0'); },
  shorts(P) { P.rect(3, 3, 10, 4, '#29a8ff'); P.rect(3, 7, 4, 7, '#29a8ff'); P.rect(9, 7, 4, 7, '#29a8ff'); P.rect(3, 3, 10, 1, '#ffffff'); P.rect(4, 9, 2, 2, '#ffe14d'); P.rect(10, 6, 2, 2, '#ff2bd6'); },
  wetsuit(P) { P.rect(4, 2, 8, 4, '#1c1c24'); P.rect(4, 6, 3, 9, '#1c1c24'); P.rect(9, 6, 3, 9, '#1c1c24'); P.rect(4, 2, 8, 1, '#29e7ff'); P.rect(5, 6, 1, 8, '#29e7ff'); P.rect(10, 6, 1, 8, '#29e7ff'); },
  kneepads(P) { P.rect(3, 2, 3, 12, '#8a5a34'); P.rect(10, 2, 3, 12, '#8a5a34'); P.rect(2, 6, 5, 4, '#c9b46a'); P.rect(9, 6, 5, 4, '#c9b46a'); P.rect(3, 7, 3, 1, '#e8d48a'); P.rect(10, 7, 3, 1, '#e8d48a'); },
  flipflops(P) { P.ell(5, 9, 3, 6, '#ff7a2a'); P.ell(11, 8, 3, 6, '#ff7a2a'); P.line(5, 5, 3, 9, '#ffffff'); P.line(5, 5, 7, 9, '#ffffff'); P.line(11, 4, 9, 8, '#ffffff'); P.line(11, 4, 13, 8, '#ffffff'); },
  urchins(P) { P.ell(8, 12, 6, 3, '#6b4226'); P.disc(8, 8, 4, '#3a1a5a'); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; P.rect(8 + Math.round(Math.cos(a) * 6), 8 + Math.round(Math.sin(a) * 6), 1, 1, '#c77dff'); } },
  fins(P) { P.tri(5, 14, 6, 12, '#ffe14d', -1); P.tri(11, 14, 6, 12, '#ffe14d', -1); P.rect(3, 12, 4, 3, '#ff7a2a'); P.rect(9, 12, 4, 3, '#ff7a2a'); P.rect(5, 4, 1, 6, '#fff8c0'); },
  towel(P) { P.rect(3, 2, 10, 13, '#ff2bd6'); P.rect(3, 4, 10, 2, '#29e7ff'); P.rect(3, 9, 10, 2, '#29e7ff'); P.rect(3, 13, 10, 2, '#ffffff'); P.rect(2, 2, 12, 1, '#ffb8ec'); },
  vest(P) { P.rect(3, 3, 10, 11, '#ff3b5c'); P.rect(6, 3, 4, 3, '#2a1838'); P.rect(3, 7, 10, 2, '#ffffff'); P.rect(3, 11, 10, 1, '#ffffff'); P.rect(1, 3, 2, 4, '#ff3b5c'); P.rect(13, 3, 2, 4, '#ff3b5c'); },
  snorkel(P) { P.ell(8, 9, 6, 4, '#29e7ff'); P.ell(8, 9, 4, 2, '#bff8ff'); P.rect(2, 7, 2, 4, '#1a1a24'); P.rect(12, 7, 2, 4, '#1a1a24'); P.rect(13, 1, 2, 8, '#ffe14d'); P.rect(12, 1, 2, 1, '#ff2bd6'); },
  shell(P) { P.tri(8, 14, 13, 11, '#ffb08a'); for (let k = -2; k <= 2; k++) P.line(8, 14, 8 + k * 3, 4, '#e07a5a'); P.rect(6, 13, 5, 2, '#e07a5a'); P.rect(7, 5, 2, 1, '#ffffff'); },
  sunscreen(P) { P.rect(4, 4, 8, 11, '#ffe14d'); P.rect(6, 1, 4, 3, '#ff7a2a'); P.rect(4, 8, 8, 3, '#ff7a2a'); P.rect(6, 9, 4, 1, '#ffffff'); P.rect(5, 5, 1, 2, '#fff8c0'); },
  drink(P) { P.disc(8, 10, 5, '#6b4226'); P.ell(8, 7, 4, 1, '#f4e4c4'); P.line(9, 7, 13, 1, '#ff2bd6', 2); P.tri(4, 6, 5, 4, '#39ff88'); P.rect(6, 9, 2, 1, '#8b5a2b'); },
  duck(P) { P.ell(8, 11, 6, 4, '#ffe14d'); P.disc(5, 6, 3, '#ffe14d'); P.rect(1, 6, 2, 2, '#ff7a2a'); P.rect(4, 5, 1, 1, '#120818'); P.rect(11, 9, 3, 2, '#f2c22a'); },
  espresso(P) { P.rect(3, 6, 9, 7, '#f4eee2'); P.ring(13, 9, 2, 2, '#f4eee2', 1); P.rect(4, 6, 7, 2, '#6b3a1a'); P.ell(7, 14, 6, 1, '#d8d0c0'); P.rect(5, 2, 1, 3, '#c8c8d0'); P.rect(8, 1, 1, 4, '#c8c8d0'); },
  feather(P) { P.line(3, 14, 13, 2, '#e8eef2', 1); for (let k = 0; k < 8; k++) { P.line(4 + k, 13 - k * 1.4, 2 + k, 9 - k * 1.4, '#ffffff'); P.line(5 + k, 13 - k * 1.4, 9 + k, 12 - k * 1.4, '#b8c4cc'); } },
  map(P) { P.rect(2, 3, 13, 11, '#e8d8a8'); P.rect(2, 3, 13, 1, '#c8b888'); P.line(4, 11, 7, 7, '#8b5a2b'); P.line(7, 7, 10, 9, '#8b5a2b'); P.rect(11, 6, 3, 1, '#ff3b5c'); P.rect(12, 5, 1, 3, '#ff3b5c'); P.rect(5, 5, 2, 1, '#5a8fc0'); },
  campfire(P) { P.line(2, 14, 14, 11, '#8a5a34', 2); P.line(2, 11, 14, 14, '#6b4226', 2); P.tri(8, 11, 8, 9, '#ff7a2a'); P.tri(8, 11, 4, 6, '#ffe14d'); P.rect(8, 9, 1, 2, '#ffffff'); },
  chest(P) { P.rect(2, 6, 13, 9, '#8b5a2b'); P.rect(2, 4, 13, 4, '#a8703a'); P.rect(2, 9, 13, 1, '#ffe14d'); P.rect(7, 8, 3, 4, '#ffe14d'); P.rect(8, 9, 1, 2, '#5a3a1e'); P.rect(3, 5, 4, 1, '#c99060'); },
  question(P) { P.rect(5, 2, 7, 2, '#c77dff'); P.rect(11, 3, 2, 4, '#c77dff'); P.rect(8, 7, 4, 2, '#c77dff'); P.rect(7, 8, 2, 3, '#c77dff'); P.rect(7, 13, 2, 2, '#c77dff'); P.rect(4, 3, 2, 2, '#c77dff'); P.rect(6, 2, 2, 1, '#ffffff'); },
  // card icons by type, and the generic card back
  card(P) { P.rect(3, 1, 10, 14, '#1b0f36'); P.rect(3, 1, 10, 1, '#ff2bd6'); P.rect(3, 14, 10, 1, '#ff2bd6'); P.rect(3, 1, 1, 14, '#ff2bd6'); P.rect(12, 1, 1, 14, '#ff2bd6'); P.disc(8, 8, 3, '#ffe14d'); P.rect(8, 5, 1, 7, '#ff2bd6'); },
  cardBoost(P) { P.rect(3, 1, 10, 14, '#0f3a24'); P.rect(3, 1, 10, 1, '#39ff88'); P.rect(3, 14, 10, 1, '#39ff88'); P.tri(8, 11, 7, 6, '#39ff88'); P.rect(7, 10, 3, 3, '#39ff88'); },
  cardPact(P) { P.rect(3, 1, 10, 14, '#3a2008'); P.rect(3, 1, 10, 1, '#ffb020'); P.rect(3, 14, 10, 1, '#ffb020'); P.disc(6, 8, 2, '#ffb020'); P.disc(10, 8, 2, '#ff3b5c'); P.rect(6, 8, 5, 1, '#ffe14d'); },
  cardTrigger(P) { P.rect(3, 1, 10, 14, '#2a2a08'); P.rect(3, 1, 10, 1, '#ffe14d'); P.rect(3, 14, 10, 1, '#ffe14d'); P.line(10, 3, 6, 8, '#ffe14d', 2); P.line(6, 8, 10, 8, '#ffe14d', 2); P.line(10, 8, 6, 13, '#ffe14d', 2); },
  cardSummon(P) { P.rect(3, 1, 10, 14, '#08283a'); P.rect(3, 1, 10, 1, '#29e7ff'); P.rect(3, 14, 10, 1, '#29e7ff'); P.ell(8, 9, 3, 2, '#f4f4f4'); P.line(5, 8, 3, 5, '#b8c4cc'); P.line(11, 8, 13, 5, '#b8c4cc'); P.rect(4, 9, 2, 1, '#ffb020'); },
  cardMulti(P) { P.rect(3, 1, 10, 14, '#3a0838'); P.rect(3, 1, 10, 1, '#ff2bd6'); P.rect(3, 14, 10, 1, '#ff2bd6'); P.line(5, 5, 11, 11, '#ff2bd6', 2); P.line(11, 5, 5, 11, '#ff2bd6', 2); },
  cardOneuse(P) { P.rect(3, 1, 10, 14, '#2a1a08'); P.rect(3, 1, 10, 1, '#ff9a3a'); P.rect(3, 14, 10, 1, '#ff9a3a'); P.rect(5, 7, 6, 5, '#ffffff'); P.rect(11, 8, 2, 2, '#ffffff'); P.rect(6, 8, 4, 2, '#7a4a20'); P.rect(6, 4, 1, 2, '#c8c4d8'); P.rect(9, 3, 1, 3, '#c8c4d8'); },
  cardCursed(P) { P.rect(3, 1, 10, 14, '#1a0a20'); P.rect(3, 1, 10, 1, '#9b4dff'); P.rect(3, 14, 10, 1, '#9b4dff'); P.disc(8, 7, 3, '#e8e0f0'); P.rect(6, 9, 5, 2, '#e8e0f0'); P.rect(6, 6, 2, 2, '#1a0a20'); P.rect(9, 6, 2, 2, '#1a0a20'); P.rect(7, 10, 1, 1, '#1a0a20'); P.rect(9, 10, 1, 1, '#1a0a20'); },
  clsBruiser(P) { P.disc(5, 9, 4, '#e02a2a'); P.disc(11, 9, 4, '#e02a2a'); P.rect(3, 12, 10, 3, '#ffffff'); P.rect(4, 6, 2, 2, '#ff8a8a'); P.rect(10, 6, 2, 2, '#ff8a8a'); },
  clsHustler(P) { P.rect(3, 4, 10, 3, '#1a1222'); P.rect(1, 7, 14, 2, '#1a1222'); P.rect(3, 6, 10, 1, '#ff2bd6'); P.disc(8, 12, 3, '#ffe14d'); P.rect(8, 10, 1, 5, '#c99a00'); },
  clsRoadie(P) { P.rect(2, 6, 12, 8, '#3a3a46'); P.rect(2, 6, 12, 1, '#6a6a80'); P.rect(6, 4, 4, 2, '#2a2a34'); P.rect(4, 9, 2, 2, '#ffe14d'); P.rect(10, 9, 2, 2, '#29e7ff'); P.rect(7, 12, 2, 1, '#ff2bd6'); },
  clsGlass(P) { P.tri(8, 14, 9, 12, '#bff8ff'); P.tri(8, 14, 5, 9, '#ffffff'); P.line(5, 6, 11, 12, '#29e7ff'); P.rect(12, 2, 2, 2, '#ffe14d'); P.rect(2, 4, 1, 1, '#ffe14d'); },
  ench(P) { P.rect(3, 1, 10, 14, '#2a0b4a'); P.rect(3, 1, 10, 1, '#c77dff'); P.rect(3, 14, 10, 1, '#c77dff'); P.rect(3, 1, 1, 14, '#c77dff'); P.rect(12, 1, 1, 14, '#c77dff'); P.tri(8, 11, 6, 7, '#c77dff'); P.rect(7, 4, 2, 2, '#ffffff'); P.rect(5, 12, 6, 1, '#ff2bd6'); },
  cart(P) { P.rect(2, 5, 11, 6, '#ffb020'); P.rect(2, 5, 11, 1, '#ffe14d'); P.rect(4, 7, 2, 2, '#ff2bd6'); P.rect(8, 7, 3, 2, '#29e7ff'); P.line(13, 5, 15, 2, '#c8ccd4'); P.disc(5, 13, 2, '#3a3a46'); P.disc(11, 13, 2, '#3a3a46'); P.rect(5, 13, 1, 1, '#c8ccd4'); P.rect(11, 13, 1, 1, '#c8ccd4'); },
  crown(P) { P.rect(2, 10, 13, 4, '#ffe14d'); P.tri(3, 10, 3, 6, '#ffe14d'); P.tri(8, 10, 3, 8, '#ffe14d'); P.tri(13, 10, 3, 6, '#ffe14d'); P.rect(7, 11, 2, 2, '#ff2bd6'); },
  sword(P) { P.line(4, 12, 13, 3, '#e6eaf2', 2); P.line(3, 9, 7, 13, '#ffe14d', 2); P.line(1, 15, 4, 12, '#6b3a1a', 2); P.rect(12, 3, 1, 1, '#ffffff'); },
  gloves(P) { P.disc(7, 8, 5, '#e02a2a'); P.disc(12, 8, 2, '#e02a2a'); P.rect(3, 12, 8, 3, '#ffffff'); P.rect(4, 5, 2, 2, '#ff8a8a'); },
  uzi(P) { P.rect(1, 5, 11, 4, '#3a3a46'); P.rect(1, 5, 11, 1, '#6a6a80'); P.rect(12, 6, 4, 2, '#2a2a34'); P.rect(3, 9, 3, 5, '#2a2a34'); P.rect(8, 9, 2, 6, '#55556a'); },
  wand(P) { P.line(2, 14, 10, 6, '#6b3a1a', 2); P.rect(12, 1, 1, 7, '#ffe14d'); P.rect(9, 4, 7, 1, '#ffe14d'); P.rect(11, 3, 3, 3, '#ffe14d'); P.rect(12, 4, 1, 1, '#ffffff'); P.rect(4, 3, 1, 1, '#29e7ff'); P.rect(14, 10, 1, 1, '#ff2bd6'); },
  guitar(P) { P.line(7, 9, 14, 2, '#8a5a34', 2); P.rect(13, 0, 3, 3, '#120818'); P.ell(5, 11, 4, 4, '#ff2bd6'); P.ell(8, 8, 3, 3, '#ff2bd6'); P.disc(6, 10, 1, '#120818'); P.line(3, 13, 14, 2, '#e8e8f0', 1); },
  bazooka(P) { P.rect(1, 5, 13, 5, '#5a6a3a'); P.rect(3, 5, 2, 5, '#ffe14d'); P.rect(14, 4, 2, 7, '#2a2a34'); P.rect(0, 5, 1, 5, '#2a2a34'); P.rect(6, 3, 3, 2, '#2a2a34'); P.rect(8, 10, 2, 4, '#2a2a34'); },
};


// ---- Zone 2: Giungla Fusilli. Minions are small; elites and the boss are big. ----
Object.assign(MINION_ART, {
  // Fungo Funghettino: a polka-dot mushroom on stubby legs.
  fungo(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 4)), cy = y - 12 + b;
    P.rect(x - 3, y - 4, 2, 4, '#f4e8d0'); P.rect(x + 2, y - 4, 2, 4, '#f4e8d0');
    P.rect(x - 4, cy, 9, 8, '#f4e8d0'); P.eye(x - 2, cy + 3, 1.5, a); P.eye(x + 2, cy + 3, 1.5, a);
    for (let dy = -7; dy <= 0; dy++) { const w = Math.round(11 * Math.sqrt(1 - (dy / 7.5) * (dy / 7.5))); P.rect(x - w, cy + dy, 2 * w + 1, 1, '#e85a5a'); }
    P.disc(x - 5, cy - 3, 1, '#ffffff'); P.disc(x + 3, cy - 5, 1, '#ffffff'); P.disc(x + 7, cy - 2, 1, '#ffffff');
    P.line(x - 5, cy + 4, x - 9 - Math.round(a.atk * 3), cy + 2, '#f4e8d0');
  },
  // Rana Rigatona: a frog on four rigatoni legs. Crouches low before it leaps.
  rana(P, x, y, a) {
    const crouch = Math.round(a.wind * 3), hop = Math.round(Math.max(0, a.atk) * -6), cy = y - 12 + crouch + hop;
    for (const lx of [x - 8, x - 3, x + 3, x + 8]) { P.rect(lx - 1, cy + 4, 3, y - cy - 4, '#f0c870'); P.rect(lx - 1, cy + 6, 3, 1, '#c89a40'); P.rect(lx - 1, cy + 9, 3, 1, '#c89a40'); }
    P.ell(x, cy, 11, 6, '#5ac85a'); P.ell(x, cy + 2, 8, 3, '#a8e88a');
    P.disc(x - 5, cy - 6, 3, '#5ac85a'); P.disc(x + 4, cy - 6, 3, '#5ac85a');
    P.eye(x - 5, cy - 6, 2, a); P.eye(x + 4, cy - 6, 2, a);
    P.rect(x - 7, cy, 14, 1, '#2a6a2a');
  },
  // Scimmietta Spumoni: a monkey in three ice-cream stripes. Throws from the back row.
  scimmia(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 5)), cy = y - 14 + b;
    P.line(x + 5, cy + 4, x + 11, cy - 4 + b, '#8b5a2b', 2); P.ring(x + 12, cy - 6 + b, 2, 2, '#8b5a2b', 1);
    P.rect(x - 4, y - 5, 2, 5, '#8b5a2b'); P.rect(x + 2, y - 5, 2, 5, '#8b5a2b');
    P.rect(x - 5, cy, 10, 3, '#ff8fc8'); P.rect(x - 5, cy + 3, 10, 3, '#f4e8d0'); P.rect(x - 5, cy + 6, 10, 3, '#7aca7a');
    P.disc(x, cy - 5, 5, '#8b5a2b'); P.ell(x - 1, cy - 4, 3, 3, '#e8c8a0');
    P.disc(x - 6, cy - 6, 2, '#8b5a2b'); P.disc(x + 6, cy - 6, 2, '#8b5a2b');
    P.eye(x - 2, cy - 6, 1.5, a); P.eye(x + 1, cy - 6, 1.5, a);
    const arm = Math.round(a.atk * 6);
    P.line(x - 5, cy + 1, x - 8 - arm, cy - 4 - arm, '#8b5a2b', 2); P.disc(x - 9 - arm, cy - 5 - arm, 2, '#ffe14d');
  },
  // Pappagallo Pennetta: a green parrot with a pen-nib beak. Flies.
  pappagallo(P, x, y, a) {
    const h = y - 24 + Math.round(Math.sin(a.t * 3) * 2), flap = Math.sin(a.t * 13);
    P.line(x, h - 1, x + 9, h - 3 - Math.round(flap * 6), '#2a9a5a', 2); P.line(x + 1, h, x + 10, h + 1 - Math.round(flap * 4), '#ffe14d', 1);
    P.ell(x, h, 6, 4, '#39d98a'); P.rect(x + 5, h + 1, 6, 2, '#ff3b5c'); P.rect(x + 9, h + 2, 3, 1, '#29a8ff');
    P.disc(x - 5, h - 3, 3, '#39d98a'); P.eye(x - 6, h - 4, 1.5, a);
    P.tri(x - 9, h - 3, 3, 4, '#3a3a46', 1); P.rect(x - 10 - Math.round(a.atk * 2), h - 3, 2, 1, '#c8c8d0');
  },
});

Object.assign(CAST_ART, {
  // Gorilla Gnocchino: a gorilla built out of gnocchi. Huge, slow, armoured; long wind-ups.
  gorilla(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.8)), raise = Math.round(a.wind * 12), punch = Math.round(a.atk * 10);
    const gn = '#e8d4a0', dk = '#c8b07a';
    for (const lx of [x - 14, x + 6]) { P.rect(lx, y - 16, 10, 16, gn); for (let k = 0; k < 3; k++) P.rect(lx + 1, y - 14 + k * 5, 8, 1, dk); }
    P.ell(x, y - 34 + b, 20, 16, gn);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) P.rect(x - 14 + c * 8, y - 44 + r * 6 + b, 5, 1, dk);
    P.ell(x - 2, y - 30 + b, 10, 8, '#f4e8c8');
    P.disc(x - 6, y - 56 + b, 10, gn); P.ell(x - 9, y - 52 + b, 7, 4, '#f4e8c8');
    P.rect(x - 15, y - 61 + b, 16, 3, dk);                                       // heavy brow
    P.eye(x - 11, y - 57 + b, 2, a); P.eye(x - 3, y - 57 + b, 2, a);
    P.rect(x - 12, y - 51 + b, 6, 1, '#6b4a2a');
    P.line(x - 18, y - 42 + b, x - 26 - punch, y - 26 - raise + b, gn, 6); P.disc(x - 27 - punch, y - 25 - raise + b, 5, gn);
    P.line(x + 18, y - 42 + b, x + 24, y - 24 - raise + b, gn, 6); P.disc(x + 24, y - 22 - raise + b, 5, gn);
    P.rect(x - 4, y - 66 + b, 3, 4, '#39a83a');                                   // a basil sprig
  },
  // Bradipo Burrata: a sloth hanging from a vine, with a burrata belly. Heals; very slow.
  bradipo(P, x, y, a) {
    const sway = Math.round(Math.sin(a.t * 1.2) * 2), cy = y - 30;
    P.line(x + sway, y - 80, x + sway, cy - 22, '#3a8a2a', 3); for (let k = 0; k < 4; k++) P.ell(x + sway + (k % 2 ? 4 : -4), y - 76 + k * 12, 3, 2, '#5ac85a');
    P.line(x + sway, cy - 22, x - 10 + sway, cy - 14, '#8a7a6a', 4); P.line(x + sway, cy - 22, x + 10 + sway, cy - 14, '#8a7a6a', 4);
    P.ell(x + sway, cy, 16, 18, '#8a7a6a'); P.ell(x + sway, cy + 4, 11, 11, '#f4f4f0'); P.disc(x + 3 + sway, cy + 1, 3, '#ffffff');
    P.ell(x - 4 + sway, cy - 14, 9, 7, '#a8988a'); P.ell(x - 6 + sway, cy - 13, 6, 3, '#e8dcc8');
    P.rect(x - 11 + sway, cy - 16, 4, 2, '#3a2a1a'); P.rect(x - 3 + sway, cy - 16, 4, 2, '#3a2a1a');
    if (a.wind || a.fury) { P.eye(x - 9 + sway, cy - 15, 1.5, a); P.eye(x - 1 + sway, cy - 15, 1.5, a); }
    P.rect(x - 7 + sway, cy - 10, 3, 1, '#5a4a3a');
    P.line(x - 12 + sway, cy + 14, x - 16 + sway, cy + 24, '#8a7a6a', 4); P.line(x + 12 + sway, cy + 14, x + 16 + sway, cy + 24, '#8a7a6a', 4);
    if (a.wind) for (let k = 0; k < 4; k++) P.rect(x - 14 + k * 9 + sway, cy - 26 - ((a.t * 20 + k * 5) % 10), 2, 2, '#39ff88');
  },
  // Camaleonte Cannellone: a chameleon rolled up like a cannellone, curling tail, rolling eyes.
  camaleonte(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2)), shift = Math.floor(a.t * 1.5) % 3, skin = ['#3ab8a8', '#7aca3a', '#c87ae8'][shift];
    P.ring(x + 18, y - 18 + b, 8, 8, skin, 3); P.ring(x + 18, y - 18 + b, 4, 4, skin, 2);
    for (const lx of [x - 14, x - 4, x + 6]) { P.line(lx, y - 14, lx - 2, y, skin, 3); P.rect(lx - 4, y - 1, 5, 1, skin); }
    P.ell(x - 2, y - 24 + b, 20, 12, '#f0d8a0'); P.ell(x - 2, y - 24 + b, 16, 9, skin);
    for (let k = 0; k < 4; k++) P.rect(x - 14 + k * 8, y - 33 + b, 3, 18, '#f0d8a0');                 // the pasta wrapping
    P.rect(x - 16, y - 26 + b, 32, 2, '#d8402a');
    P.ell(x - 22, y - 30 + b, 9, 7, skin); P.tri(x - 22, y - 37 + b, 8, 5, skin);
    P.disc(x - 24, y - 32 + b, 4, '#f4f4f0'); P.rect(x - 25 + Math.round(Math.sin(a.t * 3) * 2), y - 33 + b, 2, 2, a.fury || a.wind ? '#e0102a' : '#120818');
    const tongue = Math.round(a.atk * 18);
    if (tongue) { P.line(x - 30, y - 27 + b, x - 30 - tongue, y - 26 + b, '#ff6aa8', 2); P.disc(x - 31 - tongue, y - 26 + b, 2, '#ff6aa8'); }
    P.rect(x - 31, y - 27 + b, 6, 1, '#2a5a4a');
  },
  // Tucano Tortellone: a toucan whose beak is one enormous tortellino. Flies, then hides, then regrows.
  tucano(P, x, y, a) {
    const h = y - 30 + Math.round(Math.sin(a.t * 2.2) * 3), flap = Math.sin(a.t * 6);
    P.line(x + 6, h - 8, x + 30, h - 18 - Math.round(flap * 12), '#1c1424', 6); P.line(x + 8, h - 4, x + 28, h - 8 - Math.round(flap * 9), '#2e2238', 4);
    P.rect(x + 18, h + 2, 10, 5, '#1c1424'); P.rect(x + 20, h + 6, 6, 3, '#ff3b5c');
    P.line(x + 2, h + 12, x, h + 22, '#29a8ff', 2); P.line(x + 10, h + 12, x + 11, h + 22, '#29a8ff', 2);
    P.ell(x + 6, h, 18, 14, '#1c1424'); P.ell(x + 2, h - 4, 10, 9, '#ffe14d'); P.ell(x + 2, h + 1, 7, 4, '#ff7a2a');
    P.disc(x - 8, h - 14, 9, '#1c1424'); P.ell(x - 10, h - 13, 6, 6, '#f4f4f0');
    P.disc(x - 11, h - 15, 3, '#29a8ff'); P.rect(x - 12, h - 16, 2, 2, a.fury || a.wind ? '#e0102a' : '#120818');
    const open = Math.round(a.atk * 4 + a.wind * 3);
    P.ell(x - 30, h - 14 - open / 2, 16, 7, '#f0c870'); P.ell(x - 30, h - 15 - open / 2, 12, 4, '#f8dc90');   // the tortellino beak
    P.ring(x - 30, h - 13, 6, 3, '#c89a40', 1); P.rect(x - 44, h - 13, 4, 2, '#ff7a2a');
    P.ell(x - 30, h - 6 + open, 13, 3, '#e8b860');
    for (let k = 0; k < 3; k++) P.rect(x - 38 + k * 6, h - 18, 2, 1, '#c89a40');
    if (a.fury) for (let k = 0; k < 5; k++) P.ell(x - 20 + k * 10, h + 16, 3, 2, '#39a83a');
    if (a.phase >= 2) { P.ring(x, h, 24 + Math.round(Math.sin(a.t * 4) * 2), 18, '#ffe14d', 1); P.disc(x - 11, h - 15, 1, '#ffe14d'); }   // TORTELLONE FOREVER: regrown and golden
  },
});
Object.assign(ART_HEIGHT, { gorilla: 70, bradipo: 74, camaleonte: 44, tucano: 66, pappagallo: 30, fungo: 24, rana: 22, scimmia: 28 });
HOVER_ART.push('tucano', 'pappagallo');

// The act 2 weapons in the hero's hands.
Object.assign(HERO_WEAPONS, {
  flamer(P, x, y, swing, wt, tint) {
    const r = swing > 0.5 ? 1 : 0, gx = x + 5 - r;
    P.rect(x - 9, y - 22, 5, 9, '#c83a1a'); P.rect(x - 9, y - 22, 5, 1, '#ff7a2a'); P.line(x - 6, y - 14, gx, y - 14, '#3a3a46', 1);
    P.line(x + 2, y - 15, gx, y - 15, '#f2c9a0', 2);
    P.rect(gx, y - 17, 10, 4, '#5a5a66'); P.rect(gx, y - 17, 10, 1, tint); P.rect(gx + 10, y - 16, 3, 2, '#2a2a34');
    if (swing > 0.3) { P.rect(gx + 13, y - 17, 2, 4, '#ffe14d'); P.rect(gx + 15, y - 16, 2, 2, '#ff7a2a'); }
  },
  freeze(P, x, y, swing, wt, tint) {
    const gx = x + 5;
    P.line(x + 2, y - 15, gx, y - 15, '#f2c9a0', 2);
    P.rect(gx, y - 18, 8, 5, '#e8eef2'); P.rect(gx, y - 18, 8, 1, tint); P.rect(gx + 8, y - 17, 2, 3, '#9aa3ad');
    P.rect(gx + 10, y - 18, 1, 5, '#29e7ff'); P.rect(gx + 11, y - 17, 1, 3, '#9fe8ff'); P.rect(gx + 2, y - 13, 2, 3, '#5a5a66');
    if (swing > 0.4) { P.rect(gx + 12, y - 16, 3, 1, '#ffffff'); P.rect(gx + 13, y - 17, 1, 3, '#ffffff'); }
  },
  boomerang(P, x, y, swing, wt, tint) {
    // the boomerang is in flight just after a throw, so the hand is empty then
    P.line(x + 2, y - 16, x + 6, y - 18 - Math.round(swing * 3), '#f2c9a0', 2);
    if (swing > 0.15) return;
    P.line(x + 6, y - 19, x + 10, y - 24, wt >= 4 ? tint : '#c8944a', 2); P.line(x + 6, y - 19, x + 12, y - 17, wt >= 4 ? tint : '#c8944a', 2);
  },
});
Object.assign(MUZZLE, { flamer: [18, -15], freeze: [17, -16], boomerang: [10, -20] });

Object.assign(ICONS, {
  flamer(P) { P.rect(1, 6, 4, 6, '#c83a1a'); P.rect(5, 7, 7, 4, '#5a5a66'); P.rect(12, 8, 2, 2, '#2a2a34'); P.tri(15, 9, 3, 2, '#ff7a2a'); P.rect(14, 6, 2, 1, '#ffe14d'); P.rect(14, 11, 2, 1, '#ffe14d'); P.rect(2, 6, 2, 1, '#ff7a2a'); },
  freeze(P) { P.rect(2, 6, 9, 5, '#e8eef2'); P.rect(2, 6, 9, 1, '#29e7ff'); P.rect(11, 7, 2, 3, '#9aa3ad'); P.rect(13, 5, 1, 7, '#29e7ff'); P.rect(14, 7, 2, 1, '#9fe8ff'); P.rect(4, 11, 2, 3, '#5a5a66'); P.rect(15, 3, 1, 1, '#ffffff'); },
  boomerang(P) { P.line(3, 12, 8, 3, '#c8944a', 3); P.line(8, 3, 14, 11, '#c8944a', 3); P.rect(8, 3, 1, 1, '#ffe14d'); P.rect(3, 12, 1, 1, '#8b5a2b'); P.rect(14, 11, 1, 1, '#8b5a2b'); },
});

Object.assign(ENEMY_ART, CAST_ART, MINION_ART);

// The Phase 5 weapons in the hero's hands: Ninja Stars (thrown, a star ready between throws) and the
// Sniper Rifle (long, with a scope; it kicks back when it fires).
Object.assign(HERO_WEAPONS, {
  stars(P, x, y, swing, wt, tint) {
    const reach = Math.round(Math.sin(Math.PI * swing) * 6);
    P.line(x + 2, y - 17, x + 6 + reach, y - 19 - Math.round(swing * 2), '#f2c9a0', 2);
    if (swing > 0.3) return;                      // just thrown: the hand is empty
    const cx = x + 8, cy = y - 20, c = wt >= 4 ? tint : '#c8ccd4';
    P.rect(cx - 2, cy, 5, 1, c); P.rect(cx, cy - 2, 1, 5, c); P.rect(cx, cy, 1, 1, '#2a2a34');
  },
  sniper(P, x, y, swing, wt, tint) {
    const k = Math.round(swing * 3), gx = x - 4 - k, gy = y - 18;
    P.rect(gx, gy, 24, 2, '#3a3a46'); P.rect(gx + 24, gy, 4, 1, '#2a2a34');          // the long barrel
    P.rect(gx - 3, gy, 6, 4, '#6b4a2a'); P.rect(gx + 6, gy - 3, 7, 2, '#2a2a34'); P.rect(gx + 12, gy - 3, 1, 2, wt >= 1 ? tint : '#29e7ff');   // stock, scope and lens
    P.rect(gx + 4, gy + 2, 2, 3, '#2a2a34');
    P.line(x + 2, y - 14, gx + 8, gy + 2, '#f2c9a0', 2);
    if (swing > 0.7) { P.disc(gx + 30, gy + 1, 2, '#ffe14d'); P.rect(gx + 28, gy, 6, 1, '#ffffff'); }
  },
});
Object.assign(MUZZLE, { stars: [12, -20], sniper: [26, -18] });
Object.assign(ICONS, {
  stars(P) { P.rect(2, 7, 12, 2, '#c8ccd4'); P.rect(7, 2, 2, 12, '#c8ccd4'); P.line(4, 4, 11, 11, '#9aa3ad', 1); P.line(11, 4, 4, 11, '#9aa3ad', 1); P.rect(7, 7, 2, 2, '#2a2a34'); },
  sniper(P) { P.rect(1, 8, 14, 2, '#3a3a46'); P.rect(0, 8, 4, 4, '#6b4a2a'); P.rect(5, 5, 6, 2, '#2a2a34'); P.rect(10, 5, 1, 2, '#29e7ff'); P.rect(6, 10, 2, 3, '#2a2a34'); P.rect(15, 8, 1, 1, '#ffe14d'); },
});
// The Magic Wand's toad: what any enemy turns into for a few seconds.
ENEMY_ART.toad = (P, x, y, a) => {
  const hop = Math.round(Math.abs(Math.sin(a.t * 5)) * -2), cy = y - 6 + hop;
  P.ell(x, cy, 8, 5, '#4a9a3a'); P.ell(x, cy + 2, 6, 2, '#8ad86a');
  P.disc(x - 4, cy - 5, 2, '#4a9a3a'); P.disc(x + 3, cy - 5, 2, '#4a9a3a');
  P.rect(x - 4, cy - 5, 1, 1, '#120818'); P.rect(x + 3, cy - 5, 1, 1, '#120818');
  P.rect(x - 3, cy, 6, 1, '#2a5a2a'); P.rect(x - 9, cy + 3, 3, 2, '#4a9a3a'); P.rect(x + 6, cy + 3, 3, 2, '#4a9a3a');
};
ART_HEIGHT.toad = 14;

const icons = {};
function iconURL(id) {
  if (icons[id]) return icons[id];
  const s = makeSprite(18, 18); s.ox = 0; s.oy = 0;
  s.g.translate(1, 1); ICONS[id](s.P); s.g.setTransform(1, 0, 0, 1, 0, 0);
  const out = document.createElement('canvas'); out.width = out.height = 18;
  s.stamp(out.getContext('2d'), 0, 0);
  return (icons[id] = out.toDataURL());
}

// A sprite canvas with an outline pass: draw art into it, then stamp it onto the world buffer.
function makeSprite(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), sil = document.createElement('canvas'); sil.width = w; sil.height = h;
  const sg = sil.getContext('2d');
  return {
    c, g, P: pixels(g), ox: w / 2, oy: h - 4,
    clear() { g.clearRect(0, 0, w, h); },
    // Stamp onto dst with its origin at (x, y). tint paints the whole sprite a colour at that alpha.
    stamp(dst, x, y, tint, alpha, rot, scale) {
      sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, w, h); sg.drawImage(c, 0, 0);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = OUTLINE; sg.fillRect(0, 0, w, h);
      dst.save(); dst.translate(Math.round(x), Math.round(y)); if (rot) dst.rotate(rot); if (scale) dst.scale(scale, scale);
      const dx = -this.ox, dy = -this.oy;
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) dst.drawImage(sil, dx + ox, dy + oy);
      dst.drawImage(c, dx, dy);
      if (tint) {
        sg.fillStyle = tint; sg.fillRect(0, 0, w, h);
        dst.globalAlpha = alpha; dst.drawImage(sil, dx, dy); dst.globalAlpha = 1;
      }
      dst.restore();
    },
  };
}

// Portraits of each enemy for the pre-fight cards, drawn once and cached.
const thumbs = {};
function enemyThumb(def) {
  if (thumbs[def.id]) return thumbs[def.id];
  const n = def.size === 'big' ? 100 : 44, s = makeSprite(n, n), out = document.createElement('canvas');
  ENEMY_ART[def.art](s.P, s.ox, s.oy, { t: 0, wind: 0, atk: 0, fury: false });
  out.width = out.height = n;
  const og = out.getContext('2d'); og.imageSmoothingEnabled = false;
  s.stamp(og, s.ox, s.oy);
  return (thumbs[def.id] = out.toDataURL());
}

// Event pictures: one fixed 160×80 pixel scene per event, shown above its text. Backgrounds are drawn
// straight onto the canvas; characters go through a sprite so they get the same outline as fighters.
const SCENE_W = 160, SCENE_H = 80;
const sceneBits = {
  night(P) {
    ['#05031a', '#0a0628', '#120a3a', '#1c0f4a', '#28145a'].forEach((c, k) => P.rect(0, k * 9, SCENE_W, 9, c));
    for (let k = 0; k < 30; k++) P.rect((k * 53) % SCENE_W, (k * 17) % 36, 1, 1, k % 3 ? '#b8a8ff' : '#ffffff');
    P.disc(132, 14, 7, '#fff1c8'); P.disc(135, 12, 6, '#0a0628');
  },
  dusk(P) { ['#3a0f5e', '#6a1a6e', '#a83a6a', '#e8705a', '#ffb36b'].forEach((c, k) => P.rect(0, k * 9, SCENE_W, 9, c)); P.disc(124, 40, 10, '#fff1a8'); },
  sea(P, top, night) {
    P.rect(0, top, SCENE_W, 10, night ? '#0a1a4a' : '#1a4a8a');
    for (let k = 0; k < 26; k++) P.rect((k * 37) % SCENE_W, top + 1 + (k * 7) % 8, 3 + k % 3, 1, night ? '#4a6ab0' : '#9fe8ff');
  },
  sand(P, top, night) {
    P.rect(0, top, SCENE_W, SCENE_H - top, night ? '#5a4a6a' : '#e8c890');
    for (let k = 0; k < 40; k++) P.rect((k * 29) % SCENE_W, top + 2 + (k * 11) % (SCENE_H - top - 2), 1, 1, night ? '#6a5a7a' : '#d0a870');
  },
};
function sceneChar(g, x, y, draw) {
  const s = makeSprite(90, 80);
  draw(s.P, s.ox, s.oy);
  s.stamp(g, x, y);
}
const EVENT_SCENES = {
  // Tricheco Gelatino at his cart, after dark.
  gelato(P, g) {
    sceneBits.night(P); sceneBits.sea(P, 40, true); sceneBits.sand(P, 50, true);
    P.rect(98, 50, 44, 18, '#f4f4f0'); P.rect(98, 56, 44, 3, '#ff8fc8'); P.disc(106, 69, 4, '#2a2034'); P.disc(134, 69, 4, '#2a2034');
    P.rect(99, 32, 1, 18, '#c8c8d0'); P.rect(140, 32, 1, 18, '#c8c8d0');
    for (let k = 0; k < 11; k++) P.rect(95 + k * 4, 28, 4, 6, k % 2 ? '#ff2bd6' : '#ffffff');
    for (const [cx, c] of [[106, '#ff8fc8'], [116, '#9fe8a8'], [126, '#fff1a8']]) { P.tri(cx, 50, 5, 6, '#e8b070', 1); P.disc(cx, 47, 3, c); }
    sceneChar(g, 70, 74, (P, x, y) => {
      P.ell(x, y - 12, 18, 12, '#8a5a3a'); P.ell(x + 2, y - 8, 12, 6, '#a8704a');
      P.ell(x - 14, y - 4, 6, 3, '#6b4226'); P.ell(x + 14, y - 4, 6, 3, '#6b4226');
      P.disc(x - 6, y - 28, 10, '#8a5a3a'); P.ell(x - 10, y - 24, 7, 4, '#c8946a');
      P.eye(x - 10, y - 32, 2, {}); P.eye(x - 3, y - 32, 2, {});
      for (const tx of [x - 14, x - 6]) { P.disc(tx, y - 21, 2, '#ff8fc8'); P.tri(tx, y - 19, 4, 9, '#e8b070', 1); }
      for (let k = 0; k < 3; k++) { P.line(x - 16, y - 25 + k * 2, x - 22, y - 26 + k * 3, '#e8e0d0'); }
      P.rect(x - 12, y - 41, 12, 3, '#f4f4f0'); P.rect(x - 10, y - 44, 8, 3, '#f4f4f0'); P.rect(x - 10, y - 41, 8, 1, '#ff2bd6');
    });
  },
  // The crab clerk outside the sandcastle tax office.
  tax(P, g) {
    sceneBits.dusk(P); sceneBits.sea(P, 40); sceneBits.sand(P, 50);
    const sx = 108, base = 64;
    P.rect(sx - 20, base - 26, 40, 26, '#d8b070'); P.rect(sx - 28, base - 34, 12, 34, '#c8a060'); P.rect(sx + 16, base - 34, 12, 34, '#c8a060');
    for (let k = 0; k < 3; k++) { P.rect(sx - 28 + k * 5, base - 37, 3, 3, '#c8a060'); P.rect(sx + 16 + k * 5, base - 37, 3, 3, '#c8a060'); P.rect(sx - 18 + k * 7, base - 29, 4, 3, '#d8b070'); }
    P.rect(sx - 5, base - 14, 10, 14, '#6b4226'); P.rect(sx - 8, base - 22, 16, 6, '#f4eee0');
    P.rect(sx - 2, base - 21, 1, 4, '#3a2a1a'); P.rect(sx - 3, base - 21, 3, 1, '#3a2a1a'); P.rect(sx + 2, base - 21, 1, 4, '#3a2a1a'); P.rect(sx + 3, base - 19, 1, 1, '#3a2a1a');
    P.rect(sx - 1, base - 50, 1, 14, '#6b4226'); P.rect(sx, base - 50, 9, 6, '#39a83a'); P.rect(sx + 3, base - 49, 2, 4, '#ffe14d');
    P.rect(28, 58, 40, 4, '#8b5a2b'); P.rect(30, 62, 2, 10, '#6b4226'); P.rect(64, 62, 2, 10, '#6b4226');
    for (let k = 0; k < 4; k++) P.rect(32 + k, 54 - k * 2, 12, 2, k % 2 ? '#f4f4f0' : '#e0e0e8');
    P.rect(56, 52, 6, 6, '#ff3b5c'); P.rect(58, 49, 2, 3, '#6b3a1a');
    sceneChar(g, 48, 58, (P, x, y) => { MINION_ART.crab(P, x, y, { t: 0.3, wind: 0, atk: 0 }); P.rect(x - 6, y - 22, 12, 2, '#39a83a'); P.rect(x - 8, y - 20, 6, 1, '#39a83a'); });
  },
  // Fenicottera Fettuccina auditions on the pier for three seagull judges.
  audition(P, g) {
    sceneBits.night(P); sceneBits.sea(P, 40, true);
    P.rect(0, 52, SCENE_W, 28, '#6b4226'); for (let k = 0; k < 16; k++) P.rect(k * 10, 52, 1, 28, '#4a2e18'); P.rect(0, 52, SCENE_W, 2, '#8b5a2b');
    for (let r = 0; r < 52; r++) { const w = Math.round(r * 0.45); P.rect(60 - w + Math.round(r * 0.35), r, 2 * w, 1, 'rgba(255,241,168,.16)'); }
    sceneChar(g, 62, 74, (P, x, y) => {
      for (const lx of [x - 3, x + 3]) for (let k = 0; k < 18; k++) P.rect(lx + Math.round(Math.sin(k * 0.8) * 2), y - 2 - k, 2, 1, '#f4d890');
      P.ell(x, y - 24, 10, 7, '#ff8fc8'); P.ell(x + 5, y - 26, 6, 4, '#ff6aa8');
      P.line(x - 6, y - 28, x - 10, y - 38, '#ff8fc8', 3); P.line(x - 10, y - 38, x - 6, y - 46, '#ff8fc8', 3);
      P.disc(x - 5, y - 48, 4, '#ff8fc8'); P.eye(x - 6, y - 49, 1.5, {});
      P.line(x - 9, y - 48, x - 14, y - 44, '#f4f4f0', 2); P.rect(x - 15, y - 44, 2, 2, '#120818');
      P.line(x + 8, y - 27, x + 16, y - 34, '#ff6aa8', 2); P.line(x - 8, y - 26, x - 15, y - 32, '#ff6aa8', 2);
    });
    [[112, 9], [128, 7], [144, 10]].forEach(([jx, score], k) => {
      sceneChar(g, jx, 70, (P, x, y) => MINION_ART.seagull(P, x, y + 12, { t: k, wind: 0, atk: 0 }));
      P.rect(jx - 6, 30, 12, 9, '#f4f4f0');
      if (score === 10) { P.rect(jx - 4, 32, 1, 5, '#120818'); P.ring(jx + 1, 34, 2, 2, '#120818', 1); }
      else { P.ring(jx, 33, 2, 1, '#120818', 1); P.rect(jx + 2, 33, 1, 4, '#120818'); if (score === 9) P.rect(jx - 2, 36, 4, 1, '#120818'); }
    });
  },
  // A message bottle on the shoreline.
  bottle(P, g) {
    sceneBits.dusk(P); sceneBits.sea(P, 40); P.rect(0, 50, SCENE_W, 6, '#1a6aa8'); sceneBits.sand(P, 56);
    for (let x = 0; x < SCENE_W; x += 2) P.rect(x, 55 + Math.round(Math.sin(x * 0.15) * 1.5), 2, 2, '#f4f4f0');
    for (let k = 0; k < 6; k++) { P.rect(18 + k * 12, 72 - (k % 2) * 3, 3, 2, '#c09060'); P.rect(22 + k * 12, 73 - (k % 2) * 3, 2, 1, '#c09060'); }
    sceneChar(g, 96, 70, (P, x, y) => {
      P.rect(x - 16, y - 10, 24, 9, '#2a8a4a'); P.rect(x - 16, y - 10, 24, 2, '#5ac87a'); P.rect(x + 8, y - 8, 7, 5, '#2a8a4a'); P.rect(x + 15, y - 8, 3, 5, '#a8703a');
      P.rect(x - 10, y - 8, 12, 4, '#f4eee0'); P.rect(x - 11, y - 8, 1, 4, '#d8d0b8'); P.rect(x + 2, y - 8, 1, 4, '#d8d0b8');
      for (let k = 0; k < 3; k++) P.rect(x - 8 + k * 4, y - 7, 2, 1, '#3a2a5a');
    });
    sceneChar(g, 132, 72, (P, x, y) => { P.ell(x, y - 4, 6, 4, '#ff7a4a'); P.rect(x - 3, y - 10, 1, 3, '#ff7a4a'); P.rect(x + 2, y - 10, 1, 3, '#ff7a4a'); P.eye(x - 3, y - 11, 1.5, {}); P.eye(x + 2, y - 11, 1.5, {}); });
  },
  // Bananito Bancario and his chart.
  banana(P, g) {
    sceneBits.dusk(P); sceneBits.sea(P, 40); sceneBits.sand(P, 50);
    P.rect(96, 14, 52, 36, '#f4f4f0'); P.rect(96, 14, 52, 2, '#c8c8d0'); P.line(100, 50, 96, 74, '#6b4226', 2); P.line(144, 50, 148, 74, '#6b4226', 2);
    P.rect(102, 18, 1, 28, '#3a3a46'); P.rect(102, 46, 42, 1, '#3a3a46');
    P.line(104, 42, 114, 36, '#ff3b5c', 2); P.line(114, 36, 122, 39, '#ff3b5c', 2); P.line(122, 39, 140, 20, '#ff3b5c', 2); P.tri(141, 18, 5, 4, '#ff3b5c', -1);
    P.rect(18, 58, 52, 4, '#c8c8d0'); P.line(22, 62, 18, 74, '#8a8a96', 1); P.line(66, 62, 70, 74, '#8a8a96', 1);
    P.disc(30, 54, 5, '#c9935a'); P.rect(28, 48, 4, 3, '#c9935a'); P.rect(29, 53, 2, 4, '#ffe14d');
    sceneChar(g, 78, 74, (P, x, y) => {
      P.rect(x - 4, y - 6, 2, 6, '#5a3a1e'); P.rect(x + 3, y - 6, 2, 6, '#5a3a1e');
      for (let k = 0; k < 30; k++) P.rect(x - 5 + Math.round(Math.sin(k * 0.1) * 4), y - 36 + k, 10, 1, k < 3 ? '#7a5a2a' : '#ffe14d');
      P.rect(x - 4, y - 24, 9, 1, '#c99a00');
      P.ring(x - 2, y - 27, 2, 2, '#120818', 1); P.ring(x + 4, y - 27, 2, 2, '#120818', 1); P.rect(x, y - 27, 2, 1, '#120818');
      P.rect(x - 2, y - 27, 1, 1, '#120818'); P.rect(x + 4, y - 27, 1, 1, '#120818');
      P.rect(x, y - 21, 3, 2, '#ff3b5c'); P.rect(x, y - 19, 3, 7, '#c8203a');
      P.line(x + 6, y - 22, x + 14, y - 30, '#ffe14d', 2);
    });
  },
  // Nonna Seppia's card table under a beach umbrella.
  cards(P, g) {
    sceneBits.night(P); sceneBits.sea(P, 40, true); sceneBits.sand(P, 50, true);
    for (let r = 0; r < 16; r++) { const w = Math.round(Math.sqrt(256 - (16 - r) * (16 - r)) * 2.6); for (let xx = -w; xx < w; xx += 6) P.rect(80 + xx, 6 + r, 6, 1, Math.floor((xx + 60) / 6) % 2 ? '#ff2bd6' : '#29e7ff'); }
    P.rect(79, 22, 2, 34, '#c8c8d0');
    P.rect(40, 52, 80, 6, '#5a2a8a'); P.rect(40, 58, 80, 10, '#4a1a7a'); for (let k = 0; k < 8; k++) P.rect(42 + k * 10, 66, 4, 2, '#ffe14d');
    P.disc(96, 47, 6, '#29e7ff'); P.disc(94, 45, 2, '#bff8ff'); P.rect(92, 52, 8, 2, '#ffe14d');
    [[54, '#ff3b5c'], [61, '#f4f4f0'], [68, '#ffe14d']].forEach(([cx, c], k) => { P.rect(cx, 44 + Math.abs(k - 1), 6, 9, c); P.rect(cx + 1, 45 + Math.abs(k - 1), 4, 7, '#2a1838'); P.rect(cx + 2, 47 + Math.abs(k - 1), 2, 2, c); });
    sceneChar(g, 76, 54, (P, x, y) => {
      P.ell(x, y - 14, 12, 14, '#e8b0a0'); P.ell(x, y - 18, 9, 8, '#f4c8b8');
      P.rect(x - 13, y - 30, 26, 6, '#7a2aa8'); P.rect(x - 14, y - 26, 4, 14, '#7a2aa8'); P.rect(x + 10, y - 26, 4, 14, '#7a2aa8');
      for (let k = 0; k < 6; k++) P.rect(x - 12 + k * 5, y - 25, 2, 1, '#ffe14d');
      for (const ex of [x - 5, x + 4]) { P.disc(ex, y - 17, 3, '#ffffff'); P.rect(ex - 2, y - 17, 1, 1, '#120818'); P.rect(ex - 1, y - 16, 1, 1, '#120818'); P.rect(ex, y - 17, 1, 1, '#120818'); P.rect(ex + 1, y - 16, 1, 1, '#120818'); P.rect(ex + 2, y - 17, 1, 1, '#120818'); }
      for (let k = 0; k < 5; k++) P.line(x - 8 + k * 4, y - 2, x - 9 + k * 4 + Math.round(Math.sin(k) * 2), y + 4, '#e8b0a0', 2);
    });
  },
};
const scenes = {};
function eventScene(id) {
  if (scenes[id]) return scenes[id];
  const c = document.createElement('canvas'); c.width = SCENE_W; c.height = SCENE_H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  (EVENT_SCENES[id] || sceneBits.dusk)(pixels(g), g);
  return (scenes[id] = c.toDataURL());
}

// Zone 2 event scenes, in the jungle.
sceneBits.jungle = P => {
  ['#06140a', '#0c2412', '#14361a', '#1e4a22', '#2a5e2a'].forEach((c, k) => P.rect(0, k * 10, SCENE_W, 10, c));
  for (let k = 0; k < 9; k++) { const tx = 6 + k * 19; P.rect(tx, 18, 4, 40, '#3a2a14'); P.disc(tx + 2, 16, 10, k % 2 ? '#1e5a22' : '#2a7a2a'); P.disc(tx - 4, 22, 6, '#2a7a2a'); }
  for (let k = 0; k < 7; k++) { const vx = 12 + k * 23; for (let y = 0; y < 18 + (k * 7) % 14; y++) P.rect(vx + Math.round(Math.sin(y * 0.3) * 1.5), y, 1, 1, '#5ac85a'); }
  P.rect(0, 58, SCENE_W, 22, '#2a1e0e'); for (let k = 0; k < 30; k++) P.rect((k * 31) % SCENE_W, 60 + (k * 7) % 18, 2, 1, '#4a3a1a');
};
Object.assign(EVENT_SCENES, {
  // A capybara captain at the spiral river.
  river(P, g) {
    sceneBits.jungle(P);
    P.rect(0, 50, SCENE_W, 16, '#1a5a8a'); for (let k = 0; k < 8; k++) P.ring(12 + k * 20, 58, 6, 3, '#9fe8ff', 1);
    P.rect(30, 52, 44, 5, '#8b5a2b'); for (let k = 0; k < 5; k++) P.rect(31 + k * 9, 52, 1, 5, '#5a3a1a');
    sceneChar(g, 52, 54, (P, x, y) => {
      P.ell(x, y - 7, 12, 7, '#a8784a'); P.ell(x - 9, y - 11, 6, 5, '#a8784a'); P.rect(x - 15, y - 10, 3, 2, '#5a3a1a');
      P.eye(x - 10, y - 13, 1.5, {}); P.rect(x - 7, y - 16, 2, 2, '#8a5a3a');
      P.rect(x - 14, y - 19, 10, 3, '#1c1c24'); P.rect(x - 12, y - 22, 6, 3, '#f4f4f0'); P.rect(x - 11, y - 21, 4, 1, '#ffe14d');
    });
    P.rect(122, 36, 2, 22, '#6b4226'); P.rect(110, 30, 26, 10, '#e8d8a8'); for (let k = 0; k < 4; k++) P.rect(113 + k * 5, 34, 3, 1, '#3a2a1a');
  },
  // The Golden Gnocco on its mossy plinth.
  shrine(P, g) {
    sceneBits.jungle(P);
    for (let k = 0; k < 4; k++) P.rect(56 - k * 6, 70 - k * 5, 48 + k * 12, 5, k % 2 ? '#8a8a96' : '#9a9aa8');
    P.rect(70, 36, 20, 18, '#8a8a96'); P.rect(68, 34, 24, 3, '#9a9aa8'); for (let k = 0; k < 6; k++) P.rect(66 + k * 5, 52 + (k % 2), 4, 2, '#3a8a2a');
    sceneChar(g, 80, 34, (P, x, y) => {
      P.ell(x, y - 6, 8, 6, '#ffe14d'); for (let k = 0; k < 4; k++) P.rect(x - 6 + k * 4, y - 10, 1, 8, '#c99a00'); P.rect(x - 3, y - 9, 2, 1, '#fff8c0');
    });
    for (let k = 0; k < 6; k++) { const an = k / 6 * Math.PI * 2; P.rect(80 + Math.round(Math.cos(an) * 14), 28 + Math.round(Math.sin(an) * 9), 1, 3, '#fff1a8'); }
  },
  // The parrot notary at a tiny desk.
  notary(P, g) {
    sceneBits.jungle(P);
    P.rect(46, 50, 60, 6, '#6b4226'); P.rect(50, 56, 4, 14, '#4a2e18'); P.rect(98, 56, 4, 14, '#4a2e18');
    for (let k = 0; k < 3; k++) P.rect(84 + k, 46 - k * 2, 14, 2, k % 2 ? '#f4f4f0' : '#e0e0e8');
    P.rect(56, 44, 6, 6, '#c8203a'); P.rect(58, 41, 2, 3, '#3a2a1a');
    sceneChar(g, 74, 50, (P, x, y) => {
      P.ell(x, y - 10, 8, 10, '#9aa3ad'); P.ell(x + 1, y - 7, 5, 6, '#c8ccd4');
      P.disc(x - 2, y - 22, 6, '#9aa3ad'); P.tri(x - 8, y - 22, 4, 5, '#3a3a46', 1);
      P.ring(x - 4, y - 23, 2, 1, '#ffe14d', 1); P.ring(x + 1, y - 23, 2, 1, '#ffe14d', 1); P.rect(x - 4, y - 23, 1, 1, '#120818'); P.rect(x + 1, y - 23, 1, 1, '#120818');
      P.rect(x + 6, y - 6, 4, 8, '#ff3b5c');
    });
  },
  // The sloth spa under a waterfall of warm olive oil.
  spa(P, g) {
    sceneBits.jungle(P);
    P.rect(100, 0, 22, 56, '#c8c84a'); for (let k = 0; k < 12; k++) P.rect(102 + (k * 7) % 18, (k * 9 + 3) % 54, 1, 4, '#f0f08a');
    P.ell(96, 62, 46, 8, '#b8b03a'); P.ell(96, 61, 40, 5, '#d8d05a');
    for (let k = 0; k < 3; k++) { const sx = 64 + k * 26, wob = k % 2; P.rect(sx + wob, 46 - k * 2, 2, 5, '#e0e0e8'); P.rect(sx - wob, 40 - k * 2, 2, 4, '#c8c8d0'); }
    sceneChar(g, 80, 64, (P, x, y) => {
      P.ell(x, y - 8, 12, 8, '#8a7a6a'); P.rect(x - 12, y - 10, 24, 4, '#f4f4f0'); P.rect(x - 12, y - 10, 24, 1, '#ff8fc8');
      P.ell(x - 3, y - 18, 7, 6, '#a8988a'); P.ell(x - 4, y - 17, 5, 3, '#e8dcc8');
      P.rect(x - 8, y - 19, 3, 2, '#3a2a1a'); P.rect(x - 2, y - 19, 3, 2, '#3a2a1a'); P.rect(x - 5, y - 14, 3, 1, '#5a4a3a');
      P.rect(x - 9, y - 25, 12, 3, '#f4f4f0'); P.rect(x - 7, y - 27, 8, 2, '#f4f4f0');
    });
  },
});
