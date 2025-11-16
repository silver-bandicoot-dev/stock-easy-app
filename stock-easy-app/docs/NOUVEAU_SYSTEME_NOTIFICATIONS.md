# Nouveau Système de Notifications

## 📋 Vue d'ensemble

Le système de notifications a été complètement repensé pour ne notifier les utilisateurs que dans deux cas précis :

1. **Mentions dans les commentaires** : Quand un utilisateur est tagué (@user) dans un commentaire
2. **Recommandations Machine Learning** : Alertes ML critiques et rapport hebdomadaire

## ✅ Ce qui a été modifié

### Désactivation des notifications automatiques

Toutes les notifications automatiques suivantes ont été **désactivées** :
- ❌ Alertes de stock (rupture, bientôt en rupture)
- ❌ Produits non mappés
- ❌ Rapports hebdomadaires généraux
- ❌ Commandes en retard
- ❌ Écarts de réception
- ❌ Alertes de surstock
- ❌ Informations fournisseurs manquantes

Le hook `useAutoNotifications` est maintenant configuré avec `enabled: false`.

---

## 🎯 Types de notifications actives

### 1. Notifications de mentions (@user)

**Fichiers concernés :**
- `src/services/mentionNotificationsService.js` (nouveau)
- `src/services/commentsService.ts` (modifié)

**Comment ça fonctionne :**

Quand un utilisateur écrit un commentaire avec une mention (`@jean.dupont` ou `@jean@company.com`), le système :

