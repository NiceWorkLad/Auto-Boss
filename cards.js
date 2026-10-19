// Cards: a second loot type that shapes the auto-fight. You keep every card you find (the collection)
// and switch some of them on before each fight (the board: as many as you have card slots).
// Cards are data: a type, a rarity, one or two tags, readable text, an effect and (for pacts and every
// legendary) a drawback. applyCards() compiles a board into the hero a fight uses; the fight engine in
// rules.js runs the triggers and summons. Shared with run.js and balance.js.
// One-use cards (type oneuse) never go on the board: you spend them (use, see run.js useCard).
// Cursed cards (type cursed) have a curse instead of a drawback: { text, stats, grow, cleanse }. A
// growing curse adds grow.stats for every fight you've held the card (up to grow.cap); a curse with
// cleanse: true can be paid off at a shop or the merchant, and Holy Seawater cleanses any curse.
//
// effect / drawback keys:
//   stats:   stat changes. Hero: maxHp armour dodge crit critx aps dmg regen shield lifesteal thorns
//            (aps and dmg multiply with every other bonus; armour is shield HP, see armourHp in rules.js)
//            pierce, taken (+share of damage taken), delay (seconds before your first attack), maxHpMult.
//            Run: gold (+share), goldFight (flat per won fight), winHealMult, postHealShare.
//   perTag:  { tag, stats }: those stats once for every card on the board with that tag (this one too).
//   perCard: stats once for every card on the board.
//   trigger: { on, do, chance, cd, once, every, first, below, unit }. on: hit, crit, kill, hurt, low
//            (HP drops below `below`), every (N seconds), start, allyDeath. do: one effect or a list:
//            zap { dmg, type, to: target|all|random|attacker, n }, heal { amount | share },
//            shield { amount | share }, summon { unit, count }, buff { aps, dmg, time }, gold { amount }.
//   summon:  { unit, count }: allies from SUMMON_UNITS that join every fight.
//   multi:   echo (trigger cards fire this many extra times), summonHp, summonDmg, trigCd (cooldowns
//            and timers scale by this).
// Damage from cards and summons' HP and damage grow with the row you're on (CARD_RULES.rowScale).

const CARD_RULES = {
  startSlots: 3, maxSlots: 6,          // one more slot after each elite you beat
  star: 1.5,                           // an upgraded (★) card's effect numbers; drawbacks stay as they are
  rowScale: 0.08, summonRowScale: 0.05,
  prices: [35, 60, 95, 150, 240],      // shop prices by rarity (the merchant adds its markup)
  offer: { treasure: 0.5 },            // chance that one of a chest's three offers is a card
  draw: 3,                             // cards to choose from in a draw (after every won fight)
  // how often each type turns up, within a rarity: boosts are the everyday card, triggers rare
  typeWeight: { boost: 3, pact: 2, summon: 2, oneuse: 2, multiplier: 1.5, trigger: 1, cursed: 1 },
  cleanse: [30, 45, 70, 100, 140],     // gold to pay off a curse at a shop, by rarity (the merchant adds its markup)
  maxAllies: 5,
};

const CARD_TAGS = {
  Gull: { color: '#e8eef2' }, Tide: { color: '#29a8ff' }, Spark: { color: '#ffe14d' },
  Gold: { color: '#ffb020' }, Brainrot: { color: '#ff2bd6' }, Concrete: { color: '#9aa3ad' },
};
const CARD_TYPES = {
  boost: { name: 'Boost', icon: 'cardBoost' }, pact: { name: 'Pact', icon: 'cardPact' }, trigger: { name: 'Trigger', icon: 'cardTrigger' },
  summon: { name: 'Summon', icon: 'cardSummon' }, multiplier: { name: 'Multiplier', icon: 'cardMulti' },
  oneuse: { name: 'One-use', icon: 'cardOneuse' }, cursed: { name: 'Cursed', icon: 'cardCursed' },
};
// Three cards that share a tag switch on that tag's set bonus.
const SET_BONUSES = {
  Gull: { text: 'Gull set: one more Union Gull joins every fight', effect: { summon: { unit: 'gull', count: 1 } } },
  Tide: { text: 'Tide set: heal 6% of max HP after every win', effect: { stats: { postHealShare: 0.06 } } },
  Spark: { text: 'Spark set: trigger cooldowns and timers 25% faster', effect: { multi: { trigCd: 0.75 } } },
  Gold: { text: 'Gold set: +25% gold', effect: { stats: { gold: 0.25 } } },
  Brainrot: { text: 'Brainrot set: +6% crit chance and +0.4× crit damage', effect: { stats: { crit: 0.06, critx: 0.4 } } },
  Concrete: { text: `Concrete set: +${armourHp(1)} armour and +10 max HP`, effect: { stats: { armour: 1, maxHp: 10 } } },
};

// Allies that fight beside you. Enemies' basic attacks can hit them; taunt makes that likelier.
const SUMMON_UNITS = {
  gull: { name: 'Union Gull', art: 'seagull', hp: 4, dmg: 1, aps: 1.1, type: 'pierce', acc: 0.5 },
  crab: { name: 'Crab Intern', art: 'crab', hp: 8, dmg: 1.3, aps: 0.7, type: 'blunt', armour: 1, taunt: 1.2 },
  coconut: { name: 'Coconut Bro', art: 'coconut', hp: 6, dmg: 1.5, aps: 0.7, type: 'slash', healHero: 0.4 },
  jelly: { name: 'Backing Jelly', art: 'jelly', hp: 4, dmg: 0.5, aps: 0.7, type: 'sonic', area: true },
  bean: { name: 'Chicco Sprintino', art: 'bean', hp: 4, dmg: 1, aps: 1.8, type: 'slash', acc: 0.7 },
  banana: { name: 'Banana Intern', art: 'banana', hp: 7, dmg: 1.2, aps: 0.8, type: 'blunt' },
  polpetto: { name: 'Polpettino', art: 'polpetto', hp: 14, dmg: 2.4, aps: 0.9, type: 'blunt', taunt: 1.5 },
  bigcrab: { name: 'Concrete Crab', art: 'crab', hp: 60, dmg: 1.5, aps: 0.6, type: 'blunt', armour: 2, taunt: 3 },    // the Concrete Exosuit's bodyguard
};

