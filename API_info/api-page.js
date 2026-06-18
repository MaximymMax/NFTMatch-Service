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

    // Инициализация локализации лимитов
    const basicLimitsEl = document.getElementById('basic-key-limits');
    if (basicLimitsEl) {
        basicLimitsEl.innerHTML = window.NFTi18n ? window.NFTi18n.t('key_limits', '40 / мин | 200 / час', {count: 40, hourCount: 200}) : '40 / мин | 200 / час';
    }
    const proLimitsEl = document.getElementById('pro-key-limits');
    if (proLimitsEl) {
        proLimitsEl.innerHTML = window.NFTi18n ? window.NFTi18n.t('key_limits', '100 / мин | 5000 / час', {count: 100, hourCount: 5000}) : '100 / мин | 5000 / час';
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
        // Закрываем модалку с предупреждением сразу
        closeModal();

        const authHeader = window.NFTAuth ? window.NFTAuth.getApiAuthHeader() : null;
        if (!authHeader || authHeader === 'Tma invalid') {
            alert(window.NFTi18n ? window.NFTi18n.t('auth_required', "Пожалуйста, сначала авторизуйтесь через Telegram.") : "Пожалуйста, сначала авторизуйтесь через Telegram.");
            return;
        }

        // Блокируем кнопку и меняем текст
        preGenerateBtn.disabled = true;
        preGenerateBtn.textContent = window.NFTi18n ? window.NFTi18n.t('api_creating', "Создание...") : "Создание...";

        try {
            const baseUrl = window.CONFIG?.SERVER_BASE_URL || 'https://nftmatch.pro';
            const response = await fetch(`${baseUrl}/api/Auth/GenerateKey`, {
                method: 'POST',
                headers: { 'Authorization': authHeader }
            });

            // 📢 ПЕРЕХВАТ 403 (ОТСУТСТВИЕ ПОДПИСКИ)
            if (response.status === 403) {
                try {
                    const errData = await response.json();
                    if (errData.error === 'subscription_required') {
                        window.showSubscriptionModal(); // Показываем модалку
                        preGenerateBtn.disabled = false;
                        preGenerateBtn.textContent = window.NFTi18n ? window.NFTi18n.t('btn_generate_key', "Сгенерировать ключ") : "Сгенерировать ключ";
                        return; // Прерываем выполнение
                    }
                } catch(e) {}
            }

            if (response.ok) {
                const data = await response.json();
                
                // Обновляем ключ в сессии, чтобы не разлогинивало
                if (window.NFTAuth && window.NFTAuth.getUser()) {
                    const currentUser = window.NFTAuth.getUser();
                    window.NFTAuth.saveApiKey(data.apiKey, currentUser);
                }

                // Прячем кнопку, показываем блок с ключом
                preGenerateBtn.style.display = 'none';
                newKeyValue.textContent = data.apiKey;
                keyDisplayBox.style.display = 'flex';
                
                hapticSuccess();
            } else {
                const errText = await response.text();
                // Если ошибка другая, выводим алерт
                alert(window.NFTi18n ? window.NFTi18n.t('api_error', "Ошибка генерации: {error}", {error: errText}) : "Ошибка генерации: " + errText);
                preGenerateBtn.disabled = false;
                preGenerateBtn.textContent = window.NFTi18n ? window.NFTi18n.t('btn_generate_key', "Сгенерировать ключ") : "Сгенерировать ключ";
            }
        } catch (err) {
            alert(window.NFTi18n ? window.NFTi18n.t('net_error', "Ошибка сети. Не удалось связаться с сервером.") : "Ошибка сети. Не удалось связаться с сервером.");
            preGenerateBtn.disabled = false;
            preGenerateBtn.textContent = window.NFTi18n ? window.NFTi18n.t('btn_generate_key', "Сгенерировать ключ") : "Сгенерировать ключ";
        }
    });
});

window.showSubscriptionModal = function() {
    const existingModal = document.getElementById('sub-required-modal');
    if (existingModal) {
        existingModal.style.display = 'flex';
        return;
    }

    const channelUrl = "https://t.me/NFTstylet"; 

    const modalHtml = `
        <div id="sub-required-modal" class="modal-overlay" style="display: flex; z-index: 100000; flex-direction: column; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(5px);">
            <div class="sub-modal-content" style="background: var(--surface-color); width: 100%; max-width: 320px; border-radius: var(--radius); padding: 24px; text-align: center; border: 1px solid var(--border-dim); animation: popIn 0.2s ease-out; box-sizing: border-box;">
                <div class="modal-icon" style="color: var(--primary-blue); margin-bottom: 16px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                </div>
                <h3 style="margin: 0 0 10px 0; color: #fff; font-size: 1.2rem;">${window.NFTi18n ? window.NFTi18n.t('sub_required', 'Требуется подписка') : 'Требуется подписка'}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.5;">
                    ${window.NFTi18n ? window.NFTi18n.t('sub_desc_api', 'Для генерации API ключа необходимо быть подписчиком нашего Telegram канала.') : 'Для генерации API ключа необходимо быть подписчиком нашего Telegram канала.'}
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <a href="${channelUrl}" target="_blank" style="background: var(--primary-blue); color: #fff; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; transition: transform 0.2s;">
                        ${window.NFTi18n ? window.NFTi18n.t('go_to_channel', 'Перейти в канал') : 'Перейти в канал'}
                    </a>
                    <button onclick="document.getElementById('sub-required-modal').style.display='none'" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                        ${window.NFTi18n ? window.NFTi18n.t('later', 'Позже') : 'Позже'}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};