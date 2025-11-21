# ✅ Checklist d'Isolation Complète Multi-Tenant

Ce document liste toutes les tables et vérifie que chaque entreprise est complètement isolée.

## 🔒 Tables avec Isolation Complète

### ✅ Tables Principales (Migration 011 + 046)

- [x] `public.companies` - Table des entreprises
- [x] `public.user_profiles` - Profils utilisateurs avec company_id
- [x] `public.produits` - Produits (company_id + RLS strict)
- [x] `public.fournisseurs` - Fournisseurs (company_id + RLS strict)
- [x] `public.commandes` - Commandes (company_id + RLS strict)
- [x] `public.warehouses` - Entrepôts (company_id + RLS strict)
- [x] `public.parametres` - Paramètres (company_id + RLS strict)
- [x] `public.sku_fournisseurs` - Mapping SKU-Fournisseurs (company_id + RLS strict)
- [x] `public.kpi_snapshots` - Snapshots KPI (company_id + RLS strict)
- [x] `public.invitations` - Invitations (company_id + RLS)

### ✅ Tables Secondaires (Migration 047)

- [x] `public.order_comments` - Commentaires de commandes (company_id + RLS strict)
- [x] `public.notifications` - Notifications (company_id + RLS strict)
- [x] `public.articles_commande` - Articles de commande (company_id + RLS strict)
- [x] `public.sales_history` - Historique des ventes (company_id + RLS strict, si existe)

## 📋 Vérifications à Effectuer

### 1. Vérifier que toutes les tables ont `company_id`

```sql
-- Lister toutes les tables avec company_id
SELECT 
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'company_id'
ORDER BY table_name;
```

**Résultat attendu :** Toutes les tables métier doivent avoir `company_id` avec `is_nullable = 'NO'`

### 2. Vérifier que RLS est activé sur toutes les tables

```sql
-- Lister toutes les tables avec RLS activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN ('_prisma_migrations', 'schema_migrations')
ORDER BY tablename;
```

**Résultat attendu :** `rowsecurity = true` pour toutes les tables métier

### 3. Vérifier que les policies RLS utilisent `get_current_user_company_id()`

```sql
-- Lister toutes les policies RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Résultat attendu :** Toutes les policies doivent contenir `get_current_user_company_id()` et **PAS** `company_id IS NULL`

### 4. Vérifier que les triggers `auto_set_company_id` existent

```sql
-- Lister tous les triggers pour auto_set_company_id
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE 'set_company_id%'
ORDER BY table_name;
```

**Résultat attendu :** Un trigger pour chaque table métier

### 5. Tester l'isolation avec deux comptes

```sql
-- Se connecter en tant qu'utilisateur A
-- Vérifier qu'il ne voit que ses données
SELECT COUNT(*) FROM public.produits; -- Doit retourner uniquement les produits de l'entreprise A

-- Se connecter en tant qu'utilisateur B (entreprise différente)
-- Vérifier qu'il ne voit que ses données
SELECT COUNT(*) FROM public.produits; -- Doit retourner uniquement les produits de l'entreprise B
```

## 🚀 Migrations à Appliquer

Appliquez les migrations dans cet ordre :

1. **045_fix_company_creation_trigger.sql** - Corrige le trigger de création
2. **046_strict_multi_tenant_isolation.sql** - Isolation stricte des tables principales
3. **047_complete_multi_tenant_isolation.sql** - Isolation complète (toutes les tables)

```bash
cd stock-easy-app
supabase db push
```

## ⚠️ Avant d'Appliquer les Migrations

### Nettoyer les données existantes

Si vous avez des données sans `company_id`, exécutez d'abord :

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
    
    -- Tables secondaires
    UPDATE public.order_comments oc
    SET company_id = c.company_id
    FROM public.commandes c
    WHERE oc.order_id = c.id AND oc.company_id IS NULL;
    
    UPDATE public.notifications n
    SET company_id = up.company_id
    FROM public.user_profiles up
    WHERE n.user_id = up.id AND n.company_id IS NULL;
  END IF;
END $$;
```

## ✅ Tests d'Isolation

### Test 1 : Isolation Basique

1. Créer deux comptes (Entreprise A et Entreprise B)
2. Ajouter des produits dans l'Entreprise A
3. Se connecter avec l'Entreprise B
4. **Vérifier** : L'Entreprise B ne voit PAS les produits de l'Entreprise A

### Test 2 : Isolation des Commentaires

1. Entreprise A : Créer une commande et ajouter un commentaire
2. Entreprise B : Se connecter
3. **Vérifier** : L'Entreprise B ne voit PAS le commentaire de l'Entreprise A

### Test 3 : Isolation des Notifications

1. Entreprise A : Mentionner un utilisateur dans un commentaire
2. Entreprise B : Se connecter
3. **Vérifier** : L'Entreprise B ne reçoit PAS la notification de l'Entreprise A

### Test 4 : Création de Données

1. Se connecter avec l'Entreprise A
2. Créer un nouveau produit, fournisseur, commande, etc.
3. **Vérifier** : Toutes les nouvelles données ont automatiquement le `company_id` de l'Entreprise A
4. Se connecter avec l'Entreprise B
5. **Vérifier** : L'Entreprise B ne voit AUCUNE des données créées par l'Entreprise A

## 🔐 Garanties de Sécurité

Une fois les migrations appliquées, vous avez les garanties suivantes :

1. ✅ **Isolation au niveau base de données** : Même si le code frontend a un bug, la base bloque l'accès
2. ✅ **Pas de données partagées** : Chaque entreprise ne voit que ses propres données
3. ✅ **Création automatique** : Toutes les nouvelles données sont automatiquement assignées à la bonne entreprise
4. ✅ **Invitations sécurisées** : Les collaborateurs ne voient que les données de leur entreprise
5. ✅ **Audit trail** : Toutes les actions sont tracées avec `auth.uid()` et `company_id`

## 📚 Documentation Complémentaire

- `docs/MULTI_TENANT_SECURITY_GUIDE.md` - Guide complet sur l'isolation
- `docs/EMAIL_CONFIRMATION_AND_MULTI_TENANT_FIX.md` - Guide de correction
- `supabase/migrations/011_multi_tenant_system.sql` - Migration initiale
- `supabase/migrations/045_fix_company_creation_trigger.sql` - Correction trigger
- `supabase/migrations/046_strict_multi_tenant_isolation.sql` - Isolation stricte
- `supabase/migrations/047_complete_multi_tenant_isolation.sql` - Isolation complète

## 🆘 En Cas de Problème

Si vous rencontrez des erreurs :

1. **Erreur "company_id cannot be null"** : Vous avez des données sans company_id. Exécutez le script de nettoyage ci-dessus.

2. **Erreur "permission denied"** : Vérifiez que les policies RLS sont bien créées et utilisent `get_current_user_company_id()`.

3. **Les utilisateurs voient les données d'autres entreprises** : Vérifiez que les policies RLS n'ont PAS `OR company_id IS NULL`.

4. **Les nouvelles données n'ont pas de company_id** : Vérifiez que les triggers `auto_set_company_id` sont actifs.

