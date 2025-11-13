# 🚀 Guide Rapide - Tester la connexion Supabase

## ⚡ En 5 minutes

### Étape 1 : Appliquer la migration SQL (OBLIGATOIRE)

1. Ouvrez **Supabase Dashboard** : https://supabase.com
2. Allez dans **SQL Editor** (menu de gauche)
3. Cliquez sur **New Query**
4. Ouvrez le fichier : `supabase/migrations/010_implement_update_parameter.sql`
5. Copiez tout le contenu et collez-le dans SQL Editor
6. Cliquez sur **Run** (ou Ctrl+Enter)
7. Vérifiez que vous voyez : ✅ `Fonction update_parameter implémentée et testée avec succès`

### Étape 2 : Tester via l'interface

1. Démarrez l'app :
   ```bash
   cd /Users/orioncorp/stock-easy-app/stock-easy-app
   npm run dev
   ```

2. Connectez-vous à votre compte

3. Allez sur : **http://localhost:5173/test-supabase**

4. Cliquez sur **"Lancer les tests"**

5. Tous les tests doivent être **VERTS** ✅

### Étape 3 : Test dans l'interface normale

1. Allez dans **Paramètres** (menu latéral)
2. Cliquez sur **Paramètres Généraux**
3. Changez la devise ou un autre paramètre
4. Cliquez sur **"Enregistrer les paramètres"**
5. Vous devez voir : **"✅ Paramètres sauvegardés avec succès !"**
6. Rechargez la page (F5)
7. Les modifications doivent être conservées

### Étape 4 : Vérifier dans Supabase

1. Dans Supabase Dashboard → **Table Editor**
2. Ouvrez la table **`parametres`**
3. Vérifiez que les valeurs correspondent à ce que vous avez sauvegardé
4. La colonne `updated_at` doit être récente

---

## ✅ C'est tout !

Si tous les tests sont verts et que les paramètres se sauvegardent, **le problème est résolu** ! 🎉

---

## ❌ En cas de problème

### Test rouge : "RPC update_parameter"

➡️ **La migration SQL n'a pas été appliquée**  
Solution : Retournez à l'Étape 1

### Test rouge : "Lecture table parametres"

➡️ **Problème de permissions RLS**  
Solution : Dans SQL Editor, exécutez :

```sql
CREATE POLICY "auth_parameters_all" 
  ON public.parametres 
  FOR ALL 
  USING (auth.role() = 'authenticated');
```

### Les tests passent mais les données ne changent pas

➡️ **Cache du navigateur**  
Solution : Ctrl+Shift+R (rechargement forcé)

### Variables d'environnement manquantes

➡️ **Fichier .env.local absent**  
Solution : Créez `.env.local` avec :

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxx
```

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- **RAPPORT_TEST_SUPABASE.md** - Rapport complet avec toutes les modifications
- **DIAGNOSTIC_SUPABASE.md** - Guide de diagnostic approfondi
- **supabase/VERIFICATION_PARAMETRES.sql** - Script SQL de vérification

---

## 📞 Besoin d'aide ?

Si le problème persiste après avoir suivi ces étapes :

1. Faites un screenshot de la page `/test-supabase`
2. Ouvrez la console (F12) et copiez les erreurs
3. Vérifiez les logs dans Supabase Dashboard → Logs
4. Partagez ces informations

---

**Bonne chance ! 🍀**

