# 📖 Guide Utilisateur - Intégration Shopify pour StockEasy

Bienvenue dans le guide de configuration de l'intégration Shopify pour StockEasy. Ce connecteur vous permet de synchroniser automatiquement vos produits et vos ventes entre votre boutique Shopify et votre tableau de bord StockEasy.

---

## 1. Prérequis

Avant de commencer, assurez-vous d'avoir :
*   Un compte **Shopify** actif (Plan Basic ou supérieur).
*   Un compte **StockEasy** actif avec le rôle "Propriétaire" ou "Admin".
*   Vos identifiants de connexion pour les deux plateformes.

---

## 2. Installation de l'Application

L'application StockEasy Connector est une application "Custom" (privée) ou "Public" selon votre mode de distribution.

1.  Connectez-vous à votre admin Shopify (`votre-boutique.myshopify.com/admin`).
2.  Cliquez sur le lien d'installation fourni par l'équipe StockEasy.
3.  Une page d'autorisation apparaîtra listant les permissions requises :
    *   *Voir les produits* (Pour la synchronisation du catalogue).
    *   *Voir les commandes* (Pour les prévisions de ventes).
    *   *Voir et modifier l'inventaire* (Pour mettre à jour les stocks).
4.  Cliquez sur **Installer l'application**.

---

## 3. Configuration Initiale

Une fois l'application installée, elle doit être liée à votre compte StockEasy.

1.  L'équipe technique StockEasy effectuera le lien entre votre boutique Shopify et votre ID d'entreprise (`Company ID`) dans le système.
2.  **Vérification** : Créez un nouveau produit ou modifiez un produit existant sur Shopify.
3.  Connectez-vous à StockEasy et vérifiez que le produit apparaît ou se met à jour dans votre catalogue.

---

## 4. Fonctionnement Quotidien

### Synchronisation des Produits
*   **Sens** : Shopify -> StockEasy.
*   **Déclencheur** : Création ou mise à jour d'un produit sur Shopify.
*   **Action** : Le produit est créé ou mis à jour dans StockEasy.
*   **Note** : Le `SKU` est l'identifiant unique. Assurez-vous que tous vos produits Shopify ont un SKU renseigné.

### Synchronisation des Ventes
*   **Sens** : Shopify -> StockEasy.
*   **Déclencheur** : Nouvelle commande passée sur Shopify.
*   **Action** : 
    1.  La vente est enregistrée dans l'historique des ventes StockEasy.
    2.  Cette donnée alimente automatiquement les algorithmes de prévision de stock.

### Synchronisation des Stocks
*   **Sens** : Bidirectionnel (selon configuration).
*   **Déclencheur** : Mouvement de stock (Vente, Réception, Ajustement).
*   **Fréquence** : Quasi temps réel (quelques secondes de délai).

---

## 5. Résolution des Problèmes Courants

### "Je ne vois pas mes produits dans StockEasy"
1.  Vérifiez que le produit a bien un **SKU** sur Shopify. Les variantes sans SKU sont ignorées.
2.  Vérifiez que le produit est en statut **Actif**.
3.  Attendez quelques minutes. En cas de fort trafic, la synchronisation peut prendre un peu de retard.

### "Mes stocks ne se mettent pas à jour"
1.  Vérifiez que le suivi de stock est activé sur Shopify ("Suivre la quantité").
2.  Assurez-vous que le SKU correspond exactement entre les deux plateformes.

### Contact Support
Si le problème persiste, contactez le support StockEasy à : `support@stockeasy.com` en fournissant :
*   L'URL de votre boutique Shopify.
*   Le SKU du produit concerné.
*   Une description du problème.


