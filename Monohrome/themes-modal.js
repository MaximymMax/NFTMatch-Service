// themes-modal.js

// Глобальные переменные модуля
let BASE_URL = '';
let PHOTO_URL = '';
let lazyLoadSetup; // Функция для ленивой загрузки

let modalOverlay, modalContent, modalTitle, modalBackButton;
let currentThemes = [];
let currentGift = '';
let currentModel = '';
const collectionCache = new Map(); // Кэш для коллекций (API Thematic/GetGiftsByCollection)
const gradientCache = new Map();
// --- Новые глобальные переменные ---
let currentView = 'themes'; // 'themes', 'models', 'details'
let currentThemeName = '';
let currentThemeGifts = [];
let currentThemeGroups = [];
let currentSortMode = 'group'; // 'group', 'price', 'count'
let hasColorGroups = false; // ❗️ НОВАЯ ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ
const INIT_DATA_KEY = 'tgInitData';
const BYPASS_KEY_STORAGE = 'apiBypassKey';
let currentBgName = null;

let nftsState = {
    isExpanded: false,
    page: 1,
    pageSize: 18,
    isLoading: false,
    hasMore: true,
    currentGift: null,
    currentModel: null,
    currentBg: null,
    observer: null
};

// Иконка поиска, скопированная из background-finder.js
const searchIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>';

// --- Хелперы ---

