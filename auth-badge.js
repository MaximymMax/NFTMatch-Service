(function () {
    // Ждём загрузку NFTAuth (auth.js подключается раньше)
    const hasAuth = window.NFTAuth ? window.NFTAuth.isAuthenticated() : false;
    const isTelegramWebApp = !!(window.Telegram?.WebApp?.initData || (window.Telegram?.WebApp?.platform && window.Telegram.WebApp.platform !== 'unknown'));

    const isSubPage = window.location.pathname.includes('/Monohrome/') ||
        window.location.pathname.includes('/nft-page/') ||
        window.location.pathname.includes('/Thematic/');

    // Если нет авторизации и мы на дочерней странице — редирект на главную
    if (!hasAuth && isSubPage) {
        const hash = window.location.hash;
        window.location.href = '../index.html' + (hash && hash.includes('tgWebAppData') ? hash : '');
        return;
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Перехватчик для сохранения hash-параметров Telegram WebApp при переходах по ссылкам
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Игнорируем внешние ссылки и якоря
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
                return;
            }

            const currentHash = window.location.hash;
            if (currentHash && currentHash.includes('tgWebAppData')) {
                e.preventDefault();
                let targetUrl = href;
                const hashIndex = targetUrl.indexOf('#');
                if (hashIndex !== -1) {
                    targetUrl = targetUrl.substring(0, hashIndex);
                }
                targetUrl += currentHash;
                window.location.href = targetUrl;
            }
        });

        if (isTelegramWebApp) return; // Внутри Telegram Web App кнопка не нужна

        if (hasAuth) {
            // Кнопка «Выйти»
            const badge = document.createElement('div');
            badge.id = 'tg-auth-badge';

            // Пробуем показать имя пользователя
            const user = window.NFTAuth ? window.NFTAuth.getUser() : null;
            const label = user?.username
                ? `@${user.username}`
                : user?.firstName
                    ? user.firstName
                    : 'Выйти';

            badge.innerHTML = `
                <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.32.84-3.73 2.46-.35.24-.67.36-.97.35-.32-.01-.95-.18-1.41-.33-.57-.18-1.02-.28-1.01-.59.01-.16.23-.33.68-.51 2.76-1.2 4.6-2 5.53-2.4 2.64-1.1 3.19-1.3 3.55-1.3.08 0 .25.02.36.11.09.08.12.19.13.27 0 .05-.01.15-.02.21z"/>
                </svg>
                <span>${label}</span>
            `;

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
                alignItems: 'center',
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

            badge.addEventListener('mouseenter', () => {
                badge.style.backgroundColor = '#ef4444';
                badge.style.borderColor = '#f87171';
                badge.style.transform = 'translateY(-1px)';
                badge.querySelector('span').textContent = 'Выйти';
            });

            badge.addEventListener('mouseleave', () => {
                badge.style.backgroundColor = 'rgba(36, 48, 73, 0.85)';
                badge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                badge.style.transform = 'none';
                badge.querySelector('span').textContent = label;
            });

            badge.addEventListener('click', () => {
                if (window.NFTAuth) {
                    window.NFTAuth.logout();
                }
                // Редирект на главную если мы на подстранице
                if (isSubPage) {
                    window.location.href = '../index.html';
                } else {
                    window.location.reload();
                }
            });

            document.body.appendChild(badge);
        } else {
            // Кнопка «Войти» — только на главной
            if (!isSubPage) {
                const badge = document.createElement('div');
                badge.id = 'tg-auth-badge';
                badge.innerHTML = `
                    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.32.84-3.73 2.46-.35.24-.67.36-.97.35-.32-.01-.95-.18-1.41-.33-.57-.18-1.02-.28-1.01-.59.01-.16.23-.33.68-.51 2.76-1.2 4.6-2 5.53-2.4 2.64-1.1 3.19-1.3 3.55-1.3.08 0 .25.02.36.11.09.08.12.19.13.27 0 .05-.01.15-.02.21z"/>
                    </svg>
                    <span>Войти</span>
                `;

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
                    alignItems: 'center',
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

                badge.addEventListener('mouseenter', () => {
                    badge.style.backgroundColor = '#2563eb';
                    badge.style.borderColor = '#3b82f6';
                    badge.style.transform = 'translateY(-1px)';
                });

                badge.addEventListener('mouseleave', () => {
                    badge.style.backgroundColor = 'rgba(36, 48, 73, 0.85)';
                    badge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    badge.style.transform = 'none';
                });

                badge.addEventListener('click', () => {
                    const overlay = document.getElementById('tg-gate-overlay');
                    if (overlay) {
                        overlay.classList.remove('hidden');
                        document.body.classList.add('body-gated');
                    }
                });

                document.body.appendChild(badge);
            }
        }
    });
})();
