/* Редактор карточки NFT Match. Карточка, стикеры и перетаскивание перенесены из примера E:\TG Concept\web (ниже — его код,
   доработанный под API сайта). Оригинальный комментарий:
   Wallet card with gift stickers – web concept, behaviour ported from the Telegram Beta client (org.telegram.ui.Wallet.t7).
   - card: WebGL brushed-metal shader + CSS 3D tilt
   - gifts: hold = menu (Add to card / Apply colour), drag onto the card = the sticker lands exactly where you drop it
   - menu "Add to card" and a fast fling use the automatic placement (scoring algorithm of the client)
   - stickers: static first frame of the gift model; tap = select (animates, ring with 2 handles for scale + rotation),
               drag = move, drag off the card / onto "Remove" = take it off, the 11th sticker replaces the oldest */
(function () {
'use strict';
const VIEW_ID = new URLSearchParams(location.search).get('c');   // режим просмотра чужой карточки по ссылке

const MAX_STICKERS = 10;
const DEFAULT_COLORS = { c0: '#3AB0F8', c1: '#1488E1' };
const $ = (s, r = document) => r.querySelector(s);

const byId = {};                                  // цвета подарков не используются: карточка всегда фирменная синяя

/* ------------------------------------------------------------------ helpers */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hex2rgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); };
const rgb2css = c => 'rgb(' + c.map(v => Math.round(clamp(v, 0, 1) * 255)).join(',') + ')';
const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ------------------------------------------------------------------ state */
const state = { stickers: [], colorId: null };

/* ------------------------------------------------------------------ DOM */
const app = $('#app'), page = $('#page'), card = $('#card'), face = $('#face'), glCanvas = $('#gl');
const stickersEl = $('#stickers'), stage = $('#stage'), fx = $('#fx'), patCanvas = $('#pat'), content = $('#content');
const grid = $('#grid'), menu = $('#menu'), bin = $('#bin'), toastEl = $('#toast');
let patDirty = true;
const engrave = $('#engrave');
let cardW = 400, cardH = 400 / 1.648;

/* ------------------------------------------------------------------ 12 words on the right edge */
const WORDS = (() => { let n = 'NFTMatchBot'; try { n = window.parent.CONFIG.BOT_USERNAME || n; } catch (e) { /* ignore */ } return Array(4).fill('@' + n); })();
engrave.children[0].innerHTML = WORDS.slice(0, 2).map(w => '<b style="font-weight:inherit">' + w + '</b>').join('');
engrave.children[1].innerHTML = WORDS.slice(2).map(w => '<b style="font-weight:inherit">' + w + '</b>').join('');

/* ================================================================== WebGL card */
const gl = glCanvas.getContext('webgl', { antialias: true, premultipliedAlpha: false, alpha: false }) ||
           glCanvas.getContext('experimental-webgl');
let glProg, uni = {};
const colorNow = { c0: hex2rgb(DEFAULT_COLORS.c0), c1: hex2rgb(DEFAULT_COLORS.c1) };
const tilt = { x: 0, y: 0 };

const VS = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;vUv.y=1.-vUv.y;gl_Position=vec4(p,0.,1.);}';
const FS = `
precision highp float;
varying vec2 vUv;
uniform vec2 uSize;
uniform vec2 uTilt;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uP0;      // previous colours (while a colour change spreads from the sticker)
uniform vec3 uP1;
uniform vec2 uOrg;     // where it spreads from (uv)
uniform float uRad;    // px, <0 = no transition running
uniform float uSoft;   // px, softness of the front
uniform float uTime;

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
}
float glint(vec2 p, vec2 c, float rad, float ph){
  float tw = pow(max(0., sin(uTime*1.3 + ph)), 6.);
  vec2 d = p-c; float r = length(d);
  float star = max(0., 1.-abs(d.x)/(rad*3.)) * max(0., 1.-abs(d.y)/(rad*.5)) + max(0., 1.-abs(d.y)/(rad*3.)) * max(0., 1.-abs(d.x)/(rad*.5));
  return (star*.8 + max(0.,1.-r/(rad*1.2))*.5) * tw;
}
void main(){
  float asp = uSize.x/uSize.y;
  vec2 q = vUv - .5;
  vec2 p = q*vec2(asp,1.);

  // brushed (circular) metal: bright / dark sectors around a focal point that follows the tilt
  vec2 focus = vec2(0., 0.);      // центр бликов всегда в центре карточки, при наклоне не съезжает
  vec2 d = p - focus;
  float r = length(d);
  float a = atan(d.y, d.x);
  float cone = .5 + .5*cos(2.*(a - .22 + uTilt.y*1.4 + uTilt.x*.5));
  cone = smoothstep(.0, 1., cone);
  cone = mix(.5, cone, smoothstep(.0, .22, r));          // no hard cusp at the focus
  float cone2 = mix(.5, .5 + .5*cos(a*4. - .6 + uTilt.y*2.), smoothstep(.0, .3, r));
  float lin = dot(q, vec2(.92,-.38));

  // grooves: concentric rings + radial grain
  float ring = vnoise(vec2(r*asp*260., 1.3)) * .55 + vnoise(vec2(r*asp*820., 4.7)) * .45;
  float grain = vnoise(vec2(a*180., r*30.)) ;
  float groove = (ring - .5)*.075 + (grain - .5)*.035;

  float t = .08 + .78*cone + .08*cone2 + lin*.12 + groove*(.55 + .9*cone);
  float m = 1.;
  if (uRad >= 0.) { m = clamp((uRad - length(vUv*uSize - uOrg*uSize)) / uSoft, 0., 1.); m = m*m*(3. - 2.*m); }
  vec3 C0 = mix(uP0, uC0, m), C1 = mix(uP1, uC1, m);
  vec3 dark  = C1*.80;
  vec3 light = min(C0*1.10 + vec3(.04,.035,.03), vec3(1.));
  vec3 col = mix(dark, light, clamp(t, 0., 1.));

  // soft bloom of the key light
  col += (light - dark) * .10 * exp(-r*3.2) * (cone*.6 + .4);

  // sparkles
  vec2 pp = p;
  float g = glint(pp, vec2(-.43*asp*.5+ -.02, -.36), .018, 0.4)
          + glint(pp, vec2(.07, -.31), .016, 2.1)
          + glint(pp, vec2(.10, .14), .014, 3.7)
          + glint(pp, vec2(.31*asp*.5, .39), .016, 5.2)
          + glint(pp, vec2(-.33, .02), .012, 1.2);
  col += vec3(1.)*g*.85;

  // bevel: bright rim at the top-left, shade at the bottom-right
  float e = min(min(vUv.x, 1.-vUv.x)*asp, min(vUv.y, 1.-vUv.y));
  float rim = smoothstep(.016, 0., e);
  col += rim * (.10 + .18*max(0., dot(normalize(q+1e-4), vec2(-.6,-.8))));
  col *= 1. - .05*smoothstep(.55, .95, length(q*vec2(1.,1.4))*1.9);

  gl_FragColor = vec4(col, 1.);
}`;

