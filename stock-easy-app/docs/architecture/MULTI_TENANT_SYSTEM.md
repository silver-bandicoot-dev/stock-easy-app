# 🏢 Système Multi-Tenant - Stock Easy

## 📋 Vue d'ensemble

Stock Easy implémente maintenant un système multi-tenant complet permettant à chaque entreprise d'avoir :
- ✅ Ses propres données isolées (produits, commandes, fournisseurs, etc.)
- ✅ Gestion des collaborateurs avec rôles et permissions
- ✅ Système d'invitation par email
- ✅ Isolation des données via Row Level Security (RLS)

---

## 🎯 Fonctionnalités Principales

### 1. **Inscription et Création d'Entreprise**
Lors de l'inscription d'un nouvel utilisateur :
- Une entreprise est automatiquement créée
- L'utilisateur devient propriétaire (role: `owner`)
- Toutes les données créées sont liées à son entreprise

### 2. **Système d'Invitation**
Les propriétaires et administrateurs peuvent :
- Inviter des collaborateurs par email
- Définir leur rôle (`admin` ou `member`)
- Gérer les permissions
- Révoquer les invitations en attente

### 3. **Gestion des Collaborateurs**
- Voir tous les membres de l'équipe
- Modifier les rôles et permissions
- Retirer des membres (sauf le propriétaire)

### 4. **Isolation des Données**
Chaque entreprise ne peut accéder qu'à ses propres données via :
- Row Level Security (RLS) Postgres
- Filtrage automatique sur `company_id`
- Triggers d'auto-complétion du `company_id`

---

## 🗂️ Structure de la Base de Données

### Tables Créées

#### `companies` (Entreprises)
```sql
- id (UUID, primary key)
- name (TEXT) - Nom de l'entreprise
- owner_id (UUID) - Propriétaire de l'entreprise
- industry (TEXT) - Secteur d'activité
- size (TEXT) - Taille ('small', 'medium', 'large')
- country (TEXT)
- timezone (TEXT)
- settings (JSONB) - Paramètres de l'entreprise
- created_at, updated_at
```

#### `user_profiles` (Profils Utilisateurs)
```sql
- id (UUID, primary key) - Référence auth.users
- company_id (UUID) - Entreprise de l'utilisateur
- first_name, last_name (TEXT)
- photo_url (TEXT)
- language (TEXT) - 'fr', 'en', 'es'
- role (TEXT) - 'owner', 'admin', 'member'
- permissions (JSONB) - Permissions granulaires
- last_login_at, created_at, updated_at
```

#### `invitations` (Invitations)
```sql
- id (UUID, primary key)
- company_id (UUID) - Entreprise qui invite
- invited_by_id (UUID) - Qui a envoyé l'invitation
- email (TEXT) - Email de l'invité
- role (TEXT) - Rôle proposé
- permissions (JSONB)
- token (TEXT) - Token sécurisé unique
- status (TEXT) - 'pending', 'accepted', 'expired', 'cancelled'
- expires_at (TIMESTAMP) - Expire après 7 jours
- created_at, accepted_at
```

### Tables Métier Mises à Jour

Toutes les tables existantes ont été mises à jour avec un champ `company_id` :
- ✅ `produits`
- ✅ `fournisseurs`
- ✅ `commandes`
- ✅ `warehouses`
- ✅ `parametres`
- ✅ `sku_fournisseurs`
- ✅ `kpi_snapshots`

---

## 🔒 Sécurité et Permissions

### Rôles Disponibles

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **owner** 🏆 | Propriétaire de l'entreprise | Toutes les permissions, ne peut pas être retiré |
| **admin** 🛡️ | Administrateur | Peut gérer l'équipe et inviter des membres |
| **member** 👤 | Membre | Peut voir et éditer selon permissions |

### Système de Permissions

Chaque utilisateur possède un objet `permissions` JSONB :
```json
{
  "can_view": true,
  "can_edit": true,
  "can_delete": false,
  "can_invite": false
}
```

