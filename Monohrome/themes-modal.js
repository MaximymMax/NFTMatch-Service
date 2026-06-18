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
let idToNameDict = null; 
let dictFetchPromise = fetch('https://cdn.changes.tg/gifts/id-to-name.json')
    .then(r => r.json())
    .then(data => { 
        idToNameDict = data; 
        window.idToNameDict = data; // Экспортируем глобально для themes.js
    })
    .catch(err => console.error("Failed to load collection dict", err));

// Универсальная функция для получения правильной картинки
window.getModelImageUrl = function(giftName, modelName) {
    if (modelName === 'CollectionMarker') {
        if (window.idToNameDict) {
            const searchStr = (giftName || '').toLowerCase().trim();
            const entry = Object.entries(window.idToNameDict).find(([id, name]) => name.toLowerCase().trim() === searchStr);
            if (entry) return `https://cdn.changes.tg/gifts/originals/${entry[0]}/Original.png`;
        }
        return `https://cdn.changes.tg/gifts/models/${encodeURIComponent(giftName)}/png/Original.png`;
    }
    return `https://cdn.changes.tg/gifts/models/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
};


let currentThemeName = '';
let currentThemeGifts = [];
let currentThemeGroups = [];
let currentSortMode = 'group'; // 'group', 'price', 'count'
let hasColorGroups = false; // ❗️ НОВАЯ ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ
const INIT_DATA_KEY = 'tgInitData';
const BYPASS_KEY_STORAGE = 'apiBypassKey';
let currentBgName = null;
let currentSearchQuery = ''; // Поисковый запрос для блока ВЛОЖЕНИЯ

const t = (key, fallback) => window.NFTi18n ? window.NFTi18n.t(key, fallback) : fallback;

// --- In-memory кэши (живут на время сессии) ---
const _allModelsCache = new Map(); // key: giftName  → AllModelNames array
const _v2ThemesCache = new Map(); // key: `${gift}/${model}` → V2 themes array
const _oldThemesCache = new Map(); // key: `${gift}/${model}` → old themes array
const _colorsCache = new Map(); // key: `${gift}/${model}` → parsed colors array
const _bgScoresCache = new Map(); // key: `${gift}/${model}` → bgScores array
const _countCache = new Map(); // key: `${gift}/${model}/${bg}` → count number
const _similarCache = new Map(); // ❗️ ДОБАВИТЬ ЭТУ СТРОКУ

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

// --- Глобальный кэш и ленивая загрузка картинок ---
window.lazyImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            if (src) {
                // Браузер сам закэширует скачанную картинку
                img.src = src;
                img.removeAttribute('data-src');
                // Добавляем класс для плавного проявления (opacity: 1)
                img.onload = () => img.classList.add('loaded');
            }
            // Перестаем следить за картинкой после её загрузки
            observer.unobserve(img);
        }
    });
}, { 
    root: null,
    rootMargin: '300px', // Начинаем грузить картинку за 300px до того, как она появится на экране
    threshold: 0.01 
});

window.observeLazyImages = function(container) {
    if (!container) return;
    const images = container.querySelectorAll('img.lazy-image');
    images.forEach(img => window.lazyImageObserver.observe(img));
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

function getLocalizedPlural(count, type) {
    const isEn = window.NFTi18n ? window.NFTi18n.getLanguage() === 'en' : false;
    if (isEn) {
        if (type === 'model') return count === 1 ? 'model' : 'models';
        if (type === 'gift') return count === 1 ? 'gift' : 'gifts';
        if (type === 'theme') return count === 1 ? 'theme' : 'themes';
        return '';
    } else {
        if (type === 'model') return getPlural(count, 'модель', 'модели', 'моделей');
        if (type === 'gift') return getPlural(count, 'подарок', 'подарка', 'подарков');
        if (type === 'theme') return getPlural(count, 'тематика', 'тематики', 'тематик');
        return '';
    }
}

function getApiAuthHeader() {
    if (window.NFTAuth && typeof window.NFTAuth.getApiAuthHeader === 'function') {
        return window.NFTAuth.getApiAuthHeader();
    }
    if (window.getApiAuthHeader && typeof window.getApiAuthHeader === 'function') {
        return window.getApiAuthHeader();
    }
    return 'Tma invalid';
}
window.getApiAuthHeader = getApiAuthHeader;

function getModelPlural(count) {
    return getLocalizedPlural(count, 'model');
}

function getGiftPlural(count) {
    return getLocalizedPlural(count, 'gift');
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
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">${t('modal_no_gifts', 'Нет подарков.')}</p>`;
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
                    <span class="sbh-label">${t('modal_backdrop_color', 'Цвет фона:')} <span class="sbh-name">${bgObj.name}</span></span>
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
        sortedGifts.forEach(gift => grid.appendChild(createSimpleGiftCard(gift)));
        wrapper.appendChild(grid);
        container.appendChild(wrapper);
    }
    // Режим "По цене (Флору)"
    else if (currentSortMode === 'price') {
        const sortedGifts = [...currentThemeGifts].sort((a, b) => {
            const pA = a.AVGPrice || 999999;
            const pB = b.AVGPrice || 999999;
            return pA - pB;
        });
        const wrapper = document.createElement('div');
        wrapper.style.padding = '0 0.5rem';
        const grid = document.createElement('div');
        grid.className = 'models-in-theme-grid';
        sortedGifts.forEach(gift => grid.appendChild(createSimpleGiftCard(gift)));
        wrapper.appendChild(grid);
        container.appendChild(wrapper);
    }
    // Режим "Кластеры" (По умолчанию)
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
            const rawVal = (groupInfo.MatchPercentage !== undefined)
                ? groupInfo.MatchPercentage
                : (groupInfo.matchPercentage || 0);
            const percentVal = rawVal * 100;

            const clusterDiv = document.createElement('div');
            clusterDiv.className = 'theme-group-cluster';

            if (colorHex) {
                const leftHeader = document.createElement('div');
                leftHeader.className = 'group-header-left';
                leftHeader.innerHTML = `
                    <span class="group-text">${t('modal_group_average_color', 'Средний цвет группы:')}</span>
                    <span class="group-badge" style="background-color:${colorHex}; border: 1px solid rgba(255,255,255,0.2);">${colorHex}</span>
                `;
                clusterDiv.appendChild(leftHeader);

                if (currentBgName && percentVal >= 30) {
                    const rightHeader = document.createElement('div');
                    rightHeader.className = 'group-header-right';
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
                gridDiv.appendChild(createSimpleGiftCard(gift));
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
                 <span class="count-mode-badge">${gift.Count} ${t('pcs', 'шт.')}</span>
            </div>
        </div>
    `;

    // Передаем 'card' в функцию клика
    card.addEventListener('click', () => {
        onModelCardClick(gift, card);
    });

    return card;
}

function createSimpleGiftCard(gift) {
    const card = document.createElement('div');
    card.className = 'model-card-simple';

    const colorHex = gift.AverageColorHex || gift.averageColorHex || gift.GroupColorHex || gift.groupColorHex || '#2563eb';
    card.style.setProperty('--card-gradient-color', colorHex); // Важно для нового CSS

    const imgUrl = `${PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;
    const price = gift.AVGPrice || gift.avgPrice || gift.Price;
    const count = gift.Count || gift.count || gift.TotalCount;

    // Встраиваемые SVG-иконки для цены и количества
    const iconPrice = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19.012 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.882-1.826h10.817c1.033 0 1.873.815 1.873 1.822a1.8 1.8 0 0 1-.274.951M6.51 8.863l4.633 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.004-.72-.484-.72h-4.149z"/></svg>`;
    const iconCount = `<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1H3zM2 9.5A1.5 1.5 0 013.5 8h13A1.5 1.5 0 0118 9.5v6.042a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.542V9.5z" clip-rule="evenodd"/></svg>`;

    card.innerHTML = `
        <div class="mcs-image-box">
            <img src="${imgUrl}" class="mcs-img" loading="lazy" alt="${gift.ModelName}">
        </div>
        <div class="mcs-info">
            <h4 class="mcs-model-name">${gift.ModelName}</h4>
            <p class="mcs-gift-name">${gift.GiftName}</p>
            <div class="mcs-stats">
                ${price ? `<span class="mcs-stat">${iconPrice} ${formatPrice(price)}</span>` : ''}
                ${count ? `<span class="mcs-stat">${iconCount} ${count}</span>` : ''}
            </div>
        </div>
    `;

    card.addEventListener('click', () => onModelCardClick(gift, card));
    return card;
}

// ❗️ НОВАЯ ФУНКЦИЯ: Рендерит статический UI для View 2
function renderModelListViewUI() {
    hideLoadingState();
    toggleMainHeader(true);
    modalContent.classList.add('no-padding');

    // Сортировка по умолчанию - Флор
    modalContent.innerHTML = `
        <div class="tm-sort-controls">
            <div class="tm-buttons-wrapper">
                <button class="tm-sort-button" data-sort="group">${t('modal_clusters', 'Кластеры')}</button>
                <button class="tm-sort-button" data-sort="count">${t('modal_by_count', 'По кол-ву')}</button>
                <button class="tm-sort-button active" data-sort="price">${t('modal_by_floors', 'По флорам')}</button>
            </div>
        </div>
        <div id="tm-models-grid-container">
        </div>
    `;

    const btns = modalContent.querySelectorAll('.tm-sort-button');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
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
        currentSortMode = 'price';

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
        modalContent.innerHTML = `<p style="text-align:center; margin-top:2rem;">${t('modal_load_collection_error', 'Ошибка загрузки коллекции')}</p>`;
    }
}

async function onModelCardClick(gift, cardElement) {
    const key = `${gift.GiftName}/${gift.ModelName}`;
    const countKey = `${gift.GiftName}/${gift.ModelName}/${currentBgName || ''}`;

    const isFullyCached = _v2ThemesCache.has(key) && 
                          _similarCache.has(key) && 
                          _colorsCache.has(key) && 
                          (!currentBgName || (_bgScoresCache.has(key) && _countCache.has(countKey)));

    if (!isFullyCached && cardElement) {
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

        let themesPromise;
        if (_v2ThemesCache.has(key)) {
            themesPromise = Promise.resolve(_v2ThemesCache.get(key));
        } else {
            themesPromise = fetch(themesUrl, { headers: { 'Authorization': getApiAuthHeader() } })
                .then(r => r.ok ? r.json() : [])
                .then(data => {
                    _v2ThemesCache.set(key, data);
                    return data;
                })
                .catch(() => []);
        }

        let similarPromise;
        if (_similarCache.has(key)) {
            similarPromise = Promise.resolve(_similarCache.get(key));
        } else {
            similarPromise = fetch(similarUrl, {
                method: 'POST',
                headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(similarBody)
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    _similarCache.set(key, data);
                    return data;
                })
                .catch(() => null);
        }

        let colorsPromise;
        if (_colorsCache.has(key)) {
            colorsPromise = Promise.resolve(_colorsCache.get(key));
        } else {
            colorsPromise = fetch(colorsUrl, { headers: { 'Authorization': getApiAuthHeader() } })
                .then(r => r.ok ? r.text() : '')
                .then(data => {
                    _colorsCache.set(key, data);
                    return data;
                })
                .catch(() => '');
        }

        const promises = [themesPromise, similarPromise, colorsPromise];

        let bgScorePromise = Promise.resolve(null);
        let countPromise = Promise.resolve(null);

        if (currentBgName) {
            if (_bgScoresCache.has(key)) {
                bgScorePromise = Promise.resolve(_bgScoresCache.get(key));
            } else {
                const bgScoreUrl = `${BASE_URL}/api/MonoCoof/TopBackgroundColorsByNFT`;
                const bgScoreBody = {
                    NameGift: gift.GiftName,
                    NameModel: gift.ModelName
                };
                bgScorePromise = fetch(bgScoreUrl, {
                    method: 'POST',
                    headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(bgScoreBody)
                })
                    .then(r => r.ok ? r.json() : [])
                    .then(data => {
                        _bgScoresCache.set(key, data);
                        return data;
                    })
                    .catch(() => []);
            }

            if (_countCache.has(countKey)) {
                countPromise = Promise.resolve(_countCache.get(countKey));
            } else {
                const countUrl = `${BASE_URL}/api/ListGifts/SearchGifts/1/1`;
                const countBody = { GiftName: gift.GiftName, ModelName: gift.ModelName, BackgroundName: currentBgName };
                countPromise = fetch(countUrl, {
                    method: 'POST',
                    headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(countBody)
                })
                    .then(r => r.ok ? r.json() : null)
                    .then(data => {
                        _countCache.set(countKey, data);
                        return data;
                    })
                    .catch(() => null);
            }
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
        const savedBg = currentBgName; // ❗️ ФИКС: Фиксируем текущий фон тематики

        pushToHistory(() => {
            // Передаем сохраненную позицию и фон обратно в функцию рендера
            loadAndRenderModelView(currentThemeName, savedBg, currentScrollPos);
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
        const clusterHex = collection.ClusterAverageColorHex || '#2563eb';
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
                <div class="tc-subtitle">${count} ${getLocalizedPlural(count, 'model')}</div>
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
            ${t('modal_similar_colors', 'Похожие по цвету')}
            ${img2}
        `;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = window.location.hash;
            window.location.href = href + (hash && hash.includes('tgWebAppData') ? hash : '');
        });

        container.innerHTML = '';
        container.appendChild(btn);

    } catch (error) {
        console.warn("[Similar Button] Error:", error);
        container.innerHTML = '';
    }
}

function updateThemesRowUI(themesValEl, themes, modelData, fullData) {
    // Фильтруем тематики с менее чем 3 моделями
    const filteredThemes = (themes || []).filter(t => {
        const cnt = t.CountGiftsInTheme || t.countGiftsInTheme || 0;
        return cnt >= 3;
    });

    if (filteredThemes.length > 0) {
        const count = filteredThemes.length;
        const plural = getLocalizedPlural(count, 'theme');

        themesValEl.innerHTML = `${count} ${plural} <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:14px; height:14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>`;
        themesValEl.classList.add('link-style');
        themesValEl.style.cursor = 'pointer';
        themesValEl.style.color = '';

        themesValEl.onclick = () => {
            pushToHistory(() => renderModelDetailView(modelData, fullData));

            currentThemes = filteredThemes;
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
// 1. ЗАМЕНИТЬ ФУНКЦИЮ ЦЕЛИКОМ:
async function renderModelDetailView(modelData, preloadedData = null) {
    currentView = 'details';
    if (modalContent) modalContent.scrollTop = 0;

    modalContent.innerHTML = '';
    if (modalContent) modalContent.style.opacity = '1';
    modalContent.classList.remove('loading');
    modalContent.classList.add('details-mode');
    toggleMainHeader(false);

    const footer = document.querySelector('#themes-modal-overlay .themes-modal-footer');
    if (footer) footer.style.display = 'none';

    const lottieUrl = `${PHOTO_URL}/${encodeURIComponent(modelData.GiftName)}/lottie/${encodeURIComponent(modelData.ModelName)}.json`;
    const searchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px; height:16px; min-width:16px; display:inline-block; vertical-align:middle; margin-left:4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>`;

    let bgStyle = 'background: transparent;';
    let initialBgName = preloadedData?.bgData?.name || currentBgName || null;
    let initialPercent = preloadedData?.bgData?.matchPercent || '—';

    if (initialBgName) {
        const colorObj = GLOBAL_COLORS.find(c => c.name === initialBgName || c.id === initialBgName);
        if (colorObj) bgStyle = `background: ${colorObj.gradient};`;
    }

    const modelPrice = modelData.AVGPrice !== undefined ? modelData.AVGPrice : (modelData.Price !== undefined ? modelData.Price : (modelData.price !== undefined ? modelData.price : (modelData.FloorPrice !== undefined ? modelData.FloorPrice : 0)));
    const priceHtml = modelPrice > 0 ? `&nbsp;&nbsp;<span style="color: var(--text-muted); font-size: 0.9em;">${modelPrice % 1 === 0 ? modelPrice : modelPrice.toFixed(1)} TON</span>` : '';

    modalContent.innerHTML = `
        <div class="details-content-wrapper"> 
           <div class="details-modal-header">
                <button id="dm-back-btn" class="themes-modal-back-btn" style="visibility: hidden; pointer-events: none; display: flex;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                </button>
                <h3 class="modal-title">${modelData.GiftName}</h3>
                <button id="dm-close-btn" class="themes-modal-close-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div class="modal-visual-area" id="visual-area-container" style="${bgStyle}">
                <lottie-player src="${lottieUrl}" background="transparent" speed="1" loop autoplay></lottie-player>
            </div>
            
            <div class="modal-info info-table">
                <div class="info-row">
                    <span class="info-label">${t('modal_model', 'Модель')}</span>
                    <a href="../Monohrome/background-finder.html?mode=findBgs&gift=${encodeURIComponent(modelData.GiftName)}&model=${encodeURIComponent(modelData.ModelName)}${modelPrice > 0 ? `&price=${modelPrice}` : ''}" class="info-value link-style">
                        ${modelData.ModelName}${priceHtml}
                    </a>
                </div>
                
                <div class="info-row" id="tm-bg-accordion-trigger" style="cursor: pointer;">
                    <span class="info-label">${t('modal_backdrop', 'Фон')}</span>
                    <div class="info-value link-style" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span id="tm-current-bg-text">${initialBgName || t('modal_choose', 'Выбрать...')}</span>
                        <svg id="tm-bg-arrow" class="nfts-arrow" style="width:16px;height:16px; transition: transform 0.3s;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 9l-7 7-7-7" stroke-width="3"/></svg>
                    </div>
                </div>

                <div id="tm-bg-accordion-content" class="bg-accordion-content hidden">
                    <div class="palette-scroll-area" id="tm-bg-palette"></div>
                </div>

                <div class="info-row">
                    <span class="info-label">${t('modal_match', 'Совпадение')}</span>
                    <span id="tm-compat-val" class="info-value compat">${initialPercent}${initialPercent !== '—' ? '%' : ''}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">${t('modal_quantity', 'Количество')}</span>
                    <span class="info-value count">${modelData.Count || '-'} ${t('pcs', 'шт.')}</span>
                </div>

                <div class="info-row" id="tm-v2-accordion-trigger" style="cursor: pointer; border-bottom: none; display: none;">
                    <span class="info-label">${t('v2_theme', 'Тематики')}</span>
                    <div class="info-value link-style" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span id="tm-v2-count-val"></span>
                        <svg id="tm-v2-arrow" class="nfts-arrow" style="width:16px;height:16px; transition: transform 0.3s;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 9l-7 7-7-7" stroke-width="3"/></svg>
                    </div>
                </div>
                <div id="tm-v2-accordion-content" class="bg-accordion-content hidden" style="padding: 12px 0;">
                    <div id="tm-v2-grid" style="padding: 0 16px;"></div>
                </div>

            </div>
            
            <div class="gold-button-container" id="tm-similar-btn-container"></div>

            <div class="market-tree-v2">
                <div class="mt-root">${t('modal_search_on_markets', 'ПОИСК НА МАРКЕТАХ')}</div>
                <div class="mt-branches">
                    
                    <div class="mt-item-container">
                        <div class="mt-item">
                            <div class="mt-label">${t('modal_cheapest', 'Самые дешевые')}</div>
                            <button class="mt-btn" data-scenario="2">${t('modal_find', 'Найти')}</button>
                        </div>
                        <div class="mt-content hidden" id="content-scenario-2">
                            <div class="mt-horizontal-scroll" id="grid-scenario-2"></div>
                            <div class="nfts-loading hidden"><span class="loading-spinner-mini"></span></div>
                        </div>
                    </div>

                    <div class="mt-item-container">
                        <div class="mt-item">
                            <div class="mt-label">${t('modal_best_monochromes', 'Лучшие монохромы')}</div>
                            <button class="mt-btn" data-scenario="1">${t('modal_find', 'Найти')}</button>
                        </div>
                        <div class="mt-content hidden" id="content-scenario-1">
                            <div class="mt-horizontal-scroll" id="grid-scenario-1"></div>
                            <div class="nfts-loading hidden"><span class="loading-spinner-mini"></span></div>
                        </div>
                    </div>

                    <div class="mt-item-container" id="branch-3-container" style="display:none;">
                        <div class="mt-item">
                            <div class="mt-label">${t('modal_on_backdrop', 'На фоне')} <span id="tree-bg-label" style="color:var(--primary-color)"></span></div>
                            <button class="mt-btn" data-scenario="3">${t('modal_find', 'Найти')}</button>
                        </div>
                        <div class="mt-content hidden" id="content-scenario-3">
                            <div class="mt-horizontal-scroll" id="grid-scenario-3"></div>
                            <div class="nfts-loading hidden"><span class="loading-spinner-mini"></span></div>
                        </div>
                    </div>

                </div>
            </div>

            <div class="market-tree-v2 standalone-search-zone" id="branch-4-container" style="margin-top: 12px; border-top: none; display: none;">
                <div class="mt-root standalone" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0;">
                    <span>${t('modal_search_model_backdrop', 'ПОИСК модель+фон')}</span>
                    <button class="mt-btn" data-scenario="4">${t('modal_find', 'Найти')}</button>
                </div>
                <div class="mt-content hidden" id="content-scenario-4" style="margin-top: 16px;">
                    <div class="nfts-grid grid-3" id="grid-scenario-4"></div>
                    <div class="nfts-loading hidden" style="text-align: center; margin-top:10px;"><span class="loading-spinner-mini"></span></div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('dm-close-btn').onclick = () => close();
    const backBtn = document.getElementById('dm-back-btn');
    if (backBtn) {
        const canGoBack = navigationStack.length > 0 || onBackCallback;
        backBtn.style.display = 'flex';
        if (canGoBack) {
            backBtn.style.visibility = 'visible';
            backBtn.style.pointerEvents = 'auto';
            backBtn.onclick = handleBackNavigation;
        } else {
            backBtn.style.visibility = 'hidden';
            backBtn.style.pointerEvents = 'none';
        }
    }

    // --- Логика Аккордеона Фонов ---
    const bgTrigger = document.getElementById('tm-bg-accordion-trigger');
    const bgContent = document.getElementById('tm-bg-accordion-content');
    const bgArrow = document.getElementById('tm-bg-arrow');
    const paletteContainer = document.getElementById('tm-bg-palette');

    bgTrigger.onclick = () => {
        bgContent.classList.toggle('hidden');
        bgArrow.style.transform = bgContent.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    };

    let bgScores = preloadedData?.bgScoreData || [];
    if (bgScores.length === 0 && !preloadedData) {
        bgScores = _bgScoresCache.get(`${modelData.GiftName}/${modelData.ModelName}`) || [];
    }

    // ✅ ИСПРАВЛЕНИЕ: Мягкая загрузка вместо жесткой подмены DOM
    const reloadWithBg = (newBgName) => {
        const savedBg = currentBgName;
        pushToHistory(() => openModelDetail(modelData.GiftName, modelData.ModelName, savedBg, null, true));
        openModelDetail(modelData.GiftName, modelData.ModelName, newBgName, null, true);
    };

    {
        const isNoBgActive = !initialBgName;
        const noBgItem = document.createElement('div');
        noBgItem.className = `bg-palette-item ${isNoBgActive ? 'active' : ''}`;
        noBgItem.dataset.bg = 'none'; // ✅ Маркер для updateModelDetailView
        noBgItem.innerHTML = `
            <div class="bg-palette-color" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <div class="bg-palette-percent" style="font-size:0.6rem;">—</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; margin-top: 2px; text-align: center; width: 100%; white-space: nowrap;">${t('modal_no_backdrop', 'Без фона')}</div>
        `;
        noBgItem.onclick = (e) => {
            e.stopPropagation();
            if (currentBgName === null) return;
            reloadWithBg(null);
        };
        paletteContainer.appendChild(noBgItem);
    }

    if (bgScores.length > 0) {
        bgScores.sort((a, b) => {
            if (b.Value !== a.Value) return b.Value - a.Value;
            return a.Key.localeCompare(b.Key);
        }).forEach(bg => {
            const colorObj = GLOBAL_COLORS.find(c => c.name === bg.Key || c.id === bg.Key);
            if (!colorObj) return;

            const percent = (bg.Value * 100).toFixed(1);
            const isActive = initialBgName === bg.Key;

            const item = document.createElement('div');
            item.className = `bg-palette-item ${isActive ? 'active' : ''}`;
            item.dataset.bg = bg.Key; // ✅ Маркер для updateModelDetailView
            item.innerHTML = `
                <div class="bg-palette-color" style="background: ${colorObj.gradient};"></div>
                <div class="bg-palette-percent">${percent}%</div>
                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; margin-top: 2px; text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${bg.Key}">${bg.Key}</div>
            `;

            item.onclick = (e) => {
                e.stopPropagation();
                if (currentBgName === bg.Key) return;
                reloadWithBg(bg.Key);
            };
            paletteContainer.appendChild(item);
        });
    }

    // --- Логика Аккордеона V2 Тематик ---
    const v2Themes = preloadedData?.v2Themes || [];
    if (v2Themes.length > 0) {
        const v2Trigger = document.getElementById('tm-v2-accordion-trigger');
        const v2Content = document.getElementById('tm-v2-accordion-content');
        const v2Arrow = document.getElementById('tm-v2-arrow');
        const v2Grid = document.getElementById('tm-v2-grid');

        v2Trigger.style.display = 'grid';
        document.getElementById('tm-v2-count-val').textContent = v2Themes.length + ' ' + (window.NFTi18n ? window.NFTi18n.t('pcs', 'шт.') : 'шт.');

        v2Trigger.onclick = () => {
            v2Content.classList.toggle('hidden');
            v2Arrow.style.transform = v2Content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        };

        if (typeof renderV2ItemsGrid === 'function') {
            const detailRestoreFn = () => renderModelDetailView(modelData, preloadedData);
            renderV2ItemsGrid(v2Themes, v2Grid, null, null, false, detailRestoreFn);
        }
    }

    const btnContainer = document.getElementById('tm-similar-btn-container');

    const preloadedSimilar = preloadedData?.similar;
    const preloadedColors = preloadedData?.colors;
    if (preloadedSimilar !== undefined) {
        renderSimilarButtonWithData(btnContainer, modelData.GiftName, modelData.ModelName, preloadedSimilar, preloadedColors || []);
    } else {
        btnContainer.innerHTML = '';
    }

    if (window.initNFTsSection) {
        window.initNFTsSection(modelData.GiftName, modelData.ModelName, initialBgName);
    }
}

function renderV2ThemeContent(models, container, nodeId, nodeType, isSingleCollection, collectionName, currentName) {
    if (!models || models.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin:0;">У этой тематики нет моделей</p>';
        return;
    }

    let currentSort = currentBgName ? 'bg' : 'price';
    let isAscending = currentBgName ? false : true;
    let hasUserSorted = false;

    const mainModels = models.filter(m => m._isMainTheme || !m._sourceThemeName);
    const extraModels = models.filter(m => !m._isMainTheme && m._sourceThemeName);

    const groupedExtra = {};
    extraModels.forEach(m => {
        if (!groupedExtra[m._sourceThemeName]) groupedExtra[m._sourceThemeName] = [];
        groupedExtra[m._sourceThemeName].push(m);
    });

    const collapsible = document.createElement('div');
    collapsible.className = 'v2-section-collapsible';
    container.appendChild(collapsible);

    const renderCard = (m, parentNode) => {
        const giftName = m.GiftName || m.giftName;
        const modelName = m.ModelName || m.modelName;
        const colorHex = m.AverageColorHex || m.averageColorHex || m.GroupColorHex || m.groupColorHex || '#2563eb';
        
        const isCollectionMarker = modelName === 'CollectionMarker' || m.IsCollectionWide;
        const isBgVisualMode = !!currentBgName;
        const colorsArray = typeof GLOBAL_COLORS !== 'undefined' ? GLOBAL_COLORS : (window.themesFixedColors || []);
        const bgObj = isBgVisualMode ? colorsArray.find(c => c.name === currentBgName || c.id === currentBgName) : null;

        const card = document.createElement('div');
        card.className = 'v2-model-card';
        card.style.setProperty('--card-gradient-color', colorHex);

        const imgUrl = window.getModelImageUrl(giftName, modelName);

        let gradientHtml = `<div class="v2-mc-gradient"></div>`;
        // Заменяем src на прозрачный GIF, а реальный URL прячем в data-src
        let imageHtml = `<div class="v2-mc-image"><img data-src="${imgUrl}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="lazy-image" alt="${modelName}"></div>`;
        let subtitleStyle = '';

        if (bgObj) {
            let innerColor = bgObj.hex;
            let extremeColor = bgObj.hex;
            const rgbMatches = bgObj.gradient.match(/rgb\([^)]+\)/g);
            if (rgbMatches && rgbMatches.length > 0) {
                innerColor = rgbMatches[0];
                extremeColor = rgbMatches[rgbMatches.length - 1];
            }

            gradientHtml = ''; 
            card.style.background = extremeColor;
            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';

            const centeredRad = `radial-gradient(circle at 50% 50%, ${innerColor} 0%, ${extremeColor} 65%)`;
            // Аналогично меняем здесь
            imageHtml = `
                    <div class="v2-mc-image" style="background: ${centeredRad}; width: 100%; aspect-ratio: 1/1; display: flex; justify-content: center; align-items: center; margin: 0; padding: 0; border-radius: 14px 14px 0 0;">
                        <img data-src="${imgUrl}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="lazy-image" style="width: 80%; height: 80%; object-fit: contain;" alt="${modelName}">
                    </div>
                `;
            subtitleStyle = 'color: #fff; opacity: 0.8;';
        }

        if (isCollectionMarker) {
            card.style.cursor = 'default';
            card.style.pointerEvents = 'none';
            card.innerHTML = `
                ${gradientHtml}
                ${imageHtml}
                <div class="v2-mc-info" style="justify-content: center;">
                    <div class="v2-mc-title" style="font-size: 0.95rem; margin-bottom: 2px;">${giftName}</div>
                    <div class="v2-mc-subtitle" style="${subtitleStyle}">Вся коллекция</div>
                </div>
            `;
        } else {
            const count = m.TotalCount !== undefined ? m.TotalCount : (m.Count !== undefined ? m.Count : (m.count || m.totalCount || 0));
            const price = m.AVGPrice !== undefined ? m.AVGPrice : (m.Price || m.avgPrice || m.price || 0);
            const rawPercent = m.MatchPercentage !== undefined ? m.MatchPercentage : (m.matchPercentage || null);
            let matchPercent = null;
            if (rawPercent !== null) {
                matchPercent = rawPercent <= 1 ? (rawPercent * 100).toFixed(1) : rawPercent.toFixed(1);
            }

            const iconStyle = bgObj ? 'style="color: #fff;"' : '';
            const priceIcon = `<svg viewBox="0 0 24 24" fill="currentColor" ${iconStyle}><path d="M19.012 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.882-1.826h10.817c1.033 0 1.873.815 1.873 1.822a1.8 1.8 0 0 1-.274.951M6.51 8.863l4.633 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.004-.72-.484-.72h-4.149z"/></svg>`;

            let statsHtmlContent = '';

            if (bgObj && matchPercent) {
                statsHtmlContent += `<div class="v2-mc-stat-badge" style="background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 4px;"><span>coof. ${matchPercent}%</span></div>`;
            }

            const additionalBgStyle = bgObj ? 'style="background: rgba(0,0,0,0.3); color: #fff; border-color: rgba(255,255,255,0.1);"' : '';

            if (currentSort === 'price') {
                statsHtmlContent += `<div class="v2-mc-stat-badge" ${additionalBgStyle}>${priceIcon} <span>${price > 0 ? formatPrice(price) : '-'}</span></div>`;
            } else if (currentSort === 'count') {
                statsHtmlContent += `<div class="v2-mc-stat-badge" ${additionalBgStyle}><span>${count} шт.</span></div>`;
            } else if (currentSort === 'bg' && matchPercent) {
                statsHtmlContent = `<div class="v2-mc-stat-badge" style="background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2);"><span>${matchPercent}%</span></div>`;
            } else if (currentSort === 'price') {
                const pBadge = `<div class="v2-mc-stat-badge" ${bgObj ? 'style="color: #fff;"' : ''}>${priceIcon} <span>${price > 0 ? formatPrice(price) : '-'}</span></div>`;
                const mBadge = (bgObj && matchPercent) ? `<div class="v2-mc-stat-badge" style="background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2); margin-bottom:4px;"><span>${matchPercent}%</span></div>` : '';
                statsHtmlContent = mBadge + pBadge;
            } else if (currentSort === 'count') {
                statsHtmlContent = `<div class="v2-mc-stat-badge"><span>${count}</span></div>`;
            }

            card.innerHTML = `
                ${gradientHtml}
                ${imageHtml}
                <div class="v2-mc-info">
                    <div class="v2-mc-title">${modelName}</div>
                    <div class="v2-mc-subtitle" style="${subtitleStyle}">${giftName}</div>
                    <div class="v2-mc-stats" style="flex-direction: column; align-items: flex-end;">${statsHtmlContent}</div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                const savedBg = currentBgName; 
                pushToHistory(() => openV2Node(nodeId, nodeType, false, currentName, savedBg));
                openModelDetail(giftName, modelName, savedBg, null, true);
            });
        }
        parentNode.appendChild(card);
    };

    const renderGrid = () => {
        collapsible.innerHTML = '';
        // 🔥 ОПТИМИЗАЦИЯ: DocumentFragment позволяет браузеру вставить 1000 элементов за доли секунды
        const fragment = document.createDocumentFragment();

        const sorter = (a, b) => {
            let valA, valB;
            if (currentSort === 'bg') {
                valA = a.MatchPercentage !== undefined ? a.MatchPercentage : (a.matchPercentage || 0);
                valB = b.MatchPercentage !== undefined ? b.MatchPercentage : (b.matchPercentage || 0);
                return isAscending ? (valA - valB) : (valB - valA);
            } else if (currentSort === 'count') {
                valA = a.TotalCount !== undefined ? a.TotalCount : (a.Count || a.count || 0);
                valB = b.TotalCount !== undefined ? b.TotalCount : (b.Count || b.count || 0);
                return isAscending ? (valA - valB) : (valB - valA);
            } else if (currentSort === 'price') {
                valA = a.AVGPrice !== undefined ? a.AVGPrice : (a.Price || a.avgPrice || 999999);
                valB = b.AVGPrice !== undefined ? b.AVGPrice : (b.Price || b.avgPrice || 999999);
                return isAscending ? (valA - valB) : (valB - valA);
            } else {
                valA = (a.ModelName || a.modelName || '').toLowerCase();
                valB = (b.ModelName || b.modelName || '').toLowerCase();
                if (valA < valB) return isAscending ? -1 : 1;
                if (valA > valB) return isAscending ? 1 : -1;
                return 0;
            }
        };

        if (hasUserSorted) {
            let allModels = [...models];
            allModels.sort(sorter);
            const mainGrid = document.createElement('div');
            mainGrid.className = 'models-in-theme-grid wrap-grid-v2';
            allModels.forEach(m => renderCard(m, mainGrid));
            fragment.appendChild(mainGrid);
        } else {
            if (mainModels.length > 0) {
                let sortedMain = [...mainModels];
                sortedMain.sort(sorter);
                const mainGrid = document.createElement('div');
                mainGrid.className = 'models-in-theme-grid wrap-grid-v2';
                sortedMain.forEach(m => renderCard(m, mainGrid));
                fragment.appendChild(mainGrid);
            }
            for (const [tName, tModels] of Object.entries(groupedExtra)) {
                let sortedSub = [...tModels];
                sortedSub.sort(sorter);
                const rowWrap = document.createElement('div');
                rowWrap.className = 'v2-sub-theme-row';
                rowWrap.innerHTML = `<div class="v2-sub-theme-label">${tName}</div>`;
                const rowGrid = document.createElement('div');
                rowGrid.className = 'models-in-theme-grid wrap-grid-v2';
                sortedSub.forEach(m => renderCard(m, rowGrid));
                rowWrap.appendChild(rowGrid);
                fragment.appendChild(rowWrap);
            }
        }
        
        collapsible.appendChild(fragment);
        window.observeLazyImages(collapsible);
    };
    
    renderGrid();

    const sortMenu = document.getElementById('v2-sort-menu');
    const filterBtn = document.getElementById('v2-filter-toggle');
    const dirBtnInside = document.getElementById('v2-dir-toggle-inside');

    if (dirBtnInside) {
        dirBtnInside.onclick = (e) => {
            e.stopPropagation();
            isAscending = !isAscending;
            hasUserSorted = true;
            document.getElementById('v2-dir-text').textContent = isAscending ? 'По возрастанию' : 'По убыванию';
            document.getElementById('v2-dir-icon').style.transform = isAscending ? 'scaleY(-1)' : 'none';
            renderGrid();
        };
    }

    if (filterBtn && sortMenu) {
        filterBtn.onclick = (e) => {
            e.stopPropagation();
            sortMenu.classList.toggle('hidden');
        };
        document.addEventListener('click', (e) => {
            if (!filterBtn.contains(e.target) && !sortMenu.contains(e.target)) sortMenu.classList.add('hidden');
        });
        const opts = sortMenu.querySelectorAll('.v2-sort-option');
        opts.forEach(opt => {
            opt.onclick = () => {
                opts.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                currentSort = opt.dataset.sort;
                hasUserSorted = true;
                if (currentSort === 'name') {
                    isAscending = true;
                    document.getElementById('v2-dir-text').textContent = 'По возрастанию';
                    document.getElementById('v2-dir-icon').style.transform = 'none';
                } else if (currentSort === 'bg') {
                    isAscending = false; 
                    document.getElementById('v2-dir-text').textContent = 'По убыванию';
                    document.getElementById('v2-dir-icon').style.transform = 'rotate(180deg)';
                } else {
                    isAscending = false;
                    document.getElementById('v2-dir-text').textContent = 'По убыванию';
                    document.getElementById('v2-dir-icon').style.transform = 'rotate(180deg)';
                }
                sortMenu.classList.add('hidden');
                renderGrid();
            };
        });
    }
}

// 3. ЗАМЕНИТЬ ФУНКЦИЮ ЦЕЛИКОМ:

function setNoThemes(el) {
    el.classList.remove('link-style');
    el.style.cursor = 'default';
    el.style.color = 'var(--text-muted)';
    el.textContent = 'Нет';
}

async function openModelDetail(giftName, modelName, bgName = null, onBack = null, keepHistory = false) {
    const isSameModel = (currentGift === giftName && currentModel === modelName);

    if (typeof bgName === 'function') {
        onBack = bgName;
        bgName = null;
    }

    onBackCallback = onBack;
    if (!keepHistory) navigationStack = [];

    currentGift = giftName;
    currentModel = modelName;
    currentBgName = bgName;

    nftsState = { isExpanded: false, page: 1, pageSize: 18, isLoading: false, hasMore: true, currentGift: giftName, currentModel: modelName, currentBg: bgName, observer: null };

    document.body.classList.add('modal-open');
    if (modalOverlay) modalOverlay.classList.remove('hidden');
    updateBackButtonState();

    const cleanBaseUrl = BASE_URL.replace(/\/$/, '');
    const modelKey = `${giftName}/${modelName}`;

    // 🔥 ОПТИМИЗАЦИЯ: Мгновенно вставляем Lottie-анимацию, чтобы она скачивалась параллельно с API
    const lottieUrl = `${PHOTO_URL}/${encodeURIComponent(giftName)}/lottie/${encodeURIComponent(modelName)}.json`;
    
    const existingWrapper = document.getElementById('details-content-wrapper');
    const needsFullRender = !isSameModel || !existingWrapper;

    if (needsFullRender) {
        modalContent.classList.remove('loading', 'no-padding');
        modalContent.classList.add('details-mode');
        toggleMainHeader(false);
        
        modalContent.innerHTML = `
            <div id="full-page-loader" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 100;">
                <span class="themes-modal-spinner" style="width: 40px; height: 40px; border-width: 3px; border-top-color: var(--primary-color);"></span>
            </div>
            <div class="details-content-wrapper hidden" id="details-content-wrapper" style="opacity: 0;"> 
               <div class="details-modal-header">
                    <button id="dm-back-btn" class="themes-modal-back-btn" style="visibility: visible; display: flex;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                    </button>
                    <h3 class="modal-title">${giftName}</h3>
                    <button id="dm-close-btn" class="themes-modal-close-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div class="modal-visual-area" id="visual-area-container" style="background: transparent;">
                    <lottie-player src="${lottieUrl}" background="transparent" speed="1" loop autoplay></lottie-player>
                </div>
                
                <div id="details-data-zone"></div>
            </div>
        `;
        
        document.getElementById('dm-close-btn').onclick = () => close();
        document.getElementById('dm-back-btn').onclick = handleBackNavigation;
    } else {
        // Если та же модель (например, вернулись назад)
        // Просто делаем контент полупрозрачным на время обновления данных
        if (existingWrapper) {
            existingWrapper.style.transition = 'opacity 0.2s';
            existingWrapper.style.opacity = '0.5';
        }
    }

    try {
        // 🔥 ОПТИМИЗАЦИЯ: Один единый запрос к бэкенду
        let aggUrl = `${cleanBaseUrl}/api/BaseInfo/GetModelAggregatedInfo/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}`;
        if (bgName) aggUrl += `?bgName=${encodeURIComponent(bgName)}`;

        const [aggResponse, similarData] = await Promise.all([
            fetch(aggUrl, { headers: { 'Authorization': getApiAuthHeader() } }).then(r => r.ok ? r.json() : null),
            
            // Фоновый запрос на похожие оставляем отдельно, так как он тяжелый
            _similarCache.has(modelKey)
                ? Promise.resolve(_similarCache.get(modelKey))
                : fetch(`${cleanBaseUrl}/api/MonoCoof/SimilarNFTs`, {
                    method: 'POST',
                    headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ NameTargetGift: giftName, NameTargetModel: modelName, MonohromeModelsOnly: true })
                }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (!aggResponse) throw new Error("Aggregated API returned null");

        if (!_similarCache.has(modelKey)) _similarCache.set(modelKey, similarData);

        // Парсим цвета для UI
        let parsedColors = [];
        if (aggResponse.MainColors) {
            const cleaned = aggResponse.MainColors.trim().replace(/^['"]|['"]$/g, '');
            parsedColors = cleaned.split(';').map(item => {
                const parts = item.trim().split(':');
                return parts.length === 2 ? { hex: '#' + parts[1] } : null;
            }).filter(Boolean);
        }

        let bgDataForDetails = null;
        if (bgName && GLOBAL_COLORS) {
            const colorObj = GLOBAL_COLORS.find(c => c.name === bgName || c.id === bgName);
            let matchPercent = 0;
            if (aggResponse.TopBackgrounds) {
                const exactMatch = aggResponse.TopBackgrounds.find(x => x.Key === bgName || (colorObj && x.Key === colorObj.id));
                if (exactMatch) matchPercent = (exactMatch.Value * 100).toFixed(1);
            }
            if (colorObj) bgDataForDetails = { name: colorObj.name, gradient: colorObj.gradient, matchPercent };
        }

        const modelData = {
            GiftName: giftName,
            ModelName: modelName,
            Count: aggResponse.Count,
            FloorPrice: aggResponse.FloorPrice
        };

        const phase1Data = {
            bgData: bgDataForDetails,
            bgScoreData: aggResponse.TopBackgrounds || [],
            v2Themes: aggResponse.V2Themes || [],
            similar: similarData,
            colors: parsedColors
        };

        renderModelDetailViewBody(modelData, phase1Data);

        if (window.initNFTsSection) {
            window.initNFTsSection(giftName, modelName, bgName);
        }

    } catch (e) {
        console.error("openModelDetail Error:", e);
        if (modalContent) modalContent.innerHTML = `<div style="padding:2rem; text-align:center; color:#f87171;">Не удалось загрузить данные</div>`;
    }
}

// 🔥 Вспомогательная функция, которая заполняет нижнюю часть модалки, не трогая Lottie-анимацию
function renderModelDetailViewBody(modelData, preloadedData) {
    const t = (key, fallback) => window.NFTi18n ? window.NFTi18n.t(key, fallback) : fallback;
    const dataZone = document.getElementById('details-data-zone');
    const visualArea = document.getElementById('visual-area-container');
    
    if (!dataZone) return;

    let initialBgName = preloadedData?.bgData?.name || currentBgName || null;
    let initialPercent = preloadedData?.bgData?.matchPercent || '—';

    if (initialBgName && visualArea) {
        const colorObj = GLOBAL_COLORS.find(c => c.name === initialBgName || c.id === initialBgName);
        if (colorObj) visualArea.style.background = colorObj.gradient;
    }

    const modelPrice = modelData.FloorPrice || 0;
    const priceHtml = modelPrice > 0 ? `&nbsp;&nbsp;<span style="color: var(--text-muted); font-size: 0.9em;">${modelPrice % 1 === 0 ? modelPrice : modelPrice.toFixed(1)} TON</span>` : '';

    dataZone.innerHTML = `
        <div class="modal-info info-table">
            <div class="info-row">
                <span class="info-label">${t('modal_model', 'Модель')}</span>
                <a href="../Monohrome/background-finder.html?mode=findBgs&gift=${encodeURIComponent(modelData.GiftName)}&model=${encodeURIComponent(modelData.ModelName)}${modelPrice > 0 ? `&price=${modelPrice}` : ''}" class="info-value link-style">
                    ${modelData.ModelName}${priceHtml}
                </a>
            </div>
            
            <div class="info-row" id="tm-bg-accordion-trigger" style="cursor: pointer;">
                <span class="info-label">${t('modal_backdrop', 'Фон')}</span>
                <div class="info-value link-style" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span id="tm-current-bg-text">${initialBgName || t('modal_choose', 'Выбрать...')}</span>
                    <svg id="tm-bg-arrow" class="nfts-arrow" style="width:16px;height:16px; transition: transform 0.3s;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 9l-7 7-7-7" stroke-width="3"/></svg>
                </div>
            </div>

            <div id="tm-bg-accordion-content" class="bg-accordion-content hidden">
                <div class="palette-scroll-area" id="tm-bg-palette"></div>
            </div>

            <div class="info-row">
                <span class="info-label">${t('modal_compat', 'Совпадение')}</span>
                <span id="tm-compat-val" class="info-value compat">${initialPercent}${initialPercent !== '—' ? '%' : ''}</span>
            </div>

            <div class="info-row">
                <span class="info-label">${t('modal_quantity', 'Количество')}</span>
                <span class="info-value count">${modelData.Count || '-'} ${t('pcs', 'шт.')}</span>
            </div>

            <div class="info-row" id="tm-v2-accordion-trigger" style="cursor: pointer; border-bottom: none; display: none;">
                <span class="info-label">${t('modal_themes', 'Тематики')}</span>
                <div class="info-value link-style" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span id="tm-v2-count-val"></span>
                    <svg id="tm-v2-arrow" class="nfts-arrow" style="width:16px;height:16px; transition: transform 0.3s;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 9l-7 7-7-7" stroke-width="3"/></svg>
                </div>
            </div>
            <div id="tm-v2-accordion-content" class="bg-accordion-content hidden" style="padding: 12px 0;">
                <div id="tm-v2-grid" style="padding: 0 16px;"></div>
            </div>
        </div>
        
        <div class="gold-button-container" id="tm-similar-btn-container"></div>

        <div class="market-tree-v2">
            <div class="mt-root">${t('modal_search_on_markets', 'ПОИСК НА МАРКЕТАХ')}</div>
            <div class="mt-branches">
                <div class="mt-item-container">
                    <div class="mt-item"><div class="mt-label">${t('modal_cheapest', 'Самые дешевые')}</div><button class="mt-btn" data-scenario="2">${t('modal_find', 'Найти')}</button></div>
                    <div class="mt-content hidden" id="content-scenario-2"><div class="mt-horizontal-scroll" id="grid-scenario-2"></div><div class="nfts-loading hidden"><span class="loading-spinner-mini"></span></div></div>
                </div>
                <div class="mt-item-container">
                    <div class="mt-item"><div class="mt-label">${t('modal_best_monochromes', 'Лучшие монохромы')}</div><button class="mt-btn" data-scenario="1">${t('modal_find', 'Найти')}</button></div>
                    <div class="mt-content hidden" id="content-scenario-1"><div class="mt-horizontal-scroll" id="grid-scenario-1"></div><div class="nfts-loading hidden"><span class="loading-spinner-mini"></span></div></div>
                </div>
                <div class="mt-item-container" id="branch-3-container" style="display:none;">
                    <div class="mt-item"><div class="mt-label">${t('modal_on_backdrop', 'На фоне')} <span id="tree-bg-label" style="color:var(--primary-color)"></span></div><button class="mt-btn" data-scenario="3">${t('modal_find', 'Найти')}</button></div>
                    <div class="mt-content hidden" id="content-scenario-3"><div class="mt-horizontal-scroll" id="grid-scenario-3"></div><div class="nfts-loading hidden"><span class="loading-spinner-mini"></span></div></div>
                </div>
            </div>
        </div>

        <div class="market-tree-v2 standalone-search-zone" id="branch-4-container" style="margin-top: 12px; border-top: none; display: none;">
            <div class="mt-root standalone" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0;">
                <span>${t('modal_search_model_backdrop', 'ПОИСК модель+фон')}</span>
                <button class="mt-btn" data-scenario="4">${t('modal_find', 'Найти')}</button>
            </div>
            <div class="mt-content hidden" id="content-scenario-4" style="margin-top: 16px;">
                <div class="nfts-grid grid-3" id="grid-scenario-4"></div>
                <div class="nfts-loading hidden" style="text-align: center; margin-top:10px;"><span class="loading-spinner-mini"></span></div>
            </div>
        </div>
    `;

    const bgTrigger = document.getElementById('tm-bg-accordion-trigger');
    const bgContent = document.getElementById('tm-bg-accordion-content');
    const bgArrow = document.getElementById('tm-bg-arrow');
    const paletteContainer = document.getElementById('tm-bg-palette');

    bgTrigger.onclick = () => {
        bgContent.classList.toggle('hidden');
        bgArrow.style.transform = bgContent.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    };

    // ⚡️ ЛЕГКОЕ ОБНОВЛЕНИЕ ФОНА (БЕЗ ПЕРЕЗАГРУЗКИ) ⚡️
    const reloadWithBg = async (newBgName) => {
        if (currentBgName === newBgName) return;
        
        // 1. Меняем стейт, но НЕ пушим в историю (чинит стрелочку назад)
        currentBgName = newBgName;

        // 2. Визуальное обновление
        const vArea = document.getElementById('visual-area-container');
        const bgText = document.getElementById('tm-current-bg-text');
        const compatVal = document.getElementById('tm-compat-val');
        const pItems = document.querySelectorAll('.bg-palette-item');
        const countEls = document.querySelectorAll('.info-value.count');

        let matchPrc = '—';
        if (newBgName) {
            const colorObj = GLOBAL_COLORS.find(c => c.name === newBgName || c.id === newBgName);
            if (colorObj && vArea) vArea.style.background = colorObj.gradient;
            
            const exactMatch = preloadedData.bgScoreData.find(x => x.Key === newBgName || (colorObj && x.Key === colorObj.id));
            if (exactMatch) matchPrc = (exactMatch.Value * 100).toFixed(1);
        } else {
            if (vArea) vArea.style.background = 'transparent';
        }

        if (bgText) bgText.textContent = newBgName || t('modal_choose', 'Выбрать...');
        if (compatVal) compatVal.textContent = `${matchPrc}${matchPrc !== '—' ? '%' : ''}`;

        pItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.bg === String(newBgName || 'none')) item.classList.add('active');
        });

        // 3. СТАВИМ ПРОЧЕРК ВМЕСТО ТЯЖЕЛОГО ЗАПРОСА
        if (newBgName) {
            countEls.forEach(el => el.textContent = `- ${t('pcs', 'шт.')}`);
        } else {
            countEls.forEach(el => el.textContent = `${modelData.Count || '-'} ${t('pcs', 'шт.')}`);
        }

        // Обновляем маркет-зону под новый фон
        if (window.initNFTsSection) {
            window.initNFTsSection(modelData.GiftName, modelData.ModelName, newBgName);
        }
    };

    const isNoBgActive = !initialBgName;
    paletteContainer.innerHTML = `
        <div class="bg-palette-item ${isNoBgActive ? 'active' : ''}" data-bg="none">
            <div class="bg-palette-color" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <div class="bg-palette-percent" style="font-size:0.6rem;">—</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; margin-top: 2px; text-align: center; width: 100%; white-space: nowrap;">${t('modal_no_backdrop', 'Без фона')}</div>
        </div>
    `;
    paletteContainer.firstElementChild.onclick = (e) => { e.stopPropagation(); if (currentBgName !== null) reloadWithBg(null); };

    preloadedData.bgScoreData.forEach(bg => {
        const colorObj = GLOBAL_COLORS.find(c => c.name === bg.Key || c.id === bg.Key);
        if (!colorObj) return;
        const percent = (bg.Value * 100).toFixed(1);
        const isActive = initialBgName === bg.Key;

        const item = document.createElement('div');
        item.className = `bg-palette-item ${isActive ? 'active' : ''}`;
        item.dataset.bg = bg.Key;
        item.innerHTML = `
            <div class="bg-palette-color" style="background: ${colorObj.gradient};"></div>
            <div class="bg-palette-percent">${percent}%</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; margin-top: 2px; text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${bg.Key}">${bg.Key}</div>
        `;
        item.onclick = (e) => { e.stopPropagation(); if (currentBgName !== bg.Key) reloadWithBg(bg.Key); };
        paletteContainer.appendChild(item);
    });

    if (preloadedData.v2Themes && preloadedData.v2Themes.length > 0) {
        const v2Trigger = document.getElementById('tm-v2-accordion-trigger');
        const v2Content = document.getElementById('tm-v2-accordion-content');
        const v2Arrow = document.getElementById('tm-v2-arrow');
        const v2Grid = document.getElementById('tm-v2-grid');

        v2Trigger.style.display = 'grid';
        document.getElementById('tm-v2-count-val').textContent = preloadedData.v2Themes.length + ' ' + t('pcs', 'шт.');

        v2Trigger.onclick = () => {
            v2Content.classList.toggle('hidden');
            v2Arrow.style.transform = v2Content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        };

        if (typeof renderV2ItemsGrid === 'function') {
            const detailRestoreFn = () => { openModelDetail(modelData.GiftName, modelData.ModelName, currentBgName, null, true); };
            renderV2ItemsGrid(preloadedData.v2Themes, v2Grid, null, null, false, detailRestoreFn);
        }
    }

    const btnContainer = document.getElementById('tm-similar-btn-container');
    if (preloadedData.similar) {
        renderSimilarButtonWithData(btnContainer, modelData.GiftName, modelData.ModelName, preloadedData.similar, preloadedData.colors || []);
    }

    // ПРОЯВЛЕНИЕ ИНТЕРФЕЙСА (после того как DOM построен)
    const loader = document.getElementById('full-page-loader');
    const wrapper = document.getElementById('details-content-wrapper');
    if (loader) loader.remove();
    if (wrapper) {
        wrapper.classList.remove('hidden');
        requestAnimationFrame(() => {
            wrapper.style.transition = 'opacity 0.4s ease-in-out';
            wrapper.style.opacity = '1';
        });
    }
}

// Заглушка, чтобы не ломался вызов в `renderThemeListView`
// Функцию `renderModelDetailView` можно вообще удалить, так как мы используем `renderModelDetailViewBody`

function updateModelDetailView(modelData, preloadedData) {
    const t = (key, fallback) => window.NFTi18n ? window.NFTi18n.t(key, fallback) : fallback;
    let initialBgName = preloadedData?.bgData?.name || currentBgName || null;
    let initialPercent = preloadedData?.bgData?.matchPercent || '—';

    const visualArea = document.getElementById('visual-area-container');
    if (visualArea) {
        if (initialBgName) {
            const colorObj = GLOBAL_COLORS.find(c => c.name === initialBgName || c.id === initialBgName);
            if (colorObj) visualArea.style.background = colorObj.gradient;
        } else {
            visualArea.style.background = 'transparent';
        }
    }

    const bgText = document.getElementById('tm-current-bg-text');
    if (bgText) bgText.textContent = initialBgName || t('modal_choose', 'Выбрать...');

    const compatVal = document.getElementById('tm-compat-val');
    if (compatVal) compatVal.textContent = `${initialPercent}${initialPercent !== '—' ? '%' : ''}`;

    const countEls = document.querySelectorAll('.info-value.count');
    countEls.forEach(el => { el.textContent = `${modelData.Count || '-'} ${t('pcs', 'шт.')}`; });

    const paletteItems = document.querySelectorAll('.bg-palette-item');
    paletteItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.bg === String(initialBgName || 'none')) {
            item.classList.add('active');
        }
    });

    if (modalContent) modalContent.style.opacity = '1';
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
        <span style="display:inline-block; line-height:1; padding-top:1px;">${window.NFTi18n ? window.NFTi18n.t('btn_similar_colors', 'Похожие по цвету') : 'Похожие по цвету'}</span>
        ${img2}
    `;

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = window.location.hash;
        window.location.href = href + (hash && hash.includes('tgWebAppData') ? hash : '');
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
    // Открываем детальный вид напрямую через V2 (без старых тематик)
    openModelDetail(giftName, modelName, null, onBack, false);
}

function renderThemes(data) {
    const container = document.getElementById('themes-grid');
    if (!container) return;

    data.forEach(theme => {
        const nodeId = theme.Id;
        const nodeType = theme.Type;

        if (!document.querySelector(`.theme-page-card[data-id="${nodeId}"][data-type="${nodeType}"]`)) {
            const card = document.createElement('div');
            card.className = 'theme-page-card';
            card.dataset.id = nodeId;
            card.dataset.type = nodeType;

            // Выводим количество (🎨 X) если есть статистика по фону
            let countLabel = `${theme.ModelCount} шт.`;
            if (theme.BgMatchCount !== null && theme.BgMatchCount !== undefined) {
                countLabel = `${theme.ModelCount} шт. <span style="color:var(--primary-color); font-weight:800;">(🎨 ${theme.BgMatchCount})</span>`;
            }

            card.innerHTML = `
                <div class="tpc-header">
                    <div class="tpc-icon" style="background: ${theme.ThemeColor || 'var(--primary-color)'};"></div>
                    <div class="tpc-title-wrap">
                        <div class="tpc-name">${theme.Name}</div>
                        <div class="tpc-count">${countLabel}</div>
                    </div>
                    <div class="tpc-arrow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></div>
                </div>
                <div class="tpc-glow"></div>
            `;

            card.addEventListener('click', () => {
                if (window.themesModal && window.themesModal.openV2Node) {
                    // Передаем state.selectedColor третьим или четвертым аргументом (смотря какая сигнатура)
                    // В стандартном коде это обычно: nodeId, nodeType, isBack, currentName, bgName
                    window.themesModal.openV2Node(nodeId, nodeType, false, null, state.selectedColor);
                }
            });

            container.appendChild(card);
        }
    });
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
                    <button id="themes-back-btn" class="themes-modal-back-btn" style="visibility: hidden; display: flex;">
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
    if (!modalBackButton) return;

    const canGoBack = navigationStack.length > 0 || onBackCallback;

    // Убираем класс hidden, так как он делает display: none и ломает Grid/Flex
    modalBackButton.classList.remove('hidden');
    modalBackButton.style.display = 'flex';

    if (canGoBack) {
        modalBackButton.style.visibility = 'visible';
        modalBackButton.style.pointerEvents = 'auto';
        modalBackButton.style.opacity = '1';
    } else {
        // Кнопка становится невидимой, но продолжает "подпирать" заголовок слева
        modalBackButton.style.visibility = 'hidden';
        modalBackButton.style.pointerEvents = 'none';
        modalBackButton.style.opacity = '0';
    }
}

// --- V2 навигация: открытие Group или Theme из дерева/списка ---

// --- V2 навигация: открытие Group или Theme из дерева/списка ---

// ❗️ ДОБАВЛЕН ПАРАМЕТР clearHistory для исправления ошибки кнопки "Назад"
async function openV2Node(nodeId, nodeType, clearHistory = true, explicitName = null, bgName = undefined) {
    if (clearHistory) {
        navigationStack = [];
    }

    if (bgName !== undefined) {
        currentBgName = bgName;
    } else {
        currentBgName = null;
    }

    document.body.classList.add('modal-open');
    if (modalOverlay) modalOverlay.classList.remove('hidden');
    updateBackButtonState();
    showLoadingState();
    toggleMainHeader(true);

    try {
        const parentsUrl = `${BASE_URL}/api/Thematic/V2/Parents/${nodeType}/${nodeId}`;
        const parentsResp = await fetch(parentsUrl, { headers: { 'Authorization': getApiAuthHeader() } });
        let parentsData = parentsResp.ok ? await parentsResp.json() : [];

        let currentName = explicitName;

        // 🔥 УМНЫЙ ПЕРЕХВАТЧИК: Если это тематика, и её родительская группа имеет такое же имя - переключаемся на группу
        if ((nodeType || '').toLowerCase() === 'theme' && currentName && parentsData && parentsData.length > 0) {
            const firstPath = parentsData[0];
            if (firstPath && firstPath.length > 0) {
                const immediateParent = firstPath[firstPath.length - 1];
                const parentName = immediateParent.Name || immediateParent.name;
                const parentType = (immediateParent.Type || immediateParent.type || '').toLowerCase();
                
                if (parentType === 'group' && parentName && currentName.toLowerCase() === parentName.toLowerCase()) {
                    const parentId = immediateParent.Id !== undefined ? immediateParent.Id : immediateParent.id;
                    console.log('🔄 Перенаправление с Тематики на Группу:', currentName);
                    
                    // Отменяем текущий рендер тематики и запускаем открытие группы с её правильным ID
                    return openV2Node(parentId, 'Group', false, currentName, currentBgName);
                }
            }
        } 
        
        // 🔥 ФИКС: Убрали жёсткий else. Теперь мы ставим заглушку, только если путей РЕАЛЬНО нет
        if (!parentsData || parentsData.length === 0) {
            parentsData = [[{ Name: currentName || `ID ${nodeId}`, Id: nodeId, Type: nodeType }]];
        }

        if (!currentName) currentName = `ID ${nodeId}`;
        if (modalTitle) modalTitle.textContent = currentName;

        let items = [];
        let themeModels = [];
        let topBackgrounds = []; // ❗️ НОВОЕ: Переменная для хранения фонов
        const isFinalTheme = (nodeType || '').toLowerCase() === 'theme';

        if (!isFinalTheme) {
            const layerUrl = `${BASE_URL}/api/Thematic/V2/Layer/${nodeId}?page=1&pageSize=50`;
            const layerResp = await fetch(layerUrl, { headers: { 'Authorization': getApiAuthHeader() } });
            const layerData = layerResp.ok ? await layerResp.json() : {};

            if (!currentName || (typeof currentName === 'string' && currentName.startsWith('ID '))) {
                currentName = layerData.RequestedNodeName || layerData.requestedNodeName || layerData.Name || layerData.name || layerData.GroupName || layerData.groupName || currentName;
            }

            const rawItems = layerData.Items || layerData.items || [];

            const themesToExtract = [];
            const itemsToKeep = [];

            rawItems.forEach(item => {
                const isItemTheme = (item.Type || item.type || '').toLowerCase() === 'theme';
                const itemName = item.Name || item.name;

                if (isItemTheme && itemName === currentName) {
                    themesToExtract.push(item);
                } else {
                    itemsToKeep.push(item);
                }
            });

            items = itemsToKeep;

            if (themesToExtract.length > 0) {
                const promises = themesToExtract.map(async (t) => {
                    const tId = t.Id !== undefined ? t.Id : t.id;
                    // ДОБАВЛЕНА ПЕРЕДАЧА ФОНА
                    let themeUrl = `${BASE_URL}/api/Thematic/V2/Theme/${tId}?page=1&pageSize=100`;
                    if (currentBgName) themeUrl += `&bgName=${encodeURIComponent(currentBgName)}`;

                    const tmResp = await fetch(themeUrl, { headers: { 'Authorization': getApiAuthHeader() } });
                    if (tmResp.ok) {
                        const tmData = await tmResp.json();
                        
                        // 🔥 ИСПРАВЛЕНИЕ: Извлекаем и сохраняем лучшие фоны для тематики
                        if (tmData.TopBackgrounds && tmData.TopBackgrounds.length > 0) {
                            tmData.TopBackgrounds.forEach(bg => {
                                if (!topBackgrounds.includes(bg)) {
                                    topBackgrounds.push(bg);
                                }
                            });
                        }

                        const models = tmData.Items || tmData.items || [];
                        models.forEach(m => {
                            m._sourceThemeName = t.Name || t.name;
                            m._isMainTheme = ((t.Name || t.name) === currentName);
                        });
                        return models;
                    }
                    return [];
                });
                const results = await Promise.all(promises);
                results.forEach(res => themeModels.push(...res));
            }
        } else {
            // ДОБАВЛЕНА ПЕРЕДАЧА ФОНА
            let themeUrl = `${BASE_URL}/api/Thematic/V2/Theme/${nodeId}?page=1&pageSize=100`;
            if (currentBgName) themeUrl += `&bgName=${encodeURIComponent(currentBgName)}`;

            const tmResp = await fetch(themeUrl, { headers: { 'Authorization': getApiAuthHeader() } });
            const tmData = tmResp.ok ? await tmResp.json() : {};

            // ❗️ НОВОЕ: Извлекаем фоны из ответа сервера
            topBackgrounds = tmData.TopBackgrounds || [];

            if (!currentName || (typeof currentName === 'string' && currentName.startsWith('ID '))) {
                currentName = tmData.RequestedNodeName || tmData.requestedNodeName || tmData.Name || tmData.name || tmData.ThemeName || tmData.themeName || currentName;
            }

            themeModels = tmData.Items || tmData.items || [];
        }

        if (modalTitle) modalTitle.textContent = currentName;

        if (parentsData && parentsData.length > 0) {
            parentsData.forEach(pathGroup => {
                if (pathGroup.length > 0) {
                    const lastNode = pathGroup[pathGroup.length - 1];
                    const lastNodeId = lastNode.Id !== undefined ? lastNode.Id : lastNode.id;
                    if (String(lastNodeId) !== String(nodeId)) {
                        pathGroup.push({ Name: currentName || `ID ${nodeId}`, Id: nodeId, Type: nodeType });
                    } else {
                        if (!currentName) currentName = lastNode.Name || lastNode.name;
                    }
                } else {
                    // 🔥 ФИКС: Если API вернуло пустой путь, принудительно добавляем текущую группу, чтобы путь не потерялся
                    pathGroup.push({ Name: currentName || `ID ${nodeId}`, Id: nodeId, Type: nodeType });
                }
            });
        } else {
            parentsData = [[{ Name: currentName || `ID ${nodeId}`, Id: nodeId, Type: nodeType }]];
        }

        hideLoadingState();
        modalContent.innerHTML = '';
        modalContent.classList.remove('loading', 'details-mode', 'no-padding');

        // ==========================================
        // 1. БЛОК: ПУТИ
        // ==========================================
        const validPaths = (parentsData || []).filter(pathGroup => pathGroup.length > 0);

        if (validPaths.length > 0) {
            const pathsSection = document.createElement('div');
            pathsSection.className = 'v2-layout-section';
            pathsSection.innerHTML = `
                <div class="v2-section-wrapper paths-mode" style="margin-top: 0;">
                    <div class="v2-section-title-box">ПУТИ</div>
                    <div class="v2-breadcrumb-container" id="v2-paths-box"></div>
                </div>
            `;
            modalContent.appendChild(pathsSection);
            const pathsBox = pathsSection.querySelector('#v2-paths-box');
            validPaths.forEach(pathGroup => {
                pathsBox.appendChild(buildBreadcrumbs(pathGroup, nodeId, nodeType));
            });
        }

        let isSingleCollection = false;
        let collectionName = '';
        const mainModelsOnly = themeModels.filter(m => m._isMainTheme || !m._sourceThemeName);
        if (mainModelsOnly.length > 0) {
            const firstGift = mainModelsOnly[0].GiftName || mainModelsOnly[0].giftName;
            const allSame = mainModelsOnly.every(m => (m.GiftName || m.giftName) === firstGift);
            if (allSame) {
                isSingleCollection = true;
                collectionName = firstGift;
            }
        }
        
        // ==========================================
        // 2. БЛОК: СОДЕРЖИМОЕ
        // ==========================================
        const contentSection = document.createElement('div');
        contentSection.className = 'v2-layout-section';
        const hasModels = themeModels.length > 0;
        
        // ❗️ ПРОВЕРКА: Сворачиваем ТОЛЬКО если это группа и есть другие вложения
        const isCollapsible = (nodeType || '').toLowerCase() === 'group' && hasModels && items.length > 0;

        // Формируем HTML для выбора фонов
        let bgSelectorHtml = '';
        if (topBackgrounds && topBackgrounds.length > 0) {
            let bgItemsHtml = '';
            const isNoBgActive = !currentBgName;

            bgItemsHtml += `
                <div class="bg-palette-item v2-bg-item ${isNoBgActive ? 'active' : ''}" data-bg="none">
                    <div class="bg-palette-color" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                    <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; margin-top: 4px; text-align: center; width: 100%; white-space: nowrap;">${t('modal_no_backdrop', 'Без фона')}</div>
                </div>
            `;

            topBackgrounds.forEach(bgNameStr => {
                const colorsArray = typeof GLOBAL_COLORS !== 'undefined' ? GLOBAL_COLORS : (window.themesFixedColors || []);
                const colorObj = colorsArray.find(c => c.name === bgNameStr || c.id === bgNameStr);

                if (colorObj) {
                    const isActive = currentBgName === bgNameStr;
                    bgItemsHtml += `
                        <div class="bg-palette-item v2-bg-item ${isActive ? 'active' : ''}" data-bg="${bgNameStr}">
                            <div class="bg-palette-color" style="background: ${colorObj.gradient};"></div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; margin-top: 4px; text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${bgNameStr}">${bgNameStr}</div>
                        </div>
                    `;
                }
            });

            bgSelectorHtml = `
                <div class="v2-theme-bg-selector" style="margin-bottom: 4px; background: transparent;">
                    <div class="palette-scroll-area" style="padding: 10px 16px; gap: 16px; margin: 0; align-items: flex-start;">
                        ${bgItemsHtml}
                    </div>
                </div>
            `;
        }

        contentSection.innerHTML = `
            <div class="v2-section-wrapper ${isCollapsible ? 'is-collapsed' : ''}" id="v2-content-wrapper" style="padding-top: 24px; padding-bottom: 24px;">
                <div class="v2-section-title-box" style="margin-bottom: 12px;">
                    <span>${t('modal_content_label', 'СОДЕРЖИМОЕ')}</span>
                    ${hasModels ? `
                    <div class="v2-section-controls">
                        <button id="v2-filter-toggle" class="v2-filter-btn" title="Фильтры">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/></svg>
                        </button>
                        <div id="v2-sort-menu" class="v2-sort-dropdown hidden">
                            <div class="v2-sort-dir-toggle" id="v2-dir-toggle-inside" style="justify-content: center; background: rgba(255,255,255,0.05); margin-bottom: 6px;">
                                <span id="v2-dir-text">${currentBgName ? t('modal_descending', 'По убыванию') : t('modal_ascending', 'По возрастанию')}</span>
                                <svg id="v2-dir-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px; margin-left:6px; transform: ${currentBgName ? 'rotate(180deg)' : 'none'};"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"/></svg>
                            </div>
                            ${currentBgName ? `<div class="v2-sort-option active" data-sort="bg">${t('modal_by_percent', 'По проценту')}</div>` : ''}
                            <div class="v2-sort-option" data-sort="name">${t('modal_by_name', 'По названию')}</div>
                            <div class="v2-sort-option" data-sort="count">${t('modal_by_quantity', 'По количеству')}</div>
                            <div class="v2-sort-option ${!currentBgName ? 'active' : ''}" data-sort="price">${t('modal_by_floors', 'По флорам')}</div>
                        </div>
                    </div>` : ''}
                </div>
                
                ${bgSelectorHtml}

                <div id="v2-content-box" style="position: relative; z-index: 1;"></div>
                
                ${isCollapsible ? `
                <div class="v2-section-fade"></div>
                <button class="v2-section-toggle-btn" id="v2-content-toggle">
                    <span id="v2-toggle-text">${t('modal_expand', 'Развернуть')}</span>
                    <svg id="v2-toggle-icon" style="transform: rotate(180deg);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                ` : ''}
            </div>
        `;
        modalContent.appendChild(contentSection);

        const bgItems = contentSection.querySelectorAll('.v2-bg-item');
        bgItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedBg = item.dataset.bg === 'none' ? null : item.dataset.bg;
                if (currentBgName !== selectedBg) {
                    openV2Node(nodeId, nodeType, false, currentName, selectedBg);
                }
            });
        });

        // ❗️ ЛОГИКА РАЗВОРАЧИВАНИЯ БЕЗ ЛИМИТОВ
        const toggleBtn = contentSection.querySelector('#v2-content-toggle');
        const contentWrapper = contentSection.querySelector('#v2-content-wrapper');
        
        if (toggleBtn && contentWrapper) {
            toggleBtn.onclick = () => {
                const isCollapsed = contentWrapper.classList.contains('is-collapsed');
                const collArea = contentSection.querySelector('.v2-section-collapsible');
                if (isCollapsed) {
                    contentWrapper.classList.remove('is-collapsed');
                    document.getElementById('v2-toggle-text').textContent = t('modal_collapse', 'Свернуть');
                    document.getElementById('v2-toggle-icon').style.transform = 'none';
                    if (collArea) collArea.style.maxHeight = 'none'; // Отключаем CSS лимит 5000px
                } else {
                    contentWrapper.classList.add('is-collapsed');
                    document.getElementById('v2-toggle-text').textContent = t('modal_expand', 'Развернуть');
                    document.getElementById('v2-toggle-icon').style.transform = 'rotate(180deg)';
                    if (collArea) collArea.style.maxHeight = ''; // Возвращаем CSS лимит
                    contentWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            };
        }

        const contentBox = contentSection.querySelector('#v2-content-box');
        if (hasModels) {
            renderV2ThemeContent(themeModels, contentBox, nodeId, nodeType, isSingleCollection, collectionName, currentName);
        } else {
            items.sort((a, b) => {
                const getCount = (obj) => obj.ModelCount ?? obj.modelCount ?? obj.TotalCount ?? obj.totalCount ?? obj.Count ?? obj.count ?? 0;
                return getCount(b) - getCount(a);
            });
            renderV2ItemsGrid(items, contentBox, nodeId, nodeType);
        }

        // ==========================================
        // 3. БЛОК: ВЛОЖЕНИЯ
        // ==========================================
        if (hasModels && items.length > 0) {
            const extraSection = document.createElement('div');
            extraSection.className = 'v2-layout-section';
            extraSection.innerHTML = `
                <div class="v2-section-wrapper" style="padding-top: 6px;">
                    <div class="v2-section-title-box" style="margin-bottom: 8px;">
                        <span>${t('modal_attachments_label', 'ВЛОЖЕНИЯ')}</span>
                        <div class="v2-section-controls" style="display:flex; gap:6px; align-items:center;">
                            <button id="v2-extra-filter-toggle" class="v2-filter-btn" title="Фильтры">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/></svg>
                            </button>
                            <div id="v2-extra-sort-menu" class="v2-sort-dropdown hidden">
                                <div class="v2-sort-dir-toggle" id="v2-extra-dir-toggle-inside" style="justify-content: center; background: rgba(255,255,255,0.05); margin-bottom: 6px;">
                                    <span id="v2-extra-dir-text">${t('modal_ascending', 'По возрастанию')}</span>
                                    <svg id="v2-extra-dir-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px; margin-left:6px; transform: none;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"/></svg>
                                </div>
                                <div class="v2-sort-option" data-sort="name">${t('modal_by_name', 'По названию')}</div>
                                <div class="v2-sort-option" data-sort="count">${t('modal_by_quantity', 'По количеству')}</div>
                                <div class="v2-sort-option active" data-sort="price">${t('modal_by_floors', 'По флорам')}</div>
                            </div>
                        </div>
                    </div>
                    <div id="v2-extra-content-box" style="position: relative; z-index: 1;"></div>
                </div>
            `;
            modalContent.appendChild(extraSection);

            const extraContentBox = extraSection.querySelector('#v2-extra-content-box');
            let currentExtraSort = 'price'; // По умолчанию цена
            let isAscendingExtra = true; // От меньшего к большему

            const filterBtnExtra = extraSection.querySelector('#v2-extra-filter-toggle');
            const sortMenuExtra = extraSection.querySelector('#v2-extra-sort-menu');
            const dirBtnExtraInside = extraSection.querySelector('#v2-extra-dir-toggle-inside');

            if (filterBtnExtra && sortMenuExtra) {
                filterBtnExtra.onclick = (e) => {
                    e.stopPropagation();
                    sortMenuExtra.classList.toggle('hidden');
                };
                document.addEventListener('click', (e) => {
                    if (!filterBtnExtra.contains(e.target) && !sortMenuExtra.contains(e.target)) sortMenuExtra.classList.add('hidden');
                });

                if (dirBtnExtraInside) {
                    dirBtnExtraInside.onclick = (e) => {
                        e.stopPropagation();
                        isAscendingExtra = !isAscendingExtra;
                        document.getElementById('v2-extra-dir-text').textContent = isAscendingExtra ? t('modal_ascending', 'По возрастанию') : t('modal_descending', 'По убыванию');
                        document.getElementById('v2-extra-dir-icon').style.transform = isAscendingExtra ? 'none' : 'rotate(180deg)';
                        renderDefault();
                    };
                }

                const optsExtra = sortMenuExtra.querySelectorAll('.v2-sort-option');
                optsExtra.forEach(opt => {
                    opt.onclick = () => {
                        optsExtra.forEach(o => o.classList.remove('active'));
                        opt.classList.add('active');
                        currentExtraSort = opt.dataset.sort;

                        if (currentExtraSort === 'name') {
                            isAscendingExtra = true;
                            document.getElementById('v2-extra-dir-text').textContent = t('modal_ascending', 'По возрастанию');
                            document.getElementById('v2-extra-dir-icon').style.transform = 'none';
                        } else {
                            isAscendingExtra = false;
                            document.getElementById('v2-extra-dir-text').textContent = t('modal_descending', 'По убыванию');
                            document.getElementById('v2-extra-dir-icon').style.transform = 'rotate(180deg)';
                        }
                        sortMenuExtra.classList.add('hidden');
                        renderDefault();
                    };
                });
            }

            const getCount = (obj) => {
                if (obj.ModelCount !== undefined && obj.ModelCount !== null) return obj.ModelCount;
                if (obj.modelCount !== undefined && obj.modelCount !== null) return obj.modelCount;
                if (obj.TotalCount !== undefined && obj.TotalCount !== null) return obj.TotalCount;
                if (obj.totalCount !== undefined && obj.totalCount !== null) return obj.totalCount;
                if (obj.Count !== undefined && obj.Count !== null) return obj.Count;
                return obj.count || 0;
            };

            const sortExtraItems = (sourceItems) => {
                const crit = currentExtraSort;
                const sortedItems = [...sourceItems].sort((a, b) => {
                    let valA, valB;
                    if (crit === 'count') {
                        valA = getCount(a); valB = getCount(b);
                        return isAscendingExtra ? (valA - valB) : (valB - valA);
                    } else if (crit === 'price') {
                        valA = a.MedianPrice !== undefined ? a.MedianPrice : (a.medianPrice || 0);
                        valB = b.MedianPrice !== undefined ? b.MedianPrice : (b.medianPrice || 0);
                        return isAscendingExtra ? (valA - valB) : (valB - valA);
                    } else {
                        valA = (a.Name || a.name || '').toLowerCase();
                        valB = (b.Name || b.name || '').toLowerCase();
                        if (valA < valB) return isAscendingExtra ? -1 : 1;
                        if (valA > valB) return isAscendingExtra ? 1 : -1;
                        return 0;
                    }
                });

                extraContentBox.innerHTML = '';
                // Поисковый режим: noTree=true, иначе tree-mode
                renderV2ItemsGrid(sortedItems, extraContentBox, nodeId, nodeType, currentSearchQuery.length > 0);
            };

            const renderDefault = () => sortExtraItems(items);

            renderDefault();
        }

    } catch (e) {
        console.error('[openV2Node] Error:', e);
        hideLoadingState();
        if (modalContent) modalContent.innerHTML = `<p style="text-align:center; color:#f87171; margin-top:2rem;">${t('modal_load_v2_error', 'Ошибка загрузки V2')}</p>`;
    }
}

function renderV2ItemsGrid(itemsList, container, parentNodeId, parentNodeType, noTree = false, backRestoreFn = null) {
    if (!itemsList || itemsList.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin:0;">${t('empty', 'Пусто')}</p>`;
        return;
    }

    // Проверяем, рендерим ли мы сетку внутри аккордеона деталей
    const isDetailAccordion = container.id === 'tm-v2-grid';

    const grid = document.createElement('div');
    grid.className = 'themes-list-container';

    itemsList.forEach(item => {
        const isItemTheme = (item.Type || item.type || '').toLowerCase() === 'theme';
        const previews = item.Previews || item.previews || [];

        let modelsCount = 999;
        if (item.ModelCount !== undefined && item.ModelCount !== null) modelsCount = item.ModelCount;
        else if (item.modelCount !== undefined && item.modelCount !== null) modelsCount = item.modelCount;
        else if (item.TotalCount !== undefined && item.TotalCount !== null) modelsCount = item.TotalCount;
        else if (item.totalCount !== undefined && item.totalCount !== null) modelsCount = item.totalCount;
        else if (item.Count !== undefined && item.Count !== null) modelsCount = item.Count;
        else if (item.count !== undefined && item.count !== null) modelsCount = item.count;
        else if (previews.length > 0) modelsCount = previews.length;

        const itemName = item.Name || item.name;
        const itemId = item.Id !== undefined ? item.Id : item.id;
        const itemType = item.Type || item.type;
        const colorHex = item.ThemeColor || item.themeColor || '#2563eb';

        // 1. ЕСЛИ ЭТО МЕЛКАЯ ТЕМАТИКА (до 3х моделей) -> ПОКАЗЫВАЕМ ВЛОЖЕНИЯ СРАЗУ
        if (isItemTheme && modelsCount > 0 && modelsCount <= 3) {
            const baseId = 'inline-theme-' + itemId;
            const inlineThemeBox = document.createElement('div');
            inlineThemeBox.className = 'v2-premium-card v2-inline-theme';

            inlineThemeBox.style.setProperty('--theme-color', colorHex);
            inlineThemeBox.style.setProperty('--glow-color', colorHex);
            inlineThemeBox.style.height = 'auto';
            inlineThemeBox.style.minHeight = '140px';
            inlineThemeBox.style.paddingBottom = '6px';

            const paletteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px;margin-right:4px;"><path fill-rule="evenodd" d="M11.3 1.046A12.014 12.014 0 0010.337 1a10.034 10.034 0 00-6.16 2.053 9.948 9.948 0 00-3.13 6.643c-.024.321-.034.646-.034.975 0 5.485 4.544 9.942 10.151 9.942 2.091 0 4.041-.63 5.672-1.706a1.986 1.986 0 00.864-1.637 1.985 1.985 0 00-1.282-1.854l-2.02-.741a.486.486 0 01-.26-.532l.278-1.57a1.488 1.488 0 00-1.238-1.722l-1.928-.276a.486.486 0 01-.365-.635l.89-2.181a1.488 1.488 0 00-.737-1.862l-1.831-.884a.487.487 0 01-.24-.657l1.01-2.222A1.488 1.488 0 0011.3 1.046zM6.5 7.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm1.5 5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-5.5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clip-rule="evenodd" /></svg>`;

            const colsCount = previews && previews.length > 0 ? previews.length : 1;
            
            // Прячем тег "Тематика", если мы в аккордеоне деталей
            const inlineThemeTagHtml = isDetailAccordion ? '' : `<span class="v2-type-tag premium-tag v2-theme-tag">${paletteIcon}Тематика</span>`;

            inlineThemeBox.innerHTML = `
                <div class="v2-card-bg-container">
                    <div class="v2-card-glow"></div>
                    <div class="v2-tag-glow" style="--tag-color: #2563eb;"></div>
                </div>
                ${inlineThemeTagHtml}
                <div class="v2-card-content-inline" style="position: relative; z-index: 2; padding: 0; margin-top: ${isDetailAccordion ? '16px' : '32px'}; display: flex; flex-direction: column; width: 100%; box-sizing: border-box;">
                    <div class="v2-card-info" style="margin-bottom: 8px; padding: 0 16px; cursor: pointer;">
                        <div class="v2-card-title" style="font-size: 1.15rem; font-weight: 600; color: #fff;">${itemName}</div>
                    </div>
                    <div id="grid-${baseId}" style="width: 100%; display: grid; grid-template-columns: repeat(${colsCount}, calc((100% - 16px) / 3)); justify-content: center; gap: 8px; padding: 0;">
                    </div>
                </div>
            `;
            grid.appendChild(inlineThemeBox);

            const titleRow = inlineThemeBox.querySelector('.v2-card-info');
            titleRow.addEventListener('click', (e) => {
                e.stopPropagation();
                const modalName = document.getElementById('themes-modal-title') ? document.getElementById('themes-modal-title').textContent : null;
                if (parentNodeId != null) {
                    pushToHistory(() => openV2Node(parentNodeId, parentNodeType, false, modalName, currentBgName));
                } else if (backRestoreFn) {
                    pushToHistory(backRestoreFn);
                }
                openV2Node(itemId, itemType, false, itemName, null);
            });

            const gridContainer = inlineThemeBox.querySelector(`#grid-${baseId}`);

            if (!previews || previews.length === 0) {
                gridContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; text-align:center; width:100%;">Пусто</p>';
            } else {
                previews.forEach(m => {
                    const giftName = m.GiftName || m.giftName;
                    const modelName = m.ModelName || m.modelName;
                    const mColorHex = m.AverageColorHex || m.averageColorHex || m.GroupColorHex || m.groupColorHex || colorHex;
                    const isCollectionMarker = modelName === 'CollectionMarker' || m.IsCollectionWide;

                    const card = document.createElement('div');
                    card.className = 'v2-model-card';
                    card.style.setProperty('--card-gradient-color', mColorHex);
                    const imgUrl = window.getModelImageUrl(giftName, modelName);

                    if (isCollectionMarker) {
                        card.style.cursor = 'default';
                        card.style.pointerEvents = 'none';
                        card.innerHTML = `
                            <div class="v2-mc-gradient"></div>
                            <div class="v2-mc-image"><img src="${imgUrl}" loading="lazy"></div>
                            <div class="v2-mc-info" style="justify-content: center;">
                                <div class="v2-mc-title" style="font-size: 0.9rem; margin-bottom: 2px;">${giftName}</div>
                                <div class="v2-mc-subtitle">Вся коллекция</div>
                            </div>
                        `;
                    } else {
                        const count = m.TotalCount !== undefined ? m.TotalCount : (m.Count !== undefined ? m.Count : (m.count || m.totalCount || 0));
                        const price = m.AVGPrice !== undefined ? m.AVGPrice : (m.Price || m.avgPrice || m.price || 0);
                        
                        const priceIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.012 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.882-1.826h10.817c1.033 0 1.873.815 1.873 1.822a1.8 1.8 0 0 1-.274.951M6.51 8.863l4.633 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.004-.72-.484-.72h-4.149z"/></svg>`;
                        const countIcon = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1H3zM2 9.5A1.5 1.5 0 013.5 8h13A1.5 1.5 0 0118 9.5v6.042a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.542V9.5z" clip-rule="evenodd"/></svg>`;

                        const statRows = `
                            <div class="v2-mc-stat-badge" style="margin-bottom: 2px;">${countIcon} <span>${count}</span></div>
                            <div class="v2-mc-stat-badge">${priceIcon} <span>${price > 0 ? formatPrice(price) : '-'}</span></div>
                        `;

                        card.innerHTML = `
                            <div class="v2-mc-gradient"></div>
                            <div class="v2-mc-image"><img src="${imgUrl}" loading="lazy"></div>
                            <div class="v2-mc-info">
                                <div class="v2-mc-title">${modelName}</div>
                                <div class="v2-mc-subtitle">${giftName}</div>
                                <div class="v2-mc-stats" style="flex-direction: column; align-items: flex-end; gap: 0;">${statRows}</div>
                            </div>
                        `;
                        
                        card.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const savedBg = currentBgName;
                            if (parentNodeId != null) {
                                pushToHistory(() => openV2Node(parentNodeId, parentNodeType, false, null, savedBg));
                            } else if (backRestoreFn) {
                                pushToHistory(backRestoreFn);
                            }
                            openModelDetail(giftName, modelName, savedBg, null, true);
                        });
                    }
                    
                    gridContainer.appendChild(card);
                });
            }

        // 2. ВСЕ ОСТАЛЬНЫЕ (БОЛЬШИЕ ТЕМЫ И ГРУППЫ) -> СТАНДАРТНАЯ КАРТОЧКА
        } else {
            const card = document.createElement('div');
            card.className = 'v2-premium-card';

            card.style.setProperty('--theme-color', colorHex);
            card.style.setProperty('--glow-color', colorHex);

            const isGroup = (item.Type || item.type || '').toLowerCase() === 'group';
            const typeLabel = isGroup ? 'Группа' : 'Тематика';
            const typeTagClass = isGroup ? 'v2-group-tag' : 'v2-theme-tag';

            const folderIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px;margin-right:4px;"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>`;
            const paletteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px;margin-right:4px;"><path fill-rule="evenodd" d="M11.3 1.046A12.014 12.014 0 0010.337 1a10.034 10.034 0 00-6.16 2.053 9.948 9.948 0 00-3.13 6.643c-.024.321-.034.646-.034.975 0 5.485 4.544 9.942 10.151 9.942 2.091 0 4.041-.63 5.672-1.706a1.986 1.986 0 00.864-1.637 1.985 1.985 0 00-1.282-1.854l-2.02-.741a.486.486 0 01-.26-.532l.278-1.57a1.488 1.488 0 00-1.238-1.722l-1.928-.276a.486.486 0 01-.365-.635l.89-2.181a1.488 1.488 0 00-.737-1.862l-1.831-.884a.487.487 0 01-.24-.657l1.01-2.222A1.488 1.488 0 0011.3 1.046zM6.5 7.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm1.5 5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-5.5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clip-rule="evenodd" /></svg>`;
            const typeIcon = isGroup ? folderIcon : paletteIcon;
            const countClass = `items-${Math.min(previews.length, 5)}`;

            let iconsHtml = '';
            previews.slice(0, 5).forEach((g, idx) => {
                const gName = g.GiftName || g.giftName;
                const mName = g.ModelName || g.modelName;
                const imgUrl = window.getModelImageUrl(gName, mName);
                const gColor = g.AverageColorHex || g.averageColorHex || colorHex;
                iconsHtml += `<div class="tpc-icon-box pos-${idx}" style="--icon-bg: ${gColor}; background: ${gColor};"><img src="${imgUrl}" class="tpc-img" loading="lazy"></div>`;
            });

            const mediaPrice = item.MedianPrice || item.medianPrice || 0;
            let countLabel = '';
            if (isGroup) {
                const themes = item.ChildThemeCount || item.childThemeCount || 0;
                const groups = item.ChildGroupCount || item.childGroupCount || 0;
                let parts = [];
                if (themes > 0) parts.push(`${themes} тем.`);
                if (groups > 0) parts.push(`${groups} гр.`);
                if (parts.length > 0) countLabel = parts.join(' / ');
            } else if (modelsCount > 0) {
                countLabel = `${modelsCount} шт.`;
            }

            const mediaPriceTag = mediaPrice > 0 ? `<span class="v2-type-tag" style="position:static;transform:none;color:#93c5fd;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.25);box-shadow:0 2px 8px rgba(0,0,0,0.3);">${mediaPrice >= 1 ? '~' + mediaPrice.toFixed(2) + ' TON' : '~' + (mediaPrice * 1000).toFixed(0) + ' nTON'}</span>` : '';
            const countTagHtml = countLabel ? `<span class="v2-type-tag" style="position:static;transform:none;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.05);box-shadow:0 2px 8px rgba(0,0,0,0.3);">${countLabel}</span>` : '';
            const rightTagsHtml = (countTagHtml || mediaPriceTag) ? `<div style="position:absolute;top:0;right:12px;transform:translateY(-50%);display:flex;gap:6px;z-index:10;">${mediaPriceTag}${countTagHtml}</div>` : '';

            const tagGlowColor = isGroup ? '#6366f1' : '#2563eb';
            
            // Прячем тег, если рендеримся внутри аккордеона деталей модели
            const mainTagHtml = isDetailAccordion ? '' : `<span class="v2-type-tag premium-tag ${typeTagClass}">${typeIcon}${typeLabel}</span>`;

            card.innerHTML = `
                <div class="v2-card-bg-container">
                    <div class="v2-card-glow"></div>
                    <div class="v2-tag-glow" style="--tag-color: ${tagGlowColor};"></div>
                </div>
                ${mainTagHtml}
                ${rightTagsHtml}
                <div class="v2-card-content">
                    <div class="v2-card-info"><div class="v2-card-title">${itemName}</div></div>
                    <div class="tpc-visuals ${countClass}">${iconsHtml}</div>
                    <div class="v2-card-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7-7" /></svg></div>
                </div>
            `;

            card.addEventListener('click', () => {
                const savedBg = currentBgName;
                const modalName = document.getElementById('themes-modal-title')
                    ? document.getElementById('themes-modal-title').textContent : null;
                if (parentNodeId != null) {
                    pushToHistory(() => openV2Node(parentNodeId, parentNodeType, false, modalName, savedBg));
                } else if (backRestoreFn) {
                    pushToHistory(backRestoreFn);
                }
                openV2Node(itemId, itemType, false, itemName);
            });
            
            grid.appendChild(card);
        }
    });

    container.appendChild(grid);
}

// 3. ПОЛНОСТЬЮ ЗАМЕНИ ФУНКЦИЮ buildBreadcrumbs
function buildBreadcrumbs(pathNodes, currentId, currentType) {
    const crumbsEl = document.createElement('div');
    crumbsEl.className = 'v2-breadcrumb-path';

    const homeIcon = `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>`;
    const sepIcon = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>`;

    pathNodes.forEach((node, idx) => {
        const isLast = idx === pathNodes.length - 1;
        const span = document.createElement('span');
        span.className = 'v2-crumb-item' + (isLast ? ' current' : '');

        const nodeName = node.Name || node.name;
        const nodeId = node.Id !== undefined ? node.Id : node.id;
        const nodeTypeB = node.Type || node.type;

        span.innerHTML = idx === 0
            ? `<span class="icon">${homeIcon}</span> <span>${nodeName}</span>`
            : `<span>${nodeName}</span>`;
        span.title = nodeName;

        if (!isLast) {
            span.addEventListener('click', () => {
                const savedBg = currentBgName; // ❗️ ФИКС: Сохраняем фон
                const modalName = document.getElementById('themes-modal-title') ? document.getElementById('themes-modal-title').textContent : null;
                pushToHistory(() => openV2Node(currentId, currentType, false, modalName, savedBg));

                // Переходим на новый узел явно передавая null, чтобы фон исчез
                openV2Node(nodeId, nodeTypeB, false, nodeName, null);
            });
        }

        crumbsEl.appendChild(span);

        if (!isLast) {
            const sep = document.createElement('span');
            sep.className = 'v2-crumb-sep';
            sep.innerHTML = sepIcon;
            crumbsEl.appendChild(sep);
        }
    });

    return crumbsEl;
}




// 4. Экспортируем публичные методы в глобальный объект
window.themesModal = {
    init,
    open,
    openModelDetail,
    openCollection,
    openV2Node,    // НОВОЕ: открытие V2-ноды с хлебными крошками
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

    // Сценарий 1: Умный поиск монохромов
    const url = `${BASE_URL}/api/BaseInfo/GetModelMonochromeOffers`;
    const body = {
        CollectionName: nftsState.currentGift,
        ModelName: nftsState.currentModel,
        Page: nftsState.page,
        PageSize: nftsState.pageSize,
        MinScore: 0.5
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        // 📢 === ПЕРЕХВАТ 403 (ПОДПИСКА) ===
        if (response.status === 403) {
            try {
                const errData = await response.json();
                if (errData.error === 'subscription_required') {
                    if (window.showSubscriptionModal) window.showSubscriptionModal();
                    return;
                }
            } catch(e) {}
        }
        // ==================================

        if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                renderMonochromeCards(data.items); 
                nftsState.hasMore = nftsState.page < data.totalPages;
                nftsState.page++;
            } else {
                nftsState.hasMore = false;
            }
        }
    } catch (error) {
        console.error("Smart Search Error:", error);
    } finally {
        nftsState.isLoading = false;
    }
}

window.renderMonochromeCards = function (items, container) {
    items.forEach(item => {
        const card = document.createElement('a');
        card.className = 'nft-market-card';
        card.href = item.telegramUrl;
        card.target = "_blank";

        const scorePercent = (item.monochromeScore * 100).toFixed(1);

        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${item.imageUrl}" loading="lazy">
                <div class="score-badge">${scorePercent}%</div>
            </div>
            <div class="card-details">
                <div class="price-row">
                    <svg class="ton-icon">...</svg>
                    <span>${item.price} TON</span>
                </div>
                <div class="market-tag">${item.marketplace}</div>
            </div>
        `;
        container.appendChild(card);
    });
};

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
            window.location.href = '../index.html' + (window.location.hash || '');
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

window.showSubscriptionModal = function() {
    const existingModal = document.getElementById('sub-required-modal');
    if (existingModal) {
        existingModal.style.display = 'flex';
        return;
    }

    const channelUrl = "https://t.me/NFTstyler"; // Ссылка на твой канал

    const modalHtml = `
        <div id="sub-required-modal" class="modal-overlay" style="display: flex; z-index: 100000; flex-direction: column; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(5px);">
            <div class="sub-modal-content" style="background: var(--surface-color); width: 90%; max-width: 320px; border-radius: 20px; padding: 24px; text-align: center; border: 1px solid var(--border-color); animation: popIn 0.2s ease-out; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                <div class="modal-icon" style="color: var(--primary-color); margin-bottom: 16px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                </div>
                <h3 style="margin: 0 0 10px 0; color: #fff; font-size: 1.2rem;">${window.NFTi18n ? window.NFTi18n.t('sub_required', 'Требуется подписка') : 'Требуется подписка'}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.5;">
                    ${window.NFTi18n ? window.NFTi18n.t('sub_desc', 'Чтобы пользоваться поиском маркета и продвинутой аналитикой, необходимо быть подписчиком нашего Telegram канала.') : 'Чтобы пользоваться поиском маркета и продвинутой аналитикой, необходимо быть подписчиком нашего Telegram канала.'}
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <a href="${channelUrl}" target="_blank" style="background: var(--primary-color); color: #0a1020; text-decoration: none; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 0.95rem; transition: transform 0.2s;">
                        ${window.NFTi18n ? window.NFTi18n.t('go_to_channel', 'Перейти в канал') : 'Перейти в канал'}
                    </a>
                    <button onclick="document.getElementById('sub-required-modal').style.display='none'" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                        ${window.NFTi18n ? window.NFTi18n.t('later', 'Позже') : 'Позже'}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};