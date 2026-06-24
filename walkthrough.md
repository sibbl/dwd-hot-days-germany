# Local Verification Walkthrough

Date: 2026-06-24

## Server

- Started a static dev server from the project root with `python3 -m http.server 8000`.
- Local URL: `http://localhost:8000/`

## Automated Checks

- `node --check app.js` passed.
- `.venv/bin/python download_and_process.py` completed and regenerated `data/weather_data.json` with `season` fields for yearly and monthly threshold spans.
- `.venv/bin/python -m py_compile download_and_process.py verify_results.py` passed after removing the hard-coded active-station month cutoff.
- `verify_results.py` completed, but the Spiegel fixed reference totals no longer match exactly after regenerating against current DWD 2025/2026 station availability.

## Browser Checks

- Desktop hot-day view loaded without console errors.
- Hot-day mode rendered 66 map cards and 12,342 station circles.
- Smallest non-zero Raster bubble radius is now `1.8` SVG units.
- Maximum theoretical Raster bubble radius is now `3.0` SVG units.
- Einzelkarte bubble radii are scaled to match the physical screen size of Raster bubbles at the active viewport.
- Legend rendered 5 synchronized bubble entries.
- Default view without URL state is Raster.
- Legend bubble sizes match the currently visible map SVG scale in both Raster and Einzelkarte.
- Single-map station markers include an invisible hit area so the reduced bubbles remain selectable, selected stations redraw with a map ring, and selecting the same station again clears the selection.
- Night-minimum mode switched successfully:
  - URL hash became `metric=min`.
  - Threshold slider switched to `18`-`28`.
  - Default threshold is `22 °C`; `20 °C` remains the tropical-night definition.
  - Labels now describe nightly minimum temperature, with tropical-night wording reserved for thresholds of at least `20 °C`.
  - Night-mode circles use the `n18`-`n28` generated data keys.
  - Nonzero night markers render with the blue `#0284c7` palette.
  - Night-mode metric, filter, timeline, station-selection, and decade-chart controls use blue trigger styling.
- Night threshold at `18 °C` updated the hash and legend buckets.
- Single-map view rendered in night-minimum mode with threshold-specific total wording.
- Mobile viewport check at roughly 390 px wide showed visible metric controls and no horizontal overflow in the checked controls.
- Advanced filters open as a collapsed section below the main controls and include:
  - `Daten-Vollständigkeit`
  - `Nur ortsfeste Stationen`
  - `Flughafenumfeld ausschließen`
  - `Großstadtumfeld ausschließen`
- `Daten-Vollständigkeit` is no longer present in the main control row; changing it in advanced filters updates the URL hash and active station count.
- Airport/city exclusions are station-coordinate based and update the active station count and URL hash with `airport=exclude` and `city=exclude`.
- `Jahresdiagramm` renders as a third visualization tab, hides the map-bubble legend, shows annual DWD station totals, a trend line, and peak/latest/trend stats.
- `Saisonlänge` renders as a fourth visualization tab, hides the map-bubble legend, and shows every decade from 1961 through the current partial decade using shortest/longest yearly Germany-wide threshold spans.
- Night-minimum mode keeps the `22 °C` default and switches the annual chart controls/trend styling to the blue palette.
- Visualization modes are now promoted to a top selector above the active view title:
  - phone viewport (`390x820`) uses a compact 2x2 icon-over-label layout with no horizontal or label overflow,
  - tablet viewport (`820x900`) uses a 2x2 layout with descriptions,
  - desktop viewport (`1280x860`) uses a single 4-wide row with descriptions.