function initGL() {
  if (!gl) return false;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  glProg = gl.createProgram();
  gl.attachShader(glProg, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(glProg, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(glProg);
  gl.useProgram(glProg);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(glProg, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  ['uSize', 'uTilt', 'uC0', 'uC1', 'uP0', 'uP1', 'uOrg', 'uRad', 'uSoft', 'uTime'].forEach(n => uni[n] = gl.getUniformLocation(glProg, n));
  return true;
}
const glOK = initGL();

function resize() {
  const r = card.getBoundingClientRect();
  // untransformed size (getBoundingClientRect includes the tilt)
  cardW = card.offsetWidth; cardH = card.offsetHeight;
  card.style.setProperty('--cw', cardW + 'px');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  glCanvas.width = patCanvas.width = Math.round(cardW * dpr); glCanvas.height = patCanvas.height = Math.round(cardH * dpr);
  if (glOK) gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  patDirty = true;
  stickersEl.style.clipPath = chipHole();
  layoutStickers();
}
new ResizeObserver(resize).observe(card);

/* ------------------------------------------------------------------ colours (animated) */
/* Like the client: the new colour (and the gift's pattern) spreads over the card as a circle that starts at the sticker. */
const frameCache = new Map();
let rev = null, lastOrg = { x: .6, y: .68 };
function targetColors() {
  const g = state.colorId && byId[state.colorId];
  return g ? { c0: hex2rgb(g.c0), c1: hex2rgb(g.c1) } : { c0: hex2rgb(DEFAULT_COLORS.c0), c1: hex2rgb(DEFAULT_COLORS.c1) };
}
function applyTheme(animate, org, prevId) {
  const t = targetColors();
  if (!animate) { rev = null; colorNow.c0 = t.c0; colorNow.c1 = t.c1; paintVars(); patDirty = true; return; }
  if (org) lastOrg = org;
  rev = { start: performance.now(), dur: 950, from: { c0: colorNow.c0.slice(), c1: colorNow.c1.slice() }, to: t, org: lastOrg, prev: prevId || null, next: state.colorId };
  patDirty = true;
}
function paintVars() {
  const c0 = colorNow.c0, c1 = colorNow.c1, root = document.documentElement.style;
  const accent = mix(c1, c0, .42);
  root.setProperty('--usd', rgb2css(mix(c0, [1, 1, 1], .62)));
  root.setProperty('--shadow', rgb2css(mix(c1, [0, 0, 0], .55)));
  root.setProperty('--engrave', rgb2css(mix(c1, [0, 0, 0], .12)));
  card.style.setProperty('--edge', rgb2css(c1));
  const lum = .3 * c0[0] + .59 * c0[1] + .11 * c0[2];
  root.setProperty('--gem1', rgb2css(mix(c0, [1, 1, 1], .86)));
  root.setProperty('--gem2', rgb2css(mix(c0, [1, 1, 1], .55)));
  root.setProperty('--gem3', rgb2css(mix(c1, [1, 1, 1], .35)));
  document.querySelector('meta[name=theme-color]').setAttribute('content', '#f0f0f5');
  card.dataset.lum = lum.toFixed(2);
}

/* ------------------------------------------------------------------ tilt (drag the card) */
const tiltTarget = { x: 0, y: 0 }, tiltVel = { x: 0, y: 0 };
let tiltDrag = null;
stage.addEventListener('pointerdown', e => {
  if (stickerDown(e)) return;
  tiltDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, tx: tiltTarget.x, ty: tiltTarget.y };
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', e => {
  if (!tiltDrag || e.pointerId !== tiltDrag.id) return;
  const dx = (e.clientX - tiltDrag.x) / cardW, dy = (e.clientY - tiltDrag.y) / cardH;
  tiltTarget.y = clamp(tiltDrag.ty + dx * 1.7, -.62, .62);
  tiltTarget.x = clamp(tiltDrag.tx - dy * 1.7, -.5, .5);
});
const endTilt = e => { if (tiltDrag && e.pointerId === tiltDrag.id) { tiltDrag = null; tiltTarget.x = 0; tiltTarget.y = 0; } };
stage.addEventListener('pointerup', endTilt);
stage.addEventListener('pointercancel', endTilt);

/* ------------------------------------------------------------------ render loop */
let last = performance.now(), lastGL = 0;
function frame(now) {
  const calm = !(tiltDrag || carry || G || rev || Math.abs(tiltVel.x) + Math.abs(tiltVel.y) > .004 || Math.abs(tilt.x - tiltTarget.x) + Math.abs(tilt.y - tiltTarget.y) > .001);
  if (calm && now - lastGL < 66) { requestAnimationFrame(frame); return; }   // в покое блики медленные — хватает ~15 кадров в секунду
  lastGL = now;
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  // colour change spreading from the sticker
  let radPx = -1, softPx = 1;
  if (rev) {
    const k = clamp((now - rev.start) / rev.dur, 0, 1), e = easeInOut(k);
    colorNow.c0 = mix(rev.from.c0, rev.to.c0, e);
    colorNow.c1 = mix(rev.from.c1, rev.to.c1, e);
    paintVars();
    softPx = glCanvas.width * (120 / 328);
    radPx = easeOut(k) * (glCanvas.width * 1.25 + softPx);
    rev.rad = radPx; rev.soft = softPx;
    if (k >= 1) { rev = null; radPx = -1; colorNow.c0 = targetColors().c0; colorNow.c1 = targetColors().c1; paintVars(); patDirty = true; }
  }
  tickFX(dt, now);
  // tilt spring (critically damped)
  ['x', 'y'].forEach(a => {
    const k = tiltDrag ? 90 : 38, c = tiltDrag ? 14 : 11;
    tiltVel[a] += ((tiltTarget[a] - tilt[a]) * k - tiltVel[a] * c) * dt;
    tilt[a] += tiltVel[a] * dt;
  });
  card.style.transform = 'rotateY(' + (tilt.y * 38).toFixed(2) + 'deg) rotateX(' + (tilt.x * 38).toFixed(2) + 'deg)';
  if (glOK) {
    gl.uniform2f(uni.uSize, glCanvas.width, glCanvas.height);
    gl.uniform2f(uni.uTilt, tilt.x, tilt.y);
    const to = rev ? rev.to : colorNow, from = rev ? rev.from : colorNow;
    gl.uniform3fv(uni.uC0, to.c0); gl.uniform3fv(uni.uC1, to.c1);
    gl.uniform3fv(uni.uP0, from.c0); gl.uniform3fv(uni.uP1, from.c1);
    gl.uniform2f(uni.uOrg, rev ? rev.org.x : .5, rev ? rev.org.y : .5);
    gl.uniform1f(uni.uRad, radPx); gl.uniform1f(uni.uSoft, softPx);
    gl.uniform1f(uni.uTime, now / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(frame);
}

/* ================================================================== lottie helpers */
/* Stickers on the card are static: the first frame of the model. One hidden copy per gift is rendered once and cloned. */

/* ================================================================== card geometry (what stickers must keep away from) */
function px(v) { return v * cardW / 328; }       // "dp": the design is made for a 328 dp wide card
function U() { return cardW * 0.231; }           // size of a sticker at scale 1
let obsMemo = null;
/* Препятствия считаются по размерам DOM (offsetWidth) — на каждом кадре это принудительная раскладка страницы. Кэшируем по размеру карточки и тексту. */
function obstacles(inflate) {
  const key = cardW + '|' + cardH + '|' + document.querySelector('.usd').textContent + '|' + document.getElementById('holder').textContent + '|' + (inflate ? 1 : 0);
  if (obsMemo && obsMemo.key === key) return obsMemo.val;
  const val = obstaclesRaw(inflate);
  obsMemo = { key, val };
  return val;
}
function obstaclesRaw(inflate) {
  const W = cardW, H = cardH, u = W / 336, f6 = W * 0.012, r = [];
  const bal = document.querySelector('.balance'), usd = document.querySelector('.usd'), hol = document.querySelector('.holder');
  const bw = bal.offsetWidth, bh = bal.offsetHeight;
  r.push({ l: W * .066, t: H * .41 - bh / 2, r: W * .066 + bw, b: H * .41 + bh / 2 });          // balance
  r.push({ l: W * .066, t: H - H * .085 - hol.offsetHeight, r: W * .066 + hol.offsetWidth, b: H - H * .085 });   // holder
  r.push({ l: W - 34 * u, t: 18 * u, r: W - 12 * u, b: 187 * u });                                // engraved words
  r.push({ l: W * .70, t: H * .361, r: W * .842, b: H * .537 });                                  // QR chip
  r.push({ l: W * .069, t: H * .515, r: W * .069 + usd.offsetWidth, b: H * .515 + usd.offsetHeight }); // usd line
  if (!inflate) return r;
  r.forEach(o => { o.l -= f6; o.t -= f6; o.r += f6; o.b += f6; });
  r[2].l -= W * 0.035;
  return r;
}
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

/* Automatic placement: scans the card and scores every spot (port of the client's algorithm).
   hint = {x, y} px of the drop point or null; returns {x, y, sc} (px centre + scale) or null. */
function findPlacement(selfId, curScale, hint) {
  const W = cardW, H = cardH, u = U(), obs = obstacles(true);
  const others = state.stickers.filter(s => s.id !== selfId);
  const minScale = px(32) / u;
  const fU = u * minScale * 0.5;
  const base = curScale || 1;
  const stepV = px(5);
  const d = 0.04 + Math.random() * 0.01;
  const rx = ((Math.random() - .5) * .08 + .5) * W, ry = H * (((Math.random() - .5) * .08 + .55));
  const o = others.map(s => ({ x: s.x * W, y: s.y * H, sc: s.sc }));
  let best = -Infinity, res = null;
  for (let y = fU; y <= H - fU; y += stepV) {
    for (let x = fU; x <= W - fU; x += stepV) {
      const edge = Math.min(x, W - x, y, H - y);
      let sc = Math.min(Math.max(0.74, 1 - o.length * d) * base, edge / (u * 0.5));
      let near = Infinity;
      for (const b of obs) near = Math.min(near, dist(x, y, Math.max(b.l, Math.min(b.r, x)), Math.max(b.t, Math.min(b.b, y))));
      sc = Math.min(sc, near / (u * 0.44));
      for (const s of o) sc = Math.min(sc, dist(x, y, s.x, s.y) / (u * 0.29) - s.sc);
      sc = ((clamp((edge - u * 0.5 * sc) / px(14), 0, 1) * 0.1) + 0.9) * sc;
      if (sc < minScale) continue;
      let score;
      if (!o.length) {
        const ax = W * .6, ay = H * .68;
        const tx = hint ? ax + (hint.x - ax) * 0.2 : ax, ty = hint ? ay + (hint.y - ay) * 0.2 : ay;
        score = Math.random() * px(5) + u * 1.1 * sc + dist(x, y, tx, ty) * -0.45;
      } else {
        let cx = x * sc * sc, cy = y * sc * sc, cw = sc * sc, nearest = Infinity, align = 0;
        for (const s of o) {
          nearest = Math.min(nearest, dist(x, y, s.x, s.y) - (s.sc + sc) * (u * 0.4));
          const w2 = s.sc * s.sc; cx += s.x * w2; cy += s.y * w2; cw += w2;
          align += Math.max(0, 1 - Math.abs(s.y - y) / (u * 0.12)) + Math.max(0, 1 - Math.abs(s.x - x) / (u * 0.12));
        }
        score = Math.random() * px(10) + (((Math.min(Math.min(edge, near), u) * 0.2 +
                (u * (sc * 0.9) + ((nearest < 0 ? nearest * 2.5 : Math.min(nearest, u * 0.3)) * 1.2))) -
                dist(cx / cw, cy / cw, rx, ry) * 0.35) - u * align * 0.08) - dist(x, y, W * .5, H * .55) * 0.04
                - (hint ? dist(x, y, hint.x, hint.y) * 0.04 : 0);
      }
      if (score > best) { best = score; res = { x, y, sc }; }
    }
  }
  return res;
}

/* ================================================================== stickers (state + DOM) */
/* Which gifts may colour the card – in the client this list comes from the server (AppGlobalConfig.walletCardBgGifts). */
const BG_GIFTS = new Set();
const canColour = id => BG_GIFTS.has(id);

const SC_MAX = 1.21, SLOP = 8, HIT = 0.44;
let zSeq = state.stickers.reduce((m, s) => Math.max(m, s.z || 0), 0);
let tSeq = state.stickers.reduce((m, s) => Math.max(m, s.t || 0), 0);
const stickerEls = new Map();
const getSt = id => state.stickers.find(s => s.id === id);
const sizeOf = st => U() * st.sc;
const wrap180 = a => { a %= 360; if (a > 180) a -= 360; if (a < -180) a += 360; return a; };
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ } };

function localPt(cx, cy) { const r = card.getBoundingClientRect(); return { x: (cx - r.left) / r.width * cardW, y: (cy - r.top) / r.height * cardH }; }
function clientScale() { return card.getBoundingClientRect().width / cardW; }
const inCardL = l => l.x >= 0 && l.x <= cardW && l.y >= 0 && l.y <= cardH;

/* the QR chip is never covered: the sticker layer has a hole in the shape of the chip (path from the client) */
function chipHole() {
  const u = cardW / 336, S = 53, L = (336 - S - 48) * u, R = (336 - S) * u, T = .36097562 * cardH, B = .5365854 * cardH, rx = 8 * u, ry = .03902439 * cardH;
  const big = 'M' + (-cardW) + ' ' + (-cardH) + 'H' + (2 * cardW) + 'V' + (2 * cardH) + 'H' + (-cardW) + 'Z';
  const hole = 'M' + (L + rx) + ' ' + T + 'H' + (R - rx) + 'A' + rx + ' ' + ry + ' 0 0 1 ' + R + ' ' + (T + ry) + 'V' + (B - ry) +
    'A' + rx + ' ' + ry + ' 0 0 1 ' + (R - rx) + ' ' + B + 'H' + (L + rx) + 'A' + rx + ' ' + ry + ' 0 0 1 ' + L + ' ' + (B - ry) + 'V' + (T + ry) +
    'A' + rx + ' ' + ry + ' 0 0 1 ' + (L + rx) + ' ' + T + 'Z';
  return "path(evenodd, '" + big + hole + "')";
}

function placeSticker(st, mode) {              // mode: 'instant' | 'ease'
  const el = stickerEls.get(st.id); if (!el) return;
  const w = sizeOf(st), left = st.x * cardW - w / 2, top = st.y * cardH - w / 2;
  const spring = 'cubic-bezier(.2,.9,.25,1.15)';
  el.style.width = el.style.height = w + 'px';
  el.style.zIndex = st.z || 1;
  el.style.transition = mode === 'ease' ? 'transform .42s ' + spring + ', width .42s ' + spring + ', height .42s ' + spring : 'none';
  el.style.transform = 'translate(' + left + 'px,' + top + 'px) rotate(' + (st.r || 0) + 'deg)';
}
function layoutStickers() { state.stickers.forEach(st => placeSticker(st, 'instant')); }

function createStickerEl(st) {
  const el = document.createElement('div');
  el.className = 'sticker'; el.dataset.id = st.id;
  el.appendChild(staticArt(st.src));
  stickersEl.appendChild(el); stickerEls.set(st.id, el);
  return el;
}

/* ---- put a gift on the card at a given place. fromRect = client rect it grows out of (dragged copy / tile) */
function addToCard(gid, loc, sc, r, fromRect) {
  const list = state.stickers.slice().sort((a, b) => a.t - b.t);
  while (state.stickers.length >= MAX_STICKERS) evict(list.shift());           // 11th sticker: the oldest goes back to the list
  const st = { id: newInstId(gid), src: gid, x: loc.x / cardW, y: loc.y / cardH, sc, r: r || 0, z: ++zSeq, t: ++tSeq };
  state.stickers.push(st);
  const el = createStickerEl(st);
  landFrom(st, el, fromRect);
  save(); refreshTiles(); patDirty = true;
  return st;
}
function landFrom(st, el, fromRect) {
  if (fromRect) {
    const k = 1 / clientScale(), c = localPt(fromRect.left + fromRect.width / 2, fromRect.top + fromRect.height / 2), w0 = fromRect.width * k;
    el.style.transition = 'none'; el.style.width = el.style.height = w0 + 'px';
    el.style.transform = 'translate(' + (c.x - w0 / 2) + 'px,' + (c.y - w0 / 2) + 'px) rotate(0deg)';
    void el.offsetWidth;
    requestAnimationFrame(() => placeSticker(st, 'ease'));
  } else placeSticker(st, 'instant');
}
/* take a sticker off the card (state only) */
function detach(gid) {
  const i = state.stickers.findIndex(s => s.id === gid); if (i < 0) return;
  state.stickers.splice(i, 1);
  const el = stickerEls.get(gid); stickerEls.delete(gid);
  if (el) { if (el._anim) { try { el._anim.destroy(); } catch (e) { /* ignore */ } } el.remove(); }
  if (selId === gid) select(null);
  if (state.colorId === gid) setColour(null);                                  // the colour lives and dies with its sticker
  save(); refreshTiles();
}
function evict(st) {                                                           // flies back to its tile in the list
  const el = stickerEls.get(st.id), r = el ? el.getBoundingClientRect() : null, rot = st.r;
  detach(st.id);
  if (r) flyBack(st.src, r, rot);
}
function tileArt(gid) { const t = tiles.get(gid); return t && t.firstChild; }
function flyBack(gid, r, rot) {
  const art = tileArt(gid), tr = art ? art.getBoundingClientRect() : null;
  const g = document.createElement('div'); g.className = 'carry'; g.appendChild(staticArt(gid)); document.body.appendChild(g);
  const w0 = r.width, cx0 = r.left + r.width / 2, cy0 = r.top + r.height / 2;
  let cx1 = cx0, cy1 = cy0, w1 = w0 * .5;
  if (tr) { cx1 = tr.left + tr.width / 2; cy1 = tr.top + tr.height * .46; w1 = tr.width * .66; }
  g.style.width = g.style.height = w0 + 'px';
  const tf = (x, y, rr, k) => 'translate(' + (x - w0 / 2) + 'px,' + (y - w0 / 2) + 'px) rotate(' + rr + 'deg) scale(' + k + ')';
  g.style.transform = tf(cx0, cy0, rot || 0, 1);
  g.animate([{ transform: tf(cx0, cy0, rot || 0, 1), opacity: 1 }, { transform: tf(cx1, cy1, 0, w1 / w0), opacity: 1, offset: .82 }, { transform: tf(cx1, cy1, 0, w1 / w0), opacity: 0 }],
    { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }).onfinish = () => { g.remove(); bounceTile(gid); };
}
function flyToBin(r, gid) {
  const g = document.createElement('div'); g.className = 'carry'; g.appendChild(staticArt(gid)); document.body.appendChild(g);
  const w0 = r.width, b = binCenter(), tf = (x, y, k) => 'translate(' + (x - w0 / 2) + 'px,' + (y - w0 / 2) + 'px) scale(' + k + ')';
  g.style.width = g.style.height = w0 + 'px';
  g.animate([{ transform: tf(r.left + w0 / 2, r.top + w0 / 2, 1), opacity: 1 }, { transform: tf(b.x - 40, b.y, 0), opacity: .2 }], { duration: 300, easing: 'ease-in' }).onfinish = () => g.remove();
  buzz(16);
}
function bounceTile(gid) { const a = tileArt(gid); if (a) a.animate([{ transform: 'scale(.93)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' }); }
function shakeTile(gid) { const a = tileArt(gid); if (a) a.animate([{ rotate: '0deg' }, { rotate: '3deg' }, { rotate: '-2deg' }, { rotate: '0deg' }], { duration: 220 }); }

/* ---- colour (needs a sticker on the card; the colour is saved only together with it) */
function setColour(id) {
  const prev = state.colorId; if (prev === id) return;
  state.colorId = id;
  const st = getSt(id || prev);
  applyTheme(true, st ? { x: st.x, y: st.y } : null, prev);
  save(); refreshTiles();
}
function toggleColour(gid) {
  if (state.colorId === gid) { setColour(null); return; }
  if (!canColour(gid)) return;
  if (!getSt(gid) && !autoAdd(gid)) return;
  setColour(gid);
}

/* ---- automatic placement: "Add to card" in the menu and a fast fling */
function autoAdd(gid, hint) {
  const pl = findPlacement(gid, 1, hint || null);
  const art = tileArt(gid), tr = art && art.getBoundingClientRect();
  if (!pl) { shakeTile(gid); toast('Нет свободного места на карточке'); return null; }
  page.scrollTo({ top: 0, behavior: 'smooth' });
  const from = tr ? { left: tr.left + tr.width * .17, top: tr.top + tr.height * .13, width: tr.width * .66, height: tr.width * .66 } : null;
  return addToCard(gid, { x: pl.x, y: pl.y }, pl.sc, 0, from);
}

/* ================================================================== selection (tap / hold a sticker): ring + 2 handles */
let selId = null;
const ring = document.createElement('div'); ring.className = 'ring'; ring.hidden = true; ring.innerHTML = '<i></i><i></i>'; fx.appendChild(ring);
function select(id) {
  if (selId === id) return;
  selId = id; ring.hidden = !id;
  if (id) { const st = getSt(id); if (st) { st.z = ++zSeq; placeSticker(st, 'instant'); } buzz(6); }
}
function ringR(st) { return sizeOf(st) / 2 + px(9); }
function knobs(st) {
  const R = ringR(st), a = (st.r || 0) * Math.PI / 180, cx = st.x * cardW, cy = st.y * cardH;
  return [-1, 1].map(k => ({ x: cx + k * R * Math.cos(a), y: cy + k * R * Math.sin(a) }));
}

/* scale + rotate around the centre with one finger (port of t7.M). handle = dragging a knob, otherwise hold-and-move */
function rsInit(g) { g.E0 = NaN; g.F0 = g.st.sc; g.B0 = NaN; g.C0 = 0; g.D0 = g.st.r || 0; g.snapped = false; }
function rsMove(g, l) {
  const st = g.st, cx = st.x * cardW, cy = st.y * cardH, d = dist(l.x, l.y, cx, cy), minS = px(32) / U();
  if (isNaN(g.E0)) { g.E0 = d; g.F0 = st.sc; }
  let sc;
  if (g.handle) sc = g.F0 * d / Math.max(1, g.E0);
  else { const t = (d - g.E0) / px(110); sc = t >= 0 ? lerp(g.F0, SC_MAX, t) : lerp(g.F0, minS, -t); }
  st.sc = clamp(sc, minS, SC_MAX);
  if (d >= px(14)) {
    const ang = Math.atan2(l.y - cy, l.x - cx) * 180 / Math.PI;
    if (!isNaN(g.B0)) g.C0 += wrap180(ang - g.B0);
    g.B0 = ang;
    let r = g.D0 + g.C0; const rr = Math.round(r / 90) * 90, snap = Math.abs(r - rr) < 5;   // clicks into 0/90/180/270
    if (snap && !g.snapped) buzz(10);
    g.snapped = snap; if (snap) r = rr;
    st.r = r;
  } else g.B0 = NaN;
  placeSticker(st, 'instant');
}

/* ================================================================== gestures (port of lc0.dispatchTouchEvent + t7) */
let G = null, carry = null;

/* touch on the card: knob of the selected sticker -> scale/rotate, a sticker -> tap / hold / drag, else the card tilts */
function stickerDown(e) {
  if (VIEW_ID || e.button > 0 || G) return false;
  const l = localPt(e.clientX, e.clientY);
  const sel = selId && getSt(selId);
  if (sel) {
    for (const k of knobs(sel)) if (dist(l.x, l.y, k.x, k.y) < px(22)) {
      G = { kind: 'stk', st: sel, pid: e.pointerId, sx: e.clientX, sy: e.clientY, mode: 'rs', handle: true };
      rsInit(G); rsMove(G, l); stage.setPointerCapture(e.pointerId); return true;
    }
  }
  let hit = null;                                                              // topmost sticker under the finger
  for (const s of state.stickers) if (dist(l.x, l.y, s.x * cardW, s.y * cardH) < sizeOf(s) * HIT && (!hit || s.z > hit.z)) hit = s;
  if (!hit) { select(null); return false; }
  if (hit.id !== selId) select(null);
  G = { kind: 'stk', st: hit, pid: e.pointerId, sx: e.clientX, sy: e.clientY, mode: 'press' };
  stage.setPointerCapture(e.pointerId);
  G.timer = setTimeout(() => {                                                 // hold 450 ms: select + scale/rotate with the same finger
    if (!G || G.mode !== 'press') return;
    G.mode = 'rs'; select(hit.id); rsInit(G); buzz(10);
    const el = stickerEls.get(hit.id); if (el) el.animate([{ scale: 1 }, { scale: 1.06 }, { scale: 1 }], { duration: 260 });
  }, 450);
  return true;
}
stage.addEventListener('pointermove', gMove);
stage.addEventListener('pointerup', e => gUp(e, false));
stage.addEventListener('pointercancel', e => gUp(e, true));

function gMove(e) {
  if (!G || e.pointerId !== G.pid) return;
  if (G.mode === 'carry') { carryMove(e); return; }
  if (G.mode === 'rs') { rsMove(G, localPt(e.clientX, e.clientY)); return; }
  if (G.mode !== 'press') return;
  if (Math.hypot(e.clientX - G.sx, e.clientY - G.sy) <= SLOP) return;
  clearTimeout(G.timer); clearTimeout(G.hold);
  if (G.kind === 'stk') startCarry(e, G.st);
  else if (G.center) startCarry(e, null);                    // only from the middle of a tile, and only if it is not on the card yet
  else cancelG();
}
function cancelG() { if (!G) return; clearTimeout(G.timer); clearTimeout(G.hold); if (G.tile) G.tile.classList.remove('held'); G = null; }
function gUp(e, cancelled) {
  if (!G || e.pointerId !== G.pid) return;
  clearTimeout(G.timer); clearTimeout(G.hold);
  const g = G; G = null;
  if (g.tile) g.tile.classList.remove('held');
  if (g.mode === 'carry') { dropCarry(g, e, cancelled); return; }
  if (g.kind === 'stk') {
    if (g.mode === 'press' && !cancelled) select(g.st.id);                       // plain tap: select
    if (g.mode === 'rs') { g.st.r = wrap180(g.st.r); g.st.z = ++zSeq; placeSticker(g.st, 'instant'); save(); }
  } else if (g.mode === 'press' && !cancelled) {
    /* тап по плитке: ничего */                         // tap on a tile opens the gift in the client
  }
}

/* ---- carrying: a copy of the sticker follows the finger (it first glides there from where it was) */
function tileSize(gid) { const a = tileArt(gid); return a ? a.getBoundingClientRect().width * .66 : 60; }
function startCarry(e, st) {
  const gid = st ? st.src : G.gid;
  menu.hidden = true; hideHint();
  const c = { gid, fromCard: !!st, st, x: e.clientX, y: e.clientY, hist: [], rot: 0, size: 0, hot: false, inCard: false, ox: 0, oy: 0 };
  let cx, cy;
  if (st) {
    const el = stickerEls.get(st.id), r = el.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2; c.size = r.width; c.rot = st.r || 0;
    c.origin = { x: st.x, y: st.y, sc: st.sc, r: st.r };
    el.style.opacity = '0'; select(null);   // opacity, not visibility: duplicated svg ids would lose their clip paths
  } else {
    const a = tileArt(gid).getBoundingClientRect();
    cx = a.left + a.width / 2; cy = a.top + a.height * .46; c.size = tileSize(gid);
    G.tile.classList.add('lifted');
  }
  c.ox = cx - e.clientX; c.oy = cy - e.clientY;
  c.el = document.createElement('div'); c.el.className = 'carry'; c.el.appendChild(staticArt(gid)); document.body.appendChild(c.el);
  c.el.style.width = c.el.style.height = c.size + 'px';
  c.el.style.transform = 'translate(' + (cx - c.size / 2) + 'px,' + (cy - c.size / 2) + 'px) rotate(' + c.rot + 'deg)';
  G.mode = 'carry'; G.carry = c; carry = c;
  card.classList.add('target');
  carryMove(e);
  buzz(10);
}
function showBin(on) { bin.classList.toggle('show', on); if (!on) bin.classList.remove('hot'); }
function carryMove(e) {
  const c = carry; if (!c) return;
  c.x = e.clientX; c.y = e.clientY;
  const now = performance.now(); c.hist.push({ x: c.x, y: c.y, t: now });
  while (c.hist.length > 2 && now - c.hist[0].t > 110) c.hist.shift();
  const l = localPt(c.x, c.y);
  c.inCard = inCardL(l);
  const b = binCenter(), hot = c.fromCard && !c.inCard && dist(c.x, c.y, b.x, b.y) < 78;
  if (hot !== c.hot) buzz(6);
  c.hot = hot;
  card.classList.toggle('over', c.inCard);
  showBin(c.fromCard && !c.inCard); bin.classList.toggle('hot', hot);
  if (!c.fromCard) showHint(!c.inCard);
}
function velocityOf(c) {
  const h = c.hist; if (h.length < 2) return { x: 0, y: 0, v: 0 };
  const a = h[0], b = h[h.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
  const x = (b.x - a.x) / dt, y = (b.y - a.y) / dt; return { x, y, v: Math.hypot(x, y) };
}
function dropCarry(g, e, cancelled) {
  const c = g.carry; carry = null;
  showBin(false); hideHint(); card.classList.remove('target', 'over');
  tiles.forEach(t => t.classList.remove('lifted'));
  const gr = c.el.getBoundingClientRect(); c.el.remove();
  const here = localPt(gr.left + gr.width / 2, gr.top + gr.height / 2);             // where the sticker really is (it glides to the finger)
  const finger = localPt(c.x, c.y), inside = inCardL(finger) && !cancelled;
  const spot = { x: clamp(here.x, 0, cardW), y: clamp(here.y, 0, cardH) };
  const vel = velocityOf(c);
  if (c.fromCard) {
    const st = c.st, el = stickerEls.get(st.id);
    if (!el || !getSt(st.id)) return;
    el.style.opacity = '';
    if (cancelled) { placeSticker(st, 'ease'); return; }
    if (c.hot) { detach(st.id); flyToBin(gr, c.gid); return; }
    if (inside) {                                                                   // dropped on the card: stays exactly there, no collision checks
      st.x = spot.x / cardW; st.y = spot.y / cardH; st.z = ++zSeq;
      landFrom(st, el, gr);
      save(); patDirty = true; return;
    }
    const r = st.r; detach(st.id); flyBack(c.gid, gr, r);                          // dropped anywhere else: back to the list
    return;
  }
  const fling = !cancelled && vel.v > 700 && (inside || vel.y < -600);              // thrown at the card: automatic placement
  if (fling) {
    const hint = { x: clamp(finger.x + vel.x * .08, 0, cardW), y: clamp(finger.y + vel.y * .08, 0, cardH) };
    const pl = findPlacement(c.gid, 1, hint);
    if (pl) { addToCard(c.gid, { x: pl.x, y: pl.y }, pl.sc, 0, gr); markHintSeen(); return; }
    flyBack(c.gid, gr, 0); return;
  }
  if (inside) { addToCard(c.gid, spot, 1, 0, gr); markHintSeen(); return; }
  flyBack(c.gid, gr, 0);
}

function tickCarry(dt) {
  const c = carry; if (!c) return;
  const k = Math.pow(.9, dt * 60); c.ox *= k; c.oy *= k;
  let cx = c.x + c.ox, cy = c.y + c.oy, size, rotT = 0;
  if (c.hot) { const b = binCenter(); cx = b.x - 40; cy = b.y; size = 38; }
  else if (c.fromCard) { size = sizeOf(c.st) * clientScale(); rotT = c.origin.r || 0; }          // свой размер и поворот — как выбрано
  else if (c.inCard) { size = U() * clientScale(); }                                              // новый подарок — в размер, с которым он ляжет
  else size = tileSize(c.gid) * 1.24;
  const f = 1 - Math.pow(.0004, dt);
  c.size += (size - c.size) * f;
  c.rot += wrap180(rotT - c.rot) * f;
  c.el.style.width = c.el.style.height = c.size + 'px';
  c.el.style.transform = 'translate(' + (cx - c.size / 2) + 'px,' + (cy - c.size / 2) + 'px) rotate(' + c.rot + 'deg)';
}

/* ---- hint bubbles ("Drag this collectible on a card to decorate it" the very first time) */
const dragHint = document.getElementById('dragHint');
let hintSeen = false; try { hintSeen = !!localStorage.getItem('walletcardstickerhint'); } catch (e) { /* ignore */ }
function markHintSeen() { if (!hintSeen) { hintSeen = true; try { localStorage.setItem('walletcardstickerhint', '1'); } catch (e) { /* ignore */ } } }
function hideHint() { showHint(false); }

/* ================================================================== per frame: dragged copy, ring, overlap shadows, pattern */
const cOv = { ob: -1, on: -1, oe: -1 };
function overlapArea(a, b) {
  const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
  const bw = b.r - b.l, bh = b.b - b.t;
  if (w <= 0 || h <= 0 || bw <= 0 || bh <= 0) return 0;
  return clamp(w * h / (bw * bh) * 4, 0, 1);
}
function updateOverlaps() {
  const o = obstacles(false); let ob = 0, on = 0, oe = 0;
  const boxes = state.stickers.filter(s => !(carry && carry.st === s)).map(s => { const h = sizeOf(s) * .4; return { l: s.x * cardW - h, t: s.y * cardH - h, r: s.x * cardW + h, b: s.y * cardH + h }; });
  if (carry && carry.inCard) { const l = localPt(carry.x + carry.ox, carry.y + carry.oy), h = U() * 1.24 * .4; boxes.push({ l: l.x - h, t: l.y - h, r: l.x + h, b: l.y + h }); }
  for (const b of boxes) { ob = Math.max(ob, overlapArea(b, o[0]), overlapArea(b, o[4])); on = Math.max(on, overlapArea(b, o[1])); oe = Math.max(oe, overlapArea(b, o[2])); }
  if (Math.abs(ob - cOv.ob) > .01) { cOv.ob = ob; content.style.setProperty('--ob', ob.toFixed(2)); }
  if (Math.abs(on - cOv.on) > .01) { cOv.on = on; content.style.setProperty('--on', on.toFixed(2)); }
  if (Math.abs(oe - cOv.oe) > .01) { cOv.oe = oe; content.style.setProperty('--oe', oe.toFixed(2)); }
}

/* pattern of the colour gift: its symbol tiled over the card (grid 33 x 37 units on a 336 x 205 card, every other row shifted by 18) */
const sprites = new Map();
function sprite(gid) {
  let sp = sprites.get(gid); if (sp) return sp;
  sp = { ready: false, canvas: null }; sprites.set(gid, sp);
  const src = frameCache.get(gid), svg = src && src.querySelector('svg'); if (!svg) { sprites.delete(gid); return sp; }
  const s = svg.cloneNode(true); s.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); s.setAttribute('width', '96'); s.setAttribute('height', '96'); s.removeAttribute('style');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(s)], { type: 'image/svg+xml' }));
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, 96, 96);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = rgb2css(mix(hex2rgb(byId[gid].c0), [1, 1, 1], .55)); x.fillRect(0, 0, 96, 96);          // pattern colour = light tint of the backdrop
    sp.canvas = c; sp.ready = true; patDirty = true; URL.revokeObjectURL(url);
  };
  img.src = url;
  return sp;
}
const pctx = patCanvas.getContext('2d');
function drawPatterns() {
  const W = patCanvas.width, H = patCanvas.height;
  pctx.clearRect(0, 0, W, H);
  const layers = [];
  const f6 = W / 336, f7 = H / 205, soft = rev ? rev.soft : 1;
  const ox = rev ? rev.org.x * W : 0, oy = rev ? rev.org.y * H : 0, rad = rev ? (rev.rad || 0) : 0;
  let wait = false;
  for (const L of layers) {
    const sp = sprite(L.id); if (!sp.ready) { wait = true; continue; }
    let row = 0;
    for (let x = 16; x < 336; x += 33, row++) for (let y = (row % 2) * 18 + 16; y < 205; y += 37) {
      const X = x * f6, Y = y * f7;
      let size = 12 * f6, a = .15 * (t => t * t * (3 - 2 * t))(clamp(Math.min(x, 336 - x, y, 205 - y) / 48, 0, 1));
      if (rev) {
        const c = clamp((rad - Math.hypot(X - ox, Y - oy)) / soft, 0, 1);
        if (L.out) { size *= 1 - .2 * c; a *= 1 - clamp(c * 1.6, 0, 1); }
        else { size *= ((Math.sin(Math.PI * c) * .28 + c) * .8 + .2); a *= clamp(c * 1.6, 0, 1); }
      }
      if (a < .004 || size < .5) continue;
      pctx.globalAlpha = a; pctx.drawImage(sp.canvas, X - size / 2, Y - size / 2, size, size);
    }
  }
  pctx.globalAlpha = 1;
  patDirty = !!rev || wait;
}

