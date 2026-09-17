(function () {
    const API_BASE = (window.CONFIG && window.CONFIG.SERVER_BASE_URL || 'https://nftmatch.pro') + '/api/MonoCoof';

    const svg = document.getElementById('cw-svg');
    const statsEl = document.getElementById('cw-stats');
    const errorEl = document.getElementById('cw-error');
    const wheelView = document.getElementById('cw-wheel-view');
    const cubeView = document.getElementById('cw-cube-view');
    const tooltip = document.getElementById('cw-tooltip');
    const cubeInner = document.getElementById('cube-inner');
    const cubeScene = document.getElementById('cube-scene');
    const tabs = document.querySelectorAll('.cw-tab');
    const thresholdEl = document.getElementById('cw-threshold');
    const legendEl = document.getElementById('cw-legend');

    // 12 секторов по 30° начиная с 0° (красный) — классические названия цветового круга художника,
    // тот же порядок, что и HueWheel с бэкенда.
    const HUE_NAMES = ['Красный', 'Оранжевый', 'Жёлтый', 'Салатовый', 'Зелёный', 'Изумрудный',
        'Голубой', 'Синий', 'Индиго', 'Фиолетовый', 'Пурпурный', 'Розовый'];

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
        wheelView.classList.add('hidden');
        cubeView.classList.add('hidden');
        document.querySelector('.cw-tabs').style.display = 'none';
    }

    // --- Вкладки "Круг" / "3D-куб" ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const view = tab.dataset.view;
            wheelView.classList.toggle('hidden', view !== 'wheel');
            cubeView.classList.toggle('hidden', view !== 'cube');
        });
    });

    // --- Круг: 12 секторов по Hue, радиус ~ доля веса (roza diagram) ---
    function polar(r, deg) {
        const rad = (deg - 90) * Math.PI / 180;
        return [r * Math.cos(rad), r * Math.sin(rad)];
    }

    function wedgePath(hueStart, hueEnd, outerR) {
        const [x1, y1] = polar(outerR, hueStart);
        const [x2, y2] = polar(outerR, hueEnd);
        const largeArc = (hueEnd - hueStart) > 180 ? 1 : 0;
        return `M 0 0 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    }

    function renderWheel(hueWheel) {
        const maxShare = Math.max(1, ...hueWheel.map(h => h.SharePercent));
        const minR = 30, maxR = 200;
        const ns = 'http://www.w3.org/2000/svg';

        hueWheel.forEach((bucket, i) => {
            const outerR = bucket.Count > 0
                ? minR + (bucket.SharePercent / maxShare) * (maxR - minR)
                : minR + 6;
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', wedgePath(bucket.HueStart, bucket.HueEnd, outerR));
            path.setAttribute('fill', bucket.Hex || '#555');
            path.setAttribute('class', 'cw-sector');
            path.addEventListener('mousemove', (e) => showTooltip(e, bucket, i));
            path.addEventListener('mouseleave', hideTooltip);
            svg.appendChild(path);

            // putya: "только еще бы какие-то обозначения добавить" — процент прямо на крупных
            // секторах (мелкие подписаны только в легенде ниже, иначе текст не влезает).
            if (bucket.SharePercent >= 4) {
                const midAngle = (bucket.HueStart + bucket.HueEnd) / 2;
                const [lx, ly] = polar(outerR * 0.62, midAngle);
                const text = document.createElementNS(ns, 'text');
                text.setAttribute('x', lx.toFixed(1));
                text.setAttribute('y', ly.toFixed(1));
                text.setAttribute('class', 'cw-sector-label');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.textContent = bucket.SharePercent + '%';
                svg.appendChild(text);
            }
        });

        // Тонкая базовая окружность-ориентир для внутреннего радиуса.
        const baseCircle = document.createElementNS(ns, 'circle');
        baseCircle.setAttribute('r', minR);
        baseCircle.setAttribute('fill', 'none');
        baseCircle.setAttribute('stroke', 'rgba(255,255,255,.15)');
        svg.appendChild(baseCircle);
    }

    // Легенда: название цвета + доля, одним списком — общая для обоих видов (круг и 3D-бары
    // используют одни и те же 12 hue-бакетов и цвета).
    function renderLegend(hueWheel) {
        legendEl.innerHTML = hueWheel.map((b, i) => `
            <div class="cw-legend-item">
                <span class="cw-legend-swatch" style="background:${b.Hex}"></span>
                <span class="cw-legend-name">${HUE_NAMES[i]}</span>
                <span class="cw-legend-pct">${b.SharePercent}%</span>
            </div>
        `).join('');
    }

    function showTooltip(e, bucket, i) {
        tooltip.innerHTML = `<b>${HUE_NAMES[i]} (${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°)</b>` +
            `${bucket.SharePercent}% каталога · ${bucket.Count} кластеров`;
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY + 14) + 'px';
        tooltip.classList.remove('hidden');
    }
    function hideTooltip() { tooltip.classList.add('hidden'); }

    // --- 3D-бары: те же 12 hue-бакетов, что и в круге, расставлены по кольцу — putya: "куб
    // странный, не очень понятный, другой бы формат какой-то выбрать" — вместо разброса точек в
    // RGB-пространстве (нужно понимать оси R/G/B) те же самые, уже знакомые по кругу категории,
    // просто вытянутые в объём по высоте.
    let rotX = -20, rotY = 35;
    function applyCubeRotation() {
        cubeInner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    function renderBars3D(hueWheel) {
        cubeInner.innerHTML = '';

        const ground = document.createElement('div');
        ground.className = 'bars3d-ground';
        cubeInner.appendChild(ground);

        const maxShare = Math.max(1, ...hueWheel.map(h => h.SharePercent));
        const radius = 90, maxHeight = 150, barWidth = 26;

        hueWheel.forEach((b, i) => {
            const angle = (b.HueStart + b.HueEnd) / 2;
            const h = Math.max(6, (b.SharePercent / maxShare) * maxHeight);

            const anchor = document.createElement('div');
            anchor.className = 'bar3d-anchor';
            anchor.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;

            const bar = document.createElement('div');
            bar.className = 'bar3d';
            bar.style.width = barWidth + 'px';
            bar.style.height = h + 'px';
            bar.style.background = b.Hex;
            bar.style.color = b.Hex;
            bar.title = `${HUE_NAMES[i]}: ${b.SharePercent}% (${b.Count} кластеров)`;

            anchor.appendChild(bar);
            cubeInner.appendChild(anchor);
        });
    }

    // Перетаскивание мышью/тачем для поворота куба.
    let dragging = false, lastX = 0, lastY = 0, autoRotate = true;
    function dragStart(x, y) { dragging = true; autoRotate = false; lastX = x; lastY = y; }
    function dragMove(x, y) {
        if (!dragging) return;
        rotY += (x - lastX) * 0.4;
        rotX -= (y - lastY) * 0.4;
        rotX = Math.max(-85, Math.min(85, rotX));
        lastX = x; lastY = y;
        applyCubeRotation();
    }
    function dragEnd() { dragging = false; }

    cubeScene.addEventListener('mousedown', e => dragStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => dragMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', dragEnd);
    cubeScene.addEventListener('touchstart', e => { const t = e.touches[0]; dragStart(t.clientX, t.clientY); }, { passive: true });
    cubeScene.addEventListener('touchmove', e => { const t = e.touches[0]; dragMove(t.clientX, t.clientY); }, { passive: true });
    cubeScene.addEventListener('touchend', dragEnd);

    function tick() {
        if (autoRotate) { rotY += 0.15; applyCubeRotation(); }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // --- Загрузка данных ---
    async function load() {
        try {
            const resp = await fetch(`${API_BASE}/GetGlobalColorWheel`);
            if (resp.status === 403) {
                showError('Страница недоступна.');
                return;
            }
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();

            thresholdEl.textContent = data.MinClusterWeightPercent;
            statsEl.innerHTML = `
                <span>Моделей просканировано: <b>${data.ModelsScanned}</b></span>
                <span>Кластеров учтено: <b>${data.ClustersUsed}</b></span>
                <span>Серые/нейтральные: <b>${data.GreySharePercent}%</b></span>
            `;

            renderWheel(data.HueWheel);
            renderLegend(data.HueWheel);
            renderBars3D(data.HueWheel);
            applyCubeRotation();
        } catch (err) {
            showError('Не удалось загрузить: ' + err.message);
        }
    }

    load();
})();
