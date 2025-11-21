# 🧭 Plan d'Action Exécutable - Stock Easy (Supabase)

**Date** : Novembre 2025  
**Portée** : Mise en production d'une application multi-tenant Supabase + préparation intégration Shopify.

---

## 1. Préparer l'environnement

1. Cloner le dépôt et installer les dépendances :
   ```bash
   npm install
   ```
2. Copier l'exemple d'environnement :
   ```bash
   cp .env.example .env.local
   ```
3. Renseigner les variables :
   ```env
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon>
   SUPABASE_SERVICE_ROLE_KEY=<service-role> # uniquement pour scripts/edge
   ```
4. Vérifier la connexion :
   ```bash
   node scripts/check-supabase.mjs
   ```

---

## 2. Déployer Supabase

1. Appliquer les migrations :
   ```bash
   supabase db push
   ```
2. Vérifier les policies RLS :
   ```sql
   select schemaname, tablename, policyname
   from pg_policies
   where schemaname = 'public';
   ```
3. Configurer le bucket `avatars` (public lecture, upload limité).
4. Activer les backups quotidiens (Supabase Dashboard > Backups).

---

## 3. Vérifier les services frontend

- Tester `npm run dev`, puis naviguer sur `/dashboard` et `/profile`.
- Confirmer que `supabaseApiService.js` renvoie bien des données (console log).
- Lancer les tests :
  ```bash
  npm run test
  npm run lint
  ```

---

## 4. Préparer l'intégration Shopify

1. Créer une table `shopify_shops` :
   ```sql
   create table public.shopify_shops (
     id uuid primary key default gen_random_uuid(),
     company_id uuid not null references public.companies(id),
     shop_domain text not null unique,
     access_token text not null,
     scope text[] not null,
     installed_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   ```
2. Mettre en place une Edge Function `shopify-auth` pour l'OAuth.
3. Stocker le token chiffré (`pgp_sym_encrypt`) avec une clé KMS/Hashicorp.
4. Préparer les webhooks (app/uninstalled, orders/create, inventory_levels/update).

---

## 5. Pipeline CI/CD

1. Ajouter un job GitHub Actions (ou Vercel Git) :
   ```yaml
   - run: npm ci
   - run: npm run test
   - run: npm run lint
   ```
2. Ajouter un script `scripts/check-env.mjs` qui s'assure de la présence des clés Supabase.
3. Bloquer le déploiement si les tests échouent.

---

## 6. Contrôles post-déploiement

- Vérifier que les nouvelles entreprises créées ont un `company_id` unique.
- Confirmer que les policies RLS bloquent l'accès inter-entreprises.
- Lancer une synchronisation manuelle (future Shopify → Supabase).
- Surveiller les logs via Supabase Studio et Vercel (`vercel logs`).

---

## 7. Étapes suivantes (Shopify)

- Implémenter l'Edge Function `shopify-webhook`.
- Créer un service `shopifySyncService.js` côté frontend pour suivre l'état de synchronisation.
- Ajouter une page `/integrations` permettant :
  - l'installation de l'app Shopify,
  - la visualisation de l'état (connecté, token expiré, resync manuel),
  - la consultation des erreurs.

---

## 8. Checklist finale

- [ ] Variables Supabase configurées.
- [ ] Migrations appliquées sans erreur.
- [ ] Tests unitaires et linting verts.
- [ ] Politique RLS validée pour un utilisateur externe.
- [ ] Documentation mise à jour (README, SECURITY, TEST_REPORT).
- [ ] Plan Shopify partagé avec l'équipe produit.

---

Ce plan remplace toutes les procédures historiques liées à l'ancien backend externe. Toute modification future doit être validée avec l'équipe backend Supabase.

