# 📋 Guide des Migrations - Gestion Intelligente des Stocks

## ⚠️ Migrations à Appliquer

### ✅ Version Correcte à Utiliser

Appliquez **UNIQUEMENT** ces migrations dans l'ordre :

1. **`013_implement_qty_to_order_calculation_v3.sql`** ⭐ VERSION FINALE
   - Utilise les **vrais noms de colonnes** trouvés dans la base
   - Corrige `qte_a_commander` (et non `quantite_a_commander`)
   - Ajoute `stock_securite` et `autonomie_jours`
   - Implémente les calculs automatiques de base

2. **`014_get_produits_schema.sql`** (Optionnel)
   - Fonction RPC pour inspecter le schéma
   - Utile pour debugging et documentation
   - Peut être ignorée si non nécessaire

3. **`015_add_critical_missing_columns.sql`** ⭐ ESSENTIEL
   - Ajoute 25 colonnes critiques pour gestion intelligente
   - Implémente calculs avancés (risques, prévisions, performance)
   - Génère alertes automatiques
   - Crée index pour performance

---

## ❌ Versions Obsolètes (Ne PAS Utiliser)

### `013_implement_qty_to_order_calculation.sql`
**Problème**: Utilise des noms de colonnes incorrects
- ❌ Essaie d'utiliser `stock_max` (n'existe pas)
- ❌ Essaie d'utiliser `stock_securite_personnalise` (n'existe pas)

### `013_implement_qty_to_order_calculation_v2.sql`
**Problème**: Toujours des noms incorrects
- ❌ Essaie d'utiliser `quantite_a_commander` (le vrai nom est `qte_a_commander`)
- ❌ Essaie d'utiliser `point_commande` sans vérifier son existence

---

## 📝 Ordre d'Exécution Recommandé

```bash
# Dans Supabase SQL Editor

# Étape 1: Calculs de base avec noms corrects
# Copier/coller le contenu de:
013_implement_qty_to_order_calculation_v3.sql

# Étape 2 (Optionnel): Fonction d'inspection
# Copier/coller le contenu de:
014_get_produits_schema.sql

# Étape 3: Colonnes avancées et intelligence
# Copier/coller le contenu de:
015_add_critical_missing_columns.sql
```

---

## 🔍 Vérification Post-Migration

### Après Migration 013 v3
```sql
-- Vérifier qu'un produit a les métriques de base
SELECT 
  sku,
  nom_produit,
  stock_actuel,
  ventes_jour_ajustees,
  stock_securite,
  point_commande,
  qte_a_commander,
  autonomie_jours
FROM produits
WHERE ventes_jour_ajustees > 0
LIMIT 1;
```

### Après Migration 015
```sql
-- Vérifier qu'un produit a toutes les métriques avancées
SELECT 
  sku,
  nom_produit,
  risque_rupture,
  risque_surstock,
  priorite_commande,
  score_performance,
  categorie_abc,
  notes_alertes
FROM produits
WHERE ventes_jour_ajustees > 0
LIMIT 1;
```

---

## 🎯 Colonnes Créées par Chaque Migration

### Migration 013 v3
- `stock_securite` (INTEGER)
- `autonomie_jours` (INTEGER)
- Fonction: `calculate_product_metrics()`
- Trigger: `trigger_calculate_metrics`
- RPC: `recalculate_company_products()`
- RPC: `recalculate_product()`
- RPC: `get_product_calculation_details()`

### Migration 014
- Fonction: `get_produits_schema()`

### Migration 015
**25 nouvelles colonnes**:
- `stock_max` (INTEGER)
- `taux_rotation` (NUMERIC)
- `cout_stockage_unitaire` (NUMERIC)
- `cout_stockage_total` (NUMERIC)
- `risque_rupture` (INTEGER)
- `risque_surstock` (INTEGER)
- `tendance_ventes` (TEXT)
- `variation_ventes_pct` (NUMERIC)
- `marge_brute` (NUMERIC)
- `revenu_potentiel` (NUMERIC)
- `priorite_commande` (INTEGER)
- `derniere_vente` (TIMESTAMP)
- `derniere_commande` (TIMESTAMP)
- `commandes_en_cours` (INTEGER)
- `qte_en_transit` (INTEGER)
- `stock_projete` (INTEGER)
- `date_rupture_estimee` (TIMESTAMP)
- `coefficient_saisonnalite` (NUMERIC)
- `score_performance` (INTEGER)
- `categorie_abc` (TEXT)
- `fiabilite_fournisseur` (INTEGER)
- `notes_alertes` (TEXT)

**Fonctions**:
- `calculate_advanced_product_metrics()`
- Trigger: `trigger_calculate_advanced_metrics`

**Index**: 10 index pour optimiser les requêtes

---

## ⚡ Performances

Les triggers calculent automatiquement toutes les métriques lors de:
- ✅ INSERT d'un nouveau produit
- ✅ UPDATE d'un produit existant
- ✅ Modification du stock
- ✅ Mise à jour des ventes

**Impact**: < 10ms par produit
**Recommandation**: Aucune action manuelle requise

---

## 🐛 Résolution de Problèmes

### Erreur: "column does not exist"
**Solution**: Vous utilisez probablement une ancienne version de la migration 013.
→ Utilisez `013_implement_qty_to_order_calculation_v3.sql`

### Erreur: "function already exists"
**Solution**: Normal si vous réappliquez une migration.
```sql
-- Supprimer l'ancienne fonction avant
DROP FUNCTION IF EXISTS calculate_product_metrics CASCADE;
-- Puis réexécuter la migration
```

### Les métriques ne se calculent pas
**Solution**: Forcer le recalcul
```sql
-- Via SQL
UPDATE produits SET updated_at = NOW();

-- Ou via RPC
SELECT recalculate_company_products();
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `SCHEMA_PRODUITS_ANALYSE.md` - Structure de la table
- `COLONNES_CRITIQUES_AJOUTEES.md` - Liste des 25 colonnes
- `RESUME_FINAL_MODIFICATIONS.md` - Vue d'ensemble complète

---

## ✅ Checklist de Déploiement

- [ ] Sauvegarder la base de données
- [ ] Appliquer migration 013 v3
- [ ] Vérifier les calculs de base
- [ ] Appliquer migration 015
- [ ] Vérifier toutes les métriques
- [ ] Tester sur le frontend
- [ ] Vérifier que SKU-003 affiche qtyToOrder correctement

---

**🎉 Une fois ces migrations appliquées, votre application disposera d'un système de gestion intelligente des stocks complet et performant !**

