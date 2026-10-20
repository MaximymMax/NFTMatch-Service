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
const WORDS = ['BOLD', 'FERN', 'ARCH', 'MINT', 'LAKE', 'WOLF', 'JADE', 'PINE', 'ECHO', 'OPAL', 'DUSK', 'REED'];
engrave.children[0].innerHTML = WORDS.slice(0, 6).map(w => '<b style="font-weight:inherit">' + w + '</b>').join('');
engrave.children[1].innerHTML = WORDS.slice(6).map(w => '<b style="font-weight:inherit">' + w + '</b>').join('');

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
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  root.setProperty('--accent', rgb2css(accent));
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
let last = performance.now();
function frame(now) {
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
function obstacles(inflate) {
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
  el.appendChild(staticArt(st.id));
  stickersEl.appendChild(el); stickerEls.set(st.id, el);
  return el;
}

/* ---- put a gift on the card at a given place. fromRect = client rect it grows out of (dragged copy / tile) */
function addToCard(gid, loc, sc, r, fromRect) {
  const list = state.stickers.slice().sort((a, b) => a.t - b.t);
  while (state.stickers.length >= MAX_STICKERS) evict(list.shift());           // 11th sticker: the oldest goes back to the list
  const st = { id: gid, x: loc.x / cardW, y: loc.y / cardH, sc, r: r || 0, z: ++zSeq, t: ++tSeq };
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
  if (r) flyBack(st.id, r, rot);
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
  if (e.button > 0 || G) return false;
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
  else if (G.center && !getSt(G.gid)) startCarry(e, null);                    // only from the middle of a tile, and only if it is not on the card yet
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
  const gid = st ? st.id : G.gid;
  menu.hidden = true; hideHint();
  const c = { gid, fromCard: !!st, st, x: e.clientX, y: e.clientY, hist: [], rot: 0, size: 0, hot: false, inCard: false, ox: 0, oy: 0 };
  let cx, cy;
  if (st) {
    const el = stickerEls.get(gid), r = el.getBoundingClientRect();
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
    const st = c.st, el = stickerEls.get(c.gid);
    if (!el || !getSt(c.gid)) return;
    el.style.opacity = '';
    if (cancelled) { placeSticker(st, 'ease'); return; }
    if (c.hot) { detach(c.gid); flyToBin(gr, c.gid); return; }
    if (inside) {                                                                   // dropped on the card: stays exactly there, no collision checks
      st.x = spot.x / cardW; st.y = spot.y / cardH; st.z = ++zSeq;
      landFrom(st, el, gr);
      save(); patDirty = true; return;
    }
    const r = st.r; detach(c.gid); flyBack(c.gid, gr, r);                          // dropped anywhere else: back to the list
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
  else if (c.inCard) { size = U() * 1.24 * clientScale(); rotT = c.fromCard ? (c.origin.r || 0) : 0; }
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
  if (rev) { if (rev.prev) layers.push({ id: rev.prev, out: true }); if (rev.next) layers.push({ id: rev.next, out: false }); }
  else if (state.colorId) layers.push({ id: state.colorId, out: false });
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
  updateOverlaps();
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
const api = p => (CFG.SERVER_BASE_URL || '') + '/api/' + p;
function authHeader() { try { if (P.NFTAuth) return P.NFTAuth.getApiAuthHeader(); } catch (e) { /* ignore */ } return 'Tma invalid'; }
const imgUrl = (g, m) => 'https://cdn.changes.tg/gifts/models/' + encodeURIComponent(g) + '/png/' + encodeURIComponent(m) + '.png';
const sid = (g, m) => g + '|' + m;
const splitId = id => { const i = id.indexOf('|'); return [id.slice(0, i), id.slice(i + 1)]; };
async function apiGet(path) {
  const r = await fetch(api(path), { headers: { 'Authorization': authHeader() } });
  if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
  return r.json();
}

/* картинка стикера: PNG модели (вместо Lottie из примера) */
function staticArt(gid) {
  const [g, m] = splitId(gid);
  const wrap = document.createElement('div'); wrap.className = 'lot';
  const img = new Image(); img.decoding = 'async'; img.draggable = false; img.alt = m; img.src = imgUrl(g, m);
  wrap.appendChild(img);
  return wrap;
}

/* ---- сохранение на бэкенде (после каждого изменения, с задержкой) */
const statusEl = document.getElementById('status');
function setStatus(text, err) { statusEl.textContent = text; statusEl.classList.toggle('err', !!err); }
let loaded = false, dirty = false, saving = false, saveTimer = null;
function save() {
  if (!loaded) return;
  dirty = true; setStatus('Сохраняю…');
  clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 600);
}
async function flushSave(keepalive) {
  if (!loaded || !dirty) return;
  if (saving) { saveTimer = setTimeout(flushSave, 300); return; }
  saving = true; dirty = false;
  const body = JSON.stringify({
    stickers: state.stickers.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).map(s => {
      const [gift, model] = splitId(s.id);
      return { gift, model, x: +s.x.toFixed(4), y: +s.y.toFixed(4), r: +wrap180(s.r || 0).toFixed(1), sc: +s.sc.toFixed(3) };
    })
  });
  try {
    const r = await fetch(api('Card/Save'), { method: 'PUT', keepalive: keepalive === true, headers: { 'Authorization': authHeader(), 'Content-Type': 'application/json' }, body });
    if (!r.ok) throw new Error(r.status);
    if (!dirty) setStatus('Сохранено ✓');
  } catch (e) {
    dirty = true; setStatus('Не удалось сохранить — повторю', true);
    clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 4000);
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
function addModelTile(gift, model) {
  const id = sid(gift, model);
  const t = document.createElement('div');
  t.className = 'tile'; t.dataset.id = id; t.title = model + ' — ' + gift;
  t.innerHTML = '<div class="art"></div><b></b><small></small>';
  t.firstChild.appendChild(staticArt(id));
  const zone = document.createElement('div'); zone.className = 'zone'; t.firstChild.appendChild(zone);
  t.children[1].textContent = model; t.children[2].textContent = gift;
  gridEl.appendChild(t); tiles.set(id, t);
  bindTile(t, { id });
}
function refreshTiles() {
  tiles.forEach((t, id) => {
    const art = t.firstChild;
    art.querySelectorAll('.onc').forEach(n => n.remove());
    if (getSt(id)) { const o = document.createElement('span'); o.className = 'onc'; o.textContent = 'На карточке'; art.appendChild(o); }
  });
  document.getElementById('count').textContent = state.stickers.length + ' / ' + MAX_STICKERS;
  document.getElementById('btnClear').disabled = !state.stickers.length;
}

/* ---- меню по долгому нажатию: единственное действие — добавить / убрать */
function openMenu(id, tile) {
  const onCard = !!getSt(id);
  menu.innerHTML = '<button data-a="sticker">' + (onCard ? ICON_REMOVE : ICON_ADD) + '<span>' + (onCard ? 'Убрать с карточки' : 'Добавить на карточку') + '</span></button>';
  menu.hidden = false;
  const a = app.getBoundingClientRect(), r = tile.getBoundingClientRect();
  let x = r.left - a.left + r.width * .5 - 20, y = r.top - a.top + r.height * .55;
  x = clamp(x, 10, a.width - 230); y = clamp(y, 10, Math.max(10, a.height - 70));
  menu.style.left = x + 'px'; menu.style.top = y + 'px';
  menu.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    menu.hidden = true;
    if (onCard) evict(getSt(id)); else autoAdd(id);
  };
}
document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('.menu')) menu.hidden = true; }, true);

