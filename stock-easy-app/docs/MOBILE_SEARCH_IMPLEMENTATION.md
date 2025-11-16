# Implémentation de la Barre de Recherche Mobile

## Vue d'ensemble

Cette documentation décrit l'implémentation de la barre de recherche mobile avec une icône de boussole (compass) intégrée dans le header mobile de l'application Stock Easy.

## Changements Effectués

### 1. Nouveau Composant SearchModal

**Fichier**: `src/components/SearchBar/SearchModal.jsx`

Un nouveau composant modal a été créé spécifiquement pour la recherche mobile avec les caractéristiques suivantes :

- **Animation d'ouverture/fermeture** : Utilise Framer Motion pour des transitions fluides
- **Navigation clavier complète** : Flèches haut/bas, Enter pour sélectionner, Échap pour fermer
- **Auto-focus** : Le champ de recherche reçoit automatiquement le focus à l'ouverture
- **Backdrop** : Overlay semi-transparent pour fermer le modal en cliquant à l'extérieur
- **Design responsive** : S'adapte à la hauteur de l'écran mobile

#### Props du SearchModal
```javascript
{
  isOpen: boolean,                    // État d'ouverture du modal
  onClose: Function,                  // Callback pour fermer le modal
  setActiveTab: Function,             // Navigation vers un onglet
  setParametersSubTab: Function,      // Navigation sous-onglet Paramètres
  setTrackTabSection: Function,       // Navigation sous-onglet Track
  setStockLevelSearch: Function,      // Filtrage dans Stock Level
  onSupplierSelect: Function          // Callback sélection fournisseur
}
```

### 2. Header Mobile

**Fichier**: `src/StockEasy.jsx`

Le header a été divisé en deux versions :

#### Desktop (md:flex et plus)
- Logo dans la zone sidebar (w-64)
- Barre de recherche centrée
- Notification bell et profil utilisateur à droite

#### Mobile (md:hidden)
- **Bouton Menu Hamburger** : Ouvre la sidebar mobile
- **Logo centré** : Affiché au centre du header
- **Icône Compass (Boussole)** : À gauche de la notification bell, ouvre le SearchModal
- **Notification Bell** : Affichée dans le header mobile

Structure du header mobile :
```
[Menu ☰]  [Logo]  [🧭 Compass] [🔔 Bell]
```

### 3. Modifications de la Sidebar

**Fichier**: `src/components/layout/Sidebar.jsx`

- **Ajout des props** : `mobileMenuOpen` et `setMobileMenuOpen` pour contrôler l'ouverture/fermeture
- **Suppression de la notification** : La notification n'est plus dans le menu mobile (elle est dans le header)
- **Ajout des sous-menus** : Les sous-menus sont maintenant affichés dans le menu mobile avec expansion/collapse

### 4. Modifications du SearchDropdown

**Fichier**: `src/components/SearchBar/SearchDropdown.jsx`

- **Nouvelle prop `isMobile`** : Permet d'adapter le style pour le contexte du modal
- **Positionnement conditionnel** : 
  - Desktop : `absolute` avec shadow et border
  - Mobile : `static` sans positionnement absolu (intégré au modal)

### 5. États Ajoutés

**Fichier**: `src/StockEasy.jsx`

```javascript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [searchModalOpen, setSearchModalOpen] = useState(false);
```

## Architecture

```
StockEasy.jsx
├── Header Desktop (hidden md:flex)
│   ├── Logo
│   ├── SearchBar (centrée)
│   └── Notifications + Profil
│
├── Header Mobile (md:hidden)
│   ├── Menu Button → ouvre Sidebar
│   ├── Logo (centré)
│   ├── Compass Icon → ouvre SearchModal
│   └── NotificationBell
│
├── SearchModal (Mobile uniquement)
│   ├── Header avec bouton retour
│   ├── Input de recherche
│   └── SearchDropdown (mode mobile)
│
└── Sidebar
    ├── Desktop (sidebar fixe)
    └── Mobile (overlay avec backdrop)
```

## Expérience Utilisateur

### Mobile
1. L'utilisateur voit le logo centré et les icônes de recherche et notification
2. En cliquant sur l'icône boussole (🧭), un modal plein écran s'ouvre
3. Le champ de recherche reçoit automatiquement le focus
4. Les résultats s'affichent en temps réel pendant la saisie
5. L'utilisateur peut :
   - Naviguer avec les flèches du clavier
   - Sélectionner avec Enter
   - Fermer avec Échap ou le bouton retour
   - Fermer en cliquant sur le backdrop

### Desktop
- Comportement inchangé : barre de recherche toujours visible dans le header

## Icône Utilisée

**Compass de lucide-react** : Symbolise la navigation et la découverte, parfaitement adaptée pour une fonction de recherche globale.

## Tests Recommandés

1. ✅ Ouverture/fermeture du modal de recherche mobile
2. ✅ Navigation clavier dans les résultats
3. ✅ Sélection d'un résultat et navigation vers la bonne section
4. ✅ Responsive : vérifier sur différentes tailles d'écran
5. ✅ Performance : tester avec beaucoup de résultats

## Compatibilité

- **Breakpoint mobile** : `md:hidden` (< 768px)
- **Breakpoint desktop** : `md:flex` (≥ 768px)
- **Navigateurs** : Tous les navigateurs modernes supportant ES6+ et CSS Grid/Flexbox

## Améliorations Futures

1. Ajouter des raccourcis clavier globaux (ex: Cmd+K pour ouvrir la recherche)
2. Historique de recherche persistent
3. Suggestions de recherche basées sur les tendances
4. Voice search pour mobile
5. Recherche offline avec cache

## Fichiers Modifiés

- ✅ `src/components/SearchBar/SearchModal.jsx` (nouveau)
- ✅ `src/components/SearchBar/index.js` (export ajouté)
- ✅ `src/components/SearchBar/SearchDropdown.jsx` (prop isMobile)
- ✅ `src/StockEasy.jsx` (header mobile + états)
- ✅ `src/components/layout/Sidebar.jsx` (props menu mobile)

---

**Date de création** : 16 novembre 2025  
**Auteur** : Équipe Stock Easy  
**Version** : 1.0.0