- Les `owner` et `admin` ont toutes les permissions automatiquement
- Les permissions des `member` peuvent être personnalisées

### Row Level Security (RLS)

Toutes les données sont protégées par des policies RLS :

```sql
-- Exemple pour la table produits
CREATE POLICY "Users can only see their company's products"
  ON public.produits FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL -- Compatibilité données existantes
  );
```

**Avantages** :
- ✅ Protection au niveau de la base de données
- ✅ Impossible d'accéder aux données d'une autre entreprise
- ✅ Même en cas de faille dans le code frontend

---

## 📡 API / Fonctions RPC

### Fonctions Créées

#### 1. `get_current_user_company_id()`
Retourne le `company_id` de l'utilisateur actuel.
Utilisée dans toutes les policies RLS.

#### 2. `invite_team_member(p_email, p_role, p_permissions)`
Invite un nouveau membre dans l'équipe.

**Paramètres** :
- `p_email` (TEXT) - Email de l'invité
- `p_role` (TEXT) - 'admin' ou 'member'
- `p_permissions` (JSONB, optionnel) - Permissions personnalisées

**Retour** :
```json
{
  "success": true,
  "invitation_id": "...",
  "token": "...",
  "email": "user@example.com"
}
```

#### 3. `accept_invitation(p_token)`
Accepte une invitation via son token.

**Retour** :
```json
{
  "success": true,
  "company_id": "..."
}
```

#### 4. `get_team_members()`
Récupère tous les membres de l'équipe de l'utilisateur actuel.

**Retour** : Array JSON des membres avec leurs infos

#### 5. `get_pending_invitations()`
Récupère les invitations en attente pour l'entreprise.

**Retour** : Array JSON des invitations

#### 6. `revoke_invitation(p_invitation_id)`
Annule une invitation en attente.

#### 7. `remove_team_member(p_user_id)`
Retire un membre de l'équipe (sauf le owner).

---

## 💻 Frontend - Composants

### 1. `ProfilePage.jsx` ✨
**Nouvelle page de profil** cohérente avec le design de l'app.

**Fonctionnalités** :
- ✅ Édition du profil personnel (nom, prénom, photo, langue)
- ✅ Affichage de l'entreprise
- ✅ Édition de l'entreprise (owner uniquement)
- ✅ Liste des membres de l'équipe
- ✅ Inviter des collaborateurs (admin/owner)
- ✅ Gérer les invitations en attente
- ✅ Retirer des membres
- ✅ Design cohérent avec Stock Easy (couleurs, typographie, spacing)

**Route** : `/profile`

### 2. `AcceptInvitation.jsx`
Page pour accepter une invitation.

**Fonctionnalités** :
- ✅ Vérification du token
- ✅ Connexion requise
- ✅ Acceptation de l'invitation
- ✅ Redirection automatique après acceptation

**Route** : `/accept-invitation?token=...`

### 3. `companyService.js`
Service centralisant toutes les opérations liées aux entreprises et équipes.

**Fonctions disponibles** :
```javascript
// Entreprise
getCurrentUserCompany()
updateCompany(companyId, updates)

// Invitations
inviteTeamMember(email, role, permissions)
acceptInvitation(token)
getPendingInvitations()
revokeInvitation(invitationId)

// Membres
getTeamMembers()
removeTeamMember(userId)
updateMemberRole(userId, newRole)
updateMemberPermissions(userId, permissions)

// Profil
getCurrentUserProfile()
updateUserProfile(updates)
uploadProfilePhoto(file)

// Utilitaires
hasPermission(permissionKey)
sendInvitationEmail(email, token, inviterName, companyName)
```

---

## 🚀 Déploiement

### 1. Appliquer la Migration

**Dans Supabase Dashboard** :
1. Aller dans **SQL Editor**
2. Copier le contenu de `/supabase/migrations/011_multi_tenant_system.sql`
3. Exécuter la migration
4. Vérifier qu'il n'y a pas d'erreurs

### 2. Vérifier les Tables

