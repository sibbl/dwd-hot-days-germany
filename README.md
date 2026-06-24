# DWD Hot Days Germany

Interactive climate dashboard for hot days and warm nights at German DWD weather stations.

The app lets you explore how often selected temperature thresholds were reached across Germany since 1961. It includes map views, annual and decade charts, season-length comparisons, station filters, and a station inspector.

It started as a reconstruction and extension of Der Spiegel's climate data story ["Außergewöhnlich warm oder schon normal?"](https://www.spiegel.de/wissenschaft/natur/klimwandel-in-deutschland-aussergewoehnlich-warm-oder-schon-normal-a-ea8f6054-0d75-4dd6-ab7e-bbc0410ded27), using open data from the Deutscher Wetterdienst (DWD).

## What You Can Explore

- Hot days based on daily maximum temperature thresholds.
- Warm nights based on daily minimum temperature thresholds.
- Germany-wide station maps by decade or single year.
- Annual and decade summaries with trend lines.
- Season length between the first and last threshold event.
- Filters for data completeness, station moves, airport surroundings, major-city surroundings, and months.
- Individual station histories, including moves and local trends.

## Run Locally

This is a static web app. Start a small local server from the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Refresh The Data

The preprocessed dataset is checked in at `data/weather_data.json`. To rebuild it from DWD source data:

```bash
.venv/bin/python download_and_process.py
```

The repository also includes a monthly GitHub Actions workflow that can refresh the dataset automatically.

## Verify Results

Run the lightweight validation script:

```bash
.venv/bin/python verify_results.py
```

The comparison is based on historical Spiegel reference totals. Small differences can happen when DWD backfills or updates station records.

## Project Files

- `index.html` - page structure and UI markup
- `app.js` - dashboard state, charts, maps, localization, and interactions
- `download_and_process.py` - DWD data import and preprocessing
- `verify_results.py` - aggregate validation helper
- `data/weather_data.json` - preprocessed station dataset
- `data/germany_states.json` - Germany state outlines for the maps

## Data And Credits

- Weather observations: [DWD Climate Data Center](https://opendata.dwd.de/)
- Original journalistic concept: [Der Spiegel](https://www.spiegel.de/)
- License: see [LICENSE](LICENSE)
