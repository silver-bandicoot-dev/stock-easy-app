# 📝 Documentation Review App Store

Ce document est destiné à l'équipe de révision de l'App Store Shopify. Il résume les fonctionnalités, l'architecture de sécurité et les instructions de test pour l'application "StockEasy Connector".

---

## 1. Description de l'Application

**Nom**: StockEasy Sync
**Type**: Application de gestion d'inventaire et prévisions.

**Description**:
StockEasy Sync connecte la boutique Shopify du marchand à la plateforme de gestion de stock StockEasy. Elle synchronise automatiquement le catalogue produits, les niveaux de stock et l'historique des ventes pour alimenter des algorithmes de prévision de demande basés sur l'IA.

**Valeur Ajoutée**:
*   Évite les ruptures de stock grâce à des prévisions précises.
*   Centralise la gestion des stocks pour les marchands.
*   Automatise la saisie des données de vente.

---

## 2. Architecture & Sécurité

### Flux de Données
L'application fonctionne en arrière-plan (Headless) et utilise exclusivement les Webhooks pour la synchronisation de données. Aucune donnée client sensible (PII) n'est stockée de manière permanente dans le connecteur, elles ne font que transiter vers la base de données sécurisée du marchand (Supabase).

### Sécurité
*   **Validation Webhook**: Tous les webhooks entrants sont validés via signature HMAC SHA-256.
*   **Chiffrement**: Les tokens d'accès Shopify sont chiffrés au repos (AES-256).
*   **Isolation**: Chaque boutique est liée à un `Company ID` unique, assurant une isolation stricte des données (Multi-tenant).

### Conformité RGPD/CCPA
L'application implémente les endpoints de conformité obligatoires :
*   `customers/data_request`: Fournit les données stockées sur demande.
*   `customers/redact`: Supprime les données client sur demande.
*   `shop/redact`: Supprime toutes les données de la boutique lors de la désinstallation.

---

## 3. Scopes Demandés

L'application requiert les scopes suivants pour fonctionner :

| Scope | Justification |
|-------|---------------|
| `read_products` | Nécessaire pour synchroniser le catalogue produits initial et les mises à jour. |
| `read_inventory` | Nécessaire pour lire les niveaux de stock actuels. |
| `write_inventory` | Nécessaire pour mettre à jour le stock Shopify depuis StockEasy (si activé). |
| `read_orders` | Nécessaire pour récupérer l'historique des ventes et alimenter les algorithmes de prévision. |

---

## 4. Instructions de Test

### Configuration de l'Environnement de Test
1.  Installer l'application sur une boutique de développement.
2.  L'application backend confirmera l'installation et liera la boutique à un compte de test StockEasy.

### Scénario 1 : Synchronisation Produit
1.  Créez un produit sur Shopify avec un SKU unique (ex: `TEST-1`).
2.  Vérifiez que le produit apparaît dans la base de données StockEasy liée.

### Scénario 2 : Synchronisation Commande
1.  Passez une commande test sur Shopify pour le produit `TEST-1`.
2.  Vérifiez que la vente est enregistrée dans l'historique des ventes StockEasy.

### Scénario 3 : Désinstallation
1.  Supprimez l'application de la boutique.
2.  Le webhook `app/uninstalled` désactivera le compte et nettoiera les tokens d'accès.

---

## 5. Contact Support

**Email**: support@stockeasy.com
**Documentation**: https://stockeasy.com/docs/shopify


