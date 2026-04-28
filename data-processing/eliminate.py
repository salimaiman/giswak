import json

# Load your JSON file
with open("koordinat.json", "r") as f:
    data = json.load(f)

# Define NTT boundary box
min_lon, max_lon = 118.9, 125.5
min_lat, max_lat = -11.0, -7.5

cleaned = []
removed = []

for item in data:
    try:
        lat_str, lon_str = item["coordinate"].split(",")
        lat, lon = float(lat_str), float(lon_str)

        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            cleaned.append(item)
        else:
            removed.append(item)
    except Exception:
        removed.append(item)

print(f"✅ Kept {len(cleaned)} points, removed {len(removed)} points (outside NTT).")

with open("koordinat_cleaned.json", "w") as f:
    json.dump(cleaned, f, indent=2)