async function fetchAndParseMainColors(giftName, modelName) {
    const url = `${BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/MainColors`;
    try {
        const response = await fetch(url, { headers: { 'Authorization': getApiAuthHeader() } });
        if (!response.ok) return [];

        const colorsString = await response.text();
        if (!colorsString) return [];

        const cleanedString = colorsString.trim().replace(/^['"]|['"]$/g, '');
        const colors = cleanedString.split(';').map(item => {
            const parts = item.trim().split(':');
            if (parts.length !== 2) return null;
            return { hex: '#' + parts[1] };
        }).filter(Boolean);
        return colors;

    } catch (error) {
        console.warn('Colors fetch error', error);
        return [];
    }
}

function getPlural(count, one, few, many) {
    count = Math.abs(count);
    count %= 100;
    if (count >= 5 && count <= 20) {
        return many;
    }
    count %= 10;
    if (count === 1) {
        return one;
    }
    if (count >= 2 && count <= 4) {
        return few;
    }
    return many;
}

function getApiAuthHeader() {
    // (Логика скопирована из background-finder.js)
    try {
        const initData = sessionStorage.getItem(INIT_DATA_KEY);
        if (initData) {
            console.log('[AUTH Themes] Using initData from sessionStorage.');
            return `Tma ${initData}`;
        }
    } catch (e) { /* sessionStorage может быть недоступен */ }

    try {
        const bypassKey = sessionStorage.getItem(BYPASS_KEY_STORAGE);
        if (bypassKey) {
            console.warn(`[AUTH Themes] Using TEST BYPASS KEY for API auth.`);
            return `Tma ${bypassKey}`;
        }
    } catch (e) { /* sessionStorage может быть недоступен */ }

    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        const directInitData = window.Telegram.WebApp.initData;
        if (directInitData) {
            console.warn('[AUTH Themes] Using direct initData (fallback) and saving to sessionStorage.');
            try { sessionStorage.setItem(INIT_DATA_KEY, directInitData); } catch (e) { }
            return `Tma ${directInitData}`;
        }
    }

    console.error("[AUTH Themes] Не удалось получить initData или ключ обхода.");
    return 'Tma invalid';
}
window.getApiAuthHeader = getApiAuthHeader;

function getModelPlural(count) {
    return getPlural(count, 'модель', 'модели', 'моделей');
}

function getGiftPlural(count) {
    return getPlural(count, 'подарок', 'подарка', 'подарков');
}

const tonIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="price-icon" width="24" height="24" viewBox="0 0 24 24"><title>Ton SVG Icon</title><path fill="currentColor" d="M19.012 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.882-1.826h10.817c1.033 0 1.873.815 1.873 1.822a1.8 1.8 0 0 1-.274.951M6.51 8.863l4.633 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.004-.72-.484-.72h-4.149z"/></svg>`;

// --- Функции API ---

// Эта функция остается для View 1 (Список тематик)

// --- Функции рендеринга ---

function showLoadingState() {
    // ❗️ ВАЖНО: Если мы переходим в загрузку, убираем режим деталей
    if (modalContent) {
        modalContent.classList.remove('details-mode');
        // ❗️ ДОБАВИТЬ ЭТУ СТРОКУ: Возвращаем стандартные отступы
        modalContent.classList.remove('no-padding');
    }

    modalContent.innerHTML = '<div class="themes-modal-spinner"></div>';
    modalContent.classList.add('loading');
}

function hideLoadingState() {
    modalContent.innerHTML = '';
    modalContent.classList.remove('loading');
}

// ❗️ НОВАЯ ФУНКЦИЯ: Создает карточку модели с новыми данными
function createModelCard(gift, sortMode) {
    const card = document.createElement('div');
    card.className = 'model-in-theme-card';

    const imageUrl = `${PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;

    let statsHtml = '';
    // priceIcon теперь <img>
    const priceIcon = tonIconSvg;
    const countIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1H3zM2 9.5A1.5 1.5 0 013.5 8h13A1.5 1.5 0 0118 9.5v6.042a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.542V9.5z" clip-rule="evenodd" /></svg>`;

    switch (sortMode) {
        case 'price':
            statsHtml = `
                <span class="model-stat-price" title="Цена">
                    ${priceIcon}
                    ${formatPrice(gift.AVGPrice)}
                </span>`;
            break;
        case 'count':
            statsHtml = `
                <span class="model-stat-count" title="Количество">
                    ${countIcon}
                    ${gift.Count}
                </span>`;
            break;
        case 'group':
        default:
            statsHtml = '';
            break;
    }

    card.innerHTML = `
        <div class="img-wrapper">
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                 data-src="${imageUrl}" 
                 alt="${gift.ModelName}" 
                 class="lazy-load">
        </div>
        <div class="info-wrapper">
            <h4>${gift.ModelName}</h4>
            <p>${gift.GiftName}</p>
            <div class="model-stats">
                ${statsHtml}
            </div>
        </div>
    `;

    // ❗️ Клик удален

    return card;
}

// ❗️ НОВАЯ ФУНКЦИЯ: Заполняет сетку (Исправлены проценты и рамка)
function populateModelGrid() {
    const container = document.getElementById('tm-models-grid-container');
    container.innerHTML = '';

    if (currentThemeGifts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Нет подарков.</p>';
        return;
    }

    // 1. Рисуем плашку с выбранным фоном
    if (currentBgName && currentSortMode !== 'count') {
        const bgObj = GLOBAL_COLORS.find(c => c.name === currentBgName || c.id === currentBgName);

        if (bgObj) {
            const bgHeader = document.createElement('div');
            bgHeader.className = 'selected-bg-header';
            bgHeader.innerHTML = `
                <div class="sbh-text-wrapper">
                    <span class="sbh-label">Цвет фона: <span class="sbh-name">${bgObj.name}</span></span>
                </div>
                <div class="sbh-square" style="background: ${bgObj.gradient};"></div>
            `;
            container.appendChild(bgHeader);
        }
    }

    // Режим "По количеству"
    if (currentSortMode === 'count') {
        const sortedGifts = [...currentThemeGifts].sort((a, b) => b.Count - a.Count);
        const wrapper = document.createElement('div');
        wrapper.style.padding = '0 0.5rem';
        const grid = document.createElement('div');
        grid.className = 'models-in-theme-grid';
        sortedGifts.forEach(gift => grid.appendChild(createCountGiftCard(gift)));
        wrapper.appendChild(grid);
        container.appendChild(wrapper);
    }
    // Режим "По цвету" (Кластеры)
    else {
        const groupsMap = {};
        currentThemeGifts.forEach(gift => {
            const gId = gift.GroupId !== undefined ? gift.GroupId : 0;
            if (!groupsMap[gId]) groupsMap[gId] = [];
            groupsMap[gId].push(gift);
        });

        const sortedGroups = currentThemeGroups;

        if (groupsMap[0] && !sortedGroups.find(g => g.GroupId === 0)) {
            sortedGroups.push({ GroupId: 0, AverageColorHex: null, MatchPercentage: 0 });
        }

        sortedGroups.forEach(groupInfo => {
            const giftsInGroup = groupsMap[groupInfo.GroupId];
            if (!giftsInGroup || giftsInGroup.length === 0) return;

            const colorHex = groupInfo.AverageColorHex;

            // ❗️ ФИКС: Получаем сырое значение (например 0.95)
            const rawVal = (groupInfo.MatchPercentage !== undefined)
                ? groupInfo.MatchPercentage
                : (groupInfo.matchPercentage || 0);

            // Умножаем на 100 для процентов (например 95.0)
            const percentVal = rawVal * 100;

            const clusterDiv = document.createElement('div');
            clusterDiv.className = 'theme-group-cluster';

            if (colorHex) {
                // 1. ЛЕВЫЙ БЛОК
                const leftHeader = document.createElement('div');
                leftHeader.className = 'group-header-left';
                leftHeader.innerHTML = `
                    <span class="group-text">Средний цвет:</span>
                    <span class="group-badge" style="background-color:${colorHex}; border: 1px solid rgba(255,255,255,0.2);">${colorHex}</span>
                `;
                clusterDiv.appendChild(leftHeader);

                // 2. ПРАВЫЙ БЛОК: Проверяем уже умноженное значение (>= 30%)
                if (currentBgName && percentVal >= 30) {
                    const rightHeader = document.createElement('div');
                    rightHeader.className = 'group-header-right';
                    // Выводим с одним знаком после запятой (например "95.0%")
                    rightHeader.innerHTML = `
                        <span class="group-percent-text">${percentVal.toFixed(1)}%</span>
                    `;
                    clusterDiv.appendChild(rightHeader);
                }
            }

            const gridDiv = document.createElement('div');
            gridDiv.className = 'models-in-theme-grid';

            giftsInGroup.sort((a, b) => b.Count - a.Count);
            giftsInGroup.forEach(gift => {
                gridDiv.appendChild(createColorGiftCard(gift, colorHex));
            });

            clusterDiv.appendChild(gridDiv);
            container.appendChild(clusterDiv);
        });
    }
}
function createColorGiftCard(gift, gradientColorHex) {
    const card = document.createElement('div');
    card.className = 'model-card-color-mode';

    if (gradientColorHex) {
        card.style.setProperty('--card-gradient-color', gradientColorHex);
    } else {
        card.style.setProperty('--card-gradient-color', 'rgba(255,255,255,0.05)');
    }

    const imgUrl = `${PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;

    card.innerHTML = `
        <div class="mcs-image-box">
            <img src="${imgUrl}" class="mcs-img" loading="lazy" alt="${gift.ModelName}">
        </div>
        <div class="mcs-info">
            <h4 class="mcs-model-name">${gift.ModelName}</h4>
        </div>
    `;

    // Передаем 'card' в функцию клика
    card.addEventListener('click', () => {
        onModelCardClick(gift, card);
    });

    return card;
}

function createCountGiftCard(gift) {
    const card = document.createElement('div');
    card.className = 'model-card-count-mode';
    const imgUrl = `${PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;

    card.innerHTML = `
        <div class="mcs-image-box">
            <img src="${imgUrl}" class="mcs-img" loading="lazy" alt="${gift.ModelName}">
        </div>
        <div class="mcs-info">
            <h4 class="mcs-model-name">${gift.ModelName}</h4>
            <div style="margin-top: 4px; display: flex; justify-content: center;">
                 <span class="count-mode-badge">${gift.Count} шт</span>
            </div>
        </div>
    `;

    // Передаем 'card' в функцию клика
    card.addEventListener('click', () => {
        onModelCardClick(gift, card);
    });

    return card;
}

function createSimpleGiftCard(gift, gradientColorHex) {
    const card = document.createElement('div');
    card.className = 'model-card-simple';

    // ❗️ Устанавливаем переменную CSS для градиента
    if (gradientColorHex) {
        card.style.setProperty('--card-gradient-color', gradientColorHex);
    }

    const imgUrl = `${PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;

    card.innerHTML = `
        <div class="mcs-image-box">
            <img src="${imgUrl}" class="mcs-img" loading="lazy" alt="${gift.ModelName}">
        </div>
        <div class="mcs-info">
            <h4 class="mcs-model-name">${gift.ModelName}</h4>
            <p class="mcs-gift-name">${gift.GiftName}</p>
        </div>
    `;

    // ❗️ Клик удален

    return card;
}

// ❗️ НОВАЯ ФУНКЦИЯ: Рендерит статический UI для View 2
function renderModelListViewUI() {
    hideLoadingState();
    toggleMainHeader(true);

    // ❗️ ДОБАВИТЬ ЭТУ СТРОКУ: Убираем паддинг у контейнера
    modalContent.classList.add('no-padding');

    modalContent.innerHTML = `
        <div class="tm-sort-controls">
            <div class="tm-buttons-wrapper">
                <button class="tm-sort-button active" data-sort="color">Сортировка по цвету</button>
                <button class="tm-sort-button" data-sort="count">Сортировка по кол-ву</button>
            </div>
        </div>
        <div id="tm-models-grid-container">
        </div>
    `;

    // Логика переключения кнопок
    const btns = modalContent.querySelectorAll('.tm-sort-button');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Logic Update
            currentSortMode = btn.dataset.sort;
            populateModelGrid();
        });
    });
}

function formatPrice(price) {
    if (price === null || price === undefined) {
        return 'N/A';
    }
    if (price >= 1000) {
        // Делим на 1000 и оставляем 1 знак после запятой
        return (price / 1000).toFixed(1) + 'k';
    }
    // Убираем .00
    if (Number.isInteger(price)) {
        return price;
    }
    // Оставляем 2 знака для мелочи (напр. 2.47)
    return price.toFixed(2);
}

// ❗️ НОВАЯ ФУНКЦИЯ: Загрузчик для View 2
async function loadAndRenderModelView(collectionName, bgName = null, restoreScrollPos = 0) {
    console.log('%c[loadAndRenderModelView] Start', 'color: orange', { collectionName, bgName, restoreScrollPos });

    showLoadingState();
    toggleMainHeader(true);
    modalTitle.textContent = collectionName;
    currentView = 'models';
    currentThemeName = collectionName;
    currentBgName = bgName;

    const footer = document.querySelector('#themes-modal-overlay .themes-modal-footer');
    if (footer) footer.style.display = 'none';

    let url = `${BASE_URL}/api/Thematic/GetGiftsByCollection/${encodeURIComponent(collectionName)}/WithParameters`;
    if (bgName) url += `/${encodeURIComponent(bgName)}`;

    try {
        let data;
        if (collectionCache.has(url)) {
            data = collectionCache.get(url);
        } else {
            const response = await fetch(url, { headers: { 'Authorization': getApiAuthHeader() } });
            data = await response.json();
            collectionCache.set(url, data);
        }

        currentThemeGifts = data.Gifts || [];
        currentThemeGroups = data.Groups || [];
        currentSortMode = 'group';

        renderModelListViewUI();
        populateModelGrid();

        // ❗️ ФИКС СКРОЛЛА: 
        if (modalContent) {
            // 1. Убираем класс режима деталей
            modalContent.classList.remove('details-mode');

            // 2. Очищаем инлайн-стили, чтобы работал CSS (min-height: 0)
            modalContent.style.removeProperty('display');
            modalContent.style.removeProperty('overflow-y');

            // 3. Восстанавливаем позицию
            if (restoreScrollPos > 0) {
                setTimeout(() => {
                    modalContent.scrollTop = restoreScrollPos;
                }, 10);
            } else {
                modalContent.scrollTop = 0;
            }
        }

    } catch (e) {
        console.error('[loadAndRenderModelView] Error:', e);
        modalContent.innerHTML = '<p style="text-align:center; margin-top:2rem;">Ошибка загрузки коллекции</p>';
    }
}

async function onModelCardClick(gift, cardElement) {
    if (cardElement) {
        if (cardElement.classList.contains('loading-click')) return;
        cardElement.classList.add('loading-click');
        const spinner = document.createElement('div');
        spinner.className = 'card-click-loader';
        spinner.innerHTML = '<span class="loading-spinner-mini" style="width:20px; height:20px; border-width:2px; border-color: rgba(255,255,255,0.5); border-top-color: #fff;"></span>';
        cardElement.appendChild(spinner);
    }

    try {
        const themesUrl = `${BASE_URL}/api/Thematic/GetCollectionByGift/${encodeURIComponent(gift.GiftName)}/${encodeURIComponent(gift.ModelName)}/WithParameters`;
        const similarUrl = `${BASE_URL}/api/MonoCoof/SimilarNFTs`;
        const colorsUrl = `${BASE_URL}/api/ListGifts/${encodeURIComponent(gift.GiftName)}/${encodeURIComponent(gift.ModelName)}/MainColors`;

        const similarBody = {
            NameTargetGift: gift.GiftName,
            NameTargetModel: gift.ModelName,
            MonohromeModelsOnly: true
        };

        const promises = [
            fetch(themesUrl, { headers: { 'Authorization': getApiAuthHeader() } }).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(similarUrl, { method: 'POST', headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(similarBody) }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(colorsUrl, { headers: { 'Authorization': getApiAuthHeader() } }).then(r => r.ok ? r.text() : '').catch(() => '')
        ];

        let bgScorePromise = Promise.resolve(null);
        let countPromise = Promise.resolve(null);

        if (currentBgName) {
            const bgScoreUrl = `${BASE_URL}/api/MonoCoof/TopBackgroundColorsByNFT`;
            const bgScoreBody = {
                NameGift: gift.GiftName,
                NameModel: gift.ModelName
            };
            bgScorePromise = fetch(bgScoreUrl, {
                method: 'POST',
                headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(bgScoreBody)
            }).then(r => r.ok ? r.json() : []).catch(() => []);

            const countUrl = `${BASE_URL}/api/ListGifts/SearchGifts/1/1`;
            const countBody = { GiftName: gift.GiftName, ModelName: gift.ModelName, BackgroundName: currentBgName };
            countPromise = fetch(countUrl, {
                method: 'POST',
                headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(countBody)
            }).then(r => r.ok ? r.json() : null).catch(() => null);
        }

        promises.push(bgScorePromise);
        promises.push(countPromise);

        const [themesData, similarData, colorsText, bgScoreData, countData] = await Promise.all(promises);

        let parsedColors = [];
        if (colorsText) {
            const cleanedString = colorsText.trim().replace(/^['"]|['"]$/g, '');
            parsedColors = cleanedString.split(';').map(item => {
                const parts = item.trim().split(':');
                if (parts.length !== 2) return null;
                return { hex: '#' + parts[1] };
            }).filter(Boolean);
        }

        // ❗️ ФИКС СКРОЛЛА: Запоминаем текущую позицию скролла перед уходом
        const currentScrollPos = modalContent ? modalContent.scrollTop : 0;

        pushToHistory(() => {
            // Передаем сохраненную позицию обратно в функцию рендера
            loadAndRenderModelView(currentThemeName, currentBgName, currentScrollPos);
        });

        // --- ЛОГИКА ФОНА И ПРОЦЕНТОВ ---
        let bgDataForDetails = null;
        let finalCount = gift.Count;

        if (currentBgName) {
            const colorObj = GLOBAL_COLORS.find(c => c.name === currentBgName || c.id === currentBgName);

            // Всегда создаем bgDataForDetails, если есть colorObj
            if (colorObj) {
                let matchPercent = 0;
                if (bgScoreData && Array.isArray(bgScoreData)) {
                    const exactMatch = bgScoreData.find(x => x.Key === currentBgName || x.Key === colorObj?.id);
                    if (exactMatch) {
                        matchPercent = (exactMatch.Value * 100).toFixed(1);
                    }
                }
                if (countData && typeof countData.TotalCount === 'number') {
                    finalCount = countData.TotalCount;
                }

                bgDataForDetails = {
                    name: colorObj.name,
                    gradient: colorObj.gradient,
                    matchPercent: matchPercent
                };
            }
        }

        const modelDataWithExactCount = {
            ...gift,
            Count: finalCount
        };

        // В renderModelDetailView уже есть logic: modalContent.scrollTop = 0;
        // поэтому при открытии деталей скролл всегда будет сбрасываться (как и требовалось).
        renderModelDetailView(modelDataWithExactCount, {
            themes: themesData,
            similar: similarData,
            colors: parsedColors,
            bgData: bgDataForDetails
        });

    } catch (e) {
        console.error("Error opening details:", e);
    } finally {
        if (cardElement) {
            cardElement.classList.remove('loading-click');
            const spinner = cardElement.querySelector('.card-click-loader');
            if (spinner) spinner.remove();
        }
    }
}

/**
 * Рендерит View 1: Список тематик (Почти без изменений)
 */
function renderThemeListView() {
    showLoadingState();
    toggleMainHeader(true);
    modalTitle.textContent = `${currentGift} - ${currentModel}`; // Заголовок
    currentView = 'themes';

    // Подвал можно показать
    const footer = document.querySelector('#themes-modal-overlay .themes-modal-footer');
    if (footer) footer.style.display = 'block';

    hideLoadingState();
    updateBackButtonState(); // Обновляем кнопку

    const grid = document.createElement('div');
    grid.className = 'themes-list-container';

    currentThemes.forEach(collection => {
        // ... (код создания карточки theme-card-modern остается тем же) ...
        // ВАЖНО: Копируем весь код создания карточки из предыдущего ответа

        const card = document.createElement('div');
        card.className = 'theme-card-modern';
        const clusterHex = collection.ClusterAverageColorHex || '#38bdf8';
        card.style.setProperty('--glow-color', clusterHex);

        // ... генерация HTML карточки ...
        // (Оставил сокращенно для читаемости, используйте ваш код генерации HTML)
        const count = collection.CountGiftsInTheme;
        let iconsHtml = '';
        collection.TopGifts.slice(0, 3).forEach(g => {
            const imgUrl = `${PHOTO_URL}/${encodeURIComponent(g.GiftName)}/png/${encodeURIComponent(g.ModelName)}.png`;
            iconsHtml += `<div class="tc-icon-box" style="--icon-bg: ${clusterHex};"><img src="${imgUrl}" class="tc-icon-img"></div>`;
        });

        card.innerHTML = `
            <div class="tc-left">
                <div class="tc-title">${collection.CollectionName}</div>
                <div class="tc-subtitle">${count} ${getPlural(count, 'модель', 'модели', 'моделей')}</div>
            </div>
            <div class="tc-right">
                <div class="tc-glow" style="--glow-color: ${clusterHex};"></div>
                <div class="tc-icons-group">${iconsHtml}</div>
                <div class="tc-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></div>
            </div>
        `;
        if (collection.ClusterAverageColorHex) {
            fetchAndApplyThemeGradient(card, collection.ClusterAverageColorHex);
        }

        // ❗️ КЛИК ПО ТЕМЕ
        card.addEventListener('click', () => {
            // Сохраняем текущее состояние в стек
            pushToHistory(() => {
                renderThemeListView(); // Функция восстановления этого экрана
            });
            // Переходим дальше
            loadAndRenderModelView(collection.CollectionName);
        });

        grid.appendChild(card);
    });

    modalContent.appendChild(grid);
}



async function renderSimilarGiftsButtonForDetailView(container, giftName, modelName) {
    // 1. Показываем лоадер
    container.innerHTML = `
        <span style="font-size: 0.9rem; color: var(--text-muted); display: block; text-align: center; margin-top: 1rem;">
            <span class="loading-spinner-mini" style="width:14px; height: 14px; border-width: 2px;"></span>
            Загрузка...
        </span>`;

    let bgColor = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
    let textColor = '#ffffff';
    let textShadowStyle = '0 1px 2px rgba(0,0,0,0.4)';
    let customBoxShadow = '';

    if (mainColors && mainColors.length > 0) {
        // Считаем средний цвет
        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        // Берем до 3х цветов
        const colorsToUse = mainColors.slice(0, 3);

        colorsToUse.forEach(c => {
            const hex = c.hex.replace('#', '');
            if (hex.length === 6) {
                rSum += parseInt(hex.substring(0, 2), 16);
                gSum += parseInt(hex.substring(2, 4), 16);
                bSum += parseInt(hex.substring(4, 6), 16);
                count++;
            }
        });

        if (count > 0) {
            const r = Math.round(rSum / count);
            const g = Math.round(gSum / count);
            const b = Math.round(bSum / count);

            // Считаем яркость по стандарту W3C (более точная формула)
            // Brightness = (R * 299 + G * 587 + B * 114) / 1000
            const brightness = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);

            // Порог 128 - граница. Если ярче 128, текст темный.
            if (brightness > 140) { // Чуть выше порог для уверенности
                textColor = '#1e2944'; // Темно-синий текст
                textShadowStyle = 'none';
                customBoxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.4)';
            } else {
                textColor = '#f1f5fa'; // Светлый текст
                textShadowStyle = '0 1px 2px rgba(0,0,0,0.4)';
            }

            // Градиент из среднего цвета в чуть более темный/насыщенный
            bgColor = `linear-gradient(180deg, rgba(${r},${g},${b}, 1) 0%, rgba(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)}, 1) 100%)`;
        }
    }

    // 2. Используем правильный API (POST)
    const similarUrl = `${BASE_URL}/api/MonoCoof/SimilarNFTs`;
    const body = {
        NameTargetGift: giftName,
        NameTargetModel: modelName,
        MonohromeModelsOnly: true
    };

    try {
        // Параллельно грузим похожие NFT и цвета для кнопки
        const [responseData, mainColors] = await Promise.all([
            fetch(similarUrl, {
                method: 'POST',
                headers: {
                    'Authorization': getApiAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }).then(r => r.json()),
            fetchAndParseMainColors(giftName, modelName)
        ]);

        // --- ЛОГИКА ЦВЕТА КНОПКИ (из background-finder.js) ---
        let bgColor = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
        let textColor = '#ffffff';
        let textShadowStyle = '0 1px 2px rgba(0,0,0,0.4)';
        let customBoxShadow = '';
        let customBorder = '';

        if (mainColors && mainColors.length > 0) {
            const hex = mainColors[0].hex;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);

            const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b);

            if (luminance > 160) {
                textColor = '#1e2944'; // Темный текст для светлого фона
                textShadowStyle = 'none';
                customBoxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.4)';
                customBorder = '1px solid rgba(0, 0, 0, 0.1)';
            } else {
                textColor = '#f1f5fa';
            }
            bgColor = `linear-gradient(180deg, rgba(${r},${g},${b}, 1) 0%, rgba(${r},${g},${b}, 0.85) 100%)`;
        }

        // --- ЛОГИКА ПОДБОРА КАРТИНОК ---
        let allCandidates = [];
        if (responseData) {
            Object.keys(responseData).forEach(gName => {
                const groupData = responseData[gName];
                if (groupData && groupData.SimilarModels) {
                    groupData.SimilarModels.forEach(m => {
                        if (gName === giftName && m.Key === modelName) return;
                        allCandidates.push({ gift: gName, model: m.Key, score: m.Value });
                    });
                }
            });
        }

        if (allCandidates.length === 0) {
            container.innerHTML = '';
            return;
        }

        allCandidates.sort((a, b) => b.score - a.score);
        const topCandidates = allCandidates.slice(0, 10);
        let item1, item2;

        if (topCandidates.length > 0) {
            const idx1 = Math.floor(Math.random() * topCandidates.length);
            item1 = topCandidates[idx1];

            // Пытаемся найти из другой коллекции или хотя бы другую модель
            const diffColl = topCandidates.filter(c => c.gift !== item1.gift);
            if (diffColl.length > 0) {
                item2 = diffColl[Math.floor(Math.random() * diffColl.length)];
            } else {
                const diffMod = topCandidates.filter(c => c.model !== item1.model);
                if (diffMod.length > 0) item2 = diffMod[Math.floor(Math.random() * diffMod.length)];
            }
        }

        // --- РЕНДЕРИНГ ---
        const href = `../nft-page/index.html?giftName=${encodeURIComponent(giftName)}&modelName=${encodeURIComponent(modelName)}&randomGiftsCount=100`;
        const btn = document.createElement('a');
        btn.className = 'similar-color-btn';
        btn.href = href;

        btn.style.background = bgColor;
        btn.style.color = textColor + ' !important';
        btn.style.textShadow = textShadowStyle;
        if (customBoxShadow) btn.style.boxShadow = customBoxShadow;
        if (customBorder) btn.style.border = customBorder;

        const img1 = item1 ? `<img src="${PHOTO_URL}/${encodeURIComponent(item1.gift)}/png/${encodeURIComponent(item1.model)}.png" class="similar-btn-icon" alt="">` : '';
        const img2 = item2 ? `<img src="${PHOTO_URL}/${encodeURIComponent(item2.gift)}/png/${encodeURIComponent(item2.model)}.png" class="similar-btn-icon" alt="">` : '';

        btn.innerHTML = `
            ${img1}
            Похожие по цвету
            ${img2}
        `;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = href;
        });

        container.innerHTML = '';
        container.appendChild(btn);

    } catch (error) {
        console.warn("[Similar Button] Error:", error);
        container.innerHTML = '';
    }
}

function updateThemesRowUI(themesValEl, themes, modelData, fullData) {
    if (themes && themes.length > 0) {
        const count = themes.length;
        const plural = getPlural(count, 'тематика', 'тематики', 'тематик');

        themesValEl.innerHTML = `${count} ${plural} <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:14px; height:14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>`;
        themesValEl.classList.add('link-style');
        themesValEl.style.cursor = 'pointer';
        themesValEl.style.color = '';

        themesValEl.onclick = () => {
            // ❗️ ВАЖНО: Передаем fullData в renderModelDetailView при возврате.
            // Теперь при нажатии "Назад" из списка тем, fetch не сработает, так как данные уже есть.
            pushToHistory(() => renderModelDetailView(modelData, fullData));

            currentThemes = themes;
            currentGift = modelData.GiftName;
            currentModel = modelData.ModelName;
            renderThemeListView();
        };
    } else {
        setNoThemes(themesValEl);
    }
}

/**
 * Рендерит View 3: Детали (Без изменений, но заголовок теперь ставится из themeData)
 */
async function renderModelDetailView(modelData, preloadedData = null) {
    currentView = 'details';
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
    modalContent.innerHTML = '';
    modalContent.classList.remove('loading');
    modalContent.classList.add('details-mode');
    toggleMainHeader(false);
    const footer = document.querySelector('#themes-modal-overlay .themes-modal-footer');
    if (footer) footer.style.display = 'none';

    const lottieUrl = `${PHOTO_URL}/${encodeURIComponent(modelData.GiftName)}/lottie/${encodeURIComponent(modelData.ModelName)}.json`;
    const searchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px; height:16px; min-width:16px; display:inline-block; vertical-align:middle; margin-left:4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>`;

    let bgStyle = 'background: transparent;';
    let bgNameDisplay = '<span class="info-value dash" style="color: var(--text-muted); font-weight: 400;">—</span>';
    let compatDisplay = '<span class="info-value dash" style="color: var(--text-muted); font-weight: 400;">—</span>';
    let bgNameForNFTs = null;

    if (preloadedData && preloadedData.bgData) {
        const bg = preloadedData.bgData;

        if (bg.gradient) {
            bgStyle = `background: ${bg.gradient};`;
        }

        if (bg.name) {
            bgNameForNFTs = bg.name;
            const bgLinkUrl = `./background-finder.html?mode=findModels&gift=${encodeURIComponent(modelData.GiftName)}&color=${encodeURIComponent(bg.name)}`;
            bgNameDisplay = `<a href="${bgLinkUrl}" class="info-value link-style" title="Искать модели для этого фона">${bg.name} ${searchIconSvg}</a>`;

            if (bg.matchPercent && parseFloat(bg.matchPercent) > 0) {
                compatDisplay = `<span class="info-value compat">${bg.matchPercent}%</span>`;
            } else {
                compatDisplay = '<span class="info-value dash" style="color: var(--text-muted); font-weight: 400;">—</span>';
            }
        }
    }

    let nftsSectionHtml = '';
    if (bgNameForNFTs) {
        // 🔥 ИЗМЕНЕНИЕ: Используем уникальные ID с префиксом tm-
        nftsSectionHtml = `
            <div class="nfts-section-container">
                <div class="nfts-header" id="tm-nfts-toggle-header">
                    <span class="nfts-header-line"></span>
                    <span class="nfts-header-title">Найденные NFT</span>
                    <svg id="tm-nfts-arrow" class="nfts-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    <span class="nfts-header-line"></span>
                </div>
                <div id="tm-nfts-grid-container" class="nfts-grid hidden"></div>
                <div id="tm-nfts-loading-indicator" class="nfts-loading hidden">
                    <span class="loading-spinner-mini" style="display: inline-block; width: 18px; height: 18px; border: 2px solid #227da9; border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                </div>
            </div>`;
    }

    modalContent.innerHTML = `
        <div class="details-content-wrapper"> 
            <div class="details-modal-header">
                <button id="dm-back-btn" class="themes-modal-back-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                </button>
                <h3 class="modal-title">${modelData.ModelName}</h3>
                <button id="dm-close-btn" class="themes-modal-close-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div class="modal-visual-area" style="${bgStyle}">
                <lottie-player src="${lottieUrl}" background="transparent" speed="1" loop autoplay></lottie-player>
            </div>
            
            <div class="modal-info info-table">
                <div class="info-row">
                    <span class="info-label">Модель</span>
                    <a href="../Monohrome/background-finder.html?mode=findBgs&gift=${encodeURIComponent(modelData.GiftName)}&model=${encodeURIComponent(modelData.ModelName)}" class="info-value link-style" title="Найти фоны для этой модели">
                        ${modelData.ModelName} ${searchIconSvg}
                    </a>
                </div>
                <div class="info-row">
                    <span class="info-label">Фон</span>
                    ${bgNameDisplay}
                </div>
                <div class="info-row">
                    <span class="info-label">Совпадение</span>
                    ${compatDisplay}
                </div>
                <div class="info-row">
                    <span class="info-label">Количество</span>
                    <span class="info-value count">${modelData.Count || '-'} шт.</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                    <span class="info-label">Тематики</span>
                    <span id="tm-model-themes-val" class="info-value link-style" style="cursor: pointer;"></span>
                </div>
            </div>
            
            <div class="gold-button-container" id="tm-similar-btn-container" style="margin-top: 1.5rem; margin-bottom: 1rem;"></div>

            ${nftsSectionHtml}
        </div>
    `;

    document.getElementById('dm-close-btn').addEventListener('click', () => close());
    const backBtn = document.getElementById('dm-back-btn');
    if (navigationStack.length > 0 || onBackCallback) {
        backBtn.style.visibility = 'visible';
        backBtn.addEventListener('click', handleBackNavigation);
    } else {
        backBtn.style.visibility = 'hidden';
    }

    let currentFullData = { themes: [], similar: null, colors: [] };
    const themesValEl = document.getElementById('tm-model-themes-val');
    const btnContainer = document.getElementById('tm-similar-btn-container');

    if (preloadedData && (preloadedData.themes || preloadedData.similar || preloadedData.colors)) {
        currentFullData = preloadedData;
    } else {
        themesValEl.innerHTML = '<span class="loading-spinner-mini" style="width:14px; height:14px; border-width: 2px;"></span>';
        try {
            const [themes, similar, colorsText] = await Promise.all([
                fetch(`${BASE_URL}/api/Thematic/GetCollectionByGift/${encodeURIComponent(modelData.GiftName)}/${encodeURIComponent(modelData.ModelName)}/WithParameters`, { headers: { 'Authorization': getApiAuthHeader() } }).then(r => r.json()),
                fetch(`${BASE_URL}/api/MonoCoof/SimilarNFTs`, { method: 'POST', headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify({ NameTargetGift: modelData.GiftName, NameTargetModel: modelData.ModelName, MonohromeModelsOnly: true }) }).then(r => r.json()),
                fetch(`${BASE_URL}/api/ListGifts/${encodeURIComponent(modelData.GiftName)}/${encodeURIComponent(modelData.ModelName)}/MainColors`, { headers: { 'Authorization': getApiAuthHeader() } }).then(r => r.text())
            ]);
            let parsedColors = [];
            if (colorsText) {
                parsedColors = colorsText.trim().replace(/^['"]|['"]$/g, '').split(';').map(item => {
                    const parts = item.trim().split(':');
                    return (parts.length === 2) ? { hex: '#' + parts[1] } : null;
                }).filter(Boolean);
            }
            currentFullData = { themes, similar, colors: parsedColors, bgData: preloadedData ? preloadedData.bgData : null };
        } catch (e) { console.error(e); }
    }

    updateThemesRowUI(themesValEl, currentFullData.themes, modelData, currentFullData);
    renderSimilarButtonWithData(btnContainer, modelData.GiftName, modelData.ModelName, currentFullData.similar, currentFullData.colors);

    if (bgNameForNFTs) {
        setTimeout(() => {
            // Используем глобальную функцию из themes-modal-nfts.js с проверкой подписки
            if (typeof window.initNFTsSection === 'function') {
                window.initNFTsSection(modelData.GiftName, modelData.ModelName, bgNameForNFTs);
            } else {
                initNFTsSection(modelData.GiftName, modelData.ModelName, bgNameForNFTs);
            }
        }, 0);
    }
}

