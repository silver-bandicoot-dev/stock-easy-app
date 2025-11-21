# 🔗 Intégration Supabase pour les Prévisions

## ✅ Statut de l'Intégration

### Connexion Supabase - **CONNECTÉE** ✅

Le système de prévisions est **bien connecté** avec Supabase pour récupérer les données réelles :

1. ✅ **Table `sales_history`** existe dans Supabase
2. ✅ **Fonction RPC `get_sales_history`** disponible
3. ✅ **Service API** (`supabaseApiService.js`) expose `getSalesHistory()`
4. ✅ **Adapter API** (`apiAdapter.js`) adapte les données
5. ✅ **Utilitaire** (`salesHistoryGenerator.js`) utilise Supabase en priorité

---

## 📊 Flux de Données

### Priorité de Récupération des Données

Le système utilise une **stratégie en cascade** pour récupérer l'historique des ventes :

```
1. Supabase (table sales_history) → Données réelles ✅ PRIORITÉ 1
   ↓ (si pas de données)
2. Commandes reçues/complétées → Données indirectes ✅ PRIORITÉ 2
   ↓ (si pas de données)
3. Génération simulée (salesPerDay) → Fallback ⚠️ PRIORITÉ 3
```

### Fichiers Impliqués

| Fichier | Rôle | Statut |
|---------|------|--------|
| `supabase/migrations/020_create_sales_history.sql` | Table et fonction RPC Supabase | ✅ Existe |
| `src/services/supabaseApiService.js` | Appel direct à Supabase | ✅ Connecté |
| `src/services/apiAdapter.js` | Adaptation des données | ✅ Connecté |
| `src/utils/salesHistoryGenerator.js` | Utilitaire de récupération | ✅ Connecté |
| `src/components/analytics/AnalyticsTab.jsx` | Intégration UI | ✅ Connecté |

---

## 🔧 Fonctionnement Détaillé

### 1. Récupération depuis Supabase

```javascript
// Dans salesHistoryGenerator.js
export async function getSalesHistoryFromSupabase(sku, days = 90) {
  // Appelle la RPC Supabase get_sales_history
  const salesData = await getSupabaseSalesHistory({
    sku,
    startDate: 'YYYY-MM-DD',
    endDate: 'YYYY-MM-DD'
  });
  
  // Convertit le format: { sku, saleDate, quantity } → { date, quantity }
  // Remplit les jours manquants avec 0
  return filledHistory;
}
```

### 2. Format des Données Supabase

**Table `sales_history`** :
- `id` (uuid)
- `company_id` (uuid) - Multi-tenant
- `sku` (text) - Référence produit
- `sale_date` (date) - Date de vente
- `quantity` (numeric) - Quantité vendue
- `revenue` (numeric) - Revenu (optionnel)
- `source` (text) - Source de la donnée ('manual', 'order', etc.)
- `metadata` (jsonb) - Métadonnées additionnelles

**Fonction RPC `get_sales_history`** :
- Agrége les ventes par jour
- Filtre par `company_id` (sécurité multi-tenant)
- Retourne : `{ sku, sale_date, quantity, revenue, details }`

### 3. Conversion de Format

```javascript
// Format Supabase (après snakeToCamel)
{ sku, saleDate, quantity, revenue, details }

// Format attendu par SmartForecastEngine
{ date: 'YYYY-MM-DD', quantity: 10 }
```

---

## 🔌 Points de Connexion

### Service Supabase

```javascript
// src/services/supabaseApiService.js
export async function getSalesHistory({ sku, startDate, endDate } = {}) {
  const { data, error } = await supabase.rpc('get_sales_history', {
    p_sku: sku,
    p_start_date: startDate,
    p_end_date: endDate
  });
  return data || [];
}
```

### Utilitaire de Génération

```javascript
// src/utils/salesHistoryGenerator.js
export async function getSalesHistory(product, orders = [], days = 90) {
  // 1. Essayer Supabase
  const historyFromSupabase = await getSalesHistoryFromSupabase(product.sku, days);
  if (historyFromSupabase && hasRealData) return historyFromSupabase;
  
  // 2. Essayer commandes
  const historyFromOrders = generateSalesHistoryFromOrders(orders, product.sku, days);
  if (hasRealData) return historyFromOrders;
  
  // 3. Fallback: génération
  return generateSalesHistory(product, days);
}
```

