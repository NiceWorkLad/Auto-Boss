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
  // hair (cosmetic): some of it behind the head, some out of the top of the helmet
  const hair = cos && cos.hair && cos.hair.style, hc = hair && cos.hair.color;
  if (hair === 'afro') P.disc(x - 1, y - 28 + b, 7, hc);
  if (hair === 'long') P.rect(x - 7, y - 28 + b, 4, 12, hc);
  if (hair === 'ponytail') { P.rect(x - 8, y - 27 + b, 4, 2, hc); P.rect(x - 9, y - 25 + b, 2, 6, hc); }
  P.rect(x - 4, y - 27 + b, 8, 8, skin);
  P.rect(x - 5, y - 29 + b, 10, 5, armor); P.rect(x + 1, y - 24 + b, 2, 2, '#1a1222');
  if (hair === 'mohawk') for (let k = 0; k < 4; k++) P.rect(x - 3 + k * 2, y - 33 + b + (k % 2), 2, 4 - (k % 2), hc);
  if (hair === 'spiky') for (let k = 0; k < 4; k++) { P.rect(x - 4 + k * 3, y - 31 + b, 2, 2, hc); P.rect(x - 3 + k * 3, y - 33 + b, 1, 2, hc); }
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
// The zone 3 and 4 casts: Deserto Dolce and Ghiacciaio Gelato.
Object.assign(ENEMY_ART, {
  // Scorpione Spaghettone: a sandy scorpion whose tail is one long curl of spaghetti, stinger first.
  scorpione(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 7)), cy = y - 6 + b, sting = Math.round(a.wind * 4) - Math.round(a.atk * 6);
    for (let k = 0; k < 3; k++) { const s = Math.round(Math.sin(a.t * 12 + k)); P.line(x - 3 + k * 4, cy + 2, x - 5 + k * 4 + s, y, '#a8702a'); }
    P.ell(x, cy, 9, 4, '#d8a040'); for (let k = 0; k < 4; k++) P.rect(x - 6 + k * 4, cy - 3, 1, 6, '#b8802a');
    P.ell(x - 9, cy - 1, 4, 3, '#d8a040'); P.eye(x - 10, cy - 3, 1.5, a); P.eye(x - 7, cy - 4, 1.5, a);
    const cl = Math.round(a.atk * 4); P.line(x - 11, cy, x - 15 - cl, cy - 2, '#c8902a', 2); P.disc(x - 17 - cl, cy - 3, 3, '#d8a040'); P.rect(x - 20 - cl, cy - 3, 3, 1, '#7a4a1a');
    let px = x + 8, py = cy - 2;                                                    // the spaghetti tail
    for (let k = 1; k <= 12; k++) { const an = k / 12 * Math.PI * 1.2, nx = x + 10 + Math.round(Math.sin(an) * 7) - Math.round(k * 0.6), ny = cy - 2 - Math.round((1 - Math.cos(an)) * 8) - Math.round(k * 0.4); P.line(px, py, nx, ny, '#f4d890', 2); px = nx; py = ny; }
    P.tri(px - 2 - sting, py + 1, 3, 4, '#c8203a', 1);
  },
  // Cactus Caciotta: a cactus in a cheese-wheel sun hat. Prickly to hit.
  cactus(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2)), g = '#4a9a4a', d = '#2a7a3a';
    P.rect(x - 5, y - 26 + b, 10, 26 - b, g); P.rect(x - 5, y - 26 + b, 2, 26 - b, '#6aba5a'); P.rect(x + 3, y - 26 + b, 2, 26 - b, d);
    const arm = Math.round(a.atk * 3);
    P.rect(x - 11 - arm, y - 18 + b, 6, 4, g); P.rect(x - 11 - arm, y - 24 + b, 4, 7, g);
    P.rect(x + 5, y - 14 + b, 5, 4, g); P.rect(x + 7, y - 20 + b, 4, 7, g);
    for (let k = 0; k < 8; k++) P.rect(x - 6 + (k % 2) * 12, y - 24 + k * 3 + b, 1, 1, '#e8f4c8');
    P.ell(x, y - 28 + b, 9, 3, '#f4e4a0'); P.ell(x, y - 30 + b, 6, 2, '#ffeec0'); P.rect(x - 2, y - 30 + b, 3, 1, '#e8c870');
    P.eye(x - 2, y - 21 + b, 1.5, a); P.eye(x + 2, y - 21 + b, 1.5, a); P.rect(x - 1, y - 17 + b, 3, 1, d);
    P.disc(x + 9, y - 22 + b, 2, '#ff8fc8');
  },
  // Cammello Cannolo: a camel whose two humps are cannoli. It sips from one to heal.
  cammello(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 3)), c = '#c8945a', st = Math.round(Math.sin(a.t * 6) * 1.5);
    for (const lx of [-7, -3, 4, 8]) P.rect(x + lx + (lx < 0 ? st : -st), y - 9, 2, 9, '#a8743a');
    P.ell(x + 1, y - 13 + b, 11, 5, c);
    for (const hx of [-3, 6]) { P.rect(hx + x - 3, y - 22 + b, 6, 8, '#e8b070'); for (let k = 0; k < 3; k++) P.rect(hx + x - 3, y - 21 + k * 3 + b, 6, 1, '#c98a40'); P.ell(hx + x, y - 22 + b, 3, 1, '#fff8e8'); }
    const sip = Math.round(a.wind * 6);
    P.line(x - 9, y - 14 + b, x - 13, y - 24 + b + sip, c, 4); P.ell(x - 16, y - 25 + b + sip, 5, 3, c); P.rect(x - 21, y - 25 + b + sip, 3, 2, '#a8743a');
    P.eye(x - 16, y - 27 + b + sip, 1.5, a); P.rect(x - 14, y - 29 + b + sip, 2, 2, '#a8743a');
    P.line(x + 12, y - 13 + b, x + 14, y - 8 + b, '#a8743a');
  },
  // Avvoltoio Arancino: a vulture with a fried rice-ball body, circling.
  avvoltoio(P, x, y, a) {
    const h = y - 24 + Math.round(Math.sin(a.t * 2.5) * 3), flap = Math.sin(a.t * 9);
    P.line(x - 2, h - 2, x - 13, h - 4 - Math.round(flap * 7), '#3a2a3a', 3); P.line(x + 2, h - 2, x + 13, h - 4 - Math.round(flap * 7), '#3a2a3a', 3);
    P.disc(x, h, 7, '#d8802a'); for (let k = 0; k < 7; k++) P.rect(x - 5 + (k * 5) % 10, h - 5 + (k * 3) % 9, 1, 1, '#ffb050');
    P.ell(x - 4, h - 7, 4, 2, '#f4f4f0');
    P.line(x - 5, h - 8, x - 8, h - 13, '#e89a9a', 2); P.disc(x - 9, h - 14, 3, '#e89a9a'); P.eye(x - 10, h - 15, 1.2, a);
    P.rect(x - 14 - Math.round(a.atk * 3), h - 14, 3, 2, '#e8d070'); P.rect(x - 14 - Math.round(a.atk * 3), h - 12, 1, 1, '#e8d070');
    P.line(x - 1, h + 6, x - 2, h + 9, '#e8d070'); P.line(x + 2, h + 6, x + 3, h + 9, '#e8d070');
  },
  // Scarabeo Scamorza: a scarab pushing a smoked scamorza the size of a car. Elite.
  scarabeo(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2)), roll = a.t * 2 + a.atk * 2, push = Math.round(a.wind * -3 + a.atk * -6);
    const bx = x - 18 + push, by = y - 18;
    if (!a.fury) {                             // the cheese (gone once the ball rolls)
      P.disc(bx, by, 18, '#d8b880'); P.disc(bx - 3, by - 4, 13, '#e8cc98'); P.ell(bx, by + 10, 16, 6, '#b8945a');
      for (let k = 0; k < 4; k++) { const an = roll + k * Math.PI / 2; P.line(bx, by, bx + Math.round(Math.cos(an) * 17), by + Math.round(Math.sin(an) * 17), '#8a5a2a'); }
      P.ell(bx, by - 17, 4, 2, '#8a5a2a'); P.rect(bx - 1, by - 21, 2, 4, '#8a5a2a');
    }
    for (let k = 0; k < 3; k++) { const s = Math.round(Math.sin(a.t * 6 + k) * 2); P.line(x + 2 + k * 7, y - 16, x - 2 + k * 7 + s, y, '#1a3a34', 2); }
    P.ell(x + 10, y - 22 + b, 16, 12, '#2a6a5a'); P.ell(x + 10, y - 26 + b, 13, 8, '#3a8a7a'); P.line(x + 10, y - 34 + b, x + 10, y - 12 + b, '#1a4a40');
    P.ell(x + 5, y - 30 + b, 4, 2, '#8ae8c8');                                        // the sheen
    P.ell(x - 7, y - 22 + b, 6, 5, '#1a4a40'); P.eye(x - 9, y - 24 + b, 2, a); P.rect(x - 14, y - 32 + b, 2, 8, '#ffd76a'); P.rect(x - 16, y - 33 + b, 4, 2, '#ffd76a');
    P.line(x - 10, y - 20 + b, x - 14 + push, y - 18, '#1a3a34', 2);
    if (a.fury) for (let k = 0; k < 3; k++) P.rect(x + 4 + k * 6, y - 38 + b - Math.abs(Math.round(Math.sin(a.t * 10 + k) * 2)), 2, 3, '#ff3b5c');
  },
  // Serpente Sedanino: a snake of ridged sedanini tubes, coiled, head raised to bite.
  serpente(P, x, y, a) {
    const g = '#8ac83a', d = '#5a9a2a', sway = Math.round(Math.sin(a.t * 2.2) * 3), strike = Math.round(a.atk * 8 - a.wind * 3);
    for (let r = 0; r < 3; r++) { P.ell(x + 6, y - 5 - r * 7, 18 - r * 4, 5, g); for (let k = -16 + r * 4; k < 18 - r * 4; k += 3) P.rect(x + 6 + k, y - 8 - r * 7, 1, 6, d); }
    let px = x + 2, py = y - 24;                                                      // the neck, up and over
    for (let k = 1; k <= 8; k++) { const nx = x + 2 - Math.round(k * 1.6) - Math.round(strike * k / 8), ny = y - 24 - Math.round(Math.sin(k / 8 * Math.PI * 0.8) * 22) + Math.round(sway * k / 8); P.line(px, py, nx, ny, g, 5); if (k % 2) P.rect(nx - 2, ny - 1, 5, 1, d); px = nx; py = ny; }
    P.ell(px - 6, py, 8, 5, g); P.ell(px - 6, py + 2, 7, 2, '#c8e88a');
    P.eye(px - 7, py - 2, 2, a); P.eye(px - 2, py - 3, 2, a);
    P.rect(px - 15, py + 1, 3, 1, '#c8203a'); P.rect(px - 17, py, 2, 1, '#c8203a'); P.rect(px - 17, py + 2, 2, 1, '#c8203a');
    if (a.wind) { P.rect(px - 13, py + 3, 1, 3, '#f4f4f0'); P.rect(px - 10, py + 3, 1, 3, '#f4f4f0'); P.disc(px - 12, py + 7, 1, '#5ae85a'); }
  },
  // Faraone Farfallone: a pharaoh bandaged in farfalle, before a golden sarcophagus. Boss.
  faraone(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.8) * 2), gold = '#ffd76a', lapis = '#2a4aa8';
    P.rect(x - 6, y - 66 + b, 30, 62, '#c8943a'); P.rect(x - 4, y - 64 + b, 26, 58, gold);            // the sarcophagus behind
    for (let k = 0; k < 5; k++) P.rect(x - 4, y - 54 + k * 10 + b, 26, 2, k % 2 ? lapis : '#c8943a');
    P.ell(x + 9, y - 60 + b, 9, 5, '#e8b84a');
    P.rect(x - 12, y - 40 + b, 18, 36 - b, '#f4ecd8');                                              // the body, wrapped in bow ties
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { const fx = x - 11 + c * 6 + (r % 2) * 2, fy = y - 38 + r * 6 + b; P.tri(fx, fy + 2, 3, 3, '#e8d8a8', 1); P.tri(fx + 4, fy + 2, 3, 3, '#e8d8a8', 1); P.rect(fx + 2, fy + 1, 1, 2, '#c8b080'); }
    P.rect(x - 14, y - 4, 22, 4, '#e8d8a8');
    P.disc(x - 3, y - 46 + b, 8, '#f4ecd8');                                                         // head and nemes
    P.rect(x - 13, y - 53 + b, 20, 6, gold); for (let k = 0; k < 5; k++) P.rect(x - 13 + k * 4, y - 53 + b, 2, 6, lapis);
    P.rect(x - 14, y - 48 + b, 4, 14, gold); P.rect(x + 4, y - 48 + b, 4, 14, gold); for (let k = 0; k < 3; k++) { P.rect(x - 14, y - 46 + k * 4 + b, 4, 1, lapis); P.rect(x + 4, y - 46 + k * 4 + b, 4, 1, lapis); }
    P.rect(x - 4, y - 57 + b, 3, 4, gold); P.disc(x - 3, y - 58 + b, 1, '#ff3b5c');
    const glow = a.fury || a.wind ? '#ff3b5c' : '#29e7ff';
    P.rect(x - 7, y - 47 + b, 3, 2, glow); P.rect(x - 1, y - 47 + b, 3, 2, glow);
    P.rect(x - 4, y - 41 + b, 3, 5, '#3a6ab0'); P.rect(x - 4, y - 36 + b, 3, 1, gold);
    const reach = Math.round(a.atk * 6 + a.wind * 3);
    P.line(x - 11, y - 30 + b, x - 19 - reach, y - 35 + b, '#f4ecd8', 4);                                // the crook
    P.rect(x - 22 - reach, y - 50 + b, 2, 18, gold); P.ring(x - 19 - reach, y - 50 + b, 3, 3, gold, 2, -1);
    if (a.fury) for (let k = 0; k < 4; k++) P.rect(x - 26 + k * 12, y - 72 + b + Math.round(Math.sin(a.t * 6 + k) * 2), 2, 2, '#ffe14d');
  },
  // Pinguino Pizzicotto: a penguin in a pizza chef's hat. It slides in on its belly to pinch.
  pinguino(P, x, y, a) {
    const slide = a.atk > 0.2, b = Math.round(Math.abs(Math.sin(a.t * 9)));
    if (slide) {
      P.ell(x - 2, y - 5, 10, 5, '#2a2a3a'); P.ell(x - 3, y - 4, 7, 3, '#f4f4f0'); P.rect(x - 15, y - 7, 4, 2, '#ff9a3a'); P.eye(x - 9, y - 8, 1.2, a);
      P.rect(x - 11, y - 12, 6, 3, '#ffffff'); for (let k = 0; k < 4; k++) P.rect(x + 10 + k * 3, y - 2 - k, 2, 1, '#d8f0ff');
      return;
    }
    P.ell(x, y - 10 - b, 6, 9, '#2a2a3a'); P.ell(x - 1, y - 8 - b, 4, 6, '#f4f4f0');
    P.rect(x - 4, y - 1, 3, 1, '#ff9a3a'); P.rect(x + 1, y - 1, 3, 1, '#ff9a3a');
    P.line(x - 6, y - 13 - b, x - 9, y - 7 - b, '#2a2a3a', 2); P.line(x + 6, y - 13 - b, x + 8, y - 7 - b, '#2a2a3a', 2);
    P.eye(x - 2, y - 15 - b, 1.5, a); P.rect(x - 7, y - 14 - b, 4, 2, '#ff9a3a');
    P.rect(x - 4, y - 21 - b, 8, 3, '#ffffff'); P.ell(x, y - 23 - b, 5, 3, '#ffffff'); P.rect(x - 4, y - 19 - b, 8, 1, '#e0e0e8');
  },
  // Foca Focaccia: a seal under a thick rosemary focaccia. The bread is armour.
  foca(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2.4)), lunge = Math.round(a.atk * 3);
    P.ell(x + 2, y - 7, 13, 6, '#8a98a8'); P.ell(x + 2, y - 5, 11, 3, '#b8c4d0');
    P.rect(x - 8, y - 15 + b, 20, 6, '#e8b860'); P.rect(x - 8, y - 15 + b, 20, 1, '#f8d890'); P.rect(x - 8, y - 10 + b, 20, 1, '#c8903a');
    for (let k = 0; k < 6; k++) { P.rect(x - 6 + k * 3, y - 13 + b + (k % 2), 1, 1, '#a8702a'); if (k % 2) P.rect(x - 5 + k * 3, y - 14 + b, 2, 1, '#3a8a3a'); }
    P.ell(x - 13 - lunge, y - 11, 6, 5, '#8a98a8'); P.eye(x - 15 - lunge, y - 13, 1.5, a); P.rect(x - 19 - lunge, y - 10, 2, 1, '#2a2a3a');
    for (let k = 0; k < 3; k++) P.line(x - 18 - lunge, y - 9 + k, x - 23 - lunge, y - 10 + k * 2, '#e8eef2');
    P.ell(x + 15, y - 3, 4, 2, '#6a7888');
  },
  // Pupazzo Panettone: a snowman of three panettoni, lobbing snowballs from the back.
  pupazzo(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2)), throwA = Math.round(a.atk * 4);
    const dome = (cy, r) => { P.ell(x, cy, r, Math.round(r * 0.8), '#c88a3a'); P.ell(x, cy - Math.round(r * 0.5), Math.round(r * 0.8), Math.round(r * 0.35), '#8a5a2a'); for (let k = 0; k < 4; k++) P.rect(x - r + 2 + k * Math.round(r / 2), cy + (k % 2), 1, 1, '#4a2a1a'); };
    dome(y - 6, 8); dome(y - 17 + b, 6); dome(y - 26 + b, 5);
    P.rect(x - 4, y - 32 + b, 8, 1, '#f4f4f0'); P.rect(x - 3, y - 36 + b, 6, 4, '#2a2a3a');
    P.eye(x - 2, y - 27 + b, 1.2, a); P.eye(x + 2, y - 27 + b, 1.2, a); P.rect(x - 6, y - 26 + b, 3, 1, '#ff7a2a');
    P.line(x - 5, y - 18 + b, x - 10 - throwA, y - 23 + b, '#6b4226'); P.line(x + 5, y - 18 + b, x + 10, y - 22 + b, '#6b4226');
    if (a.atk < 0.2) P.disc(x - 11, y - 24 + b, 2, '#ffffff');
  },
  // Gufo Grissino: an owl on two breadstick legs, swooping out of the snow.
  gufo(P, x, y, a) {
    const h = y - 26 + Math.round(Math.sin(a.t * 2.8) * 2), flap = Math.sin(a.t * 10), swoop = Math.round(a.atk * 4);
    P.line(x - 3, h - 1, x - 12, h - 4 - Math.round(flap * 6), '#a8946a', 3); P.line(x + 3, h - 1, x + 12, h - 4 - Math.round(flap * 6), '#a8946a', 3);
    P.ell(x - swoop, h, 7, 8, '#c8b8a0'); P.ell(x - swoop, h + 2, 5, 5, '#e8dcc8');
    for (let k = 0; k < 3; k++) P.rect(x - 3 + k * 3 - swoop, h + 1 + (k % 2) * 2, 1, 1, '#a8946a');
    P.rect(x - 5 - swoop, h - 9, 2, 3, '#a8946a'); P.rect(x + 3 - swoop, h - 9, 2, 3, '#a8946a');
    P.eye(x - 3 - swoop, h - 4, 2.5, a); P.eye(x + 3 - swoop, h - 4, 2.5, a); P.tri(x - swoop, h - 1, 2, 3, '#ffb020', 1);
    for (const lx of [-2, 2]) { P.rect(x + lx - swoop, h + 7, 1, 10, '#e8c070'); P.rect(x + lx - swoop, h + 9, 1, 1, '#c8903a'); P.rect(x + lx - swoop, h + 13, 1, 1, '#c8903a'); }
  },
  // Orso Ossobuco: a polar bear with a marrow bone for a helmet. Rears up and comes down. Elite.
  orso(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.8) * 2), rear = Math.round(a.wind * 8) - Math.round(a.atk * 4), w = '#f0f0f4', s = '#c8d0dc';
    P.rect(x - 6, y - 14, 9, 14, w); P.rect(x + 10, y - 14, 9, 14, w); P.rect(x - 6, y - 2, 9, 2, s); P.rect(x + 10, y - 2, 9, 2, s);
    P.ell(x + 6, y - 30 + b - rear, 20, 18, w); P.ell(x + 10, y - 26 + b - rear, 14, 12, '#e0e4ec');
    P.disc(x - 12, y - 50 + b - rear, 11, w); P.ell(x - 20, y - 46 + b - rear, 6, 4, s); P.rect(x - 26, y - 47 + b - rear, 3, 2, '#2a2a3a');
    P.disc(x - 18, y - 59 + b - rear, 3, w); P.disc(x - 5, y - 60 + b - rear, 3, w);
    P.ring(x - 11, y - 60 + b - rear, 8, 4, '#f4ecd8', 3, -1); P.disc(x - 11, y - 63 + b - rear, 3, '#c8603a'); P.disc(x - 11, y - 63 + b - rear, 1, '#ffd0a0');   // the marrow bone helmet
    P.eye(x - 15, y - 52 + b - rear, 2, a); P.eye(x - 8, y - 52 + b - rear, 2, a);
    const paw = Math.round(a.atk * 6);
    P.line(x - 6, y - 38 + b - rear, x - 20 - paw, y - 30 + b - rear * 2, w, 7);
    for (let k = 0; k < 3; k++) P.rect(x - 25 - paw + k * 2, y - 29 + b - rear * 2, 1, 3, '#2a2a3a');
    if (a.fury) { P.line(x - 18, y - 57 + b - rear, x - 13, y - 55 + b - rear, '#3a3a46', 2); P.line(x - 4, y - 57 + b - rear, x - 9, y - 55 + b - rear, '#3a3a46', 2); }
  },
  // Yeti Ricottino: a huge, soft yeti of fresh ricotta, with its own snowmen. Elite.
  yeti(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.6) * 2), w = '#f4f4ee', sh = '#d8dce4';
    P.rect(x - 8, y - 14, 10, 14, w); P.rect(x + 8, y - 14, 10, 14, w);
    P.ell(x + 4, y - 34 + b, 22, 24, w);
    for (let k = 0; k < 18; k++) P.rect(x - 14 + (k * 7) % 36, y - 52 + b + (k * 11) % 40, 2, 1, sh);
    P.ell(x - 4, y - 44 + b, 10, 9, '#8ab8e8'); P.ell(x - 4, y - 41 + b, 7, 5, '#a8d0f4');
    P.eye(x - 8, y - 47 + b, 2.5, a); P.eye(x, y - 47 + b, 2.5, a);
    P.rect(x - 8, y - 39 + b, 8, 2, '#2a3a5a'); P.rect(x - 7, y - 39 + b, 2, 2, '#ffffff'); P.rect(x - 3, y - 39 + b, 2, 2, '#ffffff');
    const arm = Math.round(a.atk * 6 + a.wind * 4);
    P.line(x - 14, y - 34 + b, x - 24 - arm, y - 20 + b, w, 8); P.line(x + 22, y - 34 + b, x + 28, y - 18 + b, w, 8);
    for (let k = 0; k < 3; k++) P.rect(x - 28 - arm + k * 3, y - 17 + b, 2, 3, '#8ab8e8');
    if (a.wind) for (let k = 0; k < 4; k++) P.disc(x - 30 - k * 3, y - 24 + b - k * 2, 1, '#ffffff');
  },
  // Mammut Mascarpone: a woolly mammoth in a coat of mascarpone, tusks of ice-cream cone. Boss.
  mammut(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.5) * 2), fur = '#f0e4c8', dk = '#c8b088', raise = Math.round(a.wind * 10) - Math.round(a.atk * 4);
    for (const lx of [-14, -2, 14, 26]) { P.rect(x + lx, y - 20, 10, 20, dk); P.rect(x + lx, y - 3, 10, 3, '#8a7050'); }
    P.ell(x + 8, y - 40 + b, 32, 24, fur);
    for (let k = 0; k < 14; k++) { const sx = x - 18 + (k * 9) % 54, sy = y - 56 + b + (k * 13) % 34; P.ring(sx, sy, 3, 2, '#e0d0a8', 1, 1); }
    P.ell(x + 12, y - 62 + b, 18, 6, '#ffffff'); P.ell(x + 8, y - 66 + b, 10, 4, '#ffffff'); P.disc(x + 20, y - 67 + b, 2, '#c8203a');   // a dollop on top, a cherry
    P.ell(x - 20, y - 46 + b, 14, 14, fur); P.ell(x - 24, y - 54 + b, 8, 6, dk);
    P.eye(x - 26, y - 48 + b, 2.5, a); P.eye(x - 18, y - 49 + b, 2.5, a);
    if (a.fury) { P.line(x - 30, y - 54 + b, x - 24, y - 52 + b, '#5a4030', 2); P.line(x - 14, y - 55 + b, x - 19, y - 52 + b, '#5a4030', 2); }
    let tx = x - 28, ty = y - 40 + b;                                                  // the trunk, raised for the avalanche
    for (let k = 1; k <= 6; k++) { const nx = x - 29 - Math.round(k * 1.2), ny = y - 40 + b + k * 4 - Math.round(raise * k / 3); P.line(tx, ty, nx, ny, dk, 8 - k); P.rect(nx - 2, ny, 4, 1, '#a89068'); tx = nx; ty = ny; }
    for (const [ox, oy] of [[-24, -34], [-12, -32]]) {                               // waffle-cone tusks with a scoop at the root
      const sx = x + ox, sy = y + oy + b;
      for (let k = 0; k < 14; k++) P.rect(sx - k - Math.round(k * k / 30), sy + Math.round(k * 0.6) - Math.round(k * k / 9), 3, 3, k % 3 ? '#e8b070' : '#c98a40');
      P.disc(sx + 1, sy - 1, 3, ox < -20 ? '#9ae8a8' : '#ff8fc8');
    }
    if (a.fury) for (let k = 0; k < 5; k++) P.rect(x - 30 + k * 16, y - 74 + b + Math.round(Math.sin(a.t * 5 + k) * 2), 2, 2, '#9fe8ff');
  },
});
Object.assign(ART_HEIGHT, { scorpione: 22, cactus: 32, cammello: 30, avvoltoio: 36, scarabeo: 44, serpente: 52, faraone: 68, pinguino: 26, foca: 18, pupazzo: 36, gufo: 40, orso: 70, yeti: 62, mammut: 76 });
HOVER_ART.push('avvoltoio', 'gufo');

