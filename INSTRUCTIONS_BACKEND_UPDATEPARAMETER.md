# 🔧 Instructions: Ajouter la fonction updateParameter au Backend Google Apps Script

## ❌ Erreur actuelle

Vous rencontrez l'erreur suivante lors de la sauvegarde des paramètres:
```
Erreur lors de la sauvegarde: Action non reconnue
```

## ✅ Solution

Cette erreur signifie que votre Google Apps Script ne reconnaît pas l'action `updateParameter`. Vous devez ajouter cette fonction à votre script.

---

## 📝 Étapes à suivre

### 1. Ouvrir votre Google Apps Script

1. Ouvrez votre Google Sheets (celui qui contient les données Stock Easy)
2. Allez dans **Extensions** > **Apps Script**
3. Vous devriez voir votre fichier `Code.gs`

### 2. Vérifier la feuille "Parametres"

Avant de modifier le code, assurez-vous que votre Google Sheets contient une feuille nommée **"Parametres"** avec cette structure:

| Parametre | Valeur |
|-----------|--------|
| SeuilSurstockProfond | 90 |
| DeviseDefaut | EUR |
| MultiplicateurDefaut | 1.2 |

**Si cette feuille n'existe pas:**
1. Créez une nouvelle feuille
2. Nommez-la **"Parametres"** (exactement comme ça, avec majuscule)
3. Ajoutez les colonnes et valeurs comme ci-dessus

### 3. Ajouter la fonction `updateParameter`

Ajoutez cette fonction dans votre `Code.gs`:

```javascript
/**
 * Met à jour un paramètre dans la feuille Parametres
 * @param {string} paramName - Nom du paramètre
 * @param {any} value - Nouvelle valeur
 */
function updateParameter(paramName, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Parametres');
  
  if (!sheet) {
    return { success: false, error: 'Feuille Parametres introuvable' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Chercher le paramètre et le mettre à jour
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === paramName) {
      sheet.getRange(i + 1, 2).setValue(value);
      Logger.log(`✅ Paramètre ${paramName} mis à jour: ${value}`);
      return { success: true };
    }
  }
  
  // Si le paramètre n'existe pas, l'ajouter
  sheet.appendRow([paramName, value]);
  Logger.log(`✅ Nouveau paramètre ${paramName} créé: ${value}`);
  return { success: true };
}
```

### 4. Modifier la fonction `doPost`

Trouvez votre fonction `doPost` et ajoutez le cas `updateParameter` dans le `switch`:

```javascript
function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  
  try {
    let result;
    
    switch (action) {
      // ... vos autres cases existants ...
      
      case 'updateParameter':
        result = updateParameter(data.paramName, data.value);
        break;
      
      // ... autres cases ...
      
      default:
        result = { error: 'Action non reconnue: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 5. Sauvegarder et redéployer

1. Cliquez sur **Fichier** > **Enregistrer** (ou Ctrl+S)
2. Cliquez sur **Déployer** > **Gérer les déploiements**
3. Cliquez sur l'icône ✏️ (modifier) sur votre déploiement actif
4. Changez la **version** à **Nouvelle version**
5. Cliquez sur **Déployer**
6. Copiez l'URL du déploiement si elle change

---

## 🧪 Tester

1. Retournez sur votre application Stock Easy
2. Allez dans **Paramètres** > **Paramètres Généraux**
3. Modifiez le **Multiplicateur par défaut** (par exemple, changez 1.2 à 1.3)
4. Cliquez sur **Enregistrer les paramètres**
5. Vous devriez voir: ✅ **"Paramètres sauvegardés avec succès!"**

---

## ❓ En cas de problème

### Erreur "Feuille Parametres introuvable"

➡️ Vérifiez que:
- La feuille s'appelle exactement **"Parametres"** (avec majuscule au P)
- L'orthographe est correcte
- La feuille n'est pas masquée

### L'erreur persiste après déploiement

➡️ Assurez-vous de:
- Avoir bien créé une **nouvelle version** du déploiement
- Avoir actualisé la page de l'application (F5 ou Ctrl+R)
- Vider le cache du navigateur si nécessaire

### Comment voir les logs

1. Dans Google Apps Script, cliquez sur **Affichage** > **Logs**
2. Ou allez dans **Exécutions** pour voir l'historique
3. Les messages `Logger.log()` s'afficheront ici

---

## 📚 Référence complète

Pour voir toutes les fonctions nécessaires au backend, consultez le fichier:
- `GOOGLE_APPS_SCRIPT_BACKEND_V1.md`
- `CORRECTIONS_BACKEND_GOOGLE_APPS_SCRIPT.md`

Ces fichiers contiennent toutes les fonctions à ajouter pour supporter les fonctionnalités avancées de Stock Easy.

---

## 🎯 Résultat attendu

Une fois ces modifications appliquées:
- ✅ Vous pouvez modifier le multiplicateur par défaut
- ✅ Vous pouvez changer la devise (EUR, USD, GBP, CAD)
- ✅ Vous pouvez ajuster le seuil de surstock profond
- ✅ Tous les changements sont sauvegardés dans Google Sheets
- ✅ Les paramètres sont conservés après rechargement de la page

---

**Dernière mise à jour:** 2025-10-16  
**Version:** 1.0
