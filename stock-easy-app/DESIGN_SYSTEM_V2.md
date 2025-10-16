# 🎨 Stock Easy - Design System V2

## Vue d'ensemble

Redesign complet de l'interface Stock Easy avec une approche moderne, accessible et performante basée sur les meilleures pratiques UI/UX 2024-2025.

---

## 🚀 Nouvelles fonctionnalités

### ✨ Navigation modernisée
- **Sidebar latérale** : Navigation principale avec icônes et labels
- **Collapsible** : Réduire la sidebar pour gagner de l'espace
- **Mobile responsive** : Menu burger avec drawer animé sur mobile
- **Indicateur visuel** : État actif clairement identifié

### 🌙 Mode sombre natif
- Toggle dark/light mode dans le header
- Palette de couleurs optimisée pour les deux modes
- Transition fluide entre les modes
- Préférence mémorisée (à implémenter)

### 📱 Responsive design amélioré
- Mobile-first : Design optimisé pour toutes les tailles d'écran
- Breakpoints : 320px (mobile) / 768px (tablet) / 1024px (desktop)
- Touch-friendly : Zones de clic ≥ 44x44px
- Sidebar cachée sur mobile avec menu drawer

### ♿ Accessibilité WCAG 2.1 AA
- Navigation au clavier complète
- Attributs ARIA appropriés
- Contraste de couleurs ≥ 4.5:1 pour le texte
- Focus visible sur tous les éléments interactifs
- Textes alternatifs et labels explicites

---

## 🎨 Design System

### Palette de couleurs

#### Primary (Indigo)
```css
--primary-50: #eef2ff
--primary-500: #6366f1  /* Couleur principale */
--primary-600: #4f46e5  /* Hover states */
--primary-700: #4338ca  /* Active states */
```

#### Success (Emerald)
```css
--success-500: #10b981  /* États positifs */
--success-600: #059669  /* Hover */
```

#### Warning (Amber)
```css
--warning-500: #f59e0b  /* Alertes */
--warning-600: #d97706  /* Hover */
```

#### Danger (Rose)
```css
--danger-500: #f43f5e   /* Erreurs/Urgences */
--danger-600: #e11d48   /* Hover */
```

#### Neutral (Slate)
```css
--neutral-50: #f8fafc   /* Backgrounds clairs */
--neutral-900: #0f172a  /* Textes sombres */
--neutral-950: #020617  /* Backgrounds dark mode */
```

### Typographie

**Font stack** :
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', 'Arial', sans-serif;
```

**Scale** :
- Titres principaux : `text-xl` (1.25rem / 20px)
- Titres secondaires : `text-lg` (1.125rem / 18px)
- Corps de texte : `text-sm` (0.875rem / 14px)
- Texte secondaire : `text-xs` (0.75rem / 12px)

### Spacing (système 8pt)
- `gap-2` : 8px
- `gap-3` : 12px
- `gap-4` : 16px
- `gap-6` : 24px
- `gap-8` : 32px

### Border Radius
- Cards : `rounded-xl` (12px)
- Boutons : `rounded-lg` (8px)
- Badges : `rounded-full`

### Shadows
- **Soft** : Cards au repos
- **Medium** : Cards hover
- **Large** : Modals et dropdowns

---

## 🧩 Composants

### Boutons

#### Variants
```jsx
// Primary - Actions principales
<button className="btn btn-primary">Commander</button>

// Success - Actions positives
<button className="btn btn-success">Valider</button>

// Danger - Actions destructives
<button className="btn btn-danger">Supprimer</button>

// Outline - Actions secondaires
<button className="btn btn-outline">Annuler</button>

// Ghost - Actions tertiaires
<button className="btn btn-ghost">Voir plus</button>
```

#### Sizes
- `sm` : Petits boutons (tables, cards)
- `md` : Taille standard (défaut)
- `lg` : Boutons d'action principaux

### Cards

```jsx
// Card simple
<div className="card p-6">...</div>

// Card avec hover effect
<div className="card card-hover p-6">...</div>

// Card avec glassmorphism
<div className="glass p-6">...</div>
```

### Inputs

```jsx
<input 
  type="text" 
  className="input" 
  placeholder="Rechercher..."
  aria-label="Recherche de produits"
/>
```

### Badges

```jsx
<span className="badge badge-success">En stock</span>
<span className="badge badge-warning">Stock faible</span>
<span className="badge badge-danger">Rupture</span>
<span className="badge badge-primary">Nouveau</span>
```

### Modal

```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Titre de la modal"
  footer={<>Actions...</>}
>
  Contenu...
</Modal>
```

---

## 📐 Layout

### Structure globale

```
┌─────────────────────────────────────┐
│          Sidebar (280px)            │
│  ┌─────────────────────────────┐   │
│  │         Header (64px)       │   │
│  ├─────────────────────────────┤   │
│  │                             │   │
│  │      Main Content Area      │   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Sidebar
- **Desktop** : Visible, 280px (expanded) ou 80px (collapsed)
- **Mobile** : Cachée, accessible via menu burger
- **Transition** : Animation fluide 300ms

### Content area
- Max-width : 1280px (7xl)
- Padding : 16px (mobile) / 24px (tablet) / 32px (desktop)
- Grid : 1 col (mobile) / 2 cols (desktop)

---

## 🎭 Animations

