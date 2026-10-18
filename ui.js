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
const TARGETS = [['front', 'FRONT'], ['lowest', 'LOWEST HP'], ['threat', 'BIGGEST THREAT']];
const targetPicker = cur => `<div class="seg" id="targeting">${TARGETS.map(([k, l]) => `<button data-target="${k}" aria-pressed="${cur === k}">${l}</button>`).join('')}</div>`;
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
  const c = CARDS[id], tag = attrs ? 'button' : 'div', lines = cardLines(id, starred);
  return `<${tag} class="item cardi r${c.rarity} t-${c.type}${starred ? ' starred' : ''}" ${attrs || ''}><img class="icon" alt="" src="${iconURL(CARD_TYPES[c.type].icon)}">
    <b>${starred ? '★ ' : ''}${esc(c.name)}</b><small>${RARITIES[c.rarity].name} ${CARD_TYPES[c.type].name.toLowerCase()} card · ${c.tags.map(t => `<span style="color:${CARD_TAGS[t].color}">${t}</span>`).join(' / ')}</small>
    <ul>${lines.slice(1).map(l => `<li${l.startsWith('★') ? ' class="star"' : l.startsWith('⚠') ? ' class="leg"' : ''}>${esc(l)}</li>`).join('')}${note ? `<li class="note">${esc(note)}</li>` : ''}</ul>${extra || ''}</${tag}>`;
}
// The card board: slots in use, empty slots, active set bonuses.
function boardHtml(note) {
  const sets = activeSets(run.cards);
  return `${run.cards.map(id => cardCard(id, null, null, note && note(id), run.stars.includes(id))).join('')}
    ${Array.from({ length: run.cardSlots - run.cards.length }, () => emptySlot('Card slot')).join('')}
    ${sets.length ? `<div class="sets">${sets.map(t => `<span class="chip" style="border-color:${CARD_TAGS[t].color};color:${CARD_TAGS[t].color}">${esc(SET_BONUSES[t].text)}</span>`).join('')}</div>` : ''}
    <div class="muted">${run.cardSlots} of ${CARD_RULES.maxSlots} card slots${run.cardSlots < CARD_RULES.maxSlots ? ' · beat an elite for another' : ''}</div>`;
}
const emptySlot = label => `<div class="item empty"><span class="icon"></span><b>${label}</b><small>Empty</small></div>`;
function sidePanel() {
  if (!run) { $('side').innerHTML = ''; return; }
  const inv = run.inv;
  const C = clsOf(run);
  $('side').innerHTML = `<div class="card stack"><h3>INVENTORY${C ? ` · <img class="icon" style="width:16px;height:16px;display:inline-block;vertical-align:middle" alt="" src="${iconURL(C.icon)}"> ${esc(C.name.toUpperCase())}` : ''}</h3>
    ${inv.weapons.map((w, k) => w ? itemCard(w) : emptySlot('Weapon ' + (k + 1))).join('')}
    ${PARTS.map(p => inv.armour[p] ? itemCard(inv.armour[p]) : emptySlot(ARMOUR_PARTS[p].name + ' armour')).join('')}${inv.trinkets.map((t, k) => t ? itemCard(t) : emptySlot('Trinket ' + (k + 1))).join('')}
    <div class="muted">Seed ${run.seed} · row ${Math.max(0, run.row + 1)} of ${MAP_ROWS} · ${run.cleared} fights won</div></div>
    <div class="card stack"><h3>CARD BOARD</h3>${boardHtml()}</div>`;
}
function statusBar() {
  $('status').innerHTML = run ? `<div class="pill hp"><label>HP</label>${run.hp}/${maxHp(run)}</div>
    <div class="pill gold"><span class="coin"></span>${run.gold}</div>` : '';
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
  const s = run && run.screen;
  document.body.dataset.screen = s ? s.type : 'title';
  if (!s) return titleScreen();
  ({ class: classScreen, start: startScreen, map: mapScreen, prefight: prefightScreen, reward: rewardScreen, treasure: treasureScreen,
    shop: shopScreen, merchant: merchantScreen, rest: restScreen, event: eventScreen, summary: summaryScreen, replace: replaceScreen })[s.type]();
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

// The map: boss at the top, start at the bottom. Reachable nodes glow; visited ones are gold.
function mapScreen() {
  const rows = run.map.rows, can = reachable(run), H = 58, h = rows.length * H, X = l => (l + 0.5) / 4 * 100, Y = r => h - (r + 0.5) * H;
  const lines = [], nodes = [];
  for (const row of rows) for (const n of row) {
    for (const id of n.next) {
      const m = nodeById(run, id), on = run.visited.includes(n.id) && (run.visited.includes(id) || (run.at === n.id && can.includes(id)));
      lines.push(`<line class="${on ? (run.visited.includes(id) ? 'l-done' : 'l-open') : 'l-off'}" x1="${X(n.lane)}" y1="${Y(n.row)}" x2="${X(m.lane)}" y2="${Y(m.row)}" stroke-width="${on ? 3 : 2}" vector-effect="non-scaling-stroke" ${on ? '' : 'stroke-dasharray="4 4"'}/>`);
    }
    const t = NODE_TYPES[n.type], state = run.at === n.id ? 'here' : can.includes(n.id) ? 'open' : run.visited.includes(n.id) ? 'done' : 'shut';
    // elites and the boss show who they are, so routing around a bad matchup is a real choice
    const enc = n.type === 'elite' || n.type === 'boss' ? encounterFor(run, n) : null, who = enc ? ENEMIES[enc.ids[0]] : null;
    const img = who ? enemyThumb(who) : iconURL(t.icon);
    const label = who ? t.name + ': ' + who.name + (enc.ench.length ? ' · enchanted: ' + enc.ench.map(id => ENCHANTMENTS[id].name + ' (' + ENCHANTMENTS[id].text + ' Counter: ' + ENCHANTMENTS[id].counter + ')').join(' + ') : '') : t.name;
    nodes.push(`<button class="node ${state} ${n.type}" data-node="${n.id}" style="left:${X(n.lane)}%;top:${Y(n.row)}px" title="${esc(label)}" ${state === 'open' ? '' : 'disabled'}><img alt="${esc(label)}" src="${img}">${enc && enc.ench.length ? `<span class="ench-badge">${enc.ench.length}</span>` : ''}</button>`);
  }
  $('screen').innerHTML = `<div class="card"><h2>${esc(ZONES[run.zone].name.toUpperCase())}</h2>
    <div class="row" style="margin-bottom:10px"><button class="btn" id="merchant"><img class="icon" style="width:16px;height:16px;display:inline-block;vertical-align:middle" alt="" src="${iconURL('cart')}"> MERCHANT</button>
      <span class="muted">Open any time between stops. New stock every row.</span></div>
    <p class="muted">Pick your next stop. ${Object.entries(NODE_TYPES).map(([k, t]) => `<span class="chip"><img class="icon" style="width:16px;height:16px" alt="" src="${k === 'boss' ? enemyThumb(ENEMIES[ZONES[run.zone].boss]) : iconURL(t.icon)}">${t.name}</span>`).join(' ')}</p>
    <div class="map style-${cosmeticsOf(profile).mapStyle.id}" style="height:${h}px"><svg viewBox="0 0 100 ${h}" preserveAspectRatio="none">${lines.join('')}</svg>${nodes.join('')}</div>${mapPreview()}</div>`;
  $('screen').onclick = e => {
    const b = e.target.closest('[data-node]');
    if (b && !b.disabled) act(moveTo, b.dataset.node);
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
    <div class="card"><h3>CARD BOARD · THIS FIGHT</h3>${run.cards.length ? `<div class="grid2">${boardHtml(id => cardFightNote(id, enc.defs, run.cards))}</div>` : '<p class="muted">No cards yet. Fights, chests, events and shops offer them.</p>'}</div>`;
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

function rewardScreen() {
  const s = run.screen;
  $('screen').innerHTML = `<div class="card"><h2>${s.elite ? 'ELITE DOWN!' : 'CLEARED!'}</h2>
    <p><span class="coin"></span> +${s.gold} gold${s.clean ? ' (with a bonus for staying above half HP)' : ''}. Now pick one item, or skip them all for more gold. Whatever you leave washes out to sea.</p>
    <div class="grid2">${s.offers.map((it, k) => itemCard(it, `data-take="${k}"`)).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="gold"><span class="coin"></span> SKIP FOR +${s.skip} GOLD</button></div></div>`;
  $('screen').onclick = e => {
    const t = e.target.closest('[data-take]');
    if (t) act(takeReward, +t.dataset.take);
    if (e.target.closest('#gold')) act(takeReward, null);
  };
}

function treasureScreen() {
  $('screen').innerHTML = `<div class="card"><h2>TREASURE</h2><p>A chest half-buried in the sand. ${run.screen.gold ? `<span class="coin"></span> ${run.screen.gold} gold rattles loose. ` : ''}Room for one thing in your pockets.</p>
    <div class="grid2">${run.screen.offers.map((it, k) => itemCard(it, `data-take="${k}"`)).join('')}</div></div>`;
  $('screen').onclick = e => { const t = e.target.closest('[data-take]'); if (t) act(takeTreasure, +t.dataset.take); };
}

// Stock as buyable item cards.
const stockCards = (stock, attr) => `<div class="grid2">${stock.map((o, k) => itemCard(o.item, `${attr}="${k}" ${o.sold || run.gold < o.price ? 'disabled' : ''}`,
  `<span class="price">${o.sold ? 'SOLD' : '<span class="coin"></span> ' + o.price}</span>`)).join('')}</div>`;
// The forge: every item that can go up a rarity, with its price here.
function forgeCards(where) {
  const list = FORGE_SLOTS.map(k => [k, inventoryItem(run, k), forgeCost(run, k, where)]).filter(([, it, c]) => it && c != null);
  return `<h3 style="margin-top:14px">FORGE · RAISE AN ITEM ONE RARITY</h3>
    <p class="muted">Keeps the item and its affixes: every affix grows into the new rarity's range and one more is added. The last step, to Legendary, adds a legendary effect and its drawback.</p>${list.length
    ? `<div class="grid2">${list.map(([k, it, c]) => itemCard(it, `data-forge="${k}" ${run.gold < c ? 'disabled' : ''}`, `<span class="price">→ ${RARITIES[it.rarity + 1].name} · <span class="coin"></span> ${c}</span>`)).join('')}</div>`
    : '<p class="muted">Nothing to forge: everything you carry is Legendary.</p>'}`;
}
// Card upgrades: each card once, for a ★ that raises its numbers.
function starCards(where) {
  const list = run.cards.map((id, k) => [k, id, starCost(run, k, where)]);
  if (!list.length) return '';
  return `<h3 style="margin-top:14px">UPGRADE A CARD · ★ ONCE EACH</h3><div class="grid2">${list.map(([k, id, c]) => c == null
    ? cardCard(id, 'disabled', '<span class="price">★ DONE</span>', null, true)
    : cardCard(id, `data-star="${k}" ${run.gold < c ? 'disabled' : ''}`, `<span class="price">★ ×${CARD_RULES.star} · <span class="coin"></span> ${c}</span>`)).join('')}</div>`;
}
// Selling: everything carried, with what it sells for.
function sellCards() {
  const C = clsOf(run), items = FORGE_SLOTS.map(k => [k, inventoryItem(run, k)]).filter(([, it]) => it).map(([k, it]) => [k, it, sellValue(run, k)]);
  const cards = run.cards.map((id, k) => ['card' + k, { slot: 'card', id, rarity: CARDS[id].rarity }, sellValue(run, 'card' + k)]);
  const oneWeapon = run.inv.weapons.filter(Boolean).length < 2;
  return `<h3 style="margin-top:14px">SELL${C && C.sellMult > 1 ? ' (HUSTLER: DOUBLE)' : ''}</h3><div class="grid2">${items.concat(cards).map(([k, it, v]) =>
    itemCard(it, `data-sell="${k}" ${k.startsWith('weapon') && oneWeapon ? 'disabled' : ''}`, `<span class="price">SELL · <span class="coin"></span> ${v}</span>`)).join('')}</div>`;
}
function shopClicks(e, buy, heal) {
  const b = e.target.closest('[data-buy]'), fg = e.target.closest('[data-forge]'), sl = e.target.closest('[data-sell]'), st = e.target.closest('[data-star]');
  if (st && !st.disabled) { SFX.coin(); act(starCard, +st.dataset.star); }
  if (sl && !sl.disabled) { SFX.coin(); act(sellItem, sl.dataset.sell); }
  if (b && !b.disabled) { SFX.coin(); act(buy, +b.dataset.buy); }
  if (fg && !fg.disabled) { SFX.coin(); act(forge, fg.dataset.forge); }
  if (e.target.id === 'heal') act(heal);
  if (e.target.id === 'leave') act(leave);
}

function shopScreen() {
  const s = run.screen;
  $('screen').innerHTML = `<div class="card"><h2>BEACH SHACK</h2><p>Frigo Camelo leans out of his fridge. "Everything is cold," he says, "including the prices." The good stuff is here, and there's always a weapon you don't have.</p>
    ${stockCards(s.stock, 'data-buy')}
    <div class="row" style="margin-top:12px"><button class="btn" id="heal" ${s.healed || run.gold < s.healCost ? 'disabled' : ''}>HEAL ${Math.round(ECON.shopHeal.share * 100)}% · ${s.healCost}G</button>
    <button class="btn" id="reroll" ${run.gold < s.rerollCost ? 'disabled' : ''}>REROLL · ${s.rerollCost}G</button>
    <button class="btn primary" id="leave">LEAVE</button></div>${forgeCards('shop')}${starCards('shop')}${sellCards()}</div>`;
  $('screen').onclick = e => { shopClicks(e, shopBuy, shopHeal); if (e.target.id === 'reroll') act(shopReroll); };
}

// The anytime merchant, opened from the map.
function merchantScreen() {
  const m = run.merchant;
  $('screen').innerHTML = `<div class="card"><h2>MERCHANT</h2><p>A seagull in a tiny apron drags a cart along the tideline. "Convenience," it squawks, "costs extra."</p>
    ${stockCards(m.stock, 'data-buy')}
    <div class="row" style="margin-top:12px"><button class="btn" id="heal" ${m.healed || run.gold < m.healCost ? 'disabled' : ''}>POTION: HEAL ${Math.round(ECON.merchantHeal.share * 100)}% · ${m.healCost}G</button>
    <button class="btn primary" id="leave">BACK TO THE MAP</button></div>${forgeCards('merchant')}${starCards('merchant')}${sellCards()}</div>`;
  $('screen').onclick = e => shopClicks(e, merchantBuy, merchantHeal);
}

function restScreen() {
  const noHeal = hasLegendary(run, 'bloodpact');
  const slots = ECON.restUpgrade ? FORGE_SLOTS.map(k => [k, inventoryItem(run, k)]).filter(([, it]) => it && it.rarity < 3) : [];
  $('screen').innerHTML = `<div class="card"><h2>REST</h2><p>A deckchair, a parasol and the distant sound of a shark in sneakers.${ECON.restUpgrade ? ' Rest, or tinker with your kit. Not both.' : ' Upgrades are the forge\'s job; here you just rest.'}</p>
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
  const it = run.screen.item, card = it.slot === 'card';
  const list = card ? run.cards.map(id => ({ slot: 'card', id, rarity: CARDS[id].rarity })) : slotList(run, it);
  const dupe = card && run.cards.includes(it.id);
  $('screen').innerHTML = `<div class="card"><h2>NO ROOM</h2><p>${card ? (dupe ? 'You already have this card on your board.' : 'Your card board is full. Swap a card out? The one you replace is sold.') : (it.slot === 'armour' ? 'You already wear ' + slotLabel(it) + '. Swap it?' : 'Your ' + it.slot + ' slots are full. Swap one out?')}</p>
    <h3>NEW</h3>${itemCard(it)}
    <h3 style="margin-top:12px">REPLACE</h3><div class="grid2">${list.map((x, k) => itemCard(x, dupe ? 'disabled' : `data-replace="${k}"`, card ? `<span class="price">SELL FOR <span class="coin"></span> ${CARD_RULES.sell[x.rarity]}</span>` : '')).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="keep">KEEP WHAT I HAVE</button></div></div>`;
  $('screen').onclick = e => {
    const r = e.target.closest('[data-replace]');
    if (r) act(replaceItem, +r.dataset.replace);
    if (e.target.id === 'keep') act(replaceItem, null);
  };
}

function eventScreen() {
  const s = run.screen, ev = ZONES[run.zone].events.find(x => x.id === s.id);
  $('screen').innerHTML = `<div class="card"><h2>${esc(ev.title.toUpperCase())}</h2><p>${esc(ev.text)}</p>
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
  $('screen').innerHTML = `<div class="card"><h2 style="color:${o.won ? 'var(--gold)' : 'var(--bad)'}">${o.won ? 'ZONE CLEARED!' : 'GAME OVER'}</h2>
    <p>${o.won ? 'Tralalero Tralala hangs up his sneakers. The beach is yours.' : 'You were ' + esc(o.cause) + '.'}${clsOf(run) ? ' <span class="muted">(' + esc(clsOf(run).name) + ')</span>' : ''}</p>
    ${run.screen.last ? `<p class="say">${esc(run.screen.last)}</p>` : ''}
    <p class="muted">Seed ${run.seed} · ${run.visited.length} nodes visited · ${run.cleared} fights won · ${run.earned} gold earned, ${run.spent} spent, ${run.gold} left</p>
    <p class="muted">Holding: ${items.map(it => `<span style="color:var(--r${it.rarity})">${esc(itemName(it))}</span>`).join(', ') || 'nothing'}</p>
    ${run.cards.length ? `<p class="muted">Cards: ${run.cards.map(id => `<span style="color:var(--r${CARDS[id].rarity})">${run.stars.includes(id) ? '★ ' : ''}${esc(CARDS[id].name)}</span>`).join(', ')}</p>` : ''}
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
      <div><label>DEEPEST ROW</label><b>${P.deepest}</b><small>of ${MAP_ROWS}</small></div>
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
  if (name === 'lab') { document.body.dataset.screen = 'lab'; run = null; labScreen(); }
  else if (name === 'stats') { run = null; $('side').innerHTML = ''; statsScreen(); }
  else if (name === 'cosmetics') { run = null; $('side').innerHTML = ''; cosmeticsScreen(); }
  else { run = null; show(); }
}
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });

syncControls();
if (location.hash === '#debug') go('lab'); else show();
requestAnimationFrame(frame);