// The zone 5 and 6 casts: Vulcano Vesuvietto and Carbonara City.
Object.assign(ENEMY_ART, {
  // Salamandra Salamino: a salami-spotted salamander, still sizzling from the lava.
  salamandra(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 8)), lunge = Math.round(a.atk * 4), r = '#d8402a';
    for (let k = 0; k < 4; k++) { const s = Math.round(Math.sin(a.t * 14 + k * 1.6) * 2); P.line(x - 6 + k * 5, y - 5, x - 8 + k * 5 + s, y, '#a82a1a', 2); }
    P.ell(x, y - 6 + b, 9, 3, r); P.line(x + 8, y - 6 + b, x + 16, y - 9 + Math.round(Math.sin(a.t * 5) * 2), r, 2);
    for (const [sx, sy] of [[-4, -7], [1, -6], [5, -7]]) { P.disc(x + sx, y + sy + b, 1, '#f4c8b8'); P.rect(x + sx, y + sy + b, 1, 1, '#8a1a1a'); }
    P.ell(x - 11 - lunge, y - 7 + b, 4, 3, r); P.eye(x - 12 - lunge, y - 9 + b, 1.2, a); P.rect(x - 15 - lunge, y - 6 + b, 2, 1, '#5a0a0a');
    if (Math.random() < 0.3) P.rect(x - 2 + Math.round(Math.random() * 6), y - 11 + b, 1, 1, '#ffb020');
  },
  // Golem Gorgonzola: a squat rock golem with a blue-veined gorgonzola heart.
  golem(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2)), arm = Math.round(a.wind * -5 + a.atk * 6), g = '#6a6a76', d = '#4a4a56';
    P.rect(x - 7, y - 6, 5, 6, d); P.rect(x + 2, y - 6, 5, 6, d);
    P.rect(x - 9, y - 22 + b, 18, 17, g); P.rect(x - 9, y - 22 + b, 18, 2, '#8a8a96'); P.rect(x + 6, y - 20 + b, 3, 15, d);
    P.disc(x, y - 14 + b, 4, '#f0ecd8'); P.line(x - 2, y - 16 + b, x + 2, y - 12 + b, '#4a6ab0'); P.rect(x + 1, y - 17 + b, 1, 3, '#4a6ab0');
    P.rect(x - 6, y - 27 + b, 11, 6, g); P.eye(x - 3, y - 25 + b, 1.2, a, '#ff7a2a'); P.eye(x + 2, y - 25 + b, 1.2, a, '#ff7a2a');
    P.rect(x - 15 - arm, y - 20 + b - Math.max(0, -arm), 6, 9, g); P.rect(x + 9, y - 19 + b, 5, 8, g);
  },
  // Peperoncino Pazzo: a grinning chilli that lobs fireballs from the back row.
  peperoncino(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 4) * 2), cy = y - 4 + b, throwA = Math.round(a.atk * 4);
    for (let k = 0; k < 18; k++) { const w = Math.max(1, Math.round(5 * Math.sin((k + 2) / 21 * Math.PI))); P.rect(x - w + Math.round(Math.sin(k * 0.2) * 3), cy - k - 4, 2 * w, 1, k > 14 ? '#e02a1a' : '#ff3b2a'); }
    P.rect(x - 1, cy - 25, 4, 3, '#3a8a2a'); P.rect(x + 2, cy - 27, 2, 2, '#3a8a2a');
    P.eye(x - 2, cy - 15, 1.5, a); P.eye(x + 3, cy - 15, 1.5, a); P.rect(x - 2, cy - 11, 6, 1, '#5a0a0a'); P.rect(x - 2, cy - 12, 1, 1, '#5a0a0a'); P.rect(x + 3, cy - 12, 1, 1, '#5a0a0a');
    P.line(x - 4, cy - 10, x - 9 - throwA, cy - 15, '#ff3b2a');
    if (a.atk < 0.2) { P.disc(x - 10, cy - 16, 2, '#ffb020'); P.rect(x - 10, cy - 17, 1, 1, '#ffe14d'); }
  },
  // Corvo Carbonara: a charcoal crow with a yolk-yellow eye, riding the hot air.
  corvo(P, x, y, a) {
    const h = y - 24 + Math.round(Math.sin(a.t * 3) * 3), flap = Math.sin(a.t * 11), dive = Math.round(a.atk * 4);
    P.line(x - 2, h - 2, x - 12, h - 5 - Math.round(flap * 7), '#1a1a22', 3); P.line(x + 2, h - 2, x + 12, h - 5 - Math.round(flap * 7), '#1a1a22', 3);
    P.ell(x - dive, h, 8, 5, '#2a2a34'); for (let k = 0; k < 4; k++) P.rect(x - 4 + k * 3 - dive, h - 1 + (k % 2), 1, 1, '#ff7a2a');
    P.disc(x - 7 - dive, h - 4, 4, '#2a2a34'); P.eye(x - 8 - dive, h - 5, 1.5, a, '#ffd76a'); P.rect(x - 14 - dive, h - 4, 4, 2, '#c8c8a0');
    P.line(x + 7 - dive, h + 1, x + 12 - dive, h + 4, '#1a1a22', 2);
  },
  // Rinoceronte Rigatone: a lava-cracked rhino with a rigatone horn. Elite.
  rinoceronte(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2) * 2), charge = Math.round(a.atk * -10 + a.wind * 4), g = '#8a5a4a', d = '#6a3a2a';
    for (const lx of [-14, -4, 12, 22]) { P.rect(x + lx + (lx < 0 ? charge : 0) * 0, y - 16, 8, 16, d); P.rect(x + lx, y - 2, 8, 2, '#3a1a0a'); }
    P.ell(x + 6, y - 28 + b, 26, 16, g); P.ell(x + 8, y - 24 + b, 20, 10, '#9a6a5a');
    for (let k = 0; k < 6; k++) P.line(x - 10 + k * 7, y - 38 + b + (k % 3) * 4, x - 6 + k * 7, y - 30 + b + (k % 2) * 6, '#ff7a2a');
    P.ell(x - 22 + charge, y - 26 + b, 14, 11, g); P.eye(x - 22 + charge, y - 31 + b, 2.5, a);
    P.rect(x - 18 + charge, y - 40 + b, 3, 6, g); P.ell(x - 34 + charge, y - 24 + b, 4, 3, '#9a6a5a');
    for (let k = 0; k < 9; k++) P.rect(x - 38 + charge - k, y - 30 + b - k * 2, 5, 2, k % 3 ? '#e8b070' : '#c98a40');   // the rigatone horn
    P.rect(x - 47 + charge, y - 48 + b, 3, 2, '#fff8e8');
    if (a.fury) for (let k = 0; k < 3; k++) P.rect(x - 26 + charge + k * 4, y - 48 + b - k * 2, 2, 3, '#a8a8b0');
  },
  // Lumaca Fornarina: a snail whose shell is a wood-fired pizza oven. Elite.
  lumaca(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.4) * 2), reach = Math.round(a.wind * 5), body = '#c8a070';
    P.ell(x - 4, y - 6, 30, 6, body); P.ell(x - 4, y - 4, 28, 3, '#a8804a');
    P.line(x - 26, y - 8, x - 30 - reach, y - 26 + b, body, 7);
    P.eye(x - 34 - reach, y - 38 + b, 2.5, a); P.eye(x - 26 - reach, y - 36 + b, 2.5, a);
    P.line(x - 33 - reach, y - 32 + b, x - 34 - reach, y - 36 + b, body, 2); P.line(x - 27 - reach, y - 31 + b, x - 26 - reach, y - 34 + b, body, 2);
    P.rect(x - 34 - reach, y - 26 + b, 6, 1, '#6a4a2a');
    P.ell(x + 6, y - 28 + b, 22, 22, '#b8584a'); for (let k = 0; k < 18; k++) P.rect(x - 12 + (k * 9) % 36, y - 46 + b + (k * 7) % 34, 4, 2, '#9a4034');   // the brick dome
    P.ell(x + 2, y - 18 + b, 9, 8, '#2a0a06'); P.ell(x + 2, y - 16 + b, 8, 5, Math.floor(a.t * 6) % 2 ? '#ff7a2a' : '#ffb020');
    P.ell(x + 2, y - 14 + b, 6, 2, '#f4d890'); P.disc(x, y - 15 + b, 1, '#d8402a'); P.disc(x + 4, y - 14 + b, 1, '#d8402a');
    P.rect(x + 18, y - 58 + b, 5, 12, '#7a3a2a'); for (let k = 0; k < 3; k++) P.disc(x + 20 + k * 2, y - 62 + b - k * 4 - Math.round((a.t * 8) % 4), 2 + k, 'rgba(160,150,150,.6)');
  },
  // Drago Diavola: a red dragon with two diavola pizzas for wings, in the crater. Boss.
  drago(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2) * 3), flap = Math.sin(a.t * 3), r = '#d8302a', d = '#a81a1a', breath = a.wind > 0;
    for (const side of [1, -1]) {                                               // pizza wings
      const wx = x + 16 + side * 12, wy = y - 50 + b - Math.round(flap * 4 * side) - (side < 0 ? 6 : 0);
      P.disc(wx, wy, 13, '#e8b060'); P.disc(wx, wy, 11, '#d8402a');
      for (const [px, py] of [[-5, -4], [4, -6], [6, 3], [-3, 6], [0, 0]]) { P.disc(wx + px, wy + py, 2, '#8a1a1a'); P.rect(wx + px, wy + py, 1, 1, '#c84a3a'); }
      for (let k = 0; k < 3; k++) P.rect(wx - 8 + k * 6, wy - 8 + k * 5, 2, 1, '#f4e4a0');
    }
    for (const lx of [-6, 16]) { P.rect(x + lx, y - 16, 8, 16, d); P.rect(x + lx - 2, y - 2, 11, 2, '#ffe14d'); }
    P.ell(x + 6, y - 30 + b, 18, 16, r); P.ell(x + 2, y - 26 + b, 10, 11, '#ff9a6a'); for (let k = 0; k < 4; k++) P.rect(x - 4, y - 34 + k * 5 + b, 12, 1, '#e8704a');
    P.line(x + 22, y - 22 + b, x + 34, y - 10 + Math.round(Math.sin(a.t * 2) * 3), r, 5); P.tri(x + 36, y - 10, 5, 5, '#ffe14d', -1);
    P.line(x - 4, y - 40 + b, x - 14, y - 48 + b, r, 8);                         // neck and head
    P.ell(x - 20, y - 52 + b, 11, 8, r); P.ell(x - 28, y - 49 + b, 7, 5, r); P.rect(x - 33, y - 51 + b, 2, 1, '#2a0a0a');
    P.tri(x - 18, y - 58 + b, 3, 6, '#ffe14d', -1); P.tri(x - 12, y - 58 + b, 3, 7, '#ffe14d', -1);
    P.eye(x - 21, y - 55 + b, 2.5, a, '#ffe14d');
    if (breath) for (let k = 0; k < 6; k++) P.disc(x - 38 - k * 4, y - 48 + b + Math.round(Math.sin(a.t * 20 + k) * 2), 1 + Math.round(a.wind * 3) - (k > 3 ? 1 : 0), k % 2 ? '#ff7a2a' : '#ffe14d');
    else if (Math.floor(a.t * 2) % 2) P.disc(x - 36, y - 52 + b, 1, 'rgba(160,150,150,.7)');
    if (a.fury) for (let k = 0; k < 5; k++) P.rect(x - 24 + k * 12, y - 72 + b - Math.round(((a.t * 20 + k * 5) % 10)), 2, 2, '#ffb020');
  },
  // Ratto Ravioletto: a rat in a ravioli sleeping bag. Never just one.
  ratto(P, x, y, a) {
    const b = Math.abs(Math.round(Math.sin(a.t * 10))), lunge = Math.round(a.atk * 4);
    P.line(x + 7, y - 4, x + 15, y - 7 + Math.round(Math.sin(a.t * 6) * 2), '#e8a8b0');
    P.rect(x - 6, y - 10 - b, 13, 9, '#f0d890'); for (let k = 0; k < 7; k++) { P.rect(x - 7 + k * 2, y - 11 - b, 1, 1, '#d8b060'); P.rect(x - 7 + k * 2, y - 1 - b, 1, 1, '#d8b060'); }
    P.ell(x - 9 - lunge, y - 9 - b, 5, 4, '#8a8a96'); P.disc(x - 9 - lunge, y - 13 - b, 2, '#8a8a96'); P.rect(x - 9 - lunge, y - 13 - b, 1, 1, '#e8a8b0');
    P.eye(x - 11 - lunge, y - 10 - b, 1.2, a); P.rect(x - 15 - lunge, y - 8 - b, 2, 1, '#e8a8b0');
    for (let k = 0; k < 2; k++) P.line(x - 14 - lunge, y - 8 - b, x - 18 - lunge, y - 9 - b + k * 2, '#c8c8d0');
  },
  // Piccione Penne: a fearless city pigeon on penne legs.
  piccione(P, x, y, a) {
    const h = y - 22 + Math.round(Math.sin(a.t * 3.4) * 2), flap = Math.sin(a.t * 13), peck = Math.round(a.atk * 3);
    P.line(x - 1, h - 1, x - 10, h - 3 - Math.round(flap * 6), '#7a88a8', 3); P.line(x + 2, h - 1, x + 11, h - 3 - Math.round(flap * 6), '#7a88a8', 3);
    P.ell(x, h, 7, 5, '#9aa8c8'); P.ell(x - 3, h - 2, 4, 3, '#5ac8a0'); P.rect(x - 4, h - 1, 3, 1, '#b05ac8');
    P.disc(x - 6, h - 5, 3, '#8a98b8'); P.eye(x - 7, h - 6, 1.2, a, '#ff7a2a'); P.rect(x - 11 - peck, h - 5, 3, 1, '#3a3a46');
    for (const lx of [-2, 2]) { P.rect(x + lx, h + 4, 2, 6, '#e8b070'); P.rect(x + lx, h + 6, 2, 1, '#c98a40'); }
  },
  // Cono Cannellino: a traffic cone with a cannellino in the top. It holds the road.
  cono(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 3) * (a.atk ? 2 : 0));
    P.rect(x - 10, y - 3, 20, 3, '#3a3a46');
    for (let k = 0; k < 22; k++) { const w = Math.round(9 - k * 0.32); P.rect(x - w + b, y - 3 - k, 2 * w, 1, (k > 5 && k < 9) || (k > 13 && k < 16) ? '#f4f4f0' : '#ff7a2a'); }
    P.rect(x - 2 + b, y - 30, 4, 6, '#e8c070'); P.ell(x + b, y - 31, 3, 2, '#fff8e8');
    P.eye(x - 3 + b, y - 18, 1.5, a); P.eye(x + 3 + b, y - 18, 1.5, a); P.rect(x - 2 + b, y - 13, 5, 1, '#8a3a0a');
  },
  // Lampione Linguine: a street lamp on a twist of linguine, buzzing and zapping from the back.
  lampione(P, x, y, a) {
    const on = Math.floor(a.t * 7) % 9 !== 0, zap = a.atk > 0.3;
    P.rect(x - 5, y - 3, 10, 3, '#3a3a46');
    for (let k = 0; k < 28; k++) P.rect(x - 1 + Math.round(Math.sin(k * 0.6) * 1.5), y - 4 - k, 2, 1, k % 3 ? '#f0d890' : '#d8b060');
    P.rect(x - 7, y - 36, 12, 3, '#2a2a34'); P.rect(x - 6, y - 33, 10, 4, on ? '#ffe14d' : '#8a7a2a'); P.rect(x - 7, y - 29, 12, 1, '#2a2a34');
    P.eye(x - 3, y - 32, 1, a); P.eye(x + 1, y - 32, 1, a);
    if (on) for (let k = 0; k < 6; k++) P.rect(x - 10 + k * 4, y - 26 + (k % 2), 1, 1, 'rgba(255,225,77,.6)');
    if (zap) { P.line(x - 8, y - 32, x - 14, y - 28, '#29e7ff'); P.line(x - 14, y - 28, x - 12, y - 24, '#29e7ff'); }
  },
  // Gatto Gorgonzolo: a mob cat in pinstripes and a fedora, with a violin case that isn't. Elite.
  gatto(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2) * 2), firing = a.atk > 0.2, s = '#3a3a4a';
    P.rect(x - 4, y - 18, 6, 18, s); P.rect(x + 6, y - 18, 6, 18, s); P.rect(x - 6, y - 2, 9, 2, '#120818'); P.rect(x + 5, y - 2, 9, 2, '#120818');
    P.rect(x - 8, y - 46 + b, 24, 30, s); for (let k = 0; k < 6; k++) P.rect(x - 6 + k * 4, y - 46 + b, 1, 30, '#5a5a6a');
    P.tri(x + 4, y - 46 + b, 8, 10, '#f4f4f0', 1); P.rect(x + 3, y - 44 + b, 3, 8, '#c8203a');
    P.disc(x + 2, y - 54 + b, 10, '#6a6a7a'); P.tri(x - 5, y - 63 + b, 5, 6, '#6a6a7a', -1); P.tri(x + 9, y - 63 + b, 5, 6, '#6a6a7a', -1);
    P.rect(x - 10, y - 63 + b, 24, 2, '#1a1a22'); P.rect(x - 5, y - 70 + b, 14, 7, '#1a1a22'); P.rect(x - 5, y - 65 + b, 14, 2, '#c8203a');
    P.eye(x - 3, y - 55 + b, 2, a, '#39d98a'); P.eye(x + 5, y - 55 + b, 2, a, '#39d98a'); P.rect(x - 2, y - 50 + b, 7, 1, '#2a2a34');
    for (let k = 0; k < 3; k++) { P.line(x - 6, y - 51 + b + k, x - 14, y - 53 + b + k * 2, '#c8c8d0'); }
    P.line(x - 6, y - 38 + b, x - 16, y - 34 + b, s, 4);                         // the "violin"
    P.rect(x - 30, y - 37 + b, 16, 4, '#2a1a10'); P.rect(x - 34, y - 36 + b, 5, 2, '#3a3a46'); P.disc(x - 22, y - 32 + b, 3, '#1a1a22');
    if (firing && Math.floor(a.t * 30) % 2) { P.disc(x - 36, y - 35 + b, 2, '#ffe14d'); P.rect(x - 40, y - 35 + b, 3, 1, '#ffffff'); }
  },
  // Coccodrillo Calzone: a sewer crocodile folded into a calzone. Elite.
  coccodrillo(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.6) * 2), open = Math.round(a.wind * 6 + a.atk * 3), g = '#4a8a4a';
    for (const lx of [-12, 4, 18]) { P.rect(x + lx, y - 10, 7, 10, '#3a6a3a'); P.rect(x + lx - 1, y - 2, 9, 2, '#2a4a2a'); }
    P.ell(x + 6, y - 22 + b, 26, 13, '#e8b060'); P.ell(x + 6, y - 26 + b, 24, 9, '#f0c070');           // the calzone fold
    for (let k = 0; k < 12; k++) P.rect(x - 16 + k * 4, y - 33 + b + (k % 2), 3, 2, '#c8904a');
    P.disc(x - 4, y - 24 + b, 2, '#d8402a'); P.disc(x + 14, y - 22 + b, 2, '#d8402a');
    P.line(x + 30, y - 18 + b, x + 44, y - 8, g, 6); for (let k = 0; k < 4; k++) P.rect(x + 32 + k * 3, y - 21 + b + k * 3, 2, 2, '#2a5a2a');
    P.ell(x - 22, y - 24 + b, 10, 8, g);                                             // head and long jaw
    P.rect(x - 46, y - 26 + b - open, 26, 6, g); P.rect(x - 46, y - 20 + b, 26, 5, '#3a7a3a');
    for (let k = 0; k < 6; k++) { P.rect(x - 44 + k * 4, y - 20 + b - open, 2, 2, '#f4f4f0'); P.rect(x - 42 + k * 4, y - 21 + b, 2, 2, '#f4f4f0'); }
    P.disc(x - 22, y - 32 + b, 4, g); P.eye(x - 22, y - 33 + b, 2.5, a, '#ffd76a');
    if (a.fury) P.line(x - 26, y - 37 + b, x - 18, y - 35 + b, '#2a4a2a', 2);
  },
  // Ratto Raviolone: the don, in pinstripes, on a ravioli armchair, with a cigar. Boss.
  padrino(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.5) * 2), s = '#3a3a4a', fur = '#8a8a96', firing = a.atk > 0.2;
    P.rect(x - 8, y - 50, 44, 50, '#f0d890'); for (let k = 0; k < 11; k++) { P.rect(x - 9 + k * 4, y - 51, 2, 2, '#d8b060'); P.rect(x - 9 + k * 4, y - 1, 2, 1, '#d8b060'); }   // the ravioli armchair
    P.rect(x - 6, y - 48, 40, 2, '#fff0b0'); P.ell(x + 14, y - 30, 10, 8, '#e8c878');
    P.rect(x - 2, y - 14, 8, 14, s); P.rect(x + 10, y - 14, 8, 14, s); P.rect(x - 4, y - 2, 11, 2, '#120818'); P.rect(x + 8, y - 2, 11, 2, '#120818');
    P.ell(x + 8, y - 30 + b, 16, 18, s); for (let k = 0; k < 7; k++) P.rect(x - 6 + k * 4, y - 46 + b, 1, 30, '#5a5a6a');
    P.tri(x + 2, y - 46 + b, 8, 12, '#f4f4f0', 1); P.rect(x + 1, y - 44 + b, 3, 10, '#c8203a'); P.rect(x + 12, y - 40 + b, 4, 3, '#ff8fc8');
    P.disc(x + 2, y - 56 + b, 11, fur); P.disc(x - 6, y - 66 + b, 4, fur); P.disc(x + 10, y - 66 + b, 4, fur); P.disc(x - 6, y - 66 + b, 2, '#e8a8b0'); P.disc(x + 10, y - 66 + b, 2, '#e8a8b0');
    P.ell(x - 7, y - 53 + b, 6, 4, '#a8a8b0'); P.rect(x - 14, y - 54 + b, 2, 2, '#e8a8b0');
    P.eye(x - 2, y - 58 + b, 2, a); P.eye(x + 6, y - 58 + b, 2, a);
    if (a.fury) { P.line(x - 5, y - 62 + b, x, y - 60 + b, '#2a2a34', 2); P.line(x + 9, y - 62 + b, x + 4, y - 60 + b, '#2a2a34', 2); }
    P.rect(x - 12, y - 49 + b, 8, 2, '#6b3a1a'); P.rect(x - 13, y - 49 + b, 1, 2, '#ff7a2a'); if (Math.floor(a.t * 2) % 2) P.disc(x - 15, y - 53 + b, 1, 'rgba(200,200,210,.7)');
    P.rect(x - 7, y - 67 + b, 18, 2, '#1a1a22'); P.rect(x - 3, y - 73 + b, 10, 6, '#1a1a22'); P.rect(x - 3, y - 69 + b, 10, 1, '#ffe14d');
    for (let k = 0; k < 3; k++) P.line(x - 10, y - 52 + b + k, x - 20, y - 54 + b + k * 2, '#c8c8d0');
    P.line(x - 4, y - 36 + b, x - 14, y - 32 + b, s, 5);                                    // the tommy gun
    P.rect(x - 32, y - 35 + b, 20, 4, '#2a1a10'); P.disc(x - 22, y - 30 + b, 4, '#1a1a22'); P.rect(x - 37, y - 34 + b, 6, 2, '#3a3a46');
    if (firing && Math.floor(a.t * 30) % 2) { P.disc(x - 39, y - 33 + b, 2, '#ffe14d'); P.rect(x - 43, y - 33 + b, 3, 1, '#ffffff'); }
    P.rect(x + 22, y - 48 + b, 3, 3, '#ffd76a');
  },
});
Object.assign(ART_HEIGHT, { salamandra: 14, golem: 30, peperoncino: 32, corvo: 36, rinoceronte: 54, lumaca: 66, drago: 80, ratto: 18, piccione: 34, cono: 32, lampione: 38, gatto: 72, coccodrillo: 38, padrino: 74 });
HOVER_ART.push('corvo', 'piccione');

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

