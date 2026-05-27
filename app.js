// Core state variables
let weatherData = [];
let geojson = null;
let bbox = null;

let currentLang = 'de'; // 'de' or 'en'
let currentTempThreshold = 35; // 30, 33, or 35
let currentStartYear = 1961; // 1961 to 2020
let currentCoverageThreshold = 0.80; // 0.50 to 1.00
let currentMovesFilter = 'all'; // 'all', 'moved', 'unmoved'
let selectedStationId = null;

const minYearGlobal = 1961;
const maxYearGlobal = 2025;

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
        'card-title-decades': "Meldungen pro Jahrzehnt",
        'decades-methodology': "<span class=\"font-semibold text-orange-400\">Methodik:</span> Gezählt werden die summierten Tage mit Überschreitungen des Schwellenwerts an allen selektierten Stationen innerhalb des jeweiligen Jahrzehnts.",
        'card-title-grid': "Deutschlandkarten-Raster",
        'card-subtitle-grid': "Jeder Punkt steht für eine Messstation. Die Größe & Farbe zeigt die Anzahl der Tage über dem Schwellenwert.",
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
        
        'tooltip-move': "Standortwechsel am {date}!\nDistanz: {dist}\nNeuer Standort: {lat}°N, {lon}°E (Höhe: {elev}m)"
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
        'card-title-decades': "Reports per Decade",
        'decades-methodology': "<span class=\"font-semibold text-orange-400\">Methodology:</span> Counts represent the accumulated days exceeding the threshold across all selected stations within each decade.",
        'card-title-grid': "Germany Weather Map Grid",
        'card-subtitle-grid': "Each dot represents a weather station. Bubble size & color denote the count of days exceeding the threshold.",
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
        
        'tooltip-move': "Relocation on {date}!\nDistance: {dist}\nNew Location: {lat}°N, {lon}°E (Elevation: {elev}m)"
    }
};

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
    document.title = i18n[lang]['doc-title'];
    document.getElementById('header-title').textContent = i18n[lang]['header-title'];
    document.getElementById('header-subtitle').textContent = i18n[lang]['header-subtitle'];
    document.getElementById('stat-lbl-stations').textContent = i18n[lang]['stat-lbl-stations'];
    document.getElementById('stat-lbl-reports').textContent = i18n[lang]['stat-lbl-reports'];
    document.getElementById('stat-lbl-hottest').textContent = i18n[lang]['stat-lbl-hottest'];
    
    document.getElementById('card-title-filter').textContent = i18n[lang]['card-title-filter'];
    document.getElementById('lbl-temp-threshold').textContent = i18n[lang]['lbl-temp-threshold'];
    document.getElementById('lbl-start-year').textContent = i18n[lang]['lbl-start-year'];
    document.getElementById('desc-start-year').textContent = i18n[lang]['desc-start-year'];
    document.getElementById('lbl-coverage').textContent = i18n[lang]['lbl-coverage'];
    document.getElementById('desc-coverage').textContent = i18n[lang]['desc-coverage'];
    document.getElementById('lbl-moves-filter').textContent = i18n[lang]['lbl-moves-filter'];
    
    document.getElementById('card-title-decades').textContent = i18n[lang]['card-title-decades'];
    document.getElementById('decades-methodology').innerHTML = i18n[lang]['decades-methodology'];
    
    document.getElementById('card-title-grid').textContent = i18n[lang]['card-title-grid'] + ` (${currentStartYear}–2025)`;
    document.getElementById('card-subtitle-grid').textContent = i18n[lang]['card-subtitle-grid'];
    document.getElementById('legend-lbl-days').textContent = i18n[lang]['legend-lbl-days'];
    
    document.getElementById('inspector-title').textContent = i18n[lang]['inspector-title'];
    document.getElementById('inspector-subtitle').textContent = i18n[lang]['inspector-subtitle'];
    document.getElementById('inspector-lbl-stations').textContent = i18n[lang]['inspector-lbl-stations'];
    document.getElementById('input-station-search').placeholder = i18n[lang]['input-station-search-placeholder'];
    
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

