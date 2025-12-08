# 💰 Options pour Éviter le Paiement lors des Tests

**Date**: 7 Décembre 2025  
**Public**: Développeurs / Testeurs  
**Objectif**: Permettre aux marchands testeurs d'utiliser StockEasy sans payer

---

## 🎯 Options Disponibles

### Option 1 : Development Store (Recommandé ✅)

**Si ta marchande a un "Development Store" Shopify, elle ne paiera JAMAIS automatiquement.**

#### Comment savoir si c'est un dev store ?

- Créé depuis Shopify Partners
- URL contient souvent `-dev` ou `development`
- Pas de vraies transactions possibles

#### Comment créer un dev store pour elle ?

1. Va sur [partners.shopify.com](https://partners.shopify.com)
2. **Stores** → **Add store**
3. **Development store**
4. Crée-le avec son email
5. Elle pourra migrer ses données plus tard

---

### Option 2 : Utiliser l'environnement de Développement (Simple ✅)

**Le code a déjà un bypass automatique en environnement de développement :**

```javascript
// web/components/App.jsx - ligne 119-120
if (isDevelopment) {
  console.log("🔧 DEV MODE: Billing check bypassed");
  return; // Skip billing check
}
```

#### Pour utiliser cette option :

1. **Installe l'app avec le lien de développement** :
   ```
   https://admin.shopify.com/store/[NOM-BOUTIQUE]/oauth/install?client_id=3e35969018e75cd4e60e339d1318a6b9
   ```

2. **Le billing sera complètement bypassé** ✅

---

### Option 3 : Période d'Essai de 14 Jours (Par défaut)

**L'app a déjà 14 jours d'essai gratuit configurés :**

```javascript
// createSubscription.js - ligne 24
trialDays: 14,
```

#### Avec cette option :

- ✅ Ta marchande peut utiliser l'app gratuitement pendant 14 jours
- ⚠️ Après 14 jours, elle devra accepter le paiement ou tu prolonges manuellement

---

### Option 4 : Whitelist Manuelle dans Supabase (Permanent)

**Tu peux marquer manuellement sa company comme "active" dans Supabase pour qu'elle n'ait jamais à payer.**

#### Après son installation :

```sql
-- Dans Supabase SQL Editor
UPDATE companies 
SET 
  subscription_status = 'active',
  subscription_plan = 'basic',
  trial_ends_at = '2099-12-31'::timestamp  -- Loin dans le futur
WHERE shopify_shop_id LIKE '%[nom-boutique]%';
```

---

## 🚀 Ma Recommandation

### **Utilise l'Option 2 (Environnement de Développement)**

C'est le plus simple :

1. **Envoie ce lien à ta marchande** :
   ```
   https://admin.shopify.com/store/[NOM-BOUTIQUE]/oauth/install?client_id=3e35969018e75cd4e60e339d1318a6b9
   ```
   *(Remplace `[NOM-BOUTIQUE]` par le nom de sa boutique)*

2. **Le billing sera automatiquement bypassé** car c'est l'environnement de développement

3. **Elle aura accès à TOUTES les fonctionnalités** sans jamais voir la page de paiement

---

## ⚠️ Important

### Si tu utilises l'environnement de **Production** :

Ta marchande verra la page de billing après l'installation. Elle devra :

1. Cliquer sur "Démarrer l'essai gratuit"
2. Shopify lui montrera une page de confirmation (mais avec `test: true` si c'est un dev store, pas de vraie charge)

**Si elle clique "Annuler"** sur cette page, elle ne pourra pas accéder à l'app.

### Donc pour éviter tout problème :

**→ Utilise le lien de DÉVELOPPEMENT pour les tests** :
```
https://admin.shopify.com/store/[NOM-BOUTIQUE]/oauth/install?client_id=3e35969018e75cd4e60e339d1318a6b9
```

---

## 📋 Résumé

| Option | Billing affiché ? | Paiement réel ? | Recommandé pour tests ? |
|--------|-------------------|-----------------|-------------------------|
| **Dev Store + Prod** | Oui (test mode) | Non | ✅ |
| **Env. Développement** | **Non** | Non | ✅✅ (Le plus simple) |
| **Prod + 14j essai** | Oui | Après 14j | ⚠️ |
| **Whitelist manuelle** | Non (si bien fait) | Non | ✅ |

**Mon conseil** : Utilise l'environnement de développement pour cette phase de test. C'est fait pour ça ! 🚀

---

## 🔗 Liens Utiles

- [Guide Installation Marchande](./INSTALLATION_MARCHANDE_TEST.md)
- [Guide Installation Développeur](./COMMENT_INSTALLER_CHEZ_MARCHAND.md)
- [Quick Start Installation](./QUICK_START_INSTALLATION.md)

---

**Dernière mise à jour** : 7 Décembre 2025


