// modals/nft-details.js
const SERVER_BASE_URL = 'https://nftmatchbot20250730152328.azurewebsites.net/';
const API_PHOTO_MODEL_URL = 'https://cdn.changes.tg/gifts/models';
const API_SIMILAR_MODELS = '/api/MonoCoof/SimilarNFT';

export function initNftDetailsModal() {
    // Авторизация (сокращено)
    function getApiAuthHeader() {
        if (window.Telegram?.WebApp?.initData) return `Tma ${window.Telegram.WebApp.initData}`;
        return 'Tma invalid';
    }

    const modalOverlay = document.getElementById('nftDetailsModalOverlay');
    const closeBtn = document.getElementById('closeNftDetails');
    const modalTitle = document.getElementById('nftDetailsTitle');

    const targetBox = document.getElementById('targetModelPhoto');
    const selectedBox = document.getElementById('selectedModelPhoto');
    const list = document.getElementById('similarModelsList');

    const btnTarget = document.getElementById('btn-details-target');
    const btnSelected = document.getElementById('btn-details-selected');

    let currentSimilarModels = [];
    let selectedModelName = null;
    let cardGiftName = '', targetGiftName = '', targetModelName = '', apiColors = [];

    // Данные для кнопок "Подробнее"
    let dataForTarget = null;
    let dataForSelected = null;

    function renderList(isUpdateOnly = false) {
        if (!isUpdateOnly) {
            list.innerHTML = '';
            if (currentSimilarModels.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#6b7fa7; margin-top:20px;">Нет данных</p>';
                return;
            }

            currentSimilarModels.forEach(model => {
                const item = document.createElement('div');
                item.className = 'model-item';
                item.dataset.name = model.name;
                if (model.name === selectedModelName) item.classList.add('selected');

                const imgUrl = `${API_PHOTO_MODEL_URL}/${encodeURIComponent(cardGiftName)}/png/${encodeURIComponent(model.name)}.png`;

                item.innerHTML = `
                    <div style="width:40px; height:40px;"><img src="${imgUrl}" style="width:100%; height:100%; object-fit:contain;"></div>
                    <div class="model-info">
                        <div class="model-name-row">
                            <span>${model.name}</span>
                            <span class="model-coof">${(model.coof * 100).toFixed(2)}%</span>
                        </div>
                        <div class="price-value">${model.count ? model.count.toLocaleString() + ' шт.' : '0 шт.'}</div>
                    </div>
                `;

                item.onclick = () => {
                    if (selectedModelName === model.name) return;

                    const prev = list.querySelector('.model-item.selected');
                    if (prev) prev.classList.remove('selected');

                    selectedModelName = model.name;
                    item.classList.add('selected');

                    updateImages();
                };
                list.appendChild(item);
            });
        }
        updateImages();
    }

    function updateImages() {
        // Правая (Целевая)
        if (targetModelName) {
            const url = `${API_PHOTO_MODEL_URL}/${encodeURIComponent(targetGiftName)}/png/${encodeURIComponent(targetModelName)}.png`;
            const existingImg = targetBox.querySelector('img');
            if (existingImg) {
                if (existingImg.src !== url) existingImg.src = url;
            } else {
                targetBox.innerHTML = `<img src="${url}">`;
            }
            dataForTarget = { gift: targetGiftName, model: targetModelName };
        }

        // Левая (Выбранная)
        const displayModel = selectedModelName || (currentSimilarModels[0]?.name);
        if (displayModel) {
            const url = `${API_PHOTO_MODEL_URL}/${encodeURIComponent(cardGiftName)}/png/${encodeURIComponent(displayModel)}.png`;
            const existingImg = selectedBox.querySelector('img');
            if (existingImg) {
                if (existingImg.src !== url) existingImg.src = url;
            } else {
                selectedBox.innerHTML = `<img src="${url}">`;
            }

            const modelData = currentSimilarModels.find(m => m.name === displayModel);
            dataForSelected = {
                gift: cardGiftName,
                model: displayModel,
                count: modelData?.count
            };
        } else {
            selectedBox.innerHTML = '<span style="color:#6b7fa7; font-size:0.8rem;">Выберите</span>';
            dataForSelected = null;
        }
    }

    async function fetchData() {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#fff;">Загрузка...</div>';
        try {
            const res = await fetch(`${SERVER_BASE_URL}${API_SIMILAR_MODELS}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': getApiAuthHeader() },
                body: JSON.stringify({
                    "Colors": apiColors,
                    "NameGift": cardGiftName,
                    "MonohromeModelsOnly": true
                })
            });
            const data = await res.json();
            currentSimilarModels = data.map(item => ({
                name: item.Name, coof: item.Coof, count: item.Count
            }));
            selectedModelName = null;
            renderList();
        } catch (e) {
            list.innerHTML = `<p style="text-align:center; color:#f87171;">Ошибка: ${e.message}</p>`;
        }
    }

    // Листенеры кнопок "Подробнее"
    btnTarget.onclick = () => {
        if (dataForTarget && window.itemDetailsModal) {
            window.itemDetailsModal.open(dataForTarget.gift, dataForTarget.model, null, true); // true = partial view
        }
    };
    btnSelected.onclick = () => {
        if (dataForSelected && window.itemDetailsModal) {
            window.itemDetailsModal.open(dataForSelected.gift, dataForSelected.model, dataForSelected.count, true);
        }
    };

    closeBtn.onclick = () => modalOverlay.classList.add('hidden');
    modalOverlay.onclick = (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); };

    return {
        openNftDetailsModal: (gName, tGift, tModel, cols) => {
            modalTitle.textContent = gName;
            cardGiftName = gName; targetGiftName = tGift; targetModelName = tModel; apiColors = cols;
            modalOverlay.classList.remove('hidden');
            updateImages();
            fetchData();
        }
    };
}