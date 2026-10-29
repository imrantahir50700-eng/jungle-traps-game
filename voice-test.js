'use strict';
/* JUNGLE TRAPS — headless tests for the FUNNY DEATH VOICES:
   1) LOADING — audioInit lazily fetches + decodeAudioData's all 5
      clips into voiceBufs (right file -> right slot).
   2) SELECTION — via the real die()->respawn() loop: deaths 1/2/3
      play clips 1/2/3; deaths 4/5/6 alternate clips 4/5/4; every
      play goes BufferSource -> gain(0.9) -> masterGain (the node
      Promo Mode taps, so recordings capture the voices), with a
      playbackRate inside 0.95-1.08.
   3) FAILURE — fetch rejects / decodeAudioData rejects: deaths play
      nothing extra, nothing throws, the poof still fires.
   4) SFX OFF — settings.sfx=false silences the voices.
   Each scenario boots the game script in a FRESH vm context so the
   one-shot voice loader and AudioContext state stay isolated. */
const fs = require('fs');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } }

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

/* ---------- recording canvas ctx (renderer runs at boot) ---------- */
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

/* ---------- DOM stubs (same superset as art-test) ---------- */
function makeEl(tag) {
  const styleP = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  const el = { tagName: (tag || 'div').toUpperCase(), children: [], style: styleP, dataset: {}, _text: '', width: 0, height: 0,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); if (f) this._s.add(c); else this._s.delete(c); return f; }, contains(c) { return this._s.has(c); } },
    appendChild(c) { this.children.push(c); return c; }, removeChild(c) { return c; },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    captureStream() { return { getVideoTracks: () => [], getAudioTracks: () => [] }; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 540 }; },
    click() {}, focus() {} };
  Object.defineProperty(el, 'textContent', { get() { return this._text; }, set(v) { this._text = v; } });
  Object.defineProperty(el, 'innerHTML', { get() { return ''; }, set(v) { if (v === '') this.children = []; } });
  el.children = tag === 'span' ? [] : [makeEl('span'), makeEl('span'), makeEl('span')];
  return el;
}
class FakeImage {
  constructor() { this.width = 0; this.height = 0; this.complete = false; this.onload = null; this.onerror = null; this._src = ''; }
  set src(v) { this._src = v; }
  get src() { return this._src; }
}

/* ---------- stub AudioContext: records sources/gains/decodes ---------- */
function makeAC(opts) {
  const rec = { sources: [], gains: [], decodeCalls: 0, master: null };
  class FakeAC {
    constructor() {
      this.state = 'running'; this.sampleRate = 44100; this.currentTime = 0;
      this.destination = { kind: 'destination' };
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createGain() {
      const g = { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
                  connect(n) { this.connectedTo = n; }, disconnect() {} };
      rec.gains.push(g); return g;
    }
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() {
      const s = { buffer: null, loop: false, playbackRate: { value: 1 }, started: false,
                  connect(n) { this.connectedTo = n; }, start() { this.started = true; }, stop() {} };
      rec.sources.push(s); return s;
    }
    createOscillator() {
      return { type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
               connect() {}, start() {}, stop() {} };
    }
    createBiquadFilter() {
      return { type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
               Q: { value: 0 }, connect() {} };
    }
    decodeAudioData(ab) {
      rec.decodeCalls++;
      if (opts.decodeFails) return Promise.reject(new Error('stub: undecodable'));
      return Promise.resolve({ __voiceFor: ab && ab.__url });
    }
  }
  return { FakeAC, rec };
}

/* ---------- boot the game in a fresh vm context ---------- */
function boot(opts) {
  const { FakeAC, rec } = makeAC(opts);
  const elCache = {};
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = { getElementById: id => (elCache[id] = elCache[id] || makeEl()), createElement: t => makeEl(t),
    addEventListener() {}, body: makeEl('body'), documentElement: makeEl('html'), querySelectorAll: () => [] };
  sandbox.localStorage = { _s: {}, getItem(k) { return k in this._s ? this._s[k] : null; },
    setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
  sandbox.navigator = { maxTouchPoints: 0, vibrate: () => true };
  sandbox.Image = FakeImage;
  sandbox.requestAnimationFrame = () => {};
  sandbox.addEventListener = () => {}; sandbox.removeEventListener = () => {};
  sandbox.innerWidth = 1280; sandbox.innerHeight = 800;
  sandbox.setInterval = setInterval; sandbox.clearInterval = clearInterval;
  sandbox.setTimeout = setTimeout; sandbox.clearTimeout = clearTimeout;
  sandbox.console = console;
  sandbox.fetch = opts.fetch;
  sandbox.AudioContext = FakeAC;
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename: 'game.js' });
  return { JT: sandbox.__JT, rec };
}
function flush() { // let fetch->arrayBuffer->decode promise chains settle
  return new Promise(r => setImmediate(r))
    .then(() => new Promise(r => setImmediate(r)))
    .then(() => new Promise(r => setImmediate(r)));
}
const fetchOk = url => Promise.resolve({ arrayBuffer: () => Promise.resolve({ __url: url }) });
const fetch404 = () => Promise.reject(new Error('stub: 404'));