function setNoThemes(el) {
    el.classList.remove('link-style');
    el.style.cursor = 'default';
    el.style.color = 'var(--text-muted)';
    el.textContent = 'Нет';
}

async function openModelDetail(giftName, modelName, bgName = null, onBack = null) {
    if (typeof bgName === 'function') {
        onBack = bgName;
        bgName = null;
    }

    onBackCallback = onBack;
    navigationStack = [];

    currentGift = giftName;
    currentModel = modelName;
    currentBgName = bgName;

    // ❗️ СБРОС СОСТОЯНИЯ NFT ПРИ ОТКРЫТИИ НОВОЙ МОДАЛКИ
    nftsState = {
        isExpanded: false, // Всегда свернуто при открытии
        page: 1,
        pageSize: 18,
        isLoading: false,
        hasMore: true,
        currentGift: giftName,
        currentModel: modelName,
        currentBg: bgName,
        observer: null
    };

    document.body.classList.add('modal-open');
    if (modalOverlay) modalOverlay.classList.remove('hidden');

    updateBackButtonState();
    showLoadingState();
    toggleMainHeader(false);

    const cleanBaseUrl = BASE_URL.replace(/\/$/, '');

    try {
        let countUrl;
        if (bgName) {
            countUrl = `${cleanBaseUrl}/api/BaseInfo/GetCountGiftByNameAndBackground/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/${encodeURIComponent(bgName)}`;
        } else {
            countUrl = `${cleanBaseUrl}/api/BaseInfo/GetCountGiftByName/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}`;
        }

        const similarUrl = `${cleanBaseUrl}/api/MonoCoof/SimilarNFTs`;
        const similarBody = { NameTargetGift: giftName, NameTargetModel: modelName, MonohromeModelsOnly: true };

        const [countData, themesData, similarData, colorsText, bgScoreData] = await Promise.all([
            fetch(countUrl, { headers: { 'Authorization': getApiAuthHeader() } }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`${cleanBaseUrl}/api/Thematic/GetCollectionByGift/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/WithParameters`, { headers: { 'Authorization': getApiAuthHeader() } }).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(similarUrl, { method: 'POST', headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(similarBody) }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`${cleanBaseUrl}/api/ListGifts/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/MainColors`, { headers: { 'Authorization': getApiAuthHeader() } }).then(r => r.ok ? r.text() : '').catch(() => ''),
            bgName ? fetch(`${cleanBaseUrl}/api/MonoCoof/TopBackgroundColorsByNFT`, { method: 'POST', headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify({ NameGift: giftName, NameModel: modelName }) }).then(r => r.ok ? r.json() : []).catch(() => []) : Promise.resolve(null)
        ]);

        let countVal = 0;
        if (countData) {
            if (typeof countData === 'object' && countData.Count !== undefined) {
                countVal = countData.Count;
            } else if (typeof countData === 'number') {
                countVal = countData;
            }
        }

        let parsedColors = [];
        if (colorsText) {
            const cleanedString = colorsText.trim().replace(/^['"]|['"]$/g, '');
            parsedColors = cleanedString.split(';').map(item => {
                const parts = item.trim().split(':');
                if (parts.length !== 2) return null;
                return { hex: '#' + parts[1] };
            }).filter(Boolean);
        }

        let bgDataForDetails = null;
        if (bgName && GLOBAL_COLORS) {
            const colorObj = GLOBAL_COLORS.find(c => c.name === bgName || c.id === bgName);
            let matchPercent = 0;
            if (bgScoreData && Array.isArray(bgScoreData)) {
                const exactMatch = bgScoreData.find(x => x.Key === bgName || (colorObj && x.Key === colorObj.id));
                if (exactMatch) {
                    matchPercent = (exactMatch.Value * 100).toFixed(1);
                }
            }
            if (colorObj) {
                bgDataForDetails = {
                    name: colorObj.name,
                    gradient: colorObj.gradient,
                    matchPercent: matchPercent
                };
            }
        }

        const targetGiftData = {
            GiftName: giftName,
            ModelName: modelName,
            Count: countVal,
        };

        renderModelDetailView(targetGiftData, {
            themes: themesData,
            similar: similarData,
            colors: parsedColors,
            bgData: bgDataForDetails
        });

    } catch (e) {
        console.error("openModelDetail Error:", e);
        modalContent.innerHTML = `<div style="padding:2rem; text-align:center; color:#f87171;">Не удалось загрузить данные</div>`;
    }
}

// 4. НОВАЯ ФУНКЦИЯ РЕНДЕРА КНОПКИ (СИНХРОННАЯ, ДАННЫЕ ЕСТЬ)
// --- ЗАМЕНИТЬ ФУНКЦИЮ ПОЛНОСТЬЮ: renderSimilarButtonWithData ---
// --- ЗАМЕНИТЬ ФУНКЦИЮ ПОЛНОСТЬЮ: renderSimilarButtonWithData ---
function renderSimilarButtonWithData(container, giftName, modelName, responseData, mainColors) {
    // Значения по умолчанию
    let bgColor = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
    let textColor = '#ffffff';
    let customBorder = '';

    if (mainColors && mainColors.length > 0) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const colorsToUse = mainColors.slice(0, 3);

        colorsToUse.forEach(c => {
            const hex = c.hex.replace('#', '');
            if (hex.length === 6) {
                rSum += parseInt(hex.substring(0, 2), 16);
                gSum += parseInt(hex.substring(2, 4), 16);
                bSum += parseInt(hex.substring(4, 6), 16);
                count++;
            }
        });

        if (count > 0) {
            const r = Math.round(rSum / count);
            const g = Math.round(gSum / count);
            const b = Math.round(bSum / count);

            // Яркость фона
            const brightness = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);

            // --- СМЯГЧЕННАЯ ЛОГИКА ЦВЕТОВ ---

            if (brightness > 140) {
                // === ФОН СВЕТЛЫЙ ===
                // Было 0.35 (очень темно). Стало 0.45 (чуть мягче, но читаемо)
                const factor = 0.45;
                const tr = Math.round(r * factor);
                const tg = Math.round(g * factor);
                const tb = Math.round(b * factor);
                textColor = `rgb(${tr}, ${tg}, ${tb})`;
                customBorder = 'none';
            } else {
                // === ФОН ТЕМНЫЙ ===
                // Было 0.85 (почти белый). Стало 0.7 (более цветной, "пастельный")
                const mix = 0.70;
                const tr = Math.round(r + (255 - r) * mix);
                const tg = Math.round(g + (255 - g) * mix);
                const tb = Math.round(b + (255 - b) * mix);
                textColor = `rgb(${tr}, ${tg}, ${tb})`;
            }

            // Градиент фона
            bgColor = `linear-gradient(180deg, rgba(${r},${g},${b}, 1) 0%, rgba(${Math.max(0, r - 20)},${Math.max(0, g - 20)},${Math.max(0, b - 20)}, 1) 100%)`;
        }
    }

    // --- ЛОГИКА ПОДБОРА КАРТИНОК ---
    let allCandidates = [];
    if (responseData) {
        Object.keys(responseData).forEach(gName => {
            const groupData = responseData[gName];
            if (groupData && groupData.SimilarModels) {
                groupData.SimilarModels.forEach(m => {
                    if (gName === giftName && m.Key === modelName) return;
                    allCandidates.push({ gift: gName, model: m.Key, score: m.Value });
                });
            }
        });
    }

    if (allCandidates.length === 0) {
        container.innerHTML = '';
        return;
    }

    allCandidates.sort((a, b) => b.score - a.score);
    const topCandidates = allCandidates.slice(0, 10);
    let item1, item2;

    if (topCandidates.length > 0) {
        const idx1 = Math.floor(Math.random() * topCandidates.length);
        item1 = topCandidates[idx1];
        const diffColl = topCandidates.filter(c => c.gift !== item1.gift);
        if (diffColl.length > 0) {
            item2 = diffColl[Math.floor(Math.random() * diffColl.length)];
        } else {
            const diffMod = topCandidates.filter(c => c.model !== item1.model);
            if (diffMod.length > 0) item2 = diffMod[Math.floor(Math.random() * diffMod.length)];
        }
    }

    // --- РЕНДЕРИНГ ---
    const href = `../nft-page/index.html?giftName=${encodeURIComponent(giftName)}&modelName=${encodeURIComponent(modelName)}&randomGiftsCount=100`;
    const btn = document.createElement('a');
    btn.className = 'similar-color-btn';
    btn.href = href;

    btn.style.background = bgColor;
    btn.style.setProperty('color', textColor, 'important');
    btn.style.textShadow = 'none';

    if (customBorder) btn.style.border = customBorder;

    // --- ФИКС ВЫРАВНИВАНИЯ ---
    // 1. Добавляем display:block для картинок, чтобы они не ломали строку
    const imgStyle = 'display:block; margin:0;';
    const img1 = item1 ? `<img src="${PHOTO_URL}/${encodeURIComponent(item1.gift)}/png/${encodeURIComponent(item1.model)}.png" class="similar-btn-icon" style="${imgStyle}" alt="">` : '';
    const img2 = item2 ? `<img src="${PHOTO_URL}/${encodeURIComponent(item2.gift)}/png/${encodeURIComponent(item2.model)}.png" class="similar-btn-icon" style="${imgStyle}" alt="">` : '';

    // 2. Оборачиваем текст в SPAN и даем ему line-height: 1 для вертикального центра
    btn.innerHTML = `
        ${img1}
        <span style="display:inline-block; line-height:1; padding-top:1px;">Похожие по цвету</span>
        ${img2}
    `;

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = href;
    });

    container.innerHTML = '';
    container.appendChild(btn);
}
// --- Публичные методы ---