const CARDS = {
  // ---- Boosts: straight stat gains ----
  factor9000: { name: 'Factor 9000', rarity: 0, type: 'boost', tags: ['Tide'],
    text: 'Start every fight with an 8 HP shield.', effect: { stats: { shield: 8 } } },
  crabGym: { name: 'Crab Gym Membership', rarity: 0, type: 'boost', tags: ['Concrete'],
    text: '+9 max HP. The crabs spot you. Badly.', effect: { stats: { maxHp: 9 } } },
  espressoShot: { name: 'Espresso Shot', rarity: 0, type: 'boost', tags: ['Brainrot'],
    text: '+8% attack speed. One espresso, zero hesitation.', effect: { stats: { aps: 0.08 } } },
  luckyLira: { name: 'Lucky Lira', rarity: 0, type: 'boost', tags: ['Gold'],
    text: '+8% crit chance and +15% gold.', effect: { stats: { crit: 0.08, gold: 0.15 } } },
  tamburello: { name: 'Tamburello Tempo', rarity: 1, type: 'boost', tags: ['Brainrot'],
    text: '+10% damage. Ba-dum. Ba-dum. Ba-dum.', effect: { stats: { dmg: 0.1 } } },
  pyramid: { name: 'Pyramid Scheme', rarity: 1, type: 'boost', tags: ['Gold'],
    text: '+5 gold per won fight for every Gold card you own, this one included, and +5% crit chance.', effect: { stats: { crit: 0.05 }, perTag: { tag: 'Gold', stats: { goldFight: 5 } } } },
  concreteShoes: { name: 'Concrete Shoes', rarity: 2, type: 'boost', tags: ['Concrete'],
    text: `+7 max HP and +${armourHp(0.2)} armour. You are not going anywhere.`, effect: { stats: { armour: 0.2, maxHp: 7 } } },
  flamingoFootwork: { name: 'Flamingo Footwork', rarity: 2, type: 'boost', tags: ['Tide', 'Brainrot'],
    text: '+5% dodge and +5% attack speed. Fettuccina approves.', effect: { stats: { dodge: 0.05, aps: 0.05 } } },

  // ---- Pacts: a big upside with a drawback you can plan around ----
  gelato: { name: 'Gelato Brain Freeze', rarity: 1, type: 'pact', tags: ['Brainrot'],
    text: '+40% attack speed.', effect: { stats: { aps: 0.4 } },
    drawback: { text: 'You start attacking 2.5 seconds late in every fight.', stats: { delay: 2.5 } } },
  taxHaven: { name: 'Tax Haven', rarity: 1, type: 'pact', tags: ['Gold'],
    text: '+35% gold, +8 gold per won fight and +6% crit chance.', effect: { stats: { gold: 0.35, goldFight: 8, crit: 0.06 } },
    drawback: { text: '-6 max HP.', stats: { maxHp: -6 } } },
  sharkLoan: { name: 'Shark Loan', rarity: 2, type: 'pact', tags: ['Tide'],
    text: '+30% damage.', effect: { stats: { dmg: 0.3 } },
    drawback: { text: 'You take 20% more damage. The shark collects.', stats: { taken: 0.2 } } },
  cementDiet: { name: 'Cement Mixer Diet', rarity: 2, type: 'pact', tags: ['Concrete'],
    text: `+${armourHp(1.5)} armour and +8 max HP.`, effect: { stats: { armour: 1.5, maxHp: 8 } },
    drawback: { text: '-25% attack speed.', stats: { aps: -0.25 } } },
  sugarRush: { name: 'Banana Sugar Rush', rarity: 3, type: 'pact', tags: ['Brainrot'],
    text: '+10% damage and +6% attack speed.', effect: { stats: { dmg: 0.1, aps: 0.06 } },
    drawback: { text: 'You heal half as much after each win.', stats: { winHealMult: 0.5 } } },
  pianissimoContract: { name: 'Pianissimo Contract', rarity: 4, type: 'pact', tags: ['Brainrot', 'Gold'],
    text: '+35% damage and +10% crit chance. Signed in ink, by tentacle.', effect: { stats: { dmg: 0.35, crit: 0.1 } },
    drawback: { text: '-30% max HP.', stats: { maxHpMult: 0.7 } } },

  // ---- Triggers: whenever X, do Y ----
  staticCling: { name: 'Static Cling', rarity: 0, type: 'trigger', tags: ['Spark'],
    text: 'On hit: 35% chance to zap the target for 5 sonic (every 1.5s at most).',
    effect: { trigger: { on: 'hit', chance: 0.35, cd: 1.5, do: { kind: 'zap', dmg: 5, type: 'sonic', to: 'target' } } } },
  critConfetti: { name: 'Crit Confetti', rarity: 0, type: 'trigger', tags: ['Brainrot'],
    text: 'On crit: heal 3 HP.', effect: { trigger: { on: 'crit', cd: 0.3, do: { kind: 'heal', amount: 3 } } } },
  bounty: { name: 'Bounty Hunter', rarity: 0, type: 'trigger', tags: ['Gold'],
    text: 'On kill: gain 2 gold and heal 2 HP.', effect: { trigger: { on: 'kill', do: [{ kind: 'gold', amount: 2 }, { kind: 'heal', amount: 2 }] } } },
  whistle: { name: 'Seagull Whistle', rarity: 0, type: 'trigger', tags: ['Gull'],
    text: 'Every 16s (first at 8s): a Union Gull joins the fight.',
    effect: { trigger: { on: 'every', every: 16, first: 8, do: { kind: 'summon', unit: 'gull', count: 1 } } } },
  coconutInsurance: { name: 'Coconut Insurance', rarity: 1, type: 'trigger', tags: ['Tide'],
    text: 'The first time you drop below 25% HP in a fight, gain a shield of 12% of max HP.',
    effect: { trigger: { on: 'low', below: 0.25, once: true, do: { kind: 'shield', share: 0.12 } } } },
  thunderClap: { name: 'Thunder Clapback', rarity: 1, type: 'trigger', tags: ['Spark'],
    text: 'Every 6s: 5 magic damage to every enemy.', effect: { trigger: { on: 'every', every: 6, do: { kind: 'zap', dmg: 5, type: 'magic', to: 'all' } } } },
  spiteMortar: { name: 'Spite Mortar', rarity: 1, type: 'trigger', tags: ['Concrete'],
    text: 'When hit: 20% chance to lob 10 explosive back at the attacker (every 3s at most).',
    effect: { trigger: { on: 'hurt', chance: 0.2, cd: 3, do: { kind: 'zap', dmg: 10, type: 'explosive', to: 'attacker' } } } },
  openingAct: { name: 'Opening Act', rarity: 2, type: 'trigger', tags: ['Spark'],
    text: 'At the start of each fight: 8 sonic to every enemy.',
    effect: { trigger: { on: 'start', do: { kind: 'zap', dmg: 8, type: 'sonic', to: 'all' } } } },
  lastLap: { name: 'Last Lap', rarity: 2, type: 'trigger', tags: ['Tide'],
    text: 'The first time you drop below 35% HP in a fight: +30% attack speed for the rest of it.',
    effect: { trigger: { on: 'low', below: 0.35, once: true, do: { kind: 'buff', aps: 0.3, time: 999 } } } },
  frenzy: { name: 'Brainrot Frenzy', rarity: 2, type: 'trigger', tags: ['Brainrot'],
    text: 'On kill: +30% damage for 4s.', effect: { trigger: { on: 'kill', do: { kind: 'buff', dmg: 0.3, time: 4 } } } },
  chainLightning: { name: 'Chain Lightning', rarity: 3, type: 'trigger', tags: ['Spark'],
    text: 'On hit: 30% chance to arc 6 magic into 2 random enemies (every 5s at most).',
    effect: { trigger: { on: 'hit', chance: 0.3, cd: 5, do: { kind: 'zap', dmg: 6, type: 'magic', to: 'random', n: 2 } } } },

  // ---- Summons: allies with their own HP, damage and sprite ----
  crabIntern: { name: 'Crab Intern', rarity: 0, type: 'summon', tags: ['Concrete'],
    text: 'A Crab Intern joins every fight: tough, armoured, and it draws fire.', effect: { summon: { unit: 'crab', count: 1 } } },
  unionRep: { name: 'Seagull Union Rep', rarity: 1, type: 'summon', tags: ['Gull', 'Gold'],
    text: 'A Union Gull joins every fight. Whenever a gull dies, gain 3 gold.',
    effect: { summon: { unit: 'gull', count: 1 }, trigger: { on: 'allyDeath', unit: 'gull', do: { kind: 'gold', amount: 3 } } } },
  coconutBro: { name: 'Coconut Bro', rarity: 2, type: 'summon', tags: ['Tide'],
    text: 'A Coconut Bro joins every fight. Its hits heal you for 60% of the damage.', effect: { summon: { unit: 'coconut', count: 1 } } },
  backingBand: { name: 'Jellyfish Backing Band', rarity: 3, type: 'summon', tags: ['Spark'],
    text: 'Two Backing Jellies join every fight, humming sonic damage into every enemy.', effect: { summon: { unit: 'jelly', count: 2 } },
    drawback: { text: '-5% max HP. The band eats first.', stats: { maxHpMult: 0.95 } } },
  uprising: { name: 'Gabbiano Uprising', rarity: 4, type: 'summon', tags: ['Gull'],
    text: 'Four Union Gulls join every fight. The beach belongs to the workers.', effect: { summon: { unit: 'gull', count: 4 } },
    drawback: { text: 'Your own weapon deals 15% less damage. You are management now.', stats: { dmg: -0.15 } } },

  // ---- Multipliers: make other cards better ----
  loadBearing: { name: 'Load-Bearing Wall', rarity: 1, type: 'multiplier', tags: ['Concrete'],
    text: `+3 max HP and +${armourHp(0.25)} armour for every Concrete card you own, this one included.`, effect: { perTag: { tag: 'Concrete', stats: { armour: 0.25, maxHp: 3 } } } },
  unionDues: { name: 'Union Dues', rarity: 2, type: 'multiplier', tags: ['Gull'],
    text: 'Your summons get +80% HP and +80% damage, and +6 max HP for you.', effect: { multi: { summonHp: 0.8, summonDmg: 0.8 }, stats: { maxHp: 6 } } },
  hypeMan: { name: 'Hype Man', rarity: 2, type: 'multiplier', tags: ['Brainrot'],
    text: '+3% damage for every card on your board, this one included.', effect: { perCard: { dmg: 0.03 } } },
  echoPedal: { name: 'Echo Pedal', rarity: 3, type: 'multiplier', tags: ['Spark'],
    text: 'Your Trigger cards fire twice. +5% damage.', effect: { multi: { echo: 1 }, stats: { dmg: 0.05 } } },
  hourglass: { name: "Nonna Seppia's Hourglass", rarity: 4, type: 'multiplier', tags: ['Spark', 'Tide'],
    text: 'Trigger cooldowns and timers run twice as fast, and +15% attack speed.', effect: { multi: { trigCd: 0.5 }, stats: { aps: 0.15 } },
    drawback: { text: '-10% max HP. Time is heavy.', stats: { maxHpMult: 0.9 } } },

  // ======== The rest of the pool ========
  // ---- more Boosts ----
  antiGull: { name: 'Anti-Gull Netting', rarity: 0, type: 'boost', tags: ['Gull'],
    text: '+40% damage against flying enemies.', effect: { stats: { vsFlying: 0.4 } } },
  canOpener: { name: 'Can Opener Deluxe', rarity: 0, type: 'boost', tags: ['Concrete'],
    text: '+20% damage against armoured enemies and +1 armour pierce.', effect: { stats: { vsArmour: 0.2, pierce: 1 } } },
  bubblePopper: { name: 'Bubble Popper', rarity: 0, type: 'boost', tags: ['Tide'],
    text: '+30% damage against shielded enemies.', effect: { stats: { vsShield: 0.3 } } },
  bigShades: { name: 'Big Sunglasses', rarity: 0, type: 'boost', tags: ['Brainrot'],
    text: '+4% dodge and +4% crit chance. Nobody can see where you are looking.', effect: { stats: { dodge: 0.04, crit: 0.04 } } },
  urchinPants: { name: 'Urchin Pants', rarity: 0, type: 'boost', tags: ['Concrete'],
    text: 'Deal 2 damage back to whoever hits you.', effect: { stats: { thorns: 2 } } },
  homingPigeon: { name: 'Homing Pigeon', rarity: 1, type: 'boost', tags: ['Gull'],
    text: '+25% damage against evasive enemies.', effect: { stats: { vsEvasive: 0.25 } } },
  crowdSurfer: { name: 'Crowd Surfer', rarity: 1, type: 'boost', tags: ['Brainrot'],
    text: '+15% damage while two or more enemies stand.', effect: { stats: { vsGroup: 0.15 } } },
  lifeguardShift: { name: 'Lifeguard Shift', rarity: 1, type: 'boost', tags: ['Tide'],
    text: 'Regenerate 0.6 HP a second.', effect: { stats: { regen: 0.6 } } },
  leechScreen: { name: 'Leech Sunscreen', rarity: 2, type: 'boost', tags: ['Tide'],
    text: '4% lifesteal. It moisturises. It also drinks.', effect: { stats: { lifesteal: 0.04 } } },
  espressoDrip: { name: 'Espresso IV Drip', rarity: 2, type: 'boost', tags: ['Brainrot'],
    text: '+9% attack speed and +4 max HP.', effect: { stats: { aps: 0.09, maxHp: 4 } } },
  goldTooth: { name: 'Gold Tooth', rarity: 2, type: 'boost', tags: ['Gold'],
    text: '+4% damage for every 25 gold you carry into a fight (up to +20%).', effect: { stats: { goldDmg: 0.04, goldDmgMax: 0.2 } } },
  sandFortress: { name: 'Sandcastle Fortress', rarity: 3, type: 'boost', tags: ['Concrete'],
    text: `+${armourHp(0.3)} armour, +6 max HP and +3% attack speed. It has a moat.`, effect: { stats: { armour: 0.3, maxHp: 6, aps: 0.03 } } },

  // ---- more Pacts ----
  glassJaw: { name: 'Glass Jaw', rarity: 1, type: 'pact', tags: ['Brainrot'],
    text: '+12% crit chance and +0.4× crit damage.', effect: { stats: { crit: 0.12, critx: 0.4 } },
    drawback: { text: 'You take 15% more damage.', stats: { taken: 0.15 } } },
  bradipo: { name: 'Bradipo Mode', rarity: 1, type: 'pact', tags: ['Tide'],
    text: '+50% damage. Every hit is a whole event.', effect: { stats: { dmg: 0.5 } },
    drawback: { text: '-25% attack speed.', stats: { aps: -0.25 } } },
  concreteLungs: { name: 'Concrete Lungs', rarity: 1, type: 'pact', tags: ['Concrete'],
    text: `+${armourHp(1)} armour.`, effect: { stats: { armour: 1 } },
    drawback: { text: '-4% dodge and -15% attack speed.', stats: { dodge: -0.04, aps: -0.15 } } },
  allInLira: { name: 'All-In Lira', rarity: 2, type: 'pact', tags: ['Gold'],
    text: '+40% gold, +10 gold per won fight and +6 max HP.', effect: { stats: { gold: 0.4, goldFight: 10, maxHp: 6 } },
    drawback: { text: '-5% damage. You are thinking about money.', stats: { dmg: -0.05 } } },
  noShirt: { name: 'No Shirt, No Shoes', rarity: 2, type: 'pact', tags: ['Brainrot', 'Tide'],
    text: '+12% dodge and +10% attack speed.', effect: { stats: { dodge: 0.12, aps: 0.1 } },
    drawback: { text: '-15 max HP. No service.', stats: { maxHp: -15 } } },
  bloodSand: { name: 'Blood Sand', rarity: 2, type: 'pact', tags: ['Tide'],
    text: '6% lifesteal.', effect: { stats: { lifesteal: 0.06 } },
    drawback: { text: 'You heal 80% less after each win.', stats: { winHealMult: 0.2 } } },
  cursedGelato: { name: 'Cursed Gelato', rarity: 3, type: 'pact', tags: ['Brainrot'],
    text: '+50% attack speed and +8% damage.', effect: { stats: { aps: 0.5, dmg: 0.08 } },
    drawback: { text: 'You start attacking 3 seconds late.', stats: { delay: 3 } } },
  sharkBet: { name: 'Shark Bet', rarity: 4, type: 'pact', tags: ['Gold'],
    text: '+60% gold, +15 gold per won fight and +15% damage.', effect: { stats: { gold: 0.6, goldFight: 15, dmg: 0.15 } },
    drawback: { text: 'You take 25% more damage. The house always wins.', stats: { taken: 0.25 } } },
  pelicanManifesto: { name: 'Pelican Manifesto', rarity: 4, type: 'pact', tags: ['Brainrot', 'Spark'],
    text: '+30% attack speed and +20% damage.', effect: { stats: { aps: 0.3, dmg: 0.2 } },
    drawback: { text: '-15% max HP, and you start attacking 1.5 seconds late.', stats: { maxHpMult: 0.85, delay: 1.5 } } },

  // ---- more Triggers ----
  soundcheck: { name: 'Soundcheck', rarity: 0, type: 'trigger', tags: ['Spark'],
    text: 'At the start of each fight: 6 sonic to every enemy. One, two, one, two.',
    effect: { trigger: { on: 'start', do: { kind: 'zap', dmg: 6, type: 'sonic', to: 'all' } } } },
  diveBomb: { name: 'Dive Bomb', rarity: 0, type: 'trigger', tags: ['Gull'],
    text: 'On kill: a gull dive-bombs a random enemy for 9 pierce.',
    effect: { trigger: { on: 'kill', do: { kind: 'zap', dmg: 9, type: 'pierce', to: 'random', n: 1 } } } },
  bubbleBounce: { name: 'Bubble Bounce', rarity: 0, type: 'trigger', tags: ['Tide'],
    text: 'When you dodge: gain a 5 HP shield.', effect: { trigger: { on: 'dodge', do: { kind: 'shield', amount: 5 } } } },
  shellGame: { name: 'Shell Game', rarity: 0, type: 'trigger', tags: ['Concrete'],
    text: 'Every 9s: gain a 6 HP shield.', effect: { trigger: { on: 'every', every: 9, do: { kind: 'shield', amount: 6 } } } },
  tipJar: { name: 'Tip Jar', rarity: 0, type: 'trigger', tags: ['Gold'],
    text: 'On kill: gain 1 gold and heal 2 HP. The seagulls tip well.',
    effect: { trigger: { on: 'kill', do: [{ kind: 'gold', amount: 1 }, { kind: 'heal', amount: 2 }] } } },
  shimmy: { name: 'Counter Shimmy', rarity: 1, type: 'trigger', tags: ['Brainrot'],
    text: 'When you dodge: hit the attacker back for 8 slash.', effect: { trigger: { on: 'dodge', do: { kind: 'zap', dmg: 8, type: 'slash', to: 'attacker' } } } },
  critEncore: { name: 'Crit Encore', rarity: 1, type: 'trigger', tags: ['Spark'],
    text: 'On crit: echo 60% of your weapon hit into the same target (every 0.8s at most).',
    effect: { trigger: { on: 'crit', cd: 0.8, do: { kind: 'zap', share: 0.6, to: 'target' } } } },
  turningTide: { name: 'Turning Tide', rarity: 1, type: 'trigger', tags: ['Tide'],
    text: 'Every 7s: heal 4 HP.', effect: { trigger: { on: 'every', every: 7, do: { kind: 'heal', amount: 4 } } } },
  nutcracker: { name: 'Nutcracker', rarity: 1, type: 'trigger', tags: ['Concrete'],
    text: 'On hit: 25% chance to knock 0.5 armour off the target for the rest of the fight (every 1s at most).',
    effect: { trigger: { on: 'hit', chance: 0.25, cd: 1, do: { kind: 'sunder', amount: 0.5 } } } },
  slotMachine: { name: 'Slot Machine', rarity: 1, type: 'trigger', tags: ['Gold'],
    text: '+4% crit chance. On kill: 25% chance to win 6 gold.', effect: { stats: { crit: 0.04 }, trigger: { on: 'kill', chance: 0.25, do: { kind: 'gold', amount: 6 } } } },
  fireworks: { name: 'Ferragosto Fireworks', rarity: 1, type: 'trigger', tags: ['Spark'],
    text: 'Every 10s: 9 explosive into 2 random enemies.', effect: { trigger: { on: 'every', every: 10, do: { kind: 'zap', dmg: 9, type: 'explosive', to: 'random', n: 2 } } } },
  espressoCapoeira: { name: 'Espresso Capoeira', rarity: 2, type: 'trigger', tags: ['Brainrot'],
    text: 'When hit: 20% chance of +40% attack speed for 2.5s (every 5s at most).',
    effect: { trigger: { on: 'hurt', chance: 0.2, cd: 5, do: { kind: 'buff', aps: 0.4, time: 2.5 } } } },
  freezeRay: { name: 'Gelato Freeze Ray', rarity: 2, type: 'trigger', tags: ['Tide'],
    text: "Every 8s: chill every enemy, pushing its next attack back 1 second.",
    effect: { trigger: { on: 'every', every: 8, first: 4, do: { kind: 'chill', time: 1 } } } },
  panicTide: { name: 'Low Tide Panic', rarity: 2, type: 'trigger', tags: ['Tide'],
    text: 'The first time you drop below 50% HP in a fight: heal 10% of max HP.',
    effect: { trigger: { on: 'low', below: 0.5, once: true, do: { kind: 'heal', share: 0.1 } } } },
  killStreak: { name: 'Kill Streak', rarity: 2, type: 'trigger', tags: ['Brainrot'],
    text: 'On kill: +10% crit chance for 6s.', effect: { trigger: { on: 'kill', do: { kind: 'buff', crit: 0.1, time: 6 } } } },
  gullReunion: { name: 'Gull Reunion', rarity: 2, type: 'trigger', tags: ['Gull'],
    text: 'A Union Gull joins every fight. When an ally dies, another flies in (every 5s at most).',
    effect: { summon: { unit: 'gull', count: 1 }, trigger: { on: 'allyDeath', cd: 5, do: { kind: 'summon', unit: 'gull', count: 1 } } } },
  lightningRod: { name: 'Lightning Rod', rarity: 3, type: 'trigger', tags: ['Spark'],
    text: 'When hit: 20% chance to call down 6 magic on every enemy (every 5s at most).',
    effect: { trigger: { on: 'hurt', chance: 0.2, cd: 5, do: { kind: 'zap', dmg: 6, type: 'magic', to: 'all' } } } },
  lastStand: { name: 'Last Stand', rarity: 3, type: 'trigger', tags: ['Concrete'],
    text: 'The first time you drop below 30% HP in a fight: +25% damage for the rest of it.',
    effect: { trigger: { on: 'low', below: 0.3, once: true, do: { kind: 'buff', dmg: 0.25, time: 999 } } } },

  // ---- more Summons ----
  jellyRoadie: { name: 'Jelly Roadie', rarity: 0, type: 'summon', tags: ['Spark'],
    text: 'A Backing Jelly joins every fight and hums sonic into every enemy.', effect: { summon: { unit: 'jelly', count: 1 } } },
  chiccoSprintino: { name: 'Chicco Sprintino', rarity: 1, type: 'summon', tags: ['Brainrot'],
    text: 'A tiny, very fast coffee bean in a sweatband joins every fight. It has had six espressos.', effect: { summon: { unit: 'bean', count: 1 } } },
  bananaInterns: { name: 'Banana Interns', rarity: 1, type: 'summon', tags: ['Gold'],
    text: 'A Banana Intern joins every fight. When it goes down, it drops 3 gold. Bananito takes a cut.',
    effect: { summon: { unit: 'banana', count: 1 }, trigger: { on: 'allyDeath', unit: 'banana', do: { kind: 'gold', amount: 3 } } } },
  crabLocal: { name: 'Crab Union Local 9', rarity: 2, type: 'summon', tags: ['Concrete'],
    text: 'A Crab Intern joins every fight, and another every 20s. They have a grievance and it is you, the enemy.', effect: { summon: { unit: 'crab', count: 1 }, trigger: { on: 'every', every: 20, first: 20, do: { kind: 'summon', unit: 'crab', count: 1 } } } },
  flock: { name: 'Flock Mentality', rarity: 2, type: 'summon', tags: ['Gull'],
    text: 'Every 16s (first at 6s): a Union Gull joins the fight.',
    effect: { trigger: { on: 'every', every: 16, first: 6, do: { kind: 'summon', unit: 'gull', count: 1 } } } },
  coconutTwins: { name: 'Coconut Twins', rarity: 3, type: 'summon', tags: ['Tide'],
    text: 'A Coconut Bro joins every fight, and a second at 15s. Their hits heal you.', effect: { summon: { unit: 'coconut', count: 1 }, trigger: { on: 'every', every: 999, first: 15, do: { kind: 'summon', unit: 'coconut', count: 1 } } } },
  polpettino: { name: 'Polpettino', rarity: 4, type: 'summon', tags: ['Brainrot', 'Tide'],
    text: 'A baby octopus in a bow tie joins every fight. It hits hard and draws fire.', effect: { summon: { unit: 'polpetto', count: 1 } },
    drawback: { text: '-10% max HP. You carry it everywhere.', stats: { maxHpMult: 0.9 } } },

  // ---- more Multipliers ----
  unionMeeting: { name: 'Union Meeting', rarity: 1, type: 'multiplier', tags: ['Gull'],
    text: '+5 max HP for every Gull card you own, this one included.', effect: { perTag: { tag: 'Gull', stats: { maxHp: 5 } } } },
  tideTable: { name: 'Tide Table', rarity: 1, type: 'multiplier', tags: ['Tide'],
    text: 'Regenerate 0.25 HP a second for every Tide card you own, this one included.', effect: { perTag: { tag: 'Tide', stats: { regen: 0.25 } } } },
  deckBuilder: { name: 'Deck Builder', rarity: 1, type: 'multiplier', tags: ['Brainrot'],
    text: '+2 max HP and +2% attack speed for every card on your board.', effect: { perCard: { maxHp: 2, aps: 0.02 } } },
  ampStack: { name: 'Amp Stack', rarity: 2, type: 'multiplier', tags: ['Spark'],
    text: 'Damage from your cards is 60% higher, and +6% damage.', effect: { multi: { zapDmg: 0.6 }, stats: { dmg: 0.06 } } },
  goldStandard: { name: 'Gold Standard', rarity: 2, type: 'multiplier', tags: ['Gold'],
    text: '+6% damage for every Gold card you own, this one included.', effect: { perTag: { tag: 'Gold', stats: { dmg: 0.06 } } } },
  sparkPlug: { name: 'Spark Plug', rarity: 2, type: 'multiplier', tags: ['Spark'],
    text: 'Trigger cooldowns and timers 20% faster, and +3% attack speed for every Spark card.', effect: { multi: { trigCd: 0.8 }, perTag: { tag: 'Spark', stats: { aps: 0.03 } } } },
  brainrotCore: { name: 'Brainrot Core', rarity: 3, type: 'multiplier', tags: ['Brainrot'],
    text: '+3% crit chance and +0.1× crit damage for every Brainrot card you own.', effect: { perTag: { tag: 'Brainrot', stats: { crit: 0.03, critx: 0.1 } } } },
  middleManagement: { name: 'Middle Management', rarity: 3, type: 'multiplier', tags: ['Gull', 'Gold'],
    text: 'Your summons get +100% HP and +60% damage, and a Union Gull joins every fight.', effect: { multi: { summonHp: 1, summonDmg: 0.6 }, summon: { unit: 'gull', count: 1 } } },

  // ---- One-use: spent from the collection, never on the board. use.kind: prime (its stats for the
  //      next fight only), heal, draw (n draws now), peek (see the next draw, reshuffle it once),
  //      discard (give up a card, draw one rarity higher), cleanse (lift any curse) ----
  doppio: { name: 'Doppio Espresso', rarity: 0, type: 'oneuse', tags: ['Spark'],
    text: 'One use: +30% attack speed in your next fight.', use: { kind: 'prime' }, effect: { stats: { aps: 0.3 } } },
  slather: { name: 'Sunscreen Slather', rarity: 0, type: 'oneuse', tags: ['Tide'],
    text: 'One use: start your next fight with a 40 HP shield.', use: { kind: 'prime' }, effect: { stats: { shield: 40 } } },
  gelatoBreak: { name: 'Gelato Break', rarity: 0, type: 'oneuse', tags: ['Tide'],
    text: 'One use: heal 25% of your max HP.', use: { kind: 'heal', share: 0.25 }, effect: {} },
  pepTalk: { name: 'Pep Talk from Nonna', rarity: 1, type: 'oneuse', tags: ['Brainrot'],
    text: 'One use: +35% damage in your next fight.', use: { kind: 'prime' }, effect: { stats: { dmg: 0.35 } } },
  luckyLira: { name: 'Lucky Lira', rarity: 1, type: 'oneuse', tags: ['Gold'],
    text: 'One use: +15% crit chance and +0.5× crit damage in your next fight.', use: { kind: 'prime' }, effect: { stats: { crit: 0.15, critx: 0.5 } } },
  bottle: { name: 'Message in a Bottle', rarity: 1, type: 'oneuse', tags: ['Tide'],
    text: 'One use: draw a card now.', use: { kind: 'draw', n: 1 }, effect: {} },
  teaLeaves: { name: 'Nonna Seppia\'s Tea Leaves', rarity: 1, type: 'oneuse', tags: ['Brainrot'],
    text: 'One use: see your next card draw now. Don\'t like it? Reshuffle it, once.', use: { kind: 'peek' }, effect: {} },
  tideSwap: { name: 'Tide Swap', rarity: 2, type: 'oneuse', tags: ['Tide'],
    text: 'One use: throw a card you own back to the sea and draw from cards one rarity higher.', use: { kind: 'discard' }, effect: {} },
  holySeawater: { name: 'Holy Seawater', rarity: 2, type: 'oneuse', tags: ['Tide'],
    text: 'One use: lift the curse off a cursed card for good. Its upside stays.', use: { kind: 'cleanse' }, effect: {} },
  doubleScoop: { name: 'Double Scoop', rarity: 3, type: 'oneuse', tags: ['Gold'],
    text: 'One use: draw two cards now, one after the other.', use: { kind: 'draw', n: 2 }, effect: {} },

  // ---- Cursed: a big upside and a curse that bites while the card is switched on ----
  devilGelato: { name: 'Devil\'s Gelato', rarity: 2, type: 'cursed', tags: ['Brainrot'],
    text: '+30% damage.', effect: { stats: { dmg: 0.3 } },
    curse: { text: '-25 max HP.', stats: { maxHp: -25 }, cleanse: true } },
  seagullMafia: { name: 'Seagull Mafia Contract', rarity: 2, type: 'cursed', tags: ['Gull'],
    text: '+45% attack speed.', effect: { stats: { aps: 0.45 } },
    curse: { text: 'You take 5% more damage, and 2% more for every fight you\'ve held this card (up to +35%).', stats: { taken: 0.05 }, grow: { stats: { taken: 0.02 }, cap: 15 } } },
  doubloon: { name: 'Cursed Doubloon', rarity: 1, type: 'cursed', tags: ['Gold'],
    text: '+50% gold and +12 gold per won fight.', effect: { stats: { gold: 0.5, goldFight: 12 } },
    curse: { text: '-1 max HP for every fight you\'ve held this card (up to -30).', stats: {}, grow: { stats: { maxHp: -1 }, cap: 30 } } },
  krakenLoan: { name: 'Kraken\'s Loan', rarity: 2, type: 'cursed', tags: ['Concrete'],
    text: `+25 max HP and +${armourHp(0.7)} armour.`, effect: { stats: { maxHp: 25, armour: 0.7 } },
    curse: { text: '-5 gold per won fight, and 1 more for every fight you\'ve held it (up to -20). Pay it back at a shop.', stats: { goldFight: -5 }, grow: { stats: { goldFight: -1 }, cap: 15 }, cleanse: true } },
  brainrotIdol: { name: 'Brainrot Idol', rarity: 3, type: 'cursed', tags: ['Brainrot'],
    text: '+15% crit chance and +0.8× crit damage.', effect: { stats: { crit: 0.15, critx: 0.8 } },
    curse: { text: 'You start attacking 3s late and lose 5% dodge.', stats: { delay: 3, dodge: -0.05 }, cleanse: true } },
  fisarmonica: { name: 'Haunted Fisarmonica', rarity: 3, type: 'cursed', tags: ['Spark'],
    text: 'Every 3s: 14 sonic damage to every enemy. It plays itself.', effect: { trigger: { on: 'every', every: 3, do: { kind: 'zap', dmg: 14, type: 'sonic', to: 'all' } } },
    curse: { text: '-15% attack speed. You can\'t hear yourself think.', stats: { aps: -0.15 } } },

  // ---- Event cards: only an event's choice hands these over (event: true keeps them out of every draw) ----
  gnoccoIdol: { name: 'Golden Gnocco', rarity: 3, type: 'boost', tags: ['Gold'], event: true,
    text: '+15% damage and +15 max HP, and heal 4% of max HP after every win. It hums.', effect: { stats: { dmg: 0.15, maxHp: 15, postHealShare: 0.04 } } },
  tarotTower: { name: 'The Tower', rarity: 3, type: 'pact', tags: ['Brainrot'], event: true,
    text: '+25% damage and +25% attack speed. Everything falls down eventually.', effect: { stats: { dmg: 0.25, aps: 0.25 } },
    drawback: { text: '-20 max HP.', stats: { maxHp: -20 } } },
  notarySeal: { name: 'Notarised Luck', rarity: 2, type: 'multiplier', tags: ['Spark'], event: true,
    text: 'Trigger cooldowns and timers run 30% faster, and +8% crit chance. Binding. Binding.', effect: { multi: { trigCd: 0.7 }, stats: { crit: 0.08 } } },
  pavoneAce: { name: 'Pavone\'s Ace', rarity: 3, type: 'boost', tags: ['Gold'], event: true,
    text: '+40% gold and +10% crit chance. It was up his sleeve the whole time.', effect: { stats: { gold: 0.4, crit: 0.1 } } },

  // ---- Class signature cards: only offered to that class ----
  ironBelly: { name: 'Iron Gelato Belly', rarity: 1, type: 'boost', tags: ['Concrete'], cls: 'bruiser',
    text: `Bruiser only. +10 max HP and +${armourHp(0.2)} armour.`, effect: { stats: { maxHp: 10, armour: 0.2 } } },
  haymaker: { name: 'Haymaker Habit', rarity: 2, type: 'trigger', tags: ['Brainrot'], cls: 'bruiser',
    text: 'Bruiser only. Every 6s: +45% damage for 1.5s.', effect: { trigger: { on: 'every', every: 6, first: 3, do: { kind: 'buff', dmg: 0.45, time: 1.5 } } } },
  insiderTrading: { name: 'Insider Trading', rarity: 2, type: 'boost', tags: ['Gold'], cls: 'hustler',
    text: 'Hustler only. +6 gold per won fight and +5% damage for every 25 gold you carry (up to +25%).', effect: { stats: { goldFight: 6, goldDmg: 0.05, goldDmgMax: 0.25 } } },
  pickpocket: { name: 'Pickpocket', rarity: 1, type: 'trigger', tags: ['Gold'], cls: 'hustler',
    text: 'Hustler only. +6% crit chance. On hit: 15% chance to lift 1 gold (every 1.5s at most).', effect: { stats: { crit: 0.06 }, trigger: { on: 'hit', chance: 0.15, cd: 1.5, do: { kind: 'gold', amount: 1 } } } },
  gearRack: { name: 'Gear Rack', rarity: 1, type: 'boost', tags: ['Concrete'], cls: 'roadie',
    text: 'Roadie only. +8% attack speed and +8 max HP.', effect: { stats: { aps: 0.08, maxHp: 8 } } },
  encoreRiff: { name: 'Encore Riff', rarity: 2, type: 'trigger', tags: ['Spark'], cls: 'roadie',
    text: 'Roadie only. On kill: echo 50% of your weapon hit into every enemy.', effect: { trigger: { on: 'kill', do: { kind: 'zap', share: 0.5, to: 'all' } } } },
  hairline: { name: 'Hairline Fracture', rarity: 3, type: 'pact', tags: ['Brainrot'], cls: 'glass',
    text: 'Glass Cannon only. +8% crit chance and +0.8× crit damage.', effect: { stats: { crit: 0.08, critx: 0.8 } },
    drawback: { text: 'You take 12% more damage.', stats: { taken: 0.12 } } },
  precision: { name: 'Precision Strike', rarity: 2, type: 'trigger', tags: ['Spark'], cls: 'glass',
    text: 'Glass Cannon only. On crit: +20% damage for 3s.', effect: { trigger: { on: 'crit', do: { kind: 'buff', dmg: 0.2, time: 3 } } } },
};
for (const id in CARDS) CARDS[id].id = id;