function tickFX(dt, now) {
  tickCarry(dt);
  if (selId) {
    const st = getSt(selId);
    if (!st) { selId = null; ring.hidden = true; }
    else { const R = ringR(st); ring.style.width = ring.style.height = 2 * R + 'px'; ring.style.transform = 'translate(' + (st.x * cardW - R) + 'px,' + (st.y * cardH - R) + 'px) rotate(' + (st.r || 0) + 'deg)'; }
  }
  if (patDirty || rev) drawPatterns();
}

/* ================================================================== gifts grid */
const tiles = new Map();
const ICONS = {
  sticker: '<svg viewBox="0 0 24 24"><path d="M5 4h14a1 1 0 0 1 1 1v9l-6 6H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 14h-5a1 1 0 0 0-1 1v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  remove: '<svg viewBox="0 0 24 24"><path d="M5 4h14a1 1 0 0 1 1 1v9l-6 6H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M8 11h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  colors: '<svg viewBox="0 0 24 24"><path d="M12 3C7 3 3 7 3 12s4 9 9 9c1.4 0 2-.8 2-1.7 0-.9-.6-1.4-.6-2.3 0-1 .8-1.7 1.8-1.7H17c2.2 0 4-1.5 4-3.8C21 6.5 17 3 12 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="11" r="1.3" fill="currentColor"/><circle cx="11.5" cy="7.5" r="1.3" fill="currentColor"/><circle cx="16" cy="8.5" r="1.3" fill="currentColor"/></svg>',
  nocolors: '<svg viewBox="0 0 24 24"><path d="M12 3C7 3 3 7 3 12s4 9 9 9c1.4 0 2-.8 2-1.7 0-.9-.6-1.4-.6-2.3 0-1 .8-1.7 1.8-1.7H17c2.2 0 4-1.5 4-3.8C21 6.5 17 3 12 3z M4 20 20 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
};

/* tile: tap = gift page, hold 500 ms = menu, drag from the middle (quickly, or after 170 ms) = take it to the card */
function bindTile(t, g) {
  t.addEventListener('contextmenu', e => { e.preventDefault(); openMenu(g.id, t); });
  t.addEventListener('pointerdown', e => {
    if (e.button > 0 || G) return;
    G = { kind: 'tile', gid: g.id, tile: t, pid: e.pointerId, sx: e.clientX, sy: e.clientY, mode: 'press', center: !!e.target.closest('.zone') };
    t.setPointerCapture(e.pointerId);
    const mine = G;
    G.hold = setTimeout(() => { if (G === mine && G.mode === 'press') { t.classList.add('held'); buzz(4); } }, 170);
    G.timer = setTimeout(() => { if (G === mine && G.mode === 'press') { G.mode = 'menu'; t.classList.remove('held'); openMenu(g.id, t); buzz(12); } }, 500);
  });
  t.addEventListener('pointermove', gMove);
  t.addEventListener('pointerup', e => gUp(e, false));
  t.addEventListener('pointercancel', e => gUp(e, true));
}

/* ---- popup menu (the client offers exactly these two actions) */
document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('.menu')) menu.hidden = true; }, true);

let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200); }

/* ================================================================== NFT Match: данные, API, список подарков */
/* Всё ниже — слой сайта: стикер = подарок «коллекция|модель», картинка — PNG модели с cdn.changes.tg,
   карточка хранится на бэкенде (Card/Get, Card/Save), список подарков — по коллекциям (Card/Collections)
   и общий поиск (Card/SearchModels). */
const P = window.parent !== window ? window.parent : window;
const CFG = P.CONFIG || window.CONFIG || {};
const ADMIN_UI = (() => { try { const u = P.NFTAuth && P.NFTAuth.getUser(); return !VIEW_ID && !!u && Number(u.telegramId || u.id) === 7343414766; } catch (e) { return false; } })();

/* ================================================================== Локализация RU / EN */
/* Язык берём у сайта (переключатель RU/EN в шапке пишет его в localStorage 'user_lang'). Тексты написаны по-русски; в английском
   режиме их переводит словарь ниже — и в готовой разметке, и во всём, что рисуется позже (статусы, списки, меню, окна). */
