# 🚀 Guide d'Installation - Premier Vrai Marchand (Sans Billing)

**Date**: Décembre 2025  
**Objectif**: Installer StockEasy sur un vrai store Shopify sans passer par le billing  
**Statut**: Installation directe (pas via App Store)

---

## 📋 Checklist Pré-Installation

### ✅ 1. Variables d'Environnement Locales

Vérifie que ton fichier `.env.local` (ou `.env`) contient :

```env
# Gadget (Backend Shopify)
VITE_GADGET_API_URL=https://stockeasy-app.gadget.app
VITE_GADGET_INTERNAL_API_KEY=<ta_clé_api_gadget>

# Supabase (Frontend)
VITE_SUPABASE_URL=<ton_url_supabase>
VITE_SUPABASE_ANON_KEY=<ta_clé_anon_supabase>
```

**⚠️ Important** : Si tu utilises l'environnement de **production**, assure-toi que ces variables pointent vers la production.

---

### ✅ 2. Variables d'Environnement Vercel (Production)

Va sur [vercel.com](https://vercel.com) → Ton projet → **Settings** → **Environment Variables**

Assure-toi d'avoir configuré pour **Production** :

```env
VITE_GADGET_API_URL=https://stockeasy-app.gadget.app
VITE_GADGET_INTERNAL_API_KEY=<ta_clé_api_gadget>
VITE_SUPABASE_URL=<ton_url_supabase>
VITE_SUPABASE_ANON_KEY=<ta_clé_anon_supabase>
```

**⚠️ CRITIQUE** : Après avoir modifié les variables, tu dois **redéployer** :
- Soit via un push sur `main` (déploiement automatique)
- Soit manuellement : `vercel --prod`

---

### ✅ 3. Configuration Shopify App (Gadget)

Vérifie que `shopify.app.toml` est correctement configuré :

```toml
client_id = "17cb240cc35aedce49ed32a877805a83"  # Production
application_url = "https://stockeasy-app.gadget.app/api/shopify/install-or-render"
```

**Pour vérifier** :
```bash
cd stockeasy-app-gadget
cat shopify.app.toml | grep client_id
```

---

### ✅ 4. Déploiement Gadget

Assure-toi que l'app Gadget est bien déployée en production :

```bash
cd stockeasy-app-gadget
# Vérifie que tu es en production
yarn shopify:config:use:production
yarn shopify:info
```

---

## 🎯 Comment le Marchand Peut Installer l'App (Sans App Store)

### Option 1 : Lien Direct d'Installation (Recommandé ✅)

**C'est la méthode la plus simple et directe.**

#### Étape 1 : Construire le lien d'installation

Le lien suit ce format :

```
https://admin.shopify.com/store/[NOM-BOUTIQUE]/oauth/install?client_id=17cb240cc35aedce49ed32a877805a83
```

**Remplace `[NOM-BOUTIQUE]`** par le nom de la boutique (sans `.myshopify.com`).

**Exemple** :
- Si la boutique est `ma-boutique.myshopify.com`
- Le lien est : `https://admin.shopify.com/store/ma-boutique/oauth/install?client_id=17cb240cc35aedce49ed32a877805a83`

#### Étape 2 : Envoyer le lien au marchand

Envoie-lui ce message :

```
Salut [Prénom] ! 🚀

Merci de tester StockEasy ! Voici comment installer l'app :

🔗 Lien d'installation :
[COLLE LE LIEN ICI]

📋 Instructions :
1. Clique sur le lien ci-dessus
2. Connecte-toi à ton admin Shopify si demandé
3. Autorise les permissions demandées par StockEasy
4. Clique sur "Installer l'application"
5. Attends 3-5 minutes que la synchronisation se fasse

✅ Tests à faire après installation :
- Vérifie que tu vois tes produits dans l'onglet "Produits"
- Essaie de modifier le stock d'un produit
- Vérifie que ça se synchronise dans Shopify

🐛 Si problème :
Envoie-moi une capture d'écran + le message d'erreur !

Merci pour ton aide ! 🙏
```

---

### Option 2 : Via Shopify Partners Dashboard

1. Va sur [partners.shopify.com](https://partners.shopify.com)
2. Connecte-toi avec ton compte Shopify Partner
3. **Apps** → **stockeasy-app**
4. Clique sur **"Test your app"** ou **"Overview"**
5. Tu verras un bouton **"Select store"** ou **"Test on development store"**
6. **Sélectionne la boutique du marchand** OU entre son URL
7. **Copie le lien d'installation** qui s'affiche
8. Envoie ce lien au marchand

---

## 💰 Désactiver le Billing pour ce Marchand

### Option A : Utiliser l'Environnement de Développement (Le Plus Simple ✅)

**Si tu utilises le lien de développement**, le billing est automatiquement bypassé :

```
https://admin.shopify.com/store/[NOM-BOUTIQUE]/oauth/install?client_id=3e35969018e75cd4e60e339d1318a6b9
```

**Avantages** :
- ✅ Billing complètement bypassé
- ✅ Pas de page de paiement
- ✅ Accès immédiat à toutes les fonctionnalités

**Inconvénients** :
- ⚠️ Utilise l'environnement de développement (données séparées de la prod)

---

### Option B : Marquer comme "Active" dans Supabase (Production)

**Si tu utilises l'environnement de production**, après l'installation, marque manuellement le shop comme "active" :

#### Étape 1 : Trouver le shop dans Gadget

1. Va sur [gadget.dev](https://gadget.dev)
2. Ouvre ton projet **stockeasy-app**
3. **Data** → **shopifyShop**
4. Trouve le shop du marchand (recherche par domaine)

#### Étape 2 : Mettre à jour dans Supabase

Va sur [supabase.com](https://supabase.com) → Ton projet → **SQL Editor**

Exécute cette requête (remplace `[nom-boutique]` par le nom de la boutique) :

```sql
-- Trouver la company du marchand
SELECT id, shopify_shop_id, subscription_status, subscription_plan
FROM companies 
WHERE shopify_shop_id LIKE '%[nom-boutique]%';

-- Mettre à jour pour désactiver le billing
UPDATE companies 
SET 
  subscription_status = 'active',
  subscription_plan = 'basic',
  trial_ends_at = '2099-12-31'::timestamp,  -- Loin dans le futur
  max_sync_locations = 1
WHERE shopify_shop_id LIKE '%[nom-boutique]%';
```

#### Étape 3 : Mettre à jour dans Gadget (optionnel mais recommandé)

Dans Gadget Dashboard → **Data** → **shopifyShop** → Trouve le shop → Édite :

- `subscriptionStatus` : `active`
- `subscriptionPlan` : `basic`
- `trialEndsAt` : `2099-12-31` (ou une date lointaine)
- `billingActivatedAt` : Date actuelle

---

### Option C : Utiliser la Période d'Essai (14 jours)

Par défaut, l'app a 14 jours d'essai gratuit. Le marchand pourra utiliser l'app gratuitement pendant 14 jours, puis tu devras soit :
- Prolonger manuellement (Option B)
- Ou laisser le marchand accepter le paiement

**⚠️ Attention** : Si le marchand refuse le paiement après 14 jours, il perdra l'accès.

---

## 🔍 Vérification Post-Installation

### 1. Vérifier dans Gadget

```bash
cd stockeasy-app-gadget
yarn gadget:logs --follow
```

Tu devrais voir :
```
✅ Shop installation completed: [shop-domain].myshopify.com
✅ Company created: [company_id]
✅ Syncing products...
✅ Products synced: X products
```

### 2. Vérifier dans Supabase

Va sur [supabase.com](https://supabase.com) → **Table Editor** → **companies**

Vérifie que :
- ✅ Une nouvelle company a été créée
- ✅ `shopify_shop_id` correspond au domaine du shop
- ✅ `subscription_status` est `active` (si tu as fait l'Option B)

### 3. Tester l'App

1. Demande au marchand d'ouvrir l'app dans Shopify Admin
2. Vérifie qu'il voit ses produits
3. Teste la synchronisation du stock

---

## 🐛 Dépannage

### Problème : "L'app ne s'installe pas"

**Erreur** : `Invalid OAuth request`

**Solutions** :
1. Vérifie que le `client_id` est correct dans le lien
2. Vérifie que l'app est bien déployée sur Gadget
3. Vérifie que les URLs de callback sont correctes dans `shopify.app.toml`

### Problème : "Redirection vers la page de billing"

**Si tu utilises la production** et que le marchand est redirigé vers `/billing` :

1. Vérifie que tu as bien mis à jour `subscription_status` dans Supabase (Option B)
2. Vérifie que le shop dans Gadget a `subscriptionStatus: "active"`
3. Attends quelques secondes et demande au marchand de rafraîchir la page

### Problème : "Aucun produit ne se synchronise"

**Vérifications** :
1. Regarde les logs Gadget pour voir s'il y a des erreurs
2. Vérifie que `stockEasyCompanyId` est rempli dans le shop Gadget
3. Vérifie que les permissions Shopify sont correctes

---

## 📊 Résumé des Options

| Option | Billing affiché ? | Paiement réel ? | Recommandé ? |
|--------|-------------------|-----------------|--------------|
| **Env. Développement** | ❌ Non | ❌ Non | ✅✅ (Le plus simple) |
| **Prod + Whitelist Supabase** | ❌ Non | ❌ Non | ✅ (Pour production) |
| **Prod + 14j essai** | ✅ Oui | ❌ Non (pendant 14j) | ⚠️ (Temporaire) |

**Ma recommandation** : 
- Pour un **premier test** : Utilise l'**Option A (Environnement de Développement)**
- Pour un **test en production** : Utilise l'**Option B (Whitelist Supabase)**

---

## 🎉 Installation Réussie !

Tu sauras que tout fonctionne si :

✅ Le marchand voit ses produits dans l'app  
✅ Le stock se synchronise avec Shopify  
✅ Il peut créer des commandes  
✅ Les paramètres se sauvegardent  
✅ Aucune page de billing n'apparaît (si tu as bien configuré)

---

## 📞 Support

Si problème bloquant :
1. Regarde les logs Gadget
2. Regarde les logs Supabase
3. Vérifie la console du navigateur (F12)
4. Contacte le marchand pour plus d'infos

**Bon courage ! 🚀**
