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
  // ---- Zone 3: Deserto Dolce ----
  scorpione: {
    name: 'Scorpione Spaghettone', art: 'scorpione', size: 'small', color: '#d8a040',
    hp: 52, atk: 4, interval: 1.5, traits: { armour: 3 }, weak: { cold: 1.4, blunt: 1.3 }, resist: { slash: 0.7, fire: 0.7 },
    moves: [{ kind: 'slam', every: 5, first: 2.5, windup: 0.8, power: 2.2 }],
    intro: 'A scorpion whose tail is one long strand of spaghetti, curled and ready. It stings al dente.',
  },
  cactus: {
    name: 'Cactus Caciotta', art: 'cactus', size: 'small', color: '#4a9a4a',
    hp: 68, atk: 3, interval: 1.8, traits: { regen: 0.03 }, weak: { fire: 1.6, slash: 1.3 }, resist: { pierce: 0.5, blunt: 0.8 },
    hooks: { reflect: { flat: 0.3 } },
    intro: 'A cactus wearing a wheel of caciotta like a sun hat. Hit it and it pricks you back. It doesn\'t mean anything by it.',
  },
  cammello: {
    name: 'Cammello Cannolo', art: 'cammello', size: 'small', color: '#c8945a',
    hp: 84, atk: 4.5, interval: 2.0, traits: {}, weak: { pierce: 1.3, magic: 1.3 }, resist: { blunt: 0.7 },
    moves: [{ kind: 'heal', every: 10, first: 6, windup: 1.5, amount: 0.2 }],
    intro: 'A camel with two cannoli for humps. When it gets hurt it takes a long, slow sip from one of them.',
  },
  avvoltoio: {
    name: 'Avvoltoio Arancino', art: 'avvoltoio', size: 'small', color: '#ff9a3a',
    hp: 34, atk: 3.5, interval: 1.1, traits: { flying: true, evasive: 0.3 }, weak: { pierce: 1.5, cold: 1.2 }, resist: { fire: 0.6 },
    intro: 'A vulture with a fried arancino for a body. It circles. It has been circling for a while. It is very patient.',
  },
  scarabeo: {
    name: 'Scarabeo Scamorza', art: 'scarabeo', size: 'big', color: '#3a8a7a', elite: true,
    hp: 420, atk: 8, interval: 1.8, traits: { armour: 6 }, weak: { explosive: 1.4, magic: 1.2 }, resist: { slash: 0.6, pierce: 0.6 },
    moves: [
      { kind: 'slam', every: 7, first: 4, windup: 1.4, power: 2.8 },
      { kind: 'shield', every: 12, first: 6, amount: 0.15 },
    ],
    phases: [{ at: 0.4, say: 'THE BALL ROLLS!', add: { traits: { armour: 2 }, atk: 1.4, moves: [{ kind: 'enrage', every: 999, first: 0.5, power: 1.15 }] } }],
    intro: 'A scarab rolling a smoked scamorza the size of a car. It hides behind it. When the cheese goes, so does its patience.',
  },
  serpente: {
    name: 'Serpente Sedanino', art: 'serpente', size: 'big', color: '#8ac83a', elite: true,
    hp: 340, atk: 7, interval: 1.2, traits: { evasive: 0.3 }, weak: { cold: 1.5, slash: 1.3 }, resist: { pierce: 0.7, fire: 0.8 },
    moves: [
      { kind: 'volley', every: 6, first: 3, hits: 5, power: 0.55 },
      { kind: 'slow', name: 'VENOM', look: 'venom', every: 11, first: 7, windup: 1.0, time: 3, slow: 0.4, power: 1 },
      { kind: 'dodge', every: 13, first: 9, time: 2.5 },
    ],
    intro: 'A snake made of ridged sedanini tubes, clicking together as it coils. Its bite makes your arms feel like cooked pasta.',
  },
  faraone: {
    name: 'Faraone Farfallone', art: 'faraone', size: 'big', color: '#ffd76a', boss: true,
    hp: 820, atk: 8, interval: 1.4, traits: { armour: 3 }, weak: { fire: 1.4, magic: 1.2 }, resist: { pierce: 0.7, cold: 0.8 },
    moves: [
      { kind: 'volley', name: 'SCARAB SWARM', every: 6, first: 3, windup: 0.8, hits: 4, power: 0.7 },
      { kind: 'slam', name: 'SARCOPHAGUS SLAM', every: 9, first: 6, windup: 1.6, power: 3.2 },
      { kind: 'slow', name: 'BOWTIE CURSE', look: 'curse', every: 14, first: 10, windup: 1.4, time: 4, slow: 0.5 },
    ],
    phases: [
      { at: 0.6, say: 'RISE, MY SCARABS!', add: { traits: { summoner: true }, moves: [{ kind: 'summon', spawn: 'scorpione', count: 2, every: 14, first: 0.5 }] } },
      { at: 0.3, say: 'THE SANDS OBEY!', add: { atk: 1.25, moves: [{ kind: 'ink', name: 'SANDSTORM', tint: '#c8a060', every: 13, first: 2, windup: 1.2, time: 3, miss: 0.4 }] } },
    ],
    intro: 'A pharaoh wrapped head to toe in farfalle, every bow tie a bandage. Three thousand years in a golden sarcophagus, and still not al dente.',
  },
  // ---- Zone 4: Ghiacciaio Gelato ----
  pinguino: {
    name: 'Pinguino Pizzicotto', art: 'pinguino', size: 'small', color: '#2a2a3a',
    hp: 46, atk: 2.6, interval: 0.85, traits: {}, weak: { fire: 1.5, blunt: 1.2 }, resist: { cold: 0.4 },
    intro: 'A penguin in a pizza chef\'s hat that slides in on its belly and pinches. Fast. Rude. Very fast.',
  },
  foca: {
    name: 'Foca Focaccia', art: 'foca', size: 'small', color: '#9aa8b8',
    hp: 96, atk: 4.5, interval: 1.9, traits: { armour: 4 }, weak: { pierce: 1.4, fire: 1.3 }, resist: { cold: 0.5, blunt: 0.7 },
    intro: 'A seal under a thick layer of rosemary focaccia. The blubber is bread. The bread is armour.',
  },
  pupazzo: {
    name: 'Pupazzo Panettone', art: 'pupazzo', size: 'small', color: '#f4f4f0',
    hp: 42, atk: 3, interval: 1.5, traits: { backline: true, regen: 0.03 }, weak: { fire: 1.8 }, resist: { cold: 0.3, pierce: 0.8 },
    moves: [{ kind: 'volley', every: 6, first: 3, hits: 3, power: 0.8 }],
    intro: 'A snowman stacked from three panettoni, throwing snowballs from the back. The raisins are its eyes. Don\'t ask about the candied peel.',
  },
  gufo: {
    name: 'Gufo Grissino', art: 'gufo', size: 'small', color: '#c8b8a0',
    hp: 36, atk: 3.4, interval: 1.1, traits: { flying: true, evasive: 0.35 }, weak: { pierce: 1.4, sonic: 1.3 }, resist: { cold: 0.6 },
    intro: 'An owl on two breadstick legs, swooping silently out of the snow. It turns its head all the way round to judge you.',
  },
  orso: {
    name: 'Orso Ossobuco', art: 'orso', size: 'big', color: '#f0f0f4', elite: true,
    hp: 520, atk: 10, interval: 2.0, traits: { armour: 5 }, weak: { fire: 1.5, magic: 1.2 }, resist: { cold: 0.5, blunt: 0.7 },
    moves: [
      { kind: 'slam', every: 7, first: 4, windup: 1.7, power: 3.2 },
      { kind: 'quake', every: 13, first: 9, windup: 1.4, power: 1.6, look: 'snow' },
    ],
    phases: [{ at: 0.4, say: 'OSSOBUCOOO!', add: { atk: 1.3, moves: [{ kind: 'enrage', every: 999, first: 0.5, power: 1.15 }] } }],
    intro: 'A polar bear wearing a marrow bone as a helmet. It stands up, and up, and up, and then it comes down on you.',
  },
  yeti: {
    name: 'Yeti Ricottino', art: 'yeti', size: 'big', color: '#e8eef8', elite: true,
    hp: 440, atk: 7, interval: 1.6, traits: { regen: 0.015, summoner: true }, weak: { fire: 1.6 }, resist: { cold: 0.4, slash: 0.7 },
    moves: [
      { kind: 'summon', spawn: 'pupazzo', count: 2, every: 14, first: 3 },
      { kind: 'heal', every: 11, first: 8, windup: 2.0, amount: 0.15 },
      { kind: 'slam', every: 8, first: 5, windup: 1.4, power: 2.6 },
    ],
    intro: 'A yeti made of fresh ricotta, soft and enormous. It builds snowmen. The snowmen are on its side.',
  },
  mammut: {
    name: 'Mammut Mascarpone', art: 'mammut', size: 'big', color: '#c88a5a', boss: true,
    hp: 980, atk: 9, interval: 1.6, traits: { armour: 4 }, weak: { fire: 1.5, pierce: 1.2 }, resist: { cold: 0.4, blunt: 0.8 },
    moves: [
      { kind: 'volley', name: 'SNOWBALL BARRAGE', every: 7, first: 3, windup: 0.8, hits: 4, power: 0.7 },
      { kind: 'slam', name: 'TUSK TOSS', every: 9, first: 6, windup: 1.6, power: 3.2 },
      { kind: 'quake', name: 'AVALANCHE', look: 'snow', every: 15, first: 11, windup: 1.8, power: 2.2, slow: 0.35, time: 2.5 },
    ],
    phases: [
      { at: 0.5, say: 'BRAIN FREEZE!', add: { traits: { shield: 0.2, summoner: true }, moves: [
        { kind: 'summon', spawn: 'pinguino', count: 2, every: 13, first: 1 },
        { kind: 'slow', name: 'FROST BREATH', look: 'frost', every: 12, first: 5, windup: 1.2, time: 3, slow: 0.4 },
      ] } },
    ],
    intro: 'A woolly mammoth with a coat of whipped mascarpone and tusks of ice-cream cone. It was frozen in the glacier for ten thousand years. It woke up hungry.',
  },
  // ---- Zone 5: Vulcano Vesuvietto ----
  salamandra: {
    name: 'Salamandra Salamino', art: 'salamandra', size: 'small', color: '#d8402a',
    hp: 44, atk: 3.2, interval: 1.0, traits: { regen: 0.03 }, weak: { cold: 1.6, pierce: 1.2 }, resist: { fire: 0.3 },
    intro: 'A salamander with salami-slice spots, fresh out of the lava and still sizzling. Quick, and it heals in the heat.',
  },
  golem: {
    name: 'Golem Gorgonzola', art: 'golem', size: 'small', color: '#6a6a76',
    hp: 90, atk: 5, interval: 2.1, traits: { armour: 6 }, weak: { blunt: 1.5, explosive: 1.4 }, resist: { slash: 0.6, pierce: 0.6, fire: 0.6 },
    moves: [{ kind: 'slam', every: 6, first: 3, windup: 1.4, power: 2.4 }],
    intro: 'A little rock golem with blue-veined gorgonzola for a heart. Heavy, armoured and in no hurry at all.',
  },
  peperoncino: {
    name: 'Peperoncino Pazzo', art: 'peperoncino', size: 'small', color: '#ff3b2a',
    hp: 34, atk: 3.4, interval: 1.4, traits: { backline: true }, weak: { cold: 1.5, slash: 1.2 }, resist: { fire: 0.4 },
    moves: [{ kind: 'volley', every: 5, first: 2.5, hits: 3, power: 0.8 }],
    intro: 'A chilli pepper with a grin and an endless supply of fireballs, lobbing them from the back. Hot. Very hot.',
  },
  corvo: {
    name: 'Corvo Carbonara', art: 'corvo', size: 'small', color: '#2a2a34',
    hp: 38, atk: 3.6, interval: 1.1, traits: { flying: true, evasive: 0.35 }, weak: { pierce: 1.4, sonic: 1.3 }, resist: { fire: 0.6 },
    intro: 'A crow made of charcoal, with a carbonara-yolk eye. It rides the hot air up off the lava and dives through the smoke.',
  },
  rinoceronte: {
    name: 'Rinoceronte Rigatone', art: 'rinoceronte', size: 'big', color: '#8a5a4a', elite: true,
    hp: 560, atk: 10, interval: 2.0, traits: { armour: 7 }, weak: { cold: 1.5, magic: 1.2 }, resist: { blunt: 0.7, fire: 0.5, slash: 0.8 },
    moves: [
      { kind: 'slam', every: 7, first: 4, windup: 1.6, power: 3 },
      { kind: 'quake', every: 12, first: 9, windup: 1.5, power: 1.8 },
    ],
    phases: [{ at: 0.4, say: 'RIGATONI RAMPAGE!', add: { atk: 1.3, moves: [{ kind: 'enrage', every: 999, first: 0.5, power: 1.15 }] } }],
    intro: 'A rhinoceros with lava-cracked skin and a horn made of one huge rigatone. It doesn\'t go round things.',
  },
  lumaca: {
    name: 'Lumaca Fornarina', art: 'lumaca', size: 'big', color: '#c8a070', elite: true,
    hp: 560, atk: 7.5, interval: 1.7, traits: { armour: 3, regen: 0.012 }, weak: { cold: 1.5, pierce: 1.2 }, resist: { fire: 0.4, blunt: 0.7 },
    moves: [
      { kind: 'shield', every: 12, first: 5, amount: 0.18 },
      { kind: 'heal', every: 11, first: 8, windup: 2.0, amount: 0.15 },
      { kind: 'burn', every: 9, first: 4, windup: 1.2, time: 3, dps: 0.55 },
    ],
    intro: 'A snail whose shell is a wood-fired pizza oven, with a pizza always on the go. It retreats inside, it bakes, and it breathes the heat at you.',
  },
  drago: {
    name: 'Drago Diavola', art: 'drago', size: 'big', color: '#ff3b2a', boss: true,
    hp: 1050, atk: 9, interval: 1.5, traits: { armour: 4, flying: true }, weak: { cold: 1.5, pierce: 1.15 }, resist: { fire: 0.3, slash: 0.8 },
    moves: [
      { kind: 'volley', name: 'EMBER RAIN', every: 7, first: 3, windup: 0.8, hits: 4, power: 0.7 },
      { kind: 'slam', name: 'TAIL SWIPE', every: 9, first: 6, windup: 1.6, power: 3.2 },
      { kind: 'burn', name: 'FIRE BREATH', every: 13, first: 10, windup: 1.6, power: 1, time: 4, dps: 0.6 },
    ],
    phases: [
      { at: 0.5, say: 'ERUPTION!', add: { traits: { summoner: true }, moves: [
        { kind: 'quake', name: 'ERUPTION', every: 14, first: 1.5, windup: 1.4, power: 1.8 },
        { kind: 'summon', spawn: 'salamandra', count: 2, every: 13, first: 4 },
      ] } },
      { at: 0.2, say: 'EXTRA PICCANTE!', add: { atk: 1.25, traits: { regen: 0.01 } } },
    ],
    intro: 'A dragon whose wings are two diavola pizzas, pepperoni and all, nesting in the crater. Everything it breathes on comes out well done.',
  },
  // ---- Zone 6: Carbonara City ----
  ratto: {
    name: 'Ratto Ravioletto', art: 'ratto', size: 'small', color: '#8a8a96',
    hp: 36, atk: 2.8, interval: 0.95, traits: { evasive: 0.15 }, weak: { blunt: 1.3, fire: 1.2 }, resist: { pierce: 0.8 },
    intro: 'A rat wearing a ravioli like a sleeping bag. There is never just one. There are never just two.',
  },
  piccione: {
    name: 'Piccione Penne', art: 'piccione', size: 'small', color: '#9aa8c8',
    hp: 40, atk: 3.4, interval: 1.2, traits: { flying: true, evasive: 0.35 }, weak: { pierce: 1.4, sonic: 1.3 }, resist: { blunt: 0.8 },
    intro: 'A city pigeon with penne for legs and absolutely no fear of you. It has seen worse. It has eaten worse.',
  },
  cono: {
    name: 'Cono Cannellino', art: 'cono', size: 'small', color: '#ff7a2a',
    hp: 100, atk: 4, interval: 2.0, traits: { armour: 6 }, weak: { explosive: 1.5, magic: 1.3 }, resist: { slash: 0.6, pierce: 0.6 },
    intro: 'A traffic cone with a cannellino tucked in the top. It stands in the road. That\'s it. That\'s the job. It is very good at it.',
  },
  lampione: {
    name: 'Lampione Linguine', art: 'lampione', size: 'small', color: '#ffe14d',
    hp: 46, atk: 3.6, interval: 1.6, traits: { backline: true, shield: 0.3 }, weak: { sonic: 1.5, blunt: 1.2 }, resist: { magic: 0.6 },
    moves: [{ kind: 'volley', every: 6, first: 3, hits: 3, power: 0.85 }],
    intro: 'A street lamp whose post is a twist of linguine, buzzing with electricity it really shouldn\'t have. It zaps from the back.',
  },
  gatto: {
    name: 'Gatto Gorgonzolo', art: 'gatto', size: 'big', color: '#4a4a5a', elite: true,
    hp: 460, atk: 7.5, interval: 1.2, traits: { evasive: 0.3 }, weak: { slash: 1.3, sonic: 1.2 }, resist: { pierce: 0.7, magic: 0.8 },
    moves: [
      { kind: 'volley', every: 6, first: 3, windup: 0.8, hits: 6, power: 0.5 },
      { kind: 'dodge', every: 11, first: 7, time: 3 },
      { kind: 'weaken', every: 13, first: 9, windup: 1.2, time: 4, weak: 0.35 },
    ],
    intro: 'A mob cat in a pinstripe suit and a fedora, with a violin case that is not a violin. It makes you an offer. The offer is bad.',
  },
  coccodrillo: {
    name: 'Coccodrillo Calzone', art: 'coccodrillo', size: 'big', color: '#4a8a4a', elite: true,
    hp: 600, atk: 10, interval: 2.0, traits: { armour: 5 }, weak: { cold: 1.4, explosive: 1.2 }, resist: { slash: 0.7, blunt: 0.8 },
    moves: [
      { kind: 'slam', every: 7, first: 4, windup: 1.7, power: 3.2 },
      { kind: 'heal', every: 12, first: 9, windup: 2.0, amount: 0.15 },
    ],
    phases: [{ at: 0.5, say: 'DEATH ROLL!', add: { traits: { armour: 7 }, moves: [{ kind: 'quake', every: 10, first: 1, windup: 1.2, power: 2 }] } }],
    intro: 'A crocodile from the sewers, folded into a calzone and very angry about it. It surfaces slowly. Then not slowly.',
  },
  padrino: {
    name: 'Ratto Raviolone', art: 'padrino', size: 'big', color: '#6a6a7a', boss: true,
    hp: 1100, atk: 9, interval: 1.3, traits: { armour: 3, evasive: 0.15, summoner: true }, weak: { blunt: 1.25, fire: 1.2 }, resist: { pierce: 0.75, magic: 0.85 },
    moves: [
      { kind: 'volley', name: 'TOMMY GUN', every: 6, first: 3, windup: 0.9, hits: 6, power: 0.55 },
      { kind: 'weaken', name: 'PROTECTION RACKET', every: 13, first: 8, windup: 1.4, time: 4, weak: 0.4 },
      { kind: 'summon', spawn: 'ratto', count: 2, every: 15, first: 6 },
    ],
    phases: [
      { at: 0.55, say: 'YOU MADE ME ANGRY.', add: { atk: 1.2, moves: [{ kind: 'dive', name: 'LIMO RAM', every: 13, first: 2, windup: 1.6, power: 2.4 }] } },
      { at: 0.25, say: 'BRING THE FAMILY!', add: { traits: { shield: 0.15 }, moves: [{ kind: 'summon', spawn: 'gatto', count: 1, every: 99, first: 0.5 }] } },
    ],
    intro: 'The don of the city: a rat in a pinstripe suit, sitting in a ravioli the size of an armchair. Everybody pays Ratto Raviolone. Tonight it\'s your turn.',
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
  sunburn: { name: 'Sunburn', for: ['elite', 'boss'], zones: ['beach', 'desert'], text: 'While it is above half HP, you burn for 1 damage a second.',
    counter: 'Each sonic or magic hit you land cools the burn for 2 seconds: the Guitar and the Wand.', counterWeapons: ['guitar', 'wand'],
    mod: { hooks: { burn: { dps: 1, above: 0.5, cool: 2, by: ['sonic', 'magic'] } } } },
  // ---- Desert enchantments ----
  mirage: { name: 'Mirage', for: ['elite', 'boss'], zones: ['desert'], text: 'Shimmers in the heat: +15% dodge, but sonic hits deal ×1.3.',
    counter: 'The Guitar shakes the mirage apart; the Sniper Rifle and Eagle-Eye Shades still find it.', counterWeapons: ['guitar', 'sniper'],
    mod: { add: { evasive: 0.15 }, weak: { sonic: 1.3 } } },
  scorpionNest: { name: 'Scorpion Nest', for: ['elite', 'boss'], zones: ['desert'], text: 'Two scorpions scuttle out of the sand at the start.',
    counter: 'Blunt and cold crack their shells: the Boxing Gloves and the Freeze Ray. The Guitar hits the whole nest.', counterWeapons: ['gloves', 'freeze', 'guitar'],
    mod: { adds: [['scorpione', 2]] } },
  // ---- Glacier enchantments ----
  permafrost: { name: 'Permafrost', for: ['elite', 'boss'], zones: ['glacier'], text: 'Frozen solid: +4 armour, but fire hits deal ×1.4.',
    counter: 'The Flamethrower thaws it (and burning ignores armour); the Wand ignores armour too.', counterWeapons: ['flamer', 'wand'],
    mod: { add: { armour: 4 }, weak: { fire: 1.4 } } },
  penguinParade: { name: 'Penguin Parade', for: ['elite', 'boss'], zones: ['glacier'], text: 'Three penguins slide in at the start.',
    counter: 'Area and splash: the Guitar and the Bazooka bowl them over together.', counterWeapons: ['guitar', 'bazooka'],
    mod: { adds: [['pinguino', 3]] } },
  // ---- Volcano enchantments ----
  moltenCore: { name: 'Molten Core', for: ['elite', 'boss'], zones: ['volcano'], text: 'While it is above half HP, you burn for 2 damage a second.',
    counter: 'Each cold or pierce hit you land cools the core for 2 seconds: the Freeze Ray and the Uzi.', counterWeapons: ['freeze', 'uzi', 'sniper'],
    mod: { hooks: { burn: { dps: 2, above: 0.5, cool: 2, by: ['cold', 'pierce'] } } } },
  lavaFlow: { name: 'Lava Flow', for: ['elite', 'boss'], zones: ['volcano'], text: 'Two salamanders crawl out of the lava at the start.',
    counter: 'Cold puts them out: the Freeze Ray. The Guitar hits them all at once.', counterWeapons: ['freeze', 'guitar'],
    mod: { adds: [['salamandra', 2]] } },
  // ---- City enchantments ----
  protection: { name: 'Protection Money', for: ['elite', 'boss'], zones: ['city'], text: 'Two traffic cones stand in front. It pays 25 more gold if you win.',
    counter: 'The Bazooka blows the cones away; the Boomerang and the Sniper Rifle reach past them.', counterWeapons: ['bazooka', 'boomerang', 'sniper'],
    mod: { adds: [['cono', 2]], gold: 25 } },
  rushHour: { name: 'Rush Hour', for: ['elite', 'boss'], zones: ['city'], text: 'Three rats and a pigeon pile in at the start.',
    counter: 'Area and splash: the Guitar, the Bazooka and the Flamethrower clear a crowd.', counterWeapons: ['guitar', 'bazooka', 'flamer'],
    mod: { adds: [['ratto', 3], ['piccione', 1]] } },
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
// has overall multipliers for minions, elites and the boss (zone.tune), so tuning is data. Its summons
// come in at the zone's strength for its first row.
function scaledEnemy(def, depth, zone) {
  const t = zone.tune, kind = def.boss ? 'boss' : def.elite ? 'elite' : 'minion';
  const k = kind === 'minion' ? 1 + t.depth * depth : 1;
  // what it summons comes in as the zone fields its first row
  const sp = m => m.spawn ? { ...m, spawn: scaledEnemy(m.spawn, 0, zone) } : m;
  const out = { ...def, hp: Math.round(def.hp * k * t[kind + 'Hp']), atk: Math.round(def.atk * k * t[kind + 'Atk'] * 10) / 10 };
  if (def.moves) out.moves = def.moves.map(sp);
  if (def.phases) out.phases = def.phases.map(p => p.add && p.add.moves ? { ...p, add: { ...p.add, moves: p.add.moves.map(sp) } } : p);
  return out;
}

const ZONES = [
  {
    id: 'beach', name: 'Brainrot Beach', act: 1,
    clear: 'Polpo Pianissimo closes the lid for good. The beach is yours.',
    tune: { enchant: 1, depth: 0.12, winHeal: 0.15, minionHp: 1.03, minionAtk: 0.8, eliteHp: 0.94, eliteAtk: 0.78, bossHp: 1.25, bossAtk: 0.85 },
    // stage colours: sky bands top to bottom, sun gradient, horizon kind, floor and grid
    look: { sky: ['#0b0730', '#1a0b4a', '#3a0f5e', '#6a1a6e', '#a83a6a', '#ff7a5a'], sun: ['#fff1a8', '#ff5a8a'],
      horizon: 'sea', sea: '#1a4a8a', foam: '#9fe8ff', floor: '#2a1838', grid: '#c45a3a', line: '#ffb36b' },
    minions: ['crab', 'seagull', 'jelly', 'coconut'],
    elites: ['pelican', 'tortoise'],
    boss: 'octopus',
    // Events: a choice either has effects, or a chance with a win and a lose outcome. cost is gold.
    // Effects: hp, maxHp, gold, tonic (a TONICS id, run.js) and, with loot, item: 'weapon' | 'armour' | 'trinket' | 'any' | 'card'.
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
    news: 'the Flamethrower, the Freeze Ray, the Boomerang and the Sniper Rifle can turn up as loot, loot is rarer, fights pay more gold, and the forge goes all the way to Legendary.',
    clear: 'Tucano Tortellone drops its last tortellino and flaps off into the clouds. The jungle goes quiet, except for the moss.',
    tune: { enchant: 1.2, depth: 0.05, winHeal: 0.15, minionHp: 1.7, minionAtk: 1.62, eliteHp: 1.21, eliteAtk: 1.05, bossHp: 1.15, bossAtk: 0.95 },
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
  {
    id: 'desert', name: 'Deserto Dolce', act: 3,
    story: 'Tucano Tortellone\'s last feather lands on a map nobody drew: past the jungle\'s edge, the trees give out and the ground turns to sugar. The Deserto Dolce, where the dunes are icing and the pyramids are pastry, and where Faraone Farfallone has been waiting three thousand years for somebody to disturb him.',
    clear: 'Faraone Farfallone unravels, one bow tie at a time, and the sarcophagus slams shut on nothing. The sand settles. It tastes faintly of vanilla.',
    tune: { enchant: 1.3, depth: 0.05, winHeal: 0.15, minionHp: 2.38, minionAtk: 2.18, eliteHp: 2.02, eliteAtk: 1.71, bossHp: 1.88, bossAtk: 1.48 },
    look: { sky: ['#2a0e3a', '#5a1a4a', '#a83a3a', '#e8703a', '#ffa84a', '#ffd88a'], sun: ['#fff8d0', '#ffb040'],
      horizon: 'dunes', pyramid: '#b8743a', cap: '#ffd76a', dune: '#d8a060', duneTop: '#f0c888', haze: 'rgba(255,240,200,.25)', floor: '#7a4a20', grid: '#c8843a', line: '#ffd76a' },
    minions: ['scorpione', 'cactus', 'cammello', 'avvoltoio'],
    elites: ['scarabeo', 'serpente'],
    boss: 'faraone',
    events: [
      { id: 'oasis', title: 'The Orzata Oasis',
        text: 'A pool of cold almond orzata glitters between two date palms. A camel in a lifeguard\'s whistle watches it with deep suspicion.',
        choices: [
          { label: 'Drink deep', text: 'Sweet, cold and almondy. You feel human again. +30 HP.', effects: { hp: 30 } },
          { label: 'Pay for a proper swim (30 gold)', cost: 30, text: 'The lifeguard blows the whistle approvingly. You come out stronger. +15 max HP.', effects: { maxHp: 15 } },
          { label: 'Dive for coins (60%)', chance: 0.6,
            win: { text: 'The bottom of the pool is paved with them. +60 gold.', effects: { gold: 60 } },
            lose: { text: 'The lifeguard blows the whistle, then sits on you. -24 HP.', effects: { hp: -24 }, death: 'a lifeguard camel' } },
        ] },
      { id: 'sphinx', title: 'The Riddle of the Sfinge',
        text: 'A sphinx carved out of one enormous sfogliatella blocks the path. Flakes drift off her every time she speaks. "Answer my riddle," she says, "or don\'t. I am very crumbly."',
        choices: [
          { label: 'Answer: "Pasta" (50%)', chance: 0.5,
            win: { text: '"Correct," she sighs. "It is always pasta." She lets you take something from her treasury.', effects: { item: 'any', minRarity: 2 } },
            lose: { text: 'The answer was "also pasta, but a different shape". She sits on you. -26 HP.', effects: { hp: -26 }, death: 'a riddle' } },
          { label: 'Bribe her with pastry cream (30 gold)', cost: 30, text: 'She eats the cream and hands over a card she was using as a bookmark.', effects: { item: 'card' } },
          { label: 'Climb around her', text: 'It takes an hour. You find 24 gold in a flake of her.', effects: { gold: 24 } },
        ] },
      { id: 'caravan', title: 'The Spice Caravan',
        text: 'A line of camels, each loaded with sacks of chilli, saffron and something labelled SECRET. The caravan master is a fennec fox in a turban, counting coins.',
        choices: [
          { label: 'Buy a sack of chilli (45 gold)', cost: 45, text: 'You eat a pinch. Then another. Then you can hit things harder. (+5% damage for the rest of the run.)', effects: { tonic: 'chili' } },
          { label: 'Raid the SECRET sack (40%)', chance: 0.4,
            win: { text: 'It is full of loot and a little gold. Nobody saw. Probably.', effects: { item: 'any', minRarity: 2, gold: 30 } },
            lose: { text: 'Every camel kicks you once, in order. -30 HP.', effects: { hp: -30 }, death: 'a camel caravan' } },
          { label: 'Help them load up', text: 'Hot, heavy work. The fox pays fairly. -8 HP, +36 gold.', effects: { hp: -8, gold: 36 } },
        ] },
      { id: 'mirage', title: 'A Mirage',
        text: 'On the horizon: a gelato shop, a sun lounger and a sign reading FREE. It wobbles in the heat. It might not be there.',
        choices: [
          { label: 'Walk towards it (50%)', chance: 0.5,
            win: { text: 'It is real! The shop is shut, but someone left something on the lounger.', effects: { item: 'any' } },
            lose: { text: 'It was not real. You walked a long way for nothing. -18 HP.', effects: { hp: -18 }, death: 'a mirage' } },
          { label: 'Sit in the shade and wait', text: 'The mirage gets bored and leaves. You feel rested. +18 HP.', effects: { hp: 18 } },
          { label: 'Bottle the shimmer', text: 'It fits in a jar. It hums. Somebody pays you to take it off your hands, and leaves a card that is definitely cursed. (A cursed card and 70 gold.)', effects: { cursed: true, gold: 70 } },
        ] },
    ],
    groups: [
      { from: 0, list: [['scorpione', 'scorpione'], ['cactus', 'cactus'], ['avvoltoio', 'avvoltoio', 'avvoltoio'], ['cammello', 'avvoltoio'], ['scorpione', 'cactus']] },
      { from: 3, list: [['scorpione', 'scorpione', 'scorpione'], ['cactus', 'cammello', 'cactus'], ['avvoltoio', 'avvoltoio', 'avvoltoio', 'avvoltoio'], ['cammello', 'scorpione', 'avvoltoio'], ['cactus', 'scorpione', 'scorpione', 'avvoltoio']] },
      { from: 6, list: [['scorpione', 'scorpione', 'scorpione', 'cammello'], ['cactus', 'cactus', 'cammello', 'avvoltoio'], ['avvoltoio', 'avvoltoio', 'avvoltoio', 'scorpione', 'scorpione'], ['cammello', 'cammello', 'scorpione', 'cactus'], ['scorpione', 'cactus', 'avvoltoio', 'cammello']] },
    ],
  },
  {
    id: 'glacier', name: 'Ghiacciaio Gelato', act: 4,
    story: 'Behind the sarcophagus, a staircase goes down, and down, and then very cold. It comes out on a glacier of gelato: pistachio crevasses, stracciatella snowfields, and a long, low rumble from under the ice, where something woolly and enormous has started to thaw.',
    clear: 'Mammut Mascarpone sinks back into the glacier with a sigh you feel through your boots. The snow stops. Somewhere below, a penguin applauds.',
    tune: { enchant: 1.4, depth: 0.05, winHeal: 0.15, minionHp: 3.21, minionAtk: 2.85, eliteHp: 2.71, eliteAtk: 2.29, bossHp: 2.5, bossAtk: 1.9 },
    look: { sky: ['#020a1a', '#061a34', '#0a2a4a', '#1a4a6a', '#3a7a9a', '#8ac8e0'], sun: ['#ffffff', '#9fe8ff'],
      horizon: 'ice', ridge: '#4a6a8a', snow: '#f0f8ff', aurora: ['rgba(57,255,136,.18)', 'rgba(41,231,255,.14)', 'rgba(199,125,255,.12)'], floor: '#1a2a3a', grid: '#5a8aaa', line: '#d8f0ff' },
    minions: ['pinguino', 'foca', 'pupazzo', 'gufo'],
    elites: ['orso', 'yeti'],
    boss: 'mammut',
    events: [
      { id: 'hotspring', title: 'The Hot Chocolate Spring',
        text: 'Steam rises from a pool of bubbling hot chocolate in the middle of the ice. A family of penguins sits in it up to their beaks, extremely content.',
        choices: [
          { label: 'Rent a towel and soak (30 gold)', cost: 30, text: 'You come out warm to the bone and slightly chocolate-scented. +50 HP.', effects: { hp: 50 } },
          { label: 'Dunk your head in (55%)', chance: 0.55,
            win: { text: 'Thick, rich, life-changing. +18 max HP.', effects: { maxHp: 18 } },
            lose: { text: 'It was hotter than it looked. -24 HP.', effects: { hp: -24 }, death: 'hot chocolate' } },
          { label: 'Fill a flask and go', text: 'You sip it on the way. +18 HP.', effects: { hp: 18 } },
        ] },
      { id: 'fishing', title: 'Ice Fishing',
        text: 'Three penguins sit round a hole in the ice with a single fishing rod between them. They have caught nothing. They offer you a go.',
        choices: [
          { label: 'Fish (60%)', chance: 0.6,
            win: { text: 'You pull up a fish, and the fish is holding something. The penguins are furious.', effects: { item: 'trinket', gold: 30 } },
            lose: { text: 'Something much bigger pulls back. You fall in. -26 HP.', effects: { hp: -26 }, death: 'ice fishing' } },
          { label: 'Buy what they\'ve got (35 gold)', cost: 35, text: 'They have one card, frozen in a block of ice. It thaws in your hands.', effects: { item: 'card' } },
          { label: 'Give them a tip and leave', text: 'You tell them to try the other side of the hole. They catch three fish at once and press 30 gold on you.', effects: { gold: 30 } },
        ] },
      { id: 'frozen', title: 'Frozen in the Ice',
        text: 'Deep in a wall of ice, an adventurer froze mid-stride, still holding their gear. They look surprised. They have looked surprised for a long time.',
        choices: [
          { label: 'Chip out the weapon (50%)', chance: 0.5,
            win: { text: 'It comes free in one piece, colder than anything you have ever held.', effects: { item: 'weapon', minRarity: 2 } },
            lose: { text: 'The wall cracks and comes down on you. -28 HP.', effects: { hp: -28 }, death: 'a falling glacier' } },
          { label: 'Chip out their coin purse', text: 'Safer, slower and just as cold. +40 gold.', effects: { gold: 40 } },
          { label: 'Pay your respects', text: 'You leave them a scarf. You feel a little warmer for it. +10 HP.', effects: { hp: 10 } },
        ] },
      { id: 'yetiTea', title: 'Tea with the Yeti',
        text: 'A small yeti, a teenager by yeti standards, has set up a tea table in a snow cave. "Nobody ever comes," it says. "Sit. Please. Sit."',
        choices: [
          { label: 'Drink the tea', text: 'It is espresso, actually, very strong. Your hands will not stop moving. (+5% attack speed for the rest of the run.)', effects: { tonic: 'doppio' } },
          { label: 'Arm-wrestle it (45%)', chance: 0.45,
            win: { text: 'You win, somehow. It is thrilled anyway and gives you its favourite card.', effects: { item: 'card' } },
            lose: { text: 'It wins. It wins very hard. -28 HP.', effects: { hp: -28 }, death: 'an arm-wrestling yeti' } },
          { label: 'Make polite excuses', text: '"Oh," it says. "Okay." You feel terrible. It gives you 15 gold for the road anyway.', effects: { gold: 15 } },
        ] },
    ],
    groups: [
      { from: 0, list: [['pinguino', 'pinguino'], ['foca', 'pinguino'], ['gufo', 'gufo', 'gufo'], ['pupazzo', 'pinguino'], ['foca', 'gufo']] },
      { from: 3, list: [['pinguino', 'pinguino', 'pinguino'], ['foca', 'foca', 'pupazzo'], ['gufo', 'gufo', 'gufo', 'gufo'], ['pinguino', 'foca', 'pupazzo'], ['pinguino', 'pinguino', 'gufo', 'pupazzo']] },
      { from: 6, list: [['pinguino', 'pinguino', 'pinguino', 'pinguino'], ['foca', 'foca', 'pupazzo', 'pupazzo'], ['gufo', 'gufo', 'gufo', 'pinguino', 'pinguino'], ['foca', 'pinguino', 'gufo', 'pupazzo'], ['foca', 'foca', 'pinguino', 'gufo']] },
    ],
  },
  {
    id: 'volcano', name: 'Vulcano Vesuvietto', act: 5,
    story: 'Mammut Mascarpone\'s fall cracks the glacier wide open, and the meltwater runs downhill, hissing, towards a glow on the horizon. Vulcano Vesuvietto: a mountain that smokes like a pizza oven, where the rivers are lava and the rocks have opinions, and where Drago Diavola sleeps in the crater on a bed of hot coals.',
    clear: 'Drago Diavola folds its pizza wings and sinks back into the crater. The lava cools to a crust. It smells, unmistakably, of a good margherita.',
    news: 'loot rolls on rarer tables again, with more Epics and Legendaries everywhere.',
    tune: { enchant: 1.5, depth: 0.05, winHeal: 0.15, minionHp: 3.2, minionAtk: 2.9, eliteHp: 3.9, eliteAtk: 3.2, bossHp: 3.6, bossAtk: 2.7 },
    look: { sky: ['#0a0202', '#1a0606', '#3a0a0a', '#6a1a0a', '#a83a0a', '#ff7a2a'], sun: ['#ffe14d', '#ff3b2a'],
      horizon: 'volcano', ridge: '#2a0e0e', cone: '#3a1410', lava: '#ff7a2a', smoke: 'rgba(90,70,70,.5)', floor: '#1a0a06', grid: '#a83a1a', line: '#ffb020' },
    minions: ['salamandra', 'golem', 'peperoncino', 'corvo'],
    elites: ['rinoceronte', 'lumaca'],
    boss: 'drago',
    events: [
      { id: 'smithy', title: 'The Mole Smith',
        text: 'In a cave lit by lava, a mole in a leather apron hammers at an anvil. "Bring me your blade," it says without looking up. "Or bring me money. Or both. Mostly both."',
        choices: [
          { label: 'Commission a weapon (70 gold)', cost: 70, text: 'It works all night. What it hands you is still warm.', effects: { item: 'weapon', minRarity: 3 } },
          { label: 'Work the bellows for it', text: 'Hot, hard work. The mole is grudgingly impressed. -14 HP, +60 gold.', effects: { hp: -14, gold: 60 } },
          { label: 'Ask for a sharpening tip', text: '"Hit harder," it says. You try it. It works. (+5% damage for the rest of the run.)', effects: { tonic: 'chili' } },
        ] },
      { id: 'oven', title: 'The Lava Oven',
        text: 'A pizza sits on a ledge right over the lava, perfectly cooked by the heat rising off it. Nobody is watching it. Nobody sane, anyway.',
        choices: [
          { label: 'Grab it (55%)', chance: 0.55,
            win: { text: 'Hot, crisp, perfect. You eat the whole thing and feel unstoppable. +24 max HP.', effects: { maxHp: 24 } },
            lose: { text: 'The ledge crumbles. You get the pizza and a lot of burns. -36 HP.', effects: { hp: -36 }, death: 'a lava oven' } },
          { label: 'Hook it with a stick', text: 'You get a slice. The rest falls in. +30 HP.', effects: { hp: 30 } },
          { label: 'Leave it as an offering', text: 'The volcano rumbles, almost politely. A cooled lump of something valuable rolls to your feet. +55 gold.', effects: { gold: 55 } },
        ] },
      { id: 'coals', title: 'The Walk of Coals',
        text: 'A path of glowing coals leads across the crater. A salamander in a referee\'s shirt stands at the start with a stopwatch. "Personal best?" it asks.',
        choices: [
          { label: 'Run it (50%)', chance: 0.5,
            win: { text: 'Personal best! The salamander gives you its spare card and a little bow.', effects: { item: 'card', gold: 30 } },
            lose: { text: 'Personal worst. -34 HP.', effects: { hp: -34 }, death: 'hot coals' } },
          { label: 'Walk it slowly and with dignity', text: 'Dignified. Painful. You feel tougher for it. -20 HP, +16 max HP.', effects: { hp: -20, maxHp: 16 } },
          { label: 'Take the long way', text: 'The salamander sighs and writes DNS on its clipboard.' },
        ] },
      { id: 'obsidian', title: 'The Obsidian Mirror',
        text: 'A slab of black volcanic glass stands at the crater\'s edge. Your reflection in it is grinning, and you aren\'t.',
        choices: [
          { label: 'Shake its hand', text: 'It hands you something cold and heavy, and keeps something of yours. (A cursed card and 90 gold.)', effects: { cursed: true, gold: 90 } },
          { label: 'Smash the mirror (45%)', chance: 0.45,
            win: { text: 'It shatters. Inside is a pocket of treasure your reflection was hoarding.', effects: { item: 'any', minRarity: 3 } },
            lose: { text: 'It shatters, and every shard is angry. -32 HP.', effects: { hp: -32 }, death: 'an obsidian mirror' } },
          { label: 'Look away', text: 'You walk on. For a while your shadow walks a little behind you.' },
        ] },
    ],
    groups: [
      { from: 0, list: [['salamandra', 'salamandra'], ['golem', 'salamandra'], ['corvo', 'corvo', 'corvo'], ['peperoncino', 'golem'], ['salamandra', 'corvo']] },
      { from: 3, list: [['salamandra', 'salamandra', 'salamandra'], ['golem', 'golem', 'peperoncino'], ['corvo', 'corvo', 'corvo', 'corvo'], ['golem', 'salamandra', 'peperoncino'], ['salamandra', 'salamandra', 'corvo', 'peperoncino']] },
      { from: 6, list: [['salamandra', 'salamandra', 'salamandra', 'salamandra'], ['golem', 'golem', 'peperoncino', 'peperoncino'], ['corvo', 'corvo', 'corvo', 'salamandra', 'salamandra'], ['golem', 'salamandra', 'corvo', 'peperoncino'], ['golem', 'golem', 'salamandra', 'corvo']] },
    ],
  },
  {
    id: 'city', name: 'Carbonara City', act: 6,
    story: 'From the volcano\'s rim you can see it at last: a city of neon on the plain, every sign buzzing, every street a strand of spaghetti. Carbonara City never sleeps. Its rats run the streets, its pigeons run the rooftops, and Ratto Raviolone runs all of them.',
    clear: 'Ratto Raviolone climbs out of the wreck of his limo, straightens his tie and hands you the keys to the city. The neon flickers. For once, nobody is collecting.',
    tune: { enchant: 1.6, depth: 0.05, winHeal: 0.15, minionHp: 3.8, minionAtk: 3.3, eliteHp: 4.4, eliteAtk: 3.6, bossHp: 3.7, bossAtk: 2.7 },
    look: { sky: ['#05020f', '#0a0420', '#120830', '#1c0c40', '#2a1050', '#3a1458'], sun: ['#ff2bd6', '#29e7ff'],
      horizon: 'city', tower: '#0c0818', window: '#ffe14d', neon: ['#ff2bd6', '#29e7ff', '#39ff88'], floor: '#0a0814', grid: '#ff2bd6', line: '#29e7ff' },
    minions: ['ratto', 'piccione', 'cono', 'lampione'],
    elites: ['gatto', 'coccodrillo'],
    boss: 'padrino',
    events: [
      { id: 'pizzeria', title: 'The 4 A.M. Pizzeria',
        text: 'One shop on the street still has its lights on. Behind the counter, a tired octopus in a paper hat is spinning dough with six arms and texting with the other two.',
        choices: [
          { label: 'Order the family special (45 gold)', cost: 45, text: 'It\'s enormous. You eat all of it. +70 HP.', effects: { hp: 70 } },
          { label: 'Offer to help in the kitchen', text: 'You burn your hands, but the tips are good. -16 HP, +70 gold.', effects: { hp: -16, gold: 70 } },
          { label: 'Ask what\'s on the walls', text: 'Signed photos, and a card pinned up under one of them. "Take it," it says. "Nobody remembers who left it."', effects: { item: 'card' } },
        ] },
      { id: 'busker', title: 'The Subway Busker',
        text: 'Down in the subway, a pigeon in sunglasses is playing a keytar with its feet. A sign on its hat reads DOUBLE OR NOTHING.',
        choices: [
          { label: 'Bet 50 gold on the next note (50%)', cost: 50, chance: 0.5,
            win: { text: 'It hits the note. You win 100 gold, and it nods at you like a colleague.', effects: { gold: 100 } },
            lose: { text: 'It misses the note, then pockets your money anyway. Rules are rules.', effects: {} } },
          { label: 'Dance', text: 'A crowd gathers. Some of them throw money, one of them throws a shoe. -10 HP, +55 gold.', effects: { hp: -10, gold: 55 } },
          { label: 'Request a ballad', text: 'It plays something slow. You feel a bit better about everything. +28 HP.', effects: { hp: 28 } },
        ] },
      { id: 'offer', title: 'An Offer You Can\'t Refuse',
        text: 'A long black car pulls up. The back window rolls down an inch. "The boss would like you to have this," says a voice. "As a gift." Nothing here is a gift.',
        choices: [
          { label: 'Accept the gift', text: 'An envelope of money and a card that whispers. (A cursed card and 110 gold.)', effects: { cursed: true, gold: 110 } },
          { label: 'Refuse, politely (50%)', chance: 0.5,
            win: { text: 'The window rolls up. The car leaves. Something falls out of the door as it goes.', effects: { item: 'any', minRarity: 3 } },
            lose: { text: 'Two cats get out of the car. You get to know them. -38 HP.', effects: { hp: -38 }, death: 'an offer you couldn\'t refuse' } },
          { label: 'Run', text: 'You run. The car doesn\'t follow. You\'re not sure that\'s better.' },
        ] },
      { id: 'taxi', title: 'The Taxi Rank',
        text: 'A cab with a crocodile behind the wheel idles at the kerb. The meter is already running. It has been running, apparently, since 1986.',
        choices: [
          { label: 'Take a ride (40 gold)', cost: 40, text: 'He takes a shortcut through the sewers. You arrive rested, and he knows a guy. (+5% attack speed for the rest of the run.)', effects: { tonic: 'doppio' } },
          { label: 'Check the back seat (60%)', chance: 0.6,
            win: { text: 'Lost property: something good, and some change down the side.', effects: { item: 'any', gold: 35 } },
            lose: { text: 'The crocodile catches you. He charges you for the snap. -30 HP.', effects: { hp: -30 }, death: 'a taxi driver' } },
          { label: 'Walk', text: 'It\'s a nice night for it. +20 HP.', effects: { hp: 20 } },
        ] },
    ],
    groups: [
      { from: 0, list: [['ratto', 'ratto', 'ratto'], ['piccione', 'piccione'], ['cono', 'ratto'], ['lampione', 'ratto', 'ratto'], ['piccione', 'ratto']] },
      { from: 3, list: [['ratto', 'ratto', 'ratto', 'ratto'], ['piccione', 'piccione', 'piccione'], ['cono', 'cono', 'lampione'], ['cono', 'ratto', 'ratto', 'lampione'], ['piccione', 'piccione', 'ratto', 'ratto']] },
      { from: 6, list: [['ratto', 'ratto', 'ratto', 'ratto', 'ratto'], ['piccione', 'piccione', 'piccione', 'piccione'], ['cono', 'cono', 'lampione', 'lampione'], ['cono', 'ratto', 'piccione', 'lampione', 'ratto'], ['cono', 'cono', 'ratto', 'ratto', 'piccione']] },
    ],
  },
];

// Overtime's floor for a zone: what brings its minions, elites and boss up to the last zone's strength
// (average HP, and damage per second, of each kind as the zone fields it). Never below 1.
const otFloors = {};
function otFloor(zone) {
  if (otFloors[zone.id]) return otFloors[zone.id];
  const ids = (z, kind) => kind === 'minion' ? z.minions : kind === 'elite' ? z.elites : [z.boss];
  const avg = (z, kind, k) => ids(z, kind).reduce((t, id) => t + (k === 'hp' ? ENEMIES[id].hp : ENEMIES[id].atk / ENEMIES[id].interval), 0) / ids(z, kind).length * z.tune[kind + (k === 'hp' ? 'Hp' : 'Atk')];
  const last = ZONES[ZONES.length - 1], out = {};
  for (const kind of ['minion', 'elite', 'boss']) out[kind] = { hp: Math.max(1, avg(last, kind, 'hp') / avg(zone, kind, 'hp')), atk: Math.max(1, avg(last, kind, 'atk') / avg(zone, kind, 'atk')) };
  return (otFloors[zone.id] = out);
}

if (typeof module !== 'undefined') module.exports = { otFloor, ENEMIES, ZONES, ENCHANTMENTS, scaledEnemy, enchantDef, rollEnchantments };
