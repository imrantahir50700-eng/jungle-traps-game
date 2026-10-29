# JUNGLE TRAPS — Complete Game · Design & Engineering Notes

Build: `index.html` (~223 KB, zero dependencies) + `assets/` sprite art
(owner's GPT sheets — see "Art integration" below; the game stays fully
playable on vector art if the images are missing). All code, music/SFX
(procedural WebAudio) and level designs are original.

## Design system (from GitHub UI/UX repos — see `analysis/04-github-uiux-design-system.md`)

Base style: **"Modern Dark (Cinema Mobile)"** (ui-ux-pro-max-skill) + Minimalism rules.

| Token | Value |
|---|---|
| Base background | `#050807` (green-black) |
| Glass surface | `rgba(255,255,255,0.05)` + `backdrop-filter: blur(14px)` |
| Border | `1px solid rgba(255,255,255,0.08)` |
| Text / muted | `#EDEDEF` / `#8A8F98` |
| Accent (only one) | Gold `#F5C542` (door, CTA, checkpoint flame) |
| Danger | `#e5484d` — hazards/death only |
| Easing | `cubic-bezier(0.16,1,0.3,1)`, ~300 ms |
| Spacing | 8pt grid; one primary action per screen |
| HUD | DOM glass chips only: level · coins · deaths + pause. No hearts/bars |

Art direction (in-canvas): rich painted look — 3-layer parallax (far temple/tree/cave
silhouettes, mid leaves, front vines), world palettes per world (W1 day jungle, W2 dusk +
rain, W3 dark cave, W4 night/gold with stars, Crystal purple cave), mossy beveled stone
with deterministic cracks, torch/door glow, soft shadows, vignette. W3 + Crystal levels
use a real light-radius system (offscreen light mask: hero, torches, lit checkpoints, door).

## Mobile shell (v1 bugs fixed)

- All UI is DOM; canvas renders only the world. `100dvh` + `viewport-fit=cover` + safe-area insets.
- Canvas contain-fits in the stage; menus work in portrait; the game screen shows a
  "Rotate your phone" glass overlay in portrait (game visible behind).
