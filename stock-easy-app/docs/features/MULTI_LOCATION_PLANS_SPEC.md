# 🏭 Spécification : Multi-Emplacements & Plans d'Abonnement

> **Statut** : 📋 PLANIFIÉ (Phase 2)  
> **Date de création** : 2025-11-26  
> **Dernière mise à jour** : 2025-11-26  
> **Priorité** : Moyenne (après stabilisation Phase 1)

---

## 📋 Contexte

L'application StockEasy pour Shopify doit évoluer pour supporter plusieurs emplacements de synchronisation de stock, avec différents plans d'abonnement limitant le nombre d'emplacements actifs.

### État actuel (Phase 1)
- ✅ Synchronisation vers **UN SEUL** emplacement (`shopifyShop.defaultLocationId`)
- ✅ Tous les emplacements Shopify sont importés dans `warehouses`
- ✅ Mapping entre Shopify locations et warehouses StockEasy
- ❌ Pas de gestion multi-emplacements pour le stock
- ❌ Pas de plans d'abonnement

---

## 🎯 Objectifs Phase 2

### Plans d'abonnement

| Plan | Emplacements actifs | Prix suggéré |
|------|---------------------|--------------|
| **Basic** | 1 emplacement | Gratuit / $X/mois |
| **Pro** | 3 emplacements | $Y/mois |
| **Plus** | 15 emplacements | $Z/mois |

### Fonctionnalités

1. **Stock réparti par emplacement** (comme dans Shopify Admin)
2. **Choix manuel des emplacements** actifs via UI StockEasy
3. **Gestion des abonnements** via Shopify Billing API
4. **Synchronisation bidirectionnelle** pour chaque emplacement actif

---

## 🏗️ Architecture proposée

### 1. Modifications Supabase

#### Table `companies` - Ajout du plan

```sql
ALTER TABLE companies 
ADD COLUMN plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'plus'));

ALTER TABLE companies 
ADD COLUMN max_sync_locations INTEGER DEFAULT 1;

ALTER TABLE companies 
ADD COLUMN shopify_subscription_id TEXT; -- ID de l'abonnement Shopify

COMMENT ON COLUMN companies.plan IS 'Plan d''abonnement: basic, pro, plus';
COMMENT ON COLUMN companies.max_sync_locations IS 'Nombre max d''emplacements selon le plan';
```

#### Table `warehouses` - Ajout du flag sync

```sql
ALTER TABLE warehouses 
ADD COLUMN sync_enabled BOOLEAN DEFAULT false;

ALTER TABLE warehouses 
ADD COLUMN sync_priority INTEGER DEFAULT 1;

COMMENT ON COLUMN warehouses.sync_enabled IS 'Si true, le stock est synchronisé avec cet emplacement Shopify';
COMMENT ON COLUMN warehouses.sync_priority IS 'Ordre de priorité pour la synchro (1 = principal)';
```

#### Table `product_inventory` - Stock par emplacement

```sql
-- NOUVELLE TABLE : Stock par produit ET par emplacement
CREATE TABLE product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  product_id UUID NOT NULL REFERENCES produits(id), -- ou sku
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  
  -- Stock
  stock_actuel NUMERIC DEFAULT 0,
  stock_minimum INTEGER DEFAULT 0,
  stock_maximum INTEGER,
  
  -- Métadonnées
  last_synced_at TIMESTAMPTZ,
  last_sync_direction TEXT, -- 'shopify_to_stockeasy' ou 'stockeasy_to_shopify'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique
  UNIQUE (company_id, product_id, warehouse_id)
);

-- Index pour performance
CREATE INDEX idx_product_inventory_company ON product_inventory(company_id);
CREATE INDEX idx_product_inventory_warehouse ON product_inventory(warehouse_id);
CREATE INDEX idx_product_inventory_product ON product_inventory(product_id);

COMMENT ON TABLE product_inventory IS 'Stock par produit et par emplacement - permet le stock réparti';
```

#### Fonction de vérification des limites

