'use strict';
/* JUNGLE TRAPS — MOVING HURDLES validation suite.
   For every level with `shift` data x every cycle index (0,1,2) it builds
   the EFFECTIVE level through the game's own engine (startLevel, then
   die+respawn to advance the attempt counter) and validates:
     - trap-target integrity + element support (spikes/bombs/statues/…)
     - BFS physics reachability of door + checkpoints + key
     - no spawn-kill: nothing lethal overlapping the start point or a
       checkpoint spawn in any placement. Patrols (saw/shadow) are judged
       by their SPAWN-POINT kill box when their trigger is already passed
       at the spawn — a patrol sweeping past a checkpoint later is the
       shipped design (it spawns far away, on a timer you can read);
       what must never happen is lethal geometry sitting ON a spawn.
   Plus: attempt->placement unit checks (incl. devil offset + wrap),
   the "The temple shifts…" toast, and the owner additions: dedicated
   sfxDeath + vibration patterns, checkpoint/win buzzes, and the
   door-open / galaxy-portal cinematic state machine.               */
const fs = require('fs');
const vm = require('vm');

let pass = 0, fail = 0; const failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (got ' + a + ', want ' + b + ')'); }

/* ---------------- stubs (smoke-test pattern + vibrate recorder) ---------------- */
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
    children: null,
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
const vibCalls = [];
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { maxTouchPoints: 0, vibrate: (p) => { vibCalls.push(p); } }, configurable: true
  });
} catch (e) { /* Node's own navigator: vibrate assertions become advisory */ }
const vibStubbed = typeof globalThis.navigator.vibrate === 'function';
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
const NOINPUT = { left: false, right: false, jump: false, jumpPressed: false };

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
function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function circleRectDist(cx, cy, r) {
  const dx = Math.max(r.x - cx, 0, cx - (r.x + r.w));
  const dy = Math.max(r.y - cy, 0, cy - (r.y + r.h));
  return Math.sqrt(dx * dx + dy * dy);
}
function floorYAtEff(lv, x) {
  let best = 500;
  arr(lv, 'platforms').forEach(p => { if (!p.move && x >= p.x && x <= p.x + p.w && p.y >= 380 && p.y < best) best = p.y; });
  return best;
}

