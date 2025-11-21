# 📁 Configuration du Storage Supabase pour les Avatars

## 🎯 Problème à Résoudre

```
StorageApiError: new row violates row-level security policy
```

Cette erreur se produit car le bucket `avatars` n'existe pas ou n'a pas les bonnes policies RLS configurées.

---

## ✅ Solution - Configuration Manuelle dans Supabase

### Étape 1: Créer le Bucket

1. Allez dans **Supabase Dashboard** → **Storage**
2. Cliquez sur **"New bucket"**
3. Configurez le bucket :
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Coché** (pour permettre l'accès public aux photos)
   - **Allowed MIME types**: `image/*` (optionnel)
   - **File size limit**: `5MB` (optionnel)
4. Cliquez sur **"Create bucket"**

### Étape 2: Configurer les Policies RLS

1. Allez dans **Supabase Dashboard** → **Storage** → **Policies** (onglet)
2. Sélectionnez le bucket `avatars`
3. Cliquez sur **"New policy"**

#### Policy 1: Permettre l'upload de sa propre photo

**Policy Name**: `Users can upload their own avatar`  
**Allowed operation**: `INSERT`  
**Target roles**: `authenticated`  

**USING expression (check):**
```sql
bucket_id = 'avatars' 
AND (storage.foldername(name))[1] = auth.uid()::text
```

Ou plus simple :

```sql
bucket_id = 'avatars' 
AND auth.uid() IS NOT NULL
```

Cliquez sur **"Create policy"**

#### Policy 2: Permettre la lecture publique

**Policy Name**: `Avatars are publicly accessible`  
**Allowed operation**: `SELECT`  
**Target roles**: `public` (ou `authenticated` si vous voulez restreindre)

**USING expression:**
```sql
bucket_id = 'avatars'
```

Cliquez sur **"Create policy"**

#### Policy 3: Permettre la mise à jour de sa propre photo

**Policy Name**: `Users can update their own avatar`  
**Allowed operation**: `UPDATE`  
**Target roles**: `authenticated`

**USING expression:**
```sql
bucket_id = 'avatars' 
AND (storage.foldername(name))[1] = auth.uid()::text
```

Cliquez sur **"Create policy"**

#### Policy 4: Permettre la suppression de sa propre photo

**Policy Name**: `Users can delete their own avatar`  
**Allowed operation**: `DELETE`  
**Target roles**: `authenticated`

**USING expression:**
```sql
bucket_id = 'avatars' 
AND (storage.foldername(name))[1] = auth.uid()::text
```

Cliquez sur **"Create policy"**

---

## 🔧 Alternative: Configuration via SQL

Si vous préférez utiliser SQL, exécutez ces commandes dans **SQL Editor** :

```sql
-- ============================================
-- CONFIGURATION STORAGE POUR AVATARS
-- ============================================

-- 1. Créer le bucket (si pas déjà fait via l'UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy pour l'upload
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

-- 3. Policy pour la lecture (public)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 4. Policy pour la mise à jour
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy pour la suppression
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## ✅ Vérification

### 1. Vérifier que le bucket existe

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';
```

**Résultat attendu** :
```
id      | name    | public
--------|---------|--------
avatars | avatars | true
```

### 2. Vérifier les policies

```sql
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

**Résultat attendu** : Vous devriez voir 4 policies pour le bucket avatars.

### 3. Tester l'upload

Dans votre application :
1. Allez sur `/profile`
2. Cliquez sur l'icône de caméra pour changer la photo
3. Sélectionnez une image
4. Cliquez sur "Enregistrer"
5. ✅ La photo devrait être uploadée sans erreur

---

## 🐛 Debugging

### Erreur persiste après configuration ?

**Vérifier les permissions dans la console** :

```javascript
// Dans la console du navigateur (F12)
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('test.jpg', new Blob(['test']), {
    cacheControl: '3600',
    upsert: false
  });

console.log('Upload test:', { data, error });
```

### Erreur 403 Forbidden

**Cause** : Les policies RLS ne sont pas correctes.

**Solution** :
1. Vérifiez que vous êtes bien connecté (`auth.uid()` n'est pas null)
2. Vérifiez les policies avec la commande SQL ci-dessus
3. Assurez-vous que le bucket est **public**

### Erreur 404 Not Found

**Cause** : Le bucket `avatars` n'existe pas.

**Solution** : Créez le bucket via l'interface ou via SQL.

### L'image ne s'affiche pas après upload

**Cause** : Le bucket n'est pas public ou la policy SELECT n'est pas configurée.

**Solution** :
1. Rendez le bucket public (via Settings du bucket)
2. Ajoutez la policy SELECT pour `public`

---

## 📝 Structure des Fichiers

Les photos de profil sont stockées avec cette structure :

```
avatars/
  └── profile-photos/
      └── {user_id}-{timestamp}.{ext}
```

**Exemple** :
```
avatars/profile-photos/8abe07de-91ec-43ef-b2a0-f1d9dddaf025-1762962478467.jpg
```

---

## 🔐 Sécurité

### Pourquoi ces policies ?

1. **INSERT** : Seuls les utilisateurs authentifiés peuvent uploader des fichiers
2. **SELECT** : Tout le monde peut voir les avatars (nécessaire pour afficher les photos)
3. **UPDATE** : Seul le propriétaire peut modifier son avatar
4. **DELETE** : Seul le propriétaire peut supprimer son avatar

### Amélioration future

Pour plus de sécurité, vous pouvez :

```sql
-- Limiter la taille des fichiers
CREATE POLICY "File size limit"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND octet_length(decode(substring(metadata->>'size' from 1), 'escape')) < 5242880 -- 5MB
);

-- Limiter les types MIME
CREATE POLICY "Only images allowed"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (metadata->>'mimetype')::text LIKE 'image/%'
);
```

---

## ✅ Checklist Finale

Avant de tester :

- [ ] Le bucket `avatars` existe dans Supabase Storage
- [ ] Le bucket est configuré comme **public**
- [ ] Les 4 policies RLS sont créées (INSERT, SELECT, UPDATE, DELETE)
- [ ] La migration `012_fix_rpc_and_storage.sql` a été exécutée
- [ ] Vous avez rechargé l'application

---

**Une fois configuré, l'upload de photos de profil devrait fonctionner sans erreur !** ✨

