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
    name: 'Gabbiano Granatino', art: 'seagull', size: 'small', color: '#e8eef2',
    hp: 26, atk: 2.5, interval: 1.1, traits: { flying: true, evasive: 0.4 }, weak: { pierce: 1.5 }, resist: {},
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
  guardCrab: {
    name: 'Crab Bodyguard', art: 'crab', size: 'small', color: '#ff7a4a', guard: true,
    hp: 70, atk: 3, interval: 1.6, traits: { armour: 3 }, weak: { blunt: 1.5, explosive: 1.5 }, resist: { slash: 0.7 },
    intro: 'A crab in sunglasses and an earpiece. It is not paid enough for this, and it will do it anyway.',
  },
  pelican: {
    name: 'Pellicano Cannolino', art: 'pelican', size: 'big', color: '#e8b070', elite: true,
    hp: 230, atk: 6, interval: 1.4, traits: { flying: true, evasive: 0.3, summoner: true }, weak: { pierce: 1.5, sonic: 1.2 }, resist: { explosive: 0.6 },
    moves: [
      { kind: 'volley', every: 7, first: 3, windup: 1.0, hits: 5, power: 0.6 },
      { kind: 'dodge', every: 11, first: 6, time: 3 },
      { kind: 'summon', spawn: 'seagull', count: 2, every: 15, first: 8 },
    ],
    intro: 'A pelican in a pilot\'s cap, loaded with cannoli. It delivers by air, it delivers to your face, and it brought the gulls as backup.',
  },
  tortoise: {
    name: 'Tartaruga Lasagnona', art: 'tortoise', size: 'big', color: '#d8402a', elite: true,
    hp: 360, atk: 8, interval: 2.0, traits: { armour: 6, regen: 0.006 }, weak: { magic: 1.5, explosive: 1.2 }, resist: { pierce: 0.5, slash: 0.7 },
    moves: [
      { kind: 'slam', every: 8, first: 4, windup: 1.6, power: 2.6 },
      { kind: 'heal', every: 12, first: 9, windup: 2.0, amount: 0.15 },
      { kind: 'shield', every: 14, first: 7, amount: 0.15 },
    ],
    intro: 'A tortoise with a lasagna for a shell. Seven layers, all of them armour. Leave it in the sun and it reheats.',
  },
  octopus: {
    name: 'Polpo Pianissimo', art: 'octopus', size: 'big', color: '#b060d0', boss: true,
    hp: 450, atk: 6, interval: 1.3, traits: { evasive: 0.3 }, weak: { sonic: 1.6, blunt: 1.25 }, resist: {},
    moves: [
      { kind: 'volley', every: 6, first: 3, windup: 0.8, hits: 3, power: 0.8 },
      { kind: 'slam', every: 9, first: 6, windup: 1.5, power: 3.2 },
    ],
    phases: [{
      at: 0.5, say: 'FORTISSIMOOO!',
      add: { traits: { shield: 0.25, summoner: true }, atk: 1.3, moves: [
        { kind: 'summon', spawn: 'seagull', count: 2, every: 15, first: 2 },
        { kind: 'summon', spawn: 'crab', count: 1, every: 16, first: 6 },
      ] },
    }],
    intro: 'An octopus that grew into an upright piano, or a piano that grew an octopus. It plays the beach every night. Tonight you are the encore.'
  },
};
for (const id in ENEMIES) {
  const d = ENEMIES[id]; d.id = id;
  const moves = (d.moves || []).concat(...(d.phases || []).map(p => (p.add && p.add.moves) || []));
  for (const m of moves) if (typeof m.spawn === 'string') m.spawn = ENEMIES[m.spawn];
}