function toggleMainHeader(show) {
    const header = document.querySelector('.themes-modal-header');
    if (header) {
        header.style.display = show ? 'grid' : 'none';
    }
}

async function openCollection(collectionName, bgName = null) {
    navigationStack = []; // Очищаем историю

    document.body.classList.add('modal-open');
    if (modalOverlay) modalOverlay.classList.remove('hidden');

    updateBackButtonState();

    // Передаем фон в функцию загрузки
    await loadAndRenderModelView(collectionName, bgName);
}

async function open(giftName, modelName, onBack) {
    onBackCallback = onBack;
    navigationStack = []; // ❗️ Очищаем историю при новом открытии

    currentGift = giftName;
    currentModel = modelName;

    document.body.classList.add('modal-open');
    if (!modalOverlay) return;

    modalOverlay.classList.remove('hidden');
    updateBackButtonState();

    // Показываем лоадер
    showLoadingState();
    modalTitle.textContent = modelName;

    const url = `${BASE_URL}/api/Thematic/GetCollectionByGift/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/WithParameters`;

    try {
        const response = await fetch(url, { headers: { 'Authorization': getApiAuthHeader() } });
        if (!response.ok) throw new Error('API Error');
        const themes = await response.json();

        // Сохраняем глобально
        currentThemes = themes;

        // --- ИЗМЕНЕНИЕ: ЛОГИКА АВТОПЕРЕХОДА ---
        if (themes && themes.length === 1) {
            // Если тема одна — сразу открываем её
            const singleThemeName = themes[0].CollectionName;

            // Важно: Не пушим в историю (stack), чтобы кнопка "Назад" 
            // закрывала модалку, а не возвращала на пропущенный список.
            loadAndRenderModelView(singleThemeName);
        } else {
            // Если тем несколько или 0 — показываем список как обычно
            renderThemeListView();
        }
        // -------------------------------------

    } catch (e) {
        console.error(e);
        modalContent.innerHTML = '<p style="text-align:center; margin-top:2rem; color:#f87171;">Ошибка загрузки</p>';
    }
}

