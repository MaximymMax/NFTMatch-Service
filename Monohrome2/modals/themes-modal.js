// themes-modal.js

// Глобальные переменные модуля
let BASE_URL = '';
let PHOTO_URL = '';
let lazyLoadSetup; // Функция для ленивой загрузки

let modalOverlay, modalContent, modalTitle, modalBackButton;
let currentThemes = [];
let currentGift = '';
let currentModel = '';

// --- Новые глобальные переменные ---
let currentView = 'themes'; // 'themes', 'models', 'details'
let currentThemeName = '';
let currentThemeGifts = [];
let currentThemeGroups = [];
let currentSortMode = 'group'; // 'group', 'price', 'count'
let hasColorGroups = false; // ❗️ НОВАЯ ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ
const INIT_DATA_KEY = 'tgInitData';
const BYPASS_KEY_STORAGE = 'apiBypassKey';

// Иконка поиска, скопированная из background-finder.js
const searchIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>';

// --- Хелперы ---

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
            try { sessionStorage.setItem(INIT_DATA_KEY, directInitData); } catch(e) {}
            return `Tma ${directInitData}`;
        }
    }

    console.error("[AUTH Themes] Не удалось получить initData или ключ обхода.");
    return 'Tma invalid';
}

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
    // ❗️ ВАЖНО: Если мы переходим в загрузку, убираем режим деталей,
    // чтобы спиннер был по центру и с отступами
    if (modalContent) modalContent.classList.remove('details-mode');
    
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

