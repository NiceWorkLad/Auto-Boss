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
  $('result').innerHTML = won ? '<b class="win">VICTORY!</b>' : '<b class="loss">K.O.</b>';
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
    return `<div class="foe ${d.boss ? 'boss' : d.elite ? 'elite' : ''}"><img alt="" src="${enemyThumb(d)}">
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

const RUN_KEY = 'autoboss-run-v1';
let run = null;              // the title screen offers to continue a saved run
function loadRun() { try { const r = JSON.parse(localStorage.getItem(RUN_KEY)); return r && r.v === 1 ? r : null; } catch (e) { return null; } }
function saveRun() { try { if (run) localStorage.setItem(RUN_KEY, JSON.stringify(run)); else localStorage.removeItem(RUN_KEY); } catch (e) {} }
// Every action: change the run, save it, redraw the current screen.
function act(fn, ...args) { fn(run, ...args); saveRun(); show(); }

const SLOT_NAMES = { weapon: 'weapon', armour: 'armour', trinket: 'trinket' };
// An item as a card: icon, name in its rarity colour, then every stat line. attrs makes it a button.
function itemCard(it, attrs, extra) {
  const tag = attrs ? 'button' : 'div';
  return `<${tag} class="item r${it.rarity}" ${attrs || ''}><img class="icon" alt="" src="${iconURL(itemIcon(it))}">
    <b>${esc(itemName(it))}</b><small>${RARITIES[it.rarity].name} ${SLOT_NAMES[it.slot]}</small>
    <ul>${itemLines(it).map(l => `<li${l.startsWith('★') ? ' class="leg"' : ''}>${esc(l)}</li>`).join('')}</ul>${extra || ''}</${tag}>`;
}
const emptySlot = label => `<div class="item empty"><span class="icon"></span><b>${label}</b><small>Empty</small></div>`;
function sidePanel() {
  if (!run) { $('side').innerHTML = ''; return; }
  const inv = run.inv;
  $('side').innerHTML = `<div class="card stack"><h3>INVENTORY</h3>
    ${inv.weapons.map((w, k) => w ? itemCard(w) : emptySlot('Weapon ' + (k + 1))).join('')}
    ${inv.armour ? itemCard(inv.armour) : emptySlot('Armour')}${inv.trinkets.map((t, k) => t ? itemCard(t) : emptySlot('Trinket ' + (k + 1))).join('')}
    <div class="muted">Seed ${run.seed} · row ${Math.max(0, run.row + 1)} of ${MAP_ROWS} · ${run.cleared} fights won</div></div>`;
}
function statusBar() {
  $('status').innerHTML = run ? `<div class="pill hp"><label>HP</label>${run.hp}/${maxHp(run)}</div>
    <div class="pill gold"><span class="coin"></span>${run.gold}</div>` : '';
}
// The hero's colours follow the rarity of the held weapon and the armour.
const sceneFor = title => {
  const w = run && run.inv.weapons[run.loadout.weapon], a = run && run.inv.armour;
  return { look: ZONES[run ? run.zone : 0].look, title, tier: { weapon: w ? w.rarity * 2 : 0, armour: a ? a.rarity * 2 + 1 : 0 } };
};

// Draw whatever run.screen says, or the title screen when there's no run.
function show() {
  statusBar(); sidePanel();
  const s = run && run.screen;
  document.body.dataset.screen = s ? s.type : 'title';
  if (!s) return titleScreen();
  ({ start: startScreen, map: mapScreen, prefight: prefightScreen, reward: rewardScreen, treasure: treasureScreen,
    shop: shopScreen, rest: restScreen, event: eventScreen, summary: summaryScreen, replace: replaceScreen })[s.type]();
}

function titleScreen() {
  preview(baseHero('sword'), [], sceneFor(''));
  const saved = loadRun();
  $('screen').innerHTML = `<div class="card"><h2>INSERT COIN</h2>
    <p>Fights are automatic. Every choice between them is yours: the route, the weapon, the loot. HP carries over. Die and the run is over.</p>
    <div class="row">${saved && !saved.over ? '<button class="btn primary big" id="continue">CONTINUE RUN</button>' : ''}
      <button class="btn ${saved && !saved.over ? '' : 'primary big'}" id="newRun">NEW RUN</button>
      <input id="seedIn" placeholder="seed (optional)" inputmode="numeric" style="font:18px var(--body);background:#000;color:var(--text);border:2px solid var(--line);padding:6px;width:11em">
      <button class="btn" data-go="lab">FIGHT LAB</button></div></div>`;
  $('screen').onclick = e => {
    if (e.target.id === 'continue') { run = saved; show(); }
    if (e.target.id === 'newRun') { const v = $('seedIn').value.trim(); run = newRun(v ? +v || hashSeed(v) : (Math.random() * 2 ** 31) >>> 0); saveRun(); show(); }
  };
}
const hashSeed = str => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

function startScreen() {
  preview(baseHero(run.screen.offers[0].base), [], sceneFor(ZONES[run.zone].name.toUpperCase()));
  $('screen').innerHTML = `<div class="card"><h2>CHOOSE YOUR WEAPON</h2><p class="muted">One of three. You'll find more on the way, and you can carry two.</p>
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
      lines.push(`<line x1="${X(n.lane)}" y1="${Y(n.row)}" x2="${X(m.lane)}" y2="${Y(m.row)}" stroke="${on ? (run.visited.includes(id) ? '#ffe14d' : '#29e7ff') : '#3b1d6b'}" stroke-width="${on ? 3 : 2}" vector-effect="non-scaling-stroke" ${on ? '' : 'stroke-dasharray="4 4"'}/>`);
    }
    const t = NODE_TYPES[n.type], state = run.at === n.id ? 'here' : can.includes(n.id) ? 'open' : run.visited.includes(n.id) ? 'done' : 'shut';
    const img = n.type === 'boss' ? enemyThumb(ENEMIES[ZONES[run.zone].boss]) : iconURL(t.icon);
    nodes.push(`<button class="node ${state} ${n.type}" data-node="${n.id}" style="left:${X(n.lane)}%;top:${Y(n.row)}px" title="${t.name}" ${state === 'open' ? '' : 'disabled'}><img alt="${t.name}" src="${img}"></button>`);
  }
  $('screen').innerHTML = `<div class="card"><h2>${esc(ZONES[run.zone].name.toUpperCase())}</h2>
    <p class="muted">Pick your next stop. ${Object.entries(NODE_TYPES).map(([k, t]) => `<span class="chip"><img class="icon" style="width:16px;height:16px" alt="" src="${k === 'boss' ? enemyThumb(ENEMIES[ZONES[run.zone].boss]) : iconURL(t.icon)}">${t.name}</span>`).join(' ')}</p>
    <div class="map" style="height:${h}px"><svg viewBox="0 0 100 ${h}" preserveAspectRatio="none">${lines.join('')}</svg>${nodes.join('')}</div></div>`;
  $('screen').onclick = e => { const b = e.target.closest('[data-node]'); if (b && !b.disabled) act(moveTo, b.dataset.node); };
}

