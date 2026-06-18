// i18n.js — Модуль локализации NFTMatch (RU / EN)
(function () {
    const DEFAULT_LANG = 'ru';
    const SUPPORTED_LANGS = ['ru', 'en'];
    
    // Словари переводов
    const translations = {
        ru: {
            "title": "NFT MATCH",
            "tg_gate_desc": "Для использования функций приложения необходимо авторизоваться через Telegram.",
            "tg_gate_link": "Открыть в Telegram-боте",
            "btn_tg_login": "Войти через Telegram",
            "btn_tg_redirecting": "Перенаправление...",
            "tools_header": "Доступные функции",
            "card_monochrome": "Монохромы",
            "card_similar": "Похожие",
            "card_themes": "Тематики",
            "btn_open": "Открыть",
            "card_channel_title": "Наш канал",
            "card_channel_desc": "Подпишитесь, чтобы следить за обновлениями",
            "card_api_title": "API",
            "card_api_desc": "Открытый доступ к данным.",
            "card_support_title": "Поддержка",
            "card_support_desc": "Поддержать развитие проекта.",
            "deep_link_loading": "Загрузка...",
            
            // Monochrome page
            "mode_combo": "Комбо",
            "mode_bgs": "Фоны",
            "mode_models": "Модели",
            "filter_collections": "Коллекции:",
            "filter_bgs": "Фоны:",
            "filter_collection": "Коллекция:",
            "filter_model": "Модель:",
            "filter_bg": "Задний фон:",
            "placeholder_all_collections": "Все коллекции",
            "placeholder_all_bgs": "Все фоны",
            "placeholder_select_collection": "Выберите коллекцию",
            "placeholder_select_model": "Выберите модель",
            "placeholder_select_bg": "Выберите фон",
            "filters_title": "Фильтры",
            "filter_sort_coof": "Коэф.",
            "filter_sort_price": "Цена",
            "filter_min_match": "Мин. совпадение:",
            "btn_find_combinations": "Найти сочетания",
            "results_best_combinations": "Лучшие сочетания",
            "modal_compat": "Совпадение:",
            "modal_count": "Количество:",
            "modal_themes": "Тематики:",
            "modal_nfts_found": "Найденные NFT",
            "btn_similar_colors": "Похожие по цвету",
            "alert_same_color": "Внимание! Задний фон и градиент модели совпадают по цвету.",
            "placeholder_search": "Поиск...",
            
            // Themes page
            "themes_title": "ТЕМАТИКИ",
            "sort_method": "Способ сортировки",
            "sort_list": "Списком",
            "sort_tree": "Деревом",
            "filters": "Фильтры",
            "display_mode": "Режим отображения:",
            "sort_count": "Кол-во",
            "sort_name": "Имя",
            "price_limit": "Ограничение цены (TON):",
            "price_limit_placeholder": "До скольки?",
            "min_compat": "Мин. совпадение:",
            "min_compat_val": "От {val}%",
            "bg_color": "Цвет фона:",
            "placeholder_select_color": "Выберите цвет...",
            "placeholder_search_color": "Поиск цвета...",
            "btn_apply": "Применить",
            "search_title": "Поиск",
            "placeholder_search_theme": "Поиск тематики...",
            
            // Similar / Gift page
            "similar_title": "Похожие NFT",
            "collection_name": "Название коллекции:",
            "model_name": "Название модели:",
            "multi_collection_label": "Набор коллекций для поиска:",
            "multi_collection_placeholder": "Выберите набор коллекций",
            "btn_clear_selection": "Очистить выбор",
            "btn_select_all": "Выбрать все",
            "btn_change_color": "Изменить цвет",
            "btn_search_nft": "Поиск NFT",
            "btn_view": "Вид",
            "btn_sort": "Сортировка",
            "label_sort": "Сортировка:",
            "sort_opt_match_desc": "По совпадению (убыв.)",
            "sort_opt_match_asc": "По совпадению (возр.)",
            "sort_opt_name": "По имени",
            "modal_select_sort": "Выберите сортировку",
            "modal_select_view": "Выберите вид карточек",
            "view_opt_detailed": "Топ 3 модели (Детальный вид)",
            "view_opt_compact": "Топ 1 модель (Плотный вид)",
            "btn_save": "Сохранить",
            "modal_title_gift": "Подарок",
            "label_compare_with": "Сравнить с",
            "label_target_model": "Целевая модель",
            "label_similar_models": "Похожие модели",
            
            // API Page
            "api_title": "API Управление",
            "api_desc": "Сервис предоставляет программный интерфейс для разработчиков новых решений, связанных с NFT-подарками. <strong>NFT Match предоставляет уникальную информацию</strong>, которая позволит вам интегрировать продвинутую аналитику и сделать свой сервис лучше.",
            "api_keys": "Ключи доступа",
            "key_basic": "Базовый ключ",
            "key_limits": "{count} / мин | {hourCount} / час",
            "key_pro": "Расширенный ключ",
            "btn_contact_admin": "Обратиться к администратору",
            "api_doc": "Документация",
            "btn_open_swagger": "Открыть Swagger UI",
            "modal_confirm_title": "Вы уверены?",
            "modal_confirm_desc": "Ваш старый ключ будет <strong>деактивирован</strong>. Новый ключ будет показан только один раз.",
            "btn_cancel": "Отмена",
            "btn_confirm": "Сгенерировать",
            "btn_generate_key": "Сгенерировать ключ",
            "api_creating": "Создание...",
            "auth_required": "Пожалуйста, сначала авторизуйтесь через Telegram.",
            "api_error": "Ошибка генерации: {error}",
            "net_error": "Ошибка сети. Не удалось связаться с сервером.",
            
            // Support page
            "support_title": "Поддержка проекта",
            "support_title_page": "Поддержать проект",
            "support_desc": "NFTMatch — это полностью бесплатный проект, созданный с душой <span class=\"heart-icon\">❤</span>",
            "support_channel_symbol": "Символ канала",
            "support_nft_desc": "Данный подарок является символом нашего проекта. Если есть желание поддержать, подарите его на канал.",
            "btn_goto_channel": "Перейти на канал",
            "support_crypto_desc": "Поддержать монетой TON на развитие серверов:",
            
            // Subscription modal
            "sub_required": "Требуется подписка",
            "sub_desc": "Чтобы пользоваться поиском маркета и продвинутой аналитикой, необходимо быть подписчиком нашего Telegram канала.",
            "sub_desc_api": "Для генерации API ключа необходимо быть подписчиком нашего Telegram канала.",
            "btn_subscribe": "Подписаться",
            "btn_subscribed": "Я подписался",
            "go_to_channel": "Перейти в канал",
            "similar_by_color": "по цвету",
            "similar_label": "Похожие",
            
            // Global / General
            "btn_close": "Закрыть",
            "later": "Позже",
            "no_results": "Нет результатов",
            "direction_asc": "Сортировка: по возрастанию",
            "direction_desc": "Сортировка: по убыванию",
            "plural_theme_loc_1": "тематике",
            "plural_theme_loc_2": "тематикам",
            "plural_theme_loc_5": "тематикам",
            "belongs_to_themes": "Принадлежит {count} {plural}",
            "plural_themes_1": "тематика",
            "plural_themes_2": "тематики",
            "plural_themes_5": "тематик",
            "selected_count": "Выбрано: {count}",
            "loading_analysis": "Анализ... Пожалуйста, подождите...",
            "select_collection_first": "Сначала выберите коллекцию",
            "no_models_found": "Модели не найдены",
            "select_model_to_search": "Выберите модель для поиска.",
            "no_matching_bgs": "Подходящих фонов не найдено.",
            "no_matching_models": "Подходящих моделей не найдено.",
            "model_not_monochrome": "Модель не является одноцветной",
            "no_nfts_found": "NFT не найдены",
            "v2_group": "Группа",
            "v2_theme": "Тематика",
            "short_themes": "тем.",
            "short_groups": "гр.",
            "pcs": "шт.",
            "matches": "совп.",
            "empty": "пусто",
            "empty_group": "Пустая группа",
            "load_error_retry": "Ошибка загрузки. Попробуйте еще раз.",
            "short_models": "мод.",
            "no_nested_elements": "Нет вложенных элементов",
            "all_themes": "Все тематики",
            "select_color_to_match": "Выберите цвет для подбора",
            "match_results": "Результаты подбора",
            "title_change_dir": "Изменить направление",
            "analysis_loading": "Анализ схожести. Пожалуйста, подождите...",
            "btn_cancel_search": "Отменить поиск",
            "searching_nft": "Идет поиск NFT...",
            "nfts_not_found": "Подходящих NFT не найдено.",
            "error_load_try_again": "Не удалось загрузить данные. Попробуйте снова.",
            "not_monochrome": "Модель не является одноцветной",
            "colors_not_found": "Цвета не найдены",
            "select_gift_first": "Сначала выберите подарок",
            "models_not_found": "Модели не найдены",
            "sort_opt_count_desc": "По количеству (убыв.)",
            "sort_opt_count_asc": "По количеству (возр.)",
            "btn_retry": "Повторить",
            "badge_logout": "Выйти",
            "badge_login": "Войти",
            "badge_user": "Пользователь",
            "badge_no": "нет",
            "badge_status": "Статус:",
            "badge_authorized": "Авторизован",
            "badge_btn_logout": "Выйти из аккаунта",
            "badge_btn_relogin": "Войти под другим аккаунтом",
            "badge_close": "Закрыть",
            "btn_more_info": "Подробнее",
            "sub_required_alert": "Для использования этой функции необходимо подписаться на наш канал: {channel}",
            "sub_required_list": "Требуется подписка на канал",
            
            // Modal themes-modal
            "modal_no_gifts": "Нет подарков.",
            "modal_backdrop_color": "Цвет фона:",
            "modal_group_average_color": "Средний цвет группы:",
            "modal_clusters": "Кластеры",
            "modal_by_count": "По кол-ву",
            "modal_by_floors": "По флорам",
            "modal_load_collection_error": "Ошибка загрузки коллекции",
            "modal_model": "Модель",
            "modal_backdrop": "Фон",
            "modal_choose": "Выбрать...",
            "modal_match": "Совпадение",
            "modal_quantity": "Количество",
            "modal_search_on_markets": "ПОИСК НА МАРКЕТАХ",
            "modal_cheapest": "Самые дешевые",
            "modal_find": "Найти",
            "modal_hide": "Скрыть",
            "modal_best_monochromes": "Лучшие монохромы",
            "modal_on_backdrop": "На фоне",
            "modal_search_model_backdrop": "ПОИСК модель+фон",
            "modal_no_backdrop": "Без фона",
            "modal_ascending": "По возрастанию",
            "modal_descending": "По убыванию",
            "modal_by_percent": "По проценту",
            "modal_by_name": "По названию",
            "modal_by_quantity": "По количеству",
            "modal_content_label": "СОДЕРЖИМОЕ",
            "modal_attachments_label": "ВЛОЖЕНИЯ",
            "modal_expand": "Развернуть",
            "modal_collapse": "Свернуть",
            "modal_load_v2_error": "Ошибка загрузки V2",
            "modal_similar_colors": "Похожие по цвету",
            "modal_no": "Нет",
            "modal_no_results": "Ничего не найдено",
            "modal_load_error": "Ошибка загрузки",
            "modal_subscription_required": "Требуется подписка",
            "modal_premium_only_search": "Этот поиск доступен только Premium пользователям."
        },
        en: {
            "title": "NFT MATCH",
            "tg_gate_desc": "To use the application's features, you must authorize via Telegram.",
            "tg_gate_link": "Open in Telegram Bot",
            "btn_tg_login": "Log in via Telegram",
            "btn_tg_redirecting": "Redirecting...",
            "tools_header": "Available Features",
            "card_monochrome": "Monochromes",
            "card_similar": "Similar",
            "card_themes": "Themes",
            "btn_open": "Open",
            "card_channel_title": "Our Channel",
            "card_channel_desc": "Subscribe to follow the updates",
            "card_api_title": "API",
            "card_api_desc": "Open access to data.",
            "card_support_title": "Support",
            "card_support_desc": "Support the project development.",
            "deep_link_loading": "Loading...",
            
            // Monochrome page
            "mode_combo": "Combo",
            "mode_bgs": "Backgrounds",
            "mode_models": "Models",
            "filter_collections": "Collections:",
            "filter_bgs": "Backgrounds:",
            "filter_collection": "Collection:",
            "filter_model": "Model:",
            "filter_bg": "Background:",
            "placeholder_all_collections": "All collections",
            "placeholder_all_bgs": "All backgrounds",
            "placeholder_select_collection": "Select collection",
            "placeholder_select_model": "Select model",
            "placeholder_select_bg": "Select background",
            "filters_title": "Filters",
            "filter_sort_coof": "Coef.",
            "filter_sort_price": "Price",
            "filter_min_match": "Min. match:",
            "btn_find_combinations": "Find Combinations",
            "results_best_combinations": "Best Combinations",
            "modal_compat": "Match:",
            "modal_count": "Count:",
            "modal_themes": "Themes:",
            "modal_nfts_found": "Found NFTs",
            "btn_similar_colors": "Similar by Color",
            "alert_same_color": "Warning! Background and model gradient match in color.",
            "placeholder_search": "Search...",
            
            // Themes page
            "themes_title": "THEMES",
            "sort_method": "Sort Method",
            "sort_list": "List",
            "sort_tree": "Tree",
            "filters": "Filters",
            "display_mode": "Display Mode:",
            "sort_count": "Count",
            "sort_name": "Name",
            "price_limit": "Price Limit (TON):",
            "price_limit_placeholder": "Max price?",
            "min_compat": "Min. match:",
            "min_compat_val": "From {val}%",
            "bg_color": "Background Color:",
            "placeholder_select_color": "Select color...",
            "placeholder_search_color": "Search color...",
            "btn_apply": "Apply",
            "search_title": "Search",
            "placeholder_search_theme": "Search theme...",
            
            // Similar / Gift page
            "similar_title": "Similar NFTs",
            "collection_name": "Collection name:",
            "model_name": "Model name:",
            "multi_collection_label": "Collections to search:",
            "multi_collection_placeholder": "Select collections",
            "btn_clear_selection": "Clear selection",
            "btn_select_all": "Select all",
            "btn_change_color": "Change Color",
            "btn_search_nft": "Search NFT",
            "btn_view": "View",
            "btn_sort": "Sort",
            "label_sort": "Sorting:",
            "sort_opt_match_desc": "By match (desc.)",
            "sort_opt_match_asc": "By match (asc.)",
            "sort_opt_name": "By name",
            "modal_select_sort": "Select sorting",
            "modal_select_view": "Select card view",
            "view_opt_detailed": "Top 3 models (Detailed)",
            "view_opt_compact": "Top 1 model (Compact)",
            "btn_save": "Save",
            "modal_title_gift": "Gift",
            "label_compare_with": "Compare with",
            "label_target_model": "Target model",
            "label_similar_models": "Similar models",
            
            // API Page
            "api_title": "API Management",
            "api_desc": "The service provides a software interface for developers of new solutions related to NFT gifts. <strong>NFT Match provides unique information</strong> that will allow you to integrate advanced analytics and make your service better.",
            "api_keys": "Access Keys",
            "key_basic": "Basic Key",
            "key_limits": "{count} / min | {hourCount} / hour",
            "key_pro": "Pro Key",
            "btn_contact_admin": "Contact Administrator",
            "api_doc": "Documentation",
            "btn_open_swagger": "Open Swagger UI",
            "modal_confirm_title": "Are you sure?",
            "modal_confirm_desc": "Your old key will be <strong>deactivated</strong>. The new key will be shown only once.",
            "btn_cancel": "Cancel",
            "btn_confirm": "Generate",
            "btn_generate_key": "Generate key",
            "api_creating": "Creating...",
            "auth_required": "Please authorize via Telegram first.",
            "api_error": "Generation error: {error}",
            "net_error": "Network error. Failed to connect to the server.",
            
            // Support page
            "support_title": "Project Support",
            "support_title_page": "Support the project",
            "support_desc": "NFTMatch is a completely free project, made with soul <span class=\"heart-icon\">❤</span>",
            "support_channel_symbol": "Channel Symbol",
            "support_nft_desc": "This gift is a symbol of our project. If you wish to support us, gift it to the channel.",
            "btn_goto_channel": "Go to Channel",
            "support_crypto_desc": "Support with TON coins for server development:",
            
            // Subscription modal
            "sub_required": "Subscription Required",
            "sub_desc": "To use the market search and advanced analytics, you must subscribe to our Telegram channel.",
            "sub_desc_api": "To generate an API key, you must be a subscriber of our Telegram channel.",
            "btn_subscribe": "Subscribe",
            "btn_subscribed": "I subscribed",
            "go_to_channel": "Go to Channel",
            "similar_by_color": "by color",
            "similar_label": "Similar",
            
            // Global / General
            "btn_close": "Close",
            "later": "Later",
            "no_results": "No results",
            "direction_asc": "Sorting: ascending",
            "direction_desc": "Sorting: descending",
            "plural_theme_loc_1": "theme",
            "plural_theme_loc_2": "themes",
            "plural_theme_loc_5": "themes",
            "belongs_to_themes": "Belongs to {count} {plural}",
            "plural_themes_1": "theme",
            "plural_themes_2": "themes",
            "plural_themes_5": "themes",
            "selected_count": "Selected: {count}",
            "loading_analysis": "Analyzing... Please wait...",
            "select_collection_first": "Select collection first",
            "no_models_found": "Models not found",
            "select_model_to_search": "Select a model to search.",
            "no_matching_bgs": "No matching backgrounds found.",
            "no_matching_models": "No matching models found.",
            "model_not_monochrome": "Model is not monochrome",
            "no_nfts_found": "NFTs not found",
            "v2_group": "Group",
            "v2_theme": "Theme",
            "short_themes": "themes",
            "short_groups": "groups",
            "pcs": "pcs.",
            "matches": "match",
            "empty": "empty",
            "empty_group": "Empty group",
            "load_error_retry": "Loading error. Please try again.",
            "short_models": "models",
            "no_nested_elements": "No nested elements",
            "all_themes": "All themes",
            "select_color_to_match": "Select color to match",
            "match_results": "Matching results",
            "title_change_dir": "Change direction",
            "analysis_loading": "Similarity analysis. Please wait...",
            "btn_cancel_search": "Cancel search",
            "searching_nft": "Searching NFT...",
            "nfts_not_found": "No matching NFTs found.",
            "error_load_try_again": "Failed to load data. Please try again.",
            "not_monochrome": "Model is not monochrome",
            "colors_not_found": "Colors not found",
            "select_gift_first": "Select gift first",
            "models_not_found": "Models not found",
            "sort_opt_count_desc": "By count (desc.)",
            "sort_opt_count_asc": "By count (asc.)",
            "btn_retry": "Retry",
            "badge_logout": "Log out",
            "badge_login": "Log in",
            "badge_user": "User",
            "badge_no": "none",
            "badge_status": "Status:",
            "badge_authorized": "Authorized",
            "badge_btn_logout": "Log out of account",
            "badge_btn_relogin": "Log in under another account",
            "badge_close": "Close",
            "btn_more_info": "More info",
            "sub_required_alert": "To use this feature, you must subscribe to our channel: {channel}",
            "sub_required_list": "Channel subscription required",
            
            // Modal themes-modal
            "modal_no_gifts": "No gifts.",
            "modal_backdrop_color": "Background color:",
            "modal_group_average_color": "Average group color:",
            "modal_clusters": "Clusters",
            "modal_by_count": "By count",
            "modal_by_floors": "By floors",
            "modal_load_collection_error": "Failed to load collection",
            "modal_model": "Model",
            "modal_backdrop": "Background",
            "modal_choose": "Choose...",
            "modal_match": "Match",
            "modal_quantity": "Quantity",
            "modal_search_on_markets": "SEARCH ON MARKETPLACES",
            "modal_cheapest": "Cheapest",
            "modal_find": "Search",
            "modal_hide": "Hide",
            "modal_best_monochromes": "Best monochromes",
            "modal_on_backdrop": "On background",
            "modal_search_model_backdrop": "SEARCH model+bg",
            "modal_no_backdrop": "No background",
            "modal_ascending": "Ascending",
            "modal_descending": "Descending",
            "modal_by_percent": "By percentage",
            "modal_by_name": "By name",
            "modal_by_quantity": "By quantity",
            "modal_content_label": "CONTENT",
            "modal_attachments_label": "ATTACHMENTS",
            "modal_expand": "Expand",
            "modal_collapse": "Collapse",
            "modal_load_v2_error": "Failed to load V2",
            "modal_similar_colors": "Similar by color",
            "modal_no": "No",
            "modal_no_results": "No results found",
            "modal_load_error": "Loading error",
            "modal_subscription_required": "Subscription required",
            "modal_premium_only_search": "This search is only available to Premium users."
        }
    };

    // Определение языка
    function detectLanguage() {
        // 1. Из параметров URL (?lang=ru или ?lang=en)
        const urlParams = new URLSearchParams(window.location.search);
        let lang = urlParams.get('lang');
        if (lang && SUPPORTED_LANGS.includes(lang.toLowerCase())) {
            localStorage.setItem('user_lang', lang.toLowerCase());
            return lang.toLowerCase();
        }

        // 2. Из localStorage
        lang = localStorage.getItem('user_lang');
        if (lang && SUPPORTED_LANGS.includes(lang)) {
            return lang;
        }

        // 3. Из Telegram WebApp (по языку клиента)
        if (window.Telegram && window.Telegram.WebApp) {
            const tgLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;
            if (tgLang) {
                const cleanTgLang = tgLang.toLowerCase();
                // Если язык клиента русский/белорусский/украинский/казахский — ставим русский, иначе английский
                if (cleanTgLang.startsWith('ru') || cleanTgLang === 'be' || cleanTgLang === 'uk' || cleanTgLang === 'kk') {
                    return 'ru';
                } else {
                    return 'en';
                }
            }
        }

        // 4. Из настроек браузера
        const browserLang = (navigator.language || navigator.userLanguage || DEFAULT_LANG).substring(0, 2).toLowerCase();
        if (browserLang === 'ru') return 'ru';
        
        return 'en'; // default fallback for everything else
    }

    const currentLang = detectLanguage();

    // Функция перевода
    function t(key, defaultValue = '', params = {}) {
        let text = translations[currentLang]?.[key];
        if (text === undefined) {
            text = translations[DEFAULT_LANG]?.[key] || defaultValue || key;
        }
        
        // Замена плейсхолдеров типа {var}
        Object.keys(params).forEach(pKey => {
            text = text.replace(new RegExp(`{${pKey}}`, 'g'), params[pKey]);
        });
        
        return text;
    }

    // Функция перевода DOM-элементов
    function translateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.innerHTML = t(key, el.innerHTML);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = t(key, el.placeholder);
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = t(key, el.title);
        });

        document.documentElement.lang = currentLang;
    }

    // Динамическое добавление верхней шапки с переключателем языка
    function injectLangSwitcher() {
        if (document.getElementById('nft-top-bar')) return;

        const isTelegramWebApp = !!(window.Telegram?.WebApp?.initData || (window.Telegram?.WebApp?.platform && window.Telegram.WebApp.platform !== 'unknown'));

        // Создаём шапку-бар
        const bar = document.createElement('div');
        bar.id = 'nft-top-bar';

        // Переключатель языка
        const container = document.createElement('div');
        container.id = 'lang-switcher-container';
        container.className = 'lang-switcher-container';

        const ruBtn = document.createElement('button');
        ruBtn.className = `lang-btn ${currentLang === 'ru' ? 'active' : ''}`;
        ruBtn.textContent = 'RU';
        ruBtn.addEventListener('click', () => setLanguage('ru'));

        const enBtn = document.createElement('button');
        enBtn.className = `lang-btn ${currentLang === 'en' ? 'active' : ''}`;
        enBtn.textContent = 'EN';
        enBtn.addEventListener('click', () => setLanguage('en'));

        container.appendChild(ruBtn);
        container.appendChild(enBtn);
        bar.appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            #nft-top-bar {
                display: flex;
                align-items: center;
                justify-content: ${isTelegramWebApp ? 'center' : 'space-between'};
                padding: 8px 16px;
                box-sizing: border-box;
                width: 100%;
                min-height: 52px;
                position: relative;
            }
            body.modal-open #nft-top-bar,
            body.body-gated #nft-top-bar,
            body:has(#tg-profile-modal) #nft-top-bar,
            body:has(.sub-modal-overlay.active) #nft-top-bar,
            body:has(#themes-modal-overlay:not(.hidden)) #nft-top-bar,
            body:has(#nftDetailsModalOverlay:not(.hidden)) #nft-top-bar {
                display: none !important;
            }
            .lang-switcher-container {
                display: flex;
                gap: 4px;
                background: rgba(22, 33, 58, 0.75);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 4px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                font-family: 'Inter', sans-serif;
            }
            .lang-btn {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                padding: 7px 16px;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                outline: none;
            }
            .lang-btn.active {
                background: #38bdf8;
                color: #0f172a;
                box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
            }
            .lang-btn:hover:not(.active) {
                color: rgba(255, 255, 255, 0.9);
                background: rgba(255, 255, 255, 0.05);
            }
            /* auth-badge внутри бара — позиционируется само flex-ом */
            #tg-auth-badge {
                position: static !important;
                transform: none !important;
                top: auto !important;
                right: auto !important;
            }
        `;

        document.head.appendChild(style);
        // Вставляем бар первым элементом в body
        document.body.insertBefore(bar, document.body.firstChild);
    }



    function setLanguage(lang) {
        if (SUPPORTED_LANGS.includes(lang)) {
            localStorage.setItem('user_lang', lang);
            
            // Если в URL есть старый параметр lang, обновим его
            const url = new URL(window.location.href);
            if (url.searchParams.has('lang')) {
                url.searchParams.set('lang', lang);
                window.location.href = url.toString();
            } else {
                window.location.reload();
            }
        }
    }

    // Запускаем инициализацию при построении DOM
    function init() {
        translateDOM();
        injectLangSwitcher();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Экспортируем модуль глобально
    window.NFTi18n = {
        t,
        translateDOM,
        getLanguage: () => currentLang,
        setLanguage
    };
})();
