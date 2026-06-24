---
name: dwd-data-management
description: Maintain, regenerate, verify, or review the DWD climate dashboard data pipeline. Use when an agent changes download_and_process.py, verify_results.py, data/weather_data.json, monthly import automation, temperature threshold data keys, station metadata processing, season first/last spans, or data validation behavior.
---

# DWD Data Management

Use this skill for data pipeline, generated dataset, and validation changes.

## Data Shape

- `download_and_process.py` rebuilds `data/weather_data.json` from DWD daily records.
- `verify_results.py` compares selected aggregates against the original Spiegel reference study.
- `data/weather_data.json` and `data/germany_states.json` are static browser assets.
- `.github/workflows/import-data.yml` refreshes weather data monthly.

## Pipeline Rules

- Put generated project data in `data/`, especially `data/weather_data.json`.
- Do not store project outputs in temporary folders or desktop paths.
- Keep `data/weather_data.json` compact enough for GitHub. Prefer compact JSON formatting before changing behavior if size becomes a problem.
- Keep station-coordinate filters station-based unless a separate raster dataset is explicitly introduced.
- If data keys change, update frontend consumers and documentation in the same change.

## Current Data Model

- Daily maximum thresholds: `t25` through `t40`.
- Nightly minimum thresholds: `n18` through `n28`.
- Aggregates include annual totals, monthly totals, and season first/last spans.
- Airport and major-city exclusion filters derive from each station's current coordinates.
- DWD historical and recent files can overlap; daily records should be deduplicated by date.

## Refresh Workflow

Regenerate data near the beginning of each month after DWD publishes recent daily values:

```bash
.venv/bin/python download_and_process.py
```

Run validation:

```bash
.venv/bin/python verify_results.py
```

The fixed Spiegel reference totals can drift after DWD backfills or changes station availability. Treat mismatches as something to inspect and explain, not automatically as a failed implementation.

## Checks

For pipeline changes, run:

```bash
.venv/bin/python -m py_compile download_and_process.py verify_results.py
.venv/bin/python download_and_process.py
.venv/bin/python verify_results.py
git diff --check
```

For generated data changes, inspect the resulting `data/weather_data.json` size and ensure the frontend still loads representative URLs under a local static server.
