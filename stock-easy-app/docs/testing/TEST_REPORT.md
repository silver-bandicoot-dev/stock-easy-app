# 📑 Rapport de Tests - Stock Easy (Supabase)

**Mise à jour** : Novembre 2025

---

## 🎯 Objectifs des tests

- Vérifier la connexion Supabase (auth + RPC + policies RLS).
- Garantir l'affichage du tableau de bord lorsque les données sont présentes.
- Couvrir les scénarios critiques : gestion des commandes, synchronisation des stocks, alertes ML.

---

## ✅ Résumé des campagnes

| Campagne | Date | Couverture | Statut |
|----------|------|------------|--------|
| Tests automatisés (Vitest) | 12/11/2025 | 68 % statements | ✅ OK |
| Tests manuels dashboard | 12/11/2025 | Flux principal | ✅ OK |
| Tests API Supabase (RPC) | 12/11/2025 | `get_all_data`, `update_order_status` | 🟠 À renforcer |

---

## 🔁 Tests automatisés

```bash
npm run test
npm run test:coverage
```

Points d'attention :

- Ajouter des tests sur `services/supabaseApiService.js` (mock `createClient`).
- Couvrir les hooks critiques (`useOrderManagement`, `useKpiSnapshots`).

---

## 🧪 Tests manuels essentiels

1. **Connexion utilisateur**
   - Se connecter via Supabase Auth.
   - Vérifier la récupération du `company_id` et la redirection vers `/dashboard`.

2. **Chargement des données**
   - Vérifier l'appel RPC `get_all_data`.
   - Contrôler le format camelCase côté frontend.

3. **Mise à jour d'un paramètre**
   - Modifier `SeuilSurstockProfond`.
   - S'assurer que la RPC `update_parameter` renvoie un succès et que la valeur se met à jour.

4. **Réception d'une commande**
   - Appeler `update_order_status` avec `received_at`.
   - Vérifier l'insertion des données de réconciliation.

5. **KPIs**
   - Enregistrer un snapshot via `save_kpi_snapshot`.
   - Vérifier que la table `kpi_snapshots` contient bien la nouvelle ligne (via Supabase Studio).

---

## 🚨 Bugs ouverts

- **Manque de tests sur les Edge Functions (si présentes)**
  - Action : ajouter des tests d'intégration via `supabase functions invoke`.

- **Erreurs silencieuses sur les RPC**
  - Action : instrumenter les catch avec tracking (Sentry/Logflare) pour mieux diagnostiquer.

---

## 📝 À faire

- [ ] Ajouter des fixtures supabase pour les tests e2e.
- [ ] Simuler un échec de policy RLS (utilisateur d'une autre entreprise).
- [ ] Vérifier les délais de timeouts sur les appels RPC (30s actuellement).

---

Ce rapport remplace les anciens tests liés au backend historique. Toute nouvelle fonctionnalité Supabase (webhooks Shopify, Edge Functions) doit être couverte par des scénarios dédiés.

