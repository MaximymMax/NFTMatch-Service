document.addEventListener('DOMContentLoaded', () => {

    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.BackButton.hide(); // Скрываем кнопку назад на главной

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
            const initData = window.Telegram.WebApp.initData;
            if (initData) {
                try {
                    sessionStorage.setItem(INIT_DATA_KEY, initData);
                } catch (e) {
                    console.error(e);
                }

                try {
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
                } catch (e) { }

                return true;
            }
        }

        const cachedInitData = sessionStorage.getItem(INIT_DATA_KEY);
        if (cachedInitData) {
            return true;
        }

        const bypassKey = sessionStorage.getItem(BYPASS_KEY_STORAGE);
        if (bypassKey) {
            return true;
        }

        return false;
    }

    saveInitData();

    const checkEnvironmentAndGate = () => {
        const isAuthAvailable = saveInitData();

        if (isAuthAvailable) {
            if (tgGateOverlay) tgGateOverlay.classList.add('hidden');
            body.classList.remove('body-gated');

            body.classList.add('tg-fullscreen');

            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.expand();
            }
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

            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.ready();
            }

            return false;
        }
    };

    const signalTelegramAppReady = () => {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
        }
    };

    // ====== DEEP LINKING ROUTER (FIXED) ======
    function handleDeepLink() {
        const PROCESSED_KEY = 'deepLinkProcessed_v1';

        // 1. ВАЖНО: Если мы уже обработали диплинк в этой сессии, 
        // игнорируем его при возврате назад.
        if (sessionStorage.getItem(PROCESSED_KEY)) {
            console.log('[DeepLink] Already processed. Skipping to avoid loop.');
            return;
        }

        let urlParams = new URLSearchParams(window.location.search);
        let action = urlParams.get('action');

        if (!action) {
            const startapp = urlParams.get('startapp');
            const tgStartParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
            const deepLinkString = startapp || tgStartParam;

            if (deepLinkString) {
                console.log('[DeepLink] Telegram startapp detected:', deepLinkString);
                const parsedParams = parseStartAppParams(deepLinkString);
                parsedParams.forEach((value, key) => urlParams.set(key, value));
                action = urlParams.get('action');
            }
        }

        if (!action) return; // Нет действий — остаемся на главной

        console.log('[DeepLink] Processing action:', action);

        // 2. Ставим метку, что диплинк отработал.
        // При нажатии "Назад" этот код больше не выполнится.
        sessionStorage.setItem(PROCESSED_KEY, 'true');

        cleanCurrentUrlHistory();
        showLoadingIndicator();

        let targetUrl = '';

        switch (action) {
            case 'api':
                targetUrl = './API_info/api.html';
                break;
            case 'donate':
            case 'support':
                targetUrl = './Support/support.html';
                break;
            case 'monochrome_color':
                const giftColor = urlParams.get('gift');
                const color = urlParams.get('color');
                if (giftColor && color) {
                    targetUrl = `./Monohrome/background-finder.html?mode=findModels&gift=${encodeURIComponent(giftColor)}&color=${encodeURIComponent(color)}`;
                }
                break;
            case 'monochrome_model':
                const giftModel = urlParams.get('gift');
                const modelMono = urlParams.get('model');
                if (giftModel && modelMono) {
                    targetUrl = `./Monohrome/background-finder.html?mode=findBgs&gift=${encodeURIComponent(giftModel)}&model=${encodeURIComponent(modelMono)}`;
                }
                break;
            case 'similar':
                const giftSim = urlParams.get('gift');
                const modelSim = urlParams.get('model');
                const count = urlParams.get('count') || '100';
                if (giftSim && modelSim) {
                    targetUrl = `./nft-page/index.html?giftName=${encodeURIComponent(giftSim)}&modelName=${encodeURIComponent(modelSim)}&randomGiftsCount=${count}`;
                }
                break;
            case 'theme':
                const giftTheme = urlParams.get('gift');
                const modelTheme = urlParams.get('model');
                const themeName = urlParams.get('theme');
                if (giftTheme && modelTheme) {
                    targetUrl = `./Thematic/themes.html?gift=${encodeURIComponent(giftTheme)}&model=${encodeURIComponent(modelTheme)}`;
                    if (themeName) targetUrl += `&theme=${encodeURIComponent(themeName)}`;
                } else {
                    targetUrl = './Thematic/themes.html';
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

    // Функция жесткой очистки URL текущей страницы без перезагрузки
    function cleanCurrentUrlHistory() {
        const url = new URL(window.location.href);
        // Оставляем только чистый путь (без query params)
        const cleanPath = url.protocol + "//" + url.host + url.pathname;
        
        // replaceState ЗАМЕНЯЕТ текущую запись "с мусором" на чистую запись.
        // Теперь в истории браузера на этом месте лежит чистый index.html
        window.history.replaceState({ path: cleanPath }, '', cleanPath);
        console.log('[DeepLink] Current history cleaned:', cleanPath);
    }

    // Парсинг startapp параметров
    function parseStartAppParams(startappString) {
        const params = new URLSearchParams();
        // Защита от undefined
        if(!startappString) return params;

        const parts = startappString.split('-');
        const action = parts[0];

        params.set('action', action);

        switch (action) {
            case 'monochrome_color':
                if (parts[1]) params.set('gift', parts[1].replace(/_/g, ' '));
                if (parts[2]) params.set('color', parts[2].replace(/_/g, ' '));
                break;
            case 'monochrome_model':
                if (parts[1]) params.set('gift', parts[1].replace(/_/g, ' '));
                if (parts[2]) params.set('model', parts[2].replace(/_/g, ' '));
                break;
            case 'similar':
                if (parts[1]) params.set('gift', parts[1].replace(/_/g, ' '));
                if (parts[2]) params.set('model', parts[2].replace(/_/g, ' '));
                if (parts[3]) params.set('count', parts[3]);
                break;
            case 'theme':
                if (parts[1]) params.set('gift', parts[1].replace(/_/g, ' '));
                if (parts[2]) params.set('model', parts[2].replace(/_/g, ' '));
                if (parts[3]) params.set('theme', parts[3].replace(/_/g, ' '));
                break;
        }
        return params;
    }

    function showLoadingIndicator() {
        const existingLoader = document.getElementById('deeplink-loader');
        if (existingLoader) return;

        const loader = document.createElement('div');
        loader.id = 'deeplink-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(22, 33, 58, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

        loader.innerHTML = `
            <div style="text-align: center; color: #fff;">
                <div style="width: 50px; height: 50px; border: 3px solid rgba(56, 189, 248, 0.3); border-top-color: #38bdf8; border-radius: 50%; margin: 0 auto 20px; animation: spin 0.8s linear infinite;"></div>
                <p style="font-size: 16px; font-weight: 500; margin: 0;">Загрузка...</p>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.appendChild(loader);
    }

    function hideLoadingIndicator() {
        const loader = document.getElementById('deeplink-loader');
        if (loader) {
            loader.remove();
        }
    }
    // ====== END DEEP LINKING ROUTER ======

    const initCarousel = async () => {
        const wrapper = document.getElementById('hero-carousel-wrapper');
        const track = document.getElementById('hero-carousel-track');
        if (!wrapper || !track) return;

        let authHeader = 'Tma invalid';
        const initData = sessionStorage.getItem(INIT_DATA_KEY);
        if (initData) authHeader = `Tma ${initData}`;
        else {
            const bypass = sessionStorage.getItem(BYPASS_KEY_STORAGE);
            if (bypass) authHeader = `Tma ${bypass}`;
        }

        const TARGET_COLLECTION = [
            "Santa Hat",
            "Holiday Drink",
            "Candy Cane",
            "Xmas Stocking",
            "Ginger Cookie",
            "Jingle Bells",
            "Winter Wreath",
            "Snow Globe",
            "Snow Mittens",
            "Sleigh Bell",
            "Tama Gadget"
        ];

        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/MonoCoof/GetCollectionGradient/40`, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "CollectionNames": TARGET_COLLECTION })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();

            if (!data || data.length === 0) {
                return;
            }

            const createCard = (item) => {
                const card = document.createElement('div');
                card.className = 'carousel-card';
                card.style.backgroundColor = item.ColorHex || '#333';

                const img = document.createElement('img');
                const safeGiftName = encodeURIComponent(item.GiftName);
                const safeModelName = encodeURIComponent(item.ModelName);
                img.src = `https://cdn.changes.tg/gifts/models/${safeGiftName}/png/${safeModelName}.png`;
                img.alt = item.ModelName;

                card.appendChild(img);
                return card;
            };

            track.innerHTML = '';
            const itemsToRender = [...data];

            for (let i = 0; i < 4; i++) {
                itemsToRender.forEach(item => {
                    track.appendChild(createCard(item));
                });
            }

            wrapper.classList.remove('hidden');

            let x = 0;
            let speed = 0.4;
            const baseSpeed = 0.4;
            let isDragging = false;
            let startX = 0;
            let currentTranslateX = 0;
            let animationId;

            const cardFullWidth = 50 + 15;
            const singleSetWidth = data.length * cardFullWidth;

            let recoveryTimeout;

            const update = () => {
                if (!isDragging) {
                    if (Math.abs(speed - baseSpeed) > 0.01) {
                        speed += (baseSpeed - speed) * 0.05;
                    } else {
                        speed = baseSpeed;
                    }

                    x -= speed;
                }

                if (Math.abs(x) >= singleSetWidth) {
                    x += singleSetWidth;
                }
                if (x > 0) {
                    x -= singleSetWidth;
                }

                track.style.transform = `translate3d(${x}px, 0, 0)`;
                animationId = requestAnimationFrame(update);
            };

            const startDrag = (e) => {
                isDragging = true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                startX = clientX;
                currentTranslateX = x;

                clearTimeout(recoveryTimeout);
                speed = 0;

                track.style.cursor = 'grabbing';
            };

            const moveDrag = (e) => {
                if (!isDragging) return;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const delta = clientX - startX;
                x = currentTranslateX + delta;
            };

            const endDrag = () => {
                if (!isDragging) return;
                isDragging = false;
                track.style.cursor = 'grab';

                recoveryTimeout = setTimeout(() => {
                }, 50);
            };

            track.addEventListener('mousedown', startDrag);
            track.addEventListener('touchstart', startDrag, { passive: true });

            window.addEventListener('mousemove', moveDrag);
            window.addEventListener('touchmove', moveDrag, { passive: true });

            window.addEventListener('mouseup', endDrag);
            window.addEventListener('touchend', endDrag);

            update();

        } catch (e) {
            console.error(e);
            wrapper.classList.add('hidden');
        }
    };

    const preloadGiftNames = async () => {
        try {
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (cachedData) {
                await initCarousel();
                signalTelegramAppReady();
                return;
            }
        } catch (error) {
            console.error(error);
        }

        let authHeader = 'Tma invalid';
        const initData = sessionStorage.getItem(INIT_DATA_KEY);
        if (initData) authHeader = `Tma ${initData}`;
        else {
            const bypass = sessionStorage.getItem(BYPASS_KEY_STORAGE);
            if (bypass) authHeader = `Tma ${bypass}`;
        }

        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/ListGifts/AllGiftNames`, {
                headers: { 'Authorization': authHeader }
            });

            if (!response.ok) {
                throw new Error(`Status: ${response.status}`);
            }
            const giftNames = await response.json();
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(giftNames));
        } catch (error) {
            console.error(error);
        } finally {
            await initCarousel();
            signalTelegramAppReady();
        }
    };

    const isAuthorized = checkEnvironmentAndGate();

    if (isAuthorized) {
        preloadGiftNames();

        // Обрабатываем deep links после инициализации
        handleDeepLink();
    }
});