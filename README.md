# Gestio

Petite application mobile de gestion pour les entreprises : simple, ludique et adaptable à tout type d'activité (boutique, restaurant, services, beauté, mode, agriculture…).

## Fonctionnalités

- **Ventes** — saisie en quelques secondes, plusieurs articles, mode de paiement (espèces, Mobile Money, carte, virement, crédit), suivi des ventes à encaisser.
- **Achats** — dépenses par fournisseur et par catégorie (les catégories s'adaptent au type d'activité).
- **Commandes** — date de livraison, acompte, reste à payer, statut (Nouvelle → En cours → Prête → Livrée), transformation en vente en un geste.
- **Articles & stock** — catalogue de produits et services. Les articles apparaissent en raccourci dans le formulaire de vente ; le stock baisse à chaque vente, remonte à chaque achat, et une alerte signale les articles à réapprovisionner. Un article sans quantité (un service) n'est pas suivi en stock.
- **Reçus avec code QR** — reçu de paiement ou bon de commande en image, avec le logo de l'entreprise, à partager (WhatsApp, e-mail…) ou télécharger. Le QR contient le résumé du reçu et un code de contrôle.
- **Carte de visite** — 3 modèles, couleurs au choix, QR code vCard qui ajoute le contact dans le téléphone de la personne qui scanne.
- **Rapport mensuel** — ventes, achats, bénéfice estimé, ventes par jour, meilleures ventes, paiements, achats par catégorie, export CSV pour Excel.
- **Tableau de bord** — ventes du jour, objectif quotidien, solde, série de jours de vente, graphique sur 7 jours.
- **Personnalisation** — logo importé, type d'activité, devise, couleur.
- **Hors ligne** — les données restent sur le téléphone (aucun serveur, aucun compte). Export / import d'une sauvegarde depuis les paramètres.

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