function renderThemes(themes) {
    modalContent.innerHTML = '';
    modalContent.classList.remove('loading');

    const container = document.createElement('div');
    container.className = 'themes-list-container';

    if (!themes || themes.length === 0) {
        modalContent.innerHTML = '<p style="text-align:center; margin-top:2rem; color:#6b7fa7;">Нет доступных тематик</p>';
        return;
    }

    themes.forEach(theme => {
        const card = document.createElement('div');
        card.className = 'theme-card-modern';

        // Исходный цвет (Hex)
        const clusterHex = theme.ClusterAverageColorHex || '#38bdf8';

        // Свечение используем сразу (Hex с прозрачностью в CSS)
        card.style.setProperty('--glow-color', clusterHex);

        const count = theme.CountGiftsInTheme;
        const countText = `${count} ${getPlural(count, 'модель', 'модели', 'моделей')}`;

        // Формируем иконки. Изначально ставим --icon-bg = Hex
        let iconsHtml = '';
        const displayGifts = theme.TopGifts.slice(0, 3);

        displayGifts.forEach(gift => {
            const imgUrl = `${PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;
            iconsHtml += `
                <div class="tc-icon-box" style="--icon-bg: ${clusterHex};">
                    <img src="${imgUrl}" class="tc-icon-img" loading="lazy" alt="">
                </div>
            `;
        });

        card.innerHTML = `
            <div class="tc-left">
                <div class="tc-title">${theme.CollectionName}</div>
                <div class="tc-subtitle">${countText}</div>
            </div>
            
            <div class="tc-right">
                <div class="tc-glow" style="--glow-color: ${clusterHex};"></div>
                <div class="tc-icons-group">
                    ${iconsHtml}
                </div>
                <div class="tc-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            loadAndRenderModelView(theme.CollectionName);
        });

        // ❗️ ЗАПУСКАЕМ ПОЛУЧЕНИЕ ГРАДИЕНТА ДЛЯ ЭТОЙ ТЕМЫ ❗️
        if (theme.ClusterAverageColorHex) {
            fetchAndApplyThemeGradient(card, theme.ClusterAverageColorHex);
        }

        container.appendChild(card);
    });

    modalContent.appendChild(container);
}