const LANG = (() => { try { return (P.NFTi18n && P.NFTi18n.getLanguage()) || localStorage.getItem('user_lang') || 'ru'; } catch (e) { return 'ru'; } })();
const EN_UI = {
  'Профиль': 'Profile', 'Коллекции': 'Collections', 'Модели': 'Models', 'Тематики': 'Themes',
  'Найти подарок профиля…': 'Search profile gifts…', 'Найти коллекцию…': 'Search collections…',
  'Найти модель или коллекцию…': 'Search a model or collection…', 'Найти тематику…': 'Search themes…',
  '← Назад': '← Back', 'Показать ещё': 'Show more', 'Поделиться': 'Share', '⛶ На весь экран': '⛶ Fullscreen', 'Очистить': 'Clear',
  'Выбранные': 'Selected', 'Убрать': 'Remove', 'Перетащите подарок сюда': 'Drag the gift here',
  'Перетащите подарок на карточку, чтобы украсить её': 'Drag a gift onto the card to decorate it',
  'Выйти из полноэкранного режима': 'Exit fullscreen',
  'Загружаю коллекции…': 'Loading collections…', 'Загружаю тематики…': 'Loading themes…', 'Загружаю подарки профиля…': 'Loading profile gifts…',
  'Ищу…': 'Searching…', 'Ничего не найдено': 'Nothing found', 'Не удалось загрузить данные': 'Failed to load data',
  'Войдите через Telegram, чтобы пользоваться конструктором': 'Sign in with Telegram to use the builder',
  'В профиле нет уникальных подарков': 'There are no unique gifts in your profile',
  'Нажмите на подарки ниже, чтобы добавить их сюда. Отсюда их можно перетащить на карточку.': 'Tap the gifts below to add them here. From here you can drag them onto the card.',
  'На карточке': 'On card', 'Добавить на карточку': 'Add to card', 'Убрать с карточки': 'Remove from card', 'Убрать из выбранных': 'Remove from selected',
  'Нет свободного места на карточке': 'No free space on the card',
  'Эта модель на карточке — сначала уберите её оттуда': 'This model is on the card — remove it from there first',
  'Сохраняю…': 'Saving…', 'Сохранено ✓': 'Saved ✓', 'Не удалось загрузить карточку — обновите страницу': 'Failed to load the card — refresh the page',
  'Карточка не найдена': 'Card not found', 'Настроить свою': 'Customize yours', 'Убрать все стикеры с карточки?': 'Remove all stickers from the card?',
  'Поделиться карточкой': 'Share card', 'Готовлю ссылку…': 'Preparing the link…', 'Копировать ссылку': 'Copy link',
  'Скинуть в чат с ботом': 'Send to the bot chat', 'Ссылка скопирована.': 'Link copied.',
  'Выделите ссылку и скопируйте её вручную.': 'Select the link and copy it manually.', 'Готовлю картинку…': 'Preparing the image…',
  'Закрыть': 'Close', 'Фон карточки': 'Card background', 'По умолчанию': 'Default', 'Найти фон…': 'Search backgrounds…',
  'Фон от подарка': 'Background from gift', 'Не удалось загрузить фоны': 'Failed to load backgrounds', 'Загружаю…': 'Loading…',
  'Скачать': 'Download', 'Опубликовать': 'Publish', 'Опубликовано': 'Published', 'Лайки:': 'Likes:', 'Карточка опубликована': 'Card published',
  'Снять с публикации': 'Unpublish', 'Подпишитесь на канал': 'Subscribe to the channel',
  'Чтобы показывать свою карточку другим, подпишитесь на наш канал.': 'To show your card to others, subscribe to our channel.',
  'Открыть канал': 'Open channel', 'Я подписался': 'I subscribed', 'Проверяю…': 'Checking…', 'Скоро': 'Coming soon', 'Новая карточка': 'New card',
  'Карточка': 'Card', 'Не удалось опубликовать': 'Failed to publish', 'Карточка снята с публикации': 'Card unpublished',
  'Не удалось снять с публикации': 'Failed to unpublish', 'Не удалось подготовить картинку': 'Failed to prepare the image',
  'Очистить карточку': 'Clear the card', 'Слишком много лайков, попробуйте позже': 'Too many likes, try again later',
  'Сделать свою карточку': 'Make your own card', 'Не удалось сохранить карточку — попробуйте ещё раз': 'Could not save the card — try again',
  'Публикация карточки': 'Publish the card',
  'Поделитесь карточкой с друзьями, чтобы набрать лайки!': 'Share your card with friends to collect likes!',
  'Самые популярные работы попадут в ленту лучших в боте.': 'The most popular cards will make it to the best-works feed in the bot.',
  'Снять карточку с публикации можно в любой момент.': 'You can unpublish the card at any time.',
  'Проверяю подписку на канал…': 'Checking the channel subscription…', '✓ Вы подписаны на канал': '✓ You are subscribed to the channel',
  'Для публикации нужно подписаться на наш канал': 'To publish, you need to subscribe to our channel', 'Не удалось проверить подписку': 'Could not check the subscription',
  'Проверить ещё раз': 'Check again', 'Я подписался — проверить': 'I subscribed — check', 'Проверить подписку': 'Check subscription', 'Публикую…': 'Publishing…',
  'Откройте карточку в Telegram, чтобы поставить лайк': 'Open the card in Telegram to like it',
  'Нравится': 'Like', 'Закрытая карточка': 'Locked card', 'Открыть за 50 ★': 'Unlock for 50 ★',
  'Закрытая карточка откроется за 50 звёзд. Оплата скоро появится — пока можно оформлять первую и вторую карточки.': 'The locked card unlocks for 50 stars. Payment is coming soon — for now you can design the first and the second card.'
};
const EN_PAT = [
  [/^(\d+) мод\.$/, '$1 models'],
  [/^На карточке ×(\d+)$/, 'On card ×$1'],
  [/^В выбранных может быть не больше (\d+) моделей$/, 'No more than $1 models can be selected'],
  [/^Не удалось сохранить(.*)$/, 'Failed to save$1'],
  [/^Не удалось получить ссылку(.*)$/, 'Could not get the link$1'],
  [/^Подарки профиля не получены(.*)\. Запустите бота @(\S+) и откройте подарки в профиле\.$/, 'Profile gifts were not received$1. Start the bot @$2 and make sure your gifts are visible in your profile.'],
  [/^Готово! Карточка с ссылкой отправлена в чат с @(\S+) — перешлите её оттуда\.$/, 'Done! The card with the link was sent to your chat with @$1 — forward it from there.'],
  [/^Не получилось отправить(.*)\. Откройте чат с @(\S+) и нажмите \/start\.$/, 'Could not send$1. Open the chat with @$2 and press /start.']
];
function T(ru) {
  if (LANG !== 'en' || !ru) return ru;
  const m = String(ru).match(/^(\s*)([\s\S]*?)(\s*)$/), body = m[2].replace(/\s+/g, ' ');
  if (!body) return ru;
  if (EN_UI[body] !== undefined) return m[1] + EN_UI[body] + m[3];
  for (const [re, to] of EN_PAT) if (re.test(body)) return m[1] + body.replace(re, to) + m[3];
  return ru;
}
function trTree(root) {
  if (LANG !== 'en' || !root) return;
  try {
    const doc = root.ownerDocument || document;
    const w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => /[А-Яа-яЁё]/.test(n.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(x => { const o = T(x.nodeValue); if (o !== x.nodeValue) x.nodeValue = o; });
    const els = (root.nodeType === 1 ? [root] : []).concat(Array.from(root.querySelectorAll ? root.querySelectorAll('*') : []));
    els.forEach(el => ['placeholder', 'title', 'alt', 'aria-label'].forEach(a => {
      const v = el.getAttribute && el.getAttribute(a);
      if (v && /[А-Яа-яЁё]/.test(v)) { const o = T(v); if (o !== v) el.setAttribute(a, o); }
    }));
  } catch (e) { /* перевод не должен ломать страницу */ }
}
if (LANG === 'en') {
  document.documentElement.lang = 'en';
  trTree(document.body);
  let trQueued = false;
  new MutationObserver(() => { if (trQueued) return; trQueued = true; setTimeout(() => { trQueued = false; trTree(document.body); }, 30); })
    .observe(document.body, { childList: true, subtree: true });
}

const api = p => (CFG.SERVER_BASE_URL || '') + '/api/' + p;
function authHeader() { try { if (P.NFTAuth) return P.NFTAuth.getApiAuthHeader(); } catch (e) { /* ignore */ } return 'Tma invalid'; }
const imgUrl = (g, m) => 'https://cdn.changes.tg/gifts/models/' + encodeURIComponent(g) + '/png/' + encodeURIComponent(m) + '.png';
const sid = (g, m, uid) => g + '|' + m + (uid ? '|' + uid : '');
const splitId = id => id.split('|');
async function apiGet(path) {
  const r = await fetch(api(path), { headers: { 'Authorization': authHeader() } });
  if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
  return r.json();
}

/* подарки профиля: фото экземпляра с Fragment (фон + модель целиком); если не загрузилось — цвета фона + модель */
const profileMeta = new Map();                 // uid -> { center, edge }
const fragUrl = uid => 'https://nft.fragment.com/gift/' + encodeURIComponent(uid.toLowerCase()) + '.medium.jpg';
function photoArt(g, m, uid) {
  const wrap = document.createElement('div'); wrap.className = 'lot photo';
  const img = new Image(); img.decoding = 'async'; img.draggable = false; img.alt = m;
  img.onerror = () => {
    img.onerror = null; wrap.classList.add('fallback');
    const meta = profileMeta.get(uid);
    if (meta) wrap.style.background = 'radial-gradient(circle at 50% 46%, ' + meta.center + ', ' + meta.edge + ' 85%)';
    img.src = imgUrl(g, m);
  };
  img.src = fragUrl(uid);
  wrap.appendChild(img);
  return wrap;
}

/* картинка в списке: подарок профиля — фото с фоном, остальное — модель */
const listArt = item => item.uid ? photoArt(item.gift, item.model, item.uid) : staticArt(item.id);
let instSeq = 0;
const newInstId = src => src + '#' + (++instSeq);
const countOn = src => state.stickers.filter(s => s.src === src).length;

/* картинка стикера: PNG модели (вместо Lottie из примера) */
const bakedUrls = new Map(), baking = new Map(), bakeQueue = [];
let bakeActive = 0;
/* Модель с CDN весит ~370 КБ и декодируется целиком при каждом показе. Для карточки (стикеры, «выбранные», перелёты) один раз
   рисуем её в 384 px и дальше используем лёгкую копию — это заметно разгружает наклон карточки с несколькими стикерами. */
function bake(g, m) {
  const key = g + '|' + m;
  if (baking.has(key)) return baking.get(key);
  const p = new Promise(res => {
    bakeQueue.push(() => {
      const i = new Image(); i.crossOrigin = 'anonymous';
      const done = u => { bakeActive--; pumpBake(); res(u); };
      i.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = c.height = 384;
          c.getContext('2d').drawImage(i, 0, 0, 384, 384);
          c.toBlob(b => { if (!b) return done(null); const u = URL.createObjectURL(b); bakedUrls.set(key, u); done(u); }, 'image/webp', .9);
        } catch (e) { done(null); }
      };
      i.onerror = () => done(null);
      i.src = imgUrl(g, m);
    });
    pumpBake();
  });
  baking.set(key, p);
  return p;
}
function pumpBake() { while (bakeActive < 2 && bakeQueue.length) { bakeActive++; bakeQueue.shift()(); } }
function modelImg(g, m, bakeIt, lazy) {
  const img = new Image(); img.decoding = 'async'; img.draggable = false; img.alt = m;
  if (lazy) img.loading = 'lazy';
  const key = g + '|' + m, u = bakedUrls.get(key);
  img.src = u || imgUrl(g, m);
  if (bakeIt && !u) bake(g, m).then(url => { if (url) img.src = url; });
  return img;
}
function staticArt(gid, noBake) {
  const [g, m] = splitId(gid);
  const wrap = document.createElement('div'); wrap.className = 'lot';
  wrap.appendChild(modelImg(g, m, !noBake, !!noBake));
  return wrap;
}

/* ---- сохранение на бэкенде (после каждого изменения, с задержкой) */
/* Статус сохранения на странице убран. Сбой показываем только коротким сообщением и не чаще раза в 6 секунд. */
let lastErrToast = 0;
function setStatus(text, err) {
  if (!err || Date.now() - lastErrToast < 6000) return;
  lastErrToast = Date.now(); toast(T(text));
}
let loaded = false, dirty = false, saving = false, saveTimer = null, saveFails = 0;
let kind = 'catalog';                       // карточка одна (на сервере она хранится как kind=catalog)
let tray = [];                                  // выбранные: { id, gift, model, uid?, sub? }
function save() {
  if (!loaded) return;
  dirty = true; setStatus('Сохраняю…');
  clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 600);
}
async function flushSave(keepalive) {
  if (!loaded || !dirty) return;
  if (saving) { saveTimer = setTimeout(flushSave, 300); return; }
  saving = true; dirty = false;
  const payload = {
    stickers: state.stickers.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).map(s => {
      const [gift, model, uid] = splitId(s.src);
      return { gift, model, uid: uid || null, x: +s.x.toFixed(4), y: +s.y.toFixed(4), r: +wrap180(s.r || 0).toFixed(1), sc: +s.sc.toFixed(3) };
    })
  };
  payload.tray = tray.map(t => ({ gift: t.gift, model: t.model, uid: t.uid || null }));
  payload.holder = document.getElementById('holder').textContent;
  payload.bg = currentBg;
  try {
    const r = await fetch(api('Card/Save?kind=' + kind), { method: 'POST', keepalive: keepalive === true, headers: { 'Authorization': authHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) { const e = new Error(r.status); e.text = await r.text().catch(() => ''); throw e; }
    saveFails = 0;
    if (!dirty) scheduleImageUpload();
  } catch (e) {
    dirty = true;
    const why = e.message && /^\d+$/.test(e.message) ? ' (' + e.message + (e.text ? ': ' + e.text.slice(0, 120) : '') + ')' : '';
    setStatus('Не удалось сохранить' + why, true);
    // сбой сети, 5xx и лимит запросов (429) повторяем с нарастающей паузой; прочие отказы (4xx) повторять бесполезно — следующее изменение попробует снова
    const code = +e.message;
    if (!(code >= 400 && code < 500) || code === 429) { saveFails++; clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, Math.min(15000, 2000 * saveFails)); }
  } finally { saving = false; }
}
function flush() { if (dirty && loaded) { clearTimeout(saveTimer); flushSave(true); } }
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
try { P.addEventListener('pagehide', flush); } catch (e) { /* ignore */ }

/* ---- корзина и подсказка (в примере привязаны к рамке приложения, здесь — к карточке) */
function binCenter() {
  const sr = stage.getBoundingClientRect();
  return { x: sr.left + bin.offsetLeft + bin.offsetWidth / 2, y: sr.top + bin.offsetTop + bin.offsetHeight / 2 };
}
function showHint(on) {
  if (!dragHint) return;
  dragHint.textContent = hintSeen ? 'Перетащите подарок сюда' : 'Перетащите подарок на карточку, чтобы украсить её';
  const ar = app.getBoundingClientRect(), cr = card.getBoundingClientRect();
  dragHint.style.top = Math.max(8, cr.top - ar.top - 46) + 'px';
  dragHint.style.left = (cr.left - ar.left + cr.width / 2) + 'px';
  dragHint.classList.toggle('show', !!on);
}

/* ---- плитки подарков */
const ICON_ADD = ICONS.sticker, ICON_REMOVE = ICONS.remove;
const gridEl = document.getElementById('grid'), noteEl = document.getElementById('note');
const catTiles = new Map();
const trayEl = document.getElementById('tray'), trayNote = document.getElementById('trayNote');
/* плитка каталога: тап добавляет модель в «выбранные», перетаскивать её на карточку нельзя */
function addModelTile(gift, model) {
  const id = sid(gift, model);
  const t = document.createElement('div');
  t.className = 'tile pick'; t.dataset.id = id; t.title = model + ' — ' + gift;
  t.innerHTML = '<div class="art"></div><b></b><small></small>';
  t.firstChild.appendChild(staticArt(id, true));
  t.children[1].textContent = model; t.children[2].textContent = gift;
  t.onclick = () => toggleTray(gift, model);
  gridEl.appendChild(t); catTiles.set(id, t);
}
/* плитка из «выбранных»: та же, что в списке подарков примера (зажать — меню, потянуть — на карточку) */
function addTrayTile(item) {
  const t = document.createElement('div');
  t.className = 'tile' + (item.uid ? ' photo' : ''); t.dataset.id = item.id; t.title = item.model + ' — ' + item.gift;
  t.innerHTML = '<div class="art"></div><b></b><small></small>';
  t.firstChild.appendChild(listArt(item));
  const zone = document.createElement('div'); zone.className = 'zone'; t.firstChild.appendChild(zone);
  t.children[1].textContent = item.model; t.children[2].textContent = item.sub || item.gift;
  trayEl.appendChild(t); tiles.set(item.id, t);
  bindTile(t, { id: item.id });
}
function renderTray() {
  trayEl.innerHTML = ''; tiles.clear();
  tray.forEach(addTrayTile);
  refreshTiles();
}
const TRAY_MAX = 60;
function toggleTray(gift, model, uid, sub) {
  const id = sid(gift, model, uid), i = tray.findIndex(t => t.id === id);
  if (i >= 0) {
    if (countOn(id)) { toast('Эта модель на карточке — сначала уберите её оттуда'); return; }
    tray.splice(i, 1);
  } else {
    if (tray.length >= TRAY_MAX) { toast('В выбранных может быть не больше ' + TRAY_MAX + ' моделей'); return; }
    tray.push({ id, gift, model, uid: uid || undefined, sub });
    bake(gift, model);
  }
  renderTray(); save();
}
function refreshTiles() {
  tiles.forEach((t, id) => {
    const art = t.firstChild;
    art.querySelectorAll('.onc').forEach(n => n.remove());
    const n = countOn(id);
    if (n) { const o = document.createElement('span'); o.className = 'onc'; o.textContent = n > 1 ? 'На карточке ×' + n : 'На карточке'; art.appendChild(o); }
  });
  catTiles.forEach((t, id) => t.classList.toggle('picked', tray.some(x => x.id === id)));
  document.getElementById('trayCount').textContent = state.stickers.length + '/' + MAX_STICKERS;
  trayNote.textContent = tray.length ? '' : 'Нажмите на подарки ниже, чтобы добавить их сюда. Отсюда их можно перетащить на карточку.';
}

/* ---- меню по долгому нажатию: единственное действие — добавить / убрать */
function openMenu(id, tile) {
  const onCard = countOn(id) > 0;
  menu.innerHTML = '<button data-a="sticker">' + ICON_ADD + '<span>Добавить на карточку</span></button>' +
    (onCard ? '<button data-a="unstick">' + ICON_REMOVE + '<span>Убрать с карточки</span></button>' : '') +
    (giftBackdrop(id) ? '<button data-a="bgfrom">' + ICON_BG + '<span>Фон от подарка</span></button>' : '') +
    (kind === 'catalog' ? '<hr><button data-a="untray">' + ICON_REMOVE + '<span>Убрать из выбранных</span></button>' : '');
  menu.hidden = false;
  const a = app.getBoundingClientRect(), r = tile.getBoundingClientRect();
  let x = r.left - a.left + r.width * .5 - 20, y = r.top - a.top + r.height * .55;
  x = clamp(x, 10, a.width - 230); y = clamp(y, 10, Math.max(10, a.height - 100));
  menu.style.left = x + 'px'; menu.style.top = y + 'px';
  menu.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    menu.hidden = true;
    if (b.dataset.a === 'bgfrom') {
      const bd = giftBackdrop(id); if (bd) applyBg(bd, true);
    } else if (b.dataset.a === 'untray') {
      state.stickers.filter(s => s.src === id).forEach(s => detach(s.id));
      tray = tray.filter(t => t.id !== id); renderTray(); save();
    } else if (b.dataset.a === 'unstick') {
      const last = state.stickers.filter(s => s.src === id).sort((a, b) => (b.t || 0) - (a.t || 0))[0]; if (last) evict(last);
    } else autoAdd(id);
  };
}
document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('.menu')) menu.hidden = true; }, true);

