# 📋 Guide : Comment Appliquer les Migrations d'Isolation

## 🎯 Objectif

Appliquer les migrations 045, 046, et 047 pour garantir l'isolation complète de toutes les tables par entreprise.

## ⚠️ Ordre d'Application CRITIQUE

**Vous DEVEZ appliquer les migrations dans cet ordre :**

1. **045** - Corrige le trigger de création de company
2. **046** - Isolation stricte des tables principales
3. **047** - Isolation complète (toutes les tables)

## 📝 Ce que fait chaque migration

### Migration 045 : Fix Company Creation Trigger

**Objectif** : Corriger le trigger qui crée automatiquement une company pour chaque nouvel utilisateur

**Ce qu'elle fait** :
- ✅ Vérifie si un profil existe déjà (pour gérer les invitations)
- ✅ Crée une nouvelle company pour chaque nouvel utilisateur
- ✅ Assigne le rôle 'owner' au créateur
- ✅ S'assure que le trigger fonctionne correctement

**Impact** : Les nouveaux utilisateurs auront automatiquement leur propre company

### Migration 046 : Strict Multi-Tenant Isolation

**Objectif** : Renforcer l'isolation des tables principales (supprimer `OR company_id IS NULL`)

**Ce qu'elle fait** :
- ✅ Rend `company_id` obligatoire (NOT NULL) sur les tables principales
- ✅ Supprime la clause `OR company_id IS NULL` des policies RLS
- ✅ Met à jour `get_all_data()` pour filtrer strictement par company_id
- ✅ S'assure que RLS est activé sur toutes les tables

**Tables concernées** :
- `produits`
- `fournisseurs`
- `commandes`
- `warehouses`
- `parametres`
- `sku_fournisseurs`
- `kpi_snapshots`

**Impact** : Aucune entreprise ne peut voir les données d'une autre (même par accident)

### Migration 047 : Complete Multi-Tenant Isolation

**Objectif** : Isoler les tables secondaires qui n'étaient pas encore isolées

**Ce qu'elle fait** :
- ✅ Ajoute `company_id` aux tables manquantes :
  - `order_comments` (commentaires)
  - `notifications` (notifications)
  - `articles_commande` (articles de commande)
  - `sales_history` (si existe)
- ✅ Crée les triggers pour auto-assigner `company_id`
- ✅ Met à jour les policies RLS pour ces tables
- ✅ Met à jour la fonction `notify_mentioned_users()` pour respecter l'isolation

**Impact** : 100% des tables sont maintenant isolées

## 🚀 Comment Appliquer

### Méthode 1 : Via Supabase CLI (Recommandé)

```bash
cd stock-easy-app
supabase db push
```

Cette commande appliquera automatiquement toutes les migrations dans l'ordre.

### Méthode 2 : Via Dashboard Supabase

1. Allez dans **SQL Editor** dans le Dashboard Supabase
2. Ouvrez le fichier `045_fix_company_creation_trigger.sql`
3. Copiez tout le contenu
4. Collez dans le SQL Editor
5. Cliquez sur **Run**
6. Répétez pour **046**, puis **047**

### Méthode 3 : Une par une (si vous avez des erreurs)

Si vous rencontrez des erreurs, appliquez-les une par une :

```sql
-- 1. D'abord 045
-- Copiez-collez le contenu de 045_fix_company_creation_trigger.sql
-- Exécutez

-- 2. Ensuite 046
-- Copiez-collez le contenu de 046_strict_multi_tenant_isolation.sql
-- Exécutez

-- 3. Enfin 047
-- Copiez-collez le contenu de 047_complete_multi_tenant_isolation.sql
-- Exécutez
```

## ⚠️ AVANT d'Appliquer : Nettoyer les Données Existantes

Si vous avez des données existantes sans `company_id`, vous DEVEZ d'abord les nettoyer :

```sql
-- Assigner les données orphelines à la première company
DO $$
DECLARE
  v_default_company_id UUID;
BEGIN
  SELECT id INTO v_default_company_id
  FROM public.companies
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_default_company_id IS NOT NULL THEN
    -- Tables principales
    UPDATE public.produits SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.fournisseurs SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.commandes SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.warehouses SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.parametres SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.sku_fournisseurs SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.kpi_snapshots SET company_id = v_default_company_id WHERE company_id IS NULL;
    
    -- Tables secondaires (si elles existent)
    UPDATE public.order_comments oc
    SET company_id = c.company_id
    FROM public.commandes c
    WHERE oc.order_id = c.id AND oc.company_id IS NULL;
    
    UPDATE public.notifications n
    SET company_id = up.company_id
    FROM public.user_profiles up
    WHERE n.user_id = up.id AND n.company_id IS NULL;
    
    RAISE NOTICE '✅ Données orphelines assignées à la company: %', v_default_company_id;
  ELSE
    RAISE WARNING '⚠️ Aucune company trouvée. Créez d''abord une company.';
  END IF;
END $$;
```

## ✅ Après Application : Vérifier

Après avoir appliqué les 3 migrations, exécutez à nouveau le script de vérification :

```sql
-- Exécutez le contenu de 048_verify_complete_isolation.sql
```

Vous devriez voir :
```
✅ TOUTES LES TABLES SONT ISOLÉES !
✅ TOUTES LES POLICIES SONT CORRECTES !
✅ TOUS LES TRIGGERS SONT EN PLACE !
```

## 🐛 En Cas d'Erreur

### Erreur : "column company_id cannot be null"

**Cause** : Vous avez des données sans `company_id`

**Solution** : Exécutez d'abord le script de nettoyage ci-dessus

### Erreur : "relation already exists"

**Cause** : La migration a déjà été appliquée partiellement

**Solution** : C'est OK, la migration utilise `IF NOT EXISTS` et `DROP IF EXISTS`, elle peut être réexécutée

### Erreur : "permission denied"

**Cause** : Vous n'avez pas les permissions nécessaires

**Solution** : Utilisez un compte avec les permissions `service_role` ou exécutez via Supabase CLI

## 📊 Checklist

- [ ] Nettoyer les données existantes (si nécessaire)
- [ ] Appliquer migration 045
- [ ] Vérifier qu'il n'y a pas d'erreur
- [ ] Appliquer migration 046
- [ ] Vérifier qu'il n'y a pas d'erreur
- [ ] Appliquer migration 047
- [ ] Vérifier qu'il n'y a pas d'erreur
- [ ] Exécuter le script de vérification 048
- [ ] Confirmer que tout est OK

## 🎯 Résultat Attendu

Après application des 3 migrations :

1. ✅ Chaque nouvel utilisateur a automatiquement sa propre company
2. ✅ Toutes les tables métier sont isolées par `company_id`
3. ✅ Aucune entreprise ne peut voir les données d'une autre
4. ✅ Toutes les nouvelles données sont automatiquement assignées à la bonne entreprise

---

**Note** : Le script 048 que vous avez exécuté est juste une vérification. Il ne modifie rien. Les migrations 045, 046, et 047 sont celles qui APPLIQUENT les corrections.