// Phase 7: chance. Pavone Pokerino, a peacock whose tail is a fan of playing cards, runs the gamble
// node and deals on the beach; the jungle has three mystery crates.
function pavone(P, x, y) {
  for (let k = 0; k < 7; k++) {                                   // the tail: a fan of cards
    const an = -Math.PI * 0.95 + k * Math.PI * 0.15, cx = x + 6 + Math.round(Math.cos(an) * 20), cy = y - 16 + Math.round(Math.sin(an) * 20);
    P.rect(cx - 3, cy - 4, 7, 9, '#f4f4f0'); P.rect(cx - 3, cy - 4, 7, 1, '#120818');
    P.rect(cx - 1, cy - 1, 3, 3, k % 2 ? '#e0102a' : '#120818');
  }
  P.ell(x + 2, y - 10, 9, 10, '#1a6a8a'); P.ell(x, y - 8, 6, 7, '#29a8ff');                    // body
  P.line(x - 1, y - 18, x - 4, y - 28, '#1a6a8a', 3); P.disc(x - 5, y - 30, 4, '#29a8ff');      // neck, head
  P.rect(x - 11, y - 31, 4, 2, '#ffb020'); P.rect(x - 7, y - 32, 2, 2, '#ffffff'); P.rect(x - 7, y - 31, 1, 1, '#120818');
  for (let k = 0; k < 3; k++) P.rect(x - 7 + k * 2, y - 38 + (k % 2), 1, 4, '#29a8ff');       // crest
  P.rect(x - 4, y - 1, 1, 4, '#ffb020'); P.rect(x + 3, y - 1, 1, 4, '#ffb020');
  P.rect(x - 12, y - 14, 5, 7, '#f4f4f0'); P.rect(x - 11, y - 12, 2, 2, '#e0102a');                // a card in his wing
}
Object.assign(EVENT_SCENES, {
  // The gamble node: Pavone at a green card table under string lights, chips stacked high.
  casino(P, g) {
    sceneBits.night(P);
    for (let k = 0; k < 16; k++) { P.rect(4 + k * 10, 8 + Math.round(Math.sin(k) * 2), 2, 2, ['#ffe14d', '#ff2bd6', '#29e7ff'][k % 3]); }
    P.line(0, 8, SCENE_W, 9, '#3a2a4a');
    P.rect(0, 56, SCENE_W, 24, '#2a1030');
    P.ell(96, 58, 52, 12, '#1e7a3a'); P.ell(96, 58, 48, 9, '#2a9a4a'); P.rect(48, 58, 96, 12, '#5a3a1a');
    for (const [cx, c] of [[70, '#e0102a'], [78, '#29a8ff'], [124, '#ffe14d']]) for (let k = 0; k < 4; k++) P.ell(cx, 56 - k * 2, 4, 1, k % 2 ? c : '#ffffff');
    P.rect(98, 52, 6, 8, '#f4f4f0'); P.rect(100, 54, 2, 2, '#120818'); P.rect(107, 53, 6, 8, '#f4f4f0'); P.rect(109, 55, 2, 2, '#e0102a');
    P.rect(86, 52, 5, 5, '#f4f4f0'); P.rect(87, 53, 1, 1, '#120818'); P.rect(89, 55, 1, 1, '#120818');
    sceneChar(g, 34, 66, pavone);
  },
  // Pavone's Deal: his folding table at the tideline.
  deal(P, g) {
    sceneBits.dusk(P); sceneBits.sea(P, 40); sceneBits.sand(P, 52);
    P.rect(80, 50, 44, 3, '#c8c8d0'); P.rect(84, 53, 2, 14, '#8a8a96'); P.rect(118, 53, 2, 14, '#8a8a96');
    for (let k = 0; k < 3; k++) { P.rect(88 + k * 11, 44, 8, 11, '#f4f4f0'); P.rect(88 + k * 11, 44, 8, 1, '#120818'); }
    P.rect(90, 46, 4, 4, '#3a1048'); P.rect(101, 47, 2, 3, '#e0102a'); P.rect(112, 47, 2, 3, '#120818');
    sceneChar(g, 52, 70, pavone);
  },
  // The Mystery Crates in a jungle clearing, a monkey watching from a branch.
  crates(P, g) {
    sceneBits.jungle(P);
    for (const [x, w, h, q] of [[30, 20, 16, 1], [64, 32, 26, 2], [112, 24, 20, 3]]) {
      P.rect(x, 70 - h, w, h, '#a8784a'); P.rect(x, 70 - h, w, 2, '#c8946a'); P.rect(x, 70 - h + Math.floor(h / 2), w, 1, '#6b4226');
      P.rect(x + 1, 70 - h, 1, h, '#6b4226'); P.rect(x + w - 2, 70 - h, 1, h, '#6b4226');
      for (let k = 0; k < q; k++) { const qx = x + w / 2 - q * 3 + k * 6; P.rect(qx, 70 - h + 4, 3, 1, '#120818'); P.rect(qx + 2, 70 - h + 5, 1, 2, '#120818'); P.rect(qx + 1, 70 - h + 7, 1, 1, '#120818'); P.rect(qx + 1, 70 - h + 9, 1, 1, '#120818'); }
    }
    P.rect(118, 46, 1, 3, '#ff3b5c'); P.rect(122, 45, 1, 3, '#ff3b5c');                    // the ticking crate
    P.rect(120, 22, 40, 3, '#3a2a14');
    sceneChar(g, 140, 24, (P, x, y) => { P.disc(x, y - 6, 5, '#8a5a3a'); P.disc(x - 2, y - 13, 4, '#8a5a3a'); P.disc(x - 3, y - 13, 2, '#f0c8a0'); P.rect(x - 4, y - 14, 1, 1, '#120818'); P.line(x + 4, y - 4, x + 9, y + 4, '#8a5a3a', 1); P.ell(x - 6, y - 7, 3, 1, '#ffe14d'); });
  },
});
Object.assign(ICONS, {
  dice(P) {
    P.rect(2, 4, 9, 9, '#f4f4f0'); P.rect(2, 4, 9, 1, '#ffffff'); P.rect(3, 5, 2, 2, '#e0102a'); P.rect(8, 10, 2, 2, '#e0102a'); P.rect(6, 7, 1, 2, '#120818');
    P.rect(9, 1, 6, 6, '#29e7ff'); P.rect(10, 2, 1, 1, '#120818'); P.rect(13, 5, 1, 1, '#120818');
  },
});

