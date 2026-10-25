// Страница «Лента»: опубликованные карточки других людей. Пока открыта только администратору (сервер тоже отвечает остальным 403).
(function () {
    const ADMIN_TG_ID = 7343414766;
    const list = document.getElementById('fd-list'), msg = document.getElementById('fd-msg'), more = document.getElementById('fd-more');
    const api = p => ((window.CONFIG && CONFIG.SERVER_BASE_URL) || '') + '/api/' + p;
    const auth = () => { try { return NFTAuth.getApiAuthHeader(); } catch (e) { return 'Tma invalid'; } };
    let user = null;
    try { user = window.NFTAuth && NFTAuth.isAuthenticated() ? NFTAuth.getUser() : null; } catch (e) { /* ignore */ }
    if (!user || Number(user.telegramId || user.id) !== ADMIN_TG_ID) { location.replace('./card.html'); return; }

    const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.4 5c2 0 3.7 1.1 5.6 3.2C13.9 6.1 15.6 5 17.6 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" stroke-linejoin="round"/></svg>';
    const gifts = n => n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'гифт' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'гифта' : 'гифтов');
    const F = { sort: 'top', pub: 'all', kind: 'all', q: '' };
    const totalEl = document.getElementById('fd-total');
    let skip = 0, busy = false, reqId = 0;

    const modelImg = (g, m) => 'https://cdn.changes.tg/gifts/models/' + encodeURIComponent(g) + '/png/' + encodeURIComponent(m) + '.png';
    const nameOf = it => it.username ? '@' + it.username : (it.holder || 'Коллекционер');

    /* Просмотр карточки: размытая лента на заднем плане, карточка по центру, снизу использованные модели; стрелка возвращает в ленту */
    const VER = (() => { try { return new URL(document.querySelector('link[href*="card.css"]').href).searchParams.get('v') || String(Date.now()); } catch (e) { return String(Date.now()); } })();
    // карточка в списке рисуется из данных (фон и стикеры), а не из картинки: картинка могла отстать от карточки
    // Серверная картинка — карточка на фоне (1600×1000, карточка 1400 в центре): показываем только саму карточку
    function shotCard(it) {
        const tile = document.createElement('div'); tile.className = 'fd-pic fd-tile';
        const box = document.createElement('div'); box.className = 'fd-flat fd-shot';
        const im = new Image(); im.alt = ''; im.loading = 'lazy'; im.draggable = false; im.src = it.imageUrl;
        im.onerror = () => { tile.replaceWith(flatCard(it, true)); };
        box.appendChild(im); tile.appendChild(box);
        return tile;
    }
    function flatCard(it, replaced) {
        const tile = document.createElement('div'); tile.className = 'fd-pic fd-tile';
        if (replaced) tile.onclick = () => openOverlay(it);
        const box = document.createElement('div'); box.className = 'fd-flat';
        const c0 = (it.bg && it.bg.c0) || '#3AB0F8', c1 = (it.bg && it.bg.c1) || '#1488E1';
        box.style.background = 'linear-gradient(135deg,' + c0 + ',' + c1 + ')';
        (it.stickers || []).forEach(s => {
            const im = new Image(); im.className = 'fd-st'; im.alt = ''; im.loading = 'lazy'; im.draggable = false; im.src = modelImg(s.gift, s.model);
            const w = (s.sc || 1) * 23.1;
            im.style.cssText = 'left:' + (s.x * 100) + '%;top:' + (s.y * 100) + '%;width:' + w + '%;transform:translate(-50%,-50%) rotate(' + (s.r || 0) + 'deg)';
            box.appendChild(im);
        });
        const txt = document.createElement('div'); txt.className = 'fd-txt';
        txt.innerHTML = '<b class="fd-bal">◆ 10 GRAM</b><span class="fd-chip"></span><span class="fd-hold"></span>';
        txt.querySelector('.fd-hold').textContent = it.holder || '';
        box.appendChild(txt);
        tile.appendChild(box);
        return tile;
    }

    function openOverlay(it) {
        if (document.querySelector('.fd-ov')) return;          // пока открыта одна карточка, другие не открываем
        const ov = document.createElement('div'); ov.className = 'fd-ov';
        const back = document.createElement('button'); back.type = 'button'; back.className = 'fd-back'; back.setAttribute('aria-label', 'Назад к ленте');
        back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
        const body = document.createElement('div'); body.className = 'fd-ovbody';
        // живая 3D-карточка из редактора (режим ленты): данные присылаем сообщением, когда он готов
        const pic = document.createElement('iframe'); pic.className = 'fd-ovpic'; pic.title = 'Карточка';
        pic.src = './editor.html?feed=1&embed=1&v=' + VER;
        const fit = () => { const w = Math.min(ov.clientWidth - 32, 620); pic.style.height = Math.round((w - 24) / 1.648 + 48) + 'px'; };
        const onMsg = e => { if (e.source === pic.contentWindow && e.data && e.data.cdFeedReady) pic.contentWindow.postMessage({ cdFeedCard: { holder: it.holder, bg: it.bg, stickers: it.stickers } }, '*'); };
        window.addEventListener('message', onMsg); window.addEventListener('resize', fit);
        const who = document.createElement('div'); who.className = 'fd-ovwho';
        who.textContent = nameOf(it) + ' · ' + gifts(it.gifts) + (it.public ? '' : ' · не опубликована');
        const ms = document.createElement('div'); ms.className = 'fd-models';
        (it.models || []).forEach(m => {
            const c = document.createElement('div'); c.className = 'fd-m';
            const im = new Image(); im.alt = m.model; im.loading = 'lazy'; im.src = modelImg(m.gift, m.model);
            const cap = document.createElement('small'); cap.textContent = m.model;
            c.append(im, cap);
            if (m.count > 1) { const k = document.createElement('i'); k.textContent = '×' + m.count; c.appendChild(k); }
            ms.appendChild(c);
        });
        body.append(pic, who, ms);
        ov.append(back, body);
        const close = () => { ov.remove(); document.body.classList.remove('fd-lock'); document.removeEventListener('keydown', onKey); window.removeEventListener('message', onMsg); window.removeEventListener('resize', fit); };
        const onKey = e => { if (e.key === 'Escape') close(); };
        back.onclick = close;
        ov.addEventListener('pointerdown', e => { if (e.target === ov) close(); });
        document.addEventListener('keydown', onKey);
        document.body.classList.add('fd-lock');
        document.body.appendChild(ov);
        fit();
    }

    function row(it) {
        const el = document.createElement('div'); el.className = 'fd-item';
        const name = nameOf(it);
        const pic = (it.imageUrl && it.imageOk !== false) ? shotCard(it) : flatCard(it);
        pic.onclick = () => openOverlay(it);
        const info = document.createElement('div'); info.className = 'fd-info';
        const ava = document.createElement('div'); ava.className = 'fd-ava'; ava.textContent = (name.replace('@', '')[0] || '?').toUpperCase();
        if (it.username) {          // аватарка из Telegram; нет фото — остаётся буква
            const im = new Image(); im.className = 'fd-ava';
            im.onload = () => ava.replaceWith(im);
            im.src = 'https://t.me/i/userpic/160/' + encodeURIComponent(it.username) + '.jpg';
        }
        const who = document.createElement('div'); who.className = 'fd-who';
        who.innerHTML = '<b></b><small></small>';
        who.querySelector('b').textContent = name; who.querySelector('small').textContent = gifts(it.gifts);
        const like = document.createElement('button'); like.type = 'button'; like.className = 'fd-like' + (it.liked ? ' on' : '');
        let n = it.likes;
        const paint = () => { like.innerHTML = HEART + '<span>' + n + '</span>'; };
        paint();
        const canLike = it.public && it.id && !it.mine;          // лайкать можно только опубликованные чужие карточки
        if (!canLike) like.disabled = true;
        let busyLike = false;
        like.onclick = async () => {
            if (busyLike || !canLike) return; busyLike = true;
            const want = !like.classList.contains('on');
            like.classList.toggle('on', want); n += want ? 1 : -1; paint();
            try {
                const r = await fetch(api('Card/Like?c=' + encodeURIComponent(it.id) + '&like=' + want), { method: 'POST', headers: { 'Authorization': auth() } });
                if (!r.ok) throw new Error(r.status);
            } catch (e) { like.classList.toggle('on', !want); n += want ? -1 : 1; paint(); }
            busyLike = false;
        };
        info.append(ava, who, like);
        if (!it.public) { const tag = document.createElement('span'); tag.className = 'fd-tag'; tag.textContent = 'Не опубликована'; el.appendChild(tag); }
        el.append(pic, info);
        return el;
    }

    async function load(reset) {
        const my = ++reqId;
        if (busy && !reset) return; busy = true;
        if (reset) { skip = 0; list.innerHTML = ''; }
        msg.textContent = 'Загружаю…';
        try {
            let d, last;
            for (let i = 0; i < 3 && !d; i++) {
                try {
                    const r = await fetch(api('Card/Feed?sort=' + F.sort + '&pub=' + F.pub + '&kind=' + F.kind + '&q=' + encodeURIComponent(F.q) + '&skip=' + skip), { headers: { 'Authorization': auth() } });
                    if (r.status === 403) { location.replace('./card.html'); return; }
                    if (!r.ok) throw new Error(r.status);
                    d = await r.json();
                } catch (e) { last = e; await new Promise(res => setTimeout(res, 600 * (i + 1))); }
            }
            if (!d) throw last;
            if (my !== reqId) { busy = false; return; }          // за это время фильтр сменили — ответ устарел
            d.items.forEach(it => list.appendChild(row(it)));
            totalEl.textContent = 'Найдено: ' + d.total;
            skip += d.items.length; more.hidden = !d.hasMore;
            msg.textContent = list.children.length ? '' : 'Пока нет опубликованных карточек';
        } catch (e) { msg.textContent = 'Не удалось загрузить ленту'; }
        busy = false;
    }

    document.getElementById('fd-sortsel').onchange = e => { F.sort = e.target.value; load(true); };
    document.querySelectorAll('.fd-seg').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => {
        g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        F[g.dataset.f] = b.dataset.v; load(true);
    }));
    let qTimer = null;
    document.getElementById('fd-q').oninput = e => { clearTimeout(qTimer); qTimer = setTimeout(() => { F.q = e.target.value.trim(); load(true); }, 350); };
    more.onclick = () => load(false);
    load(true);
})();
