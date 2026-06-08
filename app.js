// Core state variables
let weatherData = [];
let geojson = null;
let bbox = null;

let currentLang = localStorage.getItem('dwd_lang') || 'de'; // 'de' or 'en'
let currentTempThreshold = 35; // 30, 33, or 35
let currentStartYear = 1961; // 1961 to 2020
let currentCoverageThreshold = 0.90; // 0.50 to 1.00
let currentMovesFilter = 'all'; // 'all', 'moved', 'unmoved'
let selectedStationId = null;
let currentMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 1 to 12 representing Jan to Dec

let currentViewMode = 'grid'; // 'grid' or 'single'
let currentActiveYear = 2025; // Active year for the single map view
let animationIntervalId = null;
let animationSpeed = 250; // ms per year in animation
let currentSearchQuery = ''; // Search query for filtering stations

const minYearGlobal = 1961;
let maxYearGlobal = 2025; // Dynamically updated on load
let maxDaysInMonthsOfLastYear = Array(12).fill(0); // Max observed valid days per month in the last year

// Translation dictionary
const i18n = {
    de: {
        'doc-title': "DWD Extrem Heiße Tage in Deutschland (1961–2025)",
        'header-title': "Immer mehr extrem heiße Tage",
        'header-subtitle': "Eine interaktive Rekonstruktion & Erweiterung der DWD-Wetterstations-Daten (1961–2025)",
        'stat-lbl-stations': "Stationen",
        'stat-lbl-reports': "Gesamtmeldungen",
        'stat-lbl-hottest': "Heißestes Jahr",
        'card-title-filter': "Parameter-Filter",
        'lbl-temp-threshold': "Min. Temperatur-Schwellenwert:",
        'lbl-start-year': "Start-Jahr des Zeitraums:",
        'desc-start-year': "Blendet frühere Jahre aus.",
        'lbl-coverage': "Daten-Vollständigkeit:",
        'desc-coverage': "Mindestanteil valider Daten im gewählten Zeitraum.",
        'lbl-moves-filter': "Nur ortsfeste Stationen anzeigen",
        'lbl-months': "Monate:",
        'btn-month-all': "Alle",
        'btn-month-summer': "Mai–Sep",
        'btn-month-none': "Keine",
        'month-names': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
        'month-names-long': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        'all-months': "Alle Monate",
        'no-months': "Keine Monate",
        'summer-months': "Mai–Sep",
        'n-months': "{n} Monate",
        'card-title-decades': "Meldungen pro Jahrzehnt",
        'btn-lbl-decades': "Jahrzehnte",
        'decades-methodology': "<span class=\"font-semibold text-orange-400\">Methodik:</span> Gezählt werden die summierten Tage mit Überschreitungen des Schwellenwerts an allen selektierten Stationen innerhalb des jeweiligen Jahrzehnts.",
        'card-title-grid': "Deutschlandkarten-Raster",
        'card-subtitle-grid': "Jeder Punkt steht für eine Messstation. Die Größe & Farbe zeigt die Anzahl der Tage über dem Schwellenwert.",
        'card-title-single': "Klimawandel-Animation",
        'card-subtitle-single': "Nutzen Sie den Play-Button, um den Anstieg extrem heißer Tage über Jahrzehnte hinweg zu animieren.",
        'legend-lbl-days': "Tage:",
        'loading-txt': "Lade Klimadaten & Landkarten-Modul...",
        'inspector-title': "Stations-Inspektor & Metadaten-Chronik",
        'inspector-subtitle': "Suchen Sie eine Wetterstation, um deren exakte Umzüge, Namensänderungen und Temperatur-Trends zu inspizieren.",
        'inspector-lbl-stations': "Stationen",
        'input-station-search-placeholder': "Station suchen (z.B. Berlin, Alfhausen)...",
        'inspector-select-prompt': "Wählen Sie links eine Station aus, um die Standort-Verlegungen & Gerätedaten zu laden.",
        
        // Dynamic Inspector terms
        'type-station': "Wetterstation",
        'lbl-active-span': "Aktiver Zeitraum",
        'lbl-elevation': "Stationshöhe",
        'lbl-geo-pos': "Geografische Lage",
        'lbl-coverage-ins': "Datenvollständigkeit",
        'lbl-chart-trend': "Jährlicher Hitze-Trend (Schwellenwert &ge; {temp} °C)",
        'lbl-chart-sub': "Balkendiagramm {start}–2025",
        'lbl-names-timeline': "Namensänderungen",
        'lbl-owners-timeline': "Betreiber / Inhaber",
        'lbl-devices-timeline': "Geräte & Sensoren",
        'lbl-moves-map': "Geografischer Standortverlauf",
        'lbl-moves-map-sub': "Visuelle Verfolgung der Stationsverlegungen",
        'lbl-moves-status': "Standortwechsel:",
        'lbl-moves-distance': "Kumulierter Umzugsweg:",
        'lbl-moves-log': "Verlegungs-Chronik",
        'lbl-epoch': "Epoche",
        'lbl-move-dist': "Umzug:",
        'lbl-height': "Höhe:",
        'lbl-pos': "Lage:",
        
        'legend-first-loc': "Erststandort",
        'legend-move-loc': "Standortwechsel",
        'legend-last-loc': "Letzter Standort",
        
        'trend-increase': "Lineares Klima-Trend: Anstieg von {val} Tagen",
        'trend-decrease': "Lineares Klima-Trend: Rückgang von {val} Tagen",
        
        'lbl-yes': "Ja",
        'lbl-no': "Nein",
        'lbl-active': "aktiv",
        'lbl-target': "Soll",
        'lbl-day-unit': "d",
        
        'no-names': "Keine Namenshistorie.",
        'no-owners': "Keine Betreiberhistorie.",
        'no-devices': "Keine Gerätehistorie.",
        
        'tooltip-move': "Standortwechsel am {date}!\nDistanz: {dist}\nNeuer Standort: {lat}°N, {lon}°E (Höhe: {elev}m)",
        'footer-made-by': 'Erstellt von <a href="https://sibbl.net" target="_blank" class="text-orange-600 dark:text-orange-400 hover:underline font-semibold">sibbl</a>',
        'footer-github': 'GitHub-Repository',
        'footer-original-idea': 'Original-Idee'
    },
    en: {
        'doc-title': "DWD Extremely Hot Days in Germany (1961–2025)",
        'header-title': "More and More Extremely Hot Days",
        'header-subtitle': "An interactive reconstruction & extension of DWD weather station data (1961–2025)",
        'stat-lbl-stations': "Stations",
        'stat-lbl-reports': "Total Reports",
        'stat-lbl-hottest': "Hottest Year",
        'card-title-filter': "Parameter Filters",
        'lbl-temp-threshold': "Min. Temperature Threshold:",
        'lbl-start-year': "Start Year of Timeframe:",
        'desc-start-year': "Hides previous years.",
        'lbl-coverage': "Data Completeness:",
        'desc-coverage': "Minimum percentage of valid data in the selected period.",
        'lbl-moves-filter': "Only show unmoved stations",
        'lbl-months': "Months:",
        'btn-month-all': "All",
        'btn-month-summer': "May–Sep",
        'btn-month-none': "None",
        'month-names': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        'month-names-long': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'all-months': "All Months",
        'no-months': "No Months",
        'summer-months': "May–Sep",
        'n-months': "{n} Months",
        'card-title-decades': "Reports per Decade",
        'btn-lbl-decades': "Decades",
        'decades-methodology': "<span class=\"font-semibold text-orange-400\">Methodology:</span> Counts represent the accumulated days exceeding the threshold across all selected stations within each decade.",
        'card-title-grid': "Germany Weather Map Grid",
        'card-subtitle-grid': "Each dot represents a weather station. Bubble size & color denote the count of days exceeding the threshold.",
        'card-title-single': "Climate Change Animation",
        'card-subtitle-single': "Use the play button to animate the rise of extremely hot days across decades.",
        'legend-lbl-days': "Days:",
        'loading-txt': "Loading climate records & vector maps...",
        'inspector-title': "Station Inspector & Metadata Chronology",
        'inspector-subtitle': "Search for a weather station to inspect its relocations, name modifications, and local temperature trends.",
        'inspector-lbl-stations': "Stations",
        'input-station-search-placeholder': "Search station (e.g. Berlin, Hamburg, Alfhausen)...",
        'inspector-select-prompt': "Select a weather station from the sidebar to inspect relocation timelines & device history.",
        
        // Dynamic Inspector terms
        'type-station': "Weather Station",
        'lbl-active-span': "Operational Span",
        'lbl-elevation': "Elevation",
        'lbl-geo-pos': "Geographical Position",
        'lbl-coverage-ins': "Data Coverage",
        'lbl-chart-trend': "Annual Heat Trend (Threshold &ge; {temp} °C)",
        'lbl-chart-sub': "Bar Chart {start}–2025",
        'lbl-names-timeline': "Name Changes",
        'lbl-owners-timeline': "Operators / Owners",
        'lbl-devices-timeline': "Devices & Sensors",
        'lbl-moves-map': "Geographical Relocation Path",
        'lbl-moves-map-sub': "Visual tracking of station coordinates changes",
        'lbl-moves-status': "Relocated:",
        'lbl-moves-distance': "Cumulative Relocation Path:",
        'lbl-moves-log': "Relocation Chronology",
        'lbl-epoch': "Epoch",
        'lbl-move-dist': "Move:",
        'lbl-height': "Height:",
        'lbl-pos': "Position:",
        
        'legend-first-loc': "First Location",
        'legend-move-loc': "Relocation Move",
        'legend-last-loc': "Current Location",
        
        'trend-increase': "Linear Climate Trend: Increase of {val} days",
        'trend-decrease': "Linear Climate Trend: Decrease of {val} days",
        
        'lbl-yes': "Yes",
        'lbl-no': "No",
        'lbl-active': "active",
        'lbl-target': "Target",
        'lbl-day-unit': "d",
        
        'no-names': "No name history.",
        'no-owners': "No operator history.",
        'no-devices': "No device history.",
        
        'tooltip-move': "Relocation on {date}!\nDistance: {dist}\nNew Location: {lat}°N, {lon}°E (Elevation: {elev}m)",
        'footer-made-by': 'Made by <a href="https://sibbl.net" target="_blank" class="text-orange-600 dark:text-orange-400 hover:underline font-semibold">sibbl</a>',
        'footer-github': 'GitHub Repository',
        'footer-original-idea': 'Original Idea'
    }
};

