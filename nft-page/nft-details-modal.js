const SERVER_BASE_URL = window.CONFIG?.SERVER_BASE_URL || 'https://nftmatch.pro';
const API_PHOTO_MODEL_URL = 'https://cdn.changes.tg/gifts/models';
// Используем актуальный эндпоинт для получения всех похожих моделей
const API_SIMILAR_MODELS = '/api/MonoCoof/SimilarNFT';

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
        const suffix = window.NFTi18n ? window.NFTi18n.t('pcs', 'шт.') : 'шт.';
        if (count === null || count === undefined) {
            return `<span class="price-value">0 ${suffix}</span>`;
        }
        const formatted = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `<span class="price-value">${formatted} ${suffix}</span>`;
    }

    function updateScrollShadows() {
        if (!similarModelsList) return;

        // Фикс: если wrapper не найден (в старом HTML), берем родителя
        const wrapper = listWrapper || similarModelsList.parentElement;
        if (!wrapper) return;

        const isAtTop = similarModelsList.scrollTop === 0;
        const isAtBottom = similarModelsList.scrollHeight - similarModelsList.clientHeight <= similarModelsList.scrollTop + 1;
        const isScrollable = similarModelsList.scrollHeight > similarModelsList.clientHeight;

        wrapper.classList.toggle('can-scroll-up', isScrollable && !isAtTop);
        wrapper.classList.toggle('can-scroll-down', isScrollable && !isAtBottom);

        if (!isScrollable) {
            wrapper.classList.remove('can-scroll-up', 'can-scroll-down');
        }
    }

    function updatePhotoContainers() {
        // Логика отображения Целевой модели (справа)
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
                    ${window.NFTi18n ? window.NFTi18n.t('btn_more_info', 'Подробнее') : 'Подробнее'}
                </button>
            `;

            const btnTarget = targetModelPhotoContainer.querySelector('#btn-details-target');
            if (btnTarget) {
                btnTarget.addEventListener('click', () => {
                    openFullDetails(targetGiftName, targetModelName);
                });
            }

        } else {
            // Заглушка, если цели нет
            const targetModelLabel = window.NFTi18n ? window.NFTi18n.t('label_target_model', 'Целевая модель') : 'Целевая модель';
            targetModelPhotoContainer.innerHTML = `<p class="box-label">${targetModelLabel}</p><div class="photo-wrapper" style="opacity:0.3"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>`;
        }

        // Логика отображения Выбранной модели (слева)
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
                    ${window.NFTi18n ? window.NFTi18n.t('btn_more_info', 'Подробнее') : 'Подробнее'}
                </button>
            `;

            const btnSelected = selectedModelPhotoContainer.querySelector('#btn-details-selected');
            if (btnSelected) {
                btnSelected.addEventListener('click', () => {
                    openFullDetails(cardGiftName, displayModelName);
                });
            }

        } else {
            const compareWithLabel = window.NFTi18n ? window.NFTi18n.t('label_compare_with', 'Сравнить с') : 'Сравнить с';
            selectedModelPhotoContainer.innerHTML = `<p class="box-label">${compareWithLabel}</p>`;
        }
    }

    function openFullDetails(gift, model) {
        if (!gift || !model) return;

        if (window.themesModal && typeof window.themesModal.openModelDetail === 'function') {
            // Скрываем текущую, чтобы открыть детальную
            modalOverlay.classList.remove('visible');
            setTimeout(() => {
                modalOverlay.classList.add('hidden');
            }, 300);

            window.themesModal.openModelDetail(gift, model, () => {
                // При возврате назад
                modalOverlay.classList.remove('hidden');
                document.body.classList.add('modal-open');
            });
        }
    }

    function renderSimilarModelsList() {
        if (!similarModelsList) return;
        similarModelsList.innerHTML = '';

        if (currentSimilarModels.length === 0) {
            similarModelsList.innerHTML = `<p class="list-placeholder">${window.NFTi18n ? window.NFTi18n.t('error_load_try_again', 'Не удалось загрузить данные.') : 'Не удалось загрузить данные.'}</p>`;
            updatePhotoContainers();
            return;
        }

        const fragment = document.createDocumentFragment();

        currentSimilarModels.forEach(model => {
            const modelName = model.name;
            const coefficient = (model.coof * 100).toFixed(1);
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

            fragment.appendChild(modelItem);
        });

        similarModelsList.appendChild(fragment);
        updatePhotoContainers();
        setTimeout(updateScrollShadows, 100);
        similarModelsList.onscroll = updateScrollShadows;
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

    async function fetchSimilarModels() {
        console.log('[NFT Details Modal] 🔵 fetchSimilarModels вызвана');
        console.log('[NFT Details Modal] Текущие переменные:', {
            cardGiftName,
            selectedModelName,
            targetGiftName,
            targetModelName,
            apiColors
        });

        if (!similarModelsList) {
            console.error('[NFT Details Modal] ❌ similarModelsList не найден!');
            return;
        }
        similarModelsList.innerHTML = `<div class="list-loading"><span class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #6b7fa7; border-top-color:#fff; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px;"></span> ${window.NFTi18n ? window.NFTi18n.t('deep_link_loading', 'Загрузка...') : 'Загрузка...'}</div>`;

        try {
            const getTelegramUserData = () => {
                let masterUserData = null;
                try {
                    const cachedUserData = sessionStorage.getItem('tgUser');
                    console.log('[NFT Details Modal] sessionStorage.tgUser:', cachedUserData);
                    if (cachedUserData) masterUserData = JSON.parse(cachedUserData);
                } catch (e) {
                    console.warn('[NFT Details Modal] Ошибка чтения tgUser из sessionStorage:', e);
                }

                if (!masterUserData && window.Telegram?.WebApp?.initDataUnsafe?.user) {
                    const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
                    console.log('[NFT Details Modal] Получены данные из Telegram.WebApp:', tgUser);
                    masterUserData = { telegramId: tgUser.id, username: tgUser.username };
                }

                if (masterUserData) {
                    return { id: parseInt(masterUserData.telegramId, 10) || null, Username: masterUserData.username };
                }
                console.warn('[NFT Details Modal] ⚠️ Данные пользователя не найдены');
                return { id: null, Username: null };
            };

            const userData = getTelegramUserData();
            console.log('[NFT Details Modal] userData:', userData);

            const requestBody = {
                ...userData,
                "Colors": apiColors,
                "NameTargetGift": targetGiftName || null,
                "NameTargetModel": targetModelName || null,
                "NameGift": cardGiftName,
                "MonohromeModelsOnly": true
            };

            const baseUrl = SERVER_BASE_URL.endsWith('/') ? SERVER_BASE_URL.slice(0, -1) : SERVER_BASE_URL;
            const finalUrl = `${baseUrl}${API_SIMILAR_MODELS}`;

            console.log('[NFT Details Modal] 📤 Отправляем запрос:', { url: finalUrl, body: requestBody });

            const response = await fetch(finalUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getApiAuthHeader()
                },
                body: JSON.stringify(requestBody)
            });

            console.log('[NFT Details Modal] 📥 Статус ответа:', response.status, response.statusText);

            // Проверка на ошибку подписки (403 или 401) ПЕРЕД общей проверкой
            if (response.status === 403 || response.status === 401) {
                try {
                    const errorData = await response.clone().json();
                    console.log('[NFT Details Modal] Данные ошибки:', errorData);

                    if (errorData.error === 'subscription_required' || errorData.message?.includes('subscription') || errorData.message?.includes('Subscription')) {
                        console.warn('[NFT Details Modal] Требуется подписка. Channel ID:', errorData.channelId);

                        // Показываем модальное окно подписки
                        if (typeof window.showSubscriptionModal === 'function') {
                            window.showSubscriptionModal(errorData.channelId || '@NFTstyler');
                        } else {
                            const alertMsg = window.NFTi18n ? window.NFTi18n.t('sub_required_alert', 'Для использования этой функции необходимо подписаться на наш канал: {channel}', {channel: errorData.channelId || '@NFTstyler'}) : `Для использования этой функции необходимо подписаться на наш канал: ${errorData.channelId || '@NFTstyler'}`;
                            alert(alertMsg);
                        }

                        // Скрываем список и показываем сообщение
                        if (similarModelsList) {
                            similarModelsList.innerHTML = `<p class="list-placeholder">${window.NFTi18n ? window.NFTi18n.t('sub_required_list', 'Требуется подписка на канал') : 'Требуется подписка на канал'}</p>`;
                        }
                        return;
                    }
                } catch (e) {
                    console.error('[NFT Details Modal] Ошибка парсинга ответа об ошибке:', e);
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[NFT Details Modal] ❌ Ошибка API:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                    requestBody
                });
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('[NFT Details Modal] ✅ Получены данные:', data);
            console.log('[NFT Details Modal] Структура данных:', {
                isArray: Array.isArray(data),
                dataKeys: typeof data === 'object' ? Object.keys(data) : 'not an object',
                dataLength: Array.isArray(data) ? data.length : 'not array'
            });

            // --- ЛОГИКА ПАРСИНГА: Получаем все похожие модели ---
            let rawModelsList = [];

            // API возвращает простой массив [{Name, Coof, Count}, ...]
            if (Array.isArray(data)) {
                rawModelsList = data;
            }
            // На случай, если API вернет объект со вложенным массивом
            else if (data && typeof data === 'object') {
                // Пытаемся найти массив SimilarModels
                if (Array.isArray(data.SimilarModels)) {
                    rawModelsList = data.SimilarModels;
                }
                // Или ищем первый массив в значениях объекта
                else {
                    const values = Object.values(data);
                    for (const val of values) {
                        if (Array.isArray(val)) {
                            rawModelsList = val;
                            break;
                        }
                        if (val && typeof val === 'object' && Array.isArray(val.SimilarModels)) {
                            rawModelsList = val.SimilarModels;
                            break;
                        }
                    }
                }
            }

            // Преобразуем в единый формат
            currentSimilarModels = rawModelsList.map(item => ({
                name: item.Name || item.Key || item.name || 'Unknown',
                coof: (item.Coof !== undefined) ? item.Coof : (item.Value !== undefined ? item.Value : 0),
                count: item.Count !== undefined ? item.Count : (item.count !== undefined ? item.count : 0)
            }));

            console.log(`[NFT Details Modal] ✅ Загружено ${currentSimilarModels.length} похожих моделей`);
            console.log('[NFT Details Modal] Первые 3 модели:', currentSimilarModels.slice(0, 3));
            renderSimilarModelsList();

        } catch (error) {
            console.error('Ошибка при загрузке похожих моделей:', error);
            if (similarModelsList) similarModelsList.innerHTML = `<p class="list-placeholder">${window.NFTi18n ? window.NFTi18n.t('error_load_try_again', 'Не удалось загрузить данные.') : 'Не удалось загрузить данные.'}</p>`;
            updatePhotoContainers();
            updateScrollShadows();
        }
    }

    function openNftDetailsModal(clickedGift, clickedModel, mainTargetGift, mainTargetModel, colors) {
        console.log('[NFT Details Modal] 🟢 openNftDetailsModal вызвана с параметрами:', {
            clickedGift,
            clickedModel,
            mainTargetGift,
            mainTargetModel,
            colors
        });

        // Оборачиваем в RAF для плавности
        requestAnimationFrame(() => {
            cardGiftName = clickedGift;
            selectedModelName = clickedModel;
            targetGiftName = mainTargetGift;
            targetModelName = mainTargetModel;

            if (Array.isArray(colors)) {
                apiColors = colors.map(c => (typeof c === 'object' && c.hex) ? c.hex : c);
                console.log('[NFT Details Modal] Обработаны цвета:', apiColors);
            } else {
                apiColors = [];
                console.warn('[NFT Details Modal] ⚠️ Цвета не переданы или не массив');
            }

            currentSimilarModels = [];

            if (modalTitle) modalTitle.textContent = cardGiftName;

            updatePhotoContainers();

            if (modalOverlay) {
                // 1. Убираем display:none
                modalOverlay.classList.remove('hidden');

                // 2. FIX: Добавляем класс visible для opacity: 1 (Иначе модалка прозрачная)
                requestAnimationFrame(() => {
                    modalOverlay.classList.add('visible');
                });

                document.body.classList.add('modal-open');
            }

            console.log('[NFT Details Modal] ⏳ Вызываем fetchSimilarModels...');
            fetchSimilarModels();

            // НЕ добавляем модальное окно в историю браузера
            // Модалка - это UI состояние, а не навигация между страницами
        });
    }

    function closeNftDetailsModal() {
        // Модальное окно закрывается без изменения URL

        if (modalOverlay) {
            // FIX: Сначала убираем видимость (анимация исчезновения)
            modalOverlay.classList.remove('visible');

            // Ждем анимацию и скрываем полностью
            setTimeout(() => {
                modalOverlay.classList.add('hidden');
                // Очистка
                if (similarModelsList) similarModelsList.innerHTML = '';
                selectedModelName = null;
                currentSimilarModels = [];
            }, 300);
        }
        document.body.classList.remove('modal-open');

        if (window.onModalClose && typeof window.onModalClose === 'function') {
            window.onModalClose();
        }
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeNftDetailsModal();
        });
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
        closeNftDetailsModal: closeNftDetailsModal,
        // Для совместимости, если кто-то вызывает open()
        open: (data) => {
            if (data && data.giftName && data.modelName) {
                openNftDetailsModal(data.giftName, data.modelName, null, null, []);
            }
        }
    };
}
