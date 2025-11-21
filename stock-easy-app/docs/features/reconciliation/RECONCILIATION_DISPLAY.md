# Affichage des Détails de Réconciliation

## Date : 12 novembre 2025

## 📋 Résumé

Ajout de l'affichage des quantités manquantes et endommagées dans l'interface utilisateur pour les commandes en réconciliation.

## 🎯 Problème Résolu

Les informations de réconciliation (quantités manquantes et endommagées) étaient bien sauvegardées dans la base de données mais n'étaient pas visibles dans l'interface utilisateur de l'onglet "Réconciliation".

## ✅ Modifications Apportées

### 1. Mise à Jour du Composant OrderCard

**Fichier** : `src/components/shared/OrderCard.jsx`

#### A. Récapitulatif dans l'en-tête de la commande

Ajout d'un encadré récapitulatif en haut de chaque commande en réconciliation affichant :
- Total des quantités manquantes
- Total des quantités endommagées

```jsx
{/* Récapitulatif de réconciliation */}
{order.status === 'reconciliation' && (order.missingQuantityTotal > 0 || order.damagedQuantityTotal > 0) && (
  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2 space-y-1">
    <div className="flex items-center gap-2 mb-1">
      <AlertTriangle className="w-4 h-4 text-red-600" />
      <span className="text-xs font-semibold text-red-700">Écarts de livraison</span>
    </div>
    {order.missingQuantityTotal > 0 && (
      <div className="flex justify-between text-xs">
        <span className="text-red-600">Total manquant:</span>
        <span className="font-bold text-red-700">{order.missingQuantityTotal} unités</span>
      </div>
    )}
    {order.damagedQuantityTotal > 0 && (
      <div className="flex justify-between text-xs">
        <span className="text-orange-600">Total endommagé:</span>
        <span className="font-bold text-orange-700">{order.damagedQuantityTotal} unités</span>
      </div>
    )}
  </div>
)}
```

#### B. Détails par produit

Dans la section détails (mode expansible), chaque produit affiche maintenant :
- La quantité manquante pour ce SKU
- La quantité endommagée pour ce SKU
- La quantité reçue saine pour ce SKU

```jsx
{/* Informations de réconciliation */}
{hasReconciliationData && (
  <div className="mt-2 pt-2 border-t border-red-200 bg-red-50 rounded p-2 space-y-1">
    <div className="font-semibold text-red-700 text-xs mb-1">⚠️ Écarts détectés</div>
    {missingQty > 0 && (
      <div className="flex justify-between text-xs">
        <span className="text-red-600">Quantité manquante:</span>
        <span className="font-bold text-red-700">{missingQty} unités</span>
      </div>
    )}
    {damagedQty > 0 && (
      <div className="flex justify-between text-xs">
        <span className="text-orange-600">Quantité endommagée:</span>
        <span className="font-bold text-orange-700">{damagedQty} unités</span>
      </div>
    )}
    {item.receivedQuantity !== undefined && (
      <div className="flex justify-between text-xs pt-1 border-t border-red-200">
        <span className="text-green-600">Quantité reçue (saine):</span>
        <span className="font-bold text-green-700">{item.receivedQuantity} unités</span>
      </div>
    )}
  </div>
)}
```

### 2. Mise à Jour de l'Adaptateur API

**Fichier** : `src/services/apiAdapter.js`

Ajout du mapping des données de réconciliation pour toutes les commandes :

```javascript
// Mapper les commandes avec les données de réconciliation
if (converted.orders) {
  converted.orders = converted.orders.map(o => ({
    ...o,
    missingQuantitiesBySku: o.missingQuantitiesBySku || {},
    damagedQuantitiesBySku: o.damagedQuantitiesBySku || {}
  }));
}
```

### 3. Mise à Jour de la Fonction RPC get_all_data

**Fichier** : `supabase/migrations/019_update_get_all_data_with_reconciliation.sql`

Ajout des colonnes de réconciliation dans le retour JSON de la fonction `get_all_data()` :

```sql
'orders', (
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', c.id,
      -- ... autres champs ...
      'missingQuantityTotal', c.missing_quantity_total,
      'damagedQuantityTotal', c.damaged_quantity_total,
      'missingQuantitiesBySku', c.missing_quantities_by_sku,
      'damagedQuantitiesBySku', c.damaged_quantities_by_sku,
      'reconciliationConfirmedAt', c.reconciliation_confirmed_at,
      'reconciliationConfirmedBy', c.reconciliation_confirmed_by,
      'items', (...)
    )
  ), '[]'::json)
  FROM public.commandes c
  WHERE c.company_id = v_company_id OR c.company_id IS NULL
)
```

## 🎨 Apparence Visuelle

### Vue Compactée (en-tête de commande)

```
┌─────────────────────────────────────────┐
│ PO-2024-001                   [Réconciliation] │
│ Fournisseur: Fournisseur A              │
│ Date: 12/11/2025 | Total: 150.00€      │
│                                          │
│ ╔═══════════════════════════════════╗   │
│ ║ ⚠️ Écarts de livraison           ║   │
│ ║ Total manquant:     5 unités     ║   │
│ ║ Total endommagé:    3 unités     ║   │
│ ╚═══════════════════════════════════╝   │
│                                          │
│ [Réconciliation confirmée] ✓            │
└─────────────────────────────────────────┘
```