// Phase 8 item icons: four armour bases, the jungle's four, and the trigger trinkets.
Object.assign(ICONS, {
  visor(P) { P.rect(2, 7, 12, 3, '#ff2bd6'); P.rect(9, 10, 6, 2, '#29e7ff'); P.rect(3, 6, 10, 1, '#ffe14d'); P.rect(5, 8, 1, 1, '#ffffff'); },
  rashguard(P) { P.rect(4, 4, 8, 9, '#29a8ff'); P.rect(2, 4, 3, 5, '#29a8ff'); P.rect(11, 4, 3, 5, '#29a8ff'); P.rect(4, 7, 8, 1, '#ffe14d'); P.rect(6, 3, 4, 2, '#1a6a8a'); },
  cargo(P) { P.rect(4, 3, 8, 4, '#8a7a4a'); P.rect(4, 7, 3, 7, '#8a7a4a'); P.rect(9, 7, 3, 7, '#8a7a4a'); P.rect(3, 8, 2, 3, '#6b5a2a'); P.rect(11, 8, 2, 3, '#6b5a2a'); P.rect(4, 3, 8, 1, '#5a4a1a'); },
  skates(P) { P.rect(4, 3, 5, 7, '#ff3b5c'); P.rect(4, 9, 9, 3, '#ff3b5c'); P.rect(4, 3, 5, 1, '#ffffff'); P.disc(5, 13, 1, '#29e7ff'); P.disc(11, 13, 1, '#29e7ff'); },
  tiki(P) { P.rect(4, 2, 8, 12, '#8b5a2b'); P.rect(5, 5, 2, 2, '#ffe14d'); P.rect(9, 5, 2, 2, '#ffe14d'); P.rect(5, 10, 6, 2, '#120818'); P.rect(6, 10, 1, 1, '#f4f4f0'); P.rect(9, 10, 1, 1, '#f4f4f0'); P.rect(3, 1, 10, 1, '#39a83a'); },
  lasagna(P) { for (let k = 0; k < 5; k++) P.rect(3, 3 + k * 2, 10, 1, k % 2 ? '#e85a3a' : '#f0c870'); P.rect(3, 13, 10, 1, '#c89a40'); P.rect(2, 3, 1, 10, '#c89a40'); P.rect(13, 3, 1, 10, '#c89a40'); },
  greaves(P) { for (const x of [4, 9]) { P.rect(x, 3, 4, 10, '#e8d0a0'); for (let k = 0; k < 4; k++) P.rect(x, 4 + k * 3, 4, 1, '#c8a870'); } },
  clogs(P) { P.rect(2, 9, 12, 4, '#c8944a'); P.rect(4, 6, 6, 4, '#c8944a'); P.rect(2, 12, 12, 1, '#8b5a2b'); P.rect(5, 7, 3, 1, '#ff3b5c'); },
  kazoo(P) { P.rect(2, 7, 11, 3, '#ffe14d'); P.rect(12, 6, 2, 5, '#ffe14d'); P.disc(7, 6, 2, '#ff2bd6'); P.rect(2, 8, 1, 1, '#120818'); P.rect(14, 4, 1, 1, '#ffffff'); P.rect(15, 2, 1, 1, '#ffffff'); },
  stopwatch(P) { P.disc(8, 9, 5, '#c8ccd4'); P.disc(8, 9, 4, '#f4f4f0'); P.rect(7, 2, 3, 2, '#c8ccd4'); P.rect(8, 6, 1, 4, '#120818'); P.rect(8, 9, 3, 1, '#ff3b5c'); },
});
Object.assign(ICONS, {
  necklace(P) { P.ring(8, 7, 6, 5, '#c8b8a0', 1); for (const [x, y] of [[3, 9], [8, 12], [13, 9]]) P.disc(x, y, 1, '#f4c8d8'); P.disc(8, 12, 2, '#ffe8f0'); },
  spoon(P) { P.ell(5, 5, 3, 4, '#c8ccd4'); P.line(7, 8, 13, 14, '#c8ccd4', 2); P.disc(5, 4, 2, '#ff8fc8'); },
  whistle(P) { P.rect(3, 6, 9, 5, '#ffe14d'); P.disc(11, 9, 3, '#ffe14d'); P.rect(1, 7, 3, 2, '#ffe14d'); P.disc(11, 9, 1, '#120818'); P.rect(6, 3, 1, 3, '#ff2bd6'); },
  watch(P) { P.rect(6, 1, 4, 14, '#39a83a'); P.disc(8, 8, 5, '#c8ccd4'); P.disc(8, 8, 4, '#1a5a8a'); P.rect(8, 5, 1, 4, '#ffffff'); P.rect(8, 8, 3, 1, '#9fe8ff'); },
});
// Phase 9: the unlockable classes' icons.
Object.assign(ICONS, {
  clsNinja(P) { P.disc(8, 8, 6, '#1a1222'); P.rect(2, 6, 12, 3, '#e02a2a'); P.rect(13, 7, 3, 1, '#e02a2a'); P.rect(14, 9, 2, 1, '#e02a2a'); P.rect(5, 7, 2, 1, '#ffffff'); P.rect(9, 7, 2, 1, '#ffffff'); },
  clsConductor(P) { P.line(3, 13, 12, 3, '#f4f4f0', 1); P.rect(2, 12, 3, 3, '#8b5a2b'); for (const [x, y] of [[11, 9], [5, 4]]) { P.disc(x, y + 3, 1, '#ffe14d'); P.rect(x + 1, y - 1, 1, 4, '#ffe14d'); } },
  clsDeprived(P) { P.rect(4, 4, 8, 9, '#5a4a3a'); P.rect(4, 4, 8, 1, '#7a6a5a'); P.rect(6, 8, 1, 3, '#3a2a1a'); P.rect(9, 6, 1, 2, '#3a2a1a'); P.rect(5, 13, 2, 2, '#3a2a1a'); P.rect(9, 13, 2, 2, '#3a2a1a'); },
});

