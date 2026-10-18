// The page: save/load, the fight loop, the shop and the result card.

const SAVE_KEY = 'bossrush-save';
const STEP = 1 / 30;          // fixed sim step, the same one balance.js uses
const AUTO_DELAY = 2.2;       // seconds the result card stays up before auto-fight starts the next one

const $ = id => document.getElementById(id);
let save = load(), fight = null, result = null, tab = 'upgrades', acc = 0, last = performance.now(), saved = 0;
const view = makeView($('cv'));

function load() {
  const fresh = newSave();
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s) return { ...fresh, ...s, lv: { ...s.lv }, gear: { ...fresh.gear, ...s.gear }, auto: { ...fresh.auto, ...s.auto } };
  } catch (e) {}
  return fresh;
}
function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} saved = 0; }

function startFight() {
  if (fight && !fight.done) return;
  const bought = save.auto.buy ? autoBuy(save) : [];
  fight = newFight(save, save.boss); result = null; acc = 0;
  fight.bought = bought;
  view.reset(); $('result').hidden = true;
  refresh(true);
}

function finish() {
  const before = save.boss;
  (fight.won ? SFX.win : SFX.lose)();
  result = { p: settle(save, fight), won: fight.won, i: fight.i, dealt: fight.dealt, hp: fight.boss.hp, bought: fight.bought, wait: AUTO_DELAY, pushed: save.boss !== before };
  store();
  showResult();
  refresh(true);
}

function showResult() {
  const r = result, b = bossInfo(r.i), el = $('result');
  const group = items => {
    const m = new Map(); for (const x of items) { const k = x.kind === 'gear' ? tierName(x.def, x.level + 1) : x.def.name; m.set(k, (m.get(k) || 0) + 1); }
    return [...m].map(([k, n]) => n > 1 ? k + ' ×' + n : k).join(', ');
  };
  el.innerHTML = `<div class="card">
    <h2 class="${r.won ? 'win' : 'loss'}">${r.won ? 'YOU WIN!' : 'K.O.'}</h2>
    <div class="sub">${b.name} · ${fmt(r.dealt)} damage (${r.dealt / r.hp < 0.01 ? '<1' : Math.round(r.dealt / r.hp * 100)}% of its HP)</div>
    <div class="lines">
      <div><span>Damage payout</span><span>+${fmt(r.p.base)}</span></div>
      ${r.won ? `<div><span>Kill bonus</span><span>+${fmt(r.p.kill)}</span></div>` : ''}
      ${r.p.first ? `<div class="jackpot"><span>First kill ×${FIRST_KILL}</span><span>+${fmt(r.p.first)}</span></div>` : ''}
    </div>
    <div class="total"><span>Total</span><b id="countup">0</b></div>
    ${r.bought && r.bought.length ? `<div class="bought">Auto-bought before this fight: ${group(r.bought)}</div>` : ''}
    <div class="row">
      ${r.won && !r.pushed && save.unlocked > r.i ? `<button class="btn" data-act="nextboss">Next boss →</button>` : ''}
      <button class="btn primary" data-act="again">${r.pushed ? 'Fight ' + bossInfo(save.boss).name : 'Fight again'}</button>
    </div>
    <div class="next" id="nextIn"></div>
  </div>`;
  el.hidden = false;
  r.shown = 0;
}

$('result').addEventListener('click', e => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'nextboss') { save.boss = Math.min(save.unlocked, result.i + 1); startFight(); }
  if (act === 'again') startFight();
});

// Shop ---------------------------------------------------------------------------------------

function shopRows() {
  const items = shopItems(save);
  if (tab === 'upgrades') return items.filter(x => x.kind === 'upgrade').map(x => ({
    key: x.id, cls: 'item', name: x.def.name, level: 'Lv ' + x.level, fx: x.def.show(x.level) + ' → ' + x.def.show(x.level + 1).split(' ')[0], item: x }));
  if (tab === 'gear') return items.filter(x => x.kind === 'gear').map(x => ({
    key: x.id, cls: 'item gear', name: tierName(x.def, x.level), level: x.def.name,
    fx: 'Next: ' + tierName(x.def, x.level + 1) + ' (×' + x.def.mult + ' ' + x.def.stat + ')', item: x }));
  return null;
}

function renderPanel() {
  const panel = $('panel');
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  if (tab === 'bosses') {
    let html = '';
    for (let i = 0; i <= save.unlocked; i++) {
      const b = bossInfo(i), best = Math.min(1, (save.best[i] || 0) / b.hp), kills = save.kills[i] || 0;
      html += `<button class="boss" data-boss="${i}" aria-current="${i === save.boss}">
        <img class="dot" alt="" src="${bossThumb(b.id)}" style="background:${b.color}33">
        <span><b>${i + 1}. ${b.name}</b><div class="meta">${fmt(b.hp)} HP · hits for ${fmt(b.atk)}</div><div class="bar"><i style="width:${best * 100}%"></i></div></span>
        <span class="tag">${kills ? '✓ ' + kills : best ? Math.round(best * 100) + '%' : ''}</span></button>`;
    }
    html += `<div class="foot"><span>${save.fights} fights · ${fmt(save.earned)} earned</span><button class="btn" data-act="reset">Reset save</button></div>`;
    panel.innerHTML = html;
    return;
  }
  panel.innerHTML = shopRows().map(r => `<div class="${r.cls}" data-key="${r.key}">
    <div class="name">${r.name}<em>${r.level}</em></div><div class="fx">${r.fx}</div>
    <button class="btn" data-buy="${r.key}"><span class="coin"></span><span class="cost"></span></button></div>`).join('');
  updatePanel();
}

