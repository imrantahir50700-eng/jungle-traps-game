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

/* ================= VISUAL / FULLSCREEN / CAMERA PASS ================= */
const NOINPUT = { left: false, right: false, jump: false, jumpPressed: false };
const scriptSrc = html; // full file text for source-level asserts

/* ---- zoom constants + render transform wiring ---- */
eq(JT.VIEW_W, 800, 'VIEW_W is 800 world units');
eq(JT.VIEW_H, 450, 'VIEW_H is 450 world units');
ok(Math.abs(JT.VIEW_SCALE - 1.2) < 1e-9, 'VIEW_SCALE is 1.2 (20% zoom)');
ok(scriptSrc.includes('ctx.scale(VIEW_SCALE, VIEW_SCALE); ctx.translate(-Math.round(camX), -Math.round(camY))'),
   'render() applies the zoom view transform (scale + camX/camY translate)');
ok(scriptSrc.includes('function coverFit('), 'coverFit helper exists');
ok(scriptSrc.includes("screen.orientation.lock('landscape')"), 'enterFullscreen attempts landscape lock');
ok(scriptSrc.includes('visualViewport'), 'fitCanvas uses visualViewport when available');

/* ---- coverFit: viewports from real phones ---- */
[[915, 412], [844, 390], [390, 844], [1920, 1080], [960, 540]].forEach(function (vp) {
  const vw = vp[0], vh = vp[1], f = JT.coverFit(vw, vh, 960, 540);
  const want = Math.max(vw / 960, vh / 540);
  ok(Math.abs(f.s - want) < 1e-9, 'coverFit ' + vw + 'x' + vh + ': scale == max ratio (' + f.s.toFixed(4) + ')');
  ok(f.s >= vw / 960 - 1e-9 && f.s >= vh / 540 - 1e-9, 'coverFit ' + vw + 'x' + vh + ': scale >= both dimension ratios');
  ok(f.w >= vw && f.h >= vh, 'coverFit ' + vw + 'x' + vh + ': canvas covers viewport (no letterbox)');
  eq(f.y, vh - f.h, 'coverFit ' + vw + 'x' + vh + ': bottom-anchored (offset y == vh - h)');
  ok(f.y <= 0, 'coverFit ' + vw + 'x' + vh + ': crop comes off the top only');
  eq(f.x, Math.round((vw - f.w) / 2), 'coverFit ' + vw + 'x' + vh + ': horizontally centred');
});

/* ---- camera target: clamps + centring ---- */
JT.startLevel(0);
{
  const lv0 = JT.getL();
  const t0 = JT.camTargetFor(0, 500);
  eq(t0.x, 0, 'camTarget clamps to 0 at level start');
  const tEnd = JT.camTargetFor(1e6, 500);
  eq(tEnd.x, lv0.width - 800, 'camTarget clamps to levelWidth - VIEW_W at the far end');
  const tGround = JT.camTargetFor(400, 500);
  eq(tGround.y, 90, 'camTarget is ground-biased on the floor (camY == H - VIEW_H == 90)');
  const tHigh = JT.camTargetFor(400, 160);
  eq(tHigh.y, 0, 'camTarget rises fully for high platforms (camY == 0)');
  const p = JT.getPlayer(); p.vy = -700;
  const tJump = JT.camTargetFor(400, 500);
  eq(tJump.y, 64, 'camTarget adds jump lookahead (90 - 26 == 64 at vy -700)');
  p.vy = 0;
}
/* narrow level (< VIEW_W wide) must centre, i.e. negative camX */
try {
  const narrow = JSON.parse(JSON.stringify(JT.LEVELS[0]));
  narrow.width = 700; narrow.name = 'Narrow Test';
  JT.LEVELS.push(narrow);
  JT.startLevel(JT.LEVELS.length - 1);
  const tn = JT.camTargetFor(350, 500);
  eq(tn.x, -50, 'narrow level: camTarget centres ((700-800)/2 == -50)');
  const cam = JT.getCam();
  eq(cam.x, -50, 'narrow level: snapped camera is centred at -50');
  JT.LEVELS.pop();
  JT.startLevel(0);
} catch (e) { ok(false, 'narrow-level camera test threw: ' + e.message); }

