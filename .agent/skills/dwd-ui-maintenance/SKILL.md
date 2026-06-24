---
name: dwd-ui-maintenance
description: Maintain, extend, verify, or review the frontend of this DWD climate dashboard. Use when an agent changes index.html or app.js, adjusts maps, charts, filters, visualization modes, responsive layout, colors, localization, browser behavior, or local visual verification for the static heat-day/night dashboard.
---

# DWD UI Maintenance

Use this skill for frontend and visualization changes in the DWD climate dashboard.

## Frontend Shape

- Static app: `index.html`, `app.js`, `data/weather_data.json`, `data/weather_season_data.json`, and `data/germany_states.json`.
- UI stack: Tailwind via CDN, vanilla JavaScript state, inline SVG charts and maps.
- Main browser target: `http://localhost:8000/` served from the repository root.

## UI Rules

- Preserve Germany state outlines as `fill="none"` in map SVG paths.
- Add every new user-facing string to both German and English `i18n` dictionaries in `app.js`.
- Keep night-minimum mode blue-toned across controls, charts, legends, and active states.
- Keep old URL hashes graceful when removing a view or parameter. Redirect deprecated values to the closest valid mode instead of leaving a blank screen.
- Keep README human-facing. Put agent/process details in `.agent/skills` or `agents.md`, not in README.

## Bubble And Legend Rules

- Keep map and legend bubble sizes visually synchronized.
- If `getHeatStyle(days)` radii or buckets change, check `updateLegend()` in the same change.
- For single-map markers, keep hit areas large enough that small circles remain selectable.
- Preserve station unselect behavior when clicking the selected station again.

## Current UX Expectations

- Default view is `Raster`.
- Top visualization modes: `Raster`, `Einzelkarte`, `Jahressumme`, `Jahrzehnte`, `Saisonlänge`.
- `Stationsschnitt` was removed as a duplicate; old `view=yearly` URLs should fall back to `Jahressumme`.
- `Daten-Vollständigkeit`, `Nur ortsfeste Stationen`, `Flughafenumfeld ausschließen`, and `Großstadtumfeld ausschließen` live in advanced filters.
- The annual chart footer shows peak year and linear trend only, not a partial latest-year statistic.
- Season-length point labels must stay clamped inside the chart.

## Local Browser Workflow

Start or confirm the static server:

```bash
python3 -m http.server 8000
```

Use representative URLs:

```text
http://localhost:8000/?fresh=local#metric=max&temp=25&start=1961&coverage=85&moves=all&view=annual&year=1983
http://localhost:8000/?fresh=local#metric=min&temp=22&start=1961&coverage=90&moves=all&view=season&year=1983
http://localhost:8000/?fresh=local#metric=max&temp=35&start=1961&coverage=90&moves=all&view=grid&year=2018
```

Use Playwright for visual checks after UI work. Verify:

- Desktop and mobile have no horizontal overflow.
- Visualization buttons fit and the active view renders.
- Map/raster bubbles do not hide the map and remain aligned with the legend.
- Single-map station selection and unselection work.
- Annual, decade, and season charts render non-empty data for representative `max` and `min` URLs.
- Advanced filters open, preserve typography, and update URL hash and station counts.

The app may log a favicon/static-resource `404`; ignore it when the requested visualization renders correctly and there are no application errors.

## Checks

For frontend-only changes, run:

```bash
node --check app.js
git diff --check
```
