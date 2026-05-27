import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'weather_data.json')

def main():
    print("=== DWD CDC Extreme Heat Data Verification ===")
    
    if not os.path.exists(DATA_FILE):
        print(f"Error: {DATA_FILE} not found. Please run the processing pipeline first.")
        return
        
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        stations = json.load(f)
        
    print(f"Loaded {len(stations)} processed stations.")
    
    # Spiegel parameters: Threshold >= 35C, Coverage >= 80% (0.80)
    temp_threshold = 35
    coverage_threshold = 0.80
    
    # Filter stations
    selected_stations = [s for s in stations if s['overall_coverage'] >= coverage_threshold]
    print(f"Number of stations with >= {coverage_threshold*100}% coverage: {len(selected_stations)}")
    
    # Decadal totals
    decades = {
        '1961-1970': (1961, 1970, 122),
        '1971-1980': (1971, 1980, 158),
        '1981-1990': (1981, 1990, 328),
        '1991-2000': (1991, 2000, 672),
        '2001-2010': (2001, 2010, 1321),
        '2011-2020': (2011, 2020, 2488)
    }
    
    print("\nDecadal Aggregates at >= 35°C:")
    print(f"{'Decade':<12} | {'Spiegel Target':<14} | {'Our Count':<10} | {'Status':<8}")
    print("-" * 52)
    
    success = True
    for dec_name, (start, end, target) in decades.items():
        total = 0
        for s in selected_stations:
            for yr_str, data in s['annual_data'].items():
                yr = int(yr_str)
                if start <= yr <= end:
                    total += data.get(f't{temp_threshold}', 0)
                    
        match = (total == target)
        status = "MATCH" if match else "MISMATCH"
        if not match:
            success = False
            
        print(f"{dec_name:<12} | {target:<14} | {total:<10} | {status:<8}")
        
    if success:
        print("\n🎉 SUCCESS: All decadal totals MATCH the Spiegel visualization perfectly!")
    else:
        print("\n⚠️ WARNING: Some decadal totals do not match exactly. This might be due to minor stations additions or differences in date filtering.")

if __name__ == '__main__':
    main()
