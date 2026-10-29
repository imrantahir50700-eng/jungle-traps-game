'use strict';
/* JUNGLE TRAPS — headless tests for the GPT-art integration:
   1) ASSETS — every ART file exists on disk; loader starts in the
      loading state (vector fallback) when no image has loaded yet.
   2) RENDERER — with stubbed Images marked ready, render() issues
      drawImage calls for the hero (state-correct frame, run cycle
      advances, horizontal flip when facing left, dizzy on death,
      victory in the door cinematic, gold skin swap) and for
      door / spikes / coin / key / checkpoint when on screen; the
      door is drawn WIDE (112x80); off-screen sprites are culled.
   3) FALLBACK — when an image fires 'error', the renderer draws the
      original vector art for that element instead (no drawImage). */
const fs = require('fs');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } }

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

/* ---------- recording canvas ctx ---------- */
let ops = [];
function makeCtx() {
  const grad = { addColorStop() {} };
  const base = {
    canvas: null,
    measureText: () => ({ width: 42 }),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    getImageData: () => ({ data: new Uint8ClampedArray(4) })
  };
  return new Proxy(base, {
    get(o, p) { if (p in o) return o[p]; return (...args) => { ops.push({ m: String(p), args }); }; },
    set(o, p, v) { o[p] = v; return true; }
  });
}
const gameCtx = makeCtx();

/* ---------- DOM stubs (superset of promo-test stubs) ---------- */
function makeEl(tag) {
  const styleP = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  const el = { tagName: (tag || 'div').toUpperCase(), children: [], style: styleP, dataset: {}, _text: '', width: 0, height: 0,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); if (f) this._s.add(c); else this._s.delete(c); return f; }, contains(c) { return this._s.has(c); } },
    appendChild(c) { this.children.push(c); return c; }, removeChild(c) { return c; },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    getContext() { return gameCtx; },
    captureStream() { return { getVideoTracks: () => [], getAudioTracks: () => [] }; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 540 }; },
    click() {}, focus() {} };
  Object.defineProperty(el, 'textContent', { get() { return this._text; }, set(v) { this._text = v; } });
  Object.defineProperty(el, 'innerHTML', { get() { return ''; }, set(v) { if (v === '') this.children = []; } });
  el.children = tag === 'span' ? [] : [makeEl('span'), makeEl('span'), makeEl('span')];
  return el;
}
const elCache = {};
global.window = global;
global.document = { getElementById: id => (elCache[id] = elCache[id] || makeEl()), createElement: t => makeEl(t),
  addEventListener() {}, body: makeEl('body'), documentElement: makeEl('html'), querySelectorAll: () => [] };
