# 🚀 Guide d'Application de la Migration 027

## Problème

L'erreur `Could not find the function public.update_product_multiplier` indique que la migration 027 n'a pas encore été appliquée dans votre base de données Supabase.

## Solution : Appliquer la Migration

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans **SQL Editor**

### Étape 2 : Appliquer la Migration

1. Ouvrez le fichier : `stock-easy-app/supabase/migrations/027_initialize_multiplicateur_prevision.sql`
2. Copiez **tout le contenu** du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter` (ou `Cmd+Enter` sur Mac)

### Étape 3 : Vérifier l'Application

Après l'exécution, vous devriez voir des messages de succès dans les logs :

```
✅ Colonne multiplicateur_prevision vérifiée/créée
✅ Fonction initialize_multiplicateur_prevision() créée
✅ Trigger trigger_initialize_multiplicateur_prevision créé
✅ Fonction update_product_multiplier() créée
✅ Fonction reset_product_multiplier_to_default() créée
✅ X produit(s) existant(s) mis à jour
🎉 Migration 027 terminée avec succès!
```

### Étape 4 : Vérifier les Fonctions

Pour vérifier que les fonctions ont été créées, exécutez cette requête :

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product_multiplier',
    'reset_product_multiplier_to_default',
    'initialize_multiplicateur_prevision'
  );
```

Vous devriez voir les 3 fonctions listées.

### Étape 5 : Tester les Fonctions

Testez la fonction de mise à jour :

```sql
-- Tester avec un produit existant (remplacez 'SKU-001' par un SKU réel)
SELECT public.update_product_multiplier('SKU-001', 1.5);
```

Vous devriez recevoir un JSON avec `success: true`.

## Alternative : Application via Supabase CLI

Si vous utilisez Supabase CLI localement :

```bash
cd stock-easy-app
supabase db push
```

Ou pour appliquer une migration spécifique :

```bash
supabase migration up 027
```

## Vérification Rapide

Pour vérifier rapidement si la colonne existe :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'produits' 
  AND column_name = 'multiplicateur_prevision';
```

Si la requête retourne un résultat, la colonne existe. Sinon, la migration n'a pas été appliquée.

## Dépannage

### Erreur : "function already exists"

Si vous voyez cette erreur, c'est que la fonction existe déjà. Vous pouvez soit :
- Ignorer l'erreur (la fonction fonctionne)
- Ou supprimer la fonction avant de réappliquer :
  ```sql
  DROP FUNCTION IF EXISTS public.update_product_multiplier(TEXT, NUMERIC);
  DROP FUNCTION IF EXISTS public.reset_product_multiplier_to_default(TEXT);
  ```

### Erreur : "column already exists"

C'est normal si la colonne existe déjà. La migration utilise `IF NOT EXISTS` donc elle ne devrait pas causer d'erreur, mais si c'est le cas, vous pouvez ignorer cette partie.

## Après l'Application

Une fois la migration appliquée :
1. ✅ Rechargez votre application
2. ✅ Allez dans **Paramètres** → **Multiplicateurs de Prévision**
3. ✅ Vous devriez pouvoir modifier les multiplicateurs sans erreur

