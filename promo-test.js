'use strict';
/* Headless tests for the Promo Agent:
   1) BOT SIM — every showcase clip: scripted profiles die genuinely,
      only the final (SOLVED) attempt wins, within the plan count.
   2) STORY MACHINE — with stubbed MediaRecorder/captureStream:
      record -> attempts -> win -> endcard -> done, a result blob is
      produced, and the player's save is untouched afterwards.
   3) LAYOUT — composite zones never overlap the game rect.      */
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } }

/* ---------- DOM / browser stubs (superset of smoke-test stubs) ---------- */
function makeCtx() {
  const g = { addColorStop() {} };
  const c = { canvas: null, fillStyle: '', strokeStyle: '', globalAlpha: 1, font: '', textAlign: '', textBaseline: '', filter: undefined,
    createLinearGradient: () => g, createRadialGradient: () => g, measureText: () => ({ width: 42 }) };
  return new Proxy(c, { get(t, k) { if (k in t) return t[k]; return (...a) => undefined; }, set(t, k, v) { t[k] = v; return true; } });
}
function makeEl(tag) {
  const styleP = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  const el = { tagName: (tag || 'div').toUpperCase(), children: [], style: styleP, dataset: {}, _text: '', width: 0, height: 0,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); if (f) this._s.add(c); else this._s.delete(c); return f; }, contains(c) { return this._s.has(c); } },
    appendChild(c) { this.children.push(c); return c; }, removeChild(c) { return c; },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    captureStream() { return { getVideoTracks: () => [{ kind: 'video' }], getAudioTracks: () => [] }; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 540 }; },
    click() {}, focus() {} };
  Object.defineProperty(el, 'textContent', { get() { return this._text; }, set(v) { this._text = v; } });
  Object.defineProperty(el, 'innerHTML', { get() { return ''; }, set(v) { if (v === '') this.children = []; } });
  el.children = tag === 'span' ? [] : [makeEl('span'), makeEl('span'), makeEl('span')]; // completeStars needs 3 spans
  return el;
}
const elCache = {};
global.window = global;
global.document = { getElementById: id => (elCache[id] = elCache[id] || makeEl()), createElement: t => makeEl(t),
  addEventListener() {}, body: makeEl('body'), documentElement: makeEl('html'), querySelectorAll: () => [] };
let lsStore = {};
global.localStorage = { getItem: k => (k in lsStore ? lsStore[k] : null), setItem: (k, v) => { lsStore[k] = String(v); }, removeItem: k => { delete lsStore[k]; } };
Object.defineProperty(global, 'navigator', { value: { maxTouchPoints: 0, vibrate: () => true }, configurable: true });
global.requestAnimationFrame = () => {};
global.addEventListener = () => {}; global.removeEventListener = () => {};
global.innerWidth = 1280; global.innerHeight = 800;
/* promo recording stubs */
global.HTMLCanvasElement = function () {};
global.HTMLCanvasElement.prototype.captureStream = function () { return {}; };
global.MediaStream = class { constructor(tracks) { this.tracks = tracks || []; } getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); } getAudioTracks() { return []; } };
global.FakeRecorderInstances = [];
global.MediaRecorder = class {
  constructor(stream, opts) { this.state = 'inactive'; this.stream = stream; this.opts = opts; global.FakeRecorderInstances.push(this); }
  static isTypeSupported(t) { return t === 'video/webm;codecs=vp9,opus'; }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; if (this.ondataavailable) this.ondataavailable({ data: { size: 4321 } }); if (this.onstop) this.onstop(); }
};

vm.runInThisContext(script, { filename: 'game.js' });
const JT = global.__JT;

