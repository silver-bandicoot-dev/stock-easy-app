# 💬 Documentation du Système de Commentaires

## 📋 Vue d'ensemble

Le système de commentaires permet aux utilisateurs de collaborer et communiquer sur les Purchase Orders en temps réel.

---

## ✨ Fonctionnalités

### 1️⃣ **Affichage des commentaires en temps réel**
- ✅ Mise à jour automatique via Firestore `onSnapshot`
- ✅ Ordre chronologique (du plus ancien au plus récent)
- ✅ Scroll automatique pour les longs fils de discussion

### 2️⃣ **Mentions @username**
- ✅ Tapez `@` pour voir la liste des membres de l'équipe
- ✅ Sélectionnez un collègue dans la liste déroulante
- ✅ La mention est mise en surbrillance en bleu
- ✅ Notification automatique envoyée à l'utilisateur mentionné

### 3️⃣ **Suppression de commentaires**
- ✅ Icône 🗑️ (corbeille) visible uniquement pour l'auteur
- ✅ Confirmation avant suppression
- ✅ Suppression instantanée de Firestore

### 4️⃣ **Édition de commentaires**
- ✅ Icône ✏️ (crayon) visible uniquement pour l'auteur
- ✅ Mode édition en ligne avec textarea
- ✅ Boutons "Annuler" et "Sauvegarder"
- ✅ Badge "(modifié)" affiché après édition

### 5️⃣ **Timestamps relatifs**
- ✅ "À l'instant" (< 1 minute)
- ✅ "Il y a X min" (< 1 heure)
- ✅ "Il y a X h" (< 24 heures)
- ✅ "Il y a X j" (< 7 jours)
- ✅ Date complète (> 7 jours) : "19/10/2025, 19:30"

### 6️⃣ **Interface utilisateur**
- ✅ Design cohérent avec le reste de l'application
- ✅ Avatars des utilisateurs
- ✅ Animations douces (hover effects)
- ✅ Responsive et accessible

---

## 🗂️ Structure Firestore

### Collection : `purchaseOrderComments`

```javascript
{
  purchaseOrderId: "PO-009",           // ID du Purchase Order
  purchaseOrderNumber: "PO-009",       // Numéro du PO (pour référence)
  content: "Texte du commentaire",     // Contenu du commentaire
  authorId: "abc123",                  // ID de l'auteur
  authorName: "John Doe",              // Nom complet de l'auteur
  authorEmail: "john@example.com",     // Email de l'auteur
  authorPhoto: "https://...",          // URL de la photo de profil
  mentions: ["userId1", "userId2"],    // IDs des utilisateurs mentionnés
  companyId: "company123",             // ID de l'entreprise
  createdAt: Timestamp,                // Date de création
  isEdited: false,                     // Indique si édité
  editedAt: Timestamp                  // Date de la dernière édition (optionnel)
}
```

### Collection : `notifications`

Créée automatiquement lors d'une mention :

```javascript
{
  recipientId: "userId1",              // ID du destinataire
  type: "mention",                     // Type de notification
  content: "John Doe vous a mentionné dans PO-009",
  link: "/purchase-orders/PO-009",     // Lien vers le PO
  relatedPOId: "PO-009",              // ID du PO lié
  isRead: false,                       // Statut de lecture
  createdAt: Timestamp                 // Date de création
}
```

---

## 🔍 Index Firestore requis

### Index composite sur `purchaseOrderComments`

**Champs indexés :**
- `purchaseOrderId` (Ascending)
- `createdAt` (Ascending)

**Pourquoi ?** Pour permettre les requêtes filtrées et triées en temps réel.

**Création :**
1. Aller sur Firebase Console > Firestore > Indexes
2. Créer un index composite avec ces deux champs
3. Attendre 2-3 minutes pour l'activation

---

## 🎨 Utilisation

### Dans l'application :

1. **Naviguer vers un Purchase Order**
   - Aller dans "Suivi"
   - Cliquer sur un Purchase Order pour l'ouvrir
   - Scroller vers le bas

2. **Ajouter un commentaire**
   - Tapez votre message dans le champ de texte
   - (Optionnel) Tapez `@` pour mentionner un collègue
   - Cliquez sur "Envoyer"
   - Le commentaire apparaît instantanément

3. **Modifier un commentaire**
   - Cliquez sur l'icône ✏️ (visible seulement sur vos commentaires)
   - Modifiez le texte
   - Cliquez sur "Sauvegarder" ou "Annuler"

4. **Supprimer un commentaire**
   - Cliquez sur l'icône 🗑️ (visible seulement sur vos commentaires)
   - Confirmez la suppression

---

## 📱 Intégration

### Fichiers modifiés :

1. **`/src/StockEasy.jsx`**
   - Import du composant `CommentSection`
   - Ajout dans 5 sections de statut de PO

2. **`/src/components/comments/CommentSection.jsx`**
   - Composant principal des commentaires

3. **`/src/components/comments/index.js`**
   - Export du composant

4. **`/src/index.css`**
   - Styles pour `react-mentions`

5. **`/src/components/profile/UserProfile.jsx`**
   - Fonction `ensureUserHasCompany` pour garantir que tous les utilisateurs ont un `companyId`

### Dépendances ajoutées :

```json
{
  "react-mentions": "^4.4.10"
}
```

---

## 🔧 Maintenance

### Ajouter de nouveaux champs :

Pour ajouter des informations supplémentaires aux commentaires, modifiez la fonction `handleAddComment` dans `CommentSection.jsx` :

```javascript
await addDoc(collection(db, 'purchaseOrderComments'), {
  // ... champs existants
  nouveauChamp: valeur,  // ← Ajoutez ici
});
```

### Modifier le design :

Les classes Tailwind utilisent la palette de couleurs de l'app :
- `#191919` - Noir principal
- `#666663` - Gris texte
- `#FAFAF7` - Fond clair
- `#E5E4DF` - Bordures
- `#EF1C43` - Rouge (danger)

---

## 🐛 Troubleshooting

### Les commentaires ne s'affichent pas ?

1. Vérifiez que l'index Firestore est créé et activé
2. Vérifiez la console pour les erreurs
3. Vérifiez que `purchaseOrderId` est bien passé au composant

### Les mentions ne fonctionnent pas ?

1. Vérifiez que `userData.companyId` existe
2. Vérifiez la collection `users` dans Firestore
3. Les utilisateurs doivent avoir `firstName`, `lastName` et `companyId`

### Le temps réel ne fonctionne pas ?

1. Vérifiez les règles de sécurité Firestore
2. Vérifiez que l'index est activé
3. Rechargez complètement la page (Ctrl+Shift+R ou Cmd+Shift+R)

---

## 🚀 Améliorations futures possibles

- 📎 Joindre des fichiers/images aux commentaires
- 👍 Système de réactions (👍 ❤️ 😄)
- 🔔 Centre de notifications dans l'app
- 📧 Notifications par email
- 🔍 Recherche dans les commentaires
- 📊 Statistiques de collaboration
- 🏷️ Tags/catégories de commentaires
- 🔐 Commentaires privés vs publics
- 💾 Historique des versions (éditions)

---

## 📞 Support

Pour toute question ou problème, consultez les logs de la console du navigateur (F12).

---

**Dernière mise à jour : 19 octobre 2025**

