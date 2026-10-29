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
