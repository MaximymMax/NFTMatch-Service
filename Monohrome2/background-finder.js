import themesModal from './modals/themes-modal.js';
import detailsModal from './modals/details-modal.js';

document.addEventListener('DOMContentLoaded', () => {

    const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net';
    const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
    const API_GIFT_ORIGINALS_URL = 'https://cdn.changes.tg/gifts/originals'; 
    const INIT_DATA_KEY = 'tgInitData';
    const BYPASS_KEY_STORAGE = 'apiBypassKey';

    // Словарь имен для картинок оригиналов (если нужно)
    const GIFT_NAME_TO_ID = {
        "Santa Hat": "5983471780763796287", "Signet Ring": "5936085638515261992", "Precious Peach": "5933671725160989227", "Plush Pepe": "5936013938331222567", "Spiced Wine": "5913442287462908725", "Jelly Bunny": "5915502858152706668", "Durov's Cap": "5915521180483191380", "Perfume Bottle": "5913517067138499193", "Eternal Rose": "5882125812596999035", "Berry Box": "5882252952218894938", "Vintage Cigar": "5857140566201991735", "Magic Potion": "5846226946928673709", "Kissed Frog": "5845776576658015084", "Hex Pot": "5825801628657124140", "Evil Eye": "5825480571261813595", "Sharp Tongue": "5841689550203650524", "Trapped Heart": "5841391256135008713", "Skull Flower": "5839038009193792264", "Scared Cat": "5837059369300132790", "Spy Agaric": "5821261908354794038", "Homemade Cake": "5783075783622787539", "Genie Lamp": "5933531623327795414", "Lunar Snake": "6028426950047957932", "Party Sparkler": "6003643167683903930", "Jester Hat": "5933590374185435592", "Witch Hat": "5821384757304362229", "Hanging Star": "5915733223018594841", "Love Candle": "5915550639663874519", "Cookie Heart": "6001538689543439169", "Desk Calendar": "5782988952268964995", "Jingle Bells": "6001473264306619020", "Snow Mittens": "5980789805615678057", "Voodoo Doll": "5836780359634649414", "Mad Pumpkin": "5841632504448025405", "Hypno Lollipop": "5825895989088617224", "B-Day Candle": "5782984811920491178", "Bunny Muffin": "5935936766358847989", "Astral Shard": "5933629604416717361", "Flying Broom": "5837063436634161765", "Crystal Ball": "5841336413697606412", "Eternal Candle": "5821205665758053411", "Swiss Watch": "5936043693864651359", "Ginger Cookie": "5983484377902875708", "Mini Oscar": "5879737836550226478", "Lol Pop": "5170594532177215681", "Ion Gem": "5843762284240831056", "Star Notepad": "5936017773737018241", "Loot Bag": "5868659926187901653", "Love Potion": "5868348541058942091", "Toy Bear": "5868220813026526561", "Diamond Ring": "5868503709637411929", "Sakura Flower": "5167939598143193218", "Sleigh Bell": "5981026247860290310", "Top Hat": "5897593557492957738", "Record Player": "5856973938650776169", "Winter Wreath": "5983259145522906006", "Snow Globe": "5981132629905245483", "Electric Skull": "5846192273657692751", "Tama Gadget": "6023752243218481939", "Candy Cane": "6003373314888696650", "Neko Helmet": "5933793770951673155", "Jack-in-the-Box": "6005659564635063386", "Easter Egg": "5773668482394620318", "Bonded Ring": "5870661333703197240", "Pet Snake": "6023917088358269866", "Snake Box": "6023679164349940429", "Xmas Stocking": "6003767644426076664", "Big Year": "6028283532500009446", "Holiday Drink": "6003735372041814769", "Gem Signet": "5859442703032386168", "Light Sword": "5897581235231785485", "Restless Jar": "5870784783948186838", "Nail Bracelet": "5870720080265871962", "Heroic Helmet": "5895328365971244193", "Bow Tie": "5895544372761461960", "Heart Locket": "5868455043362980631", "Lush Bouquet": "5871002671934079382", "Whip Cupcake": "5933543975653737112", "Joyful Bundle": "5870862540036113469", "Cupid Charm": "5868561433997870501", "Valentine Box": "5868595669182186720", "Snoop Dogg": "6014591077976114307", "Swag Bag": "6012607142387778152", "Snoop Cigar": "6012435906336654262", "Low Rider": "6014675319464657779", "Westside Sign": "6014697240977737490", "Stellar Rocket": "6042113507581755979", "Jolly Chimp": "6005880141270483700", "Moon Pendant": "5998981470310368313", "Ionic Dryer": "5933937398953018107", "Input Key": "5870972044522291836", "Mighty Arm": "5895518353849582541", "Artisan Brick": "6005797617768858105", "Clover Pin": "5960747083030856414", "Sky Stilettos": "5870947077877400011", "Fresh Socks": "5895603153683874485", "Happy Brownie": "6006064678835323371", "Ice Cream": "5900177027566142759", "Spring Basket": "5773725897517433693", "Instant Ramen": "6005564615793050414", "Faith Amulet": "6003456431095808759", "Mousse Cake": "5935877878062253519"
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

    // --- Helpers ---
    function getApiAuthHeader() {
        try {
            const initData = sessionStorage.getItem(INIT_DATA_KEY);
            if (initData) return `Tma ${initData}`;
        } catch (e) {}
        try {
             const bypassKey = sessionStorage.getItem(BYPASS_KEY_STORAGE);
             if (bypassKey) return `Tma ${bypassKey}`;
        } catch(e) {}
        if (window.Telegram?.WebApp?.initData) {
            sessionStorage.setItem(INIT_DATA_KEY, window.Telegram.WebApp.initData);
            return `Tma ${window.Telegram.WebApp.initData}`;
        }
        return 'Tma invalid';
    }

    async function secureFetch(apiUrl, requestBody) {
        const options = {
            method: requestBody ? 'POST' : 'GET',
            headers: { 'Authorization': getApiAuthHeader() }
        };
        if (requestBody) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(requestBody);
        }
        const response = await fetch(apiUrl, options);
        if (!response.ok) throw new Error(`[API ${response.status}]`);
        return await response.json();
    }
    
    // Передаем конфигурацию в модули модалок
    const modalConfig = { baseUrl: SERVER_BASE_URL, photoUrl: API_PHOTO_URL, secureFetch: secureFetch, fixedColors: fixedColors };
    
    // Инициализация модалок
    // themes-modal принимает setupLazyLoading, но мы можем упростить для примера
    const lazyLoadStub = (el) => { /* simplified logic needed here if themes uses it */ }; 
    themesModal.init(SERVER_BASE_URL, API_PHOTO_URL, lazyLoadStub, fixedColors); 
    detailsModal.init(modalConfig);

    // --- State & DOM Elements ---
    let state = {
        currentMode: 'findBgs',
        giftNames: [],
        modelNames: [], 
        findBgs: { selectedGift: null, selectedModel: null, targetColors: [], lastResults: [] },
        findModels: { selectedGift: null, selectedColor: null, lastResults: [] },
    };

    let searchTimeout = null;
    let observerMap = new Map();

    const dropdowns = {
        giftBgs: { header: document.getElementById('gift-dropdown-header-bgs'), list: document.getElementById('gift-dropdown-list-bgs'), input: document.getElementById('gift-search-bgs'), options: document.getElementById('gift-list-options-bgs'), value: document.getElementById('gift-selected-value-bgs') },
        modelBgs: { header: document.getElementById('model-dropdown-header-bgs'), list: document.getElementById('model-dropdown-list-bgs'), input: document.getElementById('model-search-bgs'), options: document.getElementById('model-list-options-bgs'), value: document.getElementById('model-selected-value-bgs') },
        giftModels: { header: document.getElementById('gift-dropdown-header-models'), list: document.getElementById('gift-dropdown-list-models'), input: document.getElementById('gift-search-models'), options: document.getElementById('gift-list-options-models'), value: document.getElementById('gift-selected-value-models') },
        colorModels: { header: document.getElementById('color-dropdown-header-models'), list: document.getElementById('color-dropdown-list-models'), input: document.getElementById('color-search-models'), options: document.getElementById('color-list-options-models'), value: document.getElementById('color-selected-value-models') }
    };
    
    const modeSwitcher = document.querySelector('.mode-switcher');
    const findBgsControls = document.getElementById('find-bgs-controls');
    const findModelsControls = document.getElementById('find-models-controls');
    const resultsWrapper = document.getElementById('results-wrapper');
    const loadingContainer = document.getElementById('loading-container');
    const resultsGrid = document.getElementById('results-grid');
    const pickerArea = document.getElementById('picker-area');
    const pickerContainer = document.getElementById('pickerContainer');
    const pickerTargetColorsDisplay = document.getElementById('pickerTargetColorsDisplay');

    // --- Core Logic ---

    // Основное изменение: вызов открытия модалки
    function handleResultClick(data) {
        // data: { giftName, modelName, bgName, gradient, compatValue, count }
        
        detailsModal.open({
            giftName: data.giftName,
            modelName: data.modelName,
            bgName: data.bgName,
            backgroundGradient: data.gradient,
            compatValue: data.compatValue,
            count: data.count
        }, {
            // Callbacks для переходов внутри модалки
            onThemeClick: (themes) => {
                 // Закрываем детали внутри detailsModal (это делает сам модуль) и открываем themes
                 themesModal.open(data.giftName, data.modelName, () => {
                     // При возврате из тем снова открываем детали
                     detailsModal.open({
                        giftName: data.giftName,
                        modelName: data.modelName,
                        bgName: data.bgName,
                        backgroundGradient: data.gradient,
                        compatValue: data.compatValue,
                        count: data.count
                     });
                 });
            },
            onBgClick: () => {
                // Переход на поиск по фону
                switchMode('findModels');
                state.findModels.selectedGift = data.giftName;
                
                const colorObj = fixedColors.find(c => c.name === data.bgName);
                if (colorObj) {
                    state.findModels.selectedColor = colorObj;
                    dropdowns.giftModels.value.textContent = data.giftName;
                    dropdowns.colorModels.value.textContent = colorObj.name;
                    fetchAllModelNames(data.giftName, false);
                    fetchMatchingModels();
                }
            },
            onModelClick: async () => {
                // Переход на поиск по модели
                switchMode('findBgs');
                state.findBgs.selectedGift = data.giftName;
                state.findBgs.selectedModel = data.modelName;
                
                dropdowns.giftBgs.value.textContent = data.giftName;
                dropdowns.modelBgs.value.textContent = data.modelName;
                
                await fetchAllModelNames(data.giftName, true);
                displayMonocolorAlert(data.modelName);
                setupInPageColorPicker();
            }
        });
    }

    const lazyLoadCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                observer.unobserve(img);
                img.classList.remove('lazy-load');
                img.src = img.dataset.src;
                img.onload = () => img.classList.add('loaded');
            }
        });
    };

    function setupLazyLoading(contentElement, scrollRoot, type) {
        if (!contentElement) return;
        const observerKey = scrollRoot || 'viewport';
        let observer = observerMap.get(observerKey);
        if (!observer) {
            const options = { root: scrollRoot, rootMargin: type === 'list' ? '600px' : '400px' };
            observer = new IntersectionObserver(lazyLoadCallback, options);
            observerMap.set(observerKey, observer);
        }
        contentElement.querySelectorAll('img.lazy-load').forEach(img => observer.observe(img));
    }

    function switchMode(mode) {
        state.currentMode = mode;
        modeSwitcher.classList.toggle('mode-models', mode === 'findModels');
        modeSwitcher.querySelectorAll('.mode-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));

        if (mode === 'findBgs') {
            findBgsControls.classList.add('active');
            findModelsControls.classList.remove('active');
            pickerArea.style.display = 'flex'; 
            if (state.findBgs.lastResults.length > 0) renderBackgroundResults(state.findBgs.lastResults);
            else if (state.findBgs.selectedModel) fetchMatchingBackgrounds();
            else clearResults();
        } else {
            findBgsControls.classList.remove('active');
            findModelsControls.classList.add('active');
            pickerArea.style.display = 'none'; 
            if (state.findModels.lastResults.length > 0) renderModelResults(state.findModels.lastResults, state.findModels.selectedColor);
            else if (state.findModels.selectedGift && state.findModels.selectedColor) fetchMatchingModels();
            else clearResults();
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

    function getPlural(count, one, few, many) {
        count = Math.abs(count);
        count %= 100;
        if (count >= 5 && count <= 20) return many;
        count %= 10;
        if (count === 1) return one;
        if (count >= 2 && count <= 4) return few;
        return many;
    }
    
    const getTelegramUserData = () => {
        let masterUserData = null;
        try {
            const cachedUserData = sessionStorage.getItem('tgUser');
            if (cachedUserData) masterUserData = JSON.parse(cachedUserData);
        } catch (e) {}

        if (!masterUserData) {
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            if (tgUser) {
                masterUserData = { telegramId: tgUser.id, username: tgUser.username || null };
                try { sessionStorage.setItem('tgUser', JSON.stringify({ ...masterUserData, telegramId: parseInt(tgUser.id, 10) })); } catch (e) {}
            }
        }
        
        if (masterUserData) {
            let numericId = parseInt(masterUserData.telegramId, 10);
            if (isNaN(numericId)) numericId = null;
            return { id: numericId, Username: masterUserData.username };
        }
        return { id: null, Username: null };
    };

    async function fetchAllGiftNames() {
        const cacheKey = 'giftNamesCache';
        try {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                state.giftNames = JSON.parse(cachedData);
                populateDropdown(dropdowns.giftBgs.options, state.giftNames, 'gift');
                populateDropdown(dropdowns.giftModels.options, state.giftNames, 'gift');
                return;
            }
        } catch (error) { sessionStorage.removeItem(cacheKey); }

        const url = `${SERVER_BASE_URL}/api/ListGifts/AllGiftNames`;
        try {
            state.giftNames = await secureFetch(url, null);
            try { sessionStorage.setItem(cacheKey, JSON.stringify(state.giftNames)); } catch (error) {}
            populateDropdown(dropdowns.giftBgs.options, state.giftNames, 'gift');
            populateDropdown(dropdowns.giftModels.options, state.giftNames, 'gift');
        } catch (error) { console.error(error); }
    }

    async function fetchAllModelNames(giftName, updateDOM = true) {
        if (!giftName) {
            if (updateDOM) dropdowns.modelBgs.options.innerHTML = `<div class="list-option list-placeholder">Сначала выберите коллекцию</div>`;
            state.modelNames = [];
            return;
        }
        const url = `${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/AllModelNames`;
        try {
            state.modelNames = await secureFetch(url, null);
            if (updateDOM) populateDropdown(dropdowns.modelBgs.options, state.modelNames, 'model');
        } catch (error) {
            state.modelNames = [];
            if (updateDOM) dropdowns.modelBgs.options.innerHTML = `<div class="list-option list-placeholder">Модели не найдены</div>`;
        }
    }

    async function fetchAndParseMainColors(giftName, modelName) {
        const url = `${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/MainColors`;
        try {
            const response = await fetch(url, { headers: { 'Authorization': getApiAuthHeader() } });
            if (!response.ok) return [];
            const colorsString = await response.text();
            if (!colorsString) return [];

            return colorsString.trim().replace(/^['"]|['"]$/g, '').split(';').map(item => {
                const parts = item.trim().split(':');
                if (parts.length !== 2) return null;
                const xMatch = parts[0].match(/X=(\d+)/);
                const yMatch = parts[0].match(/Y=(\d+)/);
                return { x: xMatch ? parseInt(xMatch[1], 10) : 0, y: yMatch ? parseInt(yMatch[1], 10) : 0, hex: '#' + parts[1] };
            }).filter(Boolean);
        } catch (error) { return []; }
    }

    async function fetchMatchingBackgrounds() {
        const isGridEmpty = resultsGrid.innerHTML.trim() === '';
        showLoading(isGridEmpty);
        let apiUrl, requestBody;
        const targetHexColors = state.findBgs.targetColors.map(c => c.hex);

        if (targetHexColors.length === 3 && targetHexColors.every(c => /^#[0-9A-F]{6}$/i.test(c))) {
            apiUrl = `${SERVER_BASE_URL}/api/MonoCoof/TopBackgroundColorsByColors`;
            requestBody = { ...getTelegramUserData(), Colors: targetHexColors };
        } else if (state.findBgs.selectedGift && state.findBgs.selectedModel) {
            apiUrl = `${SERVER_BASE_URL}/api/MonoCoof/TopBackgroundColorsByNFT`;
            requestBody = { ...getTelegramUserData(), NameGift: state.findBgs.selectedGift, NameModel: state.findBgs.selectedModel };
        } else {
            hideLoading();
            resultsGrid.innerHTML = `<p style="text-align: center;">Выберите модель для поиска.</p>`;
            return;
        }

        try {
            const serverData = await secureFetch(apiUrl, requestBody);
            const enrichedBgs = serverData.map(item => {
                const foundColor = fixedColors.find(fc => fc.id === item.Key);
                return foundColor ? { ...foundColor, compatValue: item.Value } : null;
            }).filter(Boolean);
            
            const resultsWithCounts = await fetchGiftCounts(enrichedBgs, state.findBgs.selectedGift, 'findBgs');
            state.findBgs.lastResults = resultsWithCounts;
            hideLoading();
            renderBackgroundResults(resultsWithCounts);
        } catch (error) {
            hideLoading();
            resultsGrid.innerHTML = `<p style="text-align: center;">Не удалось загрузить данные.</p>`;
        }
    }

    async function fetchMatchingModels() {
        if (!state.findModels.selectedGift || !state.findModels.selectedColor) return;
        showLoading(resultsGrid.innerHTML.trim() === '');
        const url = `${SERVER_BASE_URL}/api/MonoCoof/TopNftByColor`;
        const requestBody = { ...getTelegramUserData(), NameGift: state.findModels.selectedGift, NameColor: state.findModels.selectedColor.id, MonohromeModelsOnly: true };

        try {
            const serverData = await secureFetch(url, requestBody);
            const modelsToRender = serverData.map(item => ({ modelName: item.Name, giftName: state.findModels.selectedGift, compatValue: item.Coof, isMonohrome: item.IsMonohrome }));
            const resultsWithCounts = await fetchGiftCounts(modelsToRender, state.findModels.selectedGift, 'findModels');
            state.findModels.lastResults = resultsWithCounts;
            hideLoading();
            renderModelResults(resultsWithCounts, state.findModels.selectedColor);
        } catch(error) {
             hideLoading();
             resultsGrid.innerHTML = `<p style="text-align: center;">Не удалось загрузить данные.</p>`;
        }
    }

    async function fetchGiftCounts(results, giftName, mode) {
        let requestBody = [];
        if (mode === 'findBgs') {
            const modelName = state.findBgs.selectedModel;
            requestBody = results.map(bg => ({ NameGift: giftName, NameModel: modelName, BackgroundName: bg.id }));
        } else if (mode === 'findModels') {
            const bgName = state.findModels.selectedColor.id;
            requestBody = results.map(model => ({ NameGift: giftName, NameModel: model.modelName, BackgroundName: bgName }));
        }
        if (requestBody.length === 0) return results;

        const countApiUrl = `${SERVER_BASE_URL}/api/BaseInfo/GetCountsForModelsAndBackgrounds`;
        try {
            const countsData = await secureFetch(countApiUrl, requestBody);
            const countMap = new Map();
            if (mode === 'findBgs') {
                countsData.forEach(item => countMap.set(item.BackgroundName, item.Count));
                results.forEach(bg => { bg.count = countMap.has(bg.id) ? countMap.get(bg.id) : null; });
            } else if (mode === 'findModels') {
                countsData.forEach(item => countMap.set(item.NameModel, item.Count));
                results.forEach(model => { model.count = countMap.has(model.modelName) ? countMap.get(model.modelName) : null; });
            }
            return results;
        } catch (error) { return results; }
    }

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
                handleResultClick({ giftName: state.findBgs.selectedGift, modelName: state.findBgs.selectedModel, bgName: bg.name, gradient: bg.gradient, compatValue: compatValue, count: bg.count });
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
                handleResultClick({ giftName: model.giftName, modelName: model.modelName, bgName: backgroundColor.name, gradient: backgroundColor.gradient, compatValue: compatValue, count: model.count });
            });
            fragment.appendChild(card);
        });
        resultsGrid.appendChild(fragment);
        setupLazyLoading(resultsGrid, null, 'grid');
    }

    function populateDropdown(container, items, type) {
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const PRELOAD_COUNT = 15;
        items.forEach((item, index) => {
            fragment.appendChild(createDropdownOption(item, type, index < PRELOAD_COUNT));
        });
        container.appendChild(fragment);
        setupLazyLoading(container, container.closest('.dropdown-list'), 'list');
    }

    function createDropdownOption(item, type, isPreload = false) {
        const option = document.createElement('div');
        option.classList.add('list-option');
        const placeholderImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        let imageHtml = '', name = '', statusHtml = '';
        const generateImageTag = (url, alt) => isPreload ? `<img src="${url}" alt="${alt}" class="option-image loaded">` : `<img src="${placeholderImg}" data-src="${url}" alt="${alt}" class="option-image lazy-load">`;
        
        if (type === 'gift') {
            name = item;
            const giftId = GIFT_NAME_TO_ID[name];
            if (giftId) imageHtml = generateImageTag(`${API_GIFT_ORIGINALS_URL}/${giftId}/Original.png`, name);
            option.innerHTML = `${imageHtml}<span class="option-text">${name}</span>`;
            option.dataset.value = name;
        } else if (type === 'model') {
            name = item.NameModel; 
            const giftName = state.currentMode === 'findBgs' ? state.findBgs.selectedGift : state.findModels.selectedGift;
            if (giftName) imageHtml = generateImageTag(`${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(name)}.png`, name);
            const plural = getPlural(item.Themes?.length || 0, 'тематика', 'тематики', 'тематик');
            const themesHtml = item.Themes?.length > 0 ? `<span class="option-theme-count">${item.Themes.length} ${plural}</span>` : `<span class="option-theme-count"> </span>`; 
            if (item.IsMonochrome === false) statusHtml = `<div class="monocolor-indicator"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"/></svg></div>`;
            option.innerHTML = `${imageHtml}<div class="option-info-wrapper"><span class="option-text">${name}</span>${themesHtml}</div>${statusHtml}`;
            option.dataset.value = name;
        } else if (type === 'color') {
            name = item.name;
            imageHtml = `<div class="color-swatch-mini" style="background: ${item.gradient};"></div>`;
            option.classList.add('color-option');
            option.innerHTML = `${imageHtml}<span class="option-text">${name}</span>`;
            option.dataset.value = item.id;
        }
        return option;
    }

    function displayMonocolorAlert(modelName) {
        const wrapper = document.getElementById('monocolor-alert-wrapper');
        if (!wrapper) return;
        if (!modelName) { wrapper.innerHTML = ''; return; }
        const modelData = state.modelNames.find(m => m.NameModel === modelName);
        wrapper.innerHTML = (modelData && modelData.IsMonochrome === false) ? `<div class="monocolor-alert"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"/></svg>Модель не является одноцветной</div>` : '';
    }

    function toggleDropdown(dd, forceClose = false) {
        Object.values(dropdowns).forEach(dropdown => {
            if (forceClose || dropdown !== dd) {
                dropdown.list.classList.add('hidden');
                dropdown.header.classList.remove('open', 'active');
                if(dropdown.input.value === '') dropdown.header.classList.remove('value-active');
            }
        });
        if (dd && !forceClose) {
            const isOpening = dd.list.classList.contains('hidden');
            dd.list.classList.toggle('hidden', !isOpening);
            dd.header.classList.toggle('open', isOpening);
            dd.header.classList.toggle('active', isOpening);
            if(isOpening) setTimeout(() => dd.input.focus(), 50);
        }
    }
    
    function filterDropdown(input, optionsContainer, items, type) {
        const searchText = input.value.toLowerCase();
        const filtered = items.filter(item => {
            let name = (type === 'color') ? item.name : (type === 'model') ? item.NameModel : item;
            return name.toLowerCase().includes(searchText);
        });
        populateDropdown(optionsContainer, filtered, type);
    }
    
    function resetPickerAreaToPlaceholder() {
        pickerContainer.innerHTML = `<div class="picker-image-placeholder"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg><span>Выберите модель</span></div>`;
        pickerTargetColorsDisplay.innerHTML = `<div class="color-swatch placeholder"></div><div class="color-swatch placeholder"></div><div class="color-swatch placeholder"></div>`;
    }

    function setupInPageColorPicker() {
        const giftName = state.findBgs.selectedGift, modelName = state.findBgs.selectedModel;
        if (!giftName || !modelName) return;
        pickerContainer.innerHTML = `<img id="pickerPreviewImage" src="" alt="Gift Preview" crossorigin="anonymous"><canvas id="pickerColorCanvas" class="hidden"></canvas>`;
        pickerTargetColorsDisplay.innerHTML = '';
        const pickerPreviewImg = document.getElementById('pickerPreviewImage');
        const pickerCanvas = document.getElementById('pickerColorCanvas');
        const pickerCtx = pickerCanvas.getContext('2d', { willReadFrequently: true });
        const imageUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
        
        pickerPreviewImg.src = imageUrl;
        pickerPreviewImg.onload = async () => {
            const initialColors = await fetchAndParseMainColors(giftName, modelName);
            state.findBgs.targetColors = initialColors.slice(0, 3).map(c => ({ hex: c.hex, x: (c.x / pickerPreviewImg.naturalWidth) * 100, y: (c.y / pickerPreviewImg.naturalHeight) * 100 }));
            pickerCanvas.width = pickerPreviewImg.naturalWidth;
            pickerCanvas.height = pickerPreviewImg.naturalHeight;
            pickerCtx.drawImage(pickerPreviewImg, 0, 0);
            placePickers(pickerContainer);
            updatePickerTargetColorsDisplay();
            triggerDebouncedSearch();
        };
        pickerPreviewImg.onerror = () => resetPickerAreaToPlaceholder();
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
        pickerTargetColorsDisplay.innerHTML = '';
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
            clearTimeout(searchTimeout);
            const rect = container.getBoundingClientRect();
            let x = Math.max(0, Math.min(rect.width, clientX - rect.left));
            let y = Math.max(0, Math.min(rect.height, clientY - rect.top));
            const percX = (x / rect.width) * 100, percY = (y / rect.height) * 100;
            picker.style.left = `${percX}%`; picker.style.top = `${percY}%`;
            updatePickerColor(picker, percX, percY, index, pickerCanvas, pickerCtx);
        };
        const onEnd = () => { if (!isDragging) return; isDragging = false; picker.classList.remove('dragging'); triggerDebouncedSearch(); };
        picker.addEventListener('mousedown', e => { isDragging = true; picker.classList.add('dragging'); e.preventDefault(); });
        document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
        document.addEventListener('mouseup', onEnd);
        picker.addEventListener('touchstart', e => { isDragging = true; picker.classList.add('dragging'); e.preventDefault(); }, { passive: false });
        document.addEventListener('touchmove', e => onMove(e.touches[0].clientX, e.touches[0].clientY));
        document.addEventListener('touchend', onEnd);
    }
    
    function updatePickerColor(picker, percX, percY, index, canvas, ctx) {
        if (!canvas.width) return;
        const [r, g, b, a] = ctx.getImageData(Math.floor(percX / 100 * canvas.width), Math.floor(percY / 100 * canvas.height), 1, 1).data;
        if (a > 250) { 
            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
            picker.querySelector('.picker-color-preview').style.background = hex;
            if (state.findBgs.targetColors[index]) { state.findBgs.targetColors[index].hex = hex; state.findBgs.targetColors[index].x = percX; state.findBgs.targetColors[index].y = percY; }
            updatePickerTargetColorsDisplay();
        }
    }
    
    function triggerDebouncedSearch() {
        state.findBgs.lastResults = [];
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(fetchMatchingBackgrounds, 800);
    }

    modeSwitcher.addEventListener('click', (e) => {
        const tab = e.target.closest('.mode-tab');
        if (tab && tab.dataset.mode !== state.currentMode) switchMode(tab.dataset.mode);
    });

    Object.values(dropdowns).forEach(dd => {
        dd.header.addEventListener('click', () => toggleDropdown(dd));
        dd.input.addEventListener('input', () => {
            dd.header.classList.toggle('value-active', dd.input.value.trim() !== '');
            filterDropdown(dd.input, dd.options, (dd === dropdowns.giftBgs || dd === dropdowns.giftModels) ? state.giftNames : (dd === dropdowns.modelBgs) ? state.modelNames : fixedColors, (dd === dropdowns.colorModels) ? 'color' : (dd === dropdowns.modelBgs) ? 'model' : 'gift');
        });
    });

    dropdowns.giftBgs.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        state.findBgs.selectedGift = option.dataset.value;
        dropdowns.giftBgs.value.textContent = option.dataset.value;
        dropdowns.giftBgs.input.value = ''; dropdowns.giftBgs.header.classList.remove('value-active');
        populateDropdown(dropdowns.giftBgs.options, state.giftNames, 'gift');
        state.findBgs.selectedModel = null; dropdowns.modelBgs.value.textContent = 'Выберите модель';
        displayMonocolorAlert(null); resetPickerAreaToPlaceholder(); clearResults();
        fetchAllModelNames(option.dataset.value); toggleDropdown(null, true);
    });
    
    dropdowns.modelBgs.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        state.findBgs.selectedModel = option.dataset.value;
        dropdowns.modelBgs.value.textContent = option.dataset.value;
        dropdowns.modelBgs.input.value = ''; dropdowns.modelBgs.header.classList.remove('value-active');
        populateDropdown(dropdowns.modelBgs.options, state.modelNames, 'model');
        displayMonocolorAlert(option.dataset.value); clearResults(); setupInPageColorPicker(); toggleDropdown(null, true);
    });

    dropdowns.giftModels.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        state.findModels.selectedGift = option.dataset.value;
        dropdowns.giftModels.value.textContent = option.dataset.value;
        dropdowns.giftModels.input.value = ''; dropdowns.giftModels.header.classList.remove('value-active');
        populateDropdown(dropdowns.giftModels.options, state.giftNames, 'gift');
        fetchAllModelNames(option.dataset.value, false); toggleDropdown(null, true);
        if (state.findModels.selectedGift && state.findModels.selectedColor) fetchMatchingModels();
    });
    
    dropdowns.colorModels.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        state.findModels.selectedColor = fixedColors.find(c => c.id === option.dataset.value);
        dropdowns.colorModels.value.textContent = state.findModels.selectedColor.name;
        dropdowns.colorModels.input.value = ''; dropdowns.colorModels.header.classList.remove('value-active');
        populateDropdown(dropdowns.colorModels.options, fixedColors, 'color');
        toggleDropdown(null, true);
        if (state.findModels.selectedGift && state.findModels.selectedColor) fetchMatchingModels();
    });

    document.addEventListener('click', (e) => { if (!e.target.closest('.custom-dropdown-container')) toggleDropdown(null, true); });

    async function applyUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const paramMode = urlParams.get('mode'), paramGift = urlParams.get('gift'), paramColor = urlParams.get('color'), paramModel = urlParams.get('model');
        if (!paramMode) return;
        if (paramMode === 'findModels' || paramMode === 'findBgs') switchMode(paramMode);

        if (state.currentMode === 'findModels' && paramGift && paramColor) {
            if (state.giftNames.includes(paramGift)) {
                state.findModels.selectedGift = paramGift; dropdowns.giftModels.value.textContent = paramGift; await fetchAllModelNames(paramGift, false);
            }
            const colorData = fixedColors.find(c => c.id.toLowerCase() === paramColor.toLowerCase() || c.name.toLowerCase() === paramColor.toLowerCase());
            if (colorData) { state.findModels.selectedColor = colorData; dropdowns.colorModels.value.textContent = colorData.name; }
            if(state.findModels.selectedGift && state.findModels.selectedColor) fetchMatchingModels();
        } else if (state.currentMode === 'findBgs' && paramGift && paramModel) {
            if (state.giftNames.includes(paramGift)) {
                state.findBgs.selectedGift = paramGift; dropdowns.giftBgs.value.textContent = paramGift; await fetchAllModelNames(paramGift, true);
            }
            const modelData = state.modelNames.find(m => m.NameModel.toLowerCase() === paramModel.toLowerCase());
            if (modelData) {
                state.findBgs.selectedModel = modelData.NameModel; dropdowns.modelBgs.value.textContent = modelData.NameModel;
                displayMonocolorAlert(modelData.NameModel); setupInPageColorPicker();
            }
        }
    }

    async function init() {
        switchMode('findBgs');
        resetPickerAreaToPlaceholder();
        populateDropdown(dropdowns.colorModels.options, fixedColors, 'color');
        await fetchAllGiftNames();
        await applyUrlParameters();
    }
    init();
});