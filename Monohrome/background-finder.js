document.addEventListener('DOMContentLoaded', () => {

    // --- URL API & Constants ---
    const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net';
    const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
    const API_GIFT_ORIGINALS_URL = 'https://cdn.changes.tg/gifts/originals'; 

    const GIFT_NAME_TO_ID = {
        "Santa Hat": "5983471780763796287", "Signet Ring": "5936085638515261992", "Precious Peach": "5933671725160989227",
        "Plush Pepe": "5936013938331222567", "Spiced Wine": "5913442287462908725", "Jelly Bunny": "5915502858152706668",
        "Durov's Cap": "5915521180483191380", "Perfume Bottle": "5913517067138499193", "Eternal Rose": "5882125812596999035",
        "Berry Box": "5882252952218894938", "Vintage Cigar": "5857140566201991735", "Magic Potion": "5846226946928673709",
        "Kissed Frog": "5845776576658015084", "Hex Pot": "5825801628657124140", "Evil Eye": "5825480571261813595",
        "Sharp Tongue": "5841689550203650524", "Trapped Heart": "5841391256135008713", "Skull Flower": "5839038009193792264",
        "Scared Cat": "5837059369300132790", "Spy Agaric": "5821261908354794038", "Homemade Cake": "5783075783622787539",
        "Genie Lamp": "5933531623327795414", "Lunar Snake": "6028426950047957932", "Party Sparkler": "6003643167683903930",
        "Jester Hat": "5933590374185435592", "Witch Hat": "5821384757304362229", "Hanging Star": "5915733223018594841",
        "Love Candle": "5915550639663874519", "Cookie Heart": "6001538689543439169", "Desk Calendar": "5782988952268964995",
        "Jingle Bells": "6001473264306619020", "Snow Mittens": "5980789805615678057", "Voodoo Doll": "5836780359634649414",
        "Mad Pumpkin": "5841632504448025405", "Hypno Lollipop": "5825895989088617224", "B-Day Candle": "5782984811920491178",
        "Bunny Muffin": "5935936766358847989", "Astral Shard": "5933629604416717361", "Flying Broom": "5837063436634161765",
        "Crystal Ball": "5841336413697606412", "Eternal Candle": "5821205665758053411", "Swiss Watch": "5936043693864651359",
        "Ginger Cookie": "5983484377902875708", "Mini Oscar": "5879737836550226478", "Lol Pop": "5170594532177215681",
        "Ion Gem": "5843762284240831056", "Star Notepad": "5936017773737018241", "Loot Bag": "5868659926187901653",
        "Love Potion": "5868348541058942091", "Toy Bear": "5868220813026526561", "Diamond Ring": "5868503709637411929",
        "Sakura Flower": "5167939598143193218", "Sleigh Bell": "5981026247860290310", "Top Hat": "5897593557492957738",
        "Record Player": "5856973938650776169", "Winter Wreath": "5983259145522906006", "Snow Globe": "5981132629905245483",
        "Electric Skull": "5846192273657692751", "Tama Gadget": "6023752243218481939", "Candy Cane": "6003373314888696650",
        "Neko Helmet": "5933793770951673155", "Jack-in-the-Box": "6005659564635063386", "Easter Egg": "5773668482394620318",
        "Bonded Ring": "5870661333703197240", "Pet Snake": "6023917088358269866", "Snake Box": "6023679164349940429",
        "Xmas Stocking": "6003767644426076664", "Big Year": "6028283532500009446", "Holiday Drink": "6003735372041814769",
        "Gem Signet": "5859442703032386168", "Light Sword": "5897581235231785485", "Restless Jar": "5870784783948186838",
        "Nail Bracelet": "5870720080265871962", "Heroic Helmet": "5895328365971244193", "Bow Tie": "5895544372761461960",
        "Heart Locket": "5868455043362980631", "Lush Bouquet": "5871002671934079382", "Whip Cupcake": "5933543975653737112",
        "Joyful Bundle": "5870862540036113469", "Cupid Charm": "5868561433997870501", "Valentine Box": "5868595669182186720",
        "Snoop Dogg": "6014591077976114307", "Swag Bag": "6012607142387778152", "Snoop Cigar": "6012435906336654262",
        "Low Rider": "6014675319464657779", "Westside Sign": "6014697240977737490", "Stellar Rocket": "6042113507581755979",
        "Jolly Chimp": "6005880141270483700", "Moon Pendant": "5998981470310368313", "Ionic Dryer": "5933937398953018107",
        "Input Key": "5870972044522291836", "Mighty Arm": "5895518353849582541", "Artisan Brick": "6005797617768858105",
        "Clover Pin": "5960747083030856414", "Sky Stilettos": "5870947077877400011", "Fresh Socks": "5895603153683874485"
    };

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
    
    // --- Global State ---
    let state = {
        currentMode: 'findBgs',
        giftNames: [],
        modelNames: [], 
        findBgs: {
            selectedGift: null,
            selectedModel: null,
            targetColors: [],
            lastResults: [],
        },
        findModels: {
            selectedGift: null,
            selectedColor: null,
            lastResults: [],
        },
    };
    let searchTimeout = null;

    // 🔥 НАЧАЛО ВСТАВКИ: ЛОГИКА LAZY LOADING
    let observerMap = new Map();

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
                // Агрессивная предзагрузка для списков, умеренная для сетки
                rootMargin: type === 'list' ? '600px' : '400px' 
            };
            observer = new IntersectionObserver(lazyLoadCallback, options);
            observerMap.set(observerKey, observer);
        }

        const lazyImages = contentElement.querySelectorAll('img.lazy-load');
        lazyImages.forEach(img => {
            observer.observe(img);
        });
    }

    // --- Element References ---
    const modeSwitcher = document.querySelector('.mode-switcher');
    const findBgsControls = document.getElementById('find-bgs-controls');
    const findModelsControls = document.getElementById('find-models-controls');
    const resultsWrapper = document.getElementById('results-wrapper');
    const loadingContainer = document.getElementById('loading-container');
    const resultsGrid = document.getElementById('results-grid');


    // Picker elements
    const pickerArea = document.getElementById('picker-area');
    const pickerContainer = document.getElementById('pickerContainer');
    const pickerTargetColorsDisplay = document.getElementById('pickerTargetColorsDisplay');

    const detailsModalOverlay = document.getElementById('details-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalPhotoContainer = document.querySelector('.modal-photo-container');
    const modalGiftName = document.getElementById('modal-gift-name');
    const modalModelName = document.getElementById('modal-model-name');
    const modalBgName = document.getElementById('modal-bg-name');
    const modalCompatValue = document.getElementById('modal-compat-value');
    
    // Dropdown Objects
    const dropdowns = {
        giftBgs: {
            header: document.getElementById('gift-dropdown-header-bgs'),
            list: document.getElementById('gift-dropdown-list-bgs'),
            input: document.getElementById('gift-search-bgs'),
            options: document.getElementById('gift-list-options-bgs'),
            value: document.getElementById('gift-selected-value-bgs'),
        },
        modelBgs: {
            header: document.getElementById('model-dropdown-header-bgs'),
            list: document.getElementById('model-dropdown-list-bgs'),
            input: document.getElementById('model-search-bgs'),
            options: document.getElementById('model-list-options-bgs'),
            value: document.getElementById('model-selected-value-bgs'),
        },
        giftModels: {
            header: document.getElementById('gift-dropdown-header-models'),
            list: document.getElementById('gift-dropdown-list-models'),
            input: document.getElementById('gift-search-models'),
            options: document.getElementById('gift-list-options-models'),
            value: document.getElementById('gift-selected-value-models'),
        },
        colorModels: {
            header: document.getElementById('color-dropdown-header-models'),
            list: document.getElementById('color-dropdown-list-models'),
            input: document.getElementById('color-search-models'),
            options: document.getElementById('color-list-options-models'),
            value: document.getElementById('color-selected-value-models'),
        }
    };

    // --- CORE LOGIC ---

    function openDetailsModal(data) {
        // Формируем URL для Lottie-анимации
        const lottieUrl = `https://cdn.changes.tg/gifts/models/${encodeURIComponent(data.giftName)}/lottie/${encodeURIComponent(data.modelName)}.json`;

        // Устанавливаем фон для контейнера
        modalPhotoContainer.style.background = data.backgroundGradient || 'var(--surface-color)';
        
        // Создаем и вставляем плеер анимации
        modalPhotoContainer.innerHTML = `
            <lottie-player
                src="${lottieUrl}"
                background="transparent"
                speed="1"
                loop
                autoplay
            ></lottie-player>
        `;

        // Заполняем остальную информацию
        document.getElementById('modal-gift-name').textContent = data.giftName;
        modalModelName.textContent = data.modelName;
        modalBgName.textContent = data.bgName;
        modalCompatValue.textContent = `${data.compatValue}%`;
        detailsModalOverlay.classList.remove('hidden');
    }

    function closeDetailsModal() {
        detailsModalOverlay.classList.add('hidden');
    }

    function switchMode(mode) {
        state.currentMode = mode;

        modeSwitcher.classList.toggle('mode-models', mode === 'findModels');
        modeSwitcher.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        if (mode === 'findBgs') {
            findBgsControls.classList.add('active');
            findModelsControls.classList.remove('active');
            pickerArea.style.display = 'flex'; 

            if (state.findBgs.lastResults.length > 0) {
                renderBackgroundResults(state.findBgs.lastResults);
            } else if (state.findBgs.selectedModel) {
                fetchMatchingBackgrounds();
            } else {
                clearResults();
            }
        } else {
            findBgsControls.classList.remove('active');
            findModelsControls.classList.add('active');
            pickerArea.style.display = 'none'; 

            if (state.findModels.lastResults.length > 0) {
                renderModelResults(state.findModels.lastResults, state.findModels.selectedColor);
            } else if (state.findModels.selectedGift && state.findModels.selectedColor) {
                fetchMatchingModels();
            } else {
                clearResults();
            }
        }
    }
    
    function clearResults() {
        resultsGrid.innerHTML = '';
        resultsWrapper.classList.add('results-initial-hide');
    }

    function showLoading(isInitialSearch = true) {
        if (isInitialSearch) {
            clearResults();
            resultsWrapper.classList.remove('results-initial-hide');
            loadingContainer.style.display = 'flex';
            loadingContainer.innerHTML = `<div class="loading-indicator"><p><span class="spinner"></span> Анализ... Пожалуйста, подождите...</p></div>`;
        } else {
            resultsGrid.classList.add('loading');
        }
    }

    function hideLoading() {
        loadingContainer.style.display = 'none';
        loadingContainer.innerHTML = '';
        resultsGrid.classList.remove('loading');
    }
    
    const getTelegramUserData = () => {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (tgUser) {
            console.log("Telegram user data found:", tgUser);
            return {
                id: tgUser.id,
                Username: tgUser.username || null,
            };
        }
        console.log("Not running in Telegram Web App, sending null user data.");
        return { id: null, Username: null };
    };

    // --- API & DATA FETCHING ---

    async function fetchAllGiftNames() {
        const cacheKey = 'giftNamesCache'; // ❗ Используем тот же ключ, что и на gift-page.js

        // 1. Пробуем загрузить из кэша
        try {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                state.giftNames = JSON.parse(cachedData);
                console.log('%c[Cache Success] Loaded gift names from sessionStorage:', 'color: purple', state.giftNames);
                populateDropdown(dropdowns.giftBgs.options, state.giftNames, 'gift');
                populateDropdown(dropdowns.giftModels.options, state.giftNames, 'gift');
                return;
            }
        } catch (error) {
            console.error('[Cache Error] Ошибка чтения кэша:', error);
            sessionStorage.removeItem(cacheKey);
        }

        // 2. Если в кэше пусто, грузим с сервера
        const url = `${SERVER_BASE_URL}/api/ListGifts/AllGiftNames`;
        console.log(`%c[API Request] Fetching all gift names from: ${url}`, 'color: dodgerblue');
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            state.giftNames = await response.json();
            console.log('%c[API Success] Loaded gift names from server:', 'color: green', state.giftNames);

            // 3. Сохраняем в кэш
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(state.giftNames));
            } catch (error) {
                console.error('[Cache Error] Ошибка сохранения в кэш:', error);
            }

            // 4. Отображаем
            populateDropdown(dropdowns.giftBgs.options, state.giftNames, 'gift');
            populateDropdown(dropdowns.giftModels.options, state.giftNames, 'gift');

        } catch (error) {
            console.error('[API Error] Ошибка при загрузке названий подарков:', error);
        }
    }

    async function fetchAllModelNames(giftName, updateDOM = true) {
    if (!giftName) {
        if (updateDOM) {
            dropdowns.modelBgs.options.innerHTML = `<div class="list-option list-placeholder">Сначала выберите коллекцию</div>`;
        }
        state.modelNames = [];
        return;
    }
    const url = `${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/AllModelNames`;
    console.log(`%c[API Request] Fetching models for "${giftName}" from: ${url}`, 'color: dodgerblue');
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const modelsDict = await response.json();
        
        state.modelNames = Object.entries(modelsDict).map(([name, isMonochrome]) => ({ name, isMonochrome }));
        console.log(`%c[API Success] Loaded models for "${giftName}":`, 'color: green', state.modelNames);

        if (updateDOM) {
            const modelNamesList = state.modelNames.map(m => m.name);
            populateDropdown(dropdowns.modelBgs.options, modelNamesList, 'model');
        }

    } catch (error) {
        console.error(`[API Error] Ошибка при загрузке моделей для ${giftName}:`, error);
        state.modelNames = [];
        if (updateDOM) {
            dropdowns.modelBgs.options.innerHTML = `<div class="list-option list-placeholder">Модели не найдены</div>`;
        }
    }
}

    async function fetchAndParseMainColors(giftName, modelName) {
        const url = `${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/MainColors`;
        console.log(`%c[API Request] Fetching main colors for "${giftName} - ${modelName}" from: ${url}`, 'color: dodgerblue');
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const colorsString = await response.text();
            if (!colorsString) return [];

            const cleanedString = colorsString.trim().replace(/^['"]|['"]$/g, '');
            const colors = cleanedString.split(';').map(item => {
                const parts = item.trim().split(':');
                if (parts.length !== 2) return null;
                
                const posPart = parts[0];
                const xMatch = posPart.match(/X=(\d+)/);
                const yMatch = posPart.match(/Y=(\d+)/);
                
                return {
                    x: xMatch ? parseInt(xMatch[1], 10) : 0,
                    y: yMatch ? parseInt(yMatch[1], 10) : 0,
                    hex: '#' + parts[1]
                };
            }).filter(Boolean);
            console.log(`%c[API Success] Parsed main colors:`, 'color: green', colors);
            return colors;

        } catch (error) {
            console.error('[API Error] Ошибка при загрузке основных цветов:', error);
            return [];
        }
    }

    async function fetchMatchingBackgrounds() {
        const isGridEmpty = resultsGrid.innerHTML.trim() === '';
        showLoading(isGridEmpty);

        let apiUrl;
        let requestBody;
        const targetHexColors = state.findBgs.targetColors.map(c => c.hex);

        if (targetHexColors.length === 3 && targetHexColors.every(c => /^#[0-9A-F]{6}$/i.test(c))) {
            apiUrl = `${SERVER_BASE_URL}/api/MonoCoof/TopBackgroundColorsByColors`;
            requestBody = {
                ...getTelegramUserData(),
                colors: targetHexColors
            };
            console.log("%c[API Request] Using 3-color search:", 'color: purple', targetHexColors);
        } else if (state.findBgs.selectedGift && state.findBgs.selectedModel) {
            apiUrl = `${SERVER_BASE_URL}/api/MonoCoof/TopBackgroundColorsByNFT`;
            requestBody = {
                ...getTelegramUserData(),
                nameGift: state.findBgs.selectedGift,
                nameModel: state.findBgs.selectedModel
            };
            console.log(`%c[API Request] Using NFT-based search for: ${state.findBgs.selectedModel}`, 'color: dodgerblue');
        } else {
            hideLoading();
            resultsGrid.innerHTML = `<p style="text-align: center;">Выберите модель для поиска.</p>`;
            return;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

            const serverData = await response.json();
            console.log('%c[API Success] Received background data:', 'color: green', serverData);

            const enrichedBgs = serverData.map(item => {
                const foundColor = fixedColors.find(fc => fc.id === item.Key);
                return foundColor ? { ...foundColor, compatValue: item.Value } : null;
            }).filter(Boolean);
            
            state.findBgs.lastResults = enrichedBgs;
            hideLoading();
            renderBackgroundResults(enrichedBgs);

        } catch (error) {
            console.error('[API Error] Ошибка при поиске фонов:', error);
            hideLoading();
            resultsGrid.innerHTML = `<p style="text-align: center;">Не удалось загрузить данные.</p>`;
        }
    }

    async function fetchMatchingModels() {
        if (!state.findModels.selectedGift || !state.findModels.selectedColor) return;
        
        const isGridEmpty = resultsGrid.innerHTML.trim() === '';
        showLoading(isGridEmpty);

        const url = `${SERVER_BASE_URL}/api/MonoCoof/TopNftByColor`;
        const requestBody = {
            ...getTelegramUserData(), // <-- ДОБАВЛЕНО
            nameGift: state.findModels.selectedGift,
            nameColor: state.findModels.selectedColor.id,
            monohromeModelsOnly: false
        };

        console.log(`%c[API Request] Searching for models with POST to: ${url}`, 'color: dodgerblue');
        console.log('Request Body:', requestBody);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            
            const serverData = await response.json();
            console.log('%c[API Success] Received model data:', 'color: green', serverData);

            const modelsToRender = serverData.map(item => ({
                modelName: item.Name,
                giftName: state.findModels.selectedGift,
                compatValue: item.Coof,
                isMonohrome: item.IsMonohrome,
            }));
            
            state.findModels.lastResults = modelsToRender;
            hideLoading();
            renderModelResults(modelsToRender, state.findModels.selectedColor);

        } catch(error) {
             console.error('[API Error] Ошибка при поиске моделей:', error);
             hideLoading();
             resultsGrid.innerHTML = `<p style="text-align: center;">Не удалось загрузить данные. ${error}</p>`;
        }
    }

    // --- RENDERING ---

    function renderBackgroundResults(backgroundData) {
        resultsWrapper.classList.remove('results-initial-hide');
        resultsGrid.innerHTML = ''; 
        if (!backgroundData || backgroundData.length === 0) {
            resultsGrid.innerHTML = '<p style="text-align: center;">Подходящих фонов не найдено.</p>';
            return;
        }
        
        const modelImageUrl = `${API_PHOTO_URL}/${encodeURIComponent(state.findBgs.selectedGift)}/png/${encodeURIComponent(state.findBgs.selectedModel)}.png`;
        const fragment = document.createDocumentFragment();
        backgroundData.forEach(bg => {
            const card = document.createElement('div');
            card.className = 'result-card-bg';
            const compatValue = (bg.compatValue * 100).toFixed(1);

            card.innerHTML = `
                <div class="image-container" style="background: ${bg.gradient};">
                    <img data-src="${modelImageUrl}" alt="${state.findBgs.selectedModel}" class="model-image lazy-load">
                </div>
                <div class="info-container">
                    <p class="compat-value">${compatValue}%</p>
                    <p class="bg-name">${bg.name}</p>
                </div>`;

            card.addEventListener('click', () => {
                openDetailsModal({
                    imageUrl: modelImageUrl,
                    backgroundGradient: bg.gradient,
                    giftName: state.findBgs.selectedGift,
                    modelName: state.findBgs.selectedModel,
                    bgName: bg.name,
                    compatValue: compatValue
                });
            });
            fragment.appendChild(card);
        });
        resultsGrid.appendChild(fragment);
        setupLazyLoading(resultsGrid, null, 'grid');
    }

    function renderModelResults(modelData, backgroundColor) {
        resultsWrapper.classList.remove('results-initial-hide');
        resultsGrid.innerHTML = '';
        if (!backgroundColor || !modelData || modelData.length === 0) {
            resultsGrid.innerHTML = '<p style="text-align: center;">Подходящих моделей не найдено.</p>';
            return;
        }
        
        const fragment = document.createDocumentFragment();
        modelData.forEach(model => {
            const modelImageUrl = `${API_PHOTO_URL}/${encodeURIComponent(model.giftName)}/png/${encodeURIComponent(model.modelName)}.png`;
            const card = document.createElement('div');
            card.className = 'result-card-bg';
            const compatValue = (model.compatValue * 100).toFixed(1);

            card.innerHTML = `
                <div class="image-container" style="background: ${backgroundColor.gradient};">
                    <img data-src="${modelImageUrl}" alt="${model.modelName}" class="model-image lazy-load">
                </div>
                <div class="info-container">
                    <p class="compat-value">${compatValue}%</p>
                    <p class="bg-name">${model.modelName}</p>
                </div>`;
            
            card.addEventListener('click', () => {
                openDetailsModal({
                    imageUrl: modelImageUrl,
                    backgroundGradient: backgroundColor.gradient,
                    giftName: model.giftName,
                    modelName: model.modelName,
                    bgName: backgroundColor.name,
                    compatValue: compatValue
                });
            });
            fragment.appendChild(card);
        });
        resultsGrid.appendChild(fragment);
        setupLazyLoading(resultsGrid, null, 'grid');

    }

    // --- DROPDOWN LOGIC ---

    function populateDropdown(container, items, type) {
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const PRELOAD_COUNT = 15; // Предзагружаем первые 15 картинок

        items.forEach((item, index) => {
            const isPreload = index < PRELOAD_COUNT;
            const option = createDropdownOption(item, type, isPreload);
            fragment.appendChild(option);
        });
        container.appendChild(fragment);
        
        // Запускаем наблюдение за картинками, которые не были предзагружены
        const scrollRoot = container.closest('.dropdown-list');
        setupLazyLoading(container, scrollRoot, 'list');
    }

    function createDropdownOption(item, type, isPreload = false) {
        const option = document.createElement('div');
        option.classList.add('list-option');
        
        const placeholderImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        let imageHtml = '';
        let name = '';
        let statusHtml = '';

        const generateImageTag = (url, alt) => {
            if (isPreload) {
                return `<img src="${url}" alt="${alt}" class="option-image loaded">`;
            } else {
                return `<img src="${placeholderImg}" data-src="${url}" alt="${alt}" class="option-image lazy-load">`;
            }
        };
        
        if (type === 'gift') {
            name = item;
            const giftId = GIFT_NAME_TO_ID[name];
            if (giftId) {
                const imageUrl = `${API_GIFT_ORIGINALS_URL}/${giftId}/Original.png`;
                imageHtml = generateImageTag(imageUrl, name);
            }
        } else if (type === 'model') {
            name = item;
            const giftName = state.currentMode === 'findBgs' ? state.findBgs.selectedGift : state.findModels.selectedGift;
            if (giftName) {
                const imageUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(name)}.png`;
                imageHtml = generateImageTag(imageUrl, name);
            }
            const modelData = state.modelNames.find(m => m.name === name);
            if (modelData && modelData.isMonochrome === false) {
                statusHtml = `
                    <div class="monocolor-indicator">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>`;
            }
        } else if (type === 'color') {
            name = item.name;
            imageHtml = `<div class="color-swatch-mini" style="background: ${item.gradient};"></div>`;
            option.classList.add('color-option');
        }

        option.innerHTML = `${imageHtml}<span class="option-text">${name}</span>${statusHtml}`;
        option.dataset.value = (type === 'color') ? item.id : name;
        return option;
    }

    function displayMonocolorAlert(modelName) {
        const wrapper = document.getElementById('monocolor-alert-wrapper');
        if (!wrapper) return;

        if (!modelName) {
            wrapper.innerHTML = '';
            return;
        }

        const modelData = state.modelNames.find(m => m.name === modelName);
        if (modelData && modelData.isMonochrome === false) {
            wrapper.innerHTML = `
                <div class="monocolor-alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    Модель не является одноцветной
                </div>`;
        } else {
            wrapper.innerHTML = '';
        }
    }

    function toggleDropdown(dd, forceClose = false) {
        Object.values(dropdowns).forEach(dropdown => {
            const isTarget = dropdown === dd;
            const shouldClose = forceClose || !isTarget;
            
            if (shouldClose) {
                dropdown.list.classList.add('hidden');
                dropdown.header.classList.remove('open', 'active');
                if(dropdown.input.value === '') {
                    dropdown.header.classList.remove('value-active');
                }
            }
        });

        if (dd && !forceClose) {
            const isOpening = dd.list.classList.contains('hidden');
            if(isOpening) {
                dd.list.classList.remove('hidden');
                dd.header.classList.add('open', 'active');
                setTimeout(() => dd.input.focus(), 50);
            } else {
                 dd.list.classList.add('hidden');
                 dd.header.classList.remove('open', 'active');
            }
        }
    }
    
    function filterDropdown(input, optionsContainer, items, type) {
        const searchText = input.value.toLowerCase();
        const filtered = items.filter(item => {
            const name = (type === 'color') ? item.name : (type === 'model') ? item.name : item;
            return name.toLowerCase().includes(searchText);
        });
        const itemsToDisplay = (type === 'model') ? filtered.map(m => m.name) : filtered;
        populateDropdown(optionsContainer, itemsToDisplay, type);
    }
    
    // --- IN-PAGE COLOR PICKER LOGIC ---

    function resetPickerAreaToPlaceholder() {
        pickerContainer.innerHTML = `
            <div class="picker-image-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <span>Выберите модель</span>
            </div>`;
        pickerTargetColorsDisplay.innerHTML = `
            <div class="color-swatch placeholder"></div>
            <div class="color-swatch placeholder"></div>
            <div class="color-swatch placeholder"></div>
        `;
    }

    function setupInPageColorPicker() {
        const giftName = state.findBgs.selectedGift;
        const modelName = state.findBgs.selectedModel;
        
        if (!giftName || !modelName) return;

        // Clear placeholder and prepare for real content
        pickerContainer.innerHTML = `
            <img id="pickerPreviewImage" src="" alt="Gift Preview" crossorigin="anonymous">
            <canvas id="pickerColorCanvas" class="hidden"></canvas>`;
        pickerTargetColorsDisplay.innerHTML = ''; // Clear placeholder swatches
        
        // Re-acquire references to the newly created elements
        const pickerPreviewImg = document.getElementById('pickerPreviewImage');
        const pickerCanvas = document.getElementById('pickerColorCanvas');
        const pickerCtx = pickerCanvas.getContext('2d', { willReadFrequently: true });
        
        const imageUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
        pickerPreviewImg.src = imageUrl;

        pickerPreviewImg.onload = async () => {
            const initialColors = await fetchAndParseMainColors(giftName, modelName);
            const naturalWidth = pickerPreviewImg.naturalWidth;
            const naturalHeight = pickerPreviewImg.naturalHeight;
            
            state.findBgs.targetColors = initialColors.slice(0, 3).map(c => ({
                hex: c.hex,
                x: (c.x / naturalWidth) * 100,
                y: (c.y / naturalHeight) * 100
            }));
            
            pickerCanvas.width = naturalWidth;
            pickerCanvas.height = naturalHeight;
            pickerCtx.drawImage(pickerPreviewImg, 0, 0);

            placePickers(pickerContainer);
            updatePickerTargetColorsDisplay();
            triggerDebouncedSearch();
        };
        pickerPreviewImg.onerror = () => {
             console.error(`Failed to load image: ${imageUrl}`);
             resetPickerAreaToPlaceholder();
        }
    }
    
    function placePickers(container) {
        container.querySelectorAll('.color-picker').forEach(p => p.remove());
        state.findBgs.targetColors.forEach((colorData, index) => {
            const picker = document.createElement('div');
            picker.className = 'color-picker';
            picker.style.left = `${colorData.x}%`;
            picker.style.top = `${colorData.y}%`;
            
            const preview = document.createElement('div');
            preview.className = 'picker-color-preview';
            preview.style.backgroundColor = colorData.hex;
            picker.appendChild(preview);

            container.appendChild(picker);
            setupDraggablePicker(picker, index, container);
        });
    }

    function updatePickerTargetColorsDisplay() {
        pickerTargetColorsDisplay.innerHTML = ''; // Clear old swatches
        state.findBgs.targetColors.forEach(colorObj => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = colorObj.hex;
            swatch.innerHTML = `<span class="color-swatch-hex">${colorObj.hex.toUpperCase()}</span>`;
            pickerTargetColorsDisplay.appendChild(swatch);
        });
    }

    function setupDraggablePicker(picker, index, container) {
        let isDragging = false;
        const pickerCanvas = container.querySelector('#pickerColorCanvas');
        const pickerCtx = pickerCanvas.getContext('2d', { willReadFrequently: true });

        const onMove = (clientX, clientY) => {
            if (!isDragging) return;
            
            // Добавлено: сбрасываем таймер при любом движении
            clearTimeout(searchTimeout);

            const rect = container.getBoundingClientRect();
            let x = clientX - rect.left;
            let y = clientY - rect.top;
            x = Math.max(0, Math.min(rect.width, x));
            y = Math.max(0, Math.min(rect.height, y));
            
            const percX = (x / rect.width) * 100;
            const percY = (y / rect.height) * 100;

            picker.style.left = `${percX}%`;
            picker.style.top = `${percY}%`;
            
            updatePickerColor(picker, percX, percY, index, pickerCanvas, pickerCtx);
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            picker.classList.remove('dragging');
            
            // Запускаем новый таймер только когда пользователь отпустил пипетку
            triggerDebouncedSearch();
        };
        
        picker.addEventListener('mousedown', e => { isDragging = true; picker.classList.add('dragging'); e.preventDefault(); });
        document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
        document.addEventListener('mouseup', onEnd);
        picker.addEventListener('touchstart', e => { isDragging = true; picker.classList.add('dragging'); e.preventDefault(); }, { passive: false });
        document.addEventListener('touchmove', e => onMove(e.touches[0].clientX, e.touches[0].clientY));
        document.addEventListener('touchend', onEnd);
    }
    
    function updatePickerColor(picker, percX, percY, index, canvas, ctx) {
        if (!canvas.width || !canvas.height) return;
        const canvasX = Math.floor(percX / 100 * canvas.width);
        const canvasY = Math.floor(percY / 100 * canvas.height);
        
        const [r, g, b, a] = ctx.getImageData(canvasX, canvasY, 1, 1).data;
        
        if (a > 250) { 
            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
            picker.querySelector('.picker-color-preview').style.background = hex;

            if (state.findBgs.targetColors[index]) {
                state.findBgs.targetColors[index].hex = hex;
                state.findBgs.targetColors[index].x = percX;
                state.findBgs.targetColors[index].y = percY;
            }
            updatePickerTargetColorsDisplay();
        }
    }
    
    function triggerDebouncedSearch() {
        state.findBgs.lastResults = [];
        // clearTimeout сбрасывает предыдущий таймер. 
        // Если вы двигаете другую пипетку, новый отсчет начнется заново.
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(fetchMatchingBackgrounds, 800);
    }

    function triggerModelSearchIfReady() {
        if (state.findModels.selectedGift && state.findModels.selectedColor) {
            fetchMatchingModels();
        }
    }

    // --- EVENT LISTENERS ---
    
    modeSwitcher.addEventListener('click', (e) => {
        const tab = e.target.closest('.mode-tab');
        if (tab && tab.dataset.mode !== state.currentMode) {
            switchMode(tab.dataset.mode);
        }
    });

    Object.values(dropdowns).forEach(dd => {
        dd.header.addEventListener('click', () => toggleDropdown(dd));
        dd.input.addEventListener('input', () => {
            dd.header.classList.toggle('value-active', dd.input.value.trim() !== '');
            if (dd === dropdowns.giftBgs || dd === dropdowns.giftModels) {
                filterDropdown(dd.input, dd.options, state.giftNames, 'gift');
            } else if (dd === dropdowns.modelBgs) {
                filterDropdown(dd.input, dd.options, state.modelNames, 'model');
            } else if (dd === dropdowns.colorModels) {
                filterDropdown(dd.input, dd.options, fixedColors, 'color');
            }
        });
    });

    dropdowns.giftBgs.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        
        state.findBgs.lastResults = [];
        const selectedValue = option.dataset.value;
        state.findBgs.selectedGift = selectedValue;
        dropdowns.giftBgs.value.textContent = selectedValue;
        
        dropdowns.giftBgs.input.value = '';
        dropdowns.giftBgs.header.classList.remove('value-active');
        
        // Добавлено: сброс списка к полному состоянию
        populateDropdown(dropdowns.giftBgs.options, state.giftNames, 'gift');

        state.findBgs.selectedModel = null;
        dropdowns.modelBgs.value.textContent = 'Выберите модель';
        displayMonocolorAlert(null);
        resetPickerAreaToPlaceholder();
        clearResults();
        
        fetchAllModelNames(selectedValue);
        toggleDropdown(null, true);
    });
    
    dropdowns.modelBgs.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        
        state.findBgs.lastResults = [];
        const selectedValue = option.dataset.value;
        state.findBgs.selectedModel = selectedValue;
        dropdowns.modelBgs.value.textContent = selectedValue;

        dropdowns.modelBgs.input.value = '';
        dropdowns.modelBgs.header.classList.remove('value-active');

        // Добавлено: сброс списка к полному состоянию
        populateDropdown(dropdowns.modelBgs.options, state.modelNames.map(m => m.name), 'model');
        
        displayMonocolorAlert(selectedValue);
        
        clearResults();
        setupInPageColorPicker();
        toggleDropdown(null, true);
    });

    dropdowns.giftModels.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        
        state.findModels.lastResults = [];
        const selectedValue = option.dataset.value;
        state.findModels.selectedGift = selectedValue;
        dropdowns.giftModels.value.textContent = selectedValue;

        dropdowns.giftModels.input.value = '';
        dropdowns.giftModels.header.classList.remove('value-active');

        // Добавлено: сброс списка к полному состоянию
        populateDropdown(dropdowns.giftModels.options, state.giftNames, 'gift');

        fetchAllModelNames(selectedValue, false);
        toggleDropdown(null, true);
        triggerModelSearchIfReady();
    });
    
    dropdowns.colorModels.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        
        state.findModels.lastResults = [];
        const colorId = option.dataset.value;
        state.findModels.selectedColor = fixedColors.find(c => c.id === colorId);
        dropdowns.colorModels.value.textContent = state.findModels.selectedColor.name;

        dropdowns.colorModels.input.value = '';
        dropdowns.colorModels.header.classList.remove('value-active');

        // Добавлено: сброс списка к полному состоянию
        populateDropdown(dropdowns.colorModels.options, fixedColors, 'color');

        toggleDropdown(null, true);
        triggerModelSearchIfReady();
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown-container')) {
            toggleDropdown(null, true);
        }
    });

    // --- INITIALIZATION ---
    function init() {
        switchMode('findBgs');
        resetPickerAreaToPlaceholder();
        fetchAllGiftNames();
        populateDropdown(dropdowns.colorModels.options, fixedColors, 'color');
        
        // ДОБАВИТЬ ЭТИ СТРОКИ
        modalCloseBtn.addEventListener('click', closeDetailsModal);
        detailsModalOverlay.addEventListener('click', (e) => {
            if (e.target === detailsModalOverlay) {
                closeDetailsModal();
            }
        });
    }

    init();
});
