// Deep Link Debug & Fix Patch
// Добавьте этот скрипт ПОСЛЕ main-page.js в index.html

console.log('[DeepLink Patch] Loaded');
console.log('[DeepLink Patch] URL:', window.location.href);
console.log('[DeepLink Patch] Search params:', window.location.search);

// Переопределяем handleDeepLink с логированием
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DeepLink Patch] DOM loaded');

    // Ждём немного для инициализации Telegram WebApp
    setTimeout(() => {
        console.log('[DeepLink Patch] Checking Telegram WebApp...');

        if (window.Telegram && window.Telegram.WebApp) {
            console.log('[DeepLink Patch] Telegram WebApp доступен');
            console.log('[DeepLink Patch] initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
            console.log('[DeepLink Patch] start_param:', window.Telegram.WebApp.initDataUnsafe?.start_param);
        } else {
            console.log('[DeepLink Patch] Telegram WebApp НЕ доступен');
        }

        // Проверяем URL параметры
        const urlParams = new URLSearchParams(window.location.search);
        const startapp = urlParams.get('startapp');
        const action = urlParams.get('action');

        console.log('[DeepLink Patch] URL startapp:', startapp);
        console.log('[DeepLink Patch] URL action:', action);

        // Если есть startapp или start_param, обрабатываем
        const tgStartParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
        const deepLinkString = startapp || tgStartParam;

        console.log('[DeepLink Patch] Final deepLinkString:', deepLinkString);

        if (deepLinkString || action) {
            console.log('[DeepLink Patch] Deep link detected! Processing...');

            // Используем replace вместо href чтобы не добавлять в историю
            // Если это простое действие без параметров
            if (deepLinkString === 'api' || action === 'api') {
                console.log('[DeepLink Patch] Redirecting to API page...');
                setTimeout(() => {
                    window.location.replace('./API_info/api.html');
                }, 300);
            }
            else if (deepLinkString === 'donate' || deepLinkString === 'support' || action === 'donate' || action === 'support') {
                console.log('[DeepLink Patch] Redirecting to Support page...');
                setTimeout(() => {
                    window.location.replace('./Support/support.html');
                }, 300);
            }
            // Монохромы по цвету
            else if (deepLinkString && deepLinkString.startsWith('monochrome_color-')) {
                const parts = deepLinkString.split('-');
                const gift = parts[1]?.replace(/_/g, ' ');
                const color = parts[2]?.replace(/_/g, ' ');
                console.log(`[DeepLink Patch] Monochrome color: ${gift} on ${color}`);
                setTimeout(() => {
                    window.location.replace(`./Monohrome/background-finder.html?mode=findModels&gift=${encodeURIComponent(gift)}&color=${encodeURIComponent(color)}`);
                }, 300);
            }
            // Монохромы - фоны для модели
            else if (deepLinkString && deepLinkString.startsWith('monochrome_model-')) {
                const parts = deepLinkString.split('-');
                const gift = parts[1]?.replace(/_/g, ' ');
                const model = parts[2]?.replace(/_/g, ' ');
                console.log(`[DeepLink Patch] Monochrome model: ${gift} - ${model}`);
                setTimeout(() => {
                    window.location.replace(`./Monohrome/background-finder.html?mode=findBgs&gift=${encodeURIComponent(gift)}&model=${encodeURIComponent(model)}`);
                }, 300);
            }
            // Похожие (count=0 означает ВСЕ коллекции)
            else if (deepLinkString && deepLinkString.startsWith('similar-')) {
                const parts = deepLinkString.split('-');
                const gift = parts[1]?.replace(/_/g, ' ');
                const model = parts[2]?.replace(/_/g, ' ');
                const count = parts[3] || '0'; // 0 = ВСЕ коллекции
                console.log(`[DeepLink Patch] Similar: ${gift} - ${model}, count: ${count}`);
                setTimeout(() => {
                    window.location.replace(`./nft-page/index.html?giftName=${encodeURIComponent(gift)}&modelName=${encodeURIComponent(model)}&randomGiftsCount=${count}`);
                }, 300);
            }
            // Тематики
            else if (deepLinkString && deepLinkString.startsWith('theme')) {
                const parts = deepLinkString.split('-');
                let url = './Thematic/themes.html';

                if (parts[1]) {
                    const gift = parts[1].replace(/_/g, ' ');
                    const model = parts[2]?.replace(/_/g, ' ');
                    const theme = parts[3]?.replace(/_/g, ' ');

                    const params = [];
                    if (gift) params.push(`gift=${encodeURIComponent(gift)}`);
                    if (model) params.push(`model=${encodeURIComponent(model)}`);
                    if (theme) params.push(`theme=${encodeURIComponent(theme)}`);

                    if (params.length > 0) {
                        url += '?' + params.join('&');
                    }
                }

                console.log(`[DeepLink Patch] Theme: ${url}`);
                setTimeout(() => {
                    window.location.replace(url);
                }, 300);
            }
        } else {
            console.log('[DeepLink Patch] No deep links found');
        }
    }, 800); // Увеличил задержку до 800ms
});
