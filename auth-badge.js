(function() {
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Проверяем, не в Telegram Web App ли мы
        const isTelegramWebApp = !!(window.Telegram?.WebApp?.initData);
        if (isTelegramWebApp) return; // Внутри Telegram Web App кнопка не нужна

        // 2. Проверяем, гость ли мы
        const BYPASS_KEY_STORAGE = 'apiBypassKey';
        const isGuest = sessionStorage.getItem(BYPASS_KEY_STORAGE) === 'GuestBypassKey_Public_883-xyz' || 
                        localStorage.getItem(BYPASS_KEY_STORAGE) === 'GuestBypassKey_Public_883-xyz';

        if (!isGuest) return; // Если уже вошли через TG, кнопка не нужна

        // 3. Создаем кнопку справа сверху
        const badge = document.createElement('div');
        badge.id = 'tg-auth-badge';
        badge.innerHTML = `
            <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.32.84-3.73 2.46-.35.24-.67.36-.97.35-.32-.01-.95-.18-1.41-.33-.57-.18-1.02-.28-1.01-.59.01-.16.23-.33.68-.51 2.76-1.2 4.6-2 5.53-2.4 2.64-1.1 3.19-1.3 3.55-1.3.08 0 .25.02.36.11.09.08.12.19.13.27 0 .05-.01.15-.02.21z"/>
            </svg>
            <span>Войти</span>
        `;

        // Стили кнопки
        Object.assign(badge.style, {
            position: 'fixed',
            top: '15px',
            right: '15px',
            zIndex: '99999',
            backgroundColor: 'rgba(36, 48, 73, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            padding: '6px 14px',
            display: 'flex',
            align-items: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.2s ease',
            userSelect: 'none'
        });

        // Эффект наведения
        badge.addEventListener('mouseenter', () => {
            badge.style.backgroundColor = '#2563eb';
            badge.style.borderColor = '#3b82f6';
            badge.style.transform = 'translateY(-1px)';
            badge.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
        });

        badge.addEventListener('mouseleave', () => {
            badge.style.backgroundColor = 'rgba(36, 48, 73, 0.85)';
            badge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            badge.style.transform = 'none';
            badge.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
        });

        // Клик сбрасывает гостевую сессию и редиректит на главную
        badge.addEventListener('click', () => {
            sessionStorage.removeItem(BYPASS_KEY_STORAGE);
            localStorage.removeItem(BYPASS_KEY_STORAGE);
            sessionStorage.removeItem('tgInitData');
            localStorage.removeItem('tgInitData');
            sessionStorage.removeItem('tgUser');
            localStorage.removeItem('tgUser');

            // Редирект на главную страницу, чтобы открылась модалка входа
            if (window.location.pathname.includes('/Monohrome/') || 
                window.location.pathname.includes('/nft-page/') || 
                window.location.pathname.includes('/Thematic/')) {
                window.location.href = '../index.html';
            } else {
                window.location.reload();
            }
        });

        document.body.appendChild(badge);
    });
})();