// Event scenes for the desert and the glacier.
Object.assign(sceneBits, {
  desert(P) {
    ['#5a1a4a', '#a83a3a', '#e8703a', '#ffa84a', '#ffd88a'].forEach((c, k) => P.rect(0, k * 9, SCENE_W, 9, c)); P.disc(128, 30, 9, '#fff8d0');
    for (let y = 0; y < 18; y++) P.rect(24 - y, 30 + y, 2 * y + 1, 1, y < 3 ? '#ffd76a' : '#b8743a');
    for (let x = 0; x < SCENE_W; x++) { const h = 30 + Math.round(3 * Math.sin(x * 0.06) + 2 * Math.sin(x * 0.17)); P.rect(x, SCENE_H - h + 4, 1, h, x % 7 ? '#d8a060' : '#c89050'); P.rect(x, SCENE_H - h + 4, 1, 1, '#f0c888'); }
  },
  ice(P) {
    ['#020a1a', '#061a34', '#0a2a4a', '#1a4a6a', '#3a7a9a'].forEach((c, k) => P.rect(0, k * 9, SCENE_W, 9, c));
    for (let x = 0; x < SCENE_W; x += 2) P.rect(x, 8 + Math.round(4 * Math.sin(x * 0.05)), 2, 3, 'rgba(57,255,136,.25)');
    for (let k = 0; k < 20; k++) P.rect((k * 53) % SCENE_W, (k * 17) % 30, 1, 1, '#ffffff');
    for (let x = 0; x < SCENE_W; x++) { const h = 8 + Math.abs(((x + 9) % 40) - 20); P.rect(x, 50 - h, 1, h, '#4a6a8a'); P.rect(x, 50 - h, 1, Math.max(2, Math.round(h * 0.35)), '#f0f8ff'); }
    P.rect(0, 50, SCENE_W, 30, '#d8eef8'); for (let k = 0; k < 30; k++) P.rect((k * 29) % SCENE_W, 52 + (k * 11) % 26, 2, 1, '#b8d8ec');
  },
});
Object.assign(EVENT_SCENES, {
  // The Orzata Oasis and its lifeguard camel.
  oasis(P, g) {
    sceneBits.desert(P);
    P.ell(70, 62, 34, 7, '#f4ece0'); P.ell(70, 61, 30, 5, '#ffffff'); for (let k = 0; k < 5; k++) P.rect(48 + k * 10, 61, 4, 1, '#e8dcc8');
    for (const px of [34, 108]) { P.line(px, 60, px + 3, 30, '#8a5a2a', 3); for (let k = 0; k < 5; k++) P.line(px + 3, 30, px + 3 + Math.round(Math.cos(k * 1.3) * 12), 30 + Math.round(Math.sin(k * 1.3) * 5) + 3, '#3a8a3a', 2); }
    sceneChar(g, 132, 74, (P, x, y) => { ENEMY_ART.cammello(P, x, y, { t: 0.4, wind: 0, atk: 0 }); P.rect(x - 18, y - 22, 3, 3, '#ff3b5c'); P.line(x - 15, y - 21, x - 13, y - 17, '#ffffff'); });
  },
  // The sfogliatella sphinx.
  sphinx(P, g) {
    sceneBits.desert(P);
    sceneChar(g, 90, 72, (P, x, y) => {
      P.ell(x + 8, y - 10, 30, 10, '#e8b870'); for (let k = 0; k < 8; k++) P.ring(x - 14 + k * 6, y - 10, 3, 8, '#c8904a', 1, -1);
      P.rect(x - 22, y - 12, 14, 8, '#e8b870'); P.rect(x - 26, y - 6, 10, 4, '#e8b870');
      P.disc(x - 16, y - 28, 10, '#e8b870'); P.rect(x - 28, y - 34, 24, 14, '#d8a860'); for (let k = 0; k < 5; k++) P.rect(x - 28 + k * 5, y - 34, 2, 14, '#c8904a');
      P.disc(x - 17, y - 27, 7, '#f0c888'); P.eye(x - 20, y - 29, 1.5, {}); P.eye(x - 14, y - 29, 1.5, {}); P.rect(x - 19, y - 23, 5, 1, '#8a5a2a');
      for (let k = 0; k < 4; k++) P.rect(x + 20 + k * 4, y - 26 - k * 3, 2, 1, '#f4e4c0');
    });
  },
  // The fennec fox's spice caravan.
  caravan(P, g) {
    sceneBits.desert(P);
    for (let k = 0; k < 3; k++) sceneChar(g, 60 + k * 30, 70 - k * 3, (P, x, y) => { ENEMY_ART.cammello(P, x, y, { t: k * 0.7, wind: 0, atk: 0 }); P.rect(x - 4, y - 24, 10, 6, ['#c8203a', '#ffd76a', '#8a3ac8'][k]); });
    sceneChar(g, 28, 74, (P, x, y) => {
      P.ell(x, y - 8, 5, 7, '#e8a860'); P.disc(x, y - 18, 5, '#e8a860'); P.tri(x - 5, y - 21, 4, 9, '#e8a860', -1); P.tri(x + 5, y - 21, 4, 9, '#e8a860', -1);
      P.eye(x - 2, y - 18, 1.2, {}); P.eye(x + 2, y - 18, 1.2, {}); P.rect(x - 1, y - 15, 2, 1, '#2a1a1a');
      P.ell(x, y - 24, 6, 3, '#29e7ff'); P.rect(x + 4, y - 14, 4, 3, '#ffe14d');
    });
  },
  // A mirage: a gelato shop and a sun lounger, wobbling.
  mirage(P, g) {
    sceneBits.desert(P);
    for (let r = 0; r < 18; r++) { const off = Math.round(Math.sin(r * 0.9) * 2); P.rect(92 + off, 30 + r, 34, 1, r < 6 ? 'rgba(255,143,200,.55)' : 'rgba(244,244,240,.5)'); }
    for (let k = 0; k < 6; k++) P.rect(92 + k * 6, 26, 5, 4, k % 2 ? 'rgba(255,43,214,.5)' : 'rgba(255,255,255,.5)');
    P.rect(96, 52, 20, 2, 'rgba(41,231,255,.5)'); P.rect(100, 36, 16, 6, 'rgba(255,225,77,.5)');
    sceneChar(g, 50, 74, (P, x, y) => { P.line(x - 10, y - 2, x + 8, y - 8, '#8b5a2b', 2); P.ell(x - 2, y - 12, 4, 3, '#2a2a3a'); P.rect(x - 16, y - 24, 1, 22, '#c8c8d0'); for (let k = 0; k < 8; k++) P.rect(x - 26 + k * 3, y - 26 + Math.abs(k - 4), 3, 2, k % 2 ? '#ff3b5c' : '#ffffff'); });
  },
  // The hot chocolate spring, full of penguins.
  hotspring(P, g) {
    sceneBits.ice(P);
    P.ell(80, 64, 44, 9, '#5a3018'); P.ell(80, 63, 40, 7, '#7a4a2a'); for (let k = 0; k < 6; k++) P.ring(52 + k * 11, 63, 2, 1, '#a8704a', 1);
    for (let k = 0; k < 8; k++) P.rect(48 + k * 9 + Math.round(Math.sin(k) * 2), 40 - (k % 3) * 4, 1, 8, 'rgba(255,255,255,.35)');
    for (let k = 0; k < 3; k++) sceneChar(g, 62 + k * 18, 66, (P, x, y) => { P.ell(x, y - 4, 5, 5, '#2a2a3a'); P.ell(x - 1, y - 3, 3, 3, '#f4f4f0'); P.eye(x - 2, y - 6, 1.2, {}); P.rect(x - 6, y - 5, 3, 1, '#ff9a3a'); });
  },
  // Three penguins round a hole in the ice, one rod between them.
  fishing(P, g) {
    sceneBits.ice(P);
    P.ell(84, 66, 12, 4, '#0a2a4a'); P.ell(84, 66, 10, 3, '#1a4a8a');
    for (let k = 0; k < 3; k++) sceneChar(g, 56 + k * 28, 70 - (k === 1 ? 10 : 0), (P, x, y) => ENEMY_ART.pinguino(P, x, y, { t: k, wind: 0, atk: 0 }));
    P.line(70, 50, 86, 34, '#8b5a2b', 1); P.line(86, 34, 86, 64, '#c8c8d0', 1);
  },
  // An adventurer frozen in the ice wall, gear and all.
  frozen(P, g) {
    sceneBits.ice(P);
    P.rect(46, 14, 70, 56, 'rgba(159,232,255,.6)'); P.rect(46, 14, 70, 2, '#ffffff'); for (let k = 0; k < 6; k++) P.line(52 + k * 10, 18, 56 + k * 10, 30 + (k % 3) * 8, 'rgba(255,255,255,.5)');
    sceneChar(g, 80, 66, (P, x, y) => { drawHero(P, x, y, 0, 0.4, 2, 1, 'sword'); });
    P.rect(46, 14, 70, 56, 'rgba(159,232,255,.25)');
  },
  // A teenage yeti's tea table in a snow cave.
  yetiTea(P, g) {
    sceneBits.ice(P);
    P.ell(80, 52, 70, 40, '#a8c8dc'); P.ell(80, 58, 60, 30, '#2a3a4a');
    P.rect(70, 62, 30, 4, '#8b5a2b'); P.rect(72, 66, 2, 8, '#6b4226'); P.rect(96, 66, 2, 8, '#6b4226');
    P.rect(78, 57, 5, 5, '#f4f4f0'); P.rect(83, 58, 2, 2, '#f4f4f0'); P.rect(88, 58, 4, 4, '#ff8fc8');
    sceneChar(g, 112, 76, (P, x, y) => {
      P.ell(x, y - 16, 12, 15, '#f4f4ee'); P.ell(x - 3, y - 22, 6, 5, '#8ab8e8'); P.eye(x - 5, y - 24, 1.5, {}); P.eye(x - 1, y - 24, 1.5, {}); P.rect(x - 4, y - 19, 3, 1, '#2a3a5a');
      P.line(x - 10, y - 14, x - 16, y - 16, '#f4f4ee', 4);
    });
  },
});

