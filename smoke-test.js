'use strict';
/* JUNGLE TRAPS — headless smoke suite for the LEVEL REDESIGN.
   Loads index.html's script with DOM/canvas/localStorage stubs, then:
   1) structure + data-integrity checks on all 52 levels
   2) BFS physics reachability (door + checkpoints + key per level)
   3) design-grammar metrics (doorstep twists, devilOnly spread, medians)
   4) live simulation through the game's own __JT hooks (300+ frames/level,
      render included), checkpoint respawn, lever->gate, bomb->cracked,
      geyser lift, fakeDoor relocation.                                     */
const fs = require('fs');
const vm = require('vm');

let pass = 0, fail = 0; const failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (got ' + a + ', want ' + b + ')'); }

/* ---------------- stubs ---------------- */
function makeCtx() {
  const grad = { addColorStop() {} };
  const t = {
    measureText: () => ({ width: 42 }),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    getImageData: () => ({ data: new Uint8ClampedArray(4) })
  };
  return new Proxy(t, { get(o, p) { if (p in o) return o[p]; return () => {}; }, set() { return true; } });
}
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), dataset: {},
    children: null, // filled below (completeStars needs 3 span children)
    style: { setProperty() {}, getPropertyValue() { return ''; }, removeProperty() {} },
    className: '', textContent: '', innerHTML: '', width: 0, height: 0, value: '1',
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); if (f) this._s.add(c); else this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, getAttribute() { return null; },
    appendChild(c) { this.children.push(c); return c; },
    getContext() { return makeCtx(); },
    getBoundingClientRect() { return { width: 960, height: 540, left: 0, top: 0 }; },
    requestFullscreen() { return Promise.resolve(); }
  };
  el.children = tag === 'span' ? [] : [makeEl('span'), makeEl('span'), makeEl('span')];
  return el;
}
const elCache = {};
globalThis.window = globalThis;
globalThis.innerWidth = 1280; globalThis.innerHeight = 800;
try { Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 0 }, configurable: true }); } catch (e) { /* Node's own navigator is fine too */ }
globalThis.requestAnimationFrame = () => {};
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.document = {
  getElementById(id) { return elCache[id] || (elCache[id] = makeEl('div')); },
  createElement(tag) { return makeEl(tag); },
  querySelectorAll() { return []; },
  addEventListener() {},
  documentElement: makeEl('html'),
  body: makeEl('body')
};
const lsStore = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: { getItem: k => (k in lsStore ? lsStore[k] : null), setItem: (k, v) => { lsStore[k] = String(v); }, removeItem: k => { delete lsStore[k]; } }
});

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
vm.runInThisContext(script, { filename: 'game-script.js' });
const JT = globalThis.__JT;
ok(!!JT, 'game booted and exposed __JT hooks');
const LEVELS = JT.LEVELS;

/* ---------------- helpers ---------------- */
const ARRS = ['platforms', 'spikes', 'springs', 'crates', 'coins', 'traps', 'checkpoints', 'signs', 'levers', 'gates', 'geysers', 'torches'];
function arr(lv, k) { return lv[k] || []; }
function platById(lv, id) { return arr(lv, 'platforms').find(p => p.id === id); }
function spikeById(lv, id) { return arr(lv, 'spikes').find(s => s.id === id); }
function gateById(lv, id) { return arr(lv, 'gates').find(g => g.id === id); }
function leverById(lv, id) { return arr(lv, 'levers').find(l => l.id === id); }
function platUnder(lv, x, top, tol) {
  tol = tol === undefined ? 2 : tol;
  return arr(lv, 'platforms').find(p => Math.abs(p.y - top) <= tol && x >= p.x - 4 && x <= p.x + p.w + 4) || null;
}