// Enchantments: cards that elites and the boss sometimes carry (zone.tune.enchant scales how often).
// Each one changes the fight in a way the pre-fight screen spells out, and each has a written counter.
// Hard rules: they never touch your items or cards, never block shops or healing, never skip your
// attacks and never kill outright. mod: hp/atk multipliers, traits (set), add (numeric traits added),
// weak/resist (multiplied in), moves (appended), adds (extra enemies at the start), gold (extra reward)
// and hooks run by the fight engine in rules.js. counter: the weapons the counter text points at.
const ENCHANTMENTS = {
  encore: { name: "Pianissimo's Encore", for: ['boss'], text: 'Gets back up once at 25% HP after being knocked out.',
    counter: 'Magic damage burns the encore away: deal 12% of its HP as magic first.', counterWeapons: ['wand'],
    mod: { hooks: { encore: { at: 0.25, burnAt: 0.12 } } } },
  concrete: { name: 'Concrete Contract', for: ['elite', 'boss'], text: 'Gains 1 armour every 8 seconds (up to +5).',
    counter: 'Blunt hits crack it: each one knocks off half a point of the extra armour.', counterWeapons: ['gloves', 'wand'],
    mod: { hooks: { grow: { every: 8, amount: 1, max: 5, crack: 'blunt', per: 0.5 } } } },
  escort: { name: 'Seagull Security', for: ['elite', 'boss'], text: 'Two seagulls fly in as bodyguards.',
    counter: 'The Uzi and the Guitar clear seagulls fast.', counterWeapons: ['uzi', 'guitar'],
    mod: { adds: [['seagull', 2]] } },
  bodyguard: { name: 'Union Bodyguard', for: ['elite', 'boss'], text: 'A crab bodyguard stands in front. While it stands, this enemy takes 40% less damage.',
    counter: 'Knock the crab out first (front targeting); blunt and explosive crack crabs.', counterWeapons: ['gloves', 'bazooka'],
    mod: { adds: [['guardCrab', 1]], hooks: { guarded: 0.4 } } },
  urchin: { name: 'Sea Urchin Suit', for: ['elite', 'boss'], text: 'Every weapon hit you land pricks you for 0.5 damage.',
    counter: 'Slow, heavy weapons (Wand, Bazooka, Sword) take far fewer pricks.', counterWeapons: ['wand', 'bazooka', 'sword'],
    mod: { hooks: { reflect: { flat: 0.5 } } } },
  bubble: { name: 'Bubble Wrap', for: ['elite', 'boss'], text: 'Starts behind a shield of 15% of its HP and re-wraps every 18 seconds.',
    counter: 'Magic and sonic pop shields twice as hard.', counterWeapons: ['wand', 'guitar'],
    mod: { traits: { shield: 0.15 }, moves: [{ kind: 'shield', every: 18, first: 18, amount: 0.1 }] } },
  highTide: { name: 'High Tide', for: ['elite', 'boss'], text: 'Regenerates 0.8% of its HP every second.',
    counter: 'The tide stops while it is wounded (Sword, Guitar) and for 3 seconds after each explosion (Bazooka).', counterWeapons: ['sword', 'guitar', 'bazooka'],
    mod: { hooks: { tide: { regen: 0.008, pause: 3, by: 'explosive' } } } },
  thundercloud: { name: 'Thundercloud', for: ['elite', 'boss'], text: 'Every 12 seconds, winds up a lightning strike for a heavy hit.',
    counter: 'Boxing Gloves interrupt the wind-up.', counterWeapons: ['gloves'],
    mod: { moves: [{ kind: 'slam', every: 12, first: 7, windup: 1.6, power: 3 }] } },
  sandstorm: { name: 'Sandstorm', for: ['elite', 'boss'], text: '+10% dodge chance.',
    counter: 'Fast, accurate weapons (Uzi, Gloves) barely notice.', counterWeapons: ['uzi', 'gloves'],
    mod: { add: { evasive: 0.1 } } },
  gelato: { name: 'Gelato Armour', for: ['elite', 'boss'], text: 'Starts with 4 extra armour that melts by 1 every 5 seconds.',
    counter: 'Explosive and magic hits melt a point each; the Wand ignores it anyway.', counterWeapons: ['bazooka', 'wand'],
    mod: { hooks: { melt: { start: 4, every: 5, faster: ['explosive', 'magic'] } } } },
  hype: { name: 'Hype Track', for: ['elite', 'boss'], text: 'Hits 25% harder while the beat is on.',
    counter: 'Interrupt any wind-up (Boxing Gloves) to kill the beat for good.', counterWeapons: ['gloves'],
    mod: { hooks: { hype: 1.25 } } },
  fanClub: { name: 'Coconut Fan Club', for: ['elite', 'boss'], text: 'A coconut fan rolls in every 12 seconds.',
    counter: 'The Sword cleaves fans and the Guitar hits everyone.', counterWeapons: ['sword', 'guitar'],
    mod: { traits: { summoner: true }, moves: [{ kind: 'summon', spawn: 'coconut', count: 1, every: 12, first: 5 }] } },
  lacquer: { name: 'Lacquered Shell', for: ['elite', 'boss'], text: '+3 armour, but blunt and explosive hits deal ×1.3.',
    counter: 'Blunt and explosive, or the Wand, which ignores armour.', counterWeapons: ['gloves', 'bazooka', 'wand'],
    mod: { add: { armour: 3 }, weak: { blunt: 1.3, explosive: 1.3 } } },
  secondWind: { name: 'Second Wind', for: ['elite', 'boss'], text: 'Below 40% HP it hits 30% harder.',
    counter: "It can't get its second wind while wounded: Sword cuts and Guitar rattles hold it off.", counterWeapons: ['sword', 'guitar'],
    mod: { hooks: { lowRage: { at: 0.4, atk: 1.3 } } } },
  goldPlated: { name: 'Gold-Plated', for: ['elite', 'boss'], text: '+15% HP. Pays 20 more gold if you win.',
    counter: 'Pierce finds the gaps in the plating: pierce hits deal ×1.3.', counterWeapons: ['uzi'],
    mod: { hp: 1.15, weak: { pierce: 1.3 }, gold: 20 } },
  mirrorBall: { name: 'Mirror Ball', for: ['elite', 'boss'], text: 'Reflects 25% of the magic damage it takes back at you.',
    counter: 'Anything but magic. Switch off the Wand, or keep your HP high.', counterWeapons: ['sword', 'gloves', 'uzi', 'guitar', 'bazooka'],
    mod: { hooks: { reflect: { share: 0.25, type: 'magic' } } } },
  jellyChoir: { name: 'Jelly Choir', for: ['elite', 'boss'], text: 'A shielded jellyfish hums in as a backing singer.',
    counter: 'Sonic damage: the Guitar pops the whole choir at once.', counterWeapons: ['guitar', 'wand'],
    mod: { adds: [['jelly', 1]] } },
  sunburn: { name: 'Sunburn', for: ['elite', 'boss'], text: 'While it is above half HP, you burn for 1 damage a second.',
    counter: 'Each sonic or magic hit you land cools the burn for 2 seconds: the Guitar and the Wand.', counterWeapons: ['guitar', 'wand'],
    mod: { hooks: { burn: { dps: 1, above: 0.5, cool: 2, by: ['sonic', 'magic'] } } } },
};
for (const id in ENCHANTMENTS) ENCHANTMENTS[id].id = id;

