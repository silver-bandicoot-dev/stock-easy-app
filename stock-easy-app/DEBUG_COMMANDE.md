# 🔍 Debug : Commande Non Visible dans "En Cours de Commande"

## 🎯 Problème
Vous venez de créer une commande depuis les recommandations, mais elle n'apparaît pas dans l'onglet "Track & Manage" > "En cours de commande".

## ✅ Ce qui est correct
- La fonction `loadData()` est bien appelée après création de commande
- Le statut `pending_confirmation` est bien défini lors de la création
- Le filtre dans TrackTab recherche bien `status === 'pending_confirmation'`

## 🔍 Causes Possibles

### 1️⃣ La commande n'a pas été créée dans la base de données
**Test à faire** : Vérifier dans Supabase

```sql
-- Dans Supabase SQL Editor
SELECT 
  id,
  supplier,
  status,
  created_at,
  warehouse_id
FROM commandes
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu** : Vous devriez voir votre commande récente avec `status = 'pending_confirmation'`

---

### 2️⃣ Le statut de la commande n'est pas correct
**Test à faire** : Dans la console du navigateur (F12)

```javascript
// Voir toutes les commandes chargées
console.log('📦 Toutes les commandes:', orders);

// Filtrer celles avec pending_confirmation
console.log('⏳ Commandes en attente:', 
  orders.filter(o => o.status === 'pending_confirmation')
);
```

**Résultat attendu** : Vous devriez voir votre nouvelle commande

---

### 3️⃣ La synchronisation n'a pas eu lieu
**Test à faire** : Forcer un rechargement

Dans la console du navigateur :
```javascript
// Forcer le rechargement des données
location.reload();
```

Ou cliquer sur le bouton de synchronisation s'il existe.

---

### 4️⃣ Problème de mapping des données
**Test à faire** : Vérifier le format de la commande

```javascript
// Voir la structure d'une commande
console.log('📋 Structure commande:', orders[0]);
```

**Vérifiez que** :
- `status` existe et est bien une string
- `status` vaut exactement `'pending_confirmation'` (pas d'espaces, pas de majuscules)

---

## 🛠️ Solutions Rapides

### Solution 1 : Rafraîchir la page
Le plus simple :
```
F5 ou Ctrl+R (Cmd+R sur Mac)
```

### Solution 2 : Vérifier la console pour les erreurs
Ouvrez la console (F12) et cherchez des messages d'erreur en rouge après avoir créé la commande.

### Solution 3 : Vérifier que la commande existe dans Supabase
Si la commande n'apparaît pas dans Supabase après avoir cliqué sur "Créer", alors il y a un problème avec `api.createOrder`.

---

## 🔧 Corrections Possibles

### Si la commande n'est pas créée dans Supabase

Vérifiez le fichier `src/services/supabaseApiService.js` :

```javascript
export async function createOrder(orderData) {
  try {
    console.log('📦 Création commande:', orderData);
    
    const { data, error } = await supabase.rpc('create_order', {
      p_order_data: orderData
    });

    if (error) {
      console.error('❌ Erreur createOrder:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Commande créée:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception createOrder:', error);
    return { success: false, error: error.message };
  }
}
```

**Assurez-vous que** :
- ✅ Le log "✅ Commande créée" apparaît
- ✅ Aucune erreur n'est affichée

---

### Si le status n'est pas correct

Dans `src/components/actions/ActionsTab.jsx`, vérifiez ligne 137 :

```javascript
status: 'pending_confirmation',  // ✅ Exactement comme ça, pas d'espace
```

---

### Si le filtre ne fonctionne pas

Dans `src/components/track/TrackSection.jsx` ligne 23 :

```javascript
case 'en_cours_commande': return order.status === 'pending_confirmation';
```

**Ajoutez un log pour debug** :
```javascript
case 'en_cours_commande': 
  console.log('🔍 Order status:', order.status);
  return order.status === 'pending_confirmation';
```

---

## 📊 Test Complet

### Étape 1 : Ouvrez la console (F12)

### Étape 2 : Créez une nouvelle commande

### Étape 3 : Regardez les logs

Vous devriez voir dans l'ordre :
```
📦 Création commande: {supplier: "...", status: "pending_confirmation", ...}
✅ Commande créée: {...}
🔄 Real-time: Changement détecté, rechargement des données...
✅ Données chargées depuis Supabase
```

### Étape 4 : Vérifiez les commandes

```javascript
// Dans la console
console.table(orders.map(o => ({
  id: o.id,
  supplier: o.supplier,
  status: o.status,
  created: new Date(o.createdAt).toLocaleString()
})));
```

---

## 🎯 Actions Immédiates

**Faites ceci maintenant** :

1. ✅ Ouvrez la console du navigateur (F12)
2. ✅ Créez une nouvelle commande
3. ✅ Copiez-collez tous les logs qui apparaissent
4. ✅ Envoyez-moi ces logs pour que je puisse identifier le problème exact

**OU**

1. ✅ Rechargez la page (F5)
2. ✅ Allez dans Track & Manage > En cours de commande
3. ✅ Dites-moi si la commande apparaît maintenant

---

**Dites-moi ce que vous trouvez et je vous aiderai à résoudre le problème ! 😊**