```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'user_profiles', 'invitations');

-- Vérifier que company_id a été ajouté
SELECT column_name FROM information_schema.columns
WHERE table_name = 'produits' AND column_name = 'company_id';
```

### 3. Créer le Bucket Storage pour les Avatars

Dans Supabase Dashboard > Storage :
1. Créer un bucket nommé `avatars`
2. Le rendre **public**
3. Configurer les policies :

```sql
-- Policy pour upload
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour lecture
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

### 4. Tester le Système

**Scénario de test complet** :

1. **Inscription**
   - Créer un nouveau compte
   - Vérifier qu'une entreprise est créée automatiquement
   - Vérifier le rôle `owner`

2. **Profil**
   - Aller sur `/profile`
   - Modifier nom, prénom, photo
   - Modifier le nom de l'entreprise (owner)
   - Sauvegarder

3. **Invitation**
   - Cliquer sur "Inviter un membre"
   - Entrer un email
   - Choisir le rôle
   - Envoyer
   - Copier le lien d'invitation

4. **Acceptation** (dans un autre navigateur/incognito)
   - Se connecter avec l'email invité
   - Ouvrir le lien d'invitation
   - Accepter
   - Vérifier l'accès aux données de l'entreprise

5. **Gestion**
   - Revenir sur le compte owner
   - Voir le nouveau membre dans l'équipe
   - Modifier son rôle (optionnel)
   - Retirer le membre

6. **Isolation des Données**
   - Créer des produits, commandes avec le premier compte
   - Se connecter avec un autre compte (autre entreprise)
   - Vérifier que les données du premier compte ne sont PAS visibles

---

## 📊 Migration des Données Existantes

Si vous avez des données existantes AVANT cette migration :

### Option 1 : Assigner à l'Utilisateur Actuel

```sql
-- Récupérer le company_id du premier utilisateur (owner)
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM user_profiles
  WHERE role = 'owner'
  LIMIT 1;
  
  -- Mettre à jour toutes les données sans company_id
  UPDATE produits SET company_id = v_company_id WHERE company_id IS NULL;
  UPDATE fournisseurs SET company_id = v_company_id WHERE company_id IS NULL;
  UPDATE commandes SET company_id = v_company_id WHERE company_id IS NULL;
  UPDATE warehouses SET company_id = v_company_id WHERE company_id IS NULL;
  UPDATE parametres SET company_id = v_company_id WHERE company_id IS NULL;
  UPDATE sku_fournisseurs SET company_id = v_company_id WHERE company_id IS NULL;
END $$;
```

### Option 2 : Garder la Compatibilité

Les policies RLS incluent `OR company_id IS NULL` pour permettre l'accès aux données existantes sans `company_id`.

**⚠️ Important** : Pour une sécurité maximale, attribuez un `company_id` à toutes les données.

---

## 🎨 Design System

La nouvelle page de profil respecte la charte graphique de Stock Easy :

### Couleurs
- **Noir principal** : `#191919`
- **Noir secondaire** : `#2A2A2A`
- **Gris foncé** : `#666663`
- **Gris moyen** : `#E5E4DF`
- **Background** : `#FAFAF7`

### Composants
- ✅ Boutons cohérents avec le reste de l'app
- ✅ Inputs et selects avec les bons styles
- ✅ Cartes avec border et shadow subtiles
- ✅ Badges de rôle avec icônes
- ✅ Modal d'invitation stylée
- ✅ Responsive design (mobile, tablet, desktop)

---

## 🔄 Flux d'Invitation