/* ---- каталог с фильтрами: коллекции / модели / тематики (+ поиск внутри выбранного фильтра) */
const qEl = document.getElementById('q'), crumbs = document.getElementById('crumbs'), moreBtn = document.getElementById('btnMore');
const filtersEl = document.getElementById('filters');
const PAGE = 60;
const PLACEHOLDERS = { collections: 'Найти коллекцию…', models: 'Найти модель или коллекцию…', themes: 'Найти тематику…' };
let tab = 'collections', sel = null, collections = null, ver = 0, offset = 0;   // sel = { type: 'gift' | 'theme', key, title }

function clearGrid() { gridEl.innerHTML = ''; tiles.clear(); }
const words = s => s.toLowerCase().split(/\s+/).filter(Boolean);
const errText = e => e.status === 403 ? 'Раздел доступен только администратору' : 'Не удалось загрузить данные';

function setTab(t) {
  tab = t; sel = null; qEl.value = ''; qEl.placeholder = PLACEHOLDERS[t];
  filtersEl.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  refresh();
}
function refresh() {
  ver++; offset = 0; clearGrid(); moreBtn.hidden = true; noteEl.textContent = '';
  crumbs.hidden = !sel;
  document.getElementById('crumbTitle').textContent = sel ? sel.title : '';
  const q = qEl.value.trim();
  if (sel || tab === 'models') fetchModels(q);
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
let searchT;
qEl.addEventListener('input', () => { clearTimeout(searchT); searchT = setTimeout(refresh, 250); });
moreBtn.onclick = () => { const q = qEl.value.trim(); if (sel || tab === 'models') fetchModels(q); else fetchThemes(q); };
filtersEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });
document.getElementById('btnBack').onclick = () => { sel = null; qEl.value = ''; refresh(); };
document.getElementById('btnClear').onclick = () => {
  if (state.stickers.length && confirm('Убрать все стикеры с карточки?')) state.stickers.slice().forEach(s => detach(s.id));
};

/* ================================================================== init */
const user = (() => { try { return P.NFTAuth && P.NFTAuth.getUser(); } catch (e) { return null; } })();
if (user && user.username) document.getElementById('holder').textContent = ('@' + user.username).toUpperCase();

applyTheme(false);
resize();
requestAnimationFrame(frame);
setTab('collections');
(async function loadCard() {
  try {
    const data = await apiGet('Card/Get');
    const minS = px(32) / U();
    (data.stickers || []).slice(0, MAX_STICKERS).forEach(s => {
      const st = { id: sid(s.gift, s.model), x: +s.x, y: +s.y, sc: clamp(+s.sc || 1, minS, SC_MAX), r: +s.r || 0, z: ++zSeq, t: ++tSeq };
      state.stickers.push(st); createStickerEl(st); placeSticker(st, 'instant');
    });
    loaded = true; refreshTiles();
  } catch (e) {
    // loaded остаётся false: пустой экран не затрёт сохранённую карточку
    setStatus(e.status === 403 ? 'Раздел доступен только администратору' : 'Не удалось загрузить карточку — обновите страницу', true);
  }
})();


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
window.__card = { state, addToCard, evict, autoAdd, findPlacement, select, tiltTarget, get carry() { return carry; } };

})();