global.localStorage = { _s: {}, getItem(k) { return k in this._s ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
Object.defineProperty(global, 'navigator', { value: { maxTouchPoints: 0, vibrate: () => true }, configurable: true });
global.requestAnimationFrame = () => {};
global.addEventListener = () => {}; global.removeEventListener = () => {};
global.innerWidth = 1280; global.innerHeight = 800;

/* ---------- stubbed Image ---------- */
const imageInstances = [];
class FakeImage {
  constructor() {
    this.width = 0; this.height = 0; this.naturalWidth = 0; this.naturalHeight = 0;
    this.complete = false; this.onload = null; this.onerror = null; this._src = '';
    imageInstances.push(this);
  }
  set src(v) { this._src = v; }
  get src() { return this._src; }
}
global.Image = FakeImage;

vm.runInThisContext(script, { filename: 'game.js' });
const JT = global.__JT;
ok(!!JT && !!JT.ART, 'game booted with the ART registry exposed');

function artImage(file) { return imageInstances.find(im => im.src === 'assets/' + file); }
function readyArt(file, w, h) {
  const im = artImage(file); if (!im) return null;
  im.width = w; im.height = h; im.naturalWidth = w; im.naturalHeight = h; im.complete = true;
  if (im.onload) im.onload();
  return im;
}
function failArt(file) { const im = artImage(file); if (im && im.onerror) im.onerror(); }
function draws(file) { return ops.filter(o => o.m === 'drawImage' && o.args[0] && o.args[0].src === 'assets/' + file); }
function clearOps() { ops = []; }

/* ---------- 1) assets + loading fallback ---------- */
Object.keys(JT.ART).forEach(function (name) {
  ok(fs.existsSync(__dirname + '/assets/' + JT.ART[name].file), 'asset file exists: ' + JT.ART[name].file);
});
ok(fs.existsSync(__dirname + '/assets/menu-bg.jpg'), 'asset file exists: menu-bg.jpg');
ok(html.includes("url('assets/menu-bg.jpg')"), 'menu screen uses menu-bg.jpg');
ok(html.includes("url('assets/portal-bg.jpg')"), 'ending screen uses portal-bg.jpg');
JT.startLevel(0);
clearOps(); JT.render();
ok(ops.filter(o => o.m === 'drawImage').length === 0, 'no drawImage before any sprite loads (pure vector fallback)');
ok(ops.some(o => o.m === 'fillRect'), 'vector renderer still draws with no art loaded');

/* mark every sprite ready with its real pixel size */
[['hero-stand.png', 240, 508], ['hero-run-1.png', 221, 288], ['hero-run-2.png', 221, 288], ['hero-run-3.png', 221, 288],
 ['hero-run-4.png', 221, 288], ['hero-run-5.png', 221, 288], ['hero-jump.png', 250, 294], ['hero-fall.png', 268, 222],
 ['hero-dizzy.png', 291, 317], ['hero-victory.png', 249, 350], ['hero-gold.png', 251, 512],
 ['door.png', 329, 236], ['door-fake.png', 322, 232], ['spikes.png', 342, 210], ['platform-crumble.png', 360, 205],
 ['boulder.png', 225, 191], ['rock-block.png', 195, 189], ['saw.png', 277, 209], ['statue.png', 429, 219],
 ['bomb.png', 156, 178], ['mushroom.png', 244, 201], ['crate.png', 254, 150], ['log-platform.png', 317, 184],
 ['checkpoint.png', 192, 245], ['coin.png', 133, 126], ['key.png', 134, 152], ['geyser.png', 295, 261],
 ['portal-bg.jpg', 1536, 1024]].forEach(function (a) { readyArt(a[0], a[1], a[2]); });
ok(JT.artReady('door') && JT.artReady('heroRun1'), 'sprites report ready after onload');

/* ---------- 2) on-screen elements + hero stand ---------- */
JT.startLevel(0);
{
  const L = JT.getL(), p = JT.getPlayer();
  p.grounded = true; p.vx = 0; p.vy = 0;
  L.coins[0] = { x: p.x + 44, y: p.y + 14, got: false };
  L.key = { x: p.x + 96, y: p.y + 12 };
  L.checkpoints = [{ x: p.x + 140, y: 498, lit: true }];
  L.spikes = [{ x: p.x + 190, y: 480, w: 60, hidden: false, rise: 1 }];
  clearOps(); JT.render();
  ok(draws('hero-stand.png').length === 1, 'idle hero draws hero-stand');
  ok(draws('coin.png').length >= 1, 'on-screen coin draws coin sprite');
  ok(draws('key.png').length === 1, 'on-screen key draws key sprite');
  ok(draws('checkpoint.png').length === 1, 'on-screen checkpoint draws checkpoint sprite');
  ok(draws('spikes.png').length >= 1, 'on-screen spikes draw spikes sprite');
  ok(draws('door.png').length === 0, 'off-screen door sprite is culled (no drawImage)');
}

/* ---------- hero states ---------- */
JT.startLevel(0);
{
  const p = JT.getPlayer();
  p.grounded = true; p.vy = 0; p.vx = 200; p.face = 1; p.runPh = 0;
  clearOps(); JT.render();
  ok(draws('hero-run-1.png').length === 1, 'running hero draws run frame 1');
  p.runPh = 1.3;
  clearOps(); JT.render();
  ok(draws('hero-run-2.png').length === 1 && draws('hero-run-1.png').length === 0, 'run cycle advances to frame 2');
  p.face = -1;
  clearOps(); JT.render();
  const flipAt = ops.findIndex(o => o.m === 'scale' && o.args[0] === -1 && o.args[1] === 1);
  const runAt = ops.findIndex(o => o.m === 'drawImage' && o.args[0] && /hero-run/.test(o.args[0].src));
  ok(flipAt >= 0 && runAt > flipAt, 'facing left flips the run sprite (scale(-1,1) before its drawImage)');
  p.face = 1; p.grounded = false; p.vy = -120;
  clearOps(); JT.render();
  ok(draws('hero-jump.png').length === 1, 'rising hero draws hero-jump');
  p.vy = 120;
  clearOps(); JT.render();
  ok(draws('hero-fall.png').length === 1, 'falling hero draws hero-fall');
  JT.die();
  clearOps(); JT.render();
  ok(draws('hero-dizzy.png').length === 1, 'death moment draws hero-dizzy');
}
JT.startLevel(0);
JT.startDoorAnim();
clearOps(); JT.render();
ok(draws('hero-victory.png').length === 1, 'door cinematic draws hero-victory');
{
  const a = JT.getDoorAnim(); a.portal = true; a.t = a.dur * 0.95;
  clearOps(); JT.render();
  ok(draws('portal-bg.jpg').length >= 1, 'portal transition draws portal-bg behind the swirl');
}
JT.startLevel(0);
JT.getSave().keys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
{
  const p = JT.getPlayer(); p.grounded = true; p.vx = 0; p.vy = 0;
  clearOps(); JT.render();
  ok(draws('hero-gold.png').length === 1 && draws('hero-stand.png').length === 0, 'gold skin swaps the stand pose to hero-gold');
}
JT.getSave().keys = [];

/* ---------- door: wide draw + fake variant ---------- */
function renderNearDoor() {
  const p = JT.getPlayer();
  p.x = 800; p.y = 460; p.vx = 0; p.vy = 0;
  for (let i = 0; i < 30; i++) JT.update(1 / 60);
  clearOps(); JT.render();
}
JT.startLevel(0); renderNearDoor();
{
  const d = draws('door.png');
  ok(d.length === 1, 'on-screen door draws door sprite');
  if (d.length) {
    const a = d[0].args;
    ok(a[3] === 112 && a[4] === 80, 'door drawn wide at MANIFEST size 112x80 (got ' + a[3] + 'x' + a[4] + ')');
  }
}
JT.startLevel(0);
JT.getL().traps.push({ do: 'fakeDoor', fired: false, on: { t: 'x', at: 99999 } });
renderNearDoor();
ok(draws('door-fake.png').length >= 1 && draws('door.png').length === 0, 'unexposed fake door draws door-fake sprite');

/* ---------- 3) fallback on image error ---------- */
failArt('door.png'); failArt('door-fake.png');
ok(JT.artReady('door') === false, 'door reports not-ready after error');
JT.startLevel(0); renderNearDoor();
ok(draws('door.png').length === 0 && draws('door-fake.png').length === 0, 'failed door art issues no drawImage');
ok(ops.some(o => o.m === 'strokeRect'), 'failed door falls back to the vector door (panel strokes drawn)');
failArt('hero-run-1.png');
JT.startLevel(0);
{
  const p = JT.getPlayer();
  p.grounded = true; p.vy = 0; p.vx = 200; p.face = 1; p.runPh = 0;
  clearOps(); JT.render();
  ok(draws('hero-run-1.png').length === 0, 'failed run frame issues no drawImage');
  ok(ops.some(o => o.m === 'arc') && ops.some(o => o.m === 'fillRect'), 'failed run frame falls back to the vector hero');
}

console.log('\n==== ART RESULT: ' + pass + ' passed, ' + fail + ' failed ====');
process.exit(fail ? 1 : 0);
