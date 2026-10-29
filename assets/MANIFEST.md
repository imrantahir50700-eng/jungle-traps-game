# Sprite Assets — MANIFEST

Extracted from the owner's GPT art sheets (`~/workspace/reverse-app/visuals/gpt-set/1-character-sheet.jpg`, `2-elements-sheet.jpg`) by background flood-fill keying (distance-from-bg soft alpha ramp + despill on edge pixels only), auto-trimmed with ~4% padding. Stone tile bases were cut off the elements so each sprite floats. Anchor for all sprites: **bottom-center** unless noted. Hero sprites share one common scale (stand = 470px content height); the 5 run frames share one uniform canvas, bottom-aligned, so they can be flipped frame-by-frame without size pulsing.

World-unit suggestions assume the game's 800×450 view with the hero drawn **44 units tall**. Widths preserve the sheet art's aspect ratio.

## Hero

| File | What it is | PNG size | KB | Suggested draw (world units) |
|---|---|---|---|---|
| hero-stand.png | Hero, front standing (idle / menu) | 240×508 | 167.9 | h 44 × w 21 (aspect-true; hero art is slender) |
| hero-run-1.png | Run cycle frame 1 | 221×288 | 87.4 | h 44 × w 34 |
| hero-run-2.png | Run cycle frame 2 | 221×288 | 88.8 | h 44 × w 34 |
| hero-run-3.png | Run cycle frame 3 | 221×288 | 87.0 | h 44 × w 34 |
| hero-run-4.png | Run cycle frame 4 | 221×288 | 85.3 | h 44 × w 34 |
| hero-run-5.png | Run cycle frame 5 | 221×288 | 93.9 | h 44 × w 34 |
| hero-jump.png | Airborne, fist up (jump/rise) | 250×294 | 89.8 | h 44 × w 37 |
| hero-fall.png | Falling, arms out, alarmed | 268×222 | 85.5 | h 44 × w 53 (wide pose — arms/legs spread) |
| hero-dizzy.png | Defeated sitting pose, spiral eyes + stars (death) | 291×317 | 134.7 | h 44 × w 40 |
| hero-victory.png | Cheering, fist pumped (level clear) | 249×350 | 136.4 | h 44 × w 31 |
| hero-gold.png | Golden-helmet hero, front standing (10-key skin) | 251×512 | 175.9 | h 44 × w 22 |

Run-cycle note: frames are in sheet order (left→right) and alternate stride/passing poses plausibly; because they were AI-generated they are not a perfectly looped cycle — at game speed (≈8–10 fps) this reads fine.

## Elements

| File | What it is | PNG size | KB | Suggested draw (world units) |
|---|---|---|---|---|
| door.png | Golden temple exit door with lit side braziers | 329×236 | 135.5 | 112×80 — see note ⚠️ |
| door-fake.png | Cracked fake door in stone frame | 322×232 | 132.8 | 112×80 — see note ⚠️ |
| spikes.png | Cluster of 7 bamboo spikes with grass base | 342×210 | 78.6 | 60×37 per cluster |
| platform-crumble.png | Floating mossy stone slab (crumble platform) | 360×205 | 89.2 | 120×68 — moss hangs below the collision top |
| boulder.png | Mossy round temple boulder | 225×191 | 88.6 | 54×46 |
| rock-block.png | Falling carved stone block | 195×189 | 66.9 | 44×43 |
| saw.png | Stone saw disc with side grass tufts | 277×209 | 92.4 | 56×42 |
| statue.png | Dart statue head + green gas plume + 2 darts (plume extends right) | 429×219 | 114.7 | 96×49, head anchored left ≈ first 40% |
| bomb.png | Round bomb, red band, lit fuse + spark | 156×178 | 45.8 | 40×46 |
| mushroom.png | Red-cap mushroom spring (thin grass fringe at base) | 244×201 | 66.3 | 40×33 |
| crate.png | Wooden pushable crate | 254×150 | 64.3 | 40×24 — art is wide (1.7:1), not square |
| log-platform.png | Vine-hung log platform (vines above/below are decorative) | 317×184 | 68.3 | 110×64, collision on the log body (middle band) |
| checkpoint.png | Checkpoint torch + red flag on small stone base | 192×245 | 61.4 | 50×64 |
| coin.png | Gold coin with sparkle glow | 133×126 | 28.5 | 22×21 |
| key.png | Purple crystal key with glow | 134×152 | 32.0 | 26×30 |
| geyser.png | Stone vent with steam plume | 295×261 | 83.4 | 54×48 |

⚠️ Door aspect: the sheet's door art is **landscape** (≈1.4:1, wide carved frame + braziers), while the game's door slot is ≈64×84 portrait. Keeping sheet proportions at 84 tall means ≈117 wide. Either draw it wide (112×80) as a grand temple entrance, or crop the side braziers in-code for a narrower fit — do not squash it to 64×84 or the carving distorts.

## Totals & QA

- 27 sprite PNGs, **2,481 KB total** (≈2.4 MB). Every file ≤ 191 KB (limit was 400 KB). No quantization was needed.
- `_contact.png` is a QA contact sheet (all sprites over mid-green), not a game asset.
- Verified by eye on the contact sheet + per-sprite zooms: no dark halos/fringing on green, no cut-off limbs or parts, tiles removed. Two sprites carry a whisper of base grass by design (spikes, mushroom) — reads as ground tuft in-game.
- Hard case: `bomb.png` — the bomb's near-black lower hemisphere is almost identical in colour to the sheet's dark background, so flood-fill leaked into it. It was rebuilt with a hand-measured circle restore (geometry measured from the red band + lit crown) in original colours, then fern/tile cleanup. Final result verified visually: complete sphere, band, fuse and spark, no ferns.
- Not verified: in-engine look (animation timing, draw-size feel) — that needs the integrator's build; sizes above are aspect-true starting points.

