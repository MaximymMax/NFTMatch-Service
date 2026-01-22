// modals/item-details.js
const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net';
const API_PHOTO_URL = 'https://cdn.changes.tg/gifts/models'; 

const overlay = document.getElementById('itemDetailsOverlay');
const closeBtn = document.getElementById('closeItemDetails');
const title = document.getElementById('itemDetailsTitle');
const visual = document.getElementById('itemVisualArea');
const infoTable = document.getElementById('itemInfoTable');
const btnContainer = document.getElementById('itemSimilarBtn');

function getAuth() {
    if (window.Telegram?.WebApp?.initData) return `Tma ${window.Telegram.WebApp.initData}`;
    return 'Tma invalid';
}

async function open(giftName, modelName, count = null, isPartial = false) {
    overlay.classList.remove('hidden');
    title.textContent = modelName;
    visual.innerHTML = '';
    infoTable.innerHTML = '';
    btnContainer.innerHTML = '';

    // 1. Визуал (Lottie)
    const lottieUrl = `${API_PHOTO_URL}/${encodeURIComponent(giftName)}/lottie/${encodeURIComponent(modelName)}.json`;
    visual.innerHTML = `<lottie-player src="${lottieUrl}" background="transparent" speed="1" loop autoplay style="width:80%; height:80%;"></lottie-player>`;
    // Фон
    visual.style.background = isPartial ? 'rgba(30,41,68,0.5)' : 'var(--surface-color)';

    // 2. Инфо
    let html = `
        <div class="info-row"><div class="info-label">Модель</div><div class="info-value">${modelName}</div></div>
        <div class="info-row"><div class="info-label">Коллекция</div><div class="info-value">${giftName}</div></div>
    `;
    
    if (isPartial) {
        html += `
            <div class="info-row"><div class="info-label">Фон</div><div class="info-value" style="color:#6b7fa7">—</div></div>
            <div class="info-row"><div class="info-label">Совпадение</div><div class="info-value" style="color:#6b7fa7">—</div></div>
        `;
    }
    
    const countText = (count !== null) ? `${count} шт.` : (isPartial ? '—' : 'Загрузка...');
    html += `<div class="info-row"><div class="info-label">Количество</div><div class="info-value">${countText}</div></div>`;
    
    // Тематики
    html += `<div class="info-row" style="border:none;"><div class="info-label">Тематики</div><div class="info-value" id="modalThemesLink">Загрузка...</div></div>`;
    
    infoTable.innerHTML = html;

    // 3. Загружаем тематики
    try {
        const url = `${SERVER_BASE_URL}/api/BaseInfo/GetCollectionByGift/${encodeURIComponent(giftName)}/${encodeURIComponent(modelName)}/WithParameters`;
        const res = await fetch(url, { headers: { 'Authorization': getAuth() } });
        const themes = await res.json();
        
        const themesLink = document.getElementById('modalThemesLink');
        if (themes && themes.length > 0) {
            themesLink.textContent = `${themes.length} шт. (Показать)`;
            themesLink.classList.add('link-style');
            themesLink.onclick = () => {
                overlay.classList.add('hidden'); // Скрываем детали
                if (window.themesModal) window.themesModal.open(themes, giftName, modelName);
            };
        } else {
            themesLink.textContent = 'Нет';
        }
    } catch (e) { console.error(e); }
}

closeBtn.onclick = () => overlay.classList.add('hidden');
overlay.onclick = (e) => { if(e.target === overlay) overlay.classList.add('hidden'); };

// Экспорт глобально
window.itemDetailsModal = { open };