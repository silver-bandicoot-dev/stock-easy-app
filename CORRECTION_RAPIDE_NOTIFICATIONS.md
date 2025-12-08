# ⚡ Correction Rapide : Notifications "Invalid Date"

## 🎯 Problème Identifié

Vos notifications affichent "Invalid Date" car la fonction SQL `get_grouped_notifications` a été écrasée dans une migration précédente, cassant le champ de date.

## 🔧 Solution en 3 Étapes

### Étape 1 : Appliquer la Migration SQL ⚡

**Via le Dashboard Supabase** (le plus rapide) :

1. Allez sur [supabase.com](https://supabase.com) → Votre projet
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier :
   ```
   stock-easy-app/supabase/migrations/093_fix_grouped_notifications_function.sql
   ```
5. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)
6. ✅ Vous devriez voir "Success. No rows returned"

**OU via CLI** :
```bash
cd stock-easy-app
supabase db push
```

### Étape 2 : Redéployer le Frontend ⚡

Les fichiers frontend ont déjà été corrigés dans votre code local. Ils seront déployés automatiquement lors du prochain push Git, ou manuellement :

```bash
cd stock-easy-app
git add .
git commit -m "fix: Correction notifications Invalid Date"
git push origin main
```

Vercel redéploiera automatiquement l'application.

### Étape 3 : Vérifier ✅

1. Rechargez votre application StockEasy
2. Cliquez sur la cloche de notifications (🔔)
3. Les dates devraient maintenant s'afficher correctement :
   - "À l'instant"
   - "Il y a 5 min"
   - "Il y a 2h"
   - "Il y a 3j"

## 🔍 Si le Problème Persiste

1. **Vider le cache du navigateur** :
   - Chrome/Edge : `Ctrl+Shift+Delete` → Cocher "Cached images and files" → Clear
   - Ou mode incognito : `Ctrl+Shift+N`

2. **Vérifier la console navigateur** (F12) :
   - Pas d'erreurs "Date invalide reçue"
   - Si erreurs, prendre une capture d'écran

3. **Tester la fonction SQL directement** :
   ```sql
   SELECT * FROM get_grouped_notifications(10);
   ```
   Vérifier que `latest_created_at` contient des valeurs valides.

## 📚 Documentation Complète

Pour comprendre en détail le problème et la solution :
- 📄 `docs/guides/DEBUG_NOTIFICATIONS_INVALID_DATE.md`
- 📄 `docs/NOTIFICATIONS_INVALID_DATE_FIX.md`

## ⏱️ Temps Estimé

- **Étape 1** : 2 minutes
- **Étape 2** : 1 minute (+ temps de build Vercel ~3 min)
- **Étape 3** : 30 secondes

**Total** : ~5-7 minutes ⚡

---

**Note** : Les corrections frontend incluent maintenant des validations robustes pour éviter ce genre de problème à l'avenir, même si la base de données retourne des données invalides.

