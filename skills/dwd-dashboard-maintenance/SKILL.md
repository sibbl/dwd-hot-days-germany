---
name: dwd-dashboard-maintenance
description: Maintain, extend, verify, or review this DWD climate dashboard repository. Use when Codex works on the static DWD heat-day/night visualization app, changes app.js/index.html, regenerates data/weather_data.json, updates climate thresholds or visualization modes, adjusts responsive UI behavior, or needs the project-specific local verification workflow.
---

# DWD Dashboard Maintenance

Use this skill for changes to the DWD climate dashboard. Keep the user-facing site simple and responsive, and keep the data pipeline reproducible.

## Project Shape

- Frontend: static `index.html` plus `app.js`, with Tailwind via CDN and inline SVG charts/maps.
- Data pipeline: `download_and_process.py` rebuilds `data/weather_data.json` from DWD daily records.
- Validation: `verify_results.py` compares selected aggregates against the original Spiegel reference study.
- Static data: `data/weather_data.json` and `data/germany_states.json` are served directly by the browser.
- Deployment: GitHub Pages can serve the repository root. `.github/workflows/import-data.yml` refreshes data monthly.

## Maintenance Rules

- Preserve Germany state outlines as `fill="none"` in map SVG paths.
- Add every new UI string to both German and English `i18n` dictionaries in `app.js`.
- Keep map and legend bubble sizes synchronized. If `getHeatStyle(days)` radii or buckets change, check `updateLegend()` too.
- Keep night-minimum mode blue-toned across controls, charts, and legends.
- Keep old URL hashes graceful when removing a view or parameter. Redirect deprecated values to the closest valid mode instead of leaving a blank screen.
- Do not put generated project data in temporary folders. Rebuilt static datasets belong in `data/`.
- Keep README human-facing. Put agent/process details here or in `agents.md`, not in README.

## Local Workflow

Start or confirm the local static server:

```bash
python3 -m http.server 8000
```

Use `http://localhost:8000/` for browser checks. If port `8000` is already occupied by the project server, reuse it.

For ordinary frontend changes, run:

```bash
node --check app.js
git diff --check
```

For pipeline or verification changes, also run:

```bash
.venv/bin/python -m py_compile download_and_process.py verify_results.py
.venv/bin/python download_and_process.py
.venv/bin/python verify_results.py
```

The fixed Spiegel reference totals can drift after DWD backfills or changes station availability. Treat `verify_results.py` mismatches as something to inspect and explain, not automatically as a failed implementation.

## Browser Verification

Use Playwright for visual checks after UI work. At minimum verify:

- Desktop and mobile viewports have no horizontal overflow.
- Visualization mode buttons fit and the active view renders.
- Map/raster bubbles do not hide the map and remain aligned with the legend.
- Single-map station hit areas still allow select and unselect.
- Annual, decade, and season charts render non-empty data for representative `max` and `min` URLs.
- Advanced filters open, preserve typography, and update the URL hash and station counts.

Good representative URLs:

```text
http://localhost:8000/?fresh=local#metric=max&temp=25&start=1961&coverage=85&moves=all&view=annual&year=1983
http://localhost:8000/?fresh=local#metric=min&temp=22&start=1961&coverage=90&moves=all&view=season&year=1983
http://localhost:8000/?fresh=local#metric=max&temp=35&start=1961&coverage=90&moves=all&view=grid&year=2018
```

The app may log a favicon/static-resource `404`; ignore it if the requested visualization renders correctly and there are no app errors.

## Data Refresh

Regenerate data at the beginning of each month after DWD publishes recent daily values:

```bash
.venv/bin/python download_and_process.py
```

The current data model supports:

- daily maximum thresholds from `25` to `40` degrees via `t25` through `t40`
- nightly minimum thresholds from `18` to `28` degrees via `n18` through `n28`
- annual totals, monthly totals, and season first/last spans
- station-based airport and major-city exclusion filters derived from current station coordinates

Keep `data/weather_data.json` compact enough for GitHub. If it grows close to hard limits, prefer compact JSON formatting before changing behavior.

## Current UX Expectations

- Default view is `Raster`.
- Visualization modes are prominent at the top: `Raster`, `Einzelkarte`, `Jahressumme`, `Jahrzehnte`, `Saisonlänge`.
- `Stationsschnitt` was removed as a duplicate; old `view=yearly` URLs should fall back to `Jahressumme`.
- `Daten-Vollständigkeit`, `Nur ortsfeste Stationen`, `Flughafenumfeld ausschließen`, and `Großstadtumfeld ausschließen` live in advanced filters.
- The annual chart footer shows peak year and linear trend only, not a partial latest-year statistic.
- Season-length point labels must stay clamped inside the chart.

## Finishing Work

Before finalizing a change, update docs only where they help:

- README: user-facing overview, local run, data refresh, links.
- `agents.md`: concise agent handoff and this skill pointer.
- This skill: durable maintenance workflow or project invariants.

Do not maintain a separate local walkthrough log. Add durable verification guidance here instead.
