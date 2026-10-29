# JUNGLE TRAPS — Complete Game · Design & Engineering Notes

Single-file build: `index.html` (~136 KB, zero dependencies, works from `file://`).
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
  (levels flagged `statue:true`). Triggers: `x` proximity, `r` radius, `land` (engine
  support; unused in shipped data), `timer` (rhythm rocks), `lever`.
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
  overview ramp (W1 avg 5.3, W2 12.3, W3 24.3, W4 40.9, Crystal 52.5).
- **Content:** 48 levels (4 worlds × 12, themed palettes/mechanics per the overview)
  + 4 secret Crystal Caves unlocked at ≥4 keys (sequential). Exactly 10 crystal keys
  hidden in the 48. Level 48 ("The Final Door") is a multi-stage finale with statue
  rock-drops, saw, bomb and a door chase → **complete ending screen** (deaths, time,
  keys, stars) — no cliffhanger. All 10 keys → golden hat skin on the hero.
- **Sound:** procedural SFX (click, jump, death, coin, key sparkle, checkpoint chime,
  win jingle, clunk, trap, rock, spring, dart, explosion, lever, saw) + an 8-bar
  procedural music loop (kick/shaker/tom + marimba-style pentatonic plucks over
  Am–F–C–G) with separate Music/SFX toggles. Audio unlocks on first gesture.
- **Save:** one localStorage object (`jungleTrapsSaveV2`): unlocked, stars, keys,
  deaths, coins best, play time, mode, settings. Reset in Settings.

## Verification (headless, this build)

- `node --check` on the extracted script: **PASS**
- Smoke suite (stubbed DOM/canvas/localStorage): **540 assertions, 0 failures** —
  boot, 52-level structure, world counts, key count = 10, trap-target integrity,
  BFS reachability (door + every checkpoint + every key; physics-based edge rules:
  ≤140px rise, ≤150px gap up / ≤220px across, spring 300px boost, geyser lift,
  pushable-crate steps), all 52 levels render, run simulation, checkpoint respawn
  at flag + restart clears it, devilOnly trap counts by mode, trap-speed factors,
  star thresholds, secret lock/unlock, key pickup, win flow, save roundtrip,
  final-level ending flow, CSS tap-target/fullscreen checks.
- Stress suite: **62 assertions, 0 failures** — 700 frames of run-right gameplay
  through every level without a throw; targeted mechanics: lever→gate opens,
  bomb destroys cracked platform, geyser lifts >120px, dart trap fires, saw and
  shadow kill a stationary player, fakeDoor relocates the door, floorHide/platformGo fire.
- Geometry fixes found by testing and applied: geyser columns on L19/L29/L38/L50
  were repositioned so the steam column never wedges the player under a platform lip.

## Known limitations (honest)

- **Not human-playtested.** Reachability is machine-verified with approximate physics
  rules and mechanics are simulation-verified, but difficulty *feel* (exact death
  counts vs. targets, trap timing fairness) needs the owner's morning playtest —
  especially L3 bridge timing, L34 rhythm rocks, L47/L48 endgame chains.
- Boulder/saw/shadow collision uses shrunken-box approximations; rare edge clips possible.
- Music is a deliberately simple procedural loop (no melody variation beyond 8 bars).
- The `land` trap trigger is implemented and tested at engine level but no shipped
  level uses it yet.
