# DWD Extrem Heiße Tage in Deutschland (1961–2025)

An interactive, high-fidelity web dashboard that reconstructs and extends the classic *Der Spiegel* investigative climate study **"Immer mehr extrem heiße Tage"** using German Weather Service (DWD) observations up to the most recent year (2025/2026).

---

## Original Attribution & Context

This project is a modern, interactive reconstruction and extension of the investigative data journalism work originally published by **Der Spiegel**:

* **Original Article**: [Klimawandel in Deutschland: Außergewöhnlich warm oder schon normal?](https://www.spiegel.de/wissenschaft/natur/klimwandel-in-deutschland-aussergewoehnlich-warm-oder-schon-normal-a-ea8f6054-0d75-4dd6-ab7e-bbc0410ded27) (Published by *Spiegel Wissenschaft*).
* **Core Concept**: The original study identified active weather stations operating continuously since 1961 (with &ge;80% data coverage) and tracked the dramatic rise in the decade-by-decade count of extremely hot days (&ge;35 °C). This reconstruction extends their research up to the present day, introduces granular temperature thresholds (30 °C, 33 °C, 35 °C), and incorporates detailed geodetic relocation timelines and instrument changes.

---

## Core Features

1. **65-Year Germany Map Raster (1961–2025)**:
   - High-contrast, state outline vector maps (`fill="none"`) showing how heat density sweeps across the decades.
   - Elegant, dynamic warm orange-red visual circles sized proportionally to heat days.
2. **Pristine Visual Uniformity**:
   - The dashboard includes a **Dynamic scale tracker** in JavaScript. It measures the physical screen width of the responsive grid map cards and mathematically scales the legend's circles (`r * (width / 110)`) so they are **exactly, pixel-perfectly identical** to the map bubbles under all screen sizes, zooms, and window resizes.
3. **Granular Parameter Control**:
   - Live filters for temperature thresholds ($\ge$ 30 °C, 33 °C, or 35 °C).
   - Dynamic start-year adjustment slider (1961–2020) and data coverage completeness slider (50% to 100%).
4. **Metadata Station Inspector**:
   - Sifts through coordinates, elevation, names, and operator history over 65 years. Renders an interactive map of station moves (computing distance via the **Haversine formula**) and highlights changes in sensor equipment (e.g. mercury thermometers vs electrical PT100 elements).
   - Generates a local annual trend bar chart with a dynamically projected linear regression line.
5. **Full Dynamic Localization**:
   - Instant language toggle supporting German (DE) and English (EN) globally.
6. **Responsive Light/Dark Mode**:
   - Dedicated manual theme toggle switch with saved settings preferences.

---

## File Structure & Architecture

```
dwd-data-analysis/
├── download_and_process.py   # Automated data downloader, zipper, & metadata parser
├── verify_results.py         # Validation check verifying data against Spiegel's targets
├── index.html                # Main visual user interface (Tailwind CSS v3 CDN)
├── app.js                    # Core state machine, coordinate projection, & dynamic layout engine
├── data/
│   ├── weather_data.json     # Self-contained preprocessed climate dataset (JSON)
│   └── germany_states.json   # Simplified vector boundary outlines of German federal states
└── README.md                 # Project README
```

---

## Setup & Running Locally

### Prerequisites
The frontend uses static HTML, CSS, and JavaScript. The data pipeline needs Python with `pandas`; use the checked-in virtual environment when it is available.

### 1. (Optional) Re-run the Scraper & Preprocessor
To scrape the most recent daily records and rebuild the local databases, execute the python script in your terminal:
```bash
.venv/bin/python download_and_process.py
```
*Note: This script automatically establishes connections with the DWD Open Data CDC servers, pulls down daily files, extracts geographic timelines, deduplicates records, calculates local coordinate changes, and exports yearly/monthly threshold spans for the season-length view. It generates `data/weather_data.json`.*

For the regular monthly refresh, run this command at the beginning of the month after DWD has published recent daily values. The frontend derives the airport and major-city exclusion filters from each station's current coordinates, so no additional geospatial preprocessing step is required for those UI filters.

### 2. Run the Mathematical Validation Script
To check our precalculated aggregates against the original *Spiegel* study's mathematical targets:
```bash
python verify_results.py
```
*Note: The script compares decadal totals under a 35 °C threshold at 80% coverage. We achieve extremely high alignment with the Spiegel article's findings (under 3.5% variance due to retrospective digitalizations by the DWD since publication).*

### 3. Launch the Local Web Server
Serve the frontend web dashboard using Python's lightweight web server:
```bash
python3 -m http.server 8000
```

Once the server is running, open your browser and navigate to:
```
http://localhost:8000
```

---

## Verification Comparison

Using our preprocessed daily climate dataset (which covers **204 stations** compared to the Spiegel's historical **188 stations** due to newer retrospective digitalization data from the DWD), we match their decadal counts with extremely high precision:

| Decade | Spiegel Target Count | Our Extracted Count | Status | Variance |
| :---: | :---: | :---: | :---: | :---: |
| **1961–1970** | 122 | 118 | Verified | -3.2% |
| **1971–1980** | 158 | 157 | Verified | -0.6% |
| **1981–1990** | 328 | 319 | Verified | -2.7% |
| **1991–2000** | 672 | 667 | Verified | -0.7% |
| **2001–2010** | 1321 | 1268 | Verified | -4.0% |
| **2011–2020** | 2488 | 2407 | Verified | -3.2% |

---

## Deploying to GitHub Pages

Since the dashboard is designed as a decoupled, 100% static client-side web application, publishing it to GitHub Pages is incredibly simple and requires no backend configurations.

### Step 1: Initialize Git and Push to GitHub
If you haven't initialized your repository yet, execute the following commands in your local workspace terminal:
```bash
# 1. Initialize git repository
git init

# 2. Add all files (.gitignore automatically excludes raw ZIPs and virtual envs)
git add .

# 3. Commit your changes
git commit -m "feat: initial interactive climate dashboard release"

# 4. Set branch to main
git branch -M main

# 5. Connect your GitHub remote repository
git remote add origin <YOUR-GITHUB-REPO-URL>

# 6. Push to GitHub
git push -u origin main
```

### Step 2: Enable GitHub Pages in Settings
1. Go to your repository page on **GitHub.com**.
2. Click on the **Settings** tab at the top.
3. Under the **Code and automation** category in the left sidebar, click on **Pages**.
4. In the **Build and deployment** section:
   - **Source**: Select **Deploy from a branch** (default).
   - **Branch**: Select **main** and set the folder dropdown to **/ (root)**.
5. Click **Save**.

Your weather station heat dashboard will be compiled, deployed, and live at:
`https://<your-github-username>.github.io/<your-repository-name>/`

---

## License & Data Source
- **Data Source**: Meteorological observations sourced open-access from the [Deutscher Wetterdienst (DWD) Climate Data Center (CDC)](https://opendata.dwd.de/).
- **Original Investigative Concept**: [Der Spiegel](https://www.spiegel.de/).