1. **Détecte automatiquement** les mentions dans le texte
2. **Résout les mentions** en cherchant les utilisateurs correspondants dans l'entreprise
3. **Crée une notification** pour chaque utilisateur mentionné (sauf l'auteur)

**Format des mentions :**
```
@jean.dupont          → Jean Dupont
@marie@company.com    → marie@company.com
@thomas               → thomas@company.com (si unique dans l'entreprise)
```

**Exemple de notification :**
```
Type: mention
Titre: 💬 Jean Dupont vous a mentionné
Message: Dans la commande PO-2024-001: "Peux-tu vérifier cette commande @marie..."
Lien: /track?order=PO-2024-001
```

**Fonctions disponibles :**
- `notifyMentionedUsers()` : Crée les notifications pour les utilisateurs mentionnés
- `extractMentions()` : Extrait automatiquement les IDs utilisateurs depuis le texte
- `getCompanyUsersForMention()` : Récupère la liste des utilisateurs pour l'autocomplétion

---

### 2. Notifications Machine Learning

**Fichiers concernés :**
- `src/services/mlNotificationsService.js` (nouveau)
- `src/hooks/useMLWeeklyNotifications.js` (nouveau)
- `src/services/ml/alertService.js` (existant, utilisé)

**Deux types de notifications ML :**

#### A. Notification hebdomadaire (Lundi 9h)

Une notification est envoyée **chaque lundi à 9h du matin** pour inviter les utilisateurs à consulter les analyses ML :

```
Type: ml_weekly
Titre: 🧠 Analyse ML hebdomadaire disponible
Message: Une nouvelle analyse de prévision de demande est disponible...
Lien: /ml-analysis
```

#### B. Alertes ML critiques (Quotidien)

Le système vérifie **toutes les 24 heures** les prévisions ML et crée des notifications uniquement pour :

- **Alertes de haute sévérité** (`critical` ou `high`)
- **Recommandations urgentes** avec haute confiance (>80%)

**Exemples d'alertes critiques :**

```
Type: ml_alert
Titre: 🚨 ML: Rupture de stock prévue dans 3 jours pour Produit X
Message: Stock actuel: 50 unités. Demande prévue: 75 unités.
Lien: /stock?sku=PROD-X
```

```
Type: ml_recommendation
Titre: 🤖 ML recommande: Commander chez Fournisseur ABC
Message: 3 produits à commander URGENCE: Produit A, Produit B, Produit C...
Lien: /order?supplier=Fournisseur%20ABC
```

**Fonctions disponibles :**
- `notifyWeeklyMLAnalysis()` : Crée la notification hebdomadaire
- `notifyMLCriticalAlerts()` : Crée des notifications pour les alertes critiques
- `notifyMLRecommendations()` : Crée des notifications pour les recommandations urgentes
- `checkAndNotifyMLInsights()` : Fonction principale qui vérifie et crée toutes les notifications ML

---

## 🔧 Configuration

### Paramètres du hook ML

Dans `StockEasy.jsx` :

```javascript
useMLWeeklyNotifications(products, forecasts, {
  enabled: true,                              // Activer/désactiver
  weeklyDay: 1,                               // Lundi (0=Dimanche, 1=Lundi, etc.)
  weeklyHour: 9,                              // 9h du matin
  criticalCheckInterval: 24 * 60 * 60 * 1000  // Vérifier toutes les 24h
});
```

### Seuil de confiance ML

Dans `mlNotificationsService.js` :

```javascript
notifyMLCriticalAlerts(products, forecasts, 80); // 80% de confiance minimum
```

---

## 📊 Métadonnées des notifications

Chaque notification contient des métadonnées pour permettre des actions et un filtrage :

### Mention
```javascript
{
  orderId: "PO-2024-001",
  authorId: "user-123",
  authorName: "Jean Dupont",
  commentPreview: "Le contenu complet du commentaire..."
}
```

### ML Alert
```javascript
{
  severity: "critical",
  sku: "PROD-X",
  productName: "Produit X",
  alertType: "stockout-risk",
  action: "order_now",
  confidence: "high"
}
```

### ML Recommendation
```javascript
{
  supplier: "Fournisseur ABC",
  productCount: 3,
  totalCost: 1250.50,
  urgency: "urgent",
  products: [
    { sku: "PROD-A", name: "Produit A", quantity: 50, reason: "Rupture dans 3j" },
    // ...
  ]
}
```

---

## 🧪 Tests

### Test des mentions

1. Créer un commentaire avec `@utilisateur`
2. Vérifier que l'utilisateur mentionné reçoit une notification
3. Vérifier que l'auteur ne se notifie pas lui-même

### Test des notifications ML

Pour tester sans attendre le lundi ou 24h :

```javascript
// Dans la console du navigateur ou dans le code
import { notifyWeeklyMLAnalysis, checkAndNotifyMLInsights } from './services/mlNotificationsService';

// Test notification hebdomadaire
await notifyWeeklyMLAnalysis();

// Test alertes critiques (nécessite des produits et prévisions)
await checkAndNotifyMLInsights(products, forecasts);
```

---

## 📝 Notes importantes

1. **Les prévisions ML doivent être actives** pour que les alertes critiques fonctionnent
2. **Les intervalles sont configurables** via les options du hook
3. **Les notifications sont stockées dans Supabase** et accessibles via le composant `NotificationBell`
4. **Aucune notification en doublon** : le système vérifie les intervalles minimum entre notifications
5. **Mode temps réel** : Le composant `NotificationBell` s'abonne automatiquement aux nouvelles notifications

---

## 🚀 Améliorations futures possibles

- [ ] Permettre aux utilisateurs de configurer leurs préférences de notification
- [ ] Ajouter des filtres de notification par type dans l'UI
- [ ] Implémenter des notifications par email pour les mentions critiques
- [ ] Ajouter des notifications push navigateur
- [ ] Créer un historique de notifications avec recherche

---

## 📦 Fichiers créés/modifiés

### Nouveaux fichiers
- `src/services/mentionNotificationsService.js`
- `src/services/mlNotificationsService.js`
- `src/hooks/useMLWeeklyNotifications.js`
- `docs/NOUVEAU_SYSTEME_NOTIFICATIONS.md`

### Fichiers modifiés
- `src/StockEasy.jsx` (désactivation notifications auto + ajout hook ML)
- `src/services/commentsService.ts` (intégration mentions)
- `src/hooks/useAutoNotifications.js` (commentaires sur désactivation)

---

## ✅ Migration réussie

Le système de notifications est maintenant beaucoup plus **ciblé** et **pertinent** :
- ✅ Pas de spam de notifications automatiques
- ✅ Seules les mentions importantes sont notifiées
- ✅ Les recommandations ML arrivent au bon moment
- ✅ L'utilisateur garde le contrôle sur ce qui est important