// Event scenes for the volcano and the city.
Object.assign(sceneBits, {
  volcano(P) {
    ['#1a0606', '#3a0a0a', '#6a1a0a', '#a83a0a', '#e86a2a'].forEach((c, k) => P.rect(0, k * 9, SCENE_W, 9, c));
    for (let y = 0; y < 34; y++) { const w = 4 + Math.round(y * 1.4); P.rect(118 - w, 14 + y, 2 * w, 1, '#3a1410'); }
    for (let y = 0; y < 30; y++) P.rect(116 + Math.round(Math.sin(y * 0.4) * 2) - Math.round(y * 0.3), 16 + y, 2, 1, '#ff7a2a');
    for (let k = 0; k < 4; k++) P.disc(120 + k * 4, 10 - k * 3, 3 + k, 'rgba(90,70,70,.6)');
    P.rect(0, 48, SCENE_W, 32, '#2a1210'); for (let k = 0; k < 30; k++) P.rect((k * 31) % SCENE_W, 50 + (k * 13) % 28, 2, 1, k % 4 ? '#3a1a14' : '#ff7a2a');
  },
  city(P) {
    ['#05020f', '#0a0420', '#120830', '#1c0c40', '#2a1050'].forEach((c, k) => P.rect(0, k * 9, SCENE_W, 9, c));
    for (let k = 0, x = 0; x < SCENE_W; k++) { const w = 12 + (k * 7) % 10, h = 20 + (k * 17) % 26; P.rect(x, 50 - h, w - 1, h, '#0c0818'); for (let wy = 52 - h; wy < 48; wy += 4) for (let wx = x + 2; wx < x + w - 3; wx += 3) if ((wx + wy + k) % 4 === 0) P.rect(wx, wy, 1, 2, '#ffe14d'); x += w; }
    P.rect(0, 50, SCENE_W, 30, '#1a1424'); P.rect(0, 50, SCENE_W, 1, '#ff2bd6'); for (let k = 0; k < 8; k++) P.rect(k * 22 + 4, 64, 10, 1, '#ffe14d');
  },
});
Object.assign(EVENT_SCENES, {
  // The mole smith at its anvil, lit by lava.
  smithy(P, g) {
    sceneBits.volcano(P);
    P.rect(70, 58, 26, 6, '#4a4a56'); P.rect(76, 64, 14, 8, '#3a3a46'); P.rect(66, 56, 8, 3, '#4a4a56');
    for (let k = 0; k < 5; k++) P.rect(80 + k * 3, 52 - k * 2, 1, 2, '#ffe14d');
    sceneChar(g, 50, 74, (P, x, y) => {
      P.ell(x, y - 10, 9, 10, '#5a4a4a'); P.rect(x - 7, y - 16, 14, 14, '#8a5a2a'); P.disc(x - 2, y - 22, 6, '#5a4a4a'); P.ell(x - 8, y - 21, 3, 2, '#ff8fc8');
      P.rect(x - 4, y - 24, 3, 1, '#120818'); P.line(x + 6, y - 14, x + 14, y - 26, '#6b4226', 2); P.rect(x + 11, y - 30, 7, 4, '#8a8a96');
    });
  },
  // A pizza on a ledge over the lava.
  oven(P, g) {
    sceneBits.volcano(P);
    P.rect(0, 62, SCENE_W, 18, '#ff7a2a'); for (let k = 0; k < 12; k++) P.rect(k * 14 + 3, 64 + (k % 3) * 4, 6, 1, '#ffe14d');
    P.rect(56, 50, 40, 8, '#3a2a28'); P.ell(76, 48, 12, 3, '#e8b060'); P.ell(76, 47, 10, 2, '#d8402a'); for (const dx of [-5, 0, 5]) P.disc(76 + dx, 47, 1, '#f4f4f0');
    for (let k = 0; k < 4; k++) P.rect(70 + k * 4, 38 - (k % 2) * 3, 1, 6, 'rgba(255,255,255,.35)');
  },
  // The salamander referee at the walk of coals.
  coals(P, g) {
    sceneBits.volcano(P);
    for (let k = 0; k < 14; k++) P.ell(40 + k * 8, 64 - Math.round(Math.sin(k * 0.5) * 2), 4, 2, k % 2 ? '#ff7a2a' : '#ffb020');
    sceneChar(g, 30, 70, (P, x, y) => { ENEMY_ART.salamandra(P, x, y, { t: 0.5, wind: 0, atk: 0 }); for (let k = 0; k < 3; k++) P.rect(x - 4 + k * 3, y - 10, 1, 4, '#f4f4f0'); P.disc(x - 14, y - 14, 2, '#c8c8d0'); });
    P.rect(136, 52, 2, 16, '#c8c8d0'); P.rect(132, 50, 12, 4, '#f4f4f0');
  },
  // The obsidian mirror and your grinning reflection.
  obsidian(P, g) {
    sceneBits.volcano(P);
    P.rect(66, 18, 30, 46, '#120e18'); P.rect(66, 18, 30, 2, '#3a3448'); P.line(70, 22, 78, 40, '#3a3448');
    sceneChar(g, 81, 60, (P, x, y) => { drawHero(P, x, y, 0, 0, 0, 0, 'sword'); });
    P.rect(66, 18, 30, 46, 'rgba(20,14,30,.55)'); P.rect(75, 30, 3, 1, '#ff3b5c'); P.rect(82, 30, 3, 1, '#ff3b5c'); P.rect(76, 36, 8, 1, '#ff3b5c');
  },
  // The late-night pizzeria and its eight-armed cook.
  pizzeria(P, g) {
    sceneBits.city(P);
    P.rect(46, 24, 70, 40, '#2a1a1a'); P.rect(50, 30, 62, 26, '#ffe8a0'); P.rect(46, 20, 70, 6, '#c8203a'); for (let k = 0; k < 7; k++) P.rect(48 + k * 10, 20, 5, 6, '#f4f4f0');
    P.rect(58, 14, 46, 6, '#120818'); for (let k = 0; k < 8; k++) P.rect(61 + k * 5, 15, 3, 4, Math.floor(k / 2) % 2 ? '#ff2bd6' : '#29e7ff');
    sceneChar(g, 81, 56, (P, x, y) => { for (let k = 0; k < 6; k++) P.line(x - 6 + k * 2, y - 10, x - 14 + k * 6, y - 18 - (k % 3) * 2, '#b060d0', 2); P.ell(x, y - 14, 7, 6, '#b060d0'); P.eye(x - 2, y - 15, 1.5, {}); P.eye(x + 3, y - 15, 1.5, {}); P.rect(x - 5, y - 22, 10, 3, '#f4f4f0'); P.ell(x + 12, y - 26, 6, 2, '#e8b060'); });
  },
  // A pigeon busker with a keytar, down in the subway.
  busker(P, g) {
    sceneBits.city(P);
    P.rect(0, 0, SCENE_W, 50, '#1a1a2a'); for (let k = 0; k < 10; k++) P.rect(k * 16, 0, 14, 48, k % 2 ? '#24243a' : '#2a2a40'); P.rect(0, 20, SCENE_W, 4, '#c8c8d0'); P.rect(20, 21, 30, 2, '#2a4a8a');
    sceneChar(g, 80, 70, (P, x, y) => { ENEMY_ART.piccione(P, x, y + 10, { t: 0.4, wind: 0, atk: 0 }); P.rect(x - 9, y - 16, 18, 4, '#ff2bd6'); for (let k = 0; k < 5; k++) P.rect(x - 7 + k * 3, y - 15, 2, 2, '#f4f4f0'); P.rect(x - 6, y - 25, 6, 2, '#120818'); });
    P.rect(100, 66, 14, 4, '#3a2a1a'); P.disc(104, 66, 1, '#ffe14d'); P.disc(108, 66, 1, '#ffe14d');
  },
  // A long black car, a window rolled down an inch.
  offer(P, g) {
    sceneBits.city(P);
    P.rect(30, 50, 100, 14, '#0a0a10'); P.rect(48, 40, 60, 12, '#0a0a10'); P.rect(52, 42, 24, 6, '#2a2a40'); P.rect(80, 42, 24, 6, '#2a2a40'); P.rect(80, 42, 24, 1, '#120818');
    P.disc(48, 64, 6, '#1a1a22'); P.disc(112, 64, 6, '#1a1a22'); P.rect(126, 54, 4, 3, '#ffe14d'); P.rect(30, 54, 3, 3, '#ff3b5c');
    P.rect(86, 44, 2, 2, '#ff8a3a'); P.disc(84, 40, 1, 'rgba(200,200,210,.7)'); P.disc(82, 37, 2, 'rgba(200,200,210,.5)');
  },
  // The crocodile cabbie at the taxi rank.
  taxi(P, g) {
    sceneBits.city(P);
    P.rect(40, 48, 80, 14, '#ffd040'); P.rect(56, 38, 46, 12, '#ffd040'); P.rect(60, 40, 18, 7, '#2a3a5a'); P.rect(82, 40, 16, 7, '#2a3a5a');
    for (let k = 0; k < 8; k++) P.rect(44 + k * 9, 54, 4, 4, k % 2 ? '#120818' : '#ffd040');
    P.rect(72, 34, 14, 4, '#f4f4f0'); P.rect(75, 35, 8, 2, '#120818'); P.disc(56, 62, 6, '#1a1a22'); P.disc(104, 62, 6, '#1a1a22');
    sceneChar(g, 68, 47, (P, x, y) => { P.ell(x, y - 3, 6, 4, '#4a8a4a'); P.rect(x - 12, y - 3, 8, 3, '#4a8a4a'); P.eye(x - 1, y - 6, 1.5, {}, '#ffd76a'); for (let k = 0; k < 3; k++) P.rect(x - 11 + k * 3, y, 1, 1, '#f4f4f0'); });
  },
});
