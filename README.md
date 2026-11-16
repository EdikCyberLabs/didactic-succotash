# Kobo

Application mobile de caisse et de gestion pour tous les types d'entreprise : commerce, restauration, services, beauté, artisans, santé, formation, transport, agriculture…

Le design reprend un langage « portefeuille » : panneau d'accueil lavande avec un gros montant, bande noire avec pastille de tendance et boutons pilules, feuille gris clair à poignée, cartes sans bordure, courbe de revenus verte, clavier numérique lavande pour la caisse. Police Inter, icônes Lucide.

## Fonctionnalités

- **Caisse** — grille d'articles, montant libre au clavier, panier modifiable, client, mode de paiement, monnaie à rendre. Le stock se met à jour à chaque vente.
- **Factures** — chaque vente génère une facture au format page (en-tête entreprise et n° fiscal, client, lignes, remise, taxe, total, payé, reste, statut, code QR) ou un reçu ticket. Suivi « À encaisser / En retard / Payées », versements partiels datés, échéance selon le délai de paiement choisi.
- **Clients (CRM)** — fiches (téléphone, e-mail, adresse, note), historique, total dépensé, reste à payer, segments « Ils vous doivent », « Fidèles », « Inactifs », rappel de paiement prêt à envoyer sur WhatsApp.
- **Finances** — par semaine, mois ou année : ventes, dépenses, résultat (ventes hors taxes − dépenses) comparés à la période précédente, compte de résultat, taxes collectées à reverser, marge sur articles (coût de revient), trésorerie (encaissé, payé, flux net), meilleures ventes, meilleurs clients, points clés. Partage en texte et export CSV pour Excel.
- **Dépenses** — catégories adaptées au métier plus les charges courantes (loyer, salaires, transport, marketing, impôts).
- **Commandes & devis** — acompte, date de livraison, statut ; à la livraison, la commande devient une vente.
- **Articles & stock** — prix de vente, coût de revient, stock suivi avec alerte.
- **Recherche globale**, **carte de visite** avec QR de contact, **logo**, teinte d'accueil personnalisable, thème sombre.
- **Hors ligne** — les données restent sur le téléphone ; sauvegarde à envoyer sur WhatsApp, e-mail ou Drive, avec rappel hebdomadaire.

## Lancer l'application

C'est une application web installable (PWA), sans dépendance ni étape de compilation.

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000` dans un navigateur.

Pour l'utiliser sur un téléphone, publier le dossier sur un hébergement statique en HTTPS (par exemple GitHub Pages : *Settings → Pages → Deploy from a branch*), ouvrir l'adresse sur le téléphone, puis choisir « Ajouter à l'écran d'accueil ».

## Sauvegarde en ligne et comptes (Supabase)

Projet : `sktrzibeinhbblnovrct` (adresse et clé publishable dans `js/config.js`).

**Sans inscription.** À la fin de l'accueil, chaque téléphone reçoit une identité anonyme Supabase, sans e-mail ni mot de passe. L'entreprise est créée en ligne et toutes ses données y sont envoyées automatiquement : ventes, factures, paiements, dépenses, commandes, articles, clients et paramètres. Chaque téléphone garde aussi une copie locale et continue de fonctionner hors ligne ; les changements partent dès le retour du réseau.

**Plusieurs téléphones.** Dans Plus › Compte, un code d'invitation est affiché. Sur l'autre téléphone, à l'accueil : « Rejoindre une entreprise », puis ce code.

**Comptes (facultatif).** Plus › Compte › « Créer un compte » rattache l'entreprise à un e-mail et un mot de passe, pour la retrouver sur un nouveau téléphone (« J'ai déjà un compte » à l'accueil). L'écran de connexion propose aussi la connexion par lien reçu par e-mail et la réinitialisation du mot de passe. Les e-mails de confirmation et de réinitialisation renvoient vers l'adresse de l'application : renseignez-la dans Supabase (**Authentication › URL Configuration**) une fois l'application en ligne.

**Sécurité.** Les règles de `supabase/schema.sql` limitent chaque identité, anonyme ou non, aux données des entreprises dont elle est membre. Une identité anonyme n'existe que sur son téléphone : si l'application est effacée sans compte, l'accès en ligne à l'entreprise passe par un collègue qui détient le code d'invitation.

**Mise en place, déjà faite par les workflows GitHub Actions** (ils utilisent le secret `ACCESS_TOKEN_API_KEY`, un jeton d'accès Supabase) :

- `supabase-schema.yml` installe ou met à jour `supabase/schema.sql` à chaque modification de ce fichier ;
- `supabase-auth.yml` active les connexions anonymes.

À savoir :

- Si deux téléphones modifient la même fiche avant de se synchroniser, c'est la dernière modification envoyée qui l'emporte. C'est aussi le cas pour la quantité en stock d'un article vendu au même moment sur deux téléphones.
- Le service d'e-mails intégré à Supabase n'envoie que quelques e-mails par heure. Pour une équipe, configurez votre propre serveur d'envoi (**Authentication › Emails › SMTP**).

## Structure

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure de la page |
| `css/app.css` | Styles (thème clair et sombre) |
| `js/app.js` | Toute la logique de l'application |
| `sw.js` | Cache hors ligne (changer `VERSION` à chaque mise à jour) |
| `manifest.webmanifest`, `icons/` | Installation sur l'écran d'accueil |
| `fonts/` | Police Inter (licence SIL OFL 1.1) |
| `js/icons.js` | Icônes [Lucide](https://lucide.dev) (licence ISC, voir `icons/LICENSE-lucide.txt`), générées depuis le paquet `lucide-static` |
| `js/config.js` | Adresse et clé publishable du projet Supabase |
| `supabase/schema.sql` | Tables, règles de sécurité et fonctions pour la synchronisation |
| `vendor/supabase.js` | Client officiel [supabase-js](https://github.com/supabase/supabase-js) 2.118 (licence MIT) |
| `vendor/qrcode.js` | Génération des codes QR ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), licence MIT) |