// What a card offer looks like next to items: { slot: 'card', id, rarity }.
const cardOffer = id => ({ slot: 'card', id, rarity: CARDS[id].rarity });

// A ★ copy of an effect: every number that helps you goes up by CARD_RULES.star. Multipliers below 1
// (cooldowns) shrink by the same share, whole counts (echo) round up, and summon units get the boost
// on their HP and damage instead of their count.
function starEffect(fx) {
  const S = CARD_RULES.star, num = v => Math.round(v * S * 1000) / 1000;
  const st = o => { const r = {}; for (const k in o) r[k] = MULT_STATS.includes(k) ? Math.round((1 + (o[k] - 1) * S) * 1000) / 1000 : k === 'delay' || k === 'taken' ? o[k] : num(o[k]); return r; };
  const out = { ...fx };
  if (fx.stats) out.stats = st(fx.stats);
  if (fx.perTag) out.perTag = { ...fx.perTag, stats: st(fx.perTag.stats) };
  if (fx.perCard) out.perCard = st(fx.perCard);
  if (fx.multi) { out.multi = {}; for (const m in fx.multi) out.multi[m] = m === 'trigCd' ? Math.round((1 - (1 - fx.multi[m]) * S) * 1000) / 1000 : m === 'echo' ? Math.ceil(fx.multi[m] * S) : num(fx.multi[m]); }
  if (fx.trigger) out.trigger = { ...fx.trigger, do: [].concat(fx.trigger.do).map(d => {
    const e = { ...d };
    for (const k of ['dmg', 'amount', 'share', 'aps']) if (typeof e[k] === 'number') e[k] = num(e[k]);
    if (e.kind === 'buff' && typeof e.dmg === 'number') e.dmg = num(d.dmg);
    if (e.kind === 'summon') e.star = true;
    return e;
  }) };
  if (fx.summon) out.summon = { ...fx.summon, star: true };
  return out;
}

