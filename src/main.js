const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: [123.6070, -10.1779],
    zoom: 6.5
});

map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

let koordinat = [];
let rekapKab = [];
let selectedCategories = new Set();
let markers = [];

const categoryColors = {
    'Masjid': '#10b981', // Emerald
    'Makam': '#6b7280',  // Gray
    'Mushalla': '#34d399', // Emerald-light
    'Sekolah': '#3b82f6',  // Blue
    'Ruang Terbuka Hijau': '#22c55e', // Green
    'Kemaslahatan Umat': '#f59e0b', // Amber
    'Default': '#8b5cf6' // Violet
};

async function loadRekapKab() {
    try {
        const response = await fetch('rekap_kab.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        rekapKab = await response.json();
    } catch (err) {
        console.error('Failed to load rekap data:', err);
    }
}

async function loadKoordinat() {
    try {
        const response = await fetch("data_tanah_cleaned.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        koordinat = await response.json();
    } catch (err) {
        console.error('Failed to load land data:', err);
    }
}

function createMarkerElement(tanah, labelEl) {
    const color = categoryColors[tanah.kategori] || categoryColors['Default'];
    const el = document.createElement('div');
    el.className = 'custom-marker w-6 h-6';
    
    el.innerHTML = `
        <div class="pulse-ring" style="background-color: ${color}"></div>
        <div class="marker-dot" style="background-color: ${color}"></div>
    `;

    el.addEventListener('click', (e) => {
        console.log('Marker clicked:', tanah.pemanfaatan_saat_ini);
        e.stopPropagation(); // Prevent map click events
        openModal(tanah);
    });
    
    // Update tooltip on hover
    el.addEventListener('mouseenter', (e) => {
        if (labelEl) {
            labelEl.innerHTML = `<b>${tanah.pemanfaatan_saat_ini}</b><br><span class="text-xs opacity-75">${tanah.alamat_lengkap}</span>`;
            labelEl.style.left = `${e.clientX}px`;
            labelEl.style.top = `${e.clientY}px`;
            labelEl.style.display = 'block';
        }
    });
    el.addEventListener('mousemove', (e) => {
        if (labelEl) {
            labelEl.style.left = `${e.clientX}px`;
            labelEl.style.top = `${e.clientY}px`;
        }
    });
    el.addEventListener('mouseleave', () => {
        if (labelEl) labelEl.style.display = 'none';
    });

    return el;
}

function initMarkers(labelEl) {
    koordinat.forEach(p => {
        if (!p.coordinate) return;
        const [latStr, lonStr] = p.coordinate.split(',').map(s => s.trim());
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (isNaN(lat) || isNaN(lon)) return;

        const el = createMarkerElement(p, labelEl);
        const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lon, lat])
            .addTo(map);

        markers.push({
            instance: marker,
            element: el,
            kategori: p.kategori
        });
    });
}

function filterMarkers() {
    markers.forEach(m => {
        if (selectedCategories.has(m.kategori)) {
            m.element.style.visibility = 'visible';
            m.element.style.pointerEvents = 'auto';
        } else {
            m.element.style.visibility = 'hidden';
            m.element.style.pointerEvents = 'none';
        }
    });
}

function renderCategoryFilters(categories) {
    const container = document.getElementById('categoryFilters');
    container.innerHTML = '';
    selectedCategories.clear();
    
    categories.forEach(cat => {
        const id = `cat_${cat.replace(/\s+/g, '_')}`;
        const color = categoryColors[cat] || categoryColors['Default'];
        
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-2 mb-2 group cursor-pointer';
        
        wrapper.innerHTML = `
            <input type="checkbox" value="${cat}" id="${id}" checked 
                   class="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer">
            <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
            <label for="${id}" class="text-sm font-medium text-gray-700 group-hover:text-emerald-700 cursor-pointer transition-colors">${cat}</label>
        `;
        
        container.appendChild(wrapper);
        selectedCategories.add(cat);

        wrapper.querySelector('input').addEventListener('change', function() {
            if (this.checked) {
                selectedCategories.add(this.value);
            } else {
                selectedCategories.delete(this.value);
            }
            filterMarkers();
        });
    });
}

const formatPlaceholder = (val) => (val && val !== '-') ? val : '<span class="italic text-gray-400 font-normal">Data belum tersedia</span>';

