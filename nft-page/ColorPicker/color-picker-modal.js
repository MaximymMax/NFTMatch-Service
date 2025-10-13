// color-picker-modal.js
/**
 * Инициализирует и управляет модальным окном выбора цвета.
 * @param {object} dependencies - Объект с необходимыми зависимостями.
 * @param {object} dependencies.state - Глобальное состояние (для чтения giftTypeId, modelId и записи targetColors).
 * @param {function} dependencies.fetchAndParseMainColors - Функция API для получения цветов.
 * @param {function} dependencies.findAndDisplayBackgrounds - Функция для обновления результатов на главной странице.
 * @param {function} dependencies.updateTargetColorsDisplay - Функция для обновления цветов на главной странице.
 * @param {string} dependencies.API_PHOTO_URL - Базовый URL для изображений.
 */
export function initColorPicker(dependencies) {
    const { state, fetchAndParseMainColors, findAndDisplayBackgrounds, updateTargetColorsDisplay, API_PHOTO_URL } = dependencies;
    
    // --- Элементы (Доступны после вставки HTML в DOM) ---
    const colorPickerModalOverlay = document.getElementById('colorPickerModalOverlay');
    const pickerPreviewImg = document.getElementById('pickerPreviewImage');
    const pickerCanvas = document.getElementById('pickerColorCanvas');
    const pickerCtx = pickerCanvas.getContext('2d', { willReadFrequently: true });
    const pickerTargetColorsDisplay = document.getElementById('pickerTargetColorsDisplay');
    const saveColorsBtn = document.getElementById('saveColorsBtn');
    const closeColorPickerModalBtn = document.getElementById('closeColorPickerModalBtn');
    const pickerContainer = document.getElementById('pickerContainer');


    // --- Вспомогательные функции для модалки ---

    // Функция, которая создает и привязывает пипетку
    function setupDraggablePickerInModal(picker, container, index) {
        let isDragging = false;
        // Сохраняем позиции в процентах, чтобы они сохранялись при изменении размера окна
        let lastValidPosition = { 
            left: parseFloat(picker.dataset.percX) + '%', 
            top: parseFloat(picker.dataset.percY) + '%' 
        };

        let preview = picker.querySelector('.picker-color-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'picker-color-preview';
            picker.appendChild(preview);
        }

        function updateColorPreview(useLastValid = false) {
            const rect = container.getBoundingClientRect();
            let x, y; // CSS-пиксели (относительно контейнера)
            
            if (useLastValid) {
                // Используем сохраненные проценты, конвертируя их обратно в пиксели CSS
                const percX = parseFloat(picker.dataset.percX) / 100;
                const percY = parseFloat(picker.dataset.percY) / 100;
                x = rect.width * percX;
                y = rect.height * percY;
            } else {
                x = parseFloat(picker.style.left);
                y = parseFloat(picker.style.top);
            }
            
            // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Конвертируем CSS-позицию (x/y) в КООРДИНАТЫ CANVAS
            // (Используя пропорции CSS-контейнера к натуральным размерам Canvas)
            const canvasX = Math.floor(x * (pickerCanvas.width / rect.width));
            const canvasY = Math.floor(y * (pickerCanvas.height / rect.height));
            
            // Получаем данные пикселя
            const [r, g, b, a] = pickerCtx.getImageData(canvasX, canvasY, 1, 1).data;
            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

            if (a >= 250) {
                preview.style.background = hex;
                // Обновляем состояние HEX-кодом
                if (state.bgFinder.targetColors[index]) {
                    state.bgFinder.targetColors[index].hex = hex;
                }
                updatePickerTargetColorsDisplay();
            }
        }

        const onMove = (clientX, clientY) => {
            if (!isDragging) return;
            
            const rect = container.getBoundingClientRect();
            let x = clientX - rect.left;
            let y = clientY - rect.top;
            x = Math.max(0, Math.min(rect.width, x));
            y = Math.max(0, Math.min(rect.height, y));
            
            picker.style.left = `${x}px`;
            picker.style.top = `${y}px`;
            updateColorPreview();
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            picker.classList.remove('dragging');
            
            const rect = container.getBoundingClientRect();
            const x = parseFloat(picker.style.left);
            const y = parseFloat(picker.style.top);
            const canvasX = Math.floor(x * (pickerCanvas.width / rect.width));
            const canvasY = Math.floor(y * (pickerCanvas.height / rect.height));
            const [, , , a] = pickerCtx.getImageData(canvasX, canvasY, 1, 1).data;

            if (a < 250) {
                // Если цвет прозрачный, возвращаем пипетку на последнюю действительную позицию
                picker.classList.add('invalid');
                setTimeout(() => picker.classList.remove('invalid'), 300);
                picker.style.left = lastValidPosition.left;
                picker.style.top = lastValidPosition.top;
                updateColorPreview(true);
            } else {
                // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: СОХРАНЯЕМ НОВУЮ ПОЗИЦИЮ (в процентах)
                const percX = (x / rect.width) * 100;
                const percY = (y / rect.height) * 100;
                
                if (state.bgFinder.targetColors[index]) {
                    state.bgFinder.targetColors[index].x = percX;
                    state.bgFinder.targetColors[index].y = percY;
                }
                picker.dataset.percX = percX;
                picker.dataset.percY = percY;

                lastValidPosition = { left: `${percX}%`, top: `${percY}%` };
                updateColorPreview(); // Финальное обновление цвета
            }
        };
        
        // ... (Инициализация Drag/Touch событий остается прежней) ...
        picker.addEventListener('mousedown', (e) => { isDragging = true; picker.classList.add('dragging'); e.preventDefault(); });
        document.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        document.addEventListener('mouseup', onEnd);
        picker.addEventListener('touchstart', (e) => { isDragging = true; picker.classList.add('dragging'); e.preventDefault(); }, { passive: false });
        document.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e.touches[0].clientY));
        document.addEventListener('touchend', onEnd);

        // Убеждаемся, что превью цвета отображается сразу
         setTimeout(() => {
            updateColorPreview(true);
        }, 50); 
    }

    // Функция обновления дисплея цветов в модалке
    function updatePickerTargetColorsDisplay() {
        pickerTargetColorsDisplay.innerHTML = '';
        // 💡 ИЗМЕНЕНИЕ: Теперь state.bgFinder.targetColors - это массив объектов
        state.bgFinder.targetColors.forEach((colorObj) => { 
            const hex = colorObj.hex; // Извлекаем HEX
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = hex;
            swatch.innerHTML = `<span class="color-swatch-hex">${hex.toUpperCase()}</span>`;
            pickerTargetColorsDisplay.appendChild(swatch);
        });
    }

    /**
     * Размещает пипетки на изображении.
     * @param {Array} initialColors - Массив объектов {x, y, hex} или просто HEX-кодов.
     * @param {string} giftName
     * @param {string} modelName
     */
    async function placePickers(initialColors, giftName, modelName) {
        
        pickerContainer.querySelectorAll('.color-picker').forEach(p => p.remove()); // Очистка

        for (let i = 0; i < Math.min(initialColors.length, 3); i++) {
            const data = initialColors[i]; // Используем data из state (проценты X, Y)
            const picker = document.createElement('div');
            picker.className = 'color-picker';

            const percX = data.x;
            const percY = data.y;
            
            // 🔥 Сохранение позиции в DATA АТРИБУТЫ (Проценты)
            picker.dataset.percX = percX.toFixed(2);
            picker.dataset.percY = percY.toFixed(2);
            
            // 🔥 Устанавливаем CSS-позицию в процентах (СМЕЩЕНИЕ УСТРАНЯЕТСЯ ЗДЕСЬ)
            picker.style.left = percX + '%';
            picker.style.top = percY + '%';
            
            pickerContainer.appendChild(picker);
            setupDraggablePickerInModal(picker, pickerContainer, i);
        }
    }

    let isDescriptionAdded = false;
    /**
     * Открывает модальное окно для выбора/корректировки цветов.
     */
       async function openColorPickerModal() {
        const giftName = state.bgFinder.giftTypeId;
        const modelName = state.bgFinder.modelId;
        
        if (!giftName || !modelName) return;

        // 1. Установка изображения
        const imageUrl = API_PHOTO_URL + `/${encodeURIComponent(giftName)}/png/${encodeURIComponent(modelName)}.png`;
        pickerPreviewImg.src = ''; 
        pickerPreviewImg.src = imageUrl; 
        
        // 2. Очистка старых пипеток перед открытием
        pickerContainer.querySelectorAll('.color-picker').forEach(p => p.remove()); 

        // 3. Открытие модалки
        colorPickerModalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // 4. Вставляем подпись (убеждаемся, что делается только один раз)
        const modalBody = colorPickerModalOverlay.querySelector('.color-picker-modal-body');
        if (!isDescriptionAdded) {
            modalBody.insertAdjacentHTML('afterbegin', `
                <div class="color-picker-description">
                    Выберете 3 оттенка основного цвета. 
                    Нажмите "Сохранить" для применения.
                </div>
            `);
            isDescriptionAdded = true;
        }

        // 5. Логика загрузки и размещения пипеток
        pickerPreviewImg.onload = async () => {
            let colorsForPlacement = state.bgFinder.targetColors;
            
            // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Если state пуст, мы должны были уже загрузить его в showDetails, 
            // но на всякий случай проверяем, есть ли X/Y. Если нет, это ошибка.
            if (colorsForPlacement.length === 0 || colorsForPlacement[0].x === undefined) {
                 console.error("Color Picker: State не инициализирован правильными процентами X/Y.");
                 // Если state не инициализирован, закрываем модалку, чтобы не показывать ошибку
                 closeColorPickerModal();
                 return;
            }
             
            // Настройка Canvas (Canvas скрыт через CSS)
            pickerCanvas.width = pickerPreviewImg.naturalWidth;
            pickerCanvas.height = pickerPreviewImg.naturalHeight;
            pickerCtx.drawImage(pickerPreviewImg, 0, 0);

            // Размещение пипеток
            placePickers(state.bgFinder.targetColors, giftName, modelName); 
            updatePickerTargetColorsDisplay(); 
        };

        // 6. Присваиваем обработчики кнопкам модалки (остается без изменений)
        closeColorPickerModalBtn.onclick = closeColorPickerModal;
        saveColorsBtn.onclick = saveColorsAndClose;
        colorPickerModalOverlay.onclick = function(e) {
            if (e.target.id === 'colorPickerModalOverlay' || e.target === closeColorPickerModalBtn) {
                closeColorPickerModal();
            }
        };
    }

    // Функция для закрытия модального окна без сохранения
    function closeColorPickerModal() {
        colorPickerModalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Функция для сохранения и закрытия
    function saveColorsAndClose() {
        
        // 1. Обновляем дисплей цветов на главной странице
        updateTargetColorsDisplay();

        // 2. Закрываем модалку
        closeColorPickerModal();
        
    }
    return { openColorPickerModal };
}