```sql
CREATE OR REPLACE FUNCTION check_location_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_max_allowed INTEGER;
BEGIN
  -- Compter les emplacements actifs actuels
  SELECT COUNT(*) INTO v_current_count
  FROM warehouses
  WHERE company_id = NEW.company_id AND sync_enabled = true;
  
  -- Récupérer la limite du plan
  SELECT max_sync_locations INTO v_max_allowed
  FROM companies
  WHERE id = NEW.company_id;
  
  -- Vérifier la limite (si on active un nouvel emplacement)
  IF NEW.sync_enabled = true AND OLD.sync_enabled = false THEN
    IF v_current_count >= v_max_allowed THEN
      RAISE EXCEPTION 'Limite d''emplacements atteinte pour ce plan (max: %)', v_max_allowed;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_location_limit
BEFORE UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION check_location_limit();
```

---

### 2. Modifications Gadget

#### Nouveau modèle : `subscriptionPlan`

```javascript
// api/models/subscriptionPlan/schema.gadget.ts
export const schema = {
  type: "gadget/model-schema/v2",
  fields: {
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" }
    },
    planName: {
      type: "enum",
      options: ["basic", "pro", "plus"]
    },
    maxLocations: {
      type: "number"
    },
    shopifyChargeId: {
      type: "string"
    },
    status: {
      type: "enum",
      options: ["active", "cancelled", "pending"]
    }
  }
};
```

#### Modification de la synchro stock

```javascript
// api/routes/supabase-webhook/POST-stock-update.js
// 
// ACTUEL : Met à jour UN SEUL emplacement (defaultLocationId)
// 
// FUTUR : Doit mettre à jour l'emplacement correspondant au warehouse source
//
// Logique :
// 1. Recevoir { company_id, sku, warehouse_id, new_stock }
// 2. Trouver le mapping warehouse → Shopify location
// 3. Mettre à jour le stock dans CE Shopify location spécifique
```

```javascript
// api/models/shopifyInventoryLevel/actions/update.js
//
// ACTUEL : Met à jour le stock global du produit
//
// FUTUR : Doit mettre à jour le stock dans le warehouse correspondant
//
// Logique :
// 1. Recevoir inventory_levels/update avec locationId
// 2. Trouver le mapping Shopify location → warehouse
// 3. Mettre à jour product_inventory pour ce warehouse spécifique
```

#### Actions pour la gestion des plans

```javascript
// api/actions/activateLocation.js
// Active un emplacement pour la synchro (vérifie la limite du plan)

// api/actions/deactivateLocation.js  
// Désactive un emplacement

// api/actions/upgradePlan.js
// Upgrade le plan via Shopify Billing API

// api/actions/downgradePlan.js
// Downgrade le plan (vérifie que les emplacements actifs <= nouvelle limite)
```

---

### 3. Intégration Shopify Billing API

Gadget supporte nativement Shopify Billing. Documentation : https://docs.gadget.dev/guides/plugins/shopify/billing

```javascript
// Exemple de création d'un abonnement récurrent
const charge = await connections.shopify.current.graphql(`
  mutation appSubscriptionCreate($name: String!, $price: Decimal!, $returnUrl: URL!) {
    appSubscriptionCreate(
      name: $name,
      returnUrl: $returnUrl,
      lineItems: [{
        plan: {
          appRecurringPricingDetails: {
            price: { amount: $price, currencyCode: USD }
          }
        }
      }]
    ) {
      appSubscription {
        id
        status
      }
      confirmationUrl
      userErrors {
        field
        message
      }
    }
  }
`, {
  name: "StockEasy Pro",
  price: "29.99",
  returnUrl: "https://stockeasy-app.gadget.app/billing/confirm"
});
```

---

### 4. UI StockEasy (Frontend)

