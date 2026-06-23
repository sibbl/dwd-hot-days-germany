# Local Verification Walkthrough

Date: 2026-06-23

## Server

- Started a static dev server from the project root with `python3 -m http.server 8000`.
- Local URL: `http://localhost:8000/`

## Automated Checks

- `node --check app.js` passed.
- `python3 -m py_compile download_and_process.py verify_results.py` passed.
- `verify_results.py` completed, but the Spiegel fixed reference totals no longer match exactly after regenerating against current DWD 2025/2026 station availability.

## Browser Checks

- Desktop hot-day view loaded without console errors.
- Hot-day mode rendered 66 map cards and 12,342 station circles.
- Maximum theoretical Raster bubble radius is now `4.6` SVG units.
- Maximum theoretical Einzelkarte bubble radius is now `3.7` SVG units.
- Legend rendered 5 synchronized bubble entries.
- Default view without URL state is Raster.
- Legend bubble sizes match the currently visible map SVG scale in both Raster and Einzelkarte.
- Single-map station markers include an invisible hit area so the reduced bubbles remain selectable, and selected stations redraw with a map ring.
- Night-minimum mode switched successfully:
  - URL hash became `metric=min`.
  - Threshold slider switched to `18`-`28`.
  - Default threshold is `22 °C`; `20 °C` remains the tropical-night definition.
  - Labels now describe nightly minimum temperature, with tropical-night wording reserved for thresholds of at least `20 °C`.
  - Night-mode circles use the `n18`-`n28` generated data keys.
  - Nonzero night markers render with the blue `#0284c7` palette.
- Night threshold at `18 °C` updated the hash and legend buckets.
- Single-map view rendered in night-minimum mode with threshold-specific total wording.
- Mobile viewport check at roughly 390 px wide showed visible metric controls and no horizontal overflow in the checked controls.