```
┌─────────────┐
│   Owner/    │
│   Admin     │
└──────┬──────┘
       │
       │ 1. Invite Member (email + role)
       ▼
┌─────────────────────┐
│  invite_team_member │ ─────┐
│      RPC            │      │ 2. Génère token unique
└─────────────────────┘      │
                             ▼
                   ┌──────────────────┐
                   │   invitations    │
                   │   (status:       │
                   │   pending)       │
                   └──────────────────┘
                             │
                             │ 3. Lien envoyé par email (ou copié)
                             ▼
                   ┌──────────────────┐
                   │     Invité       │
                   │   (clique lien)  │
                   └──────────────────┘
                             │
                             │ 4. Se connecte
                             ▼
                   ┌──────────────────┐
                   │ AcceptInvitation │
                   │   Component      │
                   └──────────────────┘
                             │
                             │ 5. Accepte
                             ▼
                   ┌──────────────────┐
                   │ accept_invitation│
                   │      RPC         │ ─────┐
                   └──────────────────┘      │
                                             │ 6. Met à jour user_profile
                                             │    avec company_id
                                             ▼
                                   ┌──────────────────┐
                                   │  user_profiles   │
                                   │  (company_id set)│
                                   └──────────────────┘
                                             │
                                             │ 7. Accès aux données
                                             ▼
                                   ┌──────────────────┐
                                   │ Tableau de bord  │
                                   │   (Stock Easy)   │
                                   └──────────────────┘
```

---

## 📝 TODO - Améliorations Futures

### Immédiat
- [ ] Configurer l'envoi d'emails via Supabase Edge Functions ou SendGrid
- [ ] Ajouter des templates d'email HTML pour les invitations
- [ ] Implémenter la gestion des permissions granulaires dans l'UI

### Court Terme
- [ ] Ajouter un système d'audit log (qui a fait quoi et quand)
- [ ] Implémenter la gestion des abonnements (plans free/pro/enterprise)
- [ ] Ajouter des limites par plan (nb de produits, nb de membres, etc.)
- [ ] Statistiques d'utilisation par entreprise

### Moyen Terme
- [ ] Export de données par entreprise
- [ ] Transfert de propriété d'entreprise
- [ ] Suppression d'entreprise (avec confirmation)
- [ ] Multi-entreprises (un utilisateur dans plusieurs entreprises)
- [ ] Invitations avec expiration personnalisable
- [ ] Notifications in-app pour les invitations

---

## 🐛 Debugging

### Problème : Les données ne s'affichent pas

**Vérifier** :
```sql
-- Vérifier le company_id de l'utilisateur
SELECT up.company_id, c.name
FROM user_profiles up
JOIN companies c ON c.id = up.company_id
WHERE up.id = auth.uid();

-- Vérifier les données
SELECT sku, nom_produit, company_id
FROM produits
WHERE company_id = (SELECT company_id FROM user_profiles WHERE id = auth.uid())
   OR company_id IS NULL;
```

### Problème : Erreur "permission denied"

**Vérifier les policies RLS** :
```sql
-- Lister les policies actives
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Vérifier si RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('produits', 'fournisseurs', 'commandes');
```

### Problème : L'invitation ne fonctionne pas

**Vérifier** :
```sql
-- Voir les invitations
SELECT id, email, role, status, expires_at, token
FROM invitations
WHERE company_id = (SELECT company_id FROM user_profiles WHERE id = auth.uid())
ORDER BY created_at DESC;

-- Vérifier si le token est valide
SELECT * FROM invitations
WHERE token = 'YOUR_TOKEN'
AND status = 'pending'
AND expires_at > NOW();
```

---

## 📚 Ressources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Multi-Tenancy](https://supabase.com/docs/guides/auth/managing-user-data#multi-tenancy)
- [Postgres Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

## ✅ Checklist de Mise en Production

Avant de déployer en production :

- [ ] Migration appliquée et testée
- [ ] Bucket storage `avatars` créé et configuré
- [ ] Tests d'invitation complets effectués
- [ ] Tests d'isolation des données effectués
- [ ] Données existantes migrées avec `company_id`
- [ ] Documentation partagée avec l'équipe
- [ ] Plan de rollback préparé (backup de la DB)
- [ ] Monitoring des erreurs configuré
- [ ] Envoi d'emails d'invitation configuré

---

**Date de création** : $(date)  
**Version** : 1.0  
**Auteur** : Stock Easy Team

🎉 **Le système multi-tenant est maintenant opérationnel !**

