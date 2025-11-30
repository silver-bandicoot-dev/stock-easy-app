# Amélioration de la Scalabilité des Données

## Problème Identifié
L'application chargeait **toutes** les commandes historiques au démarrage via `get_all_data`.
- Ralentissement progressif du démarrage.
- Consommation mémoire excessive sur le client.
- Risque de dépassement des limites de taille de réponse JSON.
- **Régression de sécurité** potentielle identifiée dans la migration 049 (perte du filtre `company_id`).

## Solutions Mises en Place

### 1. Pagination Serveur pour l'Historique
**Fichier** : `src/components/history/HistoryTab.jsx`
- L'onglet Historique ne dépend plus de la liste globale `orders`.
- Il charge ses propres données via une nouvelle RPC `get_orders_paginated`.
- Supporte le filtrage (statut, fournisseur, dates) et la pagination (20 par page) côté serveur.
- L'export CSV charge dynamiquement toutes les données correspondantes (serveur) au lieu d'utiliser les données locales.

### 2. Optimisation de `get_all_data`
**Migration** : `supabase/migrations/060_optimize_get_all_data.sql`
- **Performance** : Ne charge plus que les commandes "Actives" (en cours) et les commandes terminées des 90 derniers jours.
- **Sécurité** : Restauration explicite du filtre `WHERE company_id = v_company_id` pour toutes les tables.

### 3. Nouvelle RPC `get_orders_paginated`
**Migration** : `supabase/migrations/059_add_pagination.sql`
- Retourne les commandes, le compte total, et les agrégats (KPIs) en une seule requête.
- Optimisé pour le filtrage multi-critères.

## Impact sur l'Expérience Utilisateur
- **Démarrage plus rapide** : Moins de données à transférer.
- **Historique illimité** : L'utilisateur peut naviguer dans des années d'historique sans ralentir l'application.
- **Cohérence** : Les KPIs de l'onglet Historique sont calculés sur l'ensemble des données serveur, pas seulement la page visible.

## Limitations Connues (Temporaires)
- L'onglet **Analytics** dépend encore des commandes chargées dans `orders`. Il ne verra que les 90 derniers jours d'historique pour l'instant.
- *Solution future* : Créer une RPC dédiée `get_analytics_data` pour charger les agrégats statistiques sur toute la période demandée.














