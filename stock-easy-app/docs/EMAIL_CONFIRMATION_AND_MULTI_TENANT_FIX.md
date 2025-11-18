# Correction : Confirmation d'Email et Multi-Tenant

## Problèmes identifiés

### 1. Page blanche après confirmation d'email
**Problème** : Quand un nouvel utilisateur clique sur le lien de confirmation d'email, il arrive sur une page blanche au lieu d'être redirigé vers la page de connexion avec un message de confirmation.

**Solution** : 
- Création d'une nouvelle route `/confirm-email` qui gère la confirmation d'email
- Affichage d'un message de succès avec redirection automatique vers `/login` après 3 secondes
- Gestion des erreurs avec message clair et bouton pour aller à la page de connexion

### 2. Nouveaux utilisateurs connectés à la company existante
**Problème** : Les nouveaux utilisateurs sont connectés à la company de l'utilisateur existant au lieu d'avoir leur propre company.

**Solution** :
- Correction du trigger `on_auth_user_created` pour s'assurer qu'il crée toujours une nouvelle company pour chaque nouvel utilisateur
- Vérification que le profil utilisateur n'existe pas déjà (pour gérer le cas des invitations)
- Migration SQL pour corriger le trigger et la fonction `create_company_for_user()`

## Fichiers modifiés

### Nouveaux fichiers
1. `stock-easy-app/src/components/auth/EmailConfirmation.jsx`
   - Composant React pour gérer la confirmation d'email
   - Gère les différents cas : succès, erreur, email déjà confirmé
   - Redirige vers `/login` avec un message de succès

2. `stock-easy-app/supabase/migrations/045_fix_company_creation_trigger.sql`
   - Migration pour corriger le trigger de création de company
   - S'assure que chaque nouvel utilisateur obtient sa propre company
   - Gère le cas des invitations (ne crée pas de nouvelle company si le profil existe déjà)

### Fichiers modifiés
1. `stock-easy-app/src/App.jsx`
   - Ajout de la route `/confirm-email`

2. `stock-easy-app/src/components/auth/SupabaseLogin.jsx`
   - Ajout de la gestion du message de confirmation d'email depuis `location.state`
   - Affichage d'un toast de succès quand l'utilisateur arrive depuis la confirmation

3. `stock-easy-app/src/contexts/SupabaseAuthContext.jsx`
   - Ajout de `emailRedirectTo` dans la fonction `signup` pour rediriger vers `/confirm-email` après confirmation

## Configuration Supabase requise

### 1. URL de redirection dans le Dashboard Supabase

Pour que la redirection fonctionne correctement, vous devez configurer l'URL de redirection autorisée dans le Dashboard Supabase :

1. Allez dans **Authentication** → **URL Configuration**
2. Ajoutez votre URL de production dans **Redirect URLs** :
   - `https://votre-domaine.com/confirm-email`
   - `https://votre-domaine.com/*` (pour le développement local aussi)
3. Pour le développement local, ajoutez aussi :
   - `http://localhost:5173/confirm-email` (ou le port que vous utilisez)

### 2. Appliquer les migrations

**IMPORTANT :** Appliquez les migrations dans l'ordre suivant :

```bash
cd stock-easy-app
supabase db push
```

Les migrations à appliquer :
- `045_fix_company_creation_trigger.sql` - Corrige le trigger de création de company
- `046_strict_multi_tenant_isolation.sql` - Renforce l'isolation des données (sécurité stricte)

**⚠️ ATTENTION :** La migration 046 rend `company_id` obligatoire. Si vous avez des données existantes sans `company_id`, vous devez d'abord les nettoyer (voir section "Nettoyer les données existantes" ci-dessous).

Ou via le Dashboard Supabase :
1. Allez dans **SQL Editor**
2. Exécutez d'abord `045_fix_company_creation_trigger.sql`
3. Puis exécutez `046_strict_multi_tenant_isolation.sql`

### 3. Nettoyer les données existantes (si nécessaire)

