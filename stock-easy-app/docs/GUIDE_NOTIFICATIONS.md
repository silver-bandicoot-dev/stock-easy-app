# Guide d'utilisation - Système de notifications

## 🎯 Objectif

Ce guide explique comment utiliser le nouveau système de notifications ciblées de StockEasy.

---

## 💬 Notifications de mentions

### Comment mentionner un utilisateur

Dans les commentaires de commande, vous pouvez mentionner des collègues en utilisant le symbole `@` :

**Formats acceptés :**

```
@prenom.nom         → Jean Dupont (@jean.dupont)
@email@company.com  → marie@company.com
@prenom             → Si unique dans l'entreprise
```

**Exemples :**

```
"Salut @jean.dupont, peux-tu vérifier cette commande ?"
"CC @marie@company.com pour validation"
"@thomas et @sophie, regardez les quantités"
```

### Ce qui se passe quand vous mentionnez quelqu'un

1. ✉️ L'utilisateur reçoit une **notification instantanée**
2. 🔔 Une pastille apparaît sur l'icône de notification
3. 📱 Il peut cliquer pour être redirigé vers la commande concernée

### Quand utiliser les mentions

✅ **À utiliser pour :**
- Demander une validation
- Signaler un problème urgent
- Partager une information importante
- Déléguer une action

❌ **À éviter :**
- Spam de mentions pour des informations non urgentes
- Mentionner plusieurs personnes inutilement
- S'auto-mentionner (ne fonctionne pas)

---

## 🤖 Notifications Machine Learning

### Notification hebdomadaire (Lundi 9h)

**Quoi :** Chaque lundi matin à 9h, vous recevez une notification vous invitant à consulter les nouvelles analyses ML.

**Pourquoi :** Les prévisions de demande sont mises à jour régulièrement. Cette notification vous rappelle de consulter les recommandations pour optimiser vos commandes.

**Action recommandée :**
1. Cliquez sur la notification
2. Consultez les analyses ML
3. Vérifiez les recommandations de commande
4. Ajustez vos stratégies si nécessaire

**Exemple :**
```
🧠 Analyse ML hebdomadaire disponible
Une nouvelle analyse de prévision de demande est disponible 
(lundi 16 novembre). Consultez les recommandations pour 
optimiser vos commandes.
```

### Alertes critiques ML (Quotidien)

**Quoi :** Le système vérifie quotidiennement les prévisions ML et vous alerte **uniquement** sur les situations critiques nécessitant une action immédiate.

**Types d'alertes :**

#### 1. Rupture de stock prévue imminente
```
🚨 ML: Rupture de stock prévue dans 3 jours pour Produit X
Stock actuel: 50 unités. Demande prévue: 75 unités.
→ Action: Commander maintenant
```

#### 2. Délai de livraison critique
```
⚠️ ML: Commandez MAINTENANT Produit Y - Marge de sécurité faible
Rupture prévue dans 5j, délai fournisseur: 4j. Marge: 1j seulement.
→ Action: Commande urgente
```

#### 3. Hausse de demande significative
```
⚠️ ML: Forte hausse de demande prévue: +45% pour Produit Z
Demande actuelle: 10 → Prévision: 14.5 unités/jour
→ Action: Augmenter le stock
```

#### 4. Recommandations de commande groupées
```
🤖 ML recommande: Commander chez Fournisseur ABC
3 produits à commander URGENCE: Produit A, Produit B, Produit C. 
Coût estimé: 1250.50€. Rupture dans 3j
→ Action: Créer la commande
```

### Critères de déclenchement

Les notifications ML ne sont créées que si :

✅ **Confiance élevée** (>80%)
✅ **Sévérité critique ou haute**
✅ **Nécessite une action immédiate**

❌ Pas de notification pour :
- Prévisions de faible confiance
- Alertes de faible priorité
- Situations déjà gérées

---

## 🔔 Centre de notifications

### Accéder aux notifications

1. **Icône cloche** en haut à droite de l'application
2. **Pastille rouge** avec le nombre de notifications non lues
3. **Animation bleue** quand une nouvelle notification arrive

