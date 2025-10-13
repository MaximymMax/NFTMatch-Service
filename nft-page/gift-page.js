// URL API
const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net/';
const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
const API_GIFT_ORIGINALS_URL = 'https://cdn.changes.tg/gifts/originals'; 
import { initColorPicker } from './ColorPicker/color-picker-modal.js';
import { initNftDetailsModal } from './nft-details-modal.js';

let observerMap = new Map();


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
    "Fresh Socks": "5895603153683874485"
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Элементы интерфейса ---
    
    // Элементы для первого выпадающего списка (Подарки)
    const giftDropdownHeader = document.getElementById('gift-dropdown-header');
    const giftDropdownList = document.getElementById('gift-dropdown-list');
    const giftSearchInput = document.getElementById('gift-search');
    const giftListOptions = document.getElementById('gift-list-options');
    const giftSelectedValue = document.getElementById('gift-selected-value');

    // Элементы для второго выпадающего списка (Модели)
    const modelDropdownHeader = document.getElementById('model-dropdown-header');
    const modelDropdownList = document.getElementById('model-dropdown-list');
    const modelSearchInput = document.getElementById('model-search');
    const modelListOptions = document.getElementById('model-list-options');
    const modelSelectedValue = document.getElementById('model-selected-value');

    // Элементы для секции с фото и цветами
    const detailsContent = document.getElementById('details-content');
    const giftPhoto = document.getElementById('gift-photo');
    const colorsList = document.getElementById('colors-list');
    const changeColorBtn = document.getElementById('change-color-btn');

    // Элементы для мульти-селекта
    const multiSelectHeader = document.getElementById('multi-select-header');
    const multiSelectContent = document.getElementById('multi-select-content');
    const multiGiftSearch = document.getElementById('multi-gift-search');
    const multiListOptions = document.getElementById('multi-list-options');
    const multiSelectedSummary = document.getElementById('multi-selected-summary');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const selectAllBtn = document.getElementById('select-all-btn');
    
    // Элементы для функционала
    const submitBtn = document.getElementById('submit-btn');
    const sortSelectDesktop = document.getElementById('sort-order-desktop');
    const sortMobileButton = document.getElementById('sort-mobile-button');
    const sortModalOverlay = document.getElementById('sort-modal-overlay');
    const sortModalOptions = document.getElementById('sort-modal-options');
    const resultsGrid = document.getElementById('results-grid');
    const contentSection = document.getElementById('results-wrapper'); 

    const giftContainer = document.getElementById('gift-container');
    // Замените 'model-container' на фактический ID контейнера, если он другой
    const modelContainer = document.getElementById('model-container'); 
    // Замените 'multi-select-wrapper' на фактический ID контейнера мультивыбора
    const multiSelectWrapper = document.getElementById('multi-select-wrapper');

    const loadingContainer = document.getElementById('loading-container');
    const nftDetailsModalTitle = document.getElementById('nftDetailsModalTitle'); // <-- ДОБАВЬТЕ ЭТУ СТРОКУ
    let currentAbortController = null; 
    

     // 💡 Выбираем все кнопки и инпуты внутри мульти-селекта для блокировки
    const filterControls = document.querySelectorAll('.multi-select-container button, .multi-select-container input');


    const displayModeButton = document.getElementById('display-mode-button'); // Мобильная
    const displayModeModalOverlay = document.getElementById('display-mode-modal-overlay');
    const displayModeOptions = document.querySelector('.display-mode-options');

    // 💡 NEW: Десктопная кнопка вида
    const displayModeButtonDesktop = document.getElementById('display-mode-button-desktop'); 
    
     // 🔥 ИСПРАВЛЕНИЕ: Преобразуем NodeList в Array
    const multiSelectControls = Array.from(document.querySelectorAll('.multi-select-container button, .multi-select-container input'));

    // 🔥 ИСПРАВЛЕНИЕ: Преобразуем NodeList в Array
    const mainDropdownHeaders = Array.from(document.querySelectorAll('.custom-dropdown-container .dropdown-header'));

    const controlsToDisableOnEmpty = [
        sortSelectDesktop, 
        sortMobileButton, 
        displayModeButton, 
        displayModeButtonDesktop
    ].filter(el => el != null);

// 💡 Глобальная переменная для текущего режима
let currentDisplayMode = 'top-3'; // По умолчанию: Топ 3 модели

    //const contentSection = document.getElementById('results-container-wrapper');

    const selectedItemsList = document.getElementById('selected-items-list');
    const unselectedItemsList = document.getElementById('unselected-items-list');
    const listDivider = document.getElementById('list-divider')

    // --- Глобальные переменные ---
    let selectedGift = null;
    let selectedModel = null;
    let giftNames = [];
    let modelNames = [];
    let currentMainColors = [];
    let currentColorIndex = 0;
    let selectedMultiItems = new Set();
    let similarNFTsData = []; 
    // ...
    // 🔥 ДОБАВЬТЕ ЭТО:
    const state = { 
        bgFinder: {
            giftTypeId: null, modelId: null,
            // 🔥 ИЗМЕНЕНИЕ: targetColors теперь массив объектов {hex: string, x: number, y: number}
            targetColors: [], 
            activeTargetIndex: 0
        }
    };

    
    let colorPickerInstance; // Переменная для хранения экземпляра модуля
    let nftDetailsModalInstance;
    let observerMap = new Map();

const lazyLoadCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                observer.unobserve(img); // Сразу отписываемся
                img.classList.remove('lazy-load');
                img.src = img.dataset.src;
                img.onload = () => {
                    img.classList.add('loaded');
                };
            }
        });
    };

    /**
     * Настраивает и запускает ленивую загрузку для изображений.
     * Создает или переиспользует IntersectionObserver для конкретного scroll-контейнера.
     * @param {HTMLElement} contentElement - Элемент, содержащий изображения (e.g., #gift-list-options).
     * @param {HTMLElement | null} scrollRoot - Элемент с прокруткой. Если null, используется viewport.
     * @param {'list' | 'grid'} type - Определяет, какой rootMargin использовать.
     */
    function setupLazyLoading(contentElement, scrollRoot, type) {
        if (!contentElement) return;

        // Определяем ключ для карты наблюдателей. Для viewport используем специальный ключ.
        const observerKey = scrollRoot || 'viewport';
        let observer = observerMap.get(observerKey);

        // Если наблюдателя для этого контейнера еще нет, создаем его
        if (!observer) {
            const options = {
                root: scrollRoot, // 🔥 Вот ключевое изменение!
                rootMargin: type === 'list' ? '300px' : '400px'
            };
            observer = new IntersectionObserver(lazyLoadCallback, options);
            observerMap.set(observerKey, observer); // Сохраняем в карту для переиспользования
        }

        // Находим все ленивые изображения внутри контента и начинаем наблюдение
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

    // Функция для сортировки элементов внутри списка
    function sortList(listElement) {
        const items = Array.from(listElement.children);
        items.sort((a, b) => {
            const textA = a.querySelector('span').textContent.trim();
            const textB = b.querySelector('span').textContent.trim();
            return textA.localeCompare(textB);
        });
        items.forEach(item => listElement.appendChild(item));
    }

    // 💡 Новая асинхронная функция для загрузки и инициализации модалки
    // --- ФУНКЦИИ-УТИЛИТЫ ДЛЯ МОДУЛЯ (Заглушки) ---
    // 💡 Примечание: Эти функции должны быть определены для передачи в модуль. 
    // Поскольку их код не предоставлен, используем консольный вывод.
    function findAndDisplayBackgrounds() {
        console.log("findAndDisplayBackgrounds: Запуск поиска по новым цветам.");
        fetchSimilarNFTs(); 
    }
    
    function updateTargetColorsDisplay() {
        console.log("updateTargetColorsDisplay: Обновление цветов на главной странице.");
        
        // 💡 Используем существующую функцию displayColors
        // Преобразуем массив объектов в массив, понятный displayColors (который ожидает {hex: '...', ...})
        displayColors(state.bgFinder.targetColors);
    }
    // --- Конец Функций-утилит для модуля ---
    
    

    // --- Функции-утилиты ---

    function clearResults() {
        resultsGrid.innerHTML = ''; // Очищаем сетку
        contentSection.classList.add('results-initial-hide'); // Скрываем всю секцию
        contentSection.classList.remove('visible');
        similarNFTsData = []; // Очищаем данные
        if (currentAbortController) {
            currentAbortController.abort(); // Отменяем текущий запрос, если он есть
            currentAbortController = null;
            handleSearchCompletion(true); // Сброс UI-блокировок
        }
        console.log("Результаты поиска очищены.");
    }

    function getCardData(element) {
        // Проходим вверх до главного контейнера карточки
        const card = element.closest('.result-card');
        if (!card) return null;

        // Извлекаем данные, которые были сохранены при рендере
        return {
            giftName: card.dataset.giftName,
            modelName: card.dataset.modelName // Это model1Name из рендера
        };
    }

    function updateControlAvailability() {
        const isGiftSelected = selectedGift && selectedGift.length > 0;
        const isModelSelected = selectedModel && selectedModel.length > 0;
        
        // 1. Управление текстом в заголовке Модели:
        if (modelDropdownHeader) {
            if (isGiftSelected) {
                // Если подарок выбран, показываем выбранную модель или стандартный плейсхолдер
                modelSelectedValue.textContent = selectedModel || 'Выберите модель'; 
                // 🔥 Убедимся, что модель сброшена, если подарок только что выбрали
                if (!selectedModel) {
                     modelSelectedValue.textContent = 'Выберите модель';
                }
            } else {
                // 🔥 ЕСЛИ ПОДАРОК НЕ ВЫБРАН: Устанавливаем текст по умолчанию "Выберите модель"
                selectedModel = null;
                modelSelectedValue.textContent = 'Выберите модель'; // <-- ИСПРАВЛЕНИЕ ТЕКСТА
                detailsContent.classList.remove('visible'); 
            }
        }
        
        // 2. Управление доступностью Мультивыбора (зависит от Модели) - ОСТАВЛЯЕМ КАК ЕСТЬ
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
                list.classList.remove('stretch-dropdown'); // Убираем класс при закрытии

                if (input) {
                    input.blur();
                    input.value = '';
                    
                    if (type === 'gift') {
                        const optionsContainer = list.querySelector('#gift-list-options');
                        if (optionsContainer) {
                            populateDropdown(optionsContainer, items, type);
                        }
                    } else if (type === 'model') {
                        // 🔥 ИСПРАВЛЕНО: УБРАЛИ лишний вызов fetchAllModelNames.
                        // При закрытии восстанавливаем полный список моделей (без фильтрации), 
                        // если они были загружены.
                        if (modelNames.length > 0) {
                            // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Передаем только имена моделей (массив строк)
                            populateDropdown(modelListOptions, modelNames.map(m => m.name), 'model');
                        } else if (!selectedGift) {
                            // Если подарок не выбран, восстанавливаем плейсхолдер
                            fetchAllModelNames(null);
                        }
                    } else if (type === 'multi') {
                        multiGiftSearch.value = '';
                        populateMultiSelectDropdown(items);
                    }
                }
            } 
            
            // 🔥 ИСПРАВЛЕНИЕ: Заменили 'if' на 'else if', чтобы предотвратить мгновенное повторное открытие.
            else if (list === listToToggle && list.classList.contains('hidden')) {
                
                // ВНИМАНИЕ: Если это список Моделей и Подарок НЕ выбран, мы НЕ открываем его!
                if (type === 'model' && (!selectedGift || selectedGift.trim() === '')) {
                    // Мы уже установили плейсхолдер, просто не открываем список.
                    return; 
                }

                // --- ЛОГИКА РАСТЯГИВАНИЯ (stretch-dropdown) - ПРИМЕНЯЕМ ТОЛЬКО К gift И model ---
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
                // ^^^^ КОНЕЦ ЛОГИКИ СТЯГИВАНИЯ ^^^^

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
        
        // 1. Если список уже открыт, мы его закрываем, независимо от того, куда кликнули
        // (кроме инпута для обычных дропдаунов, чтобы разрешить ввод)
        if (isDropdownOpen) {
            const isMultiSelect = searchInput.id === 'multi-gift-search';
            
            // 🔥 ДЛЯ ОБЫЧНЫХ ДРОПДАУНОВ: Если клик на инпуте, не закрываем, позволяем вводить.
            if (!isMultiSelect && isClickOnSearchInput) {
                 // Оставляем открытым, чтобы пользователь мог продолжать вводить
                 return; 
            }
            
            // 🔥 ДЛЯ МУЛЬТИВЫБОРА ИЛИ КЛИК ПО СТРЕЛКЕ/ЗАГОЛОВКУ: Закрываем.
            toggleDropdown(dropdownList);
            return;
        }

        // 2. Если список закрыт, мы его открываем.
        toggleDropdown(dropdownList);
    }

    function handleSearch(container, searchText) {
        const isGiftSearch = container === giftListOptions;
        const items = isGiftSearch ? giftNames : modelNames;
        const type = isGiftSearch ? 'gift' : 'model';
        
        // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ 1: Доступ к имени через .name, если это модель
        const filtered = items.filter(item => {
            const name = (type === 'model') ? item.name : item;
            return name.toLowerCase().includes(searchText.toLowerCase());
        });
        
        // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ 2: Передаем в populateDropdown только имена моделей
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
                // Упреждающая загрузка: устанавливаем src напрямую и добавляем класс 'loaded'
                return `<img src="${url}" alt="${name}" class="option-image loaded">`;
            } else {
                // Ленивая загрузка: используем data-src и класс 'lazy-load'
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
    // 🔥 ВОССТАНОВЛЕНИЕ: Локальное определение массивов контролов (ОБЯЗАТЕЛЬНО!)
    const controlsWithDisabledAttr = [sortSelectDesktop, submitBtn];
    const controlsWithDisabledClass = [sortMobileButton, displayModeButton, displayModeButtonDesktop, ...mainDropdownHeaders, ...multiSelectControls];
    
    // 1. Сброс кнопки Submit
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Поиск NFT</span>
        `;
    }
    
    // 2. Разблокировка элементов через удаление класса и атрибута
    controlsWithDisabledClass.forEach(control => {
        if (control) { control.classList.remove('disabled-control'); }
    });
    
    controlsWithDisabledAttr.forEach(control => {
        if (control) { control.disabled = false; }
    });
    
    // 3. Сброс контроллера
    currentAbortController = null; 
    
    // 🔥 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Скрываем контейнер загрузки И ОЧИЩАЕМ его содержимое
    loadingContainer.classList.add('hidden');
    loadingContainer.innerHTML = ''; 
    resultsGrid.classList.remove('hidden'); // Показываем саму сетку
    
    // 4. Скрытие результатов при отмене
    if (wasCancelled) {
        contentSection.classList.remove('visible'); 
        contentSection.classList.add('results-initial-hide'); 
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
        // 🔥 ВОССТАНОВЛЕНИЕ: Локальное определение массивов контролов (ОБЯЗАТЕЛЬНО!)
        const controlsWithDisabledAttr = [sortSelectDesktop, submitBtn];
        const controlsWithDisabledClass = [sortMobileButton, displayModeButton, displayModeButtonDesktop, ...mainDropdownHeaders, ...multiSelectControls];
        
        
        // 💡 ПОДГОТОВКА ЦВЕТОВ
        const currentColors = state.bgFinder.targetColors.slice(0, 3).map(c => c.hex.toUpperCase());
        
        // 💡 ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ
        if (currentColors.length === 0 || selectedMultiItems.size === 0) {
            if (!selectedGift || !selectedModel || selectedMultiItems.size === 0) {
                console.error("Не все обязательные поля заполнены для запроса. Требуются либо 3 цвета ИЛИ выбранные модель и подарки.");
                return;
            }
        }
        
        // 1. Инициализация AbortController
        if (currentAbortController) {
            currentAbortController.abort();
        }
        currentAbortController = new AbortController();
        const signal = currentAbortController.signal;

        // --- Отображение секции результатов сразу ---
        contentSection.classList.remove('results-initial-hide'); 
        contentSection.classList.add('visible');
        
        // 🔥 ТОЧКИ КОНТРОЛЯ ВИДИМОСТИ:
        resultsGrid.innerHTML = ''; 
        resultsGrid.classList.add('hidden'); 
        loadingContainer.classList.remove('hidden'); 
        
        // 🚀 ГЕНЕРИРУЕМ И ВСТАВЛЯЕМ КОНТЕНТ ЗАГРУЗКИ
        loadingContainer.innerHTML = `
            <div class="col-span-full loading-indicator">
                <p style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <span class="spinner"></span> 
                    Анализ схожести. Пожалуйста, подождите...
                </p>
                <button id="cancel-search-btn" class="cancel-search-btn">Отменить поиск</button>
            </div>
        `;


        // 🚀 БЛОКИРОВКА UI ПЕРЕД ЗАПРОСОМ
        controlsWithDisabledAttr.forEach(control => {
            if (control) { control.disabled = true; }
        });
        controlsWithDisabledClass.forEach(control => {
            if (control) { control.classList.add('disabled-control'); }
        });


        // 2. Сообщение о загрузке и кнопка отмены
        if (submitBtn) {
            submitBtn.innerHTML = '<span class="spinner"></span> <span>Идет поиск NFT...</span>';
        }
        
        // 💡 Привязываем обработчик для кнопки отмены
        const cancelBtnElement = document.getElementById('cancel-search-btn');
        if (cancelBtnElement) {
            cancelBtnElement.addEventListener('click', () => {
                if (currentAbortController) {
                    currentAbortController.abort();
                    handleSearchCompletion(true); 
                }
            });
        }

        // 💡 НОВОЕ: Функция для получения данных пользователя Telegram
        const getTelegramUserData = () => {
            // Используем optional chaining (?.) для безопасного доступа к объектам
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

            if (tgUser) {
                // Если мы внутри Telegram Web App, возвращаем реальные данные
                console.log("Telegram user data found:", tgUser);
                return {
                    telegramId: tgUser.id,
                    username: tgUser.username || null,
                    firstName: tgUser.first_name || null,
                    lastName: tgUser.last_name || null,
                };
            }
            
            // Если мы не в Telegram, возвращаем пустые значения
            console.log("Not running in Telegram Web App, sending null user data.");
            return {
                telegramId: null,
                username: null,
                firstName: null,
                lastName: null,
            };
        };

        const userData = getTelegramUserData();

        // 🔥 ТЕЛО ЗАПРОСА С ДАННЫМИ ПОЛЬЗОВАТЕЛЯ
        const requestBody = {
            ...userData, // Добавляем данные пользователя в начало объекта
            "colors": currentColors, 
            "nameTargetGift": currentColors.length > 0 ? null : selectedGift, 
            "nameTargetModel": currentColors.length > 0 ? null : selectedModel,
            "namesGift": Array.from(selectedMultiItems),
            "monohromeModelsOnly": true
        };
        
        if (currentColors.length > 0 && requestBody.colors.length === 0) {
            console.error("Не удалось сформировать массив цветов для запроса.");
            handleSearchCompletion(true);
            return;
        }

        console.log("Sending request body:", JSON.stringify(requestBody));

        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/MonoCoof/SimilarNFTs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: signal 
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const dataObject = await response.json(); 
            similarNFTsData = [];

            console.log(dataObject);
            
            // 🔥 ПАРСИНГ ДАННЫХ (ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: ИСПОЛЬЗУЕМ floorPrice)
            if (dataObject && typeof dataObject === 'object') {
                Object.entries(dataObject).forEach(([giftName, result]) => {
                    
                    // Проверка наличия всех ключевых свойств (PascalCase)
                    if (!result || !result.SimilarModels || result.SimilarModels.length < 3 || result.FloorPrice === undefined || !result.AverageColor) {
                        return;
                    }
                    
                    const modelsArray = result.SimilarModels;
                    const colorString = result.AverageColor;    // 🔥 Теперь это строка "R, G, B"
                    const floorPrice = result.FloorPrice || 0; 
                    
                    // 🔥 КОРРЕКЦИЯ: Парсинг строки цвета
                    const rgbComponents = colorString.split(',').map(c => parseInt(c.trim(), 10));
                    
                    const r = rgbComponents[0];
                    const g = rgbComponents[1];
                    const b = rgbComponents[2];
                    
                    if (isNaN(r) || isNaN(g) || isNaN(b)) {
                        console.warn(`Пропущен подарок ${giftName}: Не удалось распарсить строку цвета: ${colorString}.`);
                        return;
                    }

                    // Конвертируем Color в HEX
                    const colorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    
                    // Извлекаем топ 3 модели, используя Key и Value (с большой буквы)
                    const model1 = modelsArray[0]; 
                    const model2 = modelsArray[1]; 
                    const model3 = modelsArray[2]; 

                    // 🔥 КОРРЕКЦИЯ: Используем model.Value и model.Key
                    const coefficient = model1.Value; 
                    const model1Name = model1.Key;
                    const model2Name = model2.Key;
                    const model3Name = model3.Key;

                    similarNFTsData.push({
                        giftName: giftName,
                        coefficient: coefficient,
                        colorHex: colorHex,
                        avgPrice: floorPrice, 
                        
                        model1Name: model1Name, 
                        model2Name: model2Name, 
                        model3Name: model3Name
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
                console.log('Поиск успешно отменен пользователем.');
                return; 
            }
            console.error('Ошибка при получении данных о похожих NFT:', error);
            resultsGrid.innerHTML = `<p class="col-span-full text-center text-danger" style="padding: 2rem;">Не удалось загрузить данные. Попробуйте снова. (${error.message})</p>`;
        } finally {
            handleSearchCompletion(false);
        }
    }

    function updateSubmitButtonState() {
        // Проверка, что все три условия выполнены
        const isReadyForSearch = selectedGift && selectedModel && selectedMultiItems.size > 0;
        
        if (submitBtn) {
            // Установка атрибута disabled
            submitBtn.disabled = !isReadyForSearch;
            
            // Установка класса для визуального отключения (если нужно)
            if (!isReadyForSearch) {
                submitBtn.classList.add('disabled-button');
            } else {
                submitBtn.classList.remove('disabled-button');
            }
        }
    }

    // --- Функции рендеринга и логика ---
    function populateDropdown(container, items, type) {
        container.innerHTML = '';
        const PRELOAD_COUNT = 15; // Количество элементов для предзагрузки

        items.forEach((item, index) => {
            // Для первых 15 элементов isPreload будет true
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
        const PRELOAD_COUNT = 15; // Количество элементов для предзагрузки в каждом списке

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

     function showDetails(giftName, modelName) {
        const photoUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
        giftPhoto.src = photoUrl;
        
        detailsContent.classList.add('visible');
        if (selectedMultiItems.size > 0) {
            submitBtn.classList.remove('hidden');
        }

        // 🔥 НОВАЯ ЛОГИКА: Проверка монохромности и рендеринг предупреждения
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
            monocolorAlertWrapper.innerHTML = ''; // Очищаем, если модель монохромна или не найдена
        }


        // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Ждем, пока изображение загрузится...
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';
        
        tempImg.onload = async () => {
             const naturalWidth = tempImg.naturalWidth;
             const naturalHeight = tempImg.naturalHeight;
             
             // 1. Получаем оригинальные координаты и HEX с сервера
             const colors = await fetchAndParseMainColors(giftName, modelName);

             currentMainColors = colors;
             currentColorIndex = 0;
            
             state.bgFinder.targetColors = []; // Очищаем state
            
             // 2. ИНИЦИАЛИЗАЦИЯ STATE: Сохраняем X/Y как ПРОЦЕНТЫ, используя натуральные размеры
             state.bgFinder.targetColors = colors.map(c => ({
                 hex: c.hex,
                 // X (в пикселях) / Ширина (в пикселях) * 100 = Процент X
                 x: (c.x / naturalWidth) * 100, 
                 y: (c.y / naturalHeight) * 100
             }));
            
             displayColors(state.bgFinder.targetColors); 
            
             if (currentMainColors.length > 1) {
                 changeColorBtn.classList.remove('hidden');
             } else {
                 changeColorBtn.classList.add('hidden');
             }
        };
        
        // Запускаем загрузку изображения через временный объект
        tempImg.src = photoUrl;
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
    
   function renderResults() {
    if (!Array.isArray(similarNFTsData) || similarNFTsData.length === 0) {
        resultsGrid.innerHTML = '<p class="col-span-full text-center text-muted" style="padding: 2rem;">Подходящих NFT не найдено.</p>';
        toggleSortAndDisplayControls(false); 
        return;
    }
    
    toggleSortAndDisplayControls(true); 

    const currentMode = currentDisplayMode; 
    
    // 🚀 Применяем классы для управления сеткой (CSS)
    resultsGrid.classList.remove('grid-top-1', 'grid-top-3');
    resultsGrid.classList.add(`grid-${currentMode}`);

    // --- Логика сортировки ---
    const sortElement = sortSelectDesktop || { value: 'percent-desc' };
    const sortValue = sortElement.value;
    
    let sortedData = [...similarNFTsData]; 
    
    if (sortValue === 'percent-desc') {
        sortedData.sort((a, b) => b.coefficient - a.coefficient);
    } else if (sortValue === 'price-asc') {
        sortedData.sort((a, b) => {
            const priceA = a.avgPrice || Infinity;
            const priceB = b.avgPrice || Infinity;
            
            if (priceA === Infinity && priceB === Infinity) {
                 return a.giftName.localeCompare(b.giftName);
            }
            if (priceA === Infinity) return 1;
            if (priceB === Infinity) return -1;
            
            return priceA - priceB;
        });
    } else { // name
        sortedData.sort((a, b) => {
            const nameA = `${a.giftName} - ${a.model1Name}`;
            const nameB = `${b.giftName} - ${b.model1Name}`;
            return nameA.localeCompare(b.model1Name);
        });
    }
    // --- Конец логики сортировки ---

    function formatPrice(price) {
        const num = parseFloat(price);
        
        if (isNaN(num) || num <= 0) {
            return 'not sale';
        }

        if (num > 1000) {
            const divided = num / 1000;
            return `${divided.toFixed(2)}k`;
        }

        return num.toFixed(2).replace(/\.00$/, '');
    }


    resultsGrid.innerHTML = '';
    sortedData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        card.dataset.giftName = item.giftName;
        card.dataset.modelName = item.model1Name;

        // --- Данные для карточки ---
        const url1 = `${API_PHOTO_URL}/${encodeURIComponent(item.giftName)}/png/${encodeURIComponent(item.model1Name)}.png`;
        const url2 = `${API_PHOTO_URL}/${encodeURIComponent(item.giftName)}/png/${encodeURIComponent(item.model2Name)}.png`;
        const url3 = `${API_PHOTO_URL}/${encodeURIComponent(item.giftName)}/png/${encodeURIComponent(item.model3Name)}.png`;
        
        const coefficient = (item.coefficient * 100).toFixed(2);
        const gradientColor = item.colorHex || '#1e2944'; 
        const actualPrice = item.avgPrice; 
        
        // 🔥 ИСПРАВЛЕНИЕ: Заменяем символ на тег img
        const tonIcon = '<img src="./ton_symbol.png" alt="TON" class="ton-icon">'; 

        let imageContent = '';
        let imageWrapperClass = 'result-card-image-wrapper';
        let imageWrapperStyle = '';
        
        // 🔥 ИЗМЕНЕНИЕ: Используем data-src для lazy loading
        if (currentMode === 'top-1') {
             imageWrapperClass += ' image-wrapper-single';
             imageWrapperStyle = `background: linear-gradient(to top, ${gradientColor} 0%, rgba(30, 41, 68, 0.6) 40%, rgba(30, 41, 68, 0.9) 100%);`; 
             
             imageContent = `<img data-src="${url1}" alt="${item.model1Name}" class="card-model-main model-single lazy-load">`;
        } else {
             imageWrapperClass += ' image-wrapper-three';
             imageWrapperStyle = `background: linear-gradient(to top, ${gradientColor} 0%, rgba(30, 41, 68, 0.6) 40%, rgba(30, 41, 68, 0.9) 100%);`;

             imageContent = `
                <img data-src="${url1}" alt="${item.model1Name}" class="card-model-main lazy-load">
                <img data-src="${url2}" alt="${item.model2Name}" class="card-model-side model-left lazy-load">
                <img data-src="${url3}" alt="${item.model3Name}" class="card-model-side model-right lazy-load">
             `;
        }
        
        // 🔥 ОПРЕДЕЛЕНИЕ ТЕКСТА ЦЕНЫ
        let priceText;
        const formattedDisplayPrice = formatPrice(actualPrice); 
        
        if (formattedDisplayPrice === 'not sale') {
             priceText = formattedDisplayPrice;
        } else {
             priceText = `<span class="price-value">${formattedDisplayPrice}</span> <span class="currency-symbol">${tonIcon}</span>`;
        }
        // ФОРМИРОВАНИЕ БЛОКА ИНФОРМАЦИИ
        card.innerHTML = `
            <div class="${imageWrapperClass}" style="${imageWrapperStyle}">
                ${imageContent}
            </div>
            <div class="result-card-info">
                <h2 class="similarity-percent">${coefficient}%</h2>
                <h3 class="gift-name">${item.giftName}</h3>
                <p class="model-name">${item.model1Name}</p>
                <div class="info-details">
                    <p class="price-info">Price: ${priceText}</p>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
             // 1. Данные из карточки (для API и списка)
             const cardGiftName = e.currentTarget.dataset.giftName;
             
             // 2. Данные с главной страницы (для правого фото - целевого)
             const targetGiftNameFromMain = selectedGift;
             const targetModelNameFromMain = selectedModel;

             // 🔥 ИСПРАВЛЕНИЕ: Создаем переменную currentTargetColors, извлекая hex-коды из глобального состояния.
             const currentTargetColors = state.bgFinder.targetColors.map(c => c.hex);
             
             if (cardGiftName && nftDetailsModalInstance && targetGiftNameFromMain && targetModelNameFromMain) {
                 
                 // Теперь мы передаем существующую переменную
                 nftDetailsModalInstance.openNftDetailsModal(
                     cardGiftName, 
                     targetGiftNameFromMain, 
                     targetModelNameFromMain,
                     currentTargetColors 
                 );
             } else {
                 console.error("Не удалось открыть модальное окно: Отсутствуют данные или цвета.");
             }
        });

        resultsGrid.appendChild(card);
    });
    
    // 🔥 ВЫЗОВ: Запускаем ленивую загрузку для только что созданных изображений
    setupLazyLoading(resultsGrid, null, 'grid');


}

    // --- Обработчики событий ---

    giftDropdownHeader.addEventListener('click', (e) => {
        handleDropdownHeaderClick(e, giftDropdownList, giftSearchInput);
    });

    modelDropdownHeader.addEventListener('click', (e) => {
        const isGiftSelected = selectedGift && selectedGift.length > 0;
        
        // 🚀 НОВАЯ ПРОВЕРКА: Если подарок не выбран, не даем открыться
        if (!isGiftSelected) {
            // Если подарок не выбран, мы просто ничего не делаем, 
            // так как в fetchAllModelNames уже установлен плейсхолдер в списке.
            // Заголовок остается "Выберите модель".
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
                
                // Управляем классом для скрытия выбранного значения/плейсхолдера
                if (input.value.trim() !== '') {
                    header.classList.add('value-active');
                } else {
                    // 🔥 КОРРЕКЦИЯ: При сбросе поиска показываем полный список
                    // ВАЖНО: modelNames - массив объектов, передаем ТОЛЬКО имена
                    const namesToDisplay = isGift ? items : items.map(m => m.name);
                    
                    populateDropdown(container, namesToDisplay, type);
                    
                    header.classList.remove('value-active');
                }
                
                // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Вызываем handleSearch
                // Вызываем handleSearch только при наличии текста, иначе уже показали полный список выше
                if (input.value.trim() !== '') {
                     handleSearch(container, input.value);
                }
            });
        }
    });

    giftListOptions.addEventListener('click', (e) => {
        // 🔥 ИСПРАВЛЕНИЕ: Используем closest() для надежности и безопасности (устранение ReferenceError)
        const listItem = e.target.closest('.list-option');
        
        if (listItem) { // Проверяем, что был клик по опции
            const selectedItem = listItem.querySelector('.option-text').textContent.trim();
            
            giftSelectedValue.textContent = selectedItem;
            selectedGift = selectedItem;
            selectedModel = null; // Сброс модели при смене подарка

            giftSearchInput.value = ''; 
            giftDropdownHeader.classList.remove('value-active');
            giftDropdownHeader.classList.remove('open'); // <-- ЯВНО ЗАКРЫВАЕМ
            
            modelSelectedValue.textContent = 'Выберите модель';
            detailsContent.classList.remove('visible');
            submitBtn.classList.add('hidden');
            toggleDropdown(null); // Закрываем все списки (вместо giftDropdownList)
            
            // 🔥 Теперь fetchAllModelNames получает чистую строку
            fetchAllModelNames(selectedGift); 

            clearResults(); 
            
            // 🔥 МЕСТО ВСТАВКИ 1: После обновления selectedGift и сброса selectedModel
            updateControlAvailability(); 
            updateSubmitButtonState();
        }
    });

    modelListOptions.addEventListener('click', (e) => {
        // 🔥 ИСПРАВЛЕНИЕ: Используем closest() для надежности и безопасности (устранение ReferenceError)
        const listItem = e.target.closest('.list-option');

        if (listItem) { // Проверяем, что был клик по опции
            // Берем текст из внутреннего span, чтобы избежать лишних символов

            if (listItem.classList.contains('list-placeholder')) {
                // Если кликнули по плейсхолдеру, просто закрываем список и выходим
                toggleDropdown(modelDropdownHeader); 
                return; 
            }

            const selectedItem = listItem.querySelector('.option-text').textContent.trim();
            
            modelSelectedValue.textContent = selectedItem;
            selectedModel = selectedItem;
            modelSearchInput.value = ''; 
            modelDropdownHeader.classList.remove('value-active');
            modelDropdownHeader.classList.remove('open'); // <-- ЯВНО ЗАКРЫВАЕМ
            
            toggleDropdown(null); // Закрываем все списки
            
            // showDetails должен подгрузить фото с чистой selectedModel
            showDetails(selectedGift, selectedModel); 

            clearResults(); 
            
            // 🔥 МЕСТО ВСТАВКИ 2: После обновления selectedModel
            updateControlAvailability();
            updateSubmitButtonState();
        }
    });

    multiSelectHeader.addEventListener('click', (e) => {
        // 🔥 ПЕРЕДАЕМ АРГУМЕНТЫ ДЛЯ КОРРЕКТНОЙ РАБОТЫ handleDropdownHeaderClick
        handleDropdownHeaderClick(e, multiSelectContent, multiGiftSearch);
    });

    giftSearchInput.addEventListener('input', () => {
        const searchText = giftSearchInput.value.toLowerCase();
        const filtered = giftNames.filter(name => name.toLowerCase().includes(searchText));
        populateDropdown(giftListOptions, filtered, 'gift');
    });


    multiGiftSearch.addEventListener('input', () => {
        // Мы вызываем populateMultiSelectDropdown с полным списком.
        // Функция сама считает значение multiGiftSearch.value и отфильтрует список.
        populateMultiSelectDropdown(giftNames);
    });

    multiListOptions.addEventListener('change', (e) => {
        if (e.target.classList.contains('multi-select-checkbox')) {
            const checkbox = e.target;
            const value = checkbox.value;
            const isChecked = checkbox.checked;
            
            // Обновляем наш Set с выбранными элементами
            if (isChecked) {
                selectedMultiItems.add(value);
            } else {
                selectedMultiItems.delete(value);
            }

            // 🔥 ЛОГИКА ПРОТИВ МИГАНИЯ 🔥
            const isFiltering = multiGiftSearch.value.trim().length > 0;

            // Если пользователь что-то ищет, используем старый метод полной перерисовки,
            // чтобы фильтрация работала корректно.
            if (isFiltering) {
                populateMultiSelectDropdown(giftNames);
            } else {
                // Если поиска нет, просто перемещаем элемент - это быстро и без миганий.
                const labelElement = checkbox.closest('.multi-list-option-label');
                if (labelElement) {
                    if (isChecked) {
                        selectedItemsList.appendChild(labelElement);
                        sortList(selectedItemsList); // Сортируем список выбранных
                    } else {
                        unselectedItemsList.appendChild(labelElement);
                        sortList(unselectedItemsList); // Сортируем список невыбранных
                    }
                }
            }
            
            // Обновляем счётчик, кнопку и разделитель
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
        // При изменении десктопного select запускаем сортировку
        sortSelectDesktop.addEventListener('change', renderResults);
    }
    
    // 1. Привязка для ПК-сортировки (стандартный select)
    if (sortSelectDesktop) {
        sortSelectDesktop.addEventListener('change', renderResults);
    }

    // 2. Привязка для мобильной сортировки (открытие модального окна)
    if (sortMobileButton) {
        sortMobileButton.addEventListener('click', () => {
            // Здесь открывается модальное окно сортировки
            sortModalOverlay.classList.remove('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        // Проверяем, был ли клик вне всех элементов, которые должны оставаться открытыми
        const isClickedOutsideDropdowns = !e.target.closest('.custom-dropdown-container') && !e.target.closest('.multi-select-container');
        
        // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, что клик НЕ внутри модалок
        const isClickedInsideSortModal = e.target.closest('.sort-modal');
        const isClickedInsideDisplayModal = e.target.closest('.display-mode-modal');
        
        const isModalActive = !sortModalOverlay.classList.contains('hidden') || !displayModeModalOverlay.classList.contains('hidden');
        
        // 1. Закрываем ВСЕ открытые дропдауны
        if (isClickedOutsideDropdowns) {
            // Передаем null, чтобы закрыть все открытые списки
            toggleDropdown(null); 
        }

        // 2. Закрываем модалки, если клик был на оверлее (подложке), а не на самом окне
        if (!isClickedInsideSortModal && e.target === sortModalOverlay) {
             sortModalOverlay.classList.add('hidden');
        }
        if (!isClickedInsideDisplayModal && e.target === displayModeModalOverlay) {
             displayModeModalOverlay.classList.add('hidden');
        }
        
    });

    // --- API запросы ---
    async function fetchAllGiftNames() {
        const cacheKey = 'giftNamesCache'; // Ключ для хранения в sessionStorage

        // 1. Пытаемся получить данные из кэша
        try {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                giftNames = JSON.parse(cachedData);
                console.log("Названия подарков загружены из кэша sessionStorage.", giftNames);
                // Если данные успешно получены из кэша, отображаем их и выходим
                populateDropdown(giftListOptions, giftNames, 'gift');
                populateMultiSelectDropdown(giftNames);
                return; 
            }
        } catch (error) {
            console.error('Ошибка при чтении кэша названий подарков:', error);
            // Если кэш поврежден, лучше его очистить
            sessionStorage.removeItem(cacheKey);
        }

        // 2. Если в кэше пусто, загружаем с сервера
        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/ListGifts/AllGiftNames`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            giftNames = await response.json();
            console.log("Названия подарков получены с сервера:", giftNames);

            // 3. Сохраняем полученные данные в кэш для этой сессии
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(giftNames));
                console.log("Названия подарков сохранены в кэш sessionStorage.");
            } catch (error) {
                console.error('Не удалось сохранить названия подарков в кэш:', error);
            }
            
            // 4. Отображаем данные
            populateDropdown(giftListOptions, giftNames, 'gift');
            populateMultiSelectDropdown(giftNames);
        } catch (error) {
            console.error('Ошибка при загрузке названий подарков с сервера:', error);
        }
    }

    async function fetchAllModelNames(giftName) {

        if (!giftName || giftName.trim() === '') {
            // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Установка плейсхолдера в списке
            const placeholderHTML = `<li class="list-option list-placeholder"><span class="option-text">Сначала выберите подарок</span></li>`;
            modelListOptions.innerHTML = placeholderHTML;
            
            // 🔥 ОЧИЩАЕМ modelNames, чтобы логика работы с полным списком не срабатывала
            modelNames = [];
            
            // Если список моделей был открыт, мы его закрываем
            if (modelDropdownHeader.classList.contains('open')) {
                toggleDropdown(modelDropdownHeader);
            }
            return;
        }

        try {
            const response = await fetch(`${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/AllModelNames`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const modelsDict = await response.json();
            console.log(modelsDict);
            
            // 🔥 ИЗМЕНЕНИЕ: Храним объекты { name, isMonochrome }
            modelNames = Object.entries(modelsDict).map(([name, isMonochrome]) => ({
                name: name, 
                isMonochrome: isMonochrome
            }));
            
            console.log(`Получены модели для ${giftName}:`, modelNames);
            // 🔥 ПЕРЕДАЕМ ТОЛЬКО ИМЕНА В populateDropdown
            populateDropdown(modelListOptions, modelNames.map(m => m.name), 'model'); 
        } catch (error) {
            console.error(`Ошибка при загрузке моделей для ${giftName}:`, error);
            modelNames = [];
            modelSelectedValue.textContent = 'Выберите модель';
            // В случае ошибки, также показываем плейсхолдер в списке
            const placeholderHTML = `<li class="list-option list-placeholder"><span class="option-text">Модели не найдены</span></li>`;
            modelListOptions.innerHTML = placeholderHTML;
        }
    }

    async function fetchAndParseMainColors(giftName, modelName) {
        let mainColorsData = [];
        try {
            const colorsResponse = await fetch(`${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/MainColors`);
            if (!colorsResponse.ok) {
                throw new Error(`Ошибка HTTP при получении основных цветов: ${colorsResponse.status} ${colorsResponse.statusText}`);
            }
             console.log(colorsResponse);
            const colorsString = await colorsResponse.text();
            console.log(colorsString);
            if (colorsString) {
                const cleanedString = colorsString.trim().replace(/^['"]|['"]$/g, '');
                mainColorsData = cleanedString.split(';').map(item => {
                    const trimmedItem = item.trim();
                    if (!trimmedItem) return null;
                    const parts = trimmedItem.split(':');
                    if (parts.length !== 2) {
                        console.warn(`Неверный формат элемента цвета: "${trimmedItem}"`);
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
            console.log("Получены и распарсены основные цвета:", mainColorsData);
            return mainColorsData;
        } catch (error) {
            console.error('Ошибка при загрузке основных цветов модели:', error);
            return [];
        }
    }

    // Начальная загрузка данных
    fetchAllGiftNames();

    async function initPage() {
        // 1. Прямая инициализация модуля JS
        colorPickerInstance = initColorPicker({
            state: state, 
            fetchAndParseMainColors: fetchAndParseMainColors,
            findAndDisplayBackgrounds: findAndDisplayBackgrounds,
            updateTargetColorsDisplay: updateTargetColorsDisplay,
            API_PHOTO_URL: API_PHOTO_URL,
        });
        
        nftDetailsModalInstance = initNftDetailsModal(); 
        console.log('Модуль Color Picker инициализирован.');
        console.log('Модуль NFT Details Modal инициализирован.');

        // 2. Привязка кнопки
        if (changeColorBtn) {
            changeColorBtn.addEventListener('click', () => {
                state.bgFinder.giftTypeId = selectedGift;
                state.bgFinder.modelId = selectedModel;
                colorPickerInstance.openColorPickerModal();
            });
        }

        await fetchAllGiftNames();
        fetchAllModelNames(null); 
        updateControlAvailability();
        updateSubmitButtonState();
        
        // 4. Логика для сортировки и вида (которая была в конце файла)
        if (sortMobileButton && sortModalOverlay && sortModalOptions && sortSelectDesktop) {
            
            // 🔥 ОПРЕДЕЛЕНИЕ НОВЫХ ОПЦИЙ
            const NEW_SORT_OPTIONS = [
                { value: 'percent-desc', text: 'По совпадению (убыв.)' },
                { value: 'price-asc',    text: 'По цене (возр.)' }, // 🔥 НОВАЯ ОПЦИЯ
                { value: 'name',         text: 'По имени' }
            ];

            // 💡 ОБНОВЛЕНИЕ ДЕСКТОПНОГО SELECT (ОЧИЩАЕМ И ЗАПОЛНЯЕМ)
            sortSelectDesktop.innerHTML = '';
            NEW_SORT_OPTIONS.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                sortSelectDesktop.appendChild(option);
            });
            
            // 💡 ОБНОВЛЕНИЕ МОДАЛКИ СОРТИРОВКИ (ОЧИЩАЕМ И ЗАПОЛНЯЕМ)
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

        toggleSortAndDisplayControls(false); 
    }

    // 5. Запускаем общую функцию инициализации
    initPage();
});