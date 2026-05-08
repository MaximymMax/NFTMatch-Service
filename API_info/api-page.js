// Базовая функция копирования
window.copyText = function (text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(hapticSuccess).catch(fallbackCopy);
    } else {
        fallbackCopy(text);
    }
};

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        hapticSuccess();
    } catch (err) {
        console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
}

function hapticSuccess() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
}

// Функции для работы с модалкой
window.closeModal = function() {
    document.getElementById('confirmModal').style.display = 'none';
};

window.copyGeneratedKey = function() {
    const key = document.getElementById('newKeyValue').textContent;
    window.copyText(key);
};

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.BackButton.show();
        tg.BackButton.onClick(() => window.history.back());
        if (tg.setHeaderColor) tg.setHeaderColor('#16213a');
    }

    const preGenerateBtn = document.getElementById('preGenerateBtn');
    const confirmGenerateBtn = document.getElementById('confirmGenerateBtn');
    const keyDisplayBox = document.getElementById('keyDisplayBox');
    const newKeyValue = document.getElementById('newKeyValue');

    // Клик по начальной кнопке -> показываем модалку
    preGenerateBtn.addEventListener('click', () => {
        document.getElementById('confirmModal').style.display = 'flex';
    });

    // Клик по кнопке "Сгенерировать" внутри модалки
    confirmGenerateBtn.addEventListener('click', async () => {
        // Закрываем модалку сразу
        closeModal();

        const initData = window.Telegram?.WebApp?.initData;
        if (!initData) {
            alert("Пожалуйста, откройте приложение внутри Telegram.");
            return;
        }

        // Блокируем кнопку и меняем текст
        preGenerateBtn.disabled = true;
        preGenerateBtn.textContent = "Создание...";

        try {
            const response = await fetch('https://nftmatchbot20250730152328.azurewebsites.net/api/Auth/GenerateKey', {
                method: 'POST',
                headers: { 'Authorization': initData }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Прячем кнопку, показываем блок с ключом
                preGenerateBtn.style.display = 'none';
                newKeyValue.textContent = data.apiKey;
                keyDisplayBox.style.display = 'flex';
                
                hapticSuccess();
            } else {
                const errText = await response.text();
                alert("Ошибка генерации: " + errText);
                preGenerateBtn.disabled = false;
                preGenerateBtn.textContent = "Сгенерировать ключ";
            }
        } catch (err) {
            alert("Ошибка сети. Не удалось связаться с сервером.");
            preGenerateBtn.disabled = false;
            preGenerateBtn.textContent = "Сгенерировать ключ";
        }
    });
});