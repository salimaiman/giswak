# GISWAK | Geographic Information System for Wakaf

## Project Overview
GISWAK is a web-based Geographic Information System designed to visualize and manage **Wakaf** (Islamic endowment) land data in the East Nusa Tenggara (NTT) province, Indonesia. The application provides an interactive map interface to explore land distribution, view regency-level summaries, and access detailed information about specific land plots.

## Core Technologies
- **Frontend:** HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+)
- **Mapping:** [MapLibre GL JS](https://maplibre.org/) for vector map rendering.
- **Spatial Analysis:** [Turf.js](https://turfjs.org/) for client-side geospatial operations (e.g., point-in-polygon detection).
- **Data Formats:** GeoJSON for boundaries, JSON for land plot coordinates and attributes.
- **Data Processing:** Python (Jupyter Notebooks) for cleaning and validating land data.

## Key Components & File Structure
- `src/`: Contains frontend code.
    - `index.html`: The main entry point featuring the map container, filter sidebar, and info modals.
    - `main.js`: Core logic for MapLibre, Turf.js interactions, marker rendering, and hover effects.
    - `style.css`: Custom styles, Tailwind base imports, and animations.
- `public/`: Contains static assets.
    - `ntt.geojson`: Administrative boundary data.
    - `rekap_kab.json`: Summary data by regency.
    - `data_tanah_cleaned.json`: The primary dataset containing plot coordinates and attributes.
- `data-processing/`: Contains Jupyter Notebooks and Python scripts (`eliminate.py`) for data cleaning.
- `deploy.sh`: Bash script to automatically generate the `giswak/` PHP-ready deployment package.
- `giswak/`: A generated sub-directory containing a PHP-compatible version of the application. Do not modify manually.

## Running the Project
Since this is a client-side application that fetches local JSON/GeoJSON files, it must be served over HTTP to avoid CORS issues.

### Local Development
To serve the app during development, navigate to the `src/` directory (you may need to ensure `public/` assets are reachable, or generate the deployment package and serve that instead).
```bash
# Generate the deployment package
./deploy.sh
# Serve the deployment package
cd giswak
php -S localhost:8000
```
Then open `http://localhost:8000` in your browser.

## Data Processing Workflow
1.  **Cleaning:** Raw data is processed using `cleaning_geojson.ipynb` and `data_check.ipynb`.
2.  **Validation:** `eliminate.py` is used to ensure all coordinates fall within the geographic bounds of NTT:
    - Longitude: 118.9 to 125.5
    - Latitude: -11.0 to -7.5
3.  **Deployment:** The cleaned JSON files are placed in the `public/` directory for use by the application.

## Development Conventions
- **Map Interaction:** Markers are rendered once on load, and their visibility is toggled via CSS classes when filtering categories. Hovering over a regency highlights the polygon and displays statistics without destroying/re-creating markers.
- **Styling:** Uses Tailwind CSS for responsive design and glassmorphic elements, with Poppins font for modern typography.
- **Data Integrity:** Always use the `_cleaned` versions of data files for the production view.
