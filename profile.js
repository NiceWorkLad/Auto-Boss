// The lifetime profile and the cosmetics it buys. Pure data and logic, no DOM: ui.js keeps the profile
// in its own browser-storage key, apart from the run save, so a change to the run save never touches it.
//
// The profile records every run: runs, clears, deepest row, kills per enemy, elites and bosses beaten,
// deaths by cause, lifetime gold, and how often each weapon, class and card was used. Lifetime gold only
// goes up. The bank receives ECON.bankShare of everything a run earned (spent or not) when the run ends,
// and buys cosmetics. Cosmetics are only ever visual.

const PROFILE_VERSION = 2;
// Ids that were renamed, so a profile's tallies follow them (v2: the original cast replaced the old one).
const RENAMED = {
  bombardiro: 'pelican', lirili: 'tortoise', tralalero: 'octopus',
  cappuccino: 'espressoShot', tungTempo: 'tamburello', ballerina: 'flamingoFootwork', tralalaContract: 'pianissimoContract',
  manifesto: 'pelicanManifesto', capoeira: 'espressoCapoeira', miniCappuccino: 'chiccoSprintino', tralalerino: 'polpettino',
};
const DEATH_RENAMES = [['Tralalero Tralala', 'Polpo Pianissimo'], ['Bombardiro Crocodilo', 'Pellicano Cannolino'], ['Lirilì Larilà', 'Tartaruga Lasagnona'], ['Gabbiano Bombardino', 'Gabbiano Granatino']];

