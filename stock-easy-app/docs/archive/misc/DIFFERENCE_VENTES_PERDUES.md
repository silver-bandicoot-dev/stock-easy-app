# 📊 Différence entre "Ventes Perdues Estimées" (Dashboard) et "Ventes Perdues - Rupture de Stock" (Analytics)

## ⚠️ IMPORTANT : Ce sont deux indicateurs DIFFÉRENTS !

Beaucoup d'utilisateurs sont confus car ils voient deux valeurs différentes pour "Ventes Perdues" dans l'application. **C'est normal et intentionnel** - les deux mesurent des choses différentes.

---

## 🎯 Résumé Rapide

| Indicateur | Où ? | Que mesure-t-il ? | Quand l'utiliser ? |
|------------|------|-------------------|-------------------|
| **Ventes Perdues Estimées** | Dashboard | Tous les produits à risque (rupture actuelle + rupture future) | Pour ANTICIPER et AGIR avant la rupture |
| **Ventes Perdues - Rupture de Stock** | Analytics | Uniquement les produits EN RUPTURE TOTALE (stock = 0) | Pour MESURER les pertes réelles actuelles |

---

## 📍 1. Ventes Perdues Estimées (Dashboard)

### Où le trouver ?
- **Dashboard** → Section "Indicateurs clés"

### Que mesure-t-il ?
**TOUS les produits à risque**, même ceux qui ont encore du stock mais pas assez.

### Inclut :
1. ✅ Produits **déjà en rupture** (stock = 0)
2. ✅ Produits **qui vont manquer bientôt** (autonomie < stock de sécurité)

### Exemple concret :

**Produit A :**
- Stock actuel : 20 unités
- Ventes/jour : 5 unités
- Stock de sécurité : 10 unités (2 jours)
- Autonomie : 20 ÷ 5 = **4 jours**
- Statut : **URGENT** (car 4 jours < 2 jours de sécurité ? Non, mais si `daysOfStock < securityStockDays`)

**Calcul :**
- Jours en rupture estimés = `max(0, 7 - 4) = 3 jours`
- Ventes perdues = `3 × 5 × 50€ = 750€`

**Produit B :**
- Stock actuel : **0 unités** (rupture totale)
- Ventes/jour : 10 unités
- Ventes perdues = `7 × 10 × 50€ = 3 500€`

**Total Dashboard :** 750€ + 3 500€ = **4 250€**

### Pourquoi cette approche ?
- 🎯 **Vision proactive** : Vous voyez les problèmes AVANT qu'ils arrivent
- ⚡ **Action rapide** : Vous pouvez commander avant la rupture totale
- 📈 **Prévention** : Évite les ruptures en anticipant

---

## 📍 2. Ventes Perdues - Rupture de Stock (Analytics)

### Où le trouver ?
- **Analytics** → Section "KPIs Principaux"

### Que mesure-t-il ?
**UNIQUEMENT les produits EN RUPTURE TOTALE** (stock = 0).

### Inclut :
1. ✅ Produits **déjà en rupture** (stock = 0)
2. ❌ Produits à risque (avec stock) : **EXCLUS**

### Exemple concret (même scénario) :

**Produit A :**
- Stock actuel : 20 unités
- **EXCLU** (car stock > 0)

**Produit B :**
- Stock actuel : **0 unités** (rupture totale)
- Ventes/jour : 10 unités
- Ventes perdues = `7 × 10 × 50€ = 3 500€`

**Total Analytics :** **3 500€**

### Pourquoi cette approche ?
- 📊 **Vision factuelle** : Mesure les pertes RÉELLES actuelles
- 📈 **Analyse historique** : Permet de comparer avec les périodes précédentes
- 🎯 **Précision** : Compte uniquement ce qui est vraiment perdu maintenant

---

## 🔍 Comparaison Visuelle

```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD - Ventes Perdues Estimées                    │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Produit A : 20 unités (4 jours) → URGENT → 750€        │
│  Produit B : 0 unités (rupture) → 3 500€               │
│  ─────────────────────────────────────────────────────  │
│  TOTAL : 4 250€                                         │
│                                                          │
│  💡 "Combien vais-je perdre si je ne fais rien ?"      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ANALYTICS - Ventes Perdues - Rupture de Stock         │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Produit A : 20 unités (4 jours) → EXCLU               │
│  Produit B : 0 unités (rupture) → 3 500€               │
│  ─────────────────────────────────────────────────────  │
│  TOTAL : 3 500€                                         │
│                                                          │
│  💡 "Combien est-ce que je perds MAINTENANT ?"         │
└─────────────────────────────────────────────────────────┘
```

---

## ❓ Questions Fréquentes

### Q1 : Pourquoi deux valeurs différentes ?

**R :** Parce qu'elles servent des objectifs différents :
- **Dashboard** = Anticipation et action préventive
- **Analytics** = Mesure factuelle et analyse historique

### Q2 : Laquelle est la "vraie" valeur ?

**R :** Les deux sont vraies, mais mesurent des choses différentes :
- Dashboard = "Combien vais-je perdre si je ne fais rien ?"
- Analytics = "Combien est-ce que je perds maintenant ?"

### Q3 : Laquelle dois-je utiliser ?

**R :** Utilisez les deux selon votre besoin :
- **Dashboard** : Pour décider quelles commandes passer maintenant
- **Analytics** : Pour analyser l'évolution de vos ruptures dans le temps

### Q4 : Pourquoi le Dashboard est-il toujours plus élevé ?

**R :** Parce qu'il inclut les produits à risque (qui ont encore du stock mais pas assez), en plus des ruptures réelles. C'est normal et souhaitable pour une vision proactive.

---

## 💡 Conseils d'Utilisation

### Utilisez le Dashboard quand :
- ✅ Vous voulez savoir quels produits commander maintenant
- ✅ Vous voulez anticiper les problèmes avant qu'ils arrivent
- ✅ Vous planifiez vos commandes de la semaine

### Utilisez Analytics quand :
- ✅ Vous voulez mesurer l'impact réel des ruptures actuelles
- ✅ Vous analysez l'évolution de vos ruptures dans le temps
- ✅ Vous comparez vos performances avec les périodes précédentes

---

## 📝 Formules Détaillées

### Dashboard - Ventes Perdues Estimées
```
Pour chaque produit avec healthStatus = 'urgent' :
  daysOutOfStock = max(0, 7 - daysOfStock)
  ventesPerdues = daysOutOfStock × salesPerDay × sellPrice
```

### Analytics - Ventes Perdues - Rupture de Stock
```
Pour chaque produit avec stock = 0 :
  ventesPerdues = 7 × salesPerDay × sellPrice
```

---

## 🎯 Conclusion

Les deux indicateurs sont **complémentaires** et **nécessaires** :
- **Dashboard** = Vision proactive pour agir
- **Analytics** = Vision factuelle pour analyser

Ne vous inquiétez pas si les valeurs sont différentes - c'est normal et intentionnel ! 🎯

