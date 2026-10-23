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
    let sort = 'top', skip = 0, busy = false;

    function row(it) {
        const el = document.createElement('div'); el.className = 'fd-item';
        const name = it.username ? '@' + it.username : (it.holder || 'Коллекционер');
        const pic = new Image(); pic.className = 'fd-pic'; pic.loading = 'lazy'; pic.alt = ''; pic.src = it.imageUrl;
        pic.onclick = () => { location.href = './card.html?c=' + encodeURIComponent(it.id); };   // карточка открывается на весь экран
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
        if (it.mine) like.disabled = true;
        let busyLike = false;
        like.onclick = async () => {
            if (busyLike || it.mine) return; busyLike = true;
            const want = !like.classList.contains('on');
            like.classList.toggle('on', want); n += want ? 1 : -1; paint();
            try {
                const r = await fetch(api('Card/Like?c=' + encodeURIComponent(it.id) + '&like=' + want), { method: 'POST', headers: { 'Authorization': auth() } });
                if (!r.ok) throw new Error(r.status);
            } catch (e) { like.classList.toggle('on', !want); n += want ? -1 : 1; paint(); }
            busyLike = false;
        };
        info.append(ava, who, like);
        el.append(pic, info);
        return el;
    }

    async function load(reset) {
        if (busy) return; busy = true;
        if (reset) { skip = 0; list.innerHTML = ''; }
        msg.textContent = 'Загружаю…';
        try {
            let d, last;
            for (let i = 0; i < 3 && !d; i++) {
                try {
                    const r = await fetch(api('Card/Feed?sort=' + sort + '&skip=' + skip), { headers: { 'Authorization': auth() } });
                    if (r.status === 403) { location.replace('./card.html'); return; }
                    if (!r.ok) throw new Error(r.status);
                    d = await r.json();
                } catch (e) { last = e; await new Promise(res => setTimeout(res, 600 * (i + 1))); }
            }
            if (!d) throw last;
            d.items.forEach(it => list.appendChild(row(it)));
            skip += d.items.length; more.hidden = !d.hasMore;
            msg.textContent = list.children.length ? '' : 'Пока нет опубликованных карточек';
        } catch (e) { msg.textContent = 'Не удалось загрузить ленту'; }
        busy = false;
    }

    document.querySelectorAll('#fd-sort button').forEach(b => b.onclick = () => {
        document.querySelectorAll('#fd-sort button').forEach(x => x.classList.toggle('on', x === b));
        sort = b.dataset.s; load(true);
    });
    more.onclick = () => load(false);
    load(true);
})();
