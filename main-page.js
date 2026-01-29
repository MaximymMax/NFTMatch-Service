document.addEventListener('DOMContentLoaded', () => {

    // === ИНИЦИАЛИЗАЦИЯ TELEGRAM ===
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;

        // 1. Сообщаем, что приложение готово
        tg.ready();

        // 2. Гарантированно расширяем
        setTimeout(() => {
             try {
                // Сначала всегда расширяем шторку на максимум
                tg.expand();
                
                // Потом пробуем включить иммерсивный фуллскрин (если поддерживается)
                if (typeof tg.requestFullscreen === 'function') {
                    tg.requestFullscreen();
                }
            } catch (e) {
                console.error(e);
                tg.expand();
            }
        }, 100);

        // 3. Отключаем свайп вниз для закрытия
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) {
            tg.disableVerticalSwipes();
        }

        tg.BackButton.hide();

        if (tg.initData) {
            sessionStorage.setItem('tgInitData', tg.initData);
        }
    }

    const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net';
    const CACHE_KEY = 'giftNamesCache';
    const INIT_DATA_KEY = 'tgInitData';
    const BYPASS_KEY_STORAGE = 'apiBypassKey';

    const tgGateOverlay = document.getElementById('tg-gate-overlay');
    const body = document.body;

    function saveInitData() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            try {
                sessionStorage.setItem(INIT_DATA_KEY, window.Telegram.WebApp.initData);
                const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
                if (tgUser) {
                    const userData = {
                        telegramId: parseInt(tgUser.id, 10),
                        username: tgUser.username || null,
                        firstName: tgUser.first_name || null,
                        lastName: tgUser.last_name || null,
                    };
                    sessionStorage.setItem('tgUser', JSON.stringify(userData));
                }
                return true;
            } catch (e) { console.error(e); }
        }
        if (sessionStorage.getItem(INIT_DATA_KEY)) return true;
        if (sessionStorage.getItem(BYPASS_KEY_STORAGE)) return true;
        return false;
    }

    saveInitData();

    // Функция жесткого форсирования полного экрана
    const forceFullscreen = () => {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            try {
                // ВСЕГДА сначала делаем expand
                tg.expand();
                
                // И только потом пробуем фуллскрин
                if (typeof tg.requestFullscreen === 'function') {
                    tg.requestFullscreen();
                }
            } catch (e) {
                console.error(e);
                tg.expand();
            }
        }
    };

    const checkEnvironmentAndGate = () => {
        if (saveInitData()) {
            if (tgGateOverlay) tgGateOverlay.classList.add('hidden');
            body.classList.remove('body-gated');
            body.classList.add('tg-fullscreen');

            forceFullscreen();

            return true;
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            const bypass = urlParams.get('bypass');
            if (bypass) {
                sessionStorage.setItem(BYPASS_KEY_STORAGE, bypass);
                window.location.reload();
                return true;
            }
            if (tgGateOverlay) tgGateOverlay.classList.remove('hidden');
            body.classList.add('body-gated');

            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.ready();
                forceFullscreen();
            }
            return false;
        }
    };

    const signalTelegramAppReady = () => {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.ready();
    };

    // ====== DEEP LINKING ROUTER (UNIVERSAL) ======
    function handleDeepLink() {
        const PROCESSED_KEY = 'deepLinkProcessed_v4';

        if (sessionStorage.getItem(PROCESSED_KEY)) {
            console.log('[DeepLink] Already processed.');
            return;
        }

        let urlParams = new URLSearchParams(window.location.search);
        let action = urlParams.get('action');

        if (!action) {
            const tgStartParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
            const deepLinkString = tgStartParam || urlParams.get('startapp');

            if (deepLinkString) {
                console.log('[DeepLink] Param detected:', deepLinkString);
                const parsedParams = parseStartAppParams(deepLinkString);
                parsedParams.forEach((value, key) => urlParams.set(key, value));
                action = urlParams.get('action');
            }
        }

        if (!action) return;

        console.log('[DeepLink] Executing action:', action);
        sessionStorage.setItem(PROCESSED_KEY, 'true');
        cleanCurrentUrlHistory();
        showLoadingIndicator();

        let targetUrl = '';

        switch (action) {
            case 'api':
                targetUrl = './API_info/api.html';
                break;
            case 'support':
                targetUrl = './Support/support.html';
                break;

            case 'monochrome':
            case 'monochrome_model':
                const mGift = urlParams.get('gift');
                const mModel = urlParams.get('model');
                if (mGift && mModel) {
                    targetUrl = `./Monohrome/background-finder.html?mode=findBgs&gift=${encodeURIComponent(mGift)}&model=${encodeURIComponent(mModel)}`;
                } else {
                    targetUrl = `./Monohrome/background-finder.html`;
                }
                break;

            case 'monochrome_color':
                const cGift = urlParams.get('gift');
                const cColor = urlParams.get('color');
                if (cGift && cColor) {
                    targetUrl = `./Monohrome/background-finder.html?mode=findModels&gift=${encodeURIComponent(cGift)}&color=${encodeURIComponent(cColor)}`;
                } else {
                    targetUrl = `./Monohrome/background-finder.html`;
                }
                break;

            case 'similar':
                const sGift = urlParams.get('gift');
                const sModel = urlParams.get('model');
                const count = urlParams.get('count') || '100';
                if (sGift && sModel) {
                    targetUrl = `./nft-page/index.html?giftName=${encodeURIComponent(sGift)}&modelName=${encodeURIComponent(sModel)}&randomGiftsCount=${count}`;
                } else {
                    targetUrl = `./nft-page/index.html`;
                }
                break;

            case 'theme':
                const tGift = urlParams.get('gift');
                const tModel = urlParams.get('model');
                const tName = urlParams.get('theme');

                const themeParams = [];
                if (tGift) themeParams.push(`gift=${encodeURIComponent(tGift)}`);
                if (tModel) themeParams.push(`model=${encodeURIComponent(tModel)}`);
                if (tName) themeParams.push(`collection=${encodeURIComponent(tName)}`);

                targetUrl = './Thematic/themes.html';
                if (themeParams.length > 0) {
                    targetUrl += '?' + themeParams.join('&');
                }
                break;

            default:
                console.warn('[DeepLink] Unknown action:', action);
                hideLoadingIndicator();
                return;
        }

        if (targetUrl) {
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 100);
        } else {
            hideLoadingIndicator();
        }
    }

    function cleanCurrentUrlHistory() {
        const url = new URL(window.location.href);
        const cleanPath = url.protocol + "//" + url.host + url.pathname;
        window.history.replaceState({ path: cleanPath }, '', cleanPath);
    }

    function parseStartAppParams(startappString) {
        const params = new URLSearchParams();
        if (!startappString) return params;

        const parts = startappString.split('-');
        let rawAction = parts[0].toLowerCase();
        let action = rawAction;

        params.set('action', action);

        switch (action) {
            case 'monochrome_color':
                if (parts[1]) params.set('gift', parts[1]);
                if (parts[2]) params.set('color', parts[2]);
                break;

            case 'monochrome':
            case 'monochrome_model':
                if (parts[1]) params.set('gift', parts[1]);
                if (parts[2]) params.set('model', parts[2]);
                break;

            case 'similar':
                if (parts[1]) params.set('gift', parts[1]);
                if (parts[2]) params.set('model', parts[2]);
                if (parts[3]) params.set('count', parts[3]);
                break;

            case 'theme':
                if (parts[1]) params.set('gift', parts[1]);
                if (parts[2]) params.set('model', parts[2]);
                if (parts[3]) params.set('theme', parts[3]);
                break;
        }
        return params;
    }

    function showLoadingIndicator() {
        if (document.getElementById('deeplink-loader')) return;
        const loader = document.createElement('div');
        loader.id = 'deeplink-loader';
        loader.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(22, 33, 58, 0.95); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(10px);`;
        loader.innerHTML = `<div style="text-align: center; color: #fff;"><div style="width: 50px; height: 50px; border: 3px solid #38bdf8; border-top-color: transparent; border-radius: 50%; margin: 0 auto 20px; animation: spin 0.8s linear infinite;"></div><p style="font-weight: 500;">Загрузка...</p></div><style>@keyframes spin {to{transform: rotate(360deg);}}</style>`;
        document.body.appendChild(loader);
    }

    function hideLoadingIndicator() {
        const loader = document.getElementById('deeplink-loader');
        if (loader) loader.remove();
    }
    // ====== END DEEP LINKING ROUTER ======

    const initCarousel = async () => {
        const wrapper = document.getElementById('hero-carousel-wrapper');
        const track = document.getElementById('hero-carousel-track');
        if (!wrapper || !track) return;

        const CAROUSEL_CACHE_KEY = 'heroCarouselItems';

        const renderCards = (items) => {
            track.innerHTML = '';
            for (let i = 0; i < 4; i++) {
                items.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'carousel-card';
                    card.style.backgroundColor = item.ColorHex || '#333';
                    const img = document.createElement('img');
                    img.src = `https://cdn.changes.tg/gifts/models/${encodeURIComponent(item.GiftName)}/png/${encodeURIComponent(item.ModelName)}.png`;
                    img.alt = item.ModelName;
                    card.appendChild(img);
                    track.appendChild(card);
                });
            }
            wrapper.classList.remove('hidden');
        };

        const cachedData = sessionStorage.getItem(CAROUSEL_CACHE_KEY);
        let data = null;

        if (cachedData) {
            try {
                data = JSON.parse(cachedData);
                renderCards(data);
            } catch (e) { console.error('Cache parse error', e); }
        }

        // 2. Если данных не было в кэше, грузим с сервера
        if (!data) {
            let authHeader = 'Tma invalid';
            const initData = sessionStorage.getItem(INIT_DATA_KEY);
            if (initData) authHeader = `Tma ${initData}`;
            else {
                const bypass = sessionStorage.getItem(BYPASS_KEY_STORAGE);
                if (bypass) authHeader = `Tma ${bypass}`;
            }

            const TARGET_COLLECTION = [];

            try {
                const response = await fetch(`${SERVER_BASE_URL}/api/MonoCoof/GetCollectionGradient/40`, {
                    method: 'POST',
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ "CollectionNames": TARGET_COLLECTION })
                });

                if (!response.ok) throw new Error('API Error');
                data = await response.json();

                if (data && data.length > 0) {
                    sessionStorage.setItem(CAROUSEL_CACHE_KEY, JSON.stringify(data));
                    renderCards(data);
                }
            } catch (e) {
                console.error(e);
                wrapper.classList.add('hidden');
                return;
            }
        }

        if (data && data.length > 0) {
            let x = 0, speed = 0.4, baseSpeed = 0.4, isDragging = false, startX = 0, currentTranslateX = 0;
            const singleSetWidth = data.length * 65; 

            const update = () => {
                if (!isDragging) {
                    speed += (baseSpeed - speed) * 0.05;
                    x -= speed;
                }
                if (Math.abs(x) >= singleSetWidth) x += singleSetWidth;
                if (x > 0) x -= singleSetWidth;
                track.style.transform = `translate3d(${x}px, 0, 0)`;
                requestAnimationFrame(update);
            };

            const startDrag = (e) => { isDragging = true; startX = (e.touches ? e.touches[0].clientX : e.clientX); currentTranslateX = x; speed = 0; track.style.cursor = 'grabbing'; };
            const moveDrag = (e) => { if (!isDragging) return; const clientX = (e.touches ? e.touches[0].clientX : e.clientX); x = currentTranslateX + (clientX - startX); };
            const endDrag = () => { if (!isDragging) return; isDragging = false; track.style.cursor = 'grab'; };

            track.addEventListener('mousedown', startDrag);
            track.addEventListener('touchstart', startDrag, { passive: true });
            window.addEventListener('mousemove', moveDrag);
            window.addEventListener('touchmove', moveDrag, { passive: true });
            window.addEventListener('mouseup', endDrag);
            window.addEventListener('touchend', endDrag);
            update();
        }
    };

    const preloadGiftNames = async () => {
        try {
            if (sessionStorage.getItem(CACHE_KEY)) { await initCarousel(); signalTelegramAppReady(); return; }
        } catch (error) { console.error(error); }

        let authHeader = sessionStorage.getItem(INIT_DATA_KEY) ? `Tma ${sessionStorage.getItem(INIT_DATA_KEY)}` : (sessionStorage.getItem(BYPASS_KEY_STORAGE) ? `Tma ${sessionStorage.getItem(BYPASS_KEY_STORAGE)}` : 'Tma invalid');

        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/ListGifts/AllGiftNames`, { headers: { 'Authorization': authHeader } });
            if (response.ok) sessionStorage.setItem(CACHE_KEY, JSON.stringify(await response.json()));
        } catch (error) { console.error(error); }
        finally { await initCarousel(); signalTelegramAppReady(); }
    };

    if (checkEnvironmentAndGate()) {
        preloadGiftNames();
        handleDeepLink();
    }
});