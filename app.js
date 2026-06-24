// Core state variables
let weatherData = [];
let geojson = null;
let bbox = null;

let currentLang = localStorage.getItem('dwd_lang') || 'de'; // 'de' or 'en'
let currentMetric = 'max'; // 'max' for daily maximum, 'min' for tropical nights
let currentTempThreshold = 35; // 25-40 for max, 18-28 for min
let lastThresholdByMetric = { max: 35, min: 22 };
let currentStartYear = 1961; // 1961 to 2020
let currentCoverageThreshold = 0.90; // 0.50 to 1.00
let currentMovesFilter = 'all'; // 'all', 'moved', 'unmoved'
let excludeAirportEnvironment = false;
let excludeCityEnvironment = false;
let selectedStationId = null;
let currentMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 1 to 12 representing Jan to Dec

let currentViewMode = 'grid'; // 'grid', 'single', 'annual', 'yearly', or 'season'
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
        'doc-title-min': "DWD Warme Nächte in Deutschland (1961–2025)",
        'header-title': "Immer mehr extrem heiße Tage",
        'header-title-min': "Warme und tropische Nächte",
        'header-subtitle': "Eine interaktive Rekonstruktion & Erweiterung der DWD-Wetterstations-Daten (1961–2025)",
        'header-subtitle-min': "Eine interaktive Rekonstruktion der DWD-Tagesminimum-Daten (1961–2025)",
        'stat-lbl-stations': "Stationen",
        'stat-lbl-reports': "Gesamtmeldungen",
        'stat-lbl-hottest': "Heißestes Jahr",
        'card-title-filter': "Parameter-Filter",
        'lbl-metric': "Messwert:",
        'metric-max': "Tagesmaximum",
        'metric-min': "Nächtliches Minimum",
        'lbl-temp-threshold-max': "Min. Tagesmaximum:",
        'lbl-temp-threshold-min': "Min. nächtliches Minimum:",
        'lbl-start-year': "Start-Jahr des Zeitraums:",
        'desc-start-year': "Blendet frühere Jahre aus.",
        'lbl-coverage': "Daten-Vollständigkeit:",
        'desc-coverage': "Mindestanteil valider Daten im gewählten Zeitraum.",
        'lbl-moves-header': "Standortverlauf:",
        'lbl-moves-filter': "Nur ortsfeste Stationen",
        'lbl-advanced-filters': "Erweiterte Filter",
        'desc-advanced-filters': "Stationen nach Standortumfeld ausschließen.",
        'lbl-airport-filter': "Flughafenumfeld ausschließen",
        'desc-airport-filter': "10-km-Umfeld großer deutscher Flughäfen",
        'lbl-city-filter': "Großstadtumfeld ausschließen",
        'desc-city-filter': "20-km-Umfeld großer deutscher Städte",
        'lbl-filter-kept': "{kept} von {total} bleiben",
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
        'decades-methodology-max': "<span class=\"font-semibold text-orange-400\">Methodik:</span> Gezählt werden die summierten Tage mit Tagesmaximum ab {temp} °C an allen selektierten Stationen innerhalb des jeweiligen Jahrzehnts.",
        'decades-methodology-min': "<span class=\"font-semibold text-sky-400\">Methodik:</span> Gezählt werden die summierten Nächte mit Tagesminimum ab {temp} °C an allen selektierten Stationen innerhalb des jeweiligen Jahrzehnts.",
        'card-title-grid': "Deutschlandkarten-Raster",
        'card-subtitle-grid-max': "Jeder Punkt steht für eine Messstation. Die Größe & Farbe zeigt die Anzahl der Tage mit Tagesmaximum über dem Schwellenwert.",
        'card-subtitle-grid-min': "Jeder Punkt steht für eine Messstation. Die Größe & Farbe zeigt die Anzahl der Nächte mit Tagesminimum ab dem Schwellenwert.",
        'card-title-single': "Klimawandel-Animation",
        'card-subtitle-single-max': "Nutzen Sie den Play-Button, um den Anstieg extrem heißer Tage über Jahrzehnte hinweg zu animieren.",
        'card-subtitle-single-min': "Nutzen Sie den Play-Button, um die Entwicklung warmer Nächte über Jahrzehnte hinweg zu animieren.",
        'view-grid': "Raster",
        'view-grid-desc': "Dekadenkarten",
        'view-single': "Einzelkarte",
        'view-single-desc': "Jahr für Jahr",
        'view-annual': "Jahresdiagramm",
        'view-annual-desc': "Balken & Trend",
        'view-yearly': "Jahresreihe",
        'view-yearly-desc': "Deutschland-Schnitt",
        'view-season': "Saisonlänge",
        'view-season-desc': "Erste bis letzte Meldung",
        'card-title-annual': "Jahresdiagramm",
        'card-subtitle-annual-max': "Summierte DWD-Stationsmeldungen pro Jahr für die aktiven Filter, inklusive linearem Trend.",
        'card-subtitle-annual-min': "Summierte DWD-Stationsnächte pro Jahr für die aktiven Filter, inklusive linearem Trend.",
        'card-title-yearly': "Jahresreihe im Deutschland-Schnitt",
        'card-subtitle-yearly-max': "Jeder Balken zeigt die mittlere Zahl heißer Tage pro meldender Station und Jahr, inklusive Trend.",
        'card-subtitle-yearly-min': "Jeder Balken zeigt die mittlere Zahl warmer Nächte pro meldender Station und Jahr, inklusive Trend.",
        'card-title-season': "Saisonlänge",
        'card-subtitle-season-max': "Spanne zwischen erstem und letztem Tag mit Tagesmaximum ab {temp} °C, deutschlandweit über die selektierten Stationen.",
        'card-subtitle-season-min': "Spanne zwischen erster und letzter Nacht mit Tagesminimum ab {temp} °C, deutschlandweit über die selektierten Stationen.",
        'annual-series-label': "DWD-Stationen",
        'annual-trend-label': "Linearer Trend",
        'annual-axis-label': "Meldungen pro Jahr",
        'annual-peak-label': "Jahr mit den meisten Meldungen",
        'annual-latest-label': "Wert im letzten Jahr der Reihe",
        'annual-trend-stat-label': "Linearer Trend pro Jahrzehnt",
        'annual-empty': "Keine Daten für die aktuelle Filterauswahl.",
        'yearly-axis-label-max': "Heiße Tage pro Station",
        'yearly-axis-label-min': "Warme Nächte pro Station",
        'yearly-series-label': "Jahreswert",
        'yearly-trend-label': "Trend",
        'yearly-peak-note-max': "{year} hatte im Schnitt die meisten heißen Tage.",
        'yearly-peak-note-min': "{year} hatte im Schnitt die meisten warmen Nächte.",
        'yearly-bar-note-max': "Jeder Balken zeigt die heißen Tage in einem Jahr.",
        'yearly-bar-note-min': "Jeder Balken zeigt die warmen Nächte in einem Jahr.",
        'yearly-peak-label': "Höchster Jahreswert",
        'yearly-latest-label': "Letzter Jahreswert",
        'yearly-trend-stat-label': "Trend pro Jahrzehnt",
        'yearly-methodology-max': "Berechnet als Durchschnitt der Tage mit Tagesmaximum ab {temp} °C pro Station mit Daten im jeweiligen Jahr.",
        'yearly-methodology-min': "Berechnet als Durchschnitt der Nächte mit Tagesminimum ab {temp} °C pro Station mit Daten im jeweiligen Jahr.",
        'yearly-empty': "Keine Jahresreihen-Daten für die aktuelle Filterauswahl.",
        'season-shortest': "Kürzeste",
        'season-longest': "Längste",
        'season-average': "Durchschnitt",
        'season-days': "{n} Tage",
        'season-empty': "Keine Saisonlängen-Daten für die aktuelle Filterauswahl. Bitte `download_and_process.py` neu ausführen.",
        'season-axis-label': "Tage zwischen erstem und letztem Ereignis",
        'season-methodology': "Pro Jahr wird die deutschlandweite Spanne zwischen frühestem und spätestem Schwellenereignis über alle selektierten Stationen berechnet.",
        'legend-lbl-days': "Tage:",
        'loading-txt': "Lade Klimadaten & Landkarten-Modul...",
        'inspector-title': "Stations-Inspektor & Metadaten-Chronik",
        'inspector-subtitle': "Suchen Sie eine Wetterstation, um deren exakte Umzüge, Namensänderungen und Temperatur-Trends zu inspizieren.",
        'inspector-lbl-stations': "Stationen",
        'input-station-search-placeholder': "Station suchen (z.B. Berlin, Alfhausen)...",
        'inspector-select-prompt': "Wählen Sie eine Station aus, um die Standort-Verlegungen & Gerätedaten zu laden.",
        
        // Dynamic Inspector terms
        'type-station': "Wetterstation",
        'lbl-active-span': "Aktiver Zeitraum",
        'lbl-elevation': "Stationshöhe",
        'lbl-geo-pos': "Geografische Lage",
        'lbl-coverage-ins': "Datenvollständigkeit",
        'lbl-chart-trend-max': "Jährlicher Hitze-Trend (Tagesmaximum &ge; {temp} °C)",
        'lbl-chart-trend-min': "Jährlicher Nächte-Trend (Tagesminimum &ge; {temp} °C)",
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
        'doc-title-min': "DWD Warm Nights in Germany (1961–2025)",
        'header-title': "More and More Extremely Hot Days",
        'header-title-min': "Warm and Tropical Nights",
        'header-subtitle': "An interactive reconstruction & extension of DWD weather station data (1961–2025)",
        'header-subtitle-min': "An interactive reconstruction of DWD daily minimum temperature data (1961–2025)",
        'stat-lbl-stations': "Stations",
        'stat-lbl-reports': "Total Reports",
        'stat-lbl-hottest': "Hottest Year",
        'card-title-filter': "Parameter Filters",
        'lbl-metric': "Measurement:",
        'metric-max': "Daily maximum",
        'metric-min': "Night minimum",
        'lbl-temp-threshold-max': "Min. daily maximum:",
        'lbl-temp-threshold-min': "Min. nightly minimum:",
        'lbl-start-year': "Start Year of Timeframe:",
        'desc-start-year': "Hides previous years.",
        'lbl-coverage': "Data Completeness:",
        'desc-coverage': "Minimum percentage of valid data in the selected period.",
        'lbl-moves-header': "Location History:",
        'lbl-moves-filter': "Only unmoved stations",
        'lbl-advanced-filters': "Advanced filters",
        'desc-advanced-filters': "Exclude stations by local environment.",
        'lbl-airport-filter': "Exclude airport surroundings",
        'desc-airport-filter': "10 km around major German airports",
        'lbl-city-filter': "Exclude major-city surroundings",
        'desc-city-filter': "20 km around major German cities",
        'lbl-filter-kept': "{kept} of {total} remain",
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
        'decades-methodology-max': "<span class=\"font-semibold text-orange-400\">Methodology:</span> Counts represent accumulated days with daily maximum temperature at or above {temp} °C across all selected stations within each decade.",
        'decades-methodology-min': "<span class=\"font-semibold text-sky-400\">Methodology:</span> Counts represent accumulated nights with daily minimum temperature at or above {temp} °C across all selected stations within each decade.",
        'card-title-grid': "Germany Weather Map Grid",
        'card-subtitle-grid-max': "Each dot represents a weather station. Bubble size & color denote the count of days with daily maximum temperature exceeding the threshold.",
        'card-subtitle-grid-min': "Each dot represents a weather station. Bubble size & color denote the count of nights with daily minimum temperature at or above the threshold.",
        'card-title-single': "Climate Change Animation",
        'card-subtitle-single-max': "Use the play button to animate the rise of extremely hot days across decades.",
        'card-subtitle-single-min': "Use the play button to animate the development of warm nights across decades.",
        'view-grid': "Grid",
        'view-grid-desc': "Decade maps",
        'view-single': "Single map",
        'view-single-desc': "Year by year",
        'view-annual': "Annual chart",
        'view-annual-desc': "Bars & trend",
        'view-yearly': "Year series",
        'view-yearly-desc': "Germany average",
        'view-season': "Season length",
        'view-season-desc': "First to last report",
        'card-title-annual': "Annual Chart",
        'card-subtitle-annual-max': "Summed DWD station reports per year for the active filters, including a linear trend.",
        'card-subtitle-annual-min': "Summed DWD station nights per year for the active filters, including a linear trend.",
        'card-title-yearly': "Year-by-Year Germany Average",
        'card-subtitle-yearly-max': "Each bar shows the mean number of hot days per reporting station and year, including the trend.",
        'card-subtitle-yearly-min': "Each bar shows the mean number of warm nights per reporting station and year, including the trend.",
        'card-title-season': "Season Length",
        'card-subtitle-season-max': "Span between the first and last day with daily maximum at or above {temp} °C across selected stations in Germany.",
        'card-subtitle-season-min': "Span between the first and last night with daily minimum at or above {temp} °C across selected stations in Germany.",
        'annual-series-label': "DWD stations",
        'annual-trend-label': "Linear trend",
        'annual-axis-label': "Reports per year",
        'annual-peak-label': "Year with the most reports",
        'annual-latest-label': "Value in the latest year of the series",
        'annual-trend-stat-label': "Linear trend per decade",
        'annual-empty': "No data for the current filter selection.",
        'yearly-axis-label-max': "Hot days per station",
        'yearly-axis-label-min': "Warm nights per station",
        'yearly-series-label': "Annual value",
        'yearly-trend-label': "Trend",
        'yearly-peak-note-max': "{year} had the highest average number of hot days.",
        'yearly-peak-note-min': "{year} had the highest average number of warm nights.",
        'yearly-bar-note-max': "Each bar shows hot days in one year.",
        'yearly-bar-note-min': "Each bar shows warm nights in one year.",
        'yearly-peak-label': "Highest annual value",
        'yearly-latest-label': "Latest annual value",
        'yearly-trend-stat-label': "Trend per decade",
        'yearly-methodology-max': "Calculated as the average number of days with daily maximum at or above {temp} °C per station with data in that year.",
        'yearly-methodology-min': "Calculated as the average number of nights with daily minimum at or above {temp} °C per station with data in that year.",
        'yearly-empty': "No year-series data for the current filter selection.",
        'season-shortest': "Shortest",
        'season-longest': "Longest",
        'season-average': "Average",
        'season-days': "{n} days",
        'season-empty': "No season-length data for the current filter selection. Please rerun `download_and_process.py`.",
        'season-axis-label': "Days between first and last event",
        'season-methodology': "For each year, the Germany-wide span between the earliest and latest threshold event is calculated across all selected stations.",
        'legend-lbl-days': "Days:",
        'loading-txt': "Loading climate records & vector maps...",
        'inspector-title': "Station Inspector & Metadata Chronology",
        'inspector-subtitle': "Search for a weather station to inspect its relocations, name modifications, and local temperature trends.",
        'inspector-lbl-stations': "Stations",
        'input-station-search-placeholder': "Search station (e.g. Berlin, Hamburg, Alfhausen)...",
        'inspector-select-prompt': "Select a weather station to inspect relocation timelines & device history.",
        
        // Dynamic Inspector terms
        'type-station': "Weather Station",
        'lbl-active-span': "Operational Span",
        'lbl-elevation': "Elevation",
        'lbl-geo-pos': "Geographical Position",
        'lbl-coverage-ins': "Data Coverage",
        'lbl-chart-trend-max': "Annual Heat Trend (Daily Maximum &ge; {temp} °C)",
        'lbl-chart-trend-min': "Annual Night Trend (Daily Minimum &ge; {temp} °C)",
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
    const docTitleKey = currentMetric === 'min' ? 'doc-title-min' : 'doc-title';
    const headerTitleKey = currentMetric === 'min' ? 'header-title-min' : 'header-title';
    const headerSubtitleKey = currentMetric === 'min' ? 'header-subtitle-min' : 'header-subtitle';
    document.title = i18n[lang][docTitleKey].replace('2025', endYearLabel);
    document.getElementById('header-title').textContent = i18n[lang][headerTitleKey];
    document.getElementById('header-subtitle').textContent = i18n[lang][headerSubtitleKey].replace('2025', endYearLabel);
    document.getElementById('stat-lbl-stations').textContent = i18n[lang]['stat-lbl-stations'];
    document.getElementById('stat-lbl-reports').textContent = i18n[lang]['stat-lbl-reports'];
    const lblHottest = document.getElementById('stat-lbl-hottest');
    if (lblHottest) lblHottest.textContent = i18n[lang]['stat-lbl-hottest'];
    
    const lblCardTitleFilter = document.getElementById('card-title-filter');
    if (lblCardTitleFilter) lblCardTitleFilter.textContent = i18n[lang]['card-title-filter'];
    
    document.getElementById('lbl-metric').textContent = i18n[lang]['lbl-metric'];
    document.getElementById('btn-metric-max').textContent = i18n[lang]['metric-max'];
    document.getElementById('btn-metric-min').textContent = i18n[lang]['metric-min'];
    document.getElementById('lbl-temp-threshold').textContent = i18n[lang][`lbl-temp-threshold-${currentMetric}`];
    document.getElementById('lbl-start-year').textContent = i18n[lang]['lbl-start-year'];
    
    const lblDescStartYear = document.getElementById('desc-start-year');
    if (lblDescStartYear) lblDescStartYear.textContent = i18n[lang]['desc-start-year'];
    
    document.getElementById('lbl-coverage').textContent = i18n[lang]['lbl-coverage'];
    
    const lblDescCoverage = document.getElementById('desc-coverage');
    if (lblDescCoverage) lblDescCoverage.textContent = i18n[lang]['desc-coverage'];
    
    const lblMovesHeader = document.getElementById('lbl-moves-header');
    if (lblMovesHeader) lblMovesHeader.textContent = i18n[lang]['lbl-moves-header'];
    document.getElementById('lbl-moves-filter').textContent = i18n[lang]['lbl-moves-filter'];
    const lblAdvancedFilters = document.getElementById('lbl-advanced-filters');
    if (lblAdvancedFilters) lblAdvancedFilters.textContent = i18n[lang]['lbl-advanced-filters'];
    const descAdvancedFilters = document.getElementById('desc-advanced-filters');
    if (descAdvancedFilters) descAdvancedFilters.textContent = i18n[lang]['desc-advanced-filters'];
    const lblAirportFilter = document.getElementById('lbl-airport-filter');
    if (lblAirportFilter) lblAirportFilter.textContent = i18n[lang]['lbl-airport-filter'];
    const descAirportFilter = document.getElementById('desc-airport-filter');
    if (descAirportFilter) descAirportFilter.textContent = i18n[lang]['desc-airport-filter'];
    const lblCityFilter = document.getElementById('lbl-city-filter');
    if (lblCityFilter) lblCityFilter.textContent = i18n[lang]['lbl-city-filter'];
    const descCityFilter = document.getElementById('desc-city-filter');
    if (descCityFilter) descCityFilter.textContent = i18n[lang]['desc-city-filter'];
    
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
    document.getElementById('decades-methodology').innerHTML = i18n[lang][`decades-methodology-${currentMetric}`].replace('{temp}', currentTempThreshold);
    
    document.getElementById('card-title-grid').textContent = i18n[lang]['card-title-grid'] + ` (${currentStartYear}–${endYearLabel})`;
    document.getElementById('card-subtitle-grid').textContent = i18n[lang][`card-subtitle-grid-${currentMetric}`];
    [
        ['btn-view-grid', 'view-grid'],
        ['btn-view-single', 'view-single'],
        ['btn-view-annual', 'view-annual'],
        ['btn-view-yearly', 'view-yearly'],
        ['btn-view-season', 'view-season']
    ].forEach(([id, key]) => {
        const label = document.getElementById(`${id}-label`);
        if (label) label.textContent = i18n[lang][key];
        const desc = document.getElementById(`${id}-desc`);
        if (desc) desc.textContent = i18n[lang][`${key}-desc`];
    });
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
    25: [20, 40, 60, 80, 100],
    26: [20, 40, 60, 80, 100],
    27: [15, 30, 50, 70, 90],
    28: [10, 25, 40, 55, 70],
    29: [10, 20, 35, 50, 65],
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

