// Zones as data: enemies (stats, traits, weaknesses, move sets, phases, intro lines), the minion
// groups a zone throws at you, and how the stage looks. A new zone should be mostly a new entry
// here plus its art in sprites.js. Shared with balance.js.

// Every enemy. art is a key of ENEMY_ART in sprites.js; size 'big' stands at the back.
// Moves: slam (telegraphed heavy hit), volley (several quick hits), summon, shield, heal,
// dodge (stance), enrage. A move with windup can be interrupted by the Boxing Gloves.
const ENEMIES = {
  // ---- Zone 1: Brainrot Beach ----
  crab: {
    name: 'Granchio Cementino', art: 'crab', size: 'small', color: '#ff7a4a',
    hp: 55, atk: 4, interval: 1.4, traits: { armour: 4 }, weak: { blunt: 1.5, explosive: 1.5 }, resist: { slash: 0.6 },
    intro: 'A crab that walked through wet concrete and decided that was its personality now.',
  },
  seagull: {
    name: 'Gabbiano Bombardino', art: 'seagull', size: 'small', color: '#e8eef2',
    hp: 26, atk: 3, interval: 1.0, traits: { flying: true, evasive: 0.4 }, weak: { pierce: 1.5 }, resist: {},
    intro: 'Seagulls. Armed. They want your chips and they have a plan.',
  },
  jelly: {
    name: 'Medusa Elettrica', art: 'jelly', size: 'small', color: '#ff8fc8',
    hp: 30, atk: 3.5, interval: 1.6, traits: { shield: 1 }, weak: { sonic: 1.5 }, resist: { pierce: 0.5 },
    moves: [{ kind: 'shield', every: 9, amount: 0.6 }],
    intro: 'A jellyfish humming at 240 volts. The bubble around it is very much load-bearing.',
  },
  coconut: {
    name: 'Cocco Ruzzolone', art: 'coconut', size: 'small', color: '#8b5a2b',
    hp: 40, atk: 5, interval: 1.8, traits: { regen: 0.08 }, weak: { slash: 1.3 }, resist: { blunt: 0.5 },
    intro: 'A coconut in sunglasses. It heals while you watch. It is not sorry.',
  },
  bombardiro: {
    name: 'Bombardiro Crocodilo', art: 'bombardiro', size: 'big', color: '#6a7a5a', elite: true,
    hp: 260, atk: 7, interval: 1.4, traits: { flying: true, evasive: 0.35, summoner: true }, weak: { pierce: 1.5 }, resist: { explosive: 0.5 },
    moves: [
      { kind: 'volley', every: 7, first: 3, windup: 1.0, hits: 5, power: 0.6 },
      { kind: 'dodge', every: 11, first: 6, time: 3 },
      { kind: 'summon', spawn: 'seagull', count: 2, every: 15, first: 8 },
    ],
    intro: 'Half crocodile, half bomber, fully licensed. It drops seagulls. Nobody knows how.',
  },
  lirili: {
    name: 'Lirilì Larilà', art: 'lirili', size: 'big', color: '#9a9aac', elite: true,
    hp: 380, atk: 10, interval: 2.0, traits: { armour: 7, regen: 0.012 }, weak: { magic: 1.5 }, resist: { pierce: 0.5, slash: 0.7 },
    moves: [
      { kind: 'slam', every: 8, first: 4, windup: 1.6, power: 3 },
      { kind: 'heal', every: 12, first: 9, windup: 2.0, amount: 0.15 },
      { kind: 'shield', every: 14, first: 7, amount: 0.15 },
    ],
    intro: 'A cactus elephant in sandals. Its skin is so thick that time itself stopped trying.',
  },
  tralalero: {
    name: 'Tralalero Tralala', art: 'tralalero', size: 'big', color: '#5a8fc0', boss: true,
    hp: 700, atk: 8, interval: 1.3, traits: { evasive: 0.3 }, weak: { sonic: 1.6, blunt: 1.25 }, resist: {},
    moves: [
      { kind: 'volley', every: 6, first: 3, windup: 0.8, hits: 3, power: 0.8 },
      { kind: 'slam', every: 9, first: 6, windup: 1.5, power: 3.2 },
    ],
    phases: [{
      at: 0.5, say: 'TRALALERO TRALALAAA!',
      add: { traits: { shield: 0.25, summoner: true }, atk: 1.3, moves: [
        { kind: 'summon', spawn: 'seagull', count: 2, every: 12, first: 1 },
        { kind: 'summon', spawn: 'crab', count: 1, every: 16, first: 6 },
      ] },
    }],
    intro: 'The shark in three Nikes rules this beach. It has never lost a race, a fight or an argument.',
  },
};
for (const id in ENEMIES) {
  const d = ENEMIES[id]; d.id = id;
  const moves = (d.moves || []).concat(...(d.phases || []).map(p => (p.add && p.add.moves) || []));
  for (const m of moves) if (typeof m.spawn === 'string') m.spawn = ENEMIES[m.spawn];
}

const ZONES = [
  {
    id: 'beach', name: 'Brainrot Beach',
    // stage colours: sky bands top to bottom, sun gradient, horizon kind, floor and grid
    look: { sky: ['#0b0730', '#1a0b4a', '#3a0f5e', '#6a1a6e', '#a83a6a', '#ff7a5a'], sun: ['#fff1a8', '#ff5a8a'],
      horizon: 'sea', sea: '#1a4a8a', foam: '#9fe8ff', floor: '#2a1838', grid: '#c45a3a', line: '#ffb36b' },
    minions: ['crab', 'seagull', 'jelly', 'coconut'],
    elites: ['bombardiro', 'lirili'],
    boss: 'tralalero',
    // minion groups by map depth (0-based row); a fight picks one of the groups for its depth
    groups: [
      { from: 0, list: [['crab', 'crab'], ['seagull', 'seagull', 'seagull'], ['coconut', 'coconut'], ['jelly', 'jelly'], ['crab', 'seagull']] },
      { from: 3, list: [['crab', 'crab', 'crab'], ['seagull', 'seagull', 'seagull', 'seagull'], ['jelly', 'crab', 'jelly'], ['coconut', 'coconut', 'coconut'], ['crab', 'seagull', 'seagull'], ['coconut', 'jelly', 'coconut']] },
      { from: 6, list: [['crab', 'crab', 'crab', 'crab'], ['seagull', 'seagull', 'seagull', 'seagull', 'seagull'], ['jelly', 'jelly', 'jelly', 'crab'], ['coconut', 'crab', 'coconut', 'seagull'], ['crab', 'jelly', 'seagull', 'coconut']] },
    ],
  },
];

if (typeof module !== 'undefined') module.exports = { ENEMIES, ZONES };
