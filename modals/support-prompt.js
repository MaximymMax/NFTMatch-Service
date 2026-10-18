/**
 * support-prompt.js — окно «поддержать проект».
 *
 * Сервер сам решает, когда его показывать (3 ключевых вызова API за 10 минут, один раз на человека за всё
 * время, см. бэкенд: GET /api/Support/Check). Этот скрипт:
 *   1) следит за запросами к ключевым путям API (подбор, поиск, тематики) и после них спрашивает сервер;
 *   2) показывает окно, если сервер сказал «да»;
 *   3) сообщает серверу, нажали ли «Поддержать» и как быстро окно закрыли (POST /api/Support/Event).
 *
 * Подключается обычным <script src=".../modals/support-prompt.js"></script> после config.js и auth.js.
 */
(function () {
    'use strict';
    if (window.__supportPromptInit) return;
    window.__supportPromptInit = true;

    // Ключевые пути, после которых имеет смысл спросить сервер (сам счёт ведёт сервер).
    const KEY_ROUTES = [
        '/api/MonoCoof/MatchV4Dedup',
        '/api/MonoCoof/MatchV2Backgrounds',
        '/api/MonoCoof/SimilarNFTs',
        '/api/MonoCoof/MatchV2SimilarModels',
        '/api/MonoCoof/MatchV2ModelsByBackground',
        '/api/MonoCoof/MatchV2ModelsByColorRecipe',
        '/api/Thematic/V2/Theme/',
        '/api/Thematic/V2/Layer',
        '/api/ListGifts/SearchGifts',
    ];

    const MIN_CHECK_INTERVAL_MS = 25000;  // не чаще раза в 25 секунд
    const MAX_CHECKS_PER_SESSION = 8;     // и не больше 8 раз за сессию страницы
    const FIRST_CHECK_DELAY_MS = 1500;    // пауза после ответа, чтобы окно не вылезало поверх результата

    const originalFetch = window.fetch.bind(window);
    let lastCheckAt = 0;
    let checksDone = 0;
    let timer = null;
    let promptShown = false;

    function baseUrl() {
        return (window.CONFIG && window.CONFIG.SERVER_BASE_URL) || '';
    }

    function authHeader() {
        try { return window.getApiAuthHeader ? window.getApiAuthHeader() : null; } catch (e) { return null; }
    }

    function isKeyUrl(url) {
        try {
            const u = typeof url === 'string' ? url : (url && url.url) || '';
            return KEY_ROUTES.some(r => u.indexOf(r) !== -1);
        } catch (e) { return false; }
    }

    // Перехват fetch: после успешного ответа ключевого пути планируем проверку.
    window.fetch = function (input, init) {
        const p = originalFetch(input, init);
        if (isKeyUrl(input)) {
            p.then(resp => { if (resp && resp.ok) schedule(); }).catch(() => { });
        }
        return p;
    };

    function schedule() {
        if (promptShown || checksDone >= MAX_CHECKS_PER_SESSION || timer) return;
        const wait = Math.max(FIRST_CHECK_DELAY_MS, MIN_CHECK_INTERVAL_MS - (Date.now() - lastCheckAt));
        timer = setTimeout(() => { timer = null; check(); }, wait);
    }

    async function check() {
        const auth = authHeader();
        if (!auth || auth === 'Tma invalid' || promptShown) return;
        lastCheckAt = Date.now();
        checksDone++;
        try {
            const resp = await originalFetch(`${baseUrl()}/api/Support/Check`, {
                method: 'GET',
                headers: { 'Authorization': auth }
            });
            if (!resp.ok) return;
            const data = await resp.json();
            if (data && data.show) openPrompt(data);
        } catch (e) { /* окно не критично: молча пропускаем */ }
    }

    function sendEvent(promptId, evt, dwellMs) {
        if (!promptId) return;   // тестовое окно из консоли на сервер не пишем
        const auth = authHeader();
        if (!auth) return;
        try {
            originalFetch(`${baseUrl()}/api/Support/Event`, {
                method: 'POST',
                headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
                body: JSON.stringify(dwellMs == null ? { promptId, event: evt } : { promptId, event: evt, dwellMs }),
                keepalive: true   // дойдёт, даже если вкладку закрывают
            }).catch(() => { });
        } catch (e) { }
    }

    function tr(key, fallback) {
        try { return window.NFTi18n ? window.NFTi18n.t(key, fallback) : fallback; } catch (e) { return fallback; }
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function injectStyles() {
        if (document.getElementById('support-prompt-styles')) return;
        const css = `
.sp-overlay{position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:1.5rem;
  background:rgba(10,16,32,.85);backdrop-filter:blur(8px);opacity:0;pointer-events:none;transition:opacity .25s ease}
.sp-overlay.active{opacity:1;pointer-events:all}
.sp-modal{position:relative;width:100%;max-width:420px;padding:2rem 1.75rem 1.75rem;border-radius:24px;text-align:center;
  background:var(--surface-elevated,#1e2944);border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 50px rgba(0,0,0,.6);
  transform:scale(.95);transition:transform .25s ease;display:flex;flex-direction:column;gap:1rem;color:#fff}
.sp-overlay.active .sp-modal{transform:scale(1)}
.sp-close{position:absolute;top:10px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.08);
  color:#fff;font-size:20px;line-height:34px;cursor:pointer}
.sp-close:hover{background:rgba(255,255,255,.16)}
.sp-title{margin:0;font-size:1.05rem;font-weight:400;padding:0 1.5rem}
.sp-text{margin:0;font-size:1.05rem;font-weight:700;line-height:1.45}
.sp-btn{display:block;margin-top:.5rem;padding:.9rem 1rem;border-radius:14px;background:var(--primary-color,#2563eb);color:#fff;
  font-weight:700;font-size:1.05rem;text-decoration:none}
.sp-btn:hover{background:var(--primary-hover,#1d4ed8)}`;
        const style = document.createElement('style');
        style.id = 'support-prompt-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function openLink(url) {
        try {
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData &&
                /^https:\/\/t\.me\//i.test(url) && window.Telegram.WebApp.openTelegramLink) {
                window.Telegram.WebApp.openTelegramLink(url);
                return;
            }
        } catch (e) { }
        window.open(url, '_blank', 'noopener');
    }

    function openPrompt(data) {
        if (promptShown) return;
        promptShown = true;
        injectStyles();

        // Русский текст приходит с сервера; в английском интерфейсе берём перевод из словаря сайта.
        const isEn = window.NFTi18n && window.NFTi18n.getLanguage && window.NFTi18n.getLanguage() === 'en';
        const title = isEn ? tr('support_prompt_title', data.title) : (data.title || tr('support_prompt_title', ''));
        const text = isEn ? tr('support_prompt_text', data.text) : (data.text || tr('support_prompt_text', ''));
        const btn = isEn ? tr('support_prompt_btn', data.buttonText) : (data.buttonText || tr('support_prompt_btn', 'Поддержать'));

        const overlay = document.createElement('div');
        overlay.className = 'sp-overlay';
        overlay.innerHTML = `
            <div class="sp-modal" role="dialog" aria-modal="true">
                <button class="sp-close" type="button" aria-label="Close">&times;</button>
                <p class="sp-title">${escapeHtml(title)}</p>
                <p class="sp-text">${escapeHtml(text)}</p>
                <a class="sp-btn" href="${escapeHtml(data.url)}" target="_blank" rel="noopener">${escapeHtml(btn)}</a>
            </div>`;
        document.body.appendChild(overlay);

        const shownAt = performance.now();
        let closed = false;

        function close() {
            if (closed) return;
            closed = true;
            sendEvent(data.promptId, 'closed', Math.round(performance.now() - shownAt));
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', close);
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
        function onKey(e) { if (e.key === 'Escape') close(); }
        // Страницу закрыли или свернули, не закрыв окно: считаем это закрытием в этот момент.
        function onVisibility() { if (document.visibilityState === 'hidden') close(); }

        overlay.querySelector('.sp-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        overlay.querySelector('.sp-btn').addEventListener('click', e => {
            e.preventDefault();
            sendEvent(data.promptId, 'clicked');
            openLink(data.url);
        });
        document.addEventListener('keydown', onKey);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', close);

        setTimeout(() => overlay.classList.add('active'), 20);
    }

    // Для отладки из консоли: NFTSupportPrompt.test() показывает окно без обращения к серверу.
    window.NFTSupportPrompt = {
        test: () => { promptShown = false; openPrompt({ promptId: 0, title: tr('support_prompt_title', 'Проект NFTMatch полностью бесплатный'), text: tr('support_prompt_text', ''), buttonText: tr('support_prompt_btn', 'Поддержать'), url: 'https://t.me/sendgrams?to=Criminal_hamster' }); }
    };
})();
