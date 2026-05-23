# OneFleet — Extreme Direction Mockups (Round 2)

The user picked **Cyber Ops** from round 1 (`/opt/tlacak-web/build/mockups/SPEC.md`). It became the production design system. Now they want to push further — *"lebih gila dan extreme, di luar ekspektasi"*. This round explores 4 directions that take Cyber Ops as the **floor** and crank up the audacity in different dimensions.

The same screen, the same data, the same 1440×900 viewport — **only the audacity differs**.

---

## Output rules

- Single self-contained HTML file at `/opt/tlacak-web/build/mockups/<slug>.html`
- Inline `<style>`; vanilla SVG; vanilla JS only if needed for tiny effects (no frameworks)
- Google Fonts via `<link>` to `fonts.googleapis.com` is fine — use whatever the direction's fonts call for
- Material Symbols CDN font is fine for icons; or inline SVG icons — both OK
- Target viewport **1440×900**. Should look correct on 1280–1920 wide.
- This is a **screenshot-grade mockup** — must look like a real app frame
- File should be ~2000–3500 lines of high-quality HTML+CSS+SVG (extreme mockups benefit from more detail than the round-1 ones)

---

## Canonical screen content (same as round 1 — quick reference)

Live Tracking / Fleet Overview screen, with these regions:
- **Top bar (or substitute)**: brand `ONEFLEET`, primary nav (Map active · Devices · Reports · Geofences · Notifications · Settings), search, alerts bell badge **3**, user chip (initials AR · name Ahmad R. · meta Operations · Jakarta)
- **Left fleet panel**: title `FLEET · 247 units · 3 sectors`, filter chips (All · 247 / Moving · 184 *active* / Idle · 41 / Stopped · 18 / Offline · 4), search `Find vehicle…`, 10 device rows (row 1 = TRUCK-247 / B 9421 KGV / Moving 67 km/h / Ahmad Wijaya / 12s — **selected**, rows 2–10 per the round-1 SPEC).
- **Center map area**: stylized map of Jakarta–Bandung corridor, ~15 vehicle markers, selected marker (TRUCK-247) prominent with route trail, geofence polygon, compass/scale, label "SECTOR 07 · JKT–BDG CORRIDOR"
- **Right vehicle detail panel**: header `TRUCK-247 / B 9421 KGV`, status `MOVING 67 km/h NW`, driver Ahmad Wijaya · ID #4471 · +62 812 4471 2208, location Jl. Sudirman / -6.2087, 106.8456 / 12s ago, telemetry 2x2 (Ignition ON since 03:12 / Fuel 68% ~340 L / Battery 12.4 V / Engine 24°C), today stats (Distance 247 km · Driving 6h 12m · Stops 4 · Alerts 1), mini sparkline speed last 60min, action row (Commands · History · Geofence · Send message)
- **Bottom metrics strip**: TOTAL 247 · MOVING 184 (74.5%) · IDLE 41 (16.6%) · STOPPED 18 (7.3%) · OFFLINE 4; alerts ticker (3 active: Speed limit · TRUCK-189 · 92 km/h in 60 zone · 02:51 / Geofence exit · VAN-118 · Pulogadung Warehouse · 03:14 / Idling >10m · PICKUP-042 · Senayan · 03:36); clock `03:47:21 WIB` · Fri, May 23 · 2026

Use **all this data** in every direction. The "extreme" is the visual + interaction layer wrapping it.

---

## Direction 1 — `extreme-defcon` · DEFCON · MISSION THEATRE

**File:** `/opt/tlacak-web/build/mockups/extreme-defcon.html`

**Vibes:** Hollywood mission control gone unhinged. NORAD × Hideo Kojima cutscenes × Watch_Dogs Legion × War Games. "We are at war with idling trucks."