const NIGHT_SCALES = {
    18: [15, 30, 45, 60, 75],
    19: [10, 20, 35, 50, 65],
    20: [5, 15, 30, 45, 60],
    21: [5, 15, 30, 45, 60],
    22: [3, 10, 20, 30, 40],
    23: [3, 8, 15, 24, 32],
    24: [2, 6, 12, 18, 24],
    25: [1, 4, 8, 12, 16],
    26: [1, 3, 6, 9, 12],
    27: [1, 2, 4, 6, 8],
    28: [1, 2, 3, 4, 5]
};

const METRIC_CONFIG = {
    max: {
        keyPrefix: 't',
        minThreshold: 25,
        maxThreshold: 40,
        defaultThreshold: 35,
        scales: HEAT_SCALES,
        fill: '#ea580c'
    },
    min: {
        keyPrefix: 'n',
        minThreshold: 18,
        maxThreshold: 28,
        defaultThreshold: 22,
        scales: NIGHT_SCALES,
        fill: '#0284c7'
    }
};

const AIRPORT_EXCLUSION_RADIUS_KM = 10;
const CITY_EXCLUSION_RADIUS_KM = 20;

const MAJOR_AIRPORTS = [
    { name: 'Frankfurt am Main', lat: 50.0379, lon: 8.5622 },
    { name: 'Muenchen', lat: 48.3538, lon: 11.7861 },
    { name: 'Berlin Brandenburg', lat: 52.3667, lon: 13.5033 },
    { name: 'Duesseldorf', lat: 51.2895, lon: 6.7668 },
    { name: 'Hamburg', lat: 53.6304, lon: 9.9882 },
    { name: 'Koeln/Bonn', lat: 50.8659, lon: 7.1427 },
    { name: 'Stuttgart', lat: 48.6899, lon: 9.2219 },
    { name: 'Hannover', lat: 52.4611, lon: 9.6851 },
    { name: 'Nuernberg', lat: 49.4987, lon: 11.0780 },
    { name: 'Leipzig/Halle', lat: 51.4239, lon: 12.2364 },
    { name: 'Dresden', lat: 51.1328, lon: 13.7672 },
    { name: 'Bremen', lat: 53.0475, lon: 8.7867 },
    { name: 'Dortmund', lat: 51.5183, lon: 7.6122 },
    { name: 'Karlsruhe/Baden-Baden', lat: 48.7794, lon: 8.0805 },
    { name: 'Muenster/Osnabrueck', lat: 52.1346, lon: 7.6848 }
];