// Helper to get formatted end year label, appending month name if incomplete
function getEndYearLabel(lang) {
    if (maxDaysInMonthsOfLastYear[11] === 0) {
        let lastMonthIdx = 0; // 0-indexed
        for (let m = 11; m >= 0; m--) {
            if (maxDaysInMonthsOfLastYear[m] > 0) {
                lastMonthIdx = m;
                break;
            }
        }
        const monthName = i18n[lang]['month-names-long'][lastMonthIdx];
        return `${monthName} ${maxYearGlobal}`;
    }
    return maxYearGlobal.toString();
}

// Translate static HTML strings
function setLanguage(lang) {
    currentLang = lang;
    
    // Highlight toggled button
    const btnDe = document.getElementById('lang-de');
    const btnEn = document.getElementById('lang-en');
    if (lang === 'de') {
        btnDe.className = "px-3 py-1 rounded text-xs font-bold bg-orange-600 text-white transition duration-150";
        btnEn.className = "px-3 py-1 rounded text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition duration-150";
    } else {
        btnDe.className = "px-3 py-1 rounded text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition duration-150";
        btnEn.className = "px-3 py-1 rounded text-xs font-bold bg-orange-600 text-white transition duration-150";
    }
    
    // Translate static elements using direct dictionary lookup
    const endYearLabel = getEndYearLabel(lang);
    document.title = i18n[lang]['doc-title'].replace('2025', endYearLabel);
    document.getElementById('header-title').textContent = i18n[lang]['header-title'];
    document.getElementById('header-subtitle').textContent = i18n[lang]['header-subtitle'].replace('2025', endYearLabel);
    document.getElementById('stat-lbl-stations').textContent = i18n[lang]['stat-lbl-stations'];
    document.getElementById('stat-lbl-reports').textContent = i18n[lang]['stat-lbl-reports'];
    const lblHottest = document.getElementById('stat-lbl-hottest');
    if (lblHottest) lblHottest.textContent = i18n[lang]['stat-lbl-hottest'];
    
    const lblCardTitleFilter = document.getElementById('card-title-filter');
    if (lblCardTitleFilter) lblCardTitleFilter.textContent = i18n[lang]['card-title-filter'];
    
    document.getElementById('lbl-temp-threshold').textContent = i18n[lang]['lbl-temp-threshold'];
    document.getElementById('lbl-start-year').textContent = i18n[lang]['lbl-start-year'];
    
    const lblDescStartYear = document.getElementById('desc-start-year');
    if (lblDescStartYear) lblDescStartYear.textContent = i18n[lang]['desc-start-year'];
    
    document.getElementById('lbl-coverage').textContent = i18n[lang]['lbl-coverage'];
    
    const lblDescCoverage = document.getElementById('desc-coverage');
    if (lblDescCoverage) lblDescCoverage.textContent = i18n[lang]['desc-coverage'];
    
    document.getElementById('lbl-moves-filter').textContent = i18n[lang]['lbl-moves-filter'];
    
    // Translate monthly selector elements
    const lblMonths = document.getElementById('lbl-months');
    if (lblMonths) lblMonths.textContent = i18n[lang]['lbl-months'];
    
    const btnMonthAll = document.getElementById('btn-month-all');
    if (btnMonthAll) btnMonthAll.textContent = i18n[lang]['btn-month-all'];
    
    const btnMonthSummer = document.getElementById('btn-month-summer');
    if (btnMonthSummer) btnMonthSummer.textContent = i18n[lang]['btn-month-summer'];
    
    const btnMonthNone = document.getElementById('btn-month-none');
    if (btnMonthNone) btnMonthNone.textContent = i18n[lang]['btn-month-none'];
    
    renderMonthDropdownItems();
    updateMonthButtonLabel();
    
    document.getElementById('card-title-decades').textContent = i18n[lang]['card-title-decades'];
    document.getElementById('btn-lbl-decades').textContent = i18n[lang]['btn-lbl-decades'];
    document.getElementById('decades-methodology').innerHTML = i18n[lang]['decades-methodology'];
    
    document.getElementById('card-title-grid').textContent = i18n[lang]['card-title-grid'] + ` (${currentStartYear}–${endYearLabel})`;
    document.getElementById('card-subtitle-grid').textContent = i18n[lang]['card-subtitle-grid'];
    document.getElementById('legend-lbl-days').textContent = i18n[lang]['legend-lbl-days'];
    
    document.getElementById('inspector-title').textContent = i18n[lang]['inspector-title'];
    document.getElementById('inspector-subtitle').textContent = i18n[lang]['inspector-subtitle'];
    document.getElementById('inspector-lbl-stations').textContent = i18n[lang]['inspector-lbl-stations'];
    document.getElementById('input-station-search').placeholder = i18n[lang]['input-station-search-placeholder'];
    
    // Translate footer
    const madeByEl = document.getElementById('footer-made-by');
    if (madeByEl) madeByEl.innerHTML = i18n[lang]['footer-made-by'];
    const githubEl = document.getElementById('footer-github-text');
    if (githubEl) githubEl.textContent = i18n[lang]['footer-github'];
    const ideaEl = document.getElementById('footer-original-idea-text');
    if (ideaEl) ideaEl.textContent = i18n[lang]['footer-original-idea'];
    
    // Empty state inspector check
    const emptyState = document.getElementById('inspector-empty-state');
    if (emptyState) {
        document.getElementById('inspector-select-prompt').textContent = i18n[lang]['inspector-select-prompt'];
    }
    
    // Refresh dashboard
    updateDashboard();
    
    // Refresh inspector detail workspace if loaded
    if (selectedStationId) {
        renderStationWorkspace(selectedStationId);
    }
}