function prefightScreen() {
  const node = nodeById(run, run.screen.node), enc = encounterFor(run, node), title = NODE_TYPES[node.type].name.toUpperCase();
  const hero = heroFor(run);
  preview(hero, enc.defs, sceneFor(title + ' · ROW ' + (node.row + 1)), makeRng(enc.fightSeed).next);
  const weapons = run.inv.weapons.map((it, k) => it ? weaponPick(weaponById(it.base), run.loadout.weapon === k,
    `<br><span style="color:var(--r${it.rarity})">${esc(itemName(it))}</span>${it.affixes.length || it.legendary ? ': ' + esc(itemLines(it).slice(1).join(' · ')) : ''}`)
    .replace('data-weapon=', `data-slot="${k}" data-weapon=`) : '').join('');
  $('screen').innerHTML = `<div class="card"><h2>${title}</h2><p class="say">${esc(encounterIntro(enc.defs))}</p>${foeCards(enc.defs, enc.defs.every(d => !d.phases || run.seen[d.id]))}</div>
    <div class="card"><h3>WEAPON</h3><div class="grid2">${weapons}</div>
    <h3 style="margin-top:12px">TARGETING</h3>${targetPicker(run.loadout.target)}
    <div class="row" style="margin-top:12px"><button class="btn primary big" id="go">FIGHT!</button><span class="muted">HP ${run.hp}/${maxHp(run)}</span></div></div>`;
  $('screen').onclick = e => {
    if (fight && fight.running) return;
    const w = e.target.closest('[data-slot]'), t = e.target.closest('[data-target]');
    if (w) act(setLoadout, +w.dataset.slot, null);
    if (t) act(setLoadout, null, t.dataset.target);
    if (e.target.id === 'go') {
      $('go').disabled = true;
      $('screen').querySelectorAll('button').forEach(b => b.disabled = true);
      startFight(f => act(finishFight, f));
    }
  };
}

