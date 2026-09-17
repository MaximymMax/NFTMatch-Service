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

    const modalOverlay = document.getElementById('cw-modal-overlay');
    const modalTitle = document.getElementById('cw-modal-title');
    const modalBody = document.getElementById('cw-modal-body');
    const modalClose = document.getElementById('cw-modal-close');

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
            // putya: "при нажатии на блок будет показывать список подарков который подходит под
            // этот кластер" — клик открывает модалку со списком (Gift, Model) для этого сектора.
            path.addEventListener('click', () => openBucketModal(bucket, i));
            svg.appendChild(path);
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

    // --- Модалка "какие подарки подходят под этот сектор" ---
    async function openBucketModal(bucket, i) {
        modalTitle.textContent = `${HUE_NAMES[i]} (${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°)`;
        modalBody.innerHTML = '<div class="cw-modal-note">Загрузка…</div>';
        modalOverlay.classList.remove('hidden');

        try {
            let url = `${API_BASE}/GetGlobalColorWheelBucketModels?hueStart=${bucket.HueStart}&hueEnd=${bucket.HueEnd}`;
            if (selectedCollections.length > 0) url += `&collections=${encodeURIComponent(selectedCollections.join(','))}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();

            if (!data.Items.length) {
                modalBody.innerHTML = '<div class="cw-modal-note">Ничего не найдено.</div>';
                return;
            }
            modalBody.innerHTML = data.Items.map(m => `
                <div class="cw-model-row">
                    <span class="cw-model-swatch" style="background:${m.Hex}"></span>
                    <span class="cw-model-name"><span class="gift">${escapeHtml(m.GiftName)}</span> — ${escapeHtml(m.ModelName)}</span>
                    <span class="cw-model-weight">${m.Weight}%</span>
                </div>
            `).join('') + (data.TotalCount > data.Shown
                ? `<div class="cw-modal-note">Показано ${data.Shown} из ${data.TotalCount}, по убыванию веса цвета.</div>`
                : '');
        } catch (err) {
            modalBody.innerHTML = `<div class="cw-modal-note">Не удалось загрузить: ${escapeHtml(err.message)}</div>`;
        }
    }

    function escapeHtml(s) {
        return (s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    modalClose.addEventListener('click', () => modalOverlay.classList.add('hidden'));
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });

    // --- 3D: putya: "3д куб переделай, чтобы был прям куб как изначально было" — настоящие
    // координаты R/G/B (куб реально заполняется точками, не цилиндр), плюс проволочный каркас
    // куба, чтобы форма читалась однозначно. Светлые тона (высокие R/G/B) собираются у одного угла
    // куба, тёмные — у противоположного, это и даёт "светлые/тёмные" без отдельной оси.
    let rotX = -20, rotY = 35;
    function applyCubeRotation() {
        cubeInner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    // putya: "кружки эти 3д сделай" — радиальный градиент (блик + затемнённый край), чтобы читалось
    // как объёмный шарик, а не плоский кружок.
    function shade(r, g, b, percent) {
        const t = percent < 0 ? 0 : 255;
        const p = Math.abs(percent) / 100;
        return `rgb(${Math.round((t - r) * p) + r}, ${Math.round((t - g) * p) + g}, ${Math.round((t - b) * p) + b})`;
    }

    const CUBE_H = 90; // половина стороны куба, px

    function buildCubeWireframe() {
        const S = 2 * CUBE_H;
        // X-рёбра (варьируется X, Y/Z фиксированы) — естественная "ширина" div уже вдоль X.
        for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
            const e = document.createElement('div');
            e.className = 'cube-edge';
            e.style.width = S + 'px'; e.style.height = '1px';
            e.style.left = '50%'; e.style.top = '50%';
            e.style.marginLeft = -CUBE_H + 'px'; e.style.marginTop = '0px';
            e.style.transform = `translate3d(0px, ${sy * CUBE_H}px, ${sz * CUBE_H}px)`;
            cubeInner.appendChild(e);
        }
        // Y-рёбра (варьируется Y) — естественная "высота" div уже вдоль Y.
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            const e = document.createElement('div');
            e.className = 'cube-edge';
            e.style.width = '1px'; e.style.height = S + 'px';
            e.style.left = '50%'; e.style.top = '50%';
            e.style.marginLeft = '0px'; e.style.marginTop = -CUBE_H + 'px';
            e.style.transform = `translate3d(${sx * CUBE_H}px, 0px, ${sz * CUBE_H}px)`;
            cubeInner.appendChild(e);
        }
        // Z-рёбра (варьируется Z) — берём вертикальный div и поворачиваем его на 90° вокруг X, тогда
        // его "высота" ложится вдоль Z.
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
            const e = document.createElement('div');
            e.className = 'cube-edge';
            e.style.width = '1px'; e.style.height = S + 'px';
            e.style.left = '50%'; e.style.top = '50%';
            e.style.marginLeft = '0px'; e.style.marginTop = -CUBE_H + 'px';
            e.style.transform = `translate3d(${sx * CUBE_H}px, ${sy * CUBE_H}px, 0px) rotateX(90deg)`;
            cubeInner.appendChild(e);
        }

        const lightLabel = document.createElement('div');
        lightLabel.className = 'cube-corner-label';
        lightLabel.textContent = 'светлые';
        lightLabel.style.transform = `translate3d(${CUBE_H}px, ${-CUBE_H - 14}px, ${CUBE_H}px)`;
        cubeInner.appendChild(lightLabel);

        const darkLabel = document.createElement('div');
        darkLabel.className = 'cube-corner-label';
        darkLabel.textContent = 'тёмные';
        darkLabel.style.transform = `translate3d(${-CUBE_H}px, ${CUBE_H + 4}px, ${-CUBE_H}px)`;
        cubeInner.appendChild(darkLabel);
    }

    function renderCube3D(cubePoints) {
        cubeInner.innerHTML = '';
        buildCubeWireframe();

        if (!cubePoints.length) return;
        const maxWeight = Math.max(...cubePoints.map(p => p.WeightSum));

        cubePoints.forEach(p => {
            const x = (p.R / 255) * 2 * CUBE_H - CUBE_H;
            const y = -((p.G / 255) * 2 * CUBE_H - CUBE_H);
            const z = (p.B / 255) * 2 * CUBE_H - CUBE_H;
            const size = 5 + Math.sqrt(p.WeightSum / maxWeight) * 13;

            const dot = document.createElement('div');
            dot.className = 'cube-point';
            dot.style.width = size + 'px';
            dot.style.height = size + 'px';
            dot.style.background = `radial-gradient(circle at 32% 28%, ${shade(p.R, p.G, p.B, 60)}, ${p.Hex} 55%, ${shade(p.R, p.G, p.B, -35)} 100%)`;
            dot.style.marginLeft = -(size / 2) + 'px';
            dot.style.marginTop = -(size / 2) + 'px';
            dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px)`;
            dot.title = `${p.Hex} · R${p.R} G${p.G} B${p.B} · ${p.WeightSum}% веса, ${p.Count} кластеров`;
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
