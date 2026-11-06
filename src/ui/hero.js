// Écran d'accueil animé, vu de dessus :
// - Pixou, géant, marche vers le doigt / la souris (pas alternés, bras qui balancent,
//   traces de pas) et se promène tout seul quand on ne le guide pas ;
// - une foule de petites pièces se balade, papote (bulles), s'écarte en criant
//   « oups ! » quand Pixou approche, et suit le doigt des yeux ;
// - taper une pièce la « rattrape » (+1).

const INK = '#1D1D2C';
const CREAM = '#FFFDF7';
const CORAL = '#E8735A';
const CORAL_D = '#C9563F';
const OLIVE = '#7E9F4F';
const PERI = '#7C86C9';
const MUSTARD = '#F2B33D';
const SKIN = '#E7A584';
const COIN_COLORS = [CREAM, CREAM, CREAM, PERI, CORAL, OLIVE];
const CHATTER = ['ok', 'comme d\'hab', 'soldes ?', 'j\'épargne', 'promo !', 'on fait quoi ?', 'trop cher…', 'hmm', 'c\'est payé', 'budget !', 'cool', '+1 €', 'livret ?', 'quête !'];

// État conservé entre deux rendus (ouverture d'une feuille, etc.).
let saved = null;

const rnd = (a, b) => a + Math.random() * (b - a);