/* ---------------- 1) structure & integrity ---------------- */
eq(LEVELS.length, 52, 'level count is 52');
const worldCount = {};
LEVELS.forEach(lv => { worldCount[lv.world] = (worldCount[lv.world] || 0) + 1; });
[1, 2, 3, 4].forEach(w => eq(worldCount[w], 12, 'world ' + w + ' has 12 levels'));
eq(worldCount[5], 4, 'crystal world has 4 levels');
const TD_RANGES = { 1: [3, 8], 2: [8, 15], 3: [15, 30], 4: [30, 50], 5: [40, 70] };
let keyLevels = [], devilLevels = 0;
LEVELS.forEach((lv, i) => {
  const tag = 'L' + (i + 1) + ' "' + lv.name + '"';
  ok(typeof lv.name === 'string' && lv.name.length > 2, tag + ': has name');
  ok(typeof lv.hint === 'string' && lv.hint.length > 10, tag + ': has hint');
  ok(lv.width >= 900 && lv.width <= 1800, tag + ': width sane (' + lv.width + ')');
  const r = TD_RANGES[lv.world];
  ok(lv.targetDeaths >= r[0] && lv.targetDeaths <= r[1], tag + ': targetDeaths ' + lv.targetDeaths + ' in world range ' + r);
  ok(platUnder(lv, lv.start.x + 14, lv.start.y + 40, 4), tag + ': start stands on a platform');
  ok(platUnder(lv, lv.door.x + 23, lv.door.y), tag + ': door stands on a platform');
  ['platforms', 'spikes', 'gates', 'levers'].forEach(k => {
    const ids = arr(lv, k).filter(o => o.id !== undefined).map(o => o.id);
    eq(new Set(ids).size, ids.length, tag + ': unique ids in ' + k);
  });
  arr(lv, 'spikes').forEach(s => {
    const host = arr(lv, 'platforms').find(p => Math.abs(p.y - (s.y + 18)) <= 2 && s.x + s.w >= p.x + 8 && s.x <= p.x + p.w - 8);
    ok(!!host, tag + ': spike patch @' + s.x + ' sits on a platform top');
  });
  arr(lv, 'springs').forEach(s => ok(!!platUnder(lv, s.x + 18, s.y + 14), tag + ': spring @' + s.x + ' supported'));
  arr(lv, 'levers').forEach(l => ok(!!platUnder(lv, l.x + 12, l.y), tag + ': lever ' + l.id + ' supported'));
  arr(lv, 'checkpoints').forEach(c => ok(!!platUnder(lv, c.x + 10, c.y), tag + ': checkpoint @' + c.x + ' supported'));
  arr(lv, 'geysers').forEach(g => ok(!!platUnder(lv, g.x + 20, g.y), tag + ': geyser @' + g.x + ' supported'));
  arr(lv, 'crates').forEach(c => ok(!!platUnder(lv, c.x + 17, c.y + 34), tag + ': crate @' + c.x + ' supported'));
  arr(lv, 'gates').forEach(g => ok(!!platUnder(lv, g.x + g.w / 2, g.y + g.h), tag + ': gate ' + g.id + ' lands on a floor'));
  arr(lv, 'traps').forEach(t => {
    const tt = tag + ': trap ' + t.do;
    if (t.do === 'spikesUp') ok(!!spikeById(lv, t.target), tt + ' target spike exists');
    if (['floorFall', 'floorHide', 'platformGo'].includes(t.do)) ok(!!platById(lv, t.target), tt + ' target platform exists');
    if (t.do === 'leverGate') ok(!!gateById(lv, t.target), tt + ' target gate exists');
    if (t.on && t.on.t === 'land') ok(!!platById(lv, t.on.target), tt + ' land-target platform exists');
    if (t.on && t.on.t === 'lever') ok(!!leverById(lv, t.on.id), tt + ' lever exists');
    if (['dartShooter', 'sawMove', 'shadowSpawn'].includes(t.do)) ok(typeof t.x === 'number' && typeof t.x2 === 'number' || t.do === 'dartShooter', tt + ' has coords');
    if (t.do === 'bomb' || t.do === 'ceilingRock') ok(typeof t.x === 'number', tt + ' has x');
    if (t.do === 'boulder') ok(typeof t.x === 'number' && typeof t.dir === 'number', tt + ' has x/dir');
  });
  arr(lv, 'gates').forEach(g => {
    const opener = arr(lv, 'traps').find(t => t.do === 'leverGate' && t.target === g.id);
    ok(!!opener, tag + ': gate ' + g.id + ' has a leverGate trap');
    if (opener) {
      const lev = leverById(lv, opener.on.id);
      ok(!!lev && lev.x < g.x, tag + ': gate ' + g.id + ' lever stands before the gate');
    }
  });
  if (lv.key) { keyLevels.push(i); ok(lv.world !== 5, tag + ': keys only in worlds 1-4'); }
  if (arr(lv, 'traps').some(t => t.devilOnly)) devilLevels++;
  if (lv.width > 1440 || lv.world === 5) ok(arr(lv, 'checkpoints').length >= 1, tag + ': long/crystal level keeps a checkpoint');
  if (i !== 0) ok(arr(lv, 'traps').length >= 1, tag + ': has at least one trap (only L1 is trap-free)');
});
eq(keyLevels.length, 10, 'exactly 10 crystal keys (levels ' + keyLevels.map(i => i + 1).join(',') + ')');
ok(devilLevels >= 15, 'devilOnly traps on >=15 levels (found ' + devilLevels + ')');