### Vue Détaillée (produits expansés)

```
┌─────────────────────────────────────────┐
│ Produit A (SKU: SKU-001)                │
│ Quantité: 10 unités                     │
│ Prix unitaire: 15.00€                   │
│ Total ligne: 150.00€                    │
│                                          │
│ ╔═══════════════════════════════════╗   │
│ ║ ⚠️ Écarts détectés               ║   │
│ ║ Quantité manquante:  5 unités    ║   │
│ ║ Quantité endommagée: 3 unités    ║   │
│ ║ ─────────────────────────────────║   │
│ ║ Quantité reçue (saine): 2 unités ║   │
│ ╚═══════════════════════════════════╝   │
└─────────────────────────────────────────┘
```

## 🎨 Code Couleurs

- **Rouge** (`red-600`, `red-700`) : Quantités manquantes
- **Orange** (`orange-600`, `orange-700`) : Quantités endommagées
- **Vert** (`green-600`, `green-700`) : Quantités reçues saines
- **Fond rouge pâle** (`red-50`) : Arrière-plan des alertes

## 📊 Données Affichées

### Niveau Commande (en-tête)
- `order.missingQuantityTotal` : Somme de toutes les quantités manquantes
- `order.damagedQuantityTotal` : Somme de toutes les quantités endommagées

### Niveau Produit (détails)
- `order.missingQuantitiesBySku[item.sku]` : Quantité manquante pour ce SKU
- `order.damagedQuantitiesBySku[item.sku]` : Quantité endommagée pour ce SKU
- `item.receivedQuantity` : Quantité reçue saine pour ce SKU

## 🔄 Flux de Données

```
1. Base de données (Supabase)
   ├─ missing_quantity_total (calculé par trigger)
   ├─ damaged_quantity_total (calculé par trigger)
   ├─ missing_quantities_by_sku (JSONB)
   └─ damaged_quantities_by_sku (JSONB)
   
2. Fonction RPC get_all_data()
   └─ Retourne les données en camelCase
   
3. API Adapter (apiAdapter.js)
   └─ Mappe et garantit la présence des objets
   
4. Composant OrderCard
   └─ Affiche les données avec formatage visuel
```

## 🧪 Tests Recommandés

1. **Test d'affichage basique**
   - Créer une commande avec écarts
   - Vérifier que le récapitulatif s'affiche en haut
   - Vérifier que les détails par produit sont corrects

2. **Test de calculs**
   - Vérifier que les totaux correspondent à la somme des écarts par SKU
   - Vérifier la formule : `Commandé = Reçu sain + Endommagé + Manquant`

3. **Test visuel**
   - Vérifier les couleurs (rouge pour manquant, orange pour endommagé)
   - Vérifier l'icône d'alerte
   - Vérifier la mise en page responsive

4. **Test de cas limites**
   - Commande sans écarts (ne devrait rien afficher)
   - Commande avec uniquement quantités manquantes
   - Commande avec uniquement quantités endommagées
   - Commande avec les deux types d'écarts

## 📝 Notes Techniques

### Pourquoi deux niveaux d'affichage ?

1. **En-tête (récapitulatif)** : Permet de voir rapidement l'ampleur du problème sans ouvrir les détails
2. **Détails (par produit)** : Permet de voir précisément quel produit pose problème et dans quelle mesure

### Gestion des valeurs nulles/undefined

Le code gère proprement les cas où :
- `missingQuantitiesBySku` ou `damagedQuantitiesBySku` sont `null`/`undefined`
- Un SKU n'a pas d'entrée dans ces objets (valeur par défaut : 0)
- L'ordre n'est pas en statut "reconciliation" (les alertes ne s'affichent pas)

### Performance

- Pas de calculs lourds (tout est pré-calculé par le trigger SQL)
- Affichage conditionnel (seulement pour les commandes en réconciliation)
- Données chargées une seule fois avec `get_all_data()`

## 🚀 Déploiement

### Ordre d'application

1. ✅ Migration 018 (colonnes de réconciliation)
2. ✅ Migration 019 (mise à jour de get_all_data)
3. ✅ Code frontend (OrderCard + apiAdapter)

### Vérification Post-Déploiement

```sql
-- Vérifier qu'une commande en réconciliation a les bonnes données
SELECT 
  id,
  status,
  missing_quantity_total,
  damaged_quantity_total,
  missing_quantities_by_sku,
  damaged_quantities_by_sku
FROM commandes
WHERE status = 'reconciliation'
LIMIT 1;
```

## 🔗 Fichiers Modifiés

1. **Frontend**
   - `src/components/shared/OrderCard.jsx` ✨ MODIFIÉ
   - `src/services/apiAdapter.js` ✨ MODIFIÉ

2. **Backend**
   - `supabase/migrations/019_update_get_all_data_with_reconciliation.sql` ✨ NOUVEAU

3. **Documentation**
   - `docs/RECONCILIATION_DISPLAY.md` ✨ NOUVEAU (ce fichier)

---

**Auteur** : AI Assistant
**Date** : 12 novembre 2025
**Version** : 1.0
**Lié à** : RECONCILIATION_IMPROVEMENTS.md

