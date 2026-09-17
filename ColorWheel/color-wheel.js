(function () {
    const API_BASE = (window.CONFIG && window.CONFIG.SERVER_BASE_URL || 'https://nftmatch.pro') + '/api/MonoCoof';

    const svg = document.getElementById('cw-svg');
    const statsEl = document.getElementById('cw-stats');
    const errorEl = document.getElementById('cw-error');
    const chartsRow = document.querySelector('.cw-charts-row');
    const tooltip = document.getElementById('cw-tooltip');
    const cubeInner = document.getElementById('cube-inner');
    const cubeScene = document.getElementById('cube-scene');
    const thresholdEl = document.getElementById('cw-threshold');
    const legendEl = document.getElementById('cw-legend');
    const filterRow = document.querySelector('.cw-filter-row');

    const collectionsHeader = document.getElementById('collections-header');
    const collectionsSearch = document.getElementById('collections-search');
    const collectionsValue = document.getElementById('collections-value');
    const collectionsList = document.getElementById('collections-list');
    const collectionsOptions = document.getElementById('collections-options');

    // 12 секторов по 30° начиная с 0° (красный) — классические названия цветового круга художника,
    // тот же порядок, что и HueWheel с бэкенда.
    const HUE_NAMES = ['Красный', 'Оранжевый', 'Жёлтый', 'Салатовый', 'Зелёный', 'Изумрудный',
        'Голубой', 'Синий', 'Индиго', 'Фиолетовый', 'Пурпурный', 'Розовый'];

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
        chartsRow.classList.add('hidden');
        filterRow.style.display = 'none';
    }

    // --- Круг: 12 секторов по Hue, радиус ~ доля веса (roza diagram) ---
    function polar(r, deg) {
        const rad = (deg - 90) * Math.PI / 180;
        return [r * Math.cos(rad), r * Math.sin(rad)];
    }

    function wedgePath(hueStart, hueEnd, outerR) {
        const [x1, y1] = polar(outerR, hueStart);
        const [x2, y2] = polar(outerR, hueEnd);
        const largeArc = (hueEnd - hueStart) > 180 ? 1 : 0;
        return `M 0 0 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    }

    function renderWheel(hueWheel) {
        svg.innerHTML = '';
        const maxShare = Math.max(1, ...hueWheel.map(h => h.SharePercent));
        const minR = 30, maxR = 200;
        const ns = 'http://www.w3.org/2000/svg';

        hueWheel.forEach((bucket, i) => {
            const outerR = bucket.Count > 0
                ? minR + (bucket.SharePercent / maxShare) * (maxR - minR)
                : minR + 6;
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', wedgePath(bucket.HueStart, bucket.HueEnd, outerR));
            path.setAttribute('fill', bucket.Hex || '#555');
            path.setAttribute('class', 'cw-sector');
            path.addEventListener('mousemove', (e) => showTooltip(e, bucket, i));
            path.addEventListener('mouseleave', hideTooltip);
            svg.appendChild(path);

            if (bucket.SharePercent >= 4) {
                const midAngle = (bucket.HueStart + bucket.HueEnd) / 2;
                const [lx, ly] = polar(outerR * 0.62, midAngle);
                const text = document.createElementNS(ns, 'text');
                text.setAttribute('x', lx.toFixed(1));
                text.setAttribute('y', ly.toFixed(1));
                text.setAttribute('class', 'cw-sector-label');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.textContent = bucket.SharePercent + '%';
                svg.appendChild(text);
            }
        });

        const baseCircle = document.createElementNS(ns, 'circle');
        baseCircle.setAttribute('r', minR);
        baseCircle.setAttribute('fill', 'none');
        baseCircle.setAttribute('stroke', 'rgba(255,255,255,.15)');
        svg.appendChild(baseCircle);
    }

    function renderLegend(hueWheel) {
        legendEl.innerHTML = hueWheel.map((b, i) => `
            <div class="cw-legend-item">
                <span class="cw-legend-swatch" style="background:${b.Hex}"></span>
                <span class="cw-legend-name">${HUE_NAMES[i]}</span>
                <span class="cw-legend-pct">${b.SharePercent}%</span>
            </div>
        `).join('');
    }

    function showTooltip(e, bucket, i) {
        tooltip.innerHTML = `<b>${HUE_NAMES[i]} (${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°)</b>` +
            `${bucket.SharePercent}% каталога · ${bucket.Count} кластеров`;
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY + 14) + 'px';
        tooltip.classList.remove('hidden');
    }
    function hideTooltip() { tooltip.classList.add('hidden'); }

    // --- 3D: цилиндр Hue/Saturation/Lightness (высота=светлота, расстояние от оси=насыщенность,
    // угол=тон) — считается на фронтенде из CubePoints (усреднённые R/G/B по квантованным ячейкам).
    let rotX = -20, rotY = 35;
    function applyCubeRotation() {
        cubeInner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        const d = max - min;
        if (d > 1e-6) {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                default: h = (r - g) / d + 4; break;
            }
            h *= 60;
        }
        return { h, s: s * 100, l: l * 100 };
    }

    // putya: "кружки эти 3д сделай" — радиальный градиент (блик + затемнённый край), чтобы читалось
    // как объёмный шарик, а не плоский кружок.
    function shade(r, g, b, percent) {
        const t = percent < 0 ? 0 : 255;
        const p = Math.abs(percent) / 100;
        return `rgb(${Math.round((t - r) * p) + r}, ${Math.round((t - g) * p) + g}, ${Math.round((t - b) * p) + b})`;
    }

    function renderCube3D(cubePoints) {
        cubeInner.innerHTML = '';

        const axis = document.createElement('div');
        axis.className = 'lab-axis';
        cubeInner.appendChild(axis);

        if (!cubePoints.length) return;
        const maxWeight = Math.max(...cubePoints.map(p => p.WeightSum));
        const maxRadius = 88, halfHeight = 88;

        cubePoints.forEach(p => {
            const { h, s, l } = rgbToHsl(p.R, p.G, p.B);
            const rad = h * Math.PI / 180;
            const radius = (s / 100) * maxRadius;
            const x = radius * Math.cos(rad);
            const z = radius * Math.sin(rad);
            const y = ((50 - l) / 50) * halfHeight;
            const size = 5 + Math.sqrt(p.WeightSum / maxWeight) * 13;

            const dot = document.createElement('div');
            dot.className = 'cube-point';
            dot.style.width = size + 'px';
            dot.style.height = size + 'px';
            dot.style.background = `radial-gradient(circle at 32% 28%, ${shade(p.R, p.G, p.B, 60)}, ${p.Hex} 55%, ${shade(p.R, p.G, p.B, -35)} 100%)`;
            dot.style.marginLeft = -(size / 2) + 'px';
            dot.style.marginTop = -(size / 2) + 'px';
            dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px)`;
            dot.title = `${p.Hex} · светлота ${Math.round(l)}%, насыщенность ${Math.round(s)}% · ${p.WeightSum}% веса, ${p.Count} кластеров`;
            cubeInner.appendChild(dot);
        });
    }

    // Перетаскивание мышью/тачем для поворота куба.
    let dragging = false, lastX = 0, lastY = 0, autoRotate = true;
    function dragStart(x, y) { dragging = true; autoRotate = false; lastX = x; lastY = y; }
    function dragMove(x, y) {
        if (!dragging) return;
        rotY += (x - lastX) * 0.4;
        rotX -= (y - lastY) * 0.4;
        rotX = Math.max(-85, Math.min(85, rotX));
        lastX = x; lastY = y;
        applyCubeRotation();
    }
    function dragEnd() { dragging = false; }

    cubeScene.addEventListener('mousedown', e => dragStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => dragMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', dragEnd);
    cubeScene.addEventListener('touchstart', e => { const t = e.touches[0]; dragStart(t.clientX, t.clientY); }, { passive: true });
    cubeScene.addEventListener('touchmove', e => { const t = e.touches[0]; dragMove(t.clientX, t.clientY); }, { passive: true });
    cubeScene.addEventListener('touchend', dragEnd);

    function tick() {
        if (autoRotate) { rotY += 0.15; applyCubeRotation(); }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // --- putya: "список выбранный коллекций... в таком же стиле сделай выпадающий список как у
    // меня все остальное" — тот же multi-select (клик по "Все" сбрасывает выбор, клик по пункту
    // тогглит его в массиве), что и на background-finder.html, только текстовый (без картинок).
    let selectedCollections = [];

    function updateCollectionsHeaderText() {
        if (selectedCollections.length === 0) {
            collectionsValue.textContent = 'Все коллекции';
            collectionsHeader.classList.remove('value-active');
        } else if (selectedCollections.length === 1) {
            collectionsValue.textContent = selectedCollections[0];
            collectionsHeader.classList.add('value-active');
        } else {
            collectionsValue.textContent = `Выбрано: ${selectedCollections.length}`;
            collectionsHeader.classList.add('value-active');
        }
        collectionsOptions.querySelectorAll('.list-option').forEach(opt => {
            const val = opt.dataset.value;
            opt.classList.toggle('selected', val === 'ALL' ? selectedCollections.length === 0 : selectedCollections.includes(val));
        });
    }

    function populateCollections(names) {
        collectionsOptions.innerHTML = '';
        const allOpt = document.createElement('div');
        allOpt.className = 'list-option selected';
        allOpt.dataset.value = 'ALL';
        allOpt.textContent = 'Все коллекции';
        collectionsOptions.appendChild(allOpt);

        names.forEach(name => {
            const opt = document.createElement('div');
            opt.className = 'list-option';
            opt.dataset.value = name;
            opt.textContent = name;
            collectionsOptions.appendChild(opt);
        });
    }

    let refetchTimer = null;
    function scheduleRefetch() {
        clearTimeout(refetchTimer);
        refetchTimer = setTimeout(loadCharts, 300);
    }

    collectionsOptions.addEventListener('click', (e) => {
        const opt = e.target.closest('.list-option');
        if (!opt) return;
        const val = opt.dataset.value;
        if (val === 'ALL') {
            selectedCollections = [];
        } else {
            const idx = selectedCollections.indexOf(val);
            if (idx > -1) selectedCollections.splice(idx, 1);
            else selectedCollections.push(val);
        }
        updateCollectionsHeaderText();
        scheduleRefetch();
    });

    collectionsHeader.addEventListener('click', () => {
        const opening = collectionsList.classList.contains('hidden');
        collectionsList.classList.toggle('hidden', !opening);
        collectionsHeader.classList.toggle('active', opening);
        collectionsHeader.classList.toggle('open', opening);
        if (opening) collectionsSearch.focus();
    });

    collectionsSearch.addEventListener('input', () => {
        const q = collectionsSearch.value.trim().toLowerCase();
        collectionsOptions.querySelectorAll('.list-option').forEach(opt => {
            const text = opt.textContent.toLowerCase();
            opt.classList.toggle('hidden-by-search', q.length > 0 && !text.includes(q));
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#collections-container')) {
            collectionsList.classList.add('hidden');
            collectionsHeader.classList.remove('active', 'open');
        }
    });

    async function loadCollectionsList() {
        try {
            const resp = await fetch(`${API_BASE}/GetGlobalColorWheelCollections`);
            if (!resp.ok) return;
            const names = await resp.json();
            populateCollections(names);
        } catch (err) { /* фильтр — необязательная надстройка, тихо пропускаем при ошибке */ }
    }

    // --- Загрузка и отрисовка диаграмм (переиспользуется при смене фильтра) ---
    async function loadCharts() {
        try {
            const url = selectedCollections.length > 0
                ? `${API_BASE}/GetGlobalColorWheel?collections=${encodeURIComponent(selectedCollections.join(','))}`
                : `${API_BASE}/GetGlobalColorWheel`;
            const resp = await fetch(url);
            if (resp.status === 403) {
                showError('Страница недоступна.');
                return;
            }
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();

            thresholdEl.textContent = data.MinClusterWeightPercent;
            statsEl.innerHTML = `
                <span>Моделей просканировано: <b>${data.ModelsScanned}</b></span>
                <span>Кластеров учтено: <b>${data.ClustersUsed}</b></span>
                <span>Серые/нейтральные: <b>${data.GreySharePercent}%</b></span>
            `;

            renderWheel(data.HueWheel);
            renderLegend(data.HueWheel);
            renderCube3D(data.CubePoints);
            applyCubeRotation();
        } catch (err) {
            showError('Не удалось загрузить: ' + err.message);
        }
    }

    loadCollectionsList();
    loadCharts();
})();
