# 🔍 Correction SearchBar - Authentification Multi-tenant

## ❌ Problème Initial

Lorsque l'utilisateur tape dans la barre de recherche, **aucune recommandation n'apparaît**.

## 🔎 Diagnostic

### Cause Racine
L'application utilise un **système multi-tenant** avec Row Level Security (RLS) activé sur Supabase. Les données sont filtrées par `company_id` via les politiques RLS.

### Problème Spécifique
La barre de recherche (`useSearch.js`) effectuait des requêtes **sans vérifier l'authentification de l'utilisateur**. Les requêtes Supabase échouaient silencieusement car :

1. L'utilisateur n'est pas authentifié OU
2. L'utilisateur n'a pas de `company_id` dans son profil
3. Les politiques RLS bloquent l'accès aux données

### Code Problématique (Avant)
```javascript
// ❌ Pas de vérification d'authentification
const performSearch = useCallback(async (searchQuery) => {
  // Recherche directe sans contexte utilisateur
  const { data } = await supabase
    .from('produits')
    .select('*')
    .ilike('nom_produit', searchPattern);
}, []);
```

## ✅ Solution Appliquée

### 1. Import du contexte d'authentification
```javascript
import { useAuth } from '../../contexts/SupabaseAuthContext';

export const useSearch = (query) => {
  const { currentUser } = useAuth();
  // ...
};
```

### 2. Vérification de l'authentification avant recherche
```javascript
const performSearch = useCallback(async (searchQuery) => {
  // ✅ Vérifier que l'utilisateur est authentifié
  if (!currentUser) {
    console.warn('🔍 SearchBar: Utilisateur non authentifié');
    setResults([]);
    return;
  }
  
  // Recherche avec authentification
  // Les politiques RLS filtreront automatiquement par company_id
}, [currentUser]);
```

### 3. Message utilisateur dans le dropdown
Ajout d'un message informatif si l'utilisateur n'est pas authentifié :

```javascript
{!currentUser && query.length >= 2 && (
  <div className="py-8 px-4 text-center text-warning-600 bg-warning-50">
    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
    <p className="text-sm font-semibold">Authentification requise</p>
    <p className="text-xs mt-1">Connectez-vous pour rechercher des produits</p>
  </div>
)}
```

### 4. Logs de debug
Ajout de logs console pour faciliter le diagnostic :

```javascript
console.log('🔍 Recherche avec pattern:', searchPattern);
console.log('🔍 Résultats recherche:', {
  produits: produitsRes.data?.length || 0,
  fournisseurs: fournisseursRes.data?.length || 0,
  commandes: commandesRes.data?.length || 0
});
```

## 📋 Fichiers Modifiés

1. **`src/components/SearchBar/useSearch.js`**
   - Import `useAuth` 
   - Vérification `currentUser` avant recherche
   - Logs de debug
   - Dépendance `currentUser` dans le callback

2. **`src/components/SearchBar/SearchDropdown.jsx`**
   - Import `useAuth` et `AlertCircle`
   - Message d'erreur si non authentifié
   - Affichage conditionnel basé sur `currentUser`

## 🧪 Comment Tester

### Test 1 : Utilisateur Non Authentifié
1. Se déconnecter de l'application
2. Taper dans la barre de recherche
3. **Résultat attendu** : Message "Authentification requise"

### Test 2 : Utilisateur Authentifié Sans Produits
1. Se connecter avec un compte
2. Vérifier que le compte a un `company_id`
3. Taper dans la barre de recherche
4. **Résultat attendu** : Message "Aucun résultat trouvé" (si pas de produits)

### Test 3 : Utilisateur Authentifié Avec Produits
1. Se connecter avec un compte contenant des produits
2. Taper un terme de recherche
3. **Résultat attendu** : Liste des produits filtrés

## 🔧 Points Techniques

### Politiques RLS Supabase
Les tables `produits`, `fournisseurs`, et `commandes` ont des politiques RLS :

```sql
CREATE POLICY "Users can only see their company's products"
  ON public.produits FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL
  );
```

### Fonction Helper
La fonction `get_current_user_company_id()` récupère le `company_id` depuis `user_profiles` :

```sql
CREATE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id 
  FROM public.user_profiles 
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

## 📊 Vérification Base de Données

Pour vérifier si un utilisateur a des produits :

```javascript
// Dans la console du navigateur
const { data: profile } = await supabase
  .from('user_profiles')
  .select('company_id')
  .eq('id', user.id)
  .single();

console.log('Company ID:', profile?.company_id);

const { data: produits, count } = await supabase
  .from('produits')
  .select('*', { count: 'exact' });

console.log('Nombre de produits:', count);
```

## 🎯 Prochaines Étapes

1. **Tester en environnement de développement**
   ```bash
   npm run dev
   ```

2. **Vérifier les logs console** lors de la recherche

3. **S'assurer que l'utilisateur a des produits** dans sa company

4. **Déployer en production** si les tests passent

## 📚 Ressources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-tenant Architecture](./MULTI_TENANT_SYSTEM.md)
- Migration 011: `supabase/migrations/011_multi_tenant_system.sql`

---

**Date de correction** : 16 novembre 2025  
**Auteur** : Assistant IA  
**Status** : ✅ Résolu

