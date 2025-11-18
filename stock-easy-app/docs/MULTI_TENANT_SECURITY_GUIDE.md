# Guide de Sécurité Multi-Tenant

## 🔒 Isolation des Données par Entreprise

Ce document explique comment fonctionne l'isolation des données dans Stock Easy App. Chaque entreprise ne peut voir et modifier QUE ses propres données.

## Architecture

### 1. Structure Multi-Tenant

```
┌─────────────────────────────────────────┐
│         auth.users (Supabase Auth)        │
│  - Chaque utilisateur a un ID unique    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      public.user_profiles               │
│  - id (FK vers auth.users)              │
│  - company_id (FK vers companies)      │
│  - role (owner/admin/member)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      public.companies                   │
│  - id (UUID unique)                     │
│  - owner_id (FK vers auth.users)        │
│  - name, industry, etc.                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Toutes les tables métier               │
│  - produits                             │
│  - fournisseurs                         │
│  - commandes                            │
│  - warehouses                           │
│  - parametres                           │
│  - sku_fournisseurs                     │
│  - kpi_snapshots                        │
│  - sales_history                        │
│                                         │
│  Chaque table a:                        │
│  - company_id (FK vers companies)      │
│  - RLS activé                          │
└─────────────────────────────────────────┘
```

### 2. Row Level Security (RLS)

**Toutes les tables métier ont des policies RLS qui garantissent :**

```sql
-- Exemple pour la table produits
CREATE POLICY "Users can only see their company's products"
  ON public.produits FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());
```

**Cela signifie :**
- ✅ Un utilisateur ne peut **SELECT** que les produits de sa company
- ✅ Un utilisateur ne peut **INSERT** que des produits avec son company_id
- ✅ Un utilisateur ne peut **UPDATE** que les produits de sa company
- ✅ Un utilisateur ne peut **DELETE** que les produits de sa company

### 3. Fonction `get_current_user_company_id()`

Cette fonction récupère le `company_id` de l'utilisateur actuellement connecté :

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.user_profiles
  WHERE id = auth.uid(); -- auth.uid() = ID de l'utilisateur connecté
  
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Important :**
- `auth.uid()` est fourni automatiquement par Supabase
- Cette fonction est utilisée dans TOUTES les policies RLS
- Si l'utilisateur n'a pas de `company_id`, la fonction retourne `NULL` et l'utilisateur ne voit aucune donnée

### 4. Création Automatique de Company

Quand un nouvel utilisateur s'inscrit :

1. **Trigger `on_auth_user_created`** se déclenche automatiquement
2. **Fonction `create_company_for_user()`** :
   - Crée une nouvelle `company` avec l'utilisateur comme `owner`
   - Crée un `user_profile` avec `company_id` et `role = 'owner'`
3. L'utilisateur a maintenant accès uniquement à sa company

### 5. Invitation de Collaborateurs

Quand un propriétaire invite un collaborateur :

1. Une **invitation** est créée dans `public.invitations`
2. Le collaborateur accepte l'invitation via `/accept-invitation`
3. Son `user_profile` est mis à jour avec le `company_id` de l'entreprise
4. Il peut maintenant voir les données de cette entreprise

**Important :** Si un utilisateur est invité, le trigger `on_auth_user_created` ne crée PAS de nouvelle company (vérification dans la fonction).

## 🔐 Sécurité

### Garanties

1. **Isolation complète** : Impossible pour une entreprise de voir les données d'une autre
2. **RLS au niveau base de données** : Même si le code frontend a un bug, la base de données bloque l'accès
3. **Pas de données partagées** : Chaque entreprise a ses propres produits, commandes, fournisseurs, etc.
4. **Audit trail** : Toutes les actions sont tracées avec `auth.uid()`

### Vérification

Pour vérifier que l'isolation fonctionne, testez :

```sql
-- Se connecter en tant qu'utilisateur A
SELECT * FROM public.produits; -- Voir uniquement les produits de l'entreprise A

-- Se connecter en tant qu'utilisateur B (entreprise différente)
SELECT * FROM public.produits; -- Voir uniquement les produits de l'entreprise B
```

### Migration des Données Existantes

Si vous avez des données existantes sans `company_id`, vous devez :

1. **Option 1 : Assigner à une company existante**
   ```sql
   UPDATE public.produits 
   SET company_id = (SELECT id FROM public.companies LIMIT 1)
   WHERE company_id IS NULL;
   ```

2. **Option 2 : Supprimer les données orphelines**
   ```sql
   DELETE FROM public.produits WHERE company_id IS NULL;
   ```

3. **Option 3 : Créer une company par défaut**
   ```sql
   INSERT INTO public.companies (name, owner_id)
   VALUES ('Company par défaut', (SELECT id FROM auth.users LIMIT 1))
   RETURNING id;
   -- Puis assigner les données orphelines à cette company
   ```

## 📋 Checklist de Vérification

Avant de mettre en production, vérifiez :

- [ ] Toutes les tables métier ont `company_id` NOT NULL
- [ ] Toutes les tables métier ont RLS activé
- [ ] Toutes les policies RLS utilisent `get_current_user_company_id()`
- [ ] Aucune policy n'a `OR company_id IS NULL` (sauf migration temporaire)
- [ ] La fonction `get_all_data()` filtre par `company_id`
- [ ] Les triggers `auto_set_company_id()` sont actifs
- [ ] Le trigger `on_auth_user_created` crée bien une company pour chaque nouvel utilisateur
- [ ] Les invitations fonctionnent correctement

## 🧪 Tests

### Test 1 : Isolation Basique

1. Créer deux comptes différents (Entreprise A et Entreprise B)
2. Ajouter des produits dans l'Entreprise A
3. Se connecter avec l'Entreprise B
4. **Vérifier** : L'Entreprise B ne voit PAS les produits de l'Entreprise A

### Test 2 : Invitation

1. Créer un compte propriétaire (Entreprise A)
2. Inviter un collaborateur
3. Le collaborateur accepte l'invitation
4. **Vérifier** : Le collaborateur voit les données de l'Entreprise A
5. **Vérifier** : Le collaborateur ne voit PAS les données d'autres entreprises

### Test 3 : Création de Données

1. Se connecter avec l'Entreprise A
2. Créer un nouveau produit
3. **Vérifier** : Le produit a automatiquement le `company_id` de l'Entreprise A
4. Se connecter avec l'Entreprise B
5. **Vérifier** : L'Entreprise B ne voit PAS ce produit

## 🚨 Problèmes Courants

### Problème : "Je vois les données d'une autre entreprise"

**Cause :** Les policies RLS ont encore `OR company_id IS NULL`

**Solution :** Appliquer la migration `046_strict_multi_tenant_isolation.sql`

### Problème : "Je ne vois aucune donnée après inscription"

**Cause :** Le trigger `on_auth_user_created` n'a pas créé de company

**Solution :** Vérifier que le trigger existe et fonctionne :
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Problème : "Erreur lors de la création d'un produit"

**Cause :** Le trigger `auto_set_company_id` ne fonctionne pas

**Solution :** Vérifier que le trigger existe :
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'set_company_id%';
```

## 📚 Ressources

- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Migration 011 : Multi-Tenant System](./supabase/migrations/011_multi_tenant_system.sql)
- [Migration 045 : Fix Company Creation](./supabase/migrations/045_fix_company_creation_trigger.sql)
- [Migration 046 : Strict Isolation](./supabase/migrations/046_strict_multi_tenant_isolation.sql)

