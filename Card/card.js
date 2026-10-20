// Страница «Карточка»: гейт по входу и iframe с редактором (editor.html — карточка и перетаскивание из примера).
(function () {
    const frame = document.getElementById('cd-frame'), gate = document.getElementById('cd-gate');
    if (!window.NFTAuth || !NFTAuth.isAuthenticated()) { gate.hidden = false; return; }
    frame.hidden = false;
    frame.src = './editor.html?v=10';
    // высоту iframe выставляем по содержимому редактора (он сообщает её сам)
    window.addEventListener('message', (e) => {
        if (e.source !== frame.contentWindow || !e.data || typeof e.data.cdHeight !== 'number' || frame.classList.contains('cd-fs')) return;
        frame.style.height = Math.max(360, e.data.cdHeight) + 'px';
    });
})();