### Actions possibles

- 👁️ **Voir** : Cliquer sur une notification pour accéder à la ressource concernée
- ✅ **Marquer comme lu** : Automatique au clic
- 📋 **Marquer tout comme lu** : Bouton en haut du panneau
- 🗑️ **Supprimer** : Bouton sur chaque notification

### Filtrer les notifications

Dans le panneau de notifications, vous pouvez :
- Voir l'**icône** correspondant au type (💬 mention, 🚨 ML critique, 🧠 ML hebdo)
- Identifier le **moment** (il y a X min/heures/jours)
- Distinguer les **non lues** (fond bleu clair + point bleu)

---

## ⚙️ Configuration (Développeurs)

### Modifier la fréquence des notifications ML

Dans `StockEasy.jsx` :

```javascript
useMLWeeklyNotifications(products, forecasts, {
  enabled: true,
  weeklyDay: 1,    // Changer le jour (0=dimanche, 1=lundi, etc.)
  weeklyHour: 9,   // Changer l'heure (format 24h)
  criticalCheckInterval: 24 * 60 * 60 * 1000  // Intervalle de vérification
});
```

### Ajuster le seuil de confiance ML

Dans `mlNotificationsService.js` :

```javascript
// Modifier le seuil de confiance minimum
notifyMLCriticalAlerts(products, forecasts, 90); // 90% au lieu de 80%
```

### Désactiver temporairement

```javascript
useMLWeeklyNotifications(products, forecasts, {
  enabled: false  // Désactive toutes les notifications ML
});
```

---

## 🐛 Dépannage

### Je ne reçois pas de notifications de mention

**Vérifications :**
1. Vérifiez que le format de mention est correct (@prenom.nom)
2. Assurez-vous que l'utilisateur existe dans votre entreprise
3. Vous ne pouvez pas vous auto-mentionner

**Solution :**
- Testez avec `extractMentions()` dans la console
- Vérifiez les logs du navigateur pour les erreurs

### Je ne reçois pas de notifications ML

**Causes possibles :**
1. Le modèle ML n'est pas encore entraîné
2. Aucune alerte critique détectée
3. Les prévisions ont une confiance <80%

**Solution :**
- Vérifiez que vous avez des données de ventes
- Consultez la page ML pour voir l'état du modèle
- Attendez le lundi 9h pour la notification hebdomadaire

### Les notifications se multiplient

**Note :** Ce problème a été corrigé. Les notifications ne se déclenchent plus au chargement de l'application.

Si le problème persiste :
- Videz le cache du navigateur
- Vérifiez que `useAutoNotifications` a `enabled: false`

---

## 📊 Statistiques et analytics

### Consulter l'historique

Toutes les notifications sont stockées dans Supabase et restent accessibles via :
- Le panneau de notifications (scroll pour voir l'historique)
- Le bouton "Voir toutes les notifications" en bas du panneau

### Supprimer l'historique

Les notifications peuvent être supprimées individuellement ou en masse :
- Bouton "Supprimer" sur chaque notification
- Les notifications lues disparaissent automatiquement après 7 jours (configurable)

---

## ✨ Bonnes pratiques

### Pour les mentions
1. 🎯 Mentionnez uniquement les personnes concernées
2. 📝 Ajoutez du contexte dans votre commentaire
3. ⚡ Utilisez les mentions pour les actions urgentes
4. 🤝 Mentionnez plusieurs personnes si nécessaire

### Pour les notifications ML
1. 📅 Consultez le rapport hebdomadaire chaque lundi
2. 🚨 Agissez rapidement sur les alertes critiques
3. 📈 Suivez les tendances pour anticiper
4. 🔄 Ajustez vos stratégies en fonction des recommandations

---

## 🎓 Ressources

- [Documentation technique](./NOUVEAU_SYSTEME_NOTIFICATIONS.md)
- [Tests manuels](../src/test/testNotifications.js)
- [Service de mentions](../src/services/mentionNotificationsService.js)
- [Service ML](../src/services/mlNotificationsService.js)