// Cheap per-frame update: costs, levels and which buttons are affordable.
function updatePanel() {
  const rows = shopRows();
  if (!rows) return;
  for (const r of rows) {
    const el = $('panel').querySelector(`[data-key="${r.key}"]`);
    if (!el) continue;
    el.querySelector('.name').innerHTML = r.name + '<em>' + r.level + '</em>';
    el.querySelector('.fx').textContent = r.fx;
    el.querySelector('.cost').textContent = fmt(r.item.cost);
    el.querySelector('.btn').disabled = save.gold < r.item.cost;
  }
}

$('panel').addEventListener('click', e => {
  const buyKey = e.target.closest('[data-buy]')?.dataset.buy;
  if (buyKey) {
    const item = shopItems(save).find(x => x.id === buyKey);
    if (item && buy(save, item)) { SFX.coin(); store(); refresh(); }
    return;
  }
  const bossEl = e.target.closest('[data-boss]');
  if (bossEl) { save.boss = +bossEl.dataset.boss; store(); renderPanel(); if (!fight || fight.done) { fight = null; $('result').hidden = true; } return; }
  if (e.target.closest('[data-act="reset"]') && confirm('Wipe all progress and start over?')) {
    save = newSave(); fight = null; result = null; $('result').hidden = true; store(); syncControls(); refresh(true);
  }
});

document.querySelector('.tabs').addEventListener('click', e => {
  const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; renderPanel(); }
});

// Controls and stats -------------------------------------------------------------------------

function syncControls() {
  $('autoFight').checked = save.auto.fight; $('autoBuy').checked = save.auto.buy; $('push').checked = save.auto.push;
  document.querySelectorAll('#speed button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.speed === save.speed));
  $('sound').textContent = save.sound ? 'SOUND ON' : 'SOUND OFF'; $('sound').setAttribute('aria-pressed', save.sound);
  SFX.setOn(save.sound);
}
$('sound').addEventListener('click', () => { save.sound = !save.sound; store(); syncControls(); });
document.addEventListener('pointerdown', SFX.unlock);
$('fight').addEventListener('click', startFight);
for (const [id, key] of [['autoFight', 'fight'], ['autoBuy', 'buy'], ['push', 'push']]) {
  $(id).addEventListener('change', e => { save.auto[key] = e.target.checked; store(); if (key === 'fight' && e.target.checked && (!fight || fight.done)) startFight(); });
}
$('speed').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (b) { save.speed = +b.dataset.speed; store(); syncControls(); } });

function renderStats() {
  const h = heroStats(save), dps = h.dmg * h.aps * (1 + h.crit * (h.critx - 1));
  const stats = [['Damage', fmt(h.dmg)], ['Attacks/s', h.aps.toFixed(2)], ['Crit', pct(h.crit) + ' ×' + h.critx.toFixed(2)], ['DPS', fmt(dps)],
    ['Max HP', fmt(h.hp)], ['Damage taken', '−' + pct(h.armor)], ['Dodge', pct(h.dodge)], ['Gold', '×' + h.gold.toFixed(2)]];
  $('stats').innerHTML = stats.map(([k, v]) => `<div class="stat"><small>${k}</small><b>${v}</b></div>`).join('');
}

let panelBoss = -1;
function refresh(full) {
  $('gold').textContent = fmt(save.gold);
  $('earned').textContent = fight && !fight.done ? '+' + fmt(payout(save, fight).base) : '';
  $('fight').disabled = !!(fight && !fight.done);
  if (full || tab === 'bosses' && panelBoss !== save.boss) { renderPanel(); panelBoss = save.boss; } else updatePanel();
  renderStats();
}

function sound(e) {
  if (e.type === 'hit') SFX.hit(e.crit);
  else if (e.type === 'hurt') SFX.hurt(e.slam);
  else if (e.type === 'dodge') SFX.dodge();
  else if (e.type === 'windup') SFX.windup();
}

// Main loop ----------------------------------------------------------------------------------

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (fight && !fight.done) {
    acc += dt * save.speed;
    while (acc >= STEP && !fight.done) {
      acc -= STEP;
      for (const e of step(fight, STEP)) { view.event(e, fight); sound(e); }
    }
    if (fight.done) finish();
    $('earned').textContent = fight.done ? '' : '+' + fmt(payout(save, fight).base);
  }
  if (result) {
    // count the payout up, then (with auto-fight on) start the next fight
    const el = $('countup');
    if (el && result.shown < 1) { result.shown = Math.min(1, result.shown + dt * 1.6); el.textContent = fmt(result.p.total * (1 - Math.pow(1 - result.shown, 3))); }
    if (save.auto.fight) {
      result.wait -= dt;
      const n = $('nextIn'); if (n) n.textContent = 'CONTINUE? ' + Math.max(0, Math.ceil(result.wait));
      if (result.wait <= 0) startFight();
    }
  }
  view.draw(dt * (fight && !fight.done ? save.speed : 1), fight, save, fight ? fight.boss : bossInfo(save.boss));
  if ((saved += dt) > 5) store();
  requestAnimationFrame(frame);
}

syncControls(); refresh(true);
if (save.auto.fight) startFight();
requestAnimationFrame(frame);
