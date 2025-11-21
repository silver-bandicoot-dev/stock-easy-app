# 📈 Guide d'utilisation de `multiplicateur_prevision`

## Vue d'ensemble

La colonne `multiplicateur_prevision` permet de personnaliser le coefficient de prévision pour chaque produit individuellement, tout en ayant une valeur par défaut globale via le paramètre `MultiplicateurDefaut`.

## 🎯 Fonctionnement automatique

### Initialisation automatique

Lors de la création d'un nouveau produit :
- Si `multiplicateur_prevision` n'est pas défini → **initialisé automatiquement** avec la valeur du paramètre `MultiplicateurDefaut`
- Si `multiplicateur_prevision` est déjà défini → **conservé tel quel**

### Protection des valeurs personnalisées

- Les valeurs définies manuellement **ne sont jamais écrasées** par le trigger
- Le trigger ne modifie que les valeurs `NULL`

## 🔧 Méthodes de modification

### 1. Mise à jour manuelle via SQL (directement dans Supabase)

```sql
-- Modifier le multiplicateur d'un produit spécifique
UPDATE produits
SET multiplicateur_prevision = 2.5
WHERE sku = 'SKU-001';
```

### 2. Mise à jour via fonction RPC (recommandé)

#### Modifier le multiplicateur d'un produit

```javascript
// Dans votre code frontend
const { data, error } = await supabase.rpc('update_product_multiplier', {
  p_sku: 'SKU-001',
  p_multiplicateur_prevision: 2.5
});

if (data?.success) {
  console.log('✅ Multiplicateur mis à jour:', data.product);
} else {
  console.error('❌ Erreur:', data?.error);
}
```

#### Réinitialiser au paramètre par défaut

```javascript
// Réinitialiser un produit au paramètre MultiplicateurDefaut
const { data, error } = await supabase.rpc('reset_product_multiplier_to_default', {
  p_sku: 'SKU-001'
});

if (data?.success) {
  console.log('✅ Multiplicateur réinitialisé:', data.product);
} else {
  console.error('❌ Erreur:', data?.error);
}
```

### 3. Via l'interface utilisateur (à implémenter)

Vous pouvez ajouter un champ éditable dans votre interface pour permettre aux utilisateurs de modifier le multiplicateur directement depuis l'application.

## 📊 Exemples d'utilisation

### Exemple 1 : Produit avec multiplicateur personnalisé

```sql
-- Produit saisonnier avec multiplicateur élevé
UPDATE produits
SET multiplicateur_prevision = 3.0
WHERE sku = 'PRODUIT-BFCM-2024';
```

### Exemple 2 : Produit avec multiplicateur réduit

```sql
-- Produit en fin de vie avec multiplicateur réduit
UPDATE produits
SET multiplicateur_prevision = 0.5
WHERE sku = 'PRODUIT-FIN-SERIE';
```

### Exemple 3 : Réinitialiser plusieurs produits

```sql
-- Réinitialiser tous les produits d'une catégorie
UPDATE produits
SET multiplicateur_prevision = (
  SELECT valeur::NUMERIC 
  FROM parametres 
  WHERE nom_parametre = 'MultiplicateurDefaut'
)
WHERE categorie = 'Electronique';
```

## 🔍 Vérification et requêtes utiles

### Voir tous les produits avec leur multiplicateur

```sql
SELECT 
  sku,
  nom_produit,
  multiplicateur_prevision,
  CASE 
    WHEN multiplicateur_prevision = (
      SELECT valeur::NUMERIC 
      FROM parametres 
      WHERE nom_parametre = 'MultiplicateurDefaut'
    ) THEN 'Par défaut'
    ELSE 'Personnalisé'
  END as statut
FROM produits
ORDER BY multiplicateur_prevision DESC;
```

### Trouver les produits avec multiplicateur personnalisé

