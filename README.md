# Gestio

Petite application mobile de gestion pour les entreprises : simple, ludique et adaptable à tout type d'activité (boutique, restaurant, services, beauté, mode, agriculture…).

## Fonctionnalités

- **Ventes** — saisie en quelques secondes avec les raccourcis d'articles, mode de paiement (espèces, Mobile Money, carte, virement, plus tard). Listes groupées par jour avec le total de chaque journée. « Refaire cette vente » pour les habitués.
- **Argent à encaisser** — une vente « pas encore payée » accepte des versements partiels ; chaque versement est daté. L'accueil affiche ce qu'on vous doit au total.
- **Clients** — fiche par client (total dépensé, historique, reste à payer, téléphone) et rappel de paiement prêt à envoyer sur WhatsApp.
- **Commandes** — date de livraison, acompte, statut. À la livraison, la commande devient une vente : le client paie le reste tout de suite ou plus tard, et l'acompte est compté.
- **Achats** — dépenses par fournisseur et par catégorie.
- **Bilan** — par semaine ou par mois : ventes, dépenses, bénéfice, comparaison avec la période précédente à la même date, argent encaissé et à encaisser, ce que les articles ont rapporté, meilleures ventes, meilleurs clients, et des points clés (hausse ou baisse, article peu rentable, articles pas vendus, commandes à venir…). Partage en texte et export CSV pour Excel.
- **Recherche** — retrouver n'importe quelle opération par client, plat, numéro (V-0012, R-0012) ou montant.
- **Articles & stock** — prix de vente, coût de revient (pour calculer ce que chaque article rapporte), stock suivi automatiquement avec alerte.
- **Reçus avec code QR**, **carte de visite** avec QR de contact, **logo** personnalisé.
- **Sauvegarde** — les données restent sur le téléphone ; l'application rappelle d'envoyer une sauvegarde (WhatsApp, e-mail, Drive) au moins une fois par semaine.

## Lancer l'application

C'est une application web installable (PWA), sans dépendance ni étape de compilation.

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000` dans un navigateur.

Pour l'utiliser sur un téléphone, publier le dossier sur un hébergement statique en HTTPS (par exemple GitHub Pages : *Settings → Pages → Deploy from a branch*), ouvrir l'adresse sur le téléphone, puis choisir « Ajouter à l'écran d'accueil ».

## Structure

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure de la page |
| `css/app.css` | Styles : aplats de couleur, contours épais, ombres dures (thème clair et sombre) |
| `js/app.js` | Toute la logique de l'application |
| `sw.js` | Cache hors ligne (changer `VERSION` à chaque mise à jour) |
| `manifest.webmanifest`, `icons/` | Installation sur l'écran d'accueil |
| `fonts/` | Police Space Grotesk (licence SIL OFL 1.1) |
| `vendor/qrcode.js` | Génération des codes QR ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), licence MIT) |