// Cosmetics by category. cost is in bank gold; the first item of each category is free and owned.
// outfit: hero colours. weaponSkin: the weapon's accent and its shots. hitFx: sparks on every hit and
// the trail behind shots. arena: stage colours over the zone's own (the zone keeps its horizon).
// mapStyle: the map's colours. banner: the words after a fight.
const COSMETICS = {
  // playable characters: the cast's art, facing the enemy, holding your weapon (art: ENEMY_ART key)
  character: { name: 'Characters', items: {
    hero: { name: 'The Hero', cost: 0 },
    coconut: { name: 'Cocco Ruzzolone', cost: 300, art: 'coconut', colors: ['#8b5a2b', '#1a1222', '#f4e8d0'] },
    crab: { name: 'Granchio Cementino', cost: 350, art: 'crab', colors: ['#e85a5a', '#9aa3ad', '#f4e8d0'] },
    frog: { name: 'Rana Rigatona', cost: 400, art: 'rana', colors: ['#5ac85a', '#f0c870', '#a8e88a'] },
    monkey: { name: 'Scimmietta Spumoni', cost: 450, art: 'scimmia', colors: ['#8a5a3a', '#ff8fc8', '#9fe8a8'] },
  } },
  // hair under (and out of) the helmet; characters ignore it
  hair: { name: 'Hair', items: {
    none: { name: 'Helmet Only', cost: 0 },
    mohawk: { name: 'Pink Mohawk', cost: 60, style: 'mohawk', color: '#ff2bd6' },
    ponytail: { name: 'Brown Ponytail', cost: 60, style: 'ponytail', color: '#8a5a34' },
    spiky: { name: 'Blond Spikes', cost: 80, style: 'spiky', color: '#ffe14d' },
    afro: { name: 'Big Afro', cost: 100, style: 'afro', color: '#2a1a12' },
    long: { name: 'Long Red Hair', cost: 100, style: 'long', color: '#e0402a' },
  } },
  outfit: { name: 'Hero outfits', items: {
    classic: { name: 'Arcade Classic', cost: 0, cape: '#d0306a', pants: '#2a2140', boots: '#4a3a2a' },
    lifeguard: { name: 'Lifeguard', cost: 120, cape: '#ff3b5c', pants: '#ffe14d', boots: '#ff3b5c', armour: '#ff3b5c' },
    synth: { name: 'Synthwave Jacket', cost: 180, cape: '#29e7ff', pants: '#1a0b2e', boots: '#ff2bd6', armour: '#ff2bd6' },
    tux: { name: 'Beach Tuxedo', cost: 250, cape: '#120818', pants: '#120818', boots: '#e8e8f0', armour: '#f4f4f4' },
    gold: { name: 'Gold Plated', cost: 400, cape: '#ffb020', pants: '#8a6a10', boots: '#ffe14d', armour: '#ffe14d' },
  } },
  weaponSkin: { name: 'Weapon skins', items: {
    classic: { name: 'Factory Finish', cost: 0 },
    neon: { name: 'Neon Tube', cost: 150, tint: '#29e7ff', shot: '#29e7ff' },
    candy: { name: 'Candy Stripe', cost: 150, tint: '#ff8fc8', shot: '#ff8fc8' },
    toxic: { name: 'Toxic Glow', cost: 200, tint: '#39ff88', shot: '#39ff88' },
    royal: { name: 'Royal Gold', cost: 350, tint: '#ffe14d', shot: '#ffe14d' },
  } },
  hitFx: { name: 'Hit effects & trails', items: {
    classic: { name: 'None', cost: 0 },
    confetti: { name: 'Confetti', cost: 120, colors: ['#ff2bd6', '#29e7ff', '#ffe14d', '#39ff88'], trail: '#ffe14d' },
    foam: { name: 'Sea Foam', cost: 120, colors: ['#9fe8ff', '#ffffff', '#29a8ff'], trail: '#9fe8ff' },
    embers: { name: 'Embers', cost: 160, colors: ['#ff7a2a', '#ffe14d', '#ff3b5c'], trail: '#ff7a2a' },
    glitter: { name: 'Glitter', cost: 220, colors: ['#ffffff', '#fff8c0', '#c77dff'], trail: '#ffffff' },
  } },
  arena: { name: 'Arena themes', items: {
    zone: { name: 'Zone Default', cost: 0 },
    midnight: { name: 'Midnight Run', cost: 200, look: { sky: ['#02010a', '#05031a', '#0a0628', '#120a3a', '#1c0f4a', '#2a145a'], sun: ['#e8f0ff', '#7a8aff'], floor: '#05030f', grid: '#2a3a8a', line: '#7a8aff' } },
    vapor: { name: 'Vaporwave', cost: 250, look: { sky: ['#2a0b4a', '#4a1070', '#7a1a8a', '#b03a9a', '#e86aa8', '#ffb0c8'], sun: ['#fff1a8', '#ff2bd6'], floor: '#1a0b2e', grid: '#29e7ff', line: '#ff2bd6' } },
    crt: { name: 'Green Screen', cost: 250, look: { sky: ['#000800', '#001400', '#002000', '#002c00', '#003800', '#004400'], sun: ['#b0ffb0', '#39ff88'], floor: '#000a00', grid: '#1a8a3a', line: '#39ff88', sea: '#003a10', foam: '#7aff9a' } },
    gold: { name: 'Golden Hour', cost: 300, look: { sky: ['#3a1a08', '#6a2a10', '#a8441a', '#d8702a', '#f0a040', '#ffd27a'], sun: ['#ffffff', '#ffb020'], floor: '#2a1408', grid: '#c47a2a', line: '#ffe14d' } },
    sorbet: { name: 'Sorbet Sunset', cost: 220, look: { sky: ['#3a2a5a', '#6a4a8a', '#a86aa8', '#e890b0', '#ffc0b8', '#fff0c0'], sun: ['#ffffff', '#9fe8c8'], floor: '#2a1a3a', grid: '#9fe8c8', line: '#ffc0d8' } },
    deepsea: { name: 'Deep Sea', cost: 260, look: { sky: ['#000814', '#001428', '#00203c', '#002c50', '#003a64', '#004a78'], sun: ['#9fe8ff', '#29a8ff'], floor: '#000a14', grid: '#1a5a8a', line: '#29e7ff', sea: '#00203c', foam: '#29a8ff' } },
    junglenight: { name: 'Neon Jungle', cost: 280, look: { sky: ['#020a04', '#04140a', '#082010', '#0c2c16', '#12381c', '#1a4a24'], sun: ['#39ff88', '#ff2bd6'], floor: '#020a04', grid: '#ff2bd6', line: '#39ff88' } },
  } },
  // page themes recolour the whole interface (the CSS variables; ui.js applyTheme)
  uiTheme: { name: 'Page themes', items: {
    arcade: { name: 'Arcade Night', cost: 0, vars: {} },
    gameboy: { name: 'Pocket Green', cost: 150, vars: { bg: '#0b1a0b', surface: '#132813', 'surface-2': '#1b361b', line: '#2f5a2f', text: '#d8f0b8', muted: '#8ab070', pink: '#9bd84a', cyan: '#c8f070', gold: '#e8f8a0', purple: '#9bd84a' } },
    amber: { name: 'Amber Terminal', cost: 150, vars: { bg: '#0f0800', surface: '#1c1000', 'surface-2': '#281800', line: '#5a3a00', text: '#ffd08a', muted: '#b08040', pink: '#ff9a2a', cyan: '#ffc04a', gold: '#ffe08a', purple: '#ff9a2a' } },
    pastel: { name: 'Pastel Pier', cost: 200, vars: { bg: '#1e1a2e', surface: '#2a2440', 'surface-2': '#352e50', line: '#5a4e7a', text: '#fff0f8', muted: '#c8b8e0', pink: '#ffa8d8', cyan: '#a8e8ff', gold: '#fff0a8', purple: '#d8b8ff' } },
    ocean: { name: 'Ocean Floor', cost: 200, vars: { bg: '#020c18', surface: '#061828', 'surface-2': '#0a2238', line: '#14406a', text: '#e0f4ff', muted: '#7aa8c8', pink: '#ff7a9a', cyan: '#29e7ff', gold: '#ffe14d', purple: '#8ab8ff' } },
  } },
  mapStyle: { name: 'Map styles', items: {
    classic: { name: 'Arcade', cost: 0 },
    blueprint: { name: 'Blueprint', cost: 100 },
    treasure: { name: 'Treasure Map', cost: 150 },
    neon: { name: 'Neon Sign', cost: 150 },
  } },
  banner: { name: 'Victory banners', items: {
    classic: { name: 'Classic', cost: 0, win: 'VICTORY!', loss: 'K.O.' },
    flawless: { name: 'Flawless', cost: 80, win: 'FLAWLESS!', loss: 'OOF.' },
    bellissimo: { name: 'Bellissimo', cost: 120, win: 'BELLISSIMO!', loss: 'MAMMA MIA...' },
    gg: { name: 'Good Game', cost: 80, win: 'GG EZ', loss: 'GG' },
    jackpot: { name: 'Jackpot', cost: 150, win: 'JACKPOT!', loss: 'INSERT COIN' },
  } },
};
for (const cat in COSMETICS) for (const id in COSMETICS[cat].items) COSMETICS[cat].items[id].id = id;
const firstCosmetic = cat => Object.keys(COSMETICS[cat].items)[0];

