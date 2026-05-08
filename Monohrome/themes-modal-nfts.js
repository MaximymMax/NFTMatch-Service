window.initNFTsSection = function (giftName, modelName, bgName) {
    window.nftsState = {
        currentGift: giftName,
        currentModel: modelName,
        currentBg: bgName,
        seenUniqueBgs: new Set(),
        observer: null,
        branches: {
            1: { page: 1, hasMore: true, isLoading: false, gridId: 'grid-scenario-1' },
            2: { page: 1, hasMore: true, isLoading: false, gridId: 'grid-scenario-2' },
            3: { page: 1, hasMore: true, isLoading: false, gridId: 'grid-scenario-3' },
            4: { page: 1, hasMore: true, isLoading: false, gridId: 'grid-scenario-4' }
        }
    };

    // --- ОТОБРАЖЕНИЕ БЛОКОВ ПОИСКА ПО ФОНУ ---
    const branch3 = document.getElementById('branch-3-container');
    const bgLabel = document.getElementById('tree-bg-label');
    const branch4 = document.getElementById('branch-4-container');
    const mtBranches = document.querySelector('.mt-branches'); // Контейнер веток
    const hasValidBg = bgName && bgName !== 'Default' && bgName !== 'Выбрать...';

    if (hasValidBg) {
        if (branch3) branch3.style.display = 'block';
        if (bgLabel) bgLabel.textContent = bgName;
        if (branch4) branch4.style.display = 'block'; // Показываем 4-й сценарий
        if (mtBranches) mtBranches.style.marginBottom = '0'; // Сбрасываем отступ
    } else {
        if (branch3) branch3.style.display = 'none';
        if (branch4) branch4.style.display = 'none'; // Скрываем 4-й сценарий
        if (mtBranches) mtBranches.style.marginBottom = '16px'; // ✅ ДОБАВЛЕН отступ снизу
    }

    // --- СБРОС СТАРЫХ РЕЗУЛЬТАТОВ ПРИ СМЕНЕ ФОНА ---
    [1, 2, 3, 4].forEach(sc => {
        const grid = document.getElementById(`grid-scenario-${sc}`);
        if (grid) grid.innerHTML = ''; // Очищаем старые картинки
        
        const content = document.getElementById(`content-scenario-${sc}`);
        if (content) content.classList.add('hidden'); // Сворачиваем ветку
        
        const btn = document.querySelector(`.mt-btn[data-scenario="${sc}"]`);
        if (btn) {
            btn.textContent = 'Найти';
            btn.classList.remove('active');
        }
    });

    // Привязываем обработчики заново (чтобы избежать дубликатов)
    const actionBtns = document.querySelectorAll('.mt-btn');
    actionBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const scenario = parseInt(newBtn.dataset.scenario);
            const content = document.getElementById(`content-scenario-${scenario}`);
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                newBtn.textContent = 'Скрыть';
                newBtn.classList.add('active');
                
                const grid = document.getElementById(window.nftsState.branches[scenario].gridId);
                if (grid.children.length === 0) {
                    window.loadMarketData(scenario);
                }
            } else {
                content.classList.add('hidden');
                newBtn.textContent = 'Найти';
                newBtn.classList.remove('active');
            }
        });
    });
};

