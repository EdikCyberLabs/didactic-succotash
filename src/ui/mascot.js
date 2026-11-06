// « Pixou », la mascotte de PixelBudget : un personnage illustré (aplats + contours
// encrés) qui brandit une pièce. Il s'équipe en montant de niveau :
// bandeau au niveau 3, couronne au niveau 5.

const INK = '#1D1D2C';
const SKIN = '#E7A584';
const SKIN_D = '#CF8566';
const CORAL = '#E8735A';
const CORAL_D = '#C9563F';
const OLIVE = '#7E9F4F';
const PERI = '#7C86C9';
const MUSTARD = '#F2B33D';
const CREAM = '#FFFDF7';

let uid = 0;

// Silhouette « afro » : une couronne de boucles + un remplissage central.
const HAIR_BACK = [[96, 176, 38], [92, 132, 40], [112, 92, 42], [146, 62, 44], [190, 48, 46], [236, 52, 44],
  [276, 74, 42], [304, 110, 40], [312, 152, 38], [306, 190, 32], [100, 206, 26], [302, 210, 22]];
const FRINGE = [[132, 146, 22], [160, 128, 26], [196, 120, 28], [234, 124, 26], [266, 140, 22], [286, 166, 16], [118, 168, 15]];
const CURLS = ['M118 112q10-12 22-3', 'M150 76q12-10 24 0', 'M204 64q12-8 22 4', 'M262 88q12-4 18 8', 'M290 136q8 6 6 18',
  'M104 150q-2-12 8-18', 'M178 100q10-8 20 0', 'M236 98q10-6 18 4', 'M150 132q8-8 18-2', 'M224 118q10-6 18 2', 'M300 182q2 8-4 14'];

/**
 * @param {number} level  niveau du joueur (accessoires)
 * @param {number} size   largeur en px
 * @param {object} [opts]
 * @param {[number, number]} [opts.look]  décalage des pupilles (regard), -12..12
 * @param {'bust'|'head'|'icon'} [opts.crop]  cadrage
 * @param {boolean} [opts.alive]           clignement des yeux (animation CSS)
 */
