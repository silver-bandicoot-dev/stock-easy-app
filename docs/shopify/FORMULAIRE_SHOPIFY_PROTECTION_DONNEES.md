# 📋 Formulaire Shopify - Informations relatives à la protection des données

**Application** : StockEasy Sync  
**Date** : 22 novembre 2025

---

## ✅ Réponses au Formulaire

### **OBJET**

#### Traitez-vous les données personnelles minimales requises pour apporter de la valeur aux marchands ?
**☑️ OUI**

#### Informez-vous les marchands des données personnelles que vous traitez et des fins de ce traitement ?
**☑️ OUI**

#### Limitez-vous l'utilisation des données personnelles à ces fins ?
**☑️ OUI**

---

### **CONSENTEMENT**

#### Avez-vous conclu des accords de confidentialité et de protection des données avec vos marchands ?
**☑️ OUI**

#### Respectez-vous et appliquez-vous les décisions de consentement des client(e)s ?
**☑️ OUI**

#### Respectez-vous et appliquez-vous les décisions des client(e)s de refuser la vente de leurs données ?
**☑️ OUI**

#### Si vous utilisez des données personnelles pour la prise de décision automatisée et que ces décisions peuvent avoir des conséquences juridiques ou des répercussions importantes, la clientèle est-elle en mesure de refuser ?
**☑️ SANS OBJET**

---

### **STOCKAGE**

#### Avez-vous configuré des durées de rétention, qui garantissent que les données personnelles ne sont pas conservées plus longtemps que nécessaire ?
**☑️ OUI**

#### Chiffrez-vous les données au repos et en transit ?
**☑️ OUI**

---

## 📝 Justifications Rapides

### Minimisation des données
Nous collectons uniquement : SKU, prix, quantités en stock, numéros de commande, domaine Shopify.  
Nous NE collectons PAS : cartes bancaires, mots de passe, adresses complètes, données sensibles.

### Information des marchands
- Politique de confidentialité publique : `/privacy`
- Conditions d'utilisation : `/terms`
- Documentation complète dans l'application

### Limitation des finalités
Utilisation UNIQUEMENT pour :
- Synchronisation d'inventaire
- Suivi des ventes
- Prévisions de demande
- Support technique

Utilisation INTERDITE pour :
- Vente à des tiers
- Publicité ciblée
- Marketing direct
- Profilage comportemental

### Accords de confidentialité
- Conditions d'utilisation acceptées à l'installation
- Data Processing Agreement (DPA) conforme Article 28 RGPD
- Clauses contractuelles types UE pour transferts internationaux

### Respect du consentement
- Information claire avant installation
- Droit de retrait (désinstallation)
- Webhooks GDPR implémentés (`customers/data_request`, `customers/redact`, `shop/redact`)

### Refus de vente
Engagement contractuel explicite : "Nous n'utilisons JAMAIS vos données pour vendre ou louer à des tiers"
- Aucune intégration avec data brokers
- Aucune API publique exposant les données
- Isolation stricte multi-tenant

### Décision automatisée
SANS OBJET : Les prévisions ML sont des recommandations (non contraignantes).  
Aucune décision automatique avec conséquence juridique (crédit, emploi, etc.)

### Durées de rétention
- Tokens OAuth : Supprimés 48h après désinstallation
- Logs de synchronisation : 90 jours maximum
- Mappings produits : Supprimés à la désinstallation
- Conformité webhook `shop/redact` Shopify

### Chiffrement
**En transit :**
- HTTPS/TLS 1.3 obligatoire
- Webhooks Shopify : TLS 1.2+
- Headers HSTS activés

**Au repos :**
- Tokens OAuth : AES-256-GCM avec IV unique
- Base de données : PostgreSQL TDE (Supabase)
- Clés stockées en variables d'environnement sécurisées

---

## 🔗 URLs Importantes

- **Politique de confidentialité** : `https://[votre-domaine]/privacy`
- **Conditions d'utilisation** : `https://[votre-domaine]/terms`
- **Webhook GDPR - Data Request** : `https://[votre-domaine]/webhooks/compliance/customers/data_request`
- **Webhook GDPR - Customer Redact** : `https://[votre-domaine]/webhooks/compliance/customers/redact`
- **Webhook GDPR - Shop Redact** : `https://[votre-domaine]/webhooks/compliance/shop/redact`

---

## ✅ Conformité

Notre application respecte :
- ✅ RGPD (Union Européenne)
- ✅ CCPA (Californie)
- ✅ Shopify App Store Requirements
- ✅ SOC 2 Type II (via Supabase)

---

## 📞 Contact DPO

**Email** : dpo@stockeasy.com  
**Support** : support@stockeasy.com  
**Documentation** : https://stockeasy.app/privacy

---

**Prêt pour soumission App Store** ✅