window.loadMarketData = async function(scenario) {
    const state = window.nftsState.branches[scenario];
    if (state.isLoading || !state.hasMore) return;
    
    state.isLoading = true;
    const branchContent = document.getElementById(state.gridId).parentElement;
    const loadingInd = branchContent.querySelector('.nfts-loading');
    const gridContainer = document.getElementById(state.gridId);
    
    if (loadingInd) loadingInd.classList.remove('hidden');

    const oldSentinel = gridContainer.querySelector('.nfts-sentinel');
    if (oldSentinel) oldSentinel.remove();

    const BASE_URL = window.BASE_URL || 'https://nftmatchbot20250730152328.azurewebsites.net';
    const authHeader = window.getApiAuthHeader ? window.getApiAuthHeader() : 'Tma invalid';

    try {
        let url, body;
        
        if (scenario === 1) {
            url = `${BASE_URL}/api/MarketsAnalis/ModalMonochromes`; 
            body = { 
                CollectionName: window.nftsState.currentGift, 
                ModelName: window.nftsState.currentModel, 
                Page: state.page, 
                PageSize: 10, 
                MinScore: 0.5 
            }; 
        } else if (scenario === 2) {
            // ✅ ИСПРАВЛЕНИЕ: Убрали BackdropName: "Default"
            url = `${BASE_URL}/api/MarketsAnalis/SearchOffers`;
            body = { 
                CollectionName: window.nftsState.currentGift, 
                ModelName: window.nftsState.currentModel, 
                Page: state.page, 
                PageSize: 20 
            };
        } else if (scenario === 3) {
            // Ищем на конкретном фоне
            url = `${BASE_URL}/api/MarketsAnalis/SearchOffers`;
            body = { 
                CollectionName: window.nftsState.currentGift, 
                ModelName: window.nftsState.currentModel, 
                BackdropName: window.nftsState.currentBg,
                Page: state.page, 
                PageSize: 20 
            };
        } else if (scenario === 4) {
            url = `${BASE_URL}/api/ListGifts/SearchGifts/${state.page}/42`;
            body = { 
                GiftName: window.nftsState.currentGift, 
                ModelName: window.nftsState.currentModel 
            };
            // Проверка на 'Выбрать...' на всякий случай
            if (window.nftsState.currentBg && window.nftsState.currentBg !== 'Default' && window.nftsState.currentBg !== 'Выбрать...') {
                body.BackgroundName = window.nftsState.currentBg;
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        
        let items = data.Items || data.items || data.Compositions || (Array.isArray(data) ? data : []);
        const totalCount = data.TotalCount !== undefined ? data.TotalCount : (data.totalCount || 0);

        // Уникальные фоны для Самых Дешевых
        if (scenario === 2) {
            if (state.page === 1) window.nftsState.seenUniqueBgs.clear();
            let uniqueItems = [];
            items.forEach(item => {
                const bg = item.BackdropName || item.backdropName || item.Backdrop || item.backdrop || 'Без фона';
                if (!window.nftsState.seenUniqueBgs.has(bg)) {
                    window.nftsState.seenUniqueBgs.add(bg);
                    uniqueItems.push(item);
                }
            });
            items = uniqueItems;
        }

        // --- СОРТИРОВКА НОМЕРОВ ---
        if (scenario === 4 && items.length > 0) {
            items.sort((a, b) => {
                const numA = a.Number !== undefined ? a.Number : (a.number || a.Rank || a.Num || 0);
                const numB = b.Number !== undefined ? b.Number : (b.number || b.Rank || b.Num || 0);
                return numA - numB;
            });
        }

        if (items.length > 0) {
            if (scenario === 1 || scenario === 2 || scenario === 3) {
                window.renderCompactCards(items, gridContainer, true, true);
            } else if (scenario === 4) {
                window.renderNumberCards(items, gridContainer);
            }
            
            // Расчет пагинации
            if (scenario === 1 || scenario === 4) {
                const totalPages = data.TotalPages !== undefined ? data.TotalPages : (data.totalPages || 1);
                state.hasMore = state.page < totalPages;
            } else {
                state.hasMore = (state.page * 20) < totalCount;
            }
            state.page++;

            if (state.hasMore) {
                window.setupMarketPagination(gridContainer, scenario);
            }
        } else {
            if (scenario === 2 && (state.page * 20) < totalCount && state.page < 8) {
                state.page++;
                state.isLoading = false; 
                return window.loadMarketData(scenario); 
            }

            state.hasMore = false;
            if (state.page === 1) {
                 gridContainer.innerHTML = '<div style="width:100%; text-align:center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Ничего не найдено</div>';
            }
        }
    } catch (err) {
        console.error("Market/Search Load Error:", err);
        if (state.page === 1) {
            gridContainer.innerHTML = '<div style="width:100%; text-align:center; color: #f87171; font-size: 0.85rem; padding: 10px;">Ошибка загрузки</div>';
        }
    } finally {
        state.isLoading = false;
        if (loadingInd) loadingInd.classList.add('hidden');
    }
};

window.renderCompactCards = function(items, container, showBg = true, showScore = false) {
    const tonIcon = `<svg class="ton-icon" viewBox="0 0 24 24" style="width:12px;height:12px;"><path fill="currentColor" d="M19.012 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.882-1.826h10.817c1.033 0 1.873.815 1.873 1.822a1.8 1.8 0 0 1-.274.951M6.51 8.863l4.633 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.004-.72-.484-.72h-4.149z"/></svg>`;
    
    items.forEach(item => {
        const price = item.Price !== undefined ? item.Price : item.price;
        const marketplace = item.Marketplace || item.marketplace || 'TON';
        const url = item.Url || item.url || item.TelegramUrl || item.telegramUrl || '#';
        const imageUrl = item.ImageUrl || item.imageUrl;
        const backdrop = item.BackdropName || item.backdropName || item.Backdrop || item.backdrop || 'Фон';
        const score = item.MonochromeScore !== undefined ? item.MonochromeScore : (item.monochromeScore || 0);

        const card = document.createElement('a');
        card.className = 'hc-card';
        card.href = url;
        card.target = '_blank';

        let displayScore = score > 1 ? score.toFixed(1) : (score * 100).toFixed(1);
        const scoreHtml = (showScore && score > 0) ? `<div class="hc-score">${displayScore}%</div>` : '';
        const bgHtml = showBg ? `<div class="hc-bg-name">${backdrop}</div>` : '';

        card.innerHTML = `
            <div class="hc-img-wrap">
                <img src="${imageUrl}" loading="lazy">
                ${scoreHtml}
                ${bgHtml}
            </div>
            <div class="hc-details">
                <div class="hc-price">${tonIcon} <span>${price}</span></div>
                <div class="hc-market">${marketplace}</div>
            </div>
        `;
        container.appendChild(card);
    });
};

window.renderNumberCards = function(items, container) {
    items.forEach(item => {
        const url = item.URL || item.Url || item.url || '#';
        const imageUrl = item.Photo_URL || item.PhotoUrl || item.ImageUrl || item.imageUrl || '';
        const rank = item.Number !== undefined ? item.Number : (item.number || item.Rank || item.Num || '');

        const card = document.createElement('a');
        card.className = 'nft-market-card compact-card';
        card.href = url;
        card.target = '_blank';
        card.style.display = 'block';

        card.innerHTML = `
            <div class="nmc-image-wrap" style="position: relative;">
                <img src="${imageUrl}" loading="lazy" style="display:block; width:100%; border-radius:12px;">
                ${rank ? `<div class="nmc-bg-name" style="position:absolute; bottom:6px; left:6px; right:6px; background: rgba(0,0,0,0.5); box-shadow: 0 4px 10px rgba(0,0,0,0.6); text-shadow: 0 2px 4px rgba(0,0,0,0.9); font-weight:800; font-size: 0.95rem; border-radius: 8px; padding: 4px; text-align: center; color: #fff;">#${rank}</div>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
};

window.setupMarketPagination = function (container, scenario) {
    if (window.nftsState.observer) window.nftsState.observer.disconnect();

    const sentinel = document.createElement('div');
    sentinel.className = 'nfts-sentinel';
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    sentinel.style.gridColumn = '1 / -1'; 
    container.appendChild(sentinel);

    window.nftsState.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !window.nftsState.branches[scenario].isLoading && window.nftsState.branches[scenario].hasMore) {
            window.loadMarketData(scenario);
        }
    }, { 
        root: document.getElementById('themes-modal-content'), 
        rootMargin: '200px' 
    });

    window.nftsState.observer.observe(sentinel);
};