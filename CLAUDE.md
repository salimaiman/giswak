# CLAUDE.md — GISWAK Agent Context & Change Recommendations

## Project Overview

GISWAK (Geographic Information System for Wakaf) is a static, client-side web application that visualizes Islamic endowment (wakaf) land data across 22 kabupaten/kota in Nusa Tenggara Timur (NTT), Indonesia. It uses MapLibre GL JS for vector tiles, Turf.js for spatial operations, and Tailwind CSS (CDN) for styling.

**Current scale:** 104 land records across 14 kabupaten with data, 6 categories, displayed on a full-screen interactive map with category filtering, kabupaten hover tooltips, and a detail modal.

---

## Architecture Summary

```
giswak/
├── src/                    # Frontend source (index.html, main.js, style.css)
├── public/                 # Static data assets (JSON, GeoJSON, images)
├── data-processing/        # Python cleaning scripts & notebooks
├── geojson/                # Raw reference GeoJSON files (not deployed)
├── deploy.sh               # Copies src/ + public/ → giswak/ (renames .html → .php)
└── giswak/                 # Generated deployment package (gitignored)
```

### Key Files
| File | Size | Purpose |
|---|---|---|
| `src/main.js` | 270 lines | All map logic, markers, filters, modal |
| `src/index.html` | 117 lines | Single-page layout with Tailwind classes |
| `src/style.css` | 101 lines | Custom marker, tooltip, and animation styles |
| `public/data_tanah_cleaned.json` | 58 KB | 104 land plot records |
| `public/rekap_kab.json` | 3 KB | Kabupaten-level summary stats |
| `public/ntt.geojson` | 497 KB | Administrative boundary polygons (22 kabupaten) |

---

## Data Quality Assessment

### Current State
- **104 records**, all with valid coordinates (no missing)
- **0 duplicate coordinates** — clean spatial data
- **6 categories:** Masjid (74), Mushalla (12), Makam (10), Sekolah (5), Kemaslahatan Umat (2), Ruang Terbuka Hijau (1)
- **Certification:** 38 certified (SUDAH), 66 uncertified (BELUM)

### Data Gaps
| Field | Missing/Empty | % Missing |
|---|---|---|
| `no_aiw` | 61 | 59% |
| `tgl_aiw` | 57 | 55% |
| `tgl_sertifikat` | 46 | 44% |
| `no_sertifikat` | 45 | 43% |
| `nama_wakif` | 40 | 38% |
| `nama_nadzir` | 35 | 34% |
| `luas` | 5 | 5% |
| `alamat_lengkap` | 2 | 2% |

### Kabupaten Coverage Gap
- **GeoJSON has 22 kabupaten** (full NTT coverage)
- **Data exists for only 14 kabupaten** — 8 kabupaten have polygons on the map but zero wakaf data:
  `Belu, Lembata, Manggarai, Rote Ndao, Sumba Barat Daya, Sumba Tengah, Timor Tengah Selatan, Timor Tengah Utara`

---

## Change Recommendations

### 🔴 Priority 1 — Critical / High Impact

#### 1.1 Pin CDN versions to prevent breaking changes
**Problem:** All three CDN dependencies (`maplibre-gl`, `@turf/turf`, `tailwindcss`) use unversioned or `latest` URLs. A breaking upstream release could silently break production.
```html
<!-- CURRENT (dangerous) -->
<script src="https://unpkg.com/maplibre-gl/dist/maplibre-gl.js"></script>
<script src="https://cdn.tailwindcss.com"></script>

<!-- RECOMMENDED -->
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js"></script>
```
**For Tailwind:** Consider replacing the CDN play script with a local build step, or at minimum pin a version: `https://cdn.tailwindcss.com?v=3.4.17`. The CDN play mode is explicitly not recommended for production.

#### 1.2 Add error handling for data fetches
**Problem:** `loadRekapKab()` and `loadKoordinat()` have zero error handling. A 404 or network failure silently leaves arrays empty — the map loads but with no markers and no user feedback.
```javascript
// RECOMMENDED: wrap fetches with try/catch and user feedback
async function loadKoordinat() {
    try {
        const response = await fetch("data_tanah_cleaned.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        koordinat = await response.json();
    } catch (err) {
        console.error('Failed to load land data:', err);
        // Show user-facing error banner
    }
}
```

#### 1.3 Add `<meta>` SEO and accessibility tags
**Problem:** Missing `<meta name="description">`, `lang="id"` (currently `en`), OpenGraph tags, and favicon.
```html
<html lang="id">
<head>
  <meta name="description" content="Sistem Informasi Geografis Tanah Wakaf Provinsi Nusa Tenggara Timur - Kementerian Agama RI">
  <meta name="theme-color" content="#047857">
  <link rel="icon" href="logo.png" type="image/png">
```

---

### 🟡 Priority 2 — UX & Functionality Improvements

#### 2.1 Add a loading state / spinner
**Problem:** On slow connections, the page shows a blank map while 3 data fetches complete sequentially. No loading indicator exists.
**Recommendation:** Add a full-screen loading overlay that dismisses after `map.on('load')` + data ready.

#### 2.2 Show province-wide statistics dashboard
**Problem:** Key summary stats (total bidang, total luas, certification rate) are only visible by hovering individual kabupaten. There's no province-wide overview.
**Recommendation:** Add a compact stats bar or card showing:
- Total tanah wakaf: 104 bidang
- Total luas: ~126,274 m²
- Sertifikasi rate: 36.5%
- Kabupaten covered: 14/22

