# PixelBudget 🎮💶

Application de gestion d'argent **gamifiée** : l'utilisateur connecte ses
comptes bancaires, suit ses dépenses, fixe des budgets et des objectifs
d'épargne, et gagne de l'XP, des niveaux et des badges en gardant de bonnes
habitudes.

> L'application **ne détient aucun fonds**. Elle lit les comptes en lecture
> seule (agrégation DSP2) et ne peut initier aucun paiement.

## Fonctionnalités du prototype

- **Agrégation multi-banques** avec parcours de consentement (banques de démo fictives).
- **Tableau de bord** : solde total, dépenses et solde du mois, alertes budget.
- **Dépenses** : catégorisation automatique, répartition (donut), dépenses jour
  par jour, filtres par période, catégorie et recherche.
- **Budgets mensuels** par catégorie et **objectifs d'épargne**.
- **Gamification** :
  - XP et niveaux (avec titres : Apprenti épargnant → Légende de l'épargne) ;
  - 4 **quêtes hebdomadaires** (ex. « moins de 40 € de restaurants ») ;
  - 9 **badges** ; **série** de jours de suivi 🔥 ;
  - détail « d'où vient ton XP ». L'XP est recalculée à partir des données
    réelles : impossible de tricher en modifiant un compteur.

## Lancer

```bash
npm start   # http://localhost:5173
npm test    # tests unitaires (node:test, aucune dépendance)
```

Aucune dépendance à installer (Node ≥ 20).

## Structure

```
index.html
src/
  main.js              interface (vues, navigation, actions)
  styles.css
  core/
    providers.js       interface BankProvider + DemoProvider (données fictives)
    analytics.js       catégorisation, agrégats, budgets
    gamification.js    XP, niveaux, quêtes, badges, séries
    dates.js, store.js
tests/core.test.js
docs/ARCHITECTURE.md   réglementation (DSP2/AISP, RGPD) et passage en production
```

Pour brancher de vraies banques, voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
