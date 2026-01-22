const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net/';
const API_PHOTO_MODEL_URL = 'https://cdn.changes.tg/gifts/models';
const API_SIMILAR_MODELS = '/api/MonoCoof/SimilarNFTs';

export function initNftDetailsModal() {

    const INIT_DATA_KEY = 'tgInitData';
    const BYPASS_KEY_STORAGE = 'apiBypassKey';

    const modalOverlay = document.getElementById('nftDetailsModalOverlay');
    const closeBtn = document.getElementById('closeNftDetailsModalBtn');

    const modalTitle = document.getElementById('nftDetailsModalTitle');
    const targetModelPhotoContainer = document.getElementById('targetModelPhoto');
    const selectedModelPhotoContainer = document.getElementById('selectedModelPhoto');
    const similarModelsList = document.getElementById('similarModelsList');
    const listWrapper = document.getElementById('similarModelsListWrapper');

    let currentSimilarModels = [];
    let selectedModelName = null;

    let targetGiftName = '';
    let targetModelName = '';
    let cardGiftName = '';
    let apiColors = [];

    const tg = window.Telegram?.WebApp;

    function formatCount(count) {
        if (count === null || count === undefined) {
            return '<span class="price-value">0 шт.</span>';
        }
        const formatted = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `<span class="price-value">${formatted} шт.</span>`;
    }

    function updateScrollShadows() {
        if (!similarModelsList || !listWrapper) return;

        const isAtTop = similarModelsList.scrollTop === 0;
        const isAtBottom = similarModelsList.scrollHeight - similarModelsList.clientHeight <= similarModelsList.scrollTop + 1;
        const isScrollable = similarModelsList.scrollHeight > similarModelsList.clientHeight;

        listWrapper.classList.toggle('can-scroll-up', isScrollable && !isAtTop);
        listWrapper.classList.toggle('can-scroll-down', isScrollable && !isAtBottom);

        if (!isScrollable) {
            listWrapper.classList.remove('can-scroll-up', 'can-scroll-down');
        }
    }

    function updatePhotoContainers() {
        if (targetModelName && targetGiftName) {
            const targetUrl = `${API_PHOTO_MODEL_URL}/${encodeURIComponent(targetGiftName)}/png/${encodeURIComponent(targetModelName)}.png`;

            targetModelPhotoContainer.innerHTML = `
                <div class="photo-wrapper">
                    <img src="${targetUrl}" alt="${targetModelName}" class="model-photo">
                </div>
                <button class="more-details-btn" id="btn-details-target">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Подробнее
                </button>
            `;

            const btnTarget = targetModelPhotoContainer.querySelector('#btn-details-target');
            if (btnTarget) {
                btnTarget.addEventListener('click', () => {
                    openFullDetails(targetGiftName, targetModelName);
                });
            }

        } else {
            targetModelPhotoContainer.innerHTML = '<p class="placeholder-text">Нет целевой модели</p>';
        }

        const displayModelName = selectedModelName || (currentSimilarModels.length > 0 ? currentSimilarModels[0].name : null);

        if (displayModelName && cardGiftName) {
            const selectedUrl = `${API_PHOTO_MODEL_URL}/${encodeURIComponent(cardGiftName)}/png/${encodeURIComponent(displayModelName)}.png`;

            selectedModelPhotoContainer.innerHTML = `
                <div class="photo-wrapper">
                    <img src="${selectedUrl}" alt="${displayModelName}" class="model-photo">
                </div>
                <button class="more-details-btn" id="btn-details-selected">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Подробнее
                </button>
            `;

            const btnSelected = selectedModelPhotoContainer.querySelector('#btn-details-selected');
            if (btnSelected) {
                btnSelected.addEventListener('click', () => {
                    openFullDetails(cardGiftName, displayModelName);
                });
            }

        } else {
            selectedModelPhotoContainer.innerHTML = '<p class="placeholder-text">Выберите модель</p>';
        }
    }

    function openFullDetails(gift, model) {
        if (!gift || !model) return;

        if (window.themesModal && typeof window.themesModal.openModelDetail === 'function') {
            modalOverlay.classList.add('hidden');

            window.themesModal.openModelDetail(gift, model, () => {
                modalOverlay.classList.remove('hidden');
                document.body.classList.add('modal-open');
            });
        }
    }

    function renderSimilarModelsList() {
        similarModelsList.innerHTML = '';

        if (currentSimilarModels.length === 0) {
            similarModelsList.innerHTML = '<p class="list-placeholder">Не удалось загрузить похожие модели для данного подарка.</p>';
            updatePhotoContainers();
            listWrapper.classList.remove('can-scroll-up', 'can-scroll-down');
            return;
        }

        currentSimilarModels.forEach(model => {
            const modelName = model.name;
            const coefficient = (model.coof * 100).toFixed(2);
            const countHtml = formatCount(model.count);
            const photoUrl = `${API_PHOTO_MODEL_URL}/${encodeURIComponent(cardGiftName)}/png/${encodeURIComponent(modelName)}.png`;

            const modelItem = document.createElement('div');
            modelItem.className = 'model-item';
            modelItem.dataset.modelName = modelName;

            const modelToHighlight = selectedModelName || (currentSimilarModels.length > 0 ? currentSimilarModels[0].name : null);
            if (modelToHighlight === modelName) {
                modelItem.classList.add('selected');
                if (selectedModelName === null) {
                    selectedModelName = modelName;
                }
            }

            modelItem.innerHTML = `
                <div class="model-photo-mini">
                    <img src="${photoUrl}" alt="${modelName}" class="model-photo-mini-img">
                </div>
                <div class="model-info">
                    <div class="model-name-coof">
                        <span class="model-name-text">${modelName}</span>
                        <span class="model-coof-text">${coefficient}%</span>
                    </div>
                    <div class="model-price">
                        ${countHtml}
                    </div>
                </div>
            `;

            modelItem.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.model-item').forEach(item => item.classList.remove('selected'));
                modelItem.classList.add('selected');
                selectedModelName = modelName;
                updatePhotoContainers();
            });

            similarModelsList.appendChild(modelItem);
        });

        updatePhotoContainers();
        setTimeout(updateScrollShadows, 100);
    }

    function getApiAuthHeader() {
        try {
            const initData = sessionStorage.getItem(INIT_DATA_KEY);
            if (initData) return `Tma ${initData}`;
        } catch (e) { }

        try {
            const bypassKey = sessionStorage.getItem(BYPASS_KEY_STORAGE);
            if (bypassKey) return `Tma ${bypassKey}`;
        } catch (e) { }

        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            const directInitData = window.Telegram.WebApp.initData;
            try { sessionStorage.setItem(INIT_DATA_KEY, directInitData); } catch (e) { }
            return `Tma ${directInitData}`;
        }
        return 'Tma invalid';
    }

    async function fetchSimilarModels() {
        similarModelsList.innerHTML = '<div class="list-loading"><span class="spinner-small"></span> Загрузка моделей...</div>';

        try {
            const getTelegramUserData = () => {
                let masterUserData = null;
                try {
                    const cachedUserData = sessionStorage.getItem('tgUser');
                    if (cachedUserData) masterUserData = JSON.parse(cachedUserData);
                } catch (e) { }

                // Если нет в кэше, пробуем взять из WebApp
                if (!masterUserData && window.Telegram?.WebApp?.initDataUnsafe?.user) {
                    const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
                    masterUserData = { telegramId: tgUser.id, username: tgUser.username };
                }

                if (masterUserData) {
                    return { id: parseInt(masterUserData.telegramId, 10) || null, Username: masterUserData.username };
                }
                return { id: null, Username: null };
            };

            const userData = getTelegramUserData();

            const requestBody = {
                ...userData,
                "Colors": apiColors, // Теперь здесь точно массив строк
                "NameTargetGift": targetGiftName || null,
                "NameTargetModel": targetModelName || null,
                "NameGift": cardGiftName,
                "MonohromeModelsOnly": true
            };

            // ИСПРАВЛЕНИЕ URL: убираем двойной слеш, если SERVER_BASE_URL заканчивается на /
            const baseUrl = SERVER_BASE_URL.endsWith('/') ? SERVER_BASE_URL.slice(0, -1) : SERVER_BASE_URL;
            const finalUrl = `${baseUrl}${API_SIMILAR_MODELS}`;

            const response = await fetch(finalUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getApiAuthHeader()
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Логируем для отладки, если снова будет 400
                console.error("API Error Body:", requestBody);
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            currentSimilarModels = data.map(item => ({
                name: item.Name,
                coof: item.Coof,
                count: item.Count
            }));

            renderSimilarModelsList();

        } catch (error) {
            console.error('Ошибка при загрузке похожих моделей:', error);
            similarModelsList.innerHTML = `<p class="list-placeholder">Не удалось загрузить данные.</p>`;
            updatePhotoContainers();
            updateScrollShadows();
        }
    }

    function openNftDetailsModal(clickedGift, clickedModel, mainTargetGift, mainTargetModel, colors) {
        requestAnimationFrame(() => {
            cardGiftName = clickedGift;
            selectedModelName = clickedModel;
            targetGiftName = mainTargetGift;
            targetModelName = mainTargetModel;

            // ЗАЩИТА: Если передали null или undefined, делаем пустой массив. 
            // Если передали объекты (вдруг), вытаскиваем hex.
            if (Array.isArray(colors)) {
                apiColors = colors.map(c => (typeof c === 'object' && c.hex) ? c.hex : c);
            } else {
                apiColors = [];
            }

            currentSimilarModels = [];

            if (modalTitle) modalTitle.textContent = cardGiftName;

            updatePhotoContainers();

            if (modalOverlay) {
                modalOverlay.classList.remove('hidden');
                document.body.classList.add('modal-open');
            }

            fetchSimilarModels();

            const newUrl = new URL(window.location);
            newUrl.searchParams.set('gift', cardGiftName);
            newUrl.searchParams.set('model', selectedModelName);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
        });
    }

    function closeNftDetailsModal() {
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('gift');
        newUrl.searchParams.delete('model');
        window.history.replaceState({ path: newUrl.href }, '', newUrl.href);

        if (modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
        document.body.classList.remove('modal-open');

        const content = document.getElementById('similarModelsList');
        if (content) content.innerHTML = '';

        selectedModelName = null;
        currentSimilarModels = [];
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeNftDetailsModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeNftDetailsModal();
            }
        });
    }

    return {
        openNftDetailsModal: openNftDetailsModal,
        closeNftDetailsModal: closeNftDetailsModal
    };
}
