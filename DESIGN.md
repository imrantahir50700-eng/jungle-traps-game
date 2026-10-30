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
thuds via landing/step sounds around it), menu screen transitions (the
click already confirms them). ~~Rain ambience in W2~~ — originally
skipped here ("the music bus already fills that space"), REVERSED the
same day when the owner asked for realistic rain: W2 now carries a
quiet 0.045 patter loop under everything — see "Realistic Rain" below.

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

## Art-Match + Audibility Fix (2026-10-29, owner phone complaints)

Two complaints from the owner's device: **(1)** "Background visuals
don't match the images, and neither do the other props" — the GPT
sprites floated on the old flat vector parallax scene and flat
rectangle platforms; **(2)** "Only 1–2 sounds played, the rest
didn't" — the loud one-shots (click/coin/voices) arrived, but the
quiet loops/taps were effectively inaudible on a phone speaker.
This section supersedes the Art Integration note "what remains
vector: parallax backgrounds, ordinary stone terrain".

### Background plates (the owner's art IS the background now)

One painted plate per world, shipped as ~1600w JPEG q78:

| World | File | Source |
|---|---|---|
| W1 | `assets/bg-w1.jpg` (356,441 B) | `visuals/gpt-set/4-gameplay-keyart.jpg` |
| W2 | `assets/bg-w2.jpg` (373,697 B) | `visuals/gpt-set/6-dashboard-menu.png` |
| W3 | `assets/bg-w3.jpg` (270,914 B) | `7-level-board.png` crop x 35–70%, y 48–88% (dark cave zone), upscaled |
| W4 | `assets/bg-w4.jpg` (287,151 B) | `7-level-board.png` crop x 60–100%, y 0–42% (golden summit) |
| Crystal | `assets/bg-crystal.jpg` (421,403 B) | `visuals/gpt-set/5-galaxy-portal.jpg` |

Rendering (`drawBgPlate()`, called at the head of
`drawBackground()`): the plate is drawn cover-fit to the 800×450
camera view, zoomed 8% past cover, **mirror-tiled horizontally**
with a slow **0.3× parallax** offset (`camX × 0.3`, wrapped over a
two-tile period, so no camera position can ever expose an edge)
plus a gentle vertical drift inside the zoom headroom. A
**rgba(4,10,6,0.45) veil** and the existing vignette keep gameplay
readable over the busy paintings. When a plate is ready, the vector
sky/far/mid layers retire; only the cave-ceiling fringe (dark
worlds) and the W2 rain still draw over the plate. **W3's
`drawDarkness()` light radius runs after the world render as
before and works unchanged over the plate** (mask + torch/hero
holes). Fallback: if a plate is loading or errors, the original
vector background renders exactly as before — never a blank scene.
Plates preload through the same ART layer as the sprites
(`bgW1..bgCrystal` in `ART_DEFS`).

### Platform texture + props polish

- **Stone platforms** are no longer flat rectangles:
  `assets/tex-stone.png` (280×66, 42,227 B) — a clean mossy ledge
  strip cut from the crumble slab's face in `platform-crumble.png`
  (x 40–320, y 6–72) — is mirror-tiled across the top band
  (≤46 units) of every normal stone platform
  (`drawStoneTexture()`), over the existing gradient body, with the
  bright moss lip kept on the top edge and a shade line at the
  strip's foot. Crumble/log/moving platform visuals are unchanged;
  collision is unchanged. Texture missing → the previous vector top
  (moss + sparkle rows) renders instead.
- **Torches** gained a wide flickering warm halo (radius 118,
  alpha ≈0.20) under the existing core glow, so they sit in the
  painted scene.
- **Signs** now use a wood-gradient board with a dark carved outer
  border, a pale inset carve line and nail heads — closer to the
  sheets' woodwork.

### Audibility rebalance (levels old → new)

The master bus is untouched; death voices (0.9 into master) remain
the loudest thing in the game, and every one-shot stays ≤ 0.5.

| Cue | Old | New | Why |
|---|---|---|---|
| Footsteps | noise 0.105/0.12 | **0.20/0.22 + a 1200/1350 Hz tick transient (0.11)** | phone speakers need mid-band energy to reproduce a step at all |
| Boulder rumble | max 0.16, lowpass 110–230 Hz | **max 0.30 + new `boulderGrit` layer: bandpass 300–700 Hz, max 0.30, amplitude wobbling with speed** | 110–230 Hz is below phone-speaker reproduction — the grit layer is the audible part |
| Saw buzz | 0.020 | **0.070 + `sawHarm` harmonic (4300 Hz, 0.028)** | was a whisper; harmonic adds small-speaker presence |
| Geyser hiss | 0.040 / 0.014 warm | **0.10 / 0.035** | |
| Bomb fuse hiss | 0.010→0.020 | **0.05→0.12 rising** | the fuse was inaudible until the boom |
| Spikes thwip | noise 0.14, knock 0.13 | **0.20 / 0.18** (+43%/+38%) | |
| Crumble / drop | 0.16 / 0.10 | **0.23 / 0.15** | |
| Rock whoosh / thud | 0.105 / 0.13 | **0.15 / 0.185** | |
| Jump whoosh / landing thud | 0.055 / 0.035+0.105k | **0.08 / 0.05+0.15k** | |
| Door-run / stone-slide / fake-door / checkpoint whoosh / door grind / dart | 0.09–0.13 | **+30–45% each** (≤ 0.185) | |

### Trigger audit (were the cues even firing?)

`sfx2-test.js` (35 assertions) drives **real simulated play** with
a gain-history-recording stub AudioContext. Verdict: **no
trigger-condition bug existed** — every cue was firing; the
failure was purely level + frequency band. Proven:

- **Boulder (L9, natural run):** rumble target peaks at **0.241**
  while the boulder rolls (old ceiling was 0.16); grit layer runs
  alongside.
- **Saw (L17, natural run):** buzz target **0.070** on screen,
  harmonic present.
- **Spikes (real level trap):** thwip logged **synchronously on
  the `fireTrap` call** (before any `update()`), at the raised gain.
- **Bomb (real level trap):** fuse hiss ≥ 0.05 from the first
  frames after light, `explosion` logged at fuse-out, hiss loop
  gone after the blast, entity consumed.
- **Geyser:** eruption hiss reaches **0.10**.
- **Footsteps:** ≥ 2 taps per 6.25-unit run cycle, counted against
  `runPh` itself (4+ taps across 2 pinned cycles).
- **Ceiling check:** a simultaneous burst (spikes + crumble +
  explosion + rock + step) keeps every one-shot gain ≤ 0.5 and the
  summed initial gains ≤ 2.6 into the 0.9 master — no clipping by
  construction; the 0.9 death voices remain the sole exception.

### Tests & weight

- New suites: **bg-test.js — 46 assertions** (plate files +
  world→plate mapping, loading/error fallback to vector, cover
  tiling + full-width coverage for every world incl. maximum
  parallax at the far end of the widest level, platform-texture
  tiling + fallback) and **sfx2-test.js — 35 assertions** (above).
- All previous suites pass unmodified: smoke 1183 · visual 122 ·
  shift 2157 · promo 90 · voice 59 · sfx 26 · screens 30 ·
  **art 66** (was 60: the suite's own per-asset existence loop now
  also covers the 6 new files — the suite file is untouched).
  Visual-test needed **no** background-assertion changes (it never
  asserted background shapes). `node --check` PASS.
  **Grand total: 3,814 assertions.**
- **Page weight: 5,746,731 B (5.48 MiB)** referenced — index
  232,204 + previous 3,989,178 set + plates 1,709,606 + tex-stone
  42,227 + index growth. Only one plate is ever on screen, but the
  ART preloader fetches all five at boot (same behaviour as the
  sprites), so first load is the honest worst case; repeat visits
  come from the browser cache.

## Background plates v2 — scenery, not screenshots (2026-10-29, owner screenshot)

**Why:** the owner played W1 and saw TWO heroes — the key art's
painted hero frozen mid-jump in the backdrop, next to the real
sprite — plus a painted boulder, coins and door that read as real
objects. His words: the background should not be the same image;
visuals must be clear so the gameplay reads better. Literal
paintings as backgrounds fail the game's first clarity rule:
*if it looks like a thing, players treat it as a thing.*

**Recipe (per plate, PIL, same file names + same pixel dims):**
regenerate from the same `gpt-set` source/crop → **melt**:
downscale to a small width, Gaussian-blur there, upscale back
(dissolves shapes far beyond a same-resolution blur — a true
depth-of-field wash) → brightness **0.74** → saturation **0.85**
→ JPEG q78. Because the plates now arrive pre-darkened, the
in-game veil in `drawBgPlate()` drops **0.45 → 0.30**; parallax
(0.3×), mirror tiling, W3 light radius and the plate-error →
vector fallback are unchanged.

