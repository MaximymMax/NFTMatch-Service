// putya: "теперь займись тематиками, добавь возможность туда ставить те же флажки, что по
// визуалу, логике, названию" — портировано из приватного инструмента разметки
// (mono-cube-live.html, функции tf*) на продакшен-страницу Тематики, отдельным режимом
// (переключатель Темы/Разметка), видимым только админу. Тот же backend (ModelThemeEvidence:
// HasVisualEvidence/HasLogicalEvidence/HasNameEvidence), но со НОВЫМ правилом: "если выбрана
// логика, название выбирать нельзя и наоборот" — на тестовом сайте все три флага независимы,
// здесь Логика/Название работают как пара radio, Визуал остаётся независимым.
(function () {
    const SERVER_BASE_URL = window.CONFIG && window.CONFIG.SERVER_BASE_URL || 'https://nftmatch.pro';
    const API_BASE = SERVER_BASE_URL + '/api/MonoCoof';
    const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
    const modelImageUrl = (giftName, modelName) => `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;

    function getApiAuthHeader() {
        if (window.NFTAuth && typeof window.NFTAuth.getApiAuthHeader === 'function') {
            return window.NFTAuth.getApiAuthHeader();
        }
        if (window.getApiAuthHeader && typeof window.getApiAuthHeader === 'function') {
            return window.getApiAuthHeader();
        }
        return 'Tma invalid';
    }

    function escapeHtml(s) {
        return (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // DebugCube и соседи на этом бэкенде иногда приходят camelCase, иногда PascalCase (см. историю
    // правок color-wheel.js/themes-modal.js) — берём оба варианта на всякий случай.
    function pick(obj, name) {
        if (!obj) return undefined;
        const lower = name.charAt(0).toLowerCase() + name.slice(1);
        const upper = name.charAt(0).toUpperCase() + name.slice(1);
        return obj[lower] !== undefined ? obj[lower] : obj[upper];
    }

    const modeSwitcherContainer = document.getElementById('tf-mode-switcher-container');
    const modeSwitcher = document.getElementById('tf-mode-switcher');
    const browseMode = document.getElementById('tf-browse-mode');
    const flagsPanel = document.getElementById('tf-flags-panel');
    if (!modeSwitcherContainer || !modeSwitcher || !browseMode || !flagsPanel) return;

    const searchInput = document.getElementById('tf-search');
    const statusFilters = document.getElementById('tf-status-filters');
    const reloadBtn = document.getElementById('tf-reload-btn');
    const themeListEl = document.getElementById('tf-theme-list');

    let tfLoaded = false;
    let tfAllThemes = [];
    let tfCurrentStatus = '';
    let tfRenderedCount = 0;
    const TF_BATCH_SIZE = 40;
    let tfSavedScrollY = 0;

    const TF_STATUS_LABEL = { visual: '🎨 Визуал', logical: '🧠 Логика', 'visual+name': '🎨🔤 Визуал+имя', name: '🔤 Имя' };
    const TF_STATUS_COLOR = { visual: '#eab308', logical: '#60a5fa', 'visual+name': '#22c55e', name: '#a78bfa' };

    // --- Переключатель Темы/Разметка ---
    function setTfMode(mode) {
        modeSwitcher.dataset.activeMode = mode;
        modeSwitcher.querySelectorAll('.mode-tab').forEach(b => b.classList.toggle('active', b.dataset.tfmode === mode));
        browseMode.classList.toggle('hidden', mode === 'flags');
        flagsPanel.classList.toggle('hidden', mode !== 'flags');
        if (mode === 'flags' && !tfLoaded) loadThemeList();
    }
    modeSwitcher.querySelectorAll('.mode-tab').forEach(b => b.addEventListener('click', () => setTfMode(b.dataset.tfmode)));

    async function loadThemeList(force) {
        if (tfLoaded && !force) { renderThemeList(true); return; }
        themeListEl.innerHTML = '<div class="tf-theme-title">Загружаю список тем…</div>';
        try {
            const resp = await fetch(`${API_BASE}/GetThemeStatusList`, { headers: { 'Authorization': getApiAuthHeader() } });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            tfAllThemes = pick(data, 'themes') || [];
            tfLoaded = true;
            renderThemeList(true);
        } catch (err) {
            themeListEl.innerHTML = `<div class="tf-theme-title">Не удалось загрузить: ${escapeHtml(err.message)}</div>`;
        }
    }
    reloadBtn.addEventListener('click', () => loadThemeList(true));

    function tfApplyFilters() {
        const search = (searchInput.value || '').trim().toLowerCase();
        return tfAllThemes.filter(t => {
            if (tfCurrentStatus && pick(t, 'status') !== tfCurrentStatus) return false;
            if (search && !(pick(t, 'themeName') || '').toLowerCase().includes(search)) return false;
            return true;
        });
    }

    function renderThemeList(reset) {
        const filtered = tfApplyFilters();
        if (reset) tfRenderedCount = 0;
        if (!filtered.length) {
            themeListEl.innerHTML = '<div class="tf-theme-title">Ничего не найдено под текущие фильтры.</div>';
            return;
        }
        const toShow = filtered.slice(0, tfRenderedCount + TF_BATCH_SIZE);
        tfRenderedCount = toShow.length;
        const rows = toShow.map(t => {
            const status = pick(t, 'status');
            const color = TF_STATUS_COLOR[status] || 'var(--text-muted)';
            const label = TF_STATUS_LABEL[status] || 'не размечено';
            return `
                <div class="tf-theme-row" data-theme-id="${pick(t, 'themeId')}" data-theme-name="${escapeHtml(pick(t, 'themeName'))}">
                    <span class="tf-theme-row-status" style="color:${color};">${label}</span>
                    <span class="tf-theme-row-name">${escapeHtml(pick(t, 'themeName'))}</span>
                    <span class="tf-theme-row-meta">${pick(t, 'modelCount')} моделей · 🎨${pick(t, 'visualCoveragePercent')}% · 🔤${pick(t, 'nameCoveragePercent')}%</span>
                </div>`;
        }).join('');
        const moreBtn = tfRenderedCount < filtered.length
            ? `<button type="button" id="tf-show-more-btn" class="tf-show-more-btn">Показать ещё (${filtered.length - tfRenderedCount} осталось)</button>`
            : '';
        themeListEl.innerHTML = rows + moreBtn;
        const moreBtnEl = document.getElementById('tf-show-more-btn');
        if (moreBtnEl) moreBtnEl.addEventListener('click', () => renderThemeList(false));
        themeListEl.querySelectorAll('.tf-theme-row').forEach(row => {
            row.addEventListener('click', () => tfOpenTheme(parseInt(row.dataset.themeId, 10), row.dataset.themeName));
        });
    }

    statusFilters.querySelectorAll('.tf-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tfCurrentStatus = btn.dataset.status;
            statusFilters.querySelectorAll('.tf-status-btn').forEach(b => b.classList.toggle('active', b === btn));
            renderThemeList(true);
        });
    });
    searchInput.addEventListener('input', () => { if (tfLoaded) renderThemeList(true); });

    // --- Разметка модели: 🎨/🧠/🔤, клик сохраняет сразу ---
    function tfFlagBtn(icon, key, value) {
        const on = value === true;
        return `<button type="button" class="tfflag-btn ${on ? 'on' : 'off'}" data-flag="${key}" title="${on ? 'да — клик, чтобы снять' : 'нет — клик, чтобы поставить'}">${icon}${on ? '✓' : '✕'}</button>`;
    }

    function tfModelFlagRow(themeId, themeName, m) {
        const giftName = pick(m, 'giftName'), modelName = pick(m, 'modelName');
        const reviewed = pick(m, 'isUserReviewed');
        const reviewedHtml = reviewed ? ' · <span class="tf-reviewed-marker">✓ проверено</span>' : '';
        return `
            <div class="tf-model-row" data-gift="${escapeHtml(giftName)}" data-model="${escapeHtml(modelName)}" data-theme-id="${themeId}" data-theme-name="${escapeHtml(themeName)}"
                 data-visual="${pick(m, 'hasVisualEvidence')}" data-logical="${pick(m, 'hasLogicalEvidence')}" data-name="${pick(m, 'hasNameEvidence')}">
                <img src="${modelImageUrl(giftName, modelName)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
                <div class="tf-model-info">
                    <div class="tf-model-name" title="${escapeHtml(giftName)} / ${escapeHtml(modelName)}">${escapeHtml(modelName)}</div>
                    <div class="tf-model-gift">${escapeHtml(giftName)}<span class="tf-reviewed-marker-wrap">${reviewedHtml}</span></div>
                </div>
                <div class="tf-flag-buttons">
                    ${tfFlagBtn('🎨', 'visual', pick(m, 'hasVisualEvidence'))}
                    ${tfFlagBtn('🧠', 'logical', pick(m, 'hasLogicalEvidence'))}
                    ${tfFlagBtn('🔤', 'name', pick(m, 'hasNameEvidence'))}
                </div>
            </div>`;
    }

    async function tfOpenTheme(themeId, themeName) {
        tfSavedScrollY = window.scrollY;
        themeListEl.innerHTML = '<div class="tf-theme-title">Загружаю модели темы…</div>';
        try {
            const resp = await fetch(`${API_BASE}/GetModelThemeEvidenceForTheme?themeId=${themeId}`, { headers: { 'Authorization': getApiAuthHeader() } });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            const models = pick(data, 'models') || [];
            const backBtn = `<button type="button" id="tf-back-btn" class="tf-back-btn">← назад к списку тем</button>`;
            const rows = models.map(m => tfModelFlagRow(themeId, themeName, m)).join('');
            themeListEl.innerHTML = `
                ${backBtn}
                <div class="tf-theme-title">«${escapeHtml(themeName)}» — ${models.length} моделей. Клик по флажку сохраняет сразу.</div>
                ${rows}`;
            document.getElementById('tf-back-btn').addEventListener('click', () => {
                renderThemeList(true);
                window.scrollTo(0, tfSavedScrollY);
            });
        } catch (err) {
            themeListEl.innerHTML = `<div class="tf-theme-title">Не удалось загрузить: ${escapeHtml(err.message)}</div>`;
        }
    }

    // putya: "если выбрана логика, название выбирать нельзя и наоборот" — при включении одного из
    // двух выключаем другой (radio-поведение), 🎨 трогаем как обычный независимый тумблер.
    themeListEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('.tfflag-btn');
        if (!btn) return;
        const row = btn.closest('.tf-model-row');
        if (!row) return;
        const key = btn.dataset.flag;
        const newValue = row.dataset[key] !== 'true';
        row.dataset[key] = String(newValue);

        if (newValue && (key === 'logical' || key === 'name')) {
            const otherKey = key === 'logical' ? 'name' : 'logical';
            if (row.dataset[otherKey] === 'true') {
                row.dataset[otherKey] = 'false';
                const otherBtn = row.querySelector(`.tfflag-btn[data-flag="${otherKey}"]`);
                if (otherBtn) {
                    otherBtn.classList.remove('on'); otherBtn.classList.add('off');
                    otherBtn.title = 'нет — клик, чтобы поставить';
                    otherBtn.textContent = otherBtn.textContent[0] + '✕';
                }
            }
        }

        btn.classList.toggle('on', newValue);
        btn.classList.toggle('off', !newValue);
        btn.title = newValue ? 'да — клик, чтобы снять' : 'нет — клик, чтобы поставить';
        btn.textContent = btn.textContent[0] + (newValue ? '✓' : '✕');

        const payload = {
            giftName: row.dataset.gift,
            modelName: row.dataset.model,
            themeId: parseInt(row.dataset.themeId, 10),
            themeName: row.dataset.themeName,
            hasVisualEvidence: row.dataset.visual === 'true',
            hasLogicalEvidence: row.dataset.logical === 'true',
            hasNameEvidence: row.dataset.name === 'true'
        };
        try {
            await fetch(API_BASE + '/SaveModelThemeEvidence', {
                method: 'POST',
                headers: { 'Authorization': getApiAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const marker = row.querySelector('.tf-reviewed-marker-wrap');
            if (marker && !marker.innerHTML.includes('✓')) {
                marker.innerHTML = ' · <span class="tf-reviewed-marker">✓ проверено</span>';
            }
        } catch (err) { /* тихо — не хочется прерывать разметку на сетевой ошибке */ }
    });
})();