### Intégration UI

```javascript
// src/components/analytics/AnalyticsTab.jsx
const handleProductSelect = async (product) => {
  setLoadingSalesHistory(true);
  try {
    // Récupère depuis Supabase en priorité
    const history = await getSalesHistory(product, orders, 90);
    setSalesHistoryForForecast(history);
  } catch (error) {
    console.error('Erreur chargement historique:', error);
  } finally {
    setLoadingSalesHistory(false);
  }
};
```

---

## 📋 Vérifications à Effectuer

### ✅ Vérifications Automatiques

Le système vérifie automatiquement :
- ✅ Si la table `sales_history` existe
- ✅ Si la fonction RPC `get_sales_history` existe
- ✅ Si des données sont disponibles pour le SKU
- ✅ Si le format des données est correct

### ⚠️ Vérifications Manuelles

1. **Données dans Supabase** :
   ```sql
   -- Vérifier si des données existent
   SELECT COUNT(*) FROM sales_history;
   
   -- Vérifier pour un SKU spécifique
   SELECT * FROM sales_history 
   WHERE sku = 'VOTRE-SKU' 
   ORDER BY sale_date DESC 
   LIMIT 10;
   ```

2. **Permissions RLS** :
   - ✅ RLS activé sur `sales_history`
   - ✅ Policies par `company_id`
   - ✅ Utilisateur authentifié peut SELECT

3. **Fonction RPC** :
   ```sql
   -- Tester la fonction
   SELECT * FROM get_sales_history(
     p_sku := 'VOTRE-SKU',
     p_start_date := CURRENT_DATE - INTERVAL '90 days',
     p_end_date := CURRENT_DATE
   );
   ```

---

## 🎯 Utilisation des Données

### Quand Supabase est Utilisé

Le système utilise les données Supabase quand :
- ✅ La table `sales_history` contient des données pour le SKU
- ✅ Les données sont dans la période demandée (90 jours par défaut)
- ✅ Au moins une vente existe (`quantity > 0`)

### Quand le Fallback est Utilisé

Le système utilise les commandes ou la génération quand :
- ⚠️ Aucune donnée dans `sales_history` pour le SKU
- ⚠️ Table `sales_history` vide
- ⚠️ Erreur de connexion Supabase (rare)

---

## 🔍 Logs de Débogage

Le système affiche des logs dans la console :

### ✅ Succès
```
✅ Historique Supabase utilisé pour SKU-123
```

### ⚠️ Fallback
```
⚠️ Génération simulée depuis salesPerDay pour SKU-123 (pas de données réelles)
✅ Historique depuis commandes utilisé pour SKU-123
```

### ❌ Erreur
```
❌ Erreur récupération historique Supabase: [détails]
⚠️ Impossible de récupérer depuis Supabase, fallback sur commandes: [détails]
```

---

## 📝 Notes Importantes

### Multi-Tenant

- ✅ La fonction RPC filtre automatiquement par `company_id`
- ✅ Les policies RLS garantissent l'isolation des données
- ✅ Chaque utilisateur voit uniquement ses données

### Performance

- ✅ Les requêtes Supabase sont optimisées (index sur `company_id`, `sku`, `sale_date`)
- ✅ La fonction RPC agrège les données côté serveur
- ✅ Cache local pour éviter les requêtes répétées

### Format des Dates

- ✅ Toutes les dates sont au format `YYYY-MM-DD`
- ✅ Conversion automatique depuis le format Supabase
- ✅ Filling des jours manquants avec 0

---

## ✅ Conclusion

**Le système est bien connecté avec Supabase** :

- ✅ **Table `sales_history`** créée et configurée
- ✅ **Fonction RPC** disponible et testable
- ✅ **Services** connectés et fonctionnels
- ✅ **UI** récupère les données automatiquement
- ✅ **Fallbacks** en place pour robustesse

**Pour utiliser les vraies données** :
1. Insérer des données dans la table `sales_history`
2. Sélectionner un produit dans l'onglet "Prévisions IA"
3. Le système récupérera automatiquement les données depuis Supabase

**Si aucune donnée n'existe** :
- Le système utilisera les commandes reçues
- Ou générera un historique simulé depuis `salesPerDay`
- Les prévisions fonctionneront dans tous les cas

---

*Document généré le $(date)*