| Plate | Source treatment | Verdict (verified by eye, plate + 800px strip) |
|---|---|---|
| bg-w1 | key art, melt 320w / r8 | PASS — hero, boulder, coins, spikes, door all dissolved; only sunset/temple glows remain. Needed pass 2: at 480w/r6 the boulder still read as a ball and coin-dots as an arc. |
| bg-w2 | dashboard, melt 320w / r8 | PASS — the three painted signboards (worst false-UI) melt to soft horizontal smears with no frames/trim; hero + chest gone. Faint plank banding remains, not prop-identifiable. |
| bg-w3 | board cave crop, melt 440w / r7 | PASS — padlock medallions dissolve into mossy blobs on the path; torch glows read as ambience; cave doorway = distant lit opening. |
| bg-w4 | board summit crop, melt 440w / r7 | PASS — golden door is now a soft glow inside the temple mass, no door outline; padlocks gone; map scroll unidentifiable. |
| bg-crystal | portal art, **crop x 36–100% first** (the painted hero stood at x 19–35% — cropped out, not just blurred), melt 640w / r5 | PASS — portal + inner temple are pure scenery; floating rocks read as bokeh flecks. |

**Clarity mechanism:** crisp foreground (sprites, textured
platforms, hazards) against a soft dark backdrop — the eye locks
onto the only sharp layer, which is the playable one.

**Tests/weight:** all 10 suites green, unmodified (**bg-test
needed no changes** — it asserts plate mapping, dimensions,
fallback and tiling, never bytes or sharpness): smoke 1183 ·
visual 122 · shift 2157 · promo 90 · art 66 · voice 59 · sfx 26 ·
sfx2 35 · screens 30 · bg 46 = **3,814 assertions**;
`node --check` PASS. Blurred plates compress far better:
1,709,606 → 215,712 B for the five plates; **total referenced
page weight 5,746,731 → 4,227,935 B (4.03 MiB), −1,518,796 B.**
Honest limit: the plates are now deliberately near-abstract
washes — whether the owner likes the softer mood on his phone is
his call; no painted shape survives to confuse play.

## Realistic Rain (2026-10-29, owner demand: "rain realistic like water droplets")

**Before:** `drawRainFx()` — 42 identical slanted line segments whose
positions were a pure function of the clock (`(i*97 + t*430) % W`).
Nothing ever landed, splashed or accumulated; it read as moving
scratches, not weather. Rain exists only in World 2 (`THEMES[2].rain`),
and still does — same flag, same levels.

**Now:** a pooled droplet particle system in world space (state in
`rainDrops/rainSplashes/rainRipples/rainLens`, updated by
`updateRainFx(dt)` from `update()`, drawn by `drawRainWorld()` inside
the world transform and `drawRainLens()` in screen space):

- **Falling droplets — pool 150 (hard cap 220).** Three size classes:
  small 55% (11–16 u long, 640–800 u/s, alpha .30–.45), medium 35%
  (16–23 u, 800–980 u/s, .40–.55), large 10% (23–30 u, 980–1150 u/s,
  .50–.65). Bigger is faster and longer, like real rain. All drops are
  drawn in ONE pass from a single pre-rendered sprite: a 14×34 canvas
  holding a vertical gradient capsule pre-rotated ~14° with a bright
  rounded head at the bottom and a transparent tail — no per-drop
  rotation, no per-drop gradients.
- **Wind.** One global slant, gusting slowly 0.19–0.31 (≈11–17° from
  vertical, two summed sines). A drop's horizontal drift is
  `vy × slant`, so trajectories lean with the gusts and match the
  sprite. Drops recycle to the top of the camera view when they land
  or leave it — the field is constant, nothing is allocated.
- **Splashes — pool 90, life 0.25 s.** When a drop's head crosses a
  platform TOP (any non-gone, non-falling platform, tested per frame
  against the highest top crossed), it bursts at that exact surface:
  an expanding flat ellipse ring plus 3 micro-droplets on seeded
  ballistic arcs. This ground contact is what sells the realism.
- **Ripples — pool 24, life 0.6 s.** Drops landing on the level's
  main ground (widest static platform top, computed at `rainReset()`)
  have a 16% chance to open an expanding flat ellipse (r 3→18,
  alpha .34→0).
- **Lens beads — pool 5 (hard cap 6).** Every 1.1–2.7 s a bead
  condenses on the "camera" at a random spot, sits 0.7–2.3 s, then
  slides down 50–140 px accelerating to ≤64 px/s, leaving a faint
  trail, and fades. Alphas are 0.05–0.30 — garnish, never noise.
- **Patter sound.** A seventh action loop, `rain`: looping noise
  through a 1500 Hz lowpass at gain **0.045**, conducted by
  `updateActionLoops()` like boulder/saw/geyser/bomb — it runs only
  while a rain level is being played, is hard-stopped by
  `stopActionLoops()` on pause/death/level change/SFX-off, and routes
  sfxGain → masterGain, so Promo recordings capture it.
- **Performance (owner: no lag).** Fixed pools allocated once at
  first rain; zero allocation in update/draw; rain updates ride the
  existing `update()` (frozen when paused/hidden, since rAF stops);
  the drop pass is ≤150 `drawImage` calls of one shared sprite, the
  splash/ripple pass ≤114 cheap ellipse/fillRect ops worst case.

**Tests:** `rain-test.js` — **26 assertions**, all passing: 600
simulated frames on L13 (first W2 level) sampled every frame — peaks
150 drops / 69 splashes / 11 ripples / 3 lens beads, all under caps;
2,093 splash spawns and 94 ripples in 600 frames prove ground contact
is constant; slant stays in band; patter target 0.045 observed,
stopped by level change, restarted on return; with SFX off no loop
and no buffer sources are created, while the visual rain still falls.
All ten previous suites pass unmodified (3,814 assertions).

**Honest limit:** headless tests prove counts, caps, triggers and
routing — whether the rain *feels* like water (sprite density, splash
scale, patter level against the music) is judged on the owner's
phone, like every other look/feel item.

## Coin visibility fix + Secret Caves (2026-10-29, owner screenshot + cave names from @aks_dishu)

### Coin fix — root cause
Owner screenshot (W2 rain, L13): coins above the log platforms read as
half-buried domes. Pixel forensics on the phone shot were inconclusive
(the shot is a blurry capture), but the geometry audit is exact:
- Coin **data** was never wrong — across all 52 levels every coin's
  drawn bottom sat ≥25px above its platform's *collision* top.
- The **log-platform sprite** is drawn much taller than its collision
  rect: `lh = (w+22) × 184/317`, anchored so ~70% rides above the
  rect's centre line — on a 92-wide log its leafy vine top reaches
  **~37 units above the collision top** (more on wider logs), and the
  crumble sprite pokes ~22% of its height above its slab. Coins were
  tuned against collision tops, so over a log the coin's lower half
  overlapped the vine band (up to ~9px at rest, more at the bob
  extreme) — and because logs *slide* under static coins, a coin that
  is clear at the log's rest position sinks as the log travels under
  it. At 22×21px with a dark baked fringe, that overlap reads as
  "half a coin".
- Fix (draw-only): `platVisualTop(p)` computes the drawn top per
  platform kind (log / crumble / stone); `coinDrawLift(c)` lifts the
  coin's *drawing* so its bottom (data y + 10.5 + max bob 3) ends
  `COIN_GAP = 5` above the visual top of the nearest platform below,
  evaluated across the platform's whole travel span for movers,
  clamped to 44. A soft gold halo now backs the sprite coin (same
  treatment as the key) so the silhouette separates from dark
  backgrounds. **Pickup radius and coin data are byte-identical** —
  the lift is purely visual, bob animation unchanged.
- Proof (art-test §4): for L13 every coin's drawn rect bottom sits
  above the log's collision top AND ≥4 above its visual top; a global
  audit over all 57 levels (204 coins) finds zero sunk coins.

### World 5 — GUFAON KE RAAZ (Secret Caves), indices 52–56, `world: 6`
Post-game bonus world. Names are mechanic *themes* mined from the
Level Devil cave names on @aks_dishu's channel (PITS / COINS /
SPRING / GRAVITY / WRAPAROUND); every layout is original, each with a
twist beyond the theme. All five carry the standard kit (hint, sign,
checkpoint, a main trap with a 3-position moving-hurdle shift,
targetDeaths 48–62 in the post-game 45–70 band).
- **L53 'Gaddha Gufa'** (Pits): floor-fall slabs over pits 1 and 3;
  pit 2 is secretly SAFE — a mossy ledge + coins inside (the tell).
  Doorstep spikesUp at the door (shifted).
- **L54 'Lalach Gufa'** (Coins): rich upper lane (12 coins) trapped —
  u2 crumbles, u3 hides spikes (shifted); poor lower lane (2 coins)
  safe — until the last vault flips it: a saw patrols the poor lane's
  end by its escape spring. Springs sit in the *gap columns* between
  rich platforms so the launch never bonks an underside (found by
  simulation; see caves-test).
- **L55 'Uchhal Gufa'** (Spring): spring ascent A→B→C→D→E; the last
  spring *lies* — it fires you at a floor (T) tiled with three hidden
  spike patches that rise on landing; the catch is side ledge F above
  T's right end, and the door sits on F.
- **L56 'Ulti Gravity Gufa'** (Gravity): NEW MECHANIC — gravity-flip
  pads. `gravPads:[{x, y, ceil?}]`; stepping on one reverses
  `player.gravDir` (re-arms only after you leave the zone). Exactly 3
  flips: floor A → ceiling C1 → floor B → ceiling C2, where the door
  hangs (`door.ceil`). Physics integration: gravity accel + terminal
  clamp mirror by `gravDir`, jump velocity/cut mirror, the collision
  resolver's land/head-bump branches swap (underside landing),
  landing thud uses |fallSpeed|, falling "up" out of the world kills
  (y < −110), the hero is drawn mirrored around his centre while
  flipped, and **a checkpoint records the gravity state it was lit
  in — respawn restores it**. Ceiling spikes are a data flag
  (`spikes.ceil`): sprite flipped, kill band hugs the underside, and
  spikesUp works on them unchanged. The shifted main trap is floor
  B's hidden spikes.