#### Page "Gestion des emplacements"

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏭 Emplacements de synchronisation                                 │
│                                                                      │
│  Plan actuel : Pro (3/3 emplacements utilisés)    [Upgrade ↑]       │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ☑️ Paris (Principal)                          [Désactiver]  │   │
│  │    Stock synchronisé : 245 produits                         │   │
│  │    Dernière synchro : il y a 2 min                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ☑️ Lyon                                       [Désactiver]  │   │
│  │    Stock synchronisé : 245 produits                         │   │
│  │    Dernière synchro : il y a 5 min                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ☑️ Bordeaux                                   [Désactiver]  │   │
│  │    Stock synchronisé : 245 produits                         │   │
│  │    Dernière synchro : il y a 3 min                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⬜ Marseille (non actif)                      [Activer]     │   │
│  │    ⚠️ Limite atteinte - Upgrade pour activer               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Flux de synchronisation multi-emplacements

### Shopify → StockEasy

```
Shopify inventory_levels/update (Location: Paris, Qty: 50)
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Gadget: shopifyInventoryLevel/actions/update.js                    │
│                                                                      │
│  1. Récupérer locationId du webhook                                 │
│  2. Trouver le mapping: Shopify Location Paris → Warehouse Paris    │
│  3. Vérifier si cet emplacement est sync_enabled                    │
│  4. Si oui → UPDATE product_inventory                               │
│              WHERE warehouse_id = (Warehouse Paris)                 │
│              SET stock_actuel = 50                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### StockEasy → Shopify

```
Utilisateur modifie stock dans StockEasy (Warehouse Lyon: 30)
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase trigger → Webhook vers Gadget                             │
│                                                                      │
│  Payload: { company_id, sku, warehouse_id: Lyon, new_stock: 30 }    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Gadget: POST /api/supabase-webhook/stock-update                    │
│                                                                      │
│  1. Trouver le mapping: Warehouse Lyon → Shopify Location Lyon      │
│  2. Vérifier si cet emplacement est sync_enabled                    │
│  3. Si oui → Appeler Shopify API pour mettre à jour                │
│              inventorySetOnHandQuantities                           │
│              pour Location Lyon uniquement                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Checklist d'implémentation

### Supabase
- [ ] Migration : Ajouter `plan` et `max_sync_locations` à `companies`
- [ ] Migration : Ajouter `sync_enabled` et `sync_priority` à `warehouses`
- [ ] Migration : Créer table `product_inventory`
- [ ] Migration : Trigger de vérification des limites
- [ ] Migration : Fonctions RPC pour activer/désactiver emplacements
- [ ] Migration : Modifier triggers de synchro pour `product_inventory`

### Gadget
- [ ] Intégrer Shopify Billing API
- [ ] Créer actions : `activateLocation`, `deactivateLocation`
- [ ] Créer actions : `upgradePlan`, `downgradePlan`
- [ ] Modifier `POST-stock-update.js` pour multi-emplacements
- [ ] Modifier `shopifyInventoryLevel/update.js` pour multi-emplacements
- [ ] Ajouter routes API pour gestion des emplacements

### Frontend StockEasy
- [ ] Page "Gestion des emplacements"
- [ ] Affichage du plan actuel et limites
- [ ] Boutons activer/désactiver par emplacement
- [ ] Page upgrade/downgrade de plan
- [ ] Modification de la vue produits pour stock par emplacement

### Tests
- [ ] Test upgrade de plan
- [ ] Test limite atteinte
- [ ] Test synchro multi-emplacements
- [ ] Test downgrade (vérification emplacements actifs)

---

## ⚠️ Points d'attention

1. **Migration des données existantes** : Le stock actuel dans `produits.stock_actuel` devra être migré vers `product_inventory` pour l'emplacement par défaut.

2. **Rétrocompatibilité** : Pendant la transition, supporter les deux modes (single-location et multi-location).

3. **Performance** : Les requêtes sur `product_inventory` seront plus complexes. Prévoir des index appropriés.

4. **UX** : Bien expliquer aux utilisateurs la différence entre "emplacements importés" et "emplacements actifs pour la synchro".

---

## 📚 Ressources

- [Gadget Shopify Billing Documentation](https://docs.gadget.dev/guides/plugins/shopify/billing)
- [Shopify Billing API](https://shopify.dev/docs/apps/billing)
- [Shopify Inventory API](https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventorySetOnHandQuantities)

---

*Document créé pour référence future. Ne pas implémenter avant la stabilisation de la Phase 1.*


