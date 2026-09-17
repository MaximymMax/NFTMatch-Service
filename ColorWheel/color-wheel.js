(function () {
    const API_BASE = (window.CONFIG && window.CONFIG.SERVER_BASE_URL || 'https://nftmatch.pro') + '/api/MonoCoof';
    const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
    const modelImageUrl = (giftName, modelName) => `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;

    const svg = document.getElementById('cw-svg');
    const statsEl = document.getElementById('cw-stats');
    const errorEl = document.getElementById('cw-error');
    const chartsRow = document.querySelector('.cw-charts-row');
    const tooltip = document.getElementById('cw-tooltip');
    const thresholdEl = document.getElementById('cw-threshold');
    const legendEl = document.getElementById('cw-legend');
    const filterRow = document.querySelector('.cw-filter-row');

    const drilldown = document.getElementById('cw-drilldown');
    const drilldownTitle = document.getElementById('cw-drilldown-title');
    const drilldownBody = document.getElementById('cw-drilldown-body');
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
            path.addEventListener('mousemove', (e) => showHueTooltip(e, bucket, i));
            path.addEventListener('mouseleave', hideTooltip);
            // putya: "при нажатии на цвет под блоком с диаграммами появляется блок с конкретно
            // моделями которые наиболее подходят под данный цвет" — клик подгружает список
            // (Gift, Model) для этого сектора прямо на странице, под диаграммами.
            path.addEventListener('click', () => {
                const title = `${HUE_NAMES[i]} (${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°)`;
                showBucketDrilldown(title, hueRangeQuery(bucket));
            });
            svg.appendChild(path);
        });

        const baseCircle = document.createElementNS(ns, 'circle');
        baseCircle.setAttribute('r', minR);
        baseCircle.setAttribute('fill', 'none');
        baseCircle.setAttribute('stroke', 'rgba(255,255,255,.15)');
        svg.appendChild(baseCircle);
    }

    // putya: "модели которые выводятся не учитывают яркость" — список по клику на сектор должен
    // соответствовать тому, что сейчас реально показывает круг: если ползунок светлоты активен,
    // список фильтруется по ТОМУ ЖЕ диапазону L, а не по всему каталогу.
    function hueRangeQuery(bucket) {
        const q = { hueStart: bucket.HueStart, hueEnd: bucket.HueEnd };
        if (lightnessRangeActive) { q.lStart = lightnessRange[0]; q.lEnd = lightnessRange[1]; }
        return q;
    }

    function renderLegend(hueWheel) {
        legendEl.innerHTML = hueWheel.map((b, i) => `
            <div class="cw-legend-item" data-bucket-index="${i}" title="Показать подходящие подарки">
                <span class="cw-legend-swatch" style="background:${b.Hex}"></span>
                <span class="cw-legend-name">${HUE_NAMES[i]}</span>
                <span class="cw-legend-pct">${b.SharePercent}%</span>
            </div>
        `).join('');
        legendEl.querySelectorAll('.cw-legend-item').forEach(el => {
            el.addEventListener('click', () => {
                const i = parseInt(el.dataset.bucketIndex, 10);
                const b = hueWheel[i];
                const title = `${HUE_NAMES[i]} (${Math.round(b.HueStart)}°–${Math.round(b.HueEnd)}°)`;
                showBucketDrilldown(title, hueRangeQuery(b));
            });
        });
    }

    function showHueTooltip(e, bucket, i) {
        tooltip.innerHTML = `<b>${HUE_NAMES[i]} (${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°)</b>` +
            `${bucket.SharePercent}% каталога · ${bucket.Count} кластеров`;
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY + 14) + 'px';
        tooltip.classList.remove('hidden');
    }
    function hideTooltip() { tooltip.classList.add('hidden'); }

    // --- putya: "не в окне отдельном, а блок внизу" — список подходящих подарков рендерится
    // прямо на странице, в блоке под диаграммами (см. #cw-drilldown в HTML), не всплывающим окном.
    // range — { hueStart, hueEnd[, lStart, lEnd] } от hueRangeQuery(), см. GetGlobalColorWheelBucketModels
    // на бэке (комбинация hue+L поддерживается родно).
    async function showBucketDrilldown(title, range) {
        drilldownTitle.textContent = title;
        drilldownBody.innerHTML = '<div class="cw-drilldown-note">Загрузка…</div>';
        drilldown.classList.remove('hidden');
        drilldown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        try {
            const params = new URLSearchParams(range);
            if (selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));
            const resp = await fetch(`${API_BASE}/GetGlobalColorWheelBucketModels?${params}`);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();

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

    function escapeHtml(s) {
        return (s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    drilldownClose.addEventListener('click', () => drilldown.classList.add('hidden'));

    // --- putya: "лучше сделай ползунок яркости при изменении которого меняется яркость цветов на
    // диаграмме и соответственно распределение ее / если в 0 выкрутить, будет черный, если в
    // максимум выкрутить, только белый" — по умолчанию срез не активен (круг показывает весь
    // каталог, как раньше); любое движение ползунка включает срез шириной ±12 вокруг выбранной
    // точки, кнопка × сбрасывает обратно.
    let lightnessRangeActive = false;
    let lightnessRange = null;

    function lightnessBand(v) {
        const half = 12;
        let lo = v - half, hi = v + half;
        if (lo < 0) { hi -= lo; lo = 0; }
        if (hi > 100) { lo -= (hi - 100); hi = 100; }
        return [Math.max(0, lo), Math.min(100, hi)];
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
            renderLegend(data.HueWheel);
        } catch (err) {
            showError('Не удалось загрузить: ' + err.message);
        }
    }

    loadCollectionsList();
    loadCharts();
})();
