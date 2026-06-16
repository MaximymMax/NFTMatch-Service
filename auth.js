/**
 * auth.js — единый модуль авторизации NFTMatch
 * 
 * Приоритет источников:
 * 1. Telegram WebApp initData (живой токен внутри TG)
 * 2. apiBypassKey из localStorage (OAuth через бота — постоянный)
 * 3. apiBypassKey из sessionStorage (устаревший)
 * 4. tgInitData из localStorage (резервный)
 * 5. tgInitData из sessionStorage (резервный)
 */

(function () {
    const INIT_DATA_KEY = 'tgInitData';
    const BYPASS_KEY_STORAGE = 'apiBypassKey';
    const TG_USER_KEY = 'tgUser';

    /**
     * Возвращает заголовок Authorization для API-запросов.
     * Читает из localStorage (постоянное хранилище) и sessionStorage.
     */
    function getApiAuthHeader() {
        // 1. Живой Telegram WebApp initData (наивысший приоритет)
        try {
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
                const initData = window.Telegram.WebApp.initData;
                if (initData) return `Tma ${initData}`;
            }
        } catch (e) { }

        // 2. API-ключ (OAuth через бота) — localStorage первее sessionStorage
        try {
            const key = localStorage.getItem(BYPASS_KEY_STORAGE)
                || sessionStorage.getItem(BYPASS_KEY_STORAGE);
            if (key) return `Tma ${key}`;
        } catch (e) { }

        // 3. tgInitData — localStorage первее sessionStorage
        try {
            const initData = localStorage.getItem(INIT_DATA_KEY)
                || sessionStorage.getItem(INIT_DATA_KEY);
            if (initData) return `Tma ${initData}`;
        } catch (e) { }

        return 'Tma invalid';
    }

    /**
     * Возвращает true, если пользователь авторизован.
     */
    function isAuthenticated() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) return true;
        try {
            return !!(
                localStorage.getItem(BYPASS_KEY_STORAGE) ||
                sessionStorage.getItem(BYPASS_KEY_STORAGE) ||
                localStorage.getItem(INIT_DATA_KEY) ||
                sessionStorage.getItem(INIT_DATA_KEY)
            );
        } catch (e) { return false; }
    }

    /**
     * Возвращает сохранённые данные пользователя.
     */
    function getUser() {
        try {
            // Из живого TG WebApp
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            if (tgUser) return {
                telegramId: tgUser.id,
                username: tgUser.username || null,
                firstName: tgUser.first_name || null,
                lastName: tgUser.last_name || null,
            };

            // Из хранилища
            const raw = localStorage.getItem(TG_USER_KEY) || sessionStorage.getItem(TG_USER_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { }
        return null;
    }

    /**
     * Сохраняет токен OAuth (apiKey) постоянно в localStorage.
     * Вызывается после успешного входа через Telegram OAuth.
     */
    function saveApiKey(apiKey, userData) {
        try {
            localStorage.setItem(BYPASS_KEY_STORAGE, apiKey);
            sessionStorage.setItem(BYPASS_KEY_STORAGE, apiKey);
        } catch (e) { }

        if (userData) {
            try {
                const json = JSON.stringify(userData);
                localStorage.setItem(TG_USER_KEY, json);
                sessionStorage.setItem(TG_USER_KEY, json);
            } catch (e) { }
        }
    }

    /**
     * Сохраняет Telegram initData постоянно в localStorage.
     */
    function saveInitData(initData, user) {
        try {
            localStorage.setItem(INIT_DATA_KEY, initData);
            sessionStorage.setItem(INIT_DATA_KEY, initData);
        } catch (e) { }

        if (user) {
            try {
                const json = typeof user === 'string' ? user : JSON.stringify(user);
                localStorage.setItem(TG_USER_KEY, json);
                sessionStorage.setItem(TG_USER_KEY, json);
            } catch (e) { }
        }
    }

    /**
     * Синхронизирует localStorage → sessionStorage при загрузке страницы.
     * Вызывается автоматически.
     */
    function syncToSession() {
        const keys = [BYPASS_KEY_STORAGE, INIT_DATA_KEY, TG_USER_KEY];
        keys.forEach(k => {
            try {
                const val = localStorage.getItem(k);
                if (val && !sessionStorage.getItem(k)) {
                    sessionStorage.setItem(k, val);
                }
            } catch (e) { }
        });
    }

    /**
     * Полностью очищает сессию (выход из аккаунта).
     */
    function logout() {
        const keys = [BYPASS_KEY_STORAGE, INIT_DATA_KEY, TG_USER_KEY];
        keys.forEach(k => {
            try {
                localStorage.removeItem(k);
                sessionStorage.removeItem(k);
            } catch (e) { }
        });
    }

    // Автоматически синхронизируем при загрузке
    syncToSession();

    // Экспортируем глобально
    window.NFTAuth = {
        getApiAuthHeader,
        isAuthenticated,
        getUser,
        saveApiKey,
        saveInitData,
        logout,
    };

    // Обратная совместимость — пишем и как глобальную функцию
    window.getApiAuthHeader = getApiAuthHeader;
})();
