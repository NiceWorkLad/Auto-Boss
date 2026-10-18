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
    hp: 40, atk: 5, interval: 1.8, traits: { evasive: 0.3, regen: 0.05 }, weak: { slash: 1.5, blunt: 1.2 }, resist: { pierce: 0.6 },
    intro: 'A coconut in sunglasses, rolling just out of reach. It heals while you watch. It is not sorry.',
  },
  bombardiro: {
    name: 'Bombardiro Crocodilo', art: 'bombardiro', size: 'big', color: '#6a7a5a', elite: true,
    hp: 230, atk: 6, interval: 1.4, traits: { flying: true, evasive: 0.3, summoner: true }, weak: { pierce: 1.5, sonic: 1.2 }, resist: { explosive: 0.5 },
    moves: [
      { kind: 'volley', every: 7, first: 3, windup: 1.0, hits: 5, power: 0.6 },
      { kind: 'dodge', every: 11, first: 6, time: 3 },
      { kind: 'summon', spawn: 'seagull', count: 2, every: 15, first: 8 },
    ],
    intro: 'Half crocodile, half bomber, fully licensed. It drops seagulls. Nobody knows how.',
  },
  lirili: {
    name: 'Lirilì Larilà', art: 'lirili', size: 'big', color: '#9a9aac', elite: true,
    hp: 360, atk: 8, interval: 2.0, traits: { armour: 6, regen: 0.006 }, weak: { magic: 1.5, explosive: 1.2 }, resist: { pierce: 0.5, slash: 0.7 },
    moves: [
      { kind: 'slam', every: 8, first: 4, windup: 1.6, power: 2.6 },
      { kind: 'heal', every: 12, first: 9, windup: 2.0, amount: 0.15 },
      { kind: 'shield', every: 14, first: 7, amount: 0.15 },
    ],
    intro: 'A cactus elephant in sandals. Its skin is so thick that time itself stopped trying.',
  },
  tralalero: {
    name: 'Tralalero Tralala', art: 'tralalero', size: 'big', color: '#5a8fc0', boss: true,
    hp: 450, atk: 6, interval: 1.3, traits: { evasive: 0.3 }, weak: { sonic: 1.6, blunt: 1.25 }, resist: {},
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

// Minions get tougher the deeper into the map they are; elites and the boss are tuned as they stand.
function scaledEnemy(def, depth, zone) {
  if (def.elite || def.boss) return def;
  const k = 1 + zone.depthScale * depth;
  return { ...def, hp: Math.round(def.hp * k), atk: Math.round(def.atk * k * 10) / 10 };
}

const ZONES = [
  {
    id: 'beach', name: 'Brainrot Beach', depthScale: 0.1,
    // stage colours: sky bands top to bottom, sun gradient, horizon kind, floor and grid
    look: { sky: ['#0b0730', '#1a0b4a', '#3a0f5e', '#6a1a6e', '#a83a6a', '#ff7a5a'], sun: ['#fff1a8', '#ff5a8a'],
      horizon: 'sea', sea: '#1a4a8a', foam: '#9fe8ff', floor: '#2a1838', grid: '#c45a3a', line: '#ffb36b' },
    minions: ['crab', 'seagull', 'jelly', 'coconut'],
    elites: ['bombardiro', 'lirili'],
    boss: 'tralalero',
    // Events: a choice either has effects, or a chance with a win and a lose outcome. cost is gold.
    // Effects: hp, maxHp, gold (and, with loot, item: 'weapon' | 'armour' | 'trinket' | 'any').
    events: [
      { id: 'gelato', title: 'Gelato at 3 A.M.',
        text: 'Tung Tung Tung Sahur is running a gelato cart in the dark. He taps the bat on the cart. "Flavour of the night," he says. Nobody asked.',
        choices: [
          { label: 'Buy a scoop (15 gold)', cost: 15, text: 'Pistachio. Genuinely excellent. You feel restored.', effects: { hp: 25 } },
          { label: 'Try the mystery flavour', chance: 0.5,
            win: { text: 'It tastes like courage and wet sand. +15 max HP.', effects: { maxHp: 15 } },
            lose: { text: 'It was the bat. You ate part of the bat. -15 HP.', effects: { hp: -15 }, death: 'a mystery gelato' } },
          { label: 'Walk away slowly', text: 'The tapping follows you for a while. Then it stops. That is worse.' },
        ] },
      { id: 'tax', title: 'Sandcastle Tax Office',
        text: 'A crab in a tiny visor stamps a form. "Beach crossing tax. Twenty gold. Or we do this the concrete way."',
        choices: [
          { label: 'Pay the tax (20 gold)', cost: 20, text: 'You get a receipt. It is a shell with a scratch on it.', effects: { maxHp: 5 } },
          { label: 'Refuse', text: 'The crab pinches you, then files a complaint. -12 HP.', effects: { hp: -12 } },
          { label: 'Ask for the manager', chance: 0.4,
            win: { text: 'The manager is impressed by your audacity and hands over a confiscated item.', effects: { item: 'any' } },
            lose: { text: 'The manager is a bigger crab. -20 HP.', effects: { hp: -20 }, death: 'crab management' } },
        ] },
      { id: 'audition', title: 'The Audition',
        text: 'Ballerina Cappuccina is holding open auditions on the pier. The judges are three seagulls and a steaming espresso.',
        choices: [
          { label: 'Dance', text: 'You pull something in your back, but the seagulls throw coins. -10 HP, +35 gold.', effects: { hp: -10, gold: 35 } },
          { label: 'Applaud from the back', text: 'She curtsies at you specifically. You feel seen. +12 HP.', effects: { hp: 12 } },
        ] },
      { id: 'bottle', title: 'Message in a Bottle',
        text: 'A bottle washes up at your feet. The note inside is in Italian and mostly exclamation marks.',
        choices: [
          { label: 'Open it', chance: 0.6,
            win: { text: 'Inside: a soggy note, 20 gold, and something wrapped in seaweed.', effects: { gold: 20, item: 'trinket' } },
            lose: { text: 'Inside: a very small, very angry crab. -8 HP.', effects: { hp: -8 } } },
          { label: 'Drink whatever is left in it', text: 'Seawater, mostly. Something else, partly. +20 max HP, -20 HP.', effects: { maxHp: 20, hp: -20 }, death: 'the bottle' },
          { label: 'Throw it back', text: 'The sea accepts your offering. Nothing happens. Probably.' },
        ] },
      { id: 'banana', title: 'Banana Futures',
        text: 'Chimpanzini Bananini has a folding table, a whiteboard and a proposal. "Bananas," he says, pointing at a chart going up.',
        choices: [
          { label: 'Invest 25 gold', cost: 25, chance: 0.5,
            win: { text: 'Bananas went up. You receive 60 gold and a handshake that is mostly peel.', effects: { gold: 60 } },
            lose: { text: 'Bananas went down. Chimpanzini looks devastated, then eats the evidence.', effects: {} } },
          { label: 'Decline', text: '"Your loss," he says, and starts a podcast.' },
        ] },
    ],
    // minion groups by map depth (0-based row); a fight picks one of the groups for its depth
    groups: [
      { from: 0, list: [['crab', 'crab'], ['seagull', 'seagull', 'seagull'], ['coconut', 'coconut'], ['jelly', 'jelly'], ['crab', 'seagull']] },
      { from: 3, list: [['crab', 'crab', 'crab'], ['seagull', 'seagull', 'seagull', 'seagull'], ['jelly', 'crab', 'jelly'], ['coconut', 'coconut', 'coconut'], ['crab', 'seagull', 'seagull'], ['coconut', 'jelly', 'coconut']] },
      { from: 6, list: [['crab', 'crab', 'crab', 'crab'], ['seagull', 'seagull', 'seagull', 'seagull', 'seagull'], ['jelly', 'jelly', 'jelly', 'crab'], ['coconut', 'crab', 'coconut', 'seagull'], ['crab', 'jelly', 'seagull', 'coconut']] },
    ],
  },
];

if (typeof module !== 'undefined') module.exports = { ENEMIES, ZONES, scaledEnemy };
