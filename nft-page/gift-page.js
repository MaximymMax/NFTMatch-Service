const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net/';
const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
const API_GIFT_ORIGINALS_URL = 'https://cdn.changes.tg/gifts/originals';
import { initColorPicker } from './ColorPicker/color-picker-modal.js';
import { initNftDetailsModal } from './nft-details-modal.js';
import '../Monohrome/themes-modal.js';
let observerMap = new Map();

const tg = window.Telegram.WebApp;

const GIFT_NAME_TO_ID = {
    "Santa Hat": "5983471780763796287",
    "Signet Ring": "5936085638515261992",
    "Precious Peach": "5933671725160989227",
    "Plush Pepe": "5936013938331222567",
    "Spiced Wine": "5913442287462908725",
    "Jelly Bunny": "5915502858152706668",
    "Durov's Cap": "5915521180483191380",
    "Perfume Bottle": "5913517067138499193",
    "Eternal Rose": "5882125812596999035",
    "Berry Box": "5882252952218894938",
    "Vintage Cigar": "5857140566201991735",
    "Magic Potion": "5846226946928673709",
    "Kissed Frog": "5845776576658015084",
    "Hex Pot": "5825801628657124140",
    "Evil Eye": "5825480571261813595",
    "Sharp Tongue": "5841689550203650524",
    "Trapped Heart": "5841391256135008713",
    "Skull Flower": "5839038009193792264",
    "Scared Cat": "5837059369300132790",
    "Spy Agaric": "5821261908354794038",
    "Homemade Cake": "5783075783622787539",
    "Genie Lamp": "5933531623327795414",
    "Lunar Snake": "6028426950047957932",
    "Party Sparkler": "6003643167683903930",
    "Jester Hat": "5933590374185435592",
    "Witch Hat": "5821384757304362229",
    "Hanging Star": "5915733223018594841",
    "Love Candle": "5915550639663874519",
    "Cookie Heart": "6001538689543439169",
    "Desk Calendar": "5782988952268964995",
    "Jingle Bells": "6001473264306619020",
    "Snow Mittens": "5980789805615678057",
    "Voodoo Doll": "5836780359634649414",
    "Mad Pumpkin": "5841632504448025405",
    "Hypno Lollipop": "5825895989088617224",
    "B-Day Candle": "5782984811920491178",
    "Bunny Muffin": "5935936766358847989",
    "Astral Shard": "5933629604416717361",
    "Flying Broom": "5837063436634161765",
    "Crystal Ball": "5841336413697606412",
    "Eternal Candle": "5821205665758053411",
    "Swiss Watch": "5936043693864651359",
    "Ginger Cookie": "5983484377902875708",
    "Mini Oscar": "5879737836550226478",
    "Lol Pop": "5170594532177215681",
    "Ion Gem": "5843762284240831056",
    "Star Notepad": "5936017773737018241",
    "Loot Bag": "5868659926187901653",
    "Love Potion": "5868348541058942091",
    "Toy Bear": "5868220813026526561",
    "Diamond Ring": "5868503709637411929",
    "Sakura Flower": "5167939598143193218",
    "Sleigh Bell": "5981026247860290310",
    "Top Hat": "5897593557492957738",
    "Record Player": "5856973938650776169",
    "Winter Wreath": "5983259145522906006",
    "Snow Globe": "5981132629905245483",
    "Electric Skull": "5846192273657692751",
    "Tama Gadget": "6023752243218481939",
    "Candy Cane": "6003373314888696650",
    "Neko Helmet": "5933793770951673155",
    "Jack-in-the-Box": "6005659564635063386",
    "Easter Egg": "5773668482394620318",
    "Bonded Ring": "5870661333703197240",
    "Pet Snake": "6023917088358269866",
    "Snake Box": "6023679164349940429",
    "Xmas Stocking": "6003767644426076664",
    "Big Year": "6028283532500009446",
    "Holiday Drink": "6003735372041814769",
    "Gem Signet": "5859442703032386168",
    "Light Sword": "5897581235231785485",
    "Restless Jar": "5870784783948186838",
    "Nail Bracelet": "5870720080265871962",
    "Heroic Helmet": "5895328365971244193",
    "Bow Tie": "5895544372761461960",
    "Heart Locket": "5868455043362980631",
    "Lush Bouquet": "5871002671934079382",
    "Whip Cupcake": "5933543975653737112",
    "Joyful Bundle": "5870862540036113469",
    "Cupid Charm": "5868561433997870501",
    "Valentine Box": "5868595669182186720",
    "Snoop Dogg": "6014591077976114307",
    "Swag Bag": "6012607142387778152",
    "Snoop Cigar": "6012435906336654262",
    "Low Rider": "6014675319464657779",
    "Westside Sign": "6014697240977737490",
    "Stellar Rocket": "6042113507581755979",
    "Jolly Chimp": "6005880141270483700",
    "Moon Pendant": "5998981470310368313",
    "Ionic Dryer": "5933937398953018107",
    "Input Key": "5870972044522291836",
    "Mighty Arm": "5895518353849582541",
    "Artisan Brick": "6005797617768858105",
    "Clover Pin": "5960747083030856414",
    "Sky Stilettos": "5870947077877400011",
    "Fresh Socks": "5895603153683874485",
    "Happy Brownie": "6006064678835323371",
    "Ice Cream": "5900177027566142759",
    "Spring Basket": "5773725897517433693",
    "Instant Ramen": "6005564615793050414",
    "Faith Amulet": "6003456431095808759",
    "Mousse Cake": "5935877878062253519"
};

function setupTelegramBackButton() {
    const tg = window.Telegram.WebApp;
    tg.BackButton.show();
    tg.BackButton.offClick(); // Очистка старых событий

    tg.BackButton.onClick(() => {
        // Если открыта любая модалка — кнопка ТГ на неё НЕ влияет (по вашему ТЗ)
        // Она работает ТОЛЬКО как браузерная навигация между страницами
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '../index.html';
        }
    });
}

// Внутри DOMContentLoaded удалите лишние переопределения onClick:
document.addEventListener('DOMContentLoaded', () => {
    setupTelegramBackButton(); // Вызвать один раз

    // Удалите все блоки вида:
    // tg.BackButton.onClick(() => { window.NFTDetailsModal.close(); });
    // Кнопка ТГ больше не должна закрывать модалки.
});