// Get heat bubble styling (radius, opacity, color)
function getHeatStyle(days) {
    if (days === 0) return { r: 0.5, opacity: 0.05, fill: '#475569' }; // extremely faint gray dot
    if (days >= 1 && days < 4) return { r: 2.2, opacity: 0.40, fill: '#ea580c' }; // single orange-red color, varying size & opacity
    if (days >= 4 && days < 8) return { r: 3.4, opacity: 0.65, fill: '#ea580c' };
    if (days >= 8 && days < 12) return { r: 4.6, opacity: 0.85, fill: '#ea580c' };
    if (days >= 12 && days < 16) return { r: 5.8, opacity: 0.95, fill: '#ea580c' };
    return { r: 7.0, opacity: 1.0, fill: '#ea580c' };
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
            fetch('data/weather_data.json'),
            fetch('data/germany_states.json')
        ]);
        
        weatherData = await weatherRes.json();
        geojson = await geojsonRes.json();
        
        bbox = calculateBBox(geojson);
        console.log("Data loaded successfully!", weatherData.length, "stations, BBox:", bbox);
        
        // Load state from URL hash
        loadStateFromURLHash();
        syncUIControls();
        
        // Initial render
        updateDashboard();
        
        // Select station from URL or first station by default
        const activeStations = getFilteredStations();
        if (activeStations.length > 0) {
            const defaultStationId = activeStations.some(s => s.station_id === selectedStationId)
                ? selectedStationId
                : activeStations[0].station_id;
            selectStation(defaultStationId);
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

// Helper: Calculate data coverage for a station only over the selected sub-period
function calculateCoverageForPeriod(station, startYear, endYear) {
    let validDays = 0;
    let totalDays = 0;
    for (let yr = startYear; yr <= endYear; yr++) {
        const yrData = station.annual_data[yr];
        validDays += yrData ? (yrData.valid_days || 0) : 0;
        const isLeap = (yr % 4 === 0 && (yr % 100 !== 0 || yr % 400 === 0));
        totalDays += isLeap ? 366 : 365;
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
    const decadeTotals = {
        '1961–1970': 0,
        '1971–1980': 0,
        '1981–1990': 0,
        '1991–2000': 0,
        '2001–2010': 0,
        '2011–2020': 0,
        '2021–2025': 0
    };
    
    filteredStations.forEach(s => {
        Object.entries(s.annual_data).forEach(([yearStr, data]) => {
            const yr = parseInt(yearStr);
            if (yr < currentStartYear) return;
            
            const count = data[`t${currentTempThreshold}`] || 0;
            
            if (yr >= 1961 && yr <= 1970) decadeTotals['1961–1970'] += count;
            else if (yr >= 1971 && yr <= 1980) decadeTotals['1971–1980'] += count;
            else if (yr >= 1981 && yr <= 1990) decadeTotals['1981–1990'] += count;
            else if (yr >= 1991 && yr <= 2000) decadeTotals['1991–2000'] += count;
            else if (yr >= 2001 && yr <= 2010) decadeTotals['2001–2010'] += count;
            else if (yr >= 2011 && yr <= 2020) decadeTotals['2011–2020'] += count;
            else if (yr >= 2021 && yr <= 2025) decadeTotals['2021–2025'] += count;
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
            
            const count = data[`t${currentTempThreshold}`] || 0;
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
    
    document.getElementById('stat-hottest-year').textContent = hottestYear !== 'N/A' ? `${hottestYear} (${maxYearCount})` : 'N/A';
}

// Render the miniature maps grid
function renderMapsGrid(filteredStations) {
    const gridContainer = document.getElementById('map-grid-container');
    gridContainer.innerHTML = '';
    
    // Check active theme
    const isDark = document.documentElement.classList.contains('dark');
    const mapFill = isDark ? "rgba(30, 41, 59, 0.65)" : "rgba(203, 213, 225, 0.6)";
    const mapStroke = isDark ? "rgba(148, 163, 184, 0.4)" : "rgba(71, 85, 105, 0.35)";
    
    const statesPathsSvg = geojson.features.map(f => {
        const d = geomToPath(f.geometry, 110, 140, bbox);
        const stroke = isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(71, 85, 105, 0.25)";
        return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="0.5" />`;
    }).join('\n');
    
    for (let yr = currentStartYear; yr <= maxYearGlobal; yr++) {
        let circlesSvg = '';
        let totalYearDays = 0;
        
        filteredStations.forEach(s => {
            const yrData = s.annual_data[yr];
            const days = yrData ? (yrData[`t${currentTempThreshold}`] || 0) : 0;
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
}

// Perform dashboard redraw upon parameter changes
function updateDashboard() {
    const filteredStations = getFilteredStations();
    
    document.getElementById('card-title-grid').textContent = i18n[currentLang]['card-title-grid'] + ` (${currentStartYear}–2025)`;
    
    const decadeTotals = renderDecadalStats(filteredStations);
    updateGlobalStats(filteredStations, decadeTotals);
    renderMapsGrid(filteredStations);
    renderInspectorStationList(filteredStations);
    
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
        
        let subText = `${s.state} · ${Math.round(periodCoverage*100)}%`;
        if (periodMoved) {
            let periodMoveCount = 0;
            const startStr = currentStartYear + '0101';
            const coordsHistory = [];
            
            s.metadata.geography.forEach(g => {
                const epochStart = g.start || '19000101';
                const epochEnd = g.end || '99991231';
                if (epochStart <= '20251231' && epochEnd >= startStr) {
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

function filterStationList(query) {
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
}

function selectStation(sid) {
    if (selectedStationId) {
        const oldItem = document.getElementById(`inspector-item-${selectedStationId}`);
        if (oldItem) {
            oldItem.className = oldItem.className.replace('bg-orange-600 text-white font-semibold shadow-sm shadow-orange-500/20', 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-300 dark:hover:border-slate-800');
        }
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
        return (epochStart <= '20251231' && epochEnd >= startStr);
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
    const chartSubtitle = t['lbl-chart-sub'].replace('{start}', currentStartYear);
    
    workspace.innerHTML = `
        <!-- Left details column -->
        <div class="md:col-span-8 flex flex-col gap-6">
            
            <!-- Basic station card -->
            <div class="bg-slate-200/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-850 rounded-xl p-5 flex flex-col gap-3">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-[9px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">${t['type-station']}</span>
                        <h3 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">${s.name}</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${s.state} · ID ${s.station_id}</p>
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
                        ${s.metadata.devices.map(d => `
                            <div class="flex flex-col gap-0.5 border-l-2 border-orange-500/20 pl-2.5">
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title="${d.device}">${translateDevice(d.device)}</span>
                                <span class="text-[9px] text-slate-600 dark:text-slate-400">${translateDevice(d.method)} (${d.sensor_height}m)</span>
                                <span class="text-[9px] text-slate-550 dark:text-slate-550">${formatDate(d.start)} - ${formatDate(d.end)}</span>
                            </div>
                        `).join('') || `<span class="text-xs text-slate-500">${t['no-devices']}</span>`}
                    </div>
                </div>
            </div>

        </div>

        <!-- Right details column -->
        <div class="md:col-span-4 bg-slate-200/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-850 rounded-xl p-5 flex flex-col gap-4">
            <div class="border-b border-slate-300 dark:border-slate-850 pb-2">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">${t['lbl-moves-map']}</h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-550 mt-0.5">${t['lbl-moves-map-sub']}</p>
            </div>
            
            <div id="inspector-moves-map-container" class="relative w-full aspect-[4/5] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg overflow-hidden flex items-center justify-center">
                <!-- SVG map generated here -->
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
            <div class="flex-grow overflow-y-auto max-h-[140px] flex flex-col gap-2.5 mt-2 pr-1 border-t border-slate-300 dark:border-slate-850/60 pt-3">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">${t['lbl-moves-log']}</span>
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
    
    renderStationMovesMap(distinctCoords, periodMoved);
    renderStationTrendChart(sid);
}

// Generate custom SVG station moves path inside period
function renderStationMovesMap(distinctCoords, periodMoved) {
    const container = document.getElementById('inspector-moves-map-container');
    const width = 240;
    const height = 300;
    
    const t = i18n[currentLang];
    const isDark = document.documentElement.classList.contains('dark');
    
    const mapFill = isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(203, 213, 225, 0.8)";
    const mapStroke = isDark ? "rgba(148, 163, 184, 0.55)" : "rgba(71, 85, 105, 0.5)";
    
    const statesPathsSvg = geojson.features.map(f => {
        const d = geomToPath(f.geometry, width, height, bbox);
        const stroke = isDark ? "rgba(148, 163, 184, 0.45)" : "rgba(71, 85, 105, 0.35)";
        return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="0.6" />`;
    }).join('\n');
    
    let pathSvg = '';
    let markersSvg = '';
    let boundsSvg = '';
    
    const pixels = distinctCoords.map(g => project(g.lon, g.lat, width, height, bbox));
    
    if (periodMoved && distinctCoords.length > 1) {
        const pts = pixels.map(p => p.join(',')).join(' ');
        pathSvg = `<polyline points="${pts}" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-dasharray="3,3" stroke-linecap="round" />`;
        
        let minX = 999, maxX = -999, minY = 999, maxY = -999;
        pixels.forEach(([px, py]) => {
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
        });
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const rad = Math.max(maxX - minX, maxY - minY, 15) * 1.3;
        
        boundsSvg = `
            <circle cx="${midX}" cy="${midY}" r="${rad}" fill="none" stroke="#fb923c" stroke-opacity="0.15" stroke-width="2" class="animate-ping" />
            <circle cx="${midX}" cy="${midY}" r="${rad}" fill="none" stroke="#ea580c" stroke-opacity="0.25" stroke-width="1" />
        `;
    }
    
    distinctCoords.forEach((g, idx) => {
        const [x, y] = pixels[idx];
        
        let fill = '#ef4444'; 
        let stroke = '#fca5a5';
        let label = `${t['legend-last-loc']} (${t['lbl-epoch']} ${idx+1})`;
        
        if (idx === 0) {
            fill = '#22c55e'; 
            stroke = '#86efac';
            label = `${t['legend-first-loc']} (${t['lbl-epoch']} 1)`;
        } else if (idx < distinctCoords.length - 1) {
            fill = '#eab308'; 
            stroke = '#fde047';
            label = `${t['legend-move-loc']} (${t['lbl-epoch']} ${idx+1})`;
        }
        
        markersSvg += `
            <g class="cursor-pointer">
                <circle cx="${x}" cy="${y}" r="4" fill="${fill}" stroke="${isDark ? '#05070c' : '#ffffff'}" stroke-width="1" />
                <circle cx="${x}" cy="${y}" r="8" fill="none" stroke="${stroke}" stroke-opacity="0.3" stroke-width="1" />
                <title>${label}\n${t['lbl-elevation']}: ${g.elevation}m\nKoord: ${g.lat.toFixed(4)}°N, ${g.lon.toFixed(4)}°E</title>
            </g>
        `;
    });
    
    container.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="w-full h-full">
            <g stroke="${isDark ? '#1e293b' : '#cbd5e1'}" stroke-width="0.3" stroke-dasharray="1,5">
                <line x1="0" y1="${height/4}" x2="${width}" y2="${height/4}" />
                <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" />
                <line x1="0" y1="${height*0.75}" x2="${width}" y2="${height*0.75}" />
                <line x1="${width/4}" y1="0" x2="${width/4}" y2="${height}" />
                <line x1="${width/2}" y1="0" x2="${width/2}" y2="${height}" />
                <line x1="${width*0.75}" y1="0" x2="${width*0.75}" y2="${height}" />
            </g>
            
            ${statesPathsSvg}
            ${boundsSvg}
            ${pathSvg}
            ${markersSvg}
        </svg>
        
        <div class="absolute bottom-2 left-2 flex flex-col gap-1 bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/80 rounded px-2 py-1 text-[8px] font-semibold text-slate-800 dark:text-slate-200">
            <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> ${t['legend-first-loc']}</div>
            ${periodMoved ? `<div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> ${t['legend-move-loc']}</div>` : ''}
            <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> ${t['legend-last-loc']}</div>
        </div>
    `;
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
        const yrData = s.annual_data[yr];
        counts.push(yrData ? (yrData[`t${currentTempThreshold}`] || 0) : 0);
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
    const mapSvg = document.querySelector('#map-grid-container svg');
    let scale = 1.0;
    if (mapSvg) {
        const rect = mapSvg.getBoundingClientRect();
        if (rect.width > 0) {
            scale = rect.width / 110; // viewBox width is 110
        }
    }

    const isDark = document.documentElement.classList.contains('dark');
    const strokeColor = isDark ? '#05070c' : '#ffffff';

    // Define the threshold groups matching getHeatStyle days ranges
    const groups = [
        { label: '1', minDays: 1 },
        { label: '4', minDays: 4 },
        { label: '8', minDays: 8 },
        { label: '12', minDays: 12 },
        { label: '16+', minDays: 16 }
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
    
    const hashString = '#' + params.toString();
    if (window.location.hash !== hashString) {
        // Update URL silently without triggering hashchange event loop
        history.replaceState(null, null, hashString);
    }
}

// Load parameters from the URL hash into active state variables
function loadStateFromURLHash() {
    const hash = window.location.hash.substring(1);
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
}

// Sync DOM elements to match loaded state variables
function syncUIControls() {
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
    }
});
