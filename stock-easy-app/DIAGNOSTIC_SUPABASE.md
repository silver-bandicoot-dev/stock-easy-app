# 🔍 Diagnostic de Connexion Supabase

## Problème identifié

Les paramètres généraux (devise, seuil surstock, multiplicateur) ne se sauvegardent pas dans la base de données Supabase.

## Corrections apportées

### 1. ✅ Fonction `updateParameter` ajoutée

**Fichier**: `src/services/supabaseApiService.js`

La fonction RPC `update_parameter` existait dans Supabase mais n'était pas appelée depuis le frontend. J'ai ajouté :

```javascript
export async function updateParameter(paramName, paramValue) {
  try {
    const { data, error } = await supabase.rpc('update_parameter', {
      p_param_name: paramName,
      p_value: String(paramValue)
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur mise à jour paramètre:', error);
    return { success: false, error: error.message };
  }
}
```

### 2. ✅ Intégration dans l'adapter API

**Fichier**: `src/services/apiAdapter.js`

Ajout de `updateParameter` dans l'objet `api` et dans les exports.

### 3. ✅ Composant de test créé

**Fichier**: `src/components/debug/SupabaseConnectionTest.jsx`

Un composant React complet qui teste :
- Configuration Supabase (URL, clé)
- Session utilisateur
- Lecture de la table `parametres`
- Appel RPC `get_all_data`
- Appel RPC `update_parameter`
- UPDATE SQL direct
- Vérification des policies RLS

## Comment tester

### Option 1: Interface de test (RECOMMANDÉ)

1. Lancez l'application :
   ```bash
   cd /Users/orioncorp/stock-easy-app/stock-easy-app
   npm run dev
   ```

2. Connectez-vous à votre compte

3. Allez sur : **http://localhost:5173/test-supabase**

4. Cliquez sur "Lancer les tests"

5. Examinez les résultats :
   - ✅ Vert = Test réussi
   - ⚠️ Jaune = Avertissement
   - ❌ Rouge = Erreur

### Option 2: Test des paramètres généraux

1. Allez dans **Paramètres > Paramètres Généraux**

2. Modifiez un paramètre (devise, seuil, multiplicateur)

3. Cliquez sur "Enregistrer les paramètres"

4. Ouvrez la console du navigateur (F12) pour voir les logs :
   ```
   🔧 updateParameter appelé: DeviseDefaut = EUR
   ✅ Paramètre mis à jour dans Supabase: {...}
   ```

5. Vérifiez dans Supabase Dashboard :
   - Allez dans "Table Editor"
   - Ouvrez la table `parametres`
   - Vérifiez que les valeurs ont changé

## Diagnostics possibles

### ❌ Erreur : "update_parameter n'existe pas"

**Cause** : La fonction RPC n'est pas dans la base Supabase

**Solution** :
1. Allez dans Supabase Dashboard > SQL Editor
2. Vérifiez que la fonction existe :
   ```sql
   SELECT proname 
   FROM pg_proc 
   WHERE proname = 'update_parameter';
   ```
3. Si elle n'existe pas, créez-la :
   ```sql
   CREATE OR REPLACE FUNCTION public.update_parameter(
     p_param_name TEXT, 
     p_value TEXT
   )
   RETURNS JSON AS $$
   BEGIN
     SET search_path = public;
     
     UPDATE public.parametres 
     SET valeur = p_value, 
         updated_at = NOW()
     WHERE nom_parametre = p_param_name;
     
     RETURN json_build_object('success', TRUE);
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

### ❌ Erreur : "permission denied for table parametres"

**Cause** : Les policies RLS bloquent l'accès

**Solution** :
1. Allez dans Supabase Dashboard > Authentication > Policies
2. Vérifiez la table `parametres`
3. Assurez-vous qu'il y a une policy pour UPDATE :
   ```sql
   CREATE POLICY "auth_parameters_all" 
     ON public.parametres 
     FOR ALL 
     USING (auth.role() = 'authenticated');
   ```

### ⚠️ Les tests réussissent mais les données ne changent pas

**Causes possibles** :
1. **Mauvais nom de paramètre** : Vérifiez que `nom_parametre` correspond
2. **Problème de cache** : Rechargez l'application (Ctrl+Shift+R)
3. **Trigger qui annule** : Vérifiez s'il y a des triggers sur la table

**Vérification SQL** :
```sql
-- Voir tous les paramètres
SELECT * FROM parametres;

-- Vérifier l'historique des modifications
SELECT * FROM parametres 
ORDER BY updated_at DESC;

-- Vérifier les triggers
SELECT tgname, tgtype 
FROM pg_trigger 
WHERE tgrelid = 'parametres'::regclass;
```

### ⚠️ UPDATE SQL direct fonctionne mais pas RPC

**Cause** : La fonction RPC a un bug ou utilise le mauvais nom de colonne

**Solution** : Vérifier le code de la fonction :
```sql
-- Voir le code de la fonction
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_parameter';
```

## Structure de la table `parametres`

La table doit avoir cette structure :

```sql
CREATE TABLE public.parametres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_parametre TEXT UNIQUE NOT NULL,
  valeur TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Les paramètres attendus :
- `DeviseDefaut` : 'EUR', 'USD', 'GBP'
- `SeuilSurstockProfond` : nombre en jours (ex: '90')
- `MultiplicateurDefaut` : nombre décimal (ex: '1.2')

## Vérification finale

Une fois les corrections appliquées, vérifiez que :

1. ✅ Le composant de test affiche tous les tests en vert
2. ✅ Les paramètres se sauvegardent depuis l'interface
3. ✅ Les modifications sont visibles dans Supabase Dashboard
4. ✅ Les modifications persistent après rechargement de la page
5. ✅ Aucune erreur dans la console

## Logs utiles

Pour activer les logs détaillés dans la console :

```javascript
// Dans src/lib/supabaseClient.js, ajoutez :
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    debug: true  // ← Active les logs détaillés
  },
  global: {
    headers: {
      'x-client-info': 'stock-easy-app@1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  // Active les logs réseau
  fetch: (...args) => {
    console.log('🌐 Supabase Fetch:', args[0]);
    return fetch(...args);
  }
});
```

## Support

Si le problème persiste après ces vérifications :

1. Exportez les résultats du composant de test (screenshot)
2. Partagez les logs de la console (F12)
3. Vérifiez les erreurs dans Supabase Dashboard > Logs
4. Contactez le support avec ces informations

---

**Date de création** : 12 novembre 2025  
**Dernière mise à jour** : 12 novembre 2025