- **L57 'Ghoomti Gufa'** (Wraparound): NEW MECHANIC — `wrap:true`,
  width exactly 800 (= VIEW_W, camera static). Leaving either edge
  re-enters at the other, same height, velocity kept (the x-clamp is
  skipped for wrap levels); the hero is ghost-drawn on both sides
  while straddling the seam. The door ledge (top 330) is unreachable
  from the floor (170 > jump rise) and from the launch ledge beside
  it — you ride the launch ledge off the right edge and wrap *at
  height* onto it. A wrap-flagged boulder chases you through the
  seam forever; the doorstep hides a 26-wide spike patch at the
  ledge's left tip (deliberately clear of the door trigger rect —
  landing past it wins; the hint says "kud kar aana").

### Unlock / save / ending — structural changes
- `save.cavesUnlocked` (default 1) added to `defaultSave()`;
  `loadSave()` already merges defaults, so **old saves migrate
  untouched** (verified by caves-test with a pre-caves save body).
- `levelUnlocked`: world-6 levels require `stars[47]`/`finished`,
  then run linearly via `cavesUnlocked` (mirrors the Crystal
  pattern). `winLevel`/`skipLevel` bump it for world 6.
- Level select gains a 6th tab `W5 · Gufaon ke Raaz 🗝`, disabled
  until the Final Door is beaten; `btnPlay` continues into the caves
  once the main chain is done. Total level count 52 → **57**;
  `endStars` denominator follows `LEVELS.length` automatically.
- Endings: L48's `showEnding()` path is byte-identical. Winning L57
  calls `showEnding(true)` — the TRUE 100% ending (acknowledges the
  caves) — and L57 gets the big galaxy-portal door cinematic like
  L48. `THEMES[6]` (deep teal cave) added; world 6 reuses the W3
  cave background plate (`BG_PLATES[6] = 'bgW3'`).

### Test changes (all documented, none weakened silently)
- **smoke** (1183 → 1324): level count 52→57, `worldCount[6] === 5`,
  TD range for world 6 [45,70]; width rule gains the wrap exception
  (a wraparound level is exactly 800 by design); door/spike host
  checks gain ceiling branches; new gravity-pad support checks; keys
  assertion tightened to worlds 1–4 explicitly; checkpoint rule
  extended to world 6. BFS graph extended for the new physics:
  platform-underside nodes form a mirrored world whose generic edges
  never mix orientations — floor and ceiling connect *only* through
  pad links; wraparound levels are graphed on a tripled copy so
  edges cross the seam.
- **shift** (2157 → 2475): its duplicated geometry model got the same
  ceiling/wrap/gravity treatment (snapshot now carries `wrap` +
  `gravPads`; kill/door rects mirror the game's ceiling boxes).
- **visual** (122 → 127): render-smoke loop `i < 52` → `LEVELS.length`.
- **screens** (30 → 32): five tabs → six, plus caves-tab label/gating.
- **bg** (46 → 53): world 6 plate mapping/render coverage (bgW3 reuse).
- **art** (66 → 79): new §4 coin-visibility assertions (above).
- **caves** (NEW, 65): unlock chain + save migration; a fully
  scripted physics run through L56's 3 flips to the ceiling door;
  checkpoint-gravity restore; hero + boulder seam crossings; a
  hazard-aware scripted bot that completes L57 through the wrap and
  earns the TRUE ending while L48's ending text is verified intact;
  spot proofs for L53's safe pit, L54's spring, L55's lying spring.
- promo / voice / sfx / sfx2 / rain unmodified.
- **Grand total: 4,391 assertions, all passing** (was 3,840).

**Honest limits:** the caves are machine-proven completable (BFS for
every level incl. per-cycle shift positions, plus live scripted runs
for the two new mechanics), but their difficulty *feel* — whether
the safe pit's tell reads, whether 3 flips disorient fairly, whether
the wrap doorstep death lands as funny or cheap — is the owner's to
judge on his phone, same as every look/feel item before.

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

## 200-Level Build — Four Worlds × 50 + BONUS (2026-10-29, owner's plan)

Structure per `GAME-PLAN-200.md`. Levels: W1 Jungle Temple, W2 Toofani
Kinara (storm coast), W3 Barf Crystal Gufa (ice cave), W4 Aatish Mandir
(volcano) — 50 each; Crystal Caves (4) + Gufaon ke Raaz (5) form the
BONUS tab (worlds 5/6 internally). Every world's shipped 12 levels keep
positions 1–12 verbatim; positions 13–50 are new (152 levels), position
50 of each world is a three-phase BOSS gauntlet (mover sea → saw +
boulder stretch → doorstep gauntlet, mid checkpoint). Target-death ramp
follows the plan (W1 ~15 → W4 ~60 per level average; bosses 24/34/50/76).

**Reproducible build.** The 209-level array is GENERATED, not hand-edited:
`rebuild/work200/gen-levels.js` loads the pristine 57-level file
(`work200/index-backup-pre200.html`), re-seats the legacy levels, and
builds the 152 new ones from BFS-safe archetype builders (pits, crumble,
boulder, saw, lever, coin-gate, spring, dart, bomb, fake-door, invert,
shadow, mover, wave, gravity, wrap, speedrun, crate, geyser, boss) with
seeded variation. `rebuild/work200/patch-game.js` then applies 73
verified string patches (framework + mechanics + rendering + character
screen) to the same pristine base and splices the levels in — aborting
if any anchor is not found exactly once. `work200/variety-matrix.md`
documents every level's signature × task × key traps.

**Save v3 + migration.** `migrateSaveV3` runs on any non-v3 save: old
indices remap by (world, position) — world w pos p → (w−1)×50 + p−1,
Crystal 48–51 → 200–203, Caves 52–56 → 204–208 — for stars, coin bests
and key ownership alike. The coin BANK is seeded with the sum of all
migrated per-level bests (a veteran's head start). `finished` veterans
keep the full map (`unlocked` 200) and their Secret Caves
(`cavesOpen`). New fields: `bank`, `character`, `charsUnlocked`,
`worldsPaid`, `cavesOpen`.

**Coin bank.** Winning a level banks only the improvement over that
level's previous coin best — replays can never farm. Bank coins are the
free currency for character unlocks (stars still come from per-level
coins as before).

**Characters (cosmetic only, equal power).** Explorer (free), Zara,
Bolt, Captain Haddi, Sunehra Raja — three routes each per the plan:
reach the character's world (auto-unlock, checked on level start and
win), spend bank coins (+ crystal keys for Bolt/Haddi/Raja), or paid.
Paid buttons are DEMO ONLY on web: they show exactly "Ye khareed Play
Store wali app me milegi — web par demo hai" and change nothing; real
payment exists only in the Play APK (Google Play Billing, Phase 6).
Character select lives on its own screen (menu → Characters). Hero
rendering: the active character's sheet from `assets/chars/` when it
exists → explorer sprite washed in the character's colour (offscreen
source-atop tint) → per-character vector palettes (CHAR_VIS: Zara's
ponytail, Bolt's antenna, Haddi's pirate hat, Raja's crown; Raja rides
the golden set for sprite poses). Death voices are shared; per-character
pitch shift was deliberately NOT done — the voice suite pins playback
rate to 0.95–1.08 and a pitch multiplier would break that invariant.

**World gating + endings.** Worlds unlock sequentially: world w opens
when the previous world's position-50 boss has a star (or was skipped
past). Locked worlds show an early-unlock DEMO card in level select
(Rs 299/499/699 + Sab Kuch Pack Rs 1,499, same demo toast). Boss wins
show the world-complete sheet; L200 triggers the GRAND FINALE ending
(bigger portal cinematic, dedicated ending text) and opens the Secret
Caves; the last cave still earns the TRUE 100% ending. HUD and level
grids use per-world local numbers (1–50; BONUS counts its own 1–9).

**New mechanics.**
- *Coin-gate door* (`coinGate`): the door refuses until N coins are
  collected this run; HUD shows 🔒 progress, the door wears iron bars +
  padlock + floating counter, touching it explains the toll.
- *Door-timer* (`doorTimer`, speedrun levels): when the timer dies the
  door slams shut for the run (bars + toast); restart to race again.
- *Wave-push zones* (W2, `pushZones`): timed surf that shoves a grounded
  hero sideways toward the water spikes; ledges are dry rest spots.
- *Ice physics* (W3, `ice`): ground acceleration halved, friction
  2800 → 380 — long slides; every new W3 level runs on it.
- *Themed variants*: falling icicles (W3 ceilingRock with `ice`),
  lava spikes/geysers/boulders (W4 `lava` flags, vector fire columns and
  molten glow), water spikes (W2 `water`), ice-crumble platforms
  (`kind:'ice'`), storm palette + rain for W2, ice blues for W3, ember
  reds for W4. Background plates for W2/W3/W4 were re-melted from the
  FINAL v2 world art (same filenames/dimensions; no recognizable prop
  survives the melt — verified visually).
- *Twists*: when the generator's (trick + doorstep + task + trap-set +
  flags) combo would repeat, a real extra trap (devil-dart statue,
  second ceiling rock, mid patch, vanishing ledge, timer bomb) is added
  and named in the level's signature.

