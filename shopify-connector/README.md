# StockEasy Shopify Connector 🚀

Connecteur backend officiel entre **Shopify** et **StockEasy**.
Cette application synchronise automatiquement les produits, les stocks et les commandes pour alimenter le moteur de prévision IA de StockEasy.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

---

## 📚 Documentation

Toute la documentation détaillée se trouve dans le dossier `docs/` :

*   [📘 Guide Technique](docs/TECHNICAL_GUIDE.md) : Architecture et code pour les développeurs.
*   [📖 Guide Utilisateur](docs/USER_GUIDE.md) : Installation et utilisation pour les marchands.
*   [🔌 API Reference](docs/API_REFERENCE.md) : Endpoints et webhooks.
*   [📝 App Store Review](docs/APP_STORE_REVIEW.md) : Informations pour la révision Shopify.

---

## 🏗 Architecture

*   **Runtime**: Node.js / Express
*   **Queue System**: BullMQ (Redis)
*   **Database**: PostgreSQL (Prisma) & Supabase
*   **Security**: HMAC Validation & Encryption

## 🚀 Démarrage Rapide (Dev)

### Prérequis
*   Node.js 18+
*   Redis
*   PostgreSQL
*   Compte Shopify Partner

### Installation

1.  **Cloner et installer**
    ```bash
    git clone https://github.com/your-org/stockeasy-shopify-connector.git
    cd shopify-connector
    npm install
    ```

2.  **Configuration**
    Copier `.env.example` vers `.env` et remplir les variables :
    ```bash
    SHOPIFY_API_KEY=...
    SHOPIFY_API_SECRET=...
    DATABASE_URL=...
    REDIS_URL=...
    SUPABASE_URL=...
    SUPABASE_SERVICE_ROLE_KEY=...
    ```

3.  **Base de données**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  **Lancer le serveur**
    ```bash
    npm run dev
    ```

## 🧪 Tests

Le projet inclut une suite de tests complète (Unitaires, Intégration, E2E).

```bash
npm test
```

## 🤝 Contribution

1.  Fork le projet
2.  Créer une branche (`git checkout -b feature/amazing-feature`)
3.  Commit les changements (`git commit -m 'Add amazing feature'`)
4.  Push vers la branche (`git push origin feature/amazing-feature`)
5.  Ouvrir une Pull Request

---

## 📞 Support

Pour toute question technique, contacter l'équipe de développement StockEasy.
Pour le support marchand, voir `docs/USER_GUIDE.md`.
