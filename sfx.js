// Chiptune sound effects from plain oscillators: no audio files. Rapid hits are throttled so 4×
// speed doesn't turn into noise.

const SFX = (() => {
  let ac = null, on = true;
  const last = {};
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    return ac;
  }
  function tone(freq, dur, type = 'square', vol = 0.05, slide = 1, delay = 0) {
    const a = on && audio(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.08) {
    const a = on && audio(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(), g = a.createGain(); g.gain.value = vol;
    src.buffer = b; src.connect(g).connect(a.destination); src.start();
  }
  const gate = (key, ms) => { const now = performance.now(); if (now - (last[key] || 0) < ms) return false; last[key] = now; return true; };
  return {
    setOn(v) { on = v; },
    unlock() { const a = audio(); if (a && a.state === 'suspended') a.resume(); },
    // The attack sound for each weapon type, plus a sparkle on crits.
    fire(weapon, crit) {
      if (!gate('fire', weapon === 'uzi' ? 45 : weapon === 'flamer' ? 60 : 70)) return;
      if (weapon === 'gloves') { noise(0.04, 0.06); tone(120, 0.06, 'square', 0.04, 0.6); }
      else if (weapon === 'uzi') { noise(0.03, 0.05); tone(700, 0.03, 'square', 0.025, 0.4); }
      else if (weapon === 'wand') { tone(900, 0.18, 'triangle', 0.04, 2); tone(1800, 0.12, 'sine', 0.025, 1.5, 0.05); }
      else if (weapon === 'guitar') { for (const f of [110, 165, 220]) tone(f, 0.28, 'sawtooth', 0.022, 0.98); }
      else if (weapon === 'flamer') { if (gate('flame', 110)) noise(0.12, 0.035); }
      else if (weapon === 'freeze') { tone(1800, 0.14, 'sine', 0.035, 0.4); tone(2600, 0.08, 'triangle', 0.02, 0.6, 0.03); }
      else if (weapon === 'boomerang') { tone(300, 0.22, 'triangle', 0.035, 2.2); tone(660, 0.22, 'triangle', 0.02, 0.5, 0.2); }
      else if (weapon === 'bazooka') { noise(0.15, 0.07); tone(220, 0.2, 'square', 0.04, 0.5); }
      else tone(200 + Math.random() * 60, 0.05, 'square', 0.04, 0.5);
      if (crit) { tone(880, 0.07, 'square', 0.035, 1.5); tone(1320, 0.08, 'square', 0.03, 1, 0.04); }
    },
    boom() { if (gate('boom', 120)) { noise(0.4, 0.13); tone(70, 0.4, 'square', 0.07, 0.4); } },
    hurt(slam) { if (slam) { noise(0.35, 0.12); tone(90, 0.35, 'square', 0.07, 0.4); } else if (gate('hurt', 80)) tone(150, 0.1, 'sawtooth', 0.04, 0.6); },
    dodge() { if (gate('dodge', 80)) tone(500, 0.08, 'triangle', 0.05, 2.2); },
    windup(time) { tone(110, time || 1, 'sawtooth', 0.035, 4); },
    miss() { if (gate('miss', 90)) tone(300, 0.05, 'triangle', 0.025, 0.7); },
    clink() { if (gate('clink', 90)) tone(1600, 0.04, 'square', 0.02, 0.8); },
    spawn() { tone(200, 0.15, 'square', 0.04, 2.5); },
    shield() { tone(600, 0.25, 'sine', 0.05, 1.8); tone(900, 0.2, 'sine', 0.03, 1.5, 0.08); },
    heal() { if (gate('heal', 300)) { tone(660, 0.1, 'triangle', 0.04); tone(990, 0.15, 'triangle', 0.04, 1, 0.08); } },
    interrupt() { tone(1200, 0.06, 'square', 0.05, 0.5); tone(400, 0.12, 'square', 0.05, 0.5, 0.05); },
    phase() { noise(0.5, 0.1); [220, 196, 175, 147].forEach((f, i) => tone(f, 0.2, 'sawtooth', 0.05, 1, i * 0.12)); },
    kill() { if (gate('kill', 80)) { tone(400, 0.12, 'square', 0.04, 0.3); noise(0.1, 0.05); } },
    coin() { if (gate('coin', 60)) { tone(988, 0.06, 'square', 0.04); tone(1319, 0.14, 'square', 0.04, 1, 0.06); } },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.3 : 0.1, 'square', 0.05, 1, i * 0.1)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.18, 'triangle', 0.06, 0.97, i * 0.16)); },
  };
})();
