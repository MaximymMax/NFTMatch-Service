// putya: "все страницы (пока только для меня) были адаптированы под главную страницу" — на
// страницах, где эта панель НЕ была изначально (Монохромы/Тематики/Похожие), она добавлена поверх
// обычного публичного дизайна и по умолчанию скрыта (см. .cw-admin-nav-hidden в
// shared-admin-nav.css), чтобы обычные посетители ничего не заметили. Раскрываем только если IP
// проходит существующий гейт ColorWheel-эндпоинтов (тот же, что у самого /ColorWheel/) — отдельный
// бэкенд для этой проверки не заводим, переиспользуем уже готовую.
(function () {
    const root = document.getElementById('cw-admin-nav');
    if (!root) return;
    const base = (window.CONFIG && window.CONFIG.SERVER_BASE_URL || 'https://nftmatch.pro') + '/api/MonoCoof';
    fetch(`${base}/GetGlobalColorWheelCollections`)
        .then(resp => { if (resp.ok) root.classList.remove('cw-admin-nav-hidden'); })
        .catch(() => {});
})();

// putya: "единая шапка для всех страниц... кнопки переключения языка, регистрации через тг, апи,
// гитхаб" — RU/EN (i18n.js) и TG-логин/профиль (auth-badge.js) уже существуют на каждой странице,
// но живут в СВОЁМ отдельном #nft-top-bar (position:fixed, поверх страницы), а не в .cw-page-header.
// Вместо переписывания их логики просто переносим уже готовые узлы (со всеми обработчиками) внутрь
// .cw-page-header — #tg-auth-badge даже содержит собственные стили специально под "жизнь внутри
// бара" (position:static!important), т.е. код уже расчитан на переезд. auth-badge.js навешивает
// свой обработчик на DOMContentLoaded ПОСЛЕ i18n.js (порядок тегов <script> в <head>), поэтому наш
// обработчик регистрируем последним (наш <script> идёт позже в документе), чтобы оба узла уже
// существовали к моменту переноса.
document.addEventListener('DOMContentLoaded', () => {
    const topBar = document.getElementById('nft-top-bar');
    const header = document.querySelector('.cw-page-header');
    if (!topBar || !header) return;

    const leftGroup = header.children[0];
    const rightGroup = header.children[1];
    const langSwitcher = document.getElementById('lang-switcher-container');
    const authBadge = document.getElementById('tg-auth-badge');

    if (langSwitcher && leftGroup) leftGroup.insertBefore(langSwitcher, leftGroup.firstChild);
    if (authBadge && rightGroup) rightGroup.appendChild(authBadge);
});
