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
