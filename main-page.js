// main-page.js

document.addEventListener('DOMContentLoaded', () => {
    
    // URL-адреса и ключ кэша
    const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net';
    const CACHE_KEY = 'giftNamesCache';

    // Элементы для блокировки
    const tgGateOverlay = document.getElementById('tg-gate-overlay');
    const body = document.body;

    /**
     * Проверяет, запущено ли приложение в Telegram.
     * Если нет, показывает экран блокировки и останавливает дальнейшее выполнение.
     * @returns {boolean} - true, если мы в Telegram, иначе false.
     */
    const checkEnvironmentAndGate = () => {
        return true;
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            console.log('Running inside Telegram WebApp. Initializing app...');
            return true;
        } else {
            console.log('Not in Telegram WebApp environment. Showing gate.');
            const html = document.documentElement;

            if (tgGateOverlay) {
                tgGateOverlay.classList.remove('hidden');
            }
            html.classList.add('body-gated'); 
            body.classList.add('body-gated'); 

            // 🔥 ИСПРАВЛЕНИЕ: Используем requestAnimationFrame для надежной остановки анимаций
            // Этот метод гарантирует, что код выполнится после того, как анимации будут 
            // точно созданы и доступны в `window`.
            requestAnimationFrame(() => {
                if (window.topLottieAnimation) {
                    window.topLottieAnimation.stop();
                    console.log('Top Lottie animation stopped.');
                }
                if (window.cardLottieAnimation) {
                    window.cardLottieAnimation.stop();
                    console.log('Card Lottie animation stopped.');
                }
            });

            return false;
        }
    };

    /**
     * Сигнализирует Telegram о готовности Web App.
     */
    const signalTelegramAppReady = () => {
        if (window.Telegram && window.Telegram.WebApp) {
            console.log('Signaling Telegram: WebApp is ready.');
            window.Telegram.WebApp.ready();
        }
    };

    /**
     * Загружает и кэширует список подарков.
     */
    const preloadGiftNames = async () => {
        try {
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (cachedData) {
                console.log('Gift names already in cache. App is ready.');
                signalTelegramAppReady();
                return;
            }
        } catch (error) {
            console.error('Failed to read from sessionStorage:', error);
        }

        console.log('Cache is empty. Fetching gift names from server...');
        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/ListGifts/AllGiftNames`);
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const giftNames = await response.json();
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(giftNames));
            console.log('Successfully fetched and cached gift names.');

            signalTelegramAppReady();

        } catch (error) {
            console.error('Failed to preload gift names:', error);
        }
    };

    // --- Основная логика при запуске ---
    const isTelegramEnvironment = checkEnvironmentAndGate();

    if (isTelegramEnvironment) {
        preloadGiftNames();
    }
});