- Touch controls are DOM buttons (76px, jump 88px, size adjustable ×0.85–1.30 in Settings)
  using Pointer Events **with `setPointerCapture`** + pointercancel/lostpointercapture
  handling → multi-touch run+jump never drops (v1's `pointerleave` bug is gone).
- Fullscreen toggle (menu corner), keyboard: arrows/AD + Space/W, R restart, Esc/P pause.

## Game systems

- **Physics:** gravity 2000, jump velocity 762 (≈145px jump), run 240px/s, coyote 0.08s,
  jump buffer 0.1s, variable jump height, respawn 0.35s.
- **Trap engine (data-driven, full reset per death except checkpoint rules below):**
  actions — spikesUp, floorFall, floorHide, ceilingRock (with ground-shadow telegraph),
  doorRun, fakeDoor, boulder, invert, platformGo **plus** dartShooter (3-dart bursts,
  optional `cd` re-arm), bomb (fuse + radius, destroys `cracked` platforms), leverGate,
  sawMove (patrolling stone disc), shadowSpawn (patrolling shadow hero), statue rock-drops
  (levels flagged `statue:true`). Triggers: `x` proximity, `r` radius, `land` (landing on
  a named platform fires a trap — used in 8 redesigned levels), `timer` (rhythm rocks), `lever`.
- **Elements:** coins, 10 hidden crystal keys, pushable crates, mushroom springs
  (313px bounce), moving platforms (x/y, phase, dormant), gates/levers, signs with
  proximity hint text, steam **geysers** (elements with period/phase — periodic lift
  columns; placed as *elements*, not traps, documented choice).
- **Checkpoints:** tribal flags in level data. Touch → gold flame + chime + toast +
  respawn point. On death the level fully resets **but** the player respawns at the
  checkpoint, coins/key progress is kept, and *persistent* traps whose trigger lies
  **before** the checkpoint stay fired (spikesUp, floorHide, doorRun, fakeDoor,
  platformGo, leverGate — so gates stay open and fake doors stay exposed). Full restart
  (R / pause) clears the checkpoint. (Middle-ground choice vs. the spec's two options,
  biased toward fairness.)
- **Difficulty modes** (menu + settings, saved): Explorer (hints ×5 deaths, skip ×5,
  trap speed ×0.9), Normal (×10/×10, ×1.0), Devil (no hints, skip ×25, trap speed ×1.15,
  `devilOnly` traps active — present on 21 levels). Trap speed scales boulders, darts,
  saws, shadows, door slide, bomb fuses, platform motion, timed traps.
- **Stars:** 3★ if deaths ≤ `targetDeaths`, 2★ ≤ 2×, else 1★. Targets follow the
  overview ramp (W1 avg 5.0, W2 12.3, W3 23.6, W4 41.5, Crystal 52.5).
- **Content:** 48 levels (4 worlds × 12, themed palettes/mechanics per the overview)
  + 4 secret Crystal Caves unlocked at ≥4 keys (sequential). Exactly 10 crystal keys
  hidden in the 48 (levels 3, 9, 14, 19, 24, 29, 33, 38, 44, 47). Level 48
  ("Aakhri Darwaza") is a multi-stage finale with statue rock-drops, saw patrol and a
  doorstep bomb that must be waited out → **complete ending screen** (deaths, time,
  keys, stars) — no cliffhanger. All 10 keys → golden hat skin on the hero.
  **All 52 levels were redesigned on 2026-10-29** — see the next section.
- **Sound:** every action has its own procedural cue — see the **Full Action
  SFX** section below (footsteps, boulder rumble loop, spike thwip, door-entry
  grind + shimmer, per-trap cues, funny death voices) + an 8-bar
  procedural music loop (kick/shaker/tom + marimba-style pentatonic plucks over
  Am–F–C–G) with separate Music/SFX toggles. Audio unlocks on first gesture.
- **Save:** one localStorage object (`jungleTrapsSaveV2`): unlocked, stars, keys,
  deaths, coins best, play time, mode, settings. Reset in Settings.

## Level redesign — Level Devil design grammar (2026-10-29)

Owner playtest verdict on the first build: levels were long treks with sparse,
unconnected traps. All 52 levels were rewritten applying the *abstract* design
grammar of the genre (no copied layouts/names — every layout below is original):

1. **Short, one trick per level.** Most levels are 960–1440px (1–1.5 screens).
   Median width by world, before → after: **W1 960 → 1020** (already short; its
   problem was density, not length), **W2 1320 → 1260, W3 1560 → 1320,
   W4 1680 → 1500**, Crystal 1620 → 1620 (finale-style, exempt). Only W4 finales
   and the Crystal caves stay long.
2. **Setup → punchline.** The trick first shows itself safely (a visible patch, a
   warning shadow, an honest sign), then it bites.
3. **Trap chains.** Escaping trap A springs trap B: falling bridge → *landing* on
   the pillar starts the second bridge falling (L3); vine ride → the landing pad
   vanishes under you → hidden spikes on the run-out (L7); pull the lever → gate
   opens *and* a rock drops on the lever spot (L14, L24, L27, L41); shelter on the
   wood shelf → landing on it starts its fall onto the spikes it covers (L32).
   The `land` trigger exists precisely for these chains.
4. **Doorstep cruelty (the signature).** Traps that fire within a step of the
   door: spikes under the doorstep (L4, L6, L13, L20, L24, L28…), a rock dropped
   on the doorstep (L19, L23), darts fired across the door (L15, L27, L36, L45),
   a bomb guarding the door (L35, L48), the door running at the last moment
   (L12, L37, L46, L48). By the test metric (trap trigger within 140px of the
   door, or trap effect — patch/rock/bomb/statue/patrol range — within 150px of
   the doorstep), **42 of 52 levels** touch the doorstep zone; ~29 of those are
   the signature tricks above. The mechanism is never repeated twice in a row.
5. **Misdirection.** Coins float over hidden patches and under falling rocks
   (L2, L5); the generous landing pad is the fake one (L7, L25); the "safe" lever
   sends the boulder (L24); a whole high road is the trapped one (L45).
6. **Double bluffs (W3/W4)** — the learned safe response flips:
   - **L31 'Bhagna Mana Hai'**: W1/W2 taught *run from the boulder*. Here running
     at full speed springs doorstep spikes at 60px notice; standing still lets
     the boulder roll harmlessly into the pit.
   - **L34 'Ye Pul Nahi Tootega'**: every earlier wood bridge fell. This one
     never falls — sprinting off it runs you head-first into the saw patrol;
     the safe play is to stop on the bridge and wait.
   - **L43 'Darwaza Sach Bolta Hai'**: L11/L41 taught *the end door is fake*.
     Here the door is real, both signs lie about it, and two doorRun feints
     (out 60px, back 60px) sell the lie.
7. **Lying signs/hints (3 late levels, flagged in code comments):** L43 (two
   signs), L45 (the *hint itself* plus two signs push the trapped high road),
   L46 (sign: "the statue is sleeping" — it drops a rock on your head every
   ~2.6s). Everywhere else, signs and hints are honest — the lies only work
   because the game usually tells the truth.
8. **Tightening reaction windows.** Spike-trap trigger distance shrinks by
   world: ~135px in W1 (≈560ms at full run) → ~100px W2 → ~85px W3 → ~60–85px
   W4 (≈250–350ms). Fairness rule kept: every trap retains its tell (cracks,
   ground shadow, fuse spark, sound) — deaths should feel like jokes, not cheats.
9. **Names are trick-names** in Roman-Urdu flavor ('Tootta Pul', 'Kaante
   Qareeb', 'Lever Jhooti Hansi', 'Bhagna Mana Hai', 'Aakhri Darwaza'…).

### Per-world trick table (redesigned)

**W1 — Mandir ka Darwaza** (teach each trick safely, one per level):
1 Pehla Qadam — pure walk + one gap (trust builder) · 2 Chhota Sa Dhoka — first
hidden spikes + coin lure · 3 Tootta Pul — falling-bridge CHAIN (land trigger),
**key** over a spring ledge · 4 Kaante Qareeb — spikes *on the doorstep* ·
5 Saya Zameen Par — ceiling rocks, coin under the second rock · 6 Bhagta
Darwaza — door runs + hidden patch behind its new home · 7 Bel Ka Jhoola —
platformGo ride → landing pad vanishes → run-out spikes · 8 Uchal Kud — spring
to a ledge whose far end wakes when you land · 9 Gola Pathar — boulder +
**key** on the high shelf · 10 Peti Ka Kaam — crate climb, wall-top spikes on
landing · 11 Do Darwaze — fake door + head-on boulder on the way back ·
12 Ulta Dimagh — inverted controls + door runs off its thorn patch.

**W2 — Gehra Jungle** (two-trap combos):
13 Do Bel, Ek Raasta — second vine sleeps until mid-ride; doorstep spikes ·
14 Lever Aur Kunji — lever opens gate *and* drops a rock; **key** above ·
15 Teer Wala Murti — dart statues, step shelters, doorstep statue ·
16 Bam Aur Pul — bomb blows the cracked stone over spikes; doorstep darts ·
17 Aari Ka Raasta — saw patrol + shelf shelter + late spikes · 18 Peti Burj —
crate tower, top-platform spikes on landing · 19 Saya Peeche Hai — shadow
patrol, **key** on the high shelf, rock on the doorstep · 20 Bhaap Ki Seedhi —
geyser lift, ledge doorstep spikes · 21 Do Pul, Do Jhoot — two falling bridges
+ middle spikes + spring detour · 22 Sab Kuch Ek Sath — boulder/spikes/rock/
door-runs-toward-you gauntlet · 23 Lambi Bel — the one longer W2 level: vines,
falling shelf over spikes, doorstep rock · 24 Lever Jhooti Hansi — the
"totally safe" lever sends a boulder, the other opens the gate and drops a
rock; climb to the **key**, doorstep spikes on the top ledge.

**W3 — Shaitani Ghufa** (dark; chains of 2–3; bluffs begin):
25 Andhera Pehla — bridge → vanishing shelf → spikes chain · 26 Ulti Ghufa —
long invert + door slides to meet you · 27 Leveron Ki Ghufa — two gates, rock
on the second lever, doorstep darts · 28 Bam Wala Kamra — fuse-race bombs on
cracked stones + doorstep spikes · 29 Aariyon Ka Hall — two crossing saws,
**key** above the spring · 30 Bhaap Aur Andhera — dark geyser, ledge spikes ·
31 Bhagna Mana Hai — **double bluff #1** (don't run) · 32 Sayaon Ka Jhoola —
two shadows + shelter-shelf that falls · 33 Teer Barsaat — three timed dart
statues, **key** on the middle step · 34 Ye Pul Nahi Tootega — **double bluff
#2** (the bridge that never falls; saw underneath) · 35 Bam Aur Gola — bomb =
patience, boulder = speed, bomb on the doorstep · 36 Ghufa Ka Dil — W3 finale:
bridge, lever-gate, saw, spikes, doorstep darts (checkpoint).

**W4 — Aakhri Mandir** (chains of 3, tightest windows):
37 Sunehra Dhoka — door runs to you → spikes where it landed → runs back →
chases you home · 38 Teeron Ka Hall — darts + saw + **key** over a spring ·
39 Bhaap Ka Takht — two geyser lifts, shadow on the throne ledge (checkpoint) ·
40 Bam Parade — fuse-race bombs, boulder race to the door · 41 Leveron Ka
Jhoot — both levers bite, end door is fake (checkpoint) · 42 Saya Jorwa — two
shadows + mid-level invert · 43 Darwaza Sach Bolta Hai — **double bluff #3 +
lying signs** (the door is real) · 44 Aariyon Ki Mehfil — two saws + rhythm
rocks, **key** over the last spring (checkpoint) · 45 Do Raste, Ek Jhoot —
**lying hint + signs**: the high road is the trapped one · 46 Murti Ka Gussa —
statue rocks track your head, **lying sign** (checkpoint) · 47 Devta Ki Seedhi
— stair climb, spring to the last **key**, saw floor (checkpoint) ·
48 Aakhri Darwaza — finale: statue + saw + doorstep bomb you must wait out,
then the door runs to you (2 checkpoints) → ending.

**Crystal Caves** (hardest; checkpoints kept): I — crystal stairway, ledge
teeth · II — long invert + shadow + darts between shelves · III — bombs below,
geyser above, saw ahead · IV — statue finale: falling bridge, lever gate, saw,
darts, spikes, invert, devil-only doorstep bomb.

### Placement invariants (test-enforced)

- **Keys (exactly 10):** L3, 9 (W1) · L14, 19, 24 (W2) · L29, 33 (W3) ·
  L38, 44, 47 (W4) — on lure paths, high shelves and spring detours, never on
  the walking line.
- **Checkpoints:** every level >1440px wide has ≥1 (L36, 39, 41, 44, 46, 47 ×1;
  L48 ×2) and all Crystal caves keep theirs (I ×1, II ×2, III ×1, IV ×2);
  shorter levels have none — they are 1–1.5 screens by design.
- **devilOnly traps:** present on **21 levels** (16, 21, 22, 26, 29, 31, 32,
  33, 34, 36, 39, 40, 41, 42, 44, 46, 47, 48, 49, 51, 52).
- **targetDeaths** stayed on the overview ramp (see Stars above).

## Fullscreen / Zoom / Clarity pass (2026-10-29, owner screenshot feedback)

Owner played the live link on Android Chrome (landscape) and reported: address
bar + dark bars around a small, murky scene; hero tiny; hazards unreadable.
Fixed in three moves — rendering/camera/shell only, no level data or gameplay
logic touched (spike/saw/bomb hitboxes unchanged):

- **True fullscreen, no letterbox.** `enterFullscreen()` (enter-only; toggle
  stays on the menu's ⛶ button) fires on Play tap, on level-select start, on
  a new ⛶ button in the game HUD, and on a Fullscreen row in the pause sheet.
  It requests fullscreen on the document element, then tries
  `screen.orientation.lock('landscape')`; every call is promise-caught and
  try/catch-wrapped, so a denial never throws or blocks play. Canvas display
  scaling is now **cover** (`coverFit()`): scale = max(vw/960, vh/540), the
  canvas element is anchored to the bottom edge of the stage, so any crop
  comes off the sky. Fit re-runs on resize, orientationchange,
  visualViewport resize (used for the size when available) and
  fullscreenchange. Stage/body backgrounds are the scene's deep green
  (#07130c / #0d2b1a) so any sub-pixel edge blends invisibly.
- **Camera zoom — everything ~20% bigger.** The world renders through an
  **800×450 view window** (`VIEW_W`/`VIEW_H`, `VIEW_SCALE` 1.2) onto the
  960×540 canvas: `camTargetFor()` follows the hero in x (clamped to
  [0, levelWidth−800]; levels narrower than the view — none ship — would be
  centred via a negative camX), and y is ground-biased (view bottom pinned to
  the world floor while standing) with a ≤26px lookahead while rising.
  Background parallax, the statue backdrop, the W3 darkness holes and sign
  bubbles were all remapped through the same transform; trap triggers and
  physics stay in world units, untouched.
- **Clarity & prominence.** Depth split: theme `far` layers darkened
  (α≈0.95, near-black) and `mid` layers lifted, plus a soft radial light pool
  on the play lane around the hero. Platforms: lighter stone faces and a
  bright 3px moss lip (`edge` colour per theme) on the top edge, stronger
  drop shadows. Hazards are loud once revealed (hidden traps keep their
  surprise): bamboo spikes **26px** tall with pale shafts, bright tip glints
  and dark outlines; the stone saw is pale with a bright rim and a rotating
  glint; bombs carry a danger-red band, darts a red tip, dart statues get
  glowing orange eyes (the W4 statue already glowed gold). The hero is drawn
  **15% larger** with a warm backlight halo and rim-light strokes (hitbox
  unchanged). The golden door is the brightest object on screen: radial halo
  + brighter ground spill + stronger shadow glow. Coins grew (r 13) with a
  gold glow and twinkling sparkle glints — bait should shine.
- Verified by `visual-test.js` (ships in this folder): **122 assertions,
  0 failures** — cover-fit math for 915×412, 844×390, 390×844 (+ desktop
  sizes) incl. bottom-anchored offsets, camera clamp/centre/lookahead cases,
  camera convergence at probed safe spots and a hover probe at the far end
  of the widest level, `enterFullscreen()` surviving a missing orientation
  API, and 300 frames of update+render in all 52 levels through the new
  camera. The level-redesign suite still passes unchanged: **1183 / 0**.

## Moving hurdles — "the temple shifts" (2026-10-29, owner demand)

Owner's exact words: *"Hurdle ki ek jagah fix ni rakhni — first try me door ke
front par thi, second try me center me aa jaye, 3rd me start me. Lets make it
more difficult."* Implemented literally: **the main hurdle of a level changes
position on every attempt.** Attempt 1 = the position as designed (often by
the door), attempt 2 = an alternate (often centre), attempt 3 = another
(often near the start), then it cycles. A memorised path is worthless.

- **Data.** A trap may carry `shift: [placement, …]` (1–2 alternates, so the
  cycle length is 2–3). A placement is `{ on?, targetX?, targetY?, x2? }`:
  `on` replaces the trigger wholesale; `targetX`/`targetY` move the hurdle's
  body — the spike patch (`spikesUp`), the platform (`floorFall`/`floorHide`/
  `platformGo`), or the trap's own x/y (`ceilingRock`, `boulder`, `bomb`,
  `dartShooter`, `sawMove`, `shadowSpawn`); `x2` is the patrol far end
  (`sawMove`/`shadowSpawn` only — the one extension to the placement shape,
  needed because a patrol has two ends). Placements were authored to preserve
  each trap's trigger→effect distance, so the reaction window a placement
  demands is the one the base design already proved fair.
- **Engine.** `setupLevel` deep-copies the level, then `applyShifts()` picks
  placement index `(deaths this run) % cycleLength` per trap *before*
  platform base positions are captured (so moved moving-platforms ride from
  their new home). Entering a level fresh resets the counter to 0; dying
  advances it. **Devil mode starts the cycle one step in** (offset 1 — the
  nastier placement greets you first). Checkpoint persistence is evaluated
  against the *active* placement.
- **Coverage: 48 of 52 levels, 85 traps.** Every Crystal cave shifts; the
  W1 teaching levels L2/L3 carry a single alternate (2 positions) so
  beginners still learn the trick before it starts moving. The four
  exceptions: L1 (trap-free by design), L12/L26 (their only traps are
  invert/doorRun — no positional hurdle to move), L37 (its spike patch is
  one cog in a timed three-step door dance; moving it would break the
  choreography rather than relocate a hurdle).
- **Player communication.** The hurdle keeps its normal tell (crack, shadow,
  fuse, sound) in every position — no new UI. On respawn, if any hurdle
  moved, a single toast says **"The temple shifts…"**, and How to Play
  carries the rule: *"The temple shifts its traps after every fall — never
  trust a memorised path."*
- **Fairness validation (hard rule).** `shift-test.js` builds the *effective*
  level for **every shifted level × cycles 0, 1, 2 (144 builds)** through the
  real engine (startLevel → die/respawn) and re-runs the full battery per
  build: trap-target integrity, element support (spike patches on real
  platform tops, bombs resting on geometry, dart statues at floor level),
  BFS reachability of the door + every checkpoint + every key, and
  **no spawn-kill** — no spike kill box on the start/checkpoint spawn or in
  the doorway; for traps whose trigger is already passed at a spawn point,
  the boulder spawn box, bomb blast circle, rock column and patrol
  *spawn-point* kill box must all clear the spawn. (A patrol that later
  *sweeps past* a checkpoint is shipped design — it spawns far away and
  arrives on a readable timer; what is banned is lethal geometry sitting
  *on* a spawn.) Every placement passed; several first drafts (a spring
  covered by a moved patch, a bomb blast licking a checkpoint) were caught
  by this suite and redesigned before shipping.

## Feel + exit cinematic (2026-10-29, owner additions)

- **Vibration (Settings toggle "Vibration", default ON).** Every death buzzes
  a felt double-thud `[50, 40, 70]`; checkpoint activation a single 20 ms
  buzz; level win `[30, 50, 30]`. All calls go through one guarded `buzz()`
  helper — no-op without `navigator.vibrate`, never throws, honours the
  toggle. `fxLog` records the death-sound count and every vibration pattern
  actually issued (test proof).
- **Dedicated death sound `sfxDeath`.** Unmistakable and used by the death
  path only: a noise-burst *poof* through a lowpass sweeping 2600→180 Hz
  plus a sine thud dropping 300→60 Hz, ≈0.25 s. (The old shared sawtooth
  death blip is gone; `SFX.death` delegates to `sfxDeath`.)
- **Animated exit door.** Touching the door starts a cinematic instead of
  cutting to the sheet: the two golden panels slide apart over a shaft of
  light (radial gold burst + spark particles), the hero glides into the
  doorway and fades — ≈0.5 s, win jingle starts as the door opens, input
  locked, hero invulnerable (`die()` refuses while `gState === 'dooranim'`).
- **Galaxy portal (world transitions).** If the level is a world's last
  (12/24/36/48) or any Crystal cave, a purple+gold spiral — 110 particles
  rotating inward, twin rings, a growing core of light — swallows the
  screen (1.0 s; the L48 finale gets the widest swirl and 1.2 s). The
  existing complete-sheet / ending flow then runs untouched, so the total
  added delay never exceeds ~1.2 s and the death→retry loop stays fast.
  The state machine is covered by headless simulation in `shift-test.js`
  (normal level, world finale, Crystal cave, grand finale: phases advance
  monotonically, no throw over the animation's frames, complete flow fires,
  `die()` refused mid-cinematic).

## Verification (headless, redesigned build)

- `node --check` on the extracted script: **PASS**. Engine/UI code outside the
  LEVELS array is byte-identical to the previous build (verified by diff) —
  only level data changed.
- `smoke-test.js` (ships in this folder; stubbed DOM/canvas/localStorage,
  drives the game's own `__JT` hooks): **1183 assertions, 0 failures** —
  52-level structure, per-world counts, targetDeaths ranges, exactly 10 keys,
  trap-target integrity, support checks (every spike/spring/lever/checkpoint/
  geyser/crate/gate stands on real geometry), gate-has-a-lever-before-it,
  **BFS physics reachability of the door + every checkpoint + every key in all
  52 levels** (edge rules: ≤140px rise, ≤~185px gap shrinking with rise, wider
  drop gaps, spring ~313px boost, geyser lift + drift, pushable-crate steps,
  moving platforms as ride-connected position pairs), doorstep-twist count
  ≥12 (found 42 by the documented metric), devilOnly spread ≥15 levels (found
  21), per-world median widths, **300 frames of simulated gameplay + render in
  every level without throwing**, devil/normal trap filtering per level, and
  targeted mechanics: lever→gate opens, bomb destroys the cracked platform,
  geyser lifts the player to y≈151, fakeDoor relocates the door, checkpoint
  respawn at the flag, finale win reaches the ending state, save roundtrip.
- `visual-test.js`: **122 assertions, 0 failures** (cover-fit, camera,
  fullscreen guards, 300 render frames per level) — unchanged by this pass.
- `shift-test.js` (moving hurdles + feel + cinematic): **2157 assertions,
  0 failures** — shift coverage (48 levels ≥ 30 required; all Crystal
  caves; teaching levels gentler), **144 per-cycle effective-level builds**
  (48 levels × cycles 0/1/2) each passing integrity + support + BFS
  reachability + no-spawn-kill validation, attempt→placement unit checks
  (L4: 800→480→190→wrap; L2 2-cycle wrap; devil offset starts at index 1;
  fresh entry resets), the shift toast firing only on shifted levels,
  vibration patterns ([50,40,70] death / 20 ms checkpoint / [30,50,30]
  win, silenced by the toggle), `sfxDeath` invoked exactly once per death,
  and the door/portal cinematic simulated end-to-end on a normal level, a
  world finale, a Crystal cave and the L48 finale.

## Promo Agent (2026-10-29, owner-approved)

A hidden mode that **plays the game by itself and records vertical promo
clips** (1080×1920) for TikTok / Reels / Shorts. Access: the small
**🎬 Promo** chip on the menu, or the `?promo=1` deep link. Everything lives
in the same `index.html`; normal gameplay is untouched (the bot only runs
while a promo clip is recording, and the promo screen is just another
`.screen`).

### Story design — curiosity through maximum failure

Each clip is a failure montage: **4–6 scripted attempts, the bot wins ONLY
on the last one.** Deaths are never faked and never scripted into the
physics — each attempt runs a different bot **profile** (a cue/reaction
handicap), and the level's real traps do the killing:

| Attempt | Profile | Handicap | Scripted beat |
|---|---|---|---|
| 1 | RUSH | no cues, no trap reactions | dies to the level's first trap |
| 2 | LEARNED | cues that beat attempt 1's trap | the temple **shifted** the hurdle — dies to the moved one |
| 3 | CAREFUL | most cues, doorstep skill missing | dies at the doorstep / next chain trap |
| 4 | GREEDY | (finale only) waits *inside* the bomb blast | doorstep death |
| last | SOLVED | full cues + full reactions | clean win + door cinematic (+ galaxy portal on the finale) |

Profiles are data (`promoPlan(...)` per clip in `PROMO_CLIPS`): positional
jump/hop/wait cues plus reaction toggles (`reactPatch`, `reactBoulder`,
`reactBomb`, `reactSaw`, `shelfRoute`, `doorTiming`). Because the shift
cycle advances per death, attempt 2 genuinely faces a different hurdle
placement than attempt 1 — the bot doesn't know positions, it reacts (or,
per profile, fails to).

### The bot

`promoBotThink(dt)` runs inside `frame()` before `update(dt)` and writes
**the same `input` object** as touch/keyboard — no teleporting, no physics
edits; it can die to every trap a player can. Perception = what a player
can see: live entity state (saws, boulders, bombs, warnings, spike rise
state) + the level layout. Skills, in the order the think applies them:
positional cues → scripted waits (rock warnings abort them) → bomb
discipline (wait outside the blast; retreat if a jump carried it in;
reactions never cut a jump mid-air) → saw discipline (LEARNED stops and
dies; SOLVED *yields the patrol zone* until the saw turns, then follows;
saws on another height band are ignored) → boulder jumps → direction-aware
spike-patch probes (always for patches that were always visible; trap-
revealed ones only for profiles that "learned" them; wide finale patches
need the early `shelfRoute` jump onto the shelf above — a late jump bonks
the shelf) → generic seeker (door-seeking, wall jumps, gap jumps — but a
safe spike-free drop off a shelf edge is walked, not jumped).

### Verified attempts table (headless sim, `promo-test.js`)

| Clip | Level | A1 RUSH | A2 LEARNED | A3 CAREFUL | A4 | A5 SOLVED | Clip time |
|---|---|---|---|---|---|---|---|
| ONE STEP AWAY… | L4 Kaante Qareeb | 💀 doorstep spikes @792 | 💀 **moved** spikes @472 | 💀 spikes moved to start @184 | — | ✅ win | 10.5s |
| PATIENCE. THEN RUN. 💣 | L35 Bam Aur Gola | 💀 bomb @648 | 💀 **moved** bomb @899 | 💀 doorstep bomb @1051 | — | ✅ win | 22.9s |
| THE DOOR LIED TO ME 😤 | L6 Bhagta Darwaza | 💀 thorns @764 | 💀 **moved** patch @552 | 💀 patch at start @232 | — | ✅ win | 10.8s |
| IT MOVED?! 💀 | L17 Aari Ka Raasta | 💀 saw @768 | 💀 saw (new patrol) @593 | 💀 hidden floor patch @872 | — | ✅ win | 28.0s |
| DON'T RUN. TRUST ME. | L31 Bhagna Mana Hai | 💀 spikes @552 | 💀 **moved** spikes @791 | 💀 doorstep spikes @991 | — | ✅ win | 19.3s |
| THE FINAL DOOR 💀 | L48 Aakhri Darwaza | 💀 shelf bonk @592 | 💀 saw @1194 | 💀 bomb @1346 | 💀 GREEDY doorstep bomb @1491 | ✅ win + portal | 14.2s |

Every clip: pre-final attempts die genuinely, win only on the SOLVED
attempt, total gameplay ≤ 28s (recording cap 45s; target band 20–35s —
the two shortest clips are intentionally snappy). Death positions are
player-centre x at the killing frame.

### Recording pipeline

Composite canvas 1080×1920 (`promoLayout()`, zones unit-tested not to
overlap): deep-jungle gradient + blurred blow-up of the game as backdrop;
**top zone** = hook line ("watch till the win 😤", first 1.5s only) +
ALL-CAPS clip title + Roman-Urdu subtitle + **big 💀 ×N death counter**
(ticks up on every death; the attempt label sits secondary under it and
in the bottom zone); **middle** = the game view full-width (1080×608),
rounded corners, thin gold border; **bottom zone** = TRY/FINAL TRY label,
"JUNGLE TRAPS" wordmark, "Coming soon to Google Play 🎮". The last 2s are
an end card: wordmark + "The temple is waiting…" + comment-bait line
**"Tum kitni dafa marte? 💀"** + the coming-soon line + run stats.
**Doorstep deaths** (killing blow within 170px of the door) trigger a
400ms **freeze frame + zoom punch** on the game rect — the thumbnail
moment; respawns cut in with a ≤300ms white flash (respawn itself is the
engine's 0.35s). The clip ends 1.2s after the win (the tail of the door
cinematic), then the end card; 45s hard cap marks the clip failed in the
UI instead of producing a broken video.

Capture: `composite.captureStream(30)` + the game's WebAudio `masterGain`
**additionally** connected to a `MediaStreamAudioDestinationNode` during
recording (normal speaker output untouched; disconnected on stop) →
`MediaRecorder`, mime preference `video/mp4` → `video/webm;codecs=vp9,opus`
→ default. Result: preview `<video>` + Download (`jungle-traps-promo-L31.webm/mp4`)
in the clip's card, plus "Record next"; **Record All** chains all six.
Everything is feature-guarded: without MediaRecorder/captureStream the
promo screen shows a plain "use Chrome" message and disables recording.

**Save safety:** entering Promo snapshots the whole save (JSON) and bot
plays force the tuned reference mode (Normal); exiting restores the
snapshot and re-persists — bot deaths/unlocks never reach the player's
real progress (asserted headlessly: save death count identical after a
full story run + exit).

### Honest limits

- **Real MediaRecorder output is only verifiable on the owner's Chrome.**
  Headless tests stub MediaRecorder/captureStream: they prove the story
  state machine (record → attempts → win → endcard → result blob with a
  download name) and every bot attempt, but NOT the encoded file. Whether
  a given phone produces MP4 (Safari/newer Chrome) or WebM, and whether
  the captured game audio stays in sync, can only be confirmed by
  recording one clip on the device and playing it back.
- The bot is tuned at a fixed 60Hz step; real devices run the same bot
  with variable frame dt (clamped 33ms) — reactions are positional and
  state-based so behaviour carries over, but an exact death *position*
  may differ slightly on device. The story (profiles dying, SOLVED
  winning) has wide margins by design.
- Canvas emoji (💀😤🎮) render with the device's emoji font; on desktop
  Chrome they draw fine, on some Android builds they may fall back to
  monochrome glyphs in the burned-in text.

## Art integration — owner's GPT sheets (2026-10-29)

The vector hero/elements are now **sprite-first**: the renderers draw the
owner's GPT art (extracted to transparent PNGs in `assets/`, see
`assets/MANIFEST.md`) and keep the original vector drawing as a per-element
fallback. Physics, hitboxes, trap logic and collisions are **unchanged** —
this is a paint job, verified by the unmodified smoke/shift/promo suites.

**Loader / fallback design.** `ART_DEFS`/`artInit()` preload all 27 sprites +
`portal-bg.jpg` at script start (handlers before `src`, cached-image check,
everything guarded — no `Image` constructor, no crash). The menu shows
immediately; sprites pop in as they land. Every draw goes through
`drawArt*` helpers which (a) return "handled" only when the sprite is
ready, (b) **cull off-screen rects** against the camera view so `drawImage`
is only issued for visible elements, and (c) leave the caller to run its
original vector path when art is loading or fired `error`. A broken/blocked
asset can therefore never blank an element. `art-test.js` proves all three
behaviours with a stubbed `Image` (58 assertions).

**Hero mapping** (state → sprite, feet planted on the 28×38 box, drawn
50 units tall = MANIFEST 44 + clarity allowance, aspect-true widths):

| State | Sprite | Notes |
|---|---|---|
| Idle / menu | `hero-stand` | front pose |
| Running | `hero-run-1..5` | cycle from `runPh` (≈10.5 fps), flipped by facing |
| Rising / falling | `hero-jump` / `hero-fall` | flipped by facing |
| Death (0.35 s) | `hero-dizzy` | fades over the respawn timer; compact vector dizzy as fallback |
| Door cinematic / complete | `hero-victory` | respects `heroFade` |
| Golden skin (10 keys) | `hero-gold` | swaps **stand + victory only** — the sheet has no gold run cycle, run/jump/fall stay normal |

**Element mapping** (MANIFEST draw sizes; bottom-centre anchors):

| Element | Sprite | Size / handling |
|---|---|---|
| Door / fake door | `door` / `door-fake` | **112×80 wide** (landscape art, see below); fake variant while a `fakeDoor` trap is unfired; during the cinematic the two source halves slide apart over the light shaft |
| Spikes | `spikes` | 60-unit clusters tiled along the patch, **clipped** to the rise amount (never squashed) |
| Crumble platform | `platform-crumble` | only for platforms targeted by a `floorFall` trap; slab centred on the collision rect, moss hanging below |
| Moving platform | `log-platform` | log body (middle band) aligned to the collision rect |
| Boulder / falling rock | `boulder` / `rock-block` | 54×46 rotating with `b.rot` / 44×43 |
| Saw | `saw` | full sprite static (grass tufts stay grounded) + cropped centre disc rotating on top |
| Dart statue | `statue` | 96×49; head centre aligned on trap x; flipped by `dir` (all in-game shooters fire left, the sheet art faces right) |
| Bomb | `bomb` | 40×46 bottom-anchored; red glow pulse added when the fuse is urgent |
| Spring | `mushroom` | 40×33 at the spring point |
| Crate | `crate` | 40×24 (sheet art is wide, 1.7:1) bottom-anchored in the 34×34 box |
| Checkpoint | `checkpoint` | 50×64; unlit state desaturated via canvas filter, lit state gets the live glow overlay |
| Coin / key | `coin` / `key` | 22×21 / 26×30, existing bob + sparkle/glow kept |
| Geyser | `geyser` | 54×48 at the vent, **only while erupting/warming** (the art includes its steam plume — an idle vent would lie); idle vent stays vector, eruption column stays vector above the sprite |

**Door-wide decision.** The sheet's door art is landscape (≈1.4:1 with side
braziers) while the game's door slot is 46×64 portrait. Per the MANIFEST
flag it is drawn **wide (112×80)** as a grand temple entrance, anchored on
the door's ground position; the trigger rect stays 46×64, so a level plays
exactly as before — the art simply spills symmetrically around it. Squashing
to 64×84 was rejected (carving distortion).

**Menu & transitions.** `assets/menu-bg.jpg` (key art, 1600×900, q80) backs
the main menu under a dark gradient; `assets/portal-bg.jpg` (1440×960, q80)
backs the ending screen in CSS and is drawn cover-fit behind the canvas
galaxy-portal swirl during world transitions. The storyboard sheet is not
used in-game (promo/social only).

**Page weight (referenced files only):** index.html 209,039 B + 27 sprite
PNGs 2,540,851 B + menu-bg.jpg 356,586 B + portal-bg.jpg 358,234 B =
**3,464,710 B ≈ 3.46 MB** (target ≤ ~3.5 MB met). `assets/_contact.png`
(1.19 MB) is a QA contact sheet — never referenced, never downloaded.

**What remains vector, and why:** parallax backgrounds/statues, ordinary
stone & wood terrain (the sheets contain no tileable terrain art — one
stretched slab per floor would distort and repeat visibly), torches, signs,
levers, gates, shadow figure, darts, particles, darkness mask and the portal
swirl itself. These were already the game's painted look; the sheets only
ever modelled the hero + the 16 elements above.

**Deviations from MANIFEST:** hero drawn at 50 units instead of 44 (owner's
clarity demand — he asked for a bigger, clearer hero; hitbox untouched);
portal-bg resized to 1440 wide instead of 1536 (page-weight target; still
under the 1600 cap, q80 kept). All other draw sizes follow the MANIFEST.

**Tests:** smoke 1183 · visual 122 (unmodified — no assertion conflicted;
headless stubs have no `Image`, so those suites exercise the pure vector
fallback path) · shift 2157 · promo 90 · **art 58** · `node --check` PASS.

## Funny Death Voices (2026-10-29, owner idea)

Every death now gets a spoken reaction on top of the procedural poof +
buzz, chosen by the **per-level death count** (`levelDeaths` — the same
counter the moving-hurdle shift cycle keys on, so voice # always matches
the attempt the player is on):

| Death in level | Clip | Line |
|---|---|---|
| 1 | `assets/sfx/voice-death-1.mp3` | "Oyee Maa!" |
| 2 | `assets/sfx/voice-death-2.mp3` | "Faaaaah!" |
| 3 | `assets/sfx/voice-death-3.mp3` | scream "Aaaaaah!" |
| 4, 6, 8… | `assets/sfx/voice-death-4.mp3` | "Marr gaya!" |
| 5, 7, 9… | `assets/sfx/voice-death-5.mp3` | "Phir se!" |

- **PLACEHOLDER voices:** the current clips are robot-generated (owner's
  choice: robot first). His own recorded reactions will replace them
  later — **same filenames**, no code change needed.
- **Playback:** each play gets a random `playbackRate` of 0.95–1.08 so
  repeats never sound identical. Buffers play through a 0.9 gain into
  **masterGain** — the node Promo Mode taps for recording — so promo
  clips capture the voices too; the poof still plays underneath.
- **Loading:** lazy at `audioInit()` (first user gesture): `fetch` +
  `decodeAudioData` for all 5 files, one-shot. Any failure (missing
  file, bad decode, no fetch) is swallowed — silence, never an error,
  game audio untouched.
- **Toggle:** voices obey the existing Settings **SFX** switch.
- **Tests:** `voice-test.js` — **59 assertions**: mapping (pure +
  through the real `die()`→`respawn()` loop for deaths 1–6), buffer
  selection, rate range, routing `source → gain(0.9) → masterGain`,
  fetch-failure and decode-failure silence (poof still fires), SFX-off
  silence. All other suites pass unmodified.

## Full Action SFX (2026-10-29, owner demand: "every action has a sound")

Every action now has its own procedural cue — no audio files; all of it
is synthesized with the existing `tone()` / noise helpers plus a new
sweepable `noiseBurst()`, routed `sfxGain → masterGain` (so **Promo Mode
recordings capture every cue**), and all of it obeys the Settings SFX
toggle. `actionFxLog` records each audible cue once per play for tests.

**Continuous sounds** share four reusable loop voices (looping noise →
filter → gain), retargeted once per frame from `update()` and
hard-stopped by `stopActionLoops()` on death, pause, level setup,
door entry and SFX-toggle-off — no loop can leak into a menu, a pause
sheet or the next level:

| Loop | Synthesis | Behaviour |
|---|---|---|
| Boulder rumble | lowpass noise (110–230 Hz) | gain 0–0.16 follows the nearest on-screen boulder's speed × closeness to the hero |
| Saw buzz | bandpass noise 2.1 kHz, Q7 | fixed whisper (0.02) while any saw patrols on screen |
| Geyser hiss | highpass noise 2.6 kHz | 0.04 erupting, 0.014 while warming |
| Bomb fuse hiss | highpass noise 4.2 kHz | 0.010→0.020 and playbackRate rises as the fuse burns down |

**Action → sound mapping** (★ = already existed before this pass):

| Action | Sound |
|---|---|
| UI click ★ / hint shown / level skip | click blip ★ / soft `pop` |
| Jump | soft whoosh (bandpass noise sweep up + faint sine) — replaced the square blip |
| Running | footstep taps, one per half run-cycle (~2 per 5-frame run cycle, in step with the sprite animation), alternating pitch, vol ≈0.12; stop instantly airborne/stopped |
| Landing | soft thud, volume scaled by the fall speed captured before collision |
| Death ★ | dedicated poof + thud (`sfxDeath`) + funny voice (see above) |
| Coin ★ | bright two-note ding (kept) |
| Crystal key ★ | sparkle arpeggio (kept, + a high shimmer tail) |
| Checkpoint | torch-flare whoosh + warm C–E–G triangle chord (was a plain chime) |
| Bamboo spikes rise | "thwip-pop": rising saw blip + woody snap (bandpass noise + low triangle knock) |
| Floor crumble / hide | gritty lowpass crumble burst; a second, lower burst as the platform actually drops |
| Ceiling rock | two soft warning ticks at trigger → descending whoosh as it falls → low thud on landing ★ (polished) |
| Boulder spawn | short stone-slide scrape, then the rumble loop takes over |
| Door runs away | stone-slide rumble (lowpass noise sweep down + low triangle) |
| Fake door reveal | hollow crack + double knock |
| Moving platform wakes | stone-slide scrape |
| Saw trap spawns ★ | short saw blip ★, then the buzz loop while it patrols |
| Dart shot | air "pfft" (highpass noise puff + faint dart drop) — less zap than before |
| Bomb | fuse hiss loop while lit → deep boom (lowpass noise collapse + 122→27 Hz sine) ★ (polished) |
| Mushroom spring | boing: sine sweep 175→920 Hz + low triangle body (was a square sweep) ★ |
| Lever pull ★ | click-snap ★ (kept) |
| Gate opens | lever snap + metal clunk (low triangle + filtered noise) |
| Controls invert | warble: 330↔660 Hz square alternation |
| Shadow spawn | low breathy sweep (soft sine rise + bandpass air) |
| Door entry | **stone grind** (lowpass noise, 0.36 s; 0.52–0.62 s on portal/finale) → **golden shimmer arpeggio** (1046/1318/1568/2093 Hz) → the ★ win jingle, delayed to land inside the cinematic (0.46 s normal / 0.74 s portal / 0.96 s finale); portal variants add a rising cosmic sweep under the shimmer |

Balance: footsteps/rumble/buzz/hiss sit at 0.01–0.16 gain against the
death poof (0.20–0.24), voices (0.9 into master) and music (0.5 bus) —
background cues are felt, never masking the funny death voices.

**Deliberately silent:** crate pushing (continuous scrape judged more
annoying than informative at this game's push distances; the crate still
thuds via landing/step sounds around it), rain ambience in W2 (the music
bus already fills that space; a noise bed fought the boulder rumble),
menu screen transitions (the click already confirms them).

**Tests:** `sfx-test.js` — **26 assertions**: footsteps fire on ground /
stop airborne / stop when stopped, landing thud, boulder loop start +
target + level-change stop, saw/bomb/geyser loops join + clear, spikes
cue synchronously on `fireTrap`, doorEnter-before-win ordering with
loops stopped, and SFX-off creating **zero** audio nodes. All previous
suites pass unmodified.

## Owner Screens — dashboard + level board (2026-10-29, owner's GPT art)

The owner generated two full screens with the same prompt workflow as the
sprite sheets and approved them for the game:

- **Sources:** `visuals/gpt-set/6-dashboard-menu.png` (menu: blank ornate
  banner top-center, three blank hanging signboards, hero + golden door on
  the right) and `7-level-board.png` (parchment-framed world map, winding
  path, five zones), both 1672×941.
- **Shipped files:** `assets/dashboard.jpg` (1600×900, q80, **375,311 B**)
  replaces `assets/menu-bg.jpg` (the sunset key art, removed from the game
  folder; the original stays in `visuals/gpt-set/4-gameplay-keyart.jpg`).
  `assets/levelboard.jpg` (1600×900, q80, **463,113 B**) is new.

**Mapping — dashboard:** the painted blank banner carries the DOM game
title (`.menu-title-zone`, top ~0–30% of the screen; the title stays crisp
DOM text, sized `min(11vw, 13.5vh, 60px)` so it tracks the banner under
cover-fit). The three primary buttons — ▶ Play, Levels, How to Play — form
a centered column (`.menu-panel` of `.sign-btn`s) roughly over the three
painted signboards (~42/58/74% heights). In art mode they turn
mostly-transparent wood-tint (Play: translucent gold) with strong text
shadow, and a soft dark gradient behind the column guarantees contrast on
any phone ratio; cover-fit shifts alignment between ratios, which is
accepted — buttons are always fully tappable DOM elements. Stats
(Deaths · Keys · Stars, `#menuStats`) became a glass chip pinned to the
top-left corner, fullscreen/settings stay top-right, and the difficulty
mode chips + 🎬 Promo chip moved to a bottom-edge stack (`.menu-bottom`).

**Mapping — level board:** the map is a cover-fit backdrop for
`#screen-levels` under a slight dark overlay; the world tabs stay on top
and the functional level grid sits on a frosted-glass panel
(`rgba(10,15,12,.40)` + `blur(18px) saturate(1.25)`) centered on screen.
**The painted medallions/locks/stars are decorative only** — they cannot
track 52 real levels, locks and star states across screen sizes, so the
real grid is overlaid and keeps exact behavior (locks, stars, key badges,
Crystal-Caves gating), as told to the owner up front.

**Loading / fallback:** both images preload through the same ART layer as
the sprites (`dashBg` / `boardBg` in `ART_DEFS`). The screens render
instantly with the fallback look (`.dim` gradient + glass buttons/panel);
`screenArtSync()` adds the `.art-on` class only after the image's `onload`
proves it arrived, and re-checks on every `showScreen`. A failed image
means the fallback stays forever — never a blank screen.

**Tests:** `screens-test.js` — **30 assertions**: files + CSS wiring,
no-`.art-on` fallback at boot, image-error keeps the fallback, load adds
`.art-on`, Play still starts level 1 with art on, grid buttons reflect
lock/star state and the Crystal tab stays key-gated. `node --check`
passes. All earlier suites pass unmodified **except two art-test
assertions** (art-test.js lines 100–101) that hard-code the existence and
CSS reference of the now-replaced `menu-bg.jpg`; they fail by design of
this replacement and should be repointed at `dashboard.jpg` when the
suite is next edited.

**Page weight:** index 226,484 + sprites 2,540,851 + portal-bg 358,234 +
dashboard 375,311 + levelboard 463,113 + voice MP3s 25,185 =
**3,989,178 B (3.80 MiB)** downloaded. This change's net: **+481,838 B**
(−356,586 menu-bg removed; +838,424 for the two screens).

## Known limitations (honest)

- **Not human-playtested.** Reachability is machine-verified with approximate
  physics rules and mechanics are simulation-verified, but difficulty *feel*
  (exact death counts vs. targets, whether a bluff reads as funny or unfair)
  needs the owner's playtest — hottest spots: L31's bluff (is "don't run"
  discoverable enough?), L34's saw timing under the bridge, L37's triple door
  chain, L48's wait-out-the-bomb finale.
- BFS reachability proves geometry, not timing: a few chains (L22's
  boulder/rock crossing, L44's saw harmony) are survivable by design math but
  their exact rhythm only a human run can confirm.
- Boulder/saw/shadow collision uses shrunken-box approximations; rare edge clips possible.
- Music is a deliberately simple procedural loop (no melody variation beyond 8 bars).
- **Fullscreen/orientation-lock behaviour is not verifiable headlessly** — the
  calls are guarded and unit-tested for "never throws", but whether Chrome on
  the owner's phone grants fullscreen + landscape lock on the Play tap, and
  how the cover crop looks on his exact screen ratio, only his device can
  confirm. If the browser denies the lock, the game still plays windowed with
  the cover fit (no bars) as the fallback.
- **Moving hurdles are geometry-verified, not feel-verified.** Every cycle
  position of every shifted hurdle is BFS-proven beatable and spawn-safe,
  but whether attempt-3 placements read as "delightfully unfair" or merely
  confusing — and whether the shift toast teaches the rule fast enough —
  only the owner's hands can say. Same for the new juice: vibration is
  verified against a stubbed `navigator.vibrate` (patterns + toggle), and
  the door/portal cinematic against a stubbed canvas (state machine +
  frame counts); how the buzz feels in the hand and how the swirl looks
  on a real screen are device-only judgements.
