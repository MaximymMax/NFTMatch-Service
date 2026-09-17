(function () {
    const API_BASE = (window.CONFIG && window.CONFIG.SERVER_BASE_URL || 'https://nftmatch.pro') + '/api/MonoCoof';
    const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
    const API_GIFT_ORIGINALS_URL = 'https://cdn.changes.tg/gifts/originals';
    const modelImageUrl = (giftName, modelName) => `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;

    const svg = document.getElementById('cw-svg');
    const statsEl = document.getElementById('cw-stats');
    const errorEl = document.getElementById('cw-error');
    const chartsRow = document.querySelector('.cw-charts-row');
    const tooltip = document.getElementById('cw-tooltip');
    const thresholdEl = document.getElementById('cw-threshold');
    const filterRow = document.querySelector('.cw-filter-row');

    const drilldown = document.getElementById('cw-drilldown');
    const drilldownTitle = document.getElementById('cw-drilldown-title');
    const drilldownBody = document.getElementById('cw-drilldown-body');
    const drilldownBackgrounds = document.getElementById('cw-drilldown-backgrounds');
    const drilldownClose = document.getElementById('cw-drilldown-close');

    const collectionsHeader = document.getElementById('collections-header');
    const collectionsSearch = document.getElementById('collections-search');
    const collectionsValue = document.getElementById('collections-value');
    const collectionsList = document.getElementById('collections-list');
    const collectionsOptions = document.getElementById('collections-options');

    const lightnessSlider = document.getElementById('lightness-slider');
    const lightnessSliderValue = document.getElementById('lightness-slider-value');
    const lightnessReset = document.getElementById('lightness-reset');

    // 12 секторов по 30° начиная с 0° (красный) — классические названия цветового круга художника,
    // тот же порядок, что и HueWheel с бэкенда.
    const HUE_NAMES = ['Красный', 'Оранжевый', 'Жёлтый', 'Салатовый', 'Зелёный', 'Изумрудный',
        'Голубой', 'Синий', 'Индиго', 'Фиолетовый', 'Пурпурный', 'Розовый'];

    function escapeHtml(s) {
        return (s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

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

    let currentHueWheel = [];
    let openBucketIndex = null;

    function renderWheel(hueWheel) {
        currentHueWheel = hueWheel;
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
            path.addEventListener('mousemove', (e) => showHueTooltip(e, bucket, i));
            path.addEventListener('mouseleave', hideTooltip);
            // putya: "при нажатии на цвет под блоком с диаграммами появляется блок с конкретно
            // моделями которые наиболее подходят под данный цвет" — клик подгружает список
            // (Gift, Model) + подходящие фоны для этого сектора прямо на странице.
            path.addEventListener('click', () => {
                openBucketIndex = i;
                refreshDrilldown();
            });
            svg.appendChild(path);
        });

        const baseCircle = document.createElementNS(ns, 'circle');
        baseCircle.setAttribute('r', minR);
        baseCircle.setAttribute('fill', 'none');
        baseCircle.setAttribute('stroke', 'rgba(255,255,255,.15)');
        svg.appendChild(baseCircle);
    }

    function showHueTooltip(e, bucket, i) {
        tooltip.innerHTML = `<b>${HUE_NAMES[i]} (${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°)</b>` +
            `${bucket.SharePercent}% каталога · ${bucket.Count} кластеров`;
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY + 14) + 'px';
        tooltip.classList.remove('hidden');
    }
    function hideTooltip() { tooltip.classList.add('hidden'); }

    // --- putya: "не в окне отдельном, а блок внизу" — список подходящих подарков + фонов рендерится
    // прямо на странице, в блоке под диаграммой. putya: "при изменении светлости, менялись бы сразу
    // же и модели на этот блок, но уже под эту светлость этого же блока" — refreshDrilldown() не
    // принимает параметров, всегда читает openBucketIndex/currentHueWheel заново, поэтому и клик по
    // сектору, и движение ползунка (через loadCharts) дают один и тот же путь обновления.
    async function refreshDrilldown() {
        if (openBucketIndex === null) return;
        const bucket = currentHueWheel[openBucketIndex];
        if (!bucket) return;
        const i = openBucketIndex;

        const title = `${HUE_NAMES[i]} (${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°)`;
        drilldownTitle.textContent = title;
        drilldownBody.innerHTML = '<div class="cw-drilldown-note">Загрузка…</div>';
        drilldown.classList.remove('hidden');
        drilldown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const range = { hueStart: bucket.HueStart, hueEnd: bucket.HueEnd };
        if (lightnessRangeActive) { range.lStart = lightnessRange[0]; range.lEnd = lightnessRange[1]; }

        try {
            const params = new URLSearchParams(range);
            if (selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));

            const [modelsResp, bgResp] = await Promise.all([
                fetch(`${API_BASE}/GetGlobalColorWheelBucketModels?${params}`),
                fetch(`${API_BASE}/GetGlobalColorWheelMatchingBackgrounds?hex=${encodeURIComponent(bucket.Hex)}`)
            ]);

            // putya: "в этом блоке который выбран так же укажи подходящие фоны под этот цвет" —
            // не критично для основного списка, поэтому падение этого запроса не должно ломать
            // остальное.
            if (bgResp.ok) {
                const bgData = await bgResp.json();
                renderMatchingBackgrounds(bgData.Backgrounds);
            } else {
                drilldownBackgrounds.innerHTML = '';
            }

            if (!modelsResp.ok) throw new Error('HTTP ' + modelsResp.status);
            const data = await modelsResp.json();

            if (!data.Items.length) {
                drilldownBody.innerHTML = '<div class="cw-drilldown-note">Ничего не найдено.</div>';
                return;
            }
            drilldownBody.innerHTML = data.Items.map(m => `
                <div class="cw-model-row">
                    <img class="cw-model-photo" src="${modelImageUrl(m.GiftName, m.ModelName)}" alt=""
                         loading="lazy" onerror="this.style.visibility='hidden'">
                    <span class="cw-model-swatch" style="background:${m.Hex}" title="${m.Hex}"></span>
                    <span class="cw-model-name"><span class="gift">${escapeHtml(m.GiftName)}</span> — ${escapeHtml(m.ModelName)}</span>
                    <span class="cw-model-weight">${m.Weight}%</span>
                </div>
            `).join('') + (data.TotalCount > data.Shown
                ? `<div class="cw-drilldown-note">Показано ${data.Shown} из ${data.TotalCount}, по убыванию веса цвета.</div>`
                : '');
        } catch (err) {
            drilldownBody.innerHTML = `<div class="cw-drilldown-note">Не удалось загрузить: ${escapeHtml(err.message)}</div>`;
        }
    }

    function renderMatchingBackgrounds(backgrounds) {
        if (!backgrounds || !backgrounds.length) { drilldownBackgrounds.innerHTML = ''; return; }
        drilldownBackgrounds.innerHTML = '<span class="cw-bg-label">Подходящие фоны:</span>' +
            backgrounds.map(bg => `
                <span class="cw-bg-chip" title="${escapeHtml(bg.Hex)}">
                    <span class="cw-bg-chip-swatch" style="background:${bg.Hex}"></span>${escapeHtml(bg.Name)}
                </span>
            `).join('');
    }

    drilldownClose.addEventListener('click', () => {
        openBucketIndex = null;
        drilldown.classList.add('hidden');
    });

    // --- putya: "0 это просто черный, а 100 просто белый... даже если выкрутить на максимум" —
    // ширина среза сужается к нулю у самых краёв (у 0 и 100 практически одна точка = почти чисто
    // чёрный/белый), а к середине расширяется до ±12, чтобы там было что исследовать.
    let lightnessRangeActive = false;
    let lightnessRange = null;

    function lightnessBand(v) {
        const half = Math.max(1, Math.min(v, 100 - v, 12));
        return [Math.max(0, v - half), Math.min(100, v + half)];
    }

    function updateLightnessSliderLabel() {
        lightnessSliderValue.textContent = lightnessRangeActive
            ? `${Math.round(lightnessRange[0])}–${Math.round(lightnessRange[1])}`
            : 'весь диапазон';
        lightnessReset.classList.toggle('hidden', !lightnessRangeActive);
    }

    lightnessSlider.addEventListener('input', () => {
        lightnessRangeActive = true;
        lightnessRange = lightnessBand(parseInt(lightnessSlider.value, 10));
        updateLightnessSliderLabel();
        scheduleRefetch();
    });

    lightnessReset.addEventListener('click', () => {
        lightnessRangeActive = false;
        lightnessRange = null;
        lightnessSlider.value = 50;
        updateLightnessSliderLabel();
        scheduleRefetch();
    });

    // --- putya: "список выбранный коллекций... в таком же стиле сделай выпадающий список как у
    // меня все остальное" — тот же multi-select (клик по "Все" сбрасывает выбор, клик по пункту
    // тогглит его в массиве), что и на background-finder.html. putya: "рисуй маленькое превью
    // коллекции, базовое" — иконка подарка с того же CDN, что и everywhere на сайте, по
    // id-to-name.json (имя → id), без отдельного бэкенд-запроса.
    let selectedCollections = [];
    let giftNameToId = {};

    async function loadGiftIdMap() {
        try {
            const resp = await fetch('https://cdn.changes.tg/gifts/id-to-name.json');
            if (!resp.ok) return;
            const idToName = await resp.json();
            Object.entries(idToName).forEach(([id, name]) => {
                if (name) giftNameToId[name.toLowerCase().trim()] = id;
            });
        } catch (err) { /* превью — декоративная деталь, без него тоже нормально работает */ }
    }

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
            const giftId = giftNameToId[name.toLowerCase().trim()];
            const imgHtml = giftId
                ? `<img class="list-option-preview" src="${API_GIFT_ORIGINALS_URL}/${giftId}/Original.png" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`
                : '';
            opt.innerHTML = `${imgHtml}<span>${escapeHtml(name)}</span>`;
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

    async function loadCollectionNames() {
        try {
            const resp = await fetch(`${API_BASE}/GetGlobalColorWheelCollections`);
            if (!resp.ok) return [];
            return await resp.json();
        } catch (err) { return []; }
    }

    // --- Загрузка и отрисовка диаграммы (переиспользуется при смене фильтра/ползунка) ---
    async function loadCharts() {
        try {
            const params = new URLSearchParams();
            if (selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));
            if (lightnessRangeActive) {
                params.set('lStart', lightnessRange[0]);
                params.set('lEnd', lightnessRange[1]);
            }
            const url = `${API_BASE}/GetGlobalColorWheel${params.toString() ? '?' + params : ''}`;
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
            if (openBucketIndex !== null) refreshDrilldown();
        } catch (err) {
            showError('Не удалось загрузить: ' + err.message);
        }
    }

    Promise.all([loadGiftIdMap(), loadCollectionNames()]).then(([, names]) => populateCollections(names));
    loadCharts();
})();
