// putya: "сделай доступным всем весь функционал" — раньше новая шапка/вкладки на страницах, где их
// изначально не было (Монохромы/Тематики/Похожие), были скрыты по умолчанию (.cw-admin-nav-hidden)
// и раскрывались только по IP-гейту владельца через фейковый фетч на ColorWheel-эндпоинт. Гейт убран
// — теперь снимаем cw-admin-nav-hidden сразу для всех посетителей.
(function () {
    const SELF_SRC = document.currentScript && document.currentScript.src;
    // putya: "единая шапка для всех страниц... кнопки переключения языка, регистрации через тг,
    // апи, гитхаб" — RU/EN (i18n.js) и TG-логин/профиль (auth-badge.js) уже существуют на каждой
    // странице, но живут в СВОЁМ отдельном #nft-top-bar (position:fixed, поверх страницы), а не в
    // .cw-page-header. Вместо переписывания их логики просто переносим уже готовые узлы (со всеми
    // обработчиками) внутрь .cw-page-header — #tg-auth-badge даже содержит собственные стили
    // специально под "жизнь внутри бара" (position:static!important), т.е. код уже расчитан на
    // переезд.
    function mergeTopBarIntoHeader() {
        const topBar = document.getElementById('nft-top-bar');
        const header = document.querySelector('.cw-page-header');
        if (!topBar || !header) return;

        const leftGroup = header.children[0];
        const rightGroup = header.children[1];
        const langSwitcher = document.getElementById('lang-switcher-container');
        const authBadge = document.getElementById('tg-auth-badge');

        if (langSwitcher && leftGroup) leftGroup.insertBefore(langSwitcher, leftGroup.firstChild);
        if (authBadge && rightGroup) rightGroup.appendChild(authBadge);
    }

    // putya: "если по ширине в шапке вмещается блок гитхаба, надо его туда поставить, если нет, то
    // снизу к другим блокам" — только на главной (единственная страница с обоими узлами:
    // .cw-header-gh-slot в шапке и #gh-info-card среди info-cards). Меряем РЕАЛЬНУЮ доступную
    // ширину, а не гадаем брейкпоинт — состав правой группы (API + бейдж входа, где бейдж может
    // быть именем пользователя произвольной длины) меняется от пользователя к пользователю.
    function updateGithubPlacement() {
        const headerGh = document.querySelector('.cw-header-gh-slot');
        const cardGh = document.getElementById('gh-info-card');
        const header = document.querySelector('.cw-page-header');
        // putya: "на всех страницах одинаковые кнопки на шапке" — GitHub теперь есть в шапке и на
        // Монохромах/Тематиках/Похожих, где нижней карточки #gh-info-card нет: там просто прячем
        // кнопку, если не влезает, без противофазы.
        if (!headerGh || !header) return;

        headerGh.style.display = ''; // временно показываем, чтобы измерить её реальную ширину
        const leftGroup = header.children[0];
        const rightGroup = header.children[1];
        const gap = parseFloat(getComputedStyle(header).gap) || 0;
        const padding = parseFloat(getComputedStyle(header).paddingLeft) + parseFloat(getComputedStyle(header).paddingRight);
        const needed = leftGroup.scrollWidth + rightGroup.scrollWidth + gap + padding;
        const fits = needed <= header.clientWidth;

        headerGh.style.display = fits ? '' : 'none';
        // #gh-info-card в styles.css скрыт по умолчанию (display:none как фолбэк без JS), поэтому
        // "показать" здесь должно быть явным 'flex' (как у .info-card), а не сбросом в '' —
        // иначе на узких экранах карточка GitHub не появлялась вообще.
        if (cardGh) cardGh.style.display = fits ? 'none' : 'flex';
    }

    let ghResizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(ghResizeTimer);
        ghResizeTimer = setTimeout(updateGithubPlacement, 150);
    });

    // Раздел «Карточка»: вкладка появляется в ряду вкладок на каждой странице, где он есть.
    function addCardTab() {
        try {
            const tabs = document.querySelector('.cw-tabs');
            if (!tabs || tabs.querySelector('[data-tab="card"]') || !SELF_SRC) return;
            const a = document.createElement('a');
            a.className = 'cw-tab' + (location.pathname.indexOf('/Card/') !== -1 ? ' active' : '');
            a.setAttribute('data-tab', 'card');
            a.href = new URL('Card/card.html', SELF_SRC).href;
            a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="3"/><path stroke-linecap="round" d="M3 10h18"/></svg><span>Карточка</span>';
            tabs.appendChild(a);
        } catch (e) { }
    }

    // Администратору: «Карточка» стоит в центре ряда на месте «Главной» и показывает его мини-карточку (только фон),
    // а на страницах раздела в ряду остаются три кнопки — Главная, Лента, Карточка.
    const ADMIN_TG_ID = 7343414766;
    function isCardAdmin() {
        try { const u = window.NFTAuth && NFTAuth.getUser(); return !!u && Number(u.telegramId || u.id) === ADMIN_TG_ID; } catch (e) { return false; }
    }
    // Мини-карточка: фон выбранного пользователем цвета, блик, чип и две строки — без 3D и без стикеров.
    function paintMiniCard(el, c0, c1) {
        el.style.background = 'linear-gradient(135deg,' + c0 + ',' + c1 + ')';
    }
    // Вместо схематичной мини-карточки — скриншот своей карточки (на сервере он 1600×1000, карточка 1400 в центре: показываем только её)
    function paintMiniShot(el, url) {
        if (!url || el.dataset.shot === url) return;
        const im = new Image(); im.alt = ''; im.draggable = false;
        im.onload = () => {
            el.dataset.shot = url;
            el.innerHTML = '';
            im.style.cssText = 'position:absolute;display:block;width:115.4%;height:auto;object-fit:fill;border-radius:0;left:-7.7%;top:-13%;max-width:none;pointer-events:none';
            el.appendChild(im);
        };
        im.src = url;
    }
    // Плашка конкурса на главном экране (пока только админу): золотая рамка, лента «Конкурс», случайная карточка из ленты под наклоном (скриншот карточки, 3D-перспектива).
    function buildContest(tabs) {
        const ban = document.createElement('a');
        ban.className = 'cw-contest';
        ban.href = new URL('Card/feed.html', SELF_SRC).href;
        ban.innerHTML = '<span class="cw-contest-ribbon">Конкурс</span>' +
            '<span class="cw-contest-stage"><span class="cw-contest-card"><span class="cw-contest-pic"></span><span class="cw-contest-sheen"></span></span></span>' +
            '<span class="cw-contest-title">Лучшее оформление</span>' +
            '<span class="cw-contest-sub">Добавьте свою карточку в ленту и участвуйте</span>' +
            '<i class="cw-contest-st s1"></i><i class="cw-contest-st s2"></i><i class="cw-contest-st s3"></i>';
        tabs.parentNode.insertBefore(ban, tabs);
        const card = ban.querySelector('.cw-contest-card'), pic = ban.querySelector('.cw-contest-pic');
        // лёгкий наклон за пальцем/курсором
        ban.addEventListener('pointermove', e => {
            const r = ban.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
            card.style.setProperty('--ry', (-14 + px * 22) + 'deg'); card.style.setProperty('--rx', (8 - py * 16) + 'deg');
        });
        ban.addEventListener('pointerleave', () => { card.style.removeProperty('--ry'); card.style.removeProperty('--rx'); });
        // случайная карточка из ленты (только со скриншотом); пока грузится — фирменный синий фон
        pic.style.background = 'linear-gradient(135deg,#3AB0F8,#1488E1)';
        try {
            fetch(((window.CONFIG && CONFIG.SERVER_BASE_URL) || '') + '/api/Card/Feed?sort=new&skip=0', { headers: { 'Authorization': NFTAuth.getApiAuthHeader() } })
                .then(r => r.ok ? r.json() : null).then(d => {
                    const ok = ((d && d.items) || []).filter(it => it.imageUrl && it.imageOk !== false);
                    if (!ok.length) return;
                    const it = ok[Math.floor(Math.random() * ok.length)];
                    const im = new Image(); im.alt = ''; im.draggable = false;
                    im.onload = () => { pic.style.background = 'none'; pic.innerHTML = ''; pic.appendChild(im); card.classList.add('on'); };
                    im.src = it.imageUrl;
                }).catch(() => { });
        } catch (e) { }
    }
    window.cdPaintMini = function (c0, c1) {
        document.querySelectorAll('.cw-mini-card').forEach(m => paintMiniCard(m, c0, c1));
        try { localStorage.setItem('cd_mini', JSON.stringify({ c0: c0, c1: c1 })); } catch (e) { }
    };
    function applyAdminNav() {
        try {
            const tabs = document.querySelector('.cw-tabs');
            if (!tabs || tabs.dataset.cdAdmin || !isCardAdmin()) return false;
            const card = tabs.querySelector('[data-tab="card"]'), home = tabs.querySelector('[data-tab="home"]');
            if (!card || !home) return false;
            tabs.dataset.cdAdmin = '1';
            // Главный экран (там «Главная» — кнопка, а не ссылка): над кнопками плашка конкурса, ведёт в ленту карточек. Пока только администратору.
            if (home.tagName === 'BUTTON' && !(tabs.previousElementSibling && tabs.previousElementSibling.classList.contains('cw-contest'))) buildContest(tabs);
            // вместо значка — мини-карточка: цвета берём из кэша, свежие подтягиваем с сервера
            const mini = document.createElement('span');
            mini.className = 'cw-mini-card';
            mini.style.cssText = 'position:relative;overflow:hidden;width:46px;height:28px;border-radius:7px;flex:0 0 auto;box-shadow:0 0 0 1px rgba(255,255,255,.22),0 3px 8px rgba(0,0,0,.4)';
            mini.innerHTML = '<span style="position:absolute;inset:0;background:radial-gradient(120% 90% at 85% 0%,rgba(255,255,255,.38),transparent 60%)"></span>' +
                '<span style="position:absolute;right:5px;top:5px;width:9px;height:7px;border-radius:2px;background:rgba(255,255,255,.75)"></span>' +
                '<span style="position:absolute;left:5px;bottom:9px;width:16px;height:3px;border-radius:2px;background:rgba(255,255,255,.85)"></span>' +
                '<span style="position:absolute;left:5px;bottom:4px;width:10px;height:2px;border-radius:2px;background:rgba(255,255,255,.55)"></span>';
            let c0 = '#3AB0F8', c1 = '#1488E1';
            try { const k = JSON.parse(localStorage.getItem('cd_mini') || 'null'); if (k && k.c0 && k.c1) { c0 = k.c0; c1 = k.c1; } } catch (e) { }
            paintMiniCard(mini, c0, c1);
            try { const sh = localStorage.getItem('cd_mini_shot'); if (sh) paintMiniShot(mini, sh); } catch (e) { }
            const icon = card.querySelector('svg'); if (icon) icon.replaceWith(mini); else card.insertBefore(mini, card.firstChild);
            try {
                fetch(((window.CONFIG && CONFIG.SERVER_BASE_URL) || '') + '/api/Card/Get?kind=catalog', { headers: { 'Authorization': NFTAuth.getApiAuthHeader() } })
                    .then(r => r.ok ? r.json() : null).then(d => {
                        if (!d) return;
                        const n0 = d.bg && d.bg.c0 || '#3AB0F8', n1 = d.bg && d.bg.c1 || '#1488E1';
                        paintMiniCard(mini, n0, n1);
                        try { localStorage.setItem('cd_mini', JSON.stringify({ c0: n0, c1: n1 })); } catch (e) { }
                        if (d.imageUrl) { paintMiniShot(mini, d.imageUrl); try { localStorage.setItem('cd_mini_shot', d.imageUrl); } catch (e) { } }
                    }).catch(() => { });
            } catch (e) { }
            if (inCard) {
                // в разделе: Главная, Лента, Карточка — остальное убираем
                tabs.querySelectorAll('.cw-tab').forEach(t => { if (t !== home && t !== card) t.remove(); });
                const feed = document.createElement('a');
                feed.className = 'cw-tab' + (location.pathname.indexOf('feed.html') !== -1 ? ' active' : '');
                feed.setAttribute('data-tab', 'feed');
                feed.href = new URL('Card/feed.html', SELF_SRC).href;
                feed.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3"/></svg><span>Лента</span>';
                tabs.append(home, feed, card);
                tabs.classList.add('cd-three');
                home.classList.remove('active');
            } else {
                // на остальных страницах Карточка и Главная меняются местами
                const ph = document.createComment(''); home.replaceWith(ph); card.replaceWith(home); ph.replaceWith(card);
            }
            return true;
        } catch (e) { return false; }
    }

    // putya: "ну и где тут флажки?" (из прежнего гейта) — раскрытие было жёстко завязано на два ID
    // (#cw-admin-nav/#cw-admin-tabs), поэтому любой НОВЫЙ блок с классом cw-admin-nav-hidden
    // (например #tf-mode-switcher-container на Тематиках) никогда не открывался. Общий селектор
    // снимает cw-admin-nav-hidden со всех таких блоков сразу для всех посетителей — но #cw-admin-tabs
    // лежит ВНУТРИ main-container, на карточке, которая идёт ПОСЛЕ этого <script>-тега в документе,
    // поэтому ждём DOMContentLoaded (раньше эту же паузу обеспечивала задержка сетевого фетча).
    function revealAndMerge() {
        document.querySelectorAll('.cw-admin-nav-hidden').forEach(el => el.classList.remove('cw-admin-nav-hidden'));
        mergeTopBarIntoHeader();
        addCardTab();
        if (!applyAdminNav()) { window.addEventListener('load', () => setTimeout(applyAdminNav, 800)); }
        updateGithubPlacement();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', revealAndMerge);
    } else {
        revealAndMerge();
    }
})();