function walkerSvg(kind, color) {
  const eyes = kind === 'bill'
    ? `<circle cx="15" cy="19" r="2.6" fill="#fff" stroke="${INK}" stroke-width="1"/><circle cx="25" cy="19" r="2.6" fill="#fff" stroke="${INK}" stroke-width="1"/>
       <g class="pupils"><circle cx="15" cy="19" r="1.3" fill="${INK}"/><circle cx="25" cy="19" r="1.3" fill="${INK}"/></g>`
    : `<circle cx="16" cy="19" r="2.9" fill="#fff" stroke="${INK}" stroke-width="1"/><circle cx="24" cy="19" r="2.9" fill="#fff" stroke="${INK}" stroke-width="1"/>
       <g class="pupils"><circle cx="16" cy="19" r="1.5" fill="${INK}"/><circle cx="24" cy="19" r="1.5" fill="${INK}"/></g>
       <path d="M17 25q3 2.2 6 0" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
  const body = kind === 'bill'
    ? `<rect x="5" y="12" width="30" height="20" rx="4" fill="${OLIVE}" stroke="${INK}" stroke-width="2.6"/>
       <rect x="9" y="15.5" width="22" height="13" rx="2.5" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".35"/>${eyes}`
    : `<circle cx="20" cy="21" r="13" fill="${color}" stroke="${INK}" stroke-width="2.6"/>
       <circle cx="20" cy="21" r="9" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".3"/>${eyes}`;
  return `<svg viewBox="0 0 40 48" aria-hidden="true">
    <ellipse cx="29" cy="44" rx="13" ry="3.6" fill="${INK}" opacity=".16"/>
    <g class="sprite">
      <path class="leg-a" d="M16 32L14 43" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path class="leg-b" d="M24 32L26 43" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g class="body">${body}</g>
    </g>
  </svg>`;
}

// Pixou vu de dessus, tourné vers +x. Les parties mobiles sont pilotées en JS.
function giantSvg() {
  const curls = [[-30, -30], [0, -44], [30, -32], [-42, 4], [-14, -6], [18, -10], [44, 2], [-30, 34], [2, 30], [32, 36], [-4, 54], [50, -24]];
  const shoe = `<rect x="-30" y="-15" width="60" height="30" rx="15" fill="${CREAM}" stroke="${INK}" stroke-width="4.5"/>
    <path d="M12 -13.5A15 15 0 0 1 12 13.5L18 13.5A15 15 0 0 0 18 -13.5Z" fill="${CORAL}" stroke="${INK}" stroke-width="3"/>
    <path d="M-10 -6h12M-10 0h12M-10 6h12" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  const arm = (side) => `<path d="M0 ${side * 70}L44 ${side * 88}" stroke="${INK}" stroke-width="34" stroke-linecap="round"/>
      <path d="M0 ${side * 70}L44 ${side * 88}" stroke="${CORAL}" stroke-width="25" stroke-linecap="round"/>
      <circle cx="54" cy="${side * 92}" r="14" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
      ${side > 0 ? `<circle cx="66" cy="98" r="16" fill="${MUSTARD}" stroke="${INK}" stroke-width="4"/>
        <text x="66" y="104.5" text-anchor="middle" font-size="18" font-weight="800" fill="${INK}" font-family="system-ui,sans-serif">€</text>` : ''}`;
  return `<svg class="giant-svg" viewBox="-160 -160 320 320" aria-hidden="true">
    <ellipse class="g-shadow" cx="34" cy="28" rx="118" ry="100" fill="${INK}" opacity=".12"/>
    <g class="g-rot">
      <path class="leg-l" stroke="${INK}" stroke-width="36" stroke-linecap="round"/>
      <path class="leg-l-in" stroke="${PERI}" stroke-width="27" stroke-linecap="round"/>
      <path class="leg-r" stroke="${INK}" stroke-width="36" stroke-linecap="round"/>
      <path class="leg-r-in" stroke="${PERI}" stroke-width="27" stroke-linecap="round"/>
      <g class="foot-l">${shoe}</g>
      <g class="foot-r">${shoe}</g>
      <g class="arm-l">${arm(-1)}</g>
      <g class="arm-r">${arm(1)}</g>
      <g class="g-body">
        <ellipse cx="-6" cy="0" rx="50" ry="90" fill="${CORAL}" stroke="${INK}" stroke-width="5"/>
        <path d="M-6 -90A50 90 0 0 0 -6 90A40 80 0 0 1 -6 -90Z" fill="${CORAL_D}" opacity=".45"/>
        <ellipse cx="2" cy="0" rx="36" ry="40" fill="${OLIVE}" stroke="${INK}" stroke-width="4.5"/>
        <ellipse cx="72" cy="0" rx="9" ry="8" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
        <circle cx="62" cy="-18" r="12" fill="${CREAM}" stroke="${INK}" stroke-width="4.5"/>
        <circle cx="62" cy="18" r="12" fill="${CREAM}" stroke="${INK}" stroke-width="4.5"/>
        <circle cx="6" cy="0" r="64" fill="${INK}"/>
        ${curls.map(([x, y]) => `<path d="M${x + 6} ${y}q8-9 16-1" fill="none" stroke="${PERI}" stroke-width="4" stroke-linecap="round"/>`).join('')}
      </g>
    </g>
  </svg>`;
}

/**
 * Monte l'animation dans l'élément .hero. Renvoie une fonction de nettoyage.
 * @param {HTMLElement} root
 * @param {{ onCatch?: (count: number) => void }} [opts]
 */