function newProfile() {
  const owned = {}, equipped = {};
  for (const cat in COSMETICS) { owned[cat] = [firstCosmetic(cat)]; equipped[cat] = firstCosmetic(cat); }
  return { v: PROFILE_VERSION, runs: 0, clears: 0, abandoned: 0, deepest: 0, fights: 0, fightsWon: 0,
    kills: {}, elites: {}, bosses: {}, deaths: {}, weapons: {}, classes: {}, cards: {}, acts: {},
    overtimeRuns: 0, overtimeBest: 0, lifetimeGold: 0, bank: 0, bankedTotal: 0, spentCosmetics: 0, owned, equipped };
}

// Bring any stored profile up to the current shape, keeping everything it already has. Older versions
// migrate here; nothing a player earned is ever dropped.
function migrateProfile(p) {
  const fresh = newProfile();
  if (!p || typeof p !== 'object') return fresh;
  const out = { ...fresh, ...p, v: PROFILE_VERSION };
  for (const k of ['kills', 'elites', 'bosses', 'deaths', 'weapons', 'classes', 'cards', 'acts']) {
    out[k] = {};
    for (const [id, n] of Object.entries(p[k] || {})) {
      let key = RENAMED[id] || id;
      if (k === 'deaths') for (const [a, b] of DEATH_RENAMES) key = key.replace(a, b);
      out[k][key] = (out[k][key] || 0) + n;
    }
  }
  out.owned = {}; out.equipped = {};
  for (const cat in COSMETICS) {
    const have = ((p.owned || {})[cat] || []).filter(id => COSMETICS[cat].items[id]);
    out.owned[cat] = have.includes(firstCosmetic(cat)) ? have : [firstCosmetic(cat)].concat(have);
    const eq = (p.equipped || {})[cat];
    out.equipped[cat] = out.owned[cat].includes(eq) ? eq : firstCosmetic(cat);
  }
  return out;
}

const bump = (o, k, n) => { o[k] = (o[k] || 0) + (n == null ? 1 : n); };

// One finished fight. weapon: the held weapon's base; node: the map node it was fought on.
function recordFight(p, run, f, node) {
  p.fights++;
  if (f.won) p.fightsWon++;
  bump(p.weapons, f.hero.weapon.id);
  for (const id of run.cards) bump(p.cards, id);
  for (const e of f.enemies) if (!e.alive) bump(p.kills, e.def.id);
  if (f.won && node && node.type === 'elite') for (const e of f.enemies) if (e.def.elite) bump(p.elites, e.def.id);
  if (f.won && node && node.type === 'boss') for (const e of f.enemies) if (e.def.boss) bump(p.bosses, e.def.id);
  p.deepest = Math.max(p.deepest, progressOf(run));
}
// How far a run got: rows across every act (act 2 row 1 is 12).
const progressOf = run => (run.act != null ? run.act : run.zone || 0) * MAP_ROWS + run.row + 1;
// Rows played in Overtime (0 if the run never got there).
const overtimeOf = run => Math.max(0, progressOf(run) - ZONES.length * MAP_ROWS);

