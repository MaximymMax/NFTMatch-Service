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
    const F = { sort: 'top', tag: 'all' };
    const totalEl = document.getElementById('fd-total');
    let skip = 0, busy = false, reqId = 0;

    const modelImg = (g, m) => 'https://cdn.changes.tg/gifts/models/' + encodeURIComponent(g) + '/png/' + encodeURIComponent(m) + '.png';
    // CDN иногда не отдаёт картинку с первого раза: повторяем с обходом кэша (до двух раз)
    function retryImg(im, url) {
        let n = 0;
        im.onerror = () => { if (n < 2) { n++; setTimeout(() => { im.src = url + '?r=' + n; }, 700 * n); } else im.onerror = null; };
        im.src = url;
    }
    const fmtTon = v => (Math.round(v * 100) / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
    function tagsOf(it) {
        const box = document.createElement('div'); box.className = 'fd-tags';
        const add = (cls, text, title) => { const t = document.createElement('span'); t.className = 'fd-t ' + cls; t.textContent = text; if (title) t.title = title; box.appendChild(t); };
        if (it.onlyProfile) add('prof', 'Из профиля', 'Все подарки на карточке — из профиля человека');
        if (it.price > 0) {
            add('price', (it.unpriced > 0 ? 'от ' : '') + fmtTon(it.price) + ' TON',
                'Сумма флоров моделей на карточке' + (it.unpriced > 0 ? ' (у ' + it.unpriced + ' без цены)' : ''));
        }
        else if (it.unpriced > 0) add('price none', 'нет цен', 'Ни у одной модели на карточке нет флора');
        return box;
    }
    const nameOf = it => it.username ? '@' + it.username : (it.holder || 'Коллекционер');

    /* Просмотр карточки: размытая лента на заднем плане, карточка по центру, снизу использованные модели; стрелка возвращает в ленту */
    const VER = (() => { try { return new URL(document.querySelector('link[href*="card.css"]').href).searchParams.get('v') || String(Date.now()); } catch (e) { return String(Date.now()); } })();
    // В списке — только настоящий скриншот карточки (1600×1000, карточка 1400 в центре: показываем её). Пока скрина нет — плитка ожидания.
    function shotCard(it, onFail) {
        const tile = document.createElement('div'); tile.className = 'fd-pic fd-tile';
        const box = document.createElement('div'); box.className = 'fd-flat fd-shot';
        const im = new Image(); im.alt = ''; im.loading = 'lazy'; im.draggable = false; im.src = it.imageUrl;
        im.onerror = () => { const w = waitCard(); w.onclick = tile.onclick; tile.replaceWith(w); if (onFail) onFail(w); };
        box.appendChild(im); tile.appendChild(box);
        return tile;
    }
    function waitCard() {
        const tile = document.createElement('div'); tile.className = 'fd-pic fd-tile';
        const box = document.createElement('div'); box.className = 'fd-flat fd-wait';
        tile.appendChild(box);
        return tile;
    }

    /* Нет скриншота актуальной карточки: карточка рисуется из данных, а в скрытом окне редактора сразу рендерится JPEG и уходит на сервер — после этого плитка подменяется скрином */
    const sigOf = it => (it.stickers || []).map(s => s.gift + '|' + s.model + '|' + (s.uid || '')).join(';');
    const shotQueue = []; let shotBusy = false;
    function renderShot(it) {
        return new Promise(resolve => {
            const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-9999px;top:0;width:720px;height:480px;border:0;visibility:hidden';
            fr.src = './editor.html?feed=1&embed=1&v=' + VER;
            const id = it.owner + ':' + Date.now();
            let done = false;
            const fin = blob => { if (done) return; done = true; clearTimeout(tm); window.removeEventListener('message', onMsg); fr.remove(); resolve(blob); };
            const onMsg = e => {
                if (e.source !== fr.contentWindow || !e.data) return;
                if (e.data.cdFeedReady) fr.contentWindow.postMessage({ cdFeedCard: { holder: it.holder, bg: it.bg, stickers: it.stickers }, shot: id }, '*');
                else if (e.data.cdFeedShot === id) fin(e.data.blob || null);
            };
            const tm = setTimeout(() => fin(null), 40000);
            window.addEventListener('message', onMsg);
            document.body.appendChild(fr);
        });
    }
    async function runShots() {
        if (shotBusy) return; shotBusy = true;
        while (shotQueue.length) {
            const { it, apply } = shotQueue.shift();
            try {
                const blob = await renderShot(it);
                if (!blob) { console.warn('[feed] скрин не нарисован', it.owner); continue; }
                const [owner, kind] = it.owner.split(':');
                const r = await fetch(api('Card/ImageFor?owner=' + owner + '&kind=' + kind + '&sig=' + encodeURIComponent(sigOf(it))), { method: 'POST', headers: { 'Authorization': auth(), 'Content-Type': 'image/jpeg' }, body: blob });
                if (!r.ok) { console.warn('[feed] сервер не принял скрин', it.owner, r.status); continue; }
                const d = await r.json();
                if (d.url) apply(d.url);
            } catch (e) { /* не критично: карточка остаётся нарисованной из данных */ }
        }
        shotBusy = false;
    }

    let lockUntil = 0;           // после закрытия ещё ~0,5 с не открываем карточки: «хвост» того же нажатия не должен попасть в плитку под оверлеем
    function openOverlay(it) {
        if (document.querySelector('.fd-ov') || Date.now() < lockUntil) return;          // пока открыта одна карточка, другие не открываем
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
            const im = new Image(); im.alt = m.model; im.loading = 'lazy'; retryImg(im, modelImg(m.gift, m.model));
            const cap = document.createElement('small'); cap.textContent = m.model;
            c.append(im, cap);
            if (m.count > 1) { const k = document.createElement('i'); k.textContent = '×' + m.count; c.appendChild(k); }
            ms.appendChild(c);
        });
        body.append(pic, who, tagsOf(it), ms);
        ov.append(back, body);
        const close = () => { lockUntil = Date.now() + 500; ov.remove(); list.style.pointerEvents = ''; more.style.pointerEvents = ''; document.body.classList.remove('fd-lock'); document.removeEventListener('keydown', onKey); window.removeEventListener('message', onMsg); window.removeEventListener('resize', fit); };
        const onKey = e => { if (e.key === 'Escape') close(); };
        back.onclick = close;
        // закрываем по click, а не по pointerdown: иначе оверлей исчезает до отпускания пальца и click прилетает в плитку под ним
        ov.addEventListener('click', e => { if (e.target === ov) { e.preventDefault(); e.stopPropagation(); close(); } });
        document.addEventListener('keydown', onKey);
        document.body.classList.add('fd-lock');
        list.style.pointerEvents = 'none'; more.style.pointerEvents = 'none';          // пока открыта карточка, ленту под ней не трогаем
        document.body.appendChild(ov);
        fit();
    }

    function row(it) {
        const el = document.createElement('div'); el.className = 'fd-item';
        const name = nameOf(it);
        const have = it.imageUrl && it.imageOk !== false;
        let pic;
        // нет актуального скрина: плитка ожидания, а в скрытом окне редактора карточка рисуется, уходит на сервер и подменяет плитку
        const request = () => {
            if (!(it.stickers && it.stickers.length)) return;
            shotQueue.push({ it, apply: url => { it.imageUrl = url; it.imageOk = true; const np = shotCard(it); np.onclick = () => openOverlay(it); pic.replaceWith(np); pic = np; } });
            runShots();
        };
        pic = have ? shotCard(it, w => { pic = w; request(); }) : waitCard();
        pic.onclick = () => openOverlay(it);
        if (!have) request();
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
        el.append(pic, tagsOf(it), info);
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
                    const r = await fetch(api('Card/Feed?sort=' + F.sort + '&tag=' + F.tag + '&skip=' + skip), { headers: { 'Authorization': auth() } });
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

    // своё окно выбора сортировки вместо системного select
    const dd = document.getElementById('fd-dd'), ddBtn = dd.querySelector('.fd-dd-btn'), ddMenu = dd.querySelector('.fd-dd-menu'), ddCur = document.getElementById('fd-dd-cur');
    const ddClose = () => { ddMenu.hidden = true; dd.classList.remove('open'); ddBtn.setAttribute('aria-expanded', 'false'); };
    ddBtn.onclick = () => { const open = ddMenu.hidden; ddMenu.hidden = !open; dd.classList.toggle('open', open); ddBtn.setAttribute('aria-expanded', String(open)); };
    ddMenu.querySelectorAll('button').forEach(b => b.onclick = () => {
        ddMenu.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        ddCur.textContent = b.textContent; ddClose();
        if (F.sort !== b.dataset.v) { F.sort = b.dataset.v; load(true); }
    });
    document.addEventListener('click', e => { if (!dd.contains(e.target)) ddClose(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') ddClose(); });
    document.querySelectorAll('.fd-seg').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => {
        g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        F[g.dataset.f] = b.dataset.v; load(true);
    }));
    more.onclick = () => load(false);
    load(true);
})();