function openModal(tanah) {
    console.log('Opening modal for:', tanah.pemanfaatan_saat_ini);
    document.getElementById('modalTitle').innerText = tanah.pemanfaatan_saat_ini;
    document.getElementById('modalDesc').innerText = tanah.alamat_lengkap || 'Tidak ada alamat lengkap';
    document.getElementById('m_kecamatan').innerHTML = formatPlaceholder(tanah.kecamatan);
    document.getElementById('m_kabupaten').innerHTML = formatPlaceholder(tanah.kabupaten);
    document.getElementById('m_peruntukan').innerHTML = formatPlaceholder(tanah.peruntukkan_pada_aiw);
    document.getElementById('m_wakif').innerHTML = formatPlaceholder(tanah.nama_wakif);
    document.getElementById('m_nadzir').innerHTML = formatPlaceholder(tanah.nama_nadzir);
    document.getElementById('m_luas').innerText = `${tanah.luas || 0} M²`;
    document.getElementById('m_status').innerText = tanah.status_sertifikat === "SUDAH" ? 'Tersertifikasi' : 'Belum Tersertifikasi';
    document.getElementById('m_sertifikat').innerHTML = tanah.status_sertifikat === "SUDAH" ? formatPlaceholder(tanah.no_sertifikat) : '<span class="italic text-gray-400 font-normal">-</span>';
    document.getElementById('m_gmaps').href = `https://www.google.com/maps?q=${tanah.coordinate}`;

    const modal = document.getElementById('infoModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('infoModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

window.addEventListener('DOMContentLoaded', async () => {
    const labelEl = document.getElementById('label');
    
    await loadRekapKab();
    await loadKoordinat();

    map.on('load', async () => {
        const response = await fetch('ntt.geojson');
        const data = await response.json();

        initMarkers(labelEl);

        const categories = [...new Set(koordinat.map(p => p.kategori).filter(Boolean))];
        renderCategoryFilters(categories);
        
        // Hide loading spinner
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.style.display = 'none', 500);
        }

        // Toggle All Button
        const toggleBtn = document.getElementById('toggleAllBtn');
        if (toggleBtn) {
            let allSelected = true;
            toggleBtn.addEventListener('click', () => {
                allSelected = !allSelected;
                toggleBtn.innerText = allSelected ? 'Deselect All' : 'Select All';
                document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(cb => {
                    cb.checked = allSelected;
                    if (allSelected) {
                        selectedCategories.add(cb.value);
                    } else {
                        selectedCategories.delete(cb.value);
                    }
                });
                filterMarkers();
            });
        }

        const palette = [
            '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
        ];

        const colors = {};
        data.features.forEach((f, i) => {
            colors[f.properties.NAME_2] = palette[i % palette.length];
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
                'fill-opacity': 0.3
            }
        });

        map.addLayer({
            id: 'ntt-outline',
            type: 'line',
            source: 'ntt',
            paint: {
                'line-color': '#fff',
                'line-width': 1
            }
        });

        map.on('mousemove', 'ntt-fill', (e) => {
            if (!e.features.length) return;

            const feature = e.features[0];
            const kabupaten = feature.properties.NAME_2;

            const dataKab = rekapKab.find(item => item.KABUPATEN && item.KABUPATEN.toLowerCase() === kabupaten.toLowerCase());
            const jumlah = dataKab ? dataKab["JUMLAH BIDANG"] : "-";
            const luas = dataKab ? dataKab["TOTAL LUAS (M2)"] : "-";
            
            const formatNumber = (num) => {
                if (typeof num === "number") return num.toLocaleString('id-ID');
                if (!isNaN(num) && num !== "-") return Number(num).toLocaleString('id-ID');
                return num;
            };

            if (labelEl) {
                labelEl.innerHTML = `
                    <div class="font-bold text-lg text-emerald-800">${kabupaten}</div>
                    <div class="text-xs text-gray-600 mt-1">
                        <div class="flex justify-between gap-4"><span>Jumlah Bidang:</span> <span class="font-semibold">${formatNumber(jumlah)}</span></div>
                        <div class="flex justify-between gap-4"><span>Total Luas:</span> <span class="font-semibold">${formatNumber(luas)} m²</span></div>
                    </div>
                `;
                
                const pixel = map.project(e.lngLat);
                labelEl.style.left = `${pixel.x}px`;
                labelEl.style.top = `${pixel.y}px`;
                labelEl.style.display = 'block';
            }

            map.setPaintProperty('ntt-fill', 'fill-opacity',
                ['case', ['==', ['get', 'NAME_2'], kabupaten], 0.5, 0.3]);
        });

        map.on('mouseleave', 'ntt-fill', () => {
            if (labelEl) labelEl.style.display = 'none';
            map.setPaintProperty('ntt-fill', 'fill-opacity', 0.3);
        });

        // Close modal when clicking outside
        const modalEl = document.getElementById('infoModal');
        if (modalEl) {
            modalEl.addEventListener('click', (e) => {
                if (e.target.id === 'infoModal') closeModal();
            });
        }

        map.on('mouseenter', 'ntt-fill', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'ntt-fill', () => {
            map.getCanvas().style.cursor = '';
        });
    });
});