// Apply enchantments to a scaled enemy definition.
function enchantDef(def, ids) {
  const d = { ...def, traits: { ...def.traits }, weak: { ...def.weak }, resist: { ...def.resist }, moves: (def.moves || []).slice(), hooks: { ...def.hooks }, ench: ids.slice() };
  for (const id of ids) {
    const m = ENCHANTMENTS[id].mod;
    if (m.hp) d.hp = Math.round(d.hp * m.hp);
    if (m.atk) d.atk = Math.round(d.atk * m.atk * 10) / 10;
    Object.assign(d.traits, m.traits);
    for (const k in m.add || {}) d.traits[k] = Math.round(((d.traits[k] || 0) + m.add[k]) * 1000) / 1000;
    for (const k in m.weak || {}) d.weak[k] = Math.round((d.weak[k] || 1) * m.weak[k] * 100) / 100;
    for (const k in m.resist || {}) d.resist[k] = Math.round((d.resist[k] || 1) * m.resist[k] * 100) / 100;
    for (const mv of m.moves || []) d.moves.push({ ...mv, spawn: typeof mv.spawn === 'string' ? ENEMIES[mv.spawn] : mv.spawn });
    Object.assign(d.hooks, m.hooks);
  }
  return d;
}
// How many enchantments an elite or boss on this row carries (0-2), rolled from its own rng.
function rollEnchantments(rng, kind, row, zone) {
  const k = zone.tune.enchant == null ? 1 : zone.tune.enchant, pool = Object.keys(ENCHANTMENTS).filter(id => ENCHANTMENTS[id].for.includes(kind));
  const first = Math.min(0.9, (kind === 'boss' ? 0.5 : 0.1 + 0.06 * row) * k), second = Math.min(0.6, (kind === 'boss' ? 0.35 : 0.04 * row) * k);
  const out = [];
  if (rng.next() < first) out.push(rng.pick(pool));
  if (out.length && rng.next() < second) out.push(rng.pick(pool.filter(id => id !== out[0])));
  return out;
}

// An enemy as a zone fields it: minions get tougher the deeper into the map they are, and each zone
// has overall multipliers for minions, elites and the boss (zone.tune), so tuning is data.
function scaledEnemy(def, depth, zone) {
  const t = zone.tune, kind = def.boss ? 'boss' : def.elite ? 'elite' : 'minion';
  const k = kind === 'minion' ? 1 + t.depth * depth : 1;
  return { ...def, hp: Math.round(def.hp * k * t[kind + 'Hp']), atk: Math.round(def.atk * k * t[kind + 'Atk'] * 10) / 10 };
}

