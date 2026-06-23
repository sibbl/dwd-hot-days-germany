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
- Maximum rendered non-zero bubble radius is now `4.6` SVG units.
- Legend rendered 5 synchronized bubble entries.
- Night-minimum mode switched successfully:
  - URL hash became `metric=min`.
  - Threshold slider switched to `17`-`27`.
  - Default threshold is `20 °C`, matching the scientific tropical-night definition.
  - Labels now describe nightly minimum temperature, with tropical-night wording reserved for thresholds of at least `20 °C`.
  - Night-mode circles use the `n17`-`n27` generated data keys.
  - Nonzero night markers render with the blue `#0284c7` palette.
- Night threshold at `17 °C` updated the hash and legend buckets.
- Single-map view rendered in night-minimum mode with threshold-specific total wording.
- Mobile viewport check at roughly 390 px wide showed visible metric controls and no horizontal overflow in the checked controls.