async function fetchAndApplyThemeGradient(cardElement, hexColor) {
    // 1. Проверяем кэш
    if (gradientCache.has(hexColor)) {
        const cachedGradient = gradientCache.get(hexColor);
        // Применяем сразу из памяти
        const iconBoxes = cardElement.querySelectorAll('.tc-icon-box');
        iconBoxes.forEach(box => {
            box.style.setProperty('--icon-bg', cachedGradient);
        });
        return;
    }

    // URL: MonoCoof/TopBackgroundColorsByColors?top=1
    const url = `${BASE_URL}/api/MonoCoof/TopBackgroundColorsByColors?top=1`;

    // Тело запроса: список цветов
    const body = {
        Colors: [hexColor]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': getApiAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const data = await response.json();
            // Ожидаем массив: [{ Key: "Amber", Value: 0.99 }]

            if (data && data.length > 0) {
                const bgName = data[0].Key; // Название фона, например "Amber"

                // Ищем этот фон в глобальном списке цветов (он передан в init)
                const colorObj = GLOBAL_COLORS.find(c => c.name === bgName || c.id === bgName);

                if (colorObj && colorObj.gradient) {
                    // 2. Сохраняем в кэш
                    gradientCache.set(hexColor, colorObj.gradient);

                    // 3. Применяем
                    const iconBoxes = cardElement.querySelectorAll('.tc-icon-box');
                    iconBoxes.forEach(box => {
                        // Меняем CSS переменную на градиент
                        box.style.setProperty('--icon-bg', colorObj.gradient);
                    });
                }
            }
        }
    } catch (e) {
        console.warn("[Theme Gradient] Не удалось загрузить градиент для", hexColor, e);
        // Если ошибка - останется просто Hex цвет, который мы поставили при рендере
    }
}