function rewardScreen() {
  const s = run.screen;
  $('screen').innerHTML = `<div class="card"><h2>${s.elite ? 'ELITE DOWN!' : 'CLEARED!'}</h2>
    <p>Pick one, or take the gold. Whatever you leave washes out to sea.</p>
    <div class="grid2">${s.offers.map((it, k) => itemCard(it, `data-take="${k}"`)).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="gold"><span class="coin"></span> TAKE ${s.gold} GOLD INSTEAD</button></div></div>`;
  $('screen').onclick = e => {
    const t = e.target.closest('[data-take]');
    if (t) act(takeReward, +t.dataset.take);
    if (e.target.closest('#gold')) act(takeReward, null);
  };
}

function treasureScreen() {
  $('screen').innerHTML = `<div class="card"><h2>TREASURE</h2><p>A chest half-buried in the sand. Room for one thing in your pockets.</p>
    <div class="grid2">${run.screen.offers.map((it, k) => itemCard(it, `data-take="${k}"`)).join('')}</div></div>`;
  $('screen').onclick = e => { const t = e.target.closest('[data-take]'); if (t) act(takeTreasure, +t.dataset.take); };
}

function shopScreen() {
  const s = run.screen;
  $('screen').innerHTML = `<div class="card"><h2>BEACH SHACK</h2><p>Frigo Camelo leans out of his fridge. "Everything is cold," he says, "including the prices."</p>
    <div class="grid2">${s.stock.map((o, k) => itemCard(o.item, `data-buy="${k}" ${o.sold || run.gold < o.price ? 'disabled' : ''}`,
      `<span class="price">${o.sold ? 'SOLD' : '<span class="coin"></span> ' + o.price}</span>`)).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="heal" ${s.healed || run.gold < s.healCost ? 'disabled' : ''}>HEAL 30% · ${s.healCost}G</button>
    <button class="btn" id="reroll" ${run.gold < s.rerollCost ? 'disabled' : ''}>REROLL · ${s.rerollCost}G</button>
    <button class="btn primary" id="leave">LEAVE</button></div></div>`;
  $('screen').onclick = e => {
    const b = e.target.closest('[data-buy]');
    if (b && !b.disabled) { SFX.coin(); act(shopBuy, +b.dataset.buy); }
    if (e.target.id === 'heal') act(shopHeal);
    if (e.target.id === 'reroll') act(shopReroll);
    if (e.target.id === 'leave') act(leave);
  };
}

function restScreen() {
  const slots = [['weapon0', run.inv.weapons[0]], ['weapon1', run.inv.weapons[1]], ['armour', run.inv.armour], ['trinket0', run.inv.trinkets[0]], ['trinket1', run.inv.trinkets[1]]]
    .filter(([, it]) => it && it.rarity < 3);
  const noHeal = hasLegendary(run, 'bloodpact');
  $('screen').innerHTML = `<div class="card"><h2>REST</h2><p>A deckchair, a parasol and the distant sound of a shark in sneakers. Rest, or tinker with your kit. Not both.</p>
    <div class="row"><button class="btn primary big" id="heal" ${noHeal ? 'disabled' : ''}>HEAL ${Math.round(maxHp(run) * 0.35)} HP</button>
    ${noHeal ? '<span class="muted">The Bloodpact Bandana won\'t let you rest.</span>' : ''}</div>
    <h3 style="margin-top:14px">OR UPGRADE ONE ITEM'S RARITY</h3>
    ${slots.length ? `<div class="grid2">${slots.map(([k, it]) => itemCard(it, `data-up="${k}"`, `<span class="price">→ ${RARITIES[it.rarity + 1].name}</span>`)).join('')}</div>` : '<p class="muted">Nothing to upgrade (Epic is as far as tinkering goes).</p>'}</div>`;
  $('screen').onclick = e => {
    const u = e.target.closest('[data-up]');
    if (u) act(rest, 'upgrade', u.dataset.up);
    if (e.target.id === 'heal') act(rest, 'heal');
  };
}