Si vous avez des données existantes sans `company_id`, vous devez les assigner à une company avant d'appliquer la migration 046 :

```sql
-- Option 1 : Assigner à la première company trouvée
DO $$
DECLARE
  v_default_company_id UUID;
BEGIN
  SELECT id INTO v_default_company_id
  FROM public.companies
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_default_company_id IS NOT NULL THEN
    UPDATE public.produits SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.fournisseurs SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.commandes SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.warehouses SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.parametres SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.sku_fournisseurs SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.kpi_snapshots SET company_id = v_default_company_id WHERE company_id IS NULL;
  END IF;
END $$;
```

## Tests à effectuer

### Test 1 : Confirmation d'email
1. Créer un nouveau compte via `/signup`
2. Vérifier l'email de confirmation reçu
3. Cliquer sur le lien de confirmation
4. Vérifier que :
   - La page `/confirm-email` s'affiche avec un message de succès
   - Après 3 secondes, redirection vers `/login`
   - Un message de confirmation s'affiche sur la page de login

### Test 2 : Multi-tenant - Isolation des données
1. Créer deux comptes différents (Entreprise A et Entreprise B)
2. Se connecter avec l'Entreprise A et ajouter quelques produits
3. Se connecter avec l'Entreprise B
4. **Vérifier** : L'Entreprise B ne voit PAS les produits de l'Entreprise A
5. **Vérifier** : Chaque entreprise ne voit que ses propres données
6. **Vérifier** : Le `company_id` dans `user_profiles` correspond à une company dont l'utilisateur est le propriétaire

### Test 3 : Invitation de collaborateurs
1. Créer un compte propriétaire (Entreprise A)
2. Inviter un collaborateur depuis le profil
3. Le collaborateur accepte l'invitation
4. **Vérifier** : Le collaborateur voit les données de l'Entreprise A
5. **Vérifier** : Le collaborateur ne voit PAS les données d'autres entreprises

## Vérification du problème multi-tenant

Pour vérifier que le problème est résolu, vous pouvez exécuter cette requête SQL dans Supabase :

```sql
-- Vérifier que chaque utilisateur a sa propre company
SELECT 
  u.email,
  up.company_id,
  c.name as company_name,
  c.owner_id,
  CASE 
    WHEN c.owner_id = u.id THEN 'Propriétaire'
    ELSE 'Membre'
  END as role_in_company
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.id = u.id
LEFT JOIN public.companies c ON c.id = up.company_id
ORDER BY u.created_at DESC
LIMIT 10;
```

Chaque nouvel utilisateur devrait avoir :
- Un `company_id` unique
- Être le propriétaire de sa company (`owner_id = user.id`)

## Notes importantes

1. **Invitations** : Si un utilisateur est invité à rejoindre une company existante, le trigger ne créera pas de nouvelle company (c'est le comportement attendu).

2. **Données existantes** : Si vous avez des utilisateurs existants qui n'ont pas de company, vous devrez peut-être créer manuellement des companies pour eux ou exécuter un script de migration.

3. **URL de redirection** : Assurez-vous que l'URL de redirection est bien configurée dans Supabase, sinon la confirmation d'email ne fonctionnera pas correctement.

4. **Isolation stricte** : La migration 046 supprime la clause `OR company_id IS NULL` des policies RLS. Cela garantit qu'aucune entreprise ne peut voir les données d'une autre, même par accident. C'est la sécurité standard pour une application multi-tenant.

5. **Sécurité** : Toutes les données sont isolées au niveau de la base de données via Row Level Security (RLS). Même si le code frontend a un bug, la base de données bloque l'accès aux données d'autres entreprises.

## Documentation complémentaire

Pour plus de détails sur la sécurité multi-tenant, consultez :
- `docs/MULTI_TENANT_SECURITY_GUIDE.md` - Guide complet sur l'isolation des données

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans la console du navigateur
2. Vérifiez les logs Supabase dans le Dashboard
3. Vérifiez que la migration a été appliquée correctement
4. Vérifiez que l'URL de redirection est bien configurée dans Supabase

