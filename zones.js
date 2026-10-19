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
  // ---- Zone 2: Giungla Fusilli ----
  fungo: {
    name: 'Fungo Funghettino', art: 'fungo', size: 'small', color: '#e85a5a',
    hp: 60, atk: 4, interval: 1.6, traits: { regen: 0.07 }, weak: { fire: 1.6, slash: 1.2 }, resist: { blunt: 0.6, sonic: 0.5 },
    intro: 'A mushroom with a polka-dot cap and a grudge. It soaks up sound like a sponge, and cut it and it grows back before you can say "funghetto".',
  },
  rana: {
    name: 'Rana Rigatona', art: 'rana', size: 'small', color: '#5ac85a',
    hp: 45, atk: 3.5, interval: 1.4, traits: { evasive: 0.2 }, weak: { cold: 1.5 }, resist: { fire: 0.6 },
    moves: [{ kind: 'slam', every: 4.5, first: 2.5, windup: 0.9, power: 2.4 }],
    intro: 'A frog on four rigatoni legs. It crouches, it wobbles, and then it lands on you.',
  },
  scimmia: {
    name: 'Scimmietta Spumoni', art: 'scimmia', size: 'small', color: '#ff8fc8',
    hp: 34, atk: 3, interval: 1.3, traits: { backline: true }, weak: { blunt: 1.3, slash: 1.2 }, resist: {},
    moves: [{ kind: 'volley', every: 6, first: 3, hits: 3, power: 0.8 }],
    intro: 'A monkey in three flavours of fur, throwing fruit from the back where nothing can reach it.',
  },
  pappagallo: {
    name: 'Pappagallo Pennetta', art: 'pappagallo', size: 'small', color: '#39d98a',
    hp: 30, atk: 3, interval: 1.0, traits: { flying: true, evasive: 0.35 }, weak: { pierce: 1.4, cold: 1.2 }, resist: { fire: 0.7, sonic: 0.6 },
    intro: 'A parrot with a pen-nib beak. It repeats every sound it hears back at you, then pecks you for making it.',
  },
  gorilla: {
    name: 'Gorilla Gnocchino', art: 'gorilla', size: 'big', color: '#e8d4a0', elite: true,
    hp: 460, atk: 9, interval: 1.8, traits: { armour: 5 }, weak: { cold: 1.6, magic: 1.2 }, resist: { blunt: 0.6, fire: 0.8 },
    moves: [
      { kind: 'slam', every: 6, first: 3, windup: 1.8, power: 3 },
      { kind: 'slam', every: 11, first: 8, windup: 2.4, power: 4.5 },
    ],
    phases: [{ at: 0.5, say: 'GNOCCHI SMASH!', add: { atk: 1.3, moves: [{ kind: 'enrage', every: 999, first: 0.5, power: 1.15 }] } }],
    intro: 'A gorilla built entirely out of gnocchi. Each punch winds up for ages. Each punch is worth the wait, for the gorilla.',
  },
  bradipo: {
    name: 'Bradipo Burrata', art: 'bradipo', size: 'big', color: '#f4f4f0', elite: true,
    hp: 400, atk: 7, interval: 2.2, traits: { regen: 0.022 }, weak: { fire: 1.7 }, resist: { slash: 0.6, cold: 0.7 },
    moves: [
      { kind: 'heal', every: 9, first: 6, windup: 2.0, amount: 0.18 },
      { kind: 'shield', every: 14, first: 4, amount: 0.15 },
      { kind: 'volley', every: 8, first: 5, hits: 4, power: 0.7 },
    ],
    intro: 'A sloth with a burrata belly, hanging from a vine. It heals faster than it moves, which is saying something.',
  },
  camaleonte: {
    name: 'Camaleonte Cannellone', art: 'camaleonte', size: 'big', color: '#3ab8a8', elite: true,
    hp: 320, atk: 7, interval: 1.4, traits: { evasive: 0.35, summoner: true }, weak: { slash: 1.35 }, resist: { magic: 0.7, pierce: 0.7 },
    moves: [
      { kind: 'dodge', every: 9, first: 4, time: 3 },
      { kind: 'summon', spawn: 'scimmia', count: 2, every: 14, first: 2 },
      { kind: 'volley', every: 7, first: 6, windup: 0.8, hits: 4, power: 0.7 },
    ],
    intro: 'A chameleon rolled up like a cannellone. It changes colour, changes places, and calls its monkeys from the trees.',
  },
  tucano: {
    name: 'Tucano Tortellone', art: 'tucano', size: 'big', color: '#ffb020', boss: true,
    hp: 760, atk: 8, interval: 1.3, traits: { flying: true, evasive: 0.3 }, weak: { slash: 1.3, cold: 1.25 }, resist: { magic: 0.75, sonic: 0.8 },
    moves: [
      { kind: 'volley', name: 'SEED SPRAY', every: 6, first: 3, windup: 0.8, hits: 4, power: 0.7 },
      { kind: 'slam', name: 'BEAK BASH', every: 9, first: 6, windup: 1.6, power: 3.2 },
      { kind: 'dive', name: 'TORTELLINO DIVE', every: 14, first: 11, windup: 1.6, power: 2.4 },
    ],
    phases: [
      { at: 0.6, say: 'TO THE CANOPY!', add: { traits: { backline: true, summoner: true, armour: 2 }, resist: { pierce: 0.7 }, moves: [
        { kind: 'summon', spawn: 'rana', count: 2, every: 13, first: 0.5 },
        { kind: 'summon', spawn: 'scimmia', count: 1, every: 17, first: 7 },
      ] } },
      { at: 0.25, say: 'TORTELLONE FOREVER!', add: { traits: { regen: 0.02, backline: false }, atk: 1.3 } },
    ],
    intro: 'A toucan whose beak is one enormous tortellino. It rules the canopy, it hides in the canopy, and it grows back like the canopy.',
  },
  octopus: {
    name: 'Polpo Pianissimo', art: 'octopus', size: 'big', color: '#b060d0', boss: true,
    hp: 450, atk: 6, interval: 1.3, traits: { evasive: 0.3 }, weak: { sonic: 1.6, blunt: 1.25 }, resist: {},
    // signature moves have a name: the arena shows it, with a warning on you, while it winds up
    moves: [
      { kind: 'volley', name: 'KEY CASCADE', every: 6, first: 3, windup: 0.8, hits: 3, power: 0.8 },
      { kind: 'slam', name: 'LID SLAM', every: 9, first: 6, windup: 1.5, power: 3.2 },
      { kind: 'ink', name: 'INK CLOUD', every: 15, first: 10, windup: 1.2, time: 3, miss: 0.5 },
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
  encore: { name: "Pianissimo's Encore", for: ['boss'], zones: ['beach'], text: 'Gets back up once at 25% HP after being knocked out.',
    counter: 'Magic damage burns the encore away: deal 12% of its HP as magic first.', counterWeapons: ['wand'],
    mod: { hooks: { encore: { at: 0.25, burnAt: 0.12 } } } },
  concrete: { name: 'Concrete Contract', for: ['elite', 'boss'], text: 'Gains 1 armour every 8 seconds (up to +5).',
    counter: 'Blunt hits crack it: each one knocks off half a point of the extra armour.', counterWeapons: ['gloves', 'wand'],
    mod: { hooks: { grow: { every: 8, amount: 1, max: 5, crack: 'blunt', per: 0.5 } } } },
  escort: { name: 'Seagull Security', for: ['elite', 'boss'], zones: ['beach'], text: 'Two seagulls fly in as bodyguards.',
    counter: 'The Uzi and the Guitar clear seagulls fast.', counterWeapons: ['uzi', 'guitar'],
    mod: { adds: [['seagull', 2]] } },
  bodyguard: { name: 'Union Bodyguard', for: ['elite', 'boss'], zones: ['beach'], text: 'A crab bodyguard stands in front. While it stands, this enemy takes 40% less damage.',
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
  fanClub: { name: 'Coconut Fan Club', for: ['elite', 'boss'], zones: ['beach'], text: 'A coconut fan rolls in every 12 seconds.',
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
  jellyChoir: { name: 'Jelly Choir', for: ['elite', 'boss'], zones: ['beach'], text: 'A shielded jellyfish hums in as a backing singer.',
    counter: 'Sonic damage: the Guitar pops the whole choir at once.', counterWeapons: ['guitar', 'wand'],
    mod: { adds: [['jelly', 1]] } },
  // ---- Jungle enchantments ----
  overgrown: { name: 'Overgrown', for: ['elite'], zones: ['jungle'], text: 'Moss regrows it: 1% of its HP every second.',
    counter: 'Fire scorches the moss for 3 seconds (Flamethrower); Sword cuts slow it too.', counterWeapons: ['flamer', 'sword'],
    mod: { hooks: { tide: { regen: 0.01, pause: 3, by: 'fire' } } } },
  canopy: { name: 'Canopy Cover', for: ['elite'], zones: ['jungle'], text: 'Fights from the back row behind a frog.',
    counter: 'The Boomerang reaches the back row; area and splash hit it too.', counterWeapons: ['boomerang', 'guitar', 'bazooka'],
    mod: { traits: { backline: true }, adds: [['rana', 1]] } },
  frogChorus: { name: 'Frog Chorus', for: ['elite', 'boss'], zones: ['jungle'], text: 'Two frogs hop in at the start.',
    counter: 'The Freeze Ray stops their leaps; the Guitar hits the whole pond.', counterWeapons: ['freeze', 'guitar'],
    mod: { adds: [['rana', 2]] } },
  humid: { name: 'Humid', for: ['elite', 'boss'], zones: ['jungle'], text: 'Damp all over: fire deals half damage, but cold deals ×1.3.',
    counter: 'Leave the Flamethrower; the Freeze Ray loves the damp.', counterWeapons: ['freeze', 'wand', 'boomerang'],
    mod: { resist: { fire: 0.5 }, weak: { cold: 1.3 } } },
  sunburn: { name: 'Sunburn', for: ['elite', 'boss'], zones: ['beach'], text: 'While it is above half HP, you burn for 1 damage a second.',
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
  const k = zone.tune.enchant == null ? 1 : zone.tune.enchant;
  const pool = Object.keys(ENCHANTMENTS).filter(id => ENCHANTMENTS[id].for.includes(kind) && (!ENCHANTMENTS[id].zones || ENCHANTMENTS[id].zones.includes(zone.id)));
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
    id: 'beach', name: 'Brainrot Beach', act: 1,
    clear: 'Polpo Pianissimo closes the lid for good. The beach is yours.',
    tune: { enchant: 1, depth: 0.12, winHeal: 0.15, minionHp: 1, minionAtk: 0.77, eliteHp: 0.9, eliteAtk: 0.75, bossHp: 1.2, bossAtk: 0.82,
      ot: { hp: 2.08, atk: 2.31 } },   // in Overtime the beach comes back at jungle strength
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
          { label: 'Walk away slowly', text: 'The cart\'s little bell follows you for a while. Then it stops. That is worse. You find 9 gold where it stopped.', effects: { gold: 9 } },
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
          { label: 'Dance', text: 'You pull something in your back, but the seagulls throw coins. -10 HP, +52 gold.', effects: { hp: -10, gold: 52 } },
          { label: 'Applaud from the back', text: 'She curtsies at you specifically. You feel seen. +12 HP, and someone drops 12 gold in your hat.', effects: { hp: 12, gold: 12 } },
        ] },
      { id: 'bottle', title: 'Message in a Bottle',
        text: 'A bottle washes up at your feet. The note inside is in Italian and mostly exclamation marks.',
        choices: [
          { label: 'Open it', chance: 0.6,
            win: { text: 'Inside: a soggy note, 30 gold, and something wrapped in seaweed.', effects: { gold: 30, item: 'trinket' } },
            lose: { text: 'Inside: a very small, very angry crab. -8 HP.', effects: { hp: -8 } } },
          { label: 'Drink whatever is left in it', text: 'Seawater, mostly. Something else, partly. +20 max HP, -20 HP.', effects: { maxHp: 20, hp: -20 }, death: 'the bottle' },
          { label: 'Throw it back', text: 'The sea accepts your offering and, after some thought, throws back 15 gold.', effects: { gold: 15 } },
        ] },
      { id: 'banana', title: 'Banana Futures',
        text: 'Bananito Bancario, a banana in a tie and very small glasses, has a folding table, a whiteboard and a proposal. "Bananas," he says, pointing at a chart going up.',
        choices: [
          { label: 'Invest 25 gold', cost: 25, chance: 0.5,
            win: { text: 'Bananas went up. You receive 90 gold and a handshake that is mostly peel.', effects: { gold: 90 } },
            lose: { text: 'Bananas went down. Bananito looks devastated, then peels the evidence.', effects: {} } },
          { label: 'Decline', text: '"Your loss," he says, and starts a podcast. You get 8 gold for being its first listener.', effects: { gold: 8 } },
        ] },
      { id: 'cards', title: 'Tide Tarot',
        text: 'Nonna Seppia, an old cuttlefish in a shawl, has set up a card table under a beach umbrella. She fans out a deck that smells faintly of ink. "Pick one," she says. "Any one. Not that one."',
        choices: [
          { label: 'Buy a reading (20 gold)', cost: 20, text: 'The card she flips has your face on it, sort of. She lets you keep it.', effects: { item: 'card' } },
          { label: 'Pick "that one"', chance: 0.5,
            win: { text: 'It was a good card. She looks at you with new respect and at the deck with new suspicion.', effects: { item: 'card' } },
            lose: { text: 'Squirt. She inks you, apologetically. -14 HP.', effects: { hp: -14 }, death: 'the wrong card' } },
          { label: 'Turn over the Tower', text: 'Nonna Seppia goes very quiet. "Keep it," she says. "Far from me." It is warm, and it is falling.', effects: { card: 'tarotTower' } },
          { label: 'Shuffle off', text: 'You leave. Behind you the cards shuffle themselves, in perfect four-four time.' },
        ] },
      { id: 'deal', title: 'Pavone\'s Deal',
        text: 'Pavone Pokerino, a peacock whose tail is a fan of playing cards, has set up a folding table at the tideline. "One deal," he says, fanning. "Everyone gets one deal."',
        choices: [
          { label: 'Take the dark card, and the gold', text: 'The card is warm. The gold is cold. Both are yours now. (A cursed card and 60 gold.)', effects: { cursed: true, gold: 60 } },
          { label: 'Cut the deck (45%)', chance: 0.45,
            win: { text: 'Ace. He sighs and slides over the card he keeps up his sleeve.', effects: { card: 'pavoneAce' } },
            lose: { text: 'Deuce. He flicks a feather at you, hard. -15 HP.', effects: { hp: -15 }, death: 'a bad cut' } },
          { label: 'Not today', text: '"Today, tomorrow," he says. "The deck keeps." You find a few coins in the sand.', effects: { gold: 9 } },
        ] },
    ],
    // minion groups by map depth (0-based row); a fight picks one of the groups for its depth
    groups: [
      { from: 0, list: [['crab', 'crab'], ['seagull', 'seagull', 'seagull'], ['coconut', 'coconut'], ['jelly', 'jelly'], ['crab', 'seagull']] },
      { from: 3, list: [['crab', 'crab', 'crab'], ['seagull', 'seagull', 'seagull', 'seagull'], ['jelly', 'crab', 'jelly'], ['coconut', 'coconut', 'coconut'], ['crab', 'seagull', 'seagull'], ['coconut', 'jelly', 'coconut']] },
      { from: 6, list: [['crab', 'crab', 'crab', 'crab'], ['seagull', 'seagull', 'seagull', 'seagull', 'seagull'], ['jelly', 'jelly', 'jelly', 'crab'], ['coconut', 'crab', 'coconut', 'seagull'], ['crab', 'jelly', 'seagull', 'coconut']] },
    ],
  },
  {
    id: 'jungle', name: 'Giungla Fusilli', act: 2,
    // shown between acts: where you are going, and why
    story: 'Polpo Pianissimo\'s last chord rolls out over the water, and something in the hills answers it. A vine of fusilli drops from the clouds behind the beach. Up it goes: into the Giungla Fusilli, where Tucano Tortellone keeps the canopy, and where everything grows back.',
    clear: 'Tucano Tortellone drops its last tortellino and flaps off into the clouds. The jungle goes quiet, except for the moss.',
    tune: { enchant: 1.2, depth: 0.05, winHeal: 0.15, minionHp: 2.15, minionAtk: 2.04, eliteHp: 1.52, eliteAtk: 1.32, bossHp: 1.72, bossAtk: 1.39 },
    look: { sky: ['#06140a', '#0c2412', '#14361a', '#1e4a22', '#2a5e2a', '#6a9a3a'], sun: ['#fff1a8', '#ff9a3a'],
      horizon: 'jungle', canopy: '#0a2a10', leaf: '#2a7a2a', floor: '#1a1408', grid: '#6a4a1a', line: '#c8a040' },
    minions: ['fungo', 'rana', 'scimmia', 'pappagallo'],
    elites: ['gorilla', 'bradipo', 'camaleonte'],
    boss: 'tucano',
    events: [
      { id: 'river', title: 'The Fusilli River',
        text: 'The river here runs in a spiral, like the pasta it is named after. A capybara in a captain\'s hat offers a raft. A sign reads: SWIMMING AT OWN RISK. SPIRALLING AT OWN RISK.',
        choices: [
          { label: 'Take the raft (20 gold)', cost: 20, text: 'The capybara steers with total calm. You arrive rested. +20 HP.', effects: { hp: 20 } },
          { label: 'Swim the spiral', chance: 0.55,
            win: { text: 'You come out dizzy but a little tougher, holding something shiny from the riverbed. +8 max HP.', effects: { maxHp: 8, item: 'any' } },
            lose: { text: 'The spiral spins you round eleven times. -18 HP.', effects: { hp: -18 }, death: 'the Fusilli River' } },
          { label: 'Walk the long way round', text: 'It takes ages. You find 15 gold in a hollow log on the way.', effects: { gold: 15 } },
        ] },
      { id: 'shrine', title: 'Shrine of the Golden Gnocco',
        text: 'Moss-covered steps lead up to a single golden gnocco on a stone plinth. It hums. A carving underneath shows a gorilla looking very upset.',
        choices: [
          { label: 'Leave an offering (25 gold)', cost: 25, text: 'The gnocco glows warmly. You feel blessed, and slightly carb-loaded. +15 max HP.', effects: { maxHp: 15 } },
          { label: 'Take the gnocco', chance: 0.5,
            win: { text: 'Nothing happens. You quietly pocket a priceless gnocco. It hums in your pocket.', effects: { card: 'gnoccoIdol' } },
            lose: { text: 'Somewhere, a gorilla screams. Something hits you from the trees. -16 HP.', effects: { hp: -16 }, death: 'the golden gnocco' } },
          { label: 'Bow and leave', text: 'A good choice. The moss parts politely as you go. +6 HP.', effects: { hp: 6 } },
        ] },
      { id: 'notary', title: 'The Parrot Notary',
        text: 'A grey parrot in half-moon glasses sits behind a tiny desk. "Contracts witnessed, wills read, deals sealed," it says, then says it again.',
        choices: [
          { label: 'Have a deal sealed (20 gold)', cost: 20, text: 'It stamps a card with its beak and hands it over. "Binding," it says. "Binding."', effects: { card: 'notarySeal' } },
          { label: 'Ask it to read your fortune', chance: 0.5,
            win: { text: '"Great riches," it says, and hands you 52 gold, which seems to be its own.', effects: { gold: 52 } },
            lose: { text: '"Great pain," it says, and pecks you. -10 HP.', effects: { hp: -10 } } },
          { label: 'Say nothing', text: '"Nothing," it repeats, approvingly.' },
        ] },
      { id: 'crates', title: 'The Mystery Crates',
        text: 'Three crates sit in a clearing, stencilled ?, ?? and ???. A monkey watches from a branch, eating something it clearly found in one of them.',
        choices: [
          { label: 'Open the small crate (80%)', chance: 0.8,
            win: { text: 'Bananas, and under the bananas some coins.', effects: { gold: 22 } },
            lose: { text: 'Empty, apart from a bill for the monkey\'s rent.', effects: {} } },
          { label: 'Open the big crate (50%)', chance: 0.5,
            win: { text: 'Packing straw, and in the straw something very good.', effects: { item: 'any', minRarity: 3 } },
            lose: { text: 'A spring-loaded gnocco punches you in the face. -18 HP.', effects: { hp: -18 }, death: 'a crate' } },
          { label: 'Open the ticking crate', text: 'It stops ticking when you open it. The card inside is cursed and very strong, and there is gold under it. (A cursed card and 30 gold.)', effects: { cursed: true, gold: 30 } },
        ] },
      { id: 'spa', title: 'Sloth Spa',
        text: 'Under a waterfall of warm olive oil, a family of sloths runs a very slow spa. The menu has two items and took them a week to write.',
        choices: [
          { label: 'The full treatment (30 gold)', cost: 30, text: 'It takes hours. It is worth it. +40 HP.', effects: { hp: 40 } },
          { label: 'Just a quick dip', text: 'There is no such thing as a quick dip here. +15 HP, -5 gold for the towel.', effects: { hp: 15, gold: -5 } },
          { label: 'Ask about a job', chance: 0.6,
            win: { text: 'They pay you in advance, very slowly. +45 gold.', effects: { gold: 45 } },
            lose: { text: 'You fall asleep on shift. Nobody notices for a day. Nothing happens.', effects: {} } },
        ] },
    ],
    groups: [
      { from: 0, list: [['fungo', 'fungo'], ['rana', 'rana'], ['pappagallo', 'pappagallo', 'pappagallo'], ['rana', 'scimmia'], ['fungo', 'pappagallo']] },
      { from: 3, list: [['fungo', 'fungo', 'fungo'], ['rana', 'rana', 'scimmia'], ['pappagallo', 'pappagallo', 'pappagallo', 'pappagallo'], ['fungo', 'rana', 'scimmia'], ['rana', 'fungo', 'scimmia', 'scimmia'], ['pappagallo', 'fungo', 'pappagallo']] },
      { from: 6, list: [['fungo', 'fungo', 'fungo', 'scimmia'], ['rana', 'rana', 'rana', 'scimmia'], ['pappagallo', 'pappagallo', 'pappagallo', 'scimmia', 'scimmia'], ['fungo', 'rana', 'pappagallo', 'scimmia'], ['rana', 'fungo', 'rana', 'fungo']] },
    ],
  },
];

if (typeof module !== 'undefined') module.exports = { ENEMIES, ZONES, ENCHANTMENTS, scaledEnemy, enchantDef, rollEnchantments };
