// js/modals/details-modal.js

let modalOverlay, modalContent, modalCloseBtn;
let _apiConfig = {}; // { baseUrl, photoUrl, secureFetch, fixedColors }
let nftsState = { isExpanded: false, page: 1, pageSize: 18, hasMore: true, observer: null };

function init(config) {
    _apiConfig = config;

    // Инъекция HTML (чтобы не загрязнять index.html)
    const html = `
    <div id="details-modal-overlay" class="details-modal-overlay hidden">
        <div class="details-modal">
            <div class="details-modal-header">
                <button id="dm-close-btn" class="details-modal-close-btn">&times;</button>
                <h3 id="dm-title" class="details-modal-title"></h3>
            </div>
            <div class="modal-scrollable-content">
                <div id="dm-visual" class="modal-visual-area"></div>
                <div class="info-table">
                    <div class="info-row"><span class="info-label">Модель</span><span id="dm-model" class="info-value"></span></div>
                    <div class="info-row"><span class="info-label">Коллекция</span><span id="dm-gift" class="info-value"></span></div>
                    <div class="info-row"><span class="info-label">Фон</span><span id="dm-bg" class="info-value"></span></div>
                    <div class="info-row"><span class="info-label">Совпадение</span><span id="dm-compat" class="info-value compat"></span></div>
                    <div class="info-row"><span class="info-label">Количество</span><span id="dm-count" class="info-value count"></span></div>
                    <div class="info-row" style="border:none;"><span class="info-label">Тематики</span><span id="dm-themes" class="info-value link-style"></span></div>
                </div>
                <div id="dm-gold-btn" class="gold-button-container"></div>
                <div class="nfts-section-container">
                    <div class="nfts-header" id="dm-nfts-header">
                        <span class="nfts-header-line"></span><span class="nfts-header-title">Найденные NFT</span>
                        <svg class="nfts-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        <span class="nfts-header-line"></span>
                    </div>
                    <div id="dm-nfts-grid" class="nfts-grid hidden"></div>
                    <div id="dm-nfts-loader" class="hidden" style="text-align:center; padding:10px;"><span class="loading-spinner-mini" style="border:2px solid #fff; border-top:2px solid transparent; border-radius:50%; width:16px; height:16px; display:inline-block; animation:spin 1s linear infinite;"></span></div>
                </div>
            </div>
        </div>
    </div>`;

    if (!document.getElementById('details-modal-overlay')) {
        document.body.insertAdjacentHTML('beforeend', html);
    }

    modalOverlay = document.getElementById('details-modal-overlay');
    modalCloseBtn = document.getElementById('dm-close-btn');
    
    // Закрытие
    modalCloseBtn.addEventListener('click', () => close());
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) close(); });
    
    // Раскрытие NFT
    document.getElementById('dm-nfts-header').addEventListener('click', toggleNFTs);
}

