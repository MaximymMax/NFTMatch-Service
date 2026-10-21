// Страница «Карточка»: гейт по входу и iframe с редактором (editor.html — карточка и перетаскивание из примера).
(function () {
    // ---- ссылка на чужую карточку (?c=<id>): она открывается поверх страницы на весь экран, фон размыт
    const viewId = new URLSearchParams(location.search).get('c');
    let viewFrame = null, tg = null;
    try { tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.initData ? Telegram.WebApp : null; } catch (e) { /* ignore */ }
    function fitView() {
        if (!viewFrame) return;
        const W = window.innerWidth, H = window.innerHeight;
        if (H > W) {   // портрет и ориентацию заблокировать не удалось: поворачиваем сами
            viewFrame.classList.add('cd-rot');
            viewFrame.style.width = H + 'px'; viewFrame.style.height = W + 'px'; viewFrame.style.transform = 'translateX(' + W + 'px) rotate(90deg)';
        } else {
            viewFrame.classList.remove('cd-rot');
            viewFrame.style.width = ''; viewFrame.style.height = ''; viewFrame.style.transform = '';
        }
    }
    function closeView() {
        if (!viewFrame) return;
        viewFrame.remove(); viewFrame = null;
        document.body.classList.remove('cd-noscroll');
        window.removeEventListener('resize', fitView);
        try { if (tg) { tg.unlockOrientation && tg.unlockOrientation(); tg.exitFullscreen && tg.exitFullscreen(); } } catch (e) { /* ignore */ }
        try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ }
    }
    function openView(id) {
        viewFrame = document.createElement('iframe');
        viewFrame.className = 'cd-frame cd-fs cd-viewer'; viewFrame.title = 'Карточка';
        viewFrame.src = './editor.html?c=' + encodeURIComponent(id) + '&embed=1';
        document.body.appendChild(viewFrame); document.body.classList.add('cd-noscroll');
        try { if (tg) { tg.requestFullscreen && tg.requestFullscreen(); tg.lockOrientation && tg.lockOrientation(); } } catch (e) { /* ignore */ }
        window.addEventListener('resize', fitView); fitView(); setTimeout(fitView, 400);
        window.addEventListener('message', (e) => { if (viewFrame && e.source === viewFrame.contentWindow && e.data && e.data.cdCloseView) closeView(); });
    }
    if (viewId && /^[0-9a-z]{6,32}$/i.test(viewId)) openView(viewId);

    const frame = document.getElementById('cd-frame'), gate = document.getElementById('cd-gate');
    if (!window.NFTAuth || !NFTAuth.isAuthenticated()) { gate.hidden = false; return; }
    frame.hidden = false;
    frame.src = './editor.html?v=18';
    // высоту iframe выставляем по содержимому редактора (он сообщает её сам)
    window.addEventListener('message', (e) => {
        if (e.source !== frame.contentWindow || !e.data || typeof e.data.cdHeight !== 'number' || frame.classList.contains('cd-fs')) return;
        frame.style.height = Math.max(360, e.data.cdHeight) + 'px';
    });
})();