#### 2.3 Add "Kemaslahatan Umat" to the color map
**Problem:** `categoryColors` in `main.js` defines 5 colors, but there are 6 categories. "Kemaslahatan Umat" falls through to the `Default` violet color. This is intentional but undocumented — should be explicitly defined.
```javascript
const categoryColors = {
    'Masjid': '#10b981',
    'Makam': '#6b7280',
    'Mushalla': '#34d399',
    'Sekolah': '#3b82f6',
    'Ruang Terbuka Hijau': '#22c55e',
    'Kemaslahatan Umat': '#f59e0b',  // Add explicit color
    'Default': '#8b5cf6'
};
```

#### 2.4 Add "Select All / Deselect All" toggle for category filters
**Problem:** With 6 categories, users must click each checkbox individually to isolate one category. No batch toggle exists.

#### 2.5 Improve modal data display for missing values
**Problem:** When `nama_wakif`, `nama_nadzir`, or other fields are "-" or empty, the modal shows a raw dash. These should show styled "Data belum tersedia" placeholders to distinguish "no data" from literal dashes.

#### 2.6 Add marker clustering for zoom-out views
**Problem:** At low zoom levels, markers in dense areas (Ende: 26, Flores Timur: 23) overlap and become unreadable. MapLibre supports clustering natively via GeoJSON sources.
**Recommendation:** Convert the DOM marker approach to a GeoJSON source with clustering enabled, which also improves performance.

#### 2.7 Make the filter sidebar collapsible on mobile
**Problem:** The sidebar is `fixed` at `top-24 left-6 w-64` — it covers a significant portion of the map on mobile screens. It has `hidden md:block` only on the header badge, not on the sidebar itself.

---

### 🟢 Priority 3 — Code Quality & Maintainability

#### 3.1 Remove unused `ntt_.geojson` from public/
**Problem:** `public/ntt_.geojson` (1.7 MB) is never referenced in code. It's the un-simplified version, nearly 4× larger. It's dead weight in every deployment.

#### 3.2 Remove `geojson/` directory from the repository
**Problem:** `geojson/` contains ~177 MB of raw reference GeoJSON files that are never used by the application. The `geoBoundaries-IDN-ADM2.geojson` alone is 152 MB. These should be gitignored or moved to a separate data archive.

#### 3.3 Clean up `public/koordinat.json`
**Problem:** `public/koordinat.json` (10 KB) appears to be the pre-cleaned version of the data. Only `data_tanah_cleaned.json` is used. Remove or gitignore it.

#### 3.4 Extract inline HTML from JavaScript
**Problem:** `main.js` generates modal content and tooltip HTML via template literals with inline Tailwind classes (lines 39-42, 117-122, 231-237). This makes styling changes error-prone.
**Recommendation:** Use `<template>` elements in `index.html` or at minimum extract the HTML builders into named functions.

#### 3.5 Add JSDoc comments to key functions
**Problem:** Functions like `createMarkerElement()`, `initMarkers()`, `filterMarkers()` have no documentation. Parameter types and return values are implicit.

#### 3.6 Consider converting coordinate format
**Problem:** Coordinates are stored as comma-separated strings (`"-8.365, 123.137"`) and parsed with `split(',')` at runtime. Converting to `{ lat, lon }` objects in the data pipeline would simplify `main.js` and eliminate runtime parsing errors.

---

### 🔵 Priority 4 — Future Enhancements

#### 4.1 Add search functionality
Allow users to search by nama_wakif, pemanfaatan_saat_ini, or kabupaten name to locate specific plots.

#### 4.2 Add export/download capability
Allow users to download filtered data as CSV or print a summary report for a selected kabupaten.

#### 4.3 Add URL state management
Encode the active filters and map position in the URL hash so views can be shared/bookmarked.

#### 4.4 Implement a proper build pipeline
Replace the `deploy.sh` copy script with a lightweight build tool (e.g., Vite) to gain:
- CSS purging (Tailwind CDN → local build with tree-shaking)
- JS minification
- Asset hashing for cache busting (replace `?v=2.0` manual versioning)
- Source maps for debugging

#### 4.5 Add PWA offline support
For field workers in NTT (which has limited connectivity), a service worker + cache manifest would allow offline map browsing of previously loaded tiles and data.

---

## Development Commands

```bash
# Serve locally (from deployment package)
./deploy.sh && cd giswak && php -S localhost:8000

# Serve src/ directly (limited — data files won't resolve)
cd src && python3 -m http.server 8000

# Validate data coordinates against NTT bounds
cd data-processing && python3 eliminate.py

# Quick data check
cat public/data_tanah_cleaned.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d), 'records')"
```

## Conventions for Claude

- **Indentation:** 4 spaces for JS and Python
- **JS style:** `const`/`let`, camelCase, short functions, early returns
- **Data fields:** snake_case, Indonesian names (e.g., `nama_wakif`, `status_sertifikat`)
- **CSS:** Tailwind utility classes for layout, custom CSS in `style.css` for animations and markers
- **Deployment:** Always run `./deploy.sh` after modifying `src/` or `public/`
- **Do not:** Manually edit `giswak/`, commit the `giswak/` directory, or modify raw data files without updating the pipeline
