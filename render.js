// Draws the arena. The world (stage, hero, boss, coins) is pixel art in a low-res buffer that is
// scaled up without smoothing; the HUD and floating numbers go on top at full resolution in a pixel
// font. It only reads the fight; the events from step() trigger the animations.

const BUF_H = 128, GROUND = 104;
const FONT = '"Press Start 2P", monospace';

function makeView(canvas) {
  const ctx = canvas.getContext('2d');
  const buf = document.createElement('canvas'), g = buf.getContext('2d'), P = pixels(g);
  const heroS = makeSprite(64, 48), bossS = makeSprite(112, 112);
  const v = { W: 0, H: 0, bw: 0, scale: 1, particles: [], texts: [], shake: 0, swing: 0, heroFlash: 0, bossFlash: 0,
    bossAtk: 0, windup: 0, slamRing: 0, clock: 0, deadAt: null, ridge: [], stars: [] };

  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    v.W = r.width; v.H = r.height; v.scale = r.height / BUF_H;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    v.bw = buf.width = Math.max(64, Math.round(BUF_H * r.width / Math.max(1, r.height)));
    buf.height = BUF_H;
    // a fixed mountain ridge and starfield for this width
    v.ridge = Array.from({ length: v.bw }, (_, x) => Math.round(7 + 5 * Math.sin(x * 0.07) + 3 * Math.sin(x * 0.19 + 1) + 2 * Math.sin(x * 0.43)));
    v.stars = Array.from({ length: Math.round(v.bw / 4) }, (_, k) => [(k * 97) % v.bw, (k * 53) % (GROUND - 30), k % 5]);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const hx = () => Math.round(v.bw * 0.26), bx = () => Math.round(v.bw * 0.68);

  function text(x, y, str, color, size, vy) {
    v.texts.push({ x, y, str, color, size, vy: vy || -22, life: 1 });
    if (v.texts.length > 40) v.texts.shift();
  }
  function burst(x, y, n, colors, speed) {
    for (let k = 0; k < n && v.particles.length < 220; k++) {
      const an = Math.random() * Math.PI * 2, sp = speed * (0.4 + Math.random());
      v.particles.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - speed * 0.6, life: 1.2 + Math.random() * 0.6, c: colors[k % colors.length], coin: false });
    }
  }

  // React to fight events with animation.
  v.event = (e, f) => {
    if (e.type === 'hit') {
      v.swing = 1; v.bossFlash = 0.08;
      text(bx() + (Math.random() - 0.5) * 24, GROUND - 74, (e.crit ? 'CRIT ' : '') + fmt(e.dmg), e.crit ? '#ffe14d' : '#ffffff', e.crit ? 1.5 : 1);
      const n = e.crit ? 4 : 1 + (Math.random() < 0.5);
      for (let k = 0; k < n && v.particles.length < 220; k++) {
        v.particles.push({ x: bx() - 10, y: GROUND - 40, vx: -(12 + Math.random() * 40), vy: -(40 + Math.random() * 50), life: 1.6, coin: true });
      }
      if (f.done && f.won) burst(bx(), GROUND - 36, 60, [f.boss.color, '#ffffff', '#ffe14d', '#ff2bd6'], 70);
    } else if (e.type === 'hurt') {
      v.heroFlash = 0.15; v.bossAtk = 1;
      if (e.slam) { v.shake = 0.35; v.slamRing = 1; }
      text(hx(), GROUND - 38, '-' + fmt(e.dmg), '#ff3b5c', e.slam ? 1.4 : 0.9);
    } else if (e.type === 'dodge') {
      v.bossAtk = 1; if (e.slam) v.slamRing = 1;
      text(hx(), GROUND - 38, 'DODGE', '#29e7ff', 0.9);
    } else if (e.type === 'windup') {
      v.windup = SLAM_WINDUP;
    } else if (e.type === 'fury') {
      text(bx(), GROUND - 86, 'ENRAGED!', '#ff3b5c', 1.1, -10);
    }
  };

  v.reset = () => { v.particles.length = 0; v.texts.length = 0; v.windup = 0; v.swing = 0; v.bossAtk = 0; };

  function stage(boss) {
    const bw = v.bw;
    const bands = ['#0b0420', '#140630', '#1f0a40', '#2c0d4e', '#3d1058', '#55135e'];
    bands.forEach((c, k) => P.rect(0, k * GROUND / bands.length, bw, GROUND / bands.length + 1, mix(c, boss.color, 0.12)));
    for (const [x, y, k] of v.stars) if (Math.sin(v.clock * (1 + k) + x) > -0.6) P.rect(x, y, 1, 1, k ? '#b8a8ff' : '#ffffff');
    // the striped synthwave sun, sinking into the horizon
    const sx = Math.round(bw * 0.47), sy = GROUND - 8, r = 30;
    for (let dy = -r; dy <= 0 && sy + dy < GROUND; dy++) {
      const row = sy + dy, gap = dy > -16 ? Math.floor((dy + 16) / 4) + 1 : 0;
      if (gap && (row % 5) < gap) continue;
      const w = Math.round(Math.sqrt(r * r - dy * dy));
      P.rect(sx - w, row, 2 * w + 1, 1, mix('#ffe14d', '#ff2bd6', (dy + r) / r));
    }
    for (let x = 0; x < bw; x++) P.rect(x, GROUND - v.ridge[x], 1, v.ridge[x], '#24093d');
    P.rect(0, GROUND, bw, BUF_H - GROUND, '#0d0418');
    // perspective grid scrolling toward the viewer
    const vx = bw / 2, scroll = (v.clock * 0.5) % 1;
    for (let k = 0; k < 7; k++) { const y = GROUND + Math.round(Math.pow((k + scroll) / 6, 2) * (BUF_H - GROUND)); P.rect(0, y, bw, 1, '#5a1478'); }
    for (let i = -14; i <= 14; i++) P.line(vx + i * 4, GROUND, vx + i * 34, BUF_H + 4, '#5a1478');
    P.rect(0, GROUND, bw, 1, '#ff2bd6');
  }

  function bar(x, y, w, h, frac, color, label, right, marker) {
    const fs = fit(label, w * 0.62, Math.max(7, Math.round(v.scale * 3.6)));
    ctx.font = fs + 'px ' + FONT; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, y - 4);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffe14d'; ctx.font = Math.max(7, Math.round(v.scale * 3.6)) + 'px ' + FONT;
    ctx.fillText(right, x + w, y - 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#000000'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color; ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), h);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    const seg = Math.max(6, Math.round(h * 0.7));
    for (let sx = x + seg; sx < x + w; sx += seg) ctx.fillRect(sx, y, 2, h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, w, 2);
    if (marker != null && marker > 0 && marker < 1) { ctx.fillStyle = '#ffe14d'; ctx.fillRect(x + Math.round(w * marker) - 1, y - 5, 3, h + 10); }
  }
  // Largest font size (down to 6px) at which str fits in width.
  function fit(str, width, size) {
    for (; size > 6; size--) { ctx.font = size + 'px ' + FONT; if (ctx.measureText(str).width <= width) break; }
    return size;
  }

  v.draw = (dt, f, s, boss) => {
    v.clock += dt;
    v.swing = Math.max(0, v.swing - dt * 5); v.heroFlash -= dt; v.bossFlash -= dt; v.bossAtk = Math.max(0, v.bossAtk - dt * 4);
    v.shake = Math.max(0, v.shake - dt); v.slamRing = Math.max(0, v.slamRing - dt * 1.8);
    if (v.windup > 0) v.windup -= dt;
    if (f && f.done && f.won && v.deadAt == null) v.deadAt = v.clock;
    if (!f || !f.done) v.deadAt = null;

    g.imageSmoothingEnabled = false;
    stage(boss);
    const H = hx(), B = bx(), wind = v.windup > 0 ? 1 - v.windup / SLAM_WINDUP : 0;
    P.ell(H, GROUND + 1, 9, 2, '#05010c'); if (boss.id !== 'bombardiro') P.ell(B, GROUND + 1, 20, 3, '#05010c');
    if (v.slamRing) P.ring(B - (1 - v.slamRing) * (B - H), GROUND + 1, 6 + (1 - v.slamRing) * 30, 2 + (1 - v.slamRing) * 3, '#ff3b5c', 1);

    // boss: blinks out when killed, flashes red while winding up a slam
    const sinceDeath = v.deadAt == null ? 0 : v.clock - v.deadAt;
    if (sinceDeath < 0.7 && !(sinceDeath > 0 && Math.floor(sinceDeath * 16) % 2)) {
      bossS.clear();
      BOSS_ART[boss.id](bossS.P, bossS.ox, bossS.oy, { t: v.clock, wind, atk: v.bossAtk, fury: !!(f && f.furious) });
      const jitter = wind ? Math.round((Math.random() - 0.5) * 2) : 0, lunge = -Math.round(Math.sin(Math.PI * v.bossAtk) * 6);
      const red = wind && Math.floor(v.clock * 12) % 2;
      bossS.stamp(g, B + lunge + jitter, GROUND, v.bossFlash > 0 ? '#ffffff' : red ? '#ff3b5c' : null, v.bossFlash > 0 ? 0.6 : 0.45);
    }
    // hero: lunges on each swing, falls over when knocked out
    heroS.clear();
    const dead = f && f.done && !f.won;
    drawHero(heroS.P, heroS.ox, heroS.oy, dead ? 0 : v.clock, v.swing, s.gear.weapon || 0, s.gear.armor || 0);
    heroS.stamp(g, H + Math.round(Math.sin(Math.PI * v.swing) * 8) - (dead ? 14 : 0), GROUND - (dead ? 2 : 0), v.heroFlash > 0 ? '#ff3b5c' : null, 0.6, dead ? -Math.PI / 2 : 0);

    for (const p of v.particles) {
      p.vy += 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.y > GROUND) { p.y = GROUND; p.vy *= -0.4; p.vx *= 0.6; }
      if (p.coin) { P.rect(p.x - 1, p.y - 2, 3, 3, '#ffe14d'); P.rect(p.x - 1, p.y - 2, 1, 1, '#fff8c0'); }
      else P.rect(p.x, p.y - 1, 2, 2, p.c);
    }
    v.particles = v.particles.filter(p => p.life > 0);

    // blow the buffer up to the screen, then draw text crisp at full size
    const sh = v.shake ? Math.round((Math.random() - 0.5) * 4 * v.shake / 0.35) : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, v.W, v.H);
    ctx.drawImage(buf, sh * v.scale, sh * v.scale * 0.5, v.W, v.H);

    const k = v.W / v.bw;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const t of v.texts) {
      t.y += t.vy * dt; t.life -= dt * 0.9;
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 2));
      ctx.font = Math.round(Math.max(8, v.scale * 4.5) * t.size) + 'px ' + FONT;
      ctx.lineWidth = Math.max(3, v.scale * 1.2); ctx.strokeStyle = '#000';
      ctx.strokeText(t.str, Math.round(t.x) * k, Math.round(t.y) * v.scale);
      ctx.fillStyle = t.color; ctx.fillText(t.str, Math.round(t.x) * k, Math.round(t.y) * v.scale);
    }
    v.texts = v.texts.filter(t => t.life > 0);
    ctx.globalAlpha = 1;

    // HUD: hero bar left, boss bar right with your best damage marked
    const fs = Math.max(7, Math.round(v.scale * 3.6)), pad = Math.max(10, Math.round(v.scale * 4)), bh = Math.max(10, Math.round(v.scale * 4.5));
    const top = pad + fs + 6, w = (v.W - pad * 3) / 2;
    const hero = f ? f.hero : heroStats(s), hcur = f ? f.hero.cur : hero.hp;
    bar(pad, top, w, bh, hcur / hero.hp, '#39ff88', 'HERO', fmt(hcur));
    const bcur = f ? f.boss.cur : boss.hp, best = s.best[boss.i] || 0;
    bar(pad * 2 + w, top, w, bh, bcur / boss.hp, '#ff3b5c', boss.name.toUpperCase(), fmt(bcur), best ? 1 - best / boss.hp : null);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const y2 = top + bh + pad * 0.8;
    if (f) {
      ctx.font = Math.round(fs * 1.9) + 'px ' + FONT; ctx.fillStyle = '#ffe14d';
      ctx.lineWidth = 4; ctx.strokeStyle = '#000'; const gold = '+' + fmt(payout(s, f).base);
      ctx.strokeText(gold, v.W / 2, y2); ctx.fillText(gold, v.W / 2, y2);
      const rage = f.t > ENRAGE_AT;
      ctx.font = fs + 'px ' + FONT;
      ctx.fillStyle = rage ? (Math.floor(v.clock * 4) % 2 ? '#ff3b5c' : '#ffffff') : '#29e7ff';
      ctx.fillText(rage ? 'ENRAGE!' : 'TIME ' + f.t.toFixed(1), v.W / 2, y2 + fs * 2.6);
    } else {
      const first = !s.kills[boss.i], kill = boss.reward * heroStats(s).gold * (1 + KILL_BONUS * (first ? FIRST_KILL : 1));
      ctx.font = fs + 'px ' + FONT; ctx.fillStyle = '#29e7ff';
      ctx.fillText('STAGE ' + (boss.i + 1), v.W / 2, y2);
      ctx.fillStyle = '#ffe14d'; ctx.font = fit((first ? 'FIRST ' : '') + 'KILL PAYS ' + fmt(kill), v.W - pad * 2, fs) + 'px ' + FONT;
      ctx.fillText((first ? 'FIRST ' : '') + 'KILL PAYS ' + fmt(kill), v.W / 2, y2 + fs * 1.8);
      if (Math.floor(v.clock * 2) % 2) { ctx.fillStyle = '#ffffff'; ctx.font = fs + 'px ' + FONT; ctx.fillText('PRESS FIGHT', v.W / 2, y2 + fs * 3.6); }
    }
  };
  return v;
}

function mix(a, b, t) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return 'rgb(' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t)).join(',') + ')';
}
