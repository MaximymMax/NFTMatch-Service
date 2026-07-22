document.addEventListener('DOMContentLoaded', async () => {
    const SERVER_BASE_URL = window.CONFIG?.SERVER_BASE_URL || 'https://nftmatch.pro';
    const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';

    function getApiAuthHeader() {
        if (window.NFTAuth && typeof window.NFTAuth.getApiAuthHeader === 'function') {
            return window.NFTAuth.getApiAuthHeader();
        }
        if (window.getApiAuthHeader && typeof window.getApiAuthHeader === 'function') {
            return window.getApiAuthHeader();
        }
        return 'Tma invalid';
    }

    if (window.themesModal && window.themesModal.init) {
        window.themesModal.init(SERVER_BASE_URL, API_PHOTO_URL, null, []);
    }
    window.BASE_URL = SERVER_BASE_URL;

    const grid = document.getElementById('nonunique-grid');
    const loading = document.getElementById('nonunique-loading');

    function buildCard(m) {
        const card = document.createElement('div');
        card.className = 'v2-model-card';
        card.style.setProperty('--card-gradient-color', '#a855f7');

        const imgUrl = `https://cdn.changes.tg/gifts/originals/${m.SourceId}/Original.png`;
        const themeCount = m.Count || 0;
        const themeCountText = themeCount > 0
            ? `<div class="nu-theme-count">${themeCount === 1 ? 'в 1 тематике' : `в ${themeCount} тематиках`}</div>`
            : '';

        card.innerHTML = `
            <div class="v2-mc-gradient"></div>
            <div class="v2-mc-image"><img src="${imgUrl}" loading="lazy"></div>
            <div class="v2-mc-info">
                <div class="v2-mc-title">${m.ModelName}</div>
                <div class="v2-mc-stats" style="flex-direction: column; align-items: flex-end;">
                    <div class="v2-mc-stat-badge"><span>⭐ ${m.StarsPrice || 50}</span></div>
                </div>
                ${themeCountText}
            </div>
        `;

        card.addEventListener('click', () => {
            if (window.themesModal && window.themesModal.openNonUniqueDetail) {
                window.themesModal.openNonUniqueDetail(m);
            }
        });

        return card;
    }

    try {
        const res = await fetch(`${SERVER_BASE_URL}/api/Thematic/V2/NonUniqueGifts`, {
            headers: { 'Authorization': getApiAuthHeader() }
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const items = await res.json();

        if (loading) loading.classList.add('hidden');

        if (!items || !items.length) {
            grid.innerHTML = '<p style="text-align:center; color:var(--text-muted); width:100%;">Пока нет доступных подарков.</p>';
            return;
        }

        items.forEach(m => grid.appendChild(buildCard(m)));
    } catch (e) {
        console.error('Failed to load non-unique gifts', e);
        if (loading) loading.classList.add('hidden');
        grid.innerHTML = '<p style="text-align:center; color:#f87171; width:100%;">Ошибка загрузки.</p>';
    }
});
