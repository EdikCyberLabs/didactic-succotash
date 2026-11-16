# Génère js/icons.js depuis le paquet lucide-static.
# Usage : npm pack lucide-static@0.460.0 && tar xzf lucide-static-0.460.0.tgz
#         python3 scripts/gen-icons.py package/icons js/icons.js
import re, json, sys
src = sys.argv[1]; out = sys.argv[2]
M = {
 # interface
 'check':'check','back':'chevron-left','plus':'plus','invoice':'file-text','share':'share','user':'user-round','download':'download',
 'box':'package','arrowDown':'arrow-down','arrowUp':'arrow-up','up':'trending-up','down':'trending-down','trash':'trash-2','tag':'tag',
 'coin':'coins','clip':'clipboard-list','arrowR':'arrow-right','x':'x','receipt':'receipt','pos':'calculator','message':'message-circle',
 'edit':'pencil','chart':'chart-column','scan':'scan','save':'save','repeat':'repeat-2','minus':'minus','image':'image','idcard':'id-card',
 'grid':'layout-grid','gear':'sliders-horizontal','alert':'triangle-alert','search':'search','home':'house','users':'users',
 # métiers
 'store':'store','utensils':'utensils','briefcase':'briefcase-business','scissors':'scissors','shirt':'shirt','smartphone':'smartphone',
 'hammer':'hammer','stethoscope':'stethoscope','cap':'graduation-cap','truck':'truck','wheat':'wheat','sparkles':'sparkles',
 # paiements, statuts
 'cash':'banknote','card':'credit-card','bank':'landmark','clock':'clock','inbox':'inbox','timer':'timer','ready':'package-check',
 # points clés, états vides
 'trophy':'trophy','calendar':'calendar-check','bulb':'lightbulb','hourglass':'hourglass','heart':'heart','searchX':'search-x',
 'sprout':'sprout','ok':'circle-check','del':'delete','cloud':'cloud','eye':'eye','eyeOff':'eye-off','lock':'lock','login':'log-in','logout':'log-out','userPlus':'user-plus','key':'key-round','shield':'shield-check','cloudOff':'cloud-off','cloudUp':'cloud-upload','wallet':'wallet',
 # carte de visite
 'phone':'phone','mail':'mail','pin':'map-pin','globe':'globe',
}
CANVAS = ['store','utensils','briefcase','scissors','shirt','smartphone','hammer','stethoscope','cap','truck','wheat','sparkles','phone','mail','pin','globe']
def attrs(t): return dict(re.findall(r'([\w-]+)="([^"]*)"', t))
def to_d(tag, a):
    f = lambda k, d=0: float(a.get(k, d))
    if tag == 'path': return a['d']
    if tag == 'line': return f"M{a['x1']} {a['y1']}L{a['x2']} {a['y2']}"
    if tag in ('polyline','polygon'):
        pts = a['points'].split(); d = 'M' + ' L'.join(pts)
        return d + ('Z' if tag == 'polygon' else '')
    if tag in ('circle','ellipse'):
        cx, cy = f('cx'), f('cy'); rx = f('r') if tag == 'circle' else f('rx'); ry = f('r') if tag == 'circle' else f('ry')
        return f"M{cx-rx} {cy}a{rx} {ry} 0 1 0 {2*rx} 0a{rx} {ry} 0 1 0 {-2*rx} 0"
    if tag == 'rect':
        x, y, w, h = f('x'), f('y'), f('width'), f('height'); r = f('rx', a.get('ry', 0))
        if not r: return f"M{x} {y}h{w}v{h}h{-w}Z"
        return (f"M{x+r} {y}h{w-2*r}a{r} {r} 0 0 1 {r} {r}v{h-2*r}a{r} {r} 0 0 1 {-r} {r}"
                f"h{-(w-2*r)}a{r} {r} 0 0 1 {-r} {-r}v{-(h-2*r)}a{r} {r} 0 0 1 {r} {-r}Z")
    raise ValueError(tag)
html, paths = {}, {}
for key, name in M.items():
    svg = open(f'{src}/{name}.svg').read()
    inner = svg[svg.index('>', svg.index('<svg')) + 1:svg.rindex('</svg>')]
    els = re.findall(r'<(\w+)([^>]*)/>', inner)
    html[key] = ''.join(f'<{t}{a}/>' for t, a in els).replace('  ', ' ')
    html[key] = re.sub(r'\s+', ' ', html[key]).replace(' />', '/>')
    if key in CANVAS: paths[key] = [to_d(t, attrs(a)) for t, a in els]
with open(out, 'w') as o:
    o.write('/* Icônes Lucide (https://lucide.dev), licence ISC — voir icons/LICENSE-lucide.txt.\n   Fichier généré : clé de l’application → contenu SVG (24 × 24, trait). */\n')
    o.write('window.KOBO_ICONS = ' + json.dumps(html, ensure_ascii=False, indent=0) + ';\n')
    o.write('/* Les mêmes icônes en tracés, pour les dessiner sur les reçus, factures et cartes. */\n')
    o.write('window.KOBO_ICON_PATHS = ' + json.dumps(paths, ensure_ascii=False, indent=0) + ';\n')
print(len(html), 'icons,', len(paths), 'canvas')
