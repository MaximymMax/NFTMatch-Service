// themes-modal-nfts.js - Дополнительные функции для работы с NFT секцией

// Функция инициализации секции NFT с проверкой подписки
window.initNFTsSection = function (giftName, modelName, bgName) {
    console.log('[initNFTsSection] 🟢 Вызвана функция init', { giftName, modelName, bgName });

    const toggleHeader = document.getElementById('tm-nfts-toggle-header');
    const gridContainer = document.getElementById('tm-nfts-grid-container');
    const loadingInd = document.getElementById('tm-nfts-loading-indicator');
    const arrowEl = document.getElementById('tm-nfts-arrow');

    if (!toggleHeader || !gridContainer || !loadingInd) {
        // Элементов может не быть, если модалка закрылась
        return;
    }

    // Получаем BASE_URL из themes-modal.js  
    const BASE_URL = window.BASE_URL || 'https://nftmatchbot20250730152328.azurewebsites.net';

    // Обработчик клика на заголовок (один раз)
    if (toggleHeader._nftHandler) {
        toggleHeader.removeEventListener('click', toggleHeader._nftHandler);
    }
    
    toggleHeader._nftHandler = async () => {
        console.log('[NFTs] 🔵 Клик по секции "Найденные NFT"');

        // Если уже раскрыто - сворачиваем
        if (window.nftsState && window.nftsState.isExpanded) {
            console.log('[NFTs] Сворачиваем секцию');
            window.nftsState.isExpanded = false;
            gridContainer.classList.add('hidden');
            gridContainer.style.display = 'none'; // Дублируем для надежности
            if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';
            
            // Если есть заголовок, убираем подсветку
            toggleHeader.classList.remove('expanded');
            toggleHeader.style.color = 'var(--text-muted)';

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
        
        // Визуальное обновление
        if (arrowEl) arrowEl.style.transform = 'rotate(180deg)';
        toggleHeader.classList.add('expanded');
        toggleHeader.style.color = '#fff';

        // Показываем лоадер
        gridContainer.classList.remove('hidden');
        gridContainer.style.display = 'grid'; // Важно для Grid layout
        gridContainer.innerHTML = '';
        loadingInd.classList.remove('hidden');
        window.nftsState.isLoading = true;

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
            if (response.status === 403 || response.status === 401) {
                try {
                    const errorData = await response.clone().json();
                    if (errorData.error === 'subscription_required' || errorData.message?.includes('subscription')) {
                        console.warn('[NFTs] Требуется подписка');
                        if (typeof window.showSubscriptionModal === 'function') {
                            window.showSubscriptionModal(errorData.channelId || '@NFTstyler');
                        }
                        
                        // Сворачиваем обратно
                        window.nftsState.isExpanded = false;
                        gridContainer.classList.add('hidden');
                        gridContainer.style.display = 'none';
                        if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';
                        loadingInd.classList.add('hidden');
                        window.nftsState.isLoading = false;
                        
                        if (toggleHeader) {
                            toggleHeader.classList.remove('expanded');
                            toggleHeader.style.color = 'var(--text-muted)';
                        }
                        return;
                    }
                } catch (e) { console.error(e); }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            loadingInd.classList.add('hidden');
            window.nftsState.isLoading = false;

            // 🔥 ИСПРАВЛЕНИЕ: Используем data.Items вместо data.Gifts
            if (data && data.Items && data.Items.length > 0) {
                console.log('[NFTs] ✅ Начинаем рендеринг', data.Items.length, 'NFT');
                window.renderNFTsGrid(data.Items, gridContainer);

                // Обновляем состояние пагинации
                window.nftsState.hasMore = data.Items.length === window.nftsState.pageSize;

                if (window.nftsState.hasMore) {
                    window.setupNFTsPagination(gridContainer, giftName, modelName, bgName);
                }
            } else {
                console.warn('[NFTs] ❌ Нет данных (Items пуст)');
                gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); font-size: 0.9rem; padding: 10px;">Ничего не найдено</div>';
            }

        } catch (error) {
            console.error('[NFTs] Error loading NFTs:', error);
            loadingInd.classList.add('hidden');
            window.nftsState.isLoading = false;
            gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#f87171; font-size: 0.9rem; padding: 10px;">Ошибка загрузки</div>';
        }
    };

    toggleHeader.addEventListener('click', toggleHeader._nftHandler);
};

// Функция рендера сетки NFT
window.renderNFTsGrid = function (items, container) {
    if (!items || !container) return;

    items.forEach(item => {
        const card = document.createElement('a'); // Делаем ссылкой сразу
        card.className = 'nft-card'; // Используем класс из CSS

        // 🔥 ИСПРАВЛЕНИЕ: Генерируем ссылки вручную, так как API возвращает сырые данные
        // Пример: "Santa Hat" -> "santahat"
        const normalizedName = item.GiftName.toLowerCase().replace(/ /g, '');
        const imgUrl = `https://nft.fragment.com/gift/${normalizedName}-${item.Number}.medium.jpg`;
        const linkUrl = `https://t.me/nft/${item.GiftName.replace(/ /g, '')}-${item.Number}`;
        
        card.href = linkUrl;
        card.target = "_blank";
        
        // Принудительные стили для гарантии отображения
        card.style.position = 'relative';
        card.style.display = 'block';
        card.style.width = '100%';
        card.style.aspectRatio = '1/1';
        card.style.borderRadius = '12px';
        card.style.overflow = 'hidden';
        card.style.backgroundColor = '#16213a';
        card.style.textDecoration = 'none';
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <img src="${imgUrl}" alt="#${item.Number}" style="width:100%; height:100%; object-fit:cover; display:block;" loading="lazy">
            <div style="position:absolute; bottom:0; left:0; right:0; height:50%; background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%); pointer-events:none;"></div>
            <span style="position:absolute; bottom:6px; left:0; width:100%; text-align:center; color:#fff; font-size:0.8rem; font-weight:700; z-index:2; text-shadow:0 2px 4px rgba(0,0,0,0.8); font-family:monospace;">#${item.Number}</span>
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

    // Создаем невидимый элемент в конце списка для триггера загрузки
    const sentinel = document.createElement('div');
    sentinel.className = 'nfts-sentinel';
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    sentinel.style.gridColumn = '1 / -1'; 
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
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const data = await response.json();

                // 🔥 ИСПРАВЛЕНИЕ: Используем data.Items
                if (data && data.Items && data.Items.length > 0) {
                    sentinel.remove(); // Убираем старый сентинел
                    window.renderNFTsGrid(data.Items, container);
                    
                    window.nftsState.hasMore = data.Items.length === window.nftsState.pageSize;

                    if (window.nftsState.hasMore) {
                        container.appendChild(sentinel); // Добавляем новый в конец
                    }
                } else {
                    window.nftsState.hasMore = false;
                    sentinel.remove();
                }

            } catch (error) {
                console.error('[NFTs Pagination] Error:', error);
                window.nftsState.hasMore = false;
                sentinel.remove();
            } finally {
                if (loadingInd) loadingInd.classList.add('hidden');
                window.nftsState.isLoading = false;
            }
        }
    }, { 
        root: document.getElementById('themes-modal-content'), // Скролл происходит внутри контента модалки
        rootMargin: '200px' 
    });

    window.nftsState.observer = observer;
    observer.observe(sentinel);
};