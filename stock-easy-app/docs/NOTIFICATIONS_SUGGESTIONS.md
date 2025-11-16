# 🔔 Suggestions de Notifications Supplémentaires

Ce document liste des suggestions de types de notifications supplémentaires qui pourraient être utiles pour l'application Stock Easy.

## ✅ Notifications Déjà Implémentées

1. **`mention`** 💬 - Mention dans un commentaire
2. **`stock_alert`** 🚨 - Alertes de stock (rupture, bientôt en rupture)
3. **`unmapped_product`** 📦 - Produits sans fournisseur assigné
4. **`weekly_report`** 📊 - Rapport hebdomadaire

---

## 💡 Suggestions de Notifications Supplémentaires

### 📦 Commandes

#### 1. **`order_confirmed`** ✅
- **Déclencheur** : Quand une commande est confirmée par le fournisseur
- **Message** : "Commande PO-123 confirmée par [Fournisseur]"
- **Lien** : `/track?order=PO-123`
- **Utilité** : Informer l'utilisateur que sa commande a été acceptée

#### 2. **`order_shipped`** 🚚
- **Déclencheur** : Quand une commande est expédiée
- **Message** : "Commande PO-123 expédiée - Numéro de suivi: [tracking]"
- **Lien** : `/track?order=PO-123`
- **Utilité** : Alerter que la commande est en route

#### 3. **`order_delayed`** ⏰
- **Déclencheur** : Quand une commande dépasse la date d'arrivée estimée
- **Message** : "Commande PO-123 en retard - ÉTA dépassée de X jours"
- **Lien** : `/track?order=PO-123`
- **Utilité** : Alerter sur les retards de livraison

#### 4. **`order_received`** 📬
- **Déclencheur** : Quand une commande arrive à l'entrepôt
- **Message** : "Commande PO-123 reçue - En attente de validation"
- **Lien** : `/track?order=PO-123&section=received`
- **Utilité** : Rappeler de valider la réception

#### 5. **`order_discrepancy`** ⚠️
- **Déclencheur** : Quand une commande a des écarts (manquants, endommagés)
- **Message** : "Commande PO-123 : X articles manquants/endommagés détectés"
- **Lien** : `/track?order=PO-123&section=reconciliation`
- **Utilité** : Alerter sur les problèmes de réception

---

### 📊 Analytics & Performance

#### 6. **`low_performance_product`** 📉
- **Déclencheur** : Quand un produit a des ventes très faibles ou nulles depuis X jours
- **Message** : "[Produit] : Aucune vente depuis 30 jours - Considérer la désactivation"
- **Lien** : `/stock?sku=SKU-123`
- **Utilité** : Identifier les produits à désactiver

#### 7. **`high_performance_product`** 📈
- **Déclencheur** : Quand un produit a une forte croissance de ventes
- **Message** : "[Produit] : +X% de ventes cette semaine - Augmenter le stock ?"
- **Lien** : `/analytics?product=SKU-123`
- **Utilité** : Suggérer d'augmenter le stock pour les produits performants

#### 8. **`surstock_alert`** 📦
- **Déclencheur** : Quand un produit est en surstock profond (dépasse le seuil configuré)
- **Message** : "[Produit] : Surstock détecté - X jours d'autonomie (seuil: Y jours)"
- **Lien** : `/stock?filter=overstock`
- **Utilité** : Alerter sur les surstocks qui immobilisent du capital

---

### 🔧 Configuration & Paramètres

#### 9. **`missing_supplier_info`** ⚠️
- **Déclencheur** : Quand un fournisseur a des informations manquantes (email, délai, MOQ)
- **Message** : "Fournisseur [Nom] : Informations incomplètes (email/délai/MOQ manquant)"
- **Lien** : `/settings?tab=suppliers`
- **Utilité** : Compléter les données fournisseurs

#### 10. **`missing_product_data`** 📝
- **Déclencheur** : Quand un produit a des données manquantes (prix, SKU, nom)
- **Message** : "[Produit] : Données incomplètes (prix/SKU/nom manquant)"
- **Lien** : `/stock?sku=SKU-123`
- **Utilité** : Compléter les données produits

#### 11. **`parameter_change`** ⚙️
- **Déclencheur** : Quand un paramètre critique est modifié (seuil surstock, multiplicateur)
- **Message** : "Paramètre '[Nom]' modifié de X à Y"
- **Lien** : `/settings?tab=parameters`
- **Utilité** : Traçabilité des changements de configuration

---

### 💰 Financier

#### 12. **`budget_threshold`** 💵
- **Déclencheur** : Quand le budget alloué aux commandes approche ou dépasse un seuil
- **Message** : "Budget mensuel : X€ / Y€ utilisé (Z%)"
- **Lien** : `/analytics?tab=financial`
- **Utilité** : Contrôle budgétaire

#### 13. **`low_margin_product`** 💸
- **Déclencheur** : Quand un produit a une marge très faible ou négative
- **Message** : "[Produit] : Marge faible (X%) - Revoir les prix ?"
- **Lien** : `/stock?sku=SKU-123`
- **Utilité** : Optimiser la rentabilité

---

### 🤖 Intelligence Artificielle / ML

#### 14. **`ml_prediction_anomaly`** 🤖
- **Déclencheur** : Quand les prévisions ML détectent une anomalie (pic inattendu, chute)
- **Message** : "Anomalie détectée : [Produit] - Prévision différente de l'historique"
- **Lien** : `/ai?product=SKU-123`
- **Utilité** : Alerter sur les prévisions inhabituelles

