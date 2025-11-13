# ❗ Journal des Erreurs - Stock Easy (Supabase)

**Dernière mise à jour** : Novembre 2025

---

## 1. Erreur critique : RPC indisponible

- **Symptôme** : toast `Erreur lors de la sauvegarde` lors d'un appel `updateParameter`.
- **Diagnostique** :
  - Vérifier dans Supabase Studio > SQL que la fonction `update_parameter` est bien présente.
  - Contrôler que la policy RLS autorise `auth.uid()` à exécuter l'appel.
  - Inspecter les logs : `supabase functions logs --project <ref>`.
- **Résolution** :
  - Redéployer la migration associée (`supabase/migrations/...update_parameter.sql`).
  - Ajouter une trace dans `supabaseApiService.updateParameter`.

---

## 2. Échec d'authentification Supabase

- **Symptôme** : `Missing Supabase environment variables`.
- **Diagnostique** :
  - Vérifier `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local`.
  - Sur Vercel, vérifier les variables d'environnement dans Project Settings.
- **Résolution** :
  - Regénérer la clé anonyme si besoin (`Project Settings > API`).
  - Redémarrer le serveur Vite après modification du `.env`.

---

## 3. Problème de RLS / données manquantes

- **Symptôme** : les listes (produits/commandes) sont vides pour un utilisateur pourtant actif.
- **Diagnostique** :
  - Vérifier la table `user_profiles` : le `company_id` correspond-il ?
  - Exécuter la requête suivante dans Supabase SQL :

```sql
select company_id, role, permissions
from user_profiles
where id = auth.uid();
```

- **Résolution** :
  - Mettre à jour `user_profiles` avec le bon `company_id`.
  - Rafraîchir le JWT (`supabase.auth.refreshSession()`).

---

## 4. Webhook Shopify non traité (prévision)

- **Symptôme** : pas de mise à jour de stock après réception d'un webhook.
- **Diagnostique** :
  - Vérifier la présence de la fonction Edge (à implémenter).
  - Contrôler les logs `supabase functions logs` ou `vercel logs`.
  - Valider la signature HMAC dans les headers.
- **Résolution (prévue)** :
  - Implémenter la vérification HMAC.
  - Écrire un test unitaire pour la fonction de parsing.

---

## 5. Actions recommandées

- Ajouter Sentry ou Logflare pour centraliser les erreurs runtime.
- Surveiller les quotas Supabase (Project Settings > Observability).
- Documenter chaque nouvelle erreur avec la date, le contexte et la résolution appliquée.

---

Ce journal remplace les anciens scénarios liés au backend historique. Toute anomalie doit désormais être investiguée via Supabase Studio, les logs Vercel ou les outils d'observabilité associés.

