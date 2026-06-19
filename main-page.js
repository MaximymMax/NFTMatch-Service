document.addEventListener('DOMContentLoaded', () => {

    // === ИНИЦИАЛИЗАЦИЯ TELEGRAM ===
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;

        // 1. Сообщаем, что приложение готово
        tg.ready();

        // 2. Гарантированно расширяем
        setTimeout(() => {
            try {
                tg.expand();
                // requestFullscreen появился в TG 8.0
                if (typeof tg.requestFullscreen === 'function' && tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) {
                    tg.requestFullscreen();
                }
            } catch (e) {
                // Игнорируем — expand уже был вызван
                console.warn('[TG] requestFullscreen not supported:', e?.message || e);
            }
        }, 100);

        // 3. Отключаем свайп вниз для закрытия (TG 7.7+)
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) {
            tg.disableVerticalSwipes();
        }

        // BackButton.hide() поддерживается с TG 6.1+
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            tg.BackButton.hide();
        }

        if (tg.initData) {
            // Сохраняем в обоих хранилищах через единый модуль
            if (window.NFTAuth) {
                const tgUser = tg.initDataUnsafe?.user;
                const userData = tgUser ? {
                    telegramId: tgUser.id,
                    username: tgUser.username || null,
                    firstName: tgUser.first_name || null,
                    lastName: tgUser.last_name || null,
                } : null;
                window.NFTAuth.saveInitData(tg.initData, userData);
            } else {
                sessionStorage.setItem('tgInitData', tg.initData);
                localStorage.setItem('tgInitData', tg.initData);
            }
        }
    }

    const SERVER_BASE_URL = window.CONFIG?.SERVER_BASE_URL || 'https://nftmatch.pro';
    const CACHE_KEY = 'giftNamesCache';
    const INIT_DATA_KEY = 'tgInitData';
    const BYPASS_KEY_STORAGE = 'apiBypassKey';

    const tgGateOverlay = document.getElementById('tg-gate-overlay');
    const body = document.body;

    // Callback для нового Telegram Login API
    function onTelegramAuth(data) {
        if (!data) return;

        // Новый API возвращает id_token (JWT) + user объект
        const token = data.id_token || null;
        const user = data.user || data; // совместимость со старым форматом

        // Сохраняем токен для авторизации запросов к API
        if (token) {
            localStorage.setItem(INIT_DATA_KEY, token);
            sessionStorage.setItem(INIT_DATA_KEY, token);
        }

        // Сохраняем данные пользователя
        if (user && user.id) {
            const userData = {
                telegramId: parseInt(user.id, 10),
                username: user.username || user.preferred_username || null,
                firstName: user.first_name || user.name?.split(' ')[0] || null,
                lastName: user.last_name || null,
            };
            localStorage.setItem('tgUser', JSON.stringify(userData));
            sessionStorage.setItem('tgUser', JSON.stringify(userData));
        }

        window.location.reload();
    }

    // ====== TELEGRAM OAUTH 2.0 (PKCE) ======

    // Генерируем случайную строку для PKCE code_verifier
    function generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    // SHA-256 хэш для code_challenge
    async function generateCodeChallenge(verifier) {
        const data = new TextEncoder().encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    // Обрабатываем callback от Telegram (если в URL есть ?code=...)
    async function handleOAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) return false;

        const codeVerifier = sessionStorage.getItem('tg_oauth_verifier');
        const redirectUri = sessionStorage.getItem('tg_oauth_redirect');
        if (!codeVerifier || !redirectUri) {
            console.warn('[OAuth] code_verifier not found in session');
            return false;
        }

        // Чистим URL от ?code=...
        window.history.replaceState({}, '', window.location.pathname);

        try {
            const resp = await fetch(`${SERVER_BASE_URL}/api/Auth/TelegramWebLogin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, codeVerifier, redirectUri })
            });

            if (!resp.ok) {
                const err = await resp.text();
                console.error('[OAuth] Backend error:', err);
                return false;
            }

            const data = await resp.json();

            // Сохраняем API-ключ через единый модуль (localStorage + sessionStorage)
            const userData = data.telegramId ? {
                telegramId: data.telegramId,
                username: data.username || null,
                firstName: data.username || null,
                lastName: null
            } : null;

            if (window.NFTAuth) {
                window.NFTAuth.saveApiKey(data.apiKey, userData);
            } else {
                sessionStorage.setItem(BYPASS_KEY_STORAGE, data.apiKey);
                localStorage.setItem(BYPASS_KEY_STORAGE, data.apiKey);
                if (userData) {
                    const json = JSON.stringify(userData);
                    sessionStorage.setItem('tgUser', json);
                    localStorage.setItem('tgUser', json);
                }
            }

            // Чистим временные данные PKCE
            sessionStorage.removeItem('tg_oauth_verifier');
            sessionStorage.removeItem('tg_oauth_redirect');

            window.location.reload();
            return true;
        } catch (e) {
            console.error('[OAuth] Fetch error:', e);
            return false;
        }
    }

    // Рендерим кнопку которая запускает OAuth redirect
    async function renderTelegramButton() {
        const container = document.getElementById('tg-login-container');
        if (!container || container.dataset.rendered) return;
        container.dataset.rendered = 'true';

        const btn = document.createElement('button');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white" style="margin-right:8px;vertical-align:middle;flex-shrink:0;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.32.84-3.73 2.46-.35.24-.67.36-.97.35-.32-.01-.95-.18-1.41-.33-.57-.18-1.02-.28-1.01-.59.01-.16.23-.33.68-.51 2.76-1.2 4.6-2 5.53-2.4 2.64-1.1 3.19-1.3 3.55-1.3.08 0 .25.02.36.11.09.08.12.19.13.27 0 .05-.01.15-.02.21z"/>
            </svg>
            ${window.NFTi18n ? window.NFTi18n.t('btn_tg_login') : 'Войти через Telegram'}`;
        btn.style.cssText = 'display:inline-flex;align-items:center;background:#2ea6da;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:15px;font-weight:600;cursor:pointer;width:100%;justify-content:center;transition:background 0.2s;';
        btn.addEventListener('mouseenter', () => btn.style.background = '#1d8bbf');
        btn.addEventListener('mouseleave', () => btn.style.background = '#2ea6da');

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = window.NFTi18n ? window.NFTi18n.t('btn_tg_redirecting') : 'Перенаправление...';

            const verifier = generateCodeVerifier();
            const challenge = await generateCodeChallenge(verifier);
            const redirectUri = `${window.location.origin}${window.location.pathname}`;
            const state = Math.random().toString(36).slice(2);

            sessionStorage.setItem('tg_oauth_verifier', verifier);
            sessionStorage.setItem('tg_oauth_redirect', redirectUri);

            const params = new URLSearchParams({
                client_id: window.CONFIG?.BOT_CLIENT_ID || '7544432373',
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'openid profile',
                state,
                code_challenge: challenge,
                code_challenge_method: 'S256'
            });

            window.location.href = `https://oauth.telegram.org/auth?${params}`;
        });

        container.appendChild(btn);
    }


    function saveInitData() {
        // Sync from localStorage if present
        if (!sessionStorage.getItem(INIT_DATA_KEY) && localStorage.getItem(INIT_DATA_KEY)) {
            sessionStorage.setItem(INIT_DATA_KEY, localStorage.getItem(INIT_DATA_KEY));
        }
        if (!sessionStorage.getItem('tgUser') && localStorage.getItem('tgUser')) {
            sessionStorage.setItem('tgUser', localStorage.getItem('tgUser'));
        }
        if (!sessionStorage.getItem(BYPASS_KEY_STORAGE) && localStorage.getItem(BYPASS_KEY_STORAGE)) {
            sessionStorage.setItem(BYPASS_KEY_STORAGE, localStorage.getItem(BYPASS_KEY_STORAGE));
        }

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
                tg.expand();
                // requestFullscreen только в TG 8.0+
                if (typeof tg.requestFullscreen === 'function' && tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) {
                    tg.requestFullscreen();
                }
            } catch (e) {
                console.warn('[TG] forceFullscreen error:', e?.message || e);
            }
        }
    };

    // Загрузка скрипта Telegram Login для внешних браузеров
    const loadTelegramLoginScript = () => {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            // Внутри WebApp скрипт авторизации не нужен
            return;
        }
        if (!document.getElementById('tg-login-script')) {
            const script = document.createElement('script');
            script.id = 'tg-login-script';
            script.src = 'https://telegram.org/js/telegram-login.js';
            script.async = true;
            script.onload = () => renderTelegramButton();
            document.head.appendChild(script);
        } else {
            renderTelegramButton();
        }
    };

    const isUserAuthorized = () => {
        return !!(sessionStorage.getItem(INIT_DATA_KEY) || sessionStorage.getItem(BYPASS_KEY_STORAGE));
    };

    const showAuthModal = () => {
        if (tgGateOverlay) tgGateOverlay.classList.remove('hidden');
        body.classList.add('body-gated');
    };

    const hideAuthModal = () => {
        if (tgGateOverlay) tgGateOverlay.classList.add('hidden');
        body.classList.remove('body-gated');
    };

    // Настраиваем кнопку закрытия модалки
    const closeBtn = document.getElementById('tg-gate-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAuthModal);
    }

    const checkEnvironmentAndGate = () => {
        // Загружаем скрипт логина для браузера в любом случае
        loadTelegramLoginScript();

        // Проверяем наличие параметра bypass в URL (для тестов/админа)
        const urlParams = new URLSearchParams(window.location.search);
        const bypass = urlParams.get('bypass');
        if (bypass) {
            sessionStorage.setItem(BYPASS_KEY_STORAGE, bypass);
            window.location.reload();
            return true;
        }

        if (saveInitData()) {
            body.classList.remove('body-gated');
            body.classList.add('tg-fullscreen');
            forceFullscreen();
            return true;
        }

        // Если обычный браузер и нет авторизации — НЕ блокируем страницу сразу,
        // позволяем просматривать главную страницу
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready();
            forceFullscreen();
        }

        // Навешиваем перехватчик кликов на карточки функций
        document.querySelectorAll('.feature-card-new').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!isUserAuthorized()) {
                    e.preventDefault(); // Запрещаем переход по ссылке
                    showAuthModal();    // Показываем окно авторизации
                }
            });
        });

        return true; // Разрешаем выполнение дальнейшего кода (прелоад и т.д.)
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
                const hash = window.location.hash;
                if (hash && hash.includes('tgWebAppData')) {
                    const hashIndex = targetUrl.indexOf('#');
                    const cleanUrl = hashIndex !== -1 ? targetUrl.substring(0, hashIndex) : targetUrl;
                    window.location.href = cleanUrl + hash;
                } else {
                    window.location.href = targetUrl;
                }
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

    function restoreParam(str) {
        if (!str) return '';
        // Заменяем все нижние подчеркивания на пробелы
        return decodeURIComponent(str).replace(/_/g, ' ');
    }

    // --- 2. Обнови функцию парсинга ---
    function parseStartAppParams(startappString) {
        const params = new URLSearchParams();
        if (!startappString) return params;

        const parts = startappString.split('-');
        let rawAction = parts[0].toLowerCase();
        let action = rawAction;

        params.set('action', action);

        // Используем restoreParam для всех текстовых параметров
        switch (action) {
            case 'monochrome_color':
                if (parts[1]) params.set('gift', restoreParam(parts[1]));
                if (parts[2]) params.set('color', restoreParam(parts[2]));
                break;

            case 'monochrome':
            case 'monochrome_model':
                if (parts[1]) params.set('gift', restoreParam(parts[1]));
                if (parts[2]) params.set('model', restoreParam(parts[2]));
                break;

            case 'similar':
                if (parts[1]) params.set('gift', restoreParam(parts[1]));
                if (parts[2]) params.set('model', restoreParam(parts[2]));
                if (parts[3]) params.set('count', parts[3]); // count обычно число, можно не менять
                break;

            case 'theme':
                if (parts[1]) params.set('gift', restoreParam(parts[1]));
                if (parts[2]) params.set('model', restoreParam(parts[2]));
                if (parts[3]) params.set('theme', restoreParam(parts[3]));
                break;
        }
        return params;
    }

    function showLoadingIndicator() {
        if (document.getElementById('deeplink-loader')) return;
        const loader = document.createElement('div');
        loader.id = 'deeplink-loader';
        loader.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(22, 33, 58, 0.95); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(10px);`;
        loader.innerHTML = `<div style="text-align: center; color: #fff;"><div style="width: 50px; height: 50px; border: 3px solid #38bdf8; border-top-color: transparent; border-radius: 50%; margin: 0 auto 20px; animation: spin 0.8s linear infinite;"></div><p style="font-weight: 500;">${window.NFTi18n ? window.NFTi18n.t('deep_link_loading') : 'Загрузка...'}</p></div><style>@keyframes spin {to{transform: rotate(360deg);}}</style>`;
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

        const CAROUSEL_CACHE_KEY = 'heroCarouselItemsMonochrome';
        const BACKGROUND_COLORS = {
            "Amber": "#C59937",
            "Celtic Blue": "#3E9FE3",
            "French Violet": "#A957DF",
            "Mexican Pink": "#D65787",
            "Mint Green": "#61B46E",
            "Fire Engine": "#DA4C4C",
            "Carbon": "#32373F",
            "Gold": "#F5C453"
        };

        const renderCards = (items) => {
            track.innerHTML = '';
            for (let i = 0; i < 4; i++) {
                items.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'carousel-card';
                    card.addEventListener('click', () => {
                        if (item.TelegramUrl) {
                            window.open(item.TelegramUrl, '_blank');
                        }
                    });

                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'carousel-card-img-wrapper';
                    imgWrapper.style.backgroundColor = BACKGROUND_COLORS[item.BackgroundName] || '#333';

                    const img = document.createElement('img');
                    img.src = item.ImageUrl;
                    img.alt = item.ModelName;

                    imgWrapper.appendChild(img);
                    card.appendChild(imgWrapper);

                    const priceSpan = document.createElement('span');
                    priceSpan.className = 'carousel-card-price';
                    priceSpan.textContent = `${Number(item.Price).toFixed(1)} TON`;
                    card.appendChild(priceSpan);

                    track.appendChild(card);
                });
            }
            wrapper.classList.remove('hidden');
        };

        let data = null;

        // 2. Если данных не было в кэше, грузим с сервера
        if (!data) {
            try {
                const response = await fetch(`${SERVER_BASE_URL}/api/MonoCoof/LiveMonochromeCache?backgroundName=random`);

                if (!response.ok) throw new Error('API Error');
                data = await response.json();

                if (data && data.length > 0) {
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

    // Сначала проверяем — вернулись ли мы из OAuth redirect
    handleOAuthCallback().then(wasCallback => {
        if (!wasCallback) {
            if (checkEnvironmentAndGate()) {
                preloadGiftNames();
                handleDeepLink();

                // Проверяем, нужно ли автоматически открыть окно авторизации
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('showAuth') === 'true' || sessionStorage.getItem('openAuthOnLoad') === 'true') {
                    sessionStorage.removeItem('openAuthOnLoad');
                    if (urlParams.get('showAuth') === 'true') {
                        // Очищаем URL от параметра showAuth
                        const newUrl = window.location.pathname + window.location.hash;
                        window.history.replaceState({}, '', newUrl);
                    }
                    showAuthModal();
                }
            }
        }
    });
});