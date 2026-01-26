// Объявляем функцию в глобальной области видимости
window.copyText = function (text) {
    if (!text) return;

    // Используем современный API буфера обмена
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            // Вибрация в Telegram (если доступно)
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            console.log('Copied:', text);
        }).catch(err => {
            console.error('Clipboard write failed:', err);
        });
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // Telegram WebApp Logic
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        // Сбрасываем старые обработчики
        tg.BackButton.offClick();
        tg.BackButton.show();

        tg.BackButton.onClick(() => {
            // Используем history.back(). 
            // Так как в main-page.js мы очистили URL и поставили флаг PROCESSED_KEY,
            // мы вернемся на чистую главную страницу и скрипт редиректа нас проигнорирует.
            window.history.back();
        });

        if (tg.setHeaderColor) {
            tg.setHeaderColor('#16213a');
        }
    }

    // Плавный скролл по якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.getElementById(this.getAttribute('href').substring(1));
            if (target) {
                // Учитываем новый отступ сверху (90px)
                const offset = target.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: offset, behavior: "smooth" });
            }
        });
    });
});