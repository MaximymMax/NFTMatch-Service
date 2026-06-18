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
        // Добавляем стиль для скрытия плашки при открытых модалках
        const style = document.createElement('style');
        style.textContent = `
            body.modal-open #tg-auth-badge,
            body.body-gated #tg-auth-badge,
            body:has(#tg-profile-modal) #tg-auth-badge,
            body:has(.sub-modal-overlay) #tg-auth-badge,
            body:has(.sub-modal-overlay.active) #tg-auth-badge,
            body:has(#themes-modal-overlay:not(.hidden)) #tg-auth-badge,
            body:has(#nftDetailsModalOverlay:not(.hidden)) #tg-auth-badge,
            body:has([id*="modal-overlay"]) #tg-auth-badge,
            body:has([id*="ModalOverlay"]) #tg-auth-badge,
            body:has([class*="modal-overlay"]) #tg-auth-badge {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

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
                    : (window.NFTi18n ? window.NFTi18n.t('badge_logout', 'Выйти') : 'Выйти');

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
                zIndex: '99',
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
                badge.style.backgroundColor = 'rgba(59, 130, 246, 0.85)';
                badge.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                badge.style.transform = 'translateY(-1.5px)';
            });

            badge.addEventListener('mouseleave', () => {
                badge.style.backgroundColor = 'rgba(36, 48, 73, 0.85)';
                badge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                badge.style.transform = 'none';
            });

            badge.addEventListener('click', () => {
                if (window.NFTAuth && window.NFTAuth.getUser()) {
                    showProfileModal(window.NFTAuth.getUser(), isSubPage);
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
                    <span>${window.NFTi18n ? window.NFTi18n.t('badge_login', 'Войти') : 'Войти'}</span>
                `;

                Object.assign(badge.style, {
                    position: 'fixed',
                    top: '15px',
                    right: '15px',
                    zIndex: '99',
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

    function showProfileModal(user, isSubPage) {
        const existing = document.getElementById('tg-profile-modal');
        if (existing) {
            existing.style.display = 'flex';
            return;
        }

        const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || (window.NFTi18n ? window.NFTi18n.t('badge_user', 'Пользователь') : 'Пользователь');
        const usernameText = user.username ? `@${user.username}` : (window.NFTi18n ? window.NFTi18n.t('badge_no', 'нет') : 'нет');

        const modalHtml = `
            <div id="tg-profile-modal" class="modal-overlay" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100000; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); font-family: 'Inter', sans-serif;">
                <div class="profile-modal-content" style="background: #16213a; width: 100%; max-width: 320px; border-radius: 20px; padding: 24px; text-align: center; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box; color: #fff; transform: scale(1); animation: popIn 0.2s ease-out;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 15px rgba(37,99,235,0.4);">
                        <svg viewBox="0 0 24 24" style="width: 32px; height: 32px; fill: white;">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                    <h3 style="margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 700; color: #fff;">${displayName}</h3>
                    <p style="margin: 0 0 20px 0; color: #3b82f6; font-size: 0.9rem; font-weight: 600;">${usernameText}</p>
                    
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; margin-bottom: 24px; text-align: left; font-size: 0.85rem; line-height: 1.6;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="color: rgba(255,255,255,0.4);">Telegram ID:</span>
                            <code style="color: #fff; font-weight: 600;">${user.telegramId}</code>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: rgba(255,255,255,0.4);">${window.NFTi18n ? window.NFTi18n.t('badge_status', 'Статус:') : 'Статус:'}</span>
                            <span style="color: #10b981; font-weight: 600;">${window.NFTi18n ? window.NFTi18n.t('badge_authorized', 'Авторизован') : 'Авторизован'}</span>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button id="profile-logout-btn" style="background: #ef4444; color: #fff; border: none; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;">
                            ${window.NFTi18n ? window.NFTi18n.t('badge_btn_logout', 'Выйти из аккаунта') : 'Выйти из аккаунта'}
                        </button>
                        <button id="profile-relogin-btn" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 12px; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;">
                            ${window.NFTi18n ? window.NFTi18n.t('badge_btn_relogin', 'Войти под другим аккаунтом') : 'Войти под другим аккаунтом'}
                        </button>
                        <button onclick="document.getElementById('tg-profile-modal').remove()" style="background: transparent; color: rgba(255,255,255,0.5); border: none; padding: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; margin-top: 4px;">
                            ${window.NFTi18n ? window.NFTi18n.t('badge_close', 'Закрыть') : 'Закрыть'}
                        </button>
                    </div>
                </div>
            </div>
            <style>
                @keyframes popIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                #profile-logout-btn:hover { background: #dc2626 !important; }
                #profile-relogin-btn:hover { background: rgba(255,255,255,0.12) !important; }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('profile-logout-btn').onclick = () => {
            if (window.NFTAuth) {
                window.NFTAuth.logout();
            }
            if (isSubPage) {
                window.location.href = '../index.html';
            } else {
                window.location.reload();
            }
        };

        document.getElementById('profile-relogin-btn').onclick = () => {
            if (window.NFTAuth) {
                window.NFTAuth.logout();
            }
            if (isSubPage) {
                window.location.href = '../index.html?showAuth=true';
            } else {
                sessionStorage.setItem('openAuthOnLoad', 'true');
                window.location.reload();
            }
        };
    }
})();