## Background plates + platform texture (2026-10-29, art-match pass)

| File | What it is | Size | KB | Source |
|---|---|---|---|---|
| bg-w1.jpg | W1 background plate v2 — scenery only, blurred/darkened (sunset valley wash) | 1600×900 | 28 | gpt-set/4-gameplay-keyart.jpg, melt 320w/r8, bright 0.74, sat 0.85 |
| bg-w2.jpg | W2 background plate v2 — scenery only, blurred/darkened (temple valley wash) | 1600×900 | 28 | gpt-set/6-dashboard-menu.png, melt 320w/r8, bright 0.74, sat 0.85 |
| bg-w3.jpg | W3 background plate v2 — scenery only, blurred/darkened (dark cave zone) | 1600×1031 | 42 | gpt-set/7-level-board.png crop x 35–70%, y 48–88%, melt 440w/r7 |
| bg-w4.jpg | W4 background plate v2 — scenery only, blurred/darkened (golden summit) | 1600×945 | 42 | gpt-set/7-level-board.png crop x 60–100%, y 0–42%, melt 440w/r7 |
| bg-crystal.jpg | Crystal Caves background plate v2 — scenery only (portal; hero cropped out, then blurred/darkened) | 1600×1067 | 71 | gpt-set/5-galaxy-portal.jpg crop x 36–100%, melt 640w/r5 |
| tex-stone.png | Tileable mossy ledge strip for stone platforms | 280×66 | 41 | cut from platform-crumble.png slab face (x 40–320, y 6–72) |

Plates: JPEG q78. Drawn cover-fit to the camera view, mirror-tiled
horizontally at 0.3× parallax under a dark veil (see DESIGN.md).

## Character sheets — 200-build (REAL ART LIVE, 2026-10-29)

Extracted from `visuals/chars-200/{zara,bolt,haddi,raja}-sheet.webp`
(2736×912, 6 poses in a row) by `rebuild/extract-chars.py`. The sheets'
bg is a near-uniform dark green and figure darks (Zara's boots ~RGB-dist
31, Haddi's coat ~71) sit close to it, so plain distance keying would
have eaten them: the extractor keys on **green-dominance + darkness**
for candidate bg, takes the **border-connected flood** of it (figure
interiors and the floor shadow — bg-coloured — are handled correctly),
then alpha = max(distance ramp, ring-distance from bg), with edge
colours decontaminated by un-blending against the bg colour. Figures
are segmented by column-mass clusters of the keyed alpha; each crop is
anchored on its solid body (±80px keeps dizzy sparkles / Bolt's loose
screw), a detached floor-shadow island below an air gap is cut for
airborne poses, and an island pass drops foreign fragments (it caught
Victory's fist sliced into Haddi's Dizzy crop by the window edge).
Scale: ONE factor per character normalising its stand content height
to **470px** (the explorer stand's content height), applied to all
poses; ~4.5% padding; anchor bottom-center, exactly like the explorer
set, so the game's fixed 50-unit draw height frames them identically.

| Character | Files (in `assets/chars/`) | Stand PNG | KB range |
|---|---|---|---|
| Zara | zaraStand, zaraRun1–5, zaraJump, zaraFall, zaraDizzy, zaraVictory | 198×512 | 87–127 |
| Bolt | boltStand, boltRun1–5, boltJump, boltFall, boltDizzy, boltVictory | 291×512 | 171–207 |
| Haddi | haddiStand, haddiRun1–5, haddiJump, haddiFall, haddiDizzy, haddiVictory | 180×512 | 87–110 |
| Sunehra Raja | — none, by design — | rides heroGold/heroDizzy | — |

Run cycles: each sheet holds ONE run pose, so Run1–5 are **derived**
(rock −2°→0°→+2°→0°→−2° around the bottom-center feet pivot + a
0/−10/−15/−10/0 px bob at sheet scale) on one shared canvas per
character; frame 5 is pixel-identical to frame 1 (seamless loop) —
the same role the explorer's five sheet frames play, and `art-test.js`
pins both properties. Sheet quirks: Haddi's sheet carried a DUPLICATE
stand figure (7 figures) — the spare was dropped. Bolt's Jump keeps
its jetpack flame (it is part of the pose; it anchors below his feet).
Bolt's Run frames carry 1–3 sub-visible ember specks near the feet
(≤3px at final scale, ~0.3 game units — noted, not retouched).
QA: contact sheet over mid-green AND near-black inspected by eye —
hair (near-black brown) and Bolt's brass/steel edges key clean, no
green fringe, no cut limbs, no shadow smears. In-engine draw is proven
headlessly by art-test §5 (real sprite drawn per selected character;
tint wash as the pre-load control). The renderer fallback chain is
unchanged: sheet → tinted explorer wash → CHAR_VIS vector palette.

## Background plates v3 — world identity (200-build)

| File | What it is | Size | Source |
|---|---|---|---|
| bg-w2.jpg | W2 Toofani Kinara plate — storm-coast wash | 1600×900 | visuals/worlds-200/world2-storm-coast-v2.webp, melt 1/10 + blur, bright 0.82, sat 0.88 |
| bg-w3.jpg | W3 Barf Crystal Gufa plate — ice-cave wash (replaces the old cave plate) | 1600×1031 | visuals/worlds-200/world3-ice-cave-v2.webp, same melt |
| bg-w4.jpg | W4 Aatish Mandir plate — volcano wash | 1600×945 | visuals/worlds-200/world4-volcano-v2.webp, same melt |