const MAJOR_CITIES = [
    { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
    { name: 'Hamburg', lat: 53.5511, lon: 9.9937 },
    { name: 'Muenchen', lat: 48.1351, lon: 11.5820 },
    { name: 'Koeln', lat: 50.9375, lon: 6.9603 },
    { name: 'Frankfurt am Main', lat: 50.1109, lon: 8.6821 },
    { name: 'Stuttgart', lat: 48.7758, lon: 9.1829 },
    { name: 'Duesseldorf', lat: 51.2277, lon: 6.7735 },
    { name: 'Leipzig', lat: 51.3397, lon: 12.3731 },
    { name: 'Dortmund', lat: 51.5136, lon: 7.4653 },
    { name: 'Essen', lat: 51.4556, lon: 7.0116 },
    { name: 'Bremen', lat: 53.0793, lon: 8.8017 },
    { name: 'Dresden', lat: 51.0504, lon: 13.7373 },
    { name: 'Hannover', lat: 52.3759, lon: 9.7320 },
    { name: 'Nuernberg', lat: 49.4521, lon: 11.0767 },
    { name: 'Duisburg', lat: 51.4344, lon: 6.7623 },
    { name: 'Bochum', lat: 51.4818, lon: 7.2162 },
    { name: 'Wuppertal', lat: 51.2562, lon: 7.1508 },
    { name: 'Bielefeld', lat: 52.0302, lon: 8.5325 },
    { name: 'Bonn', lat: 50.7374, lon: 7.0982 },
    { name: 'Muenster', lat: 51.9607, lon: 7.6261 }
];

const GRID_BUBBLE_RADII = [1.8, 1.9, 2.2, 2.6, 3.0];
const SINGLE_BUBBLE_SCALE_FALLBACK = 0.62;
const SINGLE_BUBBLE_SCALE_SAFETY = 0.98;

function getMetricConfig() {
    return METRIC_CONFIG[currentMetric] || METRIC_CONFIG.max;
}

function getModeAccent() {
    if (currentMetric === 'min') {
        return {
            bg: 'bg-sky-600',
            bgHover: 'hover:bg-sky-500',
            bgSoft: 'bg-sky-500/10',
            bgSoftHover: 'hover:bg-sky-500/20',
            borderSoft: 'border-sky-500/20',
            borderHover: 'hover:border-sky-500/50',
            focusBorder: 'focus:border-sky-500',
            focusRing: 'focus:ring-sky-500',
            text: 'text-sky-700',
            textDark: 'dark:text-sky-300',
            textSoft: 'text-sky-600',
            textSoftDark: 'dark:text-sky-400',
            shadow: 'shadow-sky-500/20',
            accent: 'accent-sky-500',
            barGradient: 'bg-gradient-to-r from-sky-400 to-blue-700',
            ringStroke: '#0284c7',
            hoverStroke: 'hover:stroke-sky-500 dark:hover:stroke-sky-300'
        };
    }

    return {
        bg: 'bg-orange-600',
        bgHover: 'hover:bg-orange-500',
        bgSoft: 'bg-orange-500/10',
        bgSoftHover: 'hover:bg-orange-500/20',
        borderSoft: 'border-orange-500/20',
        borderHover: 'hover:border-orange-500/50',
        focusBorder: 'focus:border-orange-500',
        focusRing: 'focus:ring-orange-500',
        text: 'text-orange-600',
        textDark: 'dark:text-orange-400',
        textSoft: 'text-orange-600',
        textSoftDark: 'dark:text-orange-400',
        shadow: 'shadow-orange-500/20',
        accent: 'accent-orange-500',
        barGradient: 'bg-gradient-to-r from-orange-500 to-red-600',
        ringStroke: '#ea580c',
        hoverStroke: 'hover:stroke-orange-500 dark:hover:stroke-orange-400'
    };
}

function getMetricDataKey() {
    return `${getMetricConfig().keyPrefix}${currentTempThreshold}`;
}

function getMetricScale() {
    const config = getMetricConfig();
    return config.scales[currentTempThreshold] || Object.values(config.scales)[0];
}

function getMonthlyValidDays(yearData, month) {
    if (!yearData) return undefined;
    const idx = month - 1;
    if (currentMetric === 'min' && yearData.m_valid_min && yearData.m_valid_min[idx] !== undefined) {
        return yearData.m_valid_min[idx];
    }
    if (yearData.m_valid_max && yearData.m_valid_max[idx] !== undefined) {
        return yearData.m_valid_max[idx];
    }
    if (yearData.m_valid && yearData.m_valid[idx] !== undefined) {
        return yearData.m_valid[idx];
    }
    return undefined;
}

function refreshMaxDaysInMonthsOfLastYear() {
    maxDaysInMonthsOfLastYear = Array(12).fill(0);
    weatherData.forEach(s => {
        const yrData = s.annual_data[maxYearGlobal];
        if (yrData) {
            for (let m = 1; m <= 12; m++) {
                const v = getMonthlyValidDays(yrData, m) || 0;
                if (v > maxDaysInMonthsOfLastYear[m - 1]) {
                    maxDaysInMonthsOfLastYear[m - 1] = v;
                }
            }
        }
    });
}

// Get heat bubble styling (radius, opacity, color)
function estimateRasterSvgWidth() {
    const reference = document.getElementById('map-single-view') || document.getElementById('map-grid-container');
    const containerWidth = reference ? reference.getBoundingClientRect().width : 0;
    if (!containerWidth) return 0;

    const columns = window.innerWidth >= 1024 ? 10 : (window.innerWidth >= 640 ? 5 : 2);
    const gapWidth = 16;
    const gridRightPadding = 8;
    const cardHorizontalPadding = 25;
    const cardWidth = (containerWidth - gridRightPadding - gapWidth * (columns - 1)) / columns;
    return Math.max(40, cardWidth - cardHorizontalPadding);
}

function getSingleBubbleScale() {
    const singleMapSvg = document.getElementById('single-map-svg');
    const singleWidth = singleMapSvg ? singleMapSvg.getBoundingClientRect().width : 0;
    const rasterWidth = estimateRasterSvgWidth();
    if (!singleWidth || !rasterWidth) return SINGLE_BUBBLE_SCALE_FALLBACK;

    return Math.min(1, Math.max(0.15, (rasterWidth / singleWidth) * SINGLE_BUBBLE_SCALE_SAFETY));
}

function getBubbleRadii(viewMode = currentViewMode) {
    if (viewMode !== 'single') return GRID_BUBBLE_RADII;

    const scale = getSingleBubbleScale();
    return GRID_BUBBLE_RADII.map(r => Number((r * scale).toFixed(3)));
}

function getHeatStyle(days, viewMode = currentViewMode) {
    if (days === 0) return { r: 0.5, opacity: 0.05, fill: '#475569' }; // extremely faint gray dot
    
    const scale = getMetricScale();
    const fill = getMetricConfig().fill;
    const radii = getBubbleRadii(viewMode);
    
    if (days >= scale[0] && days < scale[1]) return { r: radii[0], opacity: 0.40, fill }; // single color, varying size & opacity
    if (days >= scale[1] && days < scale[2]) return { r: radii[1], opacity: 0.65, fill };
    if (days >= scale[2] && days < scale[3]) return { r: radii[2], opacity: 0.85, fill };
    if (days >= scale[3] && days < scale[4]) return { r: radii[3], opacity: 0.95, fill };
    return { r: radii[4], opacity: 1.0, fill }; // scale[4] or more
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
        
        console.log("Data loaded successfully!", weatherData.length, "stations, Max Year:", maxYearGlobal, "BBox:", bbox);
        
        // Load state from URL hash
        loadStateFromURLHash();
        refreshMaxDaysInMonthsOfLastYear();
        setLanguage(currentLang);
        syncUIControls();
        
        // Initial render
        updateDashboard();
        
        // Select station from URL if specified
        if (selectedStationId) {
            const activeStations = getFilteredStations();
            if (activeStations.some(s => s.station_id === selectedStationId)) {
                selectStation(selectedStationId, { force: true });
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
        return yrData[getMetricDataKey()] || 0;
    }
    
    if (!yrData.m_data) {
        return 0;
    }
    
    let sum = 0;
    currentMonths.forEach(m => {
        const mData = yrData.m_data[String(m)];
        if (mData) {
            sum += mData[getMetricDataKey()] || 0;
        }
    });
    return sum;
}

function getValidObservationDaysForYear(station, year) {
    const yrData = station.annual_data[year];
    if (!yrData) return 0;

    const annualKey = currentMetric === 'min' ? 'valid_days_min' : 'valid_days_max';
    const monthlyKey = currentMetric === 'min' ? 'm_valid_min' : 'm_valid_max';

    if (currentMonths.length === 12) {
        return yrData[annualKey] || yrData.valid_days || 0;
    }

    const monthlyValid = yrData[monthlyKey] || yrData.m_valid || [];
    return currentMonths.reduce((total, month) => total + (monthlyValid[month - 1] || 0), 0);
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
                const monthlyValid = getMonthlyValidDays(yrData, m);
                if (monthlyValid !== undefined) {
                    selectedValidDays += monthlyValid;
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

function isStationNearAny(station, places, radiusKm) {
    const location = station.current_location;
    if (!location) return false;
    return places.some(place => {
        const distanceMeters = haversine(location.lat, location.lon, place.lat, place.lon);
        return distanceMeters <= radiusKm * 1000;
    });
}

function matchesEnvironmentFilters(station) {
    if (excludeAirportEnvironment && isStationNearAny(station, MAJOR_AIRPORTS, AIRPORT_EXCLUSION_RADIUS_KM)) {
        return false;
    }
    if (excludeCityEnvironment && isStationNearAny(station, MAJOR_CITIES, CITY_EXCLUSION_RADIUS_KM)) {
        return false;
    }
    return true;
}

// Get list of stations filtered by coverage and moves over the sub-period
function getFilteredStations() {
    return weatherData.filter(s => {
        const periodCoverage = calculateCoverageForPeriod(s, currentStartYear, maxYearGlobal);
        if (periodCoverage < currentCoverageThreshold) return false;
        
        const periodMoved = checkMovesForPeriod(s, currentStartYear, maxYearGlobal);
        if (currentMovesFilter === 'moved' && !periodMoved) return false;
        if (currentMovesFilter === 'unmoved' && periodMoved) return false;
        if (!matchesEnvironmentFilters(s)) return false;
        
        return true;
    });
}

// Calculate decadal reports and display them
function renderDecadalStats(filteredStations) {
    const currentDecadeLabel = `2021–${getEndYearLabel(currentLang)}`;
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
    const accent = getModeAccent();
    
    Object.entries(decadeTotals).forEach(([decadeName, total]) => {
        const decadeEnd = parseInt(decadeName.substring(5, 9));
        if (decadeEnd < currentStartYear) return;
        
        const pct = (total / maxDecadeVal) * 100;
        
        let referenceLabel = '';
        if (currentMetric === 'max' && currentStartYear === 1961 && currentCoverageThreshold === 0.80 && currentTempThreshold === 35) {
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
                <span class="font-extrabold ${accent.textSoft} ${accent.textSoftDark}">${total.toLocaleString()}<span class="text-[9px] text-slate-400 dark:text-slate-500 font-normal">${referenceLabel}</span></span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full h-3 overflow-hidden">
                <div class="${accent.barGradient} h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
        `;
        container.appendChild(row);
    });
    
    return decadeTotals;
}

// Update Global Stats Panel
function updateGlobalStats(filteredStations, decadeTotals) {
    const accent = getModeAccent();
    const stationsCount = document.getElementById('stat-stations-count');
    if (stationsCount) {
        stationsCount.textContent = filteredStations.length;
        stationsCount.className = `font-bold ${accent.textSoft} ${accent.textSoftDark} text-sm`;
    }
    
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
    
    const statTotalReports = document.getElementById('stat-total-reports');
    if (statTotalReports) {
        statTotalReports.textContent = totalReports.toLocaleString();
        statTotalReports.className = `font-bold ${accent.textSoft} ${accent.textSoftDark} text-sm`;
    }
    
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

function updateAdvancedFilterRatios() {
    const labelTemplate = i18n[currentLang]['lbl-filter-kept'];
    const baseStations = weatherData.filter(s => (
        calculateCoverageForPeriod(s, currentStartYear, maxYearGlobal) >= currentCoverageThreshold
    ));

    const moveBaseCount = baseStations.length;
    const unmovedCount = baseStations.filter(s => !checkMovesForPeriod(s, currentStartYear, maxYearGlobal)).length;
    const ratioElement = document.getElementById('lbl-moves-ratio');
    if (ratioElement) {
        const ofWord = currentLang === 'de' ? 'von' : 'of';
        ratioElement.textContent = `(${unmovedCount} ${ofWord} ${moveBaseCount})`;
    }

    const afterMoveStations = baseStations.filter(s => {
        const periodMoved = checkMovesForPeriod(s, currentStartYear, maxYearGlobal);
        if (currentMovesFilter === 'moved' && !periodMoved) return false;
        if (currentMovesFilter === 'unmoved' && periodMoved) return false;
        return true;
    });

    const airportKept = afterMoveStations.filter(s => !isStationNearAny(s, MAJOR_AIRPORTS, AIRPORT_EXCLUSION_RADIUS_KM)).length;
    const airportRatio = document.getElementById('lbl-airport-ratio');
    if (airportRatio) {
        airportRatio.textContent = labelTemplate
            .replace('{kept}', airportKept)
            .replace('{total}', afterMoveStations.length);
    }

    const afterAirportStations = afterMoveStations.filter(s => (
        !excludeAirportEnvironment || !isStationNearAny(s, MAJOR_AIRPORTS, AIRPORT_EXCLUSION_RADIUS_KM)
    ));
    const cityKept = afterAirportStations.filter(s => !isStationNearAny(s, MAJOR_CITIES, CITY_EXCLUSION_RADIUS_KM)).length;
    const cityRatio = document.getElementById('lbl-city-ratio');
    if (cityRatio) {
        cityRatio.textContent = labelTemplate
            .replace('{kept}', cityKept)
            .replace('{total}', afterAirportStations.length);
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
                const style = getHeatStyle(days, 'grid');
                
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
            const accent = getModeAccent();
            
            card.innerHTML = `
                <div class="flex justify-between items-center w-full mb-1 text-[10px]">
                    <span class="font-extrabold text-slate-500 dark:text-slate-300 text-xs">${yr}</span>
                    <span class="font-bold ${accent.textSoft} ${accent.textSoftDark} ${accent.bgSoft} px-1 rounded border ${accent.borderSoft}">${totalYearDays} <span class="text-[8px] font-normal text-slate-400 dark:text-slate-500">${i18n[currentLang]['lbl-day-unit']}</span></span>
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

function getAnnualTotals(filteredStations) {
    const years = [];
    const counts = [];
    for (let yr = currentStartYear; yr <= maxYearGlobal; yr++) {
        years.push(yr);
        let total = 0;
        filteredStations.forEach(s => {
            total += getDaysCountForYear(s, yr);
        });
        counts.push(total);
    }
    return { years, counts };
}

function getYearlyAverageSeries(filteredStations) {
    const years = [];
    const averages = [];
    const totals = [];
    const stationCounts = [];

    for (let yr = currentStartYear; yr <= maxYearGlobal; yr++) {
        let total = 0;
        let stationsWithData = 0;

        filteredStations.forEach(station => {
            if (getValidObservationDaysForYear(station, yr) <= 0) return;
            total += getDaysCountForYear(station, yr);
            stationsWithData += 1;
        });

        if (stationsWithData > 0) {
            years.push(yr);
            totals.push(total);
            stationCounts.push(stationsWithData);
            averages.push(total / stationsWithData);
        }
    }

    return { years, averages, totals, stationCounts };
}

function calculateLinearRegression(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };

    let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
    values.forEach((value, index) => {
        sumX += index;
        sumY += value;
        sumXX += index * index;
        sumXY += index * value;
    });

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return { slope: 0, intercept: sumY / n };

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}

function renderAnnualChart(filteredStations) {
    const container = document.getElementById('annual-chart-container');
    if (!container) return;

    const { years, counts } = getAnnualTotals(filteredStations);
    const t = i18n[currentLang];
    if (!years.length) {
        container.innerHTML = `<div class="py-24 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">${t['annual-empty']}</div>`;
        return;
    }

    const accent = getModeAccent();
    const isDark = document.documentElement.classList.contains('dark');
    const width = 1040;
    const height = 390;
    const padding = { top: 24, right: 22, bottom: 42, left: 62 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxVal = Math.max(...counts, 5);
    const yMax = Math.ceil(maxVal / 10) * 10 || 10;
    const n = years.length;

    const getX = (index) => n === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (n - 1)) * chartWidth;
    const getY = (value) => padding.top + chartHeight - (value / yMax) * chartHeight;
    const barStep = n > 1 ? chartWidth / n : chartWidth;
    const barWidth = Math.max(2, Math.min(12, barStep * 0.62));

    const { slope, intercept } = calculateLinearRegression(counts);
    const trendStart = intercept;
    const trendEnd = slope * (n - 1) + intercept;
    const trendPath = `M ${getX(0)},${getY(Math.max(0, trendStart))} L ${getX(n - 1)},${getY(Math.max(0, trendEnd))}`;
    const trendPerDecade = slope * 10;

    const axisStroke = isDark ? '#334155' : '#cbd5e1';
    const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
    const textFill = isDark ? '#94a3b8' : '#64748b';
    const barTop = currentMetric === 'min' ? '#38bdf8' : '#fb923c';
    const barBottom = currentMetric === 'min' ? '#1d4ed8' : '#c2410c';
    const trendStroke = currentMetric === 'min' ? '#075985' : '#b91c1c';
    const trendDash = currentMetric === 'min' ? '6 5' : 'none';

    let yGridSvg = '';
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
        const value = (yMax / ticks) * i;
        const y = getY(value);
        yGridSvg += `
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${gridStroke}" stroke-width="1" ${i === 0 ? '' : 'stroke-dasharray="2 4"'} />
            <text x="${padding.left - 10}" y="${y + 4}" fill="${textFill}" font-size="11" font-weight="700" text-anchor="end">${Math.round(value)}</text>
        `;
    }

    let xLabelsSvg = '';
    years.forEach((year, index) => {
        const isDecade = year % 10 === 0;
        const isEdge = year === years[0] || year === years[years.length - 1];
        if (isDecade || isEdge) {
            const x = getX(index);
            xLabelsSvg += `
                <line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 4}" stroke="${axisStroke}" stroke-width="1" />
                <text x="${x}" y="${height - padding.bottom + 21}" fill="${textFill}" font-size="11" font-weight="700" text-anchor="middle">${year}</text>
            `;
        }
    });

    const barsSvg = counts.map((value, index) => {
        const x = getX(index) - barWidth / 2;
        const y = getY(value);
        const barHeight = Math.max(1, height - padding.bottom - y);
        return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="1.5" fill="url(#annual-bar-grad)" class="transition duration-150">
                <title>${years[index]}: ${value.toLocaleString()} ${t['lbl-day-unit']}</title>
            </rect>
        `;
    }).join('');

    let peakIndex = 0;
    counts.forEach((value, index) => {
        if (value > counts[peakIndex]) peakIndex = index;
    });
    const latestIndex = counts.length - 1;
    const trendValue = `${trendPerDecade >= 0 ? '+' : ''}${trendPerDecade.toFixed(2)}`;

    container.innerHTML = `
        <div class="flex flex-col gap-4">
            <div class="w-full overflow-x-auto">
                <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="min-w-[760px]">
                    <defs>
                        <linearGradient id="annual-bar-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${barTop}" stop-opacity="0.95" />
                            <stop offset="100%" stop-color="${barBottom}" stop-opacity="0.68" />
                        </linearGradient>
                    </defs>

                    <text x="${padding.left}" y="13" fill="${textFill}" font-size="12" font-weight="800">${t['annual-axis-label']}</text>
                    ${yGridSvg}
                    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="${axisStroke}" stroke-width="1.2" />
                    ${xLabelsSvg}
                    ${barsSvg}
                    <path d="${trendPath}" fill="none" stroke="${trendStroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${trendDash}" />

                    <g transform="translate(${width - padding.right - 260}, 18)">
                        <rect x="0" y="-10" width="10" height="10" rx="2" fill="url(#annual-bar-grad)" />
                        <text x="17" y="-1" fill="${textFill}" font-size="11" font-weight="700">${t['annual-series-label']}</text>
                        <line x1="128" y1="-5" x2="154" y2="-5" stroke="${trendStroke}" stroke-width="3" stroke-dasharray="${trendDash}" stroke-linecap="round" />
                        <text x="162" y="-1" fill="${textFill}" font-size="11" font-weight="700">${t['annual-trend-label']}</text>
                    </g>
                </svg>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div class="flex flex-col gap-1">
                    <span class="text-xl font-black text-slate-800 dark:text-slate-100">${years[peakIndex]}: ${counts[peakIndex].toLocaleString()} ${t['lbl-day-unit']}</span>
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${t['annual-peak-label']}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-xl font-black text-slate-800 dark:text-slate-100">${years[latestIndex]}: ${counts[latestIndex].toLocaleString()} ${t['lbl-day-unit']}</span>
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${t['annual-latest-label']}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-xl font-black ${accent.textSoft} ${accent.textSoftDark}">${trendValue} ${t['lbl-day-unit']}</span>
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${t['annual-trend-stat-label']}</span>
                </div>
            </div>
        </div>
    `;
}

function renderYearlyTrendChart(filteredStations) {
    const container = document.getElementById('yearly-chart-container');
    if (!container) return;

    const { years, averages, totals, stationCounts } = getYearlyAverageSeries(filteredStations);
    const t = i18n[currentLang];
    if (!years.length) {
        container.innerHTML = `<div class="py-24 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">${t['yearly-empty']}</div>`;
        return;
    }

    const accent = getModeAccent();
    const isDark = document.documentElement.classList.contains('dark');
    const width = 1040;
    const height = 500;
    const padding = { top: 68, right: 30, bottom: 62, left: 62 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const n = years.length;
    const maxVal = Math.max(...averages, 2);
    const yMax = Math.max(5, Math.ceil(maxVal / 5) * 5);

    const getX = (index) => n === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (n - 1)) * chartWidth;
    const getY = (value) => padding.top + chartHeight - (value / yMax) * chartHeight;
    const barStep = n > 1 ? chartWidth / n : chartWidth;
    const barWidth = Math.max(3, Math.min(10, barStep * 0.58));

    const { slope, intercept } = calculateLinearRegression(averages);
    const trendStart = Math.max(0, intercept);
    const trendEnd = Math.max(0, slope * (n - 1) + intercept);
    const trendPerDecade = slope * 10;
    const trendPath = `M ${getX(0)},${getY(trendStart)} L ${getX(n - 1)},${getY(trendEnd)}`;

    let peakIndex = 0;
    averages.forEach((value, index) => {
        if (value > averages[peakIndex]) peakIndex = index;
    });
    const latestIndex = averages.length - 1;

    const axisStroke = isDark ? '#334155' : '#cbd5e1';
    const gridStroke = isDark ? '#334155' : '#cbd5e1';
    const textFill = isDark ? '#94a3b8' : '#64748b';
    const mutedText = isDark ? '#64748b' : '#94a3b8';
    const barTop = currentMetric === 'min' ? '#38bdf8' : '#fb7185';
    const barBottom = currentMetric === 'min' ? '#0ea5e9' : '#f97316';
    const trendStroke = currentMetric === 'min' ? '#0c4a6e' : '#9f1239';
    const peakStroke = currentMetric === 'min' ? '#bae6fd' : '#fed7aa';
    const barNoteX = padding.left + 12;
    const barNoteY = padding.top + chartHeight * 0.45;

    const formatValue = value => value.toLocaleString(currentLang === 'de' ? 'de-DE' : 'en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
    const wrapSvgText = (text, maxChars) => {
        const words = String(text).split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach(word => {
            const nextLine = currentLine ? `${currentLine} ${word}` : word;
            if (nextLine.length > maxChars && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = nextLine;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
    };
    const renderWrappedTspans = (lines, x) => lines.map((line, index) => (
        `<tspan x="${x}" dy="${index === 0 ? 0 : 24}">${line}</tspan>`
    )).join('');

    let yGridSvg = '';
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
        const value = (yMax / ticks) * i;
        const y = getY(value);
        yGridSvg += `
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${gridStroke}" stroke-width="1" ${i === 0 ? '' : 'stroke-dasharray="3 7"'} opacity="${i === 0 ? '0.9' : '0.7'}" />
            <text x="${padding.left - 10}" y="${y + 4}" fill="${textFill}" font-size="13" font-weight="700" text-anchor="end">${Math.round(value)}</text>
        `;
    }

    let xLabelsSvg = '';
    years.forEach((year, index) => {
        const isDecade = year % 10 === 0;
        const isEdge = year === years[0] || year === years[years.length - 1];
        if (isDecade || isEdge) {
            const x = getX(index);
            xLabelsSvg += `
                <line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 5}" stroke="${axisStroke}" stroke-width="1" />
                <text x="${x}" y="${height - padding.bottom + 25}" fill="${textFill}" font-size="13" font-weight="700" text-anchor="middle">${year}</text>
            `;
        }
    });

    const barsSvg = averages.map((value, index) => {
        const x = getX(index) - barWidth / 2;
        const y = getY(value);
        const barHeight = Math.max(1, height - padding.bottom - y);
        const isPeak = index === peakIndex;
        return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="1.5" fill="url(#yearly-bar-grad)" opacity="${isPeak ? '1' : '0.82'}">
                <title>${years[index]}: ${formatValue(value)} (${totals[index].toLocaleString()} / ${stationCounts[index]} ${t['inspector-lbl-stations'].toLowerCase()})</title>
            </rect>
        `;
    }).join('');

    const peakX = getX(peakIndex);
    const peakY = getY(averages[peakIndex]);
    const peakNote = t[`yearly-peak-note-${currentMetric}`].replace('{year}', years[peakIndex]);
    const peakNoteLines = wrapSvgText(peakNote, 34);
    const barNoteLines = wrapSvgText(t[`yearly-bar-note-${currentMetric}`], 34);
    const noteWidth = 250;
    const noteX = Math.min(Math.max(peakX - noteWidth * 0.55, padding.left), width - padding.right - noteWidth);
    const noteY = Math.max(30, peakY - 74);
    const arrowStartX = noteX + noteWidth * 0.7;
    const arrowStartY = noteY + 26;
    const arrowControlX = peakX + (arrowStartX < peakX ? -30 : 30);
    const arrowControlY = Math.min(peakY - 16, arrowStartY + 28);
    const peakLabelAnchor = peakX > width - padding.right - 72 ? 'end' : 'start';
    const peakLabelX = peakLabelAnchor === 'end' ? peakX - 10 : peakX + 10;

    container.innerHTML = `
        <div class="flex flex-col gap-4">
            <div class="w-full overflow-x-auto">
                <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="min-w-[780px]">
                    <defs>
                        <linearGradient id="yearly-bar-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${barTop}" stop-opacity="0.98" />
                            <stop offset="100%" stop-color="${barBottom}" stop-opacity="0.78" />
                        </linearGradient>
                        <marker id="yearly-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto">
                            <path d="M0,0 L7,3.5 L0,7" fill="none" stroke="${textFill}" stroke-width="1.5" />
                        </marker>
                    </defs>

                    <text x="${padding.left}" y="18" fill="${textFill}" font-size="12" font-weight="800">${t[`yearly-axis-label-${currentMetric}`]}</text>
                    ${yGridSvg}
                    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="${axisStroke}" stroke-width="1.4" />
                    ${xLabelsSvg}
                    ${barsSvg}
                    <path d="${trendPath}" fill="none" stroke="${trendStroke}" stroke-width="3" stroke-linecap="round" />

                    <circle cx="${peakX}" cy="${peakY}" r="4.5" fill="${trendStroke}" stroke="${peakStroke}" stroke-width="2" />
                    <text x="${peakLabelX}" y="${peakY - 9}" fill="${trendStroke}" font-size="12" font-weight="900" text-anchor="${peakLabelAnchor}">${years[peakIndex]}: ${formatValue(averages[peakIndex])}</text>
                    <path d="M ${arrowStartX} ${arrowStartY} Q ${arrowControlX} ${arrowControlY} ${peakX} ${peakY - 10}" fill="none" stroke="${textFill}" stroke-width="1.7" marker-end="url(#yearly-arrow)" />
                    <text x="${noteX}" y="${noteY}" fill="${textFill}" font-size="18" font-weight="500">
                        ${renderWrappedTspans(peakNoteLines, noteX)}
                    </text>

                    <path d="M ${barNoteX + 6} ${barNoteY + 8} L ${barNoteX + 6} ${barNoteY + 54}" fill="none" stroke="${textFill}" stroke-width="1.7" marker-end="url(#yearly-arrow)" />
                    <text x="${barNoteX}" y="${barNoteY}" fill="${textFill}" font-size="19" font-weight="500">
                        ${renderWrappedTspans(barNoteLines, barNoteX)}
                    </text>

                    <text x="${width - padding.right - 10}" y="${getY(trendEnd) - 8}" fill="${trendStroke}" font-size="18" font-weight="600" text-anchor="end">${t['yearly-trend-label']}</text>

                    <g transform="translate(${padding.left}, ${height - 15})">
                        <rect x="0" y="-11" width="10" height="11" rx="2" fill="url(#yearly-bar-grad)" />
                        <text x="17" y="-1" fill="${textFill}" font-size="11" font-weight="800">${t['yearly-series-label']}</text>
                        <line x1="132" y1="-6" x2="160" y2="-6" stroke="${trendStroke}" stroke-width="3" stroke-linecap="round" />
                        <text x="168" y="-1" fill="${textFill}" font-size="11" font-weight="800">${t['yearly-trend-label']}</text>
                    </g>
                </svg>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div class="flex flex-col gap-1">
                    <span class="text-xl font-black text-slate-800 dark:text-slate-100">${years[peakIndex]}: ${formatValue(averages[peakIndex])}</span>
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${t['yearly-peak-label']}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-xl font-black text-slate-800 dark:text-slate-100">${years[latestIndex]}: ${formatValue(averages[latestIndex])}</span>
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${t['yearly-latest-label']}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-xl font-black ${accent.textSoft} ${accent.textSoftDark}">${trendPerDecade >= 0 ? '+' : ''}${formatValue(trendPerDecade)}</span>
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${t['yearly-trend-stat-label']}</span>
                </div>
            </div>

            <div class="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span class="font-semibold ${accent.textSoft} ${accent.textSoftDark}">${currentTempThreshold} °C:</span>
                ${t[`yearly-methodology-${currentMetric}`].replace('{temp}', currentTempThreshold)}
            </div>
        </div>
    `;
}

function getSeasonEntryForStationYear(station, year) {
    const yrData = station.annual_data[year];
    if (!yrData) return null;
    const key = getMetricDataKey();

    if (currentMonths.length === 12) {
        return yrData.season ? yrData.season[key] || null : null;
    }

    let firstDoy = null;
    let lastDoy = null;
    let firstDate = null;
    let lastDate = null;

    currentMonths.forEach(month => {
        const monthData = yrData.m_data ? yrData.m_data[String(month)] : null;
        const entry = monthData && monthData.season ? monthData.season[key] : null;
        if (!entry) return;
        if (firstDoy === null || entry.first_doy < firstDoy) {
            firstDoy = entry.first_doy;
            firstDate = entry.first;
        }
        if (lastDoy === null || entry.last_doy > lastDoy) {
            lastDoy = entry.last_doy;
            lastDate = entry.last;
        }
    });

    if (firstDoy === null || lastDoy === null) return null;
    return {
        first: firstDate,
        last: lastDate,
        first_doy: firstDoy,
        last_doy: lastDoy,
        length: lastDoy - firstDoy + 1
    };
}

function getCombinedSeasonForYear(filteredStations, year) {
    let firstDoy = null;
    let lastDoy = null;
    let firstDate = null;
    let lastDate = null;

    filteredStations.forEach(station => {
        const entry = getSeasonEntryForStationYear(station, year);
        if (!entry) return;
        if (firstDoy === null || entry.first_doy < firstDoy) {
            firstDoy = entry.first_doy;
            firstDate = entry.first;
        }
        if (lastDoy === null || entry.last_doy > lastDoy) {
            lastDoy = entry.last_doy;
            lastDate = entry.last;
        }
    });

    if (firstDoy === null || lastDoy === null) return null;
    return {
        year,
        first: firstDate,
        last: lastDate,
        first_doy: firstDoy,
        last_doy: lastDoy,
        length: lastDoy - firstDoy + 1
    };
}

function summarizeSeasonPeriod(filteredStations, startYear, endYear, label) {
    const seasons = [];
    for (let year = startYear; year <= endYear; year++) {
        const season = getCombinedSeasonForYear(filteredStations, year);
        if (season) seasons.push(season);
    }

    if (!seasons.length) {
        return { label, startYear, endYear, seasons: [], shortest: null, longest: null, average: 0 };
    }

    let shortest = seasons[0];
    let longest = seasons[0];
    let total = 0;
    seasons.forEach(season => {
        if (season.length < shortest.length) shortest = season;
        if (season.length > longest.length) longest = season;
        total += season.length;
    });

    return {
        label,
        startYear,
        endYear,
        seasons,
        shortest,
        longest,
        average: total / seasons.length
    };
}

function formatPeriodLabel(startYear, endYear) {
    if (endYear === maxYearGlobal) {
        return `${startYear}–${getEndYearLabel(currentLang)}`;
    }
    return `${startYear}–${endYear}`;
}

function getSeasonDecadePeriods() {
    const decades = [
        [1961, 1970],
        [1971, 1980],
        [1981, 1990],
        [1991, 2000],
        [2001, 2010],
        [2011, 2020],
        [2021, maxYearGlobal]
    ];

    return decades
        .map(([startYear, endYear]) => ({
            startYear: Math.max(currentStartYear, startYear),
            endYear
        }))
        .filter(period => period.startYear <= period.endYear);
}

function renderSeasonChart(filteredStations) {
    const container = document.getElementById('season-chart-container');
    if (!container) return;

    const t = i18n[currentLang];
    const periods = getSeasonDecadePeriods().map(period => (
        summarizeSeasonPeriod(
            filteredStations,
            period.startYear,
            period.endYear,
            formatPeriodLabel(period.startYear, period.endYear)
        )
    ));

    const availablePeriods = periods.filter(period => period.shortest && period.longest);
    if (!availablePeriods.length) {
        container.innerHTML = `<div class="py-24 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">${t['season-empty']}</div>`;
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const width = 1040;
    const rowGap = 62;
    const padding = { top: 42, right: 34, bottom: 52, left: 150 };
    const height = padding.top + padding.bottom + 48 + (availablePeriods.length - 1) * rowGap;
    const chartWidth = width - padding.left - padding.right;
    const maxLength = Math.max(...availablePeriods.map(period => period.longest.length), 30);
    const xMax = Math.ceil(maxLength / 20) * 20;
    const getX = value => padding.left + (value / xMax) * chartWidth;
    const plotLeft = padding.left;
    const plotRight = width - padding.right;
    const axisY = height - padding.bottom;
    const textFill = isDark ? '#94a3b8' : '#64748b';
    const mutedText = isDark ? '#64748b' : '#94a3b8';
    const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
    const lineStroke = isDark ? '#475569' : '#cbd5e1';
    const shortestColor = currentMetric === 'min' ? '#38bdf8' : '#eab308';
    const longestColor = currentMetric === 'min' ? '#1d4ed8' : '#dc2626';
    const accent = getModeAccent();

    let axisSvg = '';
    const tickStep = Math.max(10, Math.ceil(xMax / 5 / 10) * 10);
    for (let value = 0; value <= xMax; value += tickStep) {
        const x = getX(value);
        axisSvg += `
            <line x1="${x}" y1="${padding.top - 12}" x2="${x}" y2="${axisY}" stroke="${gridStroke}" stroke-width="1" />
            <text x="${x}" y="${axisY + 20}" fill="${textFill}" font-size="11" font-weight="700" text-anchor="middle">${value}</text>
        `;
    }

    const getTextWidthEstimate = (text, fontSize = 12, fontWeight = 800) => {
        const weightFactor = fontWeight >= 800 ? 0.64 : 0.58;
        return String(text).length * fontSize * weightFactor;
    };

    const averageLabelWidth = Math.max(
        ...availablePeriods.map(period => (
            getTextWidthEstimate(
                `${t['season-average']}: ${t['season-days'].replace('{n}', period.average.toFixed(1))}`,
                10,
                800
            )
        ))
    );
    const pointLabelRight = Math.max(plotLeft + 120, plotRight - averageLabelWidth - 18);

    const getClampedPointLabel = (x, text, preferredSide) => {
        const labelPadding = 10;
        const labelWidth = getTextWidthEstimate(text, 12, 900);
        const fitsLeft = x - labelPadding - labelWidth >= plotLeft;
        const fitsRight = x + labelPadding + labelWidth <= pointLabelRight;

        if (preferredSide === 'left' && fitsLeft) {
            return { x: x - labelPadding, anchor: 'end' };
        }
        if (preferredSide === 'right' && fitsRight) {
            return { x: x + labelPadding, anchor: 'start' };
        }
        if (fitsRight) {
            return { x: x + labelPadding, anchor: 'start' };
        }
        if (fitsLeft) {
            return { x: x - labelPadding, anchor: 'end' };
        }

        return {
            x: Math.min(Math.max(x, plotLeft + labelWidth / 2), pointLabelRight - labelWidth / 2),
            anchor: 'middle'
        };
    };

    const rowsSvg = availablePeriods.map((period, index) => {
        const y = padding.top + 38 + index * rowGap;
        const shortestX = getX(period.shortest.length);
        const longestX = getX(period.longest.length);
        const shortestLabel = t['season-days'].replace('{n}', Math.round(period.shortest.length));
        const longestLabel = t['season-days'].replace('{n}', Math.round(period.longest.length));
        const avgLabel = t['season-days'].replace('{n}', period.average.toFixed(1));
        const shortestPointLabel = `${period.shortest.year}: ${Math.round(period.shortest.length)}`;
        const longestPointLabel = `${period.longest.year}: ${Math.round(period.longest.length)}`;
        const shortestPlacement = getClampedPointLabel(shortestX, shortestPointLabel, 'left');
        const longestPlacement = getClampedPointLabel(longestX, longestPointLabel, 'right');
        const yearsWithDataLabel = `${period.seasons.length}/${period.endYear - period.startYear + 1} ${currentLang === 'de' ? 'Jahre' : 'years'}`;

        return `
            <g>
                <text x="${padding.left - 22}" y="${y - 8}" fill="${textFill}" font-size="14" font-weight="900" text-anchor="end">${period.label}</text>
                <text x="${padding.left - 22}" y="${y + 12}" fill="${mutedText}" font-size="11" font-weight="700" text-anchor="end">${yearsWithDataLabel}</text>
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${gridStroke}" stroke-width="1" stroke-dasharray="2 4" />
                <line x1="${shortestX}" y1="${y}" x2="${longestX}" y2="${y}" stroke="${lineStroke}" stroke-width="8" stroke-linecap="round" opacity="0.55" />
                <circle cx="${shortestX}" cy="${y}" r="8" fill="${shortestColor}" stroke="${isDark ? '#020617' : '#ffffff'}" stroke-width="2">
                    <title>${period.shortest.year}: ${shortestLabel} (${period.shortest.first} – ${period.shortest.last})</title>
                </circle>
                <circle cx="${longestX}" cy="${y}" r="8" fill="${longestColor}" stroke="${isDark ? '#020617' : '#ffffff'}" stroke-width="2">
                    <title>${period.longest.year}: ${longestLabel} (${period.longest.first} – ${period.longest.last})</title>
                </circle>
                <text x="${shortestPlacement.x}" y="${y - 16}" fill="${shortestColor}" font-size="12" font-weight="900" text-anchor="${shortestPlacement.anchor}">${shortestPointLabel}</text>
                <text x="${longestPlacement.x}" y="${y + 4}" fill="${longestColor}" font-size="12" font-weight="900" text-anchor="${longestPlacement.anchor}">${longestPointLabel}</text>
                <text x="${plotRight}" y="${y - 14}" fill="${textFill}" font-size="10" font-weight="800" text-anchor="end">${t['season-average']}: ${avgLabel}</text>
            </g>
        `;
    }).join('');

    container.innerHTML = `
        <div class="flex flex-col gap-4">
            <div class="w-full overflow-x-auto">
                <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="min-w-[760px]">
                    <text x="${padding.left}" y="18" fill="${textFill}" font-size="12" font-weight="800">${t['season-axis-label']}</text>
                    ${axisSvg}
                    ${rowsSvg}
                    <g transform="translate(${padding.left}, ${height - 14})">
                        <circle cx="0" cy="-4" r="6" fill="${shortestColor}" />
                        <text x="13" y="0" fill="${textFill}" font-size="11" font-weight="800">${t['season-shortest']}</text>
                        <circle cx="104" cy="-4" r="6" fill="${longestColor}" />
                        <text x="117" y="0" fill="${textFill}" font-size="11" font-weight="800">${t['season-longest']}</text>
                    </g>
                </svg>
            </div>
            <div class="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span class="font-semibold ${accent.textSoft} ${accent.textSoftDark}">${currentTempThreshold} °C:</span>
                ${t['season-methodology']}
            </div>
        </div>
    `;
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
        } else if (currentViewMode === 'single') {
            titleElement.textContent = i18n[currentLang]['card-title-single'] + ` (${currentStartYear}–${endYearLabel})`;
        } else if (currentViewMode === 'annual') {
            titleElement.textContent = i18n[currentLang]['card-title-annual'] + ` (${currentStartYear}–${endYearLabel})`;
        } else if (currentViewMode === 'yearly') {
            titleElement.textContent = i18n[currentLang]['card-title-yearly'] + ` (${currentStartYear}–${endYearLabel})`;
        } else {
            titleElement.textContent = i18n[currentLang]['card-title-season'] + ` (${currentStartYear}–${endYearLabel})`;
        }
    }
    if (subtitleElement) {
        if (currentViewMode === 'grid') {
            subtitleElement.textContent = i18n[currentLang][`card-subtitle-grid-${currentMetric}`];
        } else if (currentViewMode === 'single') {
            subtitleElement.textContent = i18n[currentLang][`card-subtitle-single-${currentMetric}`];
        } else if (currentViewMode === 'annual') {
            subtitleElement.textContent = i18n[currentLang][`card-subtitle-annual-${currentMetric}`];
        } else if (currentViewMode === 'yearly') {
            subtitleElement.textContent = i18n[currentLang][`card-subtitle-yearly-${currentMetric}`];
        } else {
            subtitleElement.textContent = i18n[currentLang][`card-subtitle-season-${currentMetric}`].replace('{temp}', currentTempThreshold);
        }
    }
    
    const decadeTotals = renderDecadalStats(filteredStations);
    updateGlobalStats(filteredStations, decadeTotals);
    
    if (currentViewMode === 'grid') {
        renderMapsGrid(filteredStations);
    } else if (currentViewMode === 'single') {
        renderSingleMap(filteredStations);
    } else if (currentViewMode === 'annual') {
        renderAnnualChart(filteredStations);
    } else if (currentViewMode === 'yearly') {
        renderYearlyTrendChart(filteredStations);
    } else {
        renderSeasonChart(filteredStations);
    }
    
    renderInspectorStationList(filteredStations);
    filterStationList(currentSearchQuery, true);
    
    updateAdvancedFilterRatios();
    
    // Update legend circles with visual sizes matching the maps
    updateLegend();
    setTimeout(updateLegend, 50);
    
    // Update the URL hash to capture full parameter states
    updateURLHash();
}

// Parameters modifications
function setTemperatureThreshold(temp) {
    currentTempThreshold = parseInt(temp);
    lastThresholdByMetric[currentMetric] = currentTempThreshold;
    
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

function setMetric(metric) {
    if (!METRIC_CONFIG[metric] || currentMetric === metric) return;

    lastThresholdByMetric[currentMetric] = currentTempThreshold;
    currentMetric = metric;

    const config = getMetricConfig();
    const savedThreshold = lastThresholdByMetric[currentMetric] || config.defaultThreshold;
    currentTempThreshold = Math.min(config.maxThreshold, Math.max(config.minThreshold, savedThreshold));
    lastThresholdByMetric[currentMetric] = currentTempThreshold;

    refreshMaxDaysInMonthsOfLastYear();
    setLanguage(currentLang);
    syncUIControls();
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

function toggleAirportFilter(isChecked) {
    excludeAirportEnvironment = isChecked;
    updateDashboard();
}

function toggleCityFilter(isChecked) {
    excludeCityEnvironment = isChecked;
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
    const accent = getModeAccent();
    
    container.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const isChecked = currentMonths.includes(m);
        const div = document.createElement('div');
        div.className = 'flex items-center gap-1.5';
        div.innerHTML = `
            <input type="checkbox" id="check-month-${m}" value="${m}" ${isChecked ? 'checked' : ''} 
                   onchange="onMonthCheckboxChange(this)"
                   class="w-3.5 h-3.5 ${accent.textSoft} bg-slate-100 dark:bg-slate-955 border-slate-350 dark:border-slate-800 rounded ${accent.focusRing} focus:ring-2 cursor-pointer ${accent.accent}">
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
        
        const accent = getModeAccent();
        item.className = `flex flex-col items-start px-3 py-2 rounded-lg text-left w-full text-xs transition duration-150 ${s.station_id === selectedStationId ? `${accent.bg} text-white font-semibold shadow-sm ${accent.shadow}` : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-300 dark:hover:border-slate-800'}`;
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

function selectStation(sid, options = {}) {
    if (sid && selectedStationId === sid && !options.force) {
        selectStation(null);
        return;
    }

    if (selectedStationId) {
        const oldItem = document.getElementById(`inspector-item-${selectedStationId}`);
        if (oldItem) {
            oldItem.className = 'flex flex-col items-start px-3 py-2 rounded-lg text-left w-full text-xs transition duration-150 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-300 dark:hover:border-slate-800';
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
        if (currentViewMode === 'single') {
            renderSingleMap(getFilteredStations());
        }
        updateURLHash();
        return;
    }
    
    selectedStationId = sid;
    
    const newItem = document.getElementById(`inspector-item-${sid}`);
    if (newItem) {
        const accent = getModeAccent();
        newItem.className = `flex flex-col items-start px-3 py-2 rounded-lg text-left w-full text-xs transition duration-150 ${accent.bg} text-white font-semibold shadow-sm ${accent.shadow}`;
    }
    
    renderStationWorkspace(sid);
    if (currentViewMode === 'single') {
        renderSingleMap(getFilteredStations());
    }
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
    
    const chartTitle = t[`lbl-chart-trend-${currentMetric}`].replace('{temp}', currentTempThreshold);
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
    const trendStroke = currentMetric === 'min' ? '#0284c7' : '#f43f5e';
    const trendShadow = currentMetric === 'min' ? '#0ea5e9' : '#f43f5e';
    const annotationFill = slope >= 0
        ? (currentMetric === 'min' ? (isDark ? '#7dd3fc' : '#0369a1') : (isDark ? '#fda4af' : '#b91c1c'))
        : textFill;
    const warmGradTop = currentMetric === 'min' ? '#38bdf8' : '#f97316';
    const warmGradBottom = currentMetric === 'min' ? '#0284c7' : '#ea580c';
    const extremeGradTop = currentMetric === 'min' ? '#2563eb' : '#ef4444';
    const extremeGradBottom = currentMetric === 'min' ? '#1e3a8a' : '#991b1b';
    const hoverFillClass = currentMetric === 'min' ? 'hover:fill-cyan-300' : 'hover:fill-amber-400';
    
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
                      class="transition-all duration-300 ${hoverFillClass}">
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
                    <stop offset="0%" stop-color="${warmGradTop}" stop-opacity="0.9"/>
                    <stop offset="100%" stop-color="${warmGradBottom}" stop-opacity="0.4"/>
                </linearGradient>
                <linearGradient id="bar-extreme-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${extremeGradTop}" stop-opacity="0.95"/>
                    <stop offset="100%" stop-color="${extremeGradBottom}" stop-opacity="0.5"/>
                </linearGradient>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="${trendShadow}" flood-opacity="0.3" />
                </filter>
            </defs>
            
            <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="${axisStroke}" stroke-width="1" />
            
            ${yGridSvg}
            ${xLabelsSvg}
            ${barsSvg}
            ${movePinsSvg}
            
            <path d="${trendPath}" fill="none" stroke="${trendStroke}" stroke-width="2" filter="url(#shadow)" stroke-linecap="round" />
            
            <g>
                <rect x="${padding.left + 12}" y="${padding.top + 2}" width="220" height="20" rx="3" fill="${annotBg}" fill-opacity="0.9" stroke="${annotBorder}" stroke-width="0.5" />
                <text x="${padding.left + 18}" y="${padding.top + 14}" fill="${annotationFill}" font-size="8" font-weight="bold">
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

    // Measure the visible map SVG so legend circles match the current view.
    let scale = 0.9;
    const mapSvg = document.querySelector(
        currentViewMode === 'single' ? '#single-map-svg' : '#map-grid-container svg'
    );
    if (mapSvg) {
        const rect = mapSvg.getBoundingClientRect();
        if (rect.width > 0) {
            scale = rect.width / 110; // viewBox width is 110
        }
    }

    const isDark = document.documentElement.classList.contains('dark');
    const strokeColor = isDark ? '#05070c' : '#ffffff';

    const activeScale = getMetricScale();
    const groups = [
        { label: `${activeScale[0]}`, minDays: activeScale[0] },
        { label: `${activeScale[1]}`, minDays: activeScale[1] },
        { label: `${activeScale[2]}`, minDays: activeScale[2] },
        { label: `${activeScale[3]}`, minDays: activeScale[3] },
        { label: `${activeScale[4]}+`, minDays: activeScale[4] }
    ];

    container.innerHTML = groups.map(g => {
        const style = getHeatStyle(g.minDays, currentViewMode);
        const physicalRadius = style.r * scale;
        const size = Math.max(20, Math.ceil((physicalRadius + 1) * 2));
        const center = size / 2;

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
    params.set('metric', currentMetric);
    params.set('temp', currentTempThreshold);
    params.set('start', currentStartYear);
    params.set('coverage', Math.round(currentCoverageThreshold * 100));
    params.set('moves', currentMovesFilter);
    if (excludeAirportEnvironment) {
        params.set('airport', 'exclude');
    }
    if (excludeCityEnvironment) {
        params.set('city', 'exclude');
    }
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
    currentViewMode = 'grid';
    currentActiveYear = maxYearGlobal;
    currentSearchQuery = '';
    currentMetric = 'max';
    currentTempThreshold = METRIC_CONFIG.max.defaultThreshold;
    lastThresholdByMetric = { max: METRIC_CONFIG.max.defaultThreshold, min: METRIC_CONFIG.min.defaultThreshold };
    excludeAirportEnvironment = false;
    excludeCityEnvironment = false;
    
    if (!hash) return;
    
    const params = new URLSearchParams(hash);

    if (params.has('metric')) {
        const val = params.get('metric');
        if (val === 'max' || val === 'min') currentMetric = val;
    }
    
    if (params.has('temp')) {
        const val = parseInt(params.get('temp'));
        const config = getMetricConfig();
        if (val >= config.minThreshold && val <= config.maxThreshold) {
            currentTempThreshold = val;
        } else {
            currentTempThreshold = config.defaultThreshold;
        }
    } else {
        currentTempThreshold = getMetricConfig().defaultThreshold;
    }
    lastThresholdByMetric[currentMetric] = currentTempThreshold;
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
    if (params.has('airport')) {
        const val = params.get('airport');
        excludeAirportEnvironment = val === 'exclude' || val === '1' || val === 'true';
    }
    if (params.has('city')) {
        const val = params.get('city');
        excludeCityEnvironment = val === 'exclude' || val === '1' || val === 'true';
    }
    if (params.has('station')) {
        selectedStationId = params.get('station');
    }
    if (params.has('view')) {
        const val = params.get('view');
        if (val === 'grid' || val === 'single' || val === 'annual' || val === 'yearly' || val === 'season') currentViewMode = val;
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
    const accent = getModeAccent();

    const lblMetric = document.getElementById('lbl-metric');
    if (lblMetric) lblMetric.textContent = i18n[currentLang]['lbl-metric'];

    const lblTempThreshold = document.getElementById('lbl-temp-threshold');
    if (lblTempThreshold) lblTempThreshold.textContent = i18n[currentLang][`lbl-temp-threshold-${currentMetric}`];

    const btnMetricMax = document.getElementById('btn-metric-max');
    const btnMetricMin = document.getElementById('btn-metric-min');
    if (btnMetricMax && btnMetricMin) {
        btnMetricMax.textContent = i18n[currentLang]['metric-max'];
        btnMetricMin.textContent = i18n[currentLang]['metric-min'];

        const activeMaxClass = 'flex-1 px-2 py-1.5 rounded text-[10px] font-bold transition duration-150 bg-orange-600 text-white shadow-sm';
        const activeMinClass = 'flex-1 px-2 py-1.5 rounded text-[10px] font-bold transition duration-150 bg-sky-600 text-white shadow-sm';
        const inactiveClass = 'flex-1 px-2 py-1.5 rounded text-[10px] font-bold transition duration-150 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white';
        btnMetricMax.className = currentMetric === 'max' ? activeMaxClass : inactiveClass;
        btnMetricMin.className = currentMetric === 'min' ? activeMinClass : inactiveClass;
    }
    
    const tempSlider = document.getElementById('slider-temp-threshold');
    const tempVal = document.getElementById('temp-threshold-val');
    const config = getMetricConfig();
    if (tempSlider) {
        tempSlider.min = config.minThreshold;
        tempSlider.max = config.maxThreshold;
        tempSlider.value = currentTempThreshold;
        tempSlider.className = `w-full h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer ${currentMetric === 'min' ? 'accent-sky-500' : 'accent-orange-500'}`;
    }
    if (tempVal) {
        tempVal.textContent = `${currentTempThreshold} °C`;
        tempVal.className = currentMetric === 'min'
            ? 'font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 shrink-0'
            : 'font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shrink-0';
    }
    
    const startSlider = document.getElementById('slider-start-year');
    const startVal = document.getElementById('start-year-val');
    if (startSlider) {
        startSlider.value = currentStartYear;
        startSlider.className = `w-full h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer ${accent.accent}`;
    }
    if (startVal) {
        startVal.textContent = currentStartYear;
        startVal.className = `font-bold ${accent.textSoft} ${accent.textSoftDark} ${accent.bgSoft} px-2 py-0.5 rounded border ${accent.borderSoft} shrink-0`;
    }
    
    const covSlider = document.getElementById('slider-coverage');
    const covVal = document.getElementById('coverage-val');
    if (covSlider) {
        covSlider.value = Math.round(currentCoverageThreshold * 100);
        covSlider.className = `w-full h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer ${accent.accent}`;
    }
    if (covVal) {
        covVal.textContent = `${Math.round(currentCoverageThreshold * 100)} %`;
        covVal.className = `font-bold ${accent.textSoft} ${accent.textSoftDark} ${accent.bgSoft} px-2 py-0.5 rounded border ${accent.borderSoft} shrink-0`;
    }
    
    const movesCheck = document.getElementById('check-moves-unmoved');
    if (movesCheck) {
        movesCheck.checked = (currentMovesFilter === 'unmoved');
        movesCheck.className = `w-4 h-4 mt-0.5 ${accent.textSoft} bg-slate-100 dark:bg-slate-955 border-slate-350 dark:border-slate-800 rounded ${accent.focusRing} focus:ring-2 cursor-pointer ${accent.accent}`;
    }

    const airportCheck = document.getElementById('check-airport-exclusion');
    if (airportCheck) {
        airportCheck.checked = excludeAirportEnvironment;
        airportCheck.className = `w-4 h-4 mt-0.5 ${accent.textSoft} bg-slate-100 dark:bg-slate-955 border-slate-350 dark:border-slate-800 rounded ${accent.focusRing} focus:ring-2 cursor-pointer ${accent.accent}`;
    }

    const cityCheck = document.getElementById('check-city-exclusion');
    if (cityCheck) {
        cityCheck.checked = excludeCityEnvironment;
        cityCheck.className = `w-4 h-4 mt-0.5 ${accent.textSoft} bg-slate-100 dark:bg-slate-955 border-slate-350 dark:border-slate-800 rounded ${accent.focusRing} focus:ring-2 cursor-pointer ${accent.accent}`;
    }

    const searchInput = document.getElementById('input-station-search');
    if (searchInput) {
        searchInput.value = currentSearchQuery;
        searchInput.className = `w-full text-[11px] bg-slate-200/40 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none ${accent.focusBorder} transition duration-150`;
    }

    const monthDropdown = document.getElementById('btn-month-dropdown');
    if (monthDropdown) {
        monthDropdown.className = `w-full text-xs font-semibold bg-slate-200 dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-lg px-3 py-2 text-left text-slate-700 dark:text-slate-350 flex justify-between items-center cursor-pointer ${accent.borderHover} transition duration-150`;
    }
    const btnMonthAll = document.getElementById('btn-month-all');
    if (btnMonthAll) {
        btnMonthAll.className = `text-[10px] font-extrabold ${accent.textSoft} ${accent.textSoftDark} ${accent.bgSoft} ${accent.bgSoftHover} px-2 py-1 rounded transition duration-150`;
    }
    const btnMonthSummer = document.getElementById('btn-month-summer');
    if (btnMonthSummer) {
        btnMonthSummer.className = `text-[10px] font-extrabold ${accent.textSoft} ${accent.textSoftDark} ${accent.bgSoft} ${accent.bgSoftHover} px-2 py-1 rounded transition duration-150`;
    }

    const decadesButton = document.getElementById('btn-show-decades');
    if (decadesButton) {
        decadesButton.className = `flex flex-col bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-300/80 dark:border-slate-800 hover:${accent.borderSoft} dark:hover:${accent.borderSoft} rounded-lg px-2.5 py-1 text-center min-w-[85px] sm:min-w-[95px] transition duration-150 active:scale-95 group`;
        const label = document.getElementById('btn-lbl-decades');
        if (label) {
            label.className = `text-[9px] text-slate-500 dark:text-slate-550 font-semibold uppercase tracking-wider group-hover:${accent.textSoft.replace('text-', 'text-')} transition duration-150`;
        }
        const icon = decadesButton.querySelector('svg');
        if (icon) {
            icon.className = `w-3 h-3 ${currentMetric === 'min' ? 'text-sky-500' : 'text-orange-500'}`;
        }
    }

    // Visual switch buttons sync
    const btnGrid = document.getElementById('btn-view-grid');
    const btnSingle = document.getElementById('btn-view-single');
    const btnAnnual = document.getElementById('btn-view-annual');
    const btnYearly = document.getElementById('btn-view-yearly');
    const btnSeason = document.getElementById('btn-view-season');
    if (btnGrid && btnSingle && btnAnnual && btnYearly && btnSeason) {
        const viewButtons = [
            ['grid', btnGrid],
            ['single', btnSingle],
            ['annual', btnAnnual],
            ['yearly', btnYearly],
            ['season', btnSeason]
        ];
        const activeViewClass = `group flex min-h-[74px] flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 rounded-lg px-2.5 sm:px-3 py-2.5 text-center sm:text-left transition duration-150 ${accent.bg} text-white shadow-sm ${accent.shadow}`;
        const inactiveViewClass = 'group flex min-h-[74px] flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 rounded-lg px-2.5 sm:px-3 py-2.5 text-center sm:text-left text-slate-600 dark:text-slate-350 transition duration-150 hover:bg-white/70 dark:hover:bg-slate-900/80';
        viewButtons.forEach(([mode, button]) => {
            const isActive = currentViewMode === mode;
            button.className = isActive ? activeViewClass : inactiveViewClass;
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');

            const icon = button.querySelector('.view-mode-icon');
            if (icon) {
                icon.className = isActive
                    ? 'view-mode-icon flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white'
                    : `view-mode-icon flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg ${accent.bgSoft} ${accent.textSoft} ${accent.textSoftDark}`;
            }

            const desc = button.querySelector('.view-mode-desc');
            if (desc) {
                desc.className = isActive
                    ? 'view-mode-desc hidden sm:block truncate text-[11px] font-semibold leading-tight text-white/75'
                    : 'view-mode-desc hidden sm:block truncate text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-500';
            }
        });
    }
    
    // View panel visibility sync
    const gridView = document.getElementById('map-grid-view');
    const singleView = document.getElementById('map-single-view');
    const annualView = document.getElementById('annual-chart-view');
    const yearlyView = document.getElementById('yearly-chart-view');
    const seasonView = document.getElementById('season-chart-view');
    if (gridView && singleView && annualView && yearlyView && seasonView) {
        gridView.classList.toggle('hidden', currentViewMode !== 'grid');
        gridView.classList.toggle('block', currentViewMode === 'grid');
        singleView.classList.toggle('hidden', currentViewMode !== 'single');
        singleView.classList.toggle('block', currentViewMode === 'single');
        annualView.classList.toggle('hidden', currentViewMode !== 'annual');
        annualView.classList.toggle('block', currentViewMode === 'annual');
        yearlyView.classList.toggle('hidden', currentViewMode !== 'yearly');
        yearlyView.classList.toggle('block', currentViewMode === 'yearly');
        seasonView.classList.toggle('hidden', currentViewMode !== 'season');
        seasonView.classList.toggle('block', currentViewMode === 'season');
    }

    const bubbleLegend = document.getElementById('bubble-legend');
    if (bubbleLegend) {
        const showBubbleLegend = currentViewMode === 'grid' || currentViewMode === 'single';
        bubbleLegend.classList.toggle('hidden', !showBubbleLegend);
        bubbleLegend.classList.toggle('flex', showBubbleLegend);
    }
    
    // Animate timeline bar year progress slider limits sync
    const singleSlider = document.getElementById('slider-single-year');
    if (singleSlider) {
        singleSlider.min = currentStartYear;
        singleSlider.max = maxYearGlobal;
        singleSlider.value = currentActiveYear;
        singleSlider.className = `flex-grow h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer ${accent.accent}`;
    }
    
    const sliderMinYearLbl = document.getElementById('slider-min-year-lbl');
    if (sliderMinYearLbl) {
        sliderMinYearLbl.textContent = currentStartYear;
    }
    
    const sliderMaxYearLbl = document.getElementById('slider-max-year-lbl');
    if (sliderMaxYearLbl) {
        sliderMaxYearLbl.textContent = maxYearGlobal;
    }

    const speedSelect = document.getElementById('select-speed');
    if (speedSelect) {
        speedSelect.className = `text-[10px] bg-slate-200 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none ${accent.focusBorder} cursor-pointer font-semibold`;
    }

    updatePlayButtonAccent();
}

function updatePlayButtonAccent() {
    const playBtn = document.getElementById('btn-play-pause');
    if (!playBtn || animationIntervalId) return;
    const accent = getModeAccent();
    playBtn.className = `flex items-center justify-center w-9 h-9 rounded-full ${accent.bg} ${accent.bgHover} text-white font-bold transition duration-150 shadow-md ${accent.shadow} active:scale-95`;
}

// Set the active visualization view mode ('grid', 'single', 'annual', 'yearly', or 'season')
function setViewMode(mode) {
    if (!['grid', 'single', 'annual', 'yearly', 'season'].includes(mode)) return;
    if (currentViewMode === mode) return;
    
    // Pause animation if playing and switching away from single map
    if (mode !== 'single' && animationIntervalId) {
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
    const accent = getModeAccent();
    
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
        const style = getHeatStyle(days, 'single');
        const hitRadius = Math.max(style.r + 1.1, 3.2);
        
        const isSelected = s.station_id === selectedStationId;
        const selectionRing = isSelected 
            ? `<circle cx="${x}" cy="${y}" r="${style.r + 2.0}" fill="none" stroke="${accent.ringStroke}" stroke-dasharray="1,1" stroke-width="0.6"/>`
            : '';
            
        circlesSvg += `
            <g class="cursor-pointer" onclick="selectStation('${s.station_id}')">
                <circle cx="${x}" cy="${y}" r="${hitRadius}" fill="transparent" stroke="none" pointer-events="all">
                    <title>${s.name}: ${days} ${i18n[currentLang]['lbl-day-unit']}</title>
                </circle>
                ${selectionRing}
                <circle cx="${x}" cy="${y}" r="${style.r}" 
                        fill="${style.fill}" fill-opacity="${style.opacity}" 
                        stroke="${isDark ? '#05070c' : '#ffffff'}" stroke-width="0.3"
                        class="${accent.hoverStroke} hover:stroke-[0.8] transition-all duration-150">
                    <title>${s.name}: ${days} ${i18n[currentLang]['lbl-day-unit']}</title>
                </circle>
            </g>
        `;
    });
    
    singleMapSvg.innerHTML = `${statesPathsSvg}${circlesSvg}`;
    
    // Update active labels
    const activeYearDisplay = document.getElementById('lbl-active-year-val');
    if (activeYearDisplay) {
        activeYearDisplay.textContent = currentActiveYear;
        activeYearDisplay.className = `font-extrabold text-lg ${accent.textSoft} ${accent.textSoftDark} leading-none`;
    }
    
    
    
    const metaYear = document.getElementById('single-map-meta-year');
    if (metaYear) {
        metaYear.textContent = currentActiveYear;
        metaYear.className = `font-black text-base ${accent.textSoft} ${accent.textSoftDark} mt-0.5`;
    }
    
    const metaTotal = document.getElementById('single-map-meta-total');
    if (metaTotal) {
        let totalWord;
        if (currentLang === 'de') {
            if (currentMetric === 'min') {
                if (currentTempThreshold >= 20) {
                    totalWord = totalYearDays === 1 ? 'Tropennacht gesamt' : 'Tropennächte gesamt';
                } else {
                    totalWord = totalYearDays === 1 ? 'Nacht gesamt' : 'Nächte gesamt';
                }
            } else {
                totalWord = totalYearDays === 1 ? 'Tag gesamt' : 'Tage gesamt';
            }
        } else {
            if (currentMetric === 'min') {
                if (currentTempThreshold >= 20) {
                    totalWord = totalYearDays === 1 ? 'tropical night total' : 'tropical nights total';
                } else {
                    totalWord = totalYearDays === 1 ? 'night total' : 'nights total';
                }
            } else {
                totalWord = totalYearDays === 1 ? 'day total' : 'days total';
            }
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
        updatePlayButtonAccent();
    } else {
        // Play
        if (svgPlay) svgPlay.classList.add('hidden');
        if (svgPause) svgPause.classList.remove('hidden');
        if (playBtn) {
            playBtn.className = 'flex items-center justify-center w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition duration-150 shadow-md shadow-red-500/20 active:scale-95';
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
    refreshMaxDaysInMonthsOfLastYear();
    syncUIControls();
    updateDashboard();
    if (selectedStationId) {
        selectStation(selectedStationId, { force: true });
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
