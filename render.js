// Draws the arena. The world (stage, hero, enemies, shots, coins) is pixel art in a low-res buffer
// scaled up without smoothing; HP bars, numbers and banners go on top at full resolution in a
// pixel font. It only reads the fight; events from step() (passed in through v.events) trigger
// the animations. Ranged attacks fly first and their hits, kills and phase changes land on arrival.

const BUF_H = 128, GROUND = 104;
const FONT = '"Press Start 2P", monospace';
const SHOT_SPEED = { uzi: 700, wand: 220, guitar: 260, bazooka: 170, flamer: 300, freeze: 900, boomerang: 200, stars: 380, sniper: 1800 };   // buffer px per second; melee lands at once
const DEFAULT_LOOK = { sky: ['#0b0420', '#140630', '#1f0a40', '#2c0d4e', '#3d1058', '#55135e'], sun: ['#ffe14d', '#ff2bd6'],
  horizon: 'mountains', ridge: '#24093d', floor: '#0d0418', grid: '#5a1478', line: '#ff2bd6' };

function makeView(canvas) {
  const ctx = canvas.getContext('2d');
  const buf = document.createElement('canvas'), g = buf.getContext('2d'), P = pixels(g);
  const heroS = makeSprite(64, 48), bigS = makeSprite(112, 112), smallS = makeSprite(48, 52), allyS = makeSprite(48, 52);
  const v = { W: 0, H: 0, bw: 0, scale: 1, particles: [], texts: [], banners: [], shots: [], ents: [], clock: 0,
    shake: 0, swing: 0, heroFlash: 0, alt: false, flash: 0, ridge: [], stars: [], fight: null, heroShown: 0, allies: [], cardFlash: [], zaps: [],
    slashes: [], rings: [], tele: null, ink: 0, inkBlots: [], dim: 0, foeShots: [], intro: false };
  const BOSS_SCALE = 1.2;          // bosses are drawn bigger than elites

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
  const height = d => (ART_HEIGHT[d.art] || (d.size === 'big' ? 70 : 24)) * (d.boss ? BOSS_SCALE : 1);

  // Where every enemy still on screen stands: small ones spread in front, big ones at the back.
  function layout(f) {
    const shown = i => f.enemies[i].alive || ent(i).deadAt == null || v.clock - ent(i).deadAt < 0.5;
    const all = f.enemies.map((e, i) => i).filter(shown)
      .sort((a, b) => ((f.enemies[a].def.size === 'big') - (f.enemies[b].def.size === 'big')) || a - b);
    const back = all.filter(i => f.enemies[i].traits.backline && f.enemies[i].def.size !== 'big');
    const bigs = all.filter(i => f.enemies[i].def.size === 'big'), smalls = all.filter(i => f.enemies[i].def.size !== 'big' && !back.includes(i));
    const front = v.bw * 0.45, bigX = v.bw * (smalls.length ? 0.82 : 0.68);
    const room = (bigs.length ? bigX - 32 : v.bw * 0.92) - front, gap = smalls.length > 1 ? Math.min(26, room / (smalls.length - 1)) : 0;
    const pos = {};
    smalls.forEach((i, k) => { pos[i] = { x: smalls.length === 1 && !bigs.length ? v.bw * 0.66 : front + k * gap, y: GROUND - (k % 2) * 4 }; });
    bigs.forEach((i, k) => { const bk = f.enemies[i].traits.backline; pos[i] = { x: bigX + k * 20 + (bk ? 6 : 0), y: GROUND - (bk ? 6 : 0) }; });
    back.forEach((i, k) => { pos[i] = { x: v.bw * (bigs.length ? 0.95 : 0.88) - k * 14, y: GROUND - 8 - (k % 2) * 3 }; });   // the back row
    return pos;
  }
  const centre = (f, i) => { const E = ent(i); return [E.x == null ? v.bw * 0.7 : E.x, E.y - height(f.enemies[i].def) * 0.55]; };
  // Allies (card summons) line up behind and in front of the hero, mirrored to face the enemies.
  const ally = k => v.allies[k] || (v.allies[k] = { x: -10, y: GROUND, atk: 0, flash: 0, deadAt: null });
  const allyPos = k => ({ x: Math.round(v.bw * 0.2) + 20 + (k % 4) * Math.max(8, (v.bw * 0.22 - 20) / 4), y: GROUND + 4 - (k % 2) * 6 - Math.floor(k / 4) * 3 });
  const CARD_COLOR = { boost: '#39ff88', pact: '#ffb020', trigger: '#ffe14d', summon: '#29e7ff', multiplier: '#ff2bd6' };

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
      // every weapon lands its own way
      if (e.weapon === 'bazooka') { burst(x, y, 14, ['#ffe14d', '#ff7a2a', '#ff3b5c', '#ffffff'], 50); v.rings.push({ x, y, r: 2, max: 18, life: 0.35, c: '#ffb020' }); v.shake = Math.max(v.shake, 0.2); }
      else if (e.weapon === 'wand') burst(x, y, 6, ['#c77dff', '#29e7ff', '#ffffff'], 30);
      else if (e.weapon === 'sword') v.slashes.push({ x, y, life: 0.18, flip: v.alt, big: (f.focus && f.focus.n) || 0 });
      else if (e.weapon === 'gloves') { burst(x, y, 4, ['#ffffff', '#ff3b5c'], 40); v.rings.push({ x, y, r: 1, max: 6, life: 0.12, c: '#ffffff' }); }
      else if (e.weapon === 'stars') burst(x, y, 3, ['#c8ccd4', '#ffffff'], 30);
      else if (e.weapon === 'sniper') { burst(x, y, 16, ['#ffffff', '#ffe14d', '#c8ccd4'], 70); v.shake = Math.max(v.shake, 0.25); v.flash = Math.max(v.flash, 0.05); }
      const fx = v.cos && v.cos.hitFx;
      if (fx && fx.colors) burst(x, y, small ? 1 : 3, fx.colors, 35);       // cosmetic hit sparks
    } else if (e.type === 'miss') { const [x, y] = centre(f, e.target); text(x, y - 12, e.ink ? 'INKED' : 'MISS', e.ink ? '#c77dff' : '#8a8a96', 0.75); }
    else if (e.type === 'kill') {
      const [x, y] = centre(f, e.target), d = f.enemies[e.target].def;
      const fx = v.cos && v.cos.hitFx;
      ent(e.target).deadAt = v.clock; burst(x, y, d.size === 'big' ? 60 : 20, fx && fx.colors ? [d.color].concat(fx.colors) : [d.color, '#ffffff', '#ffe14d', '#ff2bd6'], 60);
    } else if (e.type === 'interrupt') { const [x, y] = centre(f, e.target); ent(e.target).wind = null; if (v.tele && v.tele.src === e.target) v.tele = null; text(x, y - 22, 'INTERRUPTED!', '#39ff88', 0.9, -14); }
    else if (e.type === 'phase') {
      v.banners.push({ str: e.say || 'PHASE 2!', life: 2.4 }); v.flash = 0.4; v.shake = 0.5;
      if (e.boss) {           // a boss's phase change is a moment: the arena darkens around it and it erupts
        const [x, y] = centre(f, e.target), d = f.enemies[e.target].def;
        v.dim = 1.4; v.tele = null; burst(x, y, 70, [d.color, '#ffffff', '#ffe14d'], 80);
        v.rings.push({ x, y, r: 4, max: 60, life: 0.8, c: '#ffffff' }, { x, y, r: 2, max: 40, life: 0.6, c: d.color });
        if (v.onBoss) v.onBoss('phase');
      }
    }
    else if (e.type === 'heal' && e.target === 'hero') { if (e.amount >= 1) text(hx() + 4, GROUND - 40, '+' + fmt(e.amount), '#39ff88', 0.7); }
    if (v.onLand) v.onLand(e);
  }
  const LANDS = ['hit', 'miss', 'kill', 'interrupt', 'phase'];

  // Take one step's worth of events, in order.
  v.events = (list, f) => {
    let shot = null;
    if (!v.intro && f.started) {          // a boss fight opens with a title card and a sting
      v.intro = true;
      const b = f.enemies.find(e => e.def.boss);
      if (b) { v.banners.push({ str: b.def.name.toUpperCase(), sub: 'BOSS FIGHT', color: '#ff2bd6', life: 2.2 }); if (v.onBoss) v.onBoss('intro'); }
    }
    for (const e of list) {
      const lands = LANDS.includes(e.type) || (e.type === 'heal' && e.target === 'hero');
      if (e.type === 'attack') {
        v.swing = 1; v.alt = !v.alt; shot = null;
        if (e.beat) text(hx() + 10, GROUND - 44, '♪ BEAT', '#ff2bd6', 0.75, -18);       // the Metronome's downbeat
        const m = MUZZLE[e.weapon];
        if (m) {
          const [tx, ty] = centre(f, e.target), x = hx() + m[0], y = GROUND + m[1];
          shot = { kind: e.weapon, x, y, x0: x, y0: y, tx: tx + (Math.random() - 0.5) * 4, ty: ty + (Math.random() - 0.5) * 6, t: 0,
            dur: Math.max(0.05, Math.hypot(tx - x, ty - y) / SHOT_SPEED[e.weapon]), list: [], f, target: e.target };
          if (e.weapon === 'boomerang') { shot.legs = [[shot.tx, shot.ty]]; shot.leg = 0; shot.back = []; }
          v.shots.push(shot);
        }
      } else if (lands && shot && shot.legs && e.target !== shot.target && e.target !== 'hero') {
        // the boomerang's second hit lands at the back row on the return leg
        if (!shot.back.length) { const [bx, by] = centre(f, e.target); shot.legs.push([bx, by]); }
        shot.back.push(e);
      } else if (lands && shot) shot.list.push(e);
      else if (lands) land(e, f);
      else enemyEvent(e, f);
    }
  };

  function enemyEvent(e, f) {
    if (e.type === 'card') {
      const c = typeof CARDS !== 'undefined' && CARDS[e.id];
      v.cardFlash.push({ str: (c ? c.name : e.name).toUpperCase() + (e.times > 1 ? ' ×' + e.times : ''), color: c ? CARD_COLOR[c.type] : '#ffe14d', life: 1.8 });
      if (v.cardFlash.length > 4) v.cardFlash.shift();
      burst(hx(), GROUND - 20, 6, ['#ffe14d', '#ffffff'], 30);
    } else if (e.type === 'zap') {
      const [x, y] = centre(f, e.target), c = DAMAGE_TYPES[e.dtype].color;
      v.zaps.push({ x0: hx() + 4, y0: GROUND - 26, x1: x, y1: y, c, life: 0.18 });
      burst(x, y, 5, [c, '#ffffff'], 30);
    } else if (e.type === 'allySpawn') { const A = ally(e.ally); A.x = -12; A.deadAt = null; burst(hx(), GROUND - 10, 8, ['#29e7ff', '#ffffff'], 30); }
    else if (e.type === 'allyAttack') ally(e.ally).atk = 1;
    else if (e.type === 'allyHurt') { const A = ally(e.ally); A.flash = 0.12; ent(e.src).atk = 1; text(A.x, A.y - 22, '-' + fmt(e.dmg), '#ff8a5a', 0.6); }
    else if (e.type === 'allyDeath') { const A = ally(e.ally); A.deadAt = v.clock; burst(A.x, A.y - 8, 14, ['#ffffff', '#29e7ff', '#ffe14d'], 40); }
    else if (e.type === 'heroShield') text(hx(), GROUND - 44, 'SHIELD', '#29e7ff', 0.8, -14);
    else if (e.type === 'ench') { const [x, y] = centre(f, e.target); text(x, y - 26, e.say, '#c77dff', 0.8, -12); }
    else if (e.type === 'reflect') { if (e.dmg >= 1) text(hx(), GROUND - 40, '-' + fmt(e.dmg), '#c77dff', 0.6); }
    else if (e.type === 'gold') text(hx() + 6, GROUND - 46, '+' + e.amount + 'G', '#ffe14d', 0.75, -16);
    else if (e.type === 'hurt') {
      v.heroFlash = 0.15; ent(e.src).atk = 1;
      if (e.heavy) v.shake = 0.35;
      text(hx(), GROUND - 38, '-' + fmt(e.dmg), '#ff3b5c', e.heavy ? 1.3 : 0.85);
      const src = f.enemies[e.src];
      if (src && src.def.boss) {
        // boss hits land big: a slam shakes the arena and throws up debris; a volley flies at you
        if (e.heavy) { v.shake = 0.6; v.flash = Math.max(v.flash, 0.25); v.rings.push({ x: hx(), y: GROUND - 2, r: 3, max: 34, life: 0.45, c: '#ffffff' }); burst(hx(), GROUND - 4, 26, ['#c8a070', '#8a6a4a', '#ffffff'], 70); }
        else { const [x, y] = centre(f, e.src); v.foeShots.push({ x0: x - 10, y0: y, x1: hx() + 2, y1: GROUND - 18, t: 0, dur: 0.22, kind: src.def.art }); }
      }
    } else if (e.type === 'dodge') { ent(e.src).atk = 1; text(hx(), GROUND - 38, 'DODGE', '#29e7ff', 0.85); }
    else if (e.type === 'windup') {
      ent(e.src).wind = { left: e.time, total: e.time, move: e.move };
      // a named move is a boss's signature: its name over the boss and a warning on whoever it's aimed at
      if (e.name) { const [x, y] = centre(f, e.src); v.tele = { src: e.src, name: e.name, move: e.move, left: e.time, total: e.time }; text(x, y - height(f.enemies[e.src].def) * 0.5 - 6, e.name + '!', '#ffe14d', 1.15, -6); }
    }
    else if (e.type === 'ink') {
      v.ink = e.time; v.tele = null;
      v.inkBlots = Array.from({ length: 8 }, () => ({ x: Math.random(), y: Math.random() * 0.6 + 0.3, r: 0.03 + Math.random() * 0.05 }));
      burst(hx(), GROUND - 20, 24, ['#1a0a20', '#3a1048', '#c77dff'], 50);
    }
    else if (e.type === 'revive') {          // an extra life: the snorkel gasps, the flip-flops burst into flame
      const fire = e.id === 'phoenix';
      v.banners.push({ str: fire ? 'RISE, PHOENIX!' : 'SECOND WIND!', color: fire ? '#ff7a2a' : '#29e7ff', life: 1.8 }); v.flash = 0.3; v.shake = 0.4;
      burst(hx(), GROUND - 16, 40, fire ? ['#ff7a2a', '#ffe14d', '#ff3b5c'] : ['#29e7ff', '#ffffff', '#9fe8ff'], 70);
      if (fire) v.rings.push({ x: hx(), y: GROUND - 14, r: 4, max: v.bw * 0.8, life: 0.6, c: '#ff7a2a' });
    }
    else if (e.type === 'dive') { ent(e.src).diveT = 0.6; v.tele = null; v.shake = 0.7; v.flash = 0.3; burst(hx(), GROUND - 16, 30, ['#1c1424', '#ffe14d', '#ff7a2a', '#ffffff'], 80); }
    else if (e.type === 'spawn') { const E = ent(e.target); E.spawnT = 0.6; E.x = v.bw + 10; }
    else if (e.type === 'shield') { const [x, y] = centre(f, e.target); text(x, y - 20, 'SHIELD UP', '#29e7ff', 0.8, -12); }
    else if (e.type === 'heal') { const [x, y] = centre(f, e.target); text(x, y - 20, '+' + fmt(e.amount), '#39ff88', 0.9, -12); }
    else if (e.type === 'ignite') { const [x, y] = centre(f, e.target); text(x, y - 18, 'BURNING', '#ff7a2a', 0.7, -12); }
    else if (e.type === 'burn') { const [x, y] = centre(f, e.target); text(x + (Math.random() - 0.5) * 8, y - 6, fmt(e.dmg), '#ff9a3a', 0.6, -16); }
    else if (e.type === 'freeze') { const [x, y] = centre(f, e.target); text(x, y - 22, 'FROZEN!', '#9fe8ff', 0.85, -12); }
    else if (e.type === 'chill') { const E = ent(e.target); if (e.stacks > (E.chillShown || 0)) { const [x, y] = centre(f, e.target); text(x, y - 16, 'SLOW ×' + e.stacks, '#9fe8ff', 0.6, -12); } E.chillShown = e.stacks; }
    else if (e.type === 'stun') { const [x, y] = centre(f, e.target); text(x, y - 22, 'STUNNED!', '#ffe14d', 0.85, -12); burst(x, y - 10, 8, ['#ffe14d', '#ffffff'], 35); }
    else if (e.type === 'spell') {
      const [x, y] = centre(f, e.target);
      if (e.kind === 'toad') { text(x, y - 22, 'TOAD!', '#5ac85a', 1, -12); burst(x, y, 20, ['#5ac85a', '#a8e88a', '#ffffff'], 45); }
      else if (e.kind === 'shrink') { text(x, y - 22, 'SHRUNK!', '#c77dff', 0.9, -12); burst(x, y, 12, ['#c77dff', '#ffffff'], 30); }
      else text(x, y - 22, 'CHAIN BOLT', '#29e7ff', 0.8, -12);
    }
    else if (e.type === 'stance') { const [x, y] = centre(f, e.target); text(x, y - 20, 'DODGE STANCE', '#c77dff', 0.8, -12); }
    else if (e.type === 'enrage') { const [x, y] = centre(f, e.target); text(x, y - 20, 'ENRAGED!', '#ff3b5c', 0.9, -12); }
  }

  // Show a new fight (or a preview of one that hasn't started).
  v.setFight = f => {
    v.fight = f; v.ents = []; v.shots.length = 0; v.particles.length = 0; v.texts.length = 0; v.banners.length = 0; v.allies = []; v.cardFlash = []; v.zaps = []; v.slashes = []; v.rings = [];
    v.tele = null; v.ink = 0; v.dim = 0; v.foeShots = []; v.intro = false;
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
    } else if (look.horizon === 'jungle') {
      for (let x = 0; x < bw; x++) P.rect(x, GROUND - v.ridge[x] - 6, 1, v.ridge[x] + 6, look.canopy);
      for (let k = 0; k < bw / 9; k++) { const tx = (k * 41) % bw; P.disc(tx, GROUND - 16 - (k * 7) % 10, 7 + k % 4, look.canopy); P.disc(tx + 2, GROUND - 19 - (k * 7) % 10, 3, look.leaf); }
      for (let k = 0; k < bw / 22; k++) { const vx = (k * 53 + 11) % bw, len = 18 + (k * 13) % 30, sw = Math.round(Math.sin(v.clock * 1.5 + k) * 2);
        for (let yy = 0; yy < len; yy++) P.rect(vx + Math.round(sw * yy / len), yy, 1, 1, look.leaf);
        P.ell(vx + sw, len, 2, 1, look.leaf); }
    } else for (let x = 0; x < bw; x++) P.rect(x, GROUND - v.ridge[x], 1, v.ridge[x], look.ridge);
    P.rect(0, GROUND, bw, BUF_H - GROUND, look.floor);
    const vx = bw / 2, scroll = (v.clock * 0.5) % 1;
    for (let k = 0; k < 7; k++) { const y = GROUND + Math.round(Math.pow((k + scroll) / 6, 2) * (BUF_H - GROUND)); P.rect(0, y, bw, 1, look.grid); }
    for (let i = -14; i <= 14; i++) P.line(vx + i * 4, GROUND, vx + i * 34, BUF_H + 4, look.grid);
    P.rect(0, GROUND, bw, 1, look.line);
  }

  // Boss arenas: Polpo plays under spotlights with notes drifting up (red and strobing once it goes
  // FORTISSIMO); Tucano's canopy hangs over the arena and leaves fall, faster in each phase.
  function bossArena(b) {
    const bw = v.bw;
    if (b.def.art === 'octopus') {
      const fury = b.phase > 0, on = !fury || Math.floor(v.clock * 4) % 2;
      g.globalAlpha = fury ? 0.16 : 0.1; g.fillStyle = fury ? '#ff3b5c' : '#fff8c0';
      if (on) for (const [sx, tx] of [[bw * 0.15, bw * 0.62], [bw * 0.95, bw * 0.75]]) { g.beginPath(); g.moveTo(sx - 3, 0); g.lineTo(sx + 3, 0); g.lineTo(tx + 22, GROUND); g.lineTo(tx - 22, GROUND); g.closePath(); g.fill(); }
      g.globalAlpha = 1;
      for (let k = 0; k < 6; k++) {
        const x = (k * 53 + 20) % bw, y = GROUND - 20 - ((v.clock * 8 + k * 17) % 70);
        P.rect(x, y - 3, 1, 4, fury ? '#ff8aa0' : '#c8b8ff'); P.rect(x - 1, y, 2, 1, fury ? '#ff8aa0' : '#c8b8ff');
      }
    } else if (b.def.art === 'tucano') {
      for (let x = 0; x < bw; x++) P.rect(x, 0, 1, 5 + Math.round(3 * Math.sin(x * 0.3) + 2 * Math.sin(x * 0.11)), '#0e2a12');
      const rate = [0.15, 0.35, 0.6][Math.min(2, b.phase)];
      if (Math.random() < rate) v.particles.push({ x: Math.random() * bw, y: 6, vx: (Math.random() - 0.5) * 10, vy: 6, life: 3, c: b.phase >= 2 ? '#ffe14d' : Math.random() < 0.5 ? '#39a83a' : '#5ac85a', float: true });
    }
  }
  // Shots take the weapon skin's colour and leave the hit effect's trail (both cosmetic).
  function drawShot(s) {
    const skin = v.cos && v.cos.weaponSkin && v.cos.weaponSkin.shot, trail = v.cos && v.cos.hitFx && v.cos.hitFx.trail;
    if (trail && Math.random() < 0.5) v.particles.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 8, vy: -4 - Math.random() * 6, life: 0.3, c: trail });
    if (skin) P.rect(s.x - 1, s.y - 1, 3, 3, skin);
    const p = s.t / s.dur, x = s.x, y = s.y;
    if (s.kind === 'flamer') {
      for (let k = 0; k < 4; k++) { const q = Math.random(); v.particles.push({ x: s.x0 + (x - s.x0) * q, y: s.y0 + (y - s.y0) * q + (Math.random() - 0.5) * 4, vx: 0, vy: -8, life: 0.15, c: k % 2 ? '#ff7a2a' : '#ffe14d', float: true }); }
      P.disc(x, y, 2, '#ffe14d');
    } else if (s.kind === 'freeze') {
      P.line(s.x0, s.y0, x, y, '#9fe8ff', 1); P.line(s.x0, s.y0 - 1, x, y - 1, '#ffffff', 1); P.rect(x - 1, y - 1, 3, 3, '#ffffff');
    } else if (s.kind === 'boomerang') {
      const an = s.t * 25, c = Math.cos(an) * 4, sn = Math.sin(an) * 4;
      P.line(x - c, y - sn, x, y, '#c8944a', 2); P.line(x, y, x + sn, y - c, '#c8944a', 2);
    }
    if (s.kind === 'uzi') { P.rect(x - 3, y, 3, 1, '#ff9a3a'); P.rect(x, y, 2, 1, '#ffe14d'); }
    else if (s.kind === 'stars') {                // a spinning four-point star
      const an = s.t * 30, c = Math.round(Math.cos(an) * 2), sn = Math.round(Math.sin(an) * 2);
      P.line(x - c, y - sn, x + c, y + sn, '#e8eef2'); P.line(x + sn, y - c, x - sn, y + c, '#e8eef2'); P.rect(x, y, 1, 1, '#2a2a34');
    } else if (s.kind === 'sniper') { P.line(s.x0, s.y0, x, y, 'rgba(255,255,255,.55)'); P.rect(x - 2, y, 3, 1, '#ffffff'); }
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
  // The hero's bar: HP in green, then the shield (armour) in cyan on the end of it. The bar's length is
  // max HP plus the shield the fight started with, so a spent shield leaves its space empty.
  function heroBar(x, y, w, h, hero) {
    const total = hero.maxHp + Math.max(hero.shieldMax || 0, hero.shieldHp), hp = Math.max(0, Math.round(w * v.heroShown / total)), sh = Math.round(w * Math.max(0, hero.shieldHp) / total);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#2a1838'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#39ff88'; ctx.fillRect(x, y, hp, h);
    if (sh > 0) { ctx.fillStyle = '#29e7ff'; ctx.fillRect(x + hp, y, Math.min(sh, w - hp), h); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + hp, y, Math.min(sh, w - hp), Math.max(1, Math.round(h / 4))); }
  }
  // The boss's bar: big, centred along the top, its name above and a mark at each phase change.
  // Returns where the rest of the HUD starts.
  function bossBar(e, E, fs, pad) {
    const w = Math.min(v.W - pad * 2, 560), x = Math.round((v.W - w) / 2), h = Math.max(12, Math.round(fs * 1.6)), y = pad + fs + 6;
    const name = e.def.name.toUpperCase() + (e.phase > 0 ? ' · PHASE ' + (e.phase + 1) : '');
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.font = fit(name, w, fs) + 'px ' + FONT;
    outlined(name, v.W / 2, pad + fs + 2, e.phase > 0 && Math.floor(v.clock * 3) % 2 ? '#ff3b5c' : '#ff2bd6');
    bar(x, y, w, h, (!e.alive ? 0 : E.hpShown == null ? e.hp : E.hpShown) / e.maxHp, '#ff2bd6', e.shield / e.maxHp);
    ctx.fillStyle = '#ffffff';
    for (const p of e.def.phases || []) ctx.fillRect(x + Math.round(w * p.at) - 1, y, 2, h);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.font = Math.max(6, Math.round(fs * 0.8)) + 'px ' + FONT;
    outlined(Math.max(0, Math.ceil(e.hp)) + '/' + Math.round(e.maxHp), x + w - 4, y + h / 2 + 1, '#ffffff');
    return y + h + Math.round(pad / 2);
  }

  // scene: { look, weapon, tier: { weapon, armour }, title }
  // scene: { look, weapon, tier, title, cos }. cos: the profile's cosmetics; an arena theme recolours the
  // zone's look but keeps its horizon.
  v.draw = (dt, scene) => {
    const f = v.fight;
    v.cos = scene && scene.cos;
    const arena = v.cos && v.cos.arena && v.cos.arena.look, look = arena ? { ...((scene && scene.look) || DEFAULT_LOOK), ...arena } : (scene && scene.look) || DEFAULT_LOOK;
    if (!v.bw) return;
    v.clock += dt;
    v.swing = Math.max(0, v.swing - dt * 5); v.heroFlash -= dt; v.flash = Math.max(0, v.flash - dt);
    v.shake = Math.max(0, v.shake - dt);
    for (const s of v.shots) {
      s.t += dt; const p = Math.min(1, s.t / s.dur);
      s.x = s.x0 + (s.tx - s.x0) * p; s.y = s.y0 + (s.ty - s.y0) * p + (s.kind === 'wand' ? Math.sin(p * Math.PI * 3) * 3 : s.kind === 'boomerang' ? -Math.sin(p * Math.PI) * 10 : 0);
      if (p < 1) continue;
      if (s.legs) {          // boomerang: land this leg's hits, then fly on (back row, then home)
        if (s.leg === 0) for (const e of s.list) land(e, s.f);
        else if (s.leg === 1) for (const e of s.back) land(e, s.f);
        s.leg++;
        const next = s.leg < s.legs.length ? s.legs[s.leg] : s.leg === s.legs.length ? [hx() + 8, GROUND - 20] : null;
        if (!next) { s.done = true; continue; }
        s.x0 = s.x; s.y0 = s.y; s.tx = next[0]; s.ty = next[1]; s.t = 0; s.dur = Math.max(0.05, Math.hypot(s.tx - s.x0, s.ty - s.y0) / SHOT_SPEED.boomerang);
        continue;
      }
      s.done = true; for (const e of s.list) land(e, s.f);
    }
    v.shots = v.shots.filter(s => !s.done);

    g.imageSmoothingEnabled = false;
    stage(look);
    const boss = f && f.enemies.find(e => e.def.boss);
    if (boss) bossArena(boss);
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
        if (!HOVER_ART.includes(d.art)) P.ell(E.x, E.y + 1, big ? 20 : 8, big ? 3 : 2, '#05010c');
        const wind = E.wind ? 1 - E.wind.left / E.wind.total : 0;
        S.clear();
        const toad = e.alive && e.toadT > 0, Sd = toad ? smallS : S;     // the wand's toad spell swaps the art for a toad
        if (toad) { Sd.clear(); ENEMY_ART.toad(Sd.P, Sd.ox, Sd.oy, { t: v.clock + i, wind: 0, atk: 0 }); Sd.stamp(g, E.x, E.y, null, 0); continue; }
        ENEMY_ART[d.art](S.P, S.ox, S.oy, { t: v.clock + i * 0.7, wind, atk: E.atk, fury: e.phase > 0, phase: e.phase });
        let dive = 0;           // Tortellino Dive: the boss swoops through the hero and back
        if (E.diveT > 0) { E.diveT -= dt; dive = Math.round((hx() + 16 - E.x) * Math.sin(Math.PI * (1 - E.diveT / 0.6))); }
        if (d.boss && e.alive && e.phase > 0 && Math.random() < 0.5) v.particles.push({ x: E.x + (Math.random() - 0.5) * 40, y: E.y - Math.random() * height(d), vx: 0, vy: -16, life: 0.6, c: Math.random() < 0.5 ? d.color : '#ffffff', float: true });   // the new look: an aura
        const lunge = -Math.round(Math.sin(Math.PI * E.atk) * (big ? 6 : 4)), jitter = wind ? Math.round((Math.random() - 0.5) * 2) : 0;
        const red = wind && Math.floor(v.clock * 12) % 2;
        const tint = E.flash > 0 ? '#ffffff' : red ? '#ff3b5c' : e.shrinkT > 0 ? '#c77dff' : e.phase > 0 && Math.floor(v.clock * 2) % 2 ? '#ff3b5c' : null;
        const chilled = e.chillT > 0 && !tint;
        S.stamp(g, E.x + lunge + jitter + dive, E.y, chilled ? '#9fe8ff' : tint, E.flash > 0 ? 0.6 : red ? 0.45 : chilled ? 0.3 : 0.18, 0, d.boss ? BOSS_SCALE : 0);
        if (e.alive && e.burnT > 0 && Math.random() < 0.5) v.particles.push({ x: E.x + (Math.random() - 0.5) * (big ? 24 : 10), y: E.y - height(d) * Math.random(), vx: 0, vy: -30, life: 0.35, c: Math.random() < 0.5 ? '#ff7a2a' : '#ffe14d', float: true });
        if (e.alive && e.frozenT > 0) { const hh = height(d), ww = big ? 26 : 11; P.ring(E.x, E.y - hh / 2, ww, hh / 2 + 2, '#bff8ff', 1); P.rect(E.x - ww, E.y - hh - 1, 2 * ww, 1, '#ffffff'); }
        if (e.alive && e.shield > 0) P.ring(E.x, E.y - height(d) / 2, (big ? 32 : 13) + Math.round(Math.sin(v.clock * 4)), height(d) * (big ? 0.42 : 0.55), Math.floor(v.clock * 6) % 2 ? '#29e7ff' : '#9ff4ff', 1);
        if (e.alive && d.ench && d.ench.length) for (let k = 0; k < d.ench.length; k++) { const an = v.clock * 2 + k * Math.PI; P.rect(E.x + Math.cos(an) * (big ? 26 : 12), E.y - height(d) * 0.6 + Math.sin(an) * 6, 2, 2, '#c77dff'); }
        if (e.alive && e.dodgeT > 0 && Math.floor(v.clock * 10) % 2) P.ring(E.x, E.y - height(d) / 2, big ? 26 : 11, height(d) / 2, '#c77dff', 1);
        // stunned: stars circle its head; chilled: a frost crystal for each stack of slow
        if (e.alive && e.stunT > 0) for (let k = 0; k < 3; k++) { const an = v.clock * 6 + k * 2.1; P.rect(E.x + Math.cos(an) * (big ? 14 : 7), E.y - height(d) - 3 + Math.sin(an) * 2, 2, 2, k ? '#ffe14d' : '#ffffff'); }
        if (e.alive && e.chillT > 0) for (let k = 0; k < (e.chillN || 1); k++) { const cx = E.x - 4 + k * 4, cy = E.y - height(d) - 8; P.rect(cx, cy - 1, 1, 3, '#bff8ff'); P.rect(cx - 1, cy, 3, 1, '#bff8ff'); }
      }
      const t = f.target;
      if (t >= 0 && f.enemies[t] && f.enemies[t].alive && !f.done) {
        const E = ent(t); P.tri(E.x, E.y - height(f.enemies[t].def) - 10 + Math.round(Math.sin(v.clock * 8)), 5, 3, '#ffe14d', 1);
        const wid = f.hero.weapon.id, [cx, cy] = centre(f, t);
        // the sniper's laser sight brightens as the next shot comes up
        if (wid === 'sniper' && f.running && f.atkCd < 1.5) {
          const m = MUZZLE.sniper, on = Math.floor(v.clock * (f.atkCd < 0.4 ? 20 : 8)) % 2;
          if (on) P.line(hx() + m[0], GROUND + m[1], cx, cy, '#ff3b5c');
          P.rect(cx - 1, cy - 1, 3, 3, '#ff3b5c');
        }
        // the sword's focus: brackets that close in on its enemy as the focus builds
        if (wid === 'sword' && f.focus && f.focus.target === t && f.focus.n > 0) {
          const h2 = height(f.enemies[t].def) / 2 + 6 - f.focus.n * 1.5, w2 = (f.enemies[t].def.size === 'big' ? 24 : 12) - f.focus.n, c = f.focus.n >= 4 ? '#ff3b5c' : '#ffb020';
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const bx = cx + sx * w2, by = cy + sy * h2; P.rect(bx - (sx > 0 ? 3 : 0), by, 4, 1, c); P.rect(bx, by - (sy > 0 ? 3 : 0), 1, 4, c); }
        }
      }
    }

    // hero: lunges with melee weapons, falls over when knocked out
    // allies: the summons from cards, drawn with the minion art, mirrored to face right
    if (f && f.allies) for (const a of f.allies) {
      const A = ally(a.k), p = allyPos(a.k);
      if (A.deadAt != null && v.clock - A.deadAt > 0.5) continue;
      if (A.deadAt != null && Math.floor((v.clock - A.deadAt) * 16) % 2) continue;
      A.x += (p.x - A.x) * Math.min(1, dt * 5); A.y = p.y; A.atk = Math.max(0, A.atk - dt * 4); A.flash -= dt;
      allyS.clear();
      allyS.g.save(); allyS.g.translate(allyS.ox * 2, 0); allyS.g.scale(-1, 1);
      ENEMY_ART[a.u.art](allyS.P, allyS.ox, allyS.oy, { t: v.clock + a.k, wind: 0, atk: A.atk, fury: false });
      allyS.g.restore();
      const lunge = Math.round(Math.sin(Math.PI * A.atk) * 3);
      allyS.stamp(g, A.x + lunge, A.y, A.flash > 0 ? '#ffffff' : '#29e7ff', A.flash > 0 ? 0.6 : 0.15);
    }
    for (const z of v.zaps || []) {
      z.life -= dt;
      const n = 6;
      for (let k = 0; k < n; k++) {
        const x0 = z.x0 + (z.x1 - z.x0) * k / n, y0 = z.y0 + (z.y1 - z.y0) * k / n + (k ? (Math.random() - 0.5) * 6 : 0);
        const x1 = z.x0 + (z.x1 - z.x0) * (k + 1) / n, y1 = z.y0 + (z.y1 - z.y0) * (k + 1) / n + (k + 1 < n ? (Math.random() - 0.5) * 6 : 0);
        P.line(x0, y0, x1, y1, z.c);
      }
    }
    if (v.zaps) v.zaps = v.zaps.filter(z => z.life > 0);

    heroS.clear();
    const dead = f && f.done && !f.won, weapon = (scene && scene.weapon) || (f && f.hero.weapon.id) || 'sword', melee = !MUZZLE[weapon];
    const tier = (scene && scene.tier) || { weapon: 0, armour: 0 };
    const ch = v.cos && v.cos.character && v.cos.character.art;
    if (ch) {             // a playable character (cosmetic): the cast's art facing the enemies, holding the weapon
      heroS.g.save(); heroS.g.translate(heroS.ox * 2, 0); heroS.g.scale(-1, 1);
      ENEMY_ART[ch](heroS.P, heroS.ox, heroS.oy, { t: dead ? 0 : v.clock, wind: 0, atk: v.swing, fury: false });
      heroS.g.restore();
      HERO_WEAPONS[weapon](heroS.P, heroS.ox, heroS.oy, v.swing, tier.weapon, (v.cos.weaponSkin && v.cos.weaponSkin.tint) || WEAPON_COLORS[Math.min(tier.weapon, 7)], v.alt);
    } else drawHero(heroS.P, heroS.ox, heroS.oy, dead ? 0 : v.clock, v.swing, tier.weapon, tier.armour, weapon, v.alt, v.cos);
    heroS.stamp(g, H + (melee ? Math.round(Math.sin(Math.PI * v.swing) * (weapon === 'gloves' ? 4 : 8)) : 0) - (dead ? 14 : 0), GROUND - (dead ? 2 : 0), v.heroFlash > 0 ? '#ff3b5c' : null, 0.6, dead ? -Math.PI / 2 : 0);
    if (f && f.hero.shieldHp > 0) P.ring(H, GROUND - 14, 12, 16, '#29e7ff', 1);

    for (const s of v.shots) drawShot(s);
    // a boss's signature telegraph: a ring that closes on the hero (and the dive's path along the sand)
    if (v.tele && f && f.enemies[v.tele.src] && f.enemies[v.tele.src].alive) {
      const T = v.tele, p = Math.max(0, T.left / T.total), blink = Math.floor(v.clock * (p < 0.35 ? 16 : 6)) % 2;
      if (!(f.pause > 0)) T.left -= dt;
      const r = 5 + Math.round(18 * p);
      if (blink) P.ring(H, GROUND - 12, r, Math.round(r * 0.8), '#ff3b5c', 1);
      P.ring(H, GROUND - 12, 4, 3, '#ff3b5c', 1);
      if (T.move === 'dive' && blink) { const bx = ent(T.src).x; for (let x = H + 8; x < bx; x += 6) P.rect(x, GROUND + 2, 3, 1, '#ff3b5c'); }
      if (T.left <= 0) v.tele = null;
    } else v.tele = null;
    for (const s of v.foeShots) {           // boss volleys: piano notes from Polpo, seeds from Tucano
      s.t += dt; const p = Math.min(1, s.t / s.dur), x = s.x0 + (s.x1 - s.x0) * p, y = s.y0 + (s.y1 - s.y0) * p - Math.sin(Math.PI * p) * 8;
      if (s.kind === 'octopus') { P.rect(x, y - 4, 1, 5, '#ffe14d'); P.disc(x - 1, y + 1, 1, '#ffe14d'); P.rect(x + 1, y - 4, 2, 1, '#ffe14d'); }
      else { P.ell(x, y, 2, 1, '#f0c870'); P.rect(x - 1, y, 1, 1, '#8b5a2b'); }
    }
    v.foeShots = v.foeShots.filter(s => s.t < s.dur);
    for (const s of v.slashes) {             // the sword's arc: a crescent across the target, bigger with focus
      s.life -= dt; const r = 8 + s.big * 2, d = s.flip ? 1 : -1;
      for (let k = -r; k <= r; k++) { const yy = s.y + k, xx = s.x + d * Math.round(r * 0.5 - (k * k) / (r * 2)); P.rect(xx, yy, 2, 1, k % 3 ? '#ffffff' : '#c8ccd4'); }
    }
    v.slashes = v.slashes.filter(s => s.life > 0);
    for (const r of v.rings) { r.life -= dt; r.r += (r.max - r.r) * Math.min(1, dt * 18); P.ring(r.x, r.y, r.r, r.r * 0.7, r.c, 1); }
    v.rings = v.rings.filter(r => r.life > 0);
    for (const p of v.particles) {
      p.vy += (p.float ? 0 : 200) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
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
    if (v.dim > 0) {          // a boss's phase moment: the arena goes dark except for a spotlight on the boss
      v.dim -= dt; const b = f && f.enemies.find(e => e.def.boss), i = b ? f.enemies.indexOf(b) : -1;
      const [bx, by] = i >= 0 ? centre(f, i) : [v.bw * 0.7, GROUND - 40], k = v.W / v.bw, a = Math.min(0.6, v.dim * 0.6);
      const grd = ctx.createRadialGradient(bx * k, by * v.scale, 10, bx * k, by * v.scale, v.H * 0.6);
      grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, 'rgba(0,0,0,' + a + ')'); grd.addColorStop(1, 'rgba(0,0,0,' + Math.min(0.8, a * 1.4) + ')');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, v.W, v.H);
    }
    if (v.ink > 0) {          // Ink Cloud: splats over the screen while the hero can't see straight
      v.ink -= dt; ctx.globalAlpha = Math.min(0.6, v.ink * 0.4); ctx.fillStyle = '#0d0612';
      for (const b of v.inkBlots) { ctx.beginPath(); ctx.arc(b.x * v.W, b.y * v.H, b.r * v.W, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(b.x * v.W + b.r * v.W * 0.8, b.y * v.H + b.r * v.W * 0.5, b.r * v.W * 0.45, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    const k = v.W / v.bw, s = v.scale;

    // ally HP bars
    if (f && f.allies) for (const a of f.allies) {
      const A = ally(a.k);
      if (!a.alive) continue;
      const w = 12 * k, bh = Math.max(3, Math.round(s * 1.2));
      bar(A.x * k - w / 2, (A.y - 30) * s, w, bh, a.hp / a.maxHp, '#29e7ff', 0);
    }
    // per-enemy HP bars (shield above in cyan) and wind-up timers (red, below)
    const bossAt = f ? f.enemies.findIndex(e => e.def.boss) : -1;
    if (f) for (const i of drawn) {
      const e = f.enemies[i], E = ent(i);
      if (!e.alive && E.deadAt != null) continue;
      E.hpShown = E.hpShown == null ? e.hp : E.hpShown + (e.hp - E.hpShown) * Math.min(1, dt * 10);
      const w = (e.def.size === 'big' ? 40 : 18) * k, x = E.x * k - w / 2, y = (E.y - height(e.def) - 5) * s, bh = Math.max(4, Math.round(s * 1.6));
      if (i !== bossAt) bar(x, y, w, bh, E.hpShown / e.maxHp, e.def.elite ? '#ffb020' : '#ff3b5c', e.shield / e.maxHp);   // the boss has the big bar
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

    // HUD: the boss bar across the top, then hero HP top left, encounter and timer top right, phase
    // banners in the middle
    const fs = Math.max(7, Math.round(s * 3.6)), pad = Math.max(10, Math.round(s * 4)), bh = Math.max(10, Math.round(s * 4));
    ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    let top = pad;          // where the hero's row starts: under the boss bar when there is one
    if (bossAt >= 0) top = bossBar(f.enemies[bossAt], ent(bossAt), fs, pad);
    if (f) {
      v.heroShown += (f.hero.hp - v.heroShown) * Math.min(1, dt * 10);
      const w = Math.min(v.W * 0.4, 260);
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.font = fs + 'px ' + FONT;
      const label = 'HERO ' + Math.ceil(f.hero.hp) + '/' + Math.round(f.hero.maxHp);
      outlined(label, pad, top + fs + 2, '#ffffff');
      if (f.hero.shieldHp >= 1) outlined(' +' + Math.ceil(f.hero.shieldHp), pad + ctx.measureText(label).width, top + fs + 2, '#29e7ff');
      heroBar(pad, top + fs + 6, w, bh, f.hero);
      const title = (scene && scene.title) || '';
      ctx.textAlign = 'right'; ctx.font = fit(title, v.W * 0.45, fs) + 'px ' + FONT;
      outlined(title, v.W - pad, top + fs + 2, '#ffe14d');
      ctx.font = fs + 'px ' + FONT;
      const late = f.t > SUDDEN_DEATH;
      if (f.t > 0) outlined(late ? 'SUDDEN DEATH' : 'TIME ' + f.t.toFixed(1), v.W - pad, top + fs * 2 + 10, late ? (Math.floor(v.clock * 4) % 2 ? '#ff3b5c' : '#ffffff') : '#29e7ff');
    }
    // card trigger flashes: a stack of card names under the hero's HP bar
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    v.cardFlash.forEach((c, n) => {
      c.life -= dt;
      ctx.globalAlpha = Math.max(0, Math.min(1, c.life * 2));
      ctx.font = Math.max(6, Math.round(fs * 0.75)) + 'px ' + FONT; ctx.lineWidth = 3;
      outlined('▶ ' + c.str, pad, top + fs * 2 + 18 + bh + n * (fs + 4), c.color);
    });
    v.cardFlash = v.cardFlash.filter(c => c.life > 0);
    ctx.globalAlpha = 1;
    for (const b of v.banners) {
      b.life -= dt;
      ctx.globalAlpha = Math.max(0, Math.min(1, b.life * 2)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = fit(b.str, v.W - pad * 2, Math.round(fs * 2.2)) + 'px ' + FONT; ctx.lineWidth = 5;
      outlined(b.str, v.W / 2, v.H * 0.42, b.color || '#ff3b5c');
      if (b.sub) { ctx.font = Math.round(fs * 1.1) + 'px ' + FONT; ctx.lineWidth = 4; outlined(b.sub, v.W / 2, v.H * 0.42 - fs * 2.6, '#ffe14d'); }
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
