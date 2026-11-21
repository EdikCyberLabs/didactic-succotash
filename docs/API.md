# API de Kobo

Kobo n'a pas de serveur propre : ses données sont stockées dans le projet **Supabase** de l'application, qui expose une API REST standard (PostgREST) et une API d'authentification (GoTrue). Cette API sert à brancher d'autres outils sur les mêmes données : site web, tableau de bord, export comptable, application de livraison…

| | |
| --- | --- |
| Adresse de base | `https://sktrzibeinhbblnovrct.supabase.co` |
| Clé publique (publishable) | `sb_publishable_3foU7MKb22wV2-9-2xJhaw_1IaCek8m` |
| Données | `/rest/v1/…` |
| Connexion | `/auth/v1/…` |
| Format | JSON, dates ISO 8601, montants en nombre (dans la devise de l'entreprise) |

La clé publique est faite pour être visible dans une application. Elle ne donne accès à aucune donnée sans connexion : chaque requête doit aussi porter le **jeton de session** d'un membre de l'entreprise, et les règles de sécurité (`supabase/schema.sql`) limitent chaque utilisateur aux entreprises dont il est membre.

Ne mettez jamais dans une application la clé secrète (`sb_secret_…`) ni le jeton d'accès Supabase (`sbp_…`) : ils contournent ces règles.

## 1. En-têtes de chaque requête

```
apikey: sb_publishable_3foU7MKb22wV2-9-2xJhaw_1IaCek8m
Authorization: Bearer <access_token>
Content-Type: application/json
```

`<access_token>` est le jeton renvoyé par une connexion (section 2). Il expire au bout d'une heure ; renouvelez-le avec le `refresh_token`.

Dans les exemples ci-dessous :

```bash
URL=https://sktrzibeinhbblnovrct.supabase.co
KEY=sb_publishable_3foU7MKb22wV2-9-2xJhaw_1IaCek8m
TOKEN=<access_token>
```

## 2. Connexion

### Identité anonyme (sans inscription)

C'est ce que fait l'application sur chaque téléphone.

```bash
curl -X POST "$URL/auth/v1/signup" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{}'
```

Réponse : `access_token`, `refresh_token`, `expires_in`, `user.id`, `user.is_anonymous: true`.

### Compte e-mail et mot de passe

Créer un compte (un e-mail de confirmation est envoyé) :

```bash
curl -X POST "$URL/auth/v1/signup" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d '{"email":"vous@exemple.com","password":"MotDePasse2026!"}'
```

Se connecter :

```bash
curl -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d '{"email":"vous@exemple.com","password":"MotDePasse2026!"}'
```

Renouveler le jeton :

```bash
curl -X POST "$URL/auth/v1/token?grant_type=refresh_token" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'
```

Autres points d'accès utiles : `POST /auth/v1/recover` (`{"email"}`, mot de passe oublié), `POST /auth/v1/otp` (`{"email"}`, lien de connexion), `GET /auth/v1/user` (utilisateur courant), `POST /auth/v1/logout`.

## 3. Entreprise

Une entreprise est un espace partagé ; ses membres voient et modifient les mêmes données. Ces trois fonctions s'appellent en `POST` sur `/rest/v1/rpc/<nom>`.

| Fonction | Corps | Renvoie |
| --- | --- | --- |
| `my_business` | `{}` | L'entreprise de l'utilisateur : `id`, `name`, `invite_code`, `role` (`owner` ou `member`), `members` (nombre) |
| `create_business` | `{"p_name": "Studio Nova"}` | La nouvelle entreprise (`id`, `name`, `invite_code`) ; l'utilisateur en devient propriétaire |
| `join_business` | `{"p_code": "7F3A9C21"}` | L'entreprise rejointe ; erreur `Code d'invitation inconnu` si le code n'existe pas |

```bash
curl -X POST "$URL/rest/v1/rpc/my_business" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'
```

Le code d'invitation est affiché dans l'application, dans Plus › Compte.

Tables en lecture : `businesses` (`id`, `name`, `invite_code`, `created_by`, `created_at`) et `members` (`business_id`, `user_id`, `role`, `joined_at`).

## 4. Données : la table `records`

Toutes les données d'une entreprise sont dans une seule table, une ligne par enregistrement :

| Colonne | Type | Rôle |
| --- | --- | --- |
| `business_id` | uuid | Entreprise |
| `kind` | texte | `sales`, `purchases`, `orders`, `products`, `contacts` ou `settings` |
| `id` | texte | Identifiant de l'enregistrement (unique par entreprise et par `kind`) |
| `data` | JSON | Contenu (section 5) |
| `deleted` | booléen | `true` quand l'enregistrement a été supprimé |
| `updated_at` | horodatage | Heure de la dernière écriture, donnée par le serveur |
| `updated_by` | uuid | Auteur de la dernière écriture |

La clé primaire est (`business_id`, `kind`, `id`). Les suppressions sont « douces » : la ligne reste avec `deleted = true` et `data = null`, pour que les autres téléphones l'apprennent.

### Lire

Toutes les ventes non supprimées :

```bash
curl "$URL/rest/v1/records?business_id=eq.<ID>&kind=eq.sales&deleted=is.false&select=id,data,updated_at&order=updated_at.desc" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN"
```

Filtres courants (syntaxe PostgREST) :

| But | Paramètre |
| --- | --- |
| Changements depuis une date | `updated_at=gt.2026-11-15T08:00:00Z` |
| Ventes d'un jour | `data->>date=eq.2026-11-15` |
| Ventes d'un mois | `data->>date=gte.2026-11-01&data->>date=lte.2026-11-30` |
| Ventes d'un client | `data->>who=ilike.*fatou*` |
| Ventes pas encore payées | `data->>pay=eq.credit` |
| Pagination | `limit=500&offset=0` |

C'est ainsi que l'application se synchronise : elle lit les lignes dont `updated_at` est postérieur à la dernière lecture, triées par `updated_at`.

### Créer ou modifier

```bash
curl -X POST "$URL/rest/v1/records?on_conflict=business_id,kind,id" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=minimal" \
  -d '{"business_id":"<ID>","kind":"products","id":"p-coupe","data":{"id":"p-coupe","name":"Coupe","price":5000,"cost":1500,"qty":null,"min":0},"deleted":false}'
```

Le même appel crée la ligne ou la remplace entièrement. Un tableau de lignes est accepté (jusqu'à quelques centaines par appel).

### Supprimer

```bash
curl -X POST "$URL/rest/v1/records?on_conflict=business_id,kind,id" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=minimal" \
  -d '{"business_id":"<ID>","kind":"sales","id":"<ID_VENTE>","data":null,"deleted":true}'
```

N'utilisez pas `DELETE` : les règles de sécurité ne l'autorisent pas, et les autres téléphones ne verraient pas la suppression.

## 5. Contenu de `data` selon `kind`

Montants dans la devise de l'entreprise (`settings.currency`) ; dates au format `AAAA-MM-JJ` ; `at` en millisecondes depuis 1970.

### Article d'une vente, d'une commande ou d'une dépense

```json
{ "name": "Coupe + brushing", "qty": 2, "price": 3500 }
```

### `sales` : vente, facture et reçu

| Champ | Type | Description |
| --- | --- | --- |
| `id` | texte | Identifiant (identique à la colonne `id`) |
| `n` | entier | Numéro : vente `V-0042`, facture `F-0042`, reçu `R-0042` |
| `at` | nombre | Heure de création |
| `date` | date | Date de la vente |
| `who` | texte | Client (vide : client de passage) |
| `items` | liste | Articles |
| `disc` | nombre | Remise en montant |
| `tax` | nombre | Taxe ou TVA en % |
| `pay` | texte | `cash`, `mobile`, `card`, `bank`, ou `credit` (pas encore payée) |
| `paid` | nombre | Déjà encaissé, pour une vente `credit` |
| `payments` | liste | Versements : `{ "date", "amount", "method" }` |
| `due` | date | Échéance de la facture |
| `note` | texte | Note libre |

Calcul du total, identique à l'application :

```
sous-total = somme(qty × price)
net        = max(0, sous-total − disc)
taxe       = net × tax / 100
total      = net + taxe
reste      = si pay = "credit" : max(0, total − paid), sinon 0
```

Exemple :

```json
{
  "id": "mhz2k1a9x3", "n": 42, "at": 1794753600000, "date": "2026-11-15",
  "who": "Mme Ndiaye",
  "items": [{ "name": "Plateau traiteur", "qty": 2, "price": 20000 }],
  "disc": 4000, "tax": 18,
  "pay": "credit", "paid": 10000, "due": "2026-11-22",
  "payments": [{ "date": "2026-11-15", "amount": 10000, "method": "mobile" }],
  "note": ""
}
```

Total 42 480, déjà payé 10 000, reste 32 480.

### `purchases` : dépense

`id`, `n` (`D-0007`), `at`, `date`, `who` (fournisseur), `items`, `cat` (catégorie : `Loyer`, `Salaires`, `Transport`, `Marketing`, `Impôts & taxes`, `Autre`, ou une catégorie du métier), `note`.

### `orders` : commande ou devis

`id`, `n` (`C-0003`), `at`, `date`, `who`, `phone`, `items`, `disc`, `tax`, `due` (livraison prévue), `deposit` (acompte reçu), `status` (`new`, `prep`, `ready`, `done`), `saleId` (vente créée à la livraison), `note`.

### `products` : article ou service

| Champ | Type | Description |
| --- | --- | --- |
| `id` | texte | Identifiant |
| `name` | texte | Nom ; c'est lui qui relie l'article aux lignes des ventes |
| `price` | nombre | Prix de vente |
| `cost` | nombre | Coût de revient (0 si inconnu) |
| `qty` | nombre ou `null` | Stock ; `null` = stock non suivi (service) |
| `min` | nombre | Seuil d'alerte de stock |

### `contacts` : fiche client

La colonne `id` est le nom du client en minuscules (ex. `mme ndiaye`).

```json
{ "name": "Mme Ndiaye", "phone": "+221 77 000 00 01", "email": "ndiaye@example.com", "address": "Plateau, Dakar", "note": "" }
```

L'historique d'un client se retrouve en filtrant les ventes et commandes sur `data->>who`.

### `settings` : paramètres de l'entreprise

Une seule ligne, `id = "main"` : `name`, `owner`, `type` (`shop`, `food`, `service`, `beauty`, `fashion`, `tech`, `build`, `health`, `edu`, `transport`, `farm`, `other`), `currency`, `goal`, `taxRate`, `terms` (délai de paiement en jours), `phone`, `email`, `address`, `taxId`, `footer`, `color`, `logo` (image en `data:` URL).

## 6. Exemple en JavaScript

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://sktrzibeinhbblnovrct.supabase.co',
  'sb_publishable_3foU7MKb22wV2-9-2xJhaw_1IaCek8m'
);

await supabase.auth.signInWithPassword({ email: 'vous@exemple.com', password: '…' });
const { data: [biz] } = await supabase.rpc('my_business');

// Ventes du mois
const { data: rows } = await supabase.from('records')
  .select('id, data')
  .eq('business_id', biz.id).eq('kind', 'sales').eq('deleted', false)
  .gte('data->>date', '2026-11-01').lte('data->>date', '2026-11-30');

const total = (r) => {
  const sub = r.items.reduce((s, it) => s + it.qty * it.price, 0);
  const net = Math.max(0, sub - (r.disc || 0));
  return net + (net * (r.tax || 0)) / 100;
};
console.log(rows.length, 'ventes,', rows.reduce((s, x) => s + total(x.data), 0), biz.name);

// Nouvelle dépense
await supabase.from('records').upsert({
  business_id: biz.id, kind: 'purchases', id: crypto.randomUUID(),
  data: { n: 0, at: Date.now(), date: '2026-11-15', who: 'Marché central', cat: 'Ingrédients',
          items: [{ name: 'Riz 25 kg', qty: 1, price: 16000 }], note: '' },
  deleted: false,
}, { onConflict: 'business_id,kind,id' });
```

## 7. Erreurs courantes

| Réponse | Cause |
| --- | --- |
| `401` / `JWT expired` | Jeton expiré : renouvelez-le avec le `refresh_token` |
| `42501 permission denied for function …` | Appel sans jeton de session |
| `42501 new row violates row-level security policy` | L'utilisateur n'est pas membre de cette entreprise |
| `PGRST205 Could not find the table` | Schéma non installé : workflow `Supabase schema` |
| `400 Invalid login credentials` | E-mail ou mot de passe incorrect |
| `429` | Trop de requêtes ou d'e-mails : patientez |

## 8. Bonnes pratiques

- Écrivez toujours l'objet `data` complet : une écriture remplace la ligne entière.
- Pour un nouvel enregistrement, prenez un `id` unique (UUID) et un numéro `n` supérieur au plus grand numéro existant du même `kind`.
- Gardez le nom des articles identique à celui de `products` : le stock et les marges en dépendent.
- Ne stockez pas la clé secrète ni le jeton d'accès Supabase dans une application ou un site public.