**Palette (extends Cyber Ops):**
- Base Cyber Ops: `#000814` page, `#0a0e27` panels, `#00ffc8` primary, `#ff3864` alert, `#ffaa00` warn, `#b026ff` purple, `#d6e6ff` text, `#6a7888` dim
- DEFCON levels: 1=`#ff0033`, 2=`#ff3864`, 3=`#ffaa00`, 4=`#00ffc8`, 5=`#6a7888`
- Vignette darkening at corners: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)` overlay

**Typography:**
- Hero numbers: **Big Shoulders Display** weight 900 OR **Audiowide** OR **Orbitron** — pick chiseled mission-feel
- All labels & body: **JetBrains Mono Variable** uppercase tracked

**Signature treatments:**
1. **Boot-sequence side panel** (visible as decoration, ~200px wide column on far left or bottom): looks like the app just booted. Lines like:
   ```
   > INIT BUS         [OK]
   > LOAD TELEMETRY   [OK]
   > AUTH CREDENTIALS [OK]
   > SOCKET BIND      [OK]
   > FLEET SYNC       [OK]
   > STATE ESTABLISHED
   _
   ```
   Type appears char-by-char via CSS animation (`@keyframes typewriter`).
2. **DEFCON ring widget** in top-right corner: 5 concentric circles labeled 5→1, current level (e.g. DEFCON-3) highlighted with pulsing amber glow. SVG.
3. **CRT scanlines** at higher intensity than baseline (use `.cyber-scanline` but darker)
4. **Chromatic aberration** on every hero title and big number: use `::before` / `::after` with `text-shadow: 2px 0 #ff3864, -2px 0 #00d4ff`
5. **Vignette** corner darkening on the whole page
6. **Radar sweep** on map: rotating 90° cyan cone with 4s cycle (CSS `@keyframes` rotate on a conic-gradient SVG)
7. **Crosshairs** at center of map (subtle, persistent)
8. **Coordinate grid overlay** on map with tick marks every N units
9. **Persistent oscilloscope strip** at very top or bottom (~6px tall): fake waveform of "incoming WebSocket traffic" — SVG polyline animated horizontally
10. **Mission timer** in top corner: `MISSION TIME 04:23:47:12` format (HH:MM:SS:FF — last field counts faster)
11. **Satellite link indicator** with 4 bars (3 active)
12. **Alert pop-in** (rendered as a fixed splash near top): "INCOMING TRANSMISSION · SPEED LIMIT EXCEEDED · TRUCK 189 · 92 KM/H" with red border + chromatic aberration title + ASCII corner bracket frames `┏┓ ┗┛`
13. **Glitch effect** triggered every ~5s on a random label (chromatic split intensifies briefly via JS)
14. **StatusCard hero number**: massive (96px+) with chromatic aberration + radial gradient text fill
15. **Speaker icon with bars** suggesting ambient hum (visual cue for audio, no actual sound needed)
16. **Bottom strip metrics**: each as a SEGMENTED counter (display blocks like an old digital clock — use solid blocks with hairline gaps)
17. **Map**: dark with cyan grid + crosshair + radar sweep + glowing markers; selected marker has a brighter halo + animated targeting brackets locking onto it
18. **At least one ASCII art element** somewhere (e.g. `▓▒░` blocks decorating a section divider)

Push the audacity. Make it look like a movie prop.

---

## Direction 2 — `extreme-holo-ops` · HOLO-OPS HUD

**File:** `/opt/tlacak-web/build/mockups/extreme-holo-ops.html`

**Vibes:** Mass Effect × Destiny 2 × Death Stranding × Iron Man's HUD. Augmented-reality projection on glass. Every element looks like it's being beamed onto a transparent surface.

**Palette (extends Cyber Ops):**
- Base: Cyber Ops palette
- Holographic split: layer cyan `#00ffc8` + magenta `#ff00ea` + violet `#b026ff` with 2-3px offset to simulate holographic chromatic split
- Particle/ambient: white at 30-40% opacity for "interference" dots
- Background: deep gradient — `radial-gradient(ellipse at 30% 20%, rgba(0,212,255,0.06), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255,0,234,0.05), transparent 50%), #050817`

**Typography:**
- Display hero: **Orbitron** weight 700 OR **Exo 2** OR **Audiowide** — angular, mil-spec
- Body: **Rajdhani** OR **Inter** Light/Regular — clean and slightly futuristic. **NOT mono** for this one — break that convention.
- Caps tracked labels stay in JetBrains Mono for the data layer