**No-repeat rule, machine-enforced.** Every level carries `sig` +
`task`. `variety-test.js` fails on: duplicate signature or name, a
fingerprint collision within a trick family, a themed-palette leak
(gravity outside W3/caves, wrap outside W4/caves, wave-push outside W2,
lava outside W4, ice outside W3, water outside W2), key count ≠ 10 or
distribution ≠ 2/3/2/3, a boss not at position 50, or any NEW level
whose main trap does not shift between attempts.
`framework-test.js` proves migration, bank accrual, gating, all
character routes (incl. the demo toast), coin-gate, door-timer, and the
ice slide.

**Test changes (structural, all documented here).** smoke: counts
57 → 209 and 12 → 50/world; TD ranges widened to the plan ramp
(W1 [3,24], W2 [8,34], W3 [15,50], W4 [30,80]); targeted simulations
remapped by (world, position) — Lever Aur Kunji 13 → 51, Bam Aur Pul
15 → 53, Bhaap Ki Seedhi 19 → 57, Ghufa Ka Dil 35 → 111, finale
47 → 199; save roundtrip now expects v3. shift: checkpoint buzz
35 → 111; world-finale door scenario now uses a position-50 boss (49),
Crystal 48 → 200, grand finale 47 → 199. caves: all indices +204/+152
(caves 204–208, Crystal 200–203, finale 199); its old-save block now
exercises the real v2 → v3 migration. screens: six world tabs → five
(4 worlds + BONUS) with lock-marked chips and a BONUS grid of 9. art:
the coin-lift level 12 → 50. promo: clip levels remapped in the game
(3, 110, 5, 54, 106, 161 — same showcase designs); download filename
expectation L31 → L107 follows the remapped clip level. No assertion
was weakened or deleted; several suites grew (smoke 1324 → 4743, shift
2475 → 9969, visual 127 → 283) because they iterate all levels.

**Verification (this build).** 14 suites, 16,511 assertions, all green:
smoke 4743 · shift 9969 · visual 283 · promo 90 · art 79 · voice 59 ·
sfx 26 · sfx2 35 · screens 34 · bg 53 · rain 26 · caves 65 · variety 988 ·
framework 61. Every one of the 209 levels — and every checkpoint and
every shift placement of every trap — is BFS/script-proven completable.

