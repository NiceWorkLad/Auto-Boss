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

const BOSS_ART = {
  tung(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 3)), wood = '#b07a45', dark = '#8a5a2e';
    P.rect(x - 7, y - 12, 3, 12, '#5a3a1e'); P.rect(x + 4, y - 12, 3, 12, '#5a3a1e');
    P.rect(x - 11, y - 60 + b, 22, 50, wood);
    P.ell(x, y - 60 + b, 11, 3, '#d6a46a'); P.ring(x, y - 60 + b, 6, 1.5, dark); P.disc(x, y - 60 + b, 1, dark);
    P.rect(x - 7, y - 54 + b, 1, 36, dark); P.rect(x + 6, y - 50 + b, 1, 30, dark); P.rect(x + 1, y - 24 + b, 1, 12, dark);
    P.eye(x - 5, y - 44 + b, 4, a); P.eye(x + 5, y - 44 + b, 4, a);
    P.rect(x - 7, y - 33 + b, 14, 2, '#3a2010');
    // the bat: raised high on wind-up, swung down at the hero on attack
    const th = -0.5 + a.wind * 0.9 - a.atk * 1.6;
    P.line(x - 8, y - 38 + b, x - 15, y - 30 + b, wood, 2);
    const [ex, ey] = P.stick(x - 15, y - 30 + b, th, 24, '#e2c290', 3);
    P.disc(ex, ey, 3, '#e2c290');
  },

  patapim(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2.5)), skin = '#e3b48e', fur = '#7a5230';
    P.ell(x - 13, y - 3, 10, 3, skin); P.ell(x + 11, y - 3, 10, 3, skin);
    for (let k = 0; k < 4; k++) { P.rect(x - 22 + k * 3, y - 3, 1, 2, '#c99470'); P.rect(x + 2 + k * 3, y - 3, 1, 2, '#c99470'); }
    P.rect(x - 10, y - 18, 3, 15, fur); P.rect(x + 7, y - 18, 3, 15, fur);
    P.ell(x, y - 26 + b, 11, 10, fur);
    P.line(x - 9, y - 30 + b, x - 17 - a.atk * 6, y - 22 + b, fur, 2); P.line(x + 9, y - 30 + b, x + 15, y - 21 + b, fur, 2);
    for (const [dx, dy, r] of [[-11, -48, 9], [10, -48, 9], [0, -58, 10], [-7, -40, 8], [8, -40, 8]]) P.disc(x + dx, y + dy + b, r, '#2f8a30');
    for (const [dx, dy] of [[-13, -52], [6, -62], [12, -46], [-4, -60]]) P.disc(x + dx, y + dy + b, 3, '#5cc24f');
    P.ell(x - 1, y - 45 + b, 8, 7, skin);
    P.eye(x - 5, y - 48 + b, 2, a); P.eye(x + 2, y - 48 + b, 2, a);
    P.ell(x - 3, y - 41 + b, 4, 5, '#d0806a'); P.rect(x - 5, y - 38 + b, 1, 1, '#8a4030');
    P.rect(x - 7, y - 70 + b, 14, 2, '#4a2e18'); P.rect(x - 4, y - 74 + b, 8, 4, '#4a2e18');
  },

  lirili(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2)), grey = '#9a9aac', green = '#4caf50';
    P.rect(x - 13, y - 3, 10, 3, '#8b5a2b'); P.rect(x + 3, y - 3, 10, 3, '#8b5a2b');
    P.rect(x - 11, y - 14, 6, 11, grey); P.rect(x + 5, y - 14, 6, 11, grey);
    P.rect(x - 11, y - 6, 6, 1, '#8b5a2b'); P.rect(x + 5, y - 6, 6, 1, '#8b5a2b');
    P.rect(x + 13, y - 38 + b, 5, 12, green); P.rect(x + 15, y - 48 + b, 4, 12, green);
    P.rect(x - 18, y - 36 + b, 5, 8, green); P.rect(x - 19, y - 44 + b, 4, 10, green);
    P.ell(x, y - 28 + b, 13, 16, green);
    for (const dx of [-7, 0, 7]) P.rect(x + dx, y - 42 + b, 1, 28, '#3a8a3e');
    for (let k = 0; k < 14; k++) P.rect(x - 10 + (k * 7) % 21, y - 40 + b + ((k * 5) % 24), 1, 1, '#f4f1c8');
    P.ell(x + 9, y - 53 + b, 6, 8, '#8a8a9c');
    P.ell(x - 2, y - 52 + b, 11, 10, grey);
    P.eye(x - 6, y - 55 + b, 2, a);
    P.rect(x - 12, y - 46 + b, 3, 2, '#ffffff');
    const sway = Math.round(Math.sin(a.t * 3) * 2) - a.atk * 4;
    P.line(x - 11, y - 50 + b, x - 17 + sway, y - 40 + b, grey, 4); P.line(x - 17 + sway, y - 40 + b, x - 14 + sway, y - 33 + b, grey, 3);
  },

  chimp(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 3.2)), yel = '#ffd93b', fur = '#6b4226', face = '#e2b48a';
    P.rect(x - 6, y - 4, 4, 4, fur); P.rect(x + 2, y - 4, 4, 4, fur);
    P.ell(x, y - 24 + b, 11, 21, yel); P.ell(x + 4, y - 22 + b, 4, 16, '#f2c22a');
    P.rect(x - 1, y - 4 + b, 3, 2, '#6b4a1a');
    const flap = Math.round(Math.sin(a.t * 4) * 1.5);
    P.ell(x - 15, y - 36 + b + flap, 4, 11, yel); P.ell(x + 15, y - 36 + b - flap, 4, 11, yel);
    P.rect(x - 16, y - 26 + b + flap, 2, 2, '#6b4a1a'); P.rect(x + 14, y - 26 + b - flap, 2, 2, '#6b4a1a');
    P.disc(x - 11, y - 52 + b, 3, fur); P.disc(x + 11, y - 52 + b, 3, fur);
    P.disc(x, y - 51 + b, 10, fur);
    P.ell(x - 1, y - 48 + b, 7, 6, face);
    P.eye(x - 4, y - 52 + b, 2, a); P.eye(x + 3, y - 52 + b, 2, a);
    P.rect(x - 4, y - 45 + b, 7, 1, '#5a2a10'); P.rect(x - 5, y - 46 + b, 1, 1, '#5a2a10'); P.rect(x + 3, y - 46 + b, 1, 1, '#5a2a10');
    P.line(x - 8, y - 40 + b, x - 15 - a.atk * 5, y - 44 + b, fur, 2);
  },

  boneca(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2.6)), skin = '#e8b48c', frog = '#6cc04a', step = Math.round(Math.sin(a.t * 5));
    P.rect(x - 8, y - 14, 4, 12 + step, skin); P.rect(x + 4, y - 14, 4, 12 - step, skin);
    P.rect(x - 10, y - 3 + step, 7, 3, '#1c1c24'); P.rect(x + 3, y - 3 - step, 7, 3, '#1c1c24');
    P.disc(x, y - 30 + b, 16, '#202028');
    for (let k = 0; k < 12; k++) { const an = k / 12 * Math.PI * 2 + a.t; P.rect(x + Math.cos(an) * 14, y - 30 + b + Math.sin(an) * 14, 2, 2, '#3a3a46'); }
    P.disc(x, y - 30 + b, 9, '#5a5a66'); P.disc(x, y - 30 + b, 5, '#2a2a34'); P.disc(x, y - 30 + b, 1, '#9a9aa6');
    P.line(x - 14, y - 36 + b, x - 20 - a.atk * 6, y - 28 + b, skin, 2); P.line(x + 14, y - 36 + b, x + 19, y - 28 + b, skin, 2);
    P.ell(x, y - 50 + b, 14, 8, frog); P.ell(x, y - 47 + b, 11, 4, '#a6e07a');
    P.disc(x - 7, y - 58 + b, 5, frog); P.disc(x + 6, y - 58 + b, 5, frog);
    P.eye(x - 7, y - 58 + b, 3, a); P.eye(x + 6, y - 58 + b, 3, a);
    P.rect(x - 11, y - 49 + b, 22, 1, '#2c5a1c'); P.rect(x - 12, y - 50 + b, 1, 1, '#2c5a1c');
  },

  trippi(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 3)), sh = '#ff8a65', sh2 = '#ff6a45';
    // a curled shrimp: tail fan at the bottom right, segments arcing up to a cat head
    for (let k = 0; k < 5; k++) P.line(x - 6 + k * 5, y - 16 + b, x - 8 + k * 5 + Math.round(Math.sin(a.t * 8 + k)), y - 2, '#e05535', 1);
    P.tri(x + 18, y - 6, 12, 7, sh2, 1); P.rect(x + 12, y - 8, 12, 3, sh2);
    for (let k = 0; k < 8; k++) {
      const an = Math.PI * 0.05 + k * 0.17;
      P.disc(x + 14 - Math.sin(an) * k * 3.4, y - 12 - k * 4.6 + b * (k / 8), 8 - k * 0.35, k % 2 ? sh : sh2);
    }
    const hx = x - 6, hy = y - 52 + b;
    P.tri(hx - 7, hy - 6, 6, 7, '#8e8e98'); P.tri(hx + 6, hy - 6, 6, 7, '#8e8e98');
    P.disc(hx, hy, 10, '#a2a2ac'); P.ell(hx - 1, hy + 4, 5, 3, '#e6e6ee');
    const iris = a.fury || a.wind ? '#e0102a' : '#2f9a3a';
    P.eye(hx - 4, hy - 2, 3, a, iris); P.eye(hx + 4, hy - 2, 3, a, iris);
    P.rect(hx - 1, hy + 2, 2, 1, '#ff8fb0');
    P.line(hx - 4, hy + 4, hx - 14, hy + 2, '#ffffff'); P.line(hx - 4, hy + 5, hx - 14, hy + 7, '#ffffff');
    P.line(hx - 6, hy - 9, hx - 20 - a.atk * 8, hy - 20, '#ff6a45'); P.line(hx - 2, hy - 10, hx - 12, hy - 26, '#ff6a45');
  },

  ballerina(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 3)), skin = '#f1c7a5', pink = '#ff8fc8', spin = Math.sin(a.t * 6);
    P.rect(x - 3, y - 22, 2, 20, skin); P.rect(x + 2, y - 22, 2, 20, skin);
    P.rect(x - 4, y - 3, 4, 3, '#ff5aa8'); P.rect(x + 1, y - 3, 4, 3, '#ff5aa8');
    P.ell(x, y - 24 + b, 17 + Math.round(spin * 2), 4, '#ffc2e2'); P.ell(x, y - 26 + b, 15 - Math.round(spin * 2), 3, pink);
    P.rect(x - 4, y - 36 + b, 8, 10, pink);
    const arm = a.atk * 8;
    P.line(x - 4, y - 34 + b, x - 10 - arm, y - 46 + b, skin, 2); P.line(x + 4, y - 34 + b, x + 10, y - 46 + b, skin, 2);
    P.line(x - 10 - arm, y - 46 + b, x - 4, y - 58 + b, skin, 2); P.line(x + 10, y - 46 + b, x + 4, y - 58 + b, skin, 2);
    for (let r = 0; r < 14; r++) P.rect(x - 9 + Math.floor(r / 5), y - 51 + b + r, 18 - 2 * Math.floor(r / 5), 1, '#f6f1e6');
    P.ring(x + 10, y - 45 + b, 3, 4, '#f6f1e6', 2);
    P.ell(x, y - 51 + b, 9, 2, '#c8996a'); P.rect(x - 1, y - 52 + b, 2, 1, '#f6f1e6'); P.rect(x - 2, y - 51 + b, 4, 1, '#f6f1e6');
    P.eye(x - 4, y - 45 + b, 2, a); P.eye(x + 3, y - 45 + b, 2, a);
    P.rect(x - 2, y - 41 + b, 4, 1, '#c8506a');
    P.rect(x - 5, y - 55 + b, 10, 2, '#ff5aa8');
  },

  assassino(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2.4)), cup = '#f4eee2';
    P.rect(x - 7, y - 10, 4, 10, '#1c1c24'); P.rect(x + 3, y - 10, 4, 10, '#1c1c24');
    P.ell(x, y - 12, 18, 2, '#dcd4c2');
    for (let r = 0; r < 34; r++) P.rect(x - 13 + Math.floor(r / 9), y - 48 + b + r, 26 - 2 * Math.floor(r / 9), 1, cup);
    P.ring(x + 14, y - 32 + b, 4, 6, cup, 2);
    P.ell(x, y - 48 + b, 13, 3, '#8b5a3c'); P.ell(x - 2, y - 49 + b, 6, 1, '#b07a55');
    P.rect(x - 13, y - 42 + b, 26, 6, '#1c1c24');
    const tail = Math.round(Math.sin(a.t * 7) * 2);
    P.line(x + 13, y - 40 + b, x + 22, y - 44 + b + tail, '#1c1c24', 2); P.line(x + 13, y - 38 + b, x + 23, y - 36 + b - tail, '#1c1c24', 2);
    P.rect(x - 9, y - 40 + b, 6, 2, '#ffffff'); P.rect(x + 1, y - 40 + b, 6, 2, '#ffffff');
    P.rect(x - 8, y - 40 + b, 2, 2, a.fury || a.wind ? '#e0102a' : '#140c1c'); P.rect(x + 2, y - 40 + b, 2, 2, a.fury || a.wind ? '#e0102a' : '#140c1c');
    // two katanas, crossed at rest, both slash forward on attack
    const th = -0.9 - a.atk * 1.2 + a.wind * 0.8;
    P.line(x - 12, y - 28 + b, x - 17, y - 26 + b, cup, 2); P.line(x + 12, y - 28 + b, x + 16, y - 24 + b, cup, 2);
    P.stick(x - 17, y - 26 + b, th, 26, '#d8e0ea', 2); P.stick(x - 17, y - 26 + b, th + Math.PI, 4, '#3a2a5a', 2);
    P.stick(x + 16, y - 24 + b, -th * 0.6, 24, '#d8e0ea', 2);
  },

  frigo(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 2)), camel = '#d2a56a', step = Math.round(Math.sin(a.t * 4));
    P.rect(x - 9, y - 9, 3, 7 + step, camel); P.rect(x + 6, y - 9, 3, 7 - step, camel);
    P.rect(x - 11, y - 3 + step, 6, 3, '#2a1a10'); P.rect(x + 5, y - 3 - step, 6, 3, '#2a1a10');
    P.rect(x - 13, y - 54 + b, 26, 46, '#e8eef2'); P.rect(x + 10, y - 54 + b, 3, 46, '#c4ccd4');
    P.rect(x - 10, y - 51 + b, 19, 40, '#b9e3ff'); P.rect(x - 10, y - 32 + b, 19, 1, '#8ab8d8');
    P.ell(x - 4, y - 36 + b, 6, 6, camel); P.ell(x + 5, y - 37 + b, 5, 6, camel);
    P.rect(x - 9, y - 30 + b, 17, 18, camel);
    P.rect(x - 4, y - 18 + b, 3, 4, '#ff5a5a'); P.rect(x + 3, y - 20 + b, 3, 6, '#7ad06a');
    const door = 1 - a.atk * 0.5;
    P.rect(x - 13 - Math.round(10 * door), y - 54 + b, Math.round(10 * door) + 1, 46, '#dfe6eb');
    P.rect(x - 11 - Math.round(8 * door), y - 40 + b, 1, 10, '#9aa4ae');
    P.rect(x - 3, y - 70 + b, 5, 18, camel);
    P.ell(x - 7, y - 72 + b, 7, 4, camel); P.ell(x - 12, y - 71 + b, 3, 3, '#c4955a');
    P.rect(x - 1, y - 77 + b, 2, 3, '#b58a50');
    P.eye(x - 7, y - 74 + b, 2, a);
    P.rect(x - 14, y - 70 + b, 1, 1, '#5a3a1a');
  },

  tralalero(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 3)), shark = '#5a8fc0';
    for (let k = 0; k < 3; k++) {
      const lx = x - 10 + k * 9, st = Math.round(Math.sin(a.t * 6 + k * 2) * 2);
      P.rect(lx, y - 22 + b, 3, 19 + st - b, shark);
      P.rect(lx - 3, y - 4 + st, 8, 4, '#2a6af0'); P.rect(lx - 3, y - 1 + st, 8, 1, '#ffffff');
      P.line(lx - 1, y - 2 + st, lx + 4, y - 4 + st, '#ffffff');
    }
    P.tri(x + 4, y - 41 + b, 10, 10, shark);
    for (let r = 0; r < 12; r++) { const w = Math.round(6 - r / 2); P.rect(x + 20, y - 40 + b + r, 6 - Math.abs(6 - r), 1, shark); }
    P.ell(x, y - 31 + b, 22, 10, shark);
    P.ell(x - 4, y - 27 + b, 16, 5, '#e8f0f8');
    P.eye(x - 12, y - 35 + b, 2, a);
    const open = 1 + Math.round(a.atk * 3 + a.wind * 2);
    P.rect(x - 22, y - 28 + b, 14, open + 1, '#3a0a1a');
    for (let k = 0; k < 5; k++) { P.tri(x - 20 + k * 3, y - 28 + b, 2, 2, '#ffffff', 1); }
    P.rect(x + 6, y - 34 + b, 1, 4, '#3a6a98'); P.rect(x + 9, y - 34 + b, 1, 4, '#3a6a98');
  },

  bombardiro(P, x, y, a) {
    const h = y - 30 + Math.round(Math.sin(a.t * 2.2) * 3), croc = '#4f8a3a', olive = '#6a7a5a';
    P.rect(x + 24, h - 30, 5, 18, olive); P.rect(x + 18, h - 16, 14, 4, olive);
    P.ell(x + 10, h - 12, 20, 10, olive); P.rect(x + 2, h - 6, 20, 1, '#55644a');
    P.ell(x - 12, h - 12, 16, 8, croc);
    P.rect(x - 36, h - 15, 24, 8, croc); P.rect(x - 36, h - 9, 24, 2, '#a6c48a');
    for (let k = 0; k < 7; k++) { P.tri(x - 34 + k * 3, h - 7, 2, 2, '#ffffff', 1); P.tri(x - 33 + k * 3, h - 15, 2, 2, '#ffffff', -1); }
    P.rect(x - 35, h - 17, 2, 2, '#2a4a1a');
    P.disc(x - 10, h - 20, 4, croc); P.eye(x - 10, h - 21, 3, a);
    for (let k = 0; k < 4; k++) P.rect(x - 4 + k * 4, h - 21, 2, 2, '#3f7030');
    P.rect(x - 18, h - 16, 46, 4, '#8a9a7a'); P.rect(x - 18, h - 16, 46, 1, '#b4c4a4');
    P.rect(x + 6, h - 15, 6, 2, '#ffffff'); P.rect(x + 8, h - 15, 2, 2, '#ff3b5c');
    for (const px of [x - 16, x + 26]) {
      P.disc(px, h - 10, 3, '#3a3a40');
      const spin = a.t * 30, l = 7;
      P.line(px + Math.cos(spin) * l, h - 10 + Math.sin(spin) * 3, px - Math.cos(spin) * l, h - 10 - Math.sin(spin) * 3, '#e8e8f0');
    }
    for (const bx of [x - 2, x + 10, x + 22]) {
      const drop = Math.round(a.wind * 6);
      P.ell(bx, h + 1 + drop, 3, 5, '#3a3a46'); P.rect(bx - 3, h - 5 + drop, 7, 1, '#3a3a46'); P.rect(bx, h + 6 + drop, 1, 1, '#ff5a3a');
    }
  },

  vaca(P, x, y, a) {
    const b = Math.round(Math.sin(a.t * 1.8) * 2), cy = y - 38 + b, ring = '#f4d35e', tilt = 0;
    P.rect(x - 7, y - 16, 2, 14, '#e8b48c'); P.rect(x + 5, y - 16, 2, 14, '#e8b48c');
    P.rect(x - 9, y - 3, 5, 3, '#ff3b5c'); P.rect(x + 4, y - 3, 5, 3, '#ff3b5c');
    P.ring(x, cy + tilt, 34, 7, ring, 2, -1); P.ring(x, cy + tilt, 30, 6, '#c9a030', 1, -1);
    P.disc(x, cy, 20, '#f4f4f4');
    for (const [dx, dy, r] of [[8, -10, 5], [12, 6, 4], [-2, 10, 3], [4, -2, 3]]) P.disc(x + dx, cy + dy, r, '#1c1c24');
    P.tri(x - 10, cy - 19, 3, 6, '#f2e6b0'); P.tri(x + 6, cy - 19, 3, 6, '#f2e6b0');
    P.ell(x - 18, cy - 12, 4, 2, '#e8e8e8');
    P.eye(x - 10, cy - 7, 3, a); P.eye(x - 1, cy - 8, 3, a);
    P.ell(x - 9, cy + 6, 9, 5, '#f2a0b0'); P.rect(x - 13, cy + 5, 2, 2, '#b05a6a'); P.rect(x - 7, cy + 5, 2, 2, '#b05a6a');
    P.ring(x, cy + tilt, 34, 7, ring, 2, 1); P.ring(x, cy + tilt, 30, 6, '#c9a030', 1, 1);
    for (let k = 0; k < 3; k++) { const an = a.t * 1.5 + k * 2.1; P.rect(x + Math.cos(an) * 32, cy + Math.sin(an) * 7, 1, 1, '#ffffff'); }
  },
};

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
};
// Every enemy's art by key (zones.js names the key).
const ENEMY_ART = { ...BOSS_ART, ...MINION_ART };

