// Icônes « trait » (24×24, contour) et illustrations SVG originales.

const P = {
  alimentation: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H5.1"/>',
  restaurants: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3Zm0 0v7"/>',
  transport: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M12 3v8"/><path d="m8 18-2 4M16 18l2 4"/><circle cx="8.5" cy="14.5" r=".6"/><circle cx="15.5" cy="14.5" r=".6"/>',
  logement: '<path d="M3 10 12 3l9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V13h6v9"/>',
  abonnements: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/>',
  shopping: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  loisirs: '<rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4"/><circle cx="15" cy="13" r=".8"/><circle cx="18" cy="11" r=".8"/>',
  sante: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  revenus: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  transferts: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  autre: '<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
  sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16"/><path d="M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0Z"/>',
  home: '<path d="M3 10 12 3l9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V13h6v9"/>',
  bank: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l9 5H3Z"/>',
  dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.7 2.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.7-2.7L3 16"/><path d="M8 16H3v5"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  sparkle: '<path d="M12 3v18M3 12h18"/>',
};

export function icon(name, size = 20, extra = '') {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[name] || P.autre}</svg>`;
}

/**
 * Mascotte « Pixou », tirelire à lunettes. Elle s'équipe en montant de niveau :
 * casquette dès le niveau 3, couronne dès le niveau 5.
 */
export function mascot(level = 1, size = 260) {
  const ink = '#1D1D2C';
  const pig = '#F4A7A0';
  const pigDark = '#E8857B';
  const hat = level >= 5
    ? `<path d="M96 62 L104 34 L120 50 L136 30 L148 50 L164 34 L168 62 Z" fill="#F2B33D" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
       <circle cx="136" cy="30" r="5" fill="#E8735A" stroke="${ink}" stroke-width="3"/>`
    : level >= 3
      ? `<path d="M92 70c4-22 24-34 46-32s38 16 38 34Z" fill="#7C86C9" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
         <path d="M168 70c14 0 26 3 30 9" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`
      : `<circle cx="132" cy="44" r="17" fill="#F2B33D" stroke="${ink}" stroke-width="4"/>
         <text x="132" y="51" text-anchor="middle" font-size="19" font-weight="800" fill="${ink}" font-family="system-ui">€</text>`;
  return `<svg class="mascot" width="${size}" height="${size}" viewBox="0 0 280 260" role="img" aria-label="Pixou, la mascotte (niveau ${level})">
    <ellipse cx="135" cy="236" rx="78" ry="9" fill="${ink}" opacity=".15"/>
    <g fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round">
      <path d="M24 40v24M12 52h24"/><path d="M240 120v20M230 130h20"/><path d="M40 160v14M33 167h14"/>
    </g>
    <circle cx="232" cy="52" r="9" fill="#7E9F4F" stroke="${ink}" stroke-width="3"/>
    <circle cx="38" cy="112" r="6" fill="#E8735A" stroke="${ink}" stroke-width="3"/>
    <rect x="216" y="196" width="14" height="14" rx="3" fill="#7C86C9" stroke="${ink}" stroke-width="3" transform="rotate(18 223 203)"/>
    ${[88, 110, 152, 174].map((x) => `<rect x="${x}" y="190" width="20" height="38" rx="7" fill="${pig}" stroke="${ink}" stroke-width="4"/>`).join('')}
    <path d="M212 148c16-6 22 10 10 16-9 4-12-9 0-12" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M78 96 70 58l38 22Z" fill="${pigDark}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M162 80l38-22-6 38Z" fill="${pigDark}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="135" cy="148" rx="86" ry="66" fill="${pig}" stroke="${ink}" stroke-width="4"/>
    <rect x="116" y="88" width="34" height="8" rx="4" fill="${ink}"/>
    ${hat}
    <path d="M86 122h-14M184 122h14" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="108" cy="126" r="21" fill="${ink}"/><circle cx="160" cy="126" r="21" fill="${ink}"/>
    <path d="M129 122q5-6 10 0" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M98 116l8-6M150 116l8-6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <circle cx="86" cy="158" r="9" fill="${pigDark}" opacity=".6"/><circle cx="184" cy="158" r="9" fill="${pigDark}" opacity=".6"/>
    <ellipse cx="134" cy="162" rx="22" ry="15" fill="${pigDark}" stroke="${ink}" stroke-width="4"/>
    <ellipse cx="126" cy="162" rx="3.5" ry="5" fill="${ink}"/><ellipse cx="142" cy="162" rx="3.5" ry="5" fill="${ink}"/>
    <path d="M120 186q14 9 28 0" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <g transform="rotate(-14 214 176)">
      <rect x="186" y="156" width="62" height="40" rx="6" fill="#FFFDF7" stroke="${ink}" stroke-width="4"/>
      <rect x="194" y="166" width="12" height="9" rx="2" fill="#F2B33D" stroke="${ink}" stroke-width="2"/>
      <path d="M194 186h22M222 186h16" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
    </g>
    <ellipse cx="200" cy="186" rx="13" ry="10" fill="${pig}" stroke="${ink}" stroke-width="4"/>
  </svg>`;
}
