# 🧪 Test de Création de Commande

## 🎯 Problème Identifié
La commande ne se crée pas dans la base de données Supabase.

## 📋 Test 1 : Vérifier que la fonction RPC existe

Dans **Supabase SQL Editor**, exécutez :

```sql
-- Vérifier si la fonction create_order existe
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'create_order';
```

**Résultat attendu** : Vous devriez voir la définition de la fonction `create_order`

---

## 📋 Test 2 : Tester la fonction RPC manuellement

Dans **Supabase SQL Editor**, exécutez :

```sql
-- Test de création d'une commande simple
SELECT create_order(
  p_order_id := 'TEST-PO-001',
  p_supplier := 'Test Supplier',
  p_warehouse_id := NULL,
  p_items := '[
    {
      "sku": "SKU-001",
      "quantity": 10,
      "pricePerUnit": 5.50
    }
  ]'::jsonb,
  p_notes := 'Commande de test'
);
```

### ✅ Si ça fonctionne
Vous verrez un résultat JSON comme :
```json
{"success": true, "order_id": "TEST-PO-001"}
```

### ❌ Si ça échoue
Vous verrez une erreur. **Copiez l'erreur exacte** pour qu'on puisse la corriger.

---

## 📋 Test 3 : Vérifier dans la console du navigateur

1. Ouvrez votre application
2. Appuyez sur **F12** (console)
3. Essayez de créer une commande
4. **Regardez les logs** dans la console

### Ce que vous devriez voir :

```
🧾 createOrder payload {
  p_order_id: "PO-2024-XXX",
  p_supplier: "Nom du fournisseur",
  p_warehouse_id: "...",
  p_items: [...],
  p_notes: "..."
}
```

Puis soit :
- ✅ `Success: Commande créée` 
- ❌ `Erreur création commande: [message d'erreur]`

---

## 🔧 Solutions Possibles

### Solution 1 : La fonction RPC n'existe pas

Si le Test 1 ne retourne rien, la fonction n'existe pas. Il faut l'ajouter.

**Créez cette migration dans Supabase SQL Editor** :

```sql
-- Fonction pour créer une commande
CREATE OR REPLACE FUNCTION public.create_order(
  p_order_id TEXT,
  p_supplier TEXT,
  p_warehouse_id TEXT DEFAULT NULL,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_total NUMERIC := 0;
  v_item JSONB;
BEGIN
  SET search_path = public;

  -- Calculer le total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + ((v_item->>'quantity')::NUMERIC * (v_item->>'pricePerUnit')::NUMERIC);
  END LOOP;

  -- Insérer la commande
  INSERT INTO public.commandes (
    id,
    supplier,
    warehouse_id,
    status,
    total,
    notes,
    created_at
  ) VALUES (
    p_order_id,
    p_supplier,
    p_warehouse_id,
    'pending_confirmation',
    v_total,
    p_notes,
    NOW()
  );

  -- Insérer les articles
  INSERT INTO public.articles_commande (order_id, sku, quantity, price_per_unit)
  SELECT 
    p_order_id,
    item->>'sku',
    (item->>'quantity')::INTEGER,
    (item->>'pricePerUnit')::NUMERIC
  FROM jsonb_array_elements(p_items) as item;

  RETURN json_build_object(
    'success', TRUE,
    'order_id', p_order_id,
    'message', 'Commande créée avec succès'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.create_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order TO anon;
```

---

### Solution 2 : Problème de permissions

Si la fonction existe mais échoue, vérifiez les permissions :

```sql
-- Accorder les permissions sur les tables
GRANT INSERT ON public.commandes TO authenticated;
GRANT INSERT ON public.articles_commande TO authenticated;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION public.create_order TO authenticated;
```

---

### Solution 3 : Problème de RLS (Row Level Security)

Si vous avez des politiques RLS, vérifiez-les :

```sql
-- Voir les politiques sur commandes
SELECT * FROM pg_policies WHERE tablename = 'commandes';

-- Désactiver temporairement RLS pour tester (ATTENTION: réactiver après!)
ALTER TABLE public.commandes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles_commande DISABLE ROW LEVEL SECURITY;
```

⚠️ **IMPORTANT** : Si vous désactivez RLS pour tester, **réactivez-le après** avec :
```sql
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles_commande ENABLE ROW LEVEL SECURITY;
```

---

### Solution 4 : Vérifier la structure des tables

```sql
-- Vérifier que la table commandes existe avec les bonnes colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commandes';

-- Vérifier que la table articles_commande existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles_commande';
```

---

## 🎯 Action Immédiate

**Faites dans l'ordre** :

1. ✅ Test 1 : Vérifier si la fonction existe
2. ✅ Test 2 : Tester la fonction manuellement
3. ✅ Test 3 : Vérifier les logs dans la console

**Puis dites-moi** :
- La fonction existe-t-elle ?
- Le Test 2 fonctionne-t-il ?
- Quel message d'erreur voyez-vous dans la console ?

---

**Je vous aiderai à corriger le problème exact une fois que vous aurez ces informations ! 😊**

