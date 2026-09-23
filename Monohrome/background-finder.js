document.addEventListener('DOMContentLoaded', () => {

    const SERVER_BASE_URL = window.CONFIG?.SERVER_BASE_URL || 'https://nftmatch.pro';
    const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models';
    const API_GIFT_ORIGINALS_URL = 'https://cdn.changes.tg/gifts/originals';
    const INIT_DATA_KEY = 'tgInitData';
    const BYPASS_KEY_STORAGE = 'apiBypassKey';

    function initTelegramData() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();

            tg.BackButton.offClick(); // Очищаем старые обработчики
            tg.BackButton.show();

            tg.BackButton.onClick(() => {
                // Проверяем, открыта ли модалка деталей
                const detailsModal = document.getElementById('details-modal-overlay');
                if (detailsModal && !detailsModal.classList.contains('hidden')) {
                    // Если модалка открыта - закрываем её через браузерную историю
                    window.history.back();
                } else {
                    // Если модалки нет - возвращаемся на главную
                    window.location.href = '../index.html' + (window.location.hash || '');
                }
            });
        }
    }

    // ВЫЗЫВАЕМ ФУНКЦИЮ СРАЗУ
    initTelegramData();

    // --- НОВАЯ ФУНКЦИЯ: Синхронизация URL с текущим состоянием ---
    function updateUrlState(modalData = null) {
        const params = new URLSearchParams();

        // 1. Сохраняем режим
        params.set('mode', state.currentMode);

        // 2. Сохраняем параметры в зависимости от режима
        if (state.currentMode === 'findBgs') {
            if (state.findBgs.selectedGift) params.set('gift', state.findBgs.selectedGift);
            if (state.findBgs.selectedModel) params.set('model', state.findBgs.selectedModel);
        } else if (state.currentMode === 'findUniversal') {
            if (state.findUniversal.selectedGift) params.set('gift', state.findUniversal.selectedGift);
            if (state.findUniversal.selectedColor) params.set('color', state.findUniversal.selectedColor.id);
            params.set('sort', state.findUniversal.sortBy);
            params.set('desc', state.findUniversal.descending); // <-- Добавляем эту строку
        } else {
            if (state.findModels.selectedGifts.length) params.set('gifts', state.findModels.selectedGifts.join(','));
            if (state.findModels.selectedColor) params.set('color', state.findModels.selectedColor.id); // Или name, как тебе удобнее
        }

        // 3. Если открыта модалка, сохраняем её параметры
        // Мы ожидаем, что modalData придет в формате: { giftName, modelName, bgName }
        if (modalData) {
            params.set('view', 'details');
            params.set('d_gift', modalData.giftName);
            params.set('d_model', modalData.modelName);
            if (modalData.bgName) params.set('d_bg', modalData.bgName);
        }

        // 4. Обновляем URL без перезагрузки
        // Используем pushState, чтобы кнопка "Назад" возвращала к предыдущему состоянию
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    let hasUserModifiedColors = false;

    function getPlural(count, one, few, many) {
        count = Math.abs(count);
        count %= 100;
        if (count >= 5 && count <= 20) {
            return many;
        }
        count %= 10;
        if (count === 1) {
            return one;
        }
        if (count >= 2 && count <= 4) {
            return few;
        }
        return many;
    }

    function getOuterColor(gradientString) {
    if (!gradientString) return '#16213a';
    // Находим все rgb/rgba внутри строки градиента
    const matches = gradientString.match(/rgba?\([^)]+\)/g);
    // Берем самый последний цвет, он и будет "крайним"
    return (matches && matches.length > 0) ? matches[matches.length - 1] : '#16213a';
}

    let idToNameDictLocal = null;
    fetch('https://cdn.changes.tg/gifts/id-to-name.json')
        .then(r => r.json())
        .then(data => {
            idToNameDictLocal = data;
            window.idToNameDict = data;
        })
        .catch(err => console.error("Failed to load collection dict in background-finder", err));

    function getGiftIdByName(name) {
        if (!name) return null;
        const searchStr = name.toLowerCase().trim();
        
        // 1. Ищем в динамически загруженном словаре
        const dict = idToNameDictLocal || window.idToNameDict;
        if (dict) {
            const entry = Object.entries(dict).find(([id, val]) => (val || '').toLowerCase().trim() === searchStr);
            if (entry) return entry[0];
        }
        
        // 2. Фолбэк на статический словарь
        if (GIFT_NAME_TO_ID && GIFT_NAME_TO_ID[name]) {
            return GIFT_NAME_TO_ID[name];
        }
        
        // 3. Фолбэк на нечеткий поиск в статическом словаре
        if (GIFT_NAME_TO_ID) {
            const entry = Object.entries(GIFT_NAME_TO_ID).find(([key, id]) => key.toLowerCase().trim() === searchStr);
            if (entry) return entry[1];
        }
        
        return null;
    }

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
        "Mousse Cake": "5935877878062253519",
        "Bling Binky": "5902339509239940491",
        "Money Pot": "5963238670868677492",
        "Pretty Posy": "5933737850477478635",
        "Khabib's Papakha": "5839094187366024301",
        "UFC Strike": "5882260270843168924",
        "Victory Medal": "5830340739074097859"
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

    function updateDropdownSelection(dropdown, value) {
        if (!dropdown || !dropdown.value) return;
        dropdown.value.textContent = value;
        if (dropdown.input) dropdown.input.value = ''; // Сброс поиска
        if (dropdown.header) dropdown.header.classList.remove('value-active');
    }

    function getApiAuthHeader() {
        if (window.NFTAuth && typeof window.NFTAuth.getApiAuthHeader === 'function') {
            return window.NFTAuth.getApiAuthHeader();
        }
        if (window.getApiAuthHeader && typeof window.getApiAuthHeader === 'function') {
            return window.getApiAuthHeader();
        }
        return 'Tma invalid';
    }


    async function secureFetch(apiUrl, requestBody, signal = null) {
        const authHeader = getApiAuthHeader();

        // 1. ЛОГИКА ТЕСТИРОВАНИЯ (Simulate Check)
        // Если есть ключ обхода И параметр isSubscribed = 'false', вызываем ошибку
        const bypassKey = sessionStorage.getItem(BYPASS_KEY_STORAGE);
        const isSubscribedParam = sessionStorage.getItem('isSubscribed');

        if (bypassKey && isSubscribedParam === 'false') {
            console.warn("%c[TEST MODE] Subscription Check Failed (Simulated)", "color: orange");

            // Имитируем задержку сети
            await new Promise(r => setTimeout(r, 500));

            // Показываем модалку
            showSubscriptionModal("-100FAKEID");

            // Прерываем выполнение, выкидывая ошибку, как будто пришел 403
            throw new Error("[TEST MODE] Subscription required");
        }

        const options = {
            method: requestBody ? 'POST' : 'GET',
            headers: {
                'Authorization': authHeader
            },
            signal: signal
        };

        if (requestBody) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(requestBody);
        }

        const response = await fetch(apiUrl, options);

        // 2. ОБРАБОТКА ОШИБКИ 403 (РЕАЛЬНАЯ)
        if (response.status === 403) {
            try {
                // Клонируем, так как response.json() можно прочитать только один раз
                const errorData = await response.clone().json();

                if (errorData.error === 'subscription_required') {
                    console.warn("[API] Subscription required. Channel ID:", errorData.channelId);
                    showSubscriptionModal(errorData.channelId);
                    throw new Error("Subscription required"); // Прерываем цепочку промисов
                }
            } catch (e) {
                // Если не удалось распарсить JSON или это не та ошибка, пробрасываем дальше
                if (e.message === "Subscription required") throw e;
            }
        }

        if (!response.ok) {
            let errorDetails = await response.text();
            try {
                const errorJson = JSON.parse(errorDetails);
                errorDetails = errorJson.error || errorJson.message || errorDetails;
            } catch (e) { }

            throw new Error(`[API ${response.status}] ${errorDetails}`);
        }

        return await response.json();
    }

    // ❗️ ЭТА ФУНКЦИЯ ТЕПЕРЬ ПУБЛИЧНАЯ
    window.closeSubscriptionModal = function () {
        const overlay = document.querySelector('.sub-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        }
        
        // 🔥 ВОЗОБНОВЛЯЕМ АНИМАЦИЮ ПРИ ЗАКРЫТИИ
        const lottie = document.querySelector('lottie-player');
        if (lottie && lottie.play) {
            lottie.play();
        }
    };
    // Публикуем в window, чтобы другие скрипты видели её
    window.closeSubscriptionModal = closeSubscriptionModal;

    // ❗️ ЭТА ФУНКЦИЯ ТЕПЕРЬ ПУБЛИЧНАЯ
    window.showSubscriptionModal = function(channelId) {
        if (typeof hideLoading === 'function') hideLoading();

        let overlay = document.querySelector('.sub-modal-overlay');
        if (overlay) return; // Не открываем, если уже есть

        // Ссылка на аватарку
        const avatarUrl = "./NFTMatchChannel.png";

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
                    <h3 class="sub-title">${window.NFTi18n ? window.NFTi18n.t('sub_required', 'Требуется подписка') : 'Требуется подписка'}</h3>
                    <p class="sub-text">${window.NFTi18n ? window.NFTi18n.t('sub_desc', 'Для использования поиска необходимо подписаться на наш Telegram канал.') : 'Для использования поиска необходимо подписаться на наш Telegram канал.'}</p>
                    
                    <a href="https://t.me/NFTstyler" target="_blank" class="sub-btn">
                        ${window.NFTi18n ? window.NFTi18n.t('btn_subscribe', 'Подписаться') : 'Подписаться'}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>
                    
                    <button class="sub-btn check-btn" onclick="window.closeSubscriptionModal()">
                        ${window.NFTi18n ? window.NFTi18n.t('btn_subscribed', 'Я подписался') : 'Я подписался'}
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        
        overlay = document.querySelector('.sub-modal-overlay');
        // Небольшая задержка для анимации
        setTimeout(() => overlay.classList.add('active'), 10);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) window.closeSubscriptionModal();
        });
    }
    // Публикуем в window, чтобы другие скрипты видели её
    window.showSubscriptionModal = showSubscriptionModal;

    async function createSimilarButtonFallback(giftName, modelName) {
        const url = `${SERVER_BASE_URL}/api/BaseInfo/GetSimilarGiftsForVisualization/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}`;

        // Создаем ссылку (пока пустую)
        const link = document.createElement('a');

        // ❗️ Путь с / в начале ❗️
        link.href = `../nft-page/index.html?giftName=${encodeURIComponent(giftName)}&modelName=${encodeURIComponent(modelName)}&randomGiftsCount=100`;

        link.id = 'show-themes-link'; // Тот же ID для наследования размеров
        link.className = 'similar-fallback-style'; // Наш новый класс для стилей

        try {
            const data = await secureFetch(url, null);

            if (!data || !data.SimilarGifts || data.SimilarGifts.length < 2) {
                throw new Error('Not enough similar gifts found');
            }

            const color = data.TargetGiftMainColorHex || '#2563eb'; // Запасной синий
            link.style.setProperty('--similar-color', color);

            const imgLeftSrc = `${API_PHOTO_URL}/${encodeURIComponent(data.SimilarGifts[0].GiftName)}/png/${encodeURIComponent(data.SimilarGifts[0].ModelName)}.png`;
            const imgRightSrc = `${API_PHOTO_URL}/${encodeURIComponent(data.SimilarGifts[1].GiftName)}/png/${encodeURIComponent(data.SimilarGifts[1].ModelName)}.png`;

            link.innerHTML = `
            <div class="fallback-glow"></div>
            <img src="${imgLeftSrc}" alt="similar 1" class="fallback-img left">
            <span>${window.NFTi18n ? window.NFTi18n.t('btn_similar_colors', 'Похожие по цвету') : 'Похожие по цвету'}</span>
            <img src="${imgRightSrc}" alt="similar 2" class="fallback-img right">
        `;

        } catch (error) {
            console.warn("[Similar Fallback] Ошибка:", error.message, "Создаем кнопку без картинок.");
            // Создаем кнопку, даже если API упал
            link.style.setProperty('--similar-color', '#2563eb'); // Запасной синий
            link.innerHTML = `
            <div class="fallback-glow"></div>
            <span>${window.NFTi18n ? window.NFTi18n.t('btn_similar_colors', 'Похожие по цвету') : 'Похожие по цвету'}</span>
        `;
        }

        return link;
    }

    async function renderSimilarGiftsFallback(container, giftName, modelName, onClickCallback = null) {
        // Устанавливаем спиннер, пока грузится
        container.innerHTML = `
        <span style="font-size: 0.9rem; color: var(--text-muted);">
            <span class="loading-spinner-mini" style="width:14px; height: 14px; border-width: 2px;"></span>
            ${window.NFTi18n ? window.NFTi18n.t('deep_link_loading', 'Загрузка...') : 'Загрузка...'}
        </span>`;

        const url = `${SERVER_BASE_URL}/api/BaseInfo/GetSimilarGiftsForVisualization/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}`;

        try {
            const data = await secureFetch(url, null);

            if (!data || !data.SimilarGifts || data.SimilarGifts.length === 0) {
                throw new Error("Похожие гифты не найдены.");
            }

            // --- Создаем карточку (аналогично themes-modal.js) ---

            const card = document.createElement('div');
            card.className = 'theme-card-stylized';

            if (data.TargetGiftMainColorHex) {
                card.style.setProperty('--cluster-color', data.TargetGiftMainColorHex);
            } else {
                card.classList.add('no-color');
            }

            // Градиент
            const gradientBg = document.createElement('div');
            gradientBg.className = 'theme-gradient-bg';

            // Картинки
            const flyout = document.createElement('div');
            flyout.className = 'theme-model-flyout';
            data.SimilarGifts.slice(0, 5).forEach((gift, index) => {
                const img = document.createElement('img');
                // ❗️ Используем API_PHOTO_URL из этого файла
                img.src = `${API_PHOTO_URL}/${encodeURIComponent(gift.GiftName)}/png/${encodeURIComponent(gift.ModelName)}.png`;
                img.alt = gift.ModelName;
                img.className = `model-img-${index + 1}`;
                flyout.appendChild(img);
            });

            // Правая колонка
            const rightCol = document.createElement('div');
            rightCol.className = 'theme-card-right-col';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'theme-card-stylized-info';

            const title = document.createElement('h3');
            title.textContent = window.NFTi18n ? window.NFTi18n.t('similar_label', 'Похожие') : 'Похожие';

            const subtitle = document.createElement('p');
            subtitle.textContent = window.NFTi18n ? window.NFTi18n.t('similar_by_color', 'по цвету') : 'по цвету';
            subtitle.style.color = "var(--text-primary)"; // Делаем белым

            infoDiv.appendChild(title);
            infoDiv.appendChild(subtitle);

            // Стрелка
            const arrow = document.createElement('div');
            arrow.className = 'theme-card-arrow';
            arrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>`;

            rightCol.appendChild(infoDiv);
            rightCol.appendChild(arrow);

            // Собираем карточку
            card.appendChild(gradientBg);
            card.appendChild(flyout);
            card.appendChild(rightCol);

            // Навигация (❗️ с исправленным путем ❗️)
            const destUrl = `../nft-page/index.html?giftName=${encodeURIComponent(giftName)}&modelName=${encodeURIComponent(modelName)}&randomGiftsCount=100`;

            card.addEventListener('click', (e) => {
                e.preventDefault();
                // Выполняем колбэк (например, закрытие модалки), если он есть
                if (onClickCallback) {
                    onClickCallback();
                }
                const hash = window.location.hash;
                window.location.href = destUrl + (hash && hash.includes('tgWebAppData') ? hash : '');
            });

            // Добавляем в DOM
            container.innerHTML = ''; // Очищаем спиннер
            container.appendChild(card);

        } catch (error) {
            console.error(`[Themes Fallback] Ошибка:`, error);
            container.innerHTML = `<span style="font-size: 0.9rem; color: #f87171;">${window.NFTi18n ? window.NFTi18n.t('modal_load_error', 'Ошибка загрузки') : 'Ошибка загрузки'}</span>`;
        }
    }

    async function updateModelThemes(modelName) {
        const container = document.getElementById('model-themes-container');
        if (container) {
            container.innerHTML = ''; // Очищаем и ничего не добавляем
            container.style.display = 'none'; // Скрываем блок
        }
    }

    async function loadThemesForModal(giftName, modelName, container) {
        if (!container) return;
        container.innerHTML = '';

        try {
            // ❗️ ИЗМЕНЕНИЕ: Новый URL
            const url = `${SERVER_BASE_URL}/api/BaseInfo/GetCollectionByGift/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/WithParameters`;
            const themes = await secureFetch(url, null);

            if (themes && themes.length > 0) {
                const themeCount = themes.length;
                let pluralName;
                if (window.NFTi18n && window.NFTi18n.getLanguage() === 'en') {
                    pluralName = themeCount === 1 ? window.NFTi18n.t('plural_theme_loc_1') : window.NFTi18n.t('plural_theme_loc_2');
                } else {
                    pluralName = getPlural(themeCount, window.NFTi18n ? window.NFTi18n.t('plural_theme_loc_1') : 'тематике', window.NFTi18n ? window.NFTi18n.t('plural_theme_loc_2') : 'тематикам', window.NFTi18n ? window.NFTi18n.t('plural_theme_loc_5') : 'тематикам');
                }
                const ending = getCountEnding(themeCount);

                const link = document.createElement('a');
                link.href = '#';
                link.id = 'show-themes-link';

                const labelTemplate = window.NFTi18n ? window.NFTi18n.t('belongs_to_themes', '', {count: `${themeCount}${ending}`, plural: pluralName}) : `Принадлежит ${themeCount}${ending} ${pluralName}`;

                link.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                <span>${labelTemplate}</span>
            `;

                link.onclick = (e) => {
                    e.preventDefault();
                    closeDetailsModal(true);
                    if (window.themesModal) {
                        // ❗️ ИЗМЕНЕНИЕ: Передаем полный массив [Collection]
                        window.themesModal.open(themes, giftName, modelName);
                    }
                };

                container.appendChild(link);

            } else {
                // ⬇️ ❗️❗️ ЗАМЕНИ БЛОК 'ELSE' ❗️❗️ ⬇️

                // СТАЛО:
                container.innerHTML = `
                <span style="font-size: 0.9rem; color: var(--text-muted);">
                    <span class="loading-spinner-mini" style="width:14px; height: 14px; border-width: 2px;"></span>
                </span>`; // Показываем мини-спиннер

                // Асинхронно создаем нашу новую кнопку
                const link = await createSimilarButtonFallback(giftName, modelName);

                link.onclick = (e) => {
                    e.preventDefault();
                    closeDetailsModal(false); // Закрываем модалку
                    const hash = window.location.hash;
                    window.location.href = link.href + (hash && hash.includes('tgWebAppData') ? hash : '');
                };

                container.innerHTML = ''; // Очищаем спиннер
                container.appendChild(link);

                // ⬆️ ❗️❗️ КОНЕЦ ЗАМЕНЫ ❗️❗️ ⬆️
            }

        } catch (error) {
            console.error('[API Error] Ошибка при загрузке тематик для модалки:', error);
            container.innerHTML = `<span style="font-size: 0.9rem; color: #f87171;">${window.NFTi18n ? window.NFTi18n.t('load_error_retry', 'Ошибка загрузки тем') : 'Ошибка загрузки тем'}</span>`;
        }
    }

    let state = {
        currentMode: 'findBgs', // putya: "убери режим комбо" — findUniversal (Комбо) больше не режим по умолчанию
        giftNames: [],
        modelNames: [],
        findBgs: {
            selectedGift: null, // коллекция ТЕКУЩЕЙ выбранной модели (для diagram/API-запросов)
            selectedGifts: [], // putya: "несколько коллекций в обеих режимах" — фильтр списка моделей; [] значит "все"
            selectedModel: null,
            targetColors: [],
            lastResults: [],
            v2Data: null,
            v2ViewMode: 'groups', // putya: "две кнопки... слева по группам, справа все" — переключатель под ★ Монохромные фоны
            minMassCustomized: false, // putya: "если нет цвета больше 30%, отображай 10" — пока true, авто-подбор дефолта не трогает ручной выбор
        },
        findModels: {
            selectedGifts: [], // putya: "несколько коллекций в обеих режимах" — [] значит "все коллекции"
            selectedColor: null,
            lastResults: [],
        },
        findUniversal: {
            selectedGifts: [], 
            selectedColors: [], 
            sortBy: 'FloorPrice', // Сортируем по цене (было 'Coof')
            descending: false,    // От меньшей к большей (было true)
            minCoof: 0.85,        // 85% уже стоит, все ок
            page: 1,
            lastResults: [],
            applied: {
                selectedGifts: [],
                selectedColors: [],
                sortBy: 'FloorPrice', // И здесь тоже
                descending: false,    // И здесь тоже
                minCoof: 0.85
            }
        }
    };

    let nftsState = {
        isExpanded: false,
        page: 1,
        pageSize: 18, // По 18 штук (3 колонки x 6 рядов)
        isLoading: false,
        hasMore: true,
        currentGift: null,
        currentModel: null,
        currentBg: null,
        observer: null
    };
    let searchTimeout = null;

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


    function getCountEnding(count) {
        const lastDigit = count % 10;
        const lastTwo = count % 100;
        if (lastTwo >= 11 && lastTwo <= 19) return 'ти';
        if (lastDigit === 1) return 'й';
        if (lastDigit >= 2 && lastDigit <= 4) return 'м';
        return 'ти'; // 0, 5, 6, 7, 8, 9
    }

    function setupLazyLoading(contentElement, scrollRoot, type) {
        if (!contentElement) return;

        const observerKey = scrollRoot || 'viewport';
        let observer = observerMap.get(observerKey);

        if (!observer) {
            const options = {
                root: scrollRoot,
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

    const modeSwitcher = document.querySelector('.mode-switcher');
    const findBgsControls = document.getElementById('find-bgs-controls');
    const findModelsControls = document.getElementById('find-models-controls');
    const resultsWrapper = document.getElementById('results-wrapper');
    const loadingContainer = document.getElementById('loading-container');
    const resultsGrid = document.getElementById('results-grid');


    const pickerArea = document.getElementById('picker-area');
    const pickerContainer = document.getElementById('pickerContainer');
    const pickerTargetColorsDisplay = document.getElementById('pickerTargetColorsDisplay');

    const bgsV2Wrapper = document.getElementById('bgs-v2-wrapper');
    const bgsV2Loading = document.getElementById('bgs-v2-loading');
    const bgsV2Diagram = document.getElementById('bgs-v2-diagram');
    const bgsV2Body = document.getElementById('bgs-v2-body');

    const detailsModalOverlay = document.getElementById('details-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalPhotoContainer = document.querySelector('.modal-photo-container');
    const modalGiftName = document.getElementById('modal-gift-name');
    const modalModelName = document.getElementById('modal-model-name');
    const modalBgName = document.getElementById('modal-bg-name');
    const modalCompatValue = document.getElementById('modal-compat-value');
    const modalGiftCount = document.getElementById('modal-gift-count');

    const dropdowns = {
        giftUniv: {
            header: document.getElementById('gift-dropdown-header-univ'),
            list: document.getElementById('gift-dropdown-list-univ'),
            input: document.getElementById('gift-search-univ'),
            options: document.getElementById('gift-list-options-univ'),
            value: document.getElementById('gift-selected-value-univ'),
        },
        colorUniv: {
            header: document.getElementById('color-dropdown-header-univ'),
            list: document.getElementById('color-dropdown-list-univ'),
            input: document.getElementById('color-search-univ'),
            options: document.getElementById('color-list-options-univ'),
            value: document.getElementById('color-selected-value-univ'),
        },
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

    async function openDetailsModal(data) {
        // 1. Показываем глобальный лоадер, чтобы пользователь понимал, что идет загрузка
        showLoading(false); // false = не очищать сетку результатов, просто показать спиннер поверх или в углу
        // Если showLoading работает только для сетки, можно добавить простой курсор wait
        document.body.style.cursor = 'wait';

        try {
            // Подготовка переменных DOM
            const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="search-icon-small"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>`;

            // --- ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА ДАННЫХ ---

            // Формируем промис для тематик
            const themesUrl = `${SERVER_BASE_URL}/api/Thematic/GetCollectionByGift/${encodeURIComponent(data.giftName)}/${encodeURIComponent(data.modelName)}`;
            const themesPromise = secureFetch(themesUrl, null).catch(err => {
                console.warn("Themes fetch failed", err);
                return []; // Возвращаем пустой массив при ошибке, чтобы не ломать всё окно
            });

            // Формируем промис для рендеринга кнопки (мы модифицируем renderSimilarButton, чтобы она возвращала промис)
            // Но renderSimilarButton сразу пишет в DOM. 
            // Для "прелоада" нам нужно сначала очистить контейнер кнопки, чтобы там не было старого,
            // а renderSimilarButton отработает и вставит кнопку.
            const btnContainer = document.getElementById('modal-similar-btn-container');
            // Мы вызываем renderSimilarButton с await
            const buttonPromise = renderSimilarButton(btnContainer, data.giftName, data.modelName);

            // Ждем завершения всех запросов
            const [themes] = await Promise.all([themesPromise, buttonPromise]);

            // --- ЗАПОЛНЕНИЕ DOM (Когда данные уже есть) ---

            // 1. Фото и фон
            const lottieUrl = `${API_PHOTO_URL}/${encodeURIComponent(data.giftName)}/lottie/${encodeURIComponent(data.modelName)}.json`;
            modalPhotoContainer.style.background = data.backgroundGradient || 'var(--surface-color)';
            modalPhotoContainer.innerHTML = `
                <lottie-player src="${lottieUrl}" background="transparent" speed="1" loop autoplay></lottie-player>
            `;

            // 2. Текстовые данные
            document.getElementById('modal-gift-name').textContent = data.giftName;

            const modelNameEl = document.getElementById('modal-model-name');
            const bgNameEl = document.getElementById('modal-bg-name');

            // Клонирование для сброса лисенеров
            const newModelEl = modelNameEl.cloneNode(true);
            const newBgEl = bgNameEl.cloneNode(true);
            modelNameEl.parentNode.replaceChild(newModelEl, modelNameEl);
            bgNameEl.parentNode.replaceChild(newBgEl, bgNameEl);

            // Сброс классов
            newModelEl.className = 'info-value';
            newBgEl.className = 'info-value';

            newModelEl.textContent = data.modelName;
            newBgEl.textContent = data.bgName;

            // Логика перекрестных ссылок
            if (state.currentMode === 'findBgs') {
                newBgEl.classList.add('action-link');
                newBgEl.title = "Найти лучшие модели с этим фоном";
                newBgEl.innerHTML = `${data.bgName} ${iconSvg}`;
                newBgEl.onclick = () => {
                    closeDetailsModal(false);
                    switchMode('findModels');
                    const colorObj = fixedColors.find(c => c.name === data.bgName);
                    if (colorObj) {
                        state.findModels.selectedGifts = [data.giftName];
                        state.findModels.selectedColor = colorObj;
                        updateMultiSelectText(dropdowns.giftModels, state.findModels.selectedGifts, window.NFTi18n ? window.NFTi18n.t('placeholder_all_collections') : 'Все коллекции');
                        dropdowns.colorModels.value.textContent = colorObj.name;
                        fetchMatchingModels();
                    }
                };
            } else {
                newModelEl.classList.add('action-link');
                newModelEl.title = "Найти лучшие фоны для этой модели";
                newModelEl.innerHTML = `${data.modelName} ${iconSvg}`;
                newModelEl.onclick = async () => {
                    closeDetailsModal(false);
                    switchMode('findBgs');
                    state.findBgs.selectedGifts = [data.giftName];
                    state.findBgs.selectedGift = data.giftName;
                    state.findBgs.selectedModel = data.modelName;
                    updateMultiSelectText(dropdowns.giftBgs, state.findBgs.selectedGifts, BGS_COLLECTIONS_PLACEHOLDER());
                    dropdowns.modelBgs.value.textContent = data.modelName;
                    await fetchAllModelNames(data.giftName, true);
                    displayMonocolorAlert(data.modelName);
                    fetchBgsV2();
                };
            }

            // Совпадение и Количество
            modalCompatValue.textContent = `${data.compatValue}%`;
            modalGiftCount.classList.remove('count-error');
            modalGiftCount.textContent = (data.count !== null && data.count !== undefined) ? `${data.count} шт` : '-';

            // 3. Тематики (используем уже загруженные данные themes)
            const themesValueEl = document.getElementById('modal-themes-value');
            themesValueEl.className = 'info-value'; // сброс

            if (themes && themes.length > 0) {
                const count = themes.length;
                let plural;
                if (window.NFTi18n && window.NFTi18n.getLanguage() === 'en') {
                    plural = count === 1 ? window.NFTi18n.t('plural_themes_1') : window.NFTi18n.t('plural_themes_2');
                } else {
                    plural = getPlural(count, window.NFTi18n ? window.NFTi18n.t('plural_themes_1') : 'тематика', window.NFTi18n ? window.NFTi18n.t('plural_themes_2') : 'тематики', window.NFTi18n ? window.NFTi18n.t('plural_themes_5') : 'тематик');
                }
                themesValueEl.classList.add('link-style');
                themesValueEl.innerHTML = `${count} ${plural} ${iconSvg}`;
                themesValueEl.onclick = () => {
                    if (window.themesModal) {
                        // 1. Скрываем текущее окно (Детали)
                        detailsModalOverlay.classList.add('hidden');

                        // 2. Открываем окно Тематик
                        // Передаем (GiftName, ModelName, Callback при возврате)
                        window.themesModal.open(data.giftName, data.modelName, () => {
                            // Этот код выполнится, когда в тематиках нажмут "Назад"
                            detailsModalOverlay.classList.remove('hidden');
                        });
                    }
                };
            } else {
                themesValueEl.textContent = 'Нет';
                themesValueEl.onclick = null;
            }

            // 4. Инициализация секции NFT (она свернута, данные грузить не надо)
            initNFTsSection(data.giftName, data.modelName, data.bgName);

            // --- ОТКРЫТИЕ ОКНА ---
            // Скрываем лоадеры
            hideLoading();
            document.body.style.cursor = 'default';

            // И только теперь показываем модалку
            document.body.classList.add('modal-open');
            detailsModalOverlay.classList.remove('hidden');

        } catch (error) {
            console.error("Ошибка при открытии модального окна:", error);
            hideLoading();
            document.body.style.cursor = 'default';
            // Можно показать алерт об ошибке
        }
        updateUrlState({
            giftName: data.giftName,
            modelName: data.modelName,
            bgName: data.bgName
        });
    }

    // Функция для рендеринга золотой кнопки в модалке
    // --- ЗАМЕНИТЬ ФУНКЦИЮ ПОЛНОСТЬЮ: renderSimilarButton ---
    // --- ЗАМЕНИТЬ ФУНКЦИЮ ПОЛНОСТЬЮ: renderSimilarButton ---
    async function renderSimilarButton(container, giftName, modelName) {
        container.innerHTML = '<div class="loading-spinner-mini"></div>';

        const similarUrl = `${SERVER_BASE_URL}/api/MonoCoof/SimilarNFTs`;
        const body = {
            NameTargetGift: giftName,
            NameTargetModel: modelName,
            MonohromeModelsOnly: true
        };

        try {
            const [responseData, mainColors] = await Promise.all([
                secureFetch(similarUrl, body),
                fetchAndParseMainColors(giftName, modelName)
            ]);

            // --- ОБНОВЛЕННАЯ ЛОГИКА ЦВЕТА (Смягченная) ---
            let bgColor = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
            let textColor = '#ffffff';
            let customBorder = '';

            if (mainColors && mainColors.length > 0) {
                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                const colorsToUse = mainColors.slice(0, 3);

                colorsToUse.forEach(c => {
                    const hex = c.hex.replace('#', '');
                    if (hex.length === 6) {
                        rSum += parseInt(hex.substring(0, 2), 16);
                        gSum += parseInt(hex.substring(2, 4), 16);
                        bSum += parseInt(hex.substring(4, 6), 16);
                        count++;
                    }
                });

                if (count > 0) {
                    const r = Math.round(rSum / count);
                    const g = Math.round(gSum / count);
                    const b = Math.round(bSum / count);

                    const brightness = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);

                    if (brightness > 140) {
                        // ФОН СВЕТЛЫЙ (Deep Tone) - Мягче
                        // Умножаем на 0.45 (было 0.35)
                        const factor = 0.45;
                        const tr = Math.round(r * factor);
                        const tg = Math.round(g * factor);
                        const tb = Math.round(b * factor);
                        textColor = `rgb(${tr}, ${tg}, ${tb})`;
                        customBorder = 'none';
                    } else {
                        // ФОН ТЕМНЫЙ (Pale Tone) - Мягче
                        // Смешиваем с белым на 70% (было 85%)
                        const mix = 0.70;
                        const tr = Math.round(r + (255 - r) * mix);
                        const tg = Math.round(g + (255 - g) * mix);
                        const tb = Math.round(b + (255 - b) * mix);
                        textColor = `rgb(${tr}, ${tg}, ${tb})`;
                    }

                    // Градиент
                    bgColor = `linear-gradient(180deg, rgba(${r},${g},${b}, 1) 0%, rgba(${Math.max(0, r - 20)},${Math.max(0, g - 20)},${Math.max(0, b - 20)}, 1) 100%)`;
                }
            }

            // --- ЛОГИКА ИКОНОК ---
            let allCandidates = [];
            if (responseData) {
                Object.keys(responseData).forEach(gName => {
                    const groupData = responseData[gName];
                    if (groupData && groupData.SimilarModels) {
                        groupData.SimilarModels.forEach(m => {
                            if (gName === giftName && m.Key === modelName) return;
                            allCandidates.push({
                                gift: gName,
                                model: m.Key,
                                score: m.Value
                            });
                        });
                    }
                });
            }

            if (allCandidates.length === 0) {
                container.innerHTML = '';
                return;
            }

            allCandidates.sort((a, b) => b.score - a.score);
            const topCandidates = allCandidates.slice(0, 10);

            let item1, item2;
            if (topCandidates.length > 0) {
                const idx1 = Math.floor(Math.random() * topCandidates.length);
                item1 = topCandidates[idx1];

                const differentCollectionCandidates = topCandidates.filter(c => c.gift !== item1.gift);
                if (differentCollectionCandidates.length > 0) {
                    const idx2 = Math.floor(Math.random() * differentCollectionCandidates.length);
                    item2 = differentCollectionCandidates[idx2];
                } else {
                    const differentModelCandidates = topCandidates.filter(c => c.model !== item1.model);
                    if (differentModelCandidates.length > 0) {
                        const idx2 = Math.floor(Math.random() * differentModelCandidates.length);
                        item2 = differentModelCandidates[idx2];
                    }
                }
            }

            // --- РЕНДЕРИНГ ---
            const href = `../nft-page/index.html?giftName=${encodeURIComponent(giftName)}&modelName=${encodeURIComponent(modelName)}&randomGiftsCount=100`;
            const btn = document.createElement('a');
            btn.className = 'similar-color-btn';
            btn.href = href;

            btn.style.background = bgColor;
            btn.style.setProperty('color', textColor, 'important');
            btn.style.textShadow = 'none';

            if (customBorder) btn.style.border = customBorder;

            // ФИКС ВЫРАВНИВАНИЯ
            const imgStyle = 'display:block; margin:0;';
            const img1 = item1 ? `<img src="${API_PHOTO_URL}/${encodeURIComponent(item1.gift)}/png/${encodeURIComponent(item1.model)}.png" class="similar-btn-icon" style="${imgStyle}" alt="">` : '';
            const img2 = item2 ? `<img src="${API_PHOTO_URL}/${encodeURIComponent(item2.gift)}/png/${encodeURIComponent(item2.model)}.png" class="similar-btn-icon" style="${imgStyle}" alt="">` : '';

            btn.innerHTML = `
                ${img1}
                <span style="display:inline-block; line-height:1; padding-top:1px;">${window.NFTi18n ? window.NFTi18n.t('btn_similar_colors') : 'Похожие по цвету'}</span>
                ${img2}
            `;

            btn.onclick = (e) => {
                e.preventDefault();
                const hash = window.location.hash;
                window.location.href = href + (hash && hash.includes('tgWebAppData') ? hash : '');
            };

            container.innerHTML = '';
            container.appendChild(btn);

        } catch (error) {
            console.error('[Similar Button API Error]', error);
            container.innerHTML = '';
        }
    }

    function closeDetailsModal(keepOverlayOpen = false) {
        detailsModalOverlay.classList.add('hidden');

        // Очищаем контейнеры
        const themesContainer = document.getElementById('modal-themes-container');
        if (themesContainer) themesContainer.innerHTML = '';

        // ВАЖНО: Если мы не "свопаем" на другое модальное окно (например, Тематик),
        // а просто закрываем или переходим к поиску на странице -> убираем класс modal-open
        // keepOverlayOpen = true только если мы открываем ThemesModal поверх.
        if (!keepOverlayOpen) {
            document.body.classList.remove('modal-open');
        }
        if (!keepOverlayOpen) {
            updateUrlState(null); // Передаем null, чтобы убрать параметры d_*
        }
    }

    // 🔥 ЗАМЕНИ ФУНКЦИЮ switchMode НА ЭТУ:
    function switchMode(mode, updateUrl = true) {
    state.currentMode = mode;

    // НОВОЕ управление анимацией ползунка через data-атрибут
    modeSwitcher.setAttribute('data-active-mode', mode);

    modeSwitcher.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // ... (весь остальной код функции switchMode остается без изменений) ...
    const findUniversalControls = document.getElementById('find-universal-controls');
    
    findBgsControls.classList.remove('active');
    findModelsControls.classList.remove('active');
    if (findUniversalControls) findUniversalControls.classList.remove('active');

    if (mode === 'findBgs') {
        findBgsControls.classList.add('active');
        resultsWrapper.classList.add('results-initial-hide');
        bgsV2Wrapper.classList.remove('results-initial-hide');
        if (state.findBgs.v2Data) renderBgsV2(state.findBgs.v2Data);
        else if (state.findBgs.selectedModel) fetchBgsV2();
        else clearBgsV2();
    } else if (mode === 'findModels') {
        findModelsControls.classList.add('active');
        bgsV2Wrapper.classList.add('results-initial-hide');
        if (state.findModels.lastResults.length > 0) renderModelResults(state.findModels.lastResults, state.findModels.selectedColor);
        else if (state.findModels.selectedColor) fetchMatchingModels();
        else clearResults();
    } else if (mode === 'findUniversal') {
        if (findUniversalControls) findUniversalControls.classList.add('active');
        bgsV2Wrapper.classList.add('results-initial-hide');
        if (state.findUniversal.lastResults.length > 0) {
            renderUniversalResults(state.findUniversal.lastResults);
        } else {
            fetchUniversalMonochromes();
        }
    }

    mountMonoFilterFor(mode, () => monoLastRender && monoLastRender());

    if (updateUrl) updateUrlState();
}

async function fetchUniversalMonochromes(append = false) {
        if (state.findUniversal.isLoading) return;

        if (!append) {
            state.findUniversal.page = 1;
            state.findUniversal.hasMore = true;
        }

        if (!state.findUniversal.hasMore) return;

        state.findUniversal.isLoading = true;
        const isGridEmpty = resultsGrid.innerHTML.trim() === '';
        if (!append) showLoading(isGridEmpty);

        // Формируем payload на основе массивов
        const requestBody = {
            CollectionNames: state.findUniversal.selectedGifts.length > 0 ? state.findUniversal.selectedGifts : null,
            BackgroundNames: state.findUniversal.selectedColors.length > 0 ? state.findUniversal.selectedColors.map(c => c.id) : null,
            SortBy: state.findUniversal.sortBy,
            Descending: state.findUniversal.descending,
            MinCoof: state.findUniversal.minCoof,
            Page: state.findUniversal.page,
            PageSize: 42
        };

        try {
            const data = await secureFetch(`${SERVER_BASE_URL}/api/MonoCoof/BestMonochromes`, requestBody);
            const newItems = data.Items || [];

            if (append) {
                state.findUniversal.lastResults = state.findUniversal.lastResults.concat(newItems);
            } else {
                state.findUniversal.lastResults = newItems;
            }

            if (newItems.length < 42) {
                state.findUniversal.hasMore = false;
            } else {
                state.findUniversal.page++;
            }

            hideLoading();
            renderUniversalResults(newItems, append);
            state.findUniversal.isLoading = false;
        } catch (error) {
            console.error('[API Error] Универсальный поиск:', error);
            hideLoading();
            if (!append) resultsGrid.innerHTML = `<p style="text-align: center; color: #f87171;">${window.NFTi18n ? window.NFTi18n.t('load_error_retry', 'Ошибка загрузки данных') : 'Ошибка загрузки данных'}</p>`;
            state.findUniversal.isLoading = false;
        }
    }

    function setupUniversalIntersectionObserver() {
        if (state.findUniversal.observer) state.findUniversal.observer.disconnect();

        const options = {
            root: null, 
            rootMargin: '400px',
            threshold: 0.1
        };

        state.findUniversal.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && state.findUniversal.hasMore && !state.findUniversal.isLoading) {
                fetchUniversalMonochromes(true);
            }
        }, options);

        if (resultsGrid.lastElementChild) {
            state.findUniversal.observer.observe(resultsGrid.lastElementChild);
        }
    }

    function updateMultiSelectText(dropdownObj, selectedArray, defaultText) {
        if (selectedArray.length === 0) {
            dropdownObj.value.textContent = defaultText;
            dropdownObj.header.classList.remove('value-active');
        } else if (selectedArray.length === 1) {
            // Если выбран фон, выводим его имя, а не объект
            const name = typeof selectedArray[0] === 'object' ? selectedArray[0].name : selectedArray[0];
            dropdownObj.value.textContent = name;
            dropdownObj.header.classList.add('value-active');
        } else {
            dropdownObj.value.textContent = window.NFTi18n ? window.NFTi18n.t('selected_count', '', {count: selectedArray.length}) : `Выбрано: ${selectedArray.length}`;
            dropdownObj.header.classList.add('value-active');
        }
        
        // Подсвечиваем выбранные опции в списке
        const allOptions = dropdownObj.list.querySelectorAll('.list-option');
        allOptions.forEach(opt => {
            const val = opt.dataset.value;
            if (val === 'ALL') {
                opt.classList.toggle('selected', selectedArray.length === 0);
            } else {
                const isSelected = selectedArray.some(s => (typeof s === 'object' ? s.id : s) === val);
                opt.classList.toggle('selected', isSelected);
            }
        });
    }

function initUniversalFilters() {
    const slider = document.getElementById('univ-min-coof');
    const sliderLabel = document.getElementById('min-coof-value');
    
    // Функция проверки изменений
    window.updateSearchButtonState = function() {
        const btn = document.getElementById('univ-search-btn');
        if (!btn) return;
        const app = state.findUniversal.applied;
        const cur = state.findUniversal;
        
        // Массивы могут быть в разном порядке, но мы можем просто сравнивать их ID
        const getIds = (arr) => arr.map(i => typeof i === 'object' ? i.id : i).sort().join(',');
        
        const giftsChanged = getIds(app.selectedGifts) !== getIds(cur.selectedGifts);
        const colorsChanged = getIds(app.selectedColors) !== getIds(cur.selectedColors);
        const sortChanged = app.sortBy !== cur.sortBy;
        const descChanged = app.descending !== cur.descending;
        const coofChanged = app.minCoof !== cur.minCoof;
        
        const isDirty = giftsChanged || colorsChanged || sortChanged || descChanged || coofChanged;
        
        if (isDirty) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.filter = 'grayscale(0)';
            btn.querySelector('svg').style.transform = 'scale(1.1)';
        } else {
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
            btn.style.filter = 'grayscale(1)';
            btn.querySelector('svg').style.transform = 'scale(1)';
        }
    };

    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        sliderLabel.textContent = val + '%';
        state.findUniversal.minCoof = val / 100;
        e.target.style.background = `linear-gradient(to right, var(--primary-color) ${val}%, rgba(0, 0, 0, 0.3) ${val}%)`;
        window.updateSearchButtonState();
    });

    document.getElementById('univ-sort-type').addEventListener('click', (e) => {
        const tab = e.target.closest('.mini-tab');
        if (!tab) return;
        document.querySelectorAll('#univ-sort-type .mini-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.findUniversal.sortBy = tab.dataset.sort;
        window.updateSearchButtonState();
    });

    const dirBtn = document.getElementById('univ-direction-btn');
    dirBtn.addEventListener('click', () => {
        state.findUniversal.descending = !state.findUniversal.descending;
        dirBtn.classList.toggle('asc', !state.findUniversal.descending);
        window.updateSearchButtonState();
    });

    document.getElementById('univ-search-btn').addEventListener('click', () => {
        state.findUniversal.applied = {
            selectedGifts: [...state.findUniversal.selectedGifts],
            selectedColors: [...state.findUniversal.selectedColors],
            sortBy: state.findUniversal.sortBy,
            descending: state.findUniversal.descending,
            minCoof: state.findUniversal.minCoof
        };
        window.updateSearchButtonState();
        
        state.findUniversal.page = 1;
        fetchUniversalMonochromes();
        toggleDropdown(null, true);
    });
    
    window.updateSearchButtonState();
}

function renderUniversalResults(items, append = false) {
    resultsWrapper.classList.remove('results-initial-hide');
    const sourceItems = items || [];
    setMonoTypeCounts(sourceItems, monoTypeOf);
    monoLastRender = () => renderUniversalResults(sourceItems, false);
    mountMonoFilterFor('findUniversal', () => monoLastRender && monoLastRender());
    items = sourceItems.filter(i => passesMonoFilter(monoTypeOf(i)));
    
    if (!append) {
        resultsGrid.innerHTML = '';
    }
    
    if (!append && (!items || items.length === 0)) {
        resultsGrid.innerHTML = monoEmptyHtml(window.NFTi18n ? window.NFTi18n.t('no_results') : 'Ничего не найдено.');
        return;
    }

    if (append && (!items || items.length === 0)) return;

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const bgObj = fixedColors.find(c => c.name === item.BackgroundName || c.id === item.BackgroundName) || { gradient: '#16213a', name: item.BackgroundName };
        const modelImageUrl = `${API_PHOTO_URL}/${encodeURIComponent(item.CollectionName)}/png/${encodeURIComponent(item.ModelName)}.png`;
        const monoType = monoTypeOf(item);

        const card = document.createElement('div');
        card.className = 'result-card-bg';
        card.style.background = bgObj.gradient;

        // Логика цены: только цена и иконка (чуть больше)
        const formattedPrice = formatPrice(item.FloorPrice);
        const priceTag = formattedPrice ? `
            <div class="badge-price" style="font-size: 0.9rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 4px;">
                ${formattedPrice}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.012 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.882-1.826h10.817c1.033 0 1.873.815 1.873 1.822a1.8 1.8 0 0 1-.274.951M6.51 8.863l4.633 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.004-.72-.484-.72h-4.149z"/>
                </svg>
            </div>` : '';

        card.innerHTML = `
            ${monoTagHtml(monoType)}
            <div class="image-container">
                <img data-src="${modelImageUrl}" alt="${item.ModelName}" class="model-image lazy-load">
            </div>
            <div class="info-container">
                <div class="info-text">
                    <div class="info-collection">${item.CollectionName}</div>
                    <div class="info-model">${item.ModelName}</div>
                </div>
                <div class="info-badges">
                    ${monoPercentBadge(monoType, item.Coof)}
                    ${priceTag}
                </div>
            </div>`;

        card.addEventListener('click', () => {
            if (window.themesModal) {
                window.themesModal.openModelDetail(item.CollectionName, item.ModelName, item.BackgroundName);
            }
        });
        fragment.appendChild(card);
    });
    
    resultsGrid.appendChild(fragment);
    setupLazyLoading(resultsGrid, null, 'grid');
    setupUniversalIntersectionObserver();
}

    // === Типы монохрома (MonoTypeClassifier на бэкенде) =========================================
    // putya: "проценты монохрома не будет, будут просто вот эти метки". Монохромные типы —
    // flat/tonal/accent/achromatic; contrast/partial/none метку не получают.
    const MONO_TYPE_LABELS = {
        flat: 'Чистый',
        tonal: 'Тональный',
        accent: 'Акцентный',
        achromatic: 'Ахроматический'
    };
    // Полные названия и пояснения — те же формулировки, что в боте (MonoTypeText.cs).
    const MONO_TYPE_TITLES = {
        flat: 'Чистый монохром',
        tonal: 'Тональный монохром',
        accent: 'Акцентный монохром',
        achromatic: 'Ахроматический монохром'
    };
    // putya: "переделай описания, убери примеры в конце, попроще как-то" — те же формулировки,
    // что в подсказках бота (MonoTypeText.Description): фраза сути и критерии, без разбора
    // частных случаев. Заголовок не дублируем — он на баннере.
    const MONO_TYPE_HELP = {
        flat: [
            'Предмет того же цвета, что и фон.',
            '• совпадает <b>90%+</b> площади<br>• посторонних цветов — <b>не больше 5%</b>'
        ],
        tonal: [
            'Один цвет в разных оттенках: свет, тень, блик.',
            '• совпадает <b>95%+</b> площади<br>• главный цвет — тот же, что у фона'
        ],
        accent: [
            'Предмет в цвете фона с мелкими вставками другого цвета.',
            '• основного цвета — <b>65%+</b><br>• каждый посторонний — <b>до 15%</b>'
        ],
        achromatic: [
            'Чёрно-белый или серый предмет на чёрном, сером или белом фоне.',
            '• без выраженного тона — <b>90%+</b><br>• по светлоте предмет рядом с фоном'
        ]
    };
    const MONO_TYPE_ORDER = ['flat', 'tonal', 'accent', 'achromatic'];
    // Активный фильтр: пустое множество = «Все типы», то есть показываем и не-монохромы тоже.
    let monoTypeFilter = new Set();
    // Последняя отрисовка результатов — чтобы переключение фильтра перерисовывало текущий список
    // без повторного запроса к API.
    let monoLastRender = null;
    // Фильтр живёт одним элементом и переезжает в панель активной вкладки (putya: "надо как-то в
    // меню это все сделать"), поэтому колбэк перерисовки храним рядом с ним.
    let monoFilterEl = null;
    let monoFilterOnChange = null;

    function monoTypeOf(item) {
        const t = item && (item.MonoType || item.monoType);
        return t ? String(t).toLowerCase() : 'none';
    }
    function isMonoType(t) { return Object.prototype.hasOwnProperty.call(MONO_TYPE_LABELS, t); }
    function monoLabel(t) {
        return window.NFTi18n ? window.NFTi18n.t('mono_type_' + t, MONO_TYPE_LABELS[t]) : MONO_TYPE_LABELS[t];
    }
    function monoTagHtml(type) {
        if (!isMonoType(type)) return '';
        const label = monoLabel(type);
        return `<span class="mono-tag mono-tag-${type}" title="${label}"><i></i>${label}</span>`;
    }
    // putya: "добавь вариант только монохромы или нет (в ту менюшку)" — групповой режим поверх
    // выбора конкретных типов: null = не задан, 'mono' = только монохромные типы, 'nonmono' = всё
    // остальное (полумонохром, контраст, не монохром). Взаимоисключает поштучный выбор.
    let monoGroupMode = null;

    function passesMonoFilter(type) {
        if (monoGroupMode === 'mono') return isMonoType(type);
        if (monoGroupMode === 'nonmono') return !isMonoType(type);
        return monoTypeFilter.size === 0 || monoTypeFilter.has(type);
    }
    function monoFilterActive() { return monoGroupMode !== null || monoTypeFilter.size > 0; }

    // putya: "у монохромов проценты не пиши, а вот у полумонохромов и остальных не монохромов
    // пиши" — у монохрома метка типа уже всё сказала, процент там лишний шум; у остальных он
    // единственное, что отличает "почти подошло" от "мимо". pct — 0..100.
    function monoPercentBadge(type, pct) {
        if (isMonoType(type)) return '';
        const v = Number(pct);
        if (!isFinite(v) || v <= 0) return '';
        return `<div class="badge-percent">${v.toFixed(1)}%</div>`;
    }

    // putya: "не выводи типы монохромов которых не существует на данную модель или данную
    // коллекцию". Перед каждой отрисовкой считаем, сколько чего есть в ТЕКУЩЕМ наборе, и
    // показываем в меню только непустые типы. Заодно снимаем выбранный тип, если он из набора
    // пропал, — иначе фильтр молча даёт пустой список.
    let monoTypeCounts = null;
    function setMonoTypeCounts(list, getType) {
        const counts = {};
        MONO_TYPE_ORDER.forEach(t => { counts[t] = 0; });
        (list || []).forEach(x => {
            const t = (getType ? getType(x) : monoTypeOf(x));
            if (counts[t] !== undefined) counts[t]++;
        });
        monoTypeCounts = counts;
        [...monoTypeFilter].forEach(t => { if (!counts[t]) monoTypeFilter.delete(t); });
    }
    function monoAvailableTypes() {
        return MONO_TYPE_ORDER.filter(t => !monoTypeCounts || monoTypeCounts[t] > 0);
    }

    // Пустой результат: отдельный текст, если пусто именно из-за фильтра. Раньше показывалось общее
    // "Подходящих моделей не найдено", и было не видно, что виноват выбранный тип (putya).
    function monoEmptyHtml(fallbackText) {
        if (!monoFilterActive()) return `<p style="text-align: center;">${fallbackText}</p>`;
        const names = monoGroupMode === 'mono' ? 'только монохромы'
            : monoGroupMode === 'nonmono' ? 'не монохромы'
            : MONO_TYPE_ORDER.filter(t => monoTypeFilter.has(t)).map(monoLabel).join(', ');
        return `<div class="mono-empty">
            <p>Ничего не подошло под выбранный фильтр (${names}).</p>
            <p class="mono-empty-hint">Такое сочетание встречается редко — на большинстве фонов чистых и тональных монохромов единицы.</p>
            <button type="button" class="mono-reset-btn">Показать все типы</button>
        </div>`;
    }

    function monoResetFilter() {
        monoTypeFilter.clear();
        monoGroupMode = null;
        renderMonoFilterOptions();
        if (typeof monoFilterOnChange === 'function') monoFilterOnChange();
    }

    // --- Модалка с пояснением (putya: "сделать кнопки вопросов, при нажатии вылазит модалка") ---
    function openMonoHelp(type) {
        if (!isMonoType(type)) return;
        closeMonoHelp();
        // Список фильтра закрываем: он рисуется в своём слое и иначе перекрывает модалку.
        if (monoFilterEl) {
            monoFilterEl.querySelector('.dropdown-list').classList.add('hidden');
            monoFilterEl.querySelector('.dropdown-header').classList.remove('active');
        }
        const overlay = document.createElement('div');
        overlay.className = 'mono-help-overlay';
        overlay.innerHTML = `
            <div class="mono-help-card" role="dialog" aria-modal="true">
                <button type="button" class="mono-help-close" aria-label="Закрыть">&times;</button>
                <img class="mono-help-banner" src="/Monohrome/mono-types/${type}.png" alt="${MONO_TYPE_TITLES[type]}"
                     onerror="this.closest('.mono-help-card').querySelector('h3').hidden = false; this.remove();">
                <h3 hidden>${MONO_TYPE_TITLES[type]}</h3>
                ${MONO_TYPE_HELP[type].map(p => `<p>${p}</p>`).join('')}
            </div>`;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.mono-help-close')) closeMonoHelp();
        });
        document.body.appendChild(overlay);
        document.addEventListener('keydown', monoHelpEsc);
    }
    function closeMonoHelp() {
        document.querySelectorAll('.mono-help-overlay').forEach(el => el.remove());
        document.removeEventListener('keydown', monoHelpEsc);
    }
    function monoHelpEsc(e) { if (e.key === 'Escape') closeMonoHelp(); }

    // --- Само меню фильтра ---
    function buildMonoFilterEl() {
        if (monoFilterEl) return monoFilterEl;
        const wrap = document.createElement('div');
        wrap.className = 'mono-filter-block';
        wrap.innerHTML = `
            <span class="filter-label">Тип монохрома:</span>
            <div class="custom-dropdown-container mono-filter-dropdown">
                <div class="dropdown-header">
                    <span class="selected-value-placeholder mono-filter-value">Все типы</span>
                    <div class="arrow"></div>
                </div>
                <div class="dropdown-list hidden">
                    <div class="list-options mono-filter-options"></div>
                </div>
            </div>`;
        const header = wrap.querySelector('.dropdown-header');
        const list = wrap.querySelector('.dropdown-list');
        header.addEventListener('click', () => {
            const opening = list.classList.contains('hidden');
            // Чужие дропдауны закрываем их же механизмом, чтобы не перекрывались.
            if (opening && typeof toggleDropdown === 'function') toggleDropdown(null, true);
            list.classList.toggle('hidden', !opening);
            header.classList.toggle('active', opening);
        });
        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) { list.classList.add('hidden'); header.classList.remove('active'); }
        });
        monoFilterEl = wrap;
        return wrap;
    }

    function renderMonoFilterOptions() {
        if (!monoFilterEl) return;
        const options = monoFilterEl.querySelector('.mono-filter-options');
        const value = monoFilterEl.querySelector('.mono-filter-value');
        const available = monoAvailableTypes();
        monoFilterEl.style.display = '';
        const chosen = available.filter(t => monoTypeFilter.has(t));
        value.textContent = monoGroupMode === 'mono' ? 'Только монохромы'
            : monoGroupMode === 'nonmono' ? 'Не монохромы'
            : chosen.length === 0 ? 'Все типы'
            : chosen.map(monoLabel).join(', ');
        value.classList.toggle('mono-filter-on', monoFilterActive());

        // "Все типы" — явная строка, иначе не понятно, что снятый фильтр показывает и не-монохромы
        // (putya: "я выбрал все, а пишет что не найдено ничего").
        const rows = [`
            <div class="list-option mono-filter-option${(!monoGroupMode && chosen.length === 0) ? ' selected' : ''}" data-type="__all">
                <span class="option-text">Все типы</span>
            </div>
            <div class="list-option mono-filter-option${monoGroupMode === 'mono' ? ' selected' : ''}" data-type="__mono">
                <span class="option-text">Только монохромы</span>
            </div>
            <div class="list-option mono-filter-option mono-filter-sep${monoGroupMode === 'nonmono' ? ' selected' : ''}" data-type="__nonmono">
                <span class="option-text">Не монохромы</span>
            </div>`];
        available.forEach(t => {
            const cnt = monoTypeCounts ? monoTypeCounts[t] : null;
            rows.push(`
            <div class="list-option mono-filter-option${monoTypeFilter.has(t) ? ' selected' : ''}" data-type="${t}">
                <span class="mono-dot mono-dot-${t}"></span>
                <span class="option-text">${monoLabel(t)}</span>
                ${cnt != null ? `<span class="mono-filter-count">${cnt}</span>` : ''}
                <button type="button" class="mono-help-btn" data-help="${t}" title="Что это значит?">?</button>
            </div>`);
        });
        options.innerHTML = rows.join('');

        options.querySelectorAll('.mono-filter-option').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.mono-help-btn')) { openMonoHelp(e.target.closest('.mono-help-btn').dataset.help); return; }
                const t = row.dataset.type;
                if (t === '__all') { monoTypeFilter.clear(); monoGroupMode = null; }
                else if (t === '__mono') { monoTypeFilter.clear(); monoGroupMode = monoGroupMode === 'mono' ? null : 'mono'; }
                else if (t === '__nonmono') { monoTypeFilter.clear(); monoGroupMode = monoGroupMode === 'nonmono' ? null : 'nonmono'; }
                else {
                    // Поштучный выбор сбрасывает групповой режим — иначе непонятно, что победит.
                    monoGroupMode = null;
                    if (monoTypeFilter.has(t)) monoTypeFilter.delete(t); else monoTypeFilter.add(t);
                }
                renderMonoFilterOptions();
                if (typeof monoFilterOnChange === 'function') monoFilterOnChange();
            });
        });
    }

    // Переносит меню в панель нужной вкладки. anchor — элемент, перед которым вставить.
    function mountMonoFilter(host, onChange, anchor) {
        if (!host) return;
        const el = buildMonoFilterEl();
        if (typeof onChange === 'function') monoFilterOnChange = onChange;
        if (anchor && anchor.parentElement === host) host.insertBefore(el, anchor);
        else if (el.parentElement !== host) host.appendChild(el);
        renderMonoFilterOptions();
    }

    // Точка входа для switchMode и для функций отрисовки: вкладка -> её панель фильтров.
    function mountMonoFilterFor(mode, onChange) {
        if (mode === 'findUniversal') {
            const host = document.querySelector('#find-universal-controls .filter-wrapper');
            mountMonoFilter(host, onChange, document.getElementById('univ-search-btn'));
        } else if (mode === 'findModels') {
            mountMonoFilter(document.getElementById('find-models-controls'), onChange);
        } else if (mode === 'findBgs') {
            const host = document.getElementById('bgs-v2-wrapper');
            mountMonoFilter(host, onChange, host ? host.querySelector('.bgs2-diagram-row') : null);
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('.mono-reset-btn')) monoResetFilter();
    });

function formatPrice(price) {
    if (!price) return null;
    const num = parseFloat(price);
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
}

// Функция для добавления опции "Все" в начало списка
// includeAll=false — без строки "Выбрать все". putya: "когда пытаешься выбрать фоны под модель,
// не надо разрешать все коллекции выбирать" — там сначала нужна конкретная коллекция, иначе
// список моделей это весь каталог.
// Плейсхолдер списка коллекций на вкладке "Фоны": там "все коллекции" больше не вариант.
function BGS_COLLECTIONS_PLACEHOLDER() {
    return window.NFTi18n ? window.NFTi18n.t('placeholder_select_collections', 'Выберите коллекцию') : 'Выберите коллекцию';
}

function populateUniversalDropdown(container, items, type, includeAll = true) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    if (includeAll) {
        const allOption = document.createElement('div');
        allOption.classList.add('list-option');
        allOption.dataset.value = 'ALL';
        allOption.innerHTML = `<span class="option-text" style="font-weight:700; color:var(--primary-color);">${window.NFTi18n ? window.NFTi18n.t('btn_select_all') : 'Выбрать все'}</span>`;
        fragment.appendChild(allOption);
    }

    items.forEach((item, index) => {
        const option = createDropdownOption(item, type, index < 15);
        fragment.appendChild(option);
    });
    
    container.appendChild(fragment);
    setupLazyLoading(container, container.closest('.dropdown-list'), 'list');
}

// Обработка кликов по коллекциям (Мультиселект)
    dropdowns.giftUniv.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        
        const val = option.dataset.value;
        if (val === 'ALL') {
            state.findUniversal.selectedGifts = [];
        } else {
            const idx = state.findUniversal.selectedGifts.indexOf(val);
            if (idx > -1) {
                state.findUniversal.selectedGifts.splice(idx, 1);
            } else {
                state.findUniversal.selectedGifts.push(val);
            }
        }
        updateMultiSelectText(dropdowns.giftUniv, state.findUniversal.selectedGifts, 'Все коллекции');
        if (window.updateSearchButtonState) window.updateSearchButtonState();
    });

    // Обработка кликов по фонам (Мультиселект)
    dropdowns.colorUniv.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;
        
        const val = option.dataset.value;
        if (val === 'ALL') {
            state.findUniversal.selectedColors = [];
        } else {
            const colorObj = fixedColors.find(c => c.id === val);
            const idx = state.findUniversal.selectedColors.findIndex(c => c.id === val);
            if (idx > -1) {
                state.findUniversal.selectedColors.splice(idx, 1);
            } else if (colorObj) {
                state.findUniversal.selectedColors.push(colorObj);
            }
        }
        updateMultiSelectText(dropdowns.colorUniv, state.findUniversal.selectedColors, 'Все фоны');
        if (window.updateSearchButtonState) window.updateSearchButtonState();
    });



// Клик по сортировке
const sortSwitcher = document.getElementById('sort-switcher');
if (sortSwitcher) {
    sortSwitcher.addEventListener('click', (e) => {
        const tab = e.target.closest('.mode-tab');
        if (!tab) return;
        
        const sortType = tab.dataset.sort;
        sortSwitcher.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        sortSwitcher.classList.remove('sort-price');
        if (sortType === 'price') sortSwitcher.classList.add('sort-price');
        
        state.findUniversal.sortBy = sortType;
        fetchUniversalMonochromes();
    });
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
            loadingContainer.innerHTML = `<div class="loading-indicator"><p><span class="spinner"></span> ${window.NFTi18n ? window.NFTi18n.t('loading_analysis') : 'Анализ... Пожалуйста, подождите...'}</p></div>`;
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
        let masterUserData = null;
        try {
            const cachedUserData = sessionStorage.getItem('tgUser');
            if (cachedUserData) {
                console.log("User data LOADED from sessionStorage:", cachedUserData);
                masterUserData = JSON.parse(cachedUserData); // Читаем стандартный формат
            }
        } catch (e) {
            console.error('Failed to parse user data from sessionStorage:', e);
        }

        if (!masterUserData) {
            console.log("No user data in sessionStorage. Trying direct access (fallback)...");
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

            if (tgUser) {
                console.log("Telegram user data found directly (fallback):", tgUser);
                // Сразу создаем стандартный формат
                masterUserData = {
                    telegramId: tgUser.id,
                    username: tgUser.username || null,
                    // firstName и lastName нам здесь не нужны
                };

                try {
                    // И сохраняем в кеш стандартный формат с ЧИСЛОМ
                    const dataToSave = {
                        ...masterUserData,
                        telegramId: parseInt(tgUser.id, 10) // Гарантируем число при сохранении
                    };
                    sessionStorage.setItem('tgUser', JSON.stringify(dataToSave));
                } catch (e) { /* Ошибка сохранения не критична */ }
            }
        }

        // ЕСЛИ ДАННЫЕ НАШЛИСЬ (в кеше или напрямую)
        if (masterUserData) {
            let numericId = null;
            // Гарантированно преобразуем ID в число при ИСПОЛЬЗОВАНИИ
            if (masterUserData.telegramId !== null && masterUserData.telegramId !== undefined) {
                numericId = parseInt(masterUserData.telegramId, 10);
                // Если parseInt вернул не число (NaN), ставим null
                if (isNaN(numericId)) {
                    numericId = null;
                    console.warn("Parsed telegramId is NaN, setting id to null.");
                }
            }
            // 
            // ✅ ВОЗВРАЩАЕМ ОБЪЕКТ В ФОРМАТЕ { id, Username } ДЛЯ API ЭТОГО ФАЙЛА ✅
            // 
            return {
                id: numericId, // Теперь id (маленькая) и ГАРАНТИРОВАННО число или null
                Username: masterUserData.username // Username (большая)
            };
        }

        // Если данных нет нигде
        console.log("User data not found. Sending null in {id, Username} format.");
        return { id: null, Username: null }; // Возвращаем null в нужном формате
    };

    async function fetchAllGiftNames() {
        const cacheKey = 'giftNamesCacheWithFloor';
        try {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                state.giftNames = JSON.parse(cachedData);
                console.log('%c[Cache Success] Loaded gift names from sessionStorage:', 'color: purple', state.giftNames);
                populateUniversalDropdown(dropdowns.giftBgs.options, state.giftNames, 'gift', false);
                populateUniversalDropdown(dropdowns.giftModels.options, state.giftNames, 'gift');
                return;
            }
        } catch (error) {
            console.error('[Cache Error] Ошибка чтения кэша:', error);
            sessionStorage.removeItem(cacheKey);
        }

        const url = `${SERVER_BASE_URL}/api/ListGifts/AllGiftNamesWithFloor`;
        console.log(`%c[API Request] Fetching all gift names from: ${url}`, 'color: dodgerblue');

        try {
            // ИЗМЕНЕНИЕ: Используем secureFetch вместо fetch
            state.giftNames = await secureFetch(url, null);

            console.log('%c[API Success] Loaded gift names from server:', 'color: green', state.giftNames);

            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(state.giftNames));
            } catch (error) {
                console.error('[Cache Error] Ошибка сохранения в кэш:', error);
            }

            populateUniversalDropdown(dropdowns.giftBgs.options, state.giftNames, 'gift', false);
            populateUniversalDropdown(dropdowns.giftModels.options, state.giftNames, 'gift');

        } catch (error) {
            console.error('[API Error] Ошибка при загрузке названий подарков:', error);
        }
    }

    async function fetchAllModelNames(giftName, updateDOM = true) {
        if (!giftName) {
            if (updateDOM) {
                dropdowns.modelBgs.options.innerHTML = `<div class="list-option list-placeholder">${window.NFTi18n ? window.NFTi18n.t('select_collection_first') : 'Сначала выберите коллекцию'}</div>`;
            }
            state.modelNames = [];
            return;
        }
        const url = `${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/AllModelNames`;
        console.log(`%c[API Request] Fetching models for "${giftName}" from: ${url}`, 'color: dodgerblue');

        try {
            // ИЗМЕНЕНИЕ: Используем secureFetch вместо fetch
            // Сервер сразу возвращает массив, secureFetch его распарсит
            const modelsList = await secureFetch(url, null);

            state.modelNames = modelsList;
            console.log(`%c[API Success] Loaded models for "${giftName}":`, 'color: green', state.modelNames);

            if (updateDOM) {
                populateDropdown(dropdowns.modelBgs.options, state.modelNames, 'model');
            }

        } catch (error) {
            console.error(`[API Error] Ошибка при загрузке моделей для ${giftName}:`, error);
            state.modelNames = [];
            if (updateDOM) {
                dropdowns.modelBgs.options.innerHTML = `<div class="list-option list-placeholder">${window.NFTi18n ? window.NFTi18n.t('no_models_found') : 'Модели не найдены'}</div>`;
            }
        }
    }

    // putya: "добавь возможность несколько коллекций выбирать в обеих режимах" — версия
    // fetchAllModelNames для мультиселекта: тянет модели СРАЗУ по всем выбранным коллекциям
    // параллельно и помечает каждую своим GiftName (см. createDropdownOption('model') и клик по
    // dropdowns.modelBgs выше), чтобы при нескольких выбранных коллекциях можно было однозначно
    // понять, какой гифт у конкретной модели в объединённом списке.
    async function fetchModelsForGifts(giftNames) {
        if (!giftNames || !giftNames.length) {
            dropdowns.modelBgs.options.innerHTML = `<div class="list-option list-placeholder">${window.NFTi18n ? window.NFTi18n.t('select_collection_first') : 'Сначала выберите коллекцию'}</div>`;
            state.modelNames = [];
            return;
        }

        try {
            const perGift = await Promise.all(giftNames.map(async (giftName) => {
                const url = `${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/AllModelNames`;
                const modelsList = await secureFetch(url, null).catch(() => []);
                return (modelsList || []).map(m => ({ ...m, GiftName: giftName }));
            }));

            state.modelNames = perGift.flat();
            console.log('%c[API Success] Loaded models for selected collections:', 'color: green', state.modelNames);
            populateDropdown(dropdowns.modelBgs.options, state.modelNames, 'model');
        } catch (error) {
            console.error('[API Error] Ошибка при загрузке моделей для выбранных коллекций:', error);
            state.modelNames = [];
            dropdowns.modelBgs.options.innerHTML = `<div class="list-option list-placeholder">${window.NFTi18n ? window.NFTi18n.t('no_models_found') : 'Модели не найдены'}</div>`;
        }
    }

    async function fetchAndParseMainColors(giftName, modelName) {
        const url = `${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/MainColors`;
        console.log(`%c[API Request] Fetching main colors for "${giftName} - ${modelName}" from: ${url}`, 'color: dodgerblue');
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': getApiAuthHeader()
                }
            });
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

    // ==========================================================================================
    // "ФОНЫ" v2 — putya: "интегрируй новый алгоритм в монохромы, по аналогии с тестовым сайтом"
    // Полностью заменяет старый поиск (TopBackgroundColorsByNFT/ByColors + ручной пикер 3 цветов на
    // фото, ниже по файлу) на формат mono-cube-live.html: диаграмма цветов модели (DebugCube),
    // монохромы отдельной плашкой, группы по кубам модели — всё из одного ответа
    // /api/MonoCoof/MatchV4Dedup. Карточки — обычный result-card-bg формат сайта, без отдельных
    // админских действий на них (putya: "без +моно и флажка, это админ панель").
    const BGS2_RADAR_MIN_AXES = 3;
    const BGS2_RADAR_SIGNIFICANT_WEIGHT = 5;
    const BGS2_RADAR_HUE_TRUST_CHROMA = 8;
    let bgs2RadarIdCounter = 0;

    function bgs2Pick(obj, name) {
        if (!obj) return undefined;
        const lower = name.charAt(0).toLowerCase() + name.slice(1);
        const upper = name.charAt(0).toUpperCase() + name.slice(1);
        return obj[lower] !== undefined ? obj[lower] : obj[upper];
    }

    function bgs2EscapeHtml(s) {
        return (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function bgs2HexToRgb(hex) {
        let h = (hex || '#808080').replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const num = parseInt(h, 16) || 0x808080;
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    function bgs2MixHex(hexA, hexB) {
        const a = bgs2HexToRgb(hexA), b = bgs2HexToRgb(hexB);
        return `rgb(${Math.round((a.r + b.r) / 2)},${Math.round((a.g + b.g) / 2)},${Math.round((a.b + b.b) / 2)})`;
    }

    // Углы осей диаграммы — по сходству тона (не по индексу кластера), см. подробное объяснение в
    // mono-cube-live.html (computeSimilarityAngles), логика перенесена без изменений.
    function bgs2ComputeSimilarityAngles(clusters) {
        const n = clusters.length;
        if (n === 1) return [-90];

        const ranked = clusters.map((c, idx) => {
            const chroma = Math.sqrt(c.a * c.a + c.b * c.b);
            const isNeutral = chroma <= BGS2_RADAR_HUE_TRUST_CHROMA;
            const hue = isNeutral ? null : (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
            const pos = isNeutral ? (-40 + (c.L / 100) * 40) : hue;
            return { idx, pos };
        }).sort((x, y) => x.pos - y.pos);

        const gapsRaw = ranked.map((r, i) => {
            const next = ranked[(i + 1) % n];
            return i === n - 1 ? (next.pos + 360) - r.pos : next.pos - r.pos;
        });

        const MIN_GAP = Math.max((360 / n) * 0.5, 15);
        let deficit = 0;
        let gaps = gapsRaw.map(g => {
            if (g < MIN_GAP) { deficit += (MIN_GAP - g); return MIN_GAP; }
            return g;
        });
        if (deficit > 0) {
            const maxIdx = gaps.indexOf(Math.max(...gaps));
            gaps[maxIdx] = Math.max(MIN_GAP, gaps[maxIdx] - deficit);
        }
        const sum = gaps.reduce((s, g) => s + g, 0);
        gaps = gaps.map(g => (g * 360) / sum);

        const angleByIdx = new Array(n);
        let angleDeg = -90;
        ranked.forEach((r, i) => {
            angleByIdx[r.idx] = angleDeg;
            angleDeg += gaps[i];
        });
        return angleByIdx;
    }

    // Радар "весов и цветов" модели — оси = реальные кластеры модели по убыванию веса, длина луча =
    // Weight%, цвет луча/точки/подписи = настоящий AvgHex кластера. Перенесено из mono-cube-live.html
    // (buildColorRadarSVG) без изменений в логике, только с префиксом bgs2 и без интерактивного режима
    // (клик по бейджу для исключения цвета) — тут это не нужно, диаграмма только показывает профиль.
    function bgs2BuildColorRadarSVG(clusters) {
        if (!clusters.length) return '<div class="bgs2-hint">Нет данных о цветовом профиле.</div>';

        const n = clusters.length;
        const size = 250, cx = size / 2, cy = size / 2, maxR = 62;
        const badgeR = 13;
        const maxWeight = Math.max(...clusters.map(c => c.weight), 1);
        const scaleMax = Math.max(20, Math.ceil(maxWeight / 10) * 10);
        const anglesDeg = bgs2ComputeSimilarityAngles(clusters);
        const RADAR_MIN_R_FRAC = 0.35;

        const pts = clusters.map((c, i) => {
            const angleRad = (anglesDeg[i] * Math.PI) / 180;
            const frac = Math.min(c.weight / scaleMax, 1);
            const r = maxR * (RADAR_MIN_R_FRAC + frac * (1 - RADAR_MIN_R_FRAC));
            const lr = maxR + 34;
            return {
                angleRad, r,
                x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad),
                lx: cx + lr * Math.cos(angleRad), ly: cy + lr * Math.sin(angleRad),
                hex: c.hex, weight: c.weight, angleDeg: anglesDeg[i]
            };
        });

        // putya: "сделай нормальную диаграму, а не вот эту кривую" — раньше самый лёгкий кластер
        // насильно прижимался к центру (r=0), при этом его бейдж с % оставался на обычном месте
        // снаружи — многоугольник получал "вмятину" в центре, никак не связанную с точкой снаружи,
        // и выглядел сломанным. Убрано: у всех вершин радиус считается одной формулой (с тем же
        // полом RADAR_MIN_R_FRAC=0.35, так что даже самый лёгкий кластер не схлопывается в точку).
        const orderedPts = pts.slice().sort((a, b) => a.angleDeg - b.angleDeg);

        const ringFracs = [0.25, 0.5, 0.75, 1];
        const rings = ringFracs.map(f =>
            `<circle cx="${cx}" cy="${cy}" r="${(maxR * f).toFixed(1)}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>`
        ).join('');
        const ringLabels = ringFracs.map(f =>
            `<text x="${cx + 3}" y="${(cy - maxR * f + 3).toFixed(1)}" font-size="8" fill="rgba(255,255,255,.35)">${Math.round(scaleMax * f)}%</text>`
        ).join('');

        const spokes = pts.map(p =>
            `<line x1="${cx}" y1="${cy}" x2="${p.lx.toFixed(1)}" y2="${p.ly.toFixed(1)}" stroke="rgba(255,255,255,.10)" stroke-width="1"/>`
        ).join('');

        const radarUid = 'bgs2radar' + (bgs2RadarIdCounter++);
        let defs = '', wedges = '';
        for (let i = 0; i < n; i++) {
            const a = orderedPts[i], b = orderedPts[(i + 1) % n];
            const gid = `grad-${radarUid}-${i}`;
            const mix = bgs2MixHex(a.hex, b.hex);
            defs += `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${maxR}">
              <stop offset="0%" stop-color="${mix}" stop-opacity="0"/>
              <stop offset="100%" stop-color="${mix}" stop-opacity="0.55"/>
            </radialGradient>`;
            wedges += `<polygon points="${cx},${cy} ${a.x.toFixed(1)},${a.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}" fill="url(#${gid})"/>`;
        }

        const outline = n >= 2
            ? `<polygon points="${orderedPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2" stroke-linejoin="round"/>`
            : '';

        const vertexDots = pts.map(p =>
            `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="${p.hex}"/>`
        ).join('');

        const badges = pts.map(p =>
            `<circle cx="${p.lx.toFixed(1)}" cy="${p.ly.toFixed(1)}" r="${badgeR}" fill="${p.hex}" stroke="#fff" stroke-width="1.5"/>`
        ).join('');
        const badgeLabels = pts.map(p => {
            const above = p.ly <= cy;
            const ty = above ? p.ly - badgeR - 6 : p.ly + badgeR + 12;
            return `<text x="${p.lx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${Math.round(p.weight)}%</text>`;
        }).join('');

        return `<svg viewBox="0 0 ${size} ${size}" class="bgs2-radar-svg">
          <defs>${defs}</defs>
          ${rings}${spokes}${wedges}${outline}${vertexDots}${badges}${badgeLabels}${ringLabels}
        </svg>`;
    }

    function bgs2ClustersFromDebugCube(data) {
        const cubes = bgs2Pick(data, 'cubes') || [];
        const list = cubes
            .map(c => ({
                hex: bgs2Pick(c, 'avgHex') || '#888888',
                weight: Number(bgs2Pick(c, 'weight')) || 0,
                L: Number(bgs2Pick(c, 'L')) || 0,
                a: Number(bgs2Pick(c, 'a')) || 0,
                b: Number(bgs2Pick(c, 'b')) || 0
            }))
            .filter(c => c.weight > 0.05)
            .sort((a, b) => b.weight - a.weight);
        const significant = list.filter(c => c.weight >= BGS2_RADAR_SIGNIFICANT_WEIGHT);
        return significant.length >= BGS2_RADAR_MIN_AXES ? significant : list.slice(0, Math.min(BGS2_RADAR_MIN_AXES, list.length));
    }

    // Карточка одного фона — putya: "сделай карточки такими же как были раньше, ... без +моно и
    // флажка" — тот же result-card-bg формат, что и на остальных вкладках, без админских действий.
    function bgs2Card(b) {
        const hex = bgs2Pick(b, 'hex') || '#000000';
        const name = bgs2Pick(b, 'name') || '';
        const monoType = (bgs2Pick(b, 'monoType') || 'none').toLowerCase();

        const giftName = state.findBgs.selectedGift || '';
        const modelName = state.findBgs.selectedModel || '';
        const modelImg = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;

        // putya: "сделай карточки такими же как были раньше" — тот же формат result-card-bg, что и
        // на остальных вкладках этой страницы (см. старую renderBackgroundResults ниже по файлу).
        // Градиент берём из fixedColors по имени фона — тот же справочник, что и везде на сайте;
        // если фон отсутствует в fixedColors (не должно случаться, каталог общий), просто заливаем
        // самим hex без градиента.
        const bgObj = fixedColors.find(fc => fc.name === name || fc.id === name);
        const cardBg = bgObj ? bgObj.gradient : hex;

        return `
          <div class="result-card-bg" style="background:${cardBg}" data-bg-name="${bgs2EscapeHtml(name)}">
            ${monoTagHtml(monoType)}
            <div class="image-container">
              <img data-src="${modelImg}" alt="${bgs2EscapeHtml(modelName)}" class="model-image lazy-load">
            </div>
            <div class="info-container">
              <div class="info-text">
                <div class="info-collection">${bgs2EscapeHtml(giftName)}</div>
                <div class="info-model">${bgs2EscapeHtml(name)}</div>
              </div>
              ${monoPercentBadge(monoType, bgs2Pick(b, 'similarity')) ? `<div class="info-badges">${monoPercentBadge(monoType, bgs2Pick(b, 'similarity'))}</div>` : ''}
            </div>
          </div>
        `;
    }

    function bgs2RenderMonoSection(groups) {
        const monoItems = [];
        (groups || []).forEach(g => {
            (bgs2Pick(g, 'backgrounds') || []).forEach(b => {
                if (!passesMonoFilter((bgs2Pick(b, 'monoType') || 'none').toLowerCase())) return;
                if (bgs2Pick(b, 'isMonochrome')) monoItems.push(b);
            });
        });
        if (!monoItems.length) return '';

        monoItems.sort((a, b) => (bgs2Pick(b, 'monoScore') ?? bgs2Pick(b, 'similarity') ?? 0) - (bgs2Pick(a, 'monoScore') ?? bgs2Pick(a, 'similarity') ?? 0));

        const cards = monoItems.map(b => bgs2Card(b)).join('');
        // putya: "напиши просто Монохромы, без описания" — убран поясняющий текст под заголовком.
        return `
          <div class="bgs2-mono-section">
            <div class="bgs2-mono-section-title">Монохромы (${monoItems.length})</div>
            <div class="results-grid bgs2-compact-grid">${cards}</div>
          </div>
        `;
    }

    // putya: "не надо прям все добавлять что есть в тестовом режиме, просто ... группы (без
    // сочности, именно по самим цветам группировка)" — убрана разбивка на МОНО/Средний/Сочный
    // внутри группы: один плоский список, отсортированный по %. Монохромы сюда не дублируем — они
    // уже показаны отдельной плашкой выше (bgs2RenderMonoSection). "добавь возможность ставить
    // лимит веса цвета который учитывается в оценке" — minMassPct теперь берётся из поля ввода
    // (#bgs2-min-mass, см. renderBgsV2/fetchBgsV2), группы с массой ниже него не показываются.
    const BGS2_GROUP_MIN_MASS_DEFAULT = 30;
    const BGS2_GROUP_MIN_MASS_FALLBACK = 10;

    function bgs2RenderGroups(groups, minMassPct) {
        return (groups || []).map(g => {
            const colors = bgs2Pick(g, 'colors') || [];
            const color = colors[0] || {};
            const colorHex = bgs2Pick(color, 'hex') || '#000000';
            const colorPct = bgs2Pick(color, 'percentage') || 0;
            if (colorPct < minMassPct) return '';

            const backgrounds = (bgs2Pick(g, 'backgrounds') || [])
                .filter(b => !bgs2Pick(b, 'isMonochrome'))
                .filter(b => passesMonoFilter((bgs2Pick(b, 'monoType') || 'none').toLowerCase()))
                .sort((a, b) => (bgs2Pick(b, 'similarity') || 0) - (bgs2Pick(a, 'similarity') || 0));
            if (!backgrounds.length) return '';

            const cards = backgrounds.map(b => bgs2Card(b)).join('');

            return `
              <div class="bgs2-group-card">
                <div class="bgs2-group-head">
                  <span class="bgs2-swatch" style="background:${colorHex}"></span>
                  <span class="bgs2-group-title">${colorHex}</span>
                  <span class="bgs2-group-pct">${Number(colorPct).toFixed(1)}% массы модели</span>
                </div>
                <div class="results-grid bgs2-compact-grid">${cards}</div>
              </div>
            `;
        }).join('');
    }

    // "Все фоны каталога" — источник AllBackgrounds того же ответа MatchV4Dedup, без фильтрации по
    // порогу на бэке (см. описание putya: "формат всех фонов"). Монохромы уже показаны выше в своей
    // плашке — здесь показываем ВСЕ фоны (включая эти же монохромы повторно, для полноты списка "от
    // большего % к меньшему", ровно как на тестовом сайте) одним списком. putya: "добавь тоже
    // ограничение по весу" — тот же порог minMassPct, что и у групп, но здесь фильтрует по весу
    // КУБА модели, который фон зацепил (BestCubeWeight) — у групп это Percentage самой группы, тут
    // аналог на уровне отдельного фона. Монохромы не режем порогом — у них нет одного BestCubeWeight
    // (совпадение сразу с несколькими кубами), сама принадлежность к монохромам уже фильтр по сути.
    function bgs2RenderAllBackgrounds(allBackgrounds, minMassPct) {
        if (!allBackgrounds || !allBackgrounds.length) return '';
        const filtered = allBackgrounds.filter(b => {
            if (!passesMonoFilter((bgs2Pick(b, 'monoType') || 'none').toLowerCase())) return false;
            if (bgs2Pick(b, 'isMonochrome')) return true;
            const cubeWeight = bgs2Pick(b, 'bestCubeWeight');
            return cubeWeight == null || cubeWeight >= minMassPct;
        });
        if (!filtered.length) return '';
        const sorted = filtered.sort((a, b) => (bgs2Pick(b, 'similarity') || 0) - (bgs2Pick(a, 'similarity') || 0));
        const cards = sorted.map(b => bgs2Card(b)).join('');
        // putya: "там где все фоны, ничего писать не надо" — кнопка "Все" в переключателе уже
        // достаточно объясняет, что это за список, отдельный заголовок/описание не нужны.
        return `
          <div class="bgs2-mono-section bgs2-all-section">
            <div class="results-grid bgs2-compact-grid">${cards}</div>
          </div>
        `;
    }

    function clearBgsV2() {
        bgsV2Wrapper.classList.add('results-initial-hide');
        bgsV2Diagram.innerHTML = '';
        bgsV2Body.innerHTML = '';
        state.findBgs.v2Data = null;
    }

    async function fetchBgsV2() {
        const giftName = state.findBgs.selectedGift;
        const modelName = state.findBgs.selectedModel;
        if (!giftName || !modelName) return;

        bgsV2Wrapper.classList.remove('results-initial-hide');
        bgsV2Loading.classList.remove('hidden');
        bgsV2Diagram.innerHTML = '';
        bgsV2Body.innerHTML = '';

        try {
            const [debugCubeData, dedupData] = await Promise.all([
                secureFetch(`${SERVER_BASE_URL}/api/MonoCoof/DebugCube?nameGift=${encodeURIComponent(giftName)}&nameModel=${encodeURIComponent(modelName)}`, null).catch(() => null),
                secureFetch(`${SERVER_BASE_URL}/api/MonoCoof/MatchV4Dedup?nameGift=${encodeURIComponent(giftName)}&nameModel=${encodeURIComponent(modelName)}`, null)
            ]);

            state.findBgs.v2Data = { debugCubeData, dedupData };
            bgsV2Loading.classList.add('hidden');
            renderBgsV2(state.findBgs.v2Data);
        } catch (error) {
            console.error('[API Error] Ошибка при загрузке данных нового алгоритма:', error);
            bgsV2Loading.classList.add('hidden');
            bgsV2Body.innerHTML = `<p style="text-align: center;">${window.NFTi18n ? window.NFTi18n.t('net_error') : 'Не удалось загрузить данные.'}</p>`;
        }
    }

    function renderBgsV2(data) {
        const { debugCubeData, dedupData } = data;

        // putya: фильтр типов монохрома — меню в панели вкладки; переключение перерисовывает уже
        // полученный ответ, без повторного запроса.
        const bgsForCounts = [];
        const seenBgNames = new Set();
        [...((bgs2Pick(dedupData, 'groups') || []).flatMap(g => bgs2Pick(g, 'backgrounds') || [])),
         ...(bgs2Pick(dedupData, 'allBackgrounds') || [])].forEach(b => {
            const n = bgs2Pick(b, 'name');
            if (n && seenBgNames.has(n)) return;
            if (n) seenBgNames.add(n);
            bgsForCounts.push(b);
        });
        setMonoTypeCounts(bgsForCounts, b => (bgs2Pick(b, 'monoType') || 'none').toLowerCase());

        monoLastRender = () => renderBgsV2(data);
        mountMonoFilterFor('findBgs', () => monoLastRender && monoLastRender());

        const clusters = debugCubeData ? bgs2ClustersFromDebugCube(debugCubeData) : [];
        bgsV2Diagram.innerHTML = clusters.length
            ? bgs2BuildColorRadarSVG(clusters)
            : '<div class="bgs2-hint">Нет данных о цветовом профиле.</div>';

        const groups = bgs2Pick(dedupData, 'groups') || [];
        const allBackgrounds = bgs2Pick(dedupData, 'allBackgrounds') || [];

        if (!groups.length && !allBackgrounds.length) {
            bgsV2Body.innerHTML = '<p style="text-align: center;">Подходящих фонов не найдено.</p>';
            return;
        }

        const minMassInput = document.getElementById('bgs2-min-mass');
        // putya: "если вдруг на модели нет цвета который больше 30 процентов занимает, отображай
        // 10 минимальный процент веса" — при дефолте 30% модель без доминирующего цвета осталась
        // бы без единой группы/фона. Трогаем поле только пока пользователь сам его не менял
        // (minMassCustomized), иначе каждая новая модель затирала бы его собственный выбор.
        if (minMassInput && !state.findBgs.minMassCustomized) {
            const maxWeight = clusters.length ? clusters[0].weight : 0;
            minMassInput.value = maxWeight < BGS2_GROUP_MIN_MASS_DEFAULT ? BGS2_GROUP_MIN_MASS_FALLBACK : BGS2_GROUP_MIN_MASS_DEFAULT;
        }
        const minMassPct = minMassInput ? (parseFloat(minMassInput.value) || 0) : BGS2_GROUP_MIN_MASS_DEFAULT;

        const monoHtml = bgs2RenderMonoSection(groups);
        const groupsHtml = bgs2RenderGroups(groups, minMassPct);
        const allHtml = bgs2RenderAllBackgrounds(allBackgrounds, minMassPct);

        // putya: "две кнопки ниже отображения результатов монохромов, слева кнопка по группам,
        // справа все" — ★ Монохромные фоны остаются всегда сверху, а группы/полный список
        // переключаются кнопками (тот же .mini-switcher/.mini-tab, что и сортировка выше на
        // странице), без повторного похода на сервер (см. клик-обработчик ниже).
        const viewMode = state.findBgs.v2ViewMode;
        const switcherHtml = `
          <div class="mini-switcher bgs2-view-switcher">
            <button type="button" class="mini-tab${viewMode === 'groups' ? ' active' : ''}" data-view="groups">По группам</button>
            <button type="button" class="mini-tab${viewMode === 'all' ? ' active' : ''}" data-view="all">Все</button>
          </div>
        `;

        const listHtml = viewMode === 'all' ? allHtml : groupsHtml;
        bgsV2Body.innerHTML = (monoHtml || listHtml.trim())
            ? monoHtml + switcherHtml + listHtml
            : monoEmptyHtml('Подходящих фонов не найдено.');
        setupLazyLoading(bgsV2Body, null, 'grid');
    }

    // putya: "добавь возможность ставить лимит веса цвета который учитывается в оценке" — минимальная
    // доля массы модели (Colors[0].Percentage), ниже которой группа не показывается. Меняется без
    // повторного похода на сервер — данные уже закешированы в state.findBgs.v2Data.
    const bgs2MinMassInputEl = document.getElementById('bgs2-min-mass');
    if (bgs2MinMassInputEl) {
        bgs2MinMassInputEl.addEventListener('change', () => {
            state.findBgs.minMassCustomized = true;
            if (state.findBgs.v2Data) renderBgsV2(state.findBgs.v2Data);
        });
    }

    // putya: "лимит веса цвета на блок где ищутся модели под фон" — в отличие от bgs2-min-mass выше
    // (клиентский фильтр уже загруженных данных), этот порог отправляется на сервер
    // (minClusterWeight), поэтому при изменении нужен полный повторный запрос.
    const modelsMinWeightInputEl = document.getElementById('models-min-weight');
    if (modelsMinWeightInputEl) {
        modelsMinWeightInputEl.addEventListener('change', () => {
            state.findModels.lastResults = [];
            triggerModelSearchIfReady();
        });
    }

    bgsV2Body.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.bgs2-view-switcher .mini-tab');
        if (viewBtn) {
            const view = viewBtn.dataset.view;
            if (view !== state.findBgs.v2ViewMode) {
                state.findBgs.v2ViewMode = view;
                if (state.findBgs.v2Data) renderBgsV2(state.findBgs.v2Data);
            }
            return;
        }
        const card = e.target.closest('.result-card-bg');
        if (!card) return;
        if (window.themesModal) {
            window.themesModal.openModelDetail(state.findBgs.selectedGift, state.findBgs.selectedModel, card.dataset.bgName);
            updateUrlState({ giftName: state.findBgs.selectedGift, modelName: state.findBgs.selectedModel, bgName: card.dataset.bgName });
        }
    });
    // ==========================================================================================

    async function fetchMatchingBackgrounds() {
        const isGridEmpty = resultsGrid.innerHTML.trim() === '';
        showLoading(isGridEmpty);

        let apiUrl;
        let requestBody;
        const targetHexColors = state.findBgs.targetColors.map(c => c.hex);

        // --- ИЗМЕНЕНИЕ НАЧАЛО ---
        // Логика: 
        // 1. Если пользователь трогал пикеры (hasUserModifiedColors === true) -> ищем по ЦВЕТАМ.
        // 2. Иначе (по умолчанию) -> ищем по ИМЕНИ гифта и модели.

        if (hasUserModifiedColors && targetHexColors.length === 3 && targetHexColors.every(c => /^#[0-9A-F]{6}$/i.test(c))) {
            apiUrl = `${SERVER_BASE_URL}/api/MonoCoof/TopBackgroundColorsByColors`;
            requestBody = {
                ...getTelegramUserData(),
                Colors: targetHexColors
            };
            console.log("%c[API Request] User modified colors. Using 3-color search:", 'color: purple', targetHexColors);
        } else if (state.findBgs.selectedGift && state.findBgs.selectedModel) {
            apiUrl = `${SERVER_BASE_URL}/api/MonoCoof/TopBackgroundColorsByNFT`;
            requestBody = {
                ...getTelegramUserData(),
                NameGift: state.findBgs.selectedGift,
                NameModel: state.findBgs.selectedModel
            };
            console.log(`%c[API Request] Using NFT-based search (Default) for: ${state.findBgs.selectedModel}`, 'color: dodgerblue');
        } else {
            hideLoading();
            resultsGrid.innerHTML = `<p style="text-align: center;">${window.NFTi18n ? window.NFTi18n.t('select_model_to_search') : 'Выберите модель для поиска.'}</p>`;
            return;
        }
        // --- ИЗМЕНЕНИЕ КОНЕЦ ---

        try {
            const serverData = await secureFetch(apiUrl, requestBody);
            console.log('%c[API Success] Received background data:', 'color: green', serverData);

            const enrichedBgs = serverData.map(item => {
                const foundColor = fixedColors.find(fc => fc.id === item.Key || fc.name === item.Key);
                return foundColor ? { ...foundColor, compatValue: item.Value } : null;
            }).filter(Boolean);

            const resultsWithCounts = await fetchGiftCounts(enrichedBgs, state.findBgs.selectedGift, 'findBgs');

            state.findBgs.lastResults = resultsWithCounts;
            hideLoading();
            renderBackgroundResults(resultsWithCounts);

        } catch (error) {
            console.error('[API Error] Ошибка при поиске фонов:', error);
            hideLoading();
            resultsGrid.innerHTML = `<p style="text-align: center;">${window.NFTi18n ? window.NFTi18n.t('net_error') : 'Не удалось загрузить данные.'}</p>`;
        }
    }

    // putya: "ты так и не добавил лимит веса цвета на блок где ищутся модели под фон" — перевёл
    // вкладку "Модели" со старого TopNftByColor (точечный Coef, без разбивки по кубам) на
    // FindModelsByBackground — тот же современный cube/HyABScaled поиск, что и на "Фоны"
    // (ComputeDedupCore внутри), только в обратную сторону: один фон → по всему каталогу. Он уже
    // нативно принимает minClusterWeight, поэтому порог здесь — настоящий серверный параметр, а не
    // клиентский фильтр отображения, как "Мин. вес цвета" на "Фоны". "несколько коллекций" — эндпоинт
    // сам не фильтрует по гифту, поэтому просеиваем ответ по state.findModels.selectedGifts на
    // клиенте; пустой выбор (как и везде в мультиселекте) значит "все коллекции".
    async function fetchMatchingModels() {
        if (!state.findModels.selectedColor) return;

        const isGridEmpty = resultsGrid.innerHTML.trim() === '';
        showLoading(isGridEmpty);

        const minWeightInput = document.getElementById('models-min-weight');
        const minClusterWeight = minWeightInput ? (parseFloat(minWeightInput.value) || 0) : 0;
        const backgroundName = state.findModels.selectedColor.name;
        const url = `${SERVER_BASE_URL}/api/MonoCoof/FindModelsByBackground?backgroundName=${encodeURIComponent(backgroundName)}&minSimilarity=0&minClusterWeight=${minClusterWeight}&monoOnly=false`;

        try {
            const response = await secureFetch(url, null);
            const allMatches = response?.Models || [];

            const selectedGifts = state.findModels.selectedGifts;
            const filtered = selectedGifts.length
                ? allMatches.filter(m => selectedGifts.includes(m.GiftName))
                : allMatches;

            const uniqueGifts = [...new Set(filtered.map(m => m.GiftName))];
            const floorMap = new Map();
            await Promise.all(uniqueGifts.map(async (giftName) => {
                const allModelsData = await secureFetch(`${SERVER_BASE_URL}/api/ListGifts/${encodeURIComponent(giftName)}/AllModelNames`, null).catch(() => []);
                if (Array.isArray(allModelsData)) {
                    allModelsData.forEach(m => {
                        const n = m.NameModel || m.nameModel;
                        if (n && m.FloorPrice > 0) floorMap.set(`${giftName}::${n}`, m.FloorPrice);
                    });
                }
            }));

            const modelsToRender = filtered.map(item => ({
                modelName: item.ModelName,
                giftName: item.GiftName,
                compatValue: item.Similarity / 100,
                cubeWeight: item.BestCubeWeight,
                isMono: item.IsMonochrome,
                MonoType: item.MonoType,
                floorPrice: floorMap.get(`${item.GiftName}::${item.ModelName}`) || 0,
            }));
            console.log('%c[API Success] Received model data (FindModelsByBackground):', 'color: green', modelsToRender);

            const resultsWithCounts = await fetchGiftCounts(modelsToRender, null, 'findModels');

            state.findModels.lastResults = resultsWithCounts;
            hideLoading();
            renderModelResults(resultsWithCounts, state.findModels.selectedColor);

        } catch (error) {
            console.error('[API Error] Ошибка при поиске моделей:', error);
            hideLoading();
            resultsGrid.innerHTML = `<p style="text-align: center;">${window.NFTi18n ? window.NFTi18n.t('net_error') : 'Не удалось загрузить данные.'} ${error}</p>`;
        }
    }

    function renderBackgroundResults(backgroundData) {
        const sourceBackgrounds = backgroundData || [];
        setMonoTypeCounts(sourceBackgrounds.filter(bg => bg.compatValue > 0), monoTypeOf);
        monoLastRender = () => renderBackgroundResults(sourceBackgrounds);
        mountMonoFilterFor('findBgs', () => monoLastRender && monoLastRender());
        resultsWrapper.classList.remove('results-initial-hide');
        resultsGrid.innerHTML = '';
        if (!backgroundData || backgroundData.length === 0) {
            resultsGrid.innerHTML = `<p style="text-align: center;">${window.NFTi18n ? window.NFTi18n.t('no_matching_bgs') : 'Подходящих фонов не найдено.'}</p>`;
            return;
        }

        const modelImageUrl = `${API_PHOTO_URL}/${encodeURIComponent(state.findBgs.selectedGift)}/png/${encodeURIComponent(state.findBgs.selectedModel)}.png`;
        const fragment = document.createDocumentFragment();

        backgroundData = sourceBackgrounds.filter(bg => bg.compatValue > 0 && passesMonoFilter(monoTypeOf(bg)));
        if (backgroundData.length === 0) {
            resultsGrid.innerHTML = monoEmptyHtml(window.NFTi18n ? window.NFTi18n.t('no_matching_bgs') : 'Подходящих фонов не найдено.');
            return;
        }
        backgroundData.forEach(bg => {
            const card = document.createElement('div');
            card.className = 'result-card-bg';
            card.style.background = bg.gradient;

            card.innerHTML = `
                ${monoTagHtml(monoTypeOf(bg))}
                <div class="image-container">
                    <img data-src="${modelImageUrl}" alt="${state.findBgs.selectedModel}" class="model-image lazy-load">
                </div>
                <div class="info-container">
                    <div class="info-text">
                        <div class="info-collection">${state.findBgs.selectedGift}</div>
                        <div class="info-model">${bg.name}</div>
                    </div>
                    ${monoPercentBadge(monoTypeOf(bg), bg.compatValue * 100) ? `<div class="info-badges">${monoPercentBadge(monoTypeOf(bg), bg.compatValue * 100)}</div>` : ''}
                </div>`;

            card.addEventListener('click', () => {
                if (window.themesModal) {
                    window.themesModal.openModelDetail(state.findBgs.selectedGift, state.findBgs.selectedModel, bg.name);
                    updateUrlState({ giftName: state.findBgs.selectedGift, modelName: state.findBgs.selectedModel, bgName: bg.name });
                }
            });
            fragment.appendChild(card);
        });
        resultsGrid.appendChild(fragment);
        setupLazyLoading(resultsGrid, null, 'grid');
    }

    async function fetchGiftCounts(results, giftName, mode) {
        let requestBody = [];

        if (mode === 'findBgs') {
            const modelName = state.findBgs.selectedModel;
            requestBody = results.map(bg => ({
                NameGift: giftName,
                NameModel: modelName,
                BackgroundName: bg.name
            }));
        } else if (mode === 'findModels') {
            // putya: "несколько коллекций" — каждый результат может быть из СВОЕЙ коллекции
            // (см. fetchMatchingModels), поэтому NameGift берём из самого элемента, а не из
            // общего giftName (для findBgs он один на всех, так и остаётся).
            const bgName = state.findModels.selectedColor.name;
            requestBody = results.map(model => ({
                NameGift: model.giftName,
                NameModel: model.modelName,
                BackgroundName: bgName
            }));
        }

        if (requestBody.length === 0) return results;

        const countApiUrl = `${SERVER_BASE_URL}/api/BaseInfo/GetCountsForModelsAndBackgrounds`;

        try {
            // Используем secureFetch (он у вас есть в файле)
            const countsData = await secureFetch(countApiUrl, requestBody);

            // Создаем Map для быстрого поиска
            const countMap = new Map();

            if (mode === 'findBgs') {
                countsData.forEach(item => {
                    // Если ошибка или null, считаем как null
                    if (item.BackgroundName) countMap.set(item.BackgroundName, item.Count);
                });

                results.forEach(bg => {
                    bg.count = countMap.has(bg.name) ? countMap.get(bg.name) : null;
                });
            } else if (mode === 'findModels') {
                // putya: "несколько коллекций" — ключ по одному NameModel коллизионен, если у двух
                // РАЗНЫХ коллекций модель называется одинаково; составной ключ gift::model безопасен
                // независимо от того, эхует ли бэк NameGift в ответе (сколько раз запросили — столько
                // и придёт count-элементов, порядок сохраняется, см. requestBody выше).
                countsData.forEach((item, idx) => {
                    const gift = item.NameGift || requestBody[idx]?.NameGift;
                    if (item.NameModel) countMap.set(`${gift}::${item.NameModel}`, item.Count);
                });

                results.forEach(model => {
                    const key = `${model.giftName}::${model.modelName}`;
                    model.count = countMap.has(key) ? countMap.get(key) : null;
                });
            }

            return results;

        } catch (error) {
            console.error('[API Error] Counts batch fetch failed:', error);
            return results;
        }
    }

    function renderModelResults(modelData, backgroundColor) {
        const sourceModels = modelData || [];
        setMonoTypeCounts(sourceModels.filter(m => m.compatValue > 0), monoTypeOf);
        monoLastRender = () => renderModelResults(sourceModels, backgroundColor);
        mountMonoFilterFor('findModels', () => monoLastRender && monoLastRender());
        resultsWrapper.classList.remove('results-initial-hide');
        resultsGrid.innerHTML = '';
        if (!backgroundColor || !modelData || modelData.length === 0) {
            resultsGrid.innerHTML = `<p style="text-align: center;">${window.NFTi18n ? window.NFTi18n.t('no_matching_models') : 'Подходящих моделей не найдено.'}</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        modelData = sourceModels.filter(model => model.compatValue > 0 && passesMonoFilter(monoTypeOf(model)));
        if (modelData.length === 0) {
            resultsGrid.innerHTML = monoEmptyHtml(window.NFTi18n ? window.NFTi18n.t('no_matching_models') : 'Подходящих моделей не найдено.');
            return;
        }
        modelData.forEach(model => {
            const modelImageUrl = `${API_PHOTO_URL}/${encodeURIComponent(model.giftName)}/png/${encodeURIComponent(model.modelName)}.png`;
            const card = document.createElement('div');
            card.className = 'result-card-bg';
            card.style.background = backgroundColor.gradient;
            const formattedPrice = model.floorPrice > 0 ? formatPrice(model.floorPrice) : null;
            const priceTag = formattedPrice ? `
                <div class="badge-price" style="font-size: 0.9rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 4px;">
                    ${formattedPrice}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.012 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.882-1.826h10.817c1.033 0 1.873.815 1.873 1.822a1.8 1.8 0 0 1-.274.951M6.51 8.863l4.633 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.004-.72-.484-.72h-4.149z"/>
                    </svg>
                </div>` : '';
            // putya: "надо чтобы там на карточках писался процент веса цвета к которому этот фон
            // найден" — putya: "на карточках лучше не надо писать вес, и так нормально" — сам
            // фильтр minClusterWeight (см. fetchMatchingModels) остаётся, просто больше не выводим
            // его отдельным бейджем на карточке.

            card.innerHTML = `
                ${monoTagHtml(monoTypeOf(model))}
                <div class="image-container">
                    <img data-src="${modelImageUrl}" alt="${model.modelName}" class="model-image lazy-load">
                </div>
                <div class="info-container">
                    <div class="info-text">
                        <div class="info-collection">${model.giftName}</div>
                        <div class="info-model">${model.modelName}</div>
                    </div>
                    <div class="info-badges">
                        ${monoPercentBadge(monoTypeOf(model), model.compatValue * 100)}
                        ${priceTag}
                    </div>
                </div>`;

            card.addEventListener('click', () => {
                if (window.themesModal) {
                    window.themesModal.openModelDetail(model.giftName, model.modelName, backgroundColor.name);
                    updateUrlState({ giftName: model.giftName, modelName: model.modelName, bgName: backgroundColor.name });
                }
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
            const isPreload = index < PRELOAD_COUNT;
            const option = createDropdownOption(item, type, isPreload);
            fragment.appendChild(option);
        });
        container.appendChild(fragment);

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
            const giftName = typeof item === 'string' ? item : item.Name;
            const floorPrice = typeof item === 'string' ? null : item.FloorPrice;
            name = giftName;
            const giftId = getGiftIdByName(name);
            if (giftId) {
                const imageUrl = `${API_GIFT_ORIGINALS_URL}/${giftId}/Original.png`;
                imageHtml = generateImageTag(imageUrl, name);
            }
            // Обычный span для гифтов
            option.innerHTML = `${imageHtml}<span class="option-text">${name}${floorPrice > 0 ? `&nbsp;&nbsp;<span class="option-floor-price" style="opacity:0.7;font-size:0.9em;">${floorPrice % 1 === 0 ? floorPrice : floorPrice.toFixed(1)} TON</span>` : ''}</span>`;
            option.dataset.value = name;

        } else if (type === 'model') {
            name = item.NameModel;
            // putya: "несколько коллекций" — при объединённом списке моделей нескольких коллекций
            // (см. fetchModelsForGifts) у каждого item есть свой GiftName; без него (одна коллекция,
            // старый путь через fetchAllModelNames) берём текущую выбранную как раньше.
            const giftName = item.GiftName || (state.currentMode === 'findBgs' ? state.findBgs.selectedGift : state.findModels.selectedGifts[0]);

            if (giftName) {
                const imageUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/png/${encodeURIComponent(name)}.png`;
                imageHtml = generateImageTag(imageUrl, name);
            }

            let themesHtml = '';
            const v2Count = item.V2ThemeCount || 0;
            if (v2Count > 0) {
                const plural = getPlural(v2Count, 'тематика', 'тематики', 'тематик');
                themesHtml = `<span class="option-theme-count">${v2Count} ${plural}</span>`;
            } else {
                themesHtml = `<span class="option-theme-count"> </span>`;
            }

            // putya: "несколько коллекций" — если модель пришла из объединённого списка (GiftName
            // проставлен), подписываем коллекцию рядом с именем, иначе они неотличимы друг от друга
            // при совпадении названий моделей в разных коллекциях.
            const giftSuffix = item.GiftName ? `<span class="option-theme-count" style="opacity:.6;">${bgs2EscapeHtml(item.GiftName)}</span>` : '';

            const infoWrapperHtml = `
                <div class="option-info-wrapper">
                    <span class="option-text">${name}${item.FloorPrice > 0 ? `&nbsp;&nbsp;<span class="option-floor-price" style="opacity:0.7;font-size:0.9em;">${item.FloorPrice % 1 === 0 ? item.FloorPrice : item.FloorPrice.toFixed(1)} TON</span>` : ''}</span>
                    ${giftSuffix}${themesHtml}
                </div>`;

            if (item.IsMonochrome === false) {
                statusHtml = `
                    <div class="monocolor-indicator">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>`;
            }

            option.innerHTML = `${imageHtml}${infoWrapperHtml}${statusHtml}`;
            option.dataset.value = name;
            if (item.GiftName) option.dataset.gift = item.GiftName;

        } else if (type === 'color') {
            name = item.name; // item - это { id: "...", name: "...", ... }
            imageHtml = `<div class="color-swatch-mini" style="background: ${item.gradient};"></div>`;
            option.classList.add('color-option');
            // Обычный span для цветов
            option.innerHTML = `${imageHtml}<span class="option-text">${name}</span>`;
            option.dataset.value = item.id;
        }

        return option;
    }

    function displayMonocolorAlert(modelName) {
        const wrapper = document.getElementById('monocolor-alert-wrapper');
        if (!wrapper) return;

        if (!modelName) {
            wrapper.innerHTML = '';
            return;
        }

        // ✅ НОВАЯ ЛОГИКА: Ищем в массиве объектов по полю NameModel. putya: "несколько коллекций" —
        // при объединённом списке уточняем ещё и по GiftName (см. fetchModelsForGifts), иначе при
        // одинаковых названиях моделей в разных коллекциях мог найтись не тот.
        const modelData = state.modelNames.find(m => m.NameModel === modelName && (!m.GiftName || m.GiftName === state.findBgs.selectedGift));
        if (modelData && modelData.IsMonochrome === false) {
            wrapper.innerHTML = `
                <div class="monocolor-alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    ${window.NFTi18n ? window.NFTi18n.t('model_not_monochrome') : 'Модель не является одноцветной'}
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
                if (dropdown.input.value === '') {
                    dropdown.header.classList.remove('value-active');
                }
            }
        });

        if (dd && !forceClose) {
            const isOpening = dd.list.classList.contains('hidden');
            if (isOpening) {
                dd.list.classList.remove('hidden');
                dd.header.classList.add('open', 'active');
                setTimeout(() => dd.input.focus(), 50);
            } else {
                dd.list.classList.add('hidden');
                dd.header.classList.remove('open', 'active');
            }
        }
    }

    function filterDropdown(input, optionsContainer, items, type, isUniversal = false) {
        const searchText = input.value.toLowerCase();

        const filtered = items.filter(item => {
            let name = '';
            if (type === 'color') name = item.name;
            else if (type === 'model') name = item.NameModel; 
            else if (type === 'gift') name = typeof item === 'string' ? item : item.Name;
            else name = item; 

            return name.toLowerCase().includes(searchText);
        });

        if (isUniversal) {
            populateUniversalDropdown(optionsContainer, filtered, type);
        } else {
            populateDropdown(optionsContainer, filtered, type);
        }
    }

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

    function initNFTsSection(giftName, modelName, bgName) {
        // 1. Сбрасываем состояние
        nftsState = {
            isExpanded: false,
            page: 1,
            pageSize: 18,
            isLoading: false,
            hasMore: true,
            currentGift: giftName,
            currentModel: modelName,
            currentBg: bgName,
            observer: null
        };

        const header = document.getElementById('nfts-toggle-header');
        const grid = document.getElementById('nfts-grid-container');
        const arrow = document.getElementById('nfts-arrow');

        // Если элементов нет в DOM (например, модалка закрылась), выходим
        if (!header || !grid) return;

        // 2. Сбрасываем визуальный стиль (свернуто)
        header.style.color = 'var(--text-muted)';
        header.classList.remove('expanded');

        if (arrow) arrow.style.transform = 'rotate(0deg)';

        grid.style.display = 'none';
        grid.classList.add('hidden');
        grid.innerHTML = '';

        // 3. Привязываем клик. Используем onclick, чтобы затереть любые старые обработчики
        header.onclick = function (e) {
            if (e) e.stopPropagation(); // Предотвращаем всплытие (на всякий случай)
            toggleNFTsSection();
        };
    }

    // 2. Логика раскрытия/закрытия
    function toggleNFTsSection() {
        const header = document.getElementById('nfts-toggle-header');
        const grid = document.getElementById('nfts-grid-container');
        const arrow = document.getElementById('nfts-arrow'); // Ищем по ID, так надежнее

        if (!header || !grid) return;

        // Переключаем флаг
        nftsState.isExpanded = !nftsState.isExpanded;

        if (nftsState.isExpanded) {
            // РАСКРЫВАЕМ
            header.style.color = '#fff';
            header.classList.add('expanded');
            if (arrow) arrow.style.transform = 'rotate(180deg)';

            // Важно: Сначала убираем hidden (чтобы убрать !important из CSS), потом ставим grid
            grid.classList.remove('hidden');
            grid.style.display = 'grid';

            // Если сетка пустая, запускаем загрузку
            if (grid.children.length === 0) {
                loadMoreNFTs();
            }
        } else {
            // СКРЫВАЕМ
            header.style.color = 'var(--text-muted)';
            header.classList.remove('expanded');
            if (arrow) arrow.style.transform = 'rotate(0deg)';

            grid.style.display = 'none';
            grid.classList.add('hidden');
        }
    }

    // 3. Загрузка данных
    async function loadMoreNFTs() {
        if (nftsState.isLoading || !nftsState.hasMore) return;

        nftsState.isLoading = true;
        const loader = document.getElementById('nfts-loading-indicator');
        if (loader) {
            loader.classList.remove('hidden');
            loader.style.display = 'block';
        }

        // 🔥 ИСПРАВЛЕНИЕ: Используем SERVER_BASE_URL вместо BASE_URL
        const cleanBaseUrl = SERVER_BASE_URL.replace(/\/$/, '');
        const url = `${cleanBaseUrl}/api/ListGifts/SearchGifts/${nftsState.page}/${nftsState.pageSize}`;

        const body = {
            GiftName: nftsState.currentGift,
            ModelName: nftsState.currentModel,
            BackgroundName: nftsState.currentBg
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': getApiAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            // 🔥 ИСПРАВЛЕНИЕ: Добавлена проверка на 403 (Подписка)
            if (response.status === 403) {
                try {
                    const errorData = await response.clone().json();

                    if (errorData.error === 'subscription_required') {
                        console.warn("[API] Subscription required. Channel ID:", errorData.channelId);
                        showSubscriptionModal(errorData.channelId);
                        
                        // Сворачиваем секцию обратно
                        const header = document.getElementById('nfts-toggle-header');
                        const grid = document.getElementById('nfts-grid-container');
                        const arrow = document.getElementById('nfts-arrow');
                        
                        nftsState.isExpanded = false;
                        if (header) { header.style.color = 'var(--text-muted)'; header.classList.remove('expanded'); }
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                        if (grid) { grid.style.display = 'none'; grid.classList.add('hidden'); }
                        
                        throw new Error("Subscription required"); // Прерываем цепочку
                    }
                } catch (e) {
                     if (e.message === "Subscription required") throw e;
                }
            }


            if (response.ok) {
                const data = await response.json();

                // 🔥 ИСПРАВЛЕНИЕ: Проверяем data.Items (это было верно, но на всякий случай)
                if (data && data.Items && data.Items.length > 0) {
                    renderNFTs(data.Items);

                    if (data.Items.length < nftsState.pageSize) {
                        nftsState.hasMore = false;
                    } else {
                        nftsState.page++;
                        setupNFTIntersectionObserver(); // Подключаем бесконечный скролл
                    }
                } else {
                    nftsState.hasMore = false;
                    // Если совсем ничего не найдено на первой странице
                    if (nftsState.page === 1) {
                        const grid = document.getElementById('nfts-grid-container');
                        if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); font-size: 0.9rem; padding: 10px;">${window.NFTi18n ? window.NFTi18n.t('no_nfts_found') : 'NFT не найдены'}</div>`;
                    }
                }
            } else {
                console.error("NFT API Error:", response.status);
            }
        } catch (error) {
            console.error("Error loading NFTs:", error);
        } finally {
            nftsState.isLoading = false;
            if (loader) {
                loader.style.display = 'none';
                loader.classList.add('hidden');
            }
        }
    }

    // 4. Рендеринг карточек
    function renderNFTs(items) {
        const grid = document.getElementById('nfts-grid-container');
        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            // Нормализация имени для URL картинки (удаляем пробелы, нижний регистр)
            // Пример: "Santa Hat" -> "santahat"
            const normalizedName = item.GiftName.toLowerCase().replace(/ /g, '');
            // URL картинки: https://nft.fragment.com/gift/bdaycandle-4.medium.jpg
            const imgUrl = `https://nft.fragment.com/gift/${normalizedName}-${item.Number}.medium.jpg`;

            // Ссылка на Telegram: https://t.me/nft/StellarRocket-45773
            // Обычно в ссылке пробелы убираются, но сохраняется регистр (или CamelCase). 
            // Используем удаление пробелов как самое надежное.
            const linkUrl = `https://t.me/nft/${item.GiftName.replace(/ /g, '')}-${item.Number}`;

            const card = document.createElement('a');
            card.className = 'nft-card';
            card.href = linkUrl;
            card.target = "_blank"; // Открывать в новой вкладке

            card.innerHTML = `
                <img src="${imgUrl}" alt="#${item.Number}" class="nft-image" loading="lazy">
                <span class="nft-number">#${item.Number}</span>
            `;

            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
    }

    // 5. Бесконечный скролл (Intersection Observer)
    function setupNFTIntersectionObserver() {
        if (nftsState.observer) nftsState.observer.disconnect();

        const options = {
            root: document.querySelector('.modal-scrollable-content'), // Скроллим внутри модалки
            rootMargin: '100px',
            threshold: 0.1
        };

        nftsState.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && nftsState.hasMore && !nftsState.isLoading) {
                loadMoreNFTs();
            }
        }, options);

        // Следим за последним элементом в сетке
        const grid = document.getElementById('nfts-grid-container');
        if (grid.lastElementChild) {
            nftsState.observer.observe(grid.lastElementChild);
        }
    }

    function setupInPageColorPicker() {
        const giftName = state.findBgs.selectedGift;
        const modelName = state.findBgs.selectedModel;

        if (!giftName || !modelName) return;

        // --- ИЗМЕНЕНИЕ: Сбрасываем флаг при загрузке новой модели ---
        hasUserModifiedColors = false;
        // -----------------------------------------------------------

        pickerContainer.innerHTML = `
            <img id="pickerPreviewImage" src="" alt="Gift Preview" crossorigin="anonymous">
            <canvas id="pickerColorCanvas" class="hidden"></canvas>`;
        pickerTargetColorsDisplay.innerHTML = '';

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

            // --- ИЗМЕНЕНИЕ: Пользователь закончил двигать, ставим флаг ---
            hasUserModifiedColors = true;
            // -------------------------------------------------------------

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
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(fetchMatchingBackgrounds, 800);
    }

    function triggerModelSearchIfReady() {
        // putya: "несколько коллекций" — пустой выбор коллекций теперь значит "все", как и везде в
        // мультиселекте (FindModelsByBackground сам не требует гифта, см. fetchMatchingModels).
        if (state.findModels.selectedColor) {
            fetchMatchingModels();
        }
    }

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
                // putya: "несколько коллекций" — эти два дропдауна теперь тоже мультиселект,
                // isUniversal=true подключает populateUniversalDropdown (опция "ALL" + подсветка
                // выбранных), тот же путь, что и у giftUniv строкой ниже.
                filterDropdown(dd.input, dd.options, state.giftNames, 'gift', true);
            } else if (dd === dropdowns.giftUniv) {
                filterDropdown(dd.input, dd.options, state.giftNames, 'gift', true); // true для универсального
            } else if (dd === dropdowns.modelBgs) {
                filterDropdown(dd.input, dd.options, state.modelNames, 'model');
            } else if (dd === dropdowns.colorModels) {
                filterDropdown(dd.input, dd.options, fixedColors, 'color');
            } else if (dd === dropdowns.colorUniv) {
                filterDropdown(dd.input, dd.options, fixedColors, 'color', true); // true для универсального
            }
        });
    });

    // putya: "добавь возможность несколько коллекций выбирать в обеих режимах" — тот же паттерн
    // мультиселекта, что и в бывшем режиме "Комбо" (dropdowns.giftUniv выше по файлу): клик не
    // закрывает список, "ALL" сбрасывает выбор, updateMultiSelectText обновляет подпись/подсветку.
    // Собираем модели СРАЗУ со всех выбранных коллекций, отмечая каждую своим GiftName — см.
    // fetchModelsForGifts и createDropdownOption('model').
    dropdowns.giftBgs.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;

        const val = option.dataset.value;
        if (!val || val === 'ALL') return;
        const idx = state.findBgs.selectedGifts.indexOf(val);
        if (idx > -1) state.findBgs.selectedGifts.splice(idx, 1);
        else state.findBgs.selectedGifts.push(val);
        updateMultiSelectText(dropdowns.giftBgs, state.findBgs.selectedGifts, BGS_COLLECTIONS_PLACEHOLDER());

        state.findBgs.lastResults = [];
        state.findBgs.v2Data = null;
        state.findBgs.selectedGift = null;
        state.findBgs.selectedModel = null;
        dropdowns.modelBgs.value.textContent = window.NFTi18n ? window.NFTi18n.t('placeholder_select_model') : 'Выберите модель';
        displayMonocolorAlert(null);
        updateModelThemes(null);
        clearBgsV2();

        fetchModelsForGifts(state.findBgs.selectedGifts);
        updateUrlState();
    });

    dropdowns.modelBgs.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;

        state.findBgs.lastResults = [];
        state.findBgs.v2Data = null;
        const selectedValue = option.dataset.value;
        state.findBgs.selectedModel = selectedValue;
        // putya: "несколько коллекций" — при нескольких выбранных коллекциях у опции модели есть
        // свой data-gift (см. createDropdownOption); при ровно одной выбранной коллекции его может
        // не быть — тогда берём единственную выбранную.
        state.findBgs.selectedGift = option.dataset.gift || state.findBgs.selectedGifts[0] || null;
        dropdowns.modelBgs.value.textContent = selectedValue;

        dropdowns.modelBgs.input.value = '';
        dropdowns.modelBgs.header.classList.remove('value-active');

        populateDropdown(dropdowns.modelBgs.options, state.modelNames, 'model');

        displayMonocolorAlert(selectedValue);
        updateModelThemes(selectedValue);
        fetchBgsV2();
        toggleDropdown(null, true);
        updateUrlState();
    });

    dropdowns.giftModels.list.addEventListener('click', (e) => {
        const option = e.target.closest('.list-option');
        if (!option) return;

        const val = option.dataset.value;
        if (val === 'ALL') {
            state.findModels.selectedGifts = [];
        } else {
            const idx = state.findModels.selectedGifts.indexOf(val);
            if (idx > -1) state.findModels.selectedGifts.splice(idx, 1);
            else state.findModels.selectedGifts.push(val);
        }
        updateMultiSelectText(dropdowns.giftModels, state.findModels.selectedGifts, window.NFTi18n ? window.NFTi18n.t('placeholder_all_collections') : 'Все коллекции');

        state.findModels.lastResults = [];
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

        populateDropdown(dropdowns.colorModels.options, fixedColors, 'color');

        toggleDropdown(null, true);
        triggerModelSearchIfReady();
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown-container')) {
            toggleDropdown(null, true);
        }
    });

    // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ applyUrlParameters
    async function applyUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Считываем параметры
    // putya: "убери режим комбо" — старые ссылки/закладки с ?mode=findUniversal (или без mode
    // вообще) теперь попадают на findBgs; сама ветка ниже (if mode === 'findUniversal') оставлена
    // как есть на случай прямого перехода по такой ссылке — код ещё жив, просто больше не дефолт.
    const mode = urlParams.get('mode') || 'findBgs';
    const giftName = urlParams.get('gift');
    const modelName = urlParams.get('model');
    const colorParam = urlParams.get('color');

    // Параметры модалки
    const view = urlParams.get('view');
    const detailGift = urlParams.get('d_gift');
    const detailModel = urlParams.get('d_model');
    const detailBg = urlParams.get('d_bg');

    if (mode === 'findUniversal') {
        switchMode('findUniversal', false);
        
        // 1. Восстанавливаем тип сортировки
        const sortParam = urlParams.get('sort');
        if (sortParam) {
            state.findUniversal.sortBy = sortParam;
            // Ищем новые кнопки универсального поиска
            const univSortType = document.getElementById('univ-sort-type');
            if (univSortType) {
                univSortType.querySelectorAll('.mini-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.sort === sortParam);
                });
            }
        }

        // 2. Восстанавливаем направление сортировки
        const descParam = urlParams.get('desc');
        if (descParam !== null) {
            state.findUniversal.descending = descParam === 'true';
            const dirBtn = document.getElementById('univ-direction-btn');
            if (dirBtn) {
                dirBtn.classList.toggle('asc', !state.findUniversal.descending);
                dirBtn.classList.toggle('desc', state.findUniversal.descending);
            }
        }

        if (giftName) {
            updateDropdownSelection(dropdowns.giftUniv, giftName);
            state.findUniversal.selectedGift = giftName;
        }
        if (colorParam) {
            const normalizedInput = colorParam.toLowerCase().replace(/[\s\-_]/g, '');
            const foundColor = fixedColors.find(c => c.id.toLowerCase() === normalizedInput || c.name.toLowerCase().replace(/\s/g, '') === normalizedInput);
            if (foundColor) {
                updateDropdownSelection(dropdowns.colorUniv, foundColor.name);
                state.findUniversal.selectedColor = foundColor;
            }
        }
        fetchUniversalMonochromes();

    } else if (mode === 'findModels') {
        switchMode('findModels', false);

        // putya: "несколько коллекций" — updateUrlState пишет их через запятую в ?gifts=; старые
        // ссылки/закладки с ?gift= (единственное число) тоже подхватываем для обратной совместимости.
        const giftsParam = urlParams.get('gifts') || giftName;
        if (giftsParam) {
            state.findModels.selectedGifts = giftsParam.split(',').filter(Boolean);
            updateMultiSelectText(dropdowns.giftModels, state.findModels.selectedGifts, window.NFTi18n ? window.NFTi18n.t('placeholder_all_collections') : 'Все коллекции');
        }

        if (colorParam) {
            const normalizedInput = colorParam.toLowerCase().replace(/[\s\-_]/g, '');
            const foundColor = fixedColors.find(c => c.id.toLowerCase() === normalizedInput || c.name.toLowerCase().replace(/\s/g, '') === normalizedInput);

            if (foundColor) {
                updateDropdownSelection(dropdowns.colorModels, foundColor.name);
                state.findModels.selectedColor = foundColor;
            }
        }
        triggerModelSearchIfReady();

    } else if (mode === 'findBgs') {
        switchMode('findBgs', false);

        if (giftName) {
            state.findBgs.selectedGifts = [giftName];
            updateMultiSelectText(dropdowns.giftBgs, state.findBgs.selectedGifts, BGS_COLLECTIONS_PLACEHOLDER());
            state.findBgs.selectedGift = giftName;
            await fetchAllModelNames(giftName, true);
        }

        if (modelName) {
            updateDropdownSelection(dropdowns.modelBgs, modelName);
            state.findBgs.selectedModel = modelName;

            if (giftName) {
                fetchBgsV2();
                displayMonocolorAlert(modelName);
            }
        }
    }

    // --- Открытие модалки ---
    if (view === 'details' && detailGift && (detailModel || detailBg)) {
        if (window.themesModal) {
            let bgToPass = detailBg;
            if (!bgToPass && state.findModels.selectedColor) {
                bgToPass = state.findModels.selectedColor.name;
            }
            window.themesModal.openModelDetail(detailGift, detailModel, bgToPass);

            if (window.updateTelegramBackButton) {
                window.updateTelegramBackButton('details');
            }
        }
    } else {
        if (window.updateTelegramBackButton) {
            window.updateTelegramBackButton('list');
        }
    }
}
    // 🔥 ЗАМЕНИ ФУНКЦИЮ init НА ЭТУ:
    async function init() {
        // putya: "убери режим комбо" — временное состояние до applyUrlParameters() ниже, которое
        // и выставит реальный режим (из URL или дефолтный findBgs).
        switchMode('findBgs', false);
        initUniversalFilters();
        resetPickerAreaToPlaceholder();

        populateDropdown(dropdowns.colorModels.options, fixedColors, 'color');
        // Сразу заполняем цвета для универсального (они хардкодом)
        populateUniversalDropdown(dropdowns.colorUniv.options, fixedColors, 'color');

        await fetchAllGiftNames();
        // Заполняем коллекции ТОЛЬКО после fetchAllGiftNames
        populateUniversalDropdown(dropdowns.giftUniv.options, state.giftNames, 'gift');

        // Сначала загружаем список подарков
        await fetchAllGiftNames();

        modalCloseBtn.addEventListener('click', () => closeDetailsModal(false));
        detailsModalOverlay.addEventListener('click', (e) => {
            if (e.target === detailsModalOverlay) {
                closeDetailsModal();
            }
        });

        // ❗️ ВАЖНО: Сначала инициализируем модалку (создаем HTML, находим кнопки)
        if (window.themesModal && typeof window.themesModal.init === 'function') {
            window.themesModal.init(SERVER_BASE_URL, API_PHOTO_URL, setupLazyLoading, fixedColors);
        }

        // ❗️ И только ПОТОМ применяем параметры из URL (которые могут вызвать открытие модалки)
        await applyUrlParameters();
    }

    init();
});