import re,sys
import os
root=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
import base64
font=base64.b64encode(open(root+'fonts/inter.woff2','rb').read()).decode()
css=open(root+'css/app.css').read().replace('../fonts/inter.woff2','data:font/woff2;base64,'+font); js=open(root+'js/app.js').read(); icons=open(root+'js/icons.js').read(); qr=open(root+'vendor/qrcode.js').read()
html=open(root+'index.html').read()
body=html[html.index('<body>')+6:html.index('<script src="vendor')]
extra='''
/* Aperçu : gouttières et zones sûres gérées par l'hôte, actions de fichier masquées */
.topbar { top: env(safe-area-inset-top, 0px); padding: 12px max(16px, env(safe-area-inset-right, 0px)) 10px max(16px, env(safe-area-inset-left, 0px)); }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
.view { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
#list-body, .card.view, .left.view { padding-left: 0; padding-right: 0; }
.card.view { padding: 16px; }
[data-act="receipt-share"], [data-act="receipt-dl"], [data-act="card-share"], [data-act="card-dl"], [data-act="export"], [data-act="import"], [data-act="csv"], .backup-nudge { display: none; }
.preview.ticket + p::after { content: " Dans cet aperçu, maintenez l’image appuyée pour l’enregistrer."; }
'''
demo='''
window.KOBO_DEMO = function () {
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var day = function (off) { var d = new Date(); d.setDate(d.getDate() + off); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var seed = 11, rnd = function (n) { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
  var now = Date.now();
  var dishes = [['Thiéboudienne', 2500], ['Yassa poulet', 3000], ['Mafé', 2500], ['Jus de bissap', 500], ['Pastels (6)', 1000]];
  var people = ['Moussa', '', 'Fatou', '', 'Ibrahima', '', 'Awa K.', '', 'Cheikh', ''];
  var pays = ['cash', 'cash', 'mobile', 'cash', 'mobile', 'card'];
  var sales = [], n = 0;
  var mk = function (off, who, items, pay, extra) {
    n++;
    return Object.assign({ id: 's' + n, n: n, at: now + off * 864e5 + n * 1000, who: who, date: day(off), note: '', pay: pay,
      items: items.map(function (i) { return { name: i[0], qty: i[1], price: i[2] }; }) }, extra || {});
  };
  for (var off = -13; off <= 0; off++) {
    var count = (off < -6 ? 2 : 3) + rnd(3);
    for (var k = 0; k < count; k++) {
      var a = dishes[rnd(3)], items = [[a[0], 1 + rnd(4), a[1]]];
      if (rnd(2)) items.push(['Jus de bissap', 1 + rnd(3), 500]);
      if (!rnd(4)) items.push(['Pastels (6)', 1, 1000]);
      sales.push(mk(off, people[rnd(people.length)], items, pays[rnd(pays.length)]));
    }
  }
  sales.push(mk(-2, 'Mme Ndiaye', [['Thiéboudienne', 4, 2500], ['Jus de bissap', 8, 500]], 'credit',
    { paid: 5000, due: day(5), payments: [{ date: day(-1), amount: 5000, method: 'mobile' }] }));
  sales.push(mk(-1, 'Ibrahima', [['Yassa poulet', 2, 3000]], 'credit', { paid: 0, due: day(-1) }));
  var purchases = [], m = 0;
  var buy = function (off, who, cat, items) { m++; purchases.push({ id: 'a' + m, n: m, at: now + off * 864e5 + m, who: who, cat: cat, date: day(off), note: '',
    items: items.map(function (i) { return { name: i[0], qty: i[1], price: i[2] }; }) }); };
  buy(-12, 'Marché central', 'Ingrédients', [['Riz 25 kg', 1, 16000], ['Poisson', 4, 2500]]);
  buy(-9, 'Boucherie Sow', 'Ingrédients', [['Poulet', 8, 2200]]);
  buy(-8, '', 'Énergie', [['Bouteille de gaz', 1, 6500]]);
  buy(-5, 'Marché central', 'Ingrédients', [['Riz 25 kg', 1, 16000], ['Légumes', 1, 7000]]);
  buy(-3, 'Grossiste', 'Boissons', [['Fleurs de bissap', 2, 3000], ['Sucre 5 kg', 1, 4500]]);
  buy(0, 'Boucherie Sow', 'Ingrédients', [['Poulet', 6, 2200]]);
  var orders = [
    { id: 'c1', n: 1, at: now - 864e5, who: 'Fatou', items: [{ name: 'Plateau traiteur 20 pers.', qty: 1, price: 45000 }], date: day(-1), due: day(1), deposit: 20000, phone: '', status: 'prep', note: '' },
    { id: 'c2', n: 2, at: now - 1000, who: 'Bureau Diop & Fils', items: [{ name: 'Yassa poulet', qty: 12, price: 3000 }], date: day(0), due: day(3), deposit: 0, phone: '', status: 'new', note: '' }
  ];
  return {
    settings: { name: 'Chez Awa (exemple)', type: 'food', currency: 'FCFA', goal: 50000, color: '#d6d5ea', owner: 'Awa', email: 'contact@chezawa.example', taxId: 'NINEA 000000000', taxRate: 0, terms: 7, phone: '+221 77 000 00 00', address: 'Médina, Dakar', footer: '' },
    sales: sales, purchases: purchases, orders: orders,
    products: [
      { id: 'p1', name: 'Thiéboudienne', price: 2500, cost: 1400, qty: null, min: 0 },
      { id: 'p2', name: 'Yassa poulet', price: 3000, cost: 1900, qty: null, min: 0 },
      { id: 'p3', name: 'Mafé', price: 2500, cost: 1500, qty: null, min: 0 },
      { id: 'p4', name: 'Jus de bissap', price: 500, cost: 150, qty: 12, min: 10 },
      { id: 'p5', name: 'Pastels (6)', price: 1000, cost: 850, qty: null, min: 0 }
    ],
    contacts: { 'mme ndiaye': { name: 'Mme Ndiaye', phone: '+221 77 000 00 01', email: 'ndiaye@example.com', address: 'Plateau, Dakar', note: 'Commande souvent pour son bureau' } },
    lastBackup: now,
    card: { name: 'Awa Diallo', role: 'Gérante', email: 'awa@exemple.sn' },
    seq: { sale: sales.length, purchase: purchases.length, order: orders.length }
  };
};
'''
out=f'''<title>Kobo</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
{css}{extra}</style>
{body}
<script>{qr}</script>
<script>{demo}</script>
<script>{icons}</script>
<script>{js}</script>
'''
open(sys.argv[1],'w').write(out)
print(len(out))