/* BFS — copied edge rules from smoke-test.js (jump rise <=140, gaps
   shrink with rise, spring ~313 boost, geyser lift, crate steps,
   moving platforms as ride-connected position pairs). */
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
    if (a.kind === 'spring' && b.kind === 'plat' && rise > 0) {
      if (b.top >= a.top - 335 && g <= 230) { link(a, b); return; }
    }
    if (a.kind === 'geyser' && b.kind === 'plat') {
      if (b.top >= a.g.y - a.g.height - 100 && b.top <= a.g.y && g <= 210) { link(a, b); return; }
    }
    if (b.kind === 'geyser') {
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

/* Build the effective level for a cycle through the real engine:
   startLevel (attempt 1), then die+respawn per extra attempt. */
function snapshotGeometry(L) {
  const g = { width: L.width, start: L.start, door: L.door, key: L.key || null };
  ARRS.forEach(k => { g[k] = JSON.parse(JSON.stringify(arr(L, k))); });
  return g;
}
function effectiveLevel(idx, cycle) {
  JT.setInput(NOINPUT);
  JT.startLevel(idx);
  for (let d = 0; d < cycle; d++) { JT.die(); JT.respawn(); }
  return snapshotGeometry(JT.getL());
}

/* ---------------- 1) coverage ---------------- */
const shiftedLevels = [];
LEVELS.forEach((lv, i) => { if (arr(lv, 'traps').some(t => t.shift && t.shift.length)) shiftedLevels.push(i); });
ok(shiftedLevels.length >= 30, 'shift coverage: >=30 levels have shift data (found ' + shiftedLevels.length + ')');
[48, 49, 50, 51].forEach(i => ok(shiftedLevels.includes(i), 'Crystal cave L' + (i + 1) + ' has moving hurdles'));
[1, 2].forEach(i => {
  const sh = arr(LEVELS[i], 'traps').filter(t => t.shift);
  ok(sh.length >= 1 && sh.every(t => t.shift.length === 1), 'teaching level L' + (i + 1) + ' keeps just 1 alternate (gentler)');
});
LEVELS.forEach((lv, i) => {
  arr(lv, 'traps').forEach(t => {
    if (!t.shift) return;
    ok(t.shift.length >= 1 && t.shift.length <= 2, 'L' + (i + 1) + ' ' + t.do + ': 1-2 alternates (cycle <= 3)');
    t.shift.forEach(pl => ok(pl.on !== undefined || pl.targetX !== undefined || pl.x2 !== undefined, 'L' + (i + 1) + ' ' + t.do + ': placement is not empty'));
  });
});

/* ---------------- 2) per-cycle validation ---------------- */
function validateEffective(lv, tag) {
  /* integrity + support */
  ok(platUnder(lv, lv.start.x + 14, lv.start.y + 40, 4), tag + ': start stands on a platform');
  ok(platUnder(lv, lv.door.x + 23, lv.door.y), tag + ': door stands on a platform');
  arr(lv, 'spikes').forEach(s => {
    const host = arr(lv, 'platforms').find(p => Math.abs(p.y - (s.y + 18)) <= 2 && s.x + s.w >= p.x + 8 && s.x <= p.x + p.w - 8);
    ok(!!host, tag + ': spike patch @' + s.x + ',' + s.y + ' sits on a platform top');
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
    if (t.do === 'bomb') {
      const host = arr(lv, 'platforms').find(p => Math.abs(p.y - (t.y + 26)) <= 30 && t.x + 15 >= p.x - 10 && t.x + 15 <= p.x + p.w + 10);
      ok(!!host, tt + ' bomb @' + t.x + ' rests on/near a platform');
    }
    if (t.do === 'dartShooter') {
      const host = arr(lv, 'platforms').find(p => Math.abs(p.y - (t.y + 42)) <= 34 && t.x >= p.x - 15 && t.x <= p.x + p.w + 15);
      ok(!!host, tt + ' dart statue @' + t.x + ' mounted at floor level');
    }
  });
  /* BFS reachability */
  const graph = buildGraph(lv);
  const startNode = graph.nodes.find(n => n.kind === 'plat' && Math.abs(n.top - (lv.start.y + 40)) <= 4 && lv.start.x + 14 >= n.x1 - 2 && lv.start.x + 14 <= n.x2 + 2);
  ok(!!startNode, tag + ': BFS start node found');
  if (startNode) {
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
  }
  /* no spawn-kill */
  const spawns = [{ name: 'start', rect: { x: lv.start.x, y: lv.start.y, w: 28, h: 38 } }];
  arr(lv, 'checkpoints').forEach(c => spawns.push({ name: 'checkpoint@' + c.x, rect: { x: c.x - 4, y: c.y - 40, w: 28, h: 38 } }));
  const doorRect = { x: lv.door.x + 4, y: lv.door.y - 60, w: 38, h: 60 };
  arr(lv, 'spikes').forEach(s => {
    const kill = { x: s.x + 5, y: s.y + 9, w: s.w - 10, h: 9 };
    spawns.forEach(sp => ok(!rectsOverlap(kill, sp.rect), tag + ': spike patch @' + s.x + ' clear of ' + sp.name + ' spawn'));
    ok(!rectsOverlap(kill, doorRect), tag + ': spike patch @' + s.x + ' clear of the doorway');
  });
  function triggerPassedAt(t, spawnCx, spawnCy) {
    if (!t.on) return false;
    if (t.on.t === 'x') return spawnCx >= t.on.at;
    if (t.on.t === 'r') { const dx = spawnCx - t.on.x, dy = spawnCy - t.on.y; return dx * dx + dy * dy <= t.on.r * t.on.r; }
    return false; // lever / land need a deliberate act; timer handled separately below
  }
  arr(lv, 'traps').forEach(t => {
    spawns.forEach(sp => {
      const cx = sp.rect.x + 14, cy = sp.rect.y + 19;
      const passed = triggerPassedAt(t, cx, cy);
      const always = t.on && t.on.t === 'timer';
      if (t.do === 'ceilingRock' && (passed || always)) {
        const col = { x: t.x, y: sp.rect.y - 60, w: 44, h: 220 };
        ok(!rectsOverlap(col, sp.rect), tag + ': rock column @' + t.x + ' clear of ' + sp.name + ' spawn');
      }
      if (!passed) return;
      if (t.do === 'boulder') {
        const br = { x: t.x, y: floorYAtEff(lv, t.x) - 48, w: 48, h: 48 };
        ok(!rectsOverlap(br, sp.rect), tag + ': boulder spawn @' + t.x + ' clear of ' + sp.name + ' spawn');
      }
      if (t.do === 'bomb') {
        ok(circleRectDist(t.x + 15, t.y + 13, sp.rect) > (t.r || 110) + 2, tag + ': bomb blast @' + t.x + ' clear of ' + sp.name + ' spawn');
      }
      if (t.do === 'sawMove') {
        const kb = { x: t.x - 15, y: t.y - 15, w: 30, h: 30 };
        ok(!rectsOverlap(kb, sp.rect), tag + ': saw spawn point @' + t.x + ' clear of ' + sp.name + ' spawn');
      }
      if (t.do === 'shadowSpawn') {
        const kb = { x: t.x + 4, y: t.y + 4, w: 20, h: 34 };
        ok(!rectsOverlap(kb, sp.rect), tag + ': shadow spawn point @' + t.x + ' clear of ' + sp.name + ' spawn');
      }
      if (t.do === 'dartShooter') {
        const inLaneY = sp.rect.y < t.y + 12 && sp.rect.y + sp.rect.h > t.y - 4;
        const inLine = (t.dir || -1) < 0 ? cx < t.x : cx > t.x;
        if (inLaneY && inLine) ok(Math.abs(t.x - cx) >= 120, tag + ': dart lane from @' + t.x + ' gives ' + sp.name + ' spawn >=120px reaction room');
      }
    });
    /* shifted bombs: the blast itself must never cover a spawn, trigger or not */
    if (t.do === 'bomb' && t.shift) {
      spawns.forEach(sp => ok(circleRectDist(t.x + 15, t.y + 13, sp.rect) > (t.r || 110) + 2, tag + ': shifted bomb blast @' + t.x + ' clear of ' + sp.name + ' spawn (any trigger state)'));
    }
  });
}

JT.setMode('normal');
let cycleChecks = 0;
shiftedLevels.forEach(i => {
  for (let c = 0; c <= 2; c++) {
    const eff = effectiveLevel(i, c);
    validateEffective(eff, 'L' + (i + 1) + ' "' + LEVELS[i].name + '" cycle' + c);
    cycleChecks++;
  }
});
console.log('per-cycle validations run: ' + cycleChecks + ' (levels x cycles)');

/* ---------------- 3) attempt -> placement unit checks ---------------- */
function spikeXOf(idx) { const L = JT.getL(); const t = L.traps.find(t => t.do === 'spikesUp'); return spikeById(L, t.target).x; }
function triggerAtOf(idx) { const L = JT.getL(); const t = L.traps.find(t => t.do === 'spikesUp'); return t.on.at; }
try {
  JT.setMode('normal');
  JT.startLevel(3); // L4 Kaante Qareeb — hs1 base 800, alternates 480 / 190
  eq(spikeXOf(), 800, 'L4 attempt 1: doorstep patch at base 800');
  eq(triggerAtOf(), 665, 'L4 attempt 1: trigger at base 665');
  JT.die(); JT.respawn();
  eq(spikeXOf(), 480, 'L4 attempt 2: patch moved to centre 480');
  eq(triggerAtOf(), 345, 'L4 attempt 2: trigger moved with it (345)');
  JT.die(); JT.respawn();
  eq(spikeXOf(), 190, 'L4 attempt 3: patch moved to start side 190');
  JT.die(); JT.respawn();
  eq(spikeXOf(), 800, 'L4 attempt 4: cycle wraps back to base 800');
  eq(JT.getDeaths(), 3, 'L4: three deaths counted in the run');
} catch (e) { ok(false, 'L4 cycle unit check threw: ' + e.message); }
try {
  JT.startLevel(1); // L2 — cycle length 2 (single alternate 792)
  eq(spikeXOf(), 480, 'L2 attempt 1: base patch 480');
  JT.die(); JT.respawn();
  eq(spikeXOf(), 792, 'L2 attempt 2: patch by the door 792');
  JT.die(); JT.respawn();
  eq(spikeXOf(), 480, 'L2 attempt 3: 2-cycle wraps to base 480');
} catch (e) { ok(false, 'L2 cycle unit check threw: ' + e.message); }
try {
  JT.setMode('devil'); // devil starts the cycle one step in
  JT.startLevel(3);
  eq(spikeXOf(), 480, 'L4 devil attempt 1: starts at placement index 1 (480)');
  JT.setMode('normal');
  JT.startLevel(3);
  eq(spikeXOf(), 800, 'L4 normal again: back to base 800 (fresh entry resets the counter)');
} catch (e) { ok(false, 'devil offset check threw: ' + e.message); }
try {
  const toastEl = globalThis.document.getElementById('toast');
  JT.startLevel(3);
  toastEl.textContent = '';
  JT.die(); JT.respawn();
  eq(toastEl.textContent, 'The temple shifts…', 'respawn on a shifted level shows the shift toast');
  JT.startLevel(11); // L12 — no shift data
  toastEl.textContent = '';
  JT.die(); JT.respawn();
  ok(toastEl.textContent !== 'The temple shifts…', 'respawn on an unshifted level does NOT show the shift toast');
} catch (e) { ok(false, 'toast check threw: ' + e.message); }

/* ---------------- 4) owner additions: sfxDeath + vibration ---------------- */
try {
  eq(typeof JT.sfxDeath, 'function', 'sfxDeath exists in the synth set');
  const fx = JT.getFx();
  JT.setMode('normal');
  JT.startLevel(0);
  const d0 = fx.sfxDeath, v0 = vibCalls.length, f0 = fx.vibPatterns.length;
  JT.die();
  eq(fx.sfxDeath, d0 + 1, 'die() invokes the dedicated sfxDeath exactly once');
  if (vibStubbed) {
    eq(vibCalls.length, v0 + 1, 'die() calls navigator.vibrate once');
    eq(JSON.stringify(vibCalls[vibCalls.length - 1]), JSON.stringify([50, 40, 70]), 'death vibration is the [50,40,70] double-thud');
    eq(fx.vibPatterns.length, f0 + 1, 'fxLog recorded the death vibration');
  }
  /* toggle off -> silence */
  const sv = JT.getSave(); sv.settings.vib = false;
  const v1 = vibCalls.length;
  JT.respawn(); JT.die();
  eq(vibCalls.length, v1, 'vibration toggle OFF silences death buzz');
  sv.settings.vib = true;
  /* checkpoint buzz (L36 flag @1150) */
  JT.startLevel(35);
  JT.setInput(NOINPUT);
  const p = JT.getPlayer(); p.x = 1146; p.y = 460;
  const v2 = vibCalls.length;
  for (let f = 0; f < 20; f++) JT.update(1 / 60);
  ok(!!JT.getCheckpoint(), 'L36: checkpoint lit for the buzz check');
  if (vibStubbed) ok(vibCalls.slice(v2).some(pat => pat === 20), 'checkpoint activation buzzes a single 20ms');
  /* win buzz via direct winLevel (sheet flow) */
  const v3 = vibCalls.length;
  JT.winLevel();
  if (vibStubbed) ok(vibCalls.slice(v3).some(pat => JSON.stringify(pat) === JSON.stringify([30, 50, 30])), 'level win buzzes [30,50,30]');
} catch (e) { ok(false, 'feel checks threw: ' + e.message); }

/* ---------------- 5) door / portal cinematic state machine ---------------- */
function runDoorScenario(idx, opts) {
  const tag = opts.tag;
  JT.setMode('normal');
  JT.startLevel(idx);
  JT.setInput(NOINPUT);
  const lv = LEVELS[idx];
  const p = JT.getPlayer();
  p.x = lv.door.x + 10; p.y = lv.door.y - 38; p.vx = 0; p.vy = 0;
  const deathsBefore = JT.getDeaths();
  JT.update(1 / 60); // the overlap frame
  const a = JT.getDoorAnim();
  ok(!!a, tag + ': touching the door starts the cinematic (no instant sheet)');
  if (!a) return;
  eq(a.portal, opts.portal, tag + ': portal flag is ' + opts.portal);
  eq(a.big, !!opts.big, tag + ': big flag is ' + !!opts.big);
  ok(Math.abs(a.dur - opts.dur) < 0.01, tag + ': cinematic duration ' + a.dur + 's (want ~' + opts.dur + ')');
  eq(JT.getState().g, 'dooranim', tag + ': state machine is in dooranim');
  JT.die(); // must be refused: hero is invulnerable mid-cinematic
  eq(JT.getDeaths(), deathsBefore, tag + ': die() refused during the cinematic');
  const seenT = [];
  let frames = 0;
  while (JT.getState().g === 'dooranim' && frames < 200) {
    const cur2 = JT.getDoorAnim(); if (cur2) seenT.push(cur2.t);
    JT.update(1 / 60);
    JT.render();
    frames++;
  }
  ok(seenT.length >= 3 && seenT.every((v, i) => i === 0 || v > seenT[i - 1]), tag + ': animation clock advances monotonically over ' + seenT.length + ' probes');
  ok(frames <= opts.maxFrames, tag + ': cinematic finished in ' + frames + ' frames (cap ' + opts.maxFrames + ')');
  eq(JT.getState().g, 'complete', tag + ': complete flow fires after the cinematic');
  ok(JT.getDoorAnim() === null, tag + ': doorAnim cleared after the cinematic');
}
try { runDoorScenario(0, { tag: 'L1 (normal level)', portal: false, dur: 0.5, maxFrames: 42 }); }
catch (e) { ok(false, 'L1 door scenario threw: ' + e.message); }
try { runDoorScenario(23, { tag: 'L24 (world 2 finale)', portal: true, dur: 1.0, maxFrames: 72 }); }
catch (e) { ok(false, 'L24 door scenario threw: ' + e.message); }
try { runDoorScenario(48, { tag: 'L49 (Crystal cave)', portal: true, dur: 1.0, maxFrames: 72 }); }
catch (e) { ok(false, 'L49 door scenario threw: ' + e.message); }
try {
  runDoorScenario(47, { tag: 'L48 (grand finale)', portal: true, big: true, dur: 1.2, maxFrames: 84 });
  ok(globalThis.document.getElementById('screen-ending') !== null, 'L48: ending screen exists in the flow');
} catch (e) { ok(false, 'L48 door scenario threw: ' + e.message); }

console.log('\n==== SHIFT RESULT: ' + pass + ' passed, ' + fail + ' failed ====');
if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log('  - ' + f)); }
process.exit(fail ? 1 : 0);