/* ---------- 1) BOT SIM: the attempts table ---------- */
console.log('Promo bot sim — attempts table (profile -> outcome):');
ok(Array.isArray(JT.PROMO_CLIPS) && JT.PROMO_CLIPS.length === 6, 'exactly 6 showcase clips defined');
const deathsBefore = JT.getSave().deaths;
JT.PROMO_CLIPS.forEach((clip, ci) => {
  const sim = JT.promoSimClip(ci);
  const line = sim.attempts.map(a => 'A' + a.attempt + ' ' + a.plan + ':' + a.outcome + (a.x ? '@' + a.x : '') + '(' + a.t + 's)').join('  ');
  console.log('  clip ' + (ci + 1) + ' L' + (clip.level + 1) + ' ' + sim.name + ' -> ' + sim.result + ' in ' + sim.seconds + 's | ' + line);
  ok(sim.result === 'won', 'clip ' + (ci + 1) + ' (L' + (clip.level + 1) + ') bot eventually wins — got ' + sim.result);
  ok(sim.attempts.length === clip.plans.length, 'clip ' + (ci + 1) + ' uses exactly ' + clip.plans.length + ' attempts (got ' + sim.attempts.length + ')');
  sim.attempts.forEach((a, ai) => {
    if (ai < sim.attempts.length - 1) ok(a.outcome === 'died', 'clip ' + (ci + 1) + ' attempt ' + a.attempt + ' (' + a.plan + ') dies genuinely');
    else ok(a.outcome === 'won' && a.plan === 'SOLVED', 'clip ' + (ci + 1) + ' final attempt is the SOLVED win');
    ok(a.plan === clip.plans[ai].name, 'clip ' + (ci + 1) + ' attempt ' + a.attempt + ' runs profile ' + clip.plans[ai].name);
  });
  ok(sim.seconds <= 45, 'clip ' + (ci + 1) + ' sim finishes inside the 45s recording cap (' + sim.seconds + 's of gameplay)');
});
ok(JT.getSave().deaths === deathsBefore, 'save death count untouched by bot sims (' + deathsBefore + ')');

/* ---------- 2) STORY MACHINE with stubbed recorder ---------- */
console.log('Story machine (stubbed MediaRecorder):');
JT.promoOpen();
ok(JT.promoGetState().phase === 'idle', 'promo opens idle');
JT.promoStartClip(4, []); // L31 — quick, deterministic arc
let st = JT.promoGetState();
ok(st.botOn === true && st.phase === 'play', 'clip starts in play phase with bot on');
ok(global.FakeRecorderInstances.length === 1 && global.FakeRecorderInstances[0].state === 'recording', 'MediaRecorder started');
ok(global.FakeRecorderInstances[0].opts && global.FakeRecorderInstances[0].opts.mimeType === 'video/webm;codecs=vp9,opus', 'mime falls back to webm/vp9 when mp4 unsupported');
let frames = 0, sawEndcard = false, maxFrames = 60 * 60;
while (frames < maxFrames) {
  JT.promoBotThink(1 / 60);
  JT.update(1 / 60);
  JT.promoTick(1 / 60);
  frames++;
  st = JT.promoGetState();
  if (st.phase === 'endcard') sawEndcard = true;
  if (st.phase === 'idle' || st.phase === 'failed') break;
}
st = JT.promoGetState();
console.log('  story run: phase=' + st.phase + ' deaths=' + st.deaths + ' frames=' + frames + ' endcard=' + sawEndcard);
ok(sawEndcard, 'win leads into the endcard phase');
ok(st.phase === 'idle', 'after endcard the machine settles back to idle (recorder stopped, result filed) — got ' + st.phase);
ok(st.deaths === 3, 'clip 5 story has exactly 3 deaths before the win (got ' + st.deaths + ')');
ok(JT.getSave().deaths === deathsBefore + 3, 'during recording the bot deaths land on the live save (snapshot restores them at exit)');
const res = st.results[4];
ok(!!res, 'a result was produced for the clip');
if (res) {
  ok(res.attempts === 4, 'result records 4 attempts');
  ok(/jungle-traps-promo-L31\.webm/.test(res.name), 'download filename is jungle-traps-promo-L31.webm (got ' + res.name + ')');
  ok(typeof res.url === 'string' && res.url.length > 0, 'result carries a download/preview URL');
  ok(res.blob && res.blob.size > 0, 'result blob has bytes');
}
JT.promoClose();
ok(JT.getSave().deaths === deathsBefore, 'save still intact after promo exit');

/* ---------- 3) COMPOSITE LAYOUT ---------- */
const lay = JT.promoLayout();
ok(lay.W === 1080 && lay.H === 1920, 'composite canvas is 1080x1920');
ok(lay.game.w === 1080 && lay.game.h === 608, 'game rect is full-width 1080x608');
ok(lay.game.y >= lay.topH, 'game rect starts at/below the top zone (' + lay.game.y + ' >= ' + lay.topH + ')');
ok(lay.bottomY === lay.game.y + lay.game.h, 'bottom zone begins exactly under the game rect');
ok(lay.bottomY < lay.H && lay.H - lay.bottomY >= 400, 'bottom zone has room for wordmark + lines (' + (lay.H - lay.bottomY) + 'px)');
ok(lay.topH >= 480, 'top zone fits hook + title + death counter (' + lay.topH + 'px)');

console.log('\n==== PROMO RESULT: ' + pass + ' passed, ' + fail + ' failed ====');
process.exit(fail ? 1 : 0);