/* camera follows the hero and stays in range. Safe standing spots are
   probed first (this is a troll game — most floor spots are lethal). */
try {
  JT.setInput(NOINPUT);
  const lw = JT.LEVELS[20].width;
  const safe = [];
  for (let px = 80; px < lw - 60 && safe.length < 8; px += 40) {
    JT.startLevel(20);
    const p = JT.getPlayer(), d0 = JT.getDeaths();
    p.x = px; p.y = 440; p.vx = 0; p.vy = 0;
    let inRange = true;
    for (let f = 0; f < 90; f++) {
      JT.update(1 / 60);
      const c = JT.getCam();
      if (c.x < -0.01 || c.x > lw - 800 + 0.01 || c.y < -0.01 || c.y > 90.01) inRange = false;
    }
    ok(inRange, 'camera stays in range during probe at x=' + px);
    if (JT.getDeaths() === d0 && Math.abs(p.x - px) < 30) {
      const want = JT.camTargetFor(p.x + p.w / 2, p.y + p.h), c = JT.getCam();
      safe.push({ px: px, camX: c.x, wantX: want.x });
    }
  }
  ok(safe.length >= 3, 'found >=3 safe standing spots to test camera follow (got ' + safe.length + ')');
  safe.forEach(function (s) {
    ok(Math.abs(s.camX - s.wantX) < 3, 'camera converges to target at hero x=' + s.px + ' (cam ' + Math.round(s.camX) + ' vs target ' + Math.round(s.wantX) + ')');
  });
} catch (e) { ok(false, 'camera-follow test threw: ' + e.message); }

/* deep-follow probe: hover the hero (position re-pinned each frame) at the
   far end of the widest level — standing spots there are all lethal by design */
try {
  JT.setInput(NOINPUT);
  let wi = 0; JT.LEVELS.forEach(function (l, i) { if (l.width > JT.LEVELS[wi].width) wi = i; });
  const lw2 = JT.LEVELS[wi].width;
  JT.startLevel(wi);
  const p = JT.getPlayer(), d0 = JT.getDeaths();
  const pinX = lw2 - 260;
  for (let f = 0; f < 120; f++) { p.x = pinX; p.y = 300; p.vx = 0; p.vy = 0; JT.update(1 / 60); }
  const want = JT.camTargetFor(pinX + p.w / 2, 338), c = JT.getCam();
  ok(JT.getDeaths() === d0, 'hover probe survived at the far end of L' + (wi + 1));
  ok(Math.abs(c.x - want.x) < 4, 'camera converges deep in the widest level (cam ' + Math.round(c.x) + ' vs target ' + Math.round(want.x) + ')');
  ok(c.x > 300, 'camera follows the hero deep into the level (cam ' + Math.round(c.x) + ')');
} catch (e) { ok(false, 'deep-follow probe threw: ' + e.message); }

/* ---- enterFullscreen must never throw (stub: no screen.orientation) ---- */
try { JT.enterFullscreen(); ok(true, 'enterFullscreen() survives missing orientation API'); }
catch (e) { ok(false, 'enterFullscreen threw: ' + e.message); }

/* ---- headless render smoke: all 52 levels, 300 frames each, new camera ---- */
let renderErr = null;
for (let i = 0; i < 52 && !renderErr; i++) {
  try {
    JT.startLevel(i);
    JT.setInput(NOINPUT);
    for (let f = 0; f < 300; f++) { JT.update(1 / 60); JT.render(); }
    ok(true, 'L' + (i + 1) + ' renders 300 frames with zoom camera');
  } catch (e) { renderErr = e; ok(false, 'L' + (i + 1) + ' render threw: ' + e.message); }
}
/* attract/menu render path with the new camera too */
try { JT.showScreen('menu'); for (let f = 0; f < 30; f++) JT.render(); ok(true, 'menu attract render OK'); }
catch (e) { ok(false, 'menu render threw: ' + e.message); }

console.log('\n==== VISUAL RESULT: ' + pass + ' passed, ' + fail + ' failed ====');
if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log('  - ' + f)); }
process.exit(fail ? 1 : 0);