export function mountHero(root, { onCatch } = {}) {
  const crowd = root.querySelector('.crowd');
  const prints = root.querySelector('.prints');
  const giantEl = root.querySelector('.giant-top');
  const titleEyes = [...root.querySelectorAll('.mark .eyes i')];
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let W = root.clientWidth;
  let H = root.clientHeight;
  const mobile = () => W < 700;
  const gSize = () => (mobile() ? 230 : 330); // largeur affichée du SVG du géant
  const gScale = () => gSize() / 320;
  const area = () => ({ xMax: W - 36, yMin: H * 0.14, yMax: H - 70 });

  // ----- Géant -----
  giantEl.innerHTML = giantSvg();
  const q = (s) => giantEl.querySelector(s);
  const parts = {
    rot: q('.g-rot'), body: q('.g-body'),
    footL: q('.foot-l'), footR: q('.foot-r'), armL: q('.arm-l'), armR: q('.arm-r'),
    legs: [q('.leg-l'), q('.leg-l-in'), q('.leg-r'), q('.leg-r-in')],
  };
  const g = saved?.giant
    ? { ...saved.giant, x: saved.giant.rx * W, y: saved.giant.ry * H }
    : { x: W * 0.5, y: H * (mobile() ? 0.17 : 0.16), angle: Math.PI / 2, speed: 0, phase: 0 };

  // ----- Foule -----
  const n = Math.max(26, Math.min(56, Math.round((W * H) / 12000)));
  const walkers = [];
  for (let i = 0; i < n; i += 1) {
    const prev = saved?.walkers?.[i];
    const kind = prev?.kind || (Math.random() < 0.22 ? 'bill' : 'coin');
    const color = prev?.color || COIN_COLORS[Math.floor(Math.random() * COIN_COLORS.length)];
    const { xMax, yMin, yMax } = area();
    const el = document.createElement('button');
    el.className = 'walker';
    el.type = 'button';
    el.tabIndex = -1;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = walkerSvg(kind, color);
    crowd.append(el);
    const w = {
      el, kind, color, pupils: el.querySelector('.pupils'),
      x: prev ? prev.rx * xMax : rnd(0, xMax),
      y: prev ? yMin + prev.ry * (yMax - yMin) : rnd(yMin, yMax),
      heading: prev?.heading ?? rnd(0, Math.PI * 2),
      speed: rnd(12, 26),
      idle: Math.random() < 0.3 ? rnd(0, 2) : 0,
      panic: 0,
      bubble: null,
    };
    el.style.animationDelay = `${-Math.random()}s`;
    el.addEventListener('click', (e) => { e.stopPropagation(); catchWalker(w); });
    walkers.push(w);
  }

  function say(w, text, alarm = false) {
    if (w.bubble) w.bubble.remove();
    const b = document.createElement('span');
    // Près des bords, la bulle s'ancre vers l'intérieur de l'écran.
    const edge = w.x > W - 90 ? ' to-left' : w.x < 50 ? ' to-right' : '';
    b.className = `bubble${alarm ? ' alarm' : ''}${edge}`;
    b.textContent = text;
    w.el.append(b);
    w.bubble = b;
    setTimeout(() => { if (w.bubble === b) { b.remove(); w.bubble = null; } }, alarm ? 1100 : 1700);
  }

  // ----- Pointeur -----
  let pointer = null;
  let pointerAt = -1e9;
  let wander = { x: g.x, y: g.y, until: 0 };
  const toLocal = (e) => {
    const r = root.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const onMove = (e) => { pointer = toLocal(e); pointerAt = performance.now(); };
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerdown', onMove);

  // ----- Pièces rattrapées -----
  let caught = 0;
  function catchWalker(w) {
    caught += 1;
    w.idle = 0.7;
    w.el.classList.remove('hop');
    void w.el.offsetWidth;
    w.el.classList.add('hop');
    const plus = document.createElement('span');
    plus.className = 'plus-one';
    plus.textContent = '+1';
    plus.style.transform = `translate(${w.x + 8}px, ${w.y - 12}px)`;
    crowd.append(plus);
    setTimeout(() => plus.remove(), 900);
    onCatch?.(caught);
  }

  // ----- Traces de pas -----
  function footprint(x, y, angle) {
    if (!prints || prints.childElementCount > 24) return;
    const f = document.createElement('i');
    f.className = 'print';
    f.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
    prints.append(f);
    setTimeout(() => f.remove(), 2600);
  }

  // ----- Rendu du géant -----
  function drawGiant() {
    const size = gSize();
    giantEl.style.width = `${size}px`;
    giantEl.style.transform = `translate3d(${(g.x - size / 2).toFixed(1)}px, ${(g.y - size / 2).toFixed(1)}px, 0)`;
    const walk = Math.min(1, g.speed / 60);
    const stride = 34 * walk;
    const sw = Math.sin(g.phase);
    const lift = Math.abs(Math.cos(g.phase)) * walk; // pied en l'air entre deux appuis
    const fl = sw * stride;
    const fr = -sw * stride;
    parts.rot.setAttribute('transform', `rotate(${(g.angle * 180) / Math.PI})`);
    parts.footL.setAttribute('transform', `translate(${(32 + fl).toFixed(1)} -34) scale(${(1 + (sw > 0 ? lift : 0) * 0.12).toFixed(3)})`);
    parts.footR.setAttribute('transform', `translate(${(32 + fr).toFixed(1)} 34) scale(${(1 + (sw < 0 ? lift : 0) * 0.12).toFixed(3)})`);
    const legL = `M-4 -34L${(28 + fl).toFixed(1)} -34`;
    const legR = `M-4 34L${(28 + fr).toFixed(1)} 34`;
    parts.legs[0].setAttribute('d', legL); parts.legs[1].setAttribute('d', legL);
    parts.legs[2].setAttribute('d', legR); parts.legs[3].setAttribute('d', legR);
    // Bras opposés aux jambes.
    parts.armL.setAttribute('transform', `rotate(${(-sw * 22 * walk).toFixed(1)} 0 -70)`);
    parts.armR.setAttribute('transform', `rotate(${(-sw * 22 * walk).toFixed(1)} 0 70)`);
    parts.body.setAttribute('transform', `scale(${(1 + lift * 0.025).toFixed(3)}) rotate(${(sw * 4 * walk).toFixed(1)})`);
    // L'ombre (hors du groupe tourné) reste orientée comme la lumière, vers le bas-droite.
  }

  // ----- Boucle -----
  let raf = 0;
  let last = performance.now();
  let nextChatter = 0;
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const { xMax, yMin, yMax } = area();
    const s = gScale();

    // Cible du géant : le pointeur s'il a bougé récemment, sinon une balade.
    let target;
    if (pointer && now - pointerAt < 3500) {
      target = pointer;
    } else {
      if (now > wander.until || Math.hypot(wander.x - g.x, wander.y - g.y) < 20) {
        // Sans guide, Pixou flâne surtout dans le haut de l'écran, au-dessus du titre.
        wander = { x: rnd(W * 0.15, W * 0.85), y: rnd(H * 0.08, H * (mobile() ? 0.36 : 0.5)), until: now + rnd(4000, 7000) };
      }
      target = [wander.x, wander.y];
    }
    const dx = target[0] - g.x;
    const dy = target[1] - g.y;
    const dist = Math.hypot(dx, dy);
    const maxSpeed = (mobile() ? 95 : 140) * (pointer && now - pointerAt < 3500 ? 1 : 0.6);
    const want = dist > 24 ? Math.min(maxSpeed, dist * 1.4) : 0;
    g.speed += (want - g.speed) * Math.min(1, dt * 3);
    if (dist > 24) {
      const ta = Math.atan2(dy, dx);
      let da = ta - g.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      g.angle += da * Math.min(1, dt * 4);
    }
    g.x += Math.cos(g.angle) * g.speed * dt;
    g.y += Math.sin(g.angle) * g.speed * dt;
    g.x = Math.max(40, Math.min(W - 40, g.x));
    g.y = Math.max(40, Math.min(H - 40, g.y));
    const prevPhase = g.phase;
    g.phase += (g.speed / 38) * dt * Math.PI;
    if (g.speed < 4) g.phase += (Math.round(g.phase / Math.PI) * Math.PI - g.phase) * Math.min(1, dt * 6);
    // Une trace à chaque appui.
    if (Math.floor(g.phase / Math.PI) !== Math.floor(prevPhase / Math.PI) && g.speed > 15) {
      const side = Math.floor(g.phase / Math.PI) % 2 === 0 ? -1 : 1;
      const fx = g.x + (Math.cos(g.angle) * 32 * s) - Math.sin(g.angle) * side * 34 * s;
      const fy = g.y + (Math.sin(g.angle) * 32 * s) + Math.cos(g.angle) * side * 34 * s;
      footprint(fx, fy, g.angle);
    }
    drawGiant();

    // Foule.
    const fear = 150 * s;
    const look = pointer && now - pointerAt < 3500 ? pointer : [g.x, g.y];
    for (const w of walkers) {
      const cx = w.x + 18;
      const cy = w.y + 24;
      const gd = Math.hypot(cx - g.x, cy - g.y);
      if (gd < fear && g.speed > 10) {
        if (w.panic <= 0 && Math.random() < 0.5) say(w, ['oups !', 'aïe !', 'ouh là', 'pardon !'][Math.floor(Math.random() * 4)], true);
        w.panic = 0.9;
        w.idle = 0;
        w.heading = Math.atan2(cy - g.y, cx - g.x) + rnd(-0.4, 0.4);
      }
      if (w.panic > 0) w.panic -= dt;
      if (w.idle > 0) {
        w.idle -= dt;
      } else {
        const sp = w.speed * (w.panic > 0 ? 3.4 : 1);
        if (w.panic <= 0) w.heading += (Math.random() - 0.5) * 2.4 * dt;
        w.x += Math.cos(w.heading) * sp * dt;
        w.y += Math.sin(w.heading) * sp * 0.75 * dt;
        if (w.x < 0 || w.x > xMax) { w.heading = Math.PI - w.heading; w.x = Math.max(0, Math.min(xMax, w.x)); }
        if (w.y < yMin || w.y > yMax) { w.heading = -w.heading; w.y = Math.max(yMin, Math.min(yMax, w.y)); }
        if (w.panic <= 0 && Math.random() < 0.15 * dt) w.idle = rnd(0.6, 2.4);
      }
      w.el.style.transform = `translate3d(${w.x.toFixed(1)}px, ${w.y.toFixed(1)}px, 0)`;
      w.el.classList.toggle('flip', Math.cos(w.heading) < 0);
      w.el.classList.toggle('idle', w.idle > 0);
      w.el.classList.toggle('panic', w.panic > 0);
      // Les yeux suivent le doigt (ou Pixou).
      const ex = look[0] - cx;
      const ey = look[1] - cy;
      const ed = Math.hypot(ex, ey) || 1;
      const flip = Math.cos(w.heading) < 0 ? -1 : 1;
      w.pupils.setAttribute('transform', `translate(${((ex / ed) * 1.4 * flip).toFixed(2)} ${((ey / ed) * 1.4).toFixed(2)})`);
    }

    // Les yeux du titre suivent le doigt (ou Pixou quand on ne touche à rien).
    const rr = root.getBoundingClientRect();
    for (const eye of titleEyes) {
      const r = eye.getBoundingClientRect();
      const ex = look[0] + rr.left - (r.left + r.width / 2);
      const ey = look[1] + rr.top - (r.top + r.height / 2);
      const ed = Math.hypot(ex, ey) || 1;
      const m = r.width * 0.22;
      eye.style.setProperty('--px', `${((ex / ed) * m).toFixed(1)}px`);
      eye.style.setProperty('--py', `${((ey / ed) * m).toFixed(1)}px`);
    }

    // Papotage.
    if (now > nextChatter) {
      const w = walkers[Math.floor(Math.random() * walkers.length)];
      if (!w.bubble && w.panic <= 0) say(w, CHATTER[Math.floor(Math.random() * CHATTER.length)]);
      nextChatter = now + rnd(500, 1300);
    }
    raf = requestAnimationFrame(tick);
  }

  const onResize = () => { W = root.clientWidth; H = root.clientHeight; };
  window.addEventListener('resize', onResize);

  drawGiant();
  for (const w of walkers) w.el.style.transform = `translate3d(${w.x}px, ${w.y}px, 0)`;
  if (reduced) {
    walkers.forEach((w) => w.el.classList.add('idle'));
  } else {
    raf = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    const { xMax, yMin, yMax } = area();
    saved = {
      giant: { ...g, rx: g.x / W, ry: g.y / H },
      walkers: walkers.map((w) => ({ kind: w.kind, color: w.color, heading: w.heading, rx: w.x / xMax, ry: (w.y - yMin) / (yMax - yMin) })),
    };
  };
}