const ZONES = [
  {
    id: 'beach', name: 'Brainrot Beach',
    tune: { enchant: 1, depth: 0.12, winHeal: 0.15, minionHp: 0.85, minionAtk: 0.65, eliteHp: 0.75, eliteAtk: 0.62, bossHp: 1.0, bossAtk: 0.68 },
    // stage colours: sky bands top to bottom, sun gradient, horizon kind, floor and grid
    look: { sky: ['#0b0730', '#1a0b4a', '#3a0f5e', '#6a1a6e', '#a83a6a', '#ff7a5a'], sun: ['#fff1a8', '#ff5a8a'],
      horizon: 'sea', sea: '#1a4a8a', foam: '#9fe8ff', floor: '#2a1838', grid: '#c45a3a', line: '#ffb36b' },
    minions: ['crab', 'seagull', 'jelly', 'coconut'],
    elites: ['pelican', 'tortoise'],
    boss: 'octopus',
    // Events: a choice either has effects, or a chance with a win and a lose outcome. cost is gold.
    // Effects: hp, maxHp, gold (and, with loot, item: 'weapon' | 'armour' | 'trinket' | 'any' | 'card').
    events: [
      { id: 'gelato', title: 'Gelato at 3 A.M.',
        text: 'Tricheco Gelatino, a walrus whose tusks are two upside-down cones, is running a gelato cart in the dark. "Flavour of the night," he says, tapping a tusk. Nobody asked.',
        choices: [
          { label: 'Buy a scoop (15 gold)', cost: 15, text: 'Pistachio. Genuinely excellent. You feel restored.', effects: { hp: 25 } },
          { label: 'Try the mystery flavour', chance: 0.5,
            win: { text: 'It tastes like courage and wet sand. +15 max HP.', effects: { maxHp: 15 } },
            lose: { text: 'It was tusk flavour. You licked a walrus. -15 HP.', effects: { hp: -15 }, death: 'a mystery gelato' } },
          { label: 'Walk away slowly', text: 'The cart\'s little bell follows you for a while. Then it stops. That is worse. You find 6 gold where it stopped.', effects: { gold: 6 } },
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
        text: 'Fenicottera Fettuccina, a flamingo standing on two long strands of fettuccine, is holding open auditions on the pier. The judges are three seagulls with scorecards.',
        choices: [
          { label: 'Dance', text: 'You pull something in your back, but the seagulls throw coins. -10 HP, +35 gold.', effects: { hp: -10, gold: 35 } },
          { label: 'Applaud from the back', text: 'She curtsies at you specifically. You feel seen. +12 HP, and someone drops 8 gold in your hat.', effects: { hp: 12, gold: 8 } },
        ] },
      { id: 'bottle', title: 'Message in a Bottle',
        text: 'A bottle washes up at your feet. The note inside is in Italian and mostly exclamation marks.',
        choices: [
          { label: 'Open it', chance: 0.6,
            win: { text: 'Inside: a soggy note, 20 gold, and something wrapped in seaweed.', effects: { gold: 20, item: 'trinket' } },
            lose: { text: 'Inside: a very small, very angry crab. -8 HP.', effects: { hp: -8 } } },
          { label: 'Drink whatever is left in it', text: 'Seawater, mostly. Something else, partly. +20 max HP, -20 HP.', effects: { maxHp: 20, hp: -20 }, death: 'the bottle' },
          { label: 'Throw it back', text: 'The sea accepts your offering and, after some thought, throws back 10 gold.', effects: { gold: 10 } },
        ] },
      { id: 'banana', title: 'Banana Futures',
        text: 'Bananito Bancario, a banana in a tie and very small glasses, has a folding table, a whiteboard and a proposal. "Bananas," he says, pointing at a chart going up.',
        choices: [
          { label: 'Invest 25 gold', cost: 25, chance: 0.5,
            win: { text: 'Bananas went up. You receive 60 gold and a handshake that is mostly peel.', effects: { gold: 60 } },
            lose: { text: 'Bananas went down. Bananito looks devastated, then peels the evidence.', effects: {} } },
          { label: 'Decline', text: '"Your loss," he says, and starts a podcast. You get 5 gold for being its first listener.', effects: { gold: 5 } },
        ] },
      { id: 'cards', title: 'Tide Tarot',
        text: 'Nonna Seppia, an old cuttlefish in a shawl, has set up a card table under a beach umbrella. She fans out a deck that smells faintly of ink. "Pick one," she says. "Any one. Not that one."',
        choices: [
          { label: 'Buy a reading (20 gold)', cost: 20, text: 'The card she flips has your face on it, sort of. She lets you keep it.', effects: { item: 'card' } },
          { label: 'Pick "that one"', chance: 0.5,
            win: { text: 'It was a good card. She looks at you with new respect and at the deck with new suspicion.', effects: { item: 'card' } },
            lose: { text: 'Squirt. She inks you, apologetically. -14 HP.', effects: { hp: -14 }, death: 'the wrong card' } },
          { label: 'Shuffle off', text: 'You leave. Behind you the cards shuffle themselves, in perfect four-four time.' },
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

if (typeof module !== 'undefined') module.exports = { ENEMIES, ZONES, ENCHANTMENTS, scaledEnemy, enchantDef, rollEnchantments };
