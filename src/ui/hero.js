// Écran d'accueil animé : une foule de petites pièces se balade aux pieds de Pixou,
// qui les suit du regard (ou suit le doigt / la souris). Taper une pièce la « rattrape ».

const INK = '#1D1D2C';
const COIN_COLORS = ['#FFFDF7', '#FFFDF7', '#FFFDF7', '#7C86C9', '#E8735A', '#7E9F4F'];

// Positions conservées entre deux rendus (ouverture d'une feuille, etc.).
let saved = null;

function walkerSvg(kind, color) {
  const body = kind === 'bill'
    ? `<rect x="5" y="12" width="30" height="20" rx="4" fill="#7E9F4F" stroke="${INK}" stroke-width="2.6"/>
       <circle cx="20" cy="22" r="5.5" fill="#FFFDF7" stroke="${INK}" stroke-width="1.6"/>
       <circle cx="15" cy="19" r="1.7" fill="${INK}"/><circle cx="25" cy="19" r="1.7" fill="${INK}"/>`
    : `<circle cx="20" cy="21" r="13" fill="${color}" stroke="${INK}" stroke-width="2.6"/>
       <circle cx="20" cy="21" r="8.5" fill="none" stroke="${INK}" stroke-width="1.3" opacity=".35"/>
       <circle cx="16.5" cy="19" r="1.8" fill="${INK}"/><circle cx="23.5" cy="19" r="1.8" fill="${INK}"/>
       <path d="M17 24.5q3 2.4 6 0" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 40 48" aria-hidden="true">
    <ellipse class="shadow" cx="27" cy="44" rx="13" ry="3.6" fill="${INK}" opacity=".16"/>
    <g class="sprite">
      <path class="leg-a" d="M16 32L14 43" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path class="leg-b" d="M24 32L26 43" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g class="body">${body}</g>
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
  const look = root.querySelector('.giant .look');
  const giant = root.querySelector('.giant svg');
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let W = root.clientWidth;
  let H = root.clientHeight;
  // Sur téléphone, la foule reste sous le visage de Pixou.
  const area = () => ({ xMax: W - 36, yMin: H * (W < 700 ? 0.42 : 0.3), yMax: H - 76 });
  const n = Math.max(14, Math.min(46, Math.round((W * H) / 15000)));

  const walkers = [];
  for (let i = 0; i < n; i += 1) {
    const prev = saved?.[i];
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
      el, kind, color,
      x: prev ? prev.rx * xMax : Math.random() * xMax,
      y: prev ? yMin + prev.ry * (yMax - yMin) : yMin + Math.random() * (yMax - yMin),
      heading: prev?.heading ?? Math.random() * Math.PI * 2,
      speed: 12 + Math.random() * 14,
      idle: Math.random() < 0.3 ? Math.random() * 2 : 0,
    };
    el.style.animationDelay = `${-Math.random()}s`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      catchWalker(w);
    });
    walkers.push(w);
  }

  // ----- Regard de la mascotte -----
  let pointer = null;
  let pointerAt = 0;
  let focus = walkers[0];
  let focusAt = 0;
  function aim(tx, ty) {
    if (!look || !giant) return;
    const r = giant.getBoundingClientRect();
    // centre des yeux dans le viewBox "0 -34 400 474" : (200, 212)
    const ex = r.left + (200 / 400) * r.width;
    const ey = r.top + ((212 + 34) / 474) * r.height;
    const dx = tx - ex;
    const dy = ty - ey;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(12, d / 25) / d;
    look.setAttribute('transform', `translate(${(dx * k).toFixed(1)} ${(dy * k).toFixed(1)})`);
  }
  const onPointer = (e) => { pointer = [e.clientX, e.clientY]; pointerAt = performance.now(); aim(e.clientX, e.clientY); };
  root.addEventListener('pointermove', onPointer);
  root.addEventListener('pointerdown', onPointer);

  // ----- Pièces rattrapées -----
  let caught = 0;
  function catchWalker(w) {
    caught += 1;
    w.idle = 0.7;
    w.el.classList.remove('hop');
    void w.el.offsetWidth; // relance l'animation
    w.el.classList.add('hop');
    const plus = document.createElement('span');
    plus.className = 'plus-one';
    plus.textContent = '+1';
    plus.style.transform = `translate(${w.x + 8}px, ${w.y - 12}px)`;
    crowd.append(plus);
    setTimeout(() => plus.remove(), 900);
    focus = w;
    focusAt = performance.now();
    onCatch?.(caught);
  }

  // ----- Boucle d'animation -----
  let raf = 0;
  let last = performance.now();
  function place(w) {
    w.el.style.transform = `translate3d(${w.x.toFixed(1)}px, ${w.y.toFixed(1)}px, 0)`;
    w.el.classList.toggle('flip', Math.cos(w.heading) < 0);
    w.el.classList.toggle('idle', w.idle > 0);
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const { xMax, yMin, yMax } = area();
    for (const w of walkers) {
      if (w.idle > 0) {
        w.idle -= dt;
      } else {
        w.heading += (Math.random() - 0.5) * 2.4 * dt;
        w.x += Math.cos(w.heading) * w.speed * dt;
        w.y += Math.sin(w.heading) * w.speed * 0.7 * dt;
        if (w.x < 0 || w.x > xMax) { w.heading = Math.PI - w.heading; w.x = Math.max(0, Math.min(xMax, w.x)); }
        if (w.y < yMin || w.y > yMax) { w.heading = -w.heading; w.y = Math.max(yMin, Math.min(yMax, w.y)); }
        if (Math.random() < 0.15 * dt) w.idle = 0.6 + Math.random() * 1.8;
      }
      place(w);
    }
    if (pointer && now - pointerAt < 2500) {
      aim(pointer[0], pointer[1]);
    } else {
      if (now - focusAt > 3200) { focus = walkers[Math.floor(Math.random() * walkers.length)]; focusAt = now; }
      const r = crowd.getBoundingClientRect();
      aim(r.left + focus.x + 18, r.top + focus.y + 20);
    }
    raf = requestAnimationFrame(tick);
  }

  const onResize = () => { W = root.clientWidth; H = root.clientHeight; };
  window.addEventListener('resize', onResize);

  walkers.forEach(place);
  if (reduced) {
    walkers.forEach((w) => w.el.classList.add('idle'));
  } else {
    raf = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    const { xMax, yMin, yMax } = area();
    saved = walkers.map((w) => ({
      kind: w.kind, color: w.color, heading: w.heading,
      rx: w.x / xMax, ry: (w.y - yMin) / (yMax - yMin),
    }));
  };
}