// Cards a run can be offered: not already in the collection, and class cards only for their class.
const cardOk = run => c => !(run.owned || run.cards).includes(c.id) && (!c.cls || c.cls === run.cls) && !c.event;
// A random card of a rolled rarity from a loot table. A rarity with no card that passes the filter
// falls back a tier at a time, then up (cursed cards start at Uncommon), and only then to any card.
// Within a rarity the type decides how likely a card is (CARD_RULES.typeWeight).
function rollCard(rng, table, filter, rarity) {
  const r0 = rarity != null ? rarity : rollRarity(rng, table), ok = id => !filter || filter(CARDS[id]);
  for (const r of [0, 1, 2, 3, 4].map(d => r0 - d).concat([1, 2, 3, 4].map(d => r0 + d))) {
    const pool = Object.keys(CARDS).filter(id => CARDS[id].rarity === r && ok(id));
    if (pool.length) return cardOffer(pickWeighted(rng, pool));
  }
  return cardOffer(rng.pick(Object.keys(CARDS)));
}
function pickWeighted(rng, ids) {
  const w = id => CARD_RULES.typeWeight[CARDS[id].type] || 1;
  let x = rng.next() * ids.reduce((s, id) => s + w(id), 0);
  for (const id of ids) if ((x -= w(id)) < 0) return id;
  return ids[ids.length - 1];
}
// A cursed card's curse as it stands: grown by the fights it's been held, gone once cleansed.
// state: run.curses[id] ({ age, cleansed }).
function curseNow(c, state) {
  if (!c.curse || (state && state.cleansed)) return null;
  const g = c.curse.grow, age = g ? Math.min((state && state.age) || 0, g.cap) : 0, stats = { ...c.curse.stats };
  if (g) for (const k in g.stats) stats[k] = (stats[k] || 0) + g.stats[k] * age;
  return { text: c.curse.text, stats };
}