### Transitions
```css
/* Standard */
transition: all 0.2s ease-out;

/* Hover effects */
hover:scale-105 transition-transform

/* Modal entrance */
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
```

### Keyframes personnalisées
- `fadeIn` : Apparition en fondu
- `scaleIn` : Apparition avec zoom
- `slideInRight` : Glissement depuis la droite
- `slideOutRight` : Glissement vers la droite

---

## 🌗 Dark Mode

### Implémentation

```jsx
// Toggle dans le header
<button onClick={() => setDarkMode(!darkMode)}>
  {darkMode ? <Sun /> : <Moon />}
</button>

// Effect pour appliquer la classe
useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [darkMode]);
```

### Classes utilitaires
- Background : `bg-white dark:bg-neutral-900`
- Texte : `text-neutral-900 dark:text-white`
- Bordures : `border-neutral-200 dark:border-neutral-800`

---

## ♿ Accessibilité

### Navigation au clavier
- **Tab** : Navigation entre les éléments
- **Enter/Space** : Activation des boutons
- **Escape** : Fermeture des modals/dropdowns
- **Arrow keys** : Navigation dans les menus

### Attributs ARIA
```jsx
// Boutons avec icône uniquement
<button aria-label="Synchroniser" title="Synchroniser">
  <RefreshCw />
</button>

// Navigation
<nav aria-label="Navigation principale">
  <button aria-current={isActive ? 'page' : undefined}>
    Dashboard
  </button>
</nav>

// Modals
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h3 id="modal-title">Titre</h3>
</div>
```

### Contraste de couleurs
- Texte normal : ≥ 4.5:1
- Texte large (≥18px ou gras ≥14px) : ≥ 3:1
- Éléments UI : ≥ 3:1

### Focus visible
Tous les éléments interactifs ont un état focus visible :
```css
focus:outline-none focus:ring-2 focus:ring-primary-500
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first */
/* 320px - 767px : Mobile */
.container { padding: 1rem; }

/* 768px - 1023px : Tablet */
@media (min-width: 768px) {
  .container { padding: 1.5rem; }
}

/* 1024px+ : Desktop */
@media (min-width: 1024px) {
  .container { padding: 2rem; }
  .sidebar { display: flex; }
}
```

### Grid responsive
```jsx
// 1 colonne sur mobile, 2 sur desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card />
  <Card />
</div>
```

---

## 🚀 Performance

### Optimisations CSS
- Utilisation de classes utilitaires Tailwind (purge CSS automatique)
- Animations GPU-accelerated (`transform`, `opacity`)
- Évitement des propriétés coûteuses (`box-shadow` avec modération)

### Optimisations React
- `AnimatePresence` pour animations de montage/démontage
- Conditional rendering pour réduire le DOM
- `useMemo` et `useCallback` pour éviter re-renders

### Bundle size
- Icônes tree-shakeable (Lucide React)
- Import sélectif des composants
- CSS purgé en production

---

## 🎯 Meilleures pratiques

### Do's ✅
- Utiliser les classes utilitaires du design system
- Respecter la palette de couleurs
- Maintenir la cohérence des espacements (8pt grid)
- Toujours tester en mode sombre
- Vérifier l'accessibilité (navigation clavier, contrastes)
- Utiliser les composants réutilisables

### Don'ts ❌
- Ne pas créer de couleurs custom en dehors de la palette
- Éviter les valeurs arbitraires de spacing (utiliser le système 8pt)
- Ne pas oublier les états hover/focus/active
- Éviter les animations trop longues (max 300ms)
- Ne pas négliger les petits écrans

---

## 🔄 Migration depuis V1

### Changements principaux

1. **Navigation**
   - ❌ Barre horizontale → ✅ Sidebar verticale
   - ❌ Beige/Noir → ✅ Indigo/Slate

2. **Couleurs**
   - ❌ `bg-[#F0F0EB]` → ✅ `bg-neutral-50 dark:bg-neutral-950`
   - ❌ `text-[#191919]` → ✅ `text-neutral-900 dark:text-white`
   - ❌ `bg-[#EF1C43]` → ✅ `bg-danger-500`

3. **Composants**
   - ❌ Classes inline complexes → ✅ Classes utilitaires du design system
   - Exemple : `bg-black text-white hover:bg-[#333]` → `btn btn-primary`

4. **Responsive**
   - ✅ Menu mobile drawer ajouté
   - ✅ Sidebar collapsible
   - ✅ Grids adaptatifs

---

## 📚 Resources

### Outils de design
- **Tailwind CSS** : Framework CSS utilitaire
- **Lucide Icons** : Icônes open-source
- **Framer Motion** : Animations React
- **Sonner** : Toast notifications

### Références
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Color Tool](https://material.io/resources/color/)
- [Coolors - Palette Generator](https://coolors.co/)

---

## 🎉 Résumé des améliorations

✅ **Design moderne** : Interface épurée et professionnelle  
✅ **Dark mode** : Support complet du mode sombre  
✅ **Responsive** : Expérience optimale sur tous les devices  
✅ **Accessibilité** : WCAG 2.1 AA compliant  
✅ **Performance** : Animations fluides et bundle optimisé  
✅ **Maintenabilité** : Design system cohérent et documenté  
✅ **UX améliorée** : Navigation intuitive et micro-interactions  

---

**Version** : 2.0  
**Date** : Octobre 2025  
**Auteur** : UI/UX Design Team