const WEAPON_COLORS = ['#c9b79c', '#b07a4a', '#c8ccd4', '#e6eaf2', '#29e7ff', '#ff7a4a', '#ffe14d', '#ff2bd6'];
const ARMOR_COLORS = ['#8a7a68', '#8a5a34', '#9aa3ad', '#c9d1db', '#7fd3ff', '#39d98a', '#ffd76a', '#ffffff'];

// The hero faces right. swing runs 1 -> 0 after each attack; alt flips which glove punches.
// Tiers pick the armour colour and the weapon's accent colour.
function drawHero(P, x, y, t, swing, wt, at, weapon, alt) {
  const b = Math.round(Math.sin(t * (weapon === 'guitar' ? 9 : 4)) * 0.6), armor = ARMOR_COLORS[Math.min(at, 7)], tint = WEAPON_COLORS[Math.min(wt, 7)];
  const skin = '#f2c9a0';
  P.rect(x - 9, y - 21 + b, 4, 13, '#d0306a');
  P.rect(x - 4, y - 8, 3, 8, '#2a2140'); P.rect(x + 1, y - 8, 3, 8, '#2a2140');
  P.rect(x - 5, y - 2, 4, 2, '#4a3a2a'); P.rect(x + 1, y - 2, 4, 2, '#4a3a2a');
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

// 16×16 menu icons, drawn with the same primitives and outlined like the sprites.
const ICONS = {
  sharpen(P) { P.line(4, 12, 12, 4, '#e6eaf2', 2); P.line(3, 9, 7, 13, '#ffe14d', 1); P.line(2, 14, 4, 12, '#6b3a1a', 2); P.rect(13, 2, 1, 1, '#ffffff'); P.rect(14, 4, 1, 1, '#29e7ff'); },
  vital(P) { P.disc(5, 6, 3, '#ff3b5c'); P.disc(11, 6, 3, '#ff3b5c'); P.tri(8, 8, 13, 7, '#ff3b5c', 1); P.rect(4, 5, 2, 1, '#ffffff'); },
  swift(P) { P.line(10, 1, 5, 8, '#ffe14d', 2); P.line(5, 8, 11, 8, '#ffe14d', 2); P.line(11, 8, 6, 15, '#ffe14d', 2); },
  precision(P) { P.ring(8, 8, 5, 5, '#ff3b5c', 1); P.rect(8, 1, 1, 4, '#ff3b5c'); P.rect(8, 12, 1, 4, '#ff3b5c'); P.rect(1, 8, 4, 1, '#ff3b5c'); P.rect(12, 8, 4, 1, '#ff3b5c'); P.rect(8, 8, 1, 1, '#ffffff'); },
  brutal(P) { P.disc(8, 7, 5, '#efe8ff'); P.rect(5, 11, 7, 3, '#efe8ff'); P.rect(5, 6, 2, 3, '#120818'); P.rect(10, 6, 2, 3, '#120818'); P.rect(8, 9, 1, 1, '#120818'); P.rect(7, 12, 1, 2, '#120818'); P.rect(9, 12, 1, 2, '#120818'); },
  plating(P) { P.rect(3, 2, 11, 7, '#9aa3ad'); P.tri(8, 9, 11, 6, '#9aa3ad', 1); P.rect(8, 3, 1, 10, '#ffe14d'); P.rect(4, 5, 9, 1, '#ffe14d'); P.rect(4, 3, 2, 1, '#ffffff'); },
  footwork(P) { P.rect(7, 3, 4, 8, '#8a5a34'); P.rect(7, 10, 8, 4, '#8a5a34'); P.rect(7, 13, 8, 1, '#4a2e18'); P.line(1, 5, 6, 4, '#ffffff'); P.line(1, 8, 6, 7, '#ffffff'); P.line(2, 11, 6, 10, '#ffffff'); },
  regen(P) { P.rect(6, 2, 4, 12, '#39ff88'); P.rect(2, 6, 12, 4, '#39ff88'); P.rect(7, 3, 1, 3, '#ffffff'); },
  greed(P) { P.disc(8, 10, 5, '#c9935a'); P.rect(6, 2, 4, 4, '#c9935a'); P.rect(5, 5, 6, 1, '#5a3a1e'); P.rect(7, 7, 2, 7, '#ffe14d'); P.rect(6, 8, 4, 1, '#ffe14d'); P.rect(6, 10, 4, 1, '#ffe14d'); P.rect(6, 12, 4, 1, '#ffe14d'); },
  armor(P) { P.rect(3, 4, 10, 10, '#c9d1db'); P.rect(1, 3, 4, 4, '#9aa3ad'); P.rect(11, 3, 4, 4, '#9aa3ad'); P.rect(6, 4, 4, 2, '#7a8490'); P.rect(8, 6, 1, 7, '#9aa3ad'); P.rect(4, 6, 2, 1, '#ffffff'); },
  charm(P) { P.line(3, 1, 8, 7, '#ffe14d'); P.line(13, 1, 8, 7, '#ffe14d'); P.disc(8, 10, 4, '#ffe14d'); P.disc(8, 10, 2, '#ff2bd6'); P.rect(7, 9, 1, 1, '#ffffff'); },
  sword(P) { P.line(4, 12, 13, 3, '#e6eaf2', 2); P.line(3, 9, 7, 13, '#ffe14d', 2); P.line(1, 15, 4, 12, '#6b3a1a', 2); P.rect(12, 3, 1, 1, '#ffffff'); },
  gloves(P) { P.disc(7, 8, 5, '#e02a2a'); P.disc(12, 8, 2, '#e02a2a'); P.rect(3, 12, 8, 3, '#ffffff'); P.rect(4, 5, 2, 2, '#ff8a8a'); },
  uzi(P) { P.rect(1, 5, 11, 4, '#3a3a46'); P.rect(1, 5, 11, 1, '#6a6a80'); P.rect(12, 6, 4, 2, '#2a2a34'); P.rect(3, 9, 3, 5, '#2a2a34'); P.rect(8, 9, 2, 6, '#55556a'); },
  wand(P) { P.line(2, 14, 10, 6, '#6b3a1a', 2); P.rect(12, 1, 1, 7, '#ffe14d'); P.rect(9, 4, 7, 1, '#ffe14d'); P.rect(11, 3, 3, 3, '#ffe14d'); P.rect(12, 4, 1, 1, '#ffffff'); P.rect(4, 3, 1, 1, '#29e7ff'); P.rect(14, 10, 1, 1, '#ff2bd6'); },
  guitar(P) { P.line(7, 9, 14, 2, '#8a5a34', 2); P.rect(13, 0, 3, 3, '#120818'); P.ell(5, 11, 4, 4, '#ff2bd6'); P.ell(8, 8, 3, 3, '#ff2bd6'); P.disc(6, 10, 1, '#120818'); P.line(3, 13, 14, 2, '#e8e8f0', 1); },
  bazooka(P) { P.rect(1, 5, 13, 5, '#5a6a3a'); P.rect(3, 5, 2, 5, '#ffe14d'); P.rect(14, 4, 2, 7, '#2a2a34'); P.rect(0, 5, 1, 5, '#2a2a34'); P.rect(6, 3, 3, 2, '#2a2a34'); P.rect(8, 10, 2, 4, '#2a2a34'); },
};

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
    stamp(dst, x, y, tint, alpha, rot) {
      sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, w, h); sg.drawImage(c, 0, 0);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = OUTLINE; sg.fillRect(0, 0, w, h);
      dst.save(); dst.translate(Math.round(x), Math.round(y)); if (rot) dst.rotate(rot);
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
