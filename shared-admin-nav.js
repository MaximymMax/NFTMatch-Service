// putya: "сделай доступным всем весь функционал" — раньше новая шапка/вкладки на страницах, где их
// изначально не было (Монохромы/Тематики/Похожие), были скрыты по умолчанию (.cw-admin-nav-hidden)
// и раскрывались только по IP-гейту владельца через фейковый фетч на ColorWheel-эндпоинт. Гейт убран
// — теперь снимаем cw-admin-nav-hidden сразу для всех посетителей.
(function () {
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
        if (!headerGh || !cardGh || !header) return;

        headerGh.style.display = ''; // временно показываем, чтобы измерить её реальную ширину
        const leftGroup = header.children[0];
        const rightGroup = header.children[1];
        const gap = parseFloat(getComputedStyle(header).gap) || 0;
        const padding = parseFloat(getComputedStyle(header).paddingLeft) + parseFloat(getComputedStyle(header).paddingRight);
        const needed = leftGroup.scrollWidth + rightGroup.scrollWidth + gap + padding;
        const fits = needed <= header.clientWidth;

        headerGh.style.display = fits ? '' : 'none';
        cardGh.style.display = fits ? 'none' : '';
    }

    let ghResizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(ghResizeTimer);
        ghResizeTimer = setTimeout(updateGithubPlacement, 150);
    });

    // putya: "ну и где тут флажки?" (из прежнего гейта) — раскрытие было жёстко завязано на два ID
    // (#cw-admin-nav/#cw-admin-tabs), поэтому любой НОВЫЙ блок с классом cw-admin-nav-hidden
    // (например #tf-mode-switcher-container на Тематиках) никогда не открывался. Общий селектор
    // снимает cw-admin-nav-hidden со всех таких блоков сразу для всех посетителей — но #cw-admin-tabs
    // лежит ВНУТРИ main-container, на карточке, которая идёт ПОСЛЕ этого <script>-тега в документе,
    // поэтому ждём DOMContentLoaded (раньше эту же паузу обеспечивала задержка сетевого фетча).
    function revealAndMerge() {
        document.querySelectorAll('.cw-admin-nav-hidden').forEach(el => el.classList.remove('cw-admin-nav-hidden'));
        mergeTopBarIntoHeader();
        updateGithubPlacement();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', revealAndMerge);
    } else {
        revealAndMerge();
    }
})();
