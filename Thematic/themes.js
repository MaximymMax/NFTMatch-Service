document.addEventListener('DOMContentLoaded', () => {

    // --- КОНФИГУРАЦИЯ ---
    const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net';
    const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
    const INIT_DATA_KEY = 'tgInitData';
    const BYPASS_KEY_STORAGE = 'apiBypassKey';
    const SCROLL_STORAGE_KEY = 'themes_page_scroll';

    const fixedColors = [
        { id: 'Amber', name: 'Amber', hex: '#DAB345', gradient: 'radial-gradient(circle, rgb(218, 179, 69) 0%, rgb(177, 128, 42) 100%)' },
        { id: 'Aquamarine', name: 'Aquamarine', hex: '#60B195', gradient: 'radial-gradient(circle, rgb(96, 177, 149) 0%, rgb(70, 171, 180) 100%)' },
        { id: 'AzureBlue', name: 'Azure Blue', hex: '#5DB1CB', gradient: 'radial-gradient(circle, rgb(93, 177, 203) 0%, rgb(68, 139, 171) 100%)' },
        { id: 'BattleshipGrey', name: 'Battleship Grey', hex: '#8C8C85', gradient: 'radial-gradient(circle, rgb(140, 140, 133) 0%, rgb(108, 108, 102) 100%)' },
        { id: 'Black', name: 'Black', hex: '#363738', gradient: 'radial-gradient(circle, rgb(54, 55, 56) 0%, rgb(14, 15, 15) 100%)' },
        { id: 'Burgundy', name: 'Burgundy', hex: '#A35E66', gradient: 'radial-gradient(circle, rgb(163, 94, 102) 0%, rgb(109, 65, 74) 100%)' },
        { id: 'BurntSienna', name: 'Burnt Sienna', hex: '#D66F3C', gradient: 'radial-gradient(circle, rgb(214, 111, 60) 0%, rgb(181, 75, 45) 100%)' },
        { id: 'CamoGreen', name: 'Camo Green', hex: '#75944D', gradient: 'radial-gradient(circle, rgb(117, 148, 77) 0%, rgb(84, 115, 65) 100%)' },
        { id: 'Cappuccino', name: 'Cappuccino', hex: '#B1907E', gradient: 'radial-gradient(circle, rgb(177, 144, 126) 0%, rgb(124, 99, 86) 100%)' },
        { id: 'Caramel', name: 'Caramel', hex: '#D09932', gradient: 'radial-gradient(circle, rgb(208, 153, 50) 0%, rgb(183, 116, 49) 100%)' },
        { id: 'Carmine', name: 'Carmine', hex: '#E0574A', gradient: 'radial-gradient(circle, rgb(224, 87, 74) 0%, rgb(168, 56, 59) 100%)' },
        { id: 'CarrotJuice', name: 'Carrot Juice', hex: '#DB9867', gradient: 'radial-gradient(circle, rgb(219, 152, 103) 0%, rgb(199, 111, 79) 100%)' },
        { id: 'CelticBlue', name: 'Celtic Blue', hex: '#49B8ED', gradient: 'radial-gradient(circle, rgb(69, 184, 237) 0%, rgb(56, 134, 217) 100%)' },
        { id: 'Chestnut', name: 'Chestnut', hex: '#BE6F54', gradient: 'radial-gradient(circle, rgb(190, 111, 84) 0%, rgb(153, 72, 56) 100%)' },
        { id: 'Chocolate', name: 'Chocolate', hex: '#A46E58', gradient: 'radial-gradient(circle, rgb(164, 110, 88) 0%, rgb(116, 68, 59) 100%)' },
        { id: 'CobaltBlue', name: 'Cobalt Blue', hex: '#6088CF', gradient: 'radial-gradient(circle, rgb(96, 136, 207) 0%, rgb(81, 98, 184) 100%)' },
        { id: 'Copper', name: 'Copper', hex: '#D08656', gradient: 'radial-gradient(circle, rgb(208, 134, 86) 0%, rgb(157, 101, 49) 100%)' },
        { id: 'CoralRed', name: 'Coral Red', hex: '#DA896B', gradient: 'radial-gradient(circle, rgb(218, 137, 107) 0%, rgb(196, 101, 79) 100%)' },
        { id: 'Cyberpunk', name: 'Cyberpunk', hex: '#858BF3', gradient: 'radial-gradient(circle, rgb(133, 143, 243) 0%, rgb(134, 95, 211) 100%)' },
        { id: 'DarkGreen', name: 'Dark Green', hex: '#516341', gradient: 'radial-gradient(circle, rgb(81, 99, 65) 0%, rgb(43, 69, 47) 100%)' },
        { id: 'DarkLilac', name: 'DarkLilac', hex: '#B17DA5', gradient: 'radial-gradient(circle, rgb(177, 125, 165) 0%, rgb(140, 87, 122) 100%)' },
        { id: 'DeepCyan', name: 'Deep Cyan', hex: '#31B5AA', gradient: 'radial-gradient(circle, rgb(49, 181, 170) 0%, rgb(24, 149, 153) 100%)' },
        { id: 'DesertSand', name: 'Desert Sand', hex: '#B39F82', gradient: 'radial-gradient(circle, rgb(179, 159, 130) 0%, rgb(126, 115, 91) 100%)' },
        { id: 'ElectricIndigo', name: 'Electric Indigo', hex: '#A980F3', gradient: 'radial-gradient(circle, rgb(169, 128, 243) 0%, rgb(91, 98, 216) 100%)' },
        { id: 'ElectricPurple', name: 'Electric Purple', hex: '#CA70C6', gradient: 'radial-gradient(circle, rgb(202, 112, 198) 0%, rgb(150, 98, 212) 100%)' },
        { id: 'Emerald', name: 'Emerald', hex: '#78C585', gradient: 'radial-gradient(circle, rgb(120, 197, 133) 0%, rgb(66, 161, 113) 100%)' },
        { id: 'EnglishViolet', name: 'English Violet', hex: '#B186BB', gradient: 'radial-gradient(circle, rgb(177, 134, 187) 0%, rgb(135, 90, 145) 100%)' },
        { id: 'Fandango', name: 'Fandango', hex: '#E28AB6', gradient: 'radial-gradient(circle, rgb(226, 138, 182) 0%, rgb(164, 88, 139) 100%)' },
        { id: 'Feldgrau', name: 'Feldgrau', hex: '#899288', gradient: 'radial-gradient(circle, rgb(137, 146, 136) 0%, rgb(94, 107, 99) 100%)' },
        { id: 'FireEngine', name: 'Fire Engine', hex: '#F05F4F', gradient: 'radial-gradient(circle, rgb(240, 95, 79) 0%, rgb(196, 57, 73) 100%)' },
        { id: 'FrenchBlue', name: 'French Blue', hex: '#5C9BC4', gradient: 'radial-gradient(circle, rgb(92, 155, 196) 0%, rgb(55, 115, 154) 100%)' },
        { id: 'FrenchViolet', name: 'French Violet', hex: '#C260E6', gradient: 'radial-gradient(circle, rgb(194, 96, 230) 0%, rgb(145, 78, 217) 100%)' },
        { id: 'Grape', name: 'Grape', hex: '#9D73C1', gradient: 'radial-gradient(circle, rgb(157, 116, 193) 0%, rgb(121, 77, 160) 100%)' },
        { id: 'Gunmetal', name: 'Gunmetal', hex: '#4C5D63', gradient: 'radial-gradient(circle, rgb(76, 93, 99) 0%, rgb(47, 59, 66) 100%)' },
        { id: 'GunshipGreen', name: 'Gunship Green', hex: '#558A65', gradient: 'radial-gradient(circle, rgb(85, 138, 101) 0%, rgb(61, 102, 87) 100%)' },
        { id: 'HunterGreen', name: 'Hunter Green', hex: '#8FA078', gradient: 'radial-gradient(circle, rgb(143, 174, 120) 0%, rgb(75, 130, 91) 100%)' },
        { id: 'IndigoDye', name: 'Indigo Dye', hex: '#537991', gradient: 'radial-gradient(circle, rgb(83, 121, 145) 0%, rgb(65, 100, 121) 100%)' },
        { id: 'IvoryWhite', name: 'Ivory White', hex: '#BABAD1', gradient: 'radial-gradient(circle, rgb(186, 182, 177) 0%, rgb(161, 157, 151) 100%)' },
        { id: 'JadeGreen', name: 'Jade Green', hex: '#55C49C', gradient: 'radial-gradient(circle, rgb(85, 196, 156) 0%, rgb(59, 153, 119) 100%)' },
        { id: 'KhakiGreen', name: 'Khaki Green', hex: '#ADAE70', gradient: 'radial-gradient(circle, rgb(173, 176, 112) 0%, rgb(107, 125, 84) 100%)' },
        { id: 'Lavender', name: 'Lavender', hex: '#B789E4', gradient: 'radial-gradient(circle, rgb(183, 137, 228) 0%, rgb(138, 90, 188) 100%)' },
        { id: 'Lemongrass', name: 'Lemongrass', hex: '#AEB85A', gradient: 'radial-gradient(circle, rgb(174, 184, 90) 0%, rgb(85, 147, 69) 100%)' },
        { id: 'LightOlive', name: 'Light Olive', hex: '#C2AF64', gradient: 'radial-gradient(circle, rgb(194, 175, 100) 0%, rgb(136, 126, 69) 100%)' },
        { id: 'Malachite', name: 'Malachite', hex: '#95B457', gradient: 'radial-gradient(circle, rgb(149, 180, 87) 0%, rgb(61, 151, 85) 100%)' },
        { id: 'MarineBlue', name: 'Marine Blue', hex: '#4E689C', gradient: 'radial-gradient(circle, rgb(78, 104, 156) 0%, rgb(59, 75, 122) 100%)' },
        { id: 'MexicanPink', name: 'Mexican Pink', hex: '#E36692', gradient: 'radial-gradient(circle, rgb(227, 102, 146) 0%, rgb(201, 73, 124) 100%)' },
        { id: 'MidnightBlue', name: 'Midnight Blue', hex: '#5C6985', gradient: 'radial-gradient(circle, rgb(92, 105, 133) 0%, rgb(53, 64, 87) 100%)' },
        { id: 'MintGreen', name: 'Mint Green', hex: '#7ECA82', gradient: 'radial-gradient(circle, rgb(126, 203, 130) 0%, rgb(69, 158, 90) 100%)' },
        { id: 'Moonstone', name: 'Moonstone', hex: '#7EB1B4', gradient: 'radial-gradient(circle, rgb(126, 177, 180) 0%, rgb(88, 131, 144) 100%)' },
        { id: 'Mustard', name: 'Mustard', hex: '#D4980D', gradient: 'radial-gradient(circle, rgb(212, 152, 13) 0%, rgb(196, 119, 18) 100%)' },
        { id: 'MysticPearl', name: 'Mystic Pearl', hex: '#D08B6D', gradient: 'radial-gradient(circle, rgb(208, 139, 109) 0%, rgb(176, 87, 112) 100%)' },
        { id: 'NavyBlue', name: 'Navy Blue', hex: '#6C9EDD', gradient: 'radial-gradient(circle, rgb(108, 158, 221) 0%, rgb(92, 110, 201) 100%)' },
        { id: 'NeonBlue', name: 'Neon Blue', hex: '#7596F9', gradient: 'radial-gradient(circle, rgb(117, 150, 249) 0%, rgb(104, 98, 228) 100%)' },
        { id: 'OldGold', name: 'Old Gold', hex: '#B58D38', gradient: 'radial-gradient(circle, rgb(181, 141, 56) 0%, rgb(148, 105, 37) 100%)' },
        { id: 'OnyxBlack', name: 'Onyx Black', hex: '#4D5254', gradient: 'radial-gradient(circle, rgb(77, 82, 84) 0%, rgb(49, 54, 56) 100%)' },
        { id: 'Orange', name: 'Orange', hex: '#D19A3A', gradient: 'radial-gradient(circle, rgb(209, 154, 58) 0%, rgb(192, 111, 71) 100%)' },
        { id: 'PacificCyan', name: 'Pacific Cyan', hex: '#5ABEA6', gradient: 'radial-gradient(circle, rgb(90, 190, 166) 0%, rgb(61, 149, 186) 100%)' },
        { id: 'PacificGreen', name: 'Pacific Green', hex: '#6FC793', gradient: 'radial-gradient(circle, rgb(111, 199, 147) 0%, rgb(59, 156, 132) 100%)' },
        { id: 'Persimmon', name: 'Persimmon', hex: '#E7A75A', gradient: 'radial-gradient(circle, rgb(231, 167, 90) 0%, rgb(197, 103, 95) 100%)' },
        { id: 'PineGreen', name: 'Pine Green', hex: '#6DA97C', gradient: 'radial-gradient(circle, rgb(107, 169, 124) 0%, rgb(62, 121, 112) 100%)' },
        { id: 'Pistachio', name: 'Pistachio', hex: '#97B07C', gradient: 'radial-gradient(circle, rgb(151, 176, 124) 0%, rgb(92, 129, 76) 100%)' },
        { id: 'Platinum', name: 'Platinum', hex: '#B2AEAD', gradient: 'radial-gradient(circle, rgb(178, 174, 167) 0%, rgb(136, 132, 126) 100%)' },
        { id: 'PureGold', name: 'Pure Gold', hex: '#CCAB41', gradient: 'radial-gradient(circle, rgb(204, 171, 65) 0%, rgb(152, 123, 50) 100%)' },
        { id: 'Purple', name: 'Purple', hex: '#AE6EAE', gradient: 'radial-gradient(circle, rgb(174, 108, 174) 0%, rgb(132, 71, 132) 100%)' },
        { id: 'RangerGreen', name: 'Ranger Green', hex: '#5F7849', gradient: 'radial-gradient(circle, rgb(95, 120, 73) 0%, rgb(60, 79, 59) 100%)' },
        { id: 'Raspberry', name: 'Raspberry', hex: '#E07B85', gradient: 'radial-gradient(circle, rgb(224, 123, 133) 0%, rgb(182, 89, 128) 100%)' },
        { id: 'RifleGreen', name: 'Rifle Green', hex: '#64695C', gradient: 'radial-gradient(circle, rgb(100, 105, 92) 0%, rgb(75, 82, 65) 100%)' },
        { id: 'RomanSilver', name: 'Roman Silver', hex: '#A3A8B5', gradient: 'radial-gradient(circle, rgb(163, 168, 181) 0%, rgb(124, 128, 138) 100%)' },
        { id: 'Rosewood', name: 'Rosewood', hex: '#B77A77', gradient: 'radial-gradient(circle, rgb(183, 122, 119) 0%, rgb(129, 76, 82) 100%)' },
        { id: 'Sapphire', name: 'Sapphire', hex: '#58A3C8', gradient: 'radial-gradient(circle, rgb(88, 163, 200) 0%, rgb(83, 121, 194) 100%)' },
        { id: 'SatinGold', name: 'Satin Gold', hex: '#BF9B47', gradient: 'radial-gradient(circle, rgb(191, 155, 71) 0%, rgb(141, 119, 57) 100%)' },
        { id: 'SealBrown', name: 'Seal Brown', hex: '#664D45', gradient: 'radial-gradient(circle, rgb(102, 77, 69) 0%, rgb(71, 54, 46) 100%)' },
        { id: 'ShamrockGreen', name: 'Shamrock Green', hex: '#8AB163', gradient: 'radial-gradient(circle, rgb(138, 177, 99) 0%, rgb(85, 147, 69) 100%)' },
        { id: 'SilverBlue', name: 'Silver Blue', hex: '#80A4B8', gradient: 'radial-gradient(circle, rgb(128, 164, 184) 0%, rgb(96, 124, 145) 100%)' },
        { id: 'SkyBlue', name: 'Sky Blue', hex: '#58B4C8', gradient: 'radial-gradient(circle, rgb(88, 180, 200) 0%, rgb(83, 139, 194) 100%)' },
        { id: 'SteelGrey', name: 'Steel Grey', hex: '#97A2AC', gradient: 'radial-gradient(circle, rgb(151, 162, 172) 0%, rgb(99, 114, 124) 100%)' },
        { id: 'Strawberry', name: 'Strawberry', hex: '#DD8E6F', gradient: 'radial-gradient(circle, rgb(221, 142, 111) 0%, rgb(183, 90, 96) 100%)' },
        { id: 'TacticalPine', name: 'Tactical Pine', hex: '#44826B', gradient: 'radial-gradient(circle, rgb(68, 130, 107) 0%, rgb(47, 99, 105) 100%)' },
        { id: 'Tomato', name: 'Tomato', hex: '#E6793E', gradient: 'radial-gradient(circle, rgb(230, 121, 62) 0%, rgb(212, 78, 63) 100%)' },
        { id: 'Turquoise', name: 'Turquoise', hex: '#5EC0B8', gradient: 'radial-gradient(circle, rgb(94, 192, 184) 0%, rgb(61, 146, 142) 100%)' },
    ];
    window.themesFixedColors = fixedColors;
    let state = {
        page: 1,
        pageSize: 30,
        sortCriteria: 'v2themes',
        v2SubSort: 'count',     
        maxPrice: 5,                     // <-- ПО УМОЛЧАНИЮ 5 TON
        minBgPercent: 80,                // <-- ПО УМОЛЧАНИЮ 80%
        isAscending: false,              // <-- ЗАМЕНИТЬ НА false (От большего к меньшему)
        selectedColor: fixedColors[0], 
        filterText: '',
        isFetching: false,
        hasMore: true,
        openedCollection: null,
        openedCollectionBg: null,
        colorResults: [],
    };

    // --- ДОБАВЛЕННЫЙ БЛОК: МОДАЛКА ПОДПИСКИ ---
    
    // Делаем функцию закрытия глобальной
    window.closeSubscriptionModal = function () {
        const overlay = document.querySelector('.sub-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        }
        
        // Возобновляем анимацию Lottie, если она была на паузе
        const lottie = document.querySelector('lottie-player');
        if (lottie && lottie.play) {
            lottie.play();
        }
    };

    // Делаем функцию открытия глобальной
    window.showSubscriptionModal = function(channelId) {
        // Проверяем, есть ли уже открытое окно
        if (document.querySelector('.sub-modal-overlay')) return;

        const avatarUrl = "../Monohrome/NFTMatchChannel.png";

        const html = `
            <div class="sub-modal-overlay">
                <div class="sub-modal">
                    <div class="sub-avatar-container">
                        <img src="${avatarUrl}" alt="Channel Avatar" class="sub-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
                        <div class="sub-icon-fallback" style="display:none">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                    </div>
                    <h3 class="sub-title">Требуется подписка</h3>
                    <p class="sub-text">Для просмотра результатов необходимо подписаться на наш канал.</p>
                    
                    <a href="https://t.me/NFTstyler" target="_blank" class="sub-btn">
                        Подписаться
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>
                    
                    <button class="sub-btn check-btn" onclick="window.closeSubscriptionModal()">
                        Я подписался
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        
        const overlay = document.querySelector('.sub-modal-overlay');
        setTimeout(() => overlay.classList.add('active'), 10);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) window.closeSubscriptionModal();
        });
    }

    window.showSubscriptionModal = showSubscriptionModal;
    window.closeSubscriptionModal = closeSubscriptionModal;
    // --- КОНЕЦ ДОБАВЛЕННОГО БЛОКА ---

    const gridWrapper = document.getElementById('themes-grid');
    const loadingIndicator = document.getElementById('themes-loading');

    let sentinelObserver = null;
    const sentinelId = 'scroll-sentinel';

    const sortDropdownContainer = document.getElementById('sort-dropdown-container');
    const sortDropdownHeader = document.getElementById('sort-dropdown-header');
    const sortDropdownList = document.getElementById('sort-dropdown-list');
    const sortSelectedValue = document.getElementById('sort-selected-value');

    const directionBtn = document.getElementById('sort-direction-btn');

    const textInputContainer = document.getElementById('text-input-container');
    const textInput = document.getElementById('theme-text-search');
    const colorInputContainer = document.getElementById('color-input-container');

    const colorDropdown = {
        header: document.getElementById('color-dropdown-header'),
        list: document.getElementById('color-dropdown-list'),
        input: document.getElementById('color-search-input'),
        options: document.getElementById('color-list-options'),
        valueLabel: document.getElementById('color-selected-value')
    };

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function getPlural(count, one, few, many) {
        count = Math.abs(count) % 100;
        if (count >= 5 && count <= 20) return many;
        count %= 10;
        if (count === 1) return one;
        if (count >= 2 && count <= 4) return few;
        return many;
    }

    function getApiAuthHeader() {
        try { const initData = sessionStorage.getItem(INIT_DATA_KEY); if (initData) return `Tma ${initData}`; } catch (e) { }
        try { const bypassKey = sessionStorage.getItem(BYPASS_KEY_STORAGE); if (bypassKey) return `Tma ${bypassKey}`; } catch (e) { }
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) return `Tma ${window.Telegram.WebApp.initData}`;
        return 'Tma invalid';
    }

    function showLoading(isInitial = false) {
        if (isInitial) {
            if (gridWrapper) gridWrapper.innerHTML = '';
            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        } else {
            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        }
    }

    function hideLoading() {
        state.isFetching = false;
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    }

    async function secureFetch(url, body) {
        const options = {
            method: body ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': getApiAuthHeader() },
            body: body ? JSON.stringify(body) : null
        };
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return await res.json();
    }

    // --- УПРАВЛЕНИЕ URL И ИСТОРИЕЙ ---

    function updateUrlState(mode = 'replace') {
        const params = new URLSearchParams();

        if (state.sortCriteria !== 'name') params.set('sort', state.sortCriteria);
        if (!state.isAscending) params.set('desc', 'true');
        if (state.filterText) params.set('search', state.filterText);

        if (state.sortCriteria === 'color' && state.selectedColor) {
            params.set('color', state.selectedColor.id || state.selectedColor.name);
        }

        // Если открыта коллекция, добавляем в URL
        if (state.openedCollection) {
            params.set('collection', state.openedCollection);
            if (state.openedCollectionBg) {
                params.set('bg', state.openedCollectionBg);
            }
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;

        if (mode === 'push') {
            window.history.pushState({}, '', newUrl);
        } else {
            window.history.replaceState({}, '', newUrl);
        }
    }

    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="highlight-text">$1</span>');
    }

    // 🔥 УПРАВЛЕНИЕ UI КОНТРОЛЕЙ 🔥
    function updateControlsUI() {
        const isTree = state.sortCriteria === 'v2tree';
        const isV2Themes = state.sortCriteria === 'v2themes';

        const mainFilterBtn = document.getElementById('main-filter-btn');
        const fpV2SortSection = document.getElementById('fp-v2-sort-section');

        // Поиск текста
        if (isTree) {
            textInputContainer.classList.add('hidden');
            removeSentinel();
        } else {
            textInputContainer.classList.remove('hidden');
        }

        // Кнопка направления сортировки
        if (directionBtn) {
            directionBtn.style.display = isTree ? 'none' : '';
            if (state.isAscending) {
                directionBtn.classList.remove('rotated');
                directionBtn.title = "По возрастанию";
            } else {
                directionBtn.classList.add('rotated');
                directionBtn.title = "По убыванию";
            }
        }

        // Кнопка фильтров
        if (mainFilterBtn) {
            // Показываем кнопку фильтров ТОЛЬКО для списка тематик
            mainFilterBtn.classList.toggle('hidden', !isV2Themes);
        }

        if (fpV2SortSection) {
            fpV2SortSection.style.display = isV2Themes ? 'block' : 'none';
        }
    }

    function restoreStateFromUrl() {
        const params = new URLSearchParams(window.location.search);

        // 1. Фильтры
        if (params.has('sort')) state.sortCriteria = params.get('sort');
        if (params.has('desc')) state.isAscending = false;
        if (params.has('search')) {
            state.filterText = params.get('search');
            if (textInput) textInput.value = state.filterText;
        }

        if (params.has('color')) {
            const colorId = params.get('color');
            const colorObj = fixedColors.find(c => c.id === colorId || c.name === colorId);
            if (colorObj) {
                state.sortCriteria = 'color';
                state.selectedColor = colorObj;
                if (colorDropdown.valueLabel) colorDropdown.valueLabel.textContent = colorObj.name;
            }
        }

        if (sortSelectedValue) {
            const map = {
                'v2themes': 'Списком',
                'v2tree': 'Деревом'
            };
            sortSelectedValue.textContent = map[state.sortCriteria] || 'Списком';
        }
        updateControlsUI(); // Теперь функция существует!

        // 2. Модальное окно (Collection)
        const collectionName = params.get('collection') || params.get('theme');
        const bgParam = params.get('bg');

        if (collectionName) {
            // Если в URL есть коллекция, открываем её
            state.openedCollection = collectionName;
            state.openedCollectionBg = bgParam;

            // Если модалка еще не открыта, открываем
            if (window.themesModal && window.themesModal.openCollection) {
                // Небольшая задержка, чтобы UI инициализировался
                setTimeout(() => {
                    window.themesModal.openCollection(collectionName, bgParam);
                }, 100);
            }
        } else {
            // Если коллекции нет в URL, но она была в state (например, нажали назад)
            if (state.openedCollection) {
                closeCollectionModal();
            }
        }
    }

    function closeCollectionModal() {
        state.openedCollection = null;
        state.openedCollectionBg = null;
        if (window.themesModal && window.themesModal.close) {
            // true = keepScrollLock (передаем true, чтобы разблокировать скролл здесь, а не там, если нужно)
            // Но в themes-modal.js close(false) разблокирует скролл.
            window.themesModal.close(false);
        }

        // Восстанавливаем скролл, если был сохранен
        const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);
        if (savedScroll) {
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll));
                sessionStorage.removeItem(SCROLL_STORAGE_KEY);
            }, 50);
        }
    }

    function initTelegramData() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();

            tg.BackButton.show();
            tg.BackButton.offClick(); // Очищаем предыдущие обработчики

            tg.BackButton.onClick(() => {
                // Проверяем, открыта ли модалка
                if (state.openedCollection) {
                    // Если модалка открыта - просто возвращаемся назад по истории браузера
                    // closeCollectionModal() вызовется автоматически через popstate
                    window.history.back();
                } else {
                    // Если модалки нет, идем на главную страницу
                    window.location.href = '../index.html';
                }
            });
        }
    }

    // --- СЛУШАТЕЛЬ ИСТОРИИ (Браузерная кнопка назад) ---
    window.addEventListener('popstate', () => {
        // При изменении истории (нажали назад) восстанавливаем состояние
        restoreStateFromUrl();
    });

    // --- МОНИТОРИНГ ЗАКРЫТИЯ МОДАЛКИ КРЕСТИКОМ ---
    // Так как themes-modal.js управляет DOM, мы следим за исчезновением класса 'modal-open' у body
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isModalOpen = document.body.classList.contains('modal-open');
                // Если модалка закрылась (нет класса), а в URL она есть (state.openedCollection)
                // Значит пользователь закрыл её через "крестик" внутри.
                if (!isModalOpen && state.openedCollection) {
                    state.openedCollection = null;
                    state.openedCollectionBg = null;
                    updateUrlState('replace'); // Обновляем URL (убираем ?collection=...) без пуша в историю

                    // Восстанавливаем скролл
                    const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);
                    if (savedScroll) {
                        window.scrollTo(0, parseInt(savedScroll));
                        sessionStorage.removeItem(SCROLL_STORAGE_KEY);
                    }
                }
            }
        });
    });
    observer.observe(document.body, { attributes: true });


    // --- Infinite Scroll Logic ---

    function ensureSentinel() {
        let sentinel = document.getElementById(sentinelId);
        if (!sentinel) {
            sentinel = document.createElement('div');
            sentinel.id = sentinelId;
            sentinel.style.height = '10px';
            sentinel.style.width = '100%';
            sentinel.style.marginTop = '20px';
            if (gridWrapper) gridWrapper.appendChild(sentinel);
        } else {
            if (gridWrapper && gridWrapper.lastElementChild !== sentinel) {
                gridWrapper.appendChild(sentinel);
            }
        }
        return sentinel;
    }

    function setupIntersectionObserver() {
        if (sentinelObserver) {
            sentinelObserver.disconnect();
            sentinelObserver = null;
        }

        const options = {
            root: null,
            rootMargin: '300px',
            threshold: 0.1
        };

        sentinelObserver = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting && state.hasMore && !state.isFetching && state.sortCriteria !== 'color') {
                if (state.sortCriteria === 'v2themes') {
                    loadV2NamesSorted(false);
                } else if (state.sortCriteria === 'v2tree') {
                    loadV2Tree(false); // <-- Исправлено
                } else {
                    loadV2NamesSorted(false); // <-- Исправлено
                }
            }
        }, options);

        const sentinel = ensureSentinel();
        sentinelObserver.observe(sentinel);
    }

    function removeSentinel() {
        if (sentinelObserver) {
            sentinelObserver.disconnect();
            sentinelObserver = null;
        }
        const s = document.getElementById(sentinelId);
        if (s) s.remove();
    }

    function renderAppendedData(newItems) {
        if (!gridWrapper) return;

        if (newItems.length === 0 && state.page === 1) {
            gridWrapper.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Ничего не найдено</p>';
            return;
        }

        if (state.sortCriteria === 'count') {
            let sectionGrid = gridWrapper.querySelector('.all-themes-grid');
            if (!sectionGrid) {
                const section = document.createElement('div');
                section.className = 'letter-section';
                section.innerHTML = `<div class="letter-header">Все тематики</div>`;
                sectionGrid = document.createElement('div');
                sectionGrid.className = 'themes-page-grid all-themes-grid';
                section.appendChild(sectionGrid);
                gridWrapper.appendChild(section);
            }
            newItems.forEach(item => {
                sectionGrid.appendChild(createThemeCard(item));
            });
        }
        else {
            newItems.forEach(item => {
                const letter = item.CollectionName.charAt(0).toUpperCase();

                const sections = gridWrapper.querySelectorAll('.letter-section');
                const lastRealSection = sections.length > 0 ? sections[sections.length - 1] : null;

                let targetGrid = null;
                if (lastRealSection && lastRealSection.dataset.letter === letter) {
                    targetGrid = lastRealSection.querySelector('.themes-page-grid');
                } else {
                    const section = document.createElement('div');
                    section.className = 'letter-section';
                    section.dataset.letter = letter;
                    section.innerHTML = `<div class="letter-header">${letter}</div>`;

                    targetGrid = document.createElement('div');
                    targetGrid.className = 'themes-page-grid';
                    section.appendChild(targetGrid);

                    const s = document.getElementById(sentinelId);
                    if (s && gridWrapper.contains(s)) {
                        gridWrapper.insertBefore(section, s);
                    } else {
                        gridWrapper.appendChild(section);
                    }
                }

                if (targetGrid) {
                    targetGrid.appendChild(createThemeCard(item));
                }
            });
        }
        ensureSentinel();
    }

    function renderColorMode() {
        gridWrapper.innerHTML = '';
        if (!state.selectedColor) {
            gridWrapper.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">Выберите цвет для подбора</p>';
            return;
        }
        if (state.colorResults.length === 0) {
            gridWrapper.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Ничего не найдено</p>';
            return;
        }

        let sorted = [...state.colorResults];
        if (state.isAscending) sorted.sort((a, b) => b.Score - a.Score);
        else sorted.sort((a, b) => a.Score - b.Score);

        const section = document.createElement('div');
        section.className = 'letter-section';
        section.innerHTML = `<div class="letter-header">Результаты подбора</div>`;
        const innerGrid = document.createElement('div');
        innerGrid.className = 'themes-page-grid';

        sorted.forEach(item => {
            innerGrid.appendChild(createThemeCard(item, true));
        });

        section.appendChild(innerGrid);
        gridWrapper.appendChild(section);
    }

    function createThemeCard(themeData, isColorMatchMode = false) {
        const card = document.createElement('div');
        card.className = 'theme-page-card';

        const averageColorHex = themeData.ClusterAverageColorHex || themeData.GroupColorHex || '#38bdf8';
        let iconBackgroundStyle;

        if (isColorMatchMode && state.selectedColor) {
            iconBackgroundStyle = state.selectedColor.gradient;
        } else {
            iconBackgroundStyle = averageColorHex;
        }

        card.style.setProperty('--glow-color', averageColorHex);
        card.style.setProperty('--theme-color', averageColorHex);

        const title = themeData.CollectionName || themeData.ThemeName;
        const count = themeData.CountGiftsInTheme || themeData.TotalCount || 0;

        const previews = (themeData.TopGifts || themeData.PreviewGifts || []).slice(0, 5);
        const countClass = `items-${previews.length}`;

        let iconsHtml = '';
        previews.forEach((gift, index) => {
            const imgUrl = window.getModelImageUrl ? window.getModelImageUrl(gift.GiftName, gift.ModelName) : `${API_PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;
            iconsHtml += `
                <div class="tpc-icon-box pos-${index}" style="background: ${iconBackgroundStyle};">
                    <img src="${imgUrl}" class="tpc-img" loading="lazy">
                </div>`;
        });

        let typeBadgeHtml = '';
        let subtitleHtml = '';
        let isGroup = (themeData._v2Type || '').toLowerCase() === 'group';
        let isV2 = themeData._v2Type !== undefined;

        if (isV2) {
            if (isGroup) {
                let themesCount = themeData.ChildThemeCount || 0;
                let groupsCount = themeData.ChildGroupCount || 0;
                
                let details = [];
                if (groupsCount > 0) details.push(`${groupsCount} ${getPlural(groupsCount, 'подгруппа', 'подгруппы', 'подгрупп')}`);
                if (themesCount > 0) details.push(`${themesCount} ${getPlural(themesCount, 'подтема', 'подтемы', 'подтем')}`);
                let childText = details.length > 0 ? ` • ${details.join(', ')}` : '';
                
                typeBadgeHtml = `
                    <div style="margin-bottom: 4px;">
                        <span class="v2-type-tag premium-tag v2-group-tag" style="padding:2px 6px; font-size:0.6rem; display:inline-flex;">
                            <svg fill="currentColor" viewBox="0 0 24 24" style="width:10px;height:10px;margin-right:4px;"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>Группа
                        </span>
                    </div>
                `;

                subtitleHtml = `<span class="tpc-count" style="margin-top:0;">${count} шт.${childText}</span>`;
            } else {
                typeBadgeHtml = `
                    <div style="margin-bottom: 4px;">
                        <span class="v2-type-tag v2-theme-tag" style="padding:2px 6px; font-size:0.6rem; display:inline-flex;">
                            <svg fill="currentColor" viewBox="0 0 24 24" style="width:10px;height:10px;margin-right:4px;"><path d="M12 2L2 22h20L12 2zm0 3.8L18.4 19H5.6L12 5.8z"/></svg>Тематика
                        </span>
                    </div>
                `;
                subtitleHtml = `<span class="tpc-count" style="margin-top:0;">${count} шт.</span>`;
            }
        } else {
            subtitleHtml = `<span class="tpc-count">${count} шт.</span>`;
            if (isColorMatchMode && themeData.Score) {
                const percent = Math.round(themeData.Score * 100);
                subtitleHtml += `<div class="tpc-percent-badge">${percent}%</div>`;
            }
        }

        card.innerHTML = `
            <div class="tpc-left-side">
                ${typeBadgeHtml}
                <div class="tpc-title">${title}</div>
                <div class="tpc-meta">${subtitleHtml}</div>
            </div>
            
            <div class="tpc-visuals ${countClass}">
                ${iconsHtml}
            </div>
            
            <div class="tpc-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
            <div class="tpc-glow"></div>
        `;

        card.addEventListener('click', () => {
            // 1. Сохраняем скролл
            sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY);

            // 2. Обновляем состояние и URL (PUSH, чтобы можно было вернуться)
            const collectionName = themeData.CollectionName || themeData.ThemeName;
            let bgParam = null;
            if (isColorMatchMode && state.selectedColor) {
                bgParam = state.selectedColor.name;
            }

            state.openedCollection = collectionName;
            state.openedCollectionBg = bgParam;

            updateUrlState('replace');

            // 3. Открываем модалку
            if (themeData._v2Id !== undefined && themeData._v2Type) {
                if (window.themesModal && window.themesModal.openV2Node) {
                    window.themesModal.openV2Node(themeData._v2Id, themeData._v2Type, false, title);
                }
            } else {
                if (window.themesModal && window.themesModal.openCollection) {
                    window.themesModal.openCollection(collectionName, bgParam);
                }
            }
        });

        return card;
    }

    async function loadThemes(isReset = false) {
        if (state.isFetching) return;
        if (state.sortCriteria === 'color') return;

        if (isReset) {
            state.page = 1;
            state.hasMore = true;
            gridWrapper.innerHTML = '';
        }

        if (!state.hasMore) return;

        state.isFetching = true;
        showLoading(isReset);

        // При фильтрации используем REPLACE (не засоряем историю каждым символом поиска)
        updateUrlState('replace');

        const searchParams = new URLSearchParams({
            page: state.page,
            pageSize: state.pageSize,
            sort: state.sortCriteria,
            desc: !state.isAscending
        });

        if (state.filterText) {
            searchParams.append('search', state.filterText);
        }

        const url = `${SERVER_BASE_URL}/api/Thematic/GetAllCollections/WithParameters?${searchParams.toString()}`;

        try {
            const data = await secureFetch(url);

            if (!data || data.length === 0) {
                state.hasMore = false;
                removeSentinel();
            } else {
                renderAppendedData(data);
                state.page++;

                if (isReset) {
                    setupIntersectionObserver();

                    // Восстановление скролла (если не открыта модалка)
                    const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);
                    if (savedScroll && !state.openedCollection) {
                        setTimeout(() => {
                            window.scrollTo(0, parseInt(savedScroll));
                            sessionStorage.removeItem(SCROLL_STORAGE_KEY);
                        }, 50);
                    }
                }
            }

            if (isReset && (!data || data.length === 0)) {
                gridWrapper.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Ничего не найдено</p>';
            }

            hideLoading();
        } catch (e) {
            console.error('Failed to load themes:', e);
            hideLoading();
            if (isReset && gridWrapper) {
                gridWrapper.innerHTML = `
                    <div style="text-align:center; padding: 20px;">
                        <p style="color:#f87171; margin-bottom: 10px;">Ошибка загрузки данных</p>
                        <button id="retry-btn" style="background:var(--surface-elevated); border:1px solid var(--border-color); color:white; padding:8px 16px; border-radius:8px; cursor:pointer;">Повторить</button>
                    </div>`;
                document.getElementById('retry-btn').onclick = () => loadThemes(true);
            }
        } finally {
            state.isFetching = false;

            if (state.hasMore) {
                const s = document.getElementById(sentinelId);
                if (s) {
                    const rect = s.getBoundingClientRect();
                    if (rect.top < window.innerHeight) {
                        setTimeout(() => loadThemes(false), 100);
                    }
                }
            }
        }
    }

    async function searchByColor(colorData) {
        state.selectedColor = colorData;
        if (colorDropdown.input) {
            colorDropdown.input.value = '';
            colorDropdown.header.classList.remove('value-active');
        }
        toggleColorDropdown(false);

        updateUrlState('replace');

        showLoading(true);
        const url = `${SERVER_BASE_URL}/api/Thematic/FindCollectionsByColor`;

        const requestBody = {
            ColorName: colorData.name,
            MinScore: 0.3
        };

        try {
            const data = await secureFetch(url, requestBody);
            state.colorResults = data;
            hideLoading();
            renderColorMode();
        } catch (e) {
            hideLoading();
            if (gridWrapper) gridWrapper.innerHTML = '<p style="text-align:center; color:#f87171">Ошибка API</p>';
        }
    }

    if (sortDropdownHeader) {
        sortDropdownHeader.addEventListener('click', () => {
            const isHidden = sortDropdownList.classList.contains('hidden');
            if (isHidden) {
                sortDropdownList.classList.remove('hidden');
                sortDropdownHeader.classList.add('open', 'active');
                toggleColorDropdown(false);
            } else {
                sortDropdownList.classList.add('hidden');
                sortDropdownHeader.classList.remove('open', 'active');
            }
        });
    }

    if (sortDropdownList) {
        sortDropdownList.addEventListener('click', (e) => {
            const option = e.target.closest('.list-option');
            if (!option) return;

            const value = option.dataset.value;
            const text = option.textContent;

            state.sortCriteria = value;
            sortSelectedValue.textContent = text;
            sortDropdownList.classList.add('hidden');
            sortDropdownHeader.classList.remove('open', 'active');

            updateControlsUI();
            if (state.sortCriteria === 'v2tree') {
                loadV2Tree(true); // <-- Исправлено
            } else {
                loadV2NamesSorted(true); // <-- Исправлено
            }
        });
    }

    function toggleColorDropdown(show) {
        if (!colorDropdown.list) return;
        if (show) {
            colorDropdown.list.classList.remove('hidden');
            colorDropdown.header.classList.add('open', 'active');
            colorDropdown.input.value = '';
            colorDropdown.input.focus();
            populateColorDropdown(fixedColors);
        } else {
            colorDropdown.list.classList.add('hidden');
            colorDropdown.header.classList.remove('open', 'active');
            if (!state.selectedColor) {
                colorDropdown.valueLabel.textContent = 'Выберите цвет...';
                colorDropdown.header.classList.remove('value-active');
            } else {
                colorDropdown.valueLabel.textContent = state.selectedColor.name;
            }
        }
    }

    function populateColorDropdown(items) {
        if (!colorDropdown.options) return;
        colorDropdown.options.innerHTML = '';
        items.forEach(color => {
            const div = document.createElement('div');
            div.className = 'list-option';
            div.innerHTML = `<div class="color-swatch-mini" style="background:${color.gradient};"></div><span style="font-weight:500;">${color.name}</span>`;
            div.onclick = () => {
                state.selectedColor = color;
                if (colorDropdown.input) {
                    colorDropdown.input.value = '';
                    colorDropdown.header.classList.remove('value-active');
                }
                toggleColorDropdown(false);
                
                // Вызываем функцию отрисовки кружка
                if (typeof updateColorDropdownUI === 'function') updateColorDropdownUI();
                
                updateUrlState('replace');
            };
            colorDropdown.options.appendChild(div);
        });
    }

    if (colorDropdown.header) {
        colorDropdown.header.addEventListener('click', (e) => {
            if (e.target !== colorDropdown.input) {
                const isHidden = colorDropdown.list.classList.contains('hidden');
                toggleColorDropdown(isHidden);
            }
        });
    }

    if (colorDropdown.input) {
        colorDropdown.input.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const filtered = fixedColors.filter(c => c.name.toLowerCase().includes(val));
            populateColorDropdown(filtered);
            if (val.trim() !== '') colorDropdown.header.classList.add('value-active');
            else colorDropdown.header.classList.remove('value-active');
            if (val === '') state.selectedColor = null;
        });

        colorDropdown.input.addEventListener('focus', () => {
            if (colorDropdown.list.classList.contains('hidden')) toggleColorDropdown(true);
        });
    }

    document.addEventListener('click', (e) => {
        if (colorInputContainer && !colorInputContainer.contains(e.target)) {
            if (!colorDropdown.list.classList.contains('hidden')) toggleColorDropdown(false);
        }
        if (sortDropdownContainer && !sortDropdownContainer.contains(e.target)) {
            sortDropdownList.classList.add('hidden');
            sortDropdownHeader.classList.remove('open', 'active');
        }
    });

    if (directionBtn) {
        directionBtn.addEventListener('click', () => {
            state.isAscending = !state.isAscending;
            updateControlsUI();

            if (state.sortCriteria === 'color') {
                renderColorMode();
            } else if (state.sortCriteria === 'v2themes') {
                loadV2NamesSorted(true);
            } else {
                loadThemes(true);
            }
        });
    }

    if (textInput) {
        const debouncedSearch = debounce((text) => {
            state.filterText = text;
            if (state.sortCriteria === 'v2themes') {
                loadV2NamesSorted(true);
            } else {
                loadThemes(true);
            }
        }, 1000);

        textInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }

    // --- V2 ПО ИМЕНИ ---

    async function loadV2NamesSorted(isReset = false) {
        if (isReset) {
            state.page = 1;
            state.hasMore = true;
            const container = document.getElementById('themes-grid');
            if (container) container.innerHTML = '';
            removeSentinel(); // Убираем сентинель перед перезагрузкой
        }

        if (state.isFetching || !state.hasMore) return;
        state.isFetching = true;
        showLoading(isReset);

        try {
            // Базовый URL, используем state.page и !state.isAscending
            let url = `${SERVER_BASE_URL}/api/Thematic/V2/AllNamesSorted?page=${state.page}&pageSize=${state.pageSize}&desc=${!state.isAscending}`;
            
            // Текстовый поиск (в V2 используем state.filterText)
            if (state.filterText) url += `&search=${encodeURIComponent(state.filterText)}`;

            // Логика сортировки (bg, price, count, name)
            if (state.v2SubSort === 'bg' && state.selectedColor) {
                url += `&sort=bg&bgName=${encodeURIComponent(state.selectedColor.name)}&minBgPercent=${state.minBgPercent}`;
            } else {
                url += `&sort=${state.v2SubSort || 'name'}`;
            }

            if (state.maxPrice) url += `&maxPrice=${state.maxPrice}`;

            const response = await fetch(url, {
                headers: { 'Authorization': getApiAuthHeader() }
            });
            const data = await response.json();

            if (data && data.Items) {
                renderV2FlatItems(data.Items); // Вызываем правильную функцию отрисовки
                state.hasMore = data.Page < data.TotalPages;
                state.page++;
                
                if (isReset) setupIntersectionObserver();
            } else {
                state.hasMore = false;
                removeSentinel();
            }
            
            if (isReset && (!data || !data.Items || data.Items.length === 0)) {
                const container = document.getElementById('themes-grid');
                if (container) container.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top: 2rem;">Ничего не найдено</p>';
            }
        } catch (err) {
            console.error("Ошибка загрузки тематик V2:", err);
            if (isReset) {
                const container = document.getElementById('themes-grid');
                if (container) container.innerHTML = '<p style="text-align:center; color:#f87171; margin-top: 2rem;">Ошибка API</p>';
            }
        } finally {
            state.isFetching = false;
            hideLoading();
            if (state.hasMore) ensureSentinel();
        }
    }

    function renderV2FlatItems(items) {
        if (!gridWrapper) return;
        items.forEach(item => {
            let letter;
            // Собираем в общий список для всех сортировок, кроме алфавитной
            if (state.v2SubSort === 'count' || state.v2SubSort === 'median' || state.v2SubSort === 'price' || state.v2SubSort === 'bg') {
                letter = 'СПИСОК ТЕМАТИК';
            } else {
                const itemName = item.Name || item.CollectionName || 'Unknown';
                letter = itemName.charAt(0).toUpperCase();
            }

            const sections = gridWrapper.querySelectorAll('.letter-section');
            const lastSection = sections.length > 0 ? sections[sections.length - 1] : null;

            let targetGrid = null;
            if (lastSection && lastSection.dataset.letter === letter) {
                targetGrid = lastSection.querySelector('.themes-page-grid');
            } else {
                const section = document.createElement('div');
                section.className = 'letter-section';
                section.dataset.letter = letter;
                // Скрываем букву для списка тематик
                if (letter === 'СПИСОК ТЕМАТИК') {
                    section.innerHTML = `<div class="letter-header">Список Тематик</div>`;
                } else {
                    section.innerHTML = `<div class="letter-header">${letter}</div>`;
                }
                targetGrid = document.createElement('div');
                targetGrid.className = 'themes-page-grid';
                section.appendChild(targetGrid);
                const s = document.getElementById(sentinelId);
                if (s && gridWrapper.contains(s)) gridWrapper.insertBefore(section, s);
                else gridWrapper.appendChild(section);
            }
            if (targetGrid) targetGrid.appendChild(createV2Card(item));
        });
        ensureSentinel();
    }

    function createV2Card(itemData) {
        const isGroup = (itemData._v2Type || '').toLowerCase() === 'group';
        const typeLabel = isGroup ? 'Группа' : 'Тематика';
        const typeTagClass = isGroup ? 'v2-group-tag' : 'v2-theme-tag';
        const tagGlowColor = isGroup ? '#6366f1' : '#38bdf8'; 
        
        const folderIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px;margin-right:4px;"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>`;
        const paletteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px;margin-right:4px;"><path fill-rule="evenodd" d="M11.3 1.046A12.014 12.014 0 0010.337 1a10.034 10.034 0 00-6.16 2.053 9.948 9.948 0 00-3.13 6.643c-.024.321-.034.646-.034.975 0 5.485 4.544 9.942 10.151 9.942 2.091 0 4.041-.63 5.672-1.706a1.986 1.986 0 00.864-1.637 1.985 1.985 0 00-1.282-1.854l-2.02-.741a.486.486 0 01-.26-.532l.278-1.57a1.488 1.488 0 00-1.238-1.722l-1.928-.276a.486.486 0 01-.365-.635l.89-2.181a1.488 1.488 0 00-.737-1.862l-1.831-.884a.487.487 0 01-.24-.657l1.01-2.222A1.488 1.488 0 0011.3 1.046zM6.5 7.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm1.5 5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-5.5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clip-rule="evenodd" /></svg>`;
        const typeIcon = isGroup ? folderIcon : paletteIcon;

        const colorHex = itemData.ClusterAverageColorHex || itemData.ThemeColor || '#38bdf8';
        
        // 🔥 БЕЗОПАСНОЕ ЧТЕНИЕ ИМЕНИ ДЛЯ V2 API
        const itemName = itemData.Name || itemData.CollectionName || 'Unknown';
        const title = highlightText(itemName, state.filterText);
        
        const previews = (itemData.TopGifts || itemData.Previews || []).slice(0, 5);
        const countClass = `items-${previews.length}`;

        let iconsHtml = '';
        previews.forEach((gift, index) => {
            const imgUrl = window.getModelImageUrl ? window.getModelImageUrl(gift.GiftName, gift.ModelName) : `${API_PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;
            iconsHtml += `<div class="tpc-icon-box pos-${index}" style="background: ${colorHex};"><img src="${imgUrl}" class="tpc-img" loading="lazy"></div>`;
        });

        const count = itemData.CountGiftsInTheme || itemData.ModelCount || 0;
        const medianPrice = itemData.MedianPrice || 0;
        const affordableCount = itemData.AffordableCount;

        let countLabel = '';
        if (isGroup) {
            const themes = itemData.ChildThemeCount || itemData.childThemeCount || 0;
            const groups = itemData.ChildGroupCount || itemData.childGroupCount || 0;
            let parts = [];
            if (themes > 0) parts.push(`${themes} тем.`);
            if (groups > 0) parts.push(`${groups} гр.`);
            if (parts.length > 0) countLabel = parts.join(' / ');
        } else if (count > 0) {
            countLabel = `${count} шт.`;
        }

        const countTagHtml = countLabel
            ? `<span class="v2-type-tag" style="color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.05);box-shadow:0 2px 8px rgba(0,0,0,0.3);position:static;transform:none;">${countLabel}</span>`
            : '';
            
        let medianTagHtml = '';
        // Показываем цену ТОЛЬКО если выбрана сортировка по цене ('price')
        // Если выбрана сортировка по фону ('bg'), тег будет скрыт.
        if (state.v2SubSort === 'price') {
            if (affordableCount !== undefined && affordableCount !== null) {
                medianTagHtml = `<span class="v2-type-tag" title="До ${state.maxPrice} TON">≤ ${state.maxPrice} T | ${affordableCount} шт.</span>`;
            } else if (medianPrice > 0) {
                const priceStr = medianPrice >= 1 ? `~${medianPrice.toFixed(2)} TON` : `~${(medianPrice * 1000).toFixed(0)} nTON`;
                medianTagHtml = `<span class="v2-type-tag">${priceStr}</span>`;
            }
        }

        let bgTagHtml = '';
        if (itemData.BgMatchCount !== undefined && itemData.BgMatchCount !== null) {
            bgTagHtml = `<span class="v2-type-tag" title="Моделей, подходящих под фон" style="color:#fcd34d;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);position:static;transform:none;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                <svg fill="currentColor" viewBox="0 0 20 20" style="width:10px;height:10px;margin-right:3px;"><path fill-rule="evenodd" d="M10 2a6.005 6.005 0 00-6 6c0 4.314 6 10 6 10s6-5.686 6-10a6.005 6.005 0 00-6-6zM8 8a2 2 0 114 0 2 2 0 01-4 0z" clip-rule="evenodd" /></svg>
                ${itemData.BgMatchCount} совп.
            </span>`;
        }

        const rightTagsHtml = (countTagHtml || medianTagHtml || bgTagHtml) 
            ? `<div style="position:absolute;top:0;right:12px;transform:translateY(-50%);display:flex;gap:6px;z-index:10;">${bgTagHtml}${medianTagHtml}${countTagHtml}</div>` 
            : '';

        const card = document.createElement('div');
        card.className = 'v2-premium-card';
        card.style.setProperty('--glow-color', colorHex);
        card.style.setProperty('--theme-color', colorHex);
        card.innerHTML = `
            <div class="v2-card-bg-container">
                <div class="v2-card-glow"></div>
                <div class="v2-tag-glow" style="--tag-color: ${tagGlowColor};"></div>
            </div>
            <span class="v2-type-tag premium-tag ${typeTagClass}">${typeIcon}${typeLabel}</span>
            ${rightTagsHtml}
            <div class="v2-card-content">
                <div class="v2-card-info"><div class="v2-card-title">${title}</div></div>
                <div class="tpc-visuals ${countClass}">${iconsHtml}</div>
                <div class="v2-card-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></div>
            </div>
        `;

        const clickFn = () => {
            // Безопасно извлекаем ID и тип
            let v2Id = itemData.Id !== undefined ? itemData.Id : (itemData.id !== undefined ? itemData.id : itemData._v2Id);
            let v2Type = itemData.Type || itemData.type || itemData._v2Type || 'Theme';

            // 🔥 НОВАЯ ЛОГИКА: Проверяем, есть ли у тематики одноименная родительская группа
            // В бэкенде такие тематики могут приходить с Type = "Group" благодаря логике isSameNameAsParent,
            // но на всякий случай мы дополнительно ориентируемся на переданные ChildGroupCount или Type.
            if (v2Type === 'Theme' && (itemData.ChildGroupCount > 0 || itemData.ChildThemeCount > 0)) {
                v2Type = 'Group';
            }

            if (v2Id !== undefined && window.themesModal && window.themesModal.openV2Node) {
                sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY);
                
                // ИСПРАВЛЕНИЕ: Передаем цвет фона, ТОЛЬКО если активна вкладка сортировки по фону
                let selectedBg = (state.v2SubSort === 'bg' && state.selectedColor) ? state.selectedColor.name : null;
                
                // Передаем itemName и selectedBg 5-м аргументом
                window.themesModal.openV2Node(v2Id, v2Type, true, itemName, selectedBg);
            } else if (window.themesModal && window.themesModal.openCollection) {
                sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY);
                
                // ИСПРАВЛЕНИЕ: аналогично для обычных коллекций
                let selectedBg = (state.v2SubSort === 'bg' && state.selectedColor) ? state.selectedColor.name : null;
                window.themesModal.openCollection(itemName, selectedBg);
            }
        };
        card.addEventListener('click', clickFn);
        return card;
    }

    // --- V2 ДЕРЕВО ---

    async function loadV2Tree(isReset = true) {
        if (state.isFetching) return;

        if (isReset) {
            state.page = 1;
            state.hasMore = true;
            gridWrapper.innerHTML = '';
            removeSentinel();
        }
        if (!state.hasMore) return;

        state.isFetching = true;
        showLoading(isReset);

        // Запрашиваем КОРЕНЬ (ParentGroupId = null)
        const url = `${SERVER_BASE_URL}/api/Thematic/V2/Layer?page=${state.page}&pageSize=${state.pageSize}`;
        try {
            const data = await secureFetch(url);
            const items = data.Items || data.items || [];

            if (items.length === 0 && isReset) {
                gridWrapper.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top: 2rem;">Дерево пусто</p>';
                state.hasMore = false;
            } else {
                renderLayer(items, gridWrapper, 0); // Рендерим корень
                state.page++;

                const totalPages = data.TotalPages || data.totalPages;
                if (!totalPages || state.page > totalPages) {
                    state.hasMore = false;
                    removeSentinel();
                } else {
                    if (isReset) setupIntersectionObserver();
                }
            }
        } catch (e) {
            console.error('V2 Tree error:', e);
            if (isReset && gridWrapper) gridWrapper.innerHTML = '<p style="color:#f87171; text-align:center; margin-top: 2rem;">Ошибка загрузки дерева</p>';
        } finally {
            state.isFetching = false;
            hideLoading();
            if (state.hasMore) ensureSentinel();
        }
    }

    function renderLayer(nodes, container, depth) {
        nodes.forEach(node => {
            const nodeType = (node.Type || node.type || '').toLowerCase();
            const nodeId = node.Id !== undefined ? node.Id : node.id;
            const nodeName = node.Name || node.name || 'Unknown';
            const nodeColor = node.ThemeColor || node.themeColor || '#38bdf8';
            const nodePreviews = node.Previews || node.previews || [];

            // Если это группа (папка)
            if (nodeType === 'group') {
                const groupWrap = document.createElement('div');
                groupWrap.className = 'tree-group-node';

                const childThemeCount = node.ChildThemeCount || node.childThemeCount || 0;
                const childGroupCount = node.ChildGroupCount || node.childGroupCount || 0;
                
                let subtitleParts = [];
                // 🔥 КОРОТКИЕ НАЗВАНИЯ ДЛЯ ЭКОНОМИИ МЕСТА (т. = тематик, г. = групп)
                if (childThemeCount > 0) subtitleParts.push(`${childThemeCount} тем.`);
                if (childGroupCount > 0) subtitleParts.push(`${childGroupCount} гр.`);
                const subtitle = subtitleParts.join(', ') || 'пусто';

                // Генерируем превью (всегда до 5 штук)
                const previews = nodePreviews.slice(0, 5);
                const countClass = `items-${previews.length}`;
                let iconsHtml = '';
                
                previews.forEach((gift, index) => {
                    const giftName = gift.GiftName || gift.giftName || '';
                    const modelName = gift.ModelName || gift.modelName || '';
                    const itemColor = gift.AverageColorHex || gift.averageColorHex || nodeColor;
                    if (!giftName || !modelName) return;
                    const imgUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
                    iconsHtml += `<div class="tpc-icon-box pos-${index}" style="background: ${itemColor};"><img src="${imgUrl}" class="tpc-img" loading="lazy" onerror="this.style.display='none'"></div>`;
                });

                // Создаем заголовок группы
                const header = document.createElement('div');
                header.className = 'theme-page-card tree-theme-compact tree-group-card';
                header.style.setProperty('--glow-color', nodeColor);
                header.style.setProperty('--theme-color', nodeColor);
                header.innerHTML = `
                    <div class="tree-group-corner-badge">Группа</div>
                    <div class="tpc-left-side">
                        <div class="tpc-title">${nodeName}</div>
                        <div class="tpc-meta"><span class="tpc-count">${subtitle}</span></div>
                    </div>
                    <div class="tpc-visuals ${countClass}">${iconsHtml}</div>
                    <div class="tpc-arrow tree-expand-arrow">
                        <svg class="tree-arrow-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                        <div class="tree-loading-spinner"></div>
                    </div>
                    <div class="tpc-glow"></div>
                `;

                // Контейнер для вложенностей (изначально пустой)
                const childrenWrap = document.createElement('div');
                childrenWrap.className = 'tree-group-children collapsed';
                childrenWrap.dataset.loaded = 'false';

                let isCollapsed = true;
                
                header.addEventListener('click', async () => {
                    // Если пытаемся развернуть и данные еще не загружены
                    if (isCollapsed && childrenWrap.dataset.loaded === 'false') {
                        
                        // 1. Включаем стили загрузки на самой карточке (появится спиннер, карточка подсветится)
                        header.classList.add('is-loading');
                        
                        // 2. Рисуем скелетон под карточкой (как будто там грузятся элементы)
                        childrenWrap.innerHTML = `
                            <div class="tree-skeleton-loader">
                                <div class="skeleton-item">
                                    <div>
                                        <div class="skeleton-text-1"></div>
                                        <div class="skeleton-text-2"></div>
                                    </div>
                                </div>
                                <div class="skeleton-item" style="opacity: 0.7;">
                                    <div>
                                        <div class="skeleton-text-1"></div>
                                        <div class="skeleton-text-2"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // Раскрываем контейнер, чтобы показать скелетон
                        isCollapsed = false;
                        childrenWrap.classList.remove('collapsed');
                        
                        try {
                            const response = await secureFetch(`${SERVER_BASE_URL}/api/Thematic/V2/Layer/${nodeId}?page=1&pageSize=100`);
                            const childrenData = response.Items || response.items || [];
                            
                            childrenWrap.innerHTML = ''; 
                            
                            if (childrenData.length > 0) {
                                renderLayer(childrenData, childrenWrap, depth + 1);
                            } else {
                                childrenWrap.innerHTML = `<div class="tree-empty-hint">Пустая группа</div>`;
                            }
                            childrenWrap.dataset.loaded = 'true';
                            
                        } catch (err) {
                            childrenWrap.innerHTML = `<div class="tree-empty-hint" style="color:#f87171">Ошибка загрузки. Попробуйте еще раз.</div>`;
                            // Если ошибка - сворачиваем обратно
                            isCollapsed = true; 
                            childrenWrap.classList.add('collapsed');
                        } finally {
                            // Выключаем стили загрузки на карточке
                            header.classList.remove('is-loading');
                            
                            // Убеждаемся, что стрелка смотрит куда надо
                            const arrowSvg = header.querySelector('.tree-arrow-svg');
                            if (arrowSvg) arrowSvg.style.transform = isCollapsed ? '' : 'rotate(90deg)';
                        }
                    } else {
                        // Если данные уже загружены, просто переключаем состояние открыть/закрыть
                        isCollapsed = !isCollapsed;
                        childrenWrap.classList.toggle('collapsed', isCollapsed);
                        
                        const arrowSvg = header.querySelector('.tree-arrow-svg');
                        if (arrowSvg) arrowSvg.style.transform = isCollapsed ? '' : 'rotate(90deg)';
                    }
                });

                groupWrap.appendChild(header);
                groupWrap.appendChild(childrenWrap);
                container.appendChild(groupWrap);

            } else if (nodeType === 'theme') {
                // Если это Тематика - создаем обычную карточку-ссылку на модели
                const card = document.createElement('div');
                card.className = 'theme-page-card tree-theme-compact';
                card.style.setProperty('--glow-color', nodeColor);
                card.style.setProperty('--theme-color', nodeColor);

                const previews = nodePreviews.slice(0, 5);
                const countClass = `items-${previews.length}`;

                let iconsHtml = '';
                previews.forEach((gift, index) => {
                    const giftName = gift.GiftName || gift.giftName || '';
                    const modelName = gift.ModelName || gift.modelName || '';
                    const itemColor = gift.AverageColorHex || gift.averageColorHex || nodeColor;
                    if (!giftName || !modelName) return;
                    const imgUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
                    iconsHtml += `<div class="tpc-icon-box pos-${index}" style="background: ${itemColor};"><img src="${imgUrl}" class="tpc-img" loading="lazy" onerror="this.style.display='none'"></div>`;
                });

                const count = node.ModelCount || node.modelCount || 0;

                card.innerHTML = `
                    <div class="tpc-left-side">
                        <div class="tpc-title">${nodeName}</div>
                        <div class="tpc-meta"><span class="tpc-count">${count} мод.</span></div>
                    </div>
                    <div class="tpc-visuals ${countClass}">${iconsHtml}</div>
                    <div class="tpc-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div>
                    <div class="tpc-glow"></div>
                `;

                card.addEventListener('click', () => {
                    sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY);
                    if (window.themesModal && window.themesModal.openV2Node) {
                        // 🔥 Передаем nodeName как 4-й аргумент
                        window.themesModal.openV2Node(nodeId, nodeType, false, nodeName);
                    }
                });

                container.appendChild(card);
            }
        });
    }

    function renderTree(nodes, container, depth) {
        nodes.forEach(node => {
            const nodeType = node.Type || node.type;
            const nodeId = node.Id !== undefined ? node.Id : node.id;
            const nodeName = node.Name || node.name || 'Unknown';
            const nodeWeight = node.Weight || node.weight || 1;
            const nodeColor = (node.ThemeColor || node.themeColor || null);
            const nodePreviews = node.Previews || node.previews || [];
            const nodeChildren = node.Children || node.children || [];
            const tType = (nodeType || '').toLowerCase();

            // Skip standalone themes at root level — only groups at depth=0
            if (depth === 0 && tType === 'theme') return;

            if (tType === 'group') {
                const groupWrap = document.createElement('div');
                groupWrap.className = 'tree-group-node';

                // Accent color from first preview
                const accentColor = nodeColor ||
                    (nodePreviews[0] && (nodePreviews[0].AverageColorHex || nodePreviews[0].averageColorHex)) ||
                    '#38bdf8';

                // Find a child theme with the same name as this group
                const sameNameChild = nodeChildren.find(c =>
                    (c.Type || c.type || '').toLowerCase() === 'theme' &&
                    (c.Name || c.name || '').toLowerCase() === nodeName.toLowerCase()
                );

                // Subtitle: child counts
                const childThemeCount = nodeChildren.filter(c => (c.Type || c.type || '').toLowerCase() === 'theme').length;
                const childGroupCount = nodeChildren.filter(c => (c.Type || c.type || '').toLowerCase() === 'group').length;
                let subtitleParts = [];
                if (childThemeCount > 0) subtitleParts.push(`${childThemeCount} ${getPlural(childThemeCount, 'тематика', 'тематики', 'тематик')}`);
                if (childGroupCount > 0) subtitleParts.push(`${childGroupCount} ${getPlural(childGroupCount, 'группа', 'группы', 'групп')}`);
                const subtitle = subtitleParts.join(', ');

                // Build stacked icons like createV2Card
                const previews = nodePreviews.slice(0, 3);
                const countClass = `items-${previews.length}`;
                let iconsHtml = '';
                previews.forEach((gift, index) => {
                    const giftName = gift.GiftName || gift.giftName || '';
                    const modelName = gift.ModelName || gift.modelName || '';
                    if (!giftName || !modelName) return;
                    const imgUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
                    iconsHtml += `<div class="tpc-icon-box pos-${index}" style="background: ${accentColor};"><img src="${imgUrl}" class="tpc-img" loading="lazy" onerror="this.style.display='none'"></div>`;
                });

                const header = document.createElement('div');
                header.className = 'theme-page-card tree-theme-compact tree-group-card';
                header.style.setProperty('--glow-color', accentColor);
                header.style.setProperty('--theme-color', accentColor);
                header.innerHTML = `
                    <div class="tree-group-corner-badge">Группа</div>
                    <div class="tpc-left-side">
                        <div class="tpc-title">${nodeName}</div>
                        <div class="tpc-meta"><span class="tpc-count">${subtitle || 'группа'}</span></div>
                    </div>
                    <div class="tpc-visuals ${countClass}">${iconsHtml}</div>
                    <div class="tpc-arrow tree-expand-arrow"><svg class="tree-arrow-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div>
                    <div class="tpc-glow"></div>
                `;

                const childrenWrap = document.createElement('div');
                childrenWrap.className = 'tree-group-children collapsed';

                if (nodeChildren.length > 0) {
                    // Sort children: same-name theme first, then rest
                    const sortedChildren = sameNameChild
                        ? [sameNameChild, ...nodeChildren.filter(c => c !== sameNameChild)]
                        : nodeChildren;

                    sortedChildren.forEach(child => {
                        const cType = (child.Type || child.type || '').toLowerCase();
                        const cId = child.Id !== undefined ? child.Id : child.id;
                        const cName = child.Name || child.name || '';
                        const cColor = child.ThemeColor || child.themeColor || null;
                        const cPreviews = child.Previews || child.previews || [];
                        const cChildren = child.Children || child.children || [];

                        if (cType === 'theme') {
                            const cColorHex = cColor ||
                                (cPreviews[0] && (cPreviews[0].AverageColorHex || cPreviews[0].averageColorHex)) ||
                                '#38bdf8';

                            const isSameName = sameNameChild && child === sameNameChild;

                            const card = document.createElement('div');
                            card.className = 'theme-page-card tree-theme-compact';
                            card.style.setProperty('--glow-color', cColorHex);
                            card.style.setProperty('--theme-color', cColorHex);

                            const cPreviews3 = cPreviews.slice(0, 3);
                            const cCountClass = `items-${cPreviews3.length}`;
                            let cIconsHtml = '';
                            cPreviews3.forEach((gift, index) => {
                                const giftName = gift.GiftName || gift.giftName || '';
                                const modelName = gift.ModelName || gift.modelName || '';
                                if (!giftName || !modelName) return;
                                const imgUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
                                cIconsHtml += `<div class="tpc-icon-box pos-${index}" style="background: ${cColorHex};"><img src="${imgUrl}" class="tpc-img" loading="lazy" onerror="this.style.display='none'"></div>`;
                            });

                            card.innerHTML = `
                                <div class="tpc-left-side">
                                    <div class="tpc-title">${cName}</div>
                                    <div class="tpc-meta"><span class="tpc-count">тематика</span></div>
                                </div>
                                <div class="tpc-visuals ${cCountClass}">${cIconsHtml}</div>
                                <div class="tpc-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div>
                                <div class="tpc-glow"></div>
                            `;

                            card.addEventListener('click', () => {
                                sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY);
                                if (window.themesModal && window.themesModal.openV2Node) {
                                    // Same-name theme opens the GROUP (parent), not the theme itself
                                    const openId = isSameName ? nodeId : cId;
                                    const openType = isSameName ? 'Group' : 'Theme';
                                    const openTitle = isSameName ? nodeName : cName; // 🔥 Достаем правильное имя
                                    
                                    // Передаем 4 параметра (id, type, isFlatList=false, title)
                                    window.themesModal.openV2Node(openId, openType, false, openTitle);
                                }
                            });

                            childrenWrap.appendChild(card);
                        } else if (cType === 'group') {
                            // Recurse for nested groups
                            renderTree([child], childrenWrap, depth + 1);
                        }
                    });
                } else {
                    childrenWrap.innerHTML = `<div class="tree-empty-hint">Нет вложенных элементов</div>`;
                }

                let isCollapsed = true;
                header.addEventListener('click', () => {
                    isCollapsed = !isCollapsed;
                    childrenWrap.classList.toggle('collapsed', isCollapsed);
                    const arrow = header.querySelector('.tree-arrow-svg');
                    if (arrow) arrow.style.transform = isCollapsed ? '' : 'rotate(90deg)';
                });

                groupWrap.appendChild(header);
                groupWrap.appendChild(childrenWrap);
                container.appendChild(groupWrap);

            } else if (tType === 'theme') {
                // Use same card style as createV2Card (theme-page-card with stacked icons)
                const colorHex = nodeColor ||
                    (nodePreviews[0] && (nodePreviews[0].AverageColorHex || nodePreviews[0].averageColorHex)) ||
                    '#38bdf8';

                const card = document.createElement('div');
                card.className = 'theme-page-card tree-theme-compact';
                card.style.setProperty('--glow-color', colorHex);
                card.style.setProperty('--theme-color', colorHex);

                const previews = nodePreviews.slice(0, 3);
                const countClass = `items-${previews.length}`;

                let iconsHtml = '';
                previews.forEach((gift, index) => {
                    const giftName = gift.GiftName || gift.giftName || '';
                    const modelName = gift.ModelName || gift.modelName || '';
                    if (!giftName || !modelName) return;
                    const imgUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
                    iconsHtml += `<div class="tpc-icon-box pos-${index}" style="background: ${colorHex};"><img src="${imgUrl}" class="tpc-img" loading="lazy" onerror="this.style.display='none'"></div>`;
                });

                card.innerHTML = `
                    <div class="tpc-left-side">
                        <div class="tpc-title">${nodeName}</div>
                        <div class="tpc-meta"><span class="tpc-count">тематика</span></div>
                    </div>
                    <div class="tpc-visuals ${countClass}">${iconsHtml}</div>
                    <div class="tpc-arrow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div>
                    <div class="tpc-glow"></div>
                `;

                card.addEventListener('click', () => {
                    sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY);
                    if (window.themesModal && window.themesModal.openV2Node) {
                        window.themesModal.openV2Node(nodeId, nodeType);
                    }
                });

                container.appendChild(card);
            }
        });
    }



    // --- ОБРАБОТЧИКИ НОВОГО POPUP ФИЛЬТРА ---
    const mainFilterBtn = document.getElementById('main-filter-btn');
    const mainFilterPopup = document.getElementById('main-filter-popup');
    const fpMaxPrice = document.getElementById('fp-max-price');
    const fpBgPercent = document.getElementById('fp-bg-percent');
    const fpApplyBtn = document.getElementById('fp-apply-btn');
    const fpSegBtns = document.querySelectorAll('.v2-seg-btn');
    const percentDropdownContainer = document.getElementById('percent-dropdown-container');
    const percentDropdownHeader = document.getElementById('percent-dropdown-header');
    const percentDropdownList = document.getElementById('percent-dropdown-list');
    const percentSelectedValue = document.getElementById('percent-selected-value');
    const fpPriceRow = document.getElementById('fp-price-row');
    const fpBgRow = document.getElementById('fp-bg-row');
    const fpColorSection = document.getElementById('fp-color-section');

    // Функция для отрисовки красивого кружка с градиентом
    window.updateColorDropdownUI = function() {
        const label = document.getElementById('color-selected-value');
        if (label) {
            if (state.selectedColor) {
                label.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div class="color-swatch-mini" style="background:${state.selectedColor.gradient}; width:16px; height:16px; border-radius:50%; flex-shrink:0; box-shadow: 0 0 0 1px rgba(255,255,255,0.2);"></div>
                        <span style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${state.selectedColor.name}</span>
                    </div>
                `;
            } else {
                label.textContent = 'Не выбран';
            }
        }
    };

    // Заполнение параметров перед открытием
    function syncPopupWithState() {
        if (fpMaxPrice) fpMaxPrice.value = state.maxPrice || '';
        // Синхронизируем наш новый кастомный дропдаун процентов
        if (percentSelectedValue) percentSelectedValue.textContent = `От ${state.minBgPercent}%`;
        
        updateColorDropdownUI();

        if (fpSegBtns) {
            fpSegBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.sort === state.v2SubSort);
            });
        }
    }

    // Жесткое управление видимостью полей (решает проблему "слетевших стилей")
    function updatePopupFieldsVisibility() {
        if(fpPriceRow) fpPriceRow.classList.add('fp-hidden');
        if(fpBgRow) fpBgRow.classList.add('fp-hidden');
        if(fpColorSection) fpColorSection.classList.add('fp-hidden');

        if (state.sortCriteria === 'v2themes') {
            if (state.v2SubSort === 'price') {
                if(fpPriceRow) fpPriceRow.classList.remove('fp-hidden');
            } else if (state.v2SubSort === 'bg') {
                if(fpBgRow) fpBgRow.classList.remove('fp-hidden');
                if(fpColorSection) fpColorSection.classList.remove('fp-hidden');
            }
        }
    }

    if (mainFilterBtn && mainFilterPopup) {
        mainFilterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = mainFilterPopup.classList.contains('hidden');
            if (isHidden) {
                syncPopupWithState(); // Заполняем дефолтные значения
                updatePopupFieldsVisibility(); // Показываем нужные блоки
                mainFilterPopup.classList.remove('hidden');
                mainFilterBtn.classList.add('active');
            } else {
                mainFilterPopup.classList.add('hidden');
                mainFilterBtn.classList.remove('active');
            }
        });

        mainFilterPopup.addEventListener('click', (e) => { e.stopPropagation(); });

        document.addEventListener('click', (e) => {
            if (!mainFilterPopup.contains(e.target) && !mainFilterBtn.contains(e.target)) {
                mainFilterPopup.classList.add('hidden');
                mainFilterBtn.classList.remove('active');
            }
        });
    }

    if (fpSegBtns) {
        fpSegBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                fpSegBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.v2SubSort = btn.dataset.sort;
                updatePopupFieldsVisibility();
            });
        });
    }

    if (fpApplyBtn) {
        fpApplyBtn.addEventListener('click', () => {
            // Сохраняем цену (если пусто - то пусто, иначе берем число)
            if(fpMaxPrice) state.maxPrice = fpMaxPrice.value ? Number(fpMaxPrice.value) : '';
            
            // state.minBgPercent теперь сохраняется сам при клике на выпадающий список
            
            mainFilterPopup.classList.add('hidden');
            mainFilterBtn.classList.remove('active');

            if (state.sortCriteria === 'color') {
                if (state.selectedColor) searchByColor(state.selectedColor);
            } else if (state.sortCriteria === 'v2themes') {
                loadV2NamesSorted(true);
            }
        });
    }

    // Логика для кастомного выпадающего списка процентов
    if (percentDropdownHeader) {
        percentDropdownHeader.addEventListener('click', (e) => {
            e.stopPropagation(); // чтобы не закрылся сам попап
            const isHidden = percentDropdownList.classList.contains('hidden');
            if (isHidden) {
                percentDropdownList.classList.remove('hidden');
                percentDropdownHeader.classList.add('open', 'active');
            } else {
                percentDropdownList.classList.add('hidden');
                percentDropdownHeader.classList.remove('open', 'active');
            }
        });
    }

    if (percentDropdownList) {
        percentDropdownList.addEventListener('click', (e) => {
            const option = e.target.closest('.list-option');
            if (!option) return;

            const value = parseInt(option.dataset.value);
            const text = option.textContent;

            // Сразу сохраняем в state
            state.minBgPercent = value;
            percentSelectedValue.textContent = text;

            percentDropdownList.classList.add('hidden');
            percentDropdownHeader.classList.remove('open', 'active');
        });
    }

    // Закрытие списка процентов при клике куда-угодно
    document.addEventListener('click', (e) => {
        if (percentDropdownContainer && !percentDropdownContainer.contains(e.target)) {
            if (percentDropdownList && !percentDropdownList.classList.contains('hidden')) {
                percentDropdownList.classList.add('hidden');
                if (percentDropdownHeader) percentDropdownHeader.classList.remove('open', 'active');
            }
        }
    });

    function init() {
        initTelegramData();

        populateColorDropdown(fixedColors);

        // Сначала восстанавливаем фильтры, потом грузим список
        restoreStateFromUrl();

        if (state.sortCriteria === 'color' && state.selectedColor) {
            searchByColor(state.selectedColor);
        } else if (state.sortCriteria === 'v2themes') {
            loadV2NamesSorted(true);
        } else if (state.sortCriteria === 'v2tree') {
            loadV2Tree(true); // <-- Исправлено
        } else {
            loadV2NamesSorted(true); // <-- Исправлено
        }

        if (window.themesModal && window.themesModal.init) {
            window.themesModal.init(SERVER_BASE_URL, API_PHOTO_URL, null, fixedColors);
        }

        // Инициализация для работы модального окна подписки
        window.BASE_URL = SERVER_BASE_URL;
    }

    init();
});