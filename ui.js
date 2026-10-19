// The page: settings, the fight runner every screen shares, and the screens themselves.
// The #debug fight lab lets you put any enemies against any weapon.

const SETTINGS_KEY = 'autoboss-settings';
const STEP = 1 / 30;          // fixed sim step, the same one balance.js uses
const END_PAUSE = 1.8;        // seconds the result stays on the stage before the next screen

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const view = makeView($('cv'));
let settings = loadSettings();
let fight = null, scene = null, onEnd = null, acc = 0, last = performance.now(), endWait = 0;

function loadSettings() {
  const d = { speed: 1, sound: true };
  try { return { ...d, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; } catch (e) { return d; }
}
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {} }

// Fights -------------------------------------------------------------------------------------

// Put a fight on the stage without starting it (the pre-fight screen shows who you'll face).
function preview(hero, defs, sc, rng) {
  fight = newFight(hero, defs, rng); fight.running = false;
  view.setFight(fight); scene = sc; onEnd = null; $('result').hidden = true;
}
// Start the fight on the stage; done(f) runs once it ends and the result has been shown.
function startFight(done) {
  fight.running = true; onEnd = done; acc = 0; $('result').hidden = true;
  document.body.dataset.fighting = '1';
}

function showResult(won) {
  const b = cosmeticsOf(profile).banner;       // the equipped victory banner (cosmetic)
  $('result').innerHTML = won ? `<b class="win">${esc(b.win)}</b>` : `<b class="loss">${esc(b.loss)}</b>`;
  $('result').hidden = false;
  (won ? SFX.win : SFX.lose)();
}

function sound(e) {
  if (e.type === 'attack') SFX.fire(e.weapon, false);
  else if (e.type === 'hurt') SFX.hurt(e.heavy);
  else if (e.type === 'dodge') SFX.dodge();
  else if (e.type === 'windup') SFX.windup(e.time);
  else if (e.type === 'spawn') SFX.spawn();
  else if (e.type === 'shield') SFX.shield();
  else if (e.type === 'heal' && e.target !== 'hero') SFX.heal();
}
view.onLand = e => {
  if (e.type === 'hit') { if (e.weapon === 'bazooka' && !e.minor) SFX.boom(); if (e.blocked && e.dmg < 3) SFX.clink(); }
  else if (e.type === 'miss') SFX.miss();
  else if (e.type === 'kill') SFX.kill();
  else if (e.type === 'interrupt') SFX.interrupt();
  else if (e.type === 'phase') SFX.phase();
};

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  let drawDt = dt;
  if (fight && fight.running && !fight.done) {
    acc += dt * settings.speed; drawDt = dt * settings.speed;
    while (acc >= STEP && !fight.done) {
      acc -= STEP;
      const ev = step(fight, STEP);
      view.events(ev, fight); ev.forEach(sound);
    }
    if (fight.done) { endWait = END_PAUSE; showResult(fight.won); }
  } else if (fight && fight.done && onEnd && (endWait -= dt) <= 0) {
    const f = fight, cb = onEnd; onEnd = null; f.running = false; delete document.body.dataset.fighting;
    cb(f);
  }
  view.draw(drawDt, scene);
  requestAnimationFrame(frame);
}

// Shared pieces ------------------------------------------------------------------------------

const MOVE_TEXT = {
  slam: m => 'Heavy slam (' + m.windup + 's wind-up)',
  volley: m => m.hits + '-hit volley' + (m.windup ? ' (' + m.windup + 's wind-up)' : ''),
  summon: m => 'Summons ' + (m.count > 1 ? m.count + '× ' : '') + m.spawn.name,
  shield: m => 'Raises a shield',
  heal: m => 'Heals ' + pct(m.amount) + (m.windup ? ' (' + m.windup + 's wind-up)' : ''),
  dodge: m => 'Dodge stance',
  enrage: m => 'Enrages',
};
function chips(def, showHidden) {
  const out = [];
  for (const k in def.traits) out.push(`<span class="chip trait" title="${esc(TRAITS[k].tip(def.traits[k]))}">${TRAITS[k].name}${typeof def.traits[k] === 'number' && k === 'armour' ? ' ' + def.traits[k] : ''}</span>`);
  for (const k in def.weak) out.push(`<span class="chip weak">${DAMAGE_TYPES[k].name} ×${def.weak[k]}</span>`);
  for (const k in def.resist) out.push(`<span class="chip resist">${DAMAGE_TYPES[k].name} ×${def.resist[k]}</span>`);
  return `<div class="chips">${out.join('')}</div>`;
}
// Enemy cards: portrait, HP, traits, weaknesses and moves. Phase changes stay hidden unless shown.
function foeCards(defs, showPhases) {
  const seen = {};
  return `<div class="foes">${defs.map(d => {
    seen[d.id] = (seen[d.id] || 0) + 1;
    if (seen[d.id] > 1) return '';
    const n = defs.filter(x => x.id === d.id).length;
    const moves = (d.moves || []).map(m => MOVE_TEXT[m.kind](m));
    const phases = (d.phases || []).map(p => 'At ' + pct(p.at) + ' HP: ' + (showPhases ? describePhase(p) : '???'));
    return `<div class="foe ${d.boss ? 'boss' : d.elite ? 'elite' : ''}${d.ench && d.ench.length ? ' enchanted' : ''}"><img alt="" src="${enemyThumb(d)}">
      <b>${n > 1 ? n + '× ' : ''}${esc(d.name)}</b><span class="muted">${d.hp} HP · hits ${d.atk} every ${d.interval}s</span>${chips(d)}
      ${moves.length || phases.length ? `<div class="moves">${moves.concat(phases).map(esc).join(' · ')}</div>` : ''}</div>`;
  }).join('')}</div>`;
}
function describePhase(p) {
  const a = p.add || {}, bits = [];
  for (const k in a.traits || {}) if (TRAITS[k]) bits.push('becomes ' + TRAITS[k].name.toLowerCase());
  if (a.atk) bits.push('hits ' + Math.round((a.atk - 1) * 100) + '% harder');
  for (const m of a.moves || []) bits.push(MOVE_TEXT[m.kind](m).toLowerCase());
  return bits.join(', ');
}
const weaponPick = (w, pressed, extra) => `<button class="pick" data-weapon="${w.id}" aria-pressed="${pressed}">
  <img class="icon" alt="" src="${iconURL(w.id)}"><b>${esc(w.name)} <span class="muted">${DAMAGE_TYPES[w.type].name.toUpperCase()}</span></b><small>${esc(w.blurb)}${extra || ''}</small></button>`;
const TARGETS = [['front', 'FIRST', 'The enemy at the front of the line.'], ['lowest', 'WEAKEST', 'The enemy with the least HP and shield left: finish things off.'],
  ['threat', 'BIGGEST THREAT', 'Anyone winding up a move first, then whoever hits hardest. Summoners count extra.']];
const targetPicker = cur => `<div class="seg" id="targeting">${TARGETS.map(([k, l, tip]) => `<button data-target="${k}" aria-pressed="${cur === k}" title="${esc(tip)}">${l}</button>`).join('')}</div>`;
// The bar under the arena: targeting, then FIGHT! with a readout beside it.
function fightBar(target, readout, id) {
  const bar = $('fightbar');
  bar.innerHTML = `<label>TARGET</label>${targetPicker(target)}<div class="go"><button class="btn primary big" id="${id || 'go'}">FIGHT!</button><span class="muted">${esc(readout)}</span></div>`;
  bar.hidden = false;
}

// Controls -----------------------------------------------------------------------------------

function syncControls() {
  document.querySelectorAll('#speed button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.speed === settings.speed));
  $('sound').textContent = settings.sound ? 'SOUND ON' : 'SOUND OFF'; $('sound').setAttribute('aria-pressed', settings.sound);
  SFX.setOn(settings.sound);
}
$('speed').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (b) { settings.speed = +b.dataset.speed; saveSettings(); syncControls(); } });
$('sound').addEventListener('click', () => { settings.sound = !settings.sound; saveSettings(); syncControls(); });
document.addEventListener('pointerdown', SFX.unlock);

// Screens ------------------------------------------------------------------------------------

// The run ---------------------------------------------------------------------------------

const RUN_KEY = 'autoboss-run';
let run = null;              // the title screen offers to continue a saved run
// A save from an older version of the run state is dropped, so the title screen starts fresh.
function loadRun() {
  try {
    for (const old of ['autoboss-run-v1']) localStorage.removeItem(old);
    const r = JSON.parse(localStorage.getItem(RUN_KEY));
    if (r && r.v === 7 && r.screen) { r.act = r.zone; r.v = 8; }       // version 7 runs only lack the act counter
    if (r && r.v === 8 && r.screen) { Object.assign(r, CARD_STATE(), { owned: r.cards.slice() }); r.v = 9; }   // 8: the board was every card
    if (r && r.v === RUN_VERSION && r.screen) return r;
    if (r) localStorage.removeItem(RUN_KEY);
  } catch (e) {}
  return null;
}
function saveRun() { try { if (run) localStorage.setItem(RUN_KEY, JSON.stringify(run)); else localStorage.removeItem(RUN_KEY); } catch (e) {} }
// Every action: change the run, save it, redraw the current screen.
function act(fn, ...args) { fn(run, ...args); bankIfOver(); saveRun(); show(); }

