import os
import re
import io
import json
import math
import zipfile
import urllib.request
import pandas as pd
from datetime import datetime

# Setup directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
ZIP_DIR = os.path.join(DATA_DIR, 'zips')

os.makedirs(ZIP_DIR, exist_ok=True)

# DWD URLs
DWD_BASE = "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl"
URL_HIST_DIR = f"{DWD_BASE}/historical/"
URL_RECENT_DIR = f"{DWD_BASE}/recent/"
URL_STATION_DESC = f"{DWD_BASE}/historical/KL_Tageswerte_Beschreibung_Stationen.txt"

# GeoJSON source for Germany States (low resolution 97KB)
URL_GEOJSON = "https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/4_niedrig.geo.json"

def haversine(lat1, lon1, lat2, lon2):
    """Calculates geodetic distance between two points in meters."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def get_directory_file_list(url):
    """Fetches the HTML of a DWD CDC directory and finds all zip file links."""
    print(f"Fetching directory listing: {url}")
    with urllib.request.urlopen(url, timeout=30) as response:
        html = response.read().decode('utf-8')
    # Extract links like href="tageswerte_KL_00078_...zip"
    links = re.findall(r'href="([^"]+\.zip)"', html)
    return links

def download_file(url, dest_path):
    """Downloads a file to the destination path if it doesn't already exist."""
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
        return True
    
    print(f"Downloading: {url} -> {dest_path}")
    try:
        with urllib.request.urlopen(url, timeout=30) as response, open(dest_path, 'wb') as f:
            while True:
                chunk = response.read(8192)
                if not chunk:
                    break
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False

def parse_metadata_file_with_split(content):
    """Parses DWD metadata files which can contain multiple tables separated by blank lines."""
    tables = []
    current_table = []
    
    for line in content.split('\n'):
        line = line.strip()
        if not line:
            if current_table:
                tables.append(current_table)
                current_table = []
            continue
        current_table.append(line)
    if current_table:
        tables.append(current_table)
        
    parsed_tables = []
    for table in tables:
        if not table:
            continue
        # Split rows by semicolon
        rows = []
        headers = [h.strip() for h in table[0].split(';')]
        # Skip dash dividers if present (e.g. -----------)
        start_idx = 1
        if len(table) > 1 and all(c in '- ' for c in table[1]):
            start_idx = 2
            
        for line in table[start_idx:]:
            if ';' not in line:
                continue
            parts = [p.strip() for p in line.split(';')]
            # Align parts with headers
            row = {}
            for i, h in enumerate(headers):
                if i < len(parts) and h:
                    row[h] = parts[i]
            rows.append(row)
        if rows:
            parsed_tables.append((headers, rows))
            
    return parsed_tables

def parse_stations_description(file_content):
    """Parses the fixed-width or space-separated station description file."""
    lines = file_content.split('\n')
    stations = []
    
    # Locate headers
    # Stations_id von_datum bis_datum Stationshoehe geoBreite geoLaenge Stationsname Bundesland Abgabe
    for line in lines[2:]:
        if not line.strip():
            continue
        if len(line) < 100:
            continue
            
        sid = line[0:5].strip().zfill(5)
        von = line[6:14].strip()
        bis = line[15:23].strip()
        
        try:
            height = float(line[24:38].strip())
            lat = float(line[39:50].strip())
            lon = float(line[51:60].strip())
        except ValueError:
            continue
            
        name = line[61:102].strip()
        state_part = line[102:].strip()
        if state_part:
            state = state_part.split()[0]
        else:
            state = "Unknown"
            
        stations.append({
            'station_id': sid,
            'start_date': von,
            'end_date': bis,
            'elevation': height,
            'lat': lat,
            'lon': lon,
            'name': name,
            'state': state
        })
    return stations