const MULT_STATS = ['maxHpMult', 'winHealMult'];
const RUN_STATS = ['gold', 'goldFight', 'winHealMult', 'postHealShare'];
function addStats(into, st, times) {
  for (const k in st) {
    if (MULT_STATS.includes(k)) into[k] = (into[k] == null ? 1 : into[k]) * Math.pow(st[k], times);
    else stack(into, k, st[k], times);         // attack speed and damage multiply (items.js)
  }
}
function tagCounts(ids) {
  const n = {};
  for (const id of ids) for (const t of CARDS[id].tags) n[t] = (n[t] || 0) + 1;
  return n;
}
const activeSets = ids => Object.entries(tagCounts(ids)).filter(([, n]) => n >= 3).map(([t]) => t);

// Everything a board adds up to. row scales card damage and summons; stars lists the upgraded cards.
// more: { curses (run.curses), primed (one-use cards spent on the next fight: their stats count, but
// not towards tags or per-card bonuses), hires (run.hires: allies bought at a shop) }.
function cardTotals(ids, row, stars, more) {
  ids = (ids || []).filter(id => CARDS[id]);
  stars = stars || []; more = more || {};
  // gear can add to summon and zap damage too (more.summonDmg, more.zapDmg)
  const stats = { maxHpMult: 1, winHealMult: 1 }, tags = tagCounts(ids), multi = { echo: 0, summonHp: more.summonHp || 0, summonDmg: more.summonDmg || 0, trigCd: 1, zapDmg: more.zapDmg || 0 };
  const triggers = [], summons = [], k = 1 + CARD_RULES.rowScale * Math.max(0, row || 0);
  const sources = ids.map(id => [CARDS[id], stars.includes(id) ? starEffect(CARDS[id].effect) : CARDS[id].effect, CARDS[id].drawback || curseNow(CARDS[id], (more.curses || {})[id])])
    .concat(activeSets(ids).map(t => [{ id: 'set' + t, name: t + ' set', type: 'set' }, SET_BONUSES[t].effect, null]))
    .concat((more.primed || []).filter(id => CARDS[id]).map(id => [CARDS[id], CARDS[id].effect, null]))
    .concat((more.hires || []).map(h => [{ id: 'hire', name: 'Hired help', type: 'hire' }, { summon: { unit: h.unit, count: 1 } }, null]));
  for (const [c, fx, dr] of sources) {
    for (const part of [fx, dr]) {
      if (!part) continue;
      if (part.stats) addStats(stats, part.stats, 1);
      if (part.perTag) addStats(stats, part.perTag.stats, tags[part.perTag.tag] || 0);
      if (part.perCard) addStats(stats, part.perCard, ids.length);
      if (part.multi) for (const m in part.multi) multi[m] = m === 'trigCd' ? multi[m] * part.multi[m] : multi[m] + part.multi[m];
    }
    if (fx.summon) summons.push({ ...fx.summon, from: c.id });
    if (fx.trigger) {
      const t = fx.trigger, list = [].concat(t.do).map(d => d.kind === 'zap' ? { ...d, dmg: Math.round(d.dmg * k * 10) / 10 } : { ...d });
      triggers.push({ ...t, do: list, id: c.id, name: c.name, echo: c.type === 'trigger' });
    }
  }
  const units = {};
  for (const u in SUMMON_UNITS) {
    const d = SUMMON_UNITS[u];
    const ks = 1 + CARD_RULES.summonRowScale * Math.max(0, row || 0);
    units[u] = { ...d, key: u, hp: Math.round(d.hp * ks * (1 + multi.summonHp)), dmg: Math.round(d.dmg * ks * (1 + multi.summonDmg) * 10) / 10 };
  }
  return { stats, tags, sets: activeSets(ids), multi, triggers, summons, units };
}
// One run-level stat from the board (gold, goldFight, winHealMult, postHealShare).
function cardStat(ids, k, stars, more) { const v = cardTotals(ids, 0, stars, more).stats[k]; return v == null ? (MULT_STATS.includes(k) ? 1 : 0) : v; }