document.addEventListener('DOMContentLoaded', () => {

    const giftDropdownHeader = document.getElementById('gift-dropdown-header');
    const giftDropdownList = document.getElementById('gift-dropdown-list');
    const giftSearchInput = document.getElementById('gift-search');
    const giftListOptions = document.getElementById('gift-list-options');
    const giftSelectedValue = document.getElementById('gift-selected-value');

    const modelDropdownHeader = document.getElementById('model-dropdown-header');
    const modelDropdownList = document.getElementById('model-dropdown-list');
    const modelSearchInput = document.getElementById('model-search');
    const modelListOptions = document.getElementById('model-list-options');
    const modelSelectedValue = document.getElementById('model-selected-value');

    const detailsContent = document.getElementById('details-content');
    const giftPhoto = document.getElementById('gift-photo');
    const colorsList = document.getElementById('colors-list');
    const changeColorBtn = document.getElementById('change-color-btn');

    const multiSelectHeader = document.getElementById('multi-select-header');
    const multiSelectContent = document.getElementById('multi-select-content');
    const multiGiftSearch = document.getElementById('multi-gift-search');
    const multiListOptions = document.getElementById('multi-list-options');
    const multiSelectedSummary = document.getElementById('multi-selected-summary');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const selectAllBtn = document.getElementById('select-all-btn');

    const submitBtn = document.getElementById('submit-btn');
    const sortSelectDesktop = document.getElementById('sort-order-desktop');
    const sortMobileButton = document.getElementById('sort-mobile-button');
    const sortModalOverlay = document.getElementById('sort-modal-overlay');
    const sortModalOptions = document.getElementById('sort-modal-options');
    const resultsGrid = document.getElementById('results-grid');
    const contentSection = document.getElementById('results-wrapper');

    const giftContainer = document.getElementById('gift-container');
    const modelContainer = document.getElementById('model-container');
    const multiSelectWrapper = document.getElementById('multi-select-wrapper');

    const loadingContainer = document.getElementById('loading-container');
    const nftDetailsModalTitle = document.getElementById('nftDetailsModalTitle');
    let currentAbortController = null;

    const filterControls = document.querySelectorAll('.multi-select-container button, .multi-select-container input');

    const displayModeButton = document.getElementById('display-mode-button');
    const displayModeModalOverlay = document.getElementById('display-mode-modal-overlay');
    const displayModeOptions = document.querySelector('.display-mode-options');

    const displayModeButtonDesktop = document.getElementById('display-mode-button-desktop');

    const multiSelectControls = Array.from(document.querySelectorAll('.multi-select-container button, .multi-select-container input'));
    const mainDropdownHeaders = Array.from(document.querySelectorAll('.custom-dropdown-container .dropdown-header'));

    const INIT_DATA_KEY = 'tgInitData';
    const BYPASS_KEY_STORAGE = 'apiBypassKey';

    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.BackButton.show();

        tg.BackButton.onClick(() => {
            // Проверяем, есть ли история браузера, чтобы вернуться назад
            // history.length > 1 обычно значит, что мы перешли сюда с другой страницы
            if (window.history.length > 1) {
                window.history.back(); // Возвращает на Themes (или Finder) и восстановит там состояние
            } else {
                // Если истории нет (например, открыли по прямой ссылке), идем на главную
                window.location.href = '../index.html';
            }
        });
    }

    async function checkUrlParamsAndOpenModal() {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        const dGift = params.get('d_gift');
        const dModel = params.get('d_model');

        if (view === 'details' && dGift && dModel) {

            const restoredItem = {
                giftName: dGift,
                modelName: dModel,
                imageUrl: `https://cdn.changes.tg/gifts/models/${encodeURIComponent(dGift)}/png/${encodeURIComponent(dModel)}.png`
            };

            if (window.NFTDetailsModal) {
                window.NFTDetailsModal.open(restoredItem);

                if (window.Telegram && window.Telegram.WebApp) {
                    const tg = window.Telegram.WebApp;
                    tg.BackButton.show();
                    tg.BackButton.onClick(() => {
                        window.NFTDetailsModal.close();
                    });
                }
            }
        }
    }

    window.onModalClose = function () {
        updateUrlState(null);

        // ВМЕСТО того, чтобы жестко слать на index.html, 
        // восстанавливаем стандартную логику "Назад по истории"
        setupTelegramBackButton();
    };

    function updateUrlState(modalData = null) {
        const params = new URLSearchParams(window.location.search);

        if (modalData) {
            params.set('view', 'details');
            params.set('d_gift', modalData.giftName);
            params.set('d_model', modalData.modelName);
        } else {
            params.delete('view');
            params.delete('d_gift');
            params.delete('d_model');
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    function getApiAuthHeader() {
        try {
            const initData = sessionStorage.getItem(INIT_DATA_KEY);
            if (initData) return `Tma ${initData}`;
        } catch (e) { }

        try {
            const bypassKey = sessionStorage.getItem(BYPASS_KEY_STORAGE);
            if (bypassKey) return `Tma ${bypassKey}`;
        } catch (e) { }

        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            const directInitData = window.Telegram.WebApp.initData;
            try { sessionStorage.setItem(INIT_DATA_KEY, directInitData); } catch (e) { }
            return `Tma ${directInitData}`;
        }

        return 'Tma invalid';
    }

    const controlsToDisableOnEmpty = [
        sortSelectDesktop,
        sortMobileButton,
        displayModeButton,
        displayModeButtonDesktop
    ].filter(el => el != null);

    let currentDisplayMode = 'top-3';

    const selectedItemsList = document.getElementById('selected-items-list');
    const unselectedItemsList = document.getElementById('unselected-items-list');
    const listDivider = document.getElementById('list-divider')

    let selectedGift = null;
    let selectedModel = null;
    let giftNames = [];
    let modelNames = [];
    let currentMainColors = [];
    let currentColorIndex = 0;
    let selectedMultiItems = new Set();
    let similarNFTsData = [];
    const state = {
        bgFinder: {
            giftTypeId: null, modelId: null,
            targetColors: [],
            activeTargetIndex: 0
        }
    };
    let hasUserModifiedColors = false;
    let colorPickerInstance;
    let nftDetailsModalInstance;
    let observerMap = new Map();


    function selectRandomGifts(count, allGiftNames, currentTargetGift) {
        if (isNaN(count) || count <= 0 || allGiftNames.length === 0) {
            return;
        }

        const availableGifts = allGiftNames.filter(name => name !== currentTargetGift);

        const shuffled = [...availableGifts];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selected = shuffled.slice(0, Math.min(count, shuffled.length));

        selectedMultiItems.clear();
        selected.forEach(name => selectedMultiItems.add(name));
    }

    const lazyLoadCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                observer.unobserve(img);
                img.classList.remove('lazy-load');
                img.src = img.dataset.src;
                img.onload = () => {
                    img.classList.add('loaded');
                };
            }
        });
    };

    function setupLazyLoading(contentElement, scrollRoot, type) {
        if (!contentElement) return;

        const observerKey = scrollRoot || 'viewport';
        let observer = observerMap.get(observerKey);

        if (!observer) {
            const options = {
                root: scrollRoot,
                rootMargin: type === 'list' ? '300px' : '400px'
            };
            observer = new IntersectionObserver(lazyLoadCallback, options);
            observerMap.set(observerKey, observer);
        }

        const lazyImages = contentElement.querySelectorAll('img.lazy-load');
        lazyImages.forEach(img => {
            observer.observe(img);
        });
    }

    function updateListDividerVisibility() {
        const isFiltering = multiGiftSearch.value.trim().length > 0;
        const hasSelected = selectedItemsList.children.length > 0;
        const hasUnselected = unselectedItemsList.children.length > 0;

        if (!isFiltering && hasSelected && hasUnselected) {
            listDivider.classList.remove('hidden');
        } else {
            listDivider.classList.add('hidden');
        }
    }

    function sortList(listElement) {
        const items = Array.from(listElement.children);
        items.sort((a, b) => {
            const textA = a.querySelector('span').textContent.trim();
            const textB = b.querySelector('span').textContent.trim();
            return textA.localeCompare(textB);
        });
        items.forEach(item => listElement.appendChild(item));
    }

    function findAndDisplayBackgrounds() {
        fetchSimilarNFTs();
    }

    function updateTargetColorsDisplay() {
        hasUserModifiedColors = true;
        displayColors(state.bgFinder.targetColors);
    }

    function clearResults() {
        resultsGrid.innerHTML = '';

        similarNFTsData = [];
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
            handleSearchCompletion(true);
        }
    }

    function getCardData(element) {
        const card = element.closest('.result-card');
        if (!card) return null;

        return {
            giftName: card.dataset.giftName,
            modelName: card.dataset.modelName
        };
    }

    function updateControlAvailability() {
        const isGiftSelected = selectedGift && selectedGift.length > 0;
        const isModelSelected = selectedModel && selectedModel.length > 0;

        if (modelDropdownHeader) {
            if (isGiftSelected) {
                modelSelectedValue.textContent = selectedModel || 'Выберите модель';
                if (!selectedModel) {
                    modelSelectedValue.textContent = 'Выберите модель';
                }
            } else {
                selectedModel = null;
                modelSelectedValue.textContent = 'Выберите модель';
                detailsContent.classList.remove('visible');
            }
        }

        if (multiSelectWrapper) {
            if (isModelSelected) {
                multiSelectWrapper.classList.remove('disabled');
            } else {
                multiSelectWrapper.classList.add('disabled');
                if (selectedMultiItems) {
                    selectedMultiItems.clear();
                    updateMultiSelectedSummary();
                    populateMultiSelectDropdown(giftNames);
                }
            }
        }
    }

    function toggleDropdown(listToToggle) {
        const allDropdowns = [
            { list: giftDropdownList, header: giftDropdownHeader, input: giftSearchInput, items: giftNames, type: 'gift' },
            { list: modelDropdownList, header: modelDropdownHeader, input: modelSearchInput, items: modelNames, type: 'model' },
            { list: multiSelectContent, header: multiSelectHeader, input: multiGiftSearch, items: giftNames, type: 'multi' }
        ].filter(item => item.list && item.header);

        allDropdowns.forEach(({ list, header, input, items, type }) => {

            const isClosing = list !== listToToggle || !list.classList.contains('hidden');

            if (isClosing) {
                list.classList.add('hidden');
                header.classList.remove('open', 'value-active');
                list.classList.remove('stretch-dropdown');

                if (input) {
                    input.blur();
                    input.value = '';

                    if (type === 'gift') {
                        const optionsContainer = list.querySelector('#gift-list-options');
                        if (optionsContainer) {
                            populateDropdown(optionsContainer, items, type);
                        }
                    } else if (type === 'model') {
                        if (modelNames.length > 0) {
                            populateDropdown(modelListOptions, modelNames.map(m => m.name), 'model');
                        } else if (!selectedGift) {
                            fetchAllModelNames(null);
                        }
                    } else if (type === 'multi') {
                        multiGiftSearch.value = '';
                        populateMultiSelectDropdown(items);
                    }
                }
            }

            else if (list === listToToggle && list.classList.contains('hidden')) {

                if (type === 'model' && (!selectedGift || selectedGift.trim() === '')) {
                    return;
                }

                if (type !== 'multi') {
                    const headerRect = header.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - headerRect.bottom;

                    const maxHeightStyle = window.getComputedStyle(list).maxHeight;
                    const maxHeight = parseFloat(maxHeightStyle) || Infinity;

                    const listHeight = Math.min(list.scrollHeight, maxHeight);

                    if (spaceBelow < (listHeight + 20)) {
                        list.classList.add('stretch-dropdown');
                    } else {
                        list.classList.remove('stretch-dropdown');
                    }
                }

                list.classList.remove('hidden');
                header.classList.add('open');

                if (type === 'multi') {
                    populateMultiSelectDropdown(items);
                }

                if (input) {
                    setTimeout(() => input.focus(), 50);
                }
            }
        });
    }

    function handleDropdownHeaderClick(e, dropdownList, searchInput) {
        const isDropdownOpen = !dropdownList.classList.contains('hidden');
        const isClickOnSearchInput = e.target === searchInput;

        if (isDropdownOpen) {
            const isMultiSelect = searchInput.id === 'multi-gift-search';

            if (!isMultiSelect && isClickOnSearchInput) {
                return;
            }

            toggleDropdown(dropdownList);
            return;
        }

        toggleDropdown(dropdownList);
    }

    function handleSearch(container, searchText) {
        const isGiftSearch = container === giftListOptions;
        const items = isGiftSearch ? giftNames : modelNames;
        const type = isGiftSearch ? 'gift' : 'model';

        const filtered = items.filter(item => {
            const name = (type === 'model') ? item.name : item;
            return name.toLowerCase().includes(searchText.toLowerCase());
        });

        const itemsToDisplay = (type === 'model') ? filtered.map(m => m.name) : filtered;

        populateDropdown(container, itemsToDisplay, type);
    }

    function createDropdownOption(name, type, isPreload = false) {
        const option = document.createElement('div');
        option.classList.add('list-option');

        const placeholderImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        let imageHtml = '';
        let statusHtml = '';

        const generateImageTag = (url) => {
            if (isPreload) {
                return `<img src="${url}" alt="${name}" class="option-image loaded">`;
            } else {
                return `<img src="${placeholderImg}" data-src="${url}" alt="${name}" class="option-image lazy-load">`;
            }
        };

        if (type === 'gift') {
            const giftId = GIFT_NAME_TO_ID[name];
            if (giftId) {
                const imageUrl = `${API_GIFT_ORIGINALS_URL}/${giftId}/Original.png`;
                imageHtml = generateImageTag(imageUrl);
            }
        } else if (type === 'model' && selectedGift) {
            const imageUrl = `${API_PHOTO_URL}/${encodeURIComponent(selectedGift)}/png/${encodeURIComponent(name)}.png`;
            imageHtml = generateImageTag(imageUrl);

            const modelData = modelNames.find(m => m.name === name);
            if (modelData && modelData.isMonochrome === false) {
                statusHtml = `
                    <div class="monocolor-indicator">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>
                 `;
            }
        }

        option.innerHTML = `
            ${imageHtml}
            <span class="option-text">${name}</span>
            ${statusHtml} 
        `;

        return option;
    }

    function createMultiSelectOption(name, isSelected, isPreload = false) {
        const label = document.createElement('label');
        label.className = 'multi-list-option-label';

        const placeholderImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        let imageHtml = '';
        const giftId = GIFT_NAME_TO_ID[name];

        if (giftId) {
            const imageUrl = `${API_GIFT_ORIGINALS_URL}/${giftId}/Original.png`;
            if (isPreload) {
                imageHtml = `<img src="${imageUrl}" alt="${name}" class="option-image loaded">`;
            } else {
                imageHtml = `<img src="${placeholderImg}" data-src="${imageUrl}" alt="${name}" class="option-image lazy-load">`;
            }
        }

        label.innerHTML = `
            <input type="checkbox" value="${name}" class="multi-select-checkbox" ${isSelected ? 'checked' : ''}>
            ${imageHtml}
            <span>${name}</span>
        `;
        return label;
    }

    function handleSearchCompletion(wasCancelled) {
        const controlsWithDisabledAttr = [sortSelectDesktop, submitBtn];
        const controlsWithDisabledClass = [sortMobileButton, displayModeButton, displayModeButtonDesktop, ...mainDropdownHeaders, ...multiSelectControls];

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Поиск NFT</span>
            `;
        }

        controlsWithDisabledClass.forEach(control => {
            if (control) { control.classList.remove('disabled-control'); }
        });

        controlsWithDisabledAttr.forEach(control => {
            if (control) { control.disabled = false; }
        });

        currentAbortController = null;

        loadingContainer.classList.add('hidden');
        loadingContainer.innerHTML = '';
        resultsGrid.classList.remove('hidden');

        if (wasCancelled) {

            resultsGrid.innerHTML = '';
        }
    }

    function toggleSortAndDisplayControls(enable = true) {
        const controls = [sortSelectDesktop, sortMobileButton, displayModeButton, displayModeButtonDesktop].filter(el => el);
        controls.forEach(control => {
            if (enable) {
                control.disabled = false;
                control.classList.remove('disabled-control');
            } else {
                control.disabled = true;
                control.classList.add('disabled-control');
            }
        });
    }

    async function fetchSimilarNFTs() {
        updateSearchUrlState();

        const controlsWithDisabledAttr = [sortSelectDesktop, submitBtn];
        const controlsWithDisabledClass = [sortMobileButton, displayModeButton, displayModeButtonDesktop, ...mainDropdownHeaders, ...multiSelectControls];

        const currentColors = state.bgFinder.targetColors.slice(0, 3).map(c => c.hex.toUpperCase());

        if (currentColors.length === 0 || selectedMultiItems.size === 0) {
            if (!selectedGift || !selectedModel || selectedMultiItems.size === 0) {
                return;
            }
        }

        if (currentAbortController) {
            currentAbortController.abort();
        }
        currentAbortController = new AbortController();
        const signal = currentAbortController.signal;

        resultsGrid.innerHTML = '';
        resultsGrid.classList.add('hidden');
        loadingContainer.classList.remove('hidden');

        loadingContainer.innerHTML = `
            <div class="col-span-full loading-indicator">
                <p style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <span class="spinner"></span> 
                    Анализ схожести. Пожалуйста, подождите...
                </p>
                <button id="cancel-search-btn" class="cancel-search-btn">Отменить поиск</button>
            </div>
        `;

        controlsWithDisabledAttr.forEach(control => { if (control) control.disabled = true; });
        controlsWithDisabledClass.forEach(control => { if (control) control.classList.add('disabled-control'); });

        if (submitBtn) {
            submitBtn.innerHTML = '<span class="spinner"></span> <span>Идет поиск NFT...</span>';
        }

        const cancelBtnElement = document.getElementById('cancel-search-btn');
        if (cancelBtnElement) {
            cancelBtnElement.addEventListener('click', () => {
                if (currentAbortController) {
                    currentAbortController.abort();
                    handleSearchCompletion(true);
                }
            });
        }

        const getTelegramUserData = () => {
            let masterUserData = null;
            try {
                const cachedUserData = sessionStorage.getItem('tgUser');
                if (cachedUserData) masterUserData = JSON.parse(cachedUserData);
            } catch (e) { }

            if (!masterUserData) {
                const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
                if (tgUser) {
                    masterUserData = { telegramId: tgUser.id, username: tgUser.username || null };
                    try {
                        const dataToSave = { ...masterUserData, telegramId: parseInt(tgUser.id, 10) };
                        sessionStorage.setItem('tgUser', JSON.stringify(dataToSave));
                    } catch (e) { }
                }
            }

            if (masterUserData) {
                let numericId = null;
                if (masterUserData.telegramId !== null && masterUserData.telegramId !== undefined) {
                    numericId = parseInt(masterUserData.telegramId, 10);
                    if (isNaN(numericId)) numericId = null;
                }
                return { id: numericId, Username: masterUserData.username };
            }
            return { id: null, Username: null };
        };

        const userData = getTelegramUserData();

        let requestColors = [];
        let requestTargetGift = null;
        let requestTargetModel = null;

        if (hasUserModifiedColors) {
            requestColors = currentColors;
            requestTargetGift = null;
            requestTargetModel = null;
        } else {
            requestColors = [];
            requestTargetGift = selectedGift;
            requestTargetModel = selectedModel;
        }

        const requestBody = {
            ...userData,
            "Colors": requestColors,
            "NameTargetGift": requestTargetGift,
            "NameTargetModel": requestTargetModel,
            "NamesGift": Array.from(selectedMultiItems),
            "MonohromeModelsOnly": true
        };

        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/MonoCoof/SimilarNFTs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getApiAuthHeader()
                },
                body: JSON.stringify(requestBody),
                signal: signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const dataObject = await response.json();
            similarNFTsData = [];

            if (dataObject && typeof dataObject === 'object') {
                Object.entries(dataObject).forEach(([giftName, result]) => {

                    if (!result || !result.SimilarModels || result.SimilarModels.length < 3 || !result.AverageColor) {
                        return;
                    }

                    let rawCount = (result.Count !== undefined && result.Count !== null) ? result.Count : result.count;
                    const countVal = parseInt(rawCount, 10);
                    const finalCount = isNaN(countVal) ? 0 : countVal;

                    const modelsArray = result.SimilarModels;
                    const colorInput = result.AverageColor;

                    let r, g, b;

                    if (Array.isArray(colorInput)) {
                        [r, g, b] = colorInput;
                    } else if (typeof colorInput === 'string') {
                        const parts = colorInput.split(',').map(c => parseInt(c.trim(), 10));
                        [r, g, b] = parts;
                    } else if (typeof colorInput === 'object' && colorInput !== null) {
                        r = colorInput.R !== undefined ? colorInput.R : colorInput.r;
                        g = colorInput.G !== undefined ? colorInput.G : colorInput.g;
                        b = colorInput.B !== undefined ? colorInput.B : colorInput.b;
                    }

                    if (isNaN(r) || isNaN(g) || isNaN(b) || r === undefined) {
                        return;
                    }

                    const colorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

                    const model1 = modelsArray[0];
                    const model2 = modelsArray[1];
                    const model3 = modelsArray[2];

                    similarNFTsData.push({
                        giftName: giftName,
                        coefficient: model1.Value,
                        colorHex: colorHex,
                        count: finalCount,
                        model1Name: model1.Key,
                        model2Name: model2.Key,
                        model3Name: model3.Key
                    });
                });
            }

            if (similarNFTsData.length === 0) {
                resultsGrid.innerHTML = '<p class="col-span-full text-center text-muted" style="padding: 2rem;">Подходящих NFT не найдено.</p>';
            } else {
                renderResults();
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }
            resultsGrid.innerHTML = `<p class="col-span-full text-center text-danger" style="padding: 2rem;">Не удалось загрузить данные. Попробуйте снова. (${error.message})</p>`;
        } finally {
            handleSearchCompletion(false);
        }
    }

    function updateSubmitButtonState() {
        const isReadyForSearch = selectedGift && selectedModel && selectedMultiItems.size > 0;

        if (submitBtn) {
            submitBtn.disabled = !isReadyForSearch;

            if (!isReadyForSearch) {
                submitBtn.classList.add('disabled-button');
            } else {
                submitBtn.classList.remove('disabled-button');
            }
        }
    }

    function populateDropdown(container, items, type) {
        container.innerHTML = '';
        const PRELOAD_COUNT = 15;

        items.forEach((item, index) => {
            const isPreload = index < PRELOAD_COUNT;
            const option = createDropdownOption(item, type, isPreload);
            container.appendChild(option);
        });

        setupLazyLoading(container, container.parentElement, 'list');
    }

    function populateMultiSelectDropdown(allItems) {
        selectedItemsList.innerHTML = '';
        unselectedItemsList.innerHTML = '';

        const filterText = multiGiftSearch.value.toLowerCase().trim();
        const PRELOAD_COUNT = 15;

        const filteredItems = allItems.filter(name => {
            return name.toLowerCase().includes(filterText);
        });

        const selectedItems = filteredItems.filter(item => selectedMultiItems.has(item));
        const unselectedItems = filteredItems.filter(item => !selectedMultiItems.has(item));

        selectedItems.sort((a, b) => a.localeCompare(b));
        unselectedItems.sort((a, b) => a.localeCompare(b));

        selectedItems.forEach((item, index) => {
            const option = createMultiSelectOption(item, true, index < PRELOAD_COUNT);
            selectedItemsList.appendChild(option);
        });
        unselectedItems.forEach((item, index) => {
            const option = createMultiSelectOption(item, false, index < PRELOAD_COUNT);
            unselectedItemsList.appendChild(option);
        });

        const isFiltering = filterText.length > 0;

        if (!isFiltering && selectedItems.length > 0 && unselectedItems.length > 0) {
            listDivider.classList.remove('hidden');
        } else {
            listDivider.classList.add('hidden');
        }

        updateMultiSelectedSummary();

        const scrollWrapper = multiListOptions.closest('.multi-list-scroll-wrapper');
        setupLazyLoading(multiListOptions, scrollWrapper, 'list');
    }

    async function showDetails(giftName, modelName) {
        const photoUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
        giftPhoto.src = photoUrl;

        detailsContent.classList.add('visible');
        if (selectedMultiItems.size > 0) {
            submitBtn.classList.remove('hidden');
        }

        const monocolorAlertWrapper = document.getElementById('monocolor-alert-wrapper');
        const modelData = modelNames.find(m => m.name === modelName);

        if (modelData && modelData.isMonochrome === false) {
            monocolorAlertWrapper.innerHTML = `
                <div class="monocolor-alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    Модель не является одноцветной
                </div>
             `;
        } else {
            monocolorAlertWrapper.innerHTML = '';
        }

        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            tempImg.onload = async () => {
                const naturalWidth = tempImg.naturalWidth;
                const naturalHeight = tempImg.naturalHeight;

                const colors = await fetchAndParseMainColors(giftName, modelName);

                currentMainColors = colors;
                currentColorIndex = 0;

                state.bgFinder.targetColors = [];

                state.bgFinder.targetColors = colors.map(c => ({
                    hex: c.hex,
                    x: (c.x / naturalWidth) * 100,
                    y: (c.y / naturalHeight) * 100
                }));

                hasUserModifiedColors = false;

                displayColors(state.bgFinder.targetColors);

                if (currentMainColors.length > 1) {
                    changeColorBtn.classList.remove('hidden');
                } else {
                    changeColorBtn.classList.add('hidden');
                }

                resolve();
            };

            tempImg.onerror = (err) => {
                console.error("Ошибка загрузки изображения для showDetails", err);
                reject(err);
            };

            tempImg.src = photoUrl;
        });
    }

    function displayColors(colors) {
        colorsList.innerHTML = '';
        if (colors.length === 0) {
            colorsList.innerHTML = '<p class="placeholder-text">Цвета не найдены</p>';
            return;
        }

        colors.forEach(color => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.innerHTML = `
                <div class="color-square" style="background-color: ${color.hex}"></div>
                <span>${color.hex}</span>
            `;
            colorsList.appendChild(colorItem);
        });
    }

    function updateMultiSelectedSummary() {
        const count = selectedMultiItems.size;
        if (count === 0) {
            multiSelectedSummary.textContent = 'Выберите набор коллекций';
            submitBtn.classList.add('hidden');
        } else {
            multiSelectedSummary.textContent = `Выбрано (${count})`;
            if (selectedGift && selectedModel) {
                submitBtn.classList.remove('hidden');
            }
        }
    }

    function updateSearchUrlState() {
        const params = new URLSearchParams(window.location.search);

        if (selectedGift) params.set('giftName', selectedGift);
        if (selectedModel) params.set('modelName', selectedModel);

        // ИСПРАВЛЕНИЕ: Вместо списка имен сохраняем только количество
        if (selectedMultiItems.size > 0) {
            params.set('randomGiftsCount', selectedMultiItems.size);
            params.delete('targets'); // Удаляем длинный список, если он там был
        } else {
            params.delete('randomGiftsCount');
            params.delete('targets');
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    function renderResults() {
        if (!Array.isArray(similarNFTsData) || similarNFTsData.length === 0) {
            resultsGrid.innerHTML = '<p class="col-span-full text-center text-muted" style="padding: 2rem;">Подходящих NFT не найдено.</p>';
            toggleSortAndDisplayControls(false);
            return;
        }

        const fragment = document.createDocumentFragment();

        toggleSortAndDisplayControls(true);

        const currentMode = currentDisplayMode;

        resultsGrid.classList.remove('grid-top-1', 'grid-top-3');
        resultsGrid.classList.add(`grid-${currentMode}`);

        const sortElement = sortSelectDesktop || { value: 'percent-desc' };
        const sortValue = sortElement.value;

        let sortedData = [...similarNFTsData];

        if (sortValue === 'percent-desc') {
            sortedData.sort((a, b) => b.coefficient - a.coefficient);
        } else if (sortValue === 'count-desc') {
            sortedData.sort((a, b) => b.count - a.count);
        } else if (sortValue === 'count-asc') {
            sortedData.sort((a, b) => a.count - b.count);
        } else {
            sortedData.sort((a, b) => {
                const nameA = `${a.giftName} - ${a.model1Name}`;
                return nameA.localeCompare(b.model1Name);
            });
        }

        function formatCountShort(num) {
            const n = parseInt(num, 10);
            if (isNaN(n) || n <= 0) return '0';
            if (n >= 1000) {
                return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'к';
            }
            return n.toString();
        }

        resultsGrid.innerHTML = '';

        sortedData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'result-card modern-card';

            card.dataset.giftName = item.giftName;
            card.dataset.modelName = item.model1Name;

            const url1 = `${API_PHOTO_URL}/${encodeURIComponent(item.giftName)}/png/${encodeURIComponent(item.model1Name)}.png`;
            const url2 = `${API_PHOTO_URL}/${encodeURIComponent(item.giftName)}/png/${encodeURIComponent(item.model2Name)}.png`;
            const url3 = `${API_PHOTO_URL}/${encodeURIComponent(item.giftName)}/png/${encodeURIComponent(item.model3Name)}.png`;

            const coefficient = (item.coefficient * 100).toFixed(1);
            const gradientColor = item.colorHex || '#283754';
            const countText = formatCountShort(item.count);

            let imageContent = '';

            if (currentMode === 'top-1') {
                imageContent = `<img data-src="${url1}" alt="${item.model1Name}" class="card-model-main model-single lazy-load">`;
            } else {
                imageContent = `
                    <img data-src="${url1}" alt="${item.model1Name}" class="card-model-main lazy-load">
                    <img data-src="${url2}" alt="${item.model2Name}" class="card-model-side model-left lazy-load">
                    <img data-src="${url3}" alt="${item.model3Name}" class="card-model-side model-right lazy-load">
                 `;
            }

            const bgStyle = `background: linear-gradient(180deg, ${gradientColor} -10%, rgba(30, 41, 68, 0) 70%), #1e2944;`;

            card.innerHTML = `
                <div class="card-visual-wrapper" style="${bgStyle}">
                    <div class="card-header-zone">
                        <div class="card-top-title">${item.giftName}</div>
                    </div>
                    <div class="card-image-zone">
                        ${imageContent}
                    </div>
                    <div class="card-bottom-info">
                        <div class="percent-big">${coefficient}%</div>
                        <div class="count-small">${countText} шт</div>
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                const cardGiftName = e.currentTarget.dataset.giftName;
                const cardModelName = e.currentTarget.dataset.modelName;
                const targetGiftNameFromMain = selectedGift;
                const targetModelNameFromMain = selectedModel;
                const currentTargetColors = state.bgFinder.targetColors.map(c => c.hex);

                if (cardGiftName && nftDetailsModalInstance && targetGiftNameFromMain && targetModelNameFromMain) {
                    nftDetailsModalInstance.openNftDetailsModal(
                        cardGiftName,
                        cardModelName,
                        targetGiftNameFromMain,
                        targetModelNameFromMain,
                        currentTargetColors
                    );
                }
            });

            resultsGrid.appendChild(card);
            fragment.appendChild(card);
        });
        requestAnimationFrame(() => {
            resultsGrid.innerHTML = '';
            resultsGrid.appendChild(fragment);
            setupLazyLoading(resultsGrid, null, 'grid');
        });
    }

    giftDropdownHeader.addEventListener('click', (e) => {
        handleDropdownHeaderClick(e, giftDropdownList, giftSearchInput);
    });

    modelDropdownHeader.addEventListener('click', (e) => {
        const isGiftSelected = selectedGift && selectedGift.length > 0;

        if (!isGiftSelected) {
            return;
        }

        handleDropdownHeaderClick(e, modelDropdownList, modelSearchInput);
    });

    [giftSearchInput, modelSearchInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                const header = input.closest('.dropdown-header');
                const isGift = input.id === 'gift-search';
                const container = isGift ? giftListOptions : modelListOptions;
                const items = isGift ? giftNames : modelNames;
                const type = isGift ? 'gift' : 'model';

                if (input.value.trim() !== '') {
                    header.classList.add('value-active');
                } else {
                    const namesToDisplay = isGift ? items : items.map(m => m.name);

                    populateDropdown(container, namesToDisplay, type);

                    header.classList.remove('value-active');
                }

                if (input.value.trim() !== '') {
                    handleSearch(container, input.value);
                }
            });
        }
    });

    giftListOptions.addEventListener('click', (e) => {
        const listItem = e.target.closest('.list-option');

        if (listItem) {
            const selectedItem = listItem.querySelector('.option-text').textContent.trim();

            giftSelectedValue.textContent = selectedItem;
            selectedGift = selectedItem;
            selectedModel = null;

            giftSearchInput.value = '';
            giftDropdownHeader.classList.remove('value-active');
            giftDropdownHeader.classList.remove('open');

            modelSelectedValue.textContent = 'Выберите модель';
            detailsContent.classList.remove('visible');
            submitBtn.classList.add('hidden');
            toggleDropdown(null);

            fetchAllModelNames(selectedGift);

            clearResults();

            updateControlAvailability();
            updateSubmitButtonState();
        }
    });

    modelListOptions.addEventListener('click', (e) => {
        const listItem = e.target.closest('.list-option');

        if (listItem) {
            if (listItem.classList.contains('list-placeholder')) {
                toggleDropdown(modelDropdownHeader);
                return;
            }

            const selectedItem = listItem.querySelector('.option-text').textContent.trim();

            modelSelectedValue.textContent = selectedItem;
            selectedModel = selectedItem;
            modelSearchInput.value = '';
            modelDropdownHeader.classList.remove('value-active');
            modelDropdownHeader.classList.remove('open');

            toggleDropdown(null);

            showDetails(selectedGift, selectedModel);

            clearResults();

            updateControlAvailability();
            updateSubmitButtonState();
        }
    });

    multiSelectHeader.addEventListener('click', (e) => {
        handleDropdownHeaderClick(e, multiSelectContent, multiGiftSearch);
    });

    giftSearchInput.addEventListener('input', () => {
        const searchText = giftSearchInput.value.toLowerCase();
        const filtered = giftNames.filter(name => name.toLowerCase().includes(searchText));
        populateDropdown(giftListOptions, filtered, 'gift');
    });

    multiGiftSearch.addEventListener('input', () => {
        populateMultiSelectDropdown(giftNames);
    });

    multiListOptions.addEventListener('change', (e) => {
        if (e.target.classList.contains('multi-select-checkbox')) {
            const checkbox = e.target;
            const value = checkbox.value;
            const isChecked = checkbox.checked;

            if (isChecked) {
                selectedMultiItems.add(value);
            } else {
                selectedMultiItems.delete(value);
            }

            const isFiltering = multiGiftSearch.value.trim().length > 0;

            if (isFiltering) {
                populateMultiSelectDropdown(giftNames);
            } else {
                const labelElement = checkbox.closest('.multi-list-option-label');
                if (labelElement) {
                    if (isChecked) {
                        selectedItemsList.appendChild(labelElement);
                        sortList(selectedItemsList);
                    } else {
                        unselectedItemsList.appendChild(labelElement);
                        sortList(unselectedItemsList);
                    }
                }
            }

            updateMultiSelectedSummary();
            updateSubmitButtonState();
            updateListDividerVisibility();

            checkbox.blur();
        }
    });

    clearAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedMultiItems.clear();
        populateMultiSelectDropdown(giftNames);
        updateSubmitButtonState();
    });

    selectAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        giftNames.forEach(item => selectedMultiItems.add(item));
        populateMultiSelectDropdown(giftNames);
        updateSubmitButtonState();
    });

    if (sortSelectDesktop) {
        sortSelectDesktop.addEventListener('change', renderResults);
    }

    if (sortSelectDesktop) {
        sortSelectDesktop.addEventListener('change', renderResults);
    }

    if (sortMobileButton) {
        sortMobileButton.addEventListener('click', () => {
            sortModalOverlay.classList.remove('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        const isClickedOutsideDropdowns = !e.target.closest('.custom-dropdown-container') && !e.target.closest('.multi-select-container');

        const isClickedInsideSortModal = e.target.closest('.sort-modal');
        const isClickedInsideDisplayModal = e.target.closest('.display-mode-modal');

        const isModalActive = !sortModalOverlay.classList.contains('hidden') || !displayModeModalOverlay.classList.contains('hidden');

        if (isClickedOutsideDropdowns) {
            toggleDropdown(null);
        }

        if (!isClickedInsideSortModal && e.target === sortModalOverlay) {
            sortModalOverlay.classList.add('hidden');
        }
        if (!isClickedInsideDisplayModal && e.target === displayModeModalOverlay) {
            displayModeModalOverlay.classList.add('hidden');
        }

    });

    async function fetchAllGiftNames() {
        const cacheKey = 'giftNamesCache';

        try {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                giftNames = JSON.parse(cachedData);
                populateDropdown(giftListOptions, giftNames, 'gift');
                populateMultiSelectDropdown(giftNames);
                return;
            }
        } catch (error) {
            sessionStorage.removeItem(cacheKey);
        }

        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/ListGifts/AllGiftNames`, {
                headers: { 'Authorization': getApiAuthHeader() }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            giftNames = await response.json();

            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(giftNames));
            } catch (error) {
            }

            populateDropdown(giftListOptions, giftNames, 'gift');
            populateMultiSelectDropdown(giftNames);
        } catch (error) {
            console.error('Ошибка при загрузке названий подарков с сервера:', error);
        }
    }

    async function fetchAllModelNames(giftName) {

        if (!giftName || giftName.trim() === '') {
            const placeholderHTML = `<li class="list-option list-placeholder"><span class="option-text">Сначала выберите подарок</span></li>`;
            modelListOptions.innerHTML = placeholderHTML;

            modelNames = [];

            if (modelDropdownHeader.classList.contains('open')) {
                toggleDropdown(modelDropdownHeader);
            }
            return;
        }

        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/AllModelNames`, {
                headers: { 'Authorization': getApiAuthHeader() }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const modelsList = await response.json();

            modelNames = modelsList.map(item => ({
                name: item.NameModel,
                isMonochrome: item.IsMonochrome
            }));

            populateDropdown(modelListOptions, modelNames.map(m => m.name), 'model');

        } catch (error) {
            console.error(`Ошибка при загрузке моделей для ${giftName}:`, error);
            modelNames = [];
            modelSelectedValue.textContent = 'Выберите модель';
            const placeholderHTML = `<li class="list-option list-placeholder"><span class="option-text">Модели не найдены</span></li>`;
            modelListOptions.innerHTML = placeholderHTML;
        }
    }

    async function fetchAndParseMainColors(giftName, modelName) {
        let mainColorsData = [];
        try {
            const colorsResponse = await fetch(`${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/MainColors`, {
                headers: { 'Authorization': getApiAuthHeader() }
            });
            if (!colorsResponse.ok) {
                throw new Error(`Ошибка HTTP при получении основных цветов: ${colorsResponse.status} ${colorsResponse.statusText}`);
            }
            const colorsString = await colorsResponse.text();
            if (colorsString) {
                const cleanedString = colorsString.trim().replace(/^['"]|['"]$/g, '');
                mainColorsData = cleanedString.split(';').map(item => {
                    const trimmedItem = item.trim();
                    if (!trimmedItem) return null;
                    const parts = trimmedItem.split(':');
                    if (parts.length !== 2) {
                        return null;
                    }
                    const posPart = parts[0];
                    const hexPart = parts[1];
                    const xMatch = posPart.match(/X=(\d+)/);
                    const yMatch = posPart.match(/Y=(\d+)/);
                    const x = xMatch ? parseInt(xMatch[1], 10) : 0;
                    const y = yMatch ? parseInt(yMatch[1], 10) : 0;
                    const hex = '#' + hexPart;
                    return { x, y, hex };
                }).filter(item => item !== null);
            }
            return mainColorsData;
        } catch (error) {
            console.error('Ошибка при загрузке основных цветов модели:', error);
            return [];
        }
    }

    fetchAllGiftNames();

    async function initPage() {
        colorPickerInstance = initColorPicker({
            state: state,
            fetchAndParseMainColors: fetchAndParseMainColors,
            findAndDisplayBackgrounds: findAndDisplayBackgrounds,
            updateTargetColorsDisplay: updateTargetColorsDisplay,
            API_PHOTO_URL: API_PHOTO_URL,
        });

        nftDetailsModalInstance = initNftDetailsModal();

        if (changeColorBtn) {
            changeColorBtn.addEventListener('click', () => {
                state.bgFinder.giftTypeId = selectedGift;
                state.bgFinder.modelId = selectedModel;
                colorPickerInstance.openColorPickerModal();
            });
        }

        await fetchAllGiftNames();

        checkUrlAndRestoreState();

        const urlParams = new URLSearchParams(window.location.search);
        const paramGiftName = urlParams.get('giftName');
        const paramModelName = urlParams.get('modelName');
        const paramRandomCount = parseInt(urlParams.get('randomGiftsCount'), 10);
        const paramTargets = urlParams.get('targets');

        if (paramGiftName && giftNames.includes(paramGiftName)) {
            selectedGift = paramGiftName;
            giftSelectedValue.textContent = paramGiftName;
            await fetchAllModelNames(selectedGift);

            if (paramModelName && modelNames.some(m => m.name === paramModelName)) {
                selectedModel = paramModelName;
                modelSelectedValue.textContent = paramModelName;
                await showDetails(selectedGift, selectedModel);
            }

            // ИСПРАВЛЕНИЕ: Если есть количество в URL, выбираем рандомные подарки
            if (!isNaN(paramRandomCount) && paramRandomCount > 0) {
                selectedMultiItems.clear();
                // Вызываем вашу функцию рандома, она заполнит selectedMultiItems
                selectRandomGifts(paramRandomCount, giftNames, selectedGift);
            }

            populateMultiSelectDropdown(giftNames);
            updateMultiSelectedSummary();
            updateControlAvailability();
            updateSubmitButtonState();

            if (!submitBtn.disabled) {
                fetchSimilarNFTs();
            }
        } else {
            await fetchAllModelNames(null);
            updateControlAvailability();
            updateSubmitButtonState();
        }

        if (sortMobileButton && sortModalOverlay && sortModalOptions && sortSelectDesktop) {

            // --- ОБНОВЛЕННЫЕ ОПЦИИ СОРТИРОВКИ ---
            const NEW_SORT_OPTIONS = [
                { value: 'percent-desc', text: 'По совпадению' },
                { value: 'count-desc', text: 'По количеству (убыв.)' },
                { value: 'count-asc', text: 'По количеству (возр.)' },
                { value: 'name', text: 'По имени' }
            ];

            sortSelectDesktop.innerHTML = '';
            NEW_SORT_OPTIONS.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                sortSelectDesktop.appendChild(option);
            });

            sortModalOptions.innerHTML = '';

            NEW_SORT_OPTIONS.forEach(opt => {
                const btn = document.createElement('button');
                btn.textContent = opt.text;
                btn.dataset.sort = opt.value;
                btn.classList.add('sort-select-btn');

                btn.addEventListener('click', () => {
                    if (sortSelectDesktop) {
                        sortSelectDesktop.value = btn.dataset.sort;
                    }
                    sortModalOverlay.classList.add('hidden');
                    renderResults();
                });
                sortModalOptions.appendChild(btn);
            });
        }

        if (displayModeButton || displayModeButtonDesktop) {
            const openDisplayModeModal = () => {
                displayModeModalOverlay.classList.remove('hidden');
            };

            if (displayModeButton) {
                displayModeButton.addEventListener('click', openDisplayModeModal);
            }
            if (displayModeButtonDesktop) {
                displayModeButtonDesktop.addEventListener('click', openDisplayModeModal);
            }

            displayModeModalOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'display-mode-modal-overlay') {
                    displayModeModalOverlay.classList.add('hidden');
                }
            });

            if (displayModeOptions) {
                displayModeOptions.addEventListener('click', (e) => {
                    const selectedButton = e.target.closest('.mode-select-btn');
                    if (selectedButton) {
                        currentDisplayMode = selectedButton.dataset.mode;
                        displayModeModalOverlay.classList.add('hidden');
                        renderResults();
                    }
                });
            }
        }

        if (sortSelectDesktop) {
            sortSelectDesktop.addEventListener('change', renderResults);
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', fetchSimilarNFTs);
        }

        if (window.themesModal && typeof window.themesModal.init === 'function') {
            window.themesModal.init(SERVER_BASE_URL, API_PHOTO_URL, setupLazyLoading, []);
        }

        toggleSortAndDisplayControls(similarNFTsData.length > 0);
        checkUrlAndRestoreState();

    }

    function checkUrlAndRestoreState() {
        const params = new URLSearchParams(window.location.search);
        const urlGift = params.get('gift');
        const urlModel = params.get('model');

        // Проверяем наличие параметров для открытия модалки
        if (urlGift && urlModel && nftDetailsModalInstance) {

            // 1. Берем сырые данные цветов (могут быть объектами или пустыми)
            const rawColors = state.bgFinder.targetColors || [];

            // 2. ВАЖНО: Преобразуем объекты {hex, x, y} в массив строк ["#ABCDEF", ...]
            // Если цвета уже строки, оставляем как есть
            const hexColors = rawColors.map(c => (typeof c === 'object' && c.hex) ? c.hex : c);

            // 3. Если selectedGift (контекст) еще не задан (например, прямая ссылка), 
            // попробуем взять его из URL params 'giftName', если он там есть
            const contextGift = selectedGift || params.get('giftName');
            const contextModel = selectedModel || params.get('modelName');

            nftDetailsModalInstance.openNftDetailsModal(
                urlGift,       // Карточка, которую открываем
                urlModel,      // Карточка, которую открываем
                contextGift,   // С ЧЕМ сравниваем (Target Gift)
                contextModel,  // С ЧЕМ сравниваем (Target Model)
                hexColors      // Массив строк-цветов
            );
        }
    }

    initPage();
});