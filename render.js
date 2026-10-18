// Draws the arena. The world (stage, hero, enemies, shots, coins) is pixel art in a low-res buffer
// scaled up without smoothing; HP bars, numbers and banners go on top at full resolution in a
// pixel font. It only reads the fight; events from step() (passed in through v.events) trigger
// the animations. Ranged attacks fly first and their hits, kills and phase changes land on arrival.

const BUF_H = 128, GROUND = 104;
const FONT = '"Press Start 2P", monospace';
const SHOT_SPEED = { uzi: 700, wand: 220, guitar: 260, bazooka: 170 };   // buffer px per second; melee lands at once
const DEFAULT_LOOK = { sky: ['#0b0420', '#140630', '#1f0a40', '#2c0d4e', '#3d1058', '#55135e'], sun: ['#ffe14d', '#ff2bd6'],
  horizon: 'mountains', ridge: '#24093d', floor: '#0d0418', grid: '#5a1478', line: '#ff2bd6' };

function makeView(canvas) {
  const ctx = canvas.getContext('2d');
  const buf = document.createElement('canvas'), g = buf.getContext('2d'), P = pixels(g);
  const heroS = makeSprite(64, 48), bigS = makeSprite(112, 112), smallS = makeSprite(48, 52);
  const v = { W: 0, H: 0, bw: 0, scale: 1, particles: [], texts: [], banners: [], shots: [], ents: [], clock: 0,
    shake: 0, swing: 0, heroFlash: 0, alt: false, flash: 0, ridge: [], stars: [], fight: null, heroShown: 0 };

  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    v.W = r.width; v.H = r.height; v.scale = r.height / BUF_H;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    v.bw = buf.width = Math.max(64, Math.round(BUF_H * r.width / r.height));
    buf.height = BUF_H;
    v.ridge = Array.from({ length: v.bw }, (_, x) => Math.round(7 + 5 * Math.sin(x * 0.07) + 3 * Math.sin(x * 0.19 + 1) + 2 * Math.sin(x * 0.43)));
    v.stars = Array.from({ length: Math.round(v.bw / 4) }, (_, k) => [(k * 97) % v.bw, (k * 53) % (GROUND - 34), k % 5]);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const hx = () => Math.round(v.bw * 0.2);
  const ent = i => v.ents[i] || (v.ents[i] = { x: null, y: GROUND, atk: 0, flash: 0, wind: null, deadAt: null, spawnT: 0, hpShown: null });
  const height = d => d.size === 'big' ? (d.art === 'bombardiro' ? 60 : 78) : (d.art === 'seagull' ? 34 : d.art === 'jelly' ? 28 : 24);

  // Where every enemy still on screen stands: small ones spread in front, big ones at the back.
  function layout(f) {
    const shown = i => f.enemies[i].alive || ent(i).deadAt == null || v.clock - ent(i).deadAt < 0.5;
    const all = f.enemies.map((e, i) => i).filter(shown)
      .sort((a, b) => ((f.enemies[a].def.size === 'big') - (f.enemies[b].def.size === 'big')) || a - b);
    const bigs = all.filter(i => f.enemies[i].def.size === 'big'), smalls = all.filter(i => f.enemies[i].def.size !== 'big');
    const front = v.bw * 0.45, bigX = v.bw * (smalls.length ? 0.82 : 0.68);
    const room = (bigs.length ? bigX - 32 : v.bw * 0.92) - front, gap = smalls.length > 1 ? Math.min(26, room / (smalls.length - 1)) : 0;
    const pos = {};
    smalls.forEach((i, k) => { pos[i] = { x: smalls.length === 1 && !bigs.length ? v.bw * 0.66 : front + k * gap, y: GROUND - (k % 2) * 4 }; });
    bigs.forEach((i, k) => { pos[i] = { x: bigX + k * 20, y: GROUND }; });
    return pos;
  }
  const centre = (f, i) => { const E = ent(i); return [E.x == null ? v.bw * 0.7 : E.x, E.y - height(f.enemies[i].def) * 0.55]; };

  function text(x, y, str, color, size, vy) {
    v.texts.push({ x, y, str, color, size, vy: vy || -22, life: 1 });
    if (v.texts.length > 50) v.texts.shift();
  }
  function burst(x, y, n, colors, speed) {
    for (let k = 0; k < n && v.particles.length < 260; k++) {
      const an = Math.random() * Math.PI * 2, sp = speed * (0.4 + Math.random());
      v.particles.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - speed * 0.6, life: 0.8 + Math.random() * 0.6, c: colors[k % colors.length] });
    }
  }

  // Effects of the hero's attack arriving (or anything that has to wait for it).
  function land(e, f) {
    if (e.type === 'hit') {
      const E = ent(e.target), [x, y] = centre(f, e.target), small = e.minor || e.weapon === 'uzi';
      E.flash = small ? 0.03 : 0.08;
      const col = e.blocked && e.dmg < 3 ? '#8a8a96' : e.crit ? '#ffe14d' : '#ffffff';
      if (e.dmg >= 0.5 || !e.shieldDmg) text(x + (Math.random() - 0.5) * 10, y - 12, (e.crit ? 'CRIT ' : '') + fmt(e.dmg), col, (e.crit ? 1.3 : 0.9) * (small ? 0.7 : 1));
      if (e.shieldDmg >= 0.5) text(x + 6, y - 4, fmt(e.shieldDmg), '#29e7ff', 0.7);
      if (e.weapon === 'bazooka' && !e.minor) { burst(x, y, 18, ['#ffe14d', '#ff7a2a', '#ff3b5c', '#ffffff'], 50); v.shake = Math.max(v.shake, 0.15); }
      if (e.weapon === 'wand') burst(x, y, 6, ['#c77dff', '#29e7ff', '#ffffff'], 30);
    } else if (e.type === 'miss') { const [x, y] = centre(f, e.target); text(x, y - 12, 'MISS', '#8a8a96', 0.75); }
    else if (e.type === 'kill') {
      const [x, y] = centre(f, e.target), d = f.enemies[e.target].def;
      ent(e.target).deadAt = v.clock; burst(x, y, d.size === 'big' ? 60 : 20, [d.color, '#ffffff', '#ffe14d', '#ff2bd6'], 60);
    } else if (e.type === 'interrupt') { const [x, y] = centre(f, e.target); ent(e.target).wind = null; text(x, y - 22, 'INTERRUPTED!', '#39ff88', 0.9, -14); }
    else if (e.type === 'phase') { v.banners.push({ str: e.say || 'PHASE 2!', life: 2.4 }); v.flash = 0.4; v.shake = 0.5; }
    else if (e.type === 'heal' && e.target === 'hero') { if (e.amount >= 1) text(hx() + 4, GROUND - 40, '+' + fmt(e.amount), '#39ff88', 0.7); }
    if (v.onLand) v.onLand(e);
  }
  const LANDS = ['hit', 'miss', 'kill', 'interrupt', 'phase'];

  // Take one step's worth of events, in order.
  v.events = (list, f) => {
    let shot = null;
    for (const e of list) {
      const lands = LANDS.includes(e.type) || (e.type === 'heal' && e.target === 'hero');
      if (e.type === 'attack') {
        v.swing = 1; v.alt = !v.alt; shot = null;
        const m = MUZZLE[e.weapon];
        if (m) {
          const [tx, ty] = centre(f, e.target), x = hx() + m[0], y = GROUND + m[1];
          shot = { kind: e.weapon, x, y, x0: x, y0: y, tx: tx + (Math.random() - 0.5) * 4, ty: ty + (Math.random() - 0.5) * 6, t: 0,
            dur: Math.max(0.05, Math.hypot(tx - x, ty - y) / SHOT_SPEED[e.weapon]), list: [], f };
          v.shots.push(shot);
        }
      } else if (lands && shot) shot.list.push(e);
      else if (lands) land(e, f);
      else enemyEvent(e, f);
    }
  };

  function enemyEvent(e, f) {
    if (e.type === 'hurt') {
      v.heroFlash = 0.15; ent(e.src).atk = 1;
      if (e.heavy) v.shake = 0.35;
      text(hx(), GROUND - 38, '-' + fmt(e.dmg), '#ff3b5c', e.heavy ? 1.3 : 0.85);
    } else if (e.type === 'dodge') { ent(e.src).atk = 1; text(hx(), GROUND - 38, 'DODGE', '#29e7ff', 0.85); }
    else if (e.type === 'windup') ent(e.src).wind = { left: e.time, total: e.time, move: e.move };
    else if (e.type === 'spawn') { const E = ent(e.target); E.spawnT = 0.6; E.x = v.bw + 10; }
    else if (e.type === 'shield') { const [x, y] = centre(f, e.target); text(x, y - 20, 'SHIELD UP', '#29e7ff', 0.8, -12); }
    else if (e.type === 'heal') { const [x, y] = centre(f, e.target); text(x, y - 20, '+' + fmt(e.amount), '#39ff88', 0.9, -12); }
    else if (e.type === 'stance') { const [x, y] = centre(f, e.target); text(x, y - 20, 'DODGE STANCE', '#c77dff', 0.8, -12); }
    else if (e.type === 'enrage') { const [x, y] = centre(f, e.target); text(x, y - 20, 'ENRAGED!', '#ff3b5c', 0.9, -12); }
  }

  // Show a new fight (or a preview of one that hasn't started).
  v.setFight = f => {
    v.fight = f; v.ents = []; v.shots.length = 0; v.particles.length = 0; v.texts.length = 0; v.banners.length = 0;
    v.swing = 0; v.heroShown = f ? f.hero.hp : 0;
  };

  function stage(look) {
    const bw = v.bw, sky = look.sky;
    sky.forEach((c, k) => P.rect(0, k * GROUND / sky.length, bw, GROUND / sky.length + 1, c));
    for (const [x, y, k] of v.stars) if (y < GROUND * 0.5 && Math.sin(v.clock * (1 + k) + x) > -0.6) P.rect(x, y, 1, 1, k ? '#b8a8ff' : '#ffffff');
    const sx = Math.round(bw * 0.5), sy = GROUND - 8, r = 30;
    for (let dy = -r; dy <= 0 && sy + dy < GROUND; dy++) {
      const row = sy + dy, gap = dy > -16 ? Math.floor((dy + 16) / 4) + 1 : 0;
      if (gap && (row % 5) < gap) continue;
      const w = Math.round(Math.sqrt(r * r - dy * dy));
      P.rect(sx - w, row, 2 * w + 1, 1, mix(look.sun[0], look.sun[1], (dy + r) / r));
    }
    if (look.horizon === 'sea') {
      P.rect(0, GROUND - 12, bw, 12, look.sea);
      for (let k = 0; k < bw / 6; k++) {
        const x = (k * 37 + Math.floor(v.clock * 6) * (k % 2 ? 1 : -1)) % bw, y = GROUND - 11 + (k * 7) % 10;
        P.rect((x + bw) % bw, y, 3 + k % 3, 1, k % 3 ? look.foam : '#ffffff');
      }
      for (let x = 0; x < bw; x += 2) P.rect(x, GROUND - 13 + Math.round(Math.sin(x * 0.2 + v.clock * 2)), 2, 1, look.foam);
    } else for (let x = 0; x < bw; x++) P.rect(x, GROUND - v.ridge[x], 1, v.ridge[x], look.ridge);
    P.rect(0, GROUND, bw, BUF_H - GROUND, look.floor);
    const vx = bw / 2, scroll = (v.clock * 0.5) % 1;
    for (let k = 0; k < 7; k++) { const y = GROUND + Math.round(Math.pow((k + scroll) / 6, 2) * (BUF_H - GROUND)); P.rect(0, y, bw, 1, look.grid); }
    for (let i = -14; i <= 14; i++) P.line(vx + i * 4, GROUND, vx + i * 34, BUF_H + 4, look.grid);
    P.rect(0, GROUND, bw, 1, look.line);
  }

  function drawShot(s) {
    const p = s.t / s.dur, x = s.x, y = s.y;
    if (s.kind === 'uzi') { P.rect(x - 3, y, 3, 1, '#ff9a3a'); P.rect(x, y, 2, 1, '#ffe14d'); }
    else if (s.kind === 'wand') {
      P.disc(x, y, 2, Math.floor(v.clock * 20) % 2 ? '#c77dff' : '#29e7ff'); P.rect(x, y, 1, 1, '#ffffff');
      if (Math.random() < 0.6) v.particles.push({ x, y, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 20, life: 0.4, c: Math.random() < 0.5 ? '#29e7ff' : '#c77dff' });
    } else if (s.kind === 'guitar') {
      const r = 4 + Math.round(p * 14);
      for (let dy = -r; dy <= r; dy++) { const cx = x - Math.round(dy * dy / (r * 1.6)); P.rect(cx, y + dy, 2, 1, '#29e7ff'); P.rect(cx - 4, y + dy, 1, 1, '#ff2bd6'); }
      if (p < 0.5) { P.rect(x - 8, y - 9, 1, 5, '#ff2bd6'); P.rect(x - 10, y - 5, 2, 2, '#ff2bd6'); P.rect(x - 7, y - 9, 2, 1, '#ff2bd6'); }
    } else if (s.kind === 'bazooka') {
      P.rect(x - 5, y - 1, 6, 3, '#9aa3ad'); P.rect(x + 1, y - 1, 2, 3, '#ff3b5c'); P.rect(x - 7, y, 2, 1, Math.random() < 0.5 ? '#ffe14d' : '#ff7a2a');
      if (Math.random() < 0.7) v.particles.push({ x: x - 7, y, vx: -10 - Math.random() * 10, vy: -15 - Math.random() * 10, life: 0.5, c: '#8a8a96' });
    }
  }

  function bar(x, y, w, h, frac, color, shieldFrac) {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#2a1838'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color; ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), h);
    if (shieldFrac > 0) { const sh = Math.max(2, Math.round(h / 2)); ctx.fillStyle = '#29e7ff'; ctx.fillRect(x, y - sh - 1, Math.round(w * Math.min(1, shieldFrac)), sh); }
  }
  function fit(str, width, size) {
    for (; size > 6; size--) { ctx.font = size + 'px ' + FONT; if (ctx.measureText(str).width <= width) break; }
    return size;
  }
  function outlined(str, x, y, color) { ctx.strokeText(str, x, y); ctx.fillStyle = color; ctx.fillText(str, x, y); }

  // scene: { look, weapon, tier: { weapon, armour }, title }
  v.draw = (dt, scene) => {
    const f = v.fight, look = (scene && scene.look) || DEFAULT_LOOK;
    if (!v.bw) return;
    v.clock += dt;
    v.swing = Math.max(0, v.swing - dt * 5); v.heroFlash -= dt; v.flash = Math.max(0, v.flash - dt);
    v.shake = Math.max(0, v.shake - dt);
    for (const s of v.shots) {
      s.t += dt; const p = Math.min(1, s.t / s.dur);
      s.x = s.x0 + (s.tx - s.x0) * p; s.y = s.y0 + (s.ty - s.y0) * p + (s.kind === 'wand' ? Math.sin(p * Math.PI * 3) * 3 : 0);
      if (p >= 1) { s.done = true; for (const e of s.list) land(e, s.f); }
    }
    v.shots = v.shots.filter(s => !s.done);

    g.imageSmoothingEnabled = false;
    stage(look);
    const H = hx();
    P.ell(H, GROUND + 1, 9, 2, '#05010c');

    // enemies: slide into place, lunge on attacks, flash red on wind-ups, blink out when killed
    const drawn = [];
    if (f) {
      const pos = layout(f);
      for (const key in pos) {
        const i = +key, E = ent(i), p = pos[i];
        if (E.x == null) E.x = p.x;
        E.x += (p.x - E.x) * Math.min(1, dt * (E.spawnT > 0 ? 4 : 6)); E.y = p.y;
        E.atk = Math.max(0, E.atk - dt * 4); E.flash -= dt; E.spawnT -= dt;
        if (E.wind && (E.wind.left -= dt) <= 0) E.wind = null;
        drawn.push(i);
      }
      drawn.sort((a, b) => ((f.enemies[b].def.size === 'big') - (f.enemies[a].def.size === 'big')) || ent(b).x - ent(a).x);
      for (const i of drawn) {
        const e = f.enemies[i], E = ent(i), d = e.def, big = d.size === 'big', S = big ? bigS : smallS;
        if (E.deadAt != null && Math.floor((v.clock - E.deadAt) * 16) % 2) continue;
        if (d.art !== 'bombardiro' && d.art !== 'seagull') P.ell(E.x, E.y + 1, big ? 20 : 8, big ? 3 : 2, '#05010c');
        const wind = E.wind ? 1 - E.wind.left / E.wind.total : 0;
        S.clear();
        ENEMY_ART[d.art](S.P, S.ox, S.oy, { t: v.clock + i * 0.7, wind, atk: E.atk, fury: e.phase > 0 });
        const lunge = -Math.round(Math.sin(Math.PI * E.atk) * (big ? 6 : 4)), jitter = wind ? Math.round((Math.random() - 0.5) * 2) : 0;
        const red = wind && Math.floor(v.clock * 12) % 2;
        const tint = E.flash > 0 ? '#ffffff' : red ? '#ff3b5c' : e.phase > 0 && Math.floor(v.clock * 2) % 2 ? '#ff3b5c' : null;
        S.stamp(g, E.x + lunge + jitter, E.y, tint, E.flash > 0 ? 0.6 : red ? 0.45 : 0.18);
        if (e.alive && e.shield > 0) P.ring(E.x, E.y - height(d) / 2, (big ? 32 : 13) + Math.round(Math.sin(v.clock * 4)), height(d) * (big ? 0.42 : 0.55), Math.floor(v.clock * 6) % 2 ? '#29e7ff' : '#9ff4ff', 1);
        if (e.alive && e.dodgeT > 0 && Math.floor(v.clock * 10) % 2) P.ring(E.x, E.y - height(d) / 2, big ? 26 : 11, height(d) / 2, '#c77dff', 1);
      }
      const t = f.target;
      if (t >= 0 && f.enemies[t] && f.enemies[t].alive && !f.done) {
        const E = ent(t); P.tri(E.x, E.y - height(f.enemies[t].def) - 10 + Math.round(Math.sin(v.clock * 8)), 5, 3, '#ffe14d', 1);
      }
    }

    // hero: lunges with melee weapons, falls over when knocked out
    heroS.clear();
    const dead = f && f.done && !f.won, weapon = (scene && scene.weapon) || (f && f.hero.weapon.id) || 'sword', melee = !MUZZLE[weapon];
    const tier = (scene && scene.tier) || { weapon: 0, armour: 0 };
    drawHero(heroS.P, heroS.ox, heroS.oy, dead ? 0 : v.clock, v.swing, tier.weapon, tier.armour, weapon, v.alt);
    heroS.stamp(g, H + (melee ? Math.round(Math.sin(Math.PI * v.swing) * (weapon === 'gloves' ? 4 : 8)) : 0) - (dead ? 14 : 0), GROUND - (dead ? 2 : 0), v.heroFlash > 0 ? '#ff3b5c' : null, 0.6, dead ? -Math.PI / 2 : 0);
    if (f && f.hero.shieldHp > 0) P.ring(H, GROUND - 14, 12, 16, '#29e7ff', 1);

    for (const s of v.shots) drawShot(s);
    for (const p of v.particles) {
      p.vy += 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.y > GROUND) { p.y = GROUND; p.vy *= -0.4; p.vx *= 0.6; }
      P.rect(p.x, p.y - 1, 2, 2, p.c);
    }
    v.particles = v.particles.filter(p => p.life > 0);

    // blow the buffer up to the screen, then draw text and bars crisp at full size
    const sh = v.shake ? Math.round((Math.random() - 0.5) * 4 * v.shake / 0.35) : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, v.W, v.H);
    ctx.drawImage(buf, sh * v.scale, sh * v.scale * 0.5, v.W, v.H);
    if (v.flash) { ctx.fillStyle = 'rgba(255,59,92,' + v.flash * 0.5 + ')'; ctx.fillRect(0, 0, v.W, v.H); }
    const k = v.W / v.bw, s = v.scale;

    // per-enemy HP bars (shield above in cyan) and wind-up timers (red, below)
    if (f) for (const i of drawn) {
      const e = f.enemies[i], E = ent(i);
      if (!e.alive && E.deadAt != null) continue;
      E.hpShown = E.hpShown == null ? e.hp : E.hpShown + (e.hp - E.hpShown) * Math.min(1, dt * 10);
      const w = (e.def.size === 'big' ? 40 : 18) * k, x = E.x * k - w / 2, y = (E.y - height(e.def) - 5) * s, bh = Math.max(4, Math.round(s * 1.6));
      bar(x, y, w, bh, E.hpShown / e.maxHp, e.def.boss ? '#ff2bd6' : e.def.elite ? '#ffb020' : '#ff3b5c', e.shield / e.maxHp);
      if (E.wind) { ctx.fillStyle = '#ff3b5c'; ctx.fillRect(x, y + bh + 2, w * (E.wind.left / E.wind.total), Math.max(2, bh / 2)); }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const t of v.texts) {
      t.y += t.vy * dt; t.life -= dt * 0.9;
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 2));
      ctx.font = Math.round(Math.max(7, s * 4) * t.size) + 'px ' + FONT;
      ctx.lineWidth = Math.max(3, s * 1.1); ctx.strokeStyle = '#000';
      outlined(t.str, Math.round(t.x) * k, Math.round(t.y) * s, t.color);
    }
    v.texts = v.texts.filter(t => t.life > 0);
    ctx.globalAlpha = 1;

    // HUD: hero HP top left, encounter and timer top right, phase banners in the middle
    const fs = Math.max(7, Math.round(s * 3.6)), pad = Math.max(10, Math.round(s * 4)), bh = Math.max(10, Math.round(s * 4));
    ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    if (f) {
      v.heroShown += (f.hero.hp - v.heroShown) * Math.min(1, dt * 10);
      const w = Math.min(v.W * 0.4, 260);
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.font = fs + 'px ' + FONT;
      outlined('HERO ' + Math.ceil(f.hero.hp) + '/' + Math.round(f.hero.maxHp), pad, pad + fs + 2, '#ffffff');
      bar(pad, pad + fs + 6, w, bh, v.heroShown / f.hero.maxHp, '#39ff88', f.hero.shieldHp / f.hero.maxHp);
      const title = (scene && scene.title) || '';
      ctx.textAlign = 'right'; ctx.font = fit(title, v.W * 0.45, fs) + 'px ' + FONT;
      outlined(title, v.W - pad, pad + fs + 2, '#ffe14d');
      ctx.font = fs + 'px ' + FONT;
      const late = f.t > SUDDEN_DEATH;
      if (f.t > 0) outlined(late ? 'SUDDEN DEATH' : 'TIME ' + f.t.toFixed(1), v.W - pad, pad + fs * 2 + 10, late ? (Math.floor(v.clock * 4) % 2 ? '#ff3b5c' : '#ffffff') : '#29e7ff');
    }
    for (const b of v.banners) {
      b.life -= dt;
      ctx.globalAlpha = Math.max(0, Math.min(1, b.life * 2)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = fit(b.str, v.W - pad * 2, Math.round(fs * 2.2)) + 'px ' + FONT; ctx.lineWidth = 5;
      outlined(b.str, v.W / 2, v.H * 0.42, '#ff3b5c');
    }
    v.banners = v.banners.filter(b => b.life > 0);
    ctx.globalAlpha = 1;
  };
  return v;
}

function mix(a, b, t) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return 'rgb(' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t)).join(',') + ')';
}