/* ---------------- 2) BFS physics reachability ----------------
   Edge rules approximate the engine: jump rise <=140px, same-height gap
   <=~185px shrinking with rise, drop gaps wider, spring boost ~313px,
   geyser lift to column top + drift, crates as pushable 34px steps,
   moving platforms as two ride-connected positions. Hazards ignored:
   this proves geometry, not survivability timing.                    */
function buildGraph(lv) {
  const nodes = [], ride = [], extra = [];
  const add = n => { nodes.push(n); return n; };
  arr(lv, 'platforms').forEach(p => {
    if (p.move) {
      const dx = p.move.axis === 'x' ? p.move.dist : 0, dy = p.move.axis === 'y' ? p.move.dist : 0;
      const a = add({ x1: p.x, x2: p.x + p.w, top: p.y, kind: 'plat' });
      const b = add({ x1: p.x + dx, x2: p.x + p.w + dx, top: p.y + dy, kind: 'plat' });
      ride.push([a, b]);
    } else add({ x1: p.x, x2: p.x + p.w, top: p.y, kind: 'plat' });
  });
  arr(lv, 'springs').forEach(s => {
    const host = nodes.find(n => n.kind === 'plat' && Math.abs(n.top - (s.y + 14)) <= 2 && s.x >= n.x1 - 40 && s.x <= n.x2);
    if (host) add({ x1: s.x, x2: s.x + 40, top: s.y + 14, kind: 'spring', host });
  });
  arr(lv, 'geysers').forEach(g => add({ x1: g.x, x2: g.x + 44, top: g.y, kind: 'geyser', g }));
  arr(lv, 'crates').forEach(c => {
    const host = nodes.find(n => n.kind === 'plat' && Math.abs(n.top - (c.y + 34)) <= 2 && c.x >= n.x1 && c.x <= n.x2);
    if (host) { const v = add({ x1: host.x1, x2: host.x2, top: host.top - 34, kind: 'crateStep' }); extra.push([host, v], [v, host]); }
  });
  const hgap = (a, b) => Math.max(0, Math.max(b.x1 - a.x2, a.x1 - b.x2));
  const edges = new Map(nodes.map(n => [n, []]));
  const link = (a, b) => { if (a !== b) edges.get(a).push(b); };
  ride.forEach(([a, b]) => { link(a, b); link(b, a); });
  extra.forEach(([a, b]) => link(a, b));
  nodes.forEach(a => nodes.forEach(b => {
    if (a === b) return;
    const g = hgap(a, b), rise = a.top - b.top;
    if (a.kind === 'spring' && b.kind === 'plat' && rise > 0) {          // spring boost
      if (b.top >= a.top - 335 && g <= 230) { link(a, b); return; }
    }
    if (a.kind === 'geyser' && b.kind === 'plat') {                      // steam lift exit
      if (b.top >= a.g.y - a.g.height - 100 && b.top <= a.g.y && g <= 210) { link(a, b); return; }
    }
    if (b.kind === 'geyser') {                                           // step/drop into the column
      if (g <= 150 && a.top >= b.top - 360 && a.top <= b.top + 4) { link(a, b); return; }
    }
    if (rise > 0) { if (rise <= 140 && g + rise * 1.1 <= 190) link(a, b); }
    else if (g <= (rise < -50 ? 245 : 195)) link(a, b);
  }));
  return { nodes, edges };
}
function bfsFrom(graph, startNode) {
  const seen = new Set([startNode]), q = [startNode];
  while (q.length) { const n = q.shift(); graph.edges.get(n).forEach(m => { if (!seen.has(m)) { seen.add(m); q.push(m); } }); }
  return seen;
}
LEVELS.forEach((lv, i) => {
  const tag = 'L' + (i + 1) + ' "' + lv.name + '"';
  const graph = buildGraph(lv);
  const startNode = graph.nodes.find(n => n.kind === 'plat' && Math.abs(n.top - (lv.start.y + 40)) <= 4 && lv.start.x + 14 >= n.x1 - 2 && lv.start.x + 14 <= n.x2 + 2);
  ok(!!startNode, tag + ': BFS start node found');
  if (!startNode) return;
  const seen = bfsFrom(graph, startNode);
  const onReached = (x, top, tolX, tolTop) => [...seen].some(n => Math.abs(n.top - top) <= (tolTop || 2) && x >= n.x1 - (tolX || 0) && x <= n.x2 + (tolX || 0));
  ok(onReached(lv.door.x + 23, lv.door.y, 12, 2), tag + ': DOOR reachable');
  arr(lv, 'checkpoints').forEach(c => ok(onReached(c.x + 10, c.y, 8, 2), tag + ': checkpoint @' + c.x + ' reachable'));
  if (lv.key) {
    const k = lv.key;
    let got = [...seen].some(n => k.x >= n.x1 - 45 && k.x <= n.x2 + 45 && (n.top - k.y) >= -15 && (n.top - k.y) <= 195);
    if (!got) got = [...seen].some(n => n.kind === 'spring' && Math.abs(k.x - (n.x1 + 20)) <= 150 && (n.top - k.y) <= 345 && k.y <= n.top + 15);
    if (!got) got = [...seen].some(n => n.kind === 'geyser' && k.x >= n.g.x - 35 && k.x <= n.g.x + 80 && k.y >= n.g.y - n.g.height - 130);
    ok(got, tag + ': KEY reachable');
  }
});

