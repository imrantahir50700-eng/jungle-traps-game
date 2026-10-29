# JUNGLE TRAPS — Complete Game · Design & Engineering Notes

Single-file build: `index.html` (~162 KB, zero dependencies, works from `file://`).
All code, canvas art, music/SFX (procedural WebAudio) and level designs are original.

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
- **Sound:** procedural SFX (click, jump, death — a dedicated `sfxDeath`, see the
  feel section below — coin, key sparkle, checkpoint chime,
  win jingle, clunk, trap, rock, spring, dart, explosion, lever, saw) + an 8-bar
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
