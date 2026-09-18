(function () {
    const SERVER_BASE_URL = window.CONFIG && window.CONFIG.SERVER_BASE_URL || 'https://nftmatch.pro';
    const API_BASE = SERVER_BASE_URL + '/api/MonoCoof';
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

    // putya: "модалка... добавить фоны в palette-scroll-area по новому алгоритму" — themesModal
    // подбирает фоны для палитры по имени (GLOBAL_COLORS), сверяя с bgScoreData из MatchV4Dedup.
    // Раньше сюда передавался пустой массив (4-й аргумент init), из-за чего секция "Фон" в модалке
    // на этой странице всегда была пустой ("Без фона" и всё) — тот же список фонов, что и на
    // background-finder.js/themes.js.
    const fixedColors = [
        { id: 'Amber', name: 'Amber', hex: '#DAB345', gradient: 'radial-gradient(circle, rgb(218, 179, 69) 0%, rgb(177, 128, 42) 100%)' },
        { id: 'Aquamarine', name: 'Aquamarine', hex: '#60B195', gradient: 'radial-gradient(circle, rgb(96, 177, 149) 0%, rgb(70, 171, 180) 100%)' },
        { id: 'AzureBlue', name: 'Azure Blue', hex: '#5DB1CB', gradient: 'radial-gradient(circle, rgb(93, 177, 203) 0%, rgb(68, 139, 171) 100%)' },
        { id: 'BattleshipGrey', name: 'Battleship Grey', hex: '#8C8C85', gradient: 'radial-gradient(circle, rgb(140, 140, 133) 0%, rgb(108, 108, 102) 100%)' },
        { id: 'Black', name: 'Black', hex: '#363738', gradient: 'radial-gradient(circle, rgb(54, 55, 56) 0%, rgb(14, 15, 15) 100%)' },
        { id: 'Burgundy', name: 'Burgundy', hex: '#A35E66', gradient: 'radial-gradient(circle, rgb(163, 94, 102) 0%, rgb(109, 65, 74) 100%)' },
        { id: 'BurntSienna', name: 'Burnt Sienna', hex: '#D66F3C', gradient: 'radial-gradient(circle, rgb(214, 111, 60) 0%, rgb(181, 75, 45) 100%)' },
        { id: 'CamoGreen', name: 'Camo Green', hex: '#75944D', gradient: 'radial-gradient(circle, rgb(117, 148, 77) 0%, rgb(84, 115, 65) 100%)' },
        { id: 'Cappuccino', name: 'Cappuccino', hex: '#B1907E', gradient: 'radial-gradient(circle, rgb(177, 144, 126) 0%, rgb(124, 99, 86) 100%)' },
        { id: 'Caramel', name: 'Caramel', hex: '#D09932', gradient: 'radial-gradient(circle, rgb(208, 153, 50) 0%, rgb(183, 116, 49) 100%)' },
        { id: 'Carmine', name: 'Carmine', hex: '#E0574A', gradient: 'radial-gradient(circle, rgb(224, 87, 74) 0%, rgb(168, 56, 59) 100%)' },
        { id: 'CarrotJuice', name: 'Carrot Juice', hex: '#DB9867', gradient: 'radial-gradient(circle, rgb(219, 152, 103) 0%, rgb(199, 111, 79) 100%)' },
        { id: 'CelticBlue', name: 'Celtic Blue', hex: '#49B8ED', gradient: 'radial-gradient(circle, rgb(69, 184, 237) 0%, rgb(56, 134, 217) 100%)' },
        { id: 'Chestnut', name: 'Chestnut', hex: '#BE6F54', gradient: 'radial-gradient(circle, rgb(190, 111, 84) 0%, rgb(153, 72, 56) 100%)' },
        { id: 'Chocolate', name: 'Chocolate', hex: '#A46E58', gradient: 'radial-gradient(circle, rgb(164, 110, 88) 0%, rgb(116, 68, 59) 100%)' },
        { id: 'CobaltBlue', name: 'Cobalt Blue', hex: '#6088CF', gradient: 'radial-gradient(circle, rgb(96, 136, 207) 0%, rgb(81, 98, 184) 100%)' },
        { id: 'Copper', name: 'Copper', hex: '#D08656', gradient: 'radial-gradient(circle, rgb(208, 134, 86) 0%, rgb(157, 101, 49) 100%)' },
        { id: 'CoralRed', name: 'Coral Red', hex: '#DA896B', gradient: 'radial-gradient(circle, rgb(218, 137, 107) 0%, rgb(196, 101, 79) 100%)' },
        { id: 'Cyberpunk', name: 'Cyberpunk', hex: '#858BF3', gradient: 'radial-gradient(circle, rgb(133, 143, 243) 0%, rgb(134, 95, 211) 100%)' },
        { id: 'DarkGreen', name: 'Dark Green', hex: '#516341', gradient: 'radial-gradient(circle, rgb(81, 99, 65) 0%, rgb(43, 69, 47) 100%)' },
        { id: 'DarkLilac', name: 'DarkLilac', hex: '#B17DA5', gradient: 'radial-gradient(circle, rgb(177, 125, 165) 0%, rgb(140, 87, 122) 100%)' },
        { id: 'DeepCyan', name: 'Deep Cyan', hex: '#31B5AA', gradient: 'radial-gradient(circle, rgb(49, 181, 170) 0%, rgb(24, 149, 153) 100%)' },
        { id: 'DesertSand', name: 'Desert Sand', hex: '#B39F82', gradient: 'radial-gradient(circle, rgb(179, 159, 130) 0%, rgb(126, 115, 91) 100%)' },
        { id: 'ElectricIndigo', name: 'Electric Indigo', hex: '#A980F3', gradient: 'radial-gradient(circle, rgb(169, 128, 243) 0%, rgb(91, 98, 216) 100%)' },
        { id: 'ElectricPurple', name: 'Electric Purple', hex: '#CA70C6', gradient: 'radial-gradient(circle, rgb(202, 112, 198) 0%, rgb(150, 98, 212) 100%)' },
        { id: 'Emerald', name: 'Emerald', hex: '#78C585', gradient: 'radial-gradient(circle, rgb(120, 197, 133) 0%, rgb(66, 161, 113) 100%)' },
        { id: 'EnglishViolet', name: 'English Violet', hex: '#B186BB', gradient: 'radial-gradient(circle, rgb(177, 134, 187) 0%, rgb(135, 90, 145) 100%)' },
        { id: 'Fandango', name: 'Fandango', hex: '#E28AB6', gradient: 'radial-gradient(circle, rgb(226, 138, 182) 0%, rgb(164, 88, 139) 100%)' },
        { id: 'Feldgrau', name: 'Feldgrau', hex: '#899288', gradient: 'radial-gradient(circle, rgb(137, 146, 136) 0%, rgb(94, 107, 99) 100%)' },
        { id: 'FireEngine', name: 'Fire Engine', hex: '#F05F4F', gradient: 'radial-gradient(circle, rgb(240, 95, 79) 0%, rgb(196, 57, 73) 100%)' },
        { id: 'FrenchBlue', name: 'French Blue', hex: '#5C9BC4', gradient: 'radial-gradient(circle, rgb(92, 155, 196) 0%, rgb(55, 115, 154) 100%)' },
        { id: 'FrenchViolet', name: 'French Violet', hex: '#C260E6', gradient: 'radial-gradient(circle, rgb(194, 96, 230) 0%, rgb(145, 78, 217) 100%)' },
        { id: 'Grape', name: 'Grape', hex: '#9D73C1', gradient: 'radial-gradient(circle, rgb(157, 116, 193) 0%, rgb(121, 77, 160) 100%)' },
        { id: 'Gunmetal', name: 'Gunmetal', hex: '#4C5D63', gradient: 'radial-gradient(circle, rgb(76, 93, 99) 0%, rgb(47, 59, 66) 100%)' },
        { id: 'GunshipGreen', name: 'Gunship Green', hex: '#558A65', gradient: 'radial-gradient(circle, rgb(85, 138, 101) 0%, rgb(61, 102, 87) 100%)' },
        { id: 'HunterGreen', name: 'Hunter Green', hex: '#8FA078', gradient: 'radial-gradient(circle, rgb(143, 174, 120) 0%, rgb(75, 130, 91) 100%)' },
        { id: 'IndigoDye', name: 'Indigo Dye', hex: '#537991', gradient: 'radial-gradient(circle, rgb(83, 121, 145) 0%, rgb(65, 100, 121) 100%)' },
        { id: 'IvoryWhite', name: 'Ivory White', hex: '#BABAD1', gradient: 'radial-gradient(circle, rgb(186, 182, 177) 0%, rgb(161, 157, 151) 100%)' },
        { id: 'JadeGreen', name: 'Jade Green', hex: '#55C49C', gradient: 'radial-gradient(circle, rgb(85, 196, 156) 0%, rgb(59, 153, 119) 100%)' },
        { id: 'KhakiGreen', name: 'Khaki Green', hex: '#ADAE70', gradient: 'radial-gradient(circle, rgb(173, 176, 112) 0%, rgb(107, 125, 84) 100%)' },
        { id: 'Lavender', name: 'Lavender', hex: '#B789E4', gradient: 'radial-gradient(circle, rgb(183, 137, 228) 0%, rgb(138, 90, 188) 100%)' },
        { id: 'Lemongrass', name: 'Lemongrass', hex: '#AEB85A', gradient: 'radial-gradient(circle, rgb(174, 184, 90) 0%, rgb(85, 147, 69) 100%)' },
        { id: 'LightOlive', name: 'Light Olive', hex: '#C2AF64', gradient: 'radial-gradient(circle, rgb(194, 175, 100) 0%, rgb(136, 126, 69) 100%)' },
        { id: 'Malachite', name: 'Malachite', hex: '#95B457', gradient: 'radial-gradient(circle, rgb(149, 180, 87) 0%, rgb(61, 151, 85) 100%)' },
        { id: 'MarineBlue', name: 'Marine Blue', hex: '#4E689C', gradient: 'radial-gradient(circle, rgb(78, 104, 156) 0%, rgb(59, 75, 122) 100%)' },
        { id: 'MexicanPink', name: 'Mexican Pink', hex: '#E36692', gradient: 'radial-gradient(circle, rgb(227, 102, 146) 0%, rgb(201, 73, 124) 100%)' },
        { id: 'MidnightBlue', name: 'Midnight Blue', hex: '#5C6985', gradient: 'radial-gradient(circle, rgb(92, 105, 133) 0%, rgb(53, 64, 87) 100%)' },
        { id: 'MintGreen', name: 'Mint Green', hex: '#7ECA82', gradient: 'radial-gradient(circle, rgb(126, 203, 130) 0%, rgb(69, 158, 90) 100%)' },
        { id: 'Moonstone', name: 'Moonstone', hex: '#7EB1B4', gradient: 'radial-gradient(circle, rgb(126, 177, 180) 0%, rgb(88, 131, 144) 100%)' },
        { id: 'Mustard', name: 'Mustard', hex: '#D4980D', gradient: 'radial-gradient(circle, rgb(212, 152, 13) 0%, rgb(196, 119, 18) 100%)' },
        { id: 'MysticPearl', name: 'Mystic Pearl', hex: '#D08B6D', gradient: 'radial-gradient(circle, rgb(208, 139, 109) 0%, rgb(176, 87, 112) 100%)' },
        { id: 'NavyBlue', name: 'Navy Blue', hex: '#6C9EDD', gradient: 'radial-gradient(circle, rgb(108, 158, 221) 0%, rgb(92, 110, 201) 100%)' },
        { id: 'NeonBlue', name: 'Neon Blue', hex: '#7596F9', gradient: 'radial-gradient(circle, rgb(117, 150, 249) 0%, rgb(104, 98, 228) 100%)' },
        { id: 'OldGold', name: 'Old Gold', hex: '#B58D38', gradient: 'radial-gradient(circle, rgb(181, 141, 56) 0%, rgb(148, 105, 37) 100%)' },
        { id: 'OnyxBlack', name: 'Onyx Black', hex: '#4D5254', gradient: 'radial-gradient(circle, rgb(77, 82, 84) 0%, rgb(49, 54, 56) 100%)' },
        { id: 'Orange', name: 'Orange', hex: '#D19A3A', gradient: 'radial-gradient(circle, rgb(209, 154, 58) 0%, rgb(192, 111, 71) 100%)' },
        { id: 'PacificCyan', name: 'Pacific Cyan', hex: '#5ABEA6', gradient: 'radial-gradient(circle, rgb(90, 190, 166) 0%, rgb(61, 149, 186) 100%)' },
        { id: 'PacificGreen', name: 'Pacific Green', hex: '#6FC793', gradient: 'radial-gradient(circle, rgb(111, 199, 147) 0%, rgb(59, 156, 132) 100%)' },
        { id: 'Persimmon', name: 'Persimmon', hex: '#E7A75A', gradient: 'radial-gradient(circle, rgb(231, 167, 90) 0%, rgb(197, 103, 95) 100%)' },
        { id: 'PineGreen', name: 'Pine Green', hex: '#6DA97C', gradient: 'radial-gradient(circle, rgb(107, 169, 124) 0%, rgb(62, 121, 112) 100%)' },
        { id: 'Pistachio', name: 'Pistachio', hex: '#97B07C', gradient: 'radial-gradient(circle, rgb(151, 176, 124) 0%, rgb(92, 129, 76) 100%)' },
        { id: 'Platinum', name: 'Platinum', hex: '#B2AEAD', gradient: 'radial-gradient(circle, rgb(178, 174, 167) 0%, rgb(136, 132, 126) 100%)' },
        { id: 'PureGold', name: 'Pure Gold', hex: '#CCAB41', gradient: 'radial-gradient(circle, rgb(204, 171, 65) 0%, rgb(152, 123, 50) 100%)' },
        { id: 'Purple', name: 'Purple', hex: '#AE6EAE', gradient: 'radial-gradient(circle, rgb(174, 108, 174) 0%, rgb(132, 71, 132) 100%)' },
        { id: 'RangerGreen', name: 'Ranger Green', hex: '#5F7849', gradient: 'radial-gradient(circle, rgb(95, 120, 73) 0%, rgb(60, 79, 59) 100%)' },
        { id: 'Raspberry', name: 'Raspberry', hex: '#E07B85', gradient: 'radial-gradient(circle, rgb(224, 123, 133) 0%, rgb(182, 89, 128) 100%)' },
        { id: 'RifleGreen', name: 'Rifle Green', hex: '#64695C', gradient: 'radial-gradient(circle, rgb(100, 105, 92) 0%, rgb(75, 82, 65) 100%)' },
        { id: 'RomanSilver', name: 'Roman Silver', hex: '#A3A8B5', gradient: 'radial-gradient(circle, rgb(163, 168, 181) 0%, rgb(124, 128, 138) 100%)' },
        { id: 'Rosewood', name: 'Rosewood', hex: '#B77A77', gradient: 'radial-gradient(circle, rgb(183, 122, 119) 0%, rgb(129, 76, 82) 100%)' },
        { id: 'Sapphire', name: 'Sapphire', hex: '#58A3C8', gradient: 'radial-gradient(circle, rgb(88, 163, 200) 0%, rgb(83, 121, 194) 100%)' },
        { id: 'SatinGold', name: 'Satin Gold', hex: '#BF9B47', gradient: 'radial-gradient(circle, rgb(191, 155, 71) 0%, rgb(141, 119, 57) 100%)' },
        { id: 'SealBrown', name: 'Seal Brown', hex: '#664D45', gradient: 'radial-gradient(circle, rgb(102, 77, 69) 0%, rgb(71, 54, 46) 100%)' },
        { id: 'ShamrockGreen', name: 'Shamrock Green', hex: '#8AB163', gradient: 'radial-gradient(circle, rgb(138, 177, 99) 0%, rgb(85, 147, 69) 100%)' },
        { id: 'SilverBlue', name: 'Silver Blue', hex: '#80A4B8', gradient: 'radial-gradient(circle, rgb(128, 164, 184) 0%, rgb(96, 124, 145) 100%)' },
        { id: 'SkyBlue', name: 'Sky Blue', hex: '#58B4C8', gradient: 'radial-gradient(circle, rgb(88, 180, 200) 0%, rgb(83, 139, 194) 100%)' },
        { id: 'SteelGrey', name: 'Steel Grey', hex: '#97A2AC', gradient: 'radial-gradient(circle, rgb(151, 162, 172) 0%, rgb(99, 114, 124) 100%)' },
        { id: 'Strawberry', name: 'Strawberry', hex: '#DD8E6F', gradient: 'radial-gradient(circle, rgb(221, 142, 111) 0%, rgb(183, 90, 96) 100%)' },
        { id: 'TacticalPine', name: 'Tactical Pine', hex: '#44826B', gradient: 'radial-gradient(circle, rgb(68, 130, 107) 0%, rgb(47, 99, 105) 100%)' },
        { id: 'Tomato', name: 'Tomato', hex: '#E6793E', gradient: 'radial-gradient(circle, rgb(230, 121, 62) 0%, rgb(212, 78, 63) 100%)' },
        { id: 'Turquoise', name: 'Turquoise', hex: '#5EC0B8', gradient: 'radial-gradient(circle, rgb(94, 192, 184) 0%, rgb(61, 146, 142) 100%)' },
    ];

    // putya: "перенести логику похожих на сайт" — FindModelsByColorRecipe/FindSimilarModels/
    // DebugCube/GetGiftModelsWithCubes (в отличие от старых GetGlobalColorWheel*) проходят через
    // ValidateRequestAsync и корректно учитывают тариф авторизованного пользователя только если
    // передан Authorization — тот же хелпер, что в background-finder.js/themes-modal.js.
    function getApiAuthHeader() {
        if (window.NFTAuth && typeof window.NFTAuth.getApiAuthHeader === 'function') {
            return window.NFTAuth.getApiAuthHeader();
        }
        if (window.getApiAuthHeader && typeof window.getApiAuthHeader === 'function') {
            return window.getApiAuthHeader();
        }
        return 'Tma invalid';
    }

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
                <div class="cw-model-row" data-gift="${escapeHtml(m.GiftName)}" data-model="${escapeHtml(m.ModelName)}">
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

    // putya: "модалка themes-modal-content должна быть при открытии любой карточки" — та же
    // themesModal, что на Монохромах/Тематиках/Похожих (см. init() ниже), не своя.
    drilldownBody.addEventListener('click', (e) => {
        const row = e.target.closest('.cw-model-row');
        if (row && window.themesModal) window.themesModal.openModelDetail(row.dataset.gift, row.dataset.model);
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

    // --- putya: "добавь кнопка главная которая выбрана по умолчанию" / "совмести поиск по цветам
    // и поиск похожих, просто будет две разные вкладки" — Главная/Похожие/Поиск по цвету
    // переключают локальные панели ниже; Похожие и Поиск по цвету ведут в один и тот же
    // #cw-panel-search, различаясь только data-subtab (см. setSearchSubtab). Монохромы/Тематики
    // остаются обычными ссылками (a), не трогаем.
    const tabButtons = document.querySelectorAll('.cw-tab[data-tab]');
    const panelHome = document.getElementById('cw-panel-home');
    const panelSearch = document.getElementById('cw-panel-search');
    const searchColorsPanel = document.getElementById('cw-search-colors');
    const searchSimilarPanel = document.getElementById('cw-search-similar');
    // putya: "переключатель между режимами сделать по аналогии с переключателем между поиском по
    // фонам и моделям в монохромах" — тот же .mode-switcher.mode-switcher-2, что и на
    // background-finder.html, живёт внутри самой панели поиска и дублирует то же переключение,
    // что и верхние вкладки "Похожие"/"Поиск по цвету" (оба пути ведут в setSearchSubtab).
    const searchModeSwitcher = document.getElementById('search-mode-switcher');
    const searchModeTabs = searchModeSwitcher.querySelectorAll('.mode-tab[data-subtab]');
    let colorSearchLoaded = false;
    let similarPickerLoaded = false;
    let currentSearchSubtab = 'colors';

    function setSearchSubtab(subtab) {
        currentSearchSubtab = subtab;
        searchColorsPanel.classList.toggle('hidden', subtab !== 'colors');
        searchSimilarPanel.classList.toggle('hidden', subtab !== 'similar');
        searchModeSwitcher.dataset.activeMode = subtab;
        searchModeTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.subtab === subtab));
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === 'search') btn.classList.toggle('active', btn.dataset.subtab === subtab);
        });
        if (subtab === 'colors' && !colorSearchLoaded) {
            colorSearchLoaded = true;
            runColorSearch();
        } else if (subtab === 'similar' && !similarPickerLoaded) {
            similarPickerLoaded = true;
            loadSimilarPicker();
        }
    }
    searchModeTabs.forEach(btn => btn.addEventListener('click', () => setSearchSubtab(btn.dataset.subtab)));

    function setActiveTab(tab, subtab) {
        panelHome.classList.toggle('hidden', tab !== 'home');
        panelSearch.classList.toggle('hidden', tab !== 'search');
        // putya: "все еще разные стили" — на Похожих/Поиске по цвету "Главная" оставалась active
        // (класс захардкожен в HTML для начального состояния), setSearchSubtab трогает только
        // кнопки data-tab="search", поэтому "Главная" не гасла при прямом заходе по #search-хэшу
        // с других страниц — два таба подсвечивались одновременно.
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === 'home') btn.classList.toggle('active', tab === 'home');
        });
        if (tab === 'home') {
            syncModelsPanelHeight();
        } else if (tab === 'search') {
            setSearchSubtab(subtab || currentSearchSubtab);
        }
    }
    tabButtons.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab, btn.dataset.subtab)));

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

    // putya: "я тебе сказал убрать вариант точный, будет только доминирующий" — рецепт всегда
    // ищет по доминирующим цветам (dominantMode=true на бэкенде), без целевого % на цвет.
    const RECIPE_MIN_SIMILARITY = 50;

    function addColorFilterRow() {
        const hex = randomHex();
        const row = document.createElement('div');
        row.className = 'cw-color-filter-row';
        row.innerHTML = `
            <input type="color" class="filter-color-picker" value="${hex}" title="Выбрать цвет">
            <input type="text" class="filter-color-hex cw-hex-input" value="${hex}" maxlength="7" spellcheck="false">
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
    // открывать" — те же классы карточки, что на background-finder.html. "модалка themes-modal-
    // content должна быть при открытии любой карточки, в том числе и той где поиск по цвету" —
    // клик открывает настоящую themesModal.openModelDetail (не свою модалку). Свотчи показываем
    // только при 2+ цветах рецепта — для обычного поиска по одному цвету карточка чище.
    function renderColorSearchCards(items) {
        if (!items.length) {
            colorSearchResults.innerHTML = '<div class="cw-drilldown-note">Ничего не найдено.</div>';
            return;
        }
        colorSearchResults.innerHTML = items.map(m => {
            const colors = m.Colors || [];
            const swatches = colors.length > 1
                ? `<div class="multi-swatches">${colors.map(c => `<span class="multi-swatch" style="background:${c.MatchedCubeHex}" title="${c.MatchedCubeHex} · ${c.MatchedWeight}%, сходство ${c.Similarity}%"></span>`).join('')}</div>`
                : '';
            return `
                <div class="result-card-bg" data-gift="${escapeHtml(m.GiftName)}" data-model="${escapeHtml(m.ModelName)}">
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
                        <div class="info-badges"><div class="badge-percent">${Number(m.AvgSimilarity).toFixed(0)}%</div></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    colorSearchResults.addEventListener('click', (e) => {
        const card = e.target.closest('.result-card-bg');
        if (card && window.themesModal) window.themesModal.openModelDetail(card.dataset.gift, card.dataset.model);
    });

    // putya: "такая же логика как на тестовом сайте" — один POST FindModelsByColorRecipe на любое
    // число цветов (1 и 2+ больше не разные пути, как было со старыми
    // GetGlobalColorWheelNearestModels/MultiColorModels).
    async function runColorSearch() {
        const rows = [...colorFiltersList.querySelectorAll('.cw-color-filter-row')];
        if (!rows.length) return;
        const colors = rows.map(row => ({
            Hex: row.querySelector('.filter-color-picker').value,
            TargetPercent: 0
        }));
        const offColorParam = excludeOffRecipeCheckbox.checked ? '&excludeOffRecipeColors=true' : '';

        colorSearchResults.innerHTML = '<div class="cw-drilldown-note">Загрузка…</div>';
        try {
            const url = `${API_BASE}/FindModelsByColorRecipe?minSimilarity=${RECIPE_MIN_SIMILARITY}&toleranceWeight=0&dominantMode=true${offColorParam}`;
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': getApiAuthHeader() },
                body: JSON.stringify(colors)
            });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            renderColorSearchCards(data.Models || []);
        } catch (err) {
            colorSearchResults.innerHTML = `<div class="cw-drilldown-note">Не удалось загрузить: ${escapeHtml(err.message)}</div>`;
        }
    }
    colorSearchBtn.addEventListener('click', runColorSearch);
    updateExcludeToggleState();

    // === "Похожие" — портировано из mono-cube-live.html (режим modeSimilarBtn/FindSimilarModels).
    // Задаётся целевая модель, поиск идёт по РАНГУ доминирующих кластеров (не по точному %) —
    // catalog-wide, без предрасчёта. putya: "можно исключать цвета" — клик по цвету на диаграмме
    // цели переключает его исключение без повторного похода на сервер. ===
    let giftModelsData = [];
    let similarGiftName = null;
    let similarExcludedHexes = new Set();
    let similarTargetClusters = [];
    let similarRadarIdCounter = 0;
    const SIMILAR_RADAR_HUE_TRUST_CHROMA = 8;
    const SIMILAR_SKELETON_WEIGHT = 10; // тот же порог, что SimilarModelsMinClusterWeight на бэкенде

    const similarGiftContainer = document.getElementById('similar-gift-container');
    const similarGiftHeader = document.getElementById('similar-gift-header');
    const similarGiftSearch = document.getElementById('similar-gift-search');
    const similarGiftValue = document.getElementById('similar-gift-value');
    const similarGiftList = document.getElementById('similar-gift-list');
    const similarGiftOptions = document.getElementById('similar-gift-options');

    const similarModelContainer = document.getElementById('similar-model-container');
    const similarModelHeader = document.getElementById('similar-model-header');
    const similarModelSearch = document.getElementById('similar-model-search');
    const similarModelValue = document.getElementById('similar-model-value');
    const similarModelList = document.getElementById('similar-model-list');
    const similarModelOptions = document.getElementById('similar-model-options');

    const similarRadarBox = document.getElementById('similar-target-radar-box');
    const similarRadar = document.getElementById('similar-target-radar');
    // putya: "убери выбор мин сходства, всегда будет до 50ти процентов" / "будет только
    // доминирующий" — раньше были отдельные поля, теперь оба значения зашиты в runSimilarSearch().
    const SIMILAR_MIN_SIMILARITY = 50;
    const similarSearchBtn = document.getElementById('similar-search-btn');
    const similarSearchResults = document.getElementById('similar-search-results');

    // putya: "выпадающий список должен быть в таком же стиле как... на монохромах" — это
    // .option-image (35x35, покрупнее) из background-finder.css, а не мелкая 22px превьюшка
    // .list-option-preview у "Коллекции" на Главной панели — та ошибка была в прошлый раз.
    function similarGiftPreviewHtml(giftName) {
        const giftId = giftNameToId[giftName.toLowerCase().trim()];
        return giftId
            ? `<img class="option-image" src="${API_GIFT_ORIGINALS_URL}/${giftId}/Original.png" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`
            : '';
    }
    function similarModelPreviewHtml(giftName, modelName) {
        return `<img class="option-image" src="${modelImageUrl(giftName, modelName)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;
    }

    async function loadSimilarPicker() {
        similarGiftOptions.innerHTML = '<div class="cw-drilldown-note">Загрузка…</div>';
        try {
            const resp = await fetch(`${API_BASE}/GetGiftModelsWithCubes`, { headers: { 'Authorization': getApiAuthHeader() } });
            giftModelsData = resp.ok ? await resp.json() : [];
        } catch (err) { giftModelsData = []; }
        similarGiftOptions.innerHTML = giftModelsData.map(g =>
            `<div class="list-option" data-value="${escapeHtml(g.GiftName)}">${similarGiftPreviewHtml(g.GiftName)}<span class="option-text">${escapeHtml(g.GiftName)}</span></div>`
        ).join('') || '<div class="cw-drilldown-note">Не удалось загрузить коллекции.</div>';
    }

    function selectSimilarGift(giftName) {
        similarGiftName = giftName;
        similarGiftValue.textContent = giftName;
        // putya-паттерн (см. updateDropdownSelection в background-finder.js): value-active
        // подменяет плейсхолдер полем поиска, поэтому после выбора его снимаем, а не ставим —
        // иначе закрытый дропдаун показывает пустое "Поиск..." вместо выбранного значения.
        similarGiftHeader.classList.remove('value-active');
        similarGiftOptions.querySelectorAll('.list-option').forEach(o => o.classList.toggle('selected', o.dataset.value === giftName));

        similarModelValue.textContent = 'Выбери модель';
        similarModelHeader.classList.remove('value-active');
        const gift = giftModelsData.find(g => g.GiftName === giftName);
        const models = gift ? gift.Models : [];
        similarModelOptions.innerHTML = models.map(m =>
            `<div class="list-option" data-value="${escapeHtml(m)}">${similarModelPreviewHtml(giftName, m)}<span class="option-text">${escapeHtml(m)}</span></div>`
        ).join('');

        similarSearchBtn.disabled = true;
        similarRadarBox.classList.add('hidden');
        similarExcludedHexes = new Set();
    }

    function selectSimilarModel(modelName) {
        similarModelValue.textContent = modelName;
        similarModelHeader.classList.remove('value-active');
        similarModelOptions.querySelectorAll('.list-option').forEach(o => o.classList.toggle('selected', o.dataset.value === modelName));
        similarExcludedHexes = new Set();
        similarSearchBtn.disabled = false;
        loadSimilarTargetRadar(similarGiftName, modelName);
    }

    function bindDropdown(header, list, search, options, onOpen) {
        header.addEventListener('click', () => {
            if (header.classList.contains('disabled')) return;
            const opening = list.classList.contains('hidden');
            list.classList.toggle('hidden', !opening);
            header.classList.toggle('active', opening);
            header.classList.toggle('open', opening);
            if (opening) { search.value = ''; search.focus(); if (onOpen) onOpen(); options.querySelectorAll('.list-option').forEach(o => o.classList.remove('hidden-by-search')); }
        });
        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            options.querySelectorAll('.list-option').forEach(o => o.classList.toggle('hidden-by-search', q.length > 0 && !o.textContent.toLowerCase().includes(q)));
        });
    }
    bindDropdown(similarGiftHeader, similarGiftList, similarGiftSearch, similarGiftOptions);
    bindDropdown(similarModelHeader, similarModelList, similarModelSearch, similarModelOptions);

    similarGiftOptions.addEventListener('click', (e) => {
        const opt = e.target.closest('.list-option');
        if (!opt) return;
        selectSimilarGift(opt.dataset.value);
        similarGiftList.classList.add('hidden');
        similarGiftHeader.classList.remove('active', 'open');
    });
    similarModelOptions.addEventListener('click', (e) => {
        const opt = e.target.closest('.list-option');
        if (!opt) return;
        selectSimilarModel(opt.dataset.value);
        similarModelList.classList.add('hidden');
        similarModelHeader.classList.remove('active', 'open');
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#similar-gift-container')) {
            similarGiftList.classList.add('hidden');
            similarGiftHeader.classList.remove('active', 'open');
        }
        if (!e.target.closest('#similar-model-container')) {
            similarModelList.classList.add('hidden');
            similarModelHeader.classList.remove('active', 'open');
        }
    });

    // --- Радар "весов и цветов" цели — перенесено из background-finder.js (bgs2BuildColorRadarSVG,
    // уже без бага "самый лёгкий кластер схлопывается в центр", см. историю правок), плюс
    // интерактивность (клик по бейджу исключает цвет), перенесённая из mono-cube-live.html. ---
    function similarHexToRgb(hex) {
        let h = (hex || '#808080').replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const num = parseInt(h, 16) || 0x808080;
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }
    function similarMixHex(hexA, hexB) {
        const a = similarHexToRgb(hexA), b = similarHexToRgb(hexB);
        return `rgb(${Math.round((a.r + b.r) / 2)},${Math.round((a.g + b.g) / 2)},${Math.round((a.b + b.b) / 2)})`;
    }
    function similarComputeAngles(clusters) {
        const n = clusters.length;
        if (n === 1) return [-90];
        const ranked = clusters.map((c, idx) => {
            const chroma = Math.sqrt(c.a * c.a + c.b * c.b);
            const isNeutral = chroma <= SIMILAR_RADAR_HUE_TRUST_CHROMA;
            const hue = isNeutral ? null : (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
            const pos = isNeutral ? (-40 + (c.L / 100) * 40) : hue;
            return { idx, pos };
        }).sort((x, y) => x.pos - y.pos);
        const gapsRaw = ranked.map((r, i) => {
            const next = ranked[(i + 1) % n];
            return i === n - 1 ? (next.pos + 360) - r.pos : next.pos - r.pos;
        });
        const MIN_GAP = Math.max((360 / n) * 0.5, 15);
        let deficit = 0;
        let gaps = gapsRaw.map(g => { if (g < MIN_GAP) { deficit += (MIN_GAP - g); return MIN_GAP; } return g; });
        if (deficit > 0) {
            const maxIdx = gaps.indexOf(Math.max(...gaps));
            gaps[maxIdx] = Math.max(MIN_GAP, gaps[maxIdx] - deficit);
        }
        const sum = gaps.reduce((s, g) => s + g, 0);
        gaps = gaps.map(g => (g * 360) / sum);
        const angleByIdx = new Array(n);
        let angleDeg = -90;
        ranked.forEach((r, i) => { angleByIdx[r.idx] = angleDeg; angleDeg += gaps[i]; });
        return angleByIdx;
    }
    function buildSimilarRadarSVG(clusters) {
        if (!clusters.length) return '<div class="cw-drilldown-note">Нет данных о цветовом профиле.</div>';
        const n = clusters.length;
        const size = 250, cx = size / 2, cy = size / 2, maxR = 62, badgeR = 13;
        const maxWeight = Math.max(...clusters.map(c => c.weight), 1);
        const scaleMax = Math.max(20, Math.ceil(maxWeight / 10) * 10);
        const anglesDeg = similarComputeAngles(clusters);
        const RADAR_MIN_R_FRAC = 0.35;

        const pts = clusters.map((c, i) => {
            const angleRad = (anglesDeg[i] * Math.PI) / 180;
            const frac = Math.min(c.weight / scaleMax, 1);
            const r = maxR * (RADAR_MIN_R_FRAC + frac * (1 - RADAR_MIN_R_FRAC));
            const lr = maxR + 34;
            return {
                angleRad, r,
                x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad),
                lx: cx + lr * Math.cos(angleRad), ly: cy + lr * Math.sin(angleRad),
                hex: c.hex, weight: c.weight, angleDeg: anglesDeg[i]
            };
        });
        const orderedPts = pts.slice().sort((a, b) => a.angleDeg - b.angleDeg);

        const ringFracs = [0.25, 0.5, 0.75, 1];
        const rings = ringFracs.map(f => `<circle cx="${cx}" cy="${cy}" r="${(maxR * f).toFixed(1)}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>`).join('');
        const ringLabels = ringFracs.map(f => `<text x="${cx + 3}" y="${(cy - maxR * f + 3).toFixed(1)}" font-size="8" fill="rgba(255,255,255,.35)">${Math.round(scaleMax * f)}%</text>`).join('');
        const spokes = pts.map(p => `<line x1="${cx}" y1="${cy}" x2="${p.lx.toFixed(1)}" y2="${p.ly.toFixed(1)}" stroke="rgba(255,255,255,.10)" stroke-width="1"/>`).join('');

        const radarUid = 'cwradar' + (similarRadarIdCounter++);
        let defs = '', wedges = '';
        for (let i = 0; i < n; i++) {
            const a = orderedPts[i], b = orderedPts[(i + 1) % n];
            const gid = `grad-${radarUid}-${i}`;
            const mix = similarMixHex(a.hex, b.hex);
            defs += `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${maxR}">
              <stop offset="0%" stop-color="${mix}" stop-opacity="0"/>
              <stop offset="100%" stop-color="${mix}" stop-opacity="0.55"/>
            </radialGradient>`;
            wedges += `<polygon points="${cx},${cy} ${a.x.toFixed(1)},${a.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}" fill="url(#${gid})"/>`;
        }
        const outline = n >= 2
            ? `<polygon points="${orderedPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2.5" stroke-linejoin="round"/>`
            : '';
        // putya: "исключение выбивающих цветов более выразительным сделать" — раньше исключённый
        // цвет просто чуть гас (opacity .22, белый пунктир) и почти терялся на фоне остальных;
        // теперь красная пунктирная обводка потолще, крупный красный крест с белой окантовкой (paint-
        // order), серая (не цветная) точка-вершина на самом радаре и зачёркнутый % под бейджем.
        const vertexDots = pts.map(p => {
            const hexKey = p.hex.replace('#', '').toUpperCase();
            const isExcluded = similarExcludedHexes.has(hexKey);
            return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="${isExcluded ? '#6b7280' : p.hex}"/>`;
        }).join('');

        const badges = pts.map(p => {
            const hexKey = p.hex.replace('#', '').toUpperCase();
            const isExcluded = similarExcludedHexes.has(hexKey);
            const fillOpacity = isExcluded ? 0.16 : 1;
            const strokeAttr = isExcluded ? 'stroke="#ef4444" stroke-width="2.5" stroke-dasharray="4,3"' : 'stroke="#fff" stroke-width="1.5"';
            const mark = isExcluded
                ? `<text x="${p.lx.toFixed(1)}" y="${p.ly.toFixed(1)}" font-size="19" font-weight="900" fill="#ef4444" text-anchor="middle" dominant-baseline="central" paint-order="stroke" stroke="#fff" stroke-width="2.5" style="pointer-events:none;">✕</text>`
                : '';
            return `<circle cx="${p.lx.toFixed(1)}" cy="${p.ly.toFixed(1)}" r="${badgeR}" fill="${p.hex}" fill-opacity="${fillOpacity}" ${strokeAttr} data-hex="${hexKey}"/>${mark}`;
        }).join('');
        const badgeLabels = pts.map(p => {
            const hexKey = p.hex.replace('#', '').toUpperCase();
            const isExcluded = similarExcludedHexes.has(hexKey);
            const above = p.ly <= cy;
            const ty = above ? p.ly - badgeR - 6 : p.ly + badgeR + 12;
            const style = isExcluded ? 'text-decoration:line-through;' : '';
            return `<text x="${p.lx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="10" font-weight="700" fill="${isExcluded ? '#ef4444' : '#fff'}" text-anchor="middle" style="${style}">${Math.round(p.weight)}%</text>`;
        }).join('');

        return `<svg viewBox="0 0 ${size} ${size}" class="cw-similar-radar-svg" style="width:100%; max-width:250px; height:auto; display:block; margin:0 auto;">
          <defs>${defs}</defs>
          ${rings}${spokes}${wedges}${outline}${vertexDots}${badges}${badgeLabels}${ringLabels}
        </svg>`;
    }
    function renderSimilarRadarNow() {
        similarRadar.innerHTML = buildSimilarRadarSVG(similarTargetClusters);
        similarRadarBox.classList.remove('hidden');
    }
    async function loadSimilarTargetRadar(giftName, modelName) {
        similarRadarBox.classList.remove('hidden');
        similarRadar.innerHTML = '<div class="cw-drilldown-note">Загружаю цветовой профиль…</div>';
        const previewImg = document.getElementById('similar-target-preview');
        if (previewImg) { previewImg.src = modelImageUrl(giftName, modelName); previewImg.alt = modelName; }
        try {
            const resp = await fetch(`${API_BASE}/DebugCube?nameGift=${encodeURIComponent(giftName)}&nameModel=${encodeURIComponent(modelName)}`, { headers: { 'Authorization': getApiAuthHeader() } });
            const data = resp.ok ? await resp.json() : null;
            // DebugCube (в отличие от FindSimilarModels/GetGiftModelsWithCubes, анонимных объектов
            // с обычной PascalCase-сериализацией) сериализуется в camelCase — та же непоследовательность,
            // из-за которой background-finder.js/themes-modal.js используют pick()-хелпер для этого
            // конкретного эндпоинта; берём оба варианта регистра на всякий случай.
            const pick = (obj, name) => obj ? (obj[name.charAt(0).toLowerCase() + name.slice(1)] ?? obj[name.charAt(0).toUpperCase() + name.slice(1)]) : undefined;
            const cubes = pick(data, 'cubes') || [];
            similarTargetClusters = cubes
                .map(c => ({ hex: pick(c, 'avgHex') || '#888888', weight: Number(pick(c, 'weight')) || 0, L: Number(pick(c, 'L')) || 0, a: Number(pick(c, 'a')) || 0, b: Number(pick(c, 'b')) || 0 }))
                .filter(c => c.weight >= SIMILAR_SKELETON_WEIGHT)
                .sort((a, b) => b.weight - a.weight);
            renderSimilarRadarNow();
        } catch (err) {
            similarRadar.innerHTML = '<div class="cw-drilldown-note">Нет данных о цветовом профиле.</div>';
        }
    }
    similarRadar.addEventListener('click', (e) => {
        const el = e.target.closest('circle[data-hex]');
        if (!el) return;
        const hex = el.getAttribute('data-hex');
        if (similarExcludedHexes.has(hex)) similarExcludedHexes.delete(hex); else similarExcludedHexes.add(hex);
        renderSimilarRadarNow();
    });

    // putya: "вид карточек такой же" — .result-card-bg, как везде на сайте; точки в свотчах — куда
    // именно кандидат зацепился по каждой позиции (Positions), а не сам целевой цвет.
    function renderSimilarCards(items) {
        if (!items.length) {
            similarSearchResults.innerHTML = '<div class="cw-drilldown-note">Ничего не найдено.</div>';
            return;
        }
        similarSearchResults.innerHTML = items.map(m => {
            const positions = m.Positions || [];
            const swatches = positions.length
                ? `<div class="multi-swatches">${positions.map(p => `<span class="multi-swatch" style="background:${p.CandidateCubeHex}" title="#${p.Rank}: ${p.CandidateCubeHex} (${p.CandidateWeight}%), сходство ${p.Similarity}%"></span>`).join('')}</div>`
                : '';
            return `
                <div class="result-card-bg" data-gift="${escapeHtml(m.GiftName)}" data-model="${escapeHtml(m.ModelName)}">
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
                        <div class="info-badges"><div class="badge-percent">${m.IsMonochrome ? '★ ' : ''}${Number(m.AvgSimilarity).toFixed(0)}%</div></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    similarSearchResults.addEventListener('click', (e) => {
        const card = e.target.closest('.result-card-bg');
        if (card && window.themesModal) window.themesModal.openModelDetail(card.dataset.gift, card.dataset.model);
    });

    async function runSimilarSearch() {
        const modelName = similarModelValue.textContent;
        if (!similarGiftName || !modelName || similarSearchBtn.disabled) return;
        const excludeParam = similarExcludedHexes.size ? `&excludeHexes=${encodeURIComponent(Array.from(similarExcludedHexes).join(','))}` : '';

        similarSearchBtn.disabled = true;
        similarSearchResults.innerHTML = '<div class="cw-drilldown-note">Ищу похожие модели по всему каталогу — может занять время…</div>';
        try {
            const url = `${API_BASE}/FindSimilarModels?nameGift=${encodeURIComponent(similarGiftName)}&nameModel=${encodeURIComponent(modelName)}&minSimilarity=${SIMILAR_MIN_SIMILARITY}${excludeParam}&ignoreColorOrder=true`;
            const resp = await fetch(url, { headers: { 'Authorization': getApiAuthHeader() } });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            renderSimilarCards(data.Models || []);
        } catch (err) {
            similarSearchResults.innerHTML = `<div class="cw-drilldown-note">Не удалось загрузить: ${escapeHtml(err.message)}</div>`;
        } finally {
            similarSearchBtn.disabled = false;
        }
    }
    similarSearchBtn.addEventListener('click', runSimilarSearch);

    // putya: "все страницы... адаптированы под главную страницу" — с других страниц "Похожие"/
    // "Поиск по цвету" ведут на ../ColorWheel/color-wheel.html#search-similar / #search, тут просто
    // открываем нужную вкладку и поддиалку.
    if (location.hash === '#search-similar') setActiveTab('search', 'similar');
    else if (location.hash === '#search') setActiveTab('search', 'colors');

    // putya: "модалка themes-modal-content должна быть при открытии любой карточки" — та же
    // themesModal, что использует background-finder.js/themes.js/gift-page.js (init создаёт
    // #themes-modal-overlay сама, если его ещё нет). themes-modal.js подключён как type="module" —
    // он выполняется отложенно, поэтому ждём DOMContentLoaded, чтобы window.themesModal точно
    // существовал (наш <script> — обычный, синхронный, выполняется раньше модулей).
    document.addEventListener('DOMContentLoaded', () => {
        if (window.themesModal && window.themesModal.init) {
            window.themesModal.init(SERVER_BASE_URL, API_PHOTO_URL, null, fixedColors);
        }
    });

    Promise.all([loadGiftIdMap(), loadCollectionNames()]).then(([, names]) => populateCollections(names));
    loadCharts();
})();