// Unlockable classes (CLASSES[id].unlock): how far the profile is towards one, and whether it's done.
function classProgress(p, c) {
  const u = c.unlock;
  if (!u) return null;
  const have = u.kind === 'kills' ? Object.values(p.kills).reduce((a, b) => a + b, 0) : u.kind === 'boss' ? (p.bosses[u.id] || 0) : p.clears;
  return { have: Math.min(have, u.n || 1), need: u.n || 1 };
}
const classUnlocked = (p, c) => { const g = classProgress(p, c); return !g || g.have >= g.need; };
// A run is over (won, lost or abandoned for a new one): count it and pay the bank, once per run.
// Returns what went into the bank.
function recordRunEnd(p, run, abandoned) {
  if (run.banked) return 0;
  run.banked = true;
  p.runs++;
  if (abandoned) p.abandoned++;
  if (run.victory || (run.over && run.over.won)) p.clears++;          // a run that went into Overtime still won
  if (run.over && !run.over.won) bump(p.deaths, run.over.cause || 'knocked out');
  if (run.victory && run.act >= ZONES.length) { p.overtimeRuns++; p.overtimeBest = Math.max(p.overtimeBest, overtimeOf(run)); }
  if (run.cls) bump(p.classes, run.cls);
  for (const z of run.acts || []) bump(p.acts, z);
  p.deepest = Math.max(p.deepest, progressOf(run));
  const C = run.cls && CLASSES[run.cls], earned = Math.max(0, run.earned || 0), deposit = Math.floor(earned * ECON.bankShare * (1 + ((C && C.bankBonus) || 0)));   // Deprived pays the bank more
  p.lifetimeGold += earned;
  p.bank += deposit; p.bankedTotal += deposit;
  return deposit;
}

// Cosmetics: buy with bank gold (owned for good), equip anything owned.
function buyCosmetic(p, cat, id) {
  const it = COSMETICS[cat] && COSMETICS[cat].items[id];
  if (!it || p.owned[cat].includes(id) || p.bank < it.cost) return false;
  p.bank -= it.cost; p.spentCosmetics += it.cost;
  p.owned[cat].push(id);
  p.equipped[cat] = id;
  return true;
}
function equipCosmetic(p, cat, id) {
  if (!COSMETICS[cat] || !p.owned[cat].includes(id)) return false;
  p.equipped[cat] = id;
  return true;
}
// What the renderer and the result banner need: the equipped item of every category.
function cosmeticsOf(p) {
  const out = {};
  for (const cat in COSMETICS) out[cat] = COSMETICS[cat].items[(p && p.equipped[cat]) || firstCosmetic(cat)];
  return out;
}

// Top entries of a tally, most first.
const topOf = (tally, n) => Object.entries(tally || {}).sort((a, b) => b[1] - a[1]).slice(0, n || 3);

// Save codes: the whole profile as text, to move it between browsers. "AB1." + base64 JSON + "." +
// a checksum, so a mistyped or truncated code is refused instead of loaded.
function checksum(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return (h >>> 0).toString(36); }
const toB64 = s => typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64');
const fromB64 = s => typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8');
function exportCode(p) { const json = JSON.stringify(p), body = toB64(json); return 'AB1.' + body + '.' + checksum(body); }
// The profile in a code, or null if the code isn't a valid one.
function importCode(code) {
  const m = /^AB1\.([A-Za-z0-9+/=]+)\.([a-z0-9]+)$/.exec(String(code || '').replace(/\s+/g, ''));
  if (!m || checksum(m[1]) !== m[2]) return null;
  try { const p = JSON.parse(fromB64(m[1])); return p && typeof p === 'object' && p.v ? migrateProfile(p) : null; } catch (e) { return null; }
}

if (typeof module !== 'undefined') module.exports = { classProgress, classUnlocked, PROFILE_VERSION, COSMETICS, newProfile, migrateProfile, recordFight, recordRunEnd, buyCosmetic, equipCosmetic, cosmeticsOf, topOf, exportCode, importCode };
