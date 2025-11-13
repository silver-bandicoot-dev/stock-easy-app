# 🚀 Guide de Test Rapide - Onglet Paramètres

## ⚡ Test Automatique (2 minutes)

### Étape 1: Ouvrir la Console

1. Lancez l'application : `npm run dev`
2. Ouvrez votre navigateur sur `http://localhost:5173`
3. Connectez-vous à l'application
4. Appuyez sur **F12** pour ouvrir la console développeur
5. Allez dans l'onglet **Console**

### Étape 2: Exécuter le Test Automatique

Dans la console, tapez :

```javascript
testBackendConnection()
```

Appuyez sur **Entrée**.

### Étape 3: Observer les Résultats

Le script va automatiquement tester :
- ✅ Chargement des données (produits, fournisseurs, entrepôts, etc.)
- ✅ Mise à jour des paramètres généraux (devise, seuil, multiplicateur)
- ✅ CRUD Fournisseurs (Créer, Modifier, Supprimer)
- ✅ CRUD Entrepôts (Créer, Modifier, Supprimer)

**Résultat attendu** :
```
🎯 RÉSUMÉ DES TESTS
✅ Tests réussis: 15
❌ Tests échoués: 0
📊 Total: 15
📈 Taux de réussite: 100%

🎉 TOUS LES TESTS SONT PASSÉS !
✅ La connexion backend est fonctionnelle
```

---

## 🖱️ Test Manuel (5 minutes)

Si vous préférez tester manuellement :

### 1. Paramètres Généraux

1. Allez dans **Paramètres** → **Paramètres Généraux**
2. Changez la devise de **EUR** à **USD**
3. Cliquez sur **"Enregistrer les paramètres"**
4. ✅ Vérifiez le message de succès vert

### 2. Gestion des Fournisseurs

1. Allez dans **Paramètres** → **Gestion Fournisseurs**
2. Cliquez sur **"+ Nouveau fournisseur"**
3. Remplissez :
   - Nom : "Test Supplier"
   - Email : "test@test.com"
   - Délai : 14 jours
   - MOQ : 100
4. Cliquez sur **"Créer le fournisseur"**
5. ✅ Vérifiez que le fournisseur apparaît dans la liste

### 3. Mapping SKU-Fournisseur

1. Allez dans **Paramètres** → **Mapping SKU-Fournisseur**
2. Trouvez un produit
3. Cliquez sur **"Assigner fournisseur"**
4. Sélectionnez "Test Supplier"
5. ✅ Vérifiez que le fournisseur est assigné

### 4. Gestion des Entrepôts

1. Allez dans **Paramètres** → **Gestion Entrepôts**
2. Cliquez sur **"+ Nouvel entrepôt"**
3. Remplissez :
   - Nom : "Test Warehouse"
   - Ville : "Paris"
4. Cliquez sur **"Créer"**
5. ✅ Vérifiez que l'entrepôt apparaît dans la liste

---

## 🔍 Vérification Backend

Pour vérifier que les données sont bien dans Supabase :

### Dans Supabase Dashboard → SQL Editor

```sql
-- Vérifier les paramètres
SELECT * FROM parametres;

-- Vérifier les fournisseurs
SELECT * FROM fournisseurs ORDER BY created_at DESC LIMIT 5;

-- Vérifier les entrepôts
SELECT * FROM warehouses ORDER BY created_at DESC LIMIT 5;

-- Vérifier les mappings
SELECT sku, nom_produit, fournisseur FROM produits 
WHERE fournisseur IS NOT NULL 
LIMIT 10;
```

---

## ❌ Que Faire en Cas d'Erreur ?

### Erreur 404 "Function not found"

**Cause** : Les fonctions RPC n'existent pas dans Supabase.

**Solution** :
1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Exécutez la migration `012_fix_rpc_and_storage.sql`
3. Rechargez l'application

### Erreur 403 "Permission denied"

**Cause** : Les policies RLS ne sont pas configurées.

**Solution** :
1. Vérifiez que la migration `011_multi_tenant_system.sql` a été exécutée
2. Vérifiez que vous êtes bien connecté
3. Vérifiez les policies RLS dans Supabase

### Erreur "Network Error"

**Cause** : Problème de connexion avec Supabase.

**Solution** :
1. Vérifiez les variables d'environnement (`.env.local`) :
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-key
   ```
2. Relancez l'application : `npm run dev`
3. Vérifiez que Supabase est accessible

### Données ne s'affichent pas

**Cause** : Problème de mapping `company_id` multi-tenant.

**Solution** :
```sql
-- Vérifier le company_id de l'utilisateur
SELECT id, email, 
       (SELECT company_id FROM user_profiles WHERE id = auth.uid()) as company_id
FROM auth.users 
WHERE id = auth.uid();

-- Si company_id est NULL, exécutez:
-- Cela créera automatiquement une entreprise pour l'utilisateur
SELECT create_company_for_user();
```

---

## 📊 Checklist Rapide

- [ ] Test automatique exécuté
- [ ] Tous les tests sont passés (taux 100%)
- [ ] Paramètres généraux fonctionnent
- [ ] CRUD Fournisseurs fonctionne
- [ ] CRUD Entrepôts fonctionne
- [ ] Mapping SKU fonctionne
- [ ] Données persistées dans Supabase
- [ ] Aucune erreur dans la console
- [ ] Toasts de succès affichés

---

## ✅ Si Tous les Tests Passent

**🎉 Félicitations !** L'onglet Paramètres est **100% fonctionnel** et bien connecté au backend Supabase.

Vous pouvez maintenant :
- Configurer vos paramètres généraux
- Gérer vos fournisseurs
- Mapper vos produits aux fournisseurs
- Gérer vos entrepôts

Toutes les données sont sauvegardées en temps réel dans Supabase ! ✨

---

**Temps estimé** : 2-5 minutes  
**Difficulté** : Facile  
**Prérequis** : Application lancée, utilisateur connecté

