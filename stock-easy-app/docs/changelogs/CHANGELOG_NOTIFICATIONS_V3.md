# 🔔 Changelog - Système de Notifications v3.0

## 📅 Date : Novembre 2025

---

## 🎯 Améliorations majeures

Cette version apporte 4 améliorations significatives au système de notifications :

### 1. ⚙️ Préférences utilisateur

Les utilisateurs peuvent maintenant personnaliser leurs notifications :

**Notifications in-app :**
- ✅ Activer/désactiver chaque type de notification
- 💬 Mentions (@user)
- 🚨 Alertes ML critiques
- 🧠 Rapport ML hebdomadaire
- 🤖 Recommandations ML
- 📦 Alertes de stock
- 🚚 Mises à jour commandes

**Notifications email :**
- 📧 Activer les emails de notification
- ⏰ Choisir la fréquence (instantané, quotidien, hebdomadaire)
- 🕘 Définir l'heure de réception du digest
- 📋 Sélectionner les types inclus dans les emails

**Accès :** Cliquer sur ⚙️ dans la cloche ou dans la page `/notifications`

---

### 2. 🚫 Déduplication ML intelligente

Fini le spam ! Le système évite désormais les notifications en doublon :

**Comment ça marche :**
- Chaque notification ML possède une **clé de déduplication** unique
- Un **cooldown** empêche les doublons pendant une période définie
- Les notifications déjà envoyées dans la fenêtre de temps sont ignorées

**Cooldowns par défaut :**
| Type | Cooldown | Clé de déduplication |
|------|----------|---------------------|
| Alertes ML | 24h | SKU du produit |
| Recommandations ML | 12h | Fournisseur + SKUs |
| Rapport hebdomadaire | 7 jours | Numéro de semaine |
| Mentions | 1h | Commande + Auteur |

**Exemple :**
```
❌ AVANT: 5 alertes "Rupture SKU-001" en 24h
✅ APRÈS: 1 alerte + compteur de tentatives ignorées
```

---

### 3. 📦 Groupement de notifications

Les notifications similaires sont maintenant regroupées :

**Fonctionnalités :**
- Regroupement par **type** et **fenêtre temporelle**
- Badge indiquant le nombre de notifications dans le groupe
- Clic pour marquer **tout le groupe** comme lu
- Configurable via les préférences

**Affichage :**
```
🚨 3 alertes ML         au lieu de  🚨 Alerte ML (SKU-001)
   → Cliquer pour voir              🚨 Alerte ML (SKU-002)
                                     🚨 Alerte ML (SKU-003)
```

**Configuration :**
- Activer/désactiver le groupement
- Fenêtre de temps ajustable (15 min à 4h)

---

### 4. 📧 Email Digest

Recevez un résumé de vos notifications par email :

**Fréquences disponibles :**
| Option | Description |
|--------|-------------|
| Instantané | 1 email par notification importante |
| Quotidien | Résumé chaque jour à l'heure choisie |
| Hebdomadaire | Résumé une fois par semaine |
| Jamais | Pas d'emails |

**Contenu du digest :**
- Notifications groupées par type
- Liens directs vers les ressources
- Design responsive et professionnel

**Configuration :**
- Jour du résumé hebdomadaire (Lun-Dim)
- Heure de réception (0h-23h)
- Types de notifications inclus

---

## 🗄️ Nouvelles tables de base de données

### `notification_preferences`
Stocke les préférences de notification par utilisateur.

```sql
- mention_enabled, ml_alert_enabled, etc.
- email_enabled, email_frequency
- email_digest_hour, email_digest_day
- group_similar_enabled, group_time_window_minutes
```

### `notification_cooldowns`
Gère la déduplication des notifications.

```sql
- user_id, notification_type, dedup_key
- last_sent_at, count
```

### `notification_email_queue`
File d'attente pour les emails à envoyer.

```sql
- notification_id, email_type
- status (pending, sent, failed)
- scheduled_at, sent_at
```

---

## 🆕 Nouveaux fichiers

### Services
- `src/services/notificationPreferencesService.ts` - Gestion des préférences
- `src/services/emailDigestService.js` - Génération et envoi des emails

### Composants
- `src/components/notifications/NotificationPreferences.jsx` - UI des préférences

### Migrations
- `supabase/migrations/077_notifications_improvements.sql`

---

## 📝 Fonctions SQL ajoutées

| Fonction | Description |
|----------|-------------|
| `get_or_create_notification_preferences()` | Récupère ou crée les préférences |
| `check_notification_cooldown()` | Vérifie si une notification peut être envoyée |
| `record_notification_sent()` | Enregistre l'envoi pour le cooldown |
| `create_notification_v2()` | Crée une notification avec préférences + dédup |
| `get_grouped_notifications()` | Retourne les notifications groupées |
| `cleanup_old_cooldowns()` | Nettoie les anciens cooldowns |

---

## 🔄 Migration

### Pour les utilisateurs
✅ **Aucune action requise**
- Les préférences par défaut sont créées automatiquement
- Tout est activé par défaut
- Les anciens comportements sont préservés

### Pour les développeurs
⚠️ **Appliquer la migration 077**

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement dans le Dashboard Supabase
```

---

## 📊 API mise à jour

### Nouvelles fonctions de service

```typescript
// Préférences
getNotificationPreferences()
updateNotificationPreferences(updates)

// Création v2 avec dédup
createNotificationV2(options)
createNotificationsForUsersV2(userIds, type, title, ...)

// Notifications groupées
getGroupedNotifications(limit)
markMultipleAsRead(notificationIds)
deleteMultipleNotifications(notificationIds)
```

---

## 🎨 Aperçu de l'interface

### Cloche de notification
- Badge de comptage amélioré
- Affichage groupé dans le dropdown
- Bouton accès rapide aux préférences

### Page /notifications
- Filtres par type de notification
- Toggle vue groupée/liste
- Actions groupées (marquer lu, supprimer)

### Modal préférences
- 3 onglets : In-App, Email, Groupement
- Toggles visuels pour chaque option
- Sauvegarde avec feedback

---

## 🔮 Évolutions futures

- [ ] Notifications push navigateur (PWA)
- [ ] Statistiques de notifications
- [ ] Templates d'email personnalisables
- [ ] Règles de notification avancées
- [ ] Export de l'historique

---

## 📞 Support

En cas de problème :
1. Vérifier que la migration 077 est appliquée
2. Consulter les logs de la console
3. Vérifier les politiques RLS

---

**Version :** 3.0.0  
**Date :** Novembre 2025  
**Statut :** ✅ Production Ready

