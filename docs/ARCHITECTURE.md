# Architecture et passage en production

## Principe : lecture seule, aucun fonds détenu

PixelBudget est un service d'**information sur les comptes** (AIS, « Account
Information Service » au sens de la DSP2). L'application :

- lit les soldes et l'historique des comptes que l'utilisateur autorise ;
- ne détient, ne reçoit et ne déplace **aucun fonds** ;
- ne peut initier aucun paiement (ce serait un autre service, le PIS) ;
- ne voit jamais les identifiants bancaires : l'utilisateur s'authentifie
  directement chez sa banque (authentification forte).

## Cadre réglementaire (France / UE) — à valider avec un juriste

Même sans détenir d'argent, accéder aux comptes de paiement d'un tiers est une
activité réglementée par la DSP2 :

| Option | Ce que ça implique |
| --- | --- |
| **Devenir agent d'un agrégateur agréé** (recommandé pour démarrer) | L'agrégateur (Bridge, Powens, Tink, GoCardless Bank Account Data, Plaid…) porte l'agrément AISP ; vous êtes déclaré comme son agent ou utilisez son « licence-as-a-service ». Mise en route en quelques semaines. |
| **Obtenir votre propre enregistrement AISP** auprès de l'ACPR | Plus d'indépendance, mais dossier lourd : assurance responsabilité civile professionnelle, sécurité, gouvernance. |

À prévoir aussi :

- **RGPD** : les transactions révèlent des données sensibles (santé, religion,
  syndicats…). Registre des traitements, AIPD, hébergement UE, durée de
  conservation, droit à l'effacement (bouton « Déconnecter » + suppression).
- **Consentement DSP2** : valable 180 jours, puis renouvellement par l'utilisateur.
- **Gamification responsable** : récompenser les bons comportements (épargne,
  respect du budget), jamais pousser à dépenser ou à souscrire un produit.

## Architecture cible

```
┌──────────────┐  HTTPS   ┌──────────────────┐  API   ┌──────────────┐  DSP2  ┌────────┐
│ App web/mobile│ ───────▶ │ Backend PixelBudget│ ─────▶ │ Agrégateur    │ ─────▶ │ Banques│
│ (ce dépôt)    │ ◀─────── │  - auth utilisateur│ ◀───── │ agréé (AISP)  │ ◀───── │        │
└──────────────┘           │  - jetons agrégateur│ webhook└──────────────┘        └────────┘
                           │  - catégorisation   │
                           │  - calcul XP/quêtes │
                           │  - base chiffrée    │
                           └──────────────────┘
```

1. L'utilisateur choisit sa banque → le backend crée une session chez
   l'agrégateur et renvoie une **URL de redirection**.
2. L'utilisateur s'authentifie chez sa banque, puis revient sur l'app.
3. Le backend récupère comptes et transactions (et reçoit ensuite des webhooks
   de mise à jour), les catégorise et les stocke chiffrés.
4. L'app n'affiche que les données renvoyées par **votre** backend.

Les **jetons de l'agrégateur ne doivent jamais aller dans le navigateur**.

## Où brancher le code

- `src/core/providers.js` : l'interface `BankProvider`. Créez par exemple un
  `ApiProvider` qui appelle votre backend (`GET /institutions`,
  `POST /connections` → `redirectUrl`, `GET /accounts`, `GET /transactions`) et
  remplacez `DemoProvider` dans `src/main.js`.
- `src/core/analytics.js` et `src/core/gamification.js` sont des fonctions
  pures : elles peuvent tourner telles quelles côté serveur (Node), ce qui
  permet de calculer l'XP de façon fiable et non falsifiable.
- `src/core/store.js` : à remplacer par des appels API (aujourd'hui tout est
  dans le `localStorage` du navigateur).

## Feuille de route suggérée

1. Backend (Node/TypeScript ou autre) + authentification utilisateur.
2. Intégration d'un agrégateur en **sandbox**.
3. Catégorisation améliorée (celle de l'agrégateur + règles + corrections
   manuelles de l'utilisateur, qui rapportent de l'XP).
4. Application mobile (React Native / Flutter, ou PWA à partir de ce prototype)
   et notifications (« quête bientôt réussie », alerte budget).
5. Social optionnel : défis entre amis, classements anonymisés.