/* ---------------- 3) design-grammar metrics ---------------- */
function triggerX(lv, t) {
  if (!t.on) return t.x || 0;
  if (t.on.t === 'x') return t.on.at;
  if (t.on.t === 'r') return t.on.x;
  if (t.on.t === 'timer') return t.x || 0;
  if (t.on.t === 'lever') { const l = leverById(lv, t.on.id); return l ? l.x : 0; }
  if (t.on.t === 'land') { const p = platById(lv, t.on.target); return p ? p.x + p.w / 2 : 0; }
  return t.x || 0;
}
function effectDist(lv, t) {
  const dx = lv.door.x, iv = (a, b) => dx < a ? a - dx : (dx > b ? dx - b : 0);
  if (t.do === 'spikesUp') { const s = spikeById(lv, t.target); return s ? iv(s.x, s.x + s.w) : 9999; }
  if (t.do === 'ceilingRock') return Math.abs((t.x + 22) - (dx + 23));
  if (t.do === 'bomb') return Math.abs((t.x + 15) - (dx + 23));
  if (t.do === 'dartShooter' || t.do === 'boulder') return Math.abs(t.x - dx);
  if (t.do === 'sawMove' || t.do === 'shadowSpawn') return iv(Math.min(t.x, t.x2), Math.max(t.x, t.x2));
  if (['floorFall', 'floorHide', 'platformGo'].includes(t.do)) { const p = platById(lv, t.target); return p ? iv(p.x, p.x + p.w) : 9999; }
  return 9999;
}
const doorstepLevels = [];
LEVELS.forEach((lv, i) => {
  const hit = arr(lv, 'traps').some(t => Math.abs(triggerX(lv, t) - lv.door.x) <= 140 || effectDist(lv, t) <= 150);
  if (hit) doorstepLevels.push(i + 1);
});
ok(doorstepLevels.length >= 12, 'doorstep-twist levels >= 12 (found ' + doorstepLevels.length + ': ' + doorstepLevels.join(',') + ')');
function median(a) { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; }
const medians = {};
[1, 2, 3, 4, 5].forEach(w => { medians[w] = median(LEVELS.filter(l => l.world === w).map(l => l.width)); });
console.log('median widths by world:', JSON.stringify(medians));
ok(medians[2] <= 1320 && medians[3] <= 1400 && medians[4] <= 1560, 'world medians shrunk vs old build (was W2 1320 / W3 1560 / W4 1680)');

