# OneFleet — Round 3 Direction Mockups (Research-Backed)

This is the **third** round of design direction exploration for OneFleet (a fleet-tracking web app, production at https://1f.val.id). Rounds 1 & 2 produced 8 directions ideated from scratch; the user picked Cyber Ops for production. Round 3 is informed by **real concrete research** across 4 domains (web dashboard trends 2026, gaming HUDs, adjacent enterprise tools, fleet tracking competitors). Each direction below is BACKED by specific real-world references.

The same screen content, same data, same 1440×900 viewport — only the audacity differs.

---

## Output rules

- Single self-contained HTML file at `/opt/tlacak-web/mockups/<slug>.html`
- Inline `<style>`; vanilla SVG; vanilla JS only if needed for tiny effects (no frameworks)
- Google Fonts via `<link>` is fine — use whatever the direction's fonts call for
- Material Symbols CDN OR inline SVG icons — both OK
- Target viewport **1440×900**. Correct on 1280–1920 wide.
- This is a screenshot-grade mockup — must look like a real polished frame
- ~2500–3500 lines

---

## Canonical screen content (reminder — same as rounds 1 & 2)

Live Tracking / Fleet Overview:
- Brand: **ONEFLEET** · Time: **03:47:21 WIB** · Fri, May 23 · 2026
- Fleet size: **247 units** across 3 sectors
- Status breakdown: TOTAL 247 · MOVING 184 (74.5%) · IDLE 41 (16.6%) · STOPPED 18 (7.3%) · OFFLINE 4
- Selected vehicle: **TRUCK-247** · plate **B 9421 KGV** · MOVING 67 km/h NW
- Driver: **Ahmad Wijaya** · ID #4471 · +62 812 4471 2208
- Location: **Jl. Sudirman, Jakarta Pusat** (-6.2087, 106.8456) · last update 12s ago
- Telemetry: Ignition ON since 03:12 · Fuel 68% (~340 L) · Battery 12.4 V · Engine 24 °C
- Today: 247 km · 6h 12m driving · 4 stops · 1 alert
- 3 active alerts: Speed limit · TRUCK-189 · 92 km/h in 60 zone · 02:51 / Geofence exit · VAN-118 · Pulogadung Warehouse · 03:14 / Idling >10m · PICKUP-042 · Senayan · 03:36
- Device list (10 visible): TRUCK-247 (selected, B 9421 KGV, 67 km/h, Ahmad W., 12s) / VAN-118 / TRUCK-203 / VAN-095 / TRUCK-189 / PICKUP-042 / TRUCK-221 / VAN-176 / TRUCK-198 / PICKUP-067 — each with plate, status, speed, driver, ago

Map area: Jakarta–Bandung corridor, ~15 vehicle markers, selected vehicle prominent with route trail, geofence polygon, compass.

How you ORGANIZE this data is direction-specific. Each direction may break the conventional "left panel + center map + right panel + bottom strip" layout. See per-direction sections.

---

## Direction 1 — `r3-chart-table` · CHART TABLE

**File:** `/opt/tlacak-web/mockups/r3-chart-table.html`

**Vibes:** A working dispatcher's chart table — the map IS the entire canvas, data lives ON the vehicles (diegetic), reference overlays slide like tracing paper. Feels like Felt × Foursquare Studio × Dead Space's RIG suit × Star Citizen cockpit.

**Real research refs:**
- **Felt** (https://felt.com/) — collaborative map "Google Doc for maps", multiplayer cursors, annotation on geospatial canvas — fleet ops as multiplayer not single dispatcher
- **Foursquare Studio / kepler.gl** (https://foursquare.com/products/studio/) — WebGL rendering millions of points
- **Dead Space (2023 remake) diegetic UI** (https://www.gameuidatabase.com/gameData.php?id=1679) — data lives on the subject (Isaac's RIG spine), not in floating panels
- **Star Citizen cockpit** (https://www.hudsandguis.com/home/star-citizen-revisited-part-1) — shared component vocabulary for 45 ships
- **ashMeteo** (https://meteo.ashwyn.studio) — fused map + time-series as one navigable terrain

**Palette:**
- **Custom Jakarta-at-2am dark basemap**: pure black ocean `#020308`, deep navy land `#0a1224`, near-black district outlines `#1a2440`, faint hairline roads `rgba(214,230,255,0.10)`, primary roads brighter `rgba(0,255,200,0.18)`, NO labels except tiny district names in mono italic at low opacity
- Vehicle markers: cyan glow `#00ffc8` (moving), amber `#ffaa00` (idle), purple-dim `#7b1fa2` (stopped), gray ghost `#3a4a5e` (offline)
- Selected marker: brighter halo + diegetic data card attached
- Overlays (tracing paper): cream `#f5ebd6` with multiply blend, low opacity
- Text on map: white `#d6e6ff` with thin shadows for legibility

**Typography:**
- JetBrains Mono Variable everywhere (consistent with our production)
- Hero numbers can be 'Inter' Black for occasional emphasis
- Tiny district labels in italic mono at 9-10px

**Signature treatments — lean in:**
1. **NO sidebar. NO right panel. NO bottom strip by default.** The map is the canvas, period.
2. **Custom dark basemap** rendered as SVG (Jakarta–Bandung corridor) — coastline, major rivers (Ciliwung), Cipularang highway, Pantura coastal road, district outlines. Stylized but readable as a map.
3. **Diegetic vehicle data**: each vehicle marker is a small circle with a thin orbit ring. Speed shown as orbit-ring rotation speed. Fuel as a small arc on the ring (270° = full). Status as fill color. Driver initials in tiny letters inside the circle. Heading as a tiny arrow on the orbit.
4. **15 vehicles** scattered across the map per the canonical data. Selected (TRUCK-247) is 2x larger with a brighter halo + a "diegetic data card" floating right next to it (not in a side panel) showing: plate, driver, big speed, fuel arc, today stats, mini sparkline. The card is connected to the marker by a thin animated line — the data is **anchored to the vehicle**.
5. **Multiplayer ghost cursors**: 2-3 ghost cursors (other dispatchers) drifting on the map with tiny initials (e.g. "RZ", "WP") — Felt-style. Don't make them too prominent, just visible.
6. **Tracing-paper overlays** at corners: small movable panels (visually shown in mockup) like "Layer · Geofences" (toggle on), "Layer · Live Routes" (toggle on), "Layer · Traffic" (toggle off), "Layer · Weather" (toggle off). Look like sticky-note overlays, slight rotation, translucent paper texture.
7. **Top-left**: minimal cluster `// ONEFLEET · sektor tujuh · 03:47:21` — the only persistent chrome
8. **Top-right**: filter/search affordance as a single mono pill `find vehicle…  ⌘K` and a small `247 LIVE` indicator
9. **Bottom-left**: a "command palette hint" `⌘K to jump · ⌘B browse layers · ⌘? help`
10. **Bottom-right**: tiny scale bar + compass rose (proper cartographer touches)
11. **Vehicle route trail** for TRUCK-247: dotted cyan path showing last ~30km, fading toward the start
12. **Geofence polygon**: tracing-paper rectangle around "Pulogadung Warehouse" with thin dashed border + tiny label, light cream tint
13. **Alert vehicles** (TRUCK-189, VAN-118, PICKUP-042): subtle red pulse on their markers — minimal but noticeable
14. **An alert ribbon** at top (or maybe as another tracing-paper overlay): 3 active alerts in mono caps, can be flipped through. Looks like a clip-on note.
15. **Mobile gesture hints** at very bottom edge: tiny mono text `pan · pinch · two-finger rotate`

The point: the dashboard genuinely IS the map. Every piece of fleet data emerges from the geography. No chrome to abstract it.

---

## Direction 2 — `r3-riso-ops` · RISO OPS · PRINT ROOM

**File:** `/opt/tlacak-web/mockups/r3-riso-ops.html`

**Vibes:** A 1970s dispatch print room. Warm off-white paper, two-color riso (one ink for state, one for live data), monospace tables with column rules, micrographic legends, occasional ransom-note moments. Analog, tactile, **trustworthy**. The lo-fi counter-trend that 2026 designers are starting to embrace — Charlotte Rohde, It's Nice That trend report, the riso aesthetic crossing from print into UI. **180° from Cyber Ops** — light, warm, paper-based.

**Real research refs:**
- **Charlotte Rohde — Oficía Mono "warning low ink"** (https://www.itsnicethat.com/features/forward-thinking-graphic-trends-2026-graphic-design-120126) — print/xerox aesthetic leaking into UI, degraded ink, micrographics-as-texture
- **It's Nice That 2026 trend report** — risograph, ransom-note hierarchy
- **Dirac.com** (https://www.dirac.com) — pure B/W restraint
- Independent zine/print room aesthetics (printed dispatch sheets, ledgers, manifests)

**Palette:**
- Page background: **warm off-white paper** `#f5ebd6` (with subtle paper grain texture overlay via SVG noise filter or repeating background)
- Ink 1 — **structural ink**: deep cyan-teal `#1d4f5e` (used for hairlines, headers, structural type) — riso teal
- Ink 2 — **state ink**: warm vermilion `#d94f2a` (used for alerts, MOVING status, key data points) — riso orange
- Ink 3 — **dim ink**: warm brown-gray `#7a6a52` (used for secondary text, dim labels)
- Optional ink 4 — **deep ink**: near-black-brown `#1a140e` (for headlines, top mast)
- Texture: subtle paper grain (`<filter feTurbulence>` at very low opacity) + occasional ink mis-registration (1-2px color offset on a few elements for that "riso slightly misaligned" feel)

**Typography:**
- Display / mast: **Oficía Mono** (use a substitute like 'JetBrains Mono' weight 700 OR 'IBM Plex Mono Bold' OR 'Anonymous Pro Bold') — sturdy mono with character
- Body: **GT America Mono** or **JetBrains Mono Variable** weight 400-500
- Italics: an italic serif for occasional accent — **Söhne** or **GT Sectra** italic (sub: 'Crimson Pro' italic or 'Spectral' italic)
- Numbers: same mono, tabular numerals
- Optional ransom-note moments: occasionally mix a 2-3 word fragment in a sans condensed (like 'Archivo Narrow') for emphasis — but sparingly, like a stamp

**Signature treatments — lean into the print room:**
1. **Top mast like a printed dispatch sheet**:
   ```
   ┌──────────────────────────────────────────────────────────────┐
   │  ONEFLEET DISPATCH      vol. xxiv · no. 143    fri may 23 2026│
   │  ──────────────────────────────────────────────────────────  │
   │  jakarta operations · sektor tujuh · 03:47 wib               │
   └──────────────────────────────────────────────────────────────┘
   ```
2. **Numbered sections** like a printed manifest — § 01 · LIVE STATUS, § 02 · ACTIVE UNITS, § 03 · ALERTS, § 04 · SELECTED · TRUCK-247
3. **Tabular data with visible column rules**: every table has 1px deep-teal hairlines between columns, alternating row tints (`#f5ebd6` and `#efe4cb`)
4. **Status indicators as PRINTED-CHARACTER shorthand**: not colored badges — instead use `▲` for moving (vermilion), `■` for idle (brown), `□` for stopped (brown outline), `·` for offline (gray dot). Like a typewriter chart.
5. **Big numbers in hero positions** are SET like newspaper folio numbers — Oficía Mono Bold at 72-96px, with a "page number" feel
6. **Micrographics legend**: a small ASCII-style legend somewhere showing what each marker means, like a printed map legend
7. **Map** rendered as **woodblock / engraved print style**: cream paper background, deep-teal hairlines for roads + coastlines + district outlines, hatching for water (diagonal lines `///`), tiny serif italic labels for districts/landmarks. Vehicle markers as small filled dots (vermilion for moving, brown for idle), the selected one as a tiny vermilion circle with a serif label callout. Compass rose as a classical 16-point engraved rose.
8. **Selected vehicle dossier** rendered as a typed dispatch form:
   ```
   § 04 · UNIT TRUCK-247                       last seen 12s ago
   ─────────────────────────────────────────────────────────────
   plate ............. B 9421 KGV          driver .... ahmad wijaya
   speed ............. 67 km/h ▲ NW         id ........ #4471
   location .......... jl. sudirman, jkt    phone ..... +62 812-4471
   ignition .......... on since 03:12       fuel ...... 68% (~340 L)
   battery ........... 12.4 V               engine .... 24°C
   today distance .... 247 km               driving ... 6h 12m
   stops ............. 4                    alerts .... 1
   ```
9. **A small "stamped" element** somewhere — like a circular cyan-teal stamp that says `LIVE · OPS · 03:47` with a thin border, slightly rotated, as if a print operator stamped the sheet
10. **Active alerts** in a bordered "errata" box at the side, like printed errata in a journal: vermilion ink, with `※` glyph marks
11. **Tiny page footer**: `ONEFLEET · dispatch sheet · printed 03:47:21 wib · page 1 of 1 · for operational use`
12. **Subtle ink-bleed effect** on key headers: a soft glow (2-3px) of the ink color at very low opacity to suggest ink absorbing into paper
13. **Paper grain texture**: very faint noise overlay across the whole page
14. **Occasional 1-2px color offset** on a single element (one big number or one section header) to suggest riso mis-registration
15. **Italic serif pull-quotes** for sparse poetic moments: e.g. *"two hundred forty-seven units · seventy-four percent in motion · this hour."* — set in italic GT Sectra-like serif, deep brown

Don't fall back to "modern minimalist". Lean into the **printed dispatch sheet** aesthetic. Add micro-details that suggest the page came off a real press.

---

## Direction 3 — `r3-living-physics` · LIVING PHYSICS

**File:** `/opt/tlacak-web/mockups/r3-living-physics.html`

**Vibes:** An interface where every surface has weight. **Depth IS a data channel.** Recessed = parked/inactive. Elevated/protruding = active/incident. Hover lifts. Press recesses. The UI feels physically present — like reaching into a cockpit panel — without going full skeuomorphism. Sentry's S.C.R.A.P.S. tactile design language + visionOS 26 spatial widgets (elevated object vs. recessed portal) + Cloudflare modular lock-together blocks. **First fleet ops app to use depth as semantic.**

**Real research refs:**
- **Sentry S.C.R.A.P.S. redesign** (https://blog.sentry.io/sentry-has-a-bold-new-look/) — buttons lift on hover and recess on press, form inputs sink subtly, the only major enterprise SaaS in 2025 that added perceived physicality instead of removing it
- **visionOS 26 Spatial Widgets** (https://www.apple.com/newsroom/2025/06/visionos-26-introduces-powerful-new-spatial-experiences-for-apple-vision-pro/) — two mounting styles (elevated vs. recessed/portal), texture options (glass, paper), depth as semantic signal
- **Cloudflare Dashboard Redesign** (https://blog.cloudflare.com/redesigning-cloudflare/) — modular lock-together architecture, every setting in a named module, zero ornamental gradients

**Palette:**
- Stays on the Cyber Ops dark foundation but with **richer surface layering**:
- Page background: `#04060c` (deeper than Cyber Ops base — to make elevated surfaces really pop)
- Recessed surface (parked, inactive): `#020408` with inset shadow `inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(0,255,200,0.06)` — actually carved into the page
- Base surface (default panels): `#0a0e27` (Cyber Ops panel color)
- Elevated surface (active, incident): `#11163a` with shadow `0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,200,0.18)` — protruding
- Floating surface (alerts, in-focus): `#1a2050` with stronger shadow `0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,200,0.32), 0 0 32px rgba(0,255,200,0.18)`
- Accent: cyan `#00ffc8` (primary), alert red-magenta `#ff3864`
- Text: standard Cyber Ops `#d6e6ff` / `#6a7888`

**Typography:**
- Stay with **JetBrains Mono Variable** for full consistency with our shipped Cyber Ops production (this is meant as an evolution, not a replacement)

**Signature treatments — depth as data channel:**
1. **Five elevation levels**, each with semantic meaning:
   - `recessed-deep` (−4px equivalent shadow inset): offline / no data
   - `recessed-shallow` (−2px inset): idle / parked
   - `flat` (0): default informational
   - `elevated-shallow` (+2px shadow): active / moving
   - `elevated-tall` (+6px shadow): in-incident / alert / focused
2. **Device list rows** use elevation per status:
   - TRUCK-247 (selected + moving) = `elevated-tall` with cyan glow rim
   - Other moving vehicles = `elevated-shallow`
   - Idle (VAN-176, TRUCK-203) = `flat`
   - Stopped (PICKUP-042) = `recessed-shallow`
   - Offline = `recessed-deep`
3. **Bottom metrics strip tiles** also use elevation:
   - MOVING tile (184) = `elevated-tall` (most active)
   - IDLE tile (41) = `flat`
   - STOPPED tile (18) = `recessed-shallow`
   - OFFLINE tile (4) = `recessed-deep`
   This means the strip looks like a **physical mixing board** with sliders at different heights
4. **Hover lift**: every interactive element lifts 1-2px on hover with shadow expansion. Press recesses.
5. **Card edge highlights**: every elevated card has a 1px top edge highlight `border-top: 1px solid rgba(0,255,200,0.32)` — like light catching the top of a physical surface
6. **Inset shadows** on recessed cards: `inset 0 2px 6px rgba(0,0,0,0.7)` — they look carved into the page
7. **The selected vehicle panel** (right side) FLOATS above everything — strong shadow + cyan glow halo, clearly a different plane
8. **Alert ribbon** at top: also floats, with a pulsing tall shadow when an alert is active
9. **Top bar** sits flush (flat 0 elevation) — frame for everything else
10. **Map area** is at `flat` level by default. Selected vehicle marker is `elevated-tall` with shadow on the map plane. Idle vehicles are at `recessed-shallow`. Alert vehicles `elevated-tall` with red glow.
11. **The "incident" tile** for active alerts is the TALLEST element on screen — you should be able to tell at a glance "there's an incident" purely from height/shadow without reading text
12. **Telemetry tiles in the StatusCard** use elevation: IGNITION ON = elevated, FUEL = flat, BATTERY = flat, TEMP = recessed (cool stable)
13. **Buttons**: filled buttons are elevated by default; ghost buttons are flat; disabled buttons are recessed
14. **Cyber-grid background** persists but ONLY in recessed planes (so you see the grid in the page background, but elevated cards cover it cleanly)
15. **Soft light source** simulated from top-center: subtle gradient overlay making top edges slightly brighter, bottom edges slightly darker — physically consistent lighting across all surfaces
16. **A tiny "elevation legend"** somewhere small (corner): shows the 5 elevation levels with their meanings — like a key for what depth means in this UI
17. **Selected device row in left panel** has an animated subtle "rise" — like it's been lifted out

The layout is broadly similar to Cyber Ops production but **every surface communicates state through physics, not just color**. The user should be able to read the operational state from a 5-meter distance.

---

## Direction 4 — `r3-abstraction-elevator` · ABSTRACTION ELEVATOR

**File:** `/opt/tlacak-web/mockups/r3-abstraction-elevator.html`

**Vibes:** Three modes that are **genuinely different layouts**, not filter states. Switch with one keystroke. (1) Executive view: editorial typography, big numbers, almost-no-chrome, like reading the morning briefing. (2) Dispatch view: ranked exception queue — silence when nothing needs attention, map demoted to thumbnail. (3) Single-vehicle view: full trace timeline of one vehicle's last 24h. Each mode has its **own type/color register** — switching feels like changing altitude over the same data. Cursor 3 tiered abstraction + Honeycomb Canvas + Grafana 12 dynamic dashboards.

**Real research refs:**
- **Cursor 3** (https://cursor.com/blog/cursor-3) — multi-workspace + tiered abstraction
- **Honeycomb Canvas** (https://www.honeycomb.io/blog/honeycomb-introduces-developer-interface-future-with-ai-native-observability-suite) — AI-guided investigation shifts your vantage point
- **Grafana 12 Dynamic Dashboards** (https://grafana.com/blog/2025/05/07/dynamic-dashboards-grafana-12/) — conditional panel visibility, auto-grid layout
- **Frostpunk 2 / Helldivers 2** — posture-switching tactical UI (cruising vs. incident mode)

**Layout — the trick:** Show all 3 modes in one mockup as a triptych (3 vertical columns 1/3 each, or 3 horizontal bands h-stacked), each showing the SAME OneFleet fleet state, but in 3 wildly different presentations. Add a top-bar mode switcher with `[E] EXECUTIVE  ·  [D] DISPATCH  ·  [V] VEHICLE` showing all three modes can be switched with one keystroke.

Or render as a **single full-screen view of one mode** (pick DISPATCH as the most distinctive) with the other two shown as small thumbnails in a corner — that emphasizes "this is what mode you're in" + "here's what the other modes look like".

**I recommend the triptych: 3 columns showing all 3 modes simultaneously.** That communicates the central idea (3 distinct abstractions) most clearly. Plus the user sees 3 mini-mockups for the price of one.

Each mode has its own palette/type register:

### Mode E · EXECUTIVE (left column or top band)
- **Palette**: light cream `#f4f0e8` page, deep ink `#1a1410`, single deep red `#9d2a2a` for alerts. Editorial.
- **Typography**: serif hero — 'Playfair Display' or 'GT Sectra' weight 900 — at 72-96px for hero numbers. Body in 'Inter' Light.
- **Layout**: VERY sparse. Massive headline: "TWO HUNDRED FORTY-SEVEN UNITS" (numbers written out). Below: "one hundred eighty-four · in motion · this hour." in italic serif. Then a thin hairline. Then: 3 active alerts in tiny editorial type. Then: a small map thumbnail (200px) with just dots. Then a date and signature line "OPERATIONS BRIEFING · 03:47 WIB · 23 May 2026".
- **Feel**: like a morning briefing memo. Could be printed. Senior exec reads in 10 seconds.
- **Mode indicator**: top of column says `[E] EXECUTIVE · 30,000 ft`

### Mode D · DISPATCH (center column)
- **Palette**: Cyber Ops dark `#000814` page, `#00ffc8` cyan, `#ff3864` alert. (Same as production.)
- **Typography**: JetBrains Mono Variable everywhere. Mono caps headers.
- **Layout**: **silence-as-design**. The PRIMARY UI is a ranked exception queue: "3 things needing your decision in the next 30 min" — TRUCK-189 speed +32% / VAN-118 fence exit / PICKUP-042 idle 10m. Each as a row with: time-to-impact score, decision affordance buttons (Acknowledge / Reroute / Call driver / Snooze). Map is a small 200x150 thumbnail showing where the alerts are. Device list = collapsed to "247 units · ↑184 ↘41 ■18 ·4 — none requiring attention". Selected vehicle TRUCK-247 detail is a small inset.
- **Feel**: air traffic control. Calm when nothing's happening. The interface only speaks when something needs you.
- **Mode indicator**: top of column says `[D] DISPATCH · 1,000 ft · 3 active`

### Mode V · VEHICLE (right column or bottom band)
- **Palette**: dark base + cyan accent. Telemetry-oriented.
- **Typography**: JetBrains Mono Variable.
- **Layout**: a deep dive on TRUCK-247. Vertical timeline showing 24h (latest at top): 03:47 ✓ moving 67km/h Sudirman / 03:36 ⚠ idling 11m Senayan (closed) / 03:14 ⚠ geofence Pulogadung exit / 03:12 ▲ ignition on / 02:51 ▲ moving start / ... back to 18 hours ago. Below the timeline: telemetry sparklines (speed, fuel, ignition state, route). Compact telemetry grid. Driver photo + comms log. Today's full breakdown.
- **Feel**: forensic deep-dive. One vehicle, everything that happened.
- **Mode indicator**: top of column says `[V] VEHICLE · ground level · TRUCK-247`

**Cross-mode top bar** (above the triptych): `[E]xecutive — [D]ispatch — [V]ehicle · ⌘1 ⌘2 ⌘3` showing the keystroke-switch. Visual reminder: ONE keystroke transitions between abstraction layers — like an altimeter, not a tab.

**Signature treatments:**
1. **Triptych layout** with thin hairline dividers between modes
2. **Each mode genuinely different layout**, not just filtered content
3. **Mode indicator label** at top of each panel — shows altitude metaphor
4. **Time-to-impact scoring** in dispatch mode: "30 min" / "60 min" / "next-shift" badges
5. **Decision affordances** in dispatch: explicit buttons, not just info display
6. **Editorial flourishes** in executive: drop cap, italic accents, hairlines
7. **Deep telemetry** in vehicle: spark-everything, full event timeline
8. **The mode switcher** at top — keystroke hints visible — communicates the central interaction
9. **Cross-mode "current zoom" indicator** showing what altitude the operator is at

The mockup itself is teaching the user a NEW interaction model: this isn't one dashboard with filters, it's three distinct postures over the same data.

---

## Process (every direction)

1. **Invoke the `frontend-design` skill** (Skill tool) — production-grade UI work
2. Build the screen as a single self-contained HTML file at your assigned path
3. Do not write any files outside `/opt/tlacak-web/mockups/`
4. Do not commit, do not deploy
5. When done, return a short summary (~60 words): file path, file size, 2-3 things that landed as "out of expectation"

## Quality bar

Each mockup will be served at `https://1f.val.id/mockups/<slug>.html` for direct comparison. The user is looking for something that surprises them out of their existing mental model. Lean fully into your direction. Each direction is grounded in REAL research — don't water it down to "modern dashboard #97".
