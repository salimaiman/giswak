# Repository Guidelines

## Project Structure & Module Organization
This repository is a static GIS web app for wakaf land data in Nusa Tenggara Timur. The project is organized into three main directories:
- `src/`: Contains the frontend source code (`index.html`, `main.js`, `style.css`).
- `public/`: Contains static assets and processed data (`data_tanah_cleaned.json`, `rekap_kab.json`, `ntt.geojson`, `logo.png`).
- `data-processing/`: Contains Jupyter notebooks (`data_check.ipynb`, `cleaning_geojson.ipynb`), python scripts (`eliminate.py`), and raw data files.
The `giswak/` directory is an automatically generated deployment package for integration into larger PHP websites. Do not modify it manually.

## Build, Test, and Development Commands
There is no package-based build step.

- `./deploy.sh` — build the `giswak/` deployment directory from `src/` and `public/`.
- `cd src && python3 -m http.server 8000` — serve the app locally (note: you may need to copy files from `public/` or serve from the root and adjust URLs if testing locally without deploying, or simply test using the generated `giswak/` folder via `cd giswak && php -S localhost:8000`).
- `cd data-processing && python3 eliminate.py` — filter `koordinat.json` against the NTT bounding box.

Run commands from the repository root unless a script requires otherwise.

## Coding Style & Naming Conventions
Use 4 spaces for JavaScript and Python indentation. Prefer `const` and `let`, short functions, and early returns in `main.js`. Match the existing naming style: `camelCase` for JavaScript locals and functions, `snake_case` for data files and JSON fields such as `nama_wakif` or `status_sertifikat`. Keep CSS selectors simple and colocated with the relevant UI feature. Preserve Indonesian field names in datasets unless the full data pipeline is updated.

## Testing Guidelines
No automated test suite is checked in today. Validate changes manually in a local server: confirm the map loads, kabupaten hover states render, category filters update markers, and the modal opens with correct data. After editing datasets, spot-check JSON syntax and verify coordinate parsing still works in the browser console.

## Commit & Pull Request Guidelines
This branch currently has no usable commit history, so no repository-specific convention can be inferred yet. Use short imperative commit messages such as `feat: add category filter reset` or `fix: handle missing coordinate values`. Pull requests should include a concise summary, affected data files, manual test notes, and screenshots or screen recordings for UI changes.

## Data & Deployment Notes
Large GeoJSON and JSON assets are stored in `public/`. If you modify source code in `src/` or data in `public/`, run `./deploy.sh` to automatically generate the `giswak/` deployment package with `index.php`. Do not manually sync files to the `giswak/` directory, and do not track it in version control (it is in `.gitignore`).