```sql
SELECT 
  sku,
  nom_produit,
  multiplicateur_prevision,
  (SELECT valeur::NUMERIC FROM parametres WHERE nom_parametre = 'MultiplicateurDefaut') as valeur_defaut
FROM produits
WHERE multiplicateur_prevision != (
  SELECT valeur::NUMERIC 
  FROM parametres 
  WHERE nom_parametre = 'MultiplicateurDefaut'
)
OR multiplicateur_prevision IS NULL;
```

### Statistiques

```sql
SELECT 
  COUNT(*) as total_produits,
  COUNT(*) FILTER (WHERE multiplicateur_prevision IS NOT NULL) as avec_multiplicateur,
  COUNT(*) FILTER (WHERE multiplicateur_prevision IS NULL) as sans_multiplicateur,
  AVG(multiplicateur_prevision) as moyenne,
  MIN(multiplicateur_prevision) as minimum,
  MAX(multiplicateur_prevision) as maximum
FROM produits;
```

## ⚠️ Validations

- **Valeur minimale** : 0.1
- **Valeur maximale** : 10.0
- Les valeurs en dehors de cette plage seront rejetées par la fonction `update_product_multiplier()`

## 🔄 Comportement du trigger

Le trigger `trigger_initialize_multiplicateur_prevision` :

1. **Sur INSERT** :
   - Si `multiplicateur_prevision` est `NULL` → initialise avec `MultiplicateurDefaut`
   - Si `multiplicateur_prevision` a une valeur → la conserve

2. **Sur UPDATE** :
   - Si `multiplicateur_prevision` est `NULL` ET l'ancienne valeur était `NULL` → initialise avec `MultiplicateurDefaut`
   - Si `multiplicateur_prevision` a une valeur → la conserve (même si différente de l'ancienne)
   - Si l'ancienne valeur existait → ne modifie pas (protection)

## 💡 Cas d'usage

### Cas 1 : Produit saisonnier
- **Multiplicateur par défaut** : 1.2
- **Multiplicateur produit** : 2.5 (pour la saison)
- **Résultat** : Les prévisions sont ajustées à la hausse pour ce produit

### Cas 2 : Produit en fin de vie
- **Multiplicateur par défaut** : 1.2
- **Multiplicateur produit** : 0.5 (réduction des prévisions)
- **Résultat** : Les prévisions sont réduites pour éviter le surstock

### Cas 3 : Produit standard
- **Multiplicateur par défaut** : 1.2
- **Multiplicateur produit** : NULL (ou 1.2)
- **Résultat** : Utilise la valeur par défaut

## 🚀 Intégration dans le frontend

Pour intégrer cette fonctionnalité dans votre interface, vous pouvez :

1. **Ajouter un champ éditable** dans le formulaire de produit
2. **Créer une fonction dans `apiAdapter.js`** :

```javascript
// Dans apiAdapter.js
export async function updateProductMultiplier(sku, multiplier) {
  try {
    const { data, error } = await supabase.rpc('update_product_multiplier', {
      p_sku: sku,
      p_multiplicateur_prevision: multiplier
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur mise à jour multiplicateur:', error);
    return { success: false, error: error.message };
  }
}

export async function resetProductMultiplier(sku) {
  try {
    const { data, error } = await supabase.rpc('reset_product_multiplier_to_default', {
      p_sku: sku
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur réinitialisation multiplicateur:', error);
    return { success: false, error: error.message };
  }
}
```

3. **Utiliser dans un composant** :

```javascript
// Exemple d'utilisation dans un composant
const handleUpdateMultiplier = async (sku, newMultiplier) => {
  const result = await api.updateProductMultiplier(sku, newMultiplier);
  if (result.success) {
    toast.success('Multiplicateur mis à jour');
    loadData(); // Recharger les données
  } else {
    toast.error(result.error);
  }
};
```

## 📝 Notes importantes

- Le multiplicateur est **spécifique à chaque produit**
- Les modifications manuelles **sont préservées** même si le paramètre `MultiplicateurDefaut` change
- Pour réinitialiser un produit au paramètre par défaut, utilisez `reset_product_multiplier_to_default()`
- Le trigger ne modifie **jamais** une valeur existante, seulement les valeurs `NULL`

