# 📋 Mise à jour de la table unmapped_products (Migration 069)

**Date**: $(date)  
**Migration**: 069_update_unmapped_products_structure.sql  
**Projet**: supabase-yellow-house (jqlofxbngcpoxkfalsfr)  
**Conformité**: Spécifications Gadget ✅

---

## ✅ **CHANGEMENTS APPLIQUÉS**

### 1. **Colonnes ajoutées**
- ✅ `first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` - Date de première détection
- ✅ `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` - Date de création
- ✅ `updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` - Date de mise à jour

### 2. **Colonnes renommées**
- ✅ `sku` → `shopify_sku` (renommé pour correspondre aux spécifications)

### 3. **Contraintes modifiées**
- ✅ `product_title` rendu **NOT NULL** (obligatoire)
- ✅ Valeurs par défaut ajoutées pour toutes les colonnes timestamp

### 4. **Colonnes supprimées**
- ✅ `occurrence_count` supprimée (non utilisée dans les spécifications Gadget)

### 5. **Index créés**
- ✅ `idx_unmapped_products_variant` sur `shopify_variant_id`
- ✅ `idx_unmapped_products_last_seen` sur `last_seen_at DESC`

### 6. **Trigger créé**
- ✅ `trigger_update_unmapped_products_updated_at` - Met à jour automatiquement `updated_at` lors des modifications

### 7. **Politiques RLS simplifiées**
- ✅ 4 politiques séparées remplacées par **1 seule politique ALL**
- ✅ Politique: `"Users can only see unmapped products for their company"`

---

## 📊 **STRUCTURE FINALE**

### Colonnes de la table `unmapped_products`:

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | UUID | ❌ NOT NULL | `gen_random_uuid()` | Clé primaire |
| `company_id` | UUID | ❌ NOT NULL | - | Référence à companies(id) |
| `shopify_variant_id` | TEXT | ❌ NOT NULL | - | ID du variant Shopify |
| `shopify_sku` | TEXT | ✅ NULLABLE | - | SKU du variant Shopify |
| `product_title` | TEXT | ❌ NOT NULL | - | Titre du produit (obligatoire) |
| `variant_title` | TEXT | ✅ NULLABLE | - | Titre du variant |
| `first_seen_at` | TIMESTAMPTZ | ✅ NULLABLE | `NOW()` | Première détection |
| `last_seen_at` | TIMESTAMPTZ | ✅ NULLABLE | `NOW()` | Dernière détection |
| `created_at` | TIMESTAMPTZ | ✅ NULLABLE | `NOW()` | Date de création |
| `updated_at` | TIMESTAMPTZ | ✅ NULLABLE | `NOW()` | Date de mise à jour |

### Contraintes:
- ✅ **PRIMARY KEY**: `id`
- ✅ **UNIQUE**: `(company_id, shopify_variant_id)`
- ✅ **FOREIGN KEY**: `company_id` → `companies(id)` ON DELETE CASCADE

### Index:
1. ✅ `idx_unmapped_products_company` sur `company_id`
2. ✅ `idx_unmapped_products_variant` sur `shopify_variant_id`
3. ✅ `idx_unmapped_products_last_seen` sur `last_seen_at DESC`
4. ✅ `unmapped_products_pkey` (PRIMARY KEY sur `id`)
5. ✅ `unmapped_products_unique_variant` (UNIQUE sur `company_id, shopify_variant_id`)

### Politiques RLS:
- ✅ **1 politique ALL**: `"Users can only see unmapped products for their company"`
  - `USING`: `company_id = get_current_user_company_id()`
  - `WITH CHECK`: `company_id = get_current_user_company_id()`

---

## 🔍 **VÉRIFICATION**

### Structure conforme aux spécifications Gadget ✅

La table correspond maintenant exactement à la structure demandée par Gadget:

```sql
CREATE TABLE IF NOT EXISTS public.unmapped_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shopify_variant_id TEXT NOT NULL,
  shopify_sku TEXT,
  product_title TEXT NOT NULL,
  variant_title TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, shopify_variant_id)
);
```

### Index conformes ✅

```sql
CREATE INDEX idx_unmapped_products_company ON public.unmapped_products(company_id);
CREATE INDEX idx_unmapped_products_variant ON public.unmapped_products(shopify_variant_id);
CREATE INDEX idx_unmapped_products_last_seen ON public.unmapped_products(last_seen_at DESC);
```

### Politique RLS conforme ✅

```sql
CREATE POLICY "Users can only see unmapped products for their company"
  ON public.unmapped_products FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());
```

---

## 🔧 **FONCTIONNALITÉS AJOUTÉES**

### Trigger automatique pour `updated_at`
- Met à jour automatiquement `updated_at` lors de toute modification
- Fonction: `update_unmapped_products_updated_at()`
- Trigger: `trigger_update_unmapped_products_updated_at`

---

## 📝 **MIGRATION DES DONNÉES**

Les données existantes ont été migrées automatiquement:
- ✅ `first_seen_at` initialisé avec `last_seen_at` (ou `NOW()` si NULL)
- ✅ `created_at` initialisé avec `first_seen_at` (ou `NOW()` si NULL)
- ✅ `updated_at` initialisé avec `last_seen_at` (ou `NOW()` si NULL)
- ✅ `product_title` NULL remplacé par `'Produit sans titre'` puis rendu NOT NULL
- ✅ Colonne `sku` renommée en `shopify_sku`

---

## ✅ **CHECKLIST**

- [x] Colonnes ajoutées (first_seen_at, created_at, updated_at)
- [x] Colonne sku renommée en shopify_sku
- [x] product_title rendu NOT NULL
- [x] Colonne occurrence_count supprimée
- [x] Index créés (variant, last_seen)
- [x] Trigger updated_at créé
- [x] Politiques RLS simplifiées (1 politique ALL)
- [x] Données existantes migrées
- [x] Fonction update_unmapped_products_updated_at avec search_path corrigé

---

**Migration 069 appliquée avec succès** ✅  
**Table conforme aux spécifications Gadget** ✅




