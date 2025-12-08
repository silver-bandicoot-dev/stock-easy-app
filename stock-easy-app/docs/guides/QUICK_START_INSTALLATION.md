# ⚡ Quick Start : Installer StockEasy chez un Marchand (5 min)

## 🎯 En 3 Étapes Simples

### 1️⃣ Génère le Lien d'Installation

**Le plus simple** : Va sur [partners.shopify.com](https://partners.shopify.com)
→ **Apps** → **stockeasy-app** → **Test your app** → Copie le lien

**Ou construis le lien** :

```
https://admin.shopify.com/store/[NOM-BOUTIQUE]/oauth/install?client_id=17cb240cc35aedce49ed32a877805a83
```

**Exemple** :
```
https://admin.shopify.com/store/ma-boutique/oauth/install?client_id=17cb240cc35aedce49ed32a877805a83
```

### 2️⃣ Envoie le Message

```
Salut [Prénom] ! 🚀

Clique sur ce lien pour installer StockEasy :
[COLLE LE LIEN ICI]

Instructions :
1. Clique sur le lien
2. Connecte-toi à ton Shopify
3. Autorise les permissions
4. Attends 3-5 minutes

Fais-moi signe si ça coince ! 👍
```

### 3️⃣ Vérifie que ça Marche

**Dans Supabase** :
```sql
SELECT * FROM companies 
WHERE shopify_shop_id LIKE '%[nom-boutique]%' 
ORDER BY created_at DESC LIMIT 1;
```

✅ Si tu vois une ligne → c'est bon !

**Demande à ta marchande** :
- "Est-ce que tu vois tes produits dans l'onglet Produits ?"

✅ Si oui → Installation réussie ! 🎉

---

## 🐛 Si Problème

**Aucun produit ne s'affiche** :
1. Attends 5 minutes (synchro en cours)
2. Regarde les logs Gadget : `yarn gadget:logs`
3. Vérifie Supabase → Table `produits`

**"Access Denied"** :
1. Vérifie RLS dans Supabase
2. Vérifie `company_id` dans les tables
3. Re-déploie l'app si besoin

---

## ✅ C'est Tout !

**Guides complets** :
- Pour toi : [`COMMENT_INSTALLER_CHEZ_MARCHAND.md`](./COMMENT_INSTALLER_CHEZ_MARCHAND.md)
- Pour ta marchande : [`INSTALLATION_MARCHANDE_TEST.md`](./INSTALLATION_MARCHANDE_TEST.md)

**Bon test ! 🚀**

