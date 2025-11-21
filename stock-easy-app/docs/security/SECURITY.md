# 🔒 Guide de Sécurité - Stock Easy App

**Dernière mise à jour** : Novembre 2025

---

## 📊 Vue d'ensemble

Stock Easy repose désormais entièrement sur Supabase pour l'authentification, la base de données Postgres et les fonctions RPC. Le frontend React/Vite est déployé sur Vercel.

---

## ✅ Protections Actives

| Mesure | Statut | Détails |
|--------|--------|---------|
| HTTPS/SSL | ✅ | Certificats gérés automatiquement par Vercel |
| Authentification | ✅ | Supabase Auth (JWT + gestion des refresh tokens) |
| Isolation des données | ✅ | Policies Row Level Security (RLS) au niveau Postgres |
| Stockage des secrets | ✅ | Variables d'environnement Vercel (.env local ignoré) |
| Journaux d'accès | ✅ | Logs Supabase + Vercel |
| Validation des entrées | 🟠 | Validation côté client partielle (renforcer côté Edge Functions) |
| Rate limiting | 🟠 | À mettre en place sur les endpoints Edge Functions |
| Monitoring sécurité | 🟠 | Prévoir alerting automatisé (Supabase Triggers + Slack) |

---

## 🔐 Variables d'environnement critiques

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` *(Edge Functions uniquement – ne jamais exposer côté client)*

Recommandations :

- Stocker toutes les clés dans Vercel (Production/Preview/Development).
- Utiliser un fichier `.env.local` pour le développement. Le fichier reste ignoré par Git.
- Renouveler la clé `SUPABASE_SERVICE_ROLE_KEY` en cas de suspicion de fuite.

---

## 🛡️ Bonnes pratiques actuelles

1. **RLS activé** sur toutes les tables métier (`produits`, `commandes`, `fournisseurs`, etc.).
2. **Fonctions RPC sécurisées** : chaque fonction vérifie `auth.uid()` et `get_current_user_company_id()`.
3. **Bucket Storage avatars** : accès public en lecture, upload restreint via policies Supabase.
4. **Gestion des permissions** : rôles (`owner`, `admin`, `member`) + JSON `permissions`.

---

## 🚨 Points d'attention

- **Rate limiting** : implémenter une Edge Function proxy avec détection d'abus (ex : middleware Upstash Ratelimit).
- **Webhooks externes** : valider systématiquement la signature HMAC (Shopify, emails, etc.).
- **Logs sensibles** : éviter de logguer les jetons Supabase ou tokens Shopify.
- **Backups** : activer les backups quotidiens côté Supabase (Project Settings > Backups).

---

## 🧰 Check-list sécurité DevOps

- [ ] Revoir régulièrement les policies RLS (`supabase/migrations`).
- [ ] Scanner les dépendances (`npm audit`, `npx vitest --run`).
- [ ] Surveiller les règles Storage (`supabase storage policies list`).
- [ ] Configurer une alerte Slack/Email sur `auth.users` (trigger Supabase).
- [ ] Documenter les procédures de rotation de clés (Supabase + Shopify).

---

## 🔄 Procédures de réponse incident

1. **Révoquer les tokens compromis** via Supabase Dashboard (`Authentication > Users > Reset password`).
2. **Régénérer les clés** (`Project Settings > API`).
3. **Switcher les variables d'environnement** sur Vercel et redéployer (`vercel env pull` / `vercel env push`).
4. **Auditer les tables sensibles** avec `supabase_get_logs` et `pg_stat_activity`.

---

## 📚 Ressources

- [Supabase Security Checklist](https://supabase.com/docs/guides/platform/security)
- [Vercel Security Features](https://vercel.com/security)
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)

---

Ce document doit être revu à chaque ajout de fonctionnalité backend (nouvelles RPC, webhooks Shopify, Edge Functions). Assurez-vous que toute nouvelle surface d'attaque respecte ces principes.

