const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: [123.6070, -10.1779],
    zoom: 6.5
});

const label = document.getElementById('label');
let koordinat = [];

let rekapKab = [];

async function loadRekapKab() {
    const response = await fetch('rekap_kab.json');
    rekapKab = await response.json();
}

let selectedCategories = new Set();

function renderCategoryFilters(categories) {
    const container = document.getElementById('categoryFilters');
    container.innerHTML = '';
    categories.forEach(cat => {
        const id = `cat_${cat.replace(/\s+/g, '_')}`;
        container.innerHTML += `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${cat}" id="${id}" checked>
                <label class="form-check-label" for="${id}">${cat}</label>
            </div>
        `;
        selectedCategories.add(cat);
    });

    // Add event listeners
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function () {
            if (this.checked) {
                selectedCategories.add(this.value);
            } else {
                selectedCategories.delete(this.value);
            }
            map.fire('mousemove', { features: [hoveredKabupatenPolygon] }); // Refresh markers
        });
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    await loadRekapKab();

    map.on('load', async () => {
        const response = await fetch('ntt.geojson');
        const data = await response.json();

        const categories = [...new Set(koordinat.map(p => p.kategori).filter(Boolean))];
        renderCategoryFilters(categories);

        const coordResp = await fetch("data_tanah_cleaned.json");
        koordinat = await coordResp.json();

        const palette = [
            '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0',
            '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#918717',
            '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#b59c59', '#000000'
        ];

        const colors = {};
        data.features.forEach((f, i) => {
            const name = f.properties.NAME_2;
            colors[name] = palette[i % palette.length]; // Assign color by index, wrap if needed
        });

        map.addSource('ntt', { type: 'geojson', data });

        map.addLayer({
            id: 'ntt-fill',
            type: 'fill',
            source: 'ntt',
            paint: {
                'fill-color': [
                    'match',
                    ['get', 'NAME_2'],
                    ...Object.entries(colors).flat(),
                    '#ccc'
                ],
                'fill-opacity': 0.5
            }
        });

        map.addLayer({
            id: 'ntt-outline',
            type: 'line',
            source: 'ntt',
            paint: {
                'line-color': '#e8e8e8',
                'line-width': 1.2
            }
        });

        // ...existing code...

        let activeMarkers = [];
        let hoveredKabupatenPolygon = null;

        map.on('mousemove', 'ntt-fill', (e) => {
            if (!e.features.length) return;

            const feature = e.features[0];
            const kabupaten = feature.properties.NAME_2;
            hoveredKabupatenPolygon = feature; // Save the hovered polygon

            // Find matching data from rekapKab
            const data = rekapKab.find(item => item.KABUPATEN && item.KABUPATEN.toLowerCase() === kabupaten.toLowerCase());
            const jumlah = data ? data["JUMLAH BIDANG"] : "-";
            const luas = data ? data["TOTAL LUAS (M2)"] : "-";
            // Format numbers with thousands separator
            function formatNumber(num) {
                if (typeof num === "number") return num.toLocaleString('id-ID');
                if (!isNaN(num) && num !== "-") return Number(num).toLocaleString('id-ID');
                return num;
            }
            const jumlahFormatted = formatNumber(jumlah);
            const luasFormatted = formatNumber(luas);
            // Update label content
            label.innerHTML = `
            <b>${kabupaten}</b><br>
            <span>Jumlah Tanah Wakaf: ${jumlahFormatted}</span><br>
            <span>Total Luas: ${luasFormatted} m²</span>
            `;

            map.setPaintProperty('ntt-fill', 'fill-opacity',
                ['case', ['==', ['get', 'NAME_2'], kabupaten], 0.6, 0.5]);
            map.setPaintProperty('ntt-outline', 'line-width',
                ['case', ['==', ['get', 'NAME_2'], kabupaten], 1, 1]);

            // Update floating label position
            const coordinates = e.lngLat;
            const pixel = map.project(coordinates);
            label.style.left = `${pixel.x}px`;
            label.style.top = `${pixel.y}px`;
            label.style.display = 'block';

            // Remove previous markers
            activeMarkers.forEach(marker => marker.remove());
            activeMarkers = [];

            // Show markers only for the hovered kabupaten
            koordinat.forEach(p => {
                if (!p.coordinate || (p.kabupaten).toLowerCase() !== kabupaten.toLowerCase()) return;
                const [latStr, lonStr] = p.coordinate.split(',').map(s => s.trim());
                const lat = parseFloat(latStr);
                const lon = parseFloat(lonStr);
                if (isNaN(lat) || isNaN(lon)) return;

                const marker = new maplibregl.Marker({ color: '#e74c3c' })
                    .setLngLat([lon, lat])
                    .addTo(map);

                const markerEl = marker.getElement();
                markerEl.classList.add('smooth-marker');
                setTimeout(() => markerEl.classList.add('visible'), 10);

                markerEl.addEventListener('click', () => {
                    openModal(p.pemanfaatan_saat_ini || 'Tanah Wakaf', p.description || 'Belum ada deskripsi.');
                });

                console.log(markerEl)

                activeMarkers.push(marker);
            });
        });

        // Track mouse position globally on the map
        map.on('mousemove', (e) => {
            if (!hoveredKabupatenPolygon) return;
            const pt = turf.point([e.lngLat.lng, e.lngLat.lat]);
            const poly = hoveredKabupatenPolygon;

            // If mouse is NOT inside the polygon, remove markers and label
            if (!turf.booleanPointInPolygon(pt, poly)) {
                label.style.display = 'none';
                activeMarkers.forEach(marker => marker.remove());
                activeMarkers = [];
                hoveredKabupatenPolygon = null;
            }
        });

        map.on('mouseleave', 'ntt-fill', () => {
            label.style.display = 'none';
        });

        // ...existing code...
    });

    function openModal(title, desc) {
        document.getElementById('modalTitle').innerText = title;
        document.getElementById('modalDesc').innerText = desc;
        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();
    }

    window.onclick = (event) => {
        const modal = document.getElementById('infoModal');
        if (event.target === modal) closeModal();
    };
});