/* ---- каталог с фильтрами: коллекции / модели / тематики (+ поиск внутри выбранного фильтра) */
const qEl = document.getElementById('q'), crumbs = document.getElementById('crumbs'), moreBtn = document.getElementById('btnMore');
const filtersEl = document.getElementById('filters');
const PAGE = 36;
const PLACEHOLDERS = { profile: 'Найти подарок профиля…', collections: 'Найти коллекцию…', models: 'Найти модель или коллекцию…', themes: 'Найти тематику…' };
let tab = 'profile', sel = null, collections = null, ver = 0, offset = 0;   // sel = { type: 'gift' | 'theme', key, title }

function clearGrid() { gridEl.innerHTML = ''; catTiles.clear(); }
const words = s => s.toLowerCase().split(/\s+/).filter(Boolean);
const errText = e => e.status === 403 ? 'Войдите через Telegram, чтобы пользоваться конструктором' : 'Не удалось загрузить данные';

function setTab(t) {
  tab = t; sel = null; qEl.value = ''; qEl.placeholder = T(PLACEHOLDERS[t]);
  filtersEl.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  refresh();
}
function refresh() {
  ver++; offset = 0; clearGrid(); moreBtn.hidden = true; noteEl.textContent = '';
  crumbs.hidden = !sel;
  document.getElementById('crumbTitle').textContent = sel ? sel.title : '';
  const q = qEl.value.trim();
  if (tab === 'profile' && !sel) fetchProfile(q);
  else if (sel || tab === 'models') fetchModels(q);
  else if (tab === 'collections') renderCollections(q);
  else fetchThemes(q);
}
function tileFor(imgGift, imgModel, name, sub, onClick) {
  const d = document.createElement('div'); d.className = 'ctile';
  d.innerHTML = '<div class="art"></div><b></b><small></small>';
  if (imgGift && imgModel) { const img = new Image(); img.alt = name; img.loading = 'lazy'; img.src = imgUrl(imgGift, imgModel); d.firstChild.appendChild(img); }
  d.children[1].textContent = name; d.children[2].textContent = sub;
  d.onclick = onClick; gridEl.appendChild(d);
}
async function renderCollections(q) {
  gridEl.classList.add('collections');
  const my = ver; noteEl.textContent = 'Загружаю коллекции…';
  try {
    if (!collections) collections = await apiGet('Card/Collections');
    if (my !== ver) return;
    const w = words(q);
    const list = collections.filter(c => w.every(x => c.name.toLowerCase().includes(x)));
    list.forEach(c => tileFor(c.name, c.sample, c.name, c.count + ' мод.', () => { sel = { type: 'gift', key: c.name, title: c.name }; qEl.value = ''; refresh(); }));
    noteEl.textContent = list.length ? '' : 'Ничего не найдено';
  } catch (e) { if (my === ver) noteEl.textContent = errText(e); }
}
async function fetchThemes(q) {
  gridEl.classList.add('collections');
  const my = ver; noteEl.textContent = 'Загружаю тематики…'; moreBtn.hidden = true;
  try {
    const items = await apiGet('Card/Themes?q=' + encodeURIComponent(q) + '&limit=' + PAGE + '&offset=' + offset);
    if (my !== ver) return;
    items.forEach(t => tileFor(t.sampleGift, t.sampleModel, t.name, t.count + ' мод.', () => { sel = { type: 'theme', key: t.id, title: t.name }; qEl.value = ''; refresh(); }));
    offset += items.length; moreBtn.hidden = items.length < PAGE;
    noteEl.textContent = gridEl.children.length ? '' : 'Ничего не найдено';
  } catch (e) { if (my === ver) noteEl.textContent = errText(e); }
}
async function fetchModels(q) {
  gridEl.classList.remove('collections');
  const my = ver; noteEl.textContent = 'Ищу…'; moreBtn.hidden = true;
  let url = 'Card/SearchModels?q=' + encodeURIComponent(q) + '&limit=' + PAGE + '&offset=' + offset;
  if (sel) url += (sel.type === 'gift' ? '&gift=' : '&theme=') + encodeURIComponent(sel.key);
  try {
    const items = await apiGet(url);
    if (my !== ver) return;
    items.forEach(it => addModelTile(it.giftName, it.modelName));
    offset += items.length; moreBtn.hidden = items.length < PAGE;
    noteEl.textContent = gridEl.children.length ? '' : 'Ничего не найдено';
    refreshTiles();
  } catch (e) { if (my === ver) noteEl.textContent = errText(e); }
}
/* подарки из профиля (Bot API getUserGifts): в списке — фото подарка с фоном; на карточку из «выбранных» ставится модель */
let profileInfo = null;
async function loadProfileInfo() {
  if (profileInfo) return profileInfo;
  try {
    const info = await apiGet('Card/ProfileGifts');
    (info.gifts || []).forEach(g => profileMeta.set(g.uid, { center: g.center, edge: g.edge, name: g.backdrop }));
    if (info.available || (info.gifts || []).length) profileInfo = info; else return info;   // неудачу не запоминаем — можно повторить
    return info;
  } catch (e) { return { available: false, error: 'HTTP ' + (e.status || '?'), gifts: [] }; }
}
function addProfileTile(g) {
  const id = sid(g.gift, g.model, g.uid), sub = '#' + g.number;
  const t = document.createElement('div');
  t.className = 'tile pick photo'; t.dataset.id = id; t.title = g.model + ' — ' + g.gift + ' ' + sub;
  t.innerHTML = '<div class="art"></div><b></b><small></small>';
  t.firstChild.appendChild(photoArt(g.gift, g.model, g.uid));
  t.children[1].textContent = g.model; t.children[2].textContent = sub + ' · ' + g.backdrop;
  t.onclick = () => toggleTray(g.gift, g.model, g.uid, sub);
  gridEl.appendChild(t); catTiles.set(id, t);
}
async function fetchProfile(q) {
  gridEl.classList.remove('collections');
  const my = ver; noteEl.textContent = 'Загружаю подарки профиля…'; moreBtn.hidden = true;
  const info = await loadProfileInfo();
  if (my !== ver) return;
  if (!info.available) {
    noteEl.textContent = 'Подарки профиля не получены' + (info.error ? ' (' + info.error + ')' : '') + '. Запустите бота @NFTMatchBot и откройте подарки в профиле.';
    return;
  }
  const w = words(q);
  const list = (info.gifts || []).filter(g => w.every(x => (g.model + ' ' + g.gift + ' ' + g.backdrop + ' ' + g.number).toLowerCase().includes(x)));
  list.forEach(addProfileTile);
  noteEl.textContent = list.length ? '' : (info.gifts && info.gifts.length ? 'Ничего не найдено' : 'В профиле нет уникальных подарков');
  refreshTiles();
}
let searchT;
qEl.addEventListener('input', () => { clearTimeout(searchT); searchT = setTimeout(refresh, 250); });
moreBtn.onclick = () => { const q = qEl.value.trim(); if (sel || tab === 'models') fetchModels(q); else if (tab === 'themes') fetchThemes(q); };
filtersEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });
document.getElementById('btnBack').onclick = () => { sel = null; qEl.value = ''; refresh(); };
document.getElementById('btnClear').onclick = () => {
  if (state.stickers.length && confirm(T('Убрать все стикеры с карточки?'))) state.stickers.slice().forEach(s => detach(s.id));
};

/* ================================================================== init */
const user = (() => { try { return P.NFTAuth && P.NFTAuth.getUser(); } catch (e) { return null; } })();
/* на карточке — имя человека (имя + фамилия); если длиннее 18 знаков, сокращаем: фамилию до инициала, а затем обрезаем с «…» */
function holderName(u) {
  if (!u) return '';
  const first = (u.firstName || '').trim(), last = (u.lastName || '').trim();
  let n = (first + ' ' + last).trim();
  if (!n) return u.username ? '@' + u.username : '';
  if (n.length > 18 && last) n = first + ' ' + last[0] + '.';
  if (n.length > 18) n = n.slice(0, 17).trim() + '…';
  return n;
}
const nameOnCard = holderName(user);
if (nameOnCard) document.getElementById('holder').textContent = nameOnCard.toUpperCase();

applyTheme(false);
resize();
requestAnimationFrame(frame);
/* ================================================================== Фон карточки */
/* Фон — два цвета градиента карточки (как «Apply colour» в примере: цвет растекается кругом от стикера). Выбрать можно из всех
   фонов подарков (окно по нажатию на блок «Фон карточки») или взять у подарка из профиля (зажать плитку в «Выбранных»). */
const ICON_BG = ICONS.colors;
let currentBg = null;                                   // { name, c0, c1 } или null — по умолчанию
const bgKey = bg => bg ? 'bg:' + bg.c0 + bg.c1 : null;
const rgbToHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
/* из одного цвета фона (как он лежит в базе) делаем градиент: светлее в центре, темнее к краю */
function bgFromColor(name, color) {
  const base = hex2rgb(color);
  return { name, c0: rgbToHex(mix(base, [1, 1, 1], .12)), c1: rgbToHex(mix(base, [0, 0, 0], .22)) };
}
function giftBackdrop(id) {
  const uid = splitId(id)[2], m = uid && profileMeta.get(uid);
  if (!m || !m.center || !m.edge || (m.center === '#000000' && m.edge === '#000000')) return null;
  return { name: m.name || 'Gift', c0: m.center, c1: m.edge };
}
function updateBgRow() {
  const sw = document.getElementById('bgSw'), nm = document.getElementById('bgName');
  const c0 = currentBg ? currentBg.c0 : DEFAULT_COLORS.c0, c1 = currentBg ? currentBg.c1 : DEFAULT_COLORS.c1;
  sw.style.background = 'linear-gradient(135deg, ' + c0 + ', ' + c1 + ')';
  nm.textContent = currentBg ? currentBg.name : T('По умолчанию');
}
function applyBg(bg, animate) {
  currentBg = bg;
  const key = bgKey(bg);
  if (bg) byId[key] = { c0: bg.c0, c1: bg.c1 };
  if (animate) setColour(key);                           // растекание цвета и сохранение — из примера
  else { state.colorId = key; applyTheme(false); }
  updateBgRow();
}

async function openBgModal() {
  const D = P.document;
  if (!D.getElementById('cdBgCss')) {
    const st = D.createElement('style'); st.id = 'cdBgCss';
    st.textContent = '#cdBg{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,12,24,.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);font-family:Inter,Roboto,sans-serif}' +
      '#cdBg .p{width:min(94vw,560px);max-height:88vh;display:flex;flex-direction:column;background:#16213a;border-radius:20px;padding:18px;color:#f1f5fa;box-shadow:0 20px 70px rgba(0,0,0,.6)}' +
      '#cdBg .h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-weight:800;font-size:16px}' +
      '#cdBg .x{width:36px;height:36px;border-radius:18px;background:#1e2944;color:#fff;border:0;font-size:18px;cursor:pointer}' +
      '#cdBg input{width:100%;box-sizing:border-box;background:#1e2944;color:#f1f5fa;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;font:500 14px Inter,sans-serif;outline:none;margin-bottom:12px}' +
      '#cdBg .g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;overflow-y:auto;padding:2px 2px 8px;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 8px,#000 calc(100% - 24px),transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 8px,#000 calc(100% - 24px),transparent 100%)}' +
      '#cdBg .it{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 4px;border:2px solid transparent;border-radius:14px;background:#1e2944;color:#dbe4fa;font:600 12px Inter,sans-serif;cursor:pointer;text-align:center}' +
      '#cdBg .it.on{border-color:#3a8bff}#cdBg .it:hover{background:#263355}' +
      '#cdBg .sw{width:100%;aspect-ratio:1.6;border-radius:10px}#cdBg .n{color:#8fa0c4;padding:12px;text-align:center;font-size:13px}';
    D.head.appendChild(st);
  }
  const old = D.getElementById('cdBg'); if (old) old.remove();
  const o = D.createElement('div'); o.id = 'cdBg';
  o.innerHTML = '<div class="p"><div class="h"><span>Фон карточки</span><button class="x" aria-label="Закрыть">✕</button></div>' +
    '<input type="search" placeholder="Найти фон…" autocomplete="off" spellcheck="false"><div class="g"></div></div>';
  D.body.appendChild(o); trTree(o);
  const close = () => o.remove();
  o.querySelector('.x').onclick = close;
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const grid = o.querySelector('.g'), inp = o.querySelector('input');
  const item = (name, c0, c1, on, click) => {
    const b = D.createElement('button'); b.type = 'button'; b.className = 'it' + (on ? ' on' : '');
    b.innerHTML = '<span class="sw"></span><span></span>';
    b.firstChild.style.background = 'linear-gradient(135deg,' + c0 + ',' + c1 + ')'; b.lastChild.textContent = name;
    b.onclick = () => { click(); close(); }; grid.appendChild(b);
  };
  const render = q => {
    grid.innerHTML = '';
    const w = words(q);
    if (!w.length) item(T('По умолчанию'), DEFAULT_COLORS.c0, DEFAULT_COLORS.c1, !currentBg, () => applyBg(null, true));
    (window.CARD_BGS || []).filter(b => w.every(x => b.name.toLowerCase().includes(x))).forEach(b => {
      item(b.name, b.c0, b.c1, currentBg && currentBg.name === b.name, () => applyBg({ name: b.name, c0: b.c0, c1: b.c1 }, true));
    });
    if (!grid.children.length) { const n = D.createElement('div'); n.className = 'n'; n.textContent = T('Ничего не найдено'); grid.appendChild(n); }
  };
  inp.addEventListener('input', () => render(inp.value.trim()));
  render('');
}
document.getElementById('bgRow').onclick = openBgModal;
document.getElementById('bgRow').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBgModal(); } });
updateBgRow();