def main():
    print("=== DWD CDC Extreme Heat Data Processing Pipeline ===")
    
    # 1. Fetch Germany GeoJSON for the web app
    geojson_path = os.path.join(DATA_DIR, 'germany_states.json')
    if not os.path.exists(geojson_path):
        print(f"Fetching Germany GeoJSON from {URL_GEOJSON}...")
        download_file(URL_GEOJSON, geojson_path)
    else:
        print("Germany GeoJSON already cached.")
        
    # 2. Download and parse station description
    desc_path = os.path.join(DATA_DIR, 'KL_Tageswerte_Beschreibung_Stationen.txt')
    print("Fetching master weather station list...")
    download_file(URL_STATION_DESC, desc_path)
    
    with open(desc_path, 'r', encoding='latin-1') as f:
        desc_content = f.read()
    
    all_stations = parse_stations_description(desc_content)
    print(f"Total DWD stations found in metadata: {len(all_stations)}")
    
    # 3. Identify candidate stations spanning 1961-01-01 to target end date
    # Candidate criteria: start date <= 19610101 and end date >= (current_year - 1)1231 (or active)
    now = datetime.now()
    current_year = now.year
    current_month_start = now.strftime('%Y%m01')
    target_end_date_str = f"{current_year - 1}1231"
    candidates = []
    for s in all_stations:
        if s['start_date'] <= '19610101' and s['end_date'] >= target_end_date_str:
            candidates.append(s)
            
    print(f"Selected candidates spanning 1961 to {current_year}: {len(candidates)}")
    
    # 4. Fetch directory listings to map station IDs to zip files
    hist_links = get_directory_file_list(URL_HIST_DIR)
    recent_links = get_directory_file_list(URL_RECENT_DIR)
    
    hist_zip_map = {}
    for link in hist_links:
        # Match tageswerte_KL_00078_19610101_20241231_hist.zip
        m = re.match(r'tageswerte_KL_(\d{5})_.*_hist\.zip', link)
        if m:
            hist_zip_map[m.group(1)] = link
            
    recent_zip_map = {}
    for link in recent_links:
        # Match tageswerte_KL_00078_akt.zip
        m = re.match(r'tageswerte_KL_(\d{5})_akt\.zip', link)
        if m:
            recent_zip_map[m.group(1)] = link
            
    print(f"Historical zips mapped: {len(hist_zip_map)}")
    print(f"Recent active zips mapped: {len(recent_zip_map)}")
    
    # Process each candidate
    processed_stations = []
    
    # Let's count days in our target span: 1961-01-01 to end of the current year
    start_span = '1961-01-01'
    end_span = f"{current_year}-12-31"
    
    # We calculate the coverage denominator up to yesterday to avoid penalizing active stations for future days of the ongoing year
    from datetime import timedelta
    yesterday = datetime.now() - timedelta(days=1)
    elapsed_end = yesterday.strftime('%Y-%m-%d')
    
    elapsed_dates = pd.date_range(start=start_span, end=elapsed_end)
    total_elapsed_days = len(elapsed_dates)
    
    print(f"Target analysis span: {start_span} to {end_span}")
    print(f"Coverage comparison period: {start_span} to {elapsed_end} ({total_elapsed_days} days)")
    
    for idx, s in enumerate(candidates):
        sid = s['station_id']
        print(f"[{idx+1}/{len(candidates)}] Processing station {sid}: {s['name']} ({s['state']})...")
        
        hist_zip_name = hist_zip_map.get(sid)
        recent_zip_name = recent_zip_map.get(sid)
        
        if not hist_zip_name:
            print(f"  Warning: No historical zip file found for station {sid}. Skipping.")
            continue
            
        # Download files
        hist_zip_path = os.path.join(ZIP_DIR, hist_zip_name)
        download_file(f"{URL_HIST_DIR}{hist_zip_name}", hist_zip_path)
        
        recent_zip_path = None
        if recent_zip_name:
            recent_zip_path = os.path.join(ZIP_DIR, recent_zip_name)
            download_file(f"{URL_RECENT_DIR}{recent_zip_name}", recent_zip_path)
            
        # 5. Extract and combine temperature data
        daily_records = []
        
        def read_daily_data_from_zip(zip_path):
            records = []
            if not os.path.exists(zip_path):
                return records
            with zipfile.ZipFile(zip_path) as z:
                data_files = [f for f in z.namelist() if f.startswith('produkt_')]
                if data_files:
                    with z.open(data_files[0]) as f:
                        content = f.read().decode('latin-1')
                        lines = [l.strip() for l in content.split('\n') if l.strip()]
                        if not lines:
                            return records
                        # Parse headers
                        headers = [h.strip() for h in lines[0].split(';')]
                        try:
                            datum_idx = headers.index('MESS_DATUM')
                            txk_idx = headers.index('TXK')
                            tnk_idx = headers.index('TNK')
                        except ValueError:
                            print(f"    Missing MESS_DATUM, TXK or TNK headers in {zip_path}")
                            return records
                            
                        for line in lines[1:]:
                            parts = [p.strip() for p in line.split(';')]
                            if len(parts) <= max(datum_idx, txk_idx, tnk_idx):
                                continue
                            date_str = parts[datum_idx]
                            txk_val = parts[txk_idx]
                            tnk_val = parts[tnk_idx]
                            try:
                                max_temp = float(txk_val)
                            except ValueError:
                                max_temp = None
                            try:
                                min_temp = float(tnk_val)
                            except ValueError:
                                min_temp = None

                            # -999.0 is the missing indicator
                            if max_temp == -999.0:
                                max_temp = None
                            if min_temp == -999.0:
                                min_temp = None
                            if max_temp is not None or min_temp is not None:
                                records.append((date_str, max_temp, min_temp))
            return records
            
        # Read from historical and recent
        hist_records = read_daily_data_from_zip(hist_zip_path)
        recent_records = []
        if recent_zip_path:
            recent_records = read_daily_data_from_zip(recent_zip_path)
            
        # Combine and deduplicate by date
        combined_dict = {}
        for date_str, max_temp, min_temp in hist_records:
            combined_dict[date_str] = (max_temp, min_temp)
        for date_str, max_temp, min_temp in recent_records:
            combined_dict[date_str] = (max_temp, min_temp)
            
        if not combined_dict:
            print(f"  Warning: No valid records found for station {sid}. Skipping.")
            continue
            
        # Convert to Pandas for convenient analysis
        df = pd.DataFrame([
            {'MESS_DATUM': date_str, 'TXK': temps[0], 'TNK': temps[1]}
            for date_str, temps in combined_dict.items()
        ])
        df['DATE'] = pd.to_datetime(df['MESS_DATUM'], format='%Y%m%d', errors='coerce')
        df = df.dropna(subset=['DATE'])
        df = df.sort_values('DATE').drop_duplicates(subset=['MESS_DATUM'])
        
        # Filter for the target span 1961-01-01 to end of year
        mask = (df['DATE'] >= start_span) & (df['DATE'] <= end_span)
        df_span = df.loc[mask].copy()
        
        valid_days = int(df_span['TXK'].notna().sum())
        valid_night_days = int(df_span['TNK'].notna().sum())
        
        # Calculate coverage using elapsed days only (so we don't penalize current year's missing future days)
        mask_elapsed = (df['DATE'] >= start_span) & (df['DATE'] <= elapsed_end)
        valid_elapsed_days = int(df[mask_elapsed]['TXK'].notna().sum())
        overall_coverage = valid_elapsed_days / total_elapsed_days
        
        print(f"  Coverage in 1961-{current_year}: {valid_elapsed_days}/{total_elapsed_days} ({overall_coverage * 100:.2f}%)")
        
        # We will keep the station if it has at least 50% coverage, allowing client-side filtering
        if overall_coverage < 0.50:
            print(f"  Station {sid} coverage ({overall_coverage * 100:.1f}%) is below 50%. Excluding.")
            continue
            
        # 6. Parse metadata files from historical zip
        metadata = {
            'geography': [],
            'names': [],
            'owners': [],
            'devices': []
        }
        
        with zipfile.ZipFile(hist_zip_path) as z:
            # Parse geography history
            geo_files = [f for f in z.namelist() if f.startswith('Metadaten_Geographie_')]
            if geo_files:
                content = z.read(geo_files[0]).decode('latin-1')
                tables = parse_metadata_file_with_split(content)
                if tables and tables[0][1]:
                    for row in tables[0][1]:
                        # Keys: Stations_id;Stationshoehe;Geogr.Breite;Geogr.Laenge;von_datum;bis_datum;Stationsname
                        metadata['geography'].append({
                            'elevation': float(row.get('Stationshoehe', 0)),
                            'lat': float(row.get('Geogr.Breite', 0)),
                            'lon': float(row.get('Geogr.Laenge', 0)),
                            'start': row.get('von_datum', ''),
                            'end': row.get('bis_datum', '').strip()
                        })
                        
            # Parse names & owners history
            name_files = [f for f in z.namelist() if f.startswith('Metadaten_Stationsname_Betreibername_')]
            if name_files:
                content = z.read(name_files[0]).decode('latin-1')
                tables = parse_metadata_file_with_split(content)
                for headers, rows in tables:
                    if 'Stationsname' in headers:
                        for row in rows:
                            metadata['names'].append({
                                'name': row.get('Stationsname', ''),
                                'start': row.get('Von_Datum', ''),
                                'end': row.get('Bis_Datum', '').strip()
                            })
                    elif 'Betreibername' in headers:
                        for row in rows:
                            metadata['owners'].append({
                                'owner': row.get('Betreibername', ''),
                                'start': row.get('Von_Datum', ''),
                                'end': row.get('Bis_Datum', '').strip()
                            })
                            
            # Parse device maximum thermometer history
            device_files = [f for f in z.namelist() if f.startswith('Metadaten_Geraete_Lufttemperatur_Maximum_')]
            if device_files:
                content = z.read(device_files[0]).decode('latin-1')
                tables = parse_metadata_file_with_split(content)
                if tables and tables[0][1]:
                    for row in tables[0][1]:
                        # Keys: Stations_ID;Stationsname;Geo. Laenge [Grad];Geo. Breite [Grad];Stationshoehe [m];Geberhoehe ueber Grund [m];Von_Datum;Bis_Datum;Geraetetyp Name;Messverfahren;eor;
                        metadata['devices'].append({
                            'sensor_height': row.get('Geberhoehe ueber Grund [m]', ''),
                            'device': row.get('Geraetetyp Name', ''),
                            'method': row.get('Messverfahren', ''),
                            'start': row.get('Von_Datum', ''),
                            'end': row.get('Bis_Datum', '').strip()
                        })
                        
        # 7. Identify station moves
        # A station moved if its coordinate changes (lat or lon differs across entries)
        has_moved = False
        moves_path = []
        total_move_distance = 0.0
        
        # Deduplicate geography changes by coordinates
        distinct_coords = []
        for entry in metadata['geography']:
            lat, lon, elev = entry['lat'], entry['lon'], entry['elevation']
            if not distinct_coords or distinct_coords[-1]['lat'] != lat or distinct_coords[-1]['lon'] != lon:
                distinct_coords.append(entry)
                
        if len(distinct_coords) > 1:
            has_moved = True
            # Compute move distances
            for i in range(1, len(distinct_coords)):
                d = haversine(
                    distinct_coords[i-1]['lat'], distinct_coords[i-1]['lon'],
                    distinct_coords[i]['lat'], distinct_coords[i]['lon']
                )
                total_move_distance += d
                
        # 8. Annual aggregation of warm days
        df_span['YEAR'] = df_span['DATE'].dt.year
        df_span['MONTH'] = df_span['DATE'].dt.month
        annual_stats = {}
        
        for yr, group in df_span.groupby('YEAR'):
            valid_yr_days = int(group['TXK'].notna().sum())
            valid_yr_nights = int(group['TNK'].notna().sum())
            
            stats = {
                'valid_days': valid_yr_days,
                'valid_days_max': valid_yr_days,
                'valid_days_min': valid_yr_nights
            }
            for temp_t in range(30, 41):
                stats[f't{temp_t}'] = int((group['TXK'] >= float(temp_t)).sum())
            for temp_t in range(18, 29):
                stats[f'n{temp_t}'] = int((group['TNK'] >= float(temp_t)).sum())
                
            # Aggregate monthly stats
            m_valid = [0] * 12
            m_valid_min = [0] * 12
            m_data = {}
            
            for mnth, m_group in group.groupby('MONTH'):
                idx = int(mnth) - 1
                if 0 <= idx < 12:
                    m_valid[idx] = int(m_group['TXK'].notna().sum())
                    m_valid_min[idx] = int(m_group['TNK'].notna().sum())
                    m_stats = {}
                    for temp_t in range(30, 41):
                        count = int((m_group['TXK'] >= float(temp_t)).sum())
                        if count > 0:
                            m_stats[f't{temp_t}'] = count
                    for temp_t in range(18, 29):
                        count = int((m_group['TNK'] >= float(temp_t)).sum())
                        if count > 0:
                            m_stats[f'n{temp_t}'] = count
                    if m_stats:
                        m_data[str(mnth)] = m_stats
            
            stats['m_valid'] = m_valid
            stats['m_valid_max'] = m_valid
            stats['m_valid_min'] = m_valid_min
            stats['m_data'] = m_data
                
            annual_stats[str(yr)] = stats
            
        processed_stations.append({
            'station_id': sid,
            'name': s['name'],
            'state': s['state'],
            'start_date': s['start_date'],
            'end_date': s['end_date'],
            'active': (s['end_date'] >= current_month_start),
            'overall_coverage': round(overall_coverage, 4),
            'valid_span_days': valid_days,
            'valid_span_nights': valid_night_days,
            'current_location': {
                'lat': s['lat'],
                'lon': s['lon'],
                'elevation': s['elevation']
            },
            'has_moved': has_moved,
            'move_count': len(distinct_coords) - 1 if has_moved else 0,
            'total_move_distance_meters': round(total_move_distance, 1),
            'metadata': metadata,
            'annual_data': annual_stats
        })
        
    # Write processed data out
    output_path = os.path.join(DATA_DIR, 'weather_data.json')
    print(f"Writing aggregated results to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(processed_stations, f, indent=2, ensure_ascii=False)
        
    print(f"Pipeline complete! Successfully processed {len(processed_stations)} weather stations.")

if __name__ == '__main__':
    main()
