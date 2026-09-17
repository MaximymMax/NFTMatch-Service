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
    const filterRow = document.querySelector('.cw-filter-row');

    const drilldown = document.getElementById('cw-drilldown');
    const drilldownHeader = document.querySelector('.cw-drilldown-header');
    const drilldownTitle = document.getElementById('cw-drilldown-title');
    const drilldownBody = document.getElementById('cw-drilldown-body');
    const drilldownBackgrounds = document.getElementById('cw-drilldown-backgrounds');
    const drilldownClose = document.getElementById('cw-drilldown-close');
    const wheelView = document.getElementById('cw-wheel-view');

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

    // putya: "убери базовый скрол с cw-drilldown-body и сделай по высоте таким же как и левая
    // часть" — на ПК (двухколоночная раскладка) высота правой панели должна визуально совпадать с
    // диаграммой слева. Считаем высоту "шапки" правой колонки (фильтр + заголовок drilldown + фоны)
    // и отдаём остаток под список моделей; на мобильном (одна колонка) сброс на CSS-фиксированную.
    const DESKTOP_BREAKPOINT = 860;
    function syncModelsPanelHeight() {
        if (window.innerWidth < DESKTOP_BREAKPOINT || drilldown.classList.contains('hidden')) {
            drilldownBody.style.maxHeight = '';
            return;
        }
        const leftH = wheelView.getBoundingClientRect().height;
        const chrome = filterRow.getBoundingClientRect().height
            + drilldownHeader.getBoundingClientRect().height
            + drilldownBackgrounds.getBoundingClientRect().height
            + 10; // gap между .cw-filter-row и #cw-drilldown
        drilldownBody.style.maxHeight = Math.max(160, leftH - chrome) + 'px';
    }
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(syncModelsPanelHeight, 150);
    });

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

    // putya: "добавь обводку на выбранный цвет чтобы было видно" — подсвечиваем текущий выбор
    // сразу по клику, не дожидаясь перезагрузки диаграммы.
    function applySelectionHighlight() {
        svg.querySelectorAll('.cw-sector').forEach(el => {
            el.classList.toggle('selected', el.dataset.bucketIndex === String(openBucketIndex));
        });
    }

    function renderWheel(hueWheel) {
        currentHueWheel = hueWheel;
        svg.innerHTML = '';
        const ns = 'http://www.w3.org/2000/svg';
        const extreme = isExtremeLightness();

        // putya: "когда в 0 или в максимум уходит... на диаграме один черный или один белый
        // кружок остаются" — на самых краях светлоты оттенок не имеет смысла (всё ахроматично),
        // поэтому вместо 12 секторов рисуем один сплошной чёрный/белый круг.
        if (extreme) {
            const circle = document.createElementNS(ns, 'circle');
            circle.setAttribute('cx', 0);
            circle.setAttribute('cy', 0);
            circle.setAttribute('r', 170);
            circle.setAttribute('fill', extreme === 'black' ? '#000000' : '#ffffff');
            circle.setAttribute('class', 'cw-sector cw-sector-extreme');
            circle.dataset.bucketIndex = 'EXTREME';
            circle.addEventListener('click', () => {
                openBucketIndex = 'EXTREME';
                applySelectionHighlight();
                refreshDrilldown();
            });
            svg.appendChild(circle);
            applySelectionHighlight();
            return;
        }

        // putya: "не отрисовывай вообще те блоки где нет моделей" — сектора без кластеров не рисуем.
        const activeBuckets = hueWheel.filter(b => b.Count > 0);
        if (activeBuckets.length === 0) {
            const text = document.createElementNS(ns, 'text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'rgba(255,255,255,.4)');
            text.setAttribute('font-size', '14');
            text.textContent = 'Нет данных для этого среза';
            svg.appendChild(text);
            return;
        }
        const maxShare = Math.max(1, ...activeBuckets.map(h => h.SharePercent));
        const minR = 30, maxR = 200;

        hueWheel.forEach((bucket, i) => {
            if (bucket.Count === 0) return;
            const outerR = minR + (bucket.SharePercent / maxShare) * (maxR - minR);
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', wedgePath(bucket.HueStart, bucket.HueEnd, outerR));
            path.setAttribute('fill', bucket.Hex || '#555');
            path.setAttribute('class', 'cw-sector');
            path.dataset.bucketIndex = String(i);
            path.addEventListener('mousemove', (e) => showHueTooltip(e, bucket, i));
            path.addEventListener('mouseleave', hideTooltip);
            // putya: "при нажатии на цвет под блоком с диаграммами появляется блок с конкретно
            // моделями которые наиболее подходят под данный цвет" — клик подгружает список
            // (Gift, Model) + подходящие фоны для этого сектора прямо на странице.
            path.addEventListener('click', () => {
                openBucketIndex = i;
                applySelectionHighlight();
                refreshDrilldown();
            });
            svg.appendChild(path);
        });

        const baseCircle = document.createElementNS(ns, 'circle');
        baseCircle.setAttribute('r', minR);
        baseCircle.setAttribute('fill', 'none');
        baseCircle.setAttribute('stroke', 'rgba(255,255,255,.15)');
        svg.appendChild(baseCircle);

        applySelectionHighlight();
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

        let title, hex, range;
        if (openBucketIndex === 'EXTREME') {
            const extreme = isExtremeLightness();
            if (!extreme) { openBucketIndex = null; applySelectionHighlight(); drilldown.classList.add('hidden'); syncModelsPanelHeight(); return; }
            title = extreme === 'black' ? 'Чёрный' : 'Белый';
            hex = extreme === 'black' ? '#000000' : '#ffffff';
            range = { hueStart: 0, hueEnd: 360 };
        } else {
            const bucket = currentHueWheel[openBucketIndex];
            if (!bucket || bucket.Count === 0) { openBucketIndex = null; applySelectionHighlight(); drilldown.classList.add('hidden'); syncModelsPanelHeight(); return; }
            title = `${HUE_NAMES[openBucketIndex]} (${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°)`;
            hex = bucket.Hex;
            range = { hueStart: bucket.HueStart, hueEnd: bucket.HueEnd };
        }

        drilldownTitle.textContent = title;
        drilldownBody.innerHTML = '<div class="cw-drilldown-note">Загрузка…</div>';
        drilldown.classList.remove('hidden');
        drilldown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (lightnessRangeActive) { range.lStart = lightnessRange[0]; range.lEnd = lightnessRange[1]; }

        try {
            const params = new URLSearchParams(range);
            if (selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));

            const [modelsResp, bgResp] = await Promise.all([
                fetch(`${API_BASE}/GetGlobalColorWheelBucketModels?${params}`),
                fetch(`${API_BASE}/GetGlobalColorWheelMatchingBackgrounds?hex=${encodeURIComponent(hex)}`)
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
        } finally {
            syncModelsPanelHeight();
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
        applySelectionHighlight();
        drilldown.classList.add('hidden');
    });

    // --- putya: "0 это просто черный, а 100 просто белый... даже если выкрутить на максимум" —
    // ширина среза сужается к нулю у самых краёв (у 0 и 100 практически одна точка = почти чисто
    // чёрный/белый), а к середине расширяется до ±12, чтобы там было что исследовать.
    let lightnessRangeActive = false;
    let lightnessRange = null;

    // putya: "на абсолютно черный и абсолютно белый ничего не находит" — проверено на реальных
    // данных: моделей с доминирующим кластером ровно в L=[0,1] нет вообще (0 совпадений), а в
    // L=[0,2] их уже 49 (в L=[98,100] — 54). Нижний порог поднят с 1 до 2 — визуально 0/100 всё
    // равно рисуются как чистый чёрный/белый круг, но выборка перестаёт быть пустой.
    function lightnessBand(v) {
        const half = Math.max(2, Math.min(v, 100 - v, 12));
        return [Math.max(0, v - half), Math.min(100, v + half)];
    }

    // putya: "когда в 0 или в максимум уходит, то независимо от блока показывает просто белый
    // или просто черный" — на самых краях ползунка оттенок больше не имеет смысла.
    function isExtremeLightness() {
        if (!lightnessRangeActive) return null;
        const v = parseInt(lightnessSlider.value, 10);
        if (v <= 0) return 'black';
        if (v >= 100) return 'white';
        return null;
    }

    // putya: "по умолчанию без выбора выбери наибольший кластер для демонстрации" — мутирует
    // openBucketIndex (глобальный), рендер/подсветку вызывающая сторона делает сама.
    function autoSelectDefault(hueWheel) {
        const extreme = isExtremeLightness();
        if (extreme) { openBucketIndex = 'EXTREME'; return; }
        let bestIdx = -1, bestShare = -1;
        hueWheel.forEach((b, i) => {
            if (b.Count > 0 && b.SharePercent > bestShare) { bestShare = b.SharePercent; bestIdx = i; }
        });
        if (bestIdx >= 0) openBucketIndex = bestIdx;
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

            statsEl.innerHTML = `
                <div class="cw-stat-chip"><div class="cw-stat-value">${data.ModelsScanned}</div><div class="cw-stat-label">Моделей просканировано</div></div>
                <div class="cw-stat-chip"><div class="cw-stat-value">${data.ClustersUsed}</div><div class="cw-stat-label">Кластеров учтено</div></div>
            `;

            renderWheel(data.HueWheel);
            // putya: "по умолчанию без выбора выбери наибольший кластер для демонстрации" —
            // если ничего не выбрано (первая загрузка или после закрытия блока), сами выбираем
            // самый крупный по доле сектор (или чёрный/белый круг на краях светлоты).
            if (openBucketIndex === null) {
                autoSelectDefault(data.HueWheel);
                applySelectionHighlight();
            }
            if (openBucketIndex !== null) refreshDrilldown();
        } catch (err) {
            showError('Не удалось загрузить: ' + err.message);
        }
    }

    // --- putya: "добавь кнопка главная которая выбрана по умолчанию" / "вкладка с поиском
    // моделей по выбранным цветам" → "точный подбор по HEX" — Главная/Поиск по цвету переключают
    // локальные панели ниже; Монохромы/Тематики/Похожие остаются обычными ссылками (a), не трогаем.
    const tabButtons = document.querySelectorAll('.cw-tab[data-tab]');
    const panelHome = document.getElementById('cw-panel-home');
    const panelSearch = document.getElementById('cw-panel-search');
    let colorSearchLoaded = false;

    function setActiveTab(tab) {
        tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
        panelHome.classList.toggle('hidden', tab !== 'home');
        panelSearch.classList.toggle('hidden', tab !== 'search');
        if (tab === 'home') {
            syncModelsPanelHeight();
        } else if (tab === 'search' && !colorSearchLoaded) {
            colorSearchLoaded = true;
            runColorSearch();
        }
    }
    tabButtons.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

    // --- putya: "сделай чтобы можно было выбрать несколько цветов, а не только один" — строка №1
    // всегда есть, дальше добавляются кнопкой (тот же паттерн, что на MatchV2Demo: пикер + hex +
    // мин.%). 1 строка → обычный поиск ближайших (GetGlobalColorWheelNearestModels, без потери
    // текущего поведения), 2+ → поиск по всем цветам сразу (GetGlobalColorWheelMultiColorModels). ---
    const colorFiltersList = document.getElementById('color-filters-list');
    const addColorFilterBtn = document.getElementById('add-color-filter-btn');
    const colorSearchBtn = document.getElementById('color-search-btn');
    const colorSearchResults = document.getElementById('color-search-results');
    const excludeOffRecipeCheckbox = document.getElementById('exclude-off-recipe');
    const excludeOffRecipeLabel = document.getElementById('exclude-off-recipe-label');

    // putya: "должна быть возможность как и на тестовом сайте исключить далекие от заданных
    // цветов" — чекбокс имеет смысл только при 2+ цветах (при одном модель и так ищется просто по
    // близости, без понятия "посторонний цвет").
    function updateExcludeToggleState() {
        const rowCount = colorFiltersList.querySelectorAll('.cw-color-filter-row').length;
        const enabled = rowCount > 1;
        excludeOffRecipeLabel.classList.toggle('disabled', !enabled);
        excludeOffRecipeCheckbox.disabled = !enabled;
    }

    function randomHex() {
        const h = Math.floor(Math.random() * 360), s = 70, l = 55;
        const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l / 100 - c / 2;
        let rgb;
        if (h < 60) rgb = [c, x, 0]; else if (h < 120) rgb = [x, c, 0]; else if (h < 180) rgb = [0, c, x];
        else if (h < 240) rgb = [0, x, c]; else if (h < 300) rgb = [x, 0, c]; else rgb = [c, 0, x];
        const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`.toUpperCase();
    }

    function addColorFilterRow() {
        const hex = randomHex();
        const row = document.createElement('div');
        row.className = 'cw-color-filter-row';
        row.innerHTML = `
            <input type="color" class="filter-color-picker" value="${hex}" title="Выбрать цвет">
            <input type="text" class="filter-color-hex cw-hex-input" value="${hex}" maxlength="7" spellcheck="false">
            <input type="number" class="filter-color-pct" min="1" max="100" value="15" title="Мин. %">
            <button type="button" class="cw-remove-filter-btn" title="Убрать">&times;</button>
        `;
        colorFiltersList.appendChild(row);
        updateExcludeToggleState();
    }
    addColorFilterBtn.addEventListener('click', addColorFilterRow);

    colorFiltersList.addEventListener('input', (e) => {
        if (e.target.classList.contains('filter-color-picker')) {
            e.target.closest('.cw-color-filter-row').querySelector('.filter-color-hex').value = e.target.value.toUpperCase();
        }
    });
    colorFiltersList.addEventListener('change', (e) => {
        if (e.target.classList.contains('filter-color-hex')) {
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) e.target.closest('.cw-color-filter-row').querySelector('.filter-color-picker').value = v;
        }
    });
    colorFiltersList.addEventListener('click', (e) => {
        const btn = e.target.closest('.cw-remove-filter-btn');
        if (btn) { btn.closest('.cw-color-filter-row').remove(); updateExcludeToggleState(); }
    });

    // putya: "сделай такие же карточки моделей как у меня везде... сделай чтобы их можно было
    // открывать, ... надо чтобы модалка открывалась, а не перекидывалось" — те же классы карточки,
    // что на background-finder.html, но клик открывает лёгкую модалку тут же (см. openModelModal),
    // а не уводит со страницы; переход на "Похожие" остался внутри модалки как доп. ссылка.
    let lastSearchResults = [];
    function renderColorSearchCards(items, isMulti) {
        lastSearchResults = items;
        if (!items.length) {
            colorSearchResults.innerHTML = '<div class="cw-drilldown-note">Ничего не найдено.</div>';
            return;
        }
        colorSearchResults.innerHTML = items.map((m, i) => {
            const swatches = isMulti
                ? `<div class="multi-swatches">${m.MatchedColors.map(mc => `<span class="multi-swatch" style="background:${mc.Hex}" title="${mc.Hex} · ${mc.Weight}%"></span>`).join('')}</div>`
                : '';
            const badge = isMulti ? `${m.Score}%` : `${m.Weight}%`;
            return `
                <div class="result-card-bg" data-idx="${i}">
                    <div class="image-container">
                        <img class="model-image" src="${modelImageUrl(m.GiftName, m.ModelName)}" alt=""
                             loading="lazy" onerror="this.style.visibility='hidden'">
                    </div>
                    <div class="info-container">
                        <div class="info-text">
                            <div class="info-collection">${escapeHtml(m.GiftName)}</div>
                            <div class="info-model">${escapeHtml(m.ModelName)}</div>
                        </div>
                        ${swatches}
                        <div class="info-badges"><div class="badge-percent">${badge}</div></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    colorSearchResults.addEventListener('click', (e) => {
        const card = e.target.closest('.result-card-bg');
        if (card) openModelModal(lastSearchResults[Number(card.dataset.idx)]);
    });

    async function runColorSearch() {
        const rows = [...colorFiltersList.querySelectorAll('.cw-color-filter-row')];
        colorSearchResults.innerHTML = '<div class="cw-drilldown-note">Загрузка…</div>';
        try {
            let data, isMulti;
            if (rows.length <= 1) {
                isMulti = false;
                const hex = rows[0].querySelector('.filter-color-picker').value;
                const resp = await fetch(`${API_BASE}/GetGlobalColorWheelNearestModels?hex=${encodeURIComponent(hex)}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                data = await resp.json();
            } else {
                isMulti = true;
                const filters = rows.map(row => ({
                    Hex: row.querySelector('.filter-color-picker').value,
                    MinPercent: parseFloat(row.querySelector('.filter-color-pct').value) || 10
                }));
                const params = new URLSearchParams();
                if (excludeOffRecipeCheckbox.checked) params.set('excludeOffRecipeColors', 'true');
                const resp = await fetch(`${API_BASE}/GetGlobalColorWheelMultiColorModels?${params}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(filters)
                });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                data = await resp.json();
            }
            renderColorSearchCards(data.Items, isMulti);
        } catch (err) {
            colorSearchResults.innerHTML = `<div class="cw-drilldown-note">Не удалось загрузить: ${escapeHtml(err.message)}</div>`;
        }
    }
    colorSearchBtn.addEventListener('click', runColorSearch);
    updateExcludeToggleState();

    // --- putya: "надо чтобы модалка открывалась" — лёгкая модалка с фото/свотчами/подходящими
    // фонами (переиспользует GetGlobalColorWheelMatchingBackgrounds), плюс ссылка на полную
    // страницу "Похожие" для тех, кому нужно сравнение/детали.
    const modelModal = document.getElementById('cw-model-modal');
    const modalTitle = document.getElementById('cw-modal-title');
    const modalPhoto = document.getElementById('cw-modal-photo');
    const modalSwatches = document.getElementById('cw-modal-swatches');
    const modalBackgrounds = document.getElementById('cw-modal-backgrounds');
    const modalOpenFull = document.getElementById('cw-modal-open-full');
    const modalClose = document.getElementById('cw-modal-close');

    async function openModelModal(item) {
        if (!item) return;
        modalTitle.textContent = `${item.GiftName} — ${item.ModelName}`;
        modalPhoto.src = modelImageUrl(item.GiftName, item.ModelName);
        const hexes = item.MatchedColors ? item.MatchedColors.map(mc => mc.Hex) : [item.Hex];
        modalSwatches.innerHTML = hexes.map(h => `<span class="multi-swatch" style="background:${h}" title="${h}"></span>`).join('');
        modalOpenFull.href = `../nft-page/index.html?giftName=${encodeURIComponent(item.GiftName)}&modelName=${encodeURIComponent(item.ModelName)}`;
        modalBackgrounds.innerHTML = '';
        modelModal.classList.remove('hidden');

        try {
            const resp = await fetch(`${API_BASE}/GetGlobalColorWheelMatchingBackgrounds?hex=${encodeURIComponent(hexes[0])}`);
            if (resp.ok) {
                const bg = await resp.json();
                if (bg.Backgrounds && bg.Backgrounds.length) {
                    modalBackgrounds.innerHTML = '<span class="cw-bg-label">Подходящие фоны:</span>' +
                        bg.Backgrounds.map(b => `
                            <span class="cw-bg-chip" title="${escapeHtml(b.Hex)}">
                                <span class="cw-bg-chip-swatch" style="background:${b.Hex}"></span>${escapeHtml(b.Name)}
                            </span>
                        `).join('');
                }
            }
        } catch (err) { /* фоны необязательны, тихо пропускаем */ }
    }
    function closeModelModal() { modelModal.classList.add('hidden'); }
    modalClose.addEventListener('click', closeModelModal);
    modelModal.addEventListener('click', (e) => { if (e.target === modelModal) closeModelModal(); });

    // putya: "все страницы... адаптированы под главную страницу" — с других страниц "Поиск по
    // цвету" ведёт на ../ColorWheel/color-wheel.html#search, тут просто открываем нужную вкладку.
    if (location.hash === '#search') setActiveTab('search');

    Promise.all([loadGiftIdMap(), loadCollectionNames()]).then(([, names]) => populateCollections(names));
    loadCharts();
})();