async function fetchAndApplyBackground(cardElement, giftName, modelName) {
    // Получаем Telegram ID из сессии (как в background-finder.js)
    let telegramId = null;
    let username = null;
    try {
        const userData = JSON.parse(sessionStorage.getItem('tgUser'));
        if (userData) { telegramId = userData.telegramId; username = userData.username; }
    } catch (e) { }

    const url = `${BASE_URL}/api/MonoCoof/TopBackgroundColorsByNFT?top=1`;
    const body = {
        id: telegramId ? parseInt(telegramId) : null,
        Username: username,
        NameGift: giftName,
        NameModel: modelName
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': getApiAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const data = await response.json(); // [{ Key: "ColorName", Value: ... }]
            if (data && data.length > 0) {
                const colorName = data[0].Key;
                // Ищем градиент в глобальном списке
                const colorObj = GLOBAL_COLORS.find(c => c.name === colorName || c.id === colorName);
                if (colorObj) {
                    cardElement.style.background = colorObj.gradient;
                }
            }
        }
    } catch (e) {
        console.warn("Background fetch failed", e);
    }
}

function close(keepScrollLock = false) {
    if (!modalOverlay) return;
    modalOverlay.classList.add('hidden');
    hideLoadingState();

    // ❗️ ФИКС: Проверяем строго на true. 
    // Если функцию вызвал EventListener, keepScrollLock будет объектом Event (что равно true),
    // и скролл не разблокируется. Эта проверка исправляет баг.
    const shouldKeepLock = keepScrollLock === true;

    if (!shouldKeepLock) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }

    const footer = document.querySelector('#themes-modal-overlay .themes-modal-footer');
    if (footer) footer.style.display = 'block';
}

let GLOBAL_COLORS = []; // Добавляем хранилище цветов
let onBackCallback = null; // Callback для возврата
let navigationStack = []; // ❗️ Стек для истории переходов
let modalCloseBtn;      // Ссылка на кнопку закрытия
/**
 * Инициализация (Обновлена логика кнопки "Назад")
 */
function init(baseUrl, photoUrl, lazyLoadFunc, fixedColors) {
    BASE_URL = baseUrl;
    window.BASE_URL = baseUrl;
    PHOTO_URL = photoUrl;
    lazyLoadSetup = lazyLoadFunc;
    GLOBAL_COLORS = fixedColors || [];

    const modalHtml = `
        <div id="themes-modal-overlay" class="modal-overlay hidden">
            <div class="themes-modal">
                <div class="themes-modal-header">
                    <button id="themes-back-btn" class="themes-modal-back-btn hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    
                    <h3 id="themes-modal-title" class="themes-modal-title">Тематики</h3>
                    
                    <button id="themes-close-btn" class="themes-modal-close-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div id="themes-modal-content" class="themes-modal-content">
                </div>
                <div class="themes-modal-footer" style="display:none;">
                </div>
            </div>
        </div>
    `;

    if (!document.getElementById('themes-modal-overlay')) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // (Дальше без изменений)
    modalOverlay = document.getElementById('themes-modal-overlay');
    modalContent = document.getElementById('themes-modal-content');
    modalTitle = document.getElementById('themes-modal-title');
    modalBackButton = document.getElementById('themes-back-btn');
    modalCloseBtn = document.getElementById('themes-close-btn');

    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) close(); });
    modalBackButton.addEventListener('click', handleBackNavigation);
    modalCloseBtn.addEventListener('click', () => close(false));
}

function pushToHistory(restoreFunction) {
    navigationStack.push(restoreFunction);
    updateBackButtonState();
}

// ❗️ Обработка нажатия "Назад"
function handleBackNavigation() {
    if (navigationStack.length > 0) {
        const restoreState = navigationStack.pop();
        updateBackButtonState();
        restoreState();
    } else {
        if (onBackCallback) {
            // ❗️ ФИКС: Передаем false, чтобы разблокировать скролл основной страницы
            close(false);
            onBackCallback();
        } else {
            close(false);
        }
    }
}

function updateBackButtonState() {
    if (navigationStack.length > 0) {
        modalBackButton.classList.remove('hidden');
        modalBackButton.style.display = 'flex'; // Fix display
    } else {
        // Если есть внешний callback (мы пришли из деталей), кнопку оставляем
        if (onBackCallback) {
            modalBackButton.classList.remove('hidden');
            modalBackButton.style.display = 'flex';
        } else {
            modalBackButton.classList.add('hidden');
            modalBackButton.style.display = 'none';
        }
    }
}