**Stage D status — CLOSED (2026-10-29).** The four character sheets
were regenerated (`visuals/chars-200/`) and extracted into
`assets/chars/` by `rebuild/extract-chars.py` (flood-fill keying in the
explorer pipeline's spirit: green-dominance candidate bg + border flood
so figure darks survive, distance/ring alpha, colour decontamination;
details and per-file table in MANIFEST.md). All 30 registry files
(zara/bolt/haddi × Stand, Run1–5, Jump, Fall, Dizzy, Victory) are live;
each sheet held ONE run pose, so Run1–5 are derived from it (rock ±2°
around the feet pivot + bob, frame 5 == frame 1 for a seamless loop,
one shared canvas). Haddi's sheet carried a duplicate stand figure —
dropped; a window-sliced fragment of Victory's fist in his Dizzy crop
was caught on the QA contact sheet and removed by an island pass.
Sunehra Raja intentionally has NO files: he rides the golden explorer
set (his crown is the golden hat), exactly as the registry defines.
Proof: `art-test.js` grew 79 → 277 assertions — every char file decodes
as an RGBA PNG with a soft keyed edge and non-trivial opaque extent,
run frames share one canvas, and the headless renderer draws the REAL
sheet sprite per selected character (with the tint wash shown as the
control before the sheet is marked ready). Full set: **14 suites,
16,709 assertions, all passing** (art count above supersedes the 79 in
the tally line just before this section). Still the owner's phone
verdict: difficulty FEEL per world (death counts vs targets, whether
W4's ~60-death average reads as epic or exhausting) and the new plates
and sprites in motion on a real screen.

## Ads System — JTAds bridge + TEST AD placeholders (2026-10-29, owner-approved plan)

One bridge for the whole game: `window.JTAds` in `index.html`, tuned by a
single `ADS_CONFIG` block. The game never talks to an ad SDK directly.

**Runtime routing**
- If the Android shell injects `window.AndroidAds` (see the APK section
  below), calls forward to it; the shell answers through
  `window.JTAdsFromNative(kind, placement, result)` with
  `result ∈ reward | closed | unavailable` (interstitial: `done`).
- Otherwise (the public web build) a clearly-marked **TEST AD placeholder
  modal** runs: dashed-gold card, "TEST AD" tag, countdown bar. It makes
  **zero network calls** — pure DOM + timers. Placeholders are a web/test
  convenience and must never be the ad source of a production APK.
- **Test-build fallback (deliberate):** if the native bridge answers
  `unavailable` (offline / no fill), the placeholder modal runs inside
  the APK too, so every reward flow stays testable end-to-end. This is
  test-build behaviour only — a production build should treat
  `unavailable` as "no reward" instead.
- Callbacks fire **exactly once**; a single-modal busy guard refuses
  concurrent requests (`'closed'`).
- **Promo Mode suppresses all ads** (`promo.on`): rewarded answers
  `'closed'`, interstitial `'done'`, nothing arms, nothing shows.

**Rewarded placements** (strictly player-tap; reward only on a full watch)
| Placement | UI | Grant |
|---|---|---|
| `hint` | Pause-sheet hint button + death hint chip | the existing `showHint()` |
| `skip` | Pause-sheet skip button + death skip chip | the existing `skipLevel()` |
| `revive` | `chipRevive` "▶ Revive yahin se" | respawn at the last safe ground + 1s grace |
| `double-coins` | Complete-sheet `btnDouble` "2× Coins" | +the completion's banked amount, once |
| `key-hint` | `chipKey` "🔑 Key?" | key pulses with a gold ring + arrow for 5s |

Structural notes (deliberate, test-pinned):
- *Revive is non-blocking by design.* `die()`/`respawn()` timing is
  untouched (promo + smoke suites pin it). On death the chip is offered
  for `reviveWindowSec` (2.2s) while the normal checkpoint respawn runs
  underneath; `reviveTarget` is a snapshot of `lastSafePos` taken at the
  moment of death. `lastSafePos` is re-recorded at the end of `update()`
  whenever the hero is grounded and alive (initialised to spawn in
  `setupLevel`). Watching the ad teleports the hero back to the snapshot
  and sets `player.invulnT` (new player field; `die()` early-returns
  while it is > 0; decremented in `update()`). Once per level
  (`reviveUsed`, reset in `startLevel`).
- *Double Coins doubles the improvement delta, not the gross coins.*
  `winLevel()` already banks only `max(0, coins − previous best)`
  (anti-farming). `adsPendingDouble = {idx, amount}` records exactly
  that delta; the button shows only when `amount > 0`, grants the same
  amount once more, then hides. A replay that banks 0 gets no offer.
- *Hint/skip reuse the existing handlers' effects verbatim* — only the
  trigger is wrapped in `JTAds.showRewarded(...)`.
- *Key hint* is render-only: `keyHintT` (decremented in `update()`)
  makes `drawKey()` add a pulsing ring + arrow. The chip shows only
  while `L.key && !keyGotRun` (in `refreshHUD`).

**Interstitial** — scheduled in `winLevel()` (`adsNoteCompletion`),
shown only on the Complete → Next transition (`btnNext` consumes the
armed flag; `startLevel` clears stale flags):
- fires when `completions % 3 === 0` **and** `completions > 3` — i.e.
  the first possible interstitial is completion **6**, then 9, 12, …
  (the plan's "har 3 completions par" + "pehle 3 levels me nahi").
- `save.ads = { completions, lastInter }` persists the counter and the
  last-shown timestamp; a scheduled interstitial is **skipped silently**
  if < 3 minutes passed since the last one.
- Never on death, never mid-gameplay, never during Promo.

**Banner** — `showScreen()` calls `JTAds.setBanner(name ∈ {menu,
levels})`. Web: the `#adBanner` dashed placeholder strip. APK: the call
forwards to the native AdView; the web strip stays hidden. Never in
gameplay, HUD, or sheets.

**Tests** — `ads-test.js` (96 assertions): placeholder completion +
abort/confirm paths, busy guard, interstitial schedule (1–3 none, 6
first, gap, death, promo), every placement's grant-once semantics,
revive position/grace/once-per-level/expiry, double-coins math vs the
bank rules, key-chip visibility + glow decay, banner screens, native
routing + unavailable fallback. All 14 prior suites remain green
(16,709) — new total 16,805.

## Android Test APK — WebView shell + AdMob TEST ads (2026-10-29)

Deliverable: `~/workspace/your_files/JungleTraps-test.apk`
(package `com.jungletraps.game`, versionName `0.1-test`, versionCode 1,
minSdk 24, targetSdk 35, compileSdk 35, debug-signed, 16,220,732 bytes,
SHA-256 `84ee5eb9f17e19c73287f268892bed122aa5674d3f4c6918bc550157f2d07d6f`).
The APK bundles the CURRENT web build (`index.html` + `assets/`,
including all 30 real character sprites) and runs fully offline; ads
use Google's official TEST units, so it is safe to tap everything.

**Shell** (`~/workspace/reverse-app/apk-shell/`, plain Java, one Activity)
- Fullscreen landscape immersive WebView, `FLAG_KEEP_SCREEN_ON`,
  JS + DOM storage on, `mediaPlaybackRequiresUserGesture=false`,
  file access on (the game's `fetch()` voice clips keep working).
- Bridge: `@JavascriptInterface` exposed as `window.AndroidAds` with
  `showRewarded(placement)`, `showInterstitial()`, `setBanner(v)` —
  exactly the game's JTAds contract; results return through
  `evaluateJavascript("window.JTAdsFromNative(...)")`, reported once.
- Interstitial + rewarded are preloaded after `MobileAds.initialize`
  and re-preloaded after every show/failure. Not loaded (offline) →
  immediate `'unavailable'` callback → the game falls back to its TEST
  AD placeholder flow (documented test-build behaviour, see Ads System).
- Banner = native `AdView` in a bottom strip driven by `setBanner`;
  the game only calls it on Menu/Level Select, so it never overlaps
  gameplay controls.
- TEST IDs (verified against developers.google.com/admob/android/test-ads):
  App ID `ca-app-pub-3940256099942544~3347511713` (manifest meta-data),
  banner `.../6300978111`, interstitial `.../1033173712`,
  rewarded `.../5224354917` (all in `MainActivity.java` constants).

**Swapping in the owner's real AdMob IDs (production)**
1. AdMob console → create the app + 3 units (banner/interstitial/rewarded).
2. Replace the App ID meta-data value in
   `apk-shell/app/src/main/AndroidManifest.xml`.
3. Replace the three `*_UNIT` constants in `MainActivity.java`.
4. Rebuild (below), then do the Phase-6 release work (release keystore,
   AAB via `bundleRelease`, Play Console) — the debug APK is test-only.
   Also remove the game's `'unavailable' → placeholder` fallback for
   production (see Ads System) so a no-fill never grants a reward.

**Toolchain** (`~/workspace/android-toolchain/`, all local, no system install)
- Temurin JDK 17 (`jdk/`), Gradle 8.7 (`gradle/`), Android SDK (`sdk/`):
  platform android-35, build-tools 35.0.1, platform-tools — the SDK zips
  were unpacked by hand because `sdkmanager`'s Java HTTP stack cannot
  traverse this sandbox's proxy (see below).
- AGP is pinned to **8.6.1**: AGP 8.7.3 needs Gradle ≥ 8.9, and Gradle
  8.11.1's single-use-daemon compatibility check could not be satisfied
  in-process here, while 8.7's can (below).

**Rebuild** — one command: `~/workspace/reverse-app/apk-shell/build-apk.sh`
(copies the current `jungle-game-full` web build into the shell assets,
builds, copies the APK to `~/workspace/your_files/JungleTraps-test.apk`,
prints badging + SHA-256).

**Sandbox networking findings (why the build looks unusual)**
This VM's permission layer denies direct TCP initiated by Java
processes (proxy answers non-HTTP connects with a plain-text denial).
Empirically: Java↔Java loopback sockets hang, Python/curl work.
Consequences, all worked around without touching the restriction:
1. The Gradle **daemon IPC is unusable** ("Could not receive a message
   from the daemon", kryo type-tag corruption from the denial text).
   Fix: launch the client JVM directly (`GradleMain`) with JVM opts
   that mirror the daemon defaults exactly — Gradle then runs the
   build **in-process**. Works on Gradle 8.7; on 8.11.1 the check
   could not be satisfied, hence the 8.7 + AGP 8.6.1 pin.
2. Gradle cannot download dependencies. Fix: `fetch_deps.py`
   (in the toolchain dir) walks POMs and downloads the whole graph
   with **curl** into `local-maven/` (Maven layout); the build runs
   `--offline` against that file repo (see `settings.gradle`). If a
   future build names a missing module, fetch it with
   `python3 fetch_deps.py local-maven --shallow g:a:v` and rebuild —
   that loop is how this build converged. `build-loop.sh` automates
   the extraction, though its log-grep needs the trailing-period fix
   noted in the script's history; the manual loop is proven.
3. Two KMP metadata clashes (annotation vs coroutines jars) are
   excluded in `app/build.gradle` packaging (AGP's own suggestion).

## Playtest Fix Pack (2026-10-30, owner's APK playtest: 8 items)

Owner installed the test APK, played, and sent 3 screenshots + notes.
All eight fixes shipped together; proofs live in `playtest-test.js`
(104 assertions). Suite total: 16,805 -> 16,909, all green.

1. **Touch buttons hid gameplay.** Buttons shrunk (76/88px -> 58/66px
   at ctrl 1), ghost-light (fill rgba(255,255,255,.11), glyph ~45%
   opacity), corners hugged (10px sides, 12px bottom). NEW: a touch
   button band — on coarse-pointer devices `fitCanvas()` fits the
   canvas into the viewport MINUS the band (`touchBandPx()` = 20 +
   66*ctrl = 86px at ctrl 1) and `#stage.band` lifts the canvas wrap
   by the same amount, so the world view sits entirely above the
   buttons. Desktop (no coarse pointer): band 0, unchanged. Proof:
   composite geometry at 800x360 with the game's own `layoutMetrics`
   — LV12 spawn hero + LV4 ground spikes fully above the band, zero
   overlap with the button rects; the same model with the band off
   reproduces the original bug.
2. **Level Complete card clipped.** Sheets are now flex columns with
   `max-height: 94dvh`; the middle (stats grid / extra buttons /
   settings rows) scrolls in a `.sheet-scroll` region while the header
   and the action column stay fixed — the primary button (Next Level /
   Resume / Done) is always fully visible without scrolling. A
   `max-height: 480px` compact block tightens spacing; the fixed
   content budgets 317px <= 338px (94% of 360). Proof: CSS-metric
   budget computed from the stylesheet + DOM-structure assertions.
3. **Lag (WebView perf).** (a) Static-layer bake: platforms that can
   never move/sink/hide/crumble (not movers, not crumble slabs, not
   trap targets — attempt-shift placements only ever retarget trap
   targets, which stay dynamic) are drawn once per level into an
   offscreen world-sized canvas; a frame then costs one drawImage for
   all of them instead of a gradient + texture tiling + seams each.
   Invalidated on setupLevel and whenever art finishes loading.
   Expected gain: removes the large majority of per-frame canvas ops
   on platform-heavy levels. (b) Every per-frame `shadowBlur` is gone
   (door/coin/key/statue-eyes/bomb/saw/hero-hat) — replaced by a
   cached 96px radial-glow sprite (`drawGlow`), and the lane light
   pool uses the same sprite instead of a per-frame gradient.
   shadowBlur forces a full-canvas blur pass per set; this was the
   classic WebView fps killer. (c) Backing-store cap: the canvas
   backing is 960x540 on desktop; on touch it scales by
   `max(0.66, min(1, 1.5/dpr))` (dpr 3 -> 0.66), so the GPU never
   fills more than ~1.5x CSS pixels. (d) Touch particle cuts: bursts
   x0.55 (cap 240 -> 150), rain drops capped at 70 active, splashes
   halved. One documented assertion change: art-test's "no drawImage
   before sprites load" now counts only drawImage calls of sprite
   IMAGES (canvas blits for the bake/glow are not sprite draws) —
   the invariant it protects is unchanged.
4. **"Impossible-looking" key (LV9).** A physics bot (real engine
   constants: run 240, jump vy 762, gravity 2000, spring vy 1120,
   key radius 30) proved routes start -> key -> door for all 10 key
   levels and logged them. Readability rule: a route must exist using
   no unassisted jump rise > 115 (the engine max is ~145, which reads
   as impossible with the variable jump). Only LV9 failed: its second
   hop was 124. Fix: top ledge 268 -> 292 (hops now 108 + 100), key
   238 -> 262, and a guide coin at (585, 322) sits on the second
   jump's arc so the path teaches itself. The other nine keys already
   sit on visible staircases (72-90 rises) or spring lines.
5. **Coins on jump paths.** Data pass over all 209 levels: a coin
   resting over a support it is unsafe/impractical to stand on — a
   spike strip on the support under the coin, or a narrow hurdle
   block <= 64 wide — was raised 12 units in DATA (pickup follows).
   28 coins lifted (incl. hidden doorstep-spike coins in the caves).
   Landed-on ledge/step coins were deliberately NOT lifted: standing
   pickup distance there is ~23 (< 28 radius) and lifting would have
   broken walking collection — the audit pins both directions, plus
   an arc spot-check (some tap/hold jump height collects every lifted
   coin) and the existing 0-sunk rule (draw lift never saturates).
6. **Whole app in English.** All 209 level names translated keeping
   the joke (Pehla Qadam -> First Step, Gola Pathar -> Rolling
   Boulder, Ulta Dimagh -> Upside-Down Mind; ordinals -> Part
   Two/Three/Four/Five), world names (Stormy Shore, Frozen Crystal
   Cave, Fire Temple), signs, hints, toasts, ad placeholders, Promo
   subtitles, character texts (Sunehra Raja -> Golden Raja), endings.
   Guard test: a Roman-Urdu blocklist scans every level
   name/hint/sig/sign, the Promo clips, and the ENTIRE game file —
   Roman Urdu survives only in this DESIGN.md. Tests that pinned old
   strings were updated (framework DEMO toast, caves names, screens).
7. **Home redesign.** Left glass sidebar (34% width, full height):
   title inside it, stats as rows (Keys / Stars / Bank), buttons
   stacked PLAY / Levels / Characters / How to Play / Settings /
   Promo, difficulty chips at the bottom. The dashboard art is
   re-framed (background-size 124%, pinned left) so its painted
   signboards start right of the sidebar (~298px > 272px at 800w)
   and the hero + golden door hold the open right side — one composed
   screen, no double branding. `JTAds.setBanner` now publishes the
   live banner height into `--bannerH` (native ~50px, web measured),
   and the sidebar's bottom padding includes it, so nothing hides
   under the banner. Proof: structure order, framing geometry and
   banner-var behaviour asserted in playtest-test.
8. **Deaths are per-level now (owner's correction).** The save gains
   `deathsByLevel{}` (incremented in `die()` next to the legacy total,
   which is kept only for save compatibility and never displayed).
   Level Select tiles show that level's own 💀 N (when > 0); the Home
   stats no longer show any Deaths total; the ending card's "Total
   Deaths" became "Levels Conquered". Note: the in-level HUD
   previously showed the GLOBAL total despite looking per-level — it
   now shows this level's own count (the Level Complete sheet's
   per-run count is unchanged). Old saves start with an empty
   per-level record: past deaths can't be attributed to levels
   retroactively, so tiles fill in as levels are replayed.

## Jump Fairness — the ≤85% rule + LV16 pillar + black-bar fix (2026-10-30, owner playtest)

Owner's LV16 screenshot (circled): the gap between the two floating
steps in "The Statue's Dart" felt "almost impossible", the pillar
looked misplaced, and a small BLACK BAR sat at the right end of each
step. All three observations were correct:

1. **The black bar was a rendering bug, not geometry.**
   `drawPlatform`'s stone seam loop stamped fixed 46px block outlines
   every 52px without clamping to the platform width; on LV16's
   110px steps the last seam painted [596..642] over a platform that
   ends at 610 — a dark hollow rectangle floating 32px past the true
   edge, at mid-body height, exactly where the owner circled it. It
   made the stone look ~32px longer than the ground you can stand
   on. Fix: the seam/crack decorations are now clipped to the
   collision rect (`ctx.clip()` in drawPlatform). A recording-canvas
   regression in fairness-test renders every level's static layer
   and asserts no decoration crosses its platform's edge.
2. **LV16 pillar moved (owner's own suggestion).** Step1 500 -> 530.
   The circled gap was 130px = 71.1% of the max flat jump (182.88px),
   leaving only a 53px takeoff window on a 110px step — under dart
   fire (bursts at head height on the ground route, so the steps are
   the real route), on touch, that plays as near-impossible. Gap is
   now 100px = 54.7%, takeoff window 83px. Dart signature untouched
   (statues 1200/1230, shifts 1060/930, devil statue, hint). The five
   sibling dart-step levels cloned from the same template got the
   same +30 move: The Statue's Dart Parts Two/Three + W1-48,
   The Statue's Gaze, The Dart Statue (520 -> 550).
3. **Standing rule — jump fairness ≤85%.** No mandatory jump on any
   level's completion route may exceed 85% of true capability
   (pure ballistics from the engine constants: held jump vy 762,
   gravity 2000, run 240 -> max rise 145.16px, max flat 182.88px;
   spring vy 1120 -> 313.6px. Coyote 0.08s + 26px landing snap are
   NOT counted — they are the player's extra margin). Enforced by
   the new fairness-test.js (500 assertions): minimax/widest-path
   audit over the smoke BFS graph for all 209 levels, door + key
   routes. Hurdle shifts move hazards only, never platforms, so the
   single graph covers all three shift positions.
   Audit findings on the pre-fix build: exactly 9 violations, all
   the same crate-climb pattern (stand on a pushed crate, rise
   126px to a wall top = 86.8%): Crate Work, Crate Up Top,
   Crate Stairs, Crate Up Top · Part Two (W2 + W3 + W4),
   Crate Stairs · Part Five (W2 + W3), The Wall's Secret. Smallest
   fix: wall top 340 -> 343 (door + wall-top spikes ride along),
   rise now 123px = 84.7%. No level was impossible (worst route
   anywhere was 86.8%); after the fix the hardest mandatory jump
   in the game is 84.7%.
   Frustration must come from dhoka (traps, timing, lies), never
   from geometry that demands a bot-perfect jump.

## Dhoka / Frustration update (2026-10-30, owner-approved — the final content update)

Owner verdict on the fairness build: the game was hard but the Level
Devil *frustrating feel* was missing. Frustration here is betrayal, not
geometry — the three channel studies (06 o_manao, 07 Nalopia,
08 MAXSHOWWWW) agree: filmed rage comes from hazards on the landing,
in the jump arc, and on the door path; double-traps; shafts; time
pressure. This update seasons the whole game with that formula while
the ≤85% jump-fairness rule stays untouched (no platform moved; the
fairness suite is green at the same 500).

**A. Boss + hardest levels — the full doorstep stack (24 levels).**
The 4 world bosses (position 50) + the grand finale (L200, the W4
boss) + the 5 highest-targetDeaths non-boss levels per world
(W1: L43/44/47/48/49 · W2: L94/95/96/98/99 · W3: L145/146/147/148/149 ·
W4: L194/196/197/198/199) now ALL end with the same three-part
doorstep, in normal mode, in the world's own palette:
  1. a hidden spike patch 100px before the door (rises in 0.2s when
     the player crosses a trigger 130px ahead of it — the rise + the
     spike sound ARE the tell),
  2. a ceiling rock whose fall column is the landing spot right after
     the patch — jump the patch and the rock is already telegraphed
     (0.5s warning ellipse) where you land: the chained DOUBLE-TRAP.
     Escape is the door itself, one step further,
  3. a guard: a dart statue past the door firing back across the
     doorstep, or a patrol saw sweeping the doorway.
Where a level already owned one link (the four bosses shipped with
patch + rock + a doorstep boulder; Lane of Darts already had its
statue), only the missing links were added — the bosses gained the
saw, and L200, the finale, carries BOTH guards (dart + saw) over its
patch + rock: five doorstep elements, the cruelest door in the game.
Two levels are fake-door designs (L94 The Door Moved · Part Five,
L196 Two Faces): they got the rock at the FAKE door (guard the lie)
plus a hidden patch on the return approach to the REAL door (x=60),
which wakes on the outbound run and waits, visibly up, for the
boulder-chased run back. Devil-only statues near those doors were
deliberately NOT counted as guards — the stack must bite in normal
mode.

**B. Doorstep seasoning for regular levels (50 levels).**
Before this update, 54 of the 200 main levels had no element at all
in the final approach (smoke suite's doorstep metric: trap trigger
within 140px of the door or effect within 150px). 50 of them gained
ONE last-second doorstep moment, rotating four world-themed patterns
for variety (13 spikes / 13 rock / 12 dart / 11 saw + 1 custom):
hidden patch, doorstep rock, dart guard, doorway saw — each with its
engine-native tell (rising spikes, warning ellipse, visible statue,
saw you can hear coming). W2 patches wear water and W4 patches lava
exactly where the level already did (flags/fingerprints unchanged in
kind). Sigs gained the matching "+ doorstep …" phrase and hints a
doorstep clause, per the shipped grammar. The two deliberate
exceptions: L1 First Step stays trap-free (it is the tutorial — the
one level smoke-test exempts from the trap rule), and L107 Running
Is Forbidden is a Promo showcase level whose bot plans are pinned by
promo-test, so its doorstep stays as shipped. Bonus worlds (Crystal +
Secret Caves) are untouched. Coverage is now 198/200.
One data casualty, fixed in place: L2's coin at (820,462) became a
hurdle coin the moment the new patch landed under it — lifted to
y=432, the shipped over-patch height, per the coin audit.
L113 The Upside-Down World (ceiling door) got the gravity-flavoured
version: a hidden CEILING patch (csD) on the door platform's
underside, waking as the flipped hero crosses x=940.

**C. Death juice (global, pure overlay).**
  - Shake snap: +120ms, small (6px/4.5px decaying), layered on the
    existing rumble shake, still gated by the shake setting.
  - Red flash: 100ms radial red vignette, peak alpha 0.5, drawn after
    the standard vignette from a CACHED gradient (deathFlashGrad —
    same trick as vignetteGrad; zero per-frame allocation, no
    shadowBlur, playtest's zero-shadowBlur render audit still green).
  - Counter pop: the HUD death chip plays chipPop (scale 1.25 at
    40%, 0.32s) and the skull flashes red on every death.
  - Taunts: a 12-line English pool ("So close!", "The door was RIGHT
    there!", "The temple is laughing.", …) shown in #taunt for
    ~1.15s per death, picked with a no-back-to-back-repeat rule.
  - NONE of it touches the death path: player.deadT is still exactly
    0.35s and dhoka-test respawns through the real engine to prove
    the player is back in <0.5s with the juice active. The juice
    overlays the respawn; it never delays it.

**Tests:** new dhoka-test.js (357 assertions: doorstep coverage
198/200, scope-A stack accounting per level, fake-door pair, ceiling
patch, patch wiring, taunt pool + rotation + respawn invariant).
Full battery: 18 suites, 18,389 assertions, 0 failures (baseline
17,409; shift-test grew +489 and smoke-test +134 purely from
validating the new traps at all three shift positions). No-repeat
fingerprints intact (variety 988 green — no sig needed an exception),
jump fairness intact (fairness 500 green — zero geometry changed),
ads/promo/characters untouched.

## Signing (permanent key — 2026-10-30)

**History / root cause:** test builds were signed by Gradle's default debug config, whose key lives in `~/.android/debug.keystore` (resolved via the build JVM's `user.home` = `/root` in this sandbox). That directory does not persist here, so the debug key was silently regenerated between builds — each APK carried a *different* certificate, and Android refused install-over updates with "App not installed as package conflicts with an existing package" (owner hit this on 2026-10-30).

**The permanent key (do not lose it):**
- Keystore: `~/workspace/android-toolchain/jt-signing.keystore` (alias `jungletraps`, RSA 2048, valid ~27 years)
- Credentials: `~/workspace/android-toolchain/jt-signing.txt` (properties format, chmod 600, sits next to the keystore)
- Certificate SHA-256 fingerprint: `d6dd4cb81e661c97af7ce23db06dda26220d7d36f4cfa9c9648e6d1303b864bd`
- DN: `CN=Jungle Traps, OU=Hayli, O=Hayli, L=Karachi, ST=Sindh, C=PK`

**Rule: this keystore signs EVERY build from now on** (wired into both debug and release in `apk-shell/app/build.gradle`; `build-apk.sh` + Gradle both fail loudly if the keystore or credentials file is missing — they never fall back to an auto-generated key). **Losing this keystore means users can never update the app again** — every installed copy would have to be uninstalled (losing progress) before a differently-signed build could install. Back it up somewhere safe outside this VM.

**Owner note (one-time):** the copy currently installed on the owner's phone carries one of the older random debug keys, so THIS build cannot install over it. He must **uninstall once**, then install this build; from then on every future update installs cleanly over the previous one (progress preserved).

## Dollars + Characters page art (2026-10-30, owner's two orders)

**All currency is USD now.** Every user-facing rupee amount was swept out of the game (character paid routes, world early-unlock, the Everything Pack) and converted to standard Play Billing tiers: Zara Rs 249 → $0.99 · Bolt Rs 399 → $1.99 · Captain Haddi Rs 549 → $1.99 · Golden Raja Rs 799 → $2.99 · World 2 early unlock Rs 299 → $0.99 · World 3 Rs 499 → $1.99 · World 4 Rs 699 → $2.99 · Everything Pack Rs 1499 → $4.99. Prices live as USD numbers in `CHARACTERS[].price` / `WORLD_UNLOCK_PRICE` and render via `'$' + price.toFixed(2)`. In-game coins are unchanged (coins are not currency). A guard assertion in framework-test.js fails the suite if `Rs`, `PKR` or `₨` ever appears in index.html again.

**Characters page shows the characters.** The cards previously rendered text only; each card now leads with the character's REAL sprite art via the `CHAR_PORTRAIT` map (Explorer → `assets/hero-stand.png`, Zara → `assets/chars/zaraStand.png`, Bolt → `assets/chars/boltStand.png`, Captain Haddi → `assets/chars/haddiStand.png`, Golden Raja → `assets/hero-gold.png` — the same golden sprite he rides in-game), shown at a fixed 96px-tall `.char-pic` slot (contain, bottom-anchored), above name + unlock routes + price. Paths are relative, and `build-apk.sh` copies the whole `assets/` tree, so the portraits work identically on web and in the APK (all five files verified present in the built APK's `assets/www/`).

**Verification:** framework-test.js §10 renders the real `buildChars()` in the Node harness and asserts, per card, the exact portrait `<img>` src, the name, the USD route line and paid-button price, plus that each portrait file on disk decodes as a PNG with non-zero dimensions; the sandbox's Chromium is browser-daemon-gated and cannot be launched standalone, so DOM-level rendering proof runs through the project's harness + file decode + APK bundle listing. Full battery: 18 suites, 18,422 assertions, 0 failures (18,389 baseline + 33 new).

## Promo reaction-split (2026-10-30, owner order) — gameplay only, streamer style

**The format.** Promo output is now **Reaction Split by default** (Promo screen → *🎞 Format* toggles Split/Classic; Classic keeps the old titled composite + end card untouched). A split clip is **pure gameplay: no text overlays, no titles, no captions, no messages, no "coming soon", no end card** — the split painter (`drawSplitComposite`) never calls fillText/strokeText at all (asserted: zero text calls on the composite across a full story run). When the bot wins, the clip holds ~1.2s on the celebration reaction and ends — there is no endcard phase in split mode.

**Frame division (1080×1920, `promoLayout('split')` + `promoSplitGameRect`).** Top **30% = reaction panel, 576px** (Explorer face + state glow + gold divider). Bottom **70% = gameplay region, 1344px**. **Visual integrity rule:** gameplay is drawn at its **native 960:540 ratio**, scaled to fit the frame width (1080×608 at rest), letterboxed (centred) inside the region — **never stretched, never cropped**; hero, door and the full play area are always visible. The vertical remainder is filled with a **blurred, darkened blow-up of the game's own current frame** (pillarbox blur-fill) over a deep-jungle gradient. The meme zoom-punch scales the gameplay rect *uniformly* and it returns to the exact native fit; the doorstep panel-grow (panel 576→766px) shrinks the rect but keeps the same ratio (asserted in promo-split-test for panel heights 576/671/766).

**The reaction performer is our own Explorer — never a real influencer's footage, face or voice** (standing owner rule). Expressions are animated from the game's own sprites (head crops of hero-stand / hero-dizzy / hero-victory / hero-run-1) with squash, bob, jitter and glow: **calm** (running), **shock** (death), **rage** (repeat deaths), **smile** (near-miss), **cheer** (win). Priority ladder (cheer > despair > rage > shock > stare > smile > blink > calm) never downgrades mid-beat; *calm* is the reset and always lands.

**Desi meme beats (recreated, original art).** The famous desi film/TV meme expressions are **recreated with the Explorer's face — no film/TV clips, faces or audio are used**: the **wide-eyed shocked stare** (`stare`: tight eye crop, frozen, on trap-spring betrayals), the **slow disbelief blink** (`blink`: slow squash-blink cycle on respawn after a death), the **forced smile-through-pain** (`smile`: stand face + fine tremble, on near-misses), the **head-in-hands despair** (`despair`: dizzy face sunk, tilted and dimmed + darkened panel, on doorstep deaths), and the **angry table-slam** (`rage`: rapid scale pulses + shake + red glow, on quick repeat deaths). Same comedic timing, entirely our own character and code.

**Meme layer (visual/audio gags only — still no text).** Driven by watchers inside `promoTick` (split format only) and logged in `promoMeme.log`:
- **Death** → gameplay **zoom-punch** (×1.07 decay), **face scale pop**, vector **skull sticker pop** beside the face, **bass-hit stinger**.
- **Betrayal instant** (a rock warning appears, or a hidden spike patch reveals within ~300px of the player) → **~0.3s freeze-frame + extra shake**, **record-scratch stinger**, stare reaction.
- **Near-miss** (a moving saw/boulder/falling rock passes within ~34px and the player lives) → **slow-motion 0.5× for ~0.6s** (`promo.timeScale` scales bot+engine in `frame()`; promo timers stay real-time) then snap back, **pop stinger**, smile reaction.
- **Doorstep death** (kill within 170px of the door) → the biggest treatment: **the reaction panel momentarily grows** (+190px) on top of the death beats, despair reaction.
- **Stingers are synthesized** with the game's own `tone()`/`noiseBurst()` engine (bass drop, scratch sweep down+up, pop, win triad) and routed into `masterGain` — the node recordings tap — so browser recordings capture them with the game audio. **No downloaded or ripped meme audio/video/GIFs anywhere.**

**Owner's own reaction clips (drop-in).** Put short clips in **`assets/reactions/`** named **`idle.mp4`** (calm/blink), **`shock.mp4`** (shock/stare/despair), **`rage.mp4`**, **`nearmiss.mp4`** (smile), **`win.mp4`** (cheer); an optional **`assets/reactions/manifest.json`** (`{"shock":"my-shock.mp4", ...}`) may rename any of them. On recording start the exporter probes them fire-and-forget (recording never waits); any state with a loadable clip plays it (looped, cover-cropped into a gold-framed camera box), every other state falls back to the animated Explorer face. The folder ships with the site/APK when present at publish/build time.

**Offline sample + ad creatives (this pass).** The sandbox has no launchable browser, so the sample and ads were rendered with **`rebuild/promo-render/render.js`**: the real engine + story machine stepped at 60Hz on **node-canvas** (real rasterization, real sprites) with the meme timeScale applied exactly like the browser frame loop, the 1080×1920 split composite captured at 30fps and piped to ffmpeg (H.264). These offline renders are **silent** — the game's audio is procedural WebAudio, which this route cannot capture; **in-browser recordings include the full game audio + stingers** via the existing masterGain tap. Sample: clip 4 (L55 saw level) — 3 genuine deaths incl. the doorstep death, then the win + cheer. Ad levels were picked by ranking all 200 levels on the game's own data (primary `targetDeaths`, tie-break doorstep elements + hazard count — `rebuild/promo-render/rank.js`): **#1 L200 "King of the Edge · Part Three W4-50"** (targetDeaths 76, doorstep 6, hazards 8 — L200 verified #1, not assumed) and **#2 L199 "Lane of Pits · Part Three W4-49"** (68, doorstep 5, hazards 9), played by runtime-only 16-plan bot profiles (RUSH → SOLVED ramp) injected in the render harness only — the shipped six clips are unchanged. Rendered results: ad-creative-1 (L200) 24.4s / 14 deaths at the opening spike-pit gauntlet; ad-creative-2 (L199) 24.7s / 10 deaths, each preceded by a betrayal freeze (hidden trap springing). Honest limit: the promo bot cannot reach the doorstep of the two toughest levels (their opening gauntlets are built for 68–76 human deaths), so the ads are signature-trap frustration loops; a true doorstep death IS captured in the sample clip (L55).

**Tests.** New `promo-split-test.js` (48 assertions): split is the default format; layout geometry (panel 576, game 1080×608 inside the bottom 70%, no overlap); native-ratio gameplay rect at rest and at full panel-grow; split story machine — no endcard phase, win-hold → result filed, save untouched, **zero text calls** on the composite while frames actually paint; reaction/meme firing (shock, despair, cheer observed; doorstep panel-grow and zoom-punch observed; meme log carries death/doorstep/win); trigger units (nearmiss → slow-mo 0.5×, betrayal → freeze ≥0.3s + shake, death → punch+pop+skull together); reaction priority; face fallback when no owner clips exist. `promo-test.js` pins the CLASSIC format explicitly for its endcard story contract (one line; all 90 assertions unchanged). Full battery: **19 suites, 18,470 assertions, 0 failures** (18,422 baseline + 48 new). Ads stay suppressed during promo, save snapshot/restore unchanged.

## Quality Package — jump feel + balance band + visual QA + procedural backgrounds (2026-10-30, owner complaints + direct orders)

Full analysis: `analysis/10-gap-analysis.md`. Owner's complaints: too many bugs, visuals low quality ("abhi lagta hai jaisi image ko zoom kiya gaya hai"), jump feel not good. Owner's clarification, held throughout: the *knowledge* behind professional polish is the goal — public observation + published design literature only; no game binary/APK/asset was ever opened.

### Jump feel overhaul (Part B)
Constants (all pinned in fairness-test §1/§5, measured by stepping the real engine at 240 Hz): fall gravity 2000 → **3000** (×1.5 fall multiplier — VG101/Godot published defaults); jump cut changed from a hard −290 clamp to a **proportional ×0.45** velocity cut on release (VG101 default 0.5, GM8/IWBTG 0.45); coyote 0.08 → **0.10 s** (Celeste's published JumpGraceTime); terminal velocity 980 → **1140** (Celeste MaxFall/JumpSpeed ratio ≈ 1.52); run speed 240 → **266** so flat distance survives the faster fall; buffer stays 0.10 s (already inside the published 0.08–0.12 band); **jump stretch** added (0.09 s, h ×1.10 / w ×0.90 in all three hero draw paths) to pair with the existing landing squash. Results: rise 145.16 px and rise time 0.381 s **unchanged**, fall time 0.381 → **0.311 s**, hang 0.762 → **0.692 s**, max flat distance 182.88 → **184.10 px**. Celeste's apex half-gravity was considered and deliberately rejected — it adds float; the target feel is tight. **Geometry changes: none** — the ≤85% audit stayed green by construction. Test-only change: the caves bot's full-hop hold went 9 → 12 frames (the old bot's hop arc is ~12% shorter under the new fall gravity; a bot retrain, not a game change).

### Balance band (fairness §6, owner's proportional rule)
The ≤85% cap is now only half the suite. §6 recomputes every route under BOTH constant sets (old: 240 run, symmetric 2000 gravity; new: above) and **fails** any route that was ≥ 50% of capability before the retune and < 50% after it — neither direction may drift. Result: **zero** newly-trivial routes; largest drift anywhere **0.2 pp**. Below-band routes are printed as a fix list, not failed: of 219 audited routes (209 door + 10 key), 26 sit in the 50–85% band, 193 below 50% — of those, 132 are 0% (the completion route needs no ballistic jump: drops, rides, walk-offs; difficulty lives in traps/timing by design) and 56 are the standard ~16.5% step hop. Enlarging gaps on no-jump routes would redesign levels, not restore difficulty, so **no band geometry changes were made**; the two closest real-jump candidates (L62 door 49.6%, Crystal Trial I door 41.3%) are named in analysis/10 if the owner wants them hardened.

### Visual QA sweep (Part C)
`rebuild/promo-render/qa-sweep.js` rendered all **209 levels × 2 frames** on node-canvas (real engine, real sprites) with a drawImage op-log, pixel stats and per-pose alpha trims. Findings: **0** broken/NaN draws, **0** debug-magenta pixels, **0** blank frames. Five spawn frames flagged low-contrast (L160 + Crystal Trials I–IV) — inspected: the Crystal frames are the deliberate darkness mechanic (light holes); frame B reads correctly; left as design, flagged for the owner in analysis/10. **One real bug fixed:** the foreground vine fringe drew green jungle vines in *every* world — now world-aware (jungle: green vines; caves: teal; ice: icicle fringe; coast/volcano: none). Pose trims: visible height consistent (43.8–50 units at the 50-unit draw height, feet sink ≤ 4 units) but draw-box width swings 23.6 → 60.4 units across pose sheets — an art-sheet framing issue, documented in analysis/10 §2.1 with the art-direction options; not a renderer bug and not fixed in code.

### Procedural backgrounds (Part D — replaces "Background plates" + "Background plates v2" above; those sections are now history)
Owner's direct order: photo/plate backgrounds removed, backgrounds drawn in code. **Deleted files (1,455,704 B):** `assets/bg-w1.jpg`, `bg-w2.jpg`, `bg-w3.jpg`, `bg-w4.jpg`, `bg-crystal.jpg`, `dashboard.jpg`, `levelboard.jpg`, `portal-bg.jpg`. Character sprites and hazard art untouched; `tex-stone.png` (a platform sprite texture, not a background) kept.

**System.** `drawBackground()` paints six code layers per frame, each at its own parallax — sky gradient (0) → celestial glow + body (0.05) → hash-ridge horizon (0.18, `bgRidge`: peaks are a hash of the world segment index, seamless, never repeats inside a level) → far silhouettes (0.3, `drawBgFar`) → mid props (0.55, `drawBgMid`) → near motes (0.8, `drawBgNear`, pure functions of the level clock — no state, no allocation). Everything is flat vector fills: crisp at any resolution, no bitmap is ever scaled, no download, no load-fail state (the old plate fallback path `drawBgPlate`/`BG_PLATES` is deleted, not bypassed). Decor is seeded per level in `buildDecor` (`far` ×16 with shape kind, `mid` ×30, `near` ×14, plus existing vines/stars), so a level's scenery is stable across frames and deaths. The scene is chosen by `THEMES[world].scene` (mirrored in the `PROC_BG` map exposed to tests) with per-theme `far2` (ridge colour) and `accent` (glow details):

| World | Scene | Palette (sky → ground) | Far silhouettes | Mid props | Near motes |
|---|---|---|---|---|---|
| 1 Jungle | `jungle` | greens `#2e6b3c → #0d2b1a`, gold glow | stepped temples + broad-canopy trees | leaf clusters | drifting leaves |
| 2 Storm Coast | `coast` | slate blues `#2c4a5e → #0c222b`, pale glow, rain system unchanged | rocky islets + cliff slabs | wave mounds with foam caps, rocks | spray dots |
| 3 Ice Crystal Cave | `ice` | deep blues `#1d3a52 → #060f18`, stars, moon | hanging ice columns + ground crystal shards | crystal clusters with accent facets | snow dots |
| 4 Volcano Temple | `volcano` | ember browns `#4a1d12 → #180806`, orange glow | volcano cones with glowing crater notches | lava pools (accent glow), basalt spikes | rising embers |
| 5 Crystal Caves | `crystal` | purples `#271738 → #0b0616`, stars, violet glow | giant crystal shards | crystal clusters | pulsing sparkle diamonds |
| 6 Secret Caves | `caves` | deep teals `#0d2019 → #030a08`, stars, mint glow | stalactite + stalagmite pairs | glow-shroom clusters | glow dust |

**Screens too.** Menu / level-select / ending no longer load paintings: each carries a layered CSS-gradient stack (`#screen-menu{background:…}` etc.); `screenArtSync()` is a no-op and the `.art-on` mechanism is gone. The portal cinematic's galaxy backdrop is a code radial wash (`drawPortalSwirl`). Cost: the background is ~90 extra flat-shape ops per frame, all culled to the viewport — inside the existing frame budget (the static platform bake still carries the heavy layer).

**Tests.** `bg-test.js` rewritten (84 assertions): plates absent from disk + source + ART registry (registry is PNG-only now), scene mapping in both `PROC_BG` and `THEMES`, per-world procedural renders with zero `.jpg` drawImages even with all sprites ready, parallax op-stream change across a camera move, platform-texture section kept. `screens-test.js` (33) and `art-test.js` (269) repointed from plate-presence to plate-absence + procedural portal; `playtest-test.js` home section now pins the procedural menu backdrop instead of the 124% painting framing. Post-D render verification: the qa-sweep was re-run against the procedural build (209 levels × 2 frames + per-world contact sheets inspected — see analysis/10). **Full battery: 19 suites, 18,724 assertions, 0 failures** (was 18,470; fairness 514 → 733 with the band, bg/screens/art/playtest reworked).