#### 15. **`ml_model_retraining`** 🔄
- **Déclencheur** : Quand le modèle ML doit être réentraîné (après X jours)
- **Message** : "Modèle ML : Réentraînement recommandé pour améliorer les prévisions"
- **Lien** : `/ai?tab=settings`
- **Utilité** : Maintenir la qualité des prévisions

---

### 👥 Collaboration

#### 16. **`team_activity`** 👥
- **Déclencheur** : Quand un membre de l'équipe effectue une action importante (commande, validation)
- **Message** : "[Utilisateur] a [action] sur [ressource]"
- **Lien** : Selon l'action
- **Utilité** : Transparence et collaboration d'équipe

#### 17. **`comment_reply`** 💬
- **Déclencheur** : Quand quelqu'un répond à un commentaire où vous avez participé
- **Message** : "[Utilisateur] a répondu à votre commentaire sur PO-123"
- **Lien** : `/track?order=PO-123`
- **Utilité** : Suivre les conversations

---

### 🔔 Système & Maintenance

#### 18. **`system_update`** 🔄
- **Déclencheur** : Quand une mise à jour système est disponible
- **Message** : "Nouvelle version disponible - Nouvelles fonctionnalités : [liste]"
- **Lien** : `/settings?tab=about`
- **Utilité** : Informer sur les mises à jour

#### 19. **`backup_reminder`** 💾
- **Déclencheur** : Rappel périodique de sauvegarder les données
- **Message** : "Pensez à exporter vos données - Dernière exportation il y a X jours"
- **Lien** : `/settings?tab=export`
- **Utilité** : Sécurité des données

#### 20. **`integration_error`** ⚠️
- **Déclencheur** : Quand une intégration externe (API, webhook) échoue
- **Message** : "Erreur d'intégration [Nom] - Vérifier la configuration"
- **Lien** : `/settings?tab=integrations`
- **Utilité** : Maintenir les intégrations fonctionnelles

---

## 🎯 Priorisation Recommandée

### Priorité Haute (Impact Business Élevé)
1. ✅ `stock_alert` - **DÉJÀ IMPLÉMENTÉ**
2. ✅ `unmapped_product` - **DÉJÀ IMPLÉMENTÉ**
3. `order_delayed` - Retards critiques pour la continuité
4. `order_discrepancy` - Problèmes de réception
5. `surstock_alert` - Optimisation du capital

### Priorité Moyenne (Amélioration Opérationnelle)
6. `order_shipped` - Suivi des commandes
7. `order_received` - Validation des réceptions
8. `low_performance_product` - Optimisation du catalogue
9. `missing_supplier_info` - Qualité des données
10. `ml_prediction_anomaly` - Qualité des prévisions

### Priorité Basse (Nice to Have)
11. `order_confirmed` - Information moins critique
12. `high_performance_product` - Opportunités
13. `budget_threshold` - Contrôle financier
14. `team_activity` - Transparence
15. `system_update` - Information générale

---

## 📝 Notes d'Implémentation

### Pour Ajouter une Nouvelle Notification

1. **Ajouter le type dans les composants** :
   - `NotificationBell.jsx` - Fonction `getNotificationIcon()`
   - `NotificationsPage.jsx` - Fonction `getNotificationIcon()`

2. **Créer la fonction de vérification** dans `autoNotificationsService.js` :
   ```javascript
   export async function notifyNewType(userIds, data) {
     // Logique de vérification
     // Création des notifications
   }
   ```

3. **Ajouter au hook** `useAutoNotifications.js` si c'est une vérification périodique

4. **Déclencher la notification** :
   - Automatiquement (hook, trigger, cron)
   - Manuellement (action utilisateur)
   - Événement (changement de statut)

### Exemple d'Implémentation

```javascript
// Dans autoNotificationsService.js
export async function notifyOrderDelayed(userIds, orders) {
  const now = new Date();
  const delayed = orders.filter(order => {
    if (!order.eta) return false;
    const eta = new Date(order.eta);
    return eta < now && ['preparing', 'in_transit'].includes(order.status);
  });

  if (delayed.length === 0) return { count: 0 };

  for (const order of delayed) {
    const daysLate = Math.floor((now - new Date(order.eta)) / (1000 * 60 * 60 * 24));
    
    await createNotificationsForUsers(
      userIds,
      'order_delayed',
      `⏰ Commande ${order.id} en retard`,
      `La commande ${order.id} est en retard de ${daysLate} jour(s)`,
      `/track?order=${order.id}`,
      { orderId: order.id, daysLate }
    );
  }

  return { count: delayed.length };
}
```

---

## 🔄 Fréquence Recommandée des Vérifications

| Type de Notification | Fréquence | Moment |
|---------------------|-----------|--------|
| `stock_alert` | 1 heure | Continu |
| `unmapped_product` | 6 heures | Continu |
| `weekly_report` | 1 fois/semaine | Lundi 9h |
| `order_delayed` | 1 fois/jour | Matin |
| `order_received` | Temps réel | Événement |
| `surstock_alert` | 1 fois/jour | Matin |
| `low_performance_product` | 1 fois/semaine | Lundi |
| `ml_prediction_anomaly` | Temps réel | Événement |

---

**Date de création** : 2025-01-XX  
**Version** : 1.0.0  
**Statut** : 📋 Suggestions - À implémenter selon les besoins


