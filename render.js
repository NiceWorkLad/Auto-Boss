// Draws the arena: hero on the left, boss on the right, HP bars, floating numbers and coins.
// It only reads the fight; the events from step() trigger the animations.

const WEAPON_COLORS = ['#c9b79c', '#b07a4a', '#c8ccd4', '#e6eaf2', '#7fd3ff', '#ff7a4a', '#ffe27a', '#ff5cf0'];
const ARMOR_COLORS = ['#7a6a58', '#8a5a34', '#9aa3ad', '#c9d1db', '#9fe0ff', '#4fbf7a', '#ffd76a', '#ffffff'];

function makeView(canvas) {
  const ctx = canvas.getContext('2d');
  const v = { W: 0, H: 0, particles: [], texts: [], shake: 0, swing: 0, heroFlash: 0, bossFlash: 0, windup: 0, slamRing: 0, clock: 0 };

  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    v.W = r.width; v.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const layout = () => {
    const ground = v.H * 0.8, unit = Math.min(v.W / 16, v.H / 9);
    return { ground, unit, hx: v.W * 0.24, bx: v.W * 0.7, br: unit * 2.2 };
  };

  function text(x, y, str, color, size, vy) {
    v.texts.push({ x, y, str, color, size, vy: vy || -40, life: 1 });
    if (v.texts.length > 60) v.texts.shift();
  }

  // React to fight events with animation.
  v.event = (e, f) => {
    const L = layout();
    if (e.type === 'hit') {
      v.swing = 1; v.bossFlash = 0.12;
      text(L.bx + (Math.random() - 0.5) * L.br, L.ground - L.br * 2.1, (e.crit ? 'CRIT ' : '') + fmt(e.dmg), e.crit ? '#ffe27a' : '#ffffff', e.crit ? L.unit * 0.75 : L.unit * 0.5);
      const n = e.crit ? 4 : 1 + (Math.random() < 0.5);
      for (let k = 0; k < n && v.particles.length < 160; k++) {
        v.particles.push({ x: L.bx - L.br * 0.3, y: L.ground - L.br, vx: -(40 + Math.random() * 140), vy: -(120 + Math.random() * 160), life: 1.6, r: L.unit * 0.12 });
      }
    } else if (e.type === 'hurt') {
      v.heroFlash = 0.15;
      if (e.slam) { v.shake = 0.35; v.slamRing = 1; }
      text(L.hx, L.ground - L.unit * 3.2, '-' + fmt(e.dmg), '#ff6b6b', e.slam ? L.unit * 0.7 : L.unit * 0.45);
    } else if (e.type === 'dodge') {
      if (e.slam) v.slamRing = 1;
      text(L.hx, L.ground - L.unit * 3.2, 'DODGE', '#a78bfa', L.unit * 0.5);
    } else if (e.type === 'windup') {
      v.windup = SLAM_WINDUP;
    } else if (e.type === 'fury') {
      text(L.bx, L.ground - L.br * 2.6, 'ENRAGED!', '#ff6b6b', L.unit * 0.6, -20);
    }
  };

  v.reset = () => { v.particles.length = 0; v.texts.length = 0; v.windup = 0; v.swing = 0; };

  function bar(x, y, w, h, frac, color, label, right, marker) {
    ctx.fillStyle = 'rgba(0,0,0,.45)'; round(x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = color; round(x, y, Math.max(h, w * Math.max(0, Math.min(1, frac))), h, h / 2); if (frac > 0) ctx.fill();
    if (marker != null && marker > 0 && marker < 1) {
      ctx.fillStyle = '#ffc94a'; ctx.fillRect(x + w * marker - 1, y - 3, 2, h + 6);
    }
    ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.round(h * 0.62) + 'px Nunito, sans-serif'; ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillText(label, x + 8, y + h / 2 + 1);
    ctx.textAlign = 'right'; ctx.fillText(right, x + w - 8, y + h / 2 + 1);
  }
  function round(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function drawHero(L, f, s) {
    const u = L.unit, lunge = Math.sin(Math.PI * v.swing) * u * 0.9;
    const x = L.hx + lunge, y = L.ground;
    const wt = Math.min(WEAPON_COLORS.length - 1, s.gear.weapon || 0), at = Math.min(ARMOR_COLORS.length - 1, s.gear.armor || 0);
    const bob = Math.sin(v.clock * 4) * u * 0.05, dead = f && f.done && !f.won;
    ctx.save(); ctx.translate(x, y);
    if (dead) { ctx.rotate(-1.3); ctx.translate(-u * 0.6, -u * 0.2); }
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, u * 0.8, u * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    // legs
    ctx.strokeStyle = '#2b2233'; ctx.lineWidth = u * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-u * 0.25, -u * 1.0); ctx.lineTo(-u * 0.3, -u * 0.05); ctx.moveTo(u * 0.25, -u * 1.0); ctx.lineTo(u * 0.35, -u * 0.05); ctx.stroke();
    // body
    ctx.fillStyle = v.heroFlash > 0 ? '#ff8a8a' : ARMOR_COLORS[at];
    round(-u * 0.5, -u * 2.1 + bob, u * 1.0, u * 1.2, u * 0.25); ctx.fill();
    // head and helmet
    ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.arc(0, -u * 2.55 + bob, u * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ARMOR_COLORS[at]; ctx.beginPath(); ctx.arc(0, -u * 2.62 + bob, u * 0.45, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#2b2233'; ctx.fillRect(u * 0.12, -u * 2.6 + bob, u * 0.1, u * 0.1);
    // sword arm: swings down on each hit
    const ang = -1.1 + v.swing * 2.1, len = u * (1.0 + 0.12 * wt);
    ctx.translate(u * 0.4, -u * 1.7 + bob); ctx.rotate(ang);
    ctx.strokeStyle = '#5a4630'; ctx.lineWidth = u * 0.14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(u * 0.25, 0); ctx.stroke();
    ctx.strokeStyle = WEAPON_COLORS[wt]; ctx.lineWidth = u * (0.16 + 0.01 * wt);
    if (wt >= 4) { ctx.shadowColor = WEAPON_COLORS[wt]; ctx.shadowBlur = u * 0.5; }
    ctx.beginPath(); ctx.moveTo(u * 0.25, 0); ctx.lineTo(u * 0.25 + len, 0); ctx.stroke();
    ctx.restore();
  }

  function drawBoss(L, b, f) {
    const u = L.unit, wobble = Math.sin(v.clock * 2.2) * 0.04, wind = v.windup > 0 ? 1 - v.windup / SLAM_WINDUP : 0;
    const dead = f && f.done && f.won, sink = dead ? Math.min(1, (v.clock - v.deadAt) * 1.2) : 0;
    const r = L.br * (1 + wind * 0.12), x = L.bx + (wind ? (Math.random() - 0.5) * u * 0.15 : 0), y = L.ground;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 1 - sink * 0.85;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.1, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1 + wobble, (1 - wobble) * (1 - sink * 0.6));
    if (wind) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = u * 1.2 * wind; }
    // horns
    ctx.fillStyle = '#efe6d2';
    for (let k = 0; k < b.horns; k++) {
      const a = -Math.PI / 2 + (k - (b.horns - 1) / 2) * 0.45;
      const hx = Math.cos(a) * r * 0.9, hy = -r + Math.sin(a) * r * 0.9;
      ctx.beginPath(); ctx.moveTo(hx - r * 0.12, hy + r * 0.1); ctx.lineTo(hx + Math.cos(a) * r * 0.45, hy + Math.sin(a) * r * 0.45); ctx.lineTo(hx + r * 0.12, hy + r * 0.1); ctx.fill();
    }
    // body
    ctx.fillStyle = v.bossFlash > 0 ? mix(b.color, '#ffffff', 0.45) : b.color;
    ctx.beginPath(); ctx.ellipse(0, -r, r, r * 0.95, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 0.62, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    if (b.crown) {
      ctx.fillStyle = '#ffc94a'; ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 1.78); ctx.lineTo(-r * 0.4, -r * 2.1); ctx.lineTo(-r * 0.2, -r * 1.92); ctx.lineTo(0, -r * 2.18);
      ctx.lineTo(r * 0.2, -r * 1.92); ctx.lineTo(r * 0.4, -r * 2.1); ctx.lineTo(r * 0.4, -r * 1.78); ctx.fill();
    }
    // eyes look at the hero
    const angry = f && f.furious;
    for (const side of [-1, 1]) {
      const ex = side * r * 0.32 - r * 0.12, ey = -r * 1.2;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, r * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = angry || wind ? '#d10000' : '#1a1222'; ctx.beginPath(); ctx.arc(ex - r * 0.06, ey + r * 0.02, r * 0.08, 0, Math.PI * 2); ctx.fill();
      if (angry) { ctx.strokeStyle = '#1a1222'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(ex - r * 0.18, ey - r * 0.2 - side * r * 0.06); ctx.lineTo(ex + r * 0.18, ey - r * 0.2 + side * r * 0.06); ctx.stroke(); }
    }
    // mouth with teeth
    ctx.fillStyle = '#1a1222'; ctx.beginPath(); ctx.ellipse(-r * 0.12, -r * 0.72, r * 0.38, r * (0.1 + wind * 0.14), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let k = -2; k <= 2; k++) { const tx = -r * 0.12 + k * r * 0.13; ctx.beginPath(); ctx.moveTo(tx - r * 0.05, -r * 0.8); ctx.lineTo(tx, -r * 0.7); ctx.lineTo(tx + r * 0.05, -r * 0.8); ctx.fill(); }
    ctx.restore();
  }

  v.draw = (dt, f, s, boss) => {
    v.clock += dt;
    const L = layout(), u = L.unit;
    v.swing = Math.max(0, v.swing - dt * 4); v.heroFlash -= dt; v.bossFlash -= dt;
    v.shake = Math.max(0, v.shake - dt); v.slamRing = Math.max(0, v.slamRing - dt * 1.8);
    if (v.windup > 0) v.windup -= dt;
    if (f && f.done && f.won && v.deadAt == null) v.deadAt = v.clock;
    if (!f || !f.done) v.deadAt = null;

    ctx.save();
    if (v.shake) ctx.translate((Math.random() - 0.5) * u * v.shake, (Math.random() - 0.5) * u * v.shake);
    // backdrop tinted by the boss
    const g = ctx.createLinearGradient(0, 0, 0, v.H);
    g.addColorStop(0, '#16111f'); g.addColorStop(0.75, mix(boss.color, '#16111f', 0.82)); g.addColorStop(1, '#0d0a12');
    ctx.fillStyle = g; ctx.fillRect(-20, -20, v.W + 40, v.H + 40);
    ctx.fillStyle = '#1f1829'; ctx.fillRect(-20, L.ground, v.W + 40, v.H);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(-20, L.ground, v.W + 40, 2);
    if (v.slamRing) {
      ctx.strokeStyle = 'rgba(255,107,107,' + v.slamRing + ')'; ctx.lineWidth = u * 0.15;
      ctx.beginPath(); ctx.ellipse(L.bx, L.ground, (1 - v.slamRing) * v.W * 0.6 + L.br, u * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    drawBoss(L, boss, f);
    drawHero(L, f, s);

    // coins and floating numbers
    for (const p of v.particles) {
      p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.y > L.ground - p.r) { p.y = L.ground - p.r; p.vy *= -0.45; p.vx *= 0.7; }
      ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = '#ffc94a';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    v.particles = v.particles.filter(p => p.life > 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const t of v.texts) {
      t.y += t.vy * dt; t.life -= dt * 0.9;
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 2));
      ctx.font = '400 ' + Math.round(t.size) + 'px "Lilita One", sans-serif';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
    }
    v.texts = v.texts.filter(t => t.life > 0);
    ctx.globalAlpha = 1;
    ctx.restore();

    // HUD: hero bar left, boss bar right with your best damage marked
    const pad = Math.max(10, u * 0.4), bh = Math.max(16, u * 0.55), bw = (v.W - pad * 3) / 2;
    const hero = f ? f.hero : heroStats(s), hcur = f ? f.hero.cur : hero.hp;
    bar(pad, pad, bw, bh, hcur / hero.hp, '#6fdc8c', 'YOU', fmt(hcur) + ' / ' + fmt(hero.hp));
    const bcur = f ? f.boss.cur : boss.hp, best = s.best[boss.i] || 0;
    bar(pad * 2 + bw, pad, bw, bh, bcur / boss.hp, '#ff6b6b', boss.name.toUpperCase(), fmt(bcur), best ? 1 - best / boss.hp : null);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (f) {
      const earned = payout(s, f).base;
      ctx.font = '400 ' + Math.round(u * 0.7) + 'px "Lilita One", sans-serif'; ctx.fillStyle = '#ffc94a';
      ctx.fillText('+' + fmt(earned), v.W / 2, pad * 2 + bh);
      ctx.font = '800 ' + Math.round(u * 0.34) + 'px Nunito, sans-serif';
      const rage = f.t > ENRAGE_AT;
      ctx.fillStyle = rage ? '#ff6b6b' : 'rgba(255,255,255,.6)';
      ctx.fillText(rage ? 'BOSS ENRAGED ' + f.t.toFixed(0) + 's' : f.t.toFixed(1) + 's', v.W / 2, pad * 2 + bh + u * 0.8);
    } else {
      ctx.font = '800 ' + Math.round(u * 0.36) + 'px Nunito, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)';
      const first = !s.kills[boss.i], kill = boss.reward * heroStats(s).gold * (1 + KILL_BONUS * (first ? FIRST_KILL : 1));
      ctx.fillText('Boss ' + (boss.i + 1) + ' · a ' + (first ? 'first ' : '') + 'kill pays ' + fmt(kill), v.W / 2, pad * 2 + bh);
    }
  };
  return v;
}

function mix(a, b, t) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return 'rgb(' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t)).join(',') + ')';
}