/* ---- загрузка единственной карточки с сервера */
/* Запрос с повтором: при обрыве сети и ответах 5xx (сервер перезапускается) пробуем ещё до двух раз. */
async function apiGetRetry(path, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await apiGet(path); }
    catch (e) { last = e; if (e.status && e.status < 500) throw e; await sleep(700 * (i + 1)); }
  }
  throw last;
}
async function loadCard(prefetched) {
  loaded = false; setStatus('');
  try {
    const data = prefetched || await apiGetRetry('Card/Get?kind=' + kind);
    const minS = 0.4;   // как минимальный масштаб в примере; от размера карточки не зависит (в момент загрузки она может быть ещё без размера)
    (data.stickers || []).slice(0, MAX_STICKERS).forEach(s => {
      const src = sid(s.gift, s.model, s.uid), st = { id: newInstId(src), src, x: +s.x, y: +s.y, sc: clamp(+s.sc || 1, minS, SC_MAX), r: +s.r || 0, z: ++zSeq, t: ++tSeq };
      state.stickers.push(st); createStickerEl(st); placeSticker(st, 'instant');
    });
    if (data.bg && /^#[0-9a-f]{6}$/i.test(data.bg.c0) && /^#[0-9a-f]{6}$/i.test(data.bg.c1)) applyBg(data.bg, false);
    tray = (data.tray || []).map(t => ({ id: sid(t.gift, t.model, t.uid), gift: t.gift, model: t.model, uid: t.uid || undefined, sub: t.uid ? '#' + t.uid.split('-').pop() : undefined }));
    state.stickers.forEach(s => { if (!tray.some(t => t.id === s.src)) { const [gift, model, uid] = splitId(s.src); tray.push({ id: s.src, gift, model, uid, sub: uid ? '#' + uid.split('-').pop() : undefined }); } });
    loaded = true; renderTray();
    // подпись на карточке (имя владельца) хранится на сервере — если она устарела, обновляем её
    if ((data.holder || '') !== document.getElementById('holder').textContent) save();
  } catch (e) {
    // loaded остаётся false: пустой экран не затрёт сохранённую карточку
    setStatus(e.status === 403 ? 'Войдите через Telegram, чтобы пользоваться конструктором' : 'Не удалось загрузить карточку — обновите страницу', true);
  }
}

/* ---- просмотр по ссылке (view.html?c=...): та же карточка на весь экран, без входа и без правки */
let viewPublic = false;       // опубликована ли просматриваемая карточка
async function startView() {
  document.body.classList.add('view', 'fs');
  try {
    const r = await fetch(api('Card/Public/' + encodeURIComponent(VIEW_ID)));
    if (!r.ok) throw new Error(r.status);
    const data = await r.json();
    if (data.holder) document.getElementById('holder').textContent = data.holder;
    viewPublic = !!data.isPublic;
    if (data.bg && /^#[0-9a-f]{6}$/i.test(data.bg.c0) && /^#[0-9a-f]{6}$/i.test(data.bg.c1)) applyBg(data.bg, false);
    const minS = 0.4;   // как минимальный масштаб в примере; от размера карточки не зависит (в момент загрузки она может быть ещё без размера)
    (data.stickers || []).slice(0, MAX_STICKERS).forEach(s => {
      const src = sid(s.gift, s.model, s.uid), st = { id: newInstId(src), src, x: +s.x, y: +s.y, sc: clamp(+s.sc || 1, minS, SC_MAX), r: +s.r || 0, z: ++zSeq, t: ++tSeq };
      state.stickers.push(st); createStickerEl(st); placeSticker(st, 'instant');
    });
  } catch (e) { toast(T('Карточка не найдена')); }
  // вошедший человек (Telegram) учитывается как зритель ссылки
  try { if (authHeader() !== 'Tma invalid') fetch(api('Card/View?c=' + encodeURIComponent(VIEW_ID)), { method: 'POST', headers: { 'Authorization': authHeader() } }).catch(() => {}); } catch (e) { /* ignore */ }
  // под карточкой кнопка: во встроенном виде (поверх страницы конструктора) она закрывает просмотр, отдельно — ведёт на конструктор
  let cta;
  if (new URLSearchParams(location.search).get('embed')) {
    cta = document.createElement('button'); cta.type = 'button';
    cta.onclick = () => { try { P.postMessage({ cdCloseView: true }, '*'); } catch (e) { /* ignore */ } };
  } else {
    cta = document.createElement('a'); cta.target = '_top'; cta.href = (CFG.SERVER_BASE_URL || '') + '/Card/card.html';
  }
  cta.className = 'cta'; cta.textContent = 'Сделать свою карточку';
  const bar = document.createElement('div'); bar.id = 'viewBar'; bar.className = 'viewbar';     // кнопка и сердечко — в одном ряду
  bar.appendChild(cta); document.body.appendChild(bar);
  setupLike();
}
if (VIEW_ID) startView();
else { setTab('profile'); loadCard(); loadProfileInfo(); }

/* ---- полноэкранный горизонтальный режим: iframe растягивается на весь экран поверх размытой страницы,
   телефон переводится в альбомную ориентацию (а если не вышло — страница поворачивается CSS-ом) */
const frameEl = (() => { try { return P !== window ? P.document.getElementById('cd-frame') : null; } catch (e) { return null; } })();
let fs = false;
async function enterFs() {
  if (!frameEl || fs) return;
  fs = true; menu.hidden = true; select(null);
  document.body.classList.add('fs'); frameEl.classList.add('cd-fs'); P.document.body.classList.add('cd-noscroll');
  try { await P.document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { /* iOS и др.: останется оверлей */ }
  try { await P.screen.orientation.lock('landscape'); } catch (e) { /* не поддерживается */ }
  fitFs();
  setTimeout(fitFs, 350);
}
function fitFs() {
  if (!fs || !frameEl) return;
  const W = P.innerWidth, H = P.innerHeight;
  if (H > W) {   // телефон остался в портрете: поворачиваем страницу на 90° сами
    frameEl.classList.add('cd-rot');
    frameEl.style.width = H + 'px'; frameEl.style.height = W + 'px'; frameEl.style.transform = 'translateX(' + W + 'px) rotate(90deg)';
  } else {
    frameEl.classList.remove('cd-rot');
    frameEl.style.width = ''; frameEl.style.height = ''; frameEl.style.transform = '';
  }
}
function exitFs() {
  if (!fs) return;
  fs = false; document.body.classList.remove('fs');
  if (frameEl) { frameEl.classList.remove('cd-fs', 'cd-rot'); frameEl.style.width = ''; frameEl.style.height = ''; frameEl.style.transform = ''; }
  P.document.body.classList.remove('cd-noscroll');
  try { if (P.document.fullscreenElement) P.document.exitFullscreen(); } catch (e) { /* ignore */ }
  try { P.screen.orientation.unlock(); } catch (e) { /* ignore */ }
  setTimeout(reportHeight, 100);
}
try {
  P.addEventListener('resize', fitFs);
  P.document.addEventListener('fullscreenchange', () => { if (fs && !P.document.fullscreenElement) exitFs(); });
} catch (e) { /* ignore */ }
document.getElementById('btnFs').onclick = enterFs;
document.getElementById('btnFsExit').onclick = exitFs;
document.addEventListener('keydown', e => { if (e.key === 'Escape') exitFs(); });
if (!frameEl) document.getElementById('btnFs').hidden = true;
window.__fs = { enter: enterFs, exit: exitFs };

/* высоту iframe по содержимому выставляет родительская страница (card.js) */
function reportHeight() { try { P.postMessage({ cdHeight: Math.ceil(app.getBoundingClientRect().height) + 16 }, '*'); } catch (e) { /* ignore */ } }
new ResizeObserver(reportHeight).observe(app);
window.addEventListener('load', reportHeight);
setInterval(reportHeight, 1500);   // страховка: размер меняют и подгружающиеся картинки
reportHeight();
window.__card = { tray: () => tray, kind: () => kind, state, addToCard, evict, autoAdd, findPlacement, select, tiltTarget, get carry() { return carry; } };


/* ---- «Выбранные» можно свернуть: состояние помним в браузере */
const trayBoxEl = document.getElementById('trayBox');
function setTrayCollapsed(on) {
  trayBoxEl.classList.toggle('collapsed', on);
  try { localStorage.setItem('cdTrayCollapsed', on ? '1' : ''); } catch (e) { /* ignore */ }
  setTimeout(reportHeight, 50);
}
document.getElementById('trayHead').onclick = () => setTrayCollapsed(!trayBoxEl.classList.contains('collapsed'));
try { if (localStorage.getItem('cdTrayCollapsed')) trayBoxEl.classList.add('collapsed'); } catch (e) { /* ignore */ }


/* ================================================================== «Поделиться»: рендер карточки в картинку */
/* Картинка 2400×1500: фон #283043 со светлым радиальным градиентом в центре, юзернейм бота слева сверху и сама
   карточка. Шейдер рисуется заново в большом разрешении (без наклона), текст, чип и стикеры — на 2D-холсте;
   размеры и позиции берутся из тех же долей, что и в вёрстке карточки. */
const SHARE = { W: 2400, H: 1500, CW: 2100, BG: '#283043' };

let renderGL = null;      // один общий контекст для всех картинок: размер холста меняется под каждый рендер
function glCardCanvas(w, h, c0, c1) {
  if (!renderGL) {
    const cv = document.createElement('canvas');
    const g = cv.getContext('webgl', { antialias: true, preserveDrawingBuffer: true, alpha: false });
    if (!g) return null;
    const sh = (t, src) => { const s = g.createShader(t); g.shaderSource(s, src); g.compileShader(s); return s; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS));
    g.linkProgram(pr); g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    const uni = {};
    ['uSize', 'uTilt', 'uC0', 'uC1', 'uP0', 'uP1', 'uOrg', 'uRad', 'uSoft', 'uTime'].forEach(n => { uni[n] = g.getUniformLocation(pr, n); });
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); renderGL = null; });   // потеряли — пересоздадим при следующем рендере
    renderGL = { cv, g, uni };
  }
  const { cv, g, uni } = renderGL;
  cv.width = w; cv.height = h;
  g.viewport(0, 0, w, h);
  g.uniform2f(uni.uSize, w, h); g.uniform2f(uni.uTilt, 0, 0);
  g.uniform3fv(uni.uC0, c0); g.uniform3fv(uni.uC1, c1);
  g.uniform3fv(uni.uP0, c0); g.uniform3fv(uni.uP1, c1);
  g.uniform2f(uni.uOrg, .5, .5); g.uniform1f(uni.uRad, -1); g.uniform1f(uni.uSoft, 1);
  g.uniform1f(uni.uTime, performance.now() / 1000);
  g.drawArrays(g.TRIANGLES, 0, 3);
  return cv;      // холст общий: вызывающий должен сразу скопировать его на свой (между вызовом и drawImage нет await)
}
function loadImgCors(url) {
  return new Promise(res => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => res(null); i.src = url; });
}
function rrPath(x, w, h, r) {
  x.beginPath(); x.moveTo(r, 0); x.arcTo(w, 0, w, h, r); x.arcTo(w, h, 0, h, r); x.arcTo(0, h, 0, 0, r); x.arcTo(0, 0, w, 0, r); x.closePath();
}
/* текст с межбуквенным интервалом (letterSpacing у canvas есть не везде), возвращает ширину */
function spaced(x, text, px, py, sp, draw) {
  let cx = px;
  for (const ch of text) { if (draw) x.fillText(ch, cx, py); cx += x.measureText(ch).width + sp; }
  return cx - px - sp;
}

async function renderCardImage(size) {
  // снимок состояния — до первого await: дальше экран уже может быть переключён на другую карточку
  const snap = {
    stickers: state.stickers.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).map(s => Object.assign({}, s)),
    c0: colorNow.c0.slice(), c1: colorNow.c1.slice(),
    holder: document.getElementById('holder').textContent || 'COLLECTOR', usd: document.querySelector('.usd').textContent
  };
  const { W, H, CW } = size || SHARE, CH = Math.round(CW / 1.648), cq = CW / 100;
  try { await Promise.all(['500 40px Roboto', '400 40px Roboto', '700 40px "Roboto Mono"', '700 40px Inter'].map(f => document.fonts.load(f))); } catch (e) { /* ignore */ }

  const only = !!(size && size.cardOnly);          // режим превью: холст ровно по карточке, без фона и тени
  const cv = document.createElement('canvas'); cv.width = only ? CW : W; cv.height = only ? CH : H;
  const x = cv.getContext('2d');

  if (!only) {
    // фон: #283043 и светлое радиальное свечение в центре
    x.fillStyle = SHARE.BG; x.fillRect(0, 0, W, H);
    const rg = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) * .46);
    rg.addColorStop(0, 'rgba(255,255,255,.24)'); rg.addColorStop(.55, 'rgba(255,255,255,.07)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = rg; x.fillRect(0, 0, W, H);
  }

  // стикеры нужны до рисования (загружаем параллельно)
  const stickers = snap.stickers;
  const imgs = await Promise.all(stickers.map(s => { const [g, m] = splitId(s.src); return loadImgCors(imgUrl(g, m)); }));
  const glc = glCardCanvas(CW, CH, snap.c0, snap.c1);

  const c0 = snap.c0, c1 = snap.c1, white = [1, 1, 1], black = [0, 0, 0];
  x.save(); if (!only) x.translate(Math.round((W - CW) / 2), Math.round((H - CH) / 2 + 30));

  // тень под карточкой, затем сама карточка (скруглённый прямоугольник)
  if (!only) {
    rrPath(x, CW, CH, CW * .076);
    x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 90; x.shadowOffsetY = 40; x.fillStyle = '#16213a'; x.fill();
    x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
  }
  x.save(); rrPath(x, CW, CH, CW * .076); x.clip();
  if (glc) x.drawImage(glc, 0, 0);
  else { const lg = x.createLinearGradient(0, 0, CW, CH); lg.addColorStop(0, rgb2css(c0)); lg.addColorStop(1, rgb2css(c1)); x.fillStyle = lg; x.fillRect(0, 0, CW, CH); }

  // стикеры лежат под текстом
  stickers.forEach((st, i) => {
    const im = imgs[i]; if (!im) return;
    const S = CW * .231 * st.sc;
    x.save(); x.translate(st.x * CW, st.y * CH); x.rotate((st.r || 0) * Math.PI / 180);
    x.shadowColor = 'rgba(10,15,28,.28)'; x.shadowBlur = 1.4 * cq; x.shadowOffsetY = .6 * cq;
    x.drawImage(im, -S / 2, -S / 2, S, S); x.restore();
  });

  // баланс: бриллиант, «11 GRAM», «$33.00»
  const by = CH * .41, gs = 8.4 * cq;
  x.save(); x.translate(6.6 * cq, by - gs / 2); x.scale(gs / 64, gs / 64);
  const gB = x.createLinearGradient(0, 8, 0, 58); gB.addColorStop(0, rgb2css(mix(c0, white, .86))); gB.addColorStop(1, rgb2css(mix(c1, white, .35)));
  const gA = x.createLinearGradient(14, 8, 50, 22); gA.addColorStop(0, '#fff'); gA.addColorStop(1, rgb2css(mix(c0, white, .55)));
  x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 1.2 * 64 / gs * cq * .5; x.shadowOffsetY = .4 * cq * 64 / gs;
  x.fillStyle = gB; x.fill(new Path2D('M14 8h36l12 14-30 36L2 22z'));
  x.shadowColor = 'transparent';
  x.globalAlpha = .95; x.fillStyle = gA; x.fill(new Path2D('M14 8 24 22h16L50 8z'));
  x.globalAlpha = .28; x.fillStyle = '#fff'; x.fill(new Path2D('M2 22h22L32 58zM62 22H40L32 58z'));
  x.globalAlpha = .12; x.fill(new Path2D('M24 22 32 58 40 22z'));
  x.globalAlpha = 1; x.fill(new Path2D('M47 6l1.6 4.2L53 12l-4.4 1.8L47 18l-1.6-4.2L41 12l4.4-1.8z'));
  x.restore();

  const fsz = 9.4 * cq;
  x.textBaseline = 'alphabetic'; x.fillStyle = '#fff'; x.font = '500 ' + fsz + 'px Roboto, sans-serif';
  x.shadowColor = 'rgba(0,0,0,.16)'; x.shadowBlur = .8 * cq; x.shadowOffsetY = .3 * cq;
  const ax = 6.6 * cq + gs + 2.2 * cq, ay = by + fsz * .36;
  x.fillText(String(GRAM_AMOUNT), ax, ay);
  x.fillText('GRAM', ax + x.measureText(String(GRAM_AMOUNT)).width + 2.2 * cq, ay);
  x.shadowColor = 'transparent';
  x.fillStyle = rgb2css(mix(c0, white, .62)); x.font = '400 ' + 4.6 * cq + 'px Roboto, sans-serif';
  x.fillText(snap.usd, 6.9 * cq, CH * .515 + 4.6 * cq * .95);

  // имя владельца внизу слева
  const holder = snap.holder;
  x.font = '700 ' + 3.6 * cq + 'px "Roboto Mono", monospace'; x.fillStyle = '#fff';
  x.shadowColor = rgb2css(mix(c1, black, .55)); x.shadowBlur = .5 * cq; x.shadowOffsetY = .35 * cq;
  spaced(x, holder, 6.6 * cq, CH * (1 - .085) - 3.6 * cq * .2, .08 * 3.6 * cq, true);
  x.shadowColor = 'transparent';

  // слова на торце: две вертикальные колонки
  x.font = '700 ' + 2.85 * cq + 'px "Roboto Mono", monospace'; x.fillStyle = rgb2css(mix(c1, black, .12));
  [[0, 3.4 / 2 + 2.4], [2, 3.4 / 2 + 2.4 + 3.5]].forEach(([from, off]) => {
    const words = WORDS.slice(from, from + 2), sp = .05 * 2.85 * cq;
    const widths = words.map(w => spaced(x, w, 0, 0, sp, false));
    const top = CH * .065, span = CH * .87, gap = (span - widths.reduce((a, b) => a + b, 0)) / (words.length - 1);
    let y = top;
    words.forEach((w, i) => {
      x.save(); x.translate(CW - off * cq, y); x.rotate(Math.PI / 2); x.textBaseline = 'middle';
      spaced(x, w, 0, 0, sp, true); x.restore();
      y += widths[i] + gap;
    });
  });

  // чип поверх всего (в карточке он тоже не закрывается)
  x.save(); x.translate(69.94 * cq, CH * .361);
  const cw2 = 14.29 * cq, ch2 = CH * .1756;
  rrPath(x, cw2, ch2, 3 * cq);
  x.shadowColor = 'rgba(0,0,0,.28)'; x.shadowBlur = 1.4 * cq; x.shadowOffsetY = .6 * cq;
  const cg = x.createLinearGradient(0, 0, cw2, ch2);
  cg.addColorStop(0, '#fbfbfb'); cg.addColorStop(.38, '#d9dbde'); cg.addColorStop(.52, '#b4b8bd'); cg.addColorStop(1, '#e9eaec');
  x.fillStyle = cg; x.fill(); x.shadowColor = 'transparent';
  x.translate(cw2 / 2 - 3.3 * cq, ch2 / 2 - 3.3 * cq); x.scale(6.6 * cq / 32, 6.6 * cq / 32);
  x.strokeStyle = '#6f7478'; x.lineWidth = 2.6; x.lineJoin = 'round';
  [[5, 5], [18.6, 5], [5, 18.6]].forEach(([qx, qy]) => { x.save(); x.translate(qx, qy); rrPath(x, 8.4, 8.4, 2); x.stroke(); x.restore(); });
  x.fillStyle = '#6f7478';
  [[19, 19], [24, 19], [19, 24], [24, 24]].forEach(([qx, qy]) => { x.save(); x.translate(qx, qy); rrPath(x, 3.4, 3.4, .7); x.fill(); x.restore(); });
  x.restore();

  x.restore();   // clip карточки
  x.restore();
  return cv;
}