// ❗️ НОВАЯ ФУНКЦИЯ: Заполняет сетку на основе сортировки
function populateModelGrid() {
    const container = document.getElementById('tm-models-grid-container');
    container.innerHTML = ''; 
    
    if (currentThemeGifts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Нет подарков.</p>';
        return;
    }

    // --- РЕЖИМ 1: Сортировка по КОЛИЧЕСТВУ ---
    if (currentSortMode === 'count') {
        const sortedGifts = [...currentThemeGifts].sort((a, b) => b.Count - a.Count);
        
        // Обертка для отступов
        const wrapper = document.createElement('div');
        wrapper.style.padding = '0 0.5rem';
        
        const grid = document.createElement('div');
        grid.className = 'models-in-theme-grid';
        
        sortedGifts.forEach(gift => {
            grid.appendChild(createCountGiftCard(gift));
        });
        
        wrapper.appendChild(grid);
        container.appendChild(wrapper);
    } 
    // --- РЕЖИМ 2: Сортировка по ЦВЕТУ (Кластеры) ---
    else {
        const groupsMap = {};
        currentThemeGroups.forEach(g => { groupsMap[g.GroupId] = []; });
        if (!groupsMap[0]) groupsMap[0] = [];

        currentThemeGifts.forEach(gift => {
            const gId = gift.GroupId || 0;
            if (!groupsMap[gId]) groupsMap[gId] = [];
            groupsMap[gId].push(gift);
        });

        const sortedGroupIds = Object.keys(groupsMap).sort((a, b) => {
            if (a == 0) return 1; 
            if (b == 0) return -1;
            return a - b;
        });

        sortedGroupIds.forEach(groupId => {
            const giftsInGroup = groupsMap[groupId];
            if (giftsInGroup.length === 0) return;

            const groupInfo = currentThemeGroups.find(g => g.GroupId == groupId);
            const colorHex = groupInfo ? groupInfo.AverageColorHex : null;

            if (colorHex) {
                // СОЗДАЕМ КЛАСТЕР (Рамка + Заголовок)
                const clusterDiv = document.createElement('div');
                clusterDiv.className = 'theme-group-cluster'; 
                
                const headerDiv = document.createElement('div');
                headerDiv.className = 'group-header-label';
                headerDiv.innerHTML = `
                    <span class="group-text">Средний цвет:</span>
                    <span class="group-badge" style="background-color:${colorHex};">${colorHex}</span>
                `;
                
                const gridDiv = document.createElement('div');
                gridDiv.className = 'models-in-theme-grid';
                
                giftsInGroup.sort((a, b) => b.Count - a.Count);
                giftsInGroup.forEach(gift => {
                    gridDiv.appendChild(createColorGiftCard(gift, colorHex));
                });

                clusterDiv.appendChild(headerDiv);
                clusterDiv.appendChild(gridDiv);
                container.appendChild(clusterDiv);
            } 
            else {
                // ГРУППА БЕЗ ЦВЕТА (Остальные)
                // Теперь тоже оборачиваем в theme-group-cluster для рамки
                
                const clusterDiv = document.createElement('div');
                clusterDiv.className = 'theme-group-cluster'; 
                // Заголовок (headerDiv) НЕ добавляем, чтобы была просто рамка

                const gridDiv = document.createElement('div');
                gridDiv.className = 'models-in-theme-grid';
                
                giftsInGroup.sort((a, b) => b.Count - a.Count);
                giftsInGroup.forEach(gift => {
                    gridDiv.appendChild(createColorGiftCard(gift, null));
                });
                
                clusterDiv.appendChild(gridDiv);
                container.appendChild(clusterDiv);
            }
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
    
    // ❗️ Клик удален
    
    return card;
}

function createCountGiftCard(gift) {
    const card = document.createElement('div');
    // Используем класс, который мы стилизовали в CSS как копию color-mode
    card.className = 'model-card-count-mode';
    
    const imgUrl = `${PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;

    // Структура идентична createColorGiftCard
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
    
    // ❗️ Клик удален
    
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
    // Создаем HTML с НОВОЙ оберткой tm-buttons-wrapper
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
async function loadAndRenderModelView(collectionName) {
    showLoadingState();
    toggleMainHeader(true);
    modalTitle.textContent = collectionName;
    currentView = 'models';
    currentThemeName = collectionName; // Сохраняем для использования
    
    // Скрываем подвал на внутренних страницах (или оставляем, как хотите)
    const footer = document.querySelector('#themes-modal-overlay .themes-modal-footer');
    if (footer) footer.style.display = 'none';

    // Проверяем, есть ли уже данные (если мы нажали "Назад" и вернулись сюда, данные могут быть старыми)
    // Лучше загрузить заново или проверить кэш. Для простоты грузим.
    const url = `${BASE_URL}/api/Thematic/GetGiftsByCollection/${encodeURIComponent(collectionName)}/WithParameters`;
    
    try {
        const response = await fetch(url, { headers: { 'Authorization': getApiAuthHeader() } });
        const data = await response.json();
        
        currentThemeGifts = data.Gifts || [];
        currentThemeGroups = data.Groups || [];
        currentSortMode = 'color'; // Сброс сортировки
        
        renderModelListViewUI(); // Рисуем UI
        populateModelGrid();     // Рисуем сетку
        
    } catch (e) {
        console.error(e);
        modalContent.innerHTML = '<p>Error loading collection</p>';
    }
}

function onModelCardClick(gift) {
    // Сохраняем текущее состояние (Список моделей) в стек
    pushToHistory(() => {
        // Чтобы восстановить список, нам нужно знать имя коллекции.
        // Мы сохранили его в global currentThemeName при входе в этот экран
        loadAndRenderModelView(currentThemeName); 
    });
    
    // Рендерим детали
    renderModelDetailView(gift);
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
    // Показываем мини-спиннер
    container.innerHTML = `
        <span style="font-size: 0.9rem; color: var(--text-muted); display: block; text-align: center; margin-top: 1rem;">
            <span class="loading-spinner-mini" style="width:14px; height: 14px; border-width: 2px;"></span>
            Загрузка...
        </span>`;

    const url = `${BASE_URL}/api/BaseInfo/GetSimilarGiftsForVisualization/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}`;

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': getApiAuthHeader() }
        });
        if (!response.ok) throw new Error('Network response error');
        
        const data = await response.json();
        if (!data || !data.SimilarGifts || data.SimilarGifts.length < 2) {
            throw new Error('Not enough similar gifts found');
        }

        const link = document.createElement('a');
        link.href = `/nft-page/index.html?giftName=${encodeURIComponent(giftName)}&modelName=${encodeURIComponent(modelName)}&randomGiftsCount=10`;
        link.id = 'show-themes-link'; // Используем ID для стилей
        link.className = 'similar-fallback-style'; // Используем класс для стилей

        const color = data.TargetGiftMainColorHex || '#38bdf8';
        link.style.setProperty('--similar-color', color);

        const imgLeftSrc = `${PHOTO_URL}/${encodeURIComponent(data.SimilarGifts[0].GiftName)}/png/${encodeURIComponent(data.SimilarGifts[0].ModelName)}.png`;
        const imgRightSrc = `${PHOTO_URL}/${encodeURIComponent(data.SimilarGifts[1].GiftName)}/png/${encodeURIComponent(data.SimilarGifts[1].ModelName)}.png`;

        link.innerHTML = `
            <div class="fallback-glow"></div>
            <img src="${imgLeftSrc}" alt="similar 1" class="fallback-img left">
            <span>Похожие по цвету</span>
            <img src="${imgRightSrc}" alt="similar 2" class="fallback-img right">
        `;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = link.href;
        });
        
        container.innerHTML = ''; // Очищаем спиннер
        container.appendChild(link);
        
    } catch (error) {
        console.warn("[Similar Button Fallback] Ошибка:", error.message);
        container.innerHTML = ''; // Ничего не показываем, если ошибка
    }
}

/**
 * Рендерит View 3: Детали (Без изменений, но заголовок теперь ставится из themeData)
 */
function renderModelDetailView(modelData) {
    currentView = 'details';
    
    // 1. Настройка контейнера
    modalContent.innerHTML = '';
    modalContent.classList.remove('loading');
    modalContent.classList.add('details-mode');

    // 2. ВАЖНО: ПОКАЗЫВАЕМ ШАПКУ (чтобы был крестик и заголовок)
    toggleMainHeader(true);
    
    // Устанавливаем заголовок как в оригинальной модалке (Имя модели)
    modalTitle.textContent = modelData.ModelName;
    
    // Скрываем футер списка тем
    const footer = document.querySelector('#themes-modal-overlay .themes-modal-footer');
    if (footer) footer.style.display = 'none';

    // 3. Данные
    const lottieUrl = `${PHOTO_URL}/${encodeURIComponent(modelData.GiftName)}/lottie/${encodeURIComponent(modelData.ModelName)}.json`;
    const findBgsUrl = `background-finder.html?mode=findBgs&gift=${encodeURIComponent(modelData.GiftName)}&model=${encodeURIComponent(modelData.ModelName)}`;
    const similarUrl = `/nft-page/index.html?giftName=${encodeURIComponent(modelData.GiftName)}&modelName=${encodeURIComponent(modelData.ModelName)}&randomGiftsCount=10`;

    // Иконка лупы
    const searchIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>`;

    // 4. Генерируем HTML: Фото + Таблица + Синяя кнопка
    modalContent.innerHTML = `
        <div class="tm-details-visual">
            <lottie-player 
                src="${lottieUrl}" 
                background="transparent" 
                speed="1" 
                loop 
                autoplay 
                style="width: 100%; height: 100%;">
            </lottie-player>
        </div>

        <div class="modal-info info-table" style="margin-top: 0; margin-bottom: 1rem;">
            
            <div class="info-row">
                <span class="info-label">Модель</span>
                <a href="${findBgsUrl}" class="info-value link-style">
                    ${modelData.ModelName} ${searchIcon}
                </a>
            </div>

            <div class="info-row">
                <span class="info-label">Коллекция</span>
                <span class="info-value text-white" style="font-weight: 700;">${modelData.GiftName}</span>
            </div>

            <div class="info-row">
                <span class="info-label">Фон</span>
                <span class="info-value dash">—</span>
            </div>

            <div class="info-row">
                <span class="info-label">Совпадение</span>
                <span class="info-value dash">—</span>
            </div>

             <div class="info-row">
                <span class="info-label">Количество</span>
                <span class="info-value count">${modelData.Count} шт.</span>
            </div>

            <div class="info-row" style="border-bottom: none;">
                <span class="info-label">Тематики</span>
                <span id="tm-goto-themes-detail" class="info-value link-style" style="cursor: pointer;">
                    Показать ${searchIcon}
                </span>
            </div>
        </div>

        <a href="${similarUrl}" class="tm-blue-btn">
            Найти похожие
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
        </a>
    `;

    // --- Обработчики ---
    const themesLink = document.getElementById('tm-goto-themes-detail');
    if (themesLink) {
        themesLink.addEventListener('click', () => {
            open(modelData.GiftName, modelData.ModelName, onBackCallback);
        });
    }
}
// --- Публичные методы ---

function toggleMainHeader(show) {
    const header = document.querySelector('.themes-modal-header');
    if (header) {
        header.style.display = show ? 'grid' : 'none';
    }
}

async function open(giftName, modelName, onBack) {
    onBackCallback = onBack; 
    navigationStack = []; // ❗️ Очищаем историю при новом открытии
    
    currentGift = giftName;
    currentModel = modelName;

    document.body.classList.add('modal-open');
    if (!modalOverlay) return;
    
    modalOverlay.classList.remove('hidden');
    updateBackButtonState(); // Проверяем кнопку
    
    // Загружаем список тематик
    showLoadingState();
    modalTitle.textContent = modelName;

    const url = `${BASE_URL}/api/Thematic/GetCollectionByGift/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/WithParameters`;
    
    try {
        const response = await fetch(url, { headers: { 'Authorization': getApiAuthHeader() } });
        if (!response.ok) throw new Error('API Error');
        const themes = await response.json();
        
        // Сохраняем глобально
        currentThemes = themes; 
        
        renderThemeListView(); // Рендерим первый экран
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
                    // Находим все квадратики внутри этой карточки и меняем им фон
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
    } catch(e){}

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

function close() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('hidden');
    hideLoadingState(); 
    document.body.classList.remove('modal-open');

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
    PHOTO_URL = photoUrl;
    lazyLoadSetup = lazyLoadFunc;
    GLOBAL_COLORS = fixedColors || [];

    const modalHtml = `
        <div id="themes-modal-overlay" class="modal-overlay hidden">
            <div class="themes-modal">
                <div class="themes-modal-header">
                    <button id="themes-back-btn" class="themes-modal-back-btn hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    
                    <h3 id="themes-modal-title" class="themes-modal-title">Тематики</h3>
                    
                    <button id="themes-close-btn" class="themes-modal-close-btn">&times;</button>
                </div>
                <div id="themes-modal-content" class="themes-modal-content">
                </div>
                <div class="themes-modal-footer" style="display:none;">
                     </div>
            </div>
        </div>
    `;
    
    // Если модалка уже есть - не добавляем дубликат (защита от повторного init)
    if (!document.getElementById('themes-modal-overlay')) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    modalOverlay = document.getElementById('themes-modal-overlay');
    modalContent = document.getElementById('themes-modal-content');
    modalTitle = document.getElementById('themes-modal-title');
    modalBackButton = document.getElementById('themes-back-btn');
    modalCloseBtn = document.getElementById('themes-close-btn');

    // Клик по оверлею
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) close();
    });

    // ❗️ Логика кнопки НАЗАД (Стек)
    modalBackButton.addEventListener('click', () => {
        handleBackNavigation();
    });

    // ❗️ Логика кнопки ЗАКРЫТЬ
    modalCloseBtn.addEventListener('click', () => {
        close();
    });
}

function pushToHistory(restoreFunction) {
    navigationStack.push(restoreFunction);
    updateBackButtonState();
}

// ❗️ Обработка нажатия "Назад"
function handleBackNavigation() {
    if (navigationStack.length > 0) {
        // Достаем функцию восстановления предыдущего экрана
        const restoreState = navigationStack.pop();
        updateBackButtonState();
        restoreState(); // Запускаем рендер предыдущего экрана
    } else {
        // Если стек пуст - значит мы на главном экране модалки.
        // Здесь можно либо закрыть модалку, либо вызвать callback возврата в основное приложение
        if (onBackCallback) {
            close();
            onBackCallback();
        } else {
            close();
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
    close
};