// 4. Экспортируем публичные методы в глобальный объект
window.themesModal = {
    init,
    open,
    openModelDetail,
    openCollection, // <--- ❗️ Не забудьте добавить эту строчку
    close
};


function initNFTsSection(giftName, modelName, bgName) {
    nftsState = {
        isExpanded: false,
        page: 1,
        pageSize: 18,
        isLoading: false,
        hasMore: true,
        currentGift: giftName,
        currentModel: modelName,
        currentBg: bgName,
        observer: null
    };

    // 🔥 ИЗМЕНЕНИЕ: Ищем по новым ID
    const header = document.getElementById('tm-nfts-toggle-header');
    const grid = document.getElementById('tm-nfts-grid-container');
    const arrow = document.getElementById('tm-nfts-arrow');

    if (!header || !grid) return;

    header.style.color = 'var(--text-muted)';
    header.classList.remove('expanded');

    if (arrow) arrow.style.transform = 'rotate(0deg)';

    grid.style.display = 'none';
    grid.classList.add('hidden');
    grid.innerHTML = '';

    header.onclick = function (e) {
        if (e) e.stopPropagation();
        if (document.activeElement) document.activeElement.blur();
        toggleNFTsSection();
    };
}

function toggleNFTsSection() {
    // 🔥 ИЗМЕНЕНИЕ: Ищем по новым ID
    const header = document.getElementById('tm-nfts-toggle-header');
    const grid = document.getElementById('tm-nfts-grid-container');
    const arrow = document.getElementById('tm-nfts-arrow');

    if (!header || !grid) return;

    nftsState.isExpanded = !nftsState.isExpanded;

    if (nftsState.isExpanded) {
        header.style.color = '#fff';
        header.classList.add('expanded');
        if (arrow) arrow.style.transform = 'rotate(180deg)';

        grid.style.display = 'grid';
        grid.classList.remove('hidden');

        if (grid.children.length === 0) {
            loadMoreNFTs();
        }
    } else {
        header.style.color = 'var(--text-muted)';
        header.classList.remove('expanded');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
        grid.style.display = 'none';
        grid.classList.add('hidden');
    }
}

async function loadMoreNFTs() {
    if (nftsState.isLoading || !nftsState.hasMore) return;

    nftsState.isLoading = true;
    const loader = document.getElementById('tm-nfts-loading-indicator');
    if (loader) {
        loader.classList.remove('hidden');
        loader.style.display = 'block';
    }

    const url = `${BASE_URL}/api/ListGifts/SearchGifts/${nftsState.page}/${nftsState.pageSize}`;

    const body = {
        GiftName: nftsState.currentGift,
        ModelName: nftsState.currentModel,
        BackgroundName: nftsState.currentBg
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        // --- ❗️ ДОБАВЛЕННЫЙ БЛОК ПРОВЕРКИ ПОДПИСКИ ---
        if (response.status === 403) {
            try {
                const errorData = await response.json();
                if (errorData.error === 'subscription_required') {
                    console.warn('[NFTs] Требуется подписка. Channel ID:', errorData.channelId);

                    // 1. Показываем модалку (функция должна быть доступна глобально из themes-modal-nfts.js)
                    if (typeof window.showSubscriptionModal === 'function') {
                        window.showSubscriptionModal(errorData.channelId);
                    }

                    // 2. Принудительно закрываем (сворачиваем) секцию
                    const header = document.getElementById('tm-nfts-toggle-header');
                    const grid = document.getElementById('tm-nfts-grid-container');
                    const arrow = document.getElementById('tm-nfts-arrow');

                    nftsState.isExpanded = false;
                    nftsState.isLoading = false; // Снимаем флаг загрузки

                    // Скрываем лоадер
                    if (loader) {
                        loader.style.display = 'none';
                        loader.classList.add('hidden');
                    }

                    // Визуально сворачиваем элементы
                    if (header) {
                        header.style.color = 'var(--text-muted)';
                        header.classList.remove('expanded');
                    }
                    if (arrow) arrow.style.transform = 'rotate(0deg)';
                    if (grid) {
                        grid.style.display = 'none';
                        grid.classList.add('hidden');
                    }

                    return; // Прерываем выполнение
                }
            } catch (e) {
                console.error("Error parsing 403 response", e);
            }
        }
        // --- КОНЕЦ ДОБАВЛЕННОГО БЛОКА ---

        if (response.ok) {
            const data = await response.json();

            if (data && data.Items && data.Items.length > 0) {
                renderNFTs(data.Items);

                if (data.Items.length < nftsState.pageSize) {
                    nftsState.hasMore = false;
                } else {
                    nftsState.page++;
                    setupNFTIntersectionObserver();
                }
            } else {
                nftsState.hasMore = false;
                if (nftsState.page === 1) {
                    const grid = document.getElementById('tm-nfts-grid-container');
                    if (grid) grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); font-size: 0.9rem; padding: 10px;">Ничего не найдено</div>';
                }
            }
        }
    } catch (error) {
        console.error("Error loading NFTs:", error);
    } finally {
        nftsState.isLoading = false;
        if (loader) {
            loader.style.display = 'none';
            loader.classList.add('hidden');
        }
    }
}

function renderNFTs(items) {
    // 🔥 ИЗМЕНЕНИЕ: Новый ID сетки
    const grid = document.getElementById('tm-nfts-grid-container');
    if (!grid) return;

    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const normalizedName = item.GiftName.toLowerCase().replace(/ /g, '');
        const imgUrl = `https://nft.fragment.com/gift/${normalizedName}-${item.Number}.medium.jpg`;
        const linkUrl = `https://t.me/nft/${item.GiftName.replace(/ /g, '')}-${item.Number}`;

        const card = document.createElement('a');
        card.className = 'nft-card';
        card.href = linkUrl;
        card.target = "_blank";

        card.style.position = 'relative';
        card.style.display = 'block';
        card.style.width = '100%';
        card.style.aspectRatio = '1/1';
        card.style.borderRadius = '12px';
        card.style.overflow = 'hidden';
        card.style.backgroundColor = '#16213a';
        card.style.textDecoration = 'none';

        card.innerHTML = `
            <img src="${imgUrl}" alt="#${item.Number}" style="width:100%; height:100%; object-fit:cover; display:block;" loading="lazy">
            <div style="position:absolute; bottom:0; left:0; right:0; height:50%; background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%); pointer-events:none;"></div>
            <span style="position:absolute; bottom:6px; left:0; width:100%; text-align:center; color:#fff; font-size:0.8rem; font-weight:700; z-index:2; text-shadow:0 2px 4px rgba(0,0,0,0.8); font-family:monospace;">#${item.Number}</span>
        `;

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

const SCROLL_POS_KEY = 'themesModalScrollPos';

window.updateTelegramBackButton = function (mode) {
    if (!window.Telegram || !window.Telegram.WebApp) return;
    const tg = window.Telegram.WebApp;

    // Снимаем старые клики, чтобы не дублировались
    tg.BackButton.offClick();
    tg.BackButton.show();

    // Независимо от режима (mode), кнопка всегда ведет назад по истории браузера.
    // Мы НЕ закрываем модалку этой кнопкой.
    tg.BackButton.onClick(() => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '../index.html';
        }
    });
};

function setupNFTIntersectionObserver() {
    if (nftsState.observer) nftsState.observer.disconnect();

    const scrollContainer = document.querySelector('.themes-modal-content.details-mode');
    // Мы скроллим сам контейнер модалки, а не .modal-scrollable-content, т.к. в themes-modal.js структура чуть другая
    // Но давайте попробуем привязаться к modalContent
    const rootTarget = document.getElementById('themes-modal-content');

    if (!rootTarget) return;

    const options = {
        root: rootTarget,
        rootMargin: '200px',
        threshold: 0.1
    };

    nftsState.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && nftsState.hasMore && !nftsState.isLoading) {
            loadMoreNFTs();
        }
    }, options);

    // 🔥 ИЗМЕНЕНИЕ: Новый ID сетки
    const grid = document.getElementById('tm-nfts-grid-container');
    if (grid && grid.lastElementChild) {
        nftsState.observer.observe(grid.lastElementChild);
    }
}