# 🔔 Système de Notifications avec Mentions

## 📋 Vue d'ensemble

Un système de notifications en temps réel a été implémenté pour permettre aux utilisateurs de recevoir des alertes lorsqu'ils sont mentionnés dans des commentaires.

---

## 🗄️ Structure de la Base de Données

### Table `notifications`

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL, -- Utilisateur qui reçoit la notification
  type TEXT NOT NULL, -- 'mention', 'order_update', 'alert', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL vers la ressource (ex: /track?order=PO-123)
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}', -- Données supplémentaires
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Index pour Performance

```sql
-- Recherche par utilisateur
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Filtre par statut de lecture
CREATE INDEX idx_notifications_read ON notifications(read);

-- Tri par date
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Notifications non lues par utilisateur (optimisé)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
```

---

## 🔐 Row Level Security (RLS)

### Politiques de Sécurité

1. **Lecture** : Un utilisateur ne peut voir que ses propres notifications
2. **Mise à jour** : Un utilisateur ne peut modifier que ses propres notifications
3. **Suppression** : Un utilisateur ne peut supprimer que ses propres notifications
4. **Insertion** : Autorisée pour tous les utilisateurs authentifiés (création automatique)

```sql
-- Voir ses propres notifications
CREATE POLICY "allow_read_own_notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Modifier ses propres notifications
CREATE POLICY "allow_update_own_notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);
```

---

## ⚡ Realtime

La table `notifications` est configurée avec **Supabase Realtime** pour recevoir instantanément les nouvelles notifications sans rafraîchir la page.

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

---

## 🤖 Trigger Automatique

Un trigger PostgreSQL crée automatiquement des notifications lorsqu'un utilisateur est mentionné dans un commentaire :

```sql
CREATE TRIGGER trigger_notify_mentions
  AFTER INSERT ON public.order_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentioned_users();
```

### Fonction `notify_mentioned_users()`

1. Récupère le nom de l'auteur du commentaire
2. Pour chaque utilisateur mentionné dans `mentioned_users[]` :
   - Crée une notification de type `'mention'`
   - Ajoute un lien vers la commande concernée
   - Stocke les métadonnées (ID commentaire, auteur, etc.)

---

## 📁 Architecture Frontend

### Services

#### `notificationsService.ts`

Fonctions principales :

```typescript
// Récupérer les notifications
getUserNotifications(limit?: number)
getUnreadNotifications()
getUnreadCount()

// Marquer comme lu
markAsRead(notificationId: string)
markAllAsRead()

// Supprimer
deleteNotification(notificationId: string)
deleteReadNotifications()

// Temps réel
subscribeToNotifications(userId, onNotification)
```

### Composants

#### 1. `NotificationBell.jsx`

**Emplacement** : En haut à droite de l'application (déjà intégré dans `StockEasy.jsx`)

**Fonctionnalités** :
- 🔴 Badge avec le nombre de notifications non lues
- 📋 Dropdown avec les 20 dernières notifications
- ⚡ Mise à jour en temps réel via Realtime
- 🖱️ Clic pour naviguer vers la ressource concernée
- ✅ Marquer comme lu / Supprimer
- 🖥️ Notifications système du navigateur (si permission accordée)

**Affichage** :
```jsx
<NotificationBell />
// Affiche une cloche avec badge rouge si notifications non lues
```

#### 2. `NotificationsPage.jsx`

**Route** : `/notifications`

**Fonctionnalités** :
- 📊 Vue complète de toutes les notifications
- 🔍 Filtres : Toutes / Non lues / Lues
- ✅ Marquer toutes comme lues
- 🗑️ Supprimer les notifications lues
- 🔄 Actualiser manuellement
- 📱 Design responsive

---

## 🎨 Types de Notifications

| Type | Icône | Description | Exemple |
|------|-------|-------------|---------|
| `mention` | 💬 | Mention dans un commentaire | "@user vous a mentionné" |
| `order_update` | 📦 | Mise à jour de commande | "Commande PO-123 expédiée" |
| `alert` | ⚠️ | Alerte stock/rupture | "Stock faible pour SKU-001" |

---

## 🚀 Utilisation

### 1. Mentionner un Utilisateur

Dans un commentaire de commande :

```jsx
<CommentSection orderId="PO-123" />
// L'utilisateur tape: "Bonjour @jory, pouvez-vous vérifier ?"
```

**Résultat** :
1. Le commentaire est sauvegardé avec `mentioned_users: [jory_user_id]`
2. Le trigger crée automatiquement une notification pour Jory
3. Jory reçoit instantanément la notification (via Realtime)
4. Une notification système s'affiche sur son écran (si autorisé)
5. Le badge de la cloche se met à jour : 🔴 1

### 2. Voir ses Notifications

#### Option A : Dropdown (Cloche en haut à droite)
- Cliquer sur 🔔 pour voir les 20 dernières
- Cliquer sur une notification pour naviguer vers la ressource

#### Option B : Page complète
- Cliquer sur "Voir toutes les notifications" dans le dropdown
- Ou naviguer vers `/notifications`

### 3. Gérer ses Notifications

```typescript
// Marquer une notification comme lue
await markAsRead(notificationId);

// Marquer toutes comme lues
await markAllAsRead();

// Supprimer une notification
await deleteNotification(notificationId);

// Supprimer toutes les notifications lues
await deleteReadNotifications();
```

---

## 📡 Flux de Données

### Création d'une Notification (Mention)

