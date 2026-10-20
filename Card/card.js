// Конструктор карточки из подарков. Карточка хранится на бэкенде (Card/Get, Card/Save),
// привязана к Telegram-аккаунту; поиск моделей — Card/SearchModels.
(function () {
    const MAX_STICKERS = 10;
    const BASE = 0.23;            // размер стикера при масштабе 1 — доля ширины карточки
    const SC_MIN = 0.4, SC_MAX = 3;
    const PAGE = 40;
    const SAVE_DELAY = 600;

    const $ = (id) => document.getElementById(id);
    const cardEl = $('cd-card'), layer = $('cd-layer');
    const api = (p) => `${(window.CONFIG && CONFIG.SERVER_BASE_URL) || ''}/api/${p}`;
    const authHeader = () => (window.NFTAuth ? NFTAuth.getApiAuthHeader() : 'Tma invalid');
    const imgUrl = (g, m) => `https://cdn.changes.tg/gifts/models/${encodeURIComponent(g)}/png/${encodeURIComponent(m)}.png`;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    let stickers = [];            // порядок = z-order (последний сверху)
    let selId = null;
    let nextId = 1;
    let loaded = false, dirty = false, saving = false, saveTimer = null;
    const els = new Map();

    // ---------- вспомогательное ----------
    let toastT;
    function toast(msg) {
        const t = $('cd-toast'); t.textContent = msg; t.classList.add('show');
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
    }
    function setStatus(text, err) { const s = $('cd-status'); s.textContent = text; s.classList.toggle('err', !!err); }
    const cardRect = () => cardEl.getBoundingClientRect();

    // ---------- отрисовка ----------
    function place(st) {
        const el = els.get(st.id); if (!el) return;
        const r = cardRect(), S = r.width * BASE * st.sc;
        el.style.width = el.style.height = S + 'px';
        el.style.transform = `translate(${st.x * r.width - S / 2}px, ${st.y * r.height - S / 2}px) rotate(${st.r}deg)`;
    }
    function makeEl(st) {
        const el = document.createElement('div');
        el.className = 'cd-st';
        el.innerHTML = '<img alt="" draggable="false"><div class="cd-knob" title="Повернуть и изменить размер">↻</div>';
        const img = el.firstChild;
        img.src = imgUrl(st.gift, st.model);
        img.alt = st.model;
        el.addEventListener('pointerdown', (e) => onDown(e, st));
        el.querySelector('.cd-knob').addEventListener('pointerdown', (e) => onKnobDown(e, st));
        layer.appendChild(el);
        els.set(st.id, el);
    }
    function render() {
        els.forEach((el, id) => { if (!stickers.some(s => s.id === id)) { el.remove(); els.delete(id); } });
        stickers.forEach(st => { if (!els.has(st.id)) makeEl(st); });
        stickers.forEach((st, i) => {      // z-order = порядок в массиве
            const el = els.get(st.id);
            el.style.zIndex = i + 1;
            el.classList.toggle('sel', st.id === selId);
            place(st);
        });
        $('cd-count').textContent = `${stickers.length} / ${MAX_STICKERS}`;
        $('cd-empty').hidden = stickers.length > 0;
        $('cd-delete').disabled = selId == null;
        $('cd-clear').disabled = stickers.length === 0;
    }

    // ---------- изменения и сохранение ----------
    function changed() {
        dirty = true; setStatus('Сохраняю…');
        clearTimeout(saveTimer); saveTimer = setTimeout(save, SAVE_DELAY);
    }
    function payload() {
        return JSON.stringify({
            stickers: stickers.map(s => ({
                gift: s.gift, model: s.model,
                x: +s.x.toFixed(4), y: +s.y.toFixed(4), r: +s.r.toFixed(1), sc: +s.sc.toFixed(3)
            }))
        });
    }
    async function save(keepalive) {
        if (!loaded || !dirty) return;
        if (saving) { saveTimer = setTimeout(save, 300); return; }
        saving = true; dirty = false;
        try {
            const resp = await fetch(api('Card/Save'), {
                method: 'PUT', keepalive: keepalive === true,
                headers: { 'Authorization': authHeader(), 'Content-Type': 'application/json' },
                body: payload()
            });
            if (!resp.ok) throw new Error(resp.status);
            if (!dirty) setStatus('Сохранено ✓');
        } catch (e) {
            dirty = true; setStatus('Не удалось сохранить — повторю', true);
            clearTimeout(saveTimer); saveTimer = setTimeout(save, 4000);
        } finally { saving = false; }
    }
    function flush() { if (dirty && loaded) { clearTimeout(saveTimer); save(true); } }
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

    function addSticker(gift, model) {
        if (stickers.length >= MAX_STICKERS) { toast(`Максимум ${MAX_STICKERS} стикеров на карточке`); return; }
        const st = {
            id: nextId++, gift, model,
            x: 0.5 + (Math.random() - .5) * .3, y: 0.5 + (Math.random() - .5) * .3, r: 0, sc: 1
        };
        stickers.push(st); selId = st.id; render(); changed();
    }
    function removeSticker(id) {
        stickers = stickers.filter(s => s.id !== id);
        if (selId === id) selId = null;
        render(); changed();
    }
    function bringToTop(st) {
        const i = stickers.indexOf(st);
        if (i !== stickers.length - 1) { stickers.splice(i, 1); stickers.push(st); }
    }

    // ---------- перетаскивание / поворот / масштаб ----------
    function onDown(e, st) {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        selId = st.id; bringToTop(st); render();
        const el = els.get(st.id), r = cardRect();
        const dx = st.x - (e.clientX - r.left) / r.width, dy = st.y - (e.clientY - r.top) / r.height;
        el.setPointerCapture(e.pointerId); el.classList.add('drag');
        let moved = false;
        const move = (ev) => {
            const rr = cardRect(); moved = true;
            st.x = clamp((ev.clientX - rr.left) / rr.width + dx, 0, 1);
            st.y = clamp((ev.clientY - rr.top) / rr.height + dy, 0, 1);
            place(st);
        };
        const up = () => {
            el.classList.remove('drag');
            el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
            if (moved) changed();
        };
        el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    }
    function onKnobDown(e, st) {
        e.preventDefault(); e.stopPropagation();
        const knob = e.currentTarget, r = cardRect();
        const cx = r.left + st.x * r.width, cy = r.top + st.y * r.height;
        const d0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
        const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
        const sc0 = st.sc, r0 = st.r;
        knob.setPointerCapture(e.pointerId);
        const move = (ev) => {
            const rr = cardRect(), ccx = rr.left + st.x * rr.width, ccy = rr.top + st.y * rr.height;
            const d = Math.hypot(ev.clientX - ccx, ev.clientY - ccy);
            st.sc = clamp(sc0 * d / d0, SC_MIN, SC_MAX);
            st.r = r0 + (Math.atan2(ev.clientY - ccy, ev.clientX - ccx) - a0) * 180 / Math.PI;
            place(st);
        };
        const up = () => {
            knob.removeEventListener('pointermove', move); knob.removeEventListener('pointerup', up); knob.removeEventListener('pointercancel', up);
            changed();
        };
        knob.addEventListener('pointermove', move); knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up);
    }
    cardEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('.cd-st')) { selId = null; render(); } });
    cardEl.addEventListener('wheel', (e) => {
        const st = stickers.find(s => s.id === selId); if (!st) return;
        e.preventDefault();
        st.sc = clamp(st.sc * (e.deltaY < 0 ? 1.06 : 1 / 1.06), SC_MIN, SC_MAX);
        place(st); changed();
    }, { passive: false });
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selId != null && !/input|textarea/i.test(document.activeElement.tagName)) {
            e.preventDefault(); removeSticker(selId);
        }
    });
    $('cd-delete').onclick = () => { if (selId != null) removeSticker(selId); };
    $('cd-clear').onclick = () => { if (stickers.length && confirm('Убрать все стикеры с карточки?')) { stickers = []; selId = null; render(); changed(); } };
    window.addEventListener('resize', () => stickers.forEach(place));

    // ---------- поиск ----------
    let q = '', offset = 0, seq = 0, searchT;
    async function search(reset) {
        const my = ++seq;
        if (reset) { offset = 0; $('cd-results').innerHTML = ''; }
        $('cd-note').textContent = 'Ищу…'; $('cd-more').hidden = true;
        try {
            const resp = await fetch(api(`Card/SearchModels?q=${encodeURIComponent(q)}&limit=${PAGE}&offset=${offset}`), { headers: { 'Authorization': authHeader() } });
            if (!resp.ok) throw new Error(resp.status);
            const items = await resp.json();
            if (my !== seq) return;
            const box = $('cd-results');
            items.forEach(it => {
                const b = document.createElement('button');
                b.type = 'button'; b.className = 'cd-item'; b.title = `${it.modelName} — ${it.giftName}`;
                b.innerHTML = '<img loading="lazy" alt=""><b></b><small></small>';
                b.children[0].src = imgUrl(it.giftName, it.modelName);
                b.children[1].textContent = it.modelName; b.children[2].textContent = it.giftName;
                b.onclick = () => addSticker(it.giftName, it.modelName);
                box.appendChild(b);
            });
            offset += items.length;
            $('cd-more').hidden = items.length < PAGE;
            $('cd-note').textContent = box.children.length ? '' : 'Ничего не найдено';
        } catch (e) {
            if (my === seq) $('cd-note').textContent = 'Не удалось выполнить поиск';
        }
    }
    $('cd-q').addEventListener('input', (e) => { q = e.target.value.trim(); clearTimeout(searchT); searchT = setTimeout(() => search(true), 250); });
    $('cd-more').onclick = () => search(false);

    // ---------- загрузка ----------
    async function init() {
        if (!window.NFTAuth || !NFTAuth.isAuthenticated()) { $('cd-gate').hidden = false; return; }
        $('cd-app').hidden = false;
        search(true);
        try {
            const resp = await fetch(api('Card/Get'), { headers: { 'Authorization': authHeader() } });
            if (resp.status === 401 || resp.status === 403) { $('cd-app').hidden = true; $('cd-gate').hidden = false; return; }
            if (!resp.ok) throw new Error(resp.status);
            const data = await resp.json();
            stickers = (data.stickers || []).slice(0, MAX_STICKERS).map(s => ({
                id: nextId++, gift: s.gift, model: s.model,
                x: +s.x, y: +s.y, r: +s.r || 0, sc: clamp(+s.sc || 1, SC_MIN, SC_MAX)
            }));
            loaded = true; render();
        } catch (e) {
            // loaded остаётся false: пустой экран не затрёт сохранённую карточку
            setStatus('Не удалось загрузить карточку — обновите страницу', true);
        }
    }
    init();
})();
