# 🚀 Guide d'Installation StockEasy - Marchande Test

**Date**: 7 Décembre 2025  
**Public**: Marchands testeurs  
**Temps estimé**: 10-15 minutes

---

## 📋 Prérequis

✅ Avoir une boutique Shopify (plan Basic minimum)  
✅ Être propriétaire ou admin de la boutique  
✅ Avoir des produits existants dans Shopify (optionnel mais recommandé)

---

## 🔗 Méthode 1 : Installation via Lien Direct (Recommandée)

### Étape 1 : Obtenir le lien d'installation

**Le développeur doit te fournir UN de ces liens** :

#### Production (données réelles) :
```
https://admin.shopify.com/store/[TON-STORE]/oauth/install?client_id=17cb240cc35aedce49ed32a877805a83
```

#### Développement (tests avec rollback) :
```
https://admin.shopify.com/store/[TON-STORE]/oauth/install?client_id=3e35969018e75cd4e60e339d1318a6b9
```

**Remplace `[TON-STORE]`** par le nom de ta boutique Shopify.

**Exemple** : Si ton URL est `ma-boutique.myshopify.com`, utilise :
```
https://admin.shopify.com/store/ma-boutique/oauth/install?client_id=17cb240cc35aedce49ed32a877805a83
```

### Étape 2 : Installer l'app

1. **Clique sur le lien** que le développeur t'a envoyé
2. **Connecte-toi** à ton admin Shopify si demandé
3. **Autorise les permissions** demandées par StockEasy :
   - ✅ Lecture des produits
   - ✅ Écriture de l'inventaire
   - ✅ Lecture des commandes
   - ✅ Lecture des emplacements
4. **Clique sur "Installer l'application"**

### Étape 3 : Première connexion

Après l'installation, tu seras redirigé vers l'app StockEasy.

**🎉 Si tu vois le Dashboard, c'est bon !**

---

## 📊 Étape 4 : Synchronisation Initiale

### Automatique (recommandé)

StockEasy va automatiquement :
1. **Créer ton compte** et ta compagnie dans la base de données
2. **Synchroniser tes produits** Shopify (peut prendre 2-5 minutes)
3. **Synchroniser tes commandes** des 30 derniers jours
4. **Synchroniser tes emplacements** (entrepôts)

**⏱️ Attends 3-5 minutes** que la synchronisation se termine.

### Vérification

Pour vérifier que tout fonctionne :

1. **Onglet "Produits"** → Tu devrais voir tes produits Shopify
2. **Onglet "Dashboard"** → Tu devrais voir tes KPIs
3. **Onglet "Paramètres"** → Configure ta devise et tes seuils

---

## 🧪 Étape 5 : Tests à Effectuer

### Tests Prioritaires (Obligatoires)

| Test | Action | Résultat Attendu |
|------|--------|------------------|
| **1. Voir les produits** | Onglet Produits | Liste de tous tes produits Shopify |
| **2. Rechercher un produit** | Barre de recherche | Résultats pertinents |
| **3. Modifier le stock** | Éditer un produit → Changer stock → Sauvegarder | Stock mis à jour dans Shopify |
| **4. Créer une commande** | Onglet Commandes → Créer | Commande créée |
| **5. Réconcilier une commande** | Onglet Commandes → Réconcilier | Stock mis à jour |
| **6. Paramètres** | Onglet Paramètres → Changer devise → Sauvegarder | Devise changée et sauvegardée |

### Tests Secondaires (Recommandés)

| Test | Action | Résultat Attendu |
|------|--------|------------------|
| **7. Créer un fournisseur** | Onglet Fournisseurs → Ajouter | Fournisseur créé |
| **8. Créer un entrepôt** | Onglet Entrepôts → Ajouter | Entrepôt créé |
| **9. Dashboard KPIs** | Onglet Dashboard | Voir valeur du stock, rotation, etc. |
| **10. Multi-onglets** | Ouvrir l'app dans 2 onglets | Pas de conflits |

---

## 🐛 En Cas de Problème

### Problème 1 : "L'app ne s'installe pas"

**Causes possibles** :
- ❌ Lien d'installation incorrect
- ❌ Pas les droits admin sur la boutique
- ❌ Boutique Shopify en essai expiré

**Solution** :
1. Vérifie que tu es bien admin de la boutique
2. Demande au développeur de vérifier le lien
3. Essaie avec un autre navigateur (Chrome recommandé)

### Problème 2 : "Aucun produit ne s'affiche"

**Causes possibles** :
- ⏱️ Synchronisation en cours (attends 5 minutes)
- ❌ Aucun produit dans ta boutique Shopify
- ❌ Erreur de synchronisation

**Solution** :
1. Attends 5 minutes et rafraîchis la page
2. Vérifie que tu as des produits dans ton admin Shopify
3. Regarde la console du navigateur (F12) pour voir les erreurs
4. Contacte le développeur avec le message d'erreur

### Problème 3 : "Le stock ne se synchronise pas avec Shopify"

**Causes possibles** :
- ❌ Produits "untracked" dans Shopify (inventaire non suivi)
- ❌ Permissions insuffisantes
- ❌ Erreur de l'API Shopify

**Solution** :
1. Dans Shopify Admin → Produits → Vérifie que "Track quantity" est coché
2. Vérifie que l'app a les permissions "Écriture inventaire"
3. Essaie de modifier le stock directement dans Shopify pour confirmer
4. Contacte le développeur si le problème persiste

### Problème 4 : "Erreur 'Access Denied' ou 'Permission Denied'"

**Causes possibles** :
- ❌ Multi-tenant mal configuré (CRITIQUE)
- ❌ Session expirée
- ❌ Problème de permissions Shopify

**Solution** :
1. Déconnecte-toi et reconnecte-toi
2. Vérifie que tu es dans la bonne boutique
3. **SI PERSISTANT** : Contacte IMMÉDIATEMENT le développeur (c'est critique)

---

## 📸 Captures d'Écran Utiles

En cas de problème, envoie au développeur :

1. **Capture d'écran de l'erreur** (si affichée)
2. **Console du navigateur** (F12 → Console)
3. **URL de la page** où l'erreur se produit
4. **Nom de ta boutique Shopify**

---

## ✅ Checklist Post-Installation

- [ ] J'ai pu installer l'app sans erreur
- [ ] Je vois mes produits dans l'onglet Produits
- [ ] Je peux rechercher un produit
- [ ] Je peux modifier le stock d'un produit
- [ ] Le stock se synchronise avec Shopify
- [ ] Je peux créer une commande
- [ ] Je peux accéder aux paramètres
- [ ] La devise par défaut est correcte
- [ ] Je ne vois QUE mes produits (pas ceux d'autres marchands)

---

## 📞 Contact en Cas de Problème

Si tu rencontres un problème :

1. **Note le message d'erreur exact**
2. **Prends une capture d'écran**
3. **Ouvre la console du navigateur** (F12 → Console) et copie les erreurs
4. **Envoie tout ça au développeur** avec :
   - Nom de ta boutique
   - Ce que tu essayais de faire
   - L'heure approximative du problème

---

## 🎉 Bravo !

Si tous les tests sont verts, l'app fonctionne correctement chez toi !

**Merci d'être testeuse** 🙏

---

## 📚 Ressources Complémentaires

- [Guide Utilisateur Complet](./GUIDE_UTILISATEUR_STOCKEASY.md) (à créer)
- [FAQ StockEasy](./FAQ_STOCKEASY.md) (à créer)
- [Vidéo de Démo](https://youtube.com/...) (à créer)


