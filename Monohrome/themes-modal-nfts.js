// themes-modal-nfts.js - Дополнительные функции для работы с NFT секцией

// Функция инициализации секции NFT с проверкой подписки
window.initNFTsSection = function (giftName, modelName, bgName) {
    console.log('[initNFTsSection] 🟢 Вызвана функция init', { giftName, modelName, bgName });

    const toggleHeader = document.getElementById('tm-nfts-toggle-header');
    const gridContainer = document.getElementById('tm-nfts-grid-container');
    const loadingInd = document.getElementById('tm-nfts-loading-indicator');
    const arrowEl = document.getElementById('tm-nfts-arrow');

    console.log('[initNFTsSection] Элементы DOM:', {
        toggleHeader: !!toggleHeader,
        gridContainer: !!gridContainer,
        loadingInd: !!loadingInd,
        arrowEl: !!arrowEl
    });

    if (!toggleHeader || !gridContainer || !loadingInd) {
        console.error('[initNFTsSection] ❌ Отсутствуют необходимые элементы DOM!');
        return;
    }

    // Получаем BASE_URL из themes-modal.js  
    const BASE_URL = window.BASE_URL || 'https://nftmatchbot20250730152328.azurewebsites.net';

    // Обработчик клика на заголовок (один раз)
    toggleHeader.removeEventListener('click', toggleHeader._nftHandler);
    toggleHeader._nftHandler = async () => {
        console.log('[NFTs] 🔵 Клик по секции "Найденные NFT"');
        console.log('[NFTs] Текущее состояние:', window.nftsState);

        // Если уже раскрыто - сворачиваем
        if (window.nftsState && window.nftsState.isExpanded) {
            console.log('[NFTs] Сворачиваем секцию');
            window.nftsState.isExpanded = false;
            gridContainer.classList.add('hidden');
            if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';

            // Оптимизация: Возобновление Lottie
            const lottie = document.querySelector('lottie-player');
            if (lottie && lottie.play) lottie.play();

            return;
        }

        console.log('[NFTs] Разворачиваем секцию и загружаем данные');

        // Разворачиваем и грузим данные
        if (!window.nftsState) window.nftsState = {};
        window.nftsState.isExpanded = true;
        window.nftsState.page = 1;
        window.nftsState.pageSize = 18;
        window.nftsState.hasMore = true;
        if (arrowEl) arrowEl.style.transform = 'rotate(180deg)';

        // Показываем лоадер
        gridContainer.classList.remove('hidden');
        gridContainer.innerHTML = '';
        loadingInd.classList.remove('hidden');
        window.nftsState.isLoading = true;

        // Оптимизация: Пауза Lottie
        const lottie = document.querySelector('lottie-player');
        if (lottie && lottie.pause) lottie.pause();

        try {
            // Формируем запрос для загрузки NFT
            const url = `${BASE_URL}/api/ListGifts/SearchGifts/${window.nftsState.page}/${window.nftsState.pageSize}`;
            const body = {
                GiftName: giftName,
                ModelName: modelName,
                BackgroundName: bgName
            };

            console.log('[NFTs] Отправляем запрос:', {
                url,
                body,
                page: window.nftsState.page,
                pageSize: window.nftsState.pageSize
            });

            // Получаем заголовок авторизации
            const authHeader = window.getApiAuthHeader ? window.getApiAuthHeader() : 'Tma invalid';
            console.log('[NFTs] Заголовок авторизации:', authHeader.substring(0, 20) + '...');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            console.log('[NFTs] Ответ сервера - статус:', response.status, response.statusText);

            // Проверка на ошибку подписки (403 или 401)
            if (response.status === 403 || response.status === 401) {
                try {
                    const errorData = await response.clone().json();
                    console.log('[NFTs] Данные ошибки:', errorData);

                    if (errorData.error === 'subscription_required' || errorData.message?.includes('subscription') || errorData.message?.includes('Subscription')) {
                        console.warn('[NFTs] Требуется подписка. Channel ID:', errorData.channelId);

                        // Показываем модальное окно подписки
                        if (typeof window.showSubscriptionModal === 'function') {
                            window.showSubscriptionModal(errorData.channelId || '@NFTstyler');
                        } else {
                            alert('Для использования этой функции необходимо подписаться на наш канал: @NFTstyler');
                        }

                        // Сворачиваем секцию
                        window.nftsState.isExpanded = false;
                        gridContainer.classList.add('hidden');
                        if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';
                        loadingInd.classList.add('hidden');
                        window.nftsState.isLoading = false;

                        const lottie = document.querySelector('lottie-player');
                        if (lottie && lottie.play) lottie.play();

                        return;
                    }
                } catch (e) {
                    console.error('[NFTs] Ошибка парсинга ответа об ошибке:', e);
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('[NFTs] Полученные данные:', data);
            console.log('[NFTs] Структура данных:', {
                hasData: !!data,
                hasGifts: !!(data && data.Gifts),
                giftsLength: data && data.Gifts ? data.Gifts.length : 0,
                dataKeys: data ? Object.keys(data) : []
            });

            loadingInd.classList.add('hidden');
            window.nftsState.isLoading = false;

            // Рендерим результаты
            if (data && data.Gifts && data.Gifts.length > 0) {
                console.log('[NFTs] ✅ Начинаем рендеринг', data.Gifts.length, 'NFT');
                window.renderNFTsGrid(data.Gifts, gridContainer);

                console.log('[NFTs] Содержимое gridContainer после рендеринга:', gridContainer.innerHTML.substring(0, 200));
                console.log('[NFTs] Классы gridContainer:', gridContainer.className);

                // Обновляем состояние пагинации
                window.nftsState.hasMore = data.Gifts.length === window.nftsState.pageSize;

                // Добавляем Intersection Observer для подгрузки следующей страницы
                if (window.nftsState.hasMore) {
                    window.setupNFTsPagination(gridContainer, giftName, modelName, bgName);
                }
            } else {
                console.warn('[NFTs] ❌ Нет данных для отображения');
                gridContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:1rem;">Не найдено NFT</p>';
            }

        } catch (error) {
            console.error('[NFTs] Error loading NFTs:', error);
            loadingInd.classList.add('hidden');
            window.nftsState.isLoading = false;
            gridContainer.innerHTML = '<p style="text-align:center; color:#f87171; padding:1rem;">Ошибка загрузки</p>';
        }
    };

    toggleHeader.addEventListener('click', toggleHeader._nftHandler);
};

// Функция нормализации названия коллекции для fragment.com
function normalizeGiftName(giftName) {
    if (!giftName) return '';
    // Убираем пробелы и переводим в lowercase
    return giftName.replace(/\s+/g, '').toLowerCase();
}

// Функция извлечения номера модели
function extractModelNumber(modelName) {
    if (!modelName) return '1';
    // Ищем цифры в конце названия модели
    const match = modelName.match(/(\d+)$/);
    return match ? match[1] : '1';
}

// Функция рендера сетки NFT
window.renderNFTsGrid = function (gifts, container) {
    console.log('[renderNFTsGrid] Вызвана функция. Gifts:', gifts.length, 'Container:', container);
    console.log('[renderNFTsGrid] Первые 3 элемента:', gifts.slice(0, 3));

    gifts.forEach(gift => {
        const card = document.createElement('div');
        card.className = 'nft-mini-card';

        // Нормализуем название коллекции и извлекаем номер модели
        const normalizedGift = normalizeGiftName(gift.GiftName);
        const modelNumber = extractModelNumber(gift.ModelName);

        // Формируем URL для fragment.com
        const imgUrl = `https://nft.fragment.com/gift/${normalizedGift}-${modelNumber}.medium.jpg`;

        console.log('[renderNFTsGrid] Сформирован URL:', {
            original: { GiftName: gift.GiftName, ModelName: gift.ModelName },
            normalized: { normalizedGift, modelNumber },
            url: imgUrl
        });

        card.innerHTML = `
            <img src="${imgUrl}" alt="${gift.ModelName}" loading="lazy" onerror="this.src='https://cdn.changes.tg/gifts/models/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png'">
            <div class="nft-mini-info">
                <span class="nft-mini-name">${gift.ModelName}</span>
            </div>
        `;

        container.appendChild(card);
    });

    console.log('[renderNFTsGrid] ✅ Рендеринг завершен. Всего карточек в контейнере:', container.children.length);
};

// Функция настройки пагинации для NFT
window.setupNFTsPagination = function (container, giftName, modelName, bgName) {
    if (window.nftsState && window.nftsState.observer) {
        window.nftsState.observer.disconnect();
    }

    const BASE_URL = window.BASE_URL || 'https://nftmatchbot20250730152328.azurewebsites.net';

    const sentinel = document.createElement('div');
    sentinel.className = 'nfts-sentinel';
    sentinel.style.height = '1px';
    container.appendChild(sentinel);

    const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && !window.nftsState.isLoading && window.nftsState.hasMore) {
            window.nftsState.isLoading = true;
            window.nftsState.page++;

            const loadingInd = document.getElementById('tm-nfts-loading-indicator');
            if (loadingInd) loadingInd.classList.remove('hidden');

            try {
                const url = `${BASE_URL}/api/ListGifts/SearchGifts/${window.nftsState.page}/${window.nftsState.pageSize}`;
                const body = {
                    GiftName: giftName,
                    ModelName: modelName,
                    BackgroundName: bgName
                };

                const authHeader = window.getApiAuthHeader ? window.getApiAuthHeader() : 'Tma invalid';

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const data = await response.json();

                if (data && data.Gifts && data.Gifts.length > 0) {
                    sentinel.remove();
                    window.renderNFTsGrid(data.Gifts, container);
                    window.nftsState.hasMore = data.Gifts.length === window.nftsState.pageSize;

                    if (window.nftsState.hasMore) {
                        container.appendChild(sentinel);
                    }
                } else {
                    window.nftsState.hasMore = false;
                    sentinel.remove();
                }

            } catch (error) {
                console.error('[NFTs Pagination] Error:', error);
                window.nftsState.hasMore = false;
            } finally {
                if (loadingInd) loadingInd.classList.add('hidden');
                window.nftsState.isLoading = false;
            }
        }
    }, { rootMargin: '100px' });

    window.nftsState.observer = observer;
    observer.observe(sentinel);
};

// Функция показа модального окна подписки
window.showSubscriptionModal = function (channelId) {
    let overlay = document.querySelector('.sub-modal-overlay');

    if (!overlay) {
        const html = `
            <div class="sub-modal-overlay">
                <div class="sub-modal">
                    <div class="sub-icon channel-avatar">
                        <img src="../Monohrome/NFTMatchChannel.png" alt="NFT Styler Channel">
                    </div>
                    <h3 class="sub-title">Требуется подписка</h3>
                    <p class="sub-text">Для использования поиска необходимо подписаться на наш Telegram канал.</p>
                    
                    <a href="https://t.me/NFTstyler" target="_blank" class="sub-btn">
                        Подписаться
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>
                    
                    <button class="sub-btn check-btn" onclick="closeSubscriptionModal()">
                        Я подписался
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        overlay = document.querySelector('.sub-modal-overlay');

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) window.closeSubscriptionModal();
        });
    }

    setTimeout(() => overlay.classList.add('active'), 10);
};

// Функция закрытия модального окна подписки
window.closeSubscriptionModal = function () {
    const overlay = document.querySelector('.sub-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
};