**Signature treatments:**
1. **Perspective skew on every panel** — `transform: perspective(2400px) rotateY(-3deg)` on left panel, `rotateY(3deg)` on right panel, makes panels feel like floating glass
2. **Holographic chromatic split** on key titles: layered text with red+cyan offset clones
3. **Frame corner brackets** on every panel: `┏┓ ┗┛` shaped SVG corners (3-4 chunky brackets at panel corners)
4. **Targeting reticles for vehicle markers**: each marker is a center dot with `[` `]` brackets opening outward + a tiny range/heading readout
5. **Selected vehicle marker**: brackets pulse + a lock-on circle animation that shrinks to engage
6. **Speedometer dial** on the right panel for selected vehicle: 270° circular arc with animated needle, glow trail behind needle, "67 KM/H" big in center
7. **Procedural particle field** as background: scattered white dots at low opacity, slowly drifting (multiple absolutely-positioned spans with CSS animations)
8. **Holographic interference noise**: SVG `<filter>` with `feTurbulence` overlaid at low opacity
9. **Floating notification pop-in** (visible as a fixed element): `[ INCOMING TRANSMISSION ] · SPEED LIMIT EXCEEDED · TRUCK_189` rendered with chromatic split + perspective skew
10. **Cursor as targeting reticle**: define a CSS cursor via `cursor: url("data:image/svg+xml,...") 12 12, default;` — render a SVG reticle in the data URI
11. **Mini compass dial** with degree readouts (e.g. "327° NW") near the map
12. **DRONE FEED inset**: small 200x120 inset showing a fake satellite/wireframe map (could be a tiny SVG with grid + a few dots) — labeled "DRONE FEED · LIVE"
13. **Holographic data stream lines** connecting some elements (faint SVG curves from device list to map markers, like wires)
14. **"AMMO COUNTER" style metric tiles** in bottom strip: bracketed counts like `[ 184 / 247 ]` with monospace, plus a tiny "fuel bar" style indicator
15. **Edge frame bars**: vertical lines on left + right edges of the viewport, with corner brackets
16. **Lock-on animation** on the selected device: animated brackets converge inward (CSS keyframes)
17. **Subtle parallax**: background drifts slower than foreground (different transform speeds)
18. **Glow/bloom on cyan elements**: heavier than baseline Cyber Ops — really feels luminescent
19. **Map**: dark base with abstract roads, vehicles as targeting reticles with brackets + range readouts, selected vehicle has a CINEMATIC lock-on with rotating outer ring + corner brackets shrinking in
20. **"SCAN COMPLETE" / "TARGET ACQUIRED" mini-banner** somewhere

Push for the FEEL that everything is projected on a sci-fi HUD surface. Slight 3D, holographic, luminescent.

---

## Direction 3 — `extreme-terminal-theatre` · TERMINAL THEATRE

**File:** `/opt/tlacak-web/build/mockups/extreme-terminal-theatre.html`

**Vibes:** retro tmux/htop session × NeoVim × Cool Retro Term × Hackmud. The entire application IS a terminal session. There is no GUI — there is only the terminal.

**Palette:**
- Background: `#0a0e0d` (slight green-tinged dark, very near-black)
- Primary phosphor: `#00ffc8` (cyan-mint, our Cyber Ops primary)
- Secondary phosphor (for variety): `#a0ffd6` (paler cyan)
- Amber accent: `#ffaa00` (warn)
- Error red: `#ff3864`
- Comment/dim: `#5a8a7f` (muted cyan-gray)
- Selection highlight: cyan bg + dark text (inverse video)
- Optional: very subtle CRT phosphor decay glow on every character

**Typography:**
- 100% **JetBrains Mono Variable** — no exceptions
- Optional: **VT323** or **IBM Plex Mono** for the ASCII banner header (figlet-style)
- Optional: **Inconsolata** for body

**Signature treatments:**
1. **Top header bar with tab indicators** like tmux/NeoVim: `[1] map · [2] devices · [3] reports · [4] settings · [5] geofences · [6] notifications` — current tab highlighted via inverse video
2. **ASCII art ONEFLEET banner** (3-5 lines of figlet-style chunky letters) somewhere prominent — could be on a splash card or as the top-left brand
3. **Every panel is rendered with box-drawing chars** as borders: `╔═══════ FLEET STATUS ═══════╗ ║ ... ║ ╚══════════════════════════╝`
4. **Device list as a table** with box-drawing borders:
   ```
   ┌────┬───────────┬────────────┬─────────┬──────────────┬──────┐
   │  # │ DEVICE    │ PLATE      │ STATUS  │ DRIVER       │  AGO │
   ├────┼───────────┼────────────┼─────────┼──────────────┼──────┤
   │  1*│ TRUCK_247 │ B 9421 KGV │ MOVING  │ Ahmad W.     │  12s │
   │  2 │ VAN_118   │ B 2284 PCD │ MOVING  │ Siti N.      │  24s │
   ...
   ```
   Selected row has `*` marker AND inverse-video highlight
5. **Status indicators as colored block characters**: `[●]` cyan for moving, `[●]` amber for idle, `[●]` magenta for stopped, `[○]` dim for offline
6. **Metrics as ASCII progress bars**:
   ```
   TOTAL   [████████████████████] 247
   MOVING  [██████████████░░░░░░] 184  74.5%
   IDLE    [███░░░░░░░░░░░░░░░░░]  41  16.6%
   STOPPED [█░░░░░░░░░░░░░░░░░░░]  18   7.3%
   OFFLINE [░░░░░░░░░░░░░░░░░░░░]   4
   ```