// Fold a board into a compiled hero (from compileHero or baseHero). ctx: { row, hp }.
function applyCards(hero, ids, ctx) {
  ctx = ctx || {};
  const T = cardTotals(ids, ctx.row, ctx.stars, ctx), st = T.stats, m = hero.mods;
  hero.maxHp = Math.max(1, Math.round((hero.maxHp + (st.maxHp || 0)) * st.maxHpMult));
  hero.hp = Math.min(ctx.hp != null ? ctx.hp : hero.hp, hero.maxHp);
  hero.armour += st.armour || 0;
  hero.dodge = Math.min(0.6, hero.dodge + (st.dodge || 0));
  hero.crit += st.crit || 0; hero.critx += st.critx || 0;
  hero.regen += st.regen || 0; hero.shield += st.shield || 0;
  m.aps = Math.max(0.3, m.aps * (1 + (st.aps || 0)));
  m.dmg *= Math.max(0.2, 1 + (st.dmg || 0));
  m.lifesteal += st.lifesteal || 0; m.thorns += st.thorns || 0; m.pierce += st.pierce || 0;
  m.taken *= 1 + (st.taken || 0);
  hero.delay = (hero.delay || 0) + (st.delay || 0);
  for (const k in st) if (k.startsWith('vs')) { const t = k.slice(2).toLowerCase(); m.vs = { ...m.vs, [t === 'armoured' ? 'armour' : t]: ((m.vs || {})[t] || 0) + st[k] }; }
  if (st.goldDmg) m.dmg *= 1 + Math.min(st.goldDmgMax || 0.25, st.goldDmg * Math.floor((ctx.gold || 0) / 25));
  hero.cards = { list: (ids || []).slice(), stars: (ctx.stars || []).slice(), star: CARD_RULES.star, triggers: T.triggers, summons: T.summons, units: T.units, echo: T.multi.echo, trigCd: T.multi.trigCd, zapDmg: 1 + T.multi.zapDmg };
  return hero;
}