async function open(data, callbacks = {}) {
    // data: { giftName, modelName, bgName, compatValue, count, backgroundGradient }
    // callbacks: { onThemeClick, onBgClick, onModelClick }

    document.body.style.cursor = 'wait';
    
    // 1. Заполняем статику
    document.getElementById('dm-title').textContent = data.giftName; // Или модель, как в дизайне
    document.getElementById('dm-gift').textContent = data.giftName;
    
    // Lottie
    const lottieUrl = `${_apiConfig.photoUrl}/${encodeURIComponent(data.giftName)}/lottie/${encodeURIComponent(data.modelName)}.json`;
    const visualArea = document.getElementById('dm-visual');
    visualArea.style.background = data.backgroundGradient || '#16213a';
    visualArea.innerHTML = `<lottie-player src="${lottieUrl}" background="transparent" speed="1" loop autoplay></lottie-player>`;

    // Ссылки (Model / Bg)
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>`;
    
    const modelEl = document.getElementById('dm-model');
    modelEl.innerHTML = `${data.modelName} ${callbacks.onModelClick ? iconSvg : ''}`;
    modelEl.className = callbacks.onModelClick ? 'info-value action-link' : 'info-value';
    modelEl.onclick = callbacks.onModelClick ? () => { close(); callbacks.onModelClick(); } : null;

    const bgEl = document.getElementById('dm-bg');
    bgEl.innerHTML = `${data.bgName || '—'} ${callbacks.onBgClick ? iconSvg : ''}`;
    bgEl.className = callbacks.onBgClick ? 'info-value action-link' : 'info-value';
    bgEl.onclick = callbacks.onBgClick ? () => { close(); callbacks.onBgClick(); } : null;

    document.getElementById('dm-compat').textContent = data.compatValue ? `${data.compatValue}%` : '—';
    document.getElementById('dm-count').textContent = data.count ? `${data.count} шт` : '—';

    // 2. Асинхронная загрузка (Тематики и Золотая кнопка)
    const themesEl = document.getElementById('dm-themes');
    themesEl.textContent = 'Загрузка...';
    themesEl.onclick = null;

    const btnContainer = document.getElementById('dm-gold-btn');
    btnContainer.innerHTML = '';

    // Сброс NFT
    nftsState = { isExpanded: false, page: 1, pageSize: 18, hasMore: true, observer: null, currentGift: data.giftName, currentModel: data.modelName, currentBg: data.bgName };
    document.getElementById('dm-nfts-grid').innerHTML = '';
    document.getElementById('dm-nfts-grid').classList.add('hidden');
    document.getElementById('dm-nfts-header').classList.remove('expanded');

    // Показываем окно
    modalOverlay.classList.remove('hidden');
    document.body.classList.add('modal-open');
    document.body.style.cursor = 'default';

    // Параллельные запросы
    Promise.all([
        loadThemes(data.giftName, data.modelName, themesEl, callbacks.onThemeClick),
        renderGoldButton(data.giftName, data.modelName, btnContainer)
    ]);
}

async function loadThemes(gift, model, el, onThemeClick) {
    try {
        const url = `${_apiConfig.baseUrl}/api/Thematic/GetCollectionByGift/${encodeURIComponent(gift)}/${encodeURIComponent(model)}`;
        const themes = await _apiConfig.secureFetch(url);
        
        if (themes && themes.length > 0) {
            el.innerHTML = `${themes.length} тем(ы) <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>`;
            el.className = 'info-value link-style';
            el.onclick = () => {
                if(onThemeClick) {
                    modalOverlay.classList.add('hidden'); // Прячем детали
                    onThemeClick(themes); // Открываем тематики
                }
            };
        } else {
            el.textContent = 'Нет';
            el.className = 'info-value';
        }
    } catch (e) {
        el.textContent = 'Ошибка';
    }
}

async function renderGoldButton(gift, model, container) {
    container.innerHTML = '<span class="loading-spinner-mini" style="border:2px solid #666; width:20px; height:20px; border-radius:50%;"></span>';
    // Логика получения похожих цветов (упрощена для примера, полная логика была в background-finder.js)
    // Здесь мы просто генерируем ссылку
    const href = `/nft-page/index.html?giftName=${encodeURIComponent(gift)}&modelName=${encodeURIComponent(model)}&randomGiftsCount=10`;
    
    // В реальном коде здесь нужно сделать запрос за цветами для градиента кнопки
    // Используем дефолтный градиент пока
    const btn = document.createElement('a');
    btn.className = 'similar-color-btn';
    btn.href = href;
    btn.innerHTML = `Похожие по цвету`;
    btn.style.background = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
    btn.style.color = '#fff';
    
    container.innerHTML = '';
    container.appendChild(btn);
}

function toggleNFTs() {
    nftsState.isExpanded = !nftsState.isExpanded;
    const grid = document.getElementById('dm-nfts-grid');
    const header = document.getElementById('dm-nfts-header');
    
    if (nftsState.isExpanded) {
        header.classList.add('expanded');
        grid.classList.remove('hidden');
        if(grid.children.length === 0) loadMoreNFTs();
    } else {
        header.classList.remove('expanded');
        grid.classList.add('hidden');
    }
}

async function loadMoreNFTs() {
    if (!nftsState.hasMore) return;
    document.getElementById('dm-nfts-loader').classList.remove('hidden');
    
    const url = `${_apiConfig.baseUrl}/api/ListGifts/SearchGifts/${nftsState.page}/${nftsState.pageSize}`;
    try {
        const body = { GiftName: nftsState.currentGift, ModelName: nftsState.currentModel, BackgroundName: nftsState.currentBg };
        const data = await _apiConfig.secureFetch(url, body);
        
        if (data && data.Items && data.Items.length > 0) {
            renderNFTs(data.Items);
            nftsState.page++;
        } else {
            nftsState.hasMore = false;
        }
    } catch(e) { console.error(e); }
    finally { document.getElementById('dm-nfts-loader').classList.add('hidden'); }
}

function renderNFTs(items) {
    const grid = document.getElementById('dm-nfts-grid');
    items.forEach(item => {
        const a = document.createElement('a');
        a.className = 'nft-card';
        a.href = `https://t.me/nft/${item.GiftName.replace(/ /g,'')}-${item.Number}`;
        a.target = '_blank';
        const imgUrl = `https://nft.fragment.com/gift/${item.GiftName.toLowerCase().replace(/ /g,'')}-${item.Number}.medium.jpg`;
        a.innerHTML = `<img src="${imgUrl}" class="nft-image" loading="lazy"><span class="nft-number">#${item.Number}</span>`;
        grid.appendChild(a);
    });
}

function close(keepOverlay = false) {
    if(modalOverlay) modalOverlay.classList.add('hidden');
    if(!keepOverlay) document.body.classList.remove('modal-open');
}

export default { init, open, close };