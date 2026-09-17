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

        hueWheel.forEach(bucket => {
            const outerR = bucket.Count > 0
                ? minR + (bucket.SharePercent / maxShare) * (maxR - minR)
                : minR + 6;
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', wedgePath(bucket.HueStart, bucket.HueEnd, outerR));
            path.setAttribute('fill', bucket.Hex || '#555');
            path.setAttribute('class', 'cw-sector');
            path.addEventListener('mousemove', (e) => showTooltip(e, bucket));
            path.addEventListener('mouseleave', hideTooltip);
            svg.appendChild(path);
        });

        // Тонкая базовая окружность-ориентир для внутреннего радиуса.
        const baseCircle = document.createElementNS(ns, 'circle');
        baseCircle.setAttribute('r', minR);
        baseCircle.setAttribute('fill', 'none');
        baseCircle.setAttribute('stroke', 'rgba(255,255,255,.15)');
        svg.appendChild(baseCircle);
    }

    function showTooltip(e, bucket) {
        tooltip.innerHTML = `<b>${Math.round(bucket.HueStart)}°–${Math.round(bucket.HueEnd)}°</b>` +
            `${bucket.SharePercent}% каталога · ${bucket.Count} кластеров`;
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY + 14) + 'px';
        tooltip.classList.remove('hidden');
    }
    function hideTooltip() { tooltip.classList.add('hidden'); }

    // --- 3D-куб: точки по квантованным RGB-ячейкам ---
    let rotX = -20, rotY = 35;
    function applyCubeRotation() {
        cubeInner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    function renderCube(cubePoints) {
        if (!cubePoints.length) return;
        const maxWeight = Math.max(...cubePoints.map(p => p.WeightSum));
        const half = 100; // половина стороны куба в px (cube-inner: 200x200)

        cubePoints.forEach(p => {
            const x = (p.R / 255) * 200 - half;
            const y = (p.G / 255) * 200 - half;
            const z = (p.B / 255) * 200 - half;
            const size = 4 + Math.sqrt(p.WeightSum / maxWeight) * 16;

            const dot = document.createElement('div');
            dot.className = 'cube-point';
            dot.style.width = size + 'px';
            dot.style.height = size + 'px';
            dot.style.background = p.Hex;
            dot.style.color = p.Hex;
            dot.style.marginLeft = -(size / 2) + 'px';
            dot.style.marginTop = -(size / 2) + 'px';
            dot.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
            dot.title = `${p.Hex} · ${p.WeightSum}% суммарного веса, ${p.Count} кластеров`;
            cubeInner.appendChild(dot);
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
            renderCube(data.CubePoints);
            applyCubeRotation();
        } catch (err) {
            showError('Не удалось загрузить: ' + err.message);
        }
    }

    load();
})();