/* ---- окно «Поделиться»: короткая ссылка на карточку и кнопка «в чат с ботом». Строится в родительской странице,
   чтобы быть поверх всего (в т.ч. полноэкранного режима). */
function shareModal() {
  const D = P.document;
  if (!D.getElementById('cdShareCss')) {
    const st = D.createElement('style'); st.id = 'cdShareCss';
    st.textContent = '#cdShare{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,12,24,.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);font-family:Inter,Roboto,sans-serif}' +
      '#cdShare .p{width:min(94vw,460px);background:#16213a;border-radius:20px;padding:18px;color:#f1f5fa;box-shadow:0 20px 70px rgba(0,0,0,.6)}' +
      '#cdShare .h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;font-weight:800;font-size:16px}' +
      '#cdShare .x{width:36px;height:36px;border-radius:18px;background:#1e2944;color:#fff;border:0;font-size:18px;cursor:pointer}' +
      '#cdShare .lk{padding:13px 14px;border-radius:12px;background:#1e2944;font-size:14px;color:#c9d6f5;word-break:break-all;user-select:all;min-height:20px}' +
      '#cdShare .vw{margin-top:10px;font-size:12px;color:#9fb0d6;line-height:1.5;word-break:break-word}#cdShare .vw b{color:#dbe4fa}' +
      '#cdShare .b{display:flex;flex-direction:column;gap:10px;margin-top:12px}' +
      '#cdShare .b button{border:0;border-radius:12px;padding:14px;font:700 14px Inter,sans-serif;cursor:pointer;background:#1e2944;color:#dbe4fa}' +
      '#cdShare .b button.pr{background:#2563eb;color:#fff}#cdShare .b button:disabled{opacity:.5;cursor:default}' +
      '#cdShare .m{margin-top:10px;font-size:12px;color:#8fa0c4;text-align:center;min-height:16px}';
    D.head.appendChild(st);
  }
  const old = D.getElementById('cdShare'); if (old) old.remove();
  const o = D.createElement('div'); o.id = 'cdShare';
  o.innerHTML = '<div class="p"><div class="h"><span>Поделиться карточкой</span><button class="x" aria-label="Закрыть">✕</button></div>' +
    '<div class="lk">Готовлю ссылку…</div><div class="vw" hidden></div>' +
    '<div class="b"><button class="cp" disabled>Копировать ссылку</button><button class="pr bot" disabled>Скинуть в чат с ботом</button></div><div class="m"></div></div>';
  D.body.appendChild(o);
  trTree(o);
  return o;
}
async function ensureShareLink() {
  const r = await fetch(api('Card/ShareLink?kind=' + kind), { method: 'POST', headers: { 'Authorization': authHeader() } });
  if (!r.ok) throw new Error(r.status);
  return (await r.json()).url;
}
async function sendToBot() {
  const r = await fetch(api('Card/SendToBot?kind=' + kind), { method: 'POST', headers: { 'Authorization': authHeader() } });
  if (!r.ok) { const e = new Error(r.status); e.text = await r.text().catch(() => ''); throw e; }
}
async function openShare() {
  const o = shareModal(), D = P.document;
  const close = () => o.remove();
  o.querySelector('.x').onclick = close;
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  const note = t => { o.querySelector('.m').textContent = T(t); };
  const lk = o.querySelector('.lk'), cp = o.querySelector('.cp'), bot = o.querySelector('.bot');
  let link;
  try {
    // по ссылке открывается серверная копия карточки — сначала дожидаемся сохранения
    clearTimeout(saveTimer); while (saving) await new Promise(r => setTimeout(r, 80)); await flushSave();
    link = await ensureShareLink();
  } catch (e) { lk.textContent = T('Не удалось получить ссылку' + (e && /^\d+$/.test(e.message) ? ' (' + e.message + ')' : '')); return; }
  lk.textContent = link; cp.disabled = bot.disabled = false;
  // кто и сколько раз открыл ссылку
  apiGet('Card/ViewStats').then(st => {
    const vw = o.querySelector('.vw'); if (!st || !st.unique) return;
    const names = (st.viewers || []).slice(0, 5).map(v => v.username ? '@' + v.username : 'id' + v.id).join(', ');
    vw.hidden = false;
    vw.innerHTML = '<b></b><span></span>';
    vw.firstChild.textContent = (LANG === 'en' ? 'Link opened by: ' : 'Открыли ссылку: ') + st.unique + (LANG === 'en' ? ' people, ' : ' чел., ') + st.total + (LANG === 'en' ? ' views' : ' просмотров');
    vw.lastChild.textContent = names ? ' — ' + names + (st.unique > 5 ? '…' : '') : '';
  }).catch(() => { /* статистика не критична */ });
  cp.onclick = async () => {
    try { await P.navigator.clipboard.writeText(link); note('Ссылка скопирована.'); }
    catch (e) { try { const rg = D.createRange(); rg.selectNodeContents(lk); const s = P.getSelection(); s.removeAllRanges(); s.addRange(rg); D.execCommand('copy'); note('Ссылка скопирована.'); } catch (e2) { note('Выделите ссылку и скопируйте её вручную.'); } }
  };
  // бот присылает в личный чат с ним картинку карточки со ссылкой — оттуда её можно переслать кому угодно
  bot.onclick = async () => {
    bot.disabled = true; note('Готовлю картинку…');
    try {
      if (!(await uploadImage(true))) throw new Error('image');
      await sendToBot();
      note('Готово! Карточка с ссылкой отправлена в чат с @' + (CFG.BOT_USERNAME || 'NFTMatchBot') + ' — перешлите её оттуда.');
    } catch (e) {
      note('Не получилось отправить' + (e && /^\d+$/.test(e.message) ? ' (' + e.message + (e.text ? ': ' + e.text.slice(0, 80) : '') + ')' : '') + '. Откройте чат с @' + (CFG.BOT_USERNAME || 'NFTMatchBot') + ' и нажмите /start.');
    }
    bot.disabled = false;
  };
}
document.getElementById('btnShare').onclick = openShare;
window.__share = { render: renderCardImage, open: openShare };


/* ================================================================== картинка карточки для инлайна бота */
/* После сохранения карточки (с паузой) рисуем её в JPEG и отправляем на сервер: бот отдаёт её по
   @NFTMatchBot mycard (профиль) / myideacard (каталог). */
/* Картинка для бота (инлайн, «в чат с ботом») меньше, чем для скачивания: ~1600 px и качество .82 — около 150–250 КБ вместо ~400. */
const UPLOAD_SIZE = { W: 1600, H: 1000, CW: 1400 };
let imgTimer = null, imgBusy = false, imgDirty = false;
function scheduleImageUpload() { imgDirty = true; clearTimeout(imgTimer); imgTimer = setTimeout(() => uploadImage(false), 12000); }   // не после каждой правки, а когда человек притих
async function uploadImage(force) {
  if (force) while (imgBusy) await new Promise(r => setTimeout(r, 100));
  if (imgBusy || !loaded || (dirty && !force)) return false;
  imgBusy = true;
  const k = kind;    // вид карточки на момент начала: пока рисуется картинка, слот могут переключить
  try {
    const cv = await renderCardImage(UPLOAD_SIZE);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .82));
    if (!blob) return false;
    const r = await fetch(api('Card/Image?kind=' + k), { method: 'POST', headers: { 'Authorization': authHeader(), 'Content-Type': 'image/jpeg' }, body: blob });
    if (r.ok) imgDirty = false;
    return r.ok;
  } catch (e) { return false; /* картинка для инлайна не критична */ } finally { imgBusy = false; }
}

/* ================================================================== курс GRAM (бывший Toncoin) с биржи */
/* 11 GRAM на карточке — демо-баланс, сумма в долларах считается по биржевому курсу GRAM/USDT.
   Источники по очереди: Binance, OKX, Bybit; курс помним 5 минут. */
const GRAM_AMOUNT = 10;
const usdEl = document.querySelector('.usd');
const RATE_SOURCES = [
  { name: 'Binance', url: 'https://api.binance.com/api/v3/ticker/price?symbol=GRAMUSDT', pick: j => +j.price },
  { name: 'OKX', url: 'https://www.okx.com/api/v5/market/ticker?instId=GRAM-USDT', pick: j => +j.data[0].last },
  { name: 'Bybit', url: 'https://api.bybit.com/v5/market/tickers?category=spot&symbol=GRAMUSDT', pick: j => +j.result.list[0].lastPrice }
];
function showUsd(price, src) {
  usdEl.textContent = '$' + (GRAM_AMOUNT * price).toFixed(2);
  usdEl.title = '1 GRAM = $' + price + ' (' + src + ')';
}
async function loadGramRate() {
  try {
    const c = JSON.parse(sessionStorage.getItem('cdGram') || 'null');
    if (c && Date.now() - c.t < 300000) { showUsd(c.p, c.s); return; }
  } catch (e) { /* ignore */ }
  for (const s of RATE_SOURCES) {
    try {
      const r = await fetch(s.url, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) continue;
      const p = s.pick(await r.json());
      if (!(p > 0)) continue;
      showUsd(p, s.name);
      try { sessionStorage.setItem('cdGram', JSON.stringify({ p, s: s.name, t: Date.now() })); } catch (e) { /* ignore */ }
      return;
    } catch (e) { /* следующий источник */ }
  }
}
loadGramRate();


/* ================================================================== Две карточки, публикация и лайки */
/* Пока всё это видит только администратор (ADMIN_UI): карусель из трёх слотов (слева вторая карточка, в центре основная, справа закрытая),
   кнопки «Скачать» и «Опубликовать», окно опубликованной карточки. Остальные пользователи работают с одной карточкой как раньше.
   Сервер для остальных ничего не меняет: вторая карточка (kind=second) и запрет ссылки у неопубликованной действуют только для администратора. */
const SLOT_KINDS = ['second', 'catalog'];           // открытые карточки по порядку слева направо; справа — закрытая
const PREVIEW_SIZE = { W: 560, H: 340, CW: 560, cardOnly: true };
const CHANNEL_URL = 'https://t.me/NFTStyler';       // канал, на который нужно подписаться, чтобы опубликовать карточку
const previews = {};                                 // kind -> адрес картинки для боковых слотов карусели
const pubState = {};                                 // kind -> { public, likes }
let slotSwitching = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function setPreview(k, blob) {
  if (!ADMIN_UI || !blob) return;
  if (previews[k] && previews[k].startsWith('blob:')) URL.revokeObjectURL(previews[k]);
  previews[k] = URL.createObjectURL(blob);
  renderPeeks();
}

function tgOpenLink(url) {
  try { const t = P.Telegram && P.Telegram.WebApp; if (t && t.initData && t.openTelegramLink && /^https:\/\/t\.me\//.test(url)) { t.openTelegramLink(url); return; } } catch (e) { /* ignore */ }
  try { P.open(url, '_blank'); } catch (e) { /* ignore */ }
}

/* ---- карусель */
const SLOT_ORDER = ['locked', 'catalog', 'second'];   // слева направо: платная (закрытая, заглушка без данных), основная, вторая
let slotNow = 'catalog';                              // что сейчас в центре
function peekHtml(k) {
  if (k === 'locked') return '<div class="pc locked"><svg viewBox="0 0 24 24" width="30" height="30"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="#8a8f99" stroke-width="2"/><path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="#8a8f99" stroke-width="2" stroke-linecap="round"/></svg><b>50 ★</b></div>';
  return previews[k] ? '<div class="pc"><img alt="" src="' + previews[k] + '"></div>' : '<div class="pc empty"><span>' + T(k === 'second' ? 'Новая карточка' : 'Карточка') + '</span></div>';
}
function renderPeeks() {
  const L = document.getElementById('peekL'), R = document.getElementById('peekR');
  if (!L || !R) return;
  const set = (el, k) => {
    const was = el.dataset.go || '';
    el.hidden = !k; el.dataset.go = k || '';
    if (k) { el.innerHTML = peekHtml(k); if (k !== was) { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); } }
  };
  if (slotNow === 'catalog') { set(L, 'locked'); set(R, 'second'); }
  else if (slotNow === 'second') { set(L, 'catalog'); set(R, null); }
  else { set(L, null); set(R, 'catalog'); }
  layoutPeeks();
}
/* Боковые карточки чуть меньше центральной (как в карусели) и стоят на одной с ней линии центров. Размеры считаем по ширине карусели. */
const PEEK_SCALE = .84, PEEK_SHOW = 36;
function layoutPeeks() {
  const car = document.getElementById('carousel'), L = document.getElementById('peekL'), R = document.getElementById('peekR');
  if (!car || !L || !R) return;
  const W = car.clientWidth, cardW = W - 88, cardH = cardW / 1.648;
  const pw = cardW * PEEK_SCALE, ph = pw / 1.648, top = 32 + cardH / 2 - ph / 2;
  [L, R].forEach(p => { p.style.width = pw + 'px'; p.style.top = top + 'px'; });
  L.style.left = (PEEK_SHOW - pw) + 'px';
  R.style.left = (W - PEEK_SHOW) + 'px';
}
function goPeek(k) { if (k) goSlot(k); }
function slotShift(step) {            // step: -1 влево по ряду, +1 вправо
  const i = SLOT_ORDER.indexOf(slotNow) + step;
  if (i < 0 || i >= SLOT_ORDER.length) return;
  goSlot(SLOT_ORDER[i]);
}
const preloadImg = u => new Promise(res => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = u; setTimeout(res, 1500); });
async function goSlot(target) {
  if (slotSwitching || target === slotNow || !SLOT_ORDER.includes(target)) return;
  slotSwitching = true;
  const stageEl = document.getElementById('stage'), lockedEl = document.getElementById('lockedWrap');
  const toLeft = SLOT_ORDER.indexOf(target) < SLOT_ORDER.indexOf(slotNow);      // едем к левой карточке: уходящая уезжает вправо
  const outEl = slotNow === 'locked' ? lockedEl : stageEl, inEl = target === 'locked' ? lockedEl : stageEl;
  const animOut = toLeft ? 'out-r' : 'out-l', animIn = toLeft ? 'in-r' : 'in-l';
  const needData = target !== 'locked' && target !== kind;
  try {
    outEl.classList.add(animOut);                                                // сразу даём отклик, остальное идёт параллельно с анимацией
    menu.hidden = true; select(null);
    let data = null, failed = false;
    await Promise.all([
      sleep(210),
      (async () => {                                                             // сохраняем уходящую карточку и снимаем её превью
        if (slotNow === 'locked') return;
        clearTimeout(saveTimer); while (saving) await sleep(80); await flushSave();
        if (dirty) { failed = 'save'; return; }
        if (imgDirty && !imgBusy) { clearTimeout(imgTimer); uploadImage(true); }   // картинка для бота у уходящей карточки обновляется в фоне (по снимку состояния)
        try { const cv = await renderCardImage(PREVIEW_SIZE); const b = await new Promise(r => cv.toBlob(r, 'image/webp', .85)); if (b) setPreview(kind, b); } catch (e) { /* превью не критично */ }
      })(),
      (async () => {                                                             // данные новой карточки и её картинки подгружаем заранее
        if (!needData) return;
        try {
          data = await apiGetRetry('Card/Get?kind=' + target);
          await Promise.all((data.stickers || []).slice(0, MAX_STICKERS).map(s => preloadImg(imgUrl(s.gift, s.model))));
        } catch (e) { failed = 'load'; }
      })()
    ]);
    if (failed) {
      outEl.classList.remove(animOut);
      toast(T(failed === 'save' ? 'Не удалось сохранить карточку — попробуйте ещё раз' : 'Не удалось загрузить карточку — обновите страницу'));
      return;
    }
    outEl.style.display = 'none'; outEl.classList.remove(animOut);
    if (needData) {
      loaded = false;
      state.stickers.slice().forEach(s => detach(s.id));
      tray = []; trayEl.innerHTML = ''; tiles.clear();
      currentBg = null; state.colorId = null; applyTheme(false); updateBgRow();
      kind = target; document.body.dataset.kind = kind;
      await loadCard(data);                                                      // данные уже на руках — без запроса и без «дёрганья»
      refreshPublish();
    }
    slotNow = target;
    document.body.classList.toggle('locked-center', target === 'locked');
    inEl.style.display = ''; inEl.classList.add(animIn);
    if (inEl === stageEl) { resize(); layoutStickers(); }                   // размеры карточки нужны сразу, иначе перетаскивание на неё не сработает
    renderPeeks();
    if (inEl === stageEl && !loaded) setStatus('Не удалось загрузить карточку — обновите страницу', true);
    await sleep(320); inEl.classList.remove(animIn);
  } finally { stageEl.classList.remove('out-r', 'out-l', 'in-r', 'in-l'); lockedEl.classList.remove('out-r', 'out-l', 'in-r', 'in-l'); slotSwitching = false; }
}