// Slots are full: pick what the new item replaces, or leave it.
function replaceScreen() {
  const it = run.screen.item, list = it.slot === 'armour' ? [run.inv.armour] : it.slot === 'weapon' ? run.inv.weapons : run.inv.trinkets;
  $('screen').innerHTML = `<div class="card"><h2>NO ROOM</h2><p>Your ${SLOT_NAMES[it.slot]} slots are full. Swap one out?</p>
    <h3>NEW</h3>${itemCard(it)}
    <h3 style="margin-top:12px">REPLACE</h3><div class="grid2">${list.map((x, k) => itemCard(x, `data-replace="${k}"`)).join('')}</div>
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
  const o = run.over, inv = run.inv, items = inv.weapons.concat(inv.armour, inv.trinkets).filter(Boolean);
  if (!fight || !fight.done) preview(heroFor(run), [], sceneFor(''));
  $('screen').innerHTML = `<div class="card"><h2 style="color:${o.won ? 'var(--gold)' : 'var(--bad)'}">${o.won ? 'ZONE CLEARED!' : 'GAME OVER'}</h2>
    <p>${o.won ? 'Tralalero Tralala hangs up his sneakers. The beach is yours.' : 'You were ' + esc(o.cause) + '.'}</p>
    ${run.screen.last ? `<p class="say">${esc(run.screen.last)}</p>` : ''}
    <p class="muted">Seed ${run.seed} · ${run.visited.length} nodes visited · ${run.cleared} fights won · ${run.gold} gold left</p>
    <p class="muted">Holding: ${items.map(it => `<span style="color:var(--r${it.rarity})">${esc(itemName(it))}</span>`).join(', ') || 'nothing'}</p>
    <div class="row"><button class="btn primary big" id="again">NEW RUN</button><button class="btn" id="same">SAME SEED</button></div></div>`;
  $('screen').onclick = e => {
    if (e.target.id === 'again') { run = newRun((Math.random() * 2 ** 31) >>> 0); saveRun(); show(); }
    if (e.target.id === 'same') { run = newRun(run.seed); saveRun(); show(); }
  };
}

// The fight lab: any enemies against any weapon, with a quick simulated win-rate table.
const lab = { foes: ['crab', 'crab', '', '', ''], weapon: 'sword', target: 'front', hp: 100 };
function labScreen() {
  const ids = Object.keys(ENEMIES), defs = () => lab.foes.filter(Boolean).map(id => ENEMIES[id]);
  const hero = () => { const h = baseHero(lab.weapon, lab.target); h.maxHp = h.hp = lab.hp; return h; };
  const busy = () => fight && fight.running && !fight.done;
  const refresh = stageOnly => {
    if (busy()) return;
    preview(hero(), defs(), { look: ZONES[0].look, title: 'FIGHT LAB' });
    if (stageOnly) return;
    $('screen').innerHTML = `<div class="card"><h2>FIGHT LAB</h2>${foeCards(defs(), true)}</div>
      <div class="card"><h3>WEAPON</h3><div class="grid2">${WEAPONS.map(w => weaponPick(w, w.id === lab.weapon)).join('')}</div>
      <h3 style="margin-top:12px">TARGETING</h3>${targetPicker(lab.target)}
      <div class="row" style="margin-top:12px"><button class="btn primary big" id="labFight">FIGHT!</button><button class="btn" data-go="title">BACK</button></div></div>`;
  };
  $('status').innerHTML = '';
  $('side').innerHTML = `<div class="card lab stack"><h3>ENEMIES</h3>
    ${lab.foes.map((id, k) => `<label>SLOT ${k + 1}<select data-slot="${k}"><option value="">—</option>${ids.map(i => `<option value="${i}" ${i === id ? 'selected' : ''}>${esc(ENEMIES[i].name)}</option>`).join('')}</select></label>`).join('')}
    <label>HERO HP<input type="number" id="labHp" min="10" max="2000" value="${lab.hp}"></label>
    <button class="btn" id="labSim">SIM ALL WEAPONS ×100</button><div class="log" id="labLog">Pick enemies and a weapon.</div></div>`;
  $('side').onchange = e => {
    if (busy()) return;
    if (e.target.dataset.slot != null) lab.foes[+e.target.dataset.slot] = e.target.value;
    if (e.target.id === 'labHp') { lab.hp = Math.max(10, +e.target.value || 100); refresh(true); return; }
    refresh();
  };
  $('side').onclick = e => {
    if (e.target.id !== 'labSim') return;
    const lines = ['weapon     win   time  hp left'];
    for (const w of WEAPONS) {
      let wins = 0, t = 0, left = 0;
      for (let s = 1; s <= 100; s++) {
        const h = baseHero(w.id, lab.target); h.maxHp = h.hp = lab.hp;
        const f = simulate(h, defs(), makeRng(s).next);
        if (f.won) { wins++; t += f.t; left += f.hero.hp; }
      }
      lines.push(w.id.padEnd(9) + (wins + '%').padStart(5) + (wins ? (t / wins).toFixed(0) + 's' : '--').padStart(7) + (wins ? Math.round(left / wins) : '--').toString().padStart(8));
    }
    $('labLog').textContent = lines.join('\n');
  };
  $('screen').onclick = e => {
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
  $('screen').onclick = null; $('side').onclick = null; $('side').onchange = null;
  if (name === 'lab') { document.body.dataset.screen = 'lab'; run = null; labScreen(); }
  else { run = null; show(); }
}
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });

syncControls();
if (location.hash === '#debug') go('lab'); else show();
requestAnimationFrame(frame);