// Manual Theme Switch (Light/Dark Mode)
function toggleTheme() {
    const html = document.documentElement;
    const sunIcon = document.getElementById('theme-sun');
    const moonIcon = document.getElementById('theme-moon');
    
    if (html.classList.contains('dark')) {
        // Switch to Light Mode
        html.classList.remove('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        localStorage.setItem('theme', 'light');
    } else {
        // Switch to Dark Mode
        html.classList.add('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        localStorage.setItem('theme', 'dark');
    }
    
    // Instantly refresh elements that rely on canvas/SVG theme-specific colors
    updateDashboard();
    if (selectedStationId) {
        renderStationWorkspace(selectedStationId);
    }
}

// Initialize theme preference on load
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    const sunIcon = document.getElementById('theme-sun');
    const moonIcon = document.getElementById('theme-moon');
    
    if (savedTheme === 'light') {
        html.classList.remove('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        // Default is dark mode
        html.classList.add('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
}

// Bounding box calculation for Germany
function calculateBBox(geo) {
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    
    geo.features.forEach(f => {
        function traverse(coords) {
            if (typeof coords[0] === 'number') {
                const lon = coords[0], lat = coords[1];
                if (lon < minLon) minLon = lon;
                if (lon > maxLon) maxLon = lon;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
            } else {
                coords.forEach(traverse);
            }
        }
        traverse(f.geometry.coordinates);
    });
    
    const lonPad = (maxLon - minLon) * 0.08;
    const latPad = (maxLat - minLat) * 0.08;
    
    return {
        minLon: minLon - lonPad,
        maxLon: maxLon + lonPad,
        minLat: minLat - latPad,
        maxLat: maxLat + latPad
    };
}

// Equirectangular projection coordinates [lon, lat] -> [x, y]
function project(lon, lat, width, height, bounds) {
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
    const y = height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
    return [x, y];
}

// Convert GeoJSON geometry to SVG Path string
function geomToPath(geom, width, height, bounds) {
    let d = '';
    if (geom.type === 'Polygon') {
        geom.coordinates.forEach(ring => {
            const projected = ring.map(p => project(p[0], p[1], width, height, bounds));
            d += ' M ' + projected.map(p => p.join(',')).join(' L ') + ' Z ';
        });
    } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(poly => {
            poly.forEach(ring => {
                const projected = ring.map(p => project(p[0], p[1], width, height, bounds));
                d += ' M ' + projected.map(p => p.join(',')).join(' L ') + ' Z ';
            });
        });
    }
    return d;
}

// Format Date YYYYMMDD -> DD.MM.YYYY
function formatDate(dStr) {
    if (!dStr || dStr.trim() === '') return i18n[currentLang]['lbl-active'];
    if (dStr.length === 8) {
        return `${dStr.substring(6, 8)}.${dStr.substring(4, 6)}.${dStr.substring(0, 4)}`;
    }
    return dStr;
}

const HEAT_SCALES = {
    30: [5, 15, 30, 45, 60],
    31: [5, 15, 30, 45, 60],
    32: [5, 15, 30, 45, 60],
    33: [5, 10, 15, 20, 25],
    34: [5, 10, 15, 20, 25],
    35: [1, 4, 8, 12, 16],
    36: [1, 4, 8, 12, 16],
    37: [1, 2, 4, 6, 8],
    38: [1, 2, 4, 6, 8],
    39: [1, 2, 3, 4, 5],
    40: [1, 2, 3, 4, 5]
};

// Get heat bubble styling (radius, opacity, color)
function getHeatStyle(days) {
    if (days === 0) return { r: 0.5, opacity: 0.05, fill: '#475569' }; // extremely faint gray dot
    
    const scale = HEAT_SCALES[currentTempThreshold] || [1, 4, 8, 12, 16];
    
    if (days >= scale[0] && days < scale[1]) return { r: 2.2, opacity: 0.40, fill: '#ea580c' }; // single orange-red color, varying size & opacity
    if (days >= scale[1] && days < scale[2]) return { r: 3.4, opacity: 0.65, fill: '#ea580c' };
    if (days >= scale[2] && days < scale[3]) return { r: 4.6, opacity: 0.85, fill: '#ea580c' };
    if (days >= scale[3] && days < scale[4]) return { r: 5.8, opacity: 0.95, fill: '#ea580c' };
    return { r: 7.0, opacity: 1.0, fill: '#ea580c' }; // scale[4] or more
}

// Translate raw DWD equipment models to English
function translateDevice(devName) {
    if (currentLang === 'de') return devName;
    const dict = {
        'Maximumthermometer': 'Maximum Thermometer',
        'Temperaturmessung, konv.': 'Temperature measurement, conventional',
        'PT 100 (Luft)': 'PT 100 (Air Sensor)',
        'Temperaturmessung, elektr.': 'Temperature measurement, electrical',
        'Wetterdienst': 'Weather Service',
        'DWD': 'German Weather Service (DWD)'
    };
    return dict[devName] || devName;
}

// Initial Data Fetch
async function loadData() {
    initTheme();
    try {
        console.log("Loading weather and mapping data...");
        const [weatherRes, geojsonRes] = await Promise.all([
            fetch('data/weather_data.json?v=' + Date.now()),
            fetch('data/germany_states.json?v=' + Date.now())
        ]);
        
        weatherData = await weatherRes.json();
        geojson = await geojsonRes.json();
        
        bbox = calculateBBox(geojson);
        
        // Dynamically compute the maximum year available in the weather data
        let maxYear = 2025;
        weatherData.forEach(s => {
            if (s.annual_data) {
                Object.keys(s.annual_data).forEach(yrStr => {
                    const yr = parseInt(yrStr);
                    if (yr > maxYear) maxYear = yr;
                });
            }
        });
        maxYearGlobal = maxYear;
        currentActiveYear = maxYearGlobal;
        
        // Calculate max days observed in each month of the max year to handle incomplete current year
        maxDaysInMonthsOfLastYear = Array(12).fill(0);
        weatherData.forEach(s => {
            const yrData = s.annual_data[maxYearGlobal];
            if (yrData && yrData.m_valid) {
                for (let m = 0; m < 12; m++) {
                    const v = yrData.m_valid[m] || 0;
                    if (v > maxDaysInMonthsOfLastYear[m]) {
                        maxDaysInMonthsOfLastYear[m] = v;
                    }
                }
            }
        });
        
        console.log("Data loaded successfully!", weatherData.length, "stations, Max Year:", maxYearGlobal, "BBox:", bbox);
        
        // Load state from URL hash
        loadStateFromURLHash();
        setLanguage(currentLang);
        syncUIControls();
        
        // Initial render
        updateDashboard();
        
        // Select station from URL if specified
        if (selectedStationId) {
            const activeStations = getFilteredStations();
            if (activeStations.some(s => s.station_id === selectedStationId)) {
                selectStation(selectedStationId);
            }
        }
        
    } catch (err) {
        console.error("Failed to load dashboard data:", err);
        document.getElementById('map-grid-container').innerHTML = `
            <div class="col-span-full py-16 text-center text-red-400">
                <p class="text-base font-bold">Fehler beim Laden der Daten!</p>
                <p class="text-xs text-slate-500 mt-2">Bitte stellen Sie sicher, dass das Python-Pipeline-Skript erfolgreich ausgeführt wurde und die JSON-Dateien im Ordner 'data/' liegen.</p>
            </div>
        `;
    }
}

// Helper: Get the count of hot days for a station in a specific year, filtered by selected months
function getDaysCountForYear(station, year) {
    const yrData = station.annual_data[year];
    if (!yrData) return 0;
    
    // Fast path: if all 12 months are selected, return precalculated annual total
    if (currentMonths.length === 12) {
        return yrData[`t${currentTempThreshold}`] || 0;
    }
    
    if (!yrData.m_data) {
        return 0;
    }
    
    let sum = 0;
    currentMonths.forEach(m => {
        const mData = yrData.m_data[String(m)];
        if (mData) {
            sum += mData[`t${currentTempThreshold}`] || 0;
        }
    });
    return sum;
}

// Helper: Calculate data coverage for a station only over the selected sub-period and months
function calculateCoverageForPeriod(station, startYear, endYear) {
    let validDays = 0;
    let totalDays = 0;
    for (let yr = startYear; yr <= endYear; yr++) {
        const yrData = station.annual_data[yr];
        const isLeap = (yr % 4 === 0 && (yr % 100 !== 0 || yr % 400 === 0));
        
        let selectedYearDays = 0;
        let selectedValidDays = 0;
        
        currentMonths.forEach(m => {
            let mDays = 31;
            if (m === 2) {
                mDays = isLeap ? 29 : 28;
            } else if ([4, 6, 9, 11].includes(m)) {
                mDays = 30;
            }
            
            // Adjust denominator for the max year to avoid penalizing incomplete/future months
            if (yr === maxYearGlobal) {
                const maxObserved = maxDaysInMonthsOfLastYear[m - 1];
                if (maxObserved === 0) {
                    // Future month in the current ongoing year, exclude it from calculations
                    return;
                }
                mDays = maxObserved;
            }
            
            selectedYearDays += mDays;
            
            if (yrData) {
                if (yrData.m_valid && yrData.m_valid[m - 1] !== undefined) {
                    selectedValidDays += yrData.m_valid[m - 1];
                } else if (yrData.valid_days !== undefined) {
                    // Fallback scaling if monthly details are missing
                    const totalYearDays = isLeap ? 366 : 365;
                    selectedValidDays += (yrData.valid_days) * (mDays / totalYearDays);
                }
            }
        });
        
        validDays += selectedValidDays;
        totalDays += selectedYearDays;
    }
    return totalDays > 0 ? (validDays / totalDays) : 0;
}

// Helper: Check if a station moved during the selected sub-period
function checkMovesForPeriod(station, startYear, endYear) {
    const startStr = startYear + '0101';
    const endStr = endYear + '1231';
    
    const overlappingEpochs = station.metadata.geography.filter(g => {
        const epochStart = g.start || '19000101';
        const epochEnd = g.end || '99991231';
        return (epochStart <= endStr && epochEnd >= startStr);
    });
    
    const distinct = [];
    overlappingEpochs.forEach(g => {
        const lat = g.lat, lon = g.lon;
        if (!distinct.some(d => Math.abs(d.lat - lat) < 0.0001 && Math.abs(d.lon - lon) < 0.0001)) {
            distinct.push({ lat, lon });
        }
    });
    
    return distinct.length > 1;
}

// Get list of stations filtered by coverage and moves over the sub-period
function getFilteredStations() {
    return weatherData.filter(s => {
        const periodCoverage = calculateCoverageForPeriod(s, currentStartYear, maxYearGlobal);
        if (periodCoverage < currentCoverageThreshold) return false;
        
        const periodMoved = checkMovesForPeriod(s, currentStartYear, maxYearGlobal);
        if (currentMovesFilter === 'moved' && !periodMoved) return false;
        if (currentMovesFilter === 'unmoved' && periodMoved) return false;
        
        return true;
    });
}

// Calculate decadal reports and display them
function renderDecadalStats(filteredStations) {
    const currentDecadeLabel = `2021–${maxYearGlobal}`;
    const decadeTotals = {
        '1961–1970': 0,
        '1971–1980': 0,
        '1981–1990': 0,
        '1991–2000': 0,
        '2001–2010': 0,
        '2011–2020': 0,
        [currentDecadeLabel]: 0
    };
    
    filteredStations.forEach(s => {
        Object.entries(s.annual_data).forEach(([yearStr, data]) => {
            const yr = parseInt(yearStr);
            if (yr < currentStartYear) return;
            
            const count = getDaysCountForYear(s, yr);
            
            if (yr >= 1961 && yr <= 1970) decadeTotals['1961–1970'] += count;
            else if (yr >= 1971 && yr <= 1980) decadeTotals['1971–1980'] += count;
            else if (yr >= 1981 && yr <= 1990) decadeTotals['1981–1990'] += count;
            else if (yr >= 1991 && yr <= 2000) decadeTotals['1991–2000'] += count;
            else if (yr >= 2001 && yr <= 2010) decadeTotals['2001–2010'] += count;
            else if (yr >= 2011 && yr <= 2020) decadeTotals['2011–2020'] += count;
            else if (yr >= 2021 && yr <= maxYearGlobal) decadeTotals[currentDecadeLabel] += count;
        });
    });
    
    const maxDecadeVal = Math.max(...Object.values(decadeTotals), 1);
    
    const container = document.getElementById('decade-list-container');
    container.innerHTML = '';
    
    Object.entries(decadeTotals).forEach(([decadeName, total]) => {
        const decadeEnd = parseInt(decadeName.substring(5, 9));
        if (decadeEnd < currentStartYear) return;
        
        const pct = (total / maxDecadeVal) * 100;
        
        let referenceLabel = '';
        if (currentStartYear === 1961 && currentCoverageThreshold === 0.80 && currentTempThreshold === 35) {
            const refMap = {
                '1961–1970': 122, '1971–1980': 158, '1981–1990': 328,
                '1991–2000': 672, '2001–2010': 1321, '2011–2020': 2488
            };
            if (refMap[decadeName]) {
                const targetText = i18n[currentLang]['lbl-target'];
                referenceLabel = ` (${targetText}: ${refMap[decadeName]})`;
            }
        }
        
        const row = document.createElement('div');
        row.className = 'flex flex-col gap-1';
        row.innerHTML = `
            <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-slate-500 dark:text-slate-300">${decadeName}</span>
                <span class="font-extrabold text-orange-600 dark:text-orange-400">${total.toLocaleString()}<span class="text-[9px] text-slate-400 dark:text-slate-500 font-normal">${referenceLabel}</span></span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full h-3 overflow-hidden">
                <div class="bg-gradient-to-r from-orange-500 to-red-600 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
        `;
        container.appendChild(row);
    });
    
    return decadeTotals;
}

// Update Global Stats Panel
function updateGlobalStats(filteredStations, decadeTotals) {
    document.getElementById('stat-stations-count').textContent = filteredStations.length;
    
    let totalReports = 0;
    let yearTotals = {};
    
    filteredStations.forEach(s => {
        Object.entries(s.annual_data).forEach(([yrStr, data]) => {
            const yr = parseInt(yrStr);
            if (yr < currentStartYear) return;
            
            const count = getDaysCountForYear(s, yr);
            totalReports += count;
            yearTotals[yr] = (yearTotals[yr] || 0) + count;
        });
    });
    
    document.getElementById('stat-total-reports').textContent = totalReports.toLocaleString();
    
    let hottestYear = 'N/A';
    let maxYearCount = -1;
    Object.entries(yearTotals).forEach(([yr, count]) => {
        if (count > maxYearCount) {
            maxYearCount = count;
            hottestYear = yr;
        }
    });
    
    const statHottestYear = document.getElementById('stat-hottest-year');
    if (statHottestYear) {
        statHottestYear.textContent = hottestYear !== 'N/A' ? `${hottestYear} (${maxYearCount})` : 'N/A';
    }
}

// Render the miniature maps grid
function renderMapsGrid(filteredStations) {
    const gridContainer = document.getElementById('map-grid-container');
    gridContainer.innerHTML = '';
    
    // Check active theme
    const isDark = document.documentElement.classList.contains('dark');
    
    const statesPathsSvg = geojson.features.map(f => {
        const d = geomToPath(f.geometry, 110, 140, bbox);
        const stroke = isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(71, 85, 105, 0.25)";
        return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="0.5" />`;
    }).join('\n');
    
    // Define the standardized decades matching the Mirror/Spiegel stats
    const decades = [
        [1961, 1970],
        [1971, 1980],
        [1981, 1990],
        [1991, 2000],
        [2001, 2010],
        [2011, 2020],
        [2021, maxYearGlobal]
    ];
    
    decades.forEach(dec => {
        const startDec = dec[0];
        const endDec = dec[1];
        
        // Skip rendering this row entirely if the start year hides this decade completely
        if (endDec < currentStartYear) return;
        
        for (let yr = startDec; yr <= endDec; yr++) {
            if (yr < currentStartYear) {
                // Render an empty card placeholder to align decade grids cleanly on desktop
                const placeholder = document.createElement('div');
                placeholder.className = 'hidden lg:block rounded-lg p-2.5 border border-transparent';
                gridContainer.appendChild(placeholder);
                continue;
            }
            
            let circlesSvg = '';
            let totalYearDays = 0;
            
            filteredStations.forEach(s => {
                const days = getDaysCountForYear(s, yr);
                totalYearDays += days;
                
                const [x, y] = project(s.current_location.lon, s.current_location.lat, 110, 140, bbox);
                const style = getHeatStyle(days);
                
                circlesSvg += `
                    <circle cx="${x}" cy="${y}" r="${style.r}" 
                            fill="${style.fill}" fill-opacity="${style.opacity}" 
                            stroke="${isDark ? '#05070c' : '#ffffff'}" stroke-width="0.3"
                            class="transition-all duration-300">
                        <title>${s.name}: ${days} ${i18n[currentLang]['lbl-day-unit']}</title>
                    </circle>
                `;
            });
            
            const card = document.createElement('div');
            card.id = `map-card-${yr}`;
            card.className = `glass-panel rounded-lg p-2.5 flex flex-col items-center justify-between border border-slate-200 dark:border-slate-850 cursor-pointer hover:border-slate-500 hover:scale-[1.03] transition-all duration-200`;
            
            card.innerHTML = `
                <div class="flex justify-between items-center w-full mb-1 text-[10px]">
                    <span class="font-extrabold text-slate-500 dark:text-slate-300 text-xs">${yr}</span>
                    <span class="font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1 rounded border border-orange-500/10">${totalYearDays} <span class="text-[8px] font-normal text-slate-400 dark:text-slate-500">${i18n[currentLang]['lbl-day-unit']}</span></span>
                </div>
                <svg viewBox="0 0 110 140" class="w-full h-auto">
                    ${statesPathsSvg}
                    ${circlesSvg}
                </svg>
            `;
            gridContainer.appendChild(card);
        }
    });
}

// Perform dashboard redraw upon parameter changes
function updateDashboard() {
    const filteredStations = getFilteredStations();
    
    // Update headers based on view mode
    const titleElement = document.getElementById('card-title-grid');
    const subtitleElement = document.getElementById('card-subtitle-grid');
    if (titleElement) {
        const endYearLabel = getEndYearLabel(currentLang);
        if (currentViewMode === 'grid') {
            titleElement.textContent = i18n[currentLang]['card-title-grid'] + ` (${currentStartYear}–${endYearLabel})`;
        } else {
            titleElement.textContent = i18n[currentLang]['card-title-single'] + ` (${currentStartYear}–${endYearLabel})`;
        }
    }
    if (subtitleElement) {
        if (currentViewMode === 'grid') {
            subtitleElement.textContent = i18n[currentLang]['card-subtitle-grid'];
        } else {
            subtitleElement.textContent = i18n[currentLang]['card-subtitle-single'];
        }
    }
    
    const decadeTotals = renderDecadalStats(filteredStations);
    updateGlobalStats(filteredStations, decadeTotals);
    
    if (currentViewMode === 'grid') {
        renderMapsGrid(filteredStations);
    } else {
        renderSingleMap(filteredStations);
    }
    
    renderInspectorStationList(filteredStations);
    filterStationList(currentSearchQuery, true);
    
    // Calculate and update the checkbox label with (unmovedCount of totalCoverageCount)
    const baseStations = weatherData.filter(s => {
        return calculateCoverageForPeriod(s, currentStartYear, maxYearGlobal) >= currentCoverageThreshold;
    });
    const y = baseStations.length;
    const x = baseStations.filter(s => !checkMovesForPeriod(s, currentStartYear, maxYearGlobal)).length;
    
    const ratioElement = document.getElementById('lbl-moves-ratio');
    if (ratioElement) {
        const ofWord = currentLang === 'de' ? 'von' : 'of';
        ratioElement.textContent = `(${x} ${ofWord} ${y})`;
    }
    
    // Update legend circles with visual sizes matching the maps
    updateLegend();
    setTimeout(updateLegend, 50);
    
    // Update the URL hash to capture full parameter states
    updateURLHash();
}

// Parameters modifications
function setTemperatureThreshold(temp) {
    currentTempThreshold = parseInt(temp);
    
    const valDisplay = document.getElementById('temp-threshold-val');
    if (valDisplay) {
        valDisplay.textContent = `${currentTempThreshold} °C`;
    }
    
    const slider = document.getElementById('slider-temp-threshold');
    if (slider) {
        slider.value = currentTempThreshold;
    }
    
    updateDashboard();
    
    if (selectedStationId) {
        renderStationWorkspace(selectedStationId);
    }
}

function updateStartYear(val) {
    currentStartYear = parseInt(val);
    document.getElementById('start-year-val').textContent = val;
    updateDashboard();
}

function updateCoverageThreshold(val) {
    currentCoverageThreshold = val / 100;
    document.getElementById('coverage-val').textContent = `${val} %`;
    updateDashboard();
}

function toggleMovesFilter(isChecked) {
    currentMovesFilter = isChecked ? 'unmoved' : 'all';
    updateDashboard();
}

// Month Selection Dropdown Logic
function toggleMonthDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    const panel = document.getElementById('month-dropdown-panel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        panel.getBoundingClientRect(); // trigger reflow
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    } else {
        closeMonthDropdown();
    }
}

function closeMonthDropdown() {
    const panel = document.getElementById('month-dropdown-panel');
    if (!panel || panel.classList.contains('hidden')) return;
    
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        panel.classList.add('hidden');
    }, 150);
}

function selectMonths(type) {
    if (type === 'all') {
        currentMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    } else if (type === 'summer') {
        currentMonths = [5, 6, 7, 8, 9];
    } else if (type === 'none') {
        currentMonths = [];
    }
    
    for (let m = 1; m <= 12; m++) {
        const checkbox = document.getElementById(`check-month-${m}`);
        if (checkbox) {
            checkbox.checked = currentMonths.includes(m);
        }
    }
    
    updateMonthButtonLabel();
    updateDashboard();
    
    if (selectedStationId) {
        renderStationWorkspace(selectedStationId);
    }
}

function onMonthCheckboxChange(checkbox) {
    const val = parseInt(checkbox.value);
    if (checkbox.checked) {
        if (!currentMonths.includes(val)) {
            currentMonths.push(val);
        }
    } else {
        currentMonths = currentMonths.filter(m => m !== val);
    }
    currentMonths.sort((a, b) => a - b);
    
    updateMonthButtonLabel();
    updateDashboard();
    
    if (selectedStationId) {
        renderStationWorkspace(selectedStationId);
    }
}

function updateMonthButtonLabel() {
    const btnLabel = document.getElementById('btn-month-val');
    if (!btnLabel) return;
    
    const lang = currentLang;
    if (currentMonths.length === 12) {
        btnLabel.textContent = i18n[lang]['all-months'];
    } else if (currentMonths.length === 0) {
        btnLabel.textContent = i18n[lang]['no-months'];
    } else if (currentMonths.length === 5 && currentMonths.every((v, i) => v === [5, 6, 7, 8, 9][i])) {
        btnLabel.textContent = i18n[lang]['summer-months'];
    } else {
        if (currentMonths.length <= 3) {
            const monthsShort = i18n[lang]['month-names'];
            btnLabel.textContent = currentMonths.map(m => monthsShort[m - 1]).join(', ');
        } else {
            btnLabel.textContent = i18n[lang]['n-months'].replace('{n}', currentMonths.length);
        }
    }
}

function renderMonthDropdownItems() {
    const container = document.getElementById('month-checkboxes-container');
    if (!container) return;
    
    const lang = currentLang;
    const monthsShort = i18n[lang]['month-names'];
    const monthsLong = i18n[lang]['month-names-long'];
    
    container.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const isChecked = currentMonths.includes(m);
        const div = document.createElement('div');
        div.className = 'flex items-center gap-1.5';
        div.innerHTML = `
            <input type="checkbox" id="check-month-${m}" value="${m}" ${isChecked ? 'checked' : ''} 
                   onchange="onMonthCheckboxChange(this)"
                   class="w-3.5 h-3.5 text-orange-600 bg-slate-100 dark:bg-slate-955 border-slate-350 dark:border-slate-800 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer accent-orange-500">
            <label for="check-month-${m}" class="cursor-pointer select-none text-slate-600 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white" title="${monthsLong[m - 1]}">
                ${monthsShort[m - 1]}
            </label>
        `;
        container.appendChild(div);
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const panel = document.getElementById('month-dropdown-panel');
    const button = document.getElementById('btn-month-dropdown');
    if (panel && button) {
        if (!panel.contains(event.target) && !button.contains(event.target)) {
            closeMonthDropdown();
        }
    }
});

// Station Inspector Implementation
function renderInspectorStationList(filteredStations) {
    const listContainer = document.getElementById('inspector-station-list');
    listContainer.innerHTML = '';
    
    const sorted = [...filteredStations].sort((a, b) => a.name.localeCompare(b.name));
    
    sorted.forEach(s => {
        const item = document.createElement('button');
        item.id = `inspector-item-${s.station_id}`;
        
        const periodCoverage = calculateCoverageForPeriod(s, currentStartYear, maxYearGlobal);
        const periodMoved = checkMovesForPeriod(s, currentStartYear, maxYearGlobal);
        
        const showState = s.state && s.state !== 'Unknown';
        let subText = showState ? `${s.state} · ${Math.round(periodCoverage*100)}%` : `${Math.round(periodCoverage*100)}%`;
        if (periodMoved) {
            let periodMoveCount = 0;
            const startStr = currentStartYear + '0101';
            const coordsHistory = [];
            
            s.metadata.geography.forEach(g => {
                const epochStart = g.start || '19000101';
                const epochEnd = g.end || '99991231';
                if (epochStart <= maxYearGlobal + '1231' && epochEnd >= startStr) {
                    const lat = g.lat, lon = g.lon;
                    if (!coordsHistory.some(d => Math.abs(d.lat - lat) < 0.0001 && Math.abs(d.lon - lon) < 0.0001)) {
                        coordsHistory.push({ lat, lon });
                    }
                }
            });
            periodMoveCount = Math.max(coordsHistory.length - 1, 0);
            
            if (periodMoveCount > 0) {
                const movedText = currentLang === 'de' ? 'Verlegt' : 'Moved';
                subText += ` · 📍 ${movedText} (${periodMoveCount}x)`;
            }
        }
        
        item.className = `flex flex-col items-start px-3 py-2 rounded-lg text-left w-full text-xs transition duration-150 ${s.station_id === selectedStationId ? 'bg-orange-600 text-white font-semibold shadow-sm shadow-orange-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-300 dark:hover:border-slate-800'}`;
        item.setAttribute('onclick', `selectStation('${s.station_id}')`);
        
        item.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span class="truncate pr-1">${s.name}</span>
                <span class="text-[9px] opacity-60 font-mono">ID ${s.station_id}</span>
            </div>
            <span class="text-[9px] opacity-80 mt-0.5">${subText}</span>
        `;
        listContainer.appendChild(item);
    });
}

function filterStationList(query, skipHashUpdate = false) {
    currentSearchQuery = query;
    const q = query.toLowerCase().trim();
    const filteredStations = getFilteredStations();
    
    filteredStations.forEach(s => {
        const item = document.getElementById(`inspector-item-${s.station_id}`);
        if (!item) return;
        
        const matches = s.name.toLowerCase().includes(q) || s.station_id.includes(q) || s.state.toLowerCase().includes(q);
        if (matches) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
    
    if (!skipHashUpdate) {
        updateURLHash();
    }
}

function selectStation(sid) {
    if (selectedStationId) {
        const oldItem = document.getElementById(`inspector-item-${selectedStationId}`);
        if (oldItem) {
            oldItem.className = oldItem.className.replace('bg-orange-600 text-white font-semibold shadow-sm shadow-orange-500/20', 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-300 dark:hover:border-slate-800');
        }
    }
    
    if (!sid) {
        selectedStationId = null;
        const workspace = document.getElementById('inspector-workspace');
        if (workspace) {
            workspace.innerHTML = `
                <div id="inspector-empty-state" class="col-span-full flex flex-col items-center justify-center text-center text-slate-450 dark:text-slate-500 py-20">
                    <svg class="w-16 h-16 stroke-current opacity-30 mb-4" fill="none" stroke-width="1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <p id="inspector-select-prompt" class="text-sm font-semibold">${i18n[currentLang]['inspector-select-prompt']}</p>
                </div>
            `;
        }
        updateURLHash();
        return;
    }
    
    selectedStationId = sid;
    
    const newItem = document.getElementById(`inspector-item-${sid}`);
    if (newItem) {
        newItem.className = newItem.className.replace('text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-300 dark:hover:border-slate-800', 'bg-orange-600 text-white font-semibold shadow-sm shadow-orange-500/20');
    }
    
    renderStationWorkspace(sid);
    updateURLHash(); // Update URL hash dynamically when a new station is selected
}

// Draw Inspector panels
function renderStationWorkspace(sid) {
    const s = weatherData.find(st => st.station_id === sid);
    const workspace = document.getElementById('inspector-workspace');
    if (!s) return;
    
    const periodCoverage = calculateCoverageForPeriod(s, currentStartYear, maxYearGlobal);
    const periodMoved = checkMovesForPeriod(s, currentStartYear, maxYearGlobal);
    
    const t = i18n[currentLang];
    
    let periodMoveCount = 0;
    let periodMoveDistance = 0.0;
    const startStr = currentStartYear + '0101';
    
    const activeGeogs = s.metadata.geography.filter(g => {
        const epochStart = g.start || '19000101';
        const epochEnd = g.end || '99991231';
        return (epochStart <= maxYearGlobal + '1231' && epochEnd >= startStr);
    });
    
    const distinctCoords = [];
    activeGeogs.forEach(g => {
        const lat = g.lat, lon = g.lon;
        if (!distinctCoords.some(d => Math.abs(d.lat - lat) < 0.0001 && Math.abs(d.lon - lon) < 0.0001)) {
            distinctCoords.push(g);
        }
    });
    
    if (distinctCoords.length > 1) {
        periodMoveCount = distinctCoords.length - 1;
        for (let i = 1; i < distinctCoords.length; i++) {
            periodMoveDistance += haversine(
                distinctCoords[i-1].lat, distinctCoords[i-1].lon,
                distinctCoords[i].lat, distinctCoords[i].lon
            );
        }
    }
    
    const chartTitle = t['lbl-chart-trend'].replace('{temp}', currentTempThreshold);
    const chartSubtitle = t['lbl-chart-sub'].replace('{start}', currentStartYear).replace('2025', getEndYearLabel(currentLang));
    
    workspace.innerHTML = `
        <!-- Left details column -->
        <div class="md:col-span-8 flex flex-col gap-6">
            
            <!-- Basic station card -->
            <div class="bg-slate-200/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-850 rounded-xl p-5 flex flex-col gap-3">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-[9px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">${t['type-station']}</span>
                        <h3 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">${s.name}</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${(s.state && s.state !== 'Unknown') ? s.state + ' · ' : ''}ID ${s.station_id}</p>
                    </div>
                    <div class="text-right flex flex-col text-xs text-slate-500 dark:text-slate-400">
                        <span>${t['lbl-active-span']}:</span>
                        <span class="font-bold text-slate-700 dark:text-slate-200 mt-0.5">${formatDate(s.start_date)} - ${formatDate(s.end_date)}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-4 mt-2 border-t border-slate-300/80 dark:border-slate-850/80 pt-3 text-xs">
                    <div class="flex flex-col">
                        <span class="text-slate-500 dark:text-slate-400 text-[10px]">${t['lbl-elevation']}</span>
                        <span class="font-bold text-slate-700 dark:text-slate-200 mt-0.5">${s.current_location.elevation} m ü. NN</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-slate-500 dark:text-slate-400 text-[10px]">${t['lbl-geo-pos']}</span>
                        <span class="font-bold text-slate-700 dark:text-slate-200 mt-0.5">${s.current_location.lat.toFixed(4)}° N, ${s.current_location.lon.toFixed(4)}° E</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-slate-500 dark:text-slate-400 text-[10px]">${t['lbl-coverage-ins']}</span>
                        <span class="font-bold text-slate-700 dark:text-slate-200 mt-0.5">${Math.round(periodCoverage*100)} %</span>
                    </div>
                </div>
            </div>
            
            <!-- Trend Heat Chart Card -->
            <div class="bg-slate-200/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-850 rounded-xl p-5 flex flex-col gap-4">
                <div class="flex justify-between items-center border-b border-slate-300 dark:border-slate-850 pb-2">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">${chartTitle}</h4>
                    <span class="text-[10px] text-slate-550 dark:text-slate-500 font-medium">${chartSubtitle}</span>
                </div>
                <div id="inspector-trend-chart" class="w-full h-48 flex items-end">
                    <!-- SVG Chart injected below -->
                </div>
            </div>

            <!-- Detailed Timelines -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Names History -->
                <div class="bg-slate-200/30 dark:bg-slate-900/30 border border-slate-300/55 dark:border-slate-850/50 rounded-lg p-4 flex flex-col">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-300/50 dark:border-slate-850/50 pb-1.5 mb-3">${t['lbl-names-timeline']}</span>
                    <div class="flex flex-col gap-4 overflow-y-auto max-h-[140px] pr-1">
                        ${s.metadata.names.map(n => `
                            <div class="flex flex-col gap-0.5 border-l-2 border-slate-350 dark:border-slate-800 pl-2.5">
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-200">${n.name}</span>
                                <span class="text-[9px] text-slate-550 dark:text-slate-550">${formatDate(n.start)} - ${formatDate(n.end)}</span>
                            </div>
                        `).join('') || `<span class="text-xs text-slate-500">${t['no-names']}</span>`}
                    </div>
                </div>

                <!-- Operators History -->
                <div class="bg-slate-200/30 dark:bg-slate-900/30 border border-slate-300/55 dark:border-slate-850/50 rounded-lg p-4 flex flex-col">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 border-b border-slate-300/50 dark:border-slate-850/50 pb-1.5 mb-3">${t['lbl-owners-timeline']}</span>
                    <div class="flex flex-col gap-4 overflow-y-auto max-h-[140px] pr-1">
                        ${s.metadata.owners.map(o => `
                            <div class="flex flex-col gap-0.5 border-l-2 border-slate-350 dark:border-slate-800 pl-2.5">
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-200">${translateDevice(o.owner)}</span>
                                <span class="text-[9px] text-slate-550 dark:text-slate-550">${formatDate(o.start)} - ${formatDate(o.end)}</span>
                            </div>
                        `).join('') || `<span class="text-xs text-slate-500">${t['no-owners']}</span>`}
                    </div>
                </div>

                <!-- Devices History -->
                <div class="bg-slate-200/30 dark:bg-slate-900/30 border border-slate-300/55 dark:border-slate-850/50 rounded-lg p-4 flex flex-col">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 border-b border-slate-300/50 dark:border-slate-850/50 pb-1.5 mb-3">${t['lbl-devices-timeline']}</span>
                    <div class="flex flex-col gap-3.5 overflow-y-auto max-h-[140px] pr-1">
                        ${s.metadata.devices.filter(d => d.device.trim() || d.method.trim()).map(d => {
                            const methodText = d.method.trim() ? translateDevice(d.method) : '';
                            const heightText = d.sensor_height && d.sensor_height.trim() ? ` (${d.sensor_height.trim()}m)` : '';
                            const subText = methodText || heightText ? `<span class="text-[9px] text-slate-600 dark:text-slate-400">${methodText}${heightText}</span>` : '';
                            const deviceTitle = d.device.trim() ? translateDevice(d.device) : (currentLang === 'de' ? 'Unbekanntes Gerät' : 'Unknown Device');
                            return `
                            <div class="flex flex-col gap-0.5 border-l-2 border-orange-500/20 pl-2.5">
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title="${deviceTitle}">${deviceTitle}</span>
                                ${subText}
                                <span class="text-[9px] text-slate-550 dark:text-slate-550">${formatDate(d.start)} - ${formatDate(d.end)}</span>
                            </div>
                            `;
                        }).join('') || `<span class="text-xs text-slate-500">${t['no-devices']}</span>`}
                    </div>
                </div>
            </div>

        </div>

        <!-- Right details column -->
        <div class="md:col-span-4 bg-slate-200/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-850 rounded-xl p-5 flex flex-col gap-4">
            <div class="border-b border-slate-300 dark:border-slate-850 pb-2">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">${t['lbl-moves-log']}</h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-550 mt-0.5">${currentLang === 'de' ? 'Chronologische Erfassung aller Standortverlegungen' : 'Chronological log of all station relocations'}</p>
            </div>
            
            <div class="flex flex-col gap-2 mt-1 text-xs text-slate-600 dark:text-slate-300">
                <div class="flex justify-between border-b border-slate-300 dark:border-slate-850 pb-1">
                    <span class="text-slate-550 dark:text-slate-400">${t['lbl-moves-status']}</span>
                    <span class="font-bold ${periodMoved ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}">${periodMoved ? `${t['lbl-yes']} (${periodMoveCount}x)` : t['lbl-no']}</span>
                </div>
                ${periodMoved ? `
                <div class="flex justify-between border-b border-slate-300 dark:border-slate-850 pb-1">
                    <span class="text-slate-550 dark:text-slate-400">${t['lbl-moves-distance']}</span>
                    <span class="font-bold text-amber-600 dark:text-amber-300">${(periodMoveDistance / 1000).toFixed(2)} km</span>
                </div>
                ` : ''}
            </div>
            
            <!-- Moves History Log -->
            <div class="flex-grow overflow-y-auto max-h-[360px] flex flex-col gap-2.5 mt-2 pr-1 border-t border-slate-300 dark:border-slate-850/60 pt-3">
                <div class="flex flex-col gap-3">
                    ${distinctCoords.map((g, i) => {
                        let distanceLabel = '';
                        if (i > 0) {
                            const prev = distinctCoords[i-1];
                            const dist = haversine(prev.lat, prev.lon, g.lat, g.lon);
                            const distTxt = dist >= 1000 ? `${(dist/1000).toFixed(2)} km` : `${Math.round(dist)} m`;
                            distanceLabel = `<span class="text-[8px] bg-slate-200 dark:bg-slate-850 px-1 rounded text-orange-600 dark:text-orange-400 font-mono">${t['lbl-move-dist']} ${distTxt}</span>`;
                        }
                        return `
                        <div class="flex flex-col gap-0.5 text-[10px]">
                            <div class="flex items-center gap-2 justify-between">
                                <span class="font-semibold text-slate-700 dark:text-slate-200">${t['lbl-epoch']} ${i + 1} ${distanceLabel}</span>
                                <span class="text-[9px] text-slate-550 dark:text-slate-550">${formatDate(g.start)} - ${formatDate(g.end)}</span>
                            </div>
                            <div class="flex justify-between text-slate-500 dark:text-slate-400 leading-normal pl-2 border-l border-slate-300 dark:border-slate-800">
                                <span>${t['lbl-height']} ${g.elevation} m</span>
                                <span>${t['lbl-pos']} ${g.lat.toFixed(4)}°N, ${g.lon.toFixed(4)}°E</span>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    renderStationTrendChart(sid);
}

// Generate dynamic SVG trend chart strictly inside period
function renderStationTrendChart(sid) {
    const s = weatherData.find(st => st.station_id === sid);
    const container = document.getElementById('inspector-trend-chart');
    if (!s || !container) return;
    
    const width = container.clientWidth || 550;
    const height = 180;
    const padding = { top: 15, right: 15, bottom: 25, left: 30 };
    
    const t = i18n[currentLang];
    const isDark = document.documentElement.classList.contains('dark');
    
    const years = [];
    const counts = [];
    for (let yr = currentStartYear; yr <= maxYearGlobal; yr++) {
        years.push(yr);
        counts.push(getDaysCountForYear(s, yr));
    }
    
    const maxVal = Math.max(...counts, 5);
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const getX = (index) => padding.left + (index / (years.length - 1)) * chartWidth;
    const getY = (val) => padding.top + chartHeight - (val / maxVal) * chartHeight;
    
    // 1. Calculate linear regression trendline
    let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
    const N = years.length;
    for (let i = 0; i < N; i++) {
        sumX += i;
        sumY += counts[i];
        sumXX += i * i;
        sumXY += i * counts[i];
    }
    const slope = (N * sumXY - sumX * sumY) / (N * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / N;
    
    const trendPts = [];
    for (let i = 0; i < N; i += N - 1) {
        const val = slope * i + intercept;
        trendPts.push([getX(i), getY(val)]);
    }
    const trendPath = `M ${trendPts[0].join(',')} L ${trendPts[1].join(',')}`;
    
    const trendStart = intercept;
    const trendEnd = slope * (N - 1) + intercept;
    const trendIncrease = (trendEnd - trendStart).toFixed(1);
    
    // Theme-specific styles
    const axisStroke = isDark ? "#334155" : "#cbd5e1";
    const gridStroke = isDark ? "#1e293b" : "#e2e8f0";
    const textFill = isDark ? "#94a3b8" : "#64748b";
    const annotBg = isDark ? "#0f172a" : "#f1f5f9";
    const annotBorder = isDark ? "#1e293b" : "#cbd5e1";
    
    // 2. Y-Axis Ticks
    let yGridSvg = '';
    const ticksCount = 4;
    for (let i = 0; i <= ticksCount; i++) {
        const val = (maxVal / ticksCount) * i;
        const y = getY(val);
        yGridSvg += `
            <g stroke="${gridStroke}" stroke-width="0.5">
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke-dasharray="${i === 0 ? 'none' : '2,4'}" />
                <text x="${padding.left - 6}" y="${y + 3}" fill="${textFill}" font-size="8" text-anchor="end" font-weight="bold" stroke="none">${Math.round(val)}</text>
            </g>
        `;
    }
    
    // 3. X-Axis Labels
    let xLabelsSvg = '';
    const step = N > 30 ? 10 : 5;
    years.forEach((yr, i) => {
        if (yr % step === 0 || yr === maxYearGlobal || yr === currentStartYear) {
            const x = getX(i);
            xLabelsSvg += `
                <text x="${x}" y="${height - padding.bottom + 14}" fill="${textFill}" font-size="8" text-anchor="middle" font-weight="bold">${yr}</text>
                <line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 3}" stroke="${axisStroke}" stroke-width="1" />
            `;
        }
    });
    
    // 4. Data Bars
    let barsSvg = '';
    const barWidth = Math.max((chartWidth / N) * 0.7, 2);
    
    counts.forEach((val, i) => {
        const x = getX(i) - barWidth / 2;
        const y = getY(val);
        const h = chartHeight - (getY(val) - padding.top);
        
        let fill = 'url(#bar-cool-grad)';
        if (val >= 1) fill = 'url(#bar-heat-grad)';
        if (val >= 12) fill = 'url(#bar-extreme-grad)';
        
        barsSvg += `
            <g class="cursor-pointer group">
                <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(h, 0.5)}" 
                      fill="${fill}" rx="1" ry="1" 
                      class="transition-all duration-300 hover:fill-amber-400">
                    <title>${years[i]}: ${val} ${t['lbl-day-unit']}</title>
                </rect>
            </g>
        `;
    });
    
    // 5. Add move locator pin indicators inside the selected period
    let movePinsSvg = '';
    const geogs = s.metadata.geography;
    if (geogs.length > 1) {
        for (let idx = 1; idx < geogs.length; idx++) {
            const g = geogs[idx];
            const startStr = g.start;
            if (startStr && startStr.length >= 4) {
                const yr = parseInt(startStr.substring(0, 4));
                if (yr >= currentStartYear && yr <= maxYearGlobal) {
                    const yearIndex = yr - currentStartYear;
                    const x = getX(yearIndex);
                    const yAxis = height - padding.bottom;
                    
                    const prev = geogs[idx - 1];
                    const dist = haversine(prev.lat, prev.lon, g.lat, g.lon);
                    const distText = dist >= 1000 ? `${(dist / 1000).toFixed(2)} km` : `${Math.round(dist)} m`;
                    
                    const rawTooltip = t['tooltip-move']
                        .replace('{date}', formatDate(startStr))
                        .replace('{dist}', distText)
                        .replace('{lat}', g.lat.toFixed(4))
                        .replace('{lon}', g.lon.toFixed(4))
                        .replace('{elev}', g.elevation);
                    
                    movePinsSvg += `
                        <g class="cursor-pointer group" transform="translate(${x - 5}, ${yAxis - 14}) scale(0.4)">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                                  fill="#ea580c" stroke="#fef08a" stroke-width="1.2" />
                            <circle cx="12" cy="22" r="2.5" fill="#f97316" class="animate-ping origin-center" />
                            <title>${rawTooltip}</title>
                        </g>
                    `;
                }
            }
        }
    }
    
    const annotationText = slope >= 0 
        ? t['trend-increase'].replace('{val}', trendIncrease)
        : t['trend-decrease'].replace('{val}', trendIncrease);
        
    container.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="w-full h-full">
            <defs>
                <linearGradient id="bar-cool-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${isDark ? '#475569' : '#cbd5e1'}" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="${isDark ? '#334155' : '#94a3b8'}" stop-opacity="0.3"/>
                </linearGradient>
                <linearGradient id="bar-heat-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f97316" stop-opacity="0.9"/>
                    <stop offset="100%" stop-color="#ea580c" stop-opacity="0.4"/>
                </linearGradient>
                <linearGradient id="bar-extreme-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.95"/>
                    <stop offset="100%" stop-color="#991b1b" stop-opacity="0.5"/>
                </linearGradient>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#f43f5e" flood-opacity="0.3" />
                </filter>
            </defs>
            
            <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="${axisStroke}" stroke-width="1" />
            
            ${yGridSvg}
            ${xLabelsSvg}
            ${barsSvg}
            ${movePinsSvg}
            
            <path d="${trendPath}" fill="none" stroke="#f43f5e" stroke-width="2" filter="url(#shadow)" stroke-linecap="round" />
            
            <g>
                <rect x="${padding.left + 12}" y="${padding.top + 2}" width="220" height="20" rx="3" fill="${annotBg}" fill-opacity="0.9" stroke="${annotBorder}" stroke-width="0.5" />
                <text x="${padding.left + 18}" y="${padding.top + 14}" fill="${slope >= 0 ? (isDark ? '#fda4af' : '#b91c1c') : textFill}" font-size="8" font-weight="bold">
                    ${annotationText}
                </text>
            </g>
        </svg>
    `;
}

// Haversine helper to compute geodetic distance on client
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const dphi = (lat2 - lat1) * Math.PI / 180;
    const dlambda = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dphi/2) * Math.sin(dphi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(dlambda/2) * Math.sin(dlambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Render/Update the Legend bubbles to match the map circles' scale exactly
function updateLegend() {
    const container = document.getElementById('legend-circles-container');
    if (!container) return;

    // Measure the actual width of a rendered map SVG to calculate scaling factor
    let scale = 0.9; // Sensible default scale for legend when grid is hidden
    const mapSvg = document.querySelector('#map-grid-container svg');
    if (mapSvg) {
        const rect = mapSvg.getBoundingClientRect();
        if (rect.width > 0) {
            scale = rect.width / 110; // viewBox width is 110
        }
    }

    const isDark = document.documentElement.classList.contains('dark');
    const strokeColor = isDark ? '#05070c' : '#ffffff';

    const activeScale = HEAT_SCALES[currentTempThreshold] || [1, 4, 8, 12, 16];
    const groups = [
        { label: `${activeScale[0]}`, minDays: activeScale[0] },
        { label: `${activeScale[1]}`, minDays: activeScale[1] },
        { label: `${activeScale[2]}`, minDays: activeScale[2] },
        { label: `${activeScale[3]}`, minDays: activeScale[3] },
        { label: `${activeScale[4]}+`, minDays: activeScale[4] }
    ];

    container.innerHTML = groups.map(g => {
        const style = getHeatStyle(g.minDays);
        // Base SVG canvas size in CSS pixels:
        // We use a 20x20 px container so the circle has plenty of room (max base radius 8.0 scaled is usually ~6-9px, so diameter is 12-18px)
        const size = 20;
        const center = size / 2;
        const physicalRadius = style.r * scale;

        return `
            <span class="flex items-center gap-1">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="inline-block flex-shrink-0 text-center">
                    <circle cx="${center}" cy="${center}" r="${physicalRadius}"
                            fill="${style.fill}" fill-opacity="${style.opacity}"
                            stroke="${strokeColor}" stroke-width="0.3" />
                </svg>
                <span class="text-xs font-mono font-bold">${g.label}</span>
            </span>
        `;
    }).join('');
}

// Update the URL hash to reflect the current visualization parameter states
function updateURLHash() {
    const params = new URLSearchParams();
    params.set('temp', currentTempThreshold);
    params.set('start', currentStartYear);
    params.set('coverage', Math.round(currentCoverageThreshold * 100));
    params.set('moves', currentMovesFilter);
    if (selectedStationId) {
        params.set('station', selectedStationId);
    }
    params.set('view', currentViewMode);
    params.set('year', currentActiveYear);
    if (currentSearchQuery) {
        params.set('search', currentSearchQuery);
    }
    if (currentMonths.length < 12) {
        params.set('months', currentMonths.join(','));
    }
    
    const hashString = '#' + params.toString();
    if (window.location.hash !== hashString) {
        // Update URL silently without triggering hashchange event loop
        history.replaceState(null, null, hashString);
    }
}

// Load parameters from the URL hash into active state variables
function loadStateFromURLHash() {
    const hash = window.location.hash.substring(1);
    
    // Set default responsive view mode if view parameter is missing
    currentViewMode = window.innerWidth < 1024 ? 'single' : 'grid';
    currentActiveYear = maxYearGlobal;
    currentSearchQuery = '';
    
    if (!hash) return;
    
    const params = new URLSearchParams(hash);
    
    if (params.has('temp')) {
        const val = parseInt(params.get('temp'));
        if (val >= 30 && val <= 40) currentTempThreshold = val;
    }
    if (params.has('start')) {
        const val = parseInt(params.get('start'));
        if (val >= 1961 && val <= 2020) currentStartYear = val;
    }
    if (params.has('coverage')) {
        const val = parseInt(params.get('coverage'));
        if (val >= 50 && val <= 100) currentCoverageThreshold = val / 100;
    }
    if (params.has('moves')) {
        const val = params.get('moves');
        if (val === 'all' || val === 'unmoved') currentMovesFilter = val;
    }
    if (params.has('station')) {
        selectedStationId = params.get('station');
    }
    if (params.has('view')) {
        const val = params.get('view');
        if (val === 'grid' || val === 'single') currentViewMode = val;
    }
    if (params.has('year')) {
        const val = parseInt(params.get('year'));
        if (val >= minYearGlobal && val <= maxYearGlobal) currentActiveYear = val;
    }
    if (params.has('search')) {
        currentSearchQuery = params.get('search');
    }
    if (params.has('months')) {
        const val = params.get('months');
        if (val) {
            currentMonths = val.split(',').map(Number).filter(m => m >= 1 && m <= 12);
        } else {
            currentMonths = [];
        }
    } else {
        currentMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
}

// Sync DOM elements to match loaded state variables
function syncUIControls() {
    renderMonthDropdownItems();
    updateMonthButtonLabel();
    
    const tempSlider = document.getElementById('slider-temp-threshold');
    const tempVal = document.getElementById('temp-threshold-val');
    if (tempSlider) tempSlider.value = currentTempThreshold;
    if (tempVal) tempVal.textContent = `${currentTempThreshold} °C`;
    
    const startSlider = document.getElementById('slider-start-year');
    const startVal = document.getElementById('start-year-val');
    if (startSlider) startSlider.value = currentStartYear;
    if (startVal) startVal.textContent = currentStartYear;
    
    const covSlider = document.getElementById('slider-coverage');
    const covVal = document.getElementById('coverage-val');
    if (covSlider) covSlider.value = Math.round(currentCoverageThreshold * 100);
    if (covVal) covVal.textContent = `${Math.round(currentCoverageThreshold * 100)} %`;
    
    const movesCheck = document.getElementById('check-moves-unmoved');
    if (movesCheck) movesCheck.checked = (currentMovesFilter === 'unmoved');

    const searchInput = document.getElementById('input-station-search');
    if (searchInput) searchInput.value = currentSearchQuery;

    // Visual switch buttons sync
    const btnGrid = document.getElementById('btn-view-grid');
    const btnSingle = document.getElementById('btn-view-single');
    if (btnGrid && btnSingle) {
        if (currentViewMode === 'grid') {
            btnGrid.className = 'px-2.5 py-1.5 rounded text-[10px] font-bold transition duration-150 bg-orange-600 text-white shadow-sm';
            btnSingle.className = 'px-2.5 py-1.5 rounded text-[10px] font-bold transition duration-150 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white';
        } else {
            btnSingle.className = 'px-2.5 py-1.5 rounded text-[10px] font-bold transition duration-150 bg-orange-600 text-white shadow-sm';
            btnGrid.className = 'px-2.5 py-1.5 rounded text-[10px] font-bold transition duration-150 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white';
        }
    }
    
    // View panel visibility sync
    const gridView = document.getElementById('map-grid-view');
    const singleView = document.getElementById('map-single-view');
    if (gridView && singleView) {
        if (currentViewMode === 'grid') {
            gridView.classList.remove('hidden');
            gridView.classList.add('block');
            singleView.classList.remove('block');
            singleView.classList.add('hidden');
        } else {
            singleView.classList.remove('hidden');
            singleView.classList.add('block');
            gridView.classList.remove('block');
            gridView.classList.add('hidden');
        }
    }
    
    // Animate timeline bar year progress slider limits sync
    const singleSlider = document.getElementById('slider-single-year');
    if (singleSlider) {
        singleSlider.min = currentStartYear;
        singleSlider.max = maxYearGlobal;
        singleSlider.value = currentActiveYear;
    }
    
    const sliderMinYearLbl = document.getElementById('slider-min-year-lbl');
    if (sliderMinYearLbl) {
        sliderMinYearLbl.textContent = currentStartYear;
    }
    
    const sliderMaxYearLbl = document.getElementById('slider-max-year-lbl');
    if (sliderMaxYearLbl) {
        sliderMaxYearLbl.textContent = maxYearGlobal;
    }
}

// Set the active visualization view mode ('grid' or 'single')
function setViewMode(mode) {
    if (currentViewMode === mode) return;
    
    // Pause animation if playing and switching away from single map
    if (mode === 'grid' && animationIntervalId) {
        togglePlayAnimation();
    }
    
    currentViewMode = mode;
    syncUIControls();
    updateDashboard();
}

// Render the Single Large Map SVG
function renderSingleMap(filteredStations) {
    const singleMapSvg = document.getElementById('single-map-svg');
    if (!singleMapSvg) return;
    
    // Ensure active year is valid
    if (currentActiveYear < currentStartYear) {
        currentActiveYear = currentStartYear;
    }
    if (currentActiveYear > maxYearGlobal) {
        currentActiveYear = maxYearGlobal;
    }
    
    const isDark = document.documentElement.classList.contains('dark');
    const stroke = isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(71, 85, 105, 0.25)";
    
    const statesPathsSvg = geojson.features.map(f => {
        const d = geomToPath(f.geometry, 110, 140, bbox);
        return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="0.5" />`;
    }).join('\n');
    
    let circlesSvg = '';
    let totalYearDays = 0;
    
    filteredStations.forEach(s => {
        const days = getDaysCountForYear(s, currentActiveYear);
        totalYearDays += days;
        
        const [x, y] = project(s.current_location.lon, s.current_location.lat, 110, 140, bbox);
        const style = getHeatStyle(days);
        
        const isSelected = s.station_id === selectedStationId;
        const selectionRing = isSelected 
            ? `<circle cx="${x}" cy="${y}" r="${style.r + 2.0}" fill="none" stroke="#ea580c" stroke-dasharray="1,1" stroke-width="0.6"/>` 
            : '';
            
        circlesSvg += `
            <g class="cursor-pointer" onclick="selectStation('${s.station_id}')">
                ${selectionRing}
                <circle cx="${x}" cy="${y}" r="${style.r}" 
                        fill="${style.fill}" fill-opacity="${style.opacity}" 
                        stroke="${isDark ? '#05070c' : '#ffffff'}" stroke-width="0.3"
                        class="hover:stroke-orange-500 dark:hover:stroke-orange-400 hover:stroke-[0.8] transition-all duration-150">
                    <title>${s.name}: ${days} ${i18n[currentLang]['lbl-day-unit']}</title>
                </circle>
            </g>
        `;
    });
    
    singleMapSvg.innerHTML = `${statesPathsSvg}${circlesSvg}`;
    
    // Update active labels
    const activeYearDisplay = document.getElementById('lbl-active-year-val');
    if (activeYearDisplay) activeYearDisplay.textContent = currentActiveYear;
    
    
    
    const metaYear = document.getElementById('single-map-meta-year');
    if (metaYear) metaYear.textContent = currentActiveYear;
    
    const metaTotal = document.getElementById('single-map-meta-total');
    if (metaTotal) {
        let totalWord;
        if (currentLang === 'de') {
            totalWord = totalYearDays === 1 ? 'Tag gesamt' : 'Tage gesamt';
        } else {
            totalWord = totalYearDays === 1 ? 'day total' : 'days total';
        }
        metaTotal.textContent = `${totalYearDays} ${totalWord}`;
    }
}

// Play/Pause Animation Loop
function togglePlayAnimation() {
    const playBtn = document.getElementById('btn-play-pause');
    const svgPlay = document.getElementById('svg-play');
    const svgPause = document.getElementById('svg-pause');
    
    if (animationIntervalId) {
        // Pause
        clearInterval(animationIntervalId);
        animationIntervalId = null;
        if (svgPlay) svgPlay.classList.remove('hidden');
        if (svgPause) svgPause.classList.add('hidden');
        if (playBtn) {
            playBtn.classList.remove('bg-red-600', 'hover:bg-red-500');
            playBtn.classList.add('bg-orange-600', 'hover:bg-orange-500');
        }
    } else {
        // Play
        if (svgPlay) svgPlay.classList.add('hidden');
        if (svgPause) svgPause.classList.remove('hidden');
        if (playBtn) {
            playBtn.classList.remove('bg-orange-600', 'hover:bg-orange-500');
            playBtn.classList.add('bg-red-600', 'hover:bg-red-500');
        }
        
        animationIntervalId = setInterval(() => {
            currentActiveYear++;
            if (currentActiveYear > maxYearGlobal) {
                currentActiveYear = currentStartYear;
            }
            
            // Sync year slider value
            const singleSlider = document.getElementById('slider-single-year');
            if (singleSlider) singleSlider.value = currentActiveYear;
            
            const filteredStations = getFilteredStations();
            renderSingleMap(filteredStations);
            updateURLHash();
        }, animationSpeed);
    }
}

// Adjust Playback Speed
function setAnimationSpeed(val) {
    animationSpeed = parseInt(val);
    if (animationIntervalId) {
        // Reset interval with new speed
        togglePlayAnimation(); // pauses
        togglePlayAnimation(); // plays with new speed
    }
}

// Set active year from slider
function setActiveYear(year) {
    currentActiveYear = parseInt(year);
    const filteredStations = getFilteredStations();
    renderSingleMap(filteredStations);
    updateURLHash();
}

// Start application when page loads
window.addEventListener('DOMContentLoaded', loadData);

// Listen for window resize to dynamically update the legend circle sizes
window.addEventListener('resize', () => {
    updateLegend();
});

// Listen for browser Back/Forward navigation to sync the UI
window.addEventListener('hashchange', () => {
    loadStateFromURLHash();
    syncUIControls();
    updateDashboard();
    if (selectedStationId) {
        selectStation(selectedStationId);
    } else {
        selectStation(null);
    }
});

// Decades Modal controllers
function openDecadesModal() {
    const modal = document.getElementById('decades-modal');
    const card = document.getElementById('decades-modal-card');
    if (modal && card) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // Smooth transition
        setTimeout(() => {
            card.classList.remove('scale-95', 'opacity-0');
            card.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

function closeDecadesModal() {
    const modal = document.getElementById('decades-modal');
    const card = document.getElementById('decades-modal-card');
    if (modal && card) {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 150);
    }
}
