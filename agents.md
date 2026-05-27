# Agent Developer Guidelines: DWD Climate Data Visualization & Analysis

This document provides specialized technical blueprints and integration guidelines for AI coding assistants (such as Gemini, Claude, or GPT) who inherit, maintain, debug, or extend this project.

---

## Technical Map & Database Architecture

The application operates as a decoupled two-tier static system:
1. **Python ETL Pipeline**: Fetches, merges, and deduplicates raw meteorological daily files, resolves spatial coordinate movements, and aggregates heat matrices into static JSON files.
2. **Frontend UI Tier**: A reactive, localized, vanilla CSS/JS dashboard utilizing Tailwind CSS v3 (CDN) and inline SVG projections to render map grids and station inspect screens.

### 1. The Data Pipeline (`download_and_process.py`)
- **Zip Archive Resolver**: DWD updates weather records in two overlapping zip files: `historical` (fully quality-controlled, complete years) and `recent` (near real-time raw values). The pipeline downloads both, unzips them, parses daily temperature readings (`TX_ON_LUG`), and deduplicates them using `MESS_DATUM` (format: `YYYYMMDD`) as the primary key.
- **Dynamic Relocation Tracker**:
  - Geodetic coordinates and elevation changes are parsed chronologically from the `Metadaten_Geographie_*` text table included in each DWD zip.
  - The script calculates cumulative distance traveled using the **Haversine formula**:
    $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  - Flags any station with coordinate shifts exceeding $\pm 0.0001$ degrees as **moved** during specific epochs.
- **Instrumentation & Equipment Chronology**: Parses `Metadaten_Geraete_Lufttemperatur_Maximum_*` and translates conventional instruments (maximum glass thermometers) and modern devices (electronic platinum-resistance PT100 sensors) into structural epoch objects.
- **Precalculated Targets**: The script outputs a single optimized dataset at `data/weather_data.json` containing precalculated counts for days &ge; 30 °C, 33 °C, and 35 °C for each station and year, drastically optimizing client-side performance.

### 2. Frontend State Machine (`app.js`)
The UI is driven entirely by a reactive, single-state architecture:
```javascript
let weatherData = [];            // Loaded from data/weather_data.json
let geojson = null;              // Loaded from data/germany_states.json
let currentLang = 'de';          // Active language toggle ('de' | 'en')
let currentTempThreshold = 35;   // Active temperature trigger (30 | 33 | 35)
let currentStartYear = 1961;     // Active timeline start year
let currentCoverageThreshold = 0.80; // Operational completeness threshold (0.50 - 1.00)
let currentMovesFilter = 'all';  // Moves toggle status ('all' | 'moved' | 'unmoved')
let selectedStationId = null;    // Highlighted weather station in Inspector
```

---

## Bounding Box & Vector Projections

The map coordinates of Germany are projected from geographic coordinates (Longitude, Latitude) to local SVG pixel space (x, y) using an **Equirectangular projection system**:

```javascript
function project(lon, lat, width, height, bounds) {
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
    const y = height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
    return [x, y];
}
```
*Note: In `app.js`, the bounding box (`bbox`) is dynamically computed on load using the minimum/maximum coordinates found in `data/germany_states.json` with a 8% geographic padding factor (`lonPad`, `latPad`) to prevent visual clipping on SVG card borders.*

---

## Dynamic Legend Sizing Architecture (Layout Syncing)

### The Challenge
Because the 65-year Germany maps are rendered in a responsive Tailwind grid layout (`grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-8`), the map SVG width on screen varies dynamically based on viewport resolutions. An SVG circle defined with a viewBox radius (e.g. `r="7.0"` inside a `viewBox="0 0 110 140"`) changes its actual visual size on screen. 

If the legend bubbles are drawn in standard static HTML/CSS pixels (like `w-[14px] h-[14px]`), they will mismatch the map circles on most screens, violating visual uniformity guidelines.

### The Agentic Solution
We solved this by establishing a **dynamic coordinate scale tracker** in the JS engine. When rendering or resizing the screen:
1. The engine queries a rendered map SVG in the grid to obtain its exact visual width on screen:
   ```javascript
   const mapSvg = document.querySelector('#map-grid-container svg');
   const rect = mapSvg.getBoundingClientRect();
   const scale = rect.width / 110; // viewBox width is 110 units
   ```
2. The engine computes the precise visual screen pixel radius matching the maps' actual physical rendering:
   ```javascript
   const physicalRadius = style.r * scale;
   ```
3. It dynamically injects the SVG legend circles inside an inline `<svg>` container (`width="20" height="20"`) using the matching `physicalRadius`.
4. The window `resize` event is bound to `updateLegend()` to instantly re-calculate this scaling factor whenever layout breakpoints are tripped.

---

## AI Assistants Handoff & Quality Checklist

When maintaining, modifying, or extending this project, ensure you comply with the following standards:

- [ ] **Data Pipeline Integrity**: Do NOT write project code files to `tmp` or desktop folders. Store static databases directly in the `/data` folder.
- [ ] **Keep Germany Map Outline-Only**: Ensure the state paths inside the map cards are rendered with `fill="none"`. Visual indicators (warm orange-red circles) depend on outline-only backgrounds for maximum contrast.
- [ ] **Maintain Localization Coverage**: Every newly introduced string, chart annotation, or control tooltip MUST have dedicated matching keys added in both `i18n.de` and `i18n.en` within `app.js`.
- [ ] **Preserve Visual Bubble Sizing Uniformity**: Ensure that any changes to `getHeatStyle(days)` base bubble sizes `[2.2, 3.4, 4.6, 5.8, 7.0]` are reflected exactly inside `updateLegend()`'s threshold groups to prevent layout sync drifts.
- [ ] **Zero Dev server blockers**: Keep the server running cleanly. Always perform visual verifications using Playwright and compile summaries gracefully in `walkthrough.md`.