/* уведомления выводим в родительской странице: окно редактора высокое, и «всплывашка» внутри него оказывается за пределами экрана */
function toast(msg) {
  try {
    if (frameEl) {
      const D = P.document;
      if (!D.getElementById('cdToastCss')) {
        const st = D.createElement('style'); st.id = 'cdToastCss';
        st.textContent = '#cdToast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);opacity:0;pointer-events:none;max-width:88vw;text-align:center;background:#263355;color:#fff;padding:11px 18px;border-radius:14px;font:600 13px Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45);transition:opacity .2s,transform .2s;z-index:10070}#cdToast.show{opacity:1;transform:translate(-50%,0)}';
        D.head.appendChild(st);
      }
      let t = D.getElementById('cdToast');
      if (!t) { t = D.createElement('div'); t.id = 'cdToast'; t.setAttribute('role', 'status'); D.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show');
      clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400);
      return;
    }
  } catch (e) { /* запасной вариант ниже */ }
  toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ---- превью с сервера: последняя загруженная картинка — это композиция на фоне (UPLOAD_SIZE), вырезаем из неё саму карточку */
async function cropServerPreview(url) {
  const im = await loadImgCors(url); if (!im) return null;
  const { W, H, CW } = UPLOAD_SIZE, CH = Math.round(CW / 1.648);
  const sx = Math.round((W - CW) / 2), sy = Math.round((H - CH) / 2 + 30);
  const c = document.createElement('canvas'); c.width = 560; c.height = Math.round(560 / 1.648);
  const x = c.getContext('2d');
  rrPath(x, c.width, c.height, c.width * .076); x.clip();
  x.drawImage(im, sx, sy, CW, CH, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(r, 'image/webp', .85));
}

/* ---- публикация */
const btnPub = document.getElementById('btnClear'), btnDl = document.getElementById('btnShare');
async function refreshPublish() {
  try { pubState[kind] = await apiGet('Card/Visibility?kind=' + kind); }
  catch (e) { pubState[kind] = pubState[kind] || { public: false, likes: 0 }; }
  updatePubButton();
}
function updatePubButton() {
  const st = pubState[kind] || {};
  btnPub.textContent = st.public ? 'Опубликовано' : 'Опубликовать';
  btnPub.classList.toggle('green', !!st.public); btnPub.disabled = false;
}
/* Запрос на публикацию. Возвращает 'ok' | 'sub' (нет подписки на канал) | 'fail'. */
async function publishRequest() {
  try {
    clearTimeout(saveTimer); while (saving) await sleep(80); await flushSave();
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch(api('Card/Visibility?kind=' + kind + '&public=true'), { method: 'POST', headers: { 'Authorization': authHeader() } });
      if (r.ok) { pubState[kind] = await r.json(); updatePubButton(); return 'ok'; }
      let body = {}; try { body = await r.json(); } catch (e) { /* не JSON */ }
      if (r.status === 403 && body.error === 'subscription_required') return 'sub';
      if (r.status === 409 && body.error === 'no_card' && attempt === 0) { dirty = true; loaded = true; await flushSave(); continue; }   // карточка ещё не сохранялась — сохраняем и повторяем
      return 'fail';
    }
  } catch (e) { /* ниже */ }
  return 'fail';
}
function pubModalShell(inner) {
  const D = P.document;
  shareModal();                                        // подключает общие стили окон
  const o = D.getElementById('cdShare');
  o.innerHTML = '<div class="p"><div class="h"><span></span><button class="x" aria-label="Закрыть">✕</button></div>' + inner + '<div class="m"></div></div>';
  const close = () => o.remove();
  o.querySelector('.x').onclick = close;
  o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  return { o, close, note: t => { o.querySelector('.m').textContent = T(t); } };
}
/* Окно публикации: что это значит, проверка подписки на канал и кнопка «Опубликовать». */
async function openPublishModal() {
  const { o, close, note } = pubModalShell(
    '<div class="lk" style="font-weight:700;font-size:16px;color:#fff">Поделитесь карточкой с друзьями, чтобы набрать лайки!</div>' +
    '<div class="lk">Самые популярные работы попадут в ленту лучших в боте.</div>' +
    '<div class="lk">Снять карточку с публикации можно в любой момент.</div>' +
    '<div class="vw sub">Проверяю подписку на канал…</div>' +
    '<div class="b"><button class="pr go" disabled>Опубликовать</button><button class="ch" hidden>Открыть канал</button><button class="rc" hidden>Проверить подписку</button></div>');
  o.querySelector('.h span').textContent = T('Публикация карточки');
  const subEl = o.querySelector('.sub'), go = o.querySelector('.go'), ch = o.querySelector('.ch'), rc = o.querySelector('.rc');
  const show = (ok) => {                                  // ok: true — подписан, false — нет, null — не удалось проверить
    subEl.textContent = T(ok === true ? '✓ Вы подписаны на канал' : ok === false ? 'Для публикации нужно подписаться на наш канал' : 'Не удалось проверить подписку');
    go.disabled = ok === false; ch.hidden = ok !== false; rc.hidden = ok === true;
    rc.textContent = T(ok === null ? 'Проверить ещё раз' : 'Я подписался — проверить');
    trTree(o);
  };
  const check = async () => {
    subEl.textContent = T('Проверяю подписку на канал…'); go.disabled = true; rc.disabled = true;
    try {
      const r = await fetch(api('Card/SubscriptionState'), { headers: { 'Authorization': authHeader() } });
      show(r.ok ? true : r.status === 403 ? false : null);
    } catch (e) { show(null); }
    rc.disabled = false;
  };
  trTree(o);
  ch.onclick = () => tgOpenLink(CHANNEL_URL);
  rc.onclick = check;
  go.onclick = async () => {
    go.disabled = true; note('Публикую…');
    const res = await publishRequest();
    if (res === 'ok') { close(); openPubModal(); return; }
    if (res === 'sub') { show(false); note(''); return; }
    note('Не удалось опубликовать'); go.disabled = false;
  };
  check();
}
async function openPubModal() {
  const { o, close, note } = pubModalShell('<div class="vw big"><b>Лайки: <span class="lc">…</span></b></div><div class="lk">Готовлю ссылку…</div><div class="vw views" hidden></div>' +
    '<div class="b"><button class="cp" disabled>Копировать ссылку</button><button class="bot" disabled>Скинуть в чат с ботом</button><button class="un">Снять с публикации</button></div>');
  o.querySelector('.h span').textContent = T('Карточка опубликована');
  trTree(o);
  const lk = o.querySelector('.lk'), cp = o.querySelector('.cp'), bot = o.querySelector('.bot');
  apiGet('Card/Visibility?kind=' + kind).then(st => { pubState[kind] = st; o.querySelector('.lc').textContent = st.likes || 0; updatePubButton(); }).catch(() => { o.querySelector('.lc').textContent = '0'; });
  let link;
  try { link = await ensureShareLink(); }
  catch (e) { lk.textContent = T('Не удалось получить ссылку'); link = null; }
  if (link) {
    lk.textContent = link; cp.disabled = bot.disabled = false;
    cp.onclick = async () => { try { await P.navigator.clipboard.writeText(link); note('Ссылка скопирована.'); } catch (e) { note('Выделите ссылку и скопируйте её вручную.'); } };
    bot.onclick = async () => {
      bot.disabled = true; note('Готовлю картинку…');
      try { if (!(await uploadImage(true))) throw new Error('image'); await sendToBot(); note('Готово! Карточка с ссылкой отправлена в чат с @' + (CFG.BOT_USERNAME || 'NFTMatchBot') + ' — перешлите её оттуда.'); }
      catch (e) { note('Не получилось отправить' + (e && /^\d+$/.test(e.message) ? ' (' + e.message + ')' : '') + '. Откройте чат с @' + (CFG.BOT_USERNAME || 'NFTMatchBot') + ' и нажмите /start.'); }
      bot.disabled = false;
    };
    apiGet('Card/ViewStats?kind=' + kind).then(st => {
      const vw = o.querySelector('.views'); if (!st || !st.unique) return;
      const names = (st.viewers || []).slice(0, 5).map(v => v.username ? '@' + v.username : 'id' + v.id).join(', ');
      vw.hidden = false; vw.textContent = (LANG === 'en' ? 'Link opened by: ' : 'Открыли ссылку: ') + st.unique + (LANG === 'en' ? ' people, ' : ' чел., ') + st.total + (LANG === 'en' ? ' views' : ' просмотров') + (names ? ' — ' + names : '');
    }).catch(() => { /* статистика не критична */ });
  }
  o.querySelector('.un').onclick = async () => {
    try {
      const r = await fetch(api('Card/Visibility?kind=' + kind + '&public=false'), { method: 'POST', headers: { 'Authorization': authHeader() } });
      if (!r.ok) throw new Error(r.status);
      pubState[kind] = await r.json(); updatePubButton(); close(); toast(T('Карточка снята с публикации'));
    } catch (e) { note('Не удалось снять с публикации'); }
  };
}

/* ---- скачать картинку (без ссылки) */
async function downloadCard() {
  btnDl.disabled = true;
  try {
    const t = P.Telegram && P.Telegram.WebApp;
    if (t && t.initData && t.downloadFile && t.isVersionAtLeast && t.isVersionAtLeast('8.0')) {
      // в мини-приложении скачивание идёт по адресу: загружаем картинку на сервер и отдаём клиенту Telegram
      if (await uploadImage(true)) {
        const d = await apiGet('Card/Get?kind=' + kind);
        if (d.imageUrl) { t.downloadFile({ url: d.imageUrl, file_name: 'nftmatch-card.jpg' }); return; }
      }
    }
    const cv = await renderCardImage();
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    if (!blob) throw new Error('empty');
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nftmatch-card.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch (e) { toast(T('Не удалось подготовить картинку')); }
  finally { btnDl.disabled = false; }
}

/* Кнопка «Опубликовать» на месте «Очистить» + быстрый сброс маленькой ссылкой внизу блока «Выбранные» (у всех пользователей). */
function setupPublishButton() {
  btnPub.disabled = false; btnPub.textContent = 'Опубликовать';
  btnPub.onclick = () => { if ((pubState[kind] || {}).public) openPubModal(); else openPublishModal(); };
  const clr = document.createElement('button'); clr.type = 'button'; clr.className = 'linkbtn'; clr.textContent = 'Очистить карточку';
  clr.onclick = () => { if (state.stickers.length && confirm(T('Убрать все стикеры с карточки?'))) state.stickers.slice().forEach(s => detach(s.id)); };
  document.getElementById('trayBox').appendChild(clr);
  refreshPublish();
}

/* ---- сборка админского интерфейса */
function initAdmin() {
  document.body.classList.add('admin');
  const stageEl = document.getElementById('stage');

  // карусель: боковые слоты с размытыми «кусочками» соседних карточек, точки под ней
  const car = document.createElement('div'); car.id = 'carousel'; car.className = 'carousel';
  stageEl.parentNode.insertBefore(car, stageEl);
  const L = document.createElement('div'); L.id = 'peekL'; L.className = 'peek peekL'; L.hidden = true;
  const R = document.createElement('div'); R.id = 'peekR'; R.className = 'peek peekR';
  // закрытая карточка: чёрная, с серым пунктиром (рендерить её не нужно — только заглушка)
  const lockedWrap = document.createElement('div'); lockedWrap.id = 'lockedWrap'; lockedWrap.className = 'lockedWrap'; lockedWrap.style.display = 'none';
  lockedWrap.innerHTML = '<div class="lockcard"><svg viewBox="0 0 24 24" width="40" height="40"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="#8a8f99" stroke-width="1.8"/><path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="#8a8f99" stroke-width="1.8" stroke-linecap="round"/></svg><small>Закрытая карточка</small>' +
    '<button type="button" class="pill-btn buy">Открыть за 50 ★</button></div>';
  lockedWrap.querySelector('.buy').onclick = () => {
    const { o } = pubModalShell('<div class="lk">Закрытая карточка откроется за 50 звёзд. Оплата скоро появится — пока можно оформлять первую и вторую карточки.</div>');
    o.querySelector('.h span').textContent = T('Скоро'); trTree(o);
  };
  car.appendChild(L); car.appendChild(stageEl); car.appendChild(lockedWrap); car.appendChild(R);
  // iframe выходит за поля страницы до краёв секции, чтобы боковые карточки лежали прямо на её границе
  function setBleed() {
    try {
      // до внешнего края секции: поля обёртки раздела и самой секции (.main-container)
      let px = 0, el = frameEl.parentElement;
      while (el && el !== P.document.body) {
        px += parseFloat(P.getComputedStyle(el).paddingLeft) || 0;
        if (el.classList && el.classList.contains('main-container')) break;
        el = el.parentElement;
      }
      const own = parseFloat(P.getComputedStyle(frameEl.parentElement).paddingLeft) || 0;   // поля внутри секции остаются у остального содержимого
      frameEl.style.setProperty('--bleed', px + 'px');
      document.documentElement.style.setProperty('--padx', px + 'px');
      document.documentElement.style.setProperty('--padin', own + 'px');
    } catch (e) { /* ignore */ }
  }
  if (frameEl) { frameEl.classList.add('cd-bleed'); setBleed(); try { P.addEventListener('resize', setBleed); } catch (e) { /* ignore */ } }
  try { P.document.body.classList.add('cd-admin'); } catch (e) { /* ignore */ }
  L.addEventListener('click', () => goPeek(L.dataset.go));
  R.addEventListener('click', () => goPeek(R.dataset.go));

  // свайп: по боковым слотам и по полю вокруг карточки (само поле карточки и стикеры — наклон и перетаскивание)
  let sw = null;
  car.addEventListener('pointerdown', e => {
    if (e.target.closest('.card') || e.target.closest('.sticker') || e.target.closest('.bin')) { sw = null; return; }
    sw = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
  }, true);
  car.addEventListener('pointerup', e => {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y, dt = Date.now() - sw.t; sw = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 800) slotShift(dx > 0 ? -1 : 1);
  }, true);
  car.addEventListener('pointercancel', () => { sw = null; }, true);

  // фон карточки — выше блока «Выбранные»
  const trayBox = document.getElementById('trayBox');
  trayBox.parentNode.insertBefore(document.getElementById('bgRow'), trayBox);

  // кнопки: «Скачать» и «Опубликовать» вместо «Поделиться» и «Очистить»
  btnDl.textContent = 'Скачать'; btnDl.onclick = downloadCard;
  setupPublishButton();

  try { new ResizeObserver(layoutPeeks).observe(car); } catch (e) { window.addEventListener('resize', layoutPeeks); }
  renderPeeks();
  // превью второй карточки (последняя загруженная картинка)
  apiGet('Card/Get?kind=second').then(async d => { if (d.imageUrl && !previews.second) { const b = await cropServerPreview(d.imageUrl); if (b) setPreview('second', b); } }).catch(() => { /* пока нет данных */ });
}

/* ---- сердечко на странице просмотра (только для публичной чужой карточки; число лайков зрителю не показываем) */
function heartButton(liked) {
  const h = document.createElement('button'); h.type = 'button'; h.className = 'heart' + (liked ? ' on' : ''); h.setAttribute('aria-label', 'Нравится');
  h.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.4 5c2 0 3.7 1.1 5.6 3.2C13.9 6.1 15.6 5 17.6 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" stroke-width="2" stroke-linejoin="round"/></svg>';
  (document.getElementById('viewBar') || document.body).appendChild(h);
  return h;
}
function setupLike() {
  let authed = true;
  try { authed = authHeader() !== 'Tma invalid'; } catch (e) { authed = false; }
  if (!authed) {
    // лайк по ссылке может поставить любой: без входа сердечко ведёт в Telegram, где человек уже опознан
    if (!viewPublic) return;
    const h = heartButton(false);
    h.onclick = () => {
      toast(T('Откройте карточку в Telegram, чтобы поставить лайк'));
      const link = 'https://t.me/' + (CFG.BOT_USERNAME || 'NFTMatchBot') + '/find?startapp=c-' + encodeURIComponent(VIEW_ID);
      setTimeout(() => { try { P.open(link, '_blank'); } catch (e) { location.href = link; } }, 700);
    };
    return;
  }
  apiGet('Card/LikeState?c=' + encodeURIComponent(VIEW_ID)).then(st => {
    if (!st || !st.enabled) return;
    const h = heartButton(st.liked);
    let busy = false;
    h.onclick = async () => {
      if (busy) return; busy = true;
      const want = !h.classList.contains('on'); h.classList.toggle('on', want);
      try {
        const r = await fetch(api('Card/Like?c=' + encodeURIComponent(VIEW_ID) + '&like=' + want), { method: 'POST', headers: { 'Authorization': authHeader() } });
        if (!r.ok) { h.classList.toggle('on', !want); if (r.status === 429) toast(T('Слишком много лайков, попробуйте позже')); }
      } catch (e) { h.classList.toggle('on', !want); }
      busy = false;
    };
  }).catch(() => { /* лайк недоступен */ });
}

if (ADMIN_UI) initAdmin(); else if (!VIEW_ID) setupPublishButton();      // публикация и лайки открыты всем; карусель из трёх карточек — пока только у администратора

})();