export function mascot(level = 1, size = 260, { look = [0, 4], crop = 'bust', alive = false } = {}) {
  const id = `m${uid++}`;
  const FRAMES = { bust: [0, -34, 400, 474], head: [64, -34, 272, 364], icon: [70, 34, 260, 290] };
  const [vx, vy, vw, vh] = FRAMES[crop] || FRAMES.bust;
  const viewBox = `${vx} ${vy} ${vw} ${vh}`;
  const height = Math.round((size * vh) / vw);
  const headPath = 'M114 196C114 136 152 108 200 108C250 108 288 136 288 196C288 268 250 316 200 316C150 316 114 268 114 196Z';
  const mouthPath = 'M172 268Q200 300 228 268Q200 276 172 268Z';

  const accessory = level >= 5
    ? `<g stroke="${INK}" stroke-width="5" stroke-linejoin="round" transform="translate(0 20)">
        <path d="M140 36 L148 -14 L176 12 L200 -24 L224 12 L252 -14 L260 36 Z" fill="${MUSTARD}"/>
        <path d="M142 26 H258" stroke-width="3" fill="none"/>
        <circle cx="200" cy="-24" r="7" fill="${CORAL}" stroke-width="3"/><circle cx="148" cy="-14" r="5" fill="${PERI}" stroke-width="3"/><circle cx="252" cy="-14" r="5" fill="${OLIVE}" stroke-width="3"/>
        <circle cx="200" cy="16" r="6" fill="${PERI}" stroke-width="3"/>
      </g>`
    : level >= 3
      ? `<path d="M104 126Q200 80 296 126L292 144Q200 100 108 144Z" fill="${PERI}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
         <path d="M286 126l22-14 6 22-24 4z" fill="${PERI}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
      : '';

  return `<svg class="mascot${alive ? ' alive' : ''}" width="${size}" height="${height}" viewBox="${viewBox}" role="img" aria-label="Pixou, la mascotte (niveau ${level})">
  <defs>
    <clipPath id="${id}-head"><path d="${headPath}"/></clipPath>
    <clipPath id="${id}-lens"><circle cx="164" cy="212" r="27"/><circle cx="236" cy="212" r="27"/></clipPath>
    <clipPath id="${id}-mouth"><path d="${mouthPath}"/></clipPath>
  </defs>

  <!-- Corps : veste corail, col roulé olive, chaîne dorée -->
  <path d="M40 440C46 372 104 336 168 330L200 352L232 330C296 336 354 372 360 440Z" fill="${CORAL}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M44 440C50 380 100 344 160 336L150 366C104 378 80 404 76 440Z" fill="${CORAL_D}" opacity=".45"/>
  <path d="M176 340L200 440L224 340Q200 362 176 340Z" fill="${OLIVE}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <g fill="none" stroke="${CORAL_D}" stroke-width="3.5" stroke-linecap="round">
    <path d="M84 404Q96 384 116 372"/><path d="M70 428Q84 404 106 390"/><path d="M98 434Q108 414 124 404"/>
    <path d="M300 372Q318 382 326 400"/>
  </g>
  <path d="M172 336L194 440M228 336L206 440" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>

  <!-- Cheveux (arrière) -->
  <g fill="${INK}">
    ${HAIR_BACK.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}
    <ellipse cx="200" cy="132" rx="108" ry="84"/>
  </g>

  <!-- Oreilles + boucle d'oreille -->
  <ellipse cx="110" cy="222" rx="17" ry="23" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
  <ellipse cx="290" cy="222" rx="17" ry="23" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
  <circle cx="106" cy="250" r="8" fill="none" stroke="${MUSTARD}" stroke-width="5"/>
  <circle cx="106" cy="250" r="8" fill="none" stroke="${INK}" stroke-width="1.5" opacity=".6"/>

  <!-- Cou + col roulé -->
  <path d="M170 288L170 344Q200 360 230 344L230 288Z" fill="${SKIN}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M172 300Q200 330 228 300L228 320Q200 342 172 320Z" fill="${SKIN_D}" opacity=".75"/>
  <path d="M164 322Q200 346 236 322L238 344Q200 370 162 344Z" fill="${OLIVE}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M172 344Q200 402 228 344" fill="none" stroke="${MUSTARD}" stroke-width="5" stroke-linecap="round"/>
  <path d="M172 344Q200 402 228 344" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="2 5" stroke-linecap="round"/>
  <circle cx="200" cy="384" r="15" fill="${MUSTARD}" stroke="${INK}" stroke-width="4"/>
  <text x="200" y="390" text-anchor="middle" font-size="17" font-weight="800" fill="${INK}" font-family="system-ui,sans-serif">€</text>

  <!-- Visage -->
  <path d="${headPath}" fill="${SKIN}"/>
  <g clip-path="url(#${id}-head)">
    <path d="M250 112C312 160 300 272 206 320L300 330L310 100Z" fill="${SKIN_D}" opacity=".35"/>
    <path d="M110 160Q200 138 290 160L290 192Q200 166 110 192Z" fill="${SKIN_D}" opacity=".55"/>
  </g>
  <path d="${headPath}" fill="none" stroke="${INK}" stroke-width="5"/>

  <!-- Taches de rousseur + joues -->
  <g fill="${CORAL_D}" opacity=".7">
    <circle cx="146" cy="248" r="2.4"/><circle cx="156" cy="255" r="2.4"/><circle cx="140" cy="257" r="2.2"/>
    <circle cx="254" cy="248" r="2.4"/><circle cx="244" cy="255" r="2.4"/><circle cx="260" cy="257" r="2.2"/>
  </g>
  <ellipse cx="146" cy="266" rx="16" ry="9" fill="${CORAL}" opacity=".42"/>
  <ellipse cx="254" cy="266" rx="16" ry="9" fill="${CORAL}" opacity=".42"/>

  <!-- Frange (devant) + reflets -->
  <g fill="${INK}">${FRINGE.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
  <g fill="none" stroke="${PERI}" stroke-width="4" stroke-linecap="round" opacity=".95">${CURLS.map((d) => `<path d="${d}"/>`).join('')}</g>
  ${accessory}

  <!-- Sourcils -->
  <path d="M144 176Q164 164 186 173M214 173Q236 164 256 176" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>

  <!-- Lunettes + yeux (les pupilles suivent le regard) -->
  <circle cx="164" cy="212" r="29" fill="${CREAM}"/><circle cx="236" cy="212" r="29" fill="${CREAM}"/>
  <g clip-path="url(#${id}-lens)">
    <g class="look" transform="translate(${look[0]} ${look[1]})">
      <g class="blink">
        <circle cx="164" cy="212" r="11.5" fill="${INK}"/><circle cx="236" cy="212" r="11.5" fill="${INK}"/>
        <circle cx="168.5" cy="207" r="3.6" fill="#fff"/><circle cx="240.5" cy="207" r="3.6" fill="#fff"/>
      </g>
    </g>
  </g>
  <g fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round">
    <circle cx="164" cy="212" r="29"/><circle cx="236" cy="212" r="29"/>
    <path d="M193 208Q200 199 207 208"/><path d="M135 206L114 200M265 206L286 200"/>
  </g>
  <path d="M146 198Q151 189 161 187M218 198Q223 189 233 187" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>

  <!-- Nez + bouche -->
  <path d="M200 224Q189 246 198 250Q205 252 211 247" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${mouthPath}" fill="${INK}"/>
  <g clip-path="url(#${id}-mouth)">
    <path d="M176 270Q200 280 224 270L222 277Q200 285 178 277Z" fill="${CREAM}"/>
    <ellipse cx="200" cy="288" rx="12" ry="6" fill="${CORAL}"/>
  </g>
  <path d="${mouthPath}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>

  ${crop !== 'bust' ? '' : `
  <!-- Bras + main qui brandit une pièce -->
  <path d="M286 440L300 376Q330 392 356 376L344 440Z" fill="${CORAL}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="320" cy="318" r="38" fill="${MUSTARD}" stroke="${INK}" stroke-width="5"/>
  <circle cx="320" cy="318" r="28" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".45"/>
  <text x="320" y="331" text-anchor="middle" font-size="36" font-weight="800" fill="${INK}" font-family="system-ui,sans-serif">€</text>
  <path d="M298 300Q304 288 316 284" fill="none" stroke="${CREAM}" stroke-width="4" stroke-linecap="round"/>
  <path d="M288 352C286 338 300 330 314 334L342 338C354 342 356 360 346 370C336 382 302 386 292 374Z" fill="${SKIN}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M300 348Q314 343 326 349M298 360Q312 355 326 361" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <g stroke="${INK}" stroke-width="4" stroke-linecap="round"><path d="M372 270v20M362 280h20"/><path d="M352 236v12M346 242h12"/></g>`}
</svg>`;
}