7. **Map as ASCII wireframe**: use `▓ ▒ ░` shading + `─ │ ┌ ┐ └ ┘ ╱ ╲` for roads + `╳` or `▲` for vehicle markers. Selected marker is a different char (`◉` or `█`) with bracket highlight `[█]`. Add a few labels like `JKT`, `BDG`, `BKS`, `PUL` in tiny mono
8. **Persistent bottom prompt** with blinking cursor:
   ```
   onefleet@control:~$ _
   ```
   The cursor `_` blinks via CSS
9. **Above the prompt, a scrolling event log** (last 10-15 entries, latest at bottom):
   ```
   [14:32:11] device.move    TRUCK_247   67km/h   Jl.Sudirman
   [14:32:14] alert.speed    TRUCK_189   +32% over     Sektor 7
   [14:32:18] geofence.exit  VAN_118     PulogadungWarehouse
   ...
   ```
   Each line color-coded: `device.*` cyan, `alert.*` red, `geofence.*` amber. Optional: latest line typing in char-by-char (CSS animation).
10. **vim-status-line at bottom**: ` -- NORMAL --  ` left,  ` LIVE | 247u | 3sec | 03:47:21 WIB ` right (terminal status-line look)
11. **Selected vehicle StatusCard as a "man-page" or "info-page"**:
    ```
    ╔═══════ TRUCK_247 ════════════════════════════╗
    ║ PLATE      B 9421 KGV                          ║
    ║ STATUS     MOVING  67km/h NW                   ║
    ║ DRIVER     Ahmad Wijaya  ID #4471              ║
    ║ LOCATION   Jl. Sudirman, Jakarta Pusat         ║
    ║ COORDS     -6.2087, 106.8456                   ║
    ║                                                ║
    ║ TELEMETRY                                      ║
    ║   ignition   ON   since 03:12                  ║
    ║   fuel       68%  [██████████████░░░░░] ~340L  ║
    ║   battery    12.4 V                            ║
    ║   engine     24°C                              ║
    ║                                                ║
    ║ SPEED LAST 60m                                 ║
    ║   80 ┤   ╱╲    ╱╲                              ║
    ║   60 ┤  ╱  ╲  ╱  ╲╱╲    ╱╲                     ║
    ║   40 ┤ ╱    ╲╱      ╲  ╱  ╲                    ║
    ║   20 ┤╱              ╲╱    ╲                   ║
    ║      └─────────────────────────────►           ║
    ║                                                ║
    ║ ACTIONS  :c command  :h history  :g geofence   ║
    ╚════════════════════════════════════════════════╝
    ```
12. **Sparkline rendered as ASCII** using `▁▂▃▄▅▆▇█` block characters in a row
13. **Optional: filter chips as inverse-video keystroke hints**: ` [a]LL  [m]OVING  [i]DLE  [s]TOPPED  [o]FFLINE `
14. **Cursor blink** on the prompt — true blink animation
15. **Subtle CRT effects**: very subtle scanlines + faint phosphor glow on text + slight chromatic edge on cyan text
16. **Optional decorative help text** at bottom-right: `:q quit  :w save  /find  ?help`
17. **The map can have grid coordinates** like `(106.8E, -6.2N)` as a tiny label
18. **Mouse interactions** still work (clicks, hovers) — we're rendering terminal style but it's still web

CRITICAL: This must feel like you're looking at a *real terminal session*, not just "dark monospace". Box-drawing chars, ASCII art, progress bars, log streams, blinking cursor — commit fully.

---

## Direction 4 — `extreme-organism` · ORGANISM (anti-dashboard)

**File:** `/opt/tlacak-web/build/mockups/extreme-organism.html`

**Vibes:** Blade Runner 2049 hologram × bioluminescent ocean × Solarpunk × Apple Vision OS evolved beyond product. The fleet is a colony of organisms. The interface IS the data, not a wrapper around it.

**Palette:**
- Background: near-black `#010102` or pure `#000000` with subtle radial gradient toward `#02050a` at center
- Bioluminescent cyan `#00ffc8` for "alive/moving" vehicles
- Amber `#ffaa00` for "idle"
- Dim purple `#7b1fa2` (less saturated than mockup-1 purple) for "stopped"
- Almost-invisible tendrils: `rgba(0,255,200, 0.08-0.20)` — animated
- Aura/glow: heavy `filter: blur(8-24px)` on glow halos
- Text: `rgba(214,230,255, 0.6-0.9)` — never pure white