// Readable lines: type and tags, the text, the upgrade, then the drawback or curse (marked ⚠ and ☠).
// curse: the run's state for a cursed card ({ age, cleansed }).
function cardLines(id, starred, curse) {
  const c = CARDS[id], lines = [CARD_TYPES[c.type].name + ' · ' + c.tags.join(' / '), c.text];
  if (starred) lines.push('★ Upgraded: its numbers are ×' + CARD_RULES.star + (c.drawback || c.curse ? ' (the ' + (c.curse ? 'curse' : 'drawback') + ' is not)' : ''));
  if (c.drawback) lines.push('⚠ ' + c.drawback.text);
  if (c.curse) {
    if (curse && curse.cleansed) lines.push('✓ Cleansed: the curse is gone.');
    else {
      lines.push('☠ ' + c.curse.text + (c.curse.cleanse ? ' Can be cleansed at a shop.' : ''));
      if (c.curse.grow && curse) lines.push('☠ Held for ' + curse.age + ' fight' + (curse.age === 1 ? '' : 's') + (curse.age >= c.curse.grow.cap ? ': as bad as it gets' : ''));
    }
  }
  return lines;
}

// What a card will do in this particular fight, for the pre-fight screen. defs: the enemies.
function cardFightNote(id, defs, ids) {
  const c = CARDS[id], fx = c.effect, t = fx.trigger, notes = [];
  const typeNote = type => {
    const mults = defs.map(d => ((d.weak || {})[type] || 1) * ((d.resist || {})[type] || 1));
    const best = Math.max(...mults), worst = Math.min(...mults);
    if (worst < 1) return DAMAGE_TYPES[type].name.toLowerCase() + ' is resisted here (×' + worst + ')';
    if (best > 1) return DAMAGE_TYPES[type].name.toLowerCase() + ' hits a weakness here (×' + best + ')';
    return '';
  };
  if (t) for (const d of [].concat(t.do)) if (d.kind === 'zap') { const n = typeNote(d.type); if (n) notes.push(n); }
  if (t && t.on === 'kill') notes.push(defs.length + ' enem' + (defs.length > 1 ? 'ies' : 'y') + ' to start with' + (defs.some(d => (d.moves || []).some(m => m.kind === 'summon')) ? ', more on the way' : ''));
  if (fx.summon) {
    const u = SUMMON_UNITS[fx.summon.unit], n = typeNote(u.type);
    notes.push(fx.summon.count + '× ' + u.name + (n ? ', ' + n : ''));
  }
  const VS = { vsFlying: 'flying', vsArmour: 'armour', vsShield: 'shield', vsEvasive: 'evasive' };
  for (const k in VS) if (fx.stats && fx.stats[k]) { const n = defs.filter(d => (d.traits || {})[VS[k]]).length; notes.push(n ? n + ' ' + TRAITS[VS[k]].name.toLowerCase() + ' here' : 'nothing ' + TRAITS[VS[k]].name.toLowerCase() + ' here'); }
  if (fx.stats && fx.stats.vsGroup) notes.push(defs.length > 1 ? defs.length + ' enemies here' : 'a single enemy here');
  if (t && t.on === 'every') notes.push('fires about ' + Math.max(1, Math.floor(45 / t.every)) + '× in a 45s fight');
  if (fx.multi && fx.multi.echo) notes.push((ids || []).filter(x => CARDS[x].type === 'trigger').length + ' trigger cards to echo');
  return notes.join('; ');
}

if (typeof module !== 'undefined') module.exports = { curseNow, pickWeighted, starEffect, cardOk, CARD_RULES, CARD_TAGS, CARD_TYPES, SET_BONUSES, SUMMON_UNITS, CARDS, cardOffer, rollCard, tagCounts, activeSets, cardTotals, cardStat, applyCards, cardLines, cardFightNote };