// The lifetime profile (profile.js) lives under its own key, apart from the run save. It's only ever
// migrated forward, never discarded: an unreadable profile is kept aside under a backup key.
const PROFILE_KEY = 'autoboss-profile';
let profile = loadProfile();
function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return newProfile();
    try { return migrateProfile(JSON.parse(raw)); }
    catch (e) { localStorage.setItem(PROFILE_KEY + '-unreadable-' + Date.now(), raw); return newProfile(); }
  } catch (e) { return newProfile(); }
}
function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {} }
// A run that has ended pays the bank once (recordRunEnd marks it banked); so does one left for a new run.
function bankIfOver() { if (run && run.over && !run.banked) { recordRunEnd(profile, run); saveProfile(); } }
function abandonSaved() {
  const saved = loadRun();
  if (saved && !saved.banked && saved.cls) { recordRunEnd(profile, saved, !saved.over); saveProfile(); }
}
function startNewRun(seed) { abandonSaved(); run = newRun(seed); saveRun(); show(); }

// An item as a card: icon, name in its rarity colour, then every stat line. attrs makes it a button.
function itemCard(it, attrs, extra) {
  if (it.slot === 'card') return cardCard(it.id, attrs, extra);
  const tag = attrs ? 'button' : 'div';
  return `<${tag} class="item r${it.rarity}" ${attrs || ''}><img class="icon" alt="" src="${iconURL(itemIcon(it))}">
    <b>${esc(itemName(it))}</b><small>${RARITIES[it.rarity].name} ${slotLabel(it)}${it.forged ? ' · forged' : ''}</small>
    <ul>${itemLines(it).map(l => `<li${l.startsWith('★') ? ' class="leg"' : ''}>${esc(l)}</li>`).join('')}</ul>${extra || ''}</${tag}>`;
}
// A card on the board or on offer: type icon, name, type and tags, text, drawback. note: what it does this fight.
// starred: the card has its ★ upgrade (the board and fight previews show it).
function cardCard(id, attrs, extra, note, starred) {
  const c = CARDS[id], tag = attrs ? 'button' : 'div', lines = cardLines(id, starred, run && run.curses && run.curses[id]);
  return `<${tag} class="item cardi r${c.rarity} t-${c.type}${starred ? ' starred' : ''}" ${attrs || ''}><img class="icon" alt="" src="${iconURL(CARD_TYPES[c.type].icon)}">
    <b>${starred ? '★ ' : ''}${esc(c.name)}</b><small>${RARITIES[c.rarity].name} ${CARD_TYPES[c.type].name.toLowerCase()} card · ${c.tags.map(t => `<span style="color:${CARD_TAGS[t].color}">${t}</span>`).join(' / ')}</small>
    <ul>${lines.slice(1).map(l => `<li${l.startsWith('★') ? ' class="star"' : l.startsWith('⚠') ? ' class="leg"' : ''}>${esc(l)}</li>`).join('')}${note ? `<li class="note">${esc(note)}</li>` : ''}</ul>${extra || ''}</${tag}>`;
}
// The card collection: the cards switched on (the board) and its empty slots, set bonuses, the cards
// switched off, then one-use cards. Between stops and before a fight (cardSite) a tap switches a card
// on or off and USE spends a one-use card. note: what a card will do in this fight.
function collectionHtml(note) {
  const sets = activeSets(run.cards), live = cardSite(run), off = run.owned.filter(id => !run.cards.includes(id) && CARDS[id].type !== 'oneuse');
  const once = run.owned.filter(id => CARDS[id].type === 'oneuse'), full = run.cards.length >= run.cardSlots;
  const card = (id, on) => cardCard(id, live && (on || !full) ? `data-toggle="${id}" aria-pressed="${on}" title="${on ? 'Switch off' : 'Switch on'}"` : null,
    on ? '<span class="price on">ON</span>' : '', note && note(id), run.stars.includes(id)).replace('class="item', `class="item${on ? ' on' : ' off'}`);
  const useBtn = id => { const u = CARDS[id].use, ok = live && !(u.kind === 'cleanse' && !cursedCards(run).length) && !(u.kind === 'discard' && run.owned.length < 2);
    return `<button class="btn use" data-use="${id}" ${ok ? '' : 'disabled'}>USE</button>`; };
  return `<div class="muted">${run.cards.length} of ${run.cardSlots} switched on${live ? ' · tap a card to switch it on or off' : ''}</div>
    <div class="grid2">${run.cards.map(id => card(id, true)).join('')}${Array.from({ length: run.cardSlots - run.cards.length }, () => emptySlot('Card slot')).join('')}</div>
    ${sets.length ? `<div class="sets">${sets.map(t => `<span class="chip" style="border-color:${CARD_TAGS[t].color};color:${CARD_TAGS[t].color}">${esc(SET_BONUSES[t].text)}</span>`).join('')}</div>` : ''}
    ${run.primed.length ? `<div class="muted">Next fight: ${run.primed.map(id => `<span style="color:var(--r${CARDS[id].rarity})">${esc(CARDS[id].name)}</span>`).join(', ')}</div>` : ''}
    ${off.length ? `<h4>SWITCHED OFF</h4><div class="grid2">${off.map(id => card(id, false)).join('')}</div>` : ''}
    ${once.length ? `<h4>ONE-USE</h4><div class="grid2">${once.map(id => cardCard(id, null, useBtn(id), null, false)).join('')}</div>` : ''}
    <div class="muted">${run.cardSlots} of ${cardCap(run)} card slots${run.cardSlots < cardCap(run) ? ' · beat an elite for another' : ''}${actIdx(run) < ZONES.length - 1 ? ' · the next act adds room for ' + ECON.actCardSlots + ' more' : ' · every Overtime lap adds one more'}</div>`;
}
// Switching cards and spending one-use cards works from the side panel and the pre-fight screen alike.
document.addEventListener('click', e => {
  if (!run || document.body.dataset.fighting) return;
  const t = e.target.closest('[data-toggle]'), u = e.target.closest('[data-use]');
  if (u && !u.disabled) { e.stopPropagation(); act(useCard, u.dataset.use); }
  else if (t) { e.stopPropagation(); act(toggleCard, t.dataset.toggle); }
}, true);
// The stats panel and item comparisons: [key, label, format, tip]. Damage taken only shows when it's
// not ×1, and is the one stat where less is better.
const STAT_ROWS = [
  ['maxHp', 'Max HP', v => Math.round(v)],
  ['shield', 'Shield', v => Math.round(v), 'From armour and shield items. Soaks damage before your HP and refills at the start of every fight.'],
  ['dps', 'DPS', v => v.toFixed(1), 'Damage per second against one target, crits included.'],
  ['dmg', 'Damage', v => v.toFixed(1), 'Per hit, before the enemy\'s armour, weaknesses and resistances.'],
  ['aps', 'Attack speed', v => v.toFixed(2) + '/s', 'Percentage bonuses multiply: +10% twice is +21%.'],
  ['crit', 'Crit chance', v => pct(v)],
  ['critx', 'Crit damage', v => '×' + v.toFixed(1)],
  ['dodge', 'Dodge', v => pct(v), 'Capped at 60%.'],
  ['taken', 'Damage taken', v => '×' + v.toFixed(2)],
];
const better = (k, d) => k === 'taken' ? d < 0 : d > 0;
// A difference as text, or '' when it rounds away.
function statDiff(k, d, fmt) {
  const t = String(fmt(Math.abs(d))).replace(/^×/, '');
  return /[1-9]/.test(t) ? (d > 0 ? '+' : '−') + t : '';
}
function statsPanel() {
  const h = compileHero(run, run.loadout.weapon), now = statSheet(h), base = baseSheet(h), w = run.inv.weapons[run.loadout.weapon];
  const rows = STAT_ROWS.filter(([k]) => k !== 'taken' || Math.abs(now.taken - 1) > 0.001).map(([k, label, fmt, tip]) => {
    const d = now[k] - base[k], b = statDiff(k, d, fmt);
    return `<div class="stat"${tip ? ` title="${esc(tip)}"` : ''}><span>${label}</span><b>${fmt(now[k])}</b><small>${fmt(base[k])}${b ? ` <span class="${better(k, d) ? 'up' : 'down'}">${b}</span>` : ''}</small></div>`;
  });
  return `<div class="card" id="statsCard"><h3>STATS${w ? ' · ' + esc(weaponById(w.base).name.toUpperCase()) : ''}</h3><div class="stats">${rows.join('')}</div>
    <div class="muted">Base (the weapon alone) and what your gear, cards and class add.</div></div>`;
}
// What taking item it would change, against what it replaces (slot k, or the default spot: see runWith).
// label: what the comparison is against (by default the replaced item's name).
function compareHtml(it, k, label) {
  if (!run || it.slot === 'card') return '';
  const w = runWith(run, it, k), before = statSheet(compileHero(run, w.slot)), after = statSheet(compileHero(w.run, w.slot));
  const chips = STAT_ROWS.map(([key, label, fmt]) => { const d = after[key] - before[key], t = statDiff(key, d, fmt);
    return t ? `<span class="${better(key, d) ? 'up' : 'down'}">${t} ${label.toLowerCase()}</span>` : ''; }).filter(Boolean);
  const vs = label || (w.was ? 'vs ' + itemName(w.was) : 'into an empty slot');
  return `<div class="cmp"><small>${esc(vs)}:</small> ${chips.length ? chips.join(' ') : '<small>no change to these stats</small>'}</div>`;
}
const emptySlot = label => `<div class="item empty"><span class="icon"></span><b>${label}</b><small>Empty</small></div>`;
function sidePanel() {
  if (!run) { $('side').innerHTML = ''; return; }
  const inv = run.inv;
  const C = clsOf(run);
  $('side').innerHTML = `<div class="sheet-head"><b></b><button class="btn" data-drawer="">CLOSE</button></div>
    ${statsPanel()}<div class="card stack" id="invCard"><h3>INVENTORY${C ? ` · <img class="icon" style="width:16px;height:16px;display:inline-block;vertical-align:middle" alt="" src="${iconURL(C.icon)}"> ${esc(C.name.toUpperCase())}` : ''}</h3>
    ${inv.weapons.map((w, k) => w ? itemCard(w) : emptySlot('Weapon ' + (k + 1))).join('')}
    ${PARTS.map(p => inv.armour[p] ? itemCard(inv.armour[p]) : emptySlot(ARMOUR_PARTS[p].name + ' armour')).join('')}${inv.trinkets.map((t, k) => t ? itemCard(t) : emptySlot('Trinket ' + (k + 1))).join('')}
    <div class="muted">Seed ${run.seed} · row ${Math.max(0, run.row + 1)} of ${MAP_ROWS} · ${run.cleared} fights won</div></div>
    <div class="card stack" id="boardCard"><h3>CARDS</h3>${run.owned.length ? collectionHtml() : '<p class="muted">No cards yet. You draw one after every won fight.</p>'}</div>`;
  dock();
}
// Phones: the dock under the screen opens the inventory or the card board as a sheet.
function dock() {
  const d = document.body.dataset;
  if (!run) { delete d.dock; delete d.drawer; $('dock').innerHTML = ''; return; }
  d.dock = '1';
  const held = allItems(run).length, slots = run.inv.weapons.length + PARTS.length + run.inv.trinkets.length;
  $('dock').innerHTML = `<button class="btn" data-drawer="inv" aria-pressed="${d.drawer === 'inv'}">BAG <small>${held}/${slots}</small></button>
    <button class="btn" data-drawer="board" aria-pressed="${d.drawer === 'board'}">CARDS <small>${run.cards.length}/${run.cardSlots} on</small></button>`;
}
function drawer(which) {
  const d = document.body.dataset;
  if (!which || d.drawer === which) delete d.drawer; else { d.drawer = which; $('side').scrollTop = 0; }
  sidePanel();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-drawer]'); if (b) return drawer(b.dataset.drawer);
  if (e.target.id === 'scrim') return drawer('');
  // touch screens have no hover: tapping a chip with a tooltip shows it
  const tip = e.target.closest('.chip[title]'); if (tip) toast(tip.title);
});
// MENU: back to the title screen. The run is saved after every decision, so CONTINUE RUN resumes it.
// It's off from FIGHT! until the result is in (a fight isn't saved until it ends).
$('status').addEventListener('click', e => { if (e.target.id === 'menu' && !document.body.dataset.fighting) { run = null; show(); } });
let toastT = 0;
function toast(text) { const t = $('toast'); t.textContent = text; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
function statusBar() {
  $('status').innerHTML = run ? `<button class="btn" id="menu" title="Back to the title screen. The run is saved: CONTINUE RUN picks it up.">MENU</button><div class="pill hp"><label>HP</label>${run.hp}/${maxHp(run)}</div>
    ${(sh => sh > 0 ? `<div class="pill sh" title="Your shield: soaks damage before your HP and refills at the start of every fight."><label>SHIELD</label>${sh}</div>` : '')(Math.round(heroShield(compileHero(run, run.loadout.weapon))))}
    <div class="pill gold"><span class="coin"></span>${run.gold}</div>${lapOf(run) ? `<div class="pill ot"><label>OVERTIME</label>LAP ${lapOf(run)} · ACT ${actOf(run)}</div>` : `<div class="pill"><label>ACT</label>${actOf(run)}/${ZONES.length}</div>`}` : '';
}
// The hero's colours follow the rarity of the held weapon and of the best armour piece.
const sceneFor = title => withCos({ ...sceneBase(title) });
const withCos = sc => { sc.cos = cosmeticsOf(profile); return sc; };
const sceneBase = title => {
  const w = run && run.inv.weapons[run.loadout.weapon], a = run ? armourPieces(run) : [];
  return { look: ZONES[run ? run.zone : 0].look, title, tier: { weapon: w ? w.rarity * 2 : 0, armour: a.length ? Math.max(...a.map(x => x.rarity)) * 2 + 1 : 0 } };
};

// Draw whatever run.screen says, or the title screen when there's no run.
function show() {
  statusBar(); sidePanel();
  $('fightbar').hidden = true; $('fightbar').onclick = null;
  const s = run && run.screen, type = s ? s.type : 'title';
  if (document.body.dataset.screen !== type) { delete document.body.dataset.drawer; dock(); window.scrollTo(0, 0); }
  document.body.dataset.screen = type;
  if (!s) return titleScreen();
  ({ class: classScreen, start: startScreen, map: mapScreen, prefight: prefightScreen, reward: rewardScreen, treasure: treasureScreen,
    shop: shopScreen, merchant: merchantScreen, rest: restScreen, event: eventScreen, summary: summaryScreen, replace: replaceScreen, act: actScreen, victory: victoryScreen,
    draw: drawScreen, peek: peekScreen, discard: discardScreen, cleanse: cleanseScreen })[s.type]();
}

function titleScreen() {
  preview(baseHero('sword'), [], sceneFor(''));
  const saved = loadRun();
  $('screen').innerHTML = `<div class="card"><h2>INSERT COIN</h2>
    <p>Fights are automatic. Every choice between them is yours: the route, the weapon, the loot. HP carries over. Die and the run is over.</p>
    <div class="row">${saved && !saved.over ? '<button class="btn primary big" id="continue">CONTINUE RUN</button>' : ''}
      <button class="btn ${saved && !saved.over ? '' : 'primary big'}" id="newRun">NEW RUN</button>
      <input id="seedIn" placeholder="seed (optional)" inputmode="numeric" style="font:18px var(--body);background:#000;color:var(--text);border:2px solid var(--line);padding:6px;width:11em">
      <button class="btn" data-go="lab">FIGHT LAB</button></div></div>
    <div class="card"><h2>ARCADE</h2><p class="muted">${profile.runs} runs · ${profile.clears} cleared · deepest row ${profile.deepest} · bank <span class="coin"></span> ${profile.bank}</p>
    <div class="row"><button class="btn" data-go="stats">STATS</button><button class="btn" data-go="cosmetics">COSMETICS SHOP</button></div></div>`;
  $('screen').onclick = e => {
    if (e.target.id === 'continue') { run = saved; show(); }
    if (e.target.id === 'newRun') { const v = $('seedIn').value.trim(); startNewRun(v ? +v || hashSeed(v) : (Math.random() * 2 ** 31) >>> 0); }
  };
}
const hashSeed = str => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

function classScreen() {
  preview(baseHero(run.screen.offers[0].base), [], sceneFor(ZONES[run.zone].name.toUpperCase()));
  $('screen').innerHTML = `<div class="card"><h2>CHOOSE YOUR CLASS</h2><p class="muted">Then your weapon. Any class can use any weapon.</p>
    <div class="grid2">${Object.values(CLASSES).map(c => `<button class="pick" data-cls="${c.id}"><img class="icon" alt="" src="${iconURL(c.icon)}"><b>${esc(c.name.toUpperCase())}</b>
      <small>${esc(c.blurb)}<br>${c.lines.map(esc).join('<br>')}</small></button>`).join('')}</div></div>`;
  $('screen').onclick = e => { const b = e.target.closest('[data-cls]'); if (b) act(chooseClass, b.dataset.cls); };
}

function startScreen() {
  preview(baseHero(run.screen.offers[0].base), [], sceneFor(ZONES[run.zone].name.toUpperCase()));
  $('screen').innerHTML = `<div class="card"><h2>CHOOSE YOUR WEAPON</h2><p class="muted">One of three. You'll find more on the way, and you can carry ${run.inv.weapons.length === 3 ? 'three' : 'two'}.</p>
    <div class="grid2">${run.screen.offers.map((it, k) => weaponPick(weaponById(it.base), false).replace('data-weapon=', `data-start="${k}" data-weapon=`)).join('')}</div>
    <p class="muted" style="margin-top:10px">Strong against one kind of enemy, bad against another. Read the enemy cards before each fight.</p></div>`;
  $('screen').onclick = e => { const b = e.target.closest('[data-start]'); if (b) act(chooseStart, +b.dataset.start); };
}

// The map: boss at the top, start at the bottom. The paths out of where you stand glow, the rest of
// what you can still reach stays solid, and what you can't reach any more is dimmed. Hovering a node
// (or a first tap on a touch screen) traces every path forward from it.
const TAP_HINT = 'Tap a stop to trace where it leads. Tap a glowing stop again to go.';
function mapScreen() {
  const rows = run.map.rows, can = reachable(run), H = 58, h = rows.length * H, X = l => (l + 0.5) / 4 * 100, Y = r => h - (r + 0.5) * H;
  const later = ahead(run, run.at), lines = [], nodes = [];
  for (const row of rows) for (const n of row) {
    for (const id of n.next) {
      const m = nodeById(run, id), cls = run.visited.includes(n.id) && run.visited.includes(id) ? 'l-done' : run.at === n.id && can.includes(id) ? 'l-open'
        : later.has(n.id) && later.has(id) ? 'l-ahead' : 'l-off';
      lines.push(`<line class="${cls}" data-a="${n.id}" data-b="${id}" x1="${X(n.lane)}" y1="${Y(n.row)}" x2="${X(m.lane)}" y2="${Y(m.row)}" stroke-width="${cls === 'l-off' ? 2 : 3}" vector-effect="non-scaling-stroke" ${cls === 'l-off' ? 'stroke-dasharray="4 4"' : ''}/>`);
    }
    const t = NODE_TYPES[n.type], state = run.at === n.id ? 'here' : can.includes(n.id) ? 'open' : run.visited.includes(n.id) ? 'done' : later.has(n.id) ? 'ahead' : 'gone';
    // elites and the boss show who they are, so routing around a bad matchup is a real choice
    const enc = n.type === 'elite' || n.type === 'boss' ? encounterFor(run, n) : null, who = enc ? ENEMIES[enc.ids[0]] : null;
    const img = who ? enemyThumb(who) : iconURL(t.icon);
    const label = who ? t.name + ': ' + who.name + (enc.ench.length ? ' · enchanted: ' + enc.ench.map(id => ENCHANTMENTS[id].name + ' (' + ENCHANTMENTS[id].text + ' Counter: ' + ENCHANTMENTS[id].counter + ')').join(' + ') : '') : t.name;
    nodes.push(`<button class="node ${state} ${n.type}" data-node="${n.id}" style="left:${X(n.lane)}%;top:${Y(n.row)}px" title="${esc(label)}" ${state === 'open' ? '' : 'aria-disabled="true"'}><img alt="${esc(label)}" src="${img}">${enc && enc.ench.length ? `<span class="ench-badge">${enc.ench.length}</span>` : ''}</button>`);
  }
  $('screen').innerHTML = `<div class="card"><h2>${esc(ZONES[run.zone].name.toUpperCase())}${lapOf(run) ? ' · OVERTIME LAP ' + lapOf(run) : ''}</h2>
    <div class="row" style="margin-bottom:10px"><button class="btn" id="merchant"><img class="icon" style="width:16px;height:16px;display:inline-block;vertical-align:middle" alt="" src="${iconURL('cart')}"> MERCHANT</button>
      <span class="muted">Open any time between stops. New stock every row.</span></div>
    <p class="muted">Pick your next stop. ${Object.entries(NODE_TYPES).map(([k, t]) => `<span class="chip"><img class="icon" style="width:16px;height:16px" alt="" src="${k === 'boss' ? enemyThumb(ENEMIES[ZONES[run.zone].boss]) : iconURL(t.icon)}">${t.name}</span>`).join(' ')}</p>
    <p class="muted map-hint">${matchMedia('(hover: none)').matches ? TAP_HINT : 'Hover a stop to trace where it leads.'}</p>
    <div class="map style-${cosmeticsOf(profile).mapStyle.id}" style="height:${h}px"><svg viewBox="0 0 100 ${h}" preserveAspectRatio="none">${lines.join('')}</svg>${nodes.join('')}</div>${mapPreview()}</div>`;
  const map = $('screen').querySelector('.map'), hint = $('screen').querySelector('.map-hint');
  let traced = null, touch = false;
  // the node and everything reachable from it light up; the rest of the map fades back
  const trace = id => {
    traced = id;
    const on = id ? ahead(run, id).add(id) : null;
    map.classList.toggle('tracing', !!on);
    map.querySelectorAll('line').forEach(l => l.classList.toggle('trace', !!on && on.has(l.dataset.a) && on.has(l.dataset.b)));
    map.querySelectorAll('.node').forEach(b => b.classList.toggle('trace', !!on && on.has(b.dataset.node)));
  };
  map.addEventListener('pointerdown', e => { touch = e.pointerType !== 'mouse'; if (touch) hint.textContent = TAP_HINT; });
  map.addEventListener('pointerover', e => { if (e.pointerType === 'mouse') { const b = e.target.closest('[data-node]'); trace(b ? b.dataset.node : null); } });
  map.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') trace(null); });
  map.addEventListener('focusin', e => { const b = e.target.closest('[data-node]'); if (b && !touch) trace(b.dataset.node); });     // keyboard
  $('screen').onclick = e => {
    const b = e.target.closest('[data-node]');
    if (b) {
      const id = b.dataset.node;
      // touch has no hover: the first tap traces (and names the stop), a second tap on an open one goes
      if (b.classList.contains('open') && (!touch || traced === id)) return act(moveTo, id);
      trace(traced === id && !b.classList.contains('open') ? null : id);
      if (touch && traced) toast(b.title + (b.classList.contains('open') ? ' · tap again to go' : ''));
      return;
    }
    if (e.target.closest('#merchant')) act(openMerchant);
  };
}

// Enchantment cards on an elite or the boss: what it does and how to beat it.
const enchCards = ids => ids.length ? `<h3 style="margin-top:12px">ENCHANTED</h3><div class="grid2">${ids.map(id => { const en = ENCHANTMENTS[id];
  return `<div class="item cardi ench"><img class="icon" alt="" src="${iconURL('ench')}"><b>${esc(en.name)}</b><small>Enchantment</small>
    <ul><li>${esc(en.text)}</li><li class="note">Counter: ${esc(en.counter)}</li></ul></div>`; }).join('')}</div>` : '';
// The map's tooltip-free preview: the enchantments on the elites and boss you can reach next.
function mapPreview() {
  const list = reachable(run).map(id => nodeById(run, id)).filter(n => n.type === 'elite' || n.type === 'boss').map(n => [n, encounterFor(run, n)]).filter(([, e]) => e.ench.length);
  return list.length ? `<div class="stack" style="margin-top:10px">${list.map(([n, e]) => `<div><span class="muted">Next ${NODE_TYPES[n.type].name.toLowerCase()}: ${esc(ENEMIES[e.ids[0]].name)}</span>${enchCards(e.ench).replace('<h3 style="margin-top:12px">ENCHANTED</h3>', '')}</div>`).join('')}</div>` : '';
}

function prefightScreen() {
  const node = nodeById(run, run.screen.node), enc = encounterFor(run, node), title = NODE_TYPES[node.type].name.toUpperCase();
  const hero = heroFor(run);
  preview(hero, enc.defs, sceneFor(title + ' · ROW ' + (node.row + 1)), makeRng(enc.fightSeed).next);
  const weapons = run.inv.weapons.map((it, k) => it ? weaponPick(weaponById(it.base), run.loadout.weapon === k,
    `<br><span style="color:var(--r${it.rarity})">${esc(itemName(it))}</span>${it.affixes.length || it.legendary ? ': ' + esc(itemLines(it).slice(1).join(' · ')) : ''}`)
    .replace('data-weapon=', `data-slot="${k}" data-weapon=`) : '').join('');
  $('screen').innerHTML = `<div class="card"><h2>${title}</h2><p class="say">${esc(encounterIntro(enc.defs))}</p>${foeCards(enc.defs, enc.defs.every(d => !d.phases || run.seen[d.id]))}${enchCards(enc.ench)}</div>
    <div class="card"><h3>WEAPON</h3><div class="grid2">${weapons}</div></div>
    <div class="card stack"><h3>CARDS · THIS FIGHT</h3>${run.owned.length ? collectionHtml(id => cardFightNote(id, enc.defs, run.cards)) : '<p class="muted">No cards yet. You draw one after every won fight.</p>'}</div>`;
  // targeting and FIGHT! sit in the bar right under the arena, with the HP readout
  fightBar(run.loadout.target, `HP ${run.hp}/${maxHp(run)}`);
  const click = e => {
    if (fight && fight.running) return;
    const w = e.target.closest('[data-slot]'), t = e.target.closest('[data-target]');
    if (w) act(setLoadout, +w.dataset.slot, null);
    if (t) act(setLoadout, null, t.dataset.target);
    if (e.target.id === 'go') {
      document.querySelectorAll('#screen button, #fightbar button').forEach(b => b.disabled = true);
      startFight(f => { recordFight(profile, run, f, node); saveProfile(); act(finishFight, f); });
    }
  };
  $('screen').onclick = click; $('fightbar').onclick = click;
}

// Between acts: the zone you cleared, what you carry on, and the story of the next one.
function actScreen() {
  const done = ZONES[run.zone], next = ZONES[run.screen.next], nextLap = Math.floor((actIdx(run) + 1) / ZONES.length), O = ECON.overtime;
  const n = actIdx(run) + 2 - ZONES.length, intro = nextLap ? `Overtime lap ${nextLap}. ${esc(next.name)} again, and everything in it is tougher: enemies have +${Math.round(O.hp * n * 100)}% HP and hit +${Math.round(O.atk * n * 100)}% harder on top of their Overtime strength, elites and bosses carry more enchantments, and fights pay +${Math.round(O.gold * n * 100)}% gold. The run ends when you fall.`
    : esc(next.story);
  $('screen').innerHTML = `<div class="card"><h2>ACT ${actOf(run)} CLEARED!</h2><p class="say">${esc(done.clear)}</p>
    <p class="muted">You carry on with everything: ${run.hp}/${maxHp(run)} HP, ${run.gold} gold, ${allItems(run).length} items and ${run.owned.length} cards. Before you set off you catch your breath (+${Math.round(ECON.actHeal * 100)}% HP) and a card slot opens.</p>
    <h3 style="margin-top:12px">${nextLap ? 'OVERTIME · ' : ''}ACT ${actOf(run) + 1}: ${esc(next.name.toUpperCase())}</h3><p>${intro}</p>
    ${actIdx(run) === 0 ? '<p class="muted">New here: the Flamethrower, the Freeze Ray and the Boomerang can turn up as loot, loot is rarer, fights pay more gold, and the forge goes all the way to Legendary.</p>' : ''}
    <div class="row"><button class="btn primary big" id="onward">INTO ${esc(next.name.toUpperCase())}</button></div></div>`;
  $('screen').onclick = e => { if (e.target.closest('#onward')) act(nextAct); };
}

// After the last zone's boss: take the win, or keep going into Overtime.
function victoryScreen() {
  const O = ECON.overtime;
  $('screen').innerHTML = `<div class="card"><h2>YOU WIN!</h2><p class="say">${esc(ZONES[run.zone].clear)} Every zone is yours.</p>
    <p>That's the run won, whatever you choose now. Take the win and the run ends here. Or keep going into <b>Overtime</b>: the zones start again from ${esc(ZONES[0].name)} with everything you carry, every act tougher (the beach comes back at jungle strength, then +${Math.round(O.hp * 100)}% enemy HP, +${Math.round(O.atk * 100)}% damage and more enchantments each act), until you fall. Your deepest Overtime row goes in your stats.</p>
    <div class="row"><button class="btn primary big" id="win">TAKE THE WIN</button><button class="btn big" id="ot">OVERTIME</button></div></div>`;
  $('screen').onclick = e => { if (e.target.closest('#win')) act(takeWin); if (e.target.closest('#ot')) act(goOvertime); };
}

function rewardScreen() {
  const s = run.screen;
  $('screen').innerHTML = `<div class="card"><h2>${s.elite ? 'ELITE DOWN!' : 'CLEARED!'}</h2>
    <p><span class="coin"></span> +${s.gold} gold${s.clean ? ' (with a bonus for staying above half HP)' : ''}. Now pick one item, or skip them all for more gold. Whatever you leave washes out to sea. Then you draw a card.</p>
    <div class="grid2">${s.offers.map((it, k) => itemCard(it, `data-take="${k}"`, compareHtml(it))).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="gold"><span class="coin"></span> SKIP FOR +${s.skip} GOLD</button></div></div>`;
  $('screen').onclick = e => {
    const t = e.target.closest('[data-take]');
    if (t) act(takeReward, +t.dataset.take);
    if (e.target.closest('#gold')) act(takeReward, null);
  };
}

function treasureScreen() {
  $('screen').innerHTML = `<div class="card"><h2>TREASURE</h2><p>A chest half-buried in the sand. ${run.screen.gold ? `<span class="coin"></span> ${run.screen.gold} gold rattles loose. ` : ''}Room for one thing in your pockets.</p>
    <div class="grid2">${run.screen.offers.map((it, k) => itemCard(it, `data-take="${k}"`, compareHtml(it))).join('')}</div></div>`;
  $('screen').onclick = e => { const t = e.target.closest('[data-take]'); if (t) act(takeTreasure, +t.dataset.take); };
}

// Stock as buyable item cards.
const stockCards = (stock, attr) => `<div class="grid2">${stock.map((o, k) => itemCard(o.item, `${attr}="${k}" ${o.sold || run.gold < o.price ? 'disabled' : ''}`,
  (o.sold ? '' : compareHtml(o.item)) + `<span class="price">${o.sold ? 'SOLD' : '<span class="coin"></span> ' + o.price}</span>`)).join('')}</div>`;
// The forge: every item that can go up a rarity, with its price here.
function forgeCards(where) {
  const list = FORGE_SLOTS.map(k => [k, inventoryItem(run, k), forgeCost(run, k, where)]).filter(([, it, c]) => it && c != null);
  return `<h3 style="margin-top:14px">FORGE · RAISE AN ITEM ONE RARITY</h3>
    <p class="muted">Keeps the item and its affixes: every affix grows into the new rarity's range and one more is added. The last step, to Legendary, adds a legendary effect and its drawback.</p>${list.length
    ? `<div class="grid2">${list.map(([k, it, c]) => itemCard(it, `data-forge="${k}" ${run.gold < c ? 'disabled' : ''}`, `<span class="price">→ ${RARITIES[it.rarity + 1].name} · <span class="coin"></span> ${c}</span>`)).join('')}</div>`
    : `<p class="muted">Nothing to forge: everything you carry is ${RARITIES[forgeCap(run)].name}${forgeCap(run) < 4 ? ', as far as the forge goes this act (Legendary from act 2)' : ''}.</p>`}`;
}
// Card upgrades: each card once, for a ★ that raises its numbers.
function starCards(where) {
  const list = run.owned.map((id, k) => [k, id, starCost(run, k, where)]).filter(([, id]) => CARDS[id].type !== 'oneuse');
  if (!list.length) return '';
  return `<h3 style="margin-top:14px">UPGRADE A CARD · ★ ONCE EACH</h3><div class="grid2">${list.map(([k, id, c]) => c == null
    ? cardCard(id, 'disabled', '<span class="price">★ DONE</span>', null, true)
    : cardCard(id, `data-star="${k}" ${run.gold < c ? 'disabled' : ''}`, `<span class="price">★ ×${CARD_RULES.star} · <span class="coin"></span> ${c}</span>`)).join('')}</div>`;
}
// Curses a shop can lift, for gold.
function cleanseCards(where) {
  const list = cursedCards(run, true);
  return list.length ? `<h3 style="margin-top:14px">CLEANSE A CURSE</h3><p class="muted">Lifts the curse for good. The card keeps its upside.</p><div class="grid2">${list.map(id => { const c = cleanseCost(run, id, where);
    return cardCard(id, `data-cleanse="${id}" ${run.gold < c ? 'disabled' : ''}`, `<span class="price">CLEANSE · <span class="coin"></span> ${c}</span>`); }).join('')}</div>` : '';
}
// Selling: everything carried, with what it sells for.
function sellCards() {
  const C = clsOf(run), items = FORGE_SLOTS.map(k => [k, inventoryItem(run, k)]).filter(([, it]) => it).map(([k, it]) => [k, it, sellValue(run, k)]);
  const cards = run.owned.map((id, k) => ['card' + k, { slot: 'card', id, rarity: CARDS[id].rarity }, sellValue(run, 'card' + k)]);
  const oneWeapon = run.inv.weapons.filter(Boolean).length < 2;
  return `<h3 style="margin-top:14px">SELL${C && C.sellMult > 1 ? ' (HUSTLER: DOUBLE)' : ''}</h3><div class="grid2">${items.concat(cards).map(([k, it, v]) =>
    itemCard(it, `data-sell="${k}" ${k.startsWith('weapon') && oneWeapon ? 'disabled' : ''}`, `<span class="price">SELL · <span class="coin"></span> ${v}</span>`)).join('')}</div>`;
}
function shopClicks(e, buy, heal) {
  const b = e.target.closest('[data-buy]'), fg = e.target.closest('[data-forge]'), sl = e.target.closest('[data-sell]'), st = e.target.closest('[data-star]'), cl = e.target.closest('[data-cleanse]');
  if (cl && !cl.disabled) { SFX.coin(); act(cleanseCard, cl.dataset.cleanse); }
  if (st && !st.disabled) { SFX.coin(); act(starCard, +st.dataset.star); }
  if (sl && !sl.disabled) { SFX.coin(); act(sellItem, sl.dataset.sell); }
  if (b && !b.disabled) { SFX.coin(); act(buy, +b.dataset.buy); }
  if (fg && !fg.disabled) { SFX.coin(); act(forge, fg.dataset.forge); }
  if (e.target.id === 'heal') act(heal);
  if (e.target.id === 'leave') act(leave);
}

function shopScreen() {
  const s = run.screen;
  $('screen').innerHTML = `<div class="card"><h2>BEACH SHACK</h2><p>Tricheco Gelatino leans out of the beach shack, tusks first. "Everything is cold," he says, "including the prices." The good stuff is here, and there's always a weapon you don't have.</p>
    ${stockCards(s.stock, 'data-buy')}
    <div class="row" style="margin-top:12px"><button class="btn" id="heal" ${s.healed || run.gold < s.healCost ? 'disabled' : ''}>HEAL ${Math.round(ECON.shopHeal.share * 100)}% · ${s.healCost}G</button>
    <button class="btn" id="reroll" ${run.gold < s.rerollCost ? 'disabled' : ''}>REROLL · ${s.rerollCost}G</button>
    <button class="btn primary" id="leave">LEAVE</button></div>${forgeCards('shop')}${starCards('shop')}${cleanseCards('shop')}${sellCards()}</div>`;
  $('screen').onclick = e => { shopClicks(e, shopBuy, shopHeal); if (e.target.id === 'reroll') act(shopReroll); };
}

// The anytime merchant, opened from the map.
function merchantScreen() {
  const m = run.merchant;
  $('screen').innerHTML = `<div class="card"><h2>MERCHANT</h2><p>A seagull in a tiny apron drags a cart along the tideline. "Convenience," it squawks, "costs extra."</p>
    ${stockCards(m.stock, 'data-buy')}
    <div class="row" style="margin-top:12px"><button class="btn" id="heal" ${m.healed || run.gold < m.healCost ? 'disabled' : ''}>POTION: HEAL ${Math.round(ECON.merchantHeal.share * 100)}% · ${m.healCost}G</button>
    <button class="btn primary" id="leave">BACK TO THE MAP</button></div>${forgeCards('merchant')}${starCards('merchant')}${cleanseCards('merchant')}${sellCards()}</div>`;
  $('screen').onclick = e => shopClicks(e, merchantBuy, merchantHeal);
}

function restScreen() {
  const noHeal = hasLegendary(run, 'bloodpact');
  const slots = ECON.restUpgrade ? FORGE_SLOTS.map(k => [k, inventoryItem(run, k)]).filter(([, it]) => it && it.rarity < 3) : [];
  $('screen').innerHTML = `<div class="card"><h2>REST</h2><p>A deckchair, a parasol and the distant sound of an octopus practising scales.${ECON.restUpgrade ? ' Rest, or tinker with your kit. Not both.' : ' Upgrades are the forge\'s job; here you just rest.'}</p>
    <div class="row"><button class="btn primary big" id="heal" ${noHeal ? 'disabled' : ''}>HEAL ${Math.round(maxHp(run) * ECON.restHeal)} HP</button>
    ${noHeal ? '<span class="muted">The Bloodpact Bandana won\'t let you rest.</span><button class="btn" id="skip">MOVE ON</button>' : ''}</div>
    ${slots.length ? `<h3 style="margin-top:14px">OR UPGRADE ONE ITEM'S RARITY</h3><div class="grid2">${slots.map(([k, it]) => itemCard(it, `data-up="${k}"`, `<span class="price">→ ${RARITIES[it.rarity + 1].name}</span>`)).join('')}</div>` : ''}</div>`;
  $('screen').onclick = e => {
    const u = e.target.closest('[data-up]');
    if (u) act(rest, 'upgrade', u.dataset.up);
    if (e.target.id === 'heal') act(rest, 'heal');
    if (e.target.id === 'skip') act(rest, 'skip');
  };
}

// Slots are full: pick what the new item replaces, or leave it.
function replaceScreen() {
  const it = run.screen.item, list = slotList(run, it);
  $('screen').innerHTML = `<div class="card"><h2>NO ROOM</h2><p>${it.slot === 'armour' ? 'You already wear ' + slotLabel(it) + '. Swap it?' : 'Your ' + it.slot + ' slots are full. Swap one out?'}</p>
    <h3>NEW</h3>${itemCard(it)}
    <h3 style="margin-top:12px">REPLACE</h3><div class="grid2">${list.map((x, k) => itemCard(x, `data-replace="${k}"`, compareHtml(it, it.slot === 'armour' ? null : k, 'Swap this out'))).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="keep">KEEP WHAT I HAVE</button></div></div>`;
  $('screen').onclick = e => {
    const r = e.target.closest('[data-replace]');
    if (r) act(replaceItem, +r.dataset.replace);
    if (e.target.id === 'keep') act(replaceItem, null);
  };
}

// A card draw: one of three cards, or pass. It joins the collection and switches on if a slot is free.
function drawScreen() {
  const s = run.screen, free = run.cards.length < run.cardSlots;
  $('screen').innerHTML = `<div class="card"><h2>DRAW A CARD</h2><p>Pick one for your collection, or pass. ${free ? 'You have a free slot: a card you pick switches straight on.' : 'Your slots are full: it waits, switched off, until you switch it on.'} One-use cards wait in your collection until you spend them.${s.more ? ' One more draw after this.' : ''}</p>
    <div class="grid2">${s.offers.map((o, k) => cardCard(o.id, `data-draw="${k}"`)).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="pass">PASS</button></div></div>`;
  $('screen').onclick = e => { const d = e.target.closest('[data-draw]'); if (d) act(takeDraw, +d.dataset.draw); if (e.target.id === 'pass') act(takeDraw, null); };
}
// Tea Leaves: your next draw, shown early. Keep it, or reshuffle it once.
function peekScreen() {
  const s = run.screen;
  $('screen').innerHTML = `<div class="card"><h2>YOUR NEXT DRAW</h2><p class="say">Nonna Seppia swirls the cup. "After your next fight, the sea offers you these."</p>
    <div class="grid2">${run.nextDraw.map(o => cardCard(o.id)).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn primary" id="keep">KEEP IT</button>${s.reshuffled ? '<span class="muted">Reshuffled. The leaves have spoken.</span>' : '<button class="btn" id="reshuffle">RESHUFFLE (ONCE)</button>'}</div></div>`;
  $('screen').onclick = e => { if (e.target.id === 'keep') act(peekDone, false); if (e.target.id === 'reshuffle') act(peekDone, true); };
}
// Tide Swap: give a card back, draw from cards one rarity higher.
function discardScreen() {
  $('screen').innerHTML = `<div class="card"><h2>TIDE SWAP</h2><p>Throw one card back to the sea. You draw from cards one rarity higher than it.</p>
    <div class="grid2">${run.owned.map(id => cardCard(id, `data-discard="${id}"`, `<span class="price">→ ${RARITIES[Math.min(4, CARDS[id].rarity + 1)].name}</span>`, null, run.stars.includes(id))).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="keep">KEEP THEM ALL</button></div></div>`;
  $('screen').onclick = e => { const d = e.target.closest('[data-discard]'); if (d) act(discardCard, d.dataset.discard); if (e.target.id === 'keep') act(discardCard, null); };
}
// Holy Seawater: lift any curse for free.
function cleanseScreen() {
  $('screen').innerHTML = `<div class="card"><h2>HOLY SEAWATER</h2><p>Pick a cursed card. The curse washes off for good; the upside stays.</p>
    <div class="grid2">${cursedCards(run).map(id => cardCard(id, `data-cleanse="${id}"`)).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="keep">NOT NOW</button></div></div>`;
  $('screen').onclick = e => { const d = e.target.closest('[data-cleanse]'); if (d) act(cleanseCard, d.dataset.cleanse); if (e.target.id === 'keep') act(cleanseCard, null); };
}

function eventScreen() {
  const s = run.screen, ev = ZONES[run.zone].events.find(x => x.id === s.id);
  $('screen').innerHTML = `<div class="card"><h2>${esc(ev.title.toUpperCase())}</h2><img class="scene" alt="" src="${eventScene(ev.id)}"><p>${esc(ev.text)}</p>
    ${s.result != null ? `<p class="say">${esc(s.result)}</p>${s.item ? itemCard(s.item) : ''}<div class="row" style="margin-top:10px"><button class="btn primary" id="done">${s.item ? 'TAKE IT' : 'CONTINUE'}</button></div>`
      : `<div class="stack">${ev.choices.map((c, k) => `<button class="btn" data-choice="${k}" ${c.cost && run.gold < c.cost ? 'disabled' : ''}>${esc(c.label)}</button>`).join('')}</div>`}</div>`;
  $('screen').onclick = e => {
    const c = e.target.closest('[data-choice]');
    if (c) act(eventChoice, +c.dataset.choice);
    if (e.target.id === 'done') act(eventDone);
  };
}

function summaryScreen() {
  const o = run.over, items = allItems(run);
  if (!fight || !fight.done) preview(heroFor(run), [], sceneFor(''));
  $('screen').innerHTML = `<div class="card"><h2 style="color:${o.won || run.victory ? 'var(--gold)' : 'var(--bad)'}">${o.won ? 'RUN WON!' : run.victory ? 'OVERTIME OVER' : 'GAME OVER'}</h2>
    <p>${o.won ? esc(ZONES[run.zone].clear) + ' Every zone is yours.' : run.victory ? 'You won the run, then went into Overtime and lasted ' + Math.max(0, (actIdx(run) - ZONES.length) * MAP_ROWS + run.row + 1) + ' rows (lap ' + lapOf(run) + ', ' + esc(ZONES[run.zone].name) + ') before you were ' + esc(o.cause) + '.' : 'You were ' + esc(o.cause) + ' in act ' + actOf(run) + ', ' + esc(ZONES[run.zone].name) + '.'}${clsOf(run) ? ' <span class="muted">(' + esc(clsOf(run).name) + ')</span>' : ''}</p>
    ${run.screen.last ? `<p class="say">${esc(run.screen.last)}</p>` : ''}
    <p class="muted">Seed ${run.seed} · ${run.visited.length} nodes visited · ${run.cleared} fights won · ${run.earned} gold earned, ${run.spent} spent, ${run.gold} left</p>
    <p class="muted">Holding: ${items.map(it => `<span style="color:var(--r${it.rarity})">${esc(itemName(it))}</span>`).join(', ') || 'nothing'}</p>
    ${run.owned.length ? `<p class="muted">Cards: ${run.owned.map(id => `<span style="color:var(--r${CARDS[id].rarity})">${run.stars.includes(id) ? '★ ' : ''}${esc(CARDS[id].name)}${run.cards.includes(id) ? ' (on)' : ''}</span>`).join(', ')}</p>` : ''}
    <div class="row"><button class="btn primary big" id="again">NEW RUN</button><button class="btn" id="same">SAME SEED</button></div></div>`;
  $('screen').onclick = e => {
    if (e.target.id === 'again') startNewRun((Math.random() * 2 ** 31) >>> 0);
    if (e.target.id === 'same') startNewRun(run.seed);
  };
}

// Lifetime stats, reachable from the title screen, with the save code to move the profile.
function statsScreen() {
  document.body.dataset.screen = 'stats';
  preview(baseHero('sword'), [], withCos({ look: ZONES[0].look, title: 'STATS' }));
  const P = profile, rate = P.runs ? Math.round(P.clears / P.runs * 100) + '%' : '—';
  const names = (tally, label) => topOf(tally, 3).map(([k, n]) => esc(label(k)) + ' ×' + n).join(', ') || '—';
  const kills = Object.entries(P.kills).sort((a, b) => b[1] - a[1]);
  $('status').innerHTML = `<div class="pill gold"><label>BANK</label><span class="coin"></span>${P.bank}</div>`;
  $('screen').innerHTML = `<div class="card"><h2>LIFETIME STATS</h2>
    <div class="statgrid">
      <div><label>RUNS</label><b>${P.runs}</b><small>${P.abandoned} abandoned</small></div>
      <div><label>CLEARS</label><b>${P.clears}</b><small>${rate} of runs</small></div>
      <div><label>DEEPEST ROW</label><b>${P.deepest}</b><small>of ${MAP_ROWS * ZONES.length}, across ${ZONES.length} acts (more in Overtime)</small></div>
      <div><label>OVERTIME BEST</label><b>${P.overtimeBest}</b><small>rows past the last boss, ${P.overtimeRuns} Overtime runs</small></div>
      <div><label>FIGHTS WON</label><b>${P.fightsWon}</b><small>of ${P.fights}</small></div>
      <div><label>LIFETIME GOLD</label><b>${P.lifetimeGold}</b><small>${Math.round(ECON.bankShare * 100)}% goes to the bank</small></div>
      <div><label>BANK</label><b>${P.bank}</b><small>${P.spentCosmetics} spent on cosmetics</small></div>
    </div>
    <p><span class="muted">Favourite weapons:</span> ${names(P.weapons, k => weaponById(k) ? weaponById(k).name : k)}</p>
    <p><span class="muted">Favourite classes:</span> ${names(P.classes, k => CLASSES[k] ? CLASSES[k].name : k)}</p>
    <p><span class="muted">Favourite cards:</span> ${names(P.cards, k => CARDS[k] ? CARDS[k].name : k)}</p>
    <p><span class="muted">Elites beaten:</span> ${names(P.elites, k => ENEMIES[k] ? ENEMIES[k].name : k)} · <span class="muted">Bosses beaten:</span> ${names(P.bosses, k => ENEMIES[k] ? ENEMIES[k].name : k)}</p>
    <p><span class="muted">What got you:</span> ${topOf(P.deaths, 5).map(([k, n]) => esc(k) + ' ×' + n).join(', ') || 'nothing yet'}</p>
    <h3 style="margin-top:12px">KILLS</h3>${kills.length ? `<div class="kills">${kills.map(([id, n]) => ENEMIES[id] ? `<div class="kill"><img alt="" src="${enemyThumb(ENEMIES[id])}"><span>${esc(ENEMIES[id].name)}</span><b>${n}</b></div>` : '').join('')}</div>` : '<p class="muted">No kills yet.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn" data-go="title">BACK</button></div></div>
    <div class="card"><h2>SAVE CODE</h2><p class="muted">Copy this to move your profile (stats, bank and cosmetics) to another browser. Runs in progress aren't included.</p>
      <textarea id="code" class="code" readonly>${exportCode(P)}</textarea>
      <div class="row"><button class="btn" id="copy">COPY</button></div>
      <h3 style="margin-top:12px">LOAD A CODE</h3>
      <textarea id="codeIn" class="code" placeholder="Paste a code that starts with AB1."></textarea>
      <div class="row"><button class="btn" id="load">LOAD PROFILE</button><span class="muted" id="codeMsg"></span></div></div>`;
  $('screen').onclick = e => {
    if (e.target.id === 'copy') { $('code').select(); try { navigator.clipboard.writeText($('code').value); } catch (x) { document.execCommand('copy'); } $('copy').textContent = 'COPIED'; }
    if (e.target.id === 'load') {
      const p = importCode($('codeIn').value);
      if (!p) { $('codeMsg').textContent = 'That code isn\'t valid (it may be cut short).'; return; }
      if (!confirm('Replace this browser\'s profile (' + profile.runs + ' runs, bank ' + profile.bank + ') with the one in the code (' + p.runs + ' runs, bank ' + p.bank + ')?')) return;
      localStorage.setItem(PROFILE_KEY + '-before-import-' + Date.now(), JSON.stringify(profile));
      profile = p; saveProfile(); statsScreen();
    }
  };
}

// The cosmetics shop: bank gold buys looks that stay owned across runs. Purely visual.
function cosmeticsScreen() {
  document.body.dataset.screen = 'cosmetics';
  preview(baseHero(cosPreview.weapon), [], withCos({ look: ZONES[0].look, title: 'COSMETICS' }));
  const P = profile;
  $('status').innerHTML = `<div class="pill gold"><label>BANK</label><span class="coin"></span>${P.bank}</div>`;
  $('screen').innerHTML = `<div class="card"><h2>ARCADE SHOP</h2><p class="muted">Bank gold comes from every run: ${Math.round(ECON.bankShare * 100)}% of everything a run earns, spent or not. Looks only: nothing here changes a fight.</p>
    <div class="row"><span class="muted">Preview with:</span><div class="seg">${['sword', 'uzi', 'wand', 'bazooka'].map(w => `<button data-pw="${w}" aria-pressed="${cosPreview.weapon === w}">${weaponById(w).name.toUpperCase()}</button>`).join('')}</div>
    <button class="btn" data-go="title">BACK</button></div></div>
    ${Object.entries(COSMETICS).map(([cat, C]) => `<div class="card"><h3>${C.name.toUpperCase()}</h3><div class="grid2">${Object.values(C.items).map(it => {
      const own = P.owned[cat].includes(it.id), on = P.equipped[cat] === it.id;
      return `<button class="item cos${on ? ' on' : ''}" data-cat="${cat}" data-id="${it.id}" ${!own && P.bank < it.cost ? 'disabled' : ''}>
        <span class="swatch">${swatch(cat, it)}</span><b>${esc(it.name)}</b><small>${on ? 'EQUIPPED' : own ? 'OWNED · tap to equip' : '<span class="coin"></span> ' + it.cost}</small></button>`; }).join('')}</div></div>`).join('')}`;
  $('screen').onclick = e => {
    const pw = e.target.closest('[data-pw]');
    if (pw) { cosPreview.weapon = pw.dataset.pw; cosmeticsScreen(); return; }
    const b = e.target.closest('[data-cat]');
    if (!b || b.disabled) return;
    const { cat, id } = b.dataset;
    if (P.owned[cat].includes(id)) equipCosmetic(P, cat, id); else if (buyCosmetic(P, cat, id)) SFX.coin();
    saveProfile(); cosmeticsScreen();
  };
}
const cosPreview = { weapon: 'sword' };
// A small preview of a cosmetic: its colours, or its words for a banner.
function swatch(cat, it) {
  const cols = cat === 'outfit' ? [it.cape, it.pants, it.armour || '#9aa3ad', it.boots] : cat === 'weaponSkin' ? [it.tint || '#c8ccd4', it.shot || '#ffe14d']
    : cat === 'hitFx' ? (it.colors || ['#ffffff']) : cat === 'arena' ? (it.look ? it.look.sky.slice(1, 5).concat(it.look.grid) : ZONES[0].look.sky.slice(1, 5).concat(ZONES[0].look.grid)) : null;
  if (cat === 'banner') return `<em>${esc(it.win)}</em>`;
  if (cat === 'mapStyle') return `<i class="mapsw style-${it.id}"></i>`;
  return cols.map(c => `<i style="background:${c}"></i>`).join('');
}

// The fight lab: any enemies against any weapon, with a quick simulated win-rate table.
const lab = { foes: ['crab', 'crab', '', '', ''], weapon: 'sword', target: 'front', hp: 100, cards: [], row: 4, gear: 'none' };
// Gear sets for the lab: a full armour set and two trinkets of one rarity, rolled from a fixed seed,
// worn by a stand-in run so they go through the same compileHero as a real run.
const LAB_GEAR = { none: null, common: 0, rare: 2, epic: 3 };
function labRun(weapon) {
  const r = LAB_GEAR[lab.gear], rng = makeRng(77);
  const inv = { weapons: [rollItem(rng, 'weapon', r || 0, weapon)], armour: {}, trinkets: [null, null] };
  for (const p of PARTS) inv.armour[p] = r == null ? null : rollItem(rng, 'armour', r, null, p);
  if (r != null) inv.trinkets = [rollItem(rng, 'trinket', r), rollItem(rng, 'trinket', r)];
  return { inv, loadout: { weapon: 0, target: lab.target }, maxHpBonus: lab.hp - BASE_HERO.maxHp, hp: 99999, cards: lab.cards, stars: [], row: lab.row, gold: 0, cls: null };
}
function labHero(weapon) { const h = compileHero(labRun(weapon || lab.weapon), 0, lab.target); h.hp = h.maxHp; return h; }
function labScreen() {
  const ids = Object.keys(ENEMIES), defs = () => lab.foes.filter(Boolean).map(id => ENEMIES[id]);
  const hero = w => labHero(w);
  const busy = () => fight && fight.running && !fight.done;
  const refresh = stageOnly => {
    if (busy()) return;
    preview(hero(), defs(), withCos({ look: ZONES[0].look, title: 'FIGHT LAB' }));
    if (stageOnly) return;
    $('screen').innerHTML = `<div class="card"><h2>FIGHT LAB</h2>${foeCards(defs(), true)}</div>
      ${lab.gear !== 'none' ? `<div class="card"><h3>GEAR · ${lab.gear.toUpperCase()} SET</h3><div class="grid2">${(r => [...PARTS.map(p => r.inv.armour[p]), ...r.inv.trinkets].map(it => itemCard(it)).join(''))(labRun(lab.weapon))}</div></div>` : ''}
      ${lab.cards.length ? `<div class="card"><h3>CARDS</h3><div class="grid2">${lab.cards.map(id => cardCard(id, null, null, cardFightNote(id, defs(), lab.cards))).join('')}</div></div>` : ''}
      <div class="card"><h3>WEAPON</h3><div class="grid2">${WEAPONS.map(w => weaponPick(w, w.id === lab.weapon)).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn" data-go="title">BACK</button></div></div>`;
    fightBar(lab.target, 'HP ' + labHero().maxHp, 'labFight');
  };
  $('status').innerHTML = '';
  $('side').innerHTML = `<div class="card lab stack"><h3>ENEMIES</h3>
    ${lab.foes.map((id, k) => `<label>SLOT ${k + 1}<select data-slot="${k}"><option value="">—</option>${ids.map(i => `<option value="${i}" ${i === id ? 'selected' : ''}>${esc(ENEMIES[i].name)}</option>`).join('')}</select></label>`).join('')}
    <label>HERO BASE HP<input type="number" id="labHp" min="10" max="2000" value="${lab.hp}"></label>
    <label>GEAR<select id="labGear">${Object.keys(LAB_GEAR).map(g => `<option value="${g}" ${g === lab.gear ? 'selected' : ''}>${g === 'none' ? 'No gear' : g[0].toUpperCase() + g.slice(1) + ' set (4 armour + 2 trinkets)'}</option>`).join('')}</select></label>
    <label>CARDS (ROW ${lab.row + 1} SCALING)<select id="labCard"><option value="">+ add a card…</option>${Object.keys(CARDS).filter(id => !lab.cards.includes(id)).map(id => `<option value="${id}">${esc(CARDS[id].name)} (${CARD_TYPES[CARDS[id].type].name})</option>`).join('')}</select></label>
    <div class="chips" id="labCards">${lab.cards.map(id => `<button class="chip" data-uncard="${id}" title="Remove">${esc(CARDS[id].name)} ✕</button>`).join('') || '<span class="muted">No cards</span>'}</div>
    <button class="btn" id="labSim">SIM ALL WEAPONS ×100</button><div class="log" id="labLog">Pick enemies and a weapon.</div></div>`;
  $('side').onchange = e => {
    if (busy()) return;
    if (e.target.dataset.slot != null) lab.foes[+e.target.dataset.slot] = e.target.value;
    if (e.target.id === 'labHp') { lab.hp = Math.max(10, +e.target.value || 100); refresh(true); return; }
    if (e.target.id === 'labCard') { if (e.target.value) lab.cards.push(e.target.value); labScreen(); return; }
    if (e.target.id === 'labGear') { lab.gear = e.target.value; refresh(); return; }
    refresh();
  };
  $('side').onclick = e => {
    const u = e.target.closest('[data-uncard]');
    if (u && !busy()) { lab.cards = lab.cards.filter(id => id !== u.dataset.uncard); labScreen(); return; }
    if (e.target.id !== 'labSim') return;
    const lines = ['weapon     win   time  hp left'];
    for (const w of WEAPONS) {
      let wins = 0, t = 0, left = 0;
      for (let s = 1; s <= 100; s++) {
        const h = hero(w.id);
        const f = simulate(h, defs(), makeRng(s).next);
        if (f.won) { wins++; t += f.t; left += f.hero.hp; }
      }
      lines.push(w.id.padEnd(9) + (wins + '%').padStart(5) + (wins ? (t / wins).toFixed(0) + 's' : '--').padStart(7) + (wins ? Math.round(left / wins) : '--').toString().padStart(8));
    }
    $('labLog').textContent = lines.join('\n');
  };
  $('fightbar').onclick = $('screen').onclick = e => {
    if (busy()) return;
    const w = e.target.closest('[data-weapon]'), t = e.target.closest('[data-target]');
    if (w) { lab.weapon = w.dataset.weapon; refresh(); }
    if (t) { lab.target = t.dataset.target; refresh(); }
    if (e.target.id === 'labFight' && defs().length) {
      $('labFight').disabled = true;
      startFight(f => {
        $('labLog').textContent = (f.won ? 'WON' : 'LOST') + ' with ' + f.hero.weapon.name + ' in ' + f.t.toFixed(1) + 's, ' + Math.ceil(f.hero.hp) + ' HP left' + (f.cause ? ' (' + f.cause + ')' : '') + '\n' + $('labLog').textContent;
        refresh();
      });
    }
  };
  refresh();
}

function go(name) {
  $('screen').onclick = null; $('side').onclick = null; $('side').onchange = null; $('fightbar').onclick = null; $('fightbar').hidden = true;
  run = null; dock(); window.scrollTo(0, 0);
  if (name === 'lab') { document.body.dataset.screen = 'lab'; run = null; labScreen(); }
  else if (name === 'stats') { run = null; $('side').innerHTML = ''; statsScreen(); }
  else if (name === 'cosmetics') { run = null; $('side').innerHTML = ''; cosmeticsScreen(); }
  else { run = null; show(); }
}
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });

// The Android app (Capacitor): the back button closes the sheet, then leaves the side screens for the
// title, and otherwise puts the app in the background. In a browser there's no Capacitor and none of this runs.
const NativeApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
if (NativeApp) NativeApp.addListener('backButton', () => {
  if (document.body.dataset.drawer) return drawer('');
  if (['stats', 'cosmetics', 'lab'].includes(document.body.dataset.screen)) return go('title');
  NativeApp.minimizeApp();
});
// Fights pause by themselves while the page is hidden (no animation frames); the sound pauses too.
document.addEventListener('visibilitychange', () => SFX.pause(document.hidden));

syncControls();
if (location.hash === '#debug') go('lab'); else show();
requestAnimationFrame(frame);