**Typography:**
- Body: **Inter** weight 200 (ExtraLight) — feathery and futuristic-organic
- Hero (only when shown): **Inter** weight 100 (Thin) at 48-96px
- Small data labels: **JetBrains Mono** Light (300) for the few mono moments
- Optionally use lowercase for poetic feel ("two hundred forty-seven" rather than "247")

**Signature treatments — this is the most counter-intuitive one, lean in hard:**
1. **NO TOP BAR by default. NO PANELS by default. NO MENUS by default.** The viewport opens to a black field with glowing cells.
2. **Vehicles as bioluminescent cells**: SVG circles with multi-layer radial gradient glow (a small bright core + a soft halo + a wider very-soft aura)
3. **Each cell pulses at its own rhythm**: different CSS animation durations (1.8s, 2.4s, 3.1s, 2.7s, etc.) so the field feels organic, not synchronized
4. **Cell color = status**: cyan-bright = moving, amber-warm = idle, purple-dim = stopped, near-invisible gray dot = offline
5. **NO base map tiles**. Just the constellation of cells positioned roughly per the corridor geography. Optional: very faint hairline rendering of the coastline + Jakarta-Bandung edge for context, opacity 0.04-0.08
6. **Constellation lines**: faint cyan lines connecting nearby vehicles (within ~120px) — render as SVG `<line>` with low opacity. Add a slow drift animation to make them feel alive.
7. **Selected vehicle (TRUCK-247)**: significantly larger glow halo. Tendrils unfurl from it as SVG curved paths in 4-6 directions, each ending in a tiny floating label (e.g. one tendril to "Ahmad Wijaya · driver", another to "Pulogadung Warehouse · geofence", another to "12s ago · last ping", another to "67 km/h · current speed", another to "247 km · today")
8. **Tendrils animate**: SVG path drawing animation (stroke-dasharray + stroke-dashoffset trick) on appear; gentle drift on idle (slight bezier wobble)
9. **Hover anywhere** shows a faint compass rose at cursor position (visible as decoration in the static mockup — place one somewhere)
10. **Top-right corner — the ONLY persistent UI text**: minimal cluster `247 · LIVE` with tiny pulsing dot
11. **Bottom-left corner**: muted timestamp `// 03:47:21 · sektor tujuh` in lowercase
12. **Hover on a cell reveals**: ethereal floating tooltip with sparse type — just `truck 247 · 67km/h` for example, with very low opacity background
13. **Click on a cell zooms slightly** + tendrils unfurl — show this state in the mockup with TRUCK-247 selected
14. **Poetic copy**: somewhere on the page, render a sparse poetic sentence like:
    > forty-one in stasis · one hundred eighty-four in motion · four invisible
    
    Lowercase italics, very small.
15. **Subtle constellation grid**: extremely faint dotted grid (1px dots every 60px) as backdrop hint
16. **Audio cue** (just visual representation since mockup): tiny waveform at top-right under the LIVE counter, suggesting "ambient pad — shifting tone with fleet status"
17. **The whole page "breathes"**: subtle CSS animation on the body (opacity 0.96-1 cycling over 8s) to make the entire interface feel alive
18. **Alerts rendered as subtle red-shifted cells** (the 3 alert vehicles glow with a slight magenta shift — not loud, but noticeable)
19. **Ethereal text for the selected vehicle data** — instead of a panel, the data floats around the selected cell at calculated angles:
    - Top: `truck 247`
    - Right: `67 km/h · northwest · jl. sudirman`
    - Bottom-right: `ahmad wijaya · driver · 4471`
    - Bottom: `247 km today · 4 stops · 1 alert`
    - Left: `12 seconds ago · ignition on · fuel 68%`
    - Top-left: `mission control · sektor tujuh`
20. **Sparkline as a glowing trail** along the bottom of the selected cell — represents the route trail through abstract space

CRITICAL: This is **anti-dashboard**. No panels, no buttons, no tables, no chrome. Resist the urge to add a header bar. The mockup should feel like watching a colony of organisms, where the data emerges from the cells themselves through hover/selection. It should look unlike anything anyone has built for a fleet-tracking app.

---

## Process (every direction)

1. **Invoke the `frontend-design` skill** (Skill tool) — production-grade UI work
2. Build the screen as a single self-contained HTML file at your assigned path
3. Do not write any files outside `/opt/tlacak-web/build/mockups/`
4. Do not commit, do not deploy — just write
5. When done, return a short summary (~60 words): file path, file size, 2-3 things that landed as "out of expectation"

## Quality bar

Each mockup will be served at `https://1f.val.id/mockups/<slug>.html` for direct comparison. The user is reviewing them looking for **surprise** — something they did NOT think of. Lean fully into your direction. Do not play it safe.
