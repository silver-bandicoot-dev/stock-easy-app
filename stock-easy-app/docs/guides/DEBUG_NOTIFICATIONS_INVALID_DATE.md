# 🐛 Debug: Problème "Invalid Date" dans les Notifications

## 📋 Symptômes

Les notifications dans l'interface affichent "Invalid Date" au lieu de la date/heure formatée :

```
🔔 🔔 Invalid Date [Supprimer]
```

## 🔍 Cause Racine

### Problème Identifié
La fonction PostgreSQL `get_grouped_notifications` avait été écrasée dans la migration `092_fix_remaining_critical_functions.sql`. 

**Mauvaise version (migration 092)** :
```sql
CREATE OR REPLACE FUNCTION public.get_grouped_notifications(p_limit integer DEFAULT 50)
RETURNS json  -- ❌ Retourne un JSON brut, pas une TABLE structurée
```

Cette version retournait simplement un JSON des notifications sans les grouper correctement, ce qui causait :
- Pas de champ `latest_created_at` dans la structure retournée
- Le frontend recevait `undefined` ou `null` pour les dates
- JavaScript générait "Invalid Date" lors de `new Date(undefined)`

**Bonne version (migration 077)** :
```sql
CREATE OR REPLACE FUNCTION public.get_grouped_notifications(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  group_id TEXT,
  notification_type TEXT,
  notification_count INTEGER,
  latest_title TEXT,
  latest_message TEXT,
  latest_link TEXT,
  latest_created_at TIMESTAMP WITH TIME ZONE,  -- ✅ Date correctement typée
  is_read BOOLEAN,
  notification_ids UUID[],
  metadata JSONB
)
```

## ✅ Solution Appliquée

### 1. Migration SQL (093)
Créée la migration `093_fix_grouped_notifications_function.sql` qui :
- ✅ Restaure la fonction retournant une TABLE structurée
- ✅ Ajoute le filtrage multi-tenant (`company_id`)
- ✅ Préserve la logique de groupement des notifications
- ✅ Garantit que `latest_created_at` est toujours présent et typé

### 2. Améliorations Frontend
Ajouté des validations robustes dans les composants :

**`NotificationsPage.jsx`** :
```javascript
const formatDate = (dateString) => {
  // Validation de la date
  if (!dateString) {
    console.warn('formatDate: dateString est null ou undefined');
    return 'Date inconnue';
  }

  const date = new Date(dateString);
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    console.error('formatDate: Date invalide reçue:', dateString);
    return 'Date invalide';
  }
  
  // ... reste du formatage
};
```

**`NotificationBell.jsx`** :
```javascript
const formatRelativeTime = (dateString) => {
  // Même validation que ci-dessus
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.error('formatRelativeTime: Date invalide reçue:', dateString);
    return 'Date invalide';
  }
  
  // ... reste du formatage
};
```

## 🚀 Déploiement

### Étapes pour corriger le problème :

1. **Appliquer la migration SQL** :
```bash
# Connexion à Supabase
supabase db push

# Ou manuellement via le dashboard Supabase :
# - Aller dans SQL Editor
# - Copier le contenu de 093_fix_grouped_notifications_function.sql
# - Exécuter
```

2. **Vérifier que la fonction est correctement créée** :
```sql
-- Dans Supabase SQL Editor
SELECT 
  routine_name,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'get_grouped_notifications'
  AND routine_schema = 'public';
```

Vous devriez voir `data_type = 'USER-DEFINED'` (pour TABLE) et non `json`.

3. **Redéployer le frontend** :
```bash
cd stock-easy-app
npm run build
# Ou si déjà en production, Vercel redéploiera automatiquement
```

4. **Tester** :
- Recharger l'application
- Ouvrir la cloche de notifications
- Vérifier que les dates s'affichent correctement : "Il y a 5 min", "Il y a 2h", etc.

## 🔍 Vérification Post-Déploiement

### Console Navigateur
Ouvrir la console développeur et vérifier :
```javascript
// Pas d'erreurs "Date invalide reçue"
// Pas d'avertissements "dateString est null"
```

### Test de la fonction SQL
```sql
-- Tester directement dans Supabase
SELECT * FROM get_grouped_notifications(10);

-- Vérifier que latest_created_at contient des valeurs
-- Format attendu : 2024-12-08T14:30:00+00:00
```

### Interface Utilisateur
- [ ] Les dates s'affichent correctement dans le dropdown de notifications
- [ ] Les dates s'affichent correctement dans `/notifications`
- [ ] Plus d'erreurs "Invalid Date"
- [ ] Les dates relatives fonctionnent : "À l'instant", "Il y a 5 min", etc.

## 📚 Leçons Apprises

### ⚠️ Éviter les Régressions
1. **Ne jamais écraser une fonction sans vérifier sa signature complète**
   - La migration 092 a changé le type de retour de `TABLE` à `json`
   - Cela a cassé le contrat d'interface avec le frontend

2. **Toujours tester les migrations critiques**
   - Les fonctions RPC utilisées côté frontend sont critiques
   - Un changement de signature = breaking change

3. **Documenter les dépendances**
   - Le service `notificationsService.ts` dépend de la structure TABLE
   - Si on change la fonction SQL, il faut adapter le service

### ✅ Bonnes Pratiques
1. **Validation défensive côté frontend**
   - Toujours valider les dates avant de les formater
   - Afficher des messages d'erreur explicites en cas de problème

2. **Migration incrémentale**
   - Ne pas fusionner plusieurs corrections en une seule migration
   - Facilite le rollback en cas de problème

3. **Tests de bout en bout**
   - Tester les notifications après chaque migration de la fonction
   - Vérifier dans l'UI que tout fonctionne

## 🔗 Fichiers Modifiés

- ✅ `supabase/migrations/093_fix_grouped_notifications_function.sql` (nouveau)
- ✅ `src/components/notifications/NotificationsPage.jsx` (validation dates)
- ✅ `src/components/notifications/NotificationBell.jsx` (validation dates)
- 📝 `docs/guides/DEBUG_NOTIFICATIONS_INVALID_DATE.md` (ce fichier)

## 📞 Support

Si le problème persiste après ces corrections :
1. Vérifier les logs navigateur (F12 → Console)
2. Vérifier les logs Supabase (Dashboard → Logs → Postgres)
3. Tester manuellement la fonction SQL
4. Contacter l'équipe de développement avec les logs