/* ---------------- 4) live simulation via __JT ---------------- */
JT.setMode('normal');
LEVELS.forEach((lv, i) => {
  const tag = 'L' + (i + 1) + ' "' + lv.name + '"';
  try {
    JT.startLevel(i);
    JT.setInput({ left: false, right: true, jump: false, jumpPressed: false });
    for (let f = 0; f < 300; f++) {
      if (f % 47 === 0) JT.setInput({ jumpPressed: true, jump: true });
      if (f % 47 === 1) JT.setInput({ jump: false });
      if (f === 210) JT.setInput({ right: false, left: true });
      if (f === 250) JT.setInput({ left: false, right: true });
      JT.update(1 / 60);
      JT.render();
    }
    ok(true, tag + ': simulated 300 frames + render without throwing');
  } catch (e) { ok(false, tag + ': simulation threw: ' + e.message); }
});
/* devil mode: trap filtering + extra frames */
JT.setMode('devil');
LEVELS.forEach((lv, i) => {
  const rawDevil = arr(lv, 'traps').filter(t => t.devilOnly).length;
  JT.setupLevel(i, {});
  const active = JT.getL().traps.length;
  eq(active, arr(lv, 'traps').length, 'L' + (i + 1) + ': devil mode activates all traps (' + rawDevil + ' devilOnly)');
});
JT.setMode('normal');
LEVELS.forEach((lv, i) => {
  const rawDevil = arr(lv, 'traps').filter(t => t.devilOnly).length;
  JT.setupLevel(i, {});
  eq(JT.getL().traps.length, arr(lv, 'traps').length - rawDevil, 'L' + (i + 1) + ': normal mode filters devilOnly traps');
});
/* targeted mechanics */
const NOINPUT = { left: false, right: false, jump: false, jumpPressed: false };
try {
  JT.startLevel(13);                                    // L14 Lever Aur Kunji
  JT.setInput(NOINPUT);
  const p = JT.getPlayer(); p.x = 512; p.y = 462;
  for (let f = 0; f < 40; f++) JT.update(1 / 60);
  ok(JT.getL().gates[0].open === true, 'L14: lever flips -> gate opens');
} catch (e) { ok(false, 'L14 lever test threw: ' + e.message); }
try {
  JT.startLevel(15);                                    // L16 Bam Aur Pul
  JT.setInput(NOINPUT);
  const p = JT.getPlayer(); p.x = 60; p.y = 462;
  const bombTrap = JT.getL().traps.find(t => t.do === 'bomb');
  JT.fireTrap(bombTrap);
  for (let f = 0; f < 80; f++) JT.update(1 / 60);
  ok(JT.getL().platforms.find(pl => pl.id === 'cr1').gone === true, 'L16: bomb destroys the cracked platform');
} catch (e) { ok(false, 'L16 bomb test threw: ' + e.message); }
try {
  JT.startLevel(19);                                    // L20 Bhaap Ki Seedhi
  JT.setInput(NOINPUT);
  const p = JT.getPlayer(); p.x = 912; p.y = 470; p.vx = 0; p.vy = 0;
  let minY = 9999;
  for (let f = 0; f < 240; f++) { JT.update(1 / 60); minY = Math.min(minY, p.y); }
  ok(minY < 330, 'L20: geyser lifts the player (min y ' + Math.round(minY) + ')');
} catch (e) { ok(false, 'L20 geyser test threw: ' + e.message); }
try {
  JT.startLevel(10);                                    // L11 Do Darwaze
  JT.setInput(NOINPUT);
  const p = JT.getPlayer(); p.x = 830; p.y = 462;
  for (let f = 0; f < 20; f++) JT.update(1 / 60);
  eq(JT.getL().doorState.x, 60, 'L11: fakeDoor relocates the door behind the player');
} catch (e) { ok(false, 'L11 fakeDoor test threw: ' + e.message); }
try {
  JT.startLevel(35);                                    // L36 Ghufa Ka Dil (checkpoint @1150)
  JT.setInput(NOINPUT);
  const p = JT.getPlayer(); p.x = 1146; p.y = 460;
  for (let f = 0; f < 20; f++) JT.update(1 / 60);
  ok(!!JT.getCheckpoint(), 'L36: checkpoint lights on touch');
  JT.die();
  for (let f = 0; f < 40; f++) JT.update(1 / 60);
  ok(Math.abs(JT.getPlayer().x - 1146) < 70, 'L36: respawn happens at the checkpoint (x=' + Math.round(JT.getPlayer().x) + ')');
} catch (e) { ok(false, 'L36 checkpoint test threw: ' + e.message); }
try {
  JT.startLevel(47);                                    // L48 finale -> ending flow
  JT.winLevel();
  ok(JT.getState().g === 'complete', 'L48: winning the finale reaches the ending state');
} catch (e) { ok(false, 'L48 ending test threw: ' + e.message); }
/* save roundtrip */
try {
  JT.persist();
  const raw = lsStore['jungleTrapsSaveV2'];
  ok(!!raw && JSON.parse(raw).v === 2, 'save roundtrip writes v2 save');
} catch (e) { ok(false, 'save test threw: ' + e.message); }

console.log('\n==== SMOKE RESULT: ' + pass + ' passed, ' + fail + ' failed ====');
if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log('  - ' + f)); }
process.exit(fail ? 1 : 0);
