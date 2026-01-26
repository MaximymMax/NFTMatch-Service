// themes-modal-nfts.js - Дополнительные функции для работы с NFT секцией

// Функция инициализации секции NFT с проверкой подписки
window.initNFTsSection = function (giftName, modelName, bgName) {
    const toggleHeader = document.getElementById('tm-nfts-toggle-header');
    const gridContainer = document.getElementById('tm-nfts-grid-container');
    const loadingInd = document.getElementById('tm-nfts-loading-indicator');
    const arrowEl = document.getElementById('tm-nfts-arrow');

    if (!toggleHeader || !gridContainer || !loadingInd) return;

    // Получаем BASE_URL из themes-modal.js  
    const BASE_URL = window.BASE_URL || 'https://nftmatchbot20250730152328.azurewebsites.net';

    // Обработчик клика на заголовок (один раз)
    toggleHeader.removeEventListener('click', toggleHeader._nftHandler);
    toggleHeader._nftHandler = async () => {
        // Если уже раскрыто - сворачиваем
        if (window.nftsState && window.nftsState.isExpanded) {
            window.nftsState.isExpanded = false;
            gridContainer.classList.add('hidden');
            if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';

            // Оптимизация: Возобновление Lottie
            const lottie = document.querySelector('lottie-player');
            if (lottie && lottie.play) lottie.play();

            return;
        }

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

            // Получаем заголовок авторизации
            const authHeader = window.getApiAuthHeader ? window.getApiAuthHeader() : 'Tma invalid';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            // Проверка на ошибку подписки
            if (response.status === 403) {
                try {
                    const errorData = await response.clone().json();
                    if (errorData.error === 'subscription_required') {
                        console.warn('[NFTs] Subscription required. Channel ID:', errorData.channelId);
                        window.showSubscriptionModal(errorData.channelId);

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
                    console.error('[NFTs] Error parsing error response:', e);
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            loadingInd.classList.add('hidden');
            window.nftsState.isLoading = false;

            // Рендерим результаты
            if (data && data.Gifts && data.Gifts.length > 0) {
                window.renderNFTsGrid(data.Gifts, gridContainer);

                // Обновляем состояние пагинации
                window.nftsState.hasMore = data.Gifts.length === window.nftsState.pageSize;

                // Добавляем Intersection Observer для подгрузки следующей страницы
                if (window.nftsState.hasMore) {
                    window.setupNFTsPagination(gridContainer, giftName, modelName, bgName);
                }
            } else {
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

// Функция рендера сетки NFT
window.renderNFTsGrid = function (gifts, container) {
    gifts.forEach(gift => {
        const card = document.createElement('div');
        card.className = 'nft-mini-card';

        const imgUrl = `https://cdn.changes.tg/gifts/models/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;

        card.innerHTML = `
            <img src="${imgUrl}" alt="${gift.ModelName}" loading="lazy">
            <div class="nft-mini-info">
                <span class="nft-mini-name">${gift.ModelName}</span>
            </div>
        `;

        container.appendChild(card);
    });
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