```
1. Utilisateur poste un commentaire avec @mention
   └─> order_comments.insert()
   
2. Trigger PostgreSQL s'exécute
   └─> notify_mentioned_users()
   
3. Notification créée dans la table
   └─> notifications.insert()
   
4. Supabase Realtime diffuse l'événement
   └─> subscribeToNotifications() reçoit l'événement
   
5. Frontend met à jour l'interface
   ├─> Badge cloche : 🔔 → 🔴 1
   ├─> Dropdown : Nouvelle notification en haut
   └─> Notification système du navigateur (optionnel)
```

### Lecture d'une Notification

```
1. Utilisateur clique sur la notification
   └─> handleNotificationClick()
   
2. Marquer comme lue (si non lue)
   └─> markAsRead(notificationId)
   
3. Navigation vers la ressource
   └─> navigate(notification.link)
   
4. UI mise à jour
   ├─> Badge décrémenté : 🔴 1 → 🔔
   └─> Notification passe en gris (lue)
```

---

## 🔧 Configuration Technique

### Migration Supabase

```bash
# Appliquer la migration
supabase/migrations/017_create_notifications.sql
```

### Dépendances

```json
{
  "lucide-react": "Icônes (Bell, Trash2, etc.)",
  "react-router-dom": "Navigation",
  "@supabase/supabase-js": "Client Supabase + Realtime"
}
```

### Permissions Navigateur

Pour les notifications système :

```javascript
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
```

---

## 📊 Statistiques et Métriques

### Requêtes Optimisées

```sql
-- Nombre de notifications non lues (index utilisé)
SELECT COUNT(*) FROM notifications
WHERE user_id = $1 AND read = FALSE;

-- Notifications récentes (index utilisé)
SELECT * FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20;
```

### Performance

- **Index B-tree** sur `user_id`, `read`, `created_at`
- **Index partiel** pour les notifications non lues (plus rapide)
- **LIMIT** sur les requêtes pour éviter les scans complets
- **Realtime** pour éviter le polling constant

---

## 🧪 Tests

### Test 1 : Mention dans un Commentaire

1. Ouvrir une commande (ex: PO-123)
2. Poster un commentaire : "Test @jory"
3. **Vérifier** :
   - ✅ Badge de la cloche : 🔴 1
   - ✅ Notification visible dans le dropdown
   - ✅ Titre : "Vous avez été mentionné"
   - ✅ Message : "[Nom auteur] vous a mentionné dans un commentaire"
   - ✅ Clic sur la notification → Navigation vers `/track?order=PO-123`

### Test 2 : Notifications en Temps Réel

1. Ouvrir l'app dans 2 onglets (User A et User B)
2. User A mentionne User B dans un commentaire
3. **Vérifier sur l'onglet de User B** :
   - ✅ Badge mis à jour instantanément (sans refresh)
   - ✅ Notification apparaît dans le dropdown
   - ✅ Notification système du navigateur (si permission)

### Test 3 : Marquer comme Lu

1. Cliquer sur une notification non lue
2. **Vérifier** :
   - ✅ Badge décrémenté : 🔴 1 → 🔔
   - ✅ Notification passe en gris
   - ✅ Navigation vers la ressource

### Test 4 : Page Complète

1. Naviguer vers `/notifications`
2. **Vérifier** :
   - ✅ Liste complète des notifications
   - ✅ Filtres : Toutes / Non lues / Lues
   - ✅ Boutons : Actualiser / Tout marquer comme lu / Supprimer les lues

---

## 🐛 Dépannage

### Problème : Badge ne se met pas à jour

**Causes possibles** :
- Realtime non activé sur la table `notifications`
- Permission Realtime non accordée dans Supabase

**Solution** :
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Problème : Notifications système non affichées

**Cause** : Permission non accordée par le navigateur

**Solution** :
```javascript
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    new Notification('Test');
  }
});
```

### Problème : Mentions ne créent pas de notifications

**Causes possibles** :
- Trigger non créé ou désactivé
- Fonction `notify_mentioned_users()` a une erreur

**Vérification** :
```sql
-- Vérifier le trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_mentions';

-- Tester la fonction manuellement
SELECT notify_mentioned_users();
```

---

## 🎯 Évolutions Futures

### Fonctionnalités Potentielles

1. **Types de notifications supplémentaires** :
   - 📦 Commande confirmée
   - 🚚 Commande expédiée
   - ✅ Commande livrée
   - ⚠️ Stock en rupture
   - 📊 Rapport hebdomadaire

2. **Préférences utilisateur** :
   - Activer/désactiver par type
   - Fréquence de notification
   - Canaux (email, in-app, push)

3. **Notifications par email** :
   - Résumé quotidien
   - Alertes critiques

4. **Notifications push** :
   - Service Worker pour PWA
   - Push notifications sur mobile

5. **Groupement de notifications** :
   - "3 nouvelles mentions"
   - "5 commandes mises à jour"

---

## 📚 Ressources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

---

## ✅ Checklist de Déploiement

- [x] Migration SQL appliquée
- [x] Table `notifications` créée
- [x] Trigger `notify_mentioned_users` configuré
- [x] RLS policies activées
- [x] Realtime activé sur la table
- [x] Service `notificationsService.ts` créé
- [x] Composant `NotificationBell` créé et intégré
- [x] Composant `NotificationsPage` créé
- [x] Route `/notifications` ajoutée
- [ ] Tests fonctionnels validés
- [ ] Documentation utilisateur créée

---

**Date de création** : 12 novembre 2025  
**Version** : 1.0.0  
**Statut** : ✅ Opérationnel





