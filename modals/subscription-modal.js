// subscription-modal.js

function closeSubscriptionModal() {
    const overlay = document.querySelector('.sub-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        // Optional: Remove from DOM after transition
        // setTimeout(() => overlay.remove(), 300);
    }
}

function showSubscriptionModal(channelId) {
    // Hide any loading indicators if present
    const loadingContainers = document.querySelectorAll('.loading-container, .loading-indicator');
    loadingContainers.forEach(el => el.classList.add('hidden'));

    let overlay = document.querySelector('.sub-modal-overlay');

    if (!overlay) {
        const html = `
            <div class="sub-modal-overlay">
                <div class="sub-modal">
                    <div class="sub-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
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

        // Close on click outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) window.closeSubscriptionModal();
        });
    }

    // Show with a slight delay for transition
    setTimeout(() => overlay.classList.add('active'), 10);
}

// Expose functions to window
window.closeSubscriptionModal = closeSubscriptionModal;
window.showSubscriptionModal = showSubscriptionModal;
