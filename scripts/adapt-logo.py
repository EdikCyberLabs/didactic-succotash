"""Adapte kobo-logo.html (logo animé fourni) à la charte Kobo : lavande, noir, or.
Produit : le SVG animé intégré à l'écran de démarrage (index.html + css), et un SVG fixe (image finale)."""
import re
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else 'kobo-logo.html'
import os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
html = open(SRC).read()
svg = html[html.index('<svg id="logo"'):html.index('</svg>') + 6]

# 1. Couleurs : bleus -> lavande / noir / or (formes inchangées)
COL = {
    '#DCE8FF': '#E7E6F4',   # papier (fin du dégradé)
    '#1F6BFF': '#3B3B43',   # bord : départ du dégradé / pastille d'en-tête / point
    '#0B3FD1': '#1F1F25',   # bord et lignes foncées
    '#0B1F5C': '#111114',   # noir : épaisseur, yeux, sourire, ombre
    '#F4F8FF': '#F6F6F7',   # dos du coin
    '#BCD2FF': '#C9C7E2',   # lavande soutenue
    '#2F7BFF': '#FFC53D',   # reflets du coin : or
    '#6FA3FF': '#FFE08A',   # or clair
    '#C9DAFF': '#D6D5EA',   # bandeau d'en-tête : lavande
    '#9DB8F0': '#B4B2D4',   # lignes moyennes
    '#C7D6F5': '#DCDBEC',   # lignes claires
    '#021B6B': '#111114',   # ombres portées
    '#E5334B': '#111114',   # tampon PAYÉ : noir
}
for a, b in COL.items():
    svg = svg.replace(a, b)
# Reflets dorés du coin (le dégradé « curlBlue » et son pli)
svg = svg.replace('<linearGradient id="curlBlue" x1="0" y1="1" x2="1" y2="0">\n      <stop offset="0" stop-color="#1F1F25"/>', '<linearGradient id="curlBlue" x1="0" y1="1" x2="1" y2="0">\n      <stop offset="0" stop-color="#C99300"/>')
svg = svg.replace('<path d="M290 84 Q326 116 340 160 Q350 196 348 236 Q338 196 322 160 Q308 126 282 92 Z" fill="#1F1F25" opacity="0.9"/>', '<path d="M290 84 Q326 116 340 160 Q350 196 348 236 Q338 196 322 160 Q308 126 282 92 Z" fill="#E0A400" opacity="0.9"/>')
# Point du visage : or (comme le point du logo)
svg = svg.replace('<circle id="dot" cx="222" cy="128" r="11" fill="#3B3B43"/>', '<circle id="dot" cx="222" cy="128" r="11" fill="#FFC53D"/>')
# Tampon PAYÉ : cadre doré, texte noir
svg = svg.replace('fill="#FFFFFF" fill-opacity="0.85" stroke="#111114" stroke-width="5"', 'fill="#FFFFFF" fill-opacity="0.9" stroke="#FFC53D" stroke-width="5"')
assert '#1F6BFF' not in svg and '#0B1F5C' not in svg

# 2. Identifiants préfixés (évite tout conflit avec la page)
ids = re.findall(r'id="([\w-]+)"', svg)
for i in sorted(set(ids), key=len, reverse=True):
    svg = re.sub(r'(id="|href="#|url\(#)' + i + r'(["\)])', r'\g<1>k-' + i + r'\2', svg)
svg = svg.replace('<svg id="k-logo"', '<svg class="splash-mascot"').replace('aria-label="Logo Kobo"', 'aria-hidden="true" focusable="false"')

# 3. Animation : même chorégraphie, accélérée (x 0,55) pour tenir en ~2,6 s
css = html[html.index('<style>') + 7:html.index('</style>')]
css = css[css.index('/* ===== APPARITION DU BLOC ===== */'):]
F = 0.55
def scale_time(m):
    v = float(m.group(1)) * F
    return f'{v:.2f}s'.replace('0.', '.', 1) if v < 1 else f'{v:.2f}s'
css = re.sub(r'(?<![\w.])(\d+(?:\.\d+)?)s\b', scale_time, css)
css = css.replace('blink .18s ease-in-out 2.04s 2', 'blink .18s ease-in-out 2.04s 1')
for i in sorted(set(ids), key=len, reverse=True):
    css = re.sub(r'#' + i + r'\b', '#k-' + i, css)
for k in ['pop', 'fly1', 'fly2', 'fly3', 'fly4', 'flyPaid', 'topIn', 'peel', 'flutter', 'eyeIn', 'blink', 'look', 'draw', 'pulse', 'breathe']:
    css = re.sub(r'\b' + k + r'\b', 'k-' + k, css)
css = css.replace('.sheet {', '.splash-mascot .sheet {').replace('.eye {', '.splash-mascot .eye {').replace('.pupil {', '.splash-mascot .pupil {')
# Version fixe : l'image finale, sans mouvement
static = '''
/* Version fixe (téléphone lent, moins d'animations) : directement l'image finale. */
.splash.static .splash-mascot * { animation: none !important; }
.splash.static #k-block, .splash.static #k-top, .splash.static #k-curl, .splash.static #k-dot,
.splash.static .splash-mascot .eye, .splash.static .splash-mascot .pupil { opacity: 1 !important; transform: none !important; }
.splash.static .splash-mascot .sheet { display: none; }
.splash.static #k-smile, .splash.static #k-dimple { stroke-dashoffset: 0 !important; }
'''
open(R + 'scratch-mascot.css', 'w').write(css + static)
open(R + 'scratch-mascot.svg', 'w').write(svg)

# 4. SVG fixe (image finale) pour le logo et l'icône
still = svg.replace('<svg class="splash-mascot"', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true" focusable="false"', ' role="img" aria-label="Kobo"')
for sid in ['k-s1', 'k-s2', 'k-s3', 'k-s4', 'k-s5']:
    still = re.sub(r'<g id="' + sid + r'" class="sheet"><use href="#k-invoice(?:Paid)?"/></g>\n', '', still)
still = still.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox', 1)
open(R + 'scratch-mascot-still.svg', 'w').write(still)
print(len(svg), len(css), len(still))