(async function main() {
  /* ---------- pure mapping (no audio needed) ---------- */
  {
    const { JT } = boot({ fetch: fetchOk });
    ok(!!JT.sfxVoiceDeath && !!JT.voiceIndexForDeath, 'voice hooks exposed on __JT');
    ok(JT.voiceIndexForDeath(1) === 0 && JT.voiceIndexForDeath(2) === 1 && JT.voiceIndexForDeath(3) === 2,
       'mapping: deaths 1/2/3 -> clips 1/2/3');
    ok(JT.voiceIndexForDeath(4) === 3 && JT.voiceIndexForDeath(5) === 4 && JT.voiceIndexForDeath(6) === 3 &&
       JT.voiceIndexForDeath(7) === 4, 'mapping: deaths 4/5/6/7 -> clips 4/5/4/5');
    ok(fs.existsSync(__dirname + '/assets/sfx/voice-death-1.mp3') && fs.existsSync(__dirname + '/assets/sfx/voice-death-5.mp3'),
       'voice clip files exist on disk');
  }

  /* ---------- 1+2) loading + selection through real deaths ---------- */
  {
    const { JT, rec } = boot({ fetch: fetchOk });
    JT.audioInit();
    await flush();
    const bufs = JT.getVoiceBufs();
    ok(rec.decodeCalls === 5, 'decodeAudioData called once per clip (got ' + rec.decodeCalls + ')');
    for (let i = 0; i < 5; i++) {
      ok(bufs[i] && bufs[i].__voiceFor === 'assets/sfx/voice-death-' + (i + 1) + '.mp3',
         'voiceBufs[' + i + '] holds clip ' + (i + 1));
    }
    // audioInit created masterGain first, musicGain second, sfxGain third
    const master = rec.gains[0];
    ok(!!master && rec.gains[1].connectedTo === master && rec.gains[2].connectedTo === master,
       'music+sfx buses feed the master gain (the promo tap node)');

    JT.startLevel(0);
    const expectIdx = [0, 1, 2, 3, 4, 3]; // deaths 1..6
    for (let d = 0; d < 6; d++) {
      const srcBefore = rec.sources.length, logBefore = JT.getVoiceLog().length;
      JT.die();
      const log = JT.getVoiceLog();
      ok(log.length === logBefore + 1, 'death ' + (d + 1) + ' played exactly one voice');
      const entry = log[log.length - 1];
      ok(entry.idx === expectIdx[d], 'death ' + (d + 1) + ' selected clip ' + (expectIdx[d] + 1) + ' (got ' + (entry.idx + 1) + ')');
      ok(entry.rate >= 0.95 && entry.rate <= 1.08, 'death ' + (d + 1) + ' playbackRate in 0.95-1.08 (got ' + entry.rate.toFixed(3) + ')');
      const src = rec.sources[rec.sources.length - 1];
      ok(rec.sources.length > srcBefore && src.started && src.buffer === bufs[expectIdx[d]],
         'death ' + (d + 1) + ' started a BufferSource with the right buffer');
      ok(src.playbackRate.value === entry.rate, 'death ' + (d + 1) + ' source rate matches the logged rate');
      const vg = src.connectedTo;
      ok(vg && vg.gain.value === 0.9 && vg.connectedTo === master,
         'death ' + (d + 1) + ' routes source -> gain(0.9) -> masterGain');
      if (d < 5) JT.respawn();
    }
    ok(JT.getFx().sfxDeath === 6, 'procedural poof fired on all 6 deaths alongside the voices');

    /* ---------- 4) SFX toggle off ---------- */
    JT.getSave().settings.sfx = false;
    const logLen = JT.getVoiceLog().length, srcLen = rec.sources.length;
    JT.respawn(); JT.die();
    ok(JT.getVoiceLog().length === logLen && rec.sources.length === srcLen,
       'sfx off -> death plays no voice (and no new source at all)');
    JT.getSave().settings.sfx = true;
  }

  /* ---------- 3a) fetch rejects: silence, no throw ---------- */
  {
    const { JT, rec } = boot({ fetch: fetch404 });
    let threw = false;
    try {
      JT.audioInit();
      await flush();
      JT.startLevel(0);
      JT.die(); JT.respawn(); JT.die();
    } catch (e) { threw = true; }
    ok(!threw, 'fetch-failure path never throws');
    ok(JT.getVoiceBufs().every(b => b === null), 'fetch failure leaves all voice buffers empty');
    ok(JT.getVoiceLog().length === 0, 'fetch failure -> no voice plays');
    ok(JT.getFx().sfxDeath === 2, 'fetch failure -> poof still fires on deaths');
    ok(rec.decodeCalls === 0, 'fetch failure -> decodeAudioData never reached');
  }

  /* ---------- 3b) decode rejects: silence, no throw ---------- */
  {
    const { JT, rec } = boot({ fetch: fetchOk, decodeFails: true });
    let threw = false;
    try {
      JT.audioInit();
      await flush();
      JT.startLevel(0);
      JT.die();
    } catch (e) { threw = true; }
    ok(!threw, 'decode-failure path never throws');
    ok(rec.decodeCalls === 5, 'decode failure still attempted all 5 clips');
    ok(JT.getVoiceBufs().every(b => b === null), 'decode failure leaves all voice buffers empty');
    ok(JT.getVoiceLog().length === 0, 'decode failure -> no voice plays');
    ok(JT.getFx().sfxDeath === 1, 'decode failure -> poof still fires');
  }

  console.log('\n==== VOICE RESULT: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  FAIL: harness error: ' + (e && e.stack || e)); process.exit(1); });
