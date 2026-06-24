# Agent Handoff

This repository has a project skill for Codex-style maintenance work:

`skills/dwd-dashboard-maintenance/SKILL.md`

Use that skill when changing the dashboard UI, data pipeline, visualizations, filters, generated dataset, or verification workflow.

## Project Invariants

- Keep the app static: `index.html`, `app.js`, and JSON data files should remain enough to run the dashboard.
- Keep Germany map state paths outline-only with `fill="none"`.
- Keep German and English localization in sync for every user-facing UI string.
- Keep map bubble sizes and legend bubble sizes visually aligned.
- Keep night-minimum mode blue-toned across controls, charts, and legends.
- Keep data outputs in `data/`, especially `data/weather_data.json`.
- Keep README human-facing; put detailed maintenance workflow in the skill, not in README.

## Basic Checks

For frontend-only changes:

```bash
node --check app.js
git diff --check
```

For pipeline changes:

```bash
.venv/bin/python -m py_compile download_and_process.py verify_results.py
.venv/bin/python download_and_process.py
.venv/bin/python verify_results.py
```

Use Playwright for responsive browser checks on local `http://localhost:8000/` when UI or chart behavior changes.
