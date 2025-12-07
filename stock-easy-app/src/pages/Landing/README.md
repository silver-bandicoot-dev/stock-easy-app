# Landing Page Stockeasy

## 📖 Vue d'ensemble

Landing page optimisée pour la conversion et le SEO selon les meilleures pratiques SaaS B2B.

## 🎯 Objectifs

- **Taux de conversion** : 7-10% (vs 3.8% moyenne SaaS)
- **SEO** : Positionnement sur "gestion stock shopify", "inventory management shopify", "gestión inventario shopify"
- **Tone** : Professionnel, orienté résultats, empathique

## 📂 Structure des composants

```
Landing/
├── index.jsx              # Orchestrateur principal
├── Landing.css            # Styles globaux
├── components/
│   ├── Navbar.jsx         # Navigation
│   ├── Hero.jsx           # Section héro optimisée
│   ├── Partners.jsx       # Logos partenaires
│   ├── PainPoints.jsx     # 🆕 Section pain points
│   ├── Solution.jsx       # 🆕 Section solution (3 blocs)
│   ├── Features.jsx       # Fonctionnalités détaillées
│   ├── HowItWorks.jsx     # Étapes d'installation
│   ├── Testimonials.jsx   # Témoignages clients
│   ├── Pricing.jsx        # Tarification optimisée
│   ├── FAQ.jsx            # 🆕 Questions fréquentes
│   ├── CTA.jsx            # CTA final avec urgence
│   └── Footer.jsx         # Pied de page
└── README.md              # Ce fichier
```

## 🆕 Nouveaux composants

### PainPoints.jsx
**Objectif :** Créer l'urgence en identifiant les douleurs

**Structure :**
- 3 colonnes (Ruptures / Surstock / Temps perdu)
- Chiffres concrets : "15-20% de CA", "200+ heures/an"
- Icônes visuelles : 💸 📦 ⏰

### Solution.jsx
**Objectif :** Montrer comment Stockeasy résout chaque pain point

**Structure :**
- 3 blocs alternés (texte/visuel)
- Chaque bloc = 1 pilier de valeur
- Mockups interactifs avec animations

**Blocs :**
1. **Ne perdez plus jamais une vente** (Prédictions IA)
2. **Libérez votre trésorerie** (Optimisation)
3. **Gagnez 4h/semaine** (Automatisation)

### FAQ.jsx
**Objectif :** Répondre aux objections avant achat

**Structure :**
- Accordéon interactif
- 7 questions clés
- CTA contact sous la FAQ

**Questions :**
- Compatibilité Shopify
- Temps de setup (15 min)
- Fin d'essai
- Sécurité (RGPD)
- Import fournisseurs
- Précision IA
- Annulation

## 🎨 Design System

### Couleurs principales
```css
--primary: #191919;      /* Noir principal */
--cream: #FAFAF7;        /* Fond crème */
--border: #E5E4DF;       /* Bordures */
--accent-green: #10B981; /* Succès/IA */
--accent-blue: #2563EB;  /* Info */
```

### Composants réutilisables
```css
.card                    /* Carte avec bordure */
.btn-primary            /* Bouton principal noir */
.btn-secondary          /* Bouton secondaire blanc */
.badge                  /* Badge de fonctionnalité */
```

## 📱 Responsive

- **Mobile-first** : 70% du trafic Shopify
- Breakpoints :
  - Mobile : < 768px
  - Tablet : 768px - 1024px
  - Desktop : > 1024px

## 🌍 Multilingue

### Langues supportées
- 🇫🇷 Français (défaut)
- 🇬🇧 Anglais
- 🇪🇸 Espagnol

### Fichiers de traduction
```
src/locales/
├── fr/translation.json
├── en/translation.json
└── es/translation.json
```

### Structure des clés
```json
{
  "landing": {
    "hero": { ... },
    "painPoints": { ... },
    "solution": { ... },
    "features": { ... },
    "pricing": { ... },
    "faq": { ... },
    "cta": { ... }
  }
}
```

## 🔍 SEO

### Meta tags (index.html)
```html
<!-- Title (58 caractères) -->
<title>Gestion Stock Shopify avec IA | Stockeasy - Essai Gratuit</title>

<!-- Description (155 caractères) -->
<meta name="description" content="Sync temps réel Shopify, prédictions IA, alertes anti-rupture. Optimisez votre stock en 15 min. Essai gratuit 14 jours." />

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Stockeasy",
  "offers": { "price": "29", "priceCurrency": "USD" }
}
</script>
```

### Mots-clés cibles

**Français :**
- Primaires : gestion stock shopify, prévision stock
- Long-tail : éviter rupture stock shopify

**Anglais :**
- Primaires : shopify inventory management, stock prediction
- Long-tail : prevent stockout shopify

**Espagnol :**
- Primaires : gestión inventario shopify, predicción stock
- Long-tail : evitar rotura stock shopify

## 📊 KPIs & Métriques

### Métriques produit affichées
- "5,000+ commandes fournisseurs gérées"
- "1,2M€ de stock optimisé"
- "50+ boutiques ce mois-ci"

### Chiffres clés pain points
- "15-20% de CA perdu" (ruptures)
- "200+ heures/an" (temps perdu)
- "75% précision IA" (après 30 jours)

### Price anchoring
- "60-400€/mois" (concurrents)
- "29€/mois = 2 cafés/jour" (Stockeasy)

## 🎯 Copywriting Best Practices

### H1 (Hero)
✅ "Ne perdez plus jamais une vente pour stock épuisé"
❌ "Application de gestion de stock avec IA"

**Règle :** Bénéfice, pas feature. 5-7 mots max.

### CTAs
✅ "Démarrer l'essai gratuit"
✅ "Commencer maintenant"
❌ "S'inscrire"
❌ "En savoir plus"

**Règle :** Action-oriented, réduction risque (gratuit).

### Subheadlines
- 1-2 phrases max
- Développer la value proposition
- Mentionner les USPs clés

### Tone of Voice
- **Professionnel** mais accessible
- **Orienté résultats** (business avant tech)
- **Rassurant** (essai gratuit, support)
- **Direct** (phrases courtes)
- **Empathique** (comprend les douleurs)

## 🚀 USPs (Unique Selling Points)

1. **Sync Shopify temps réel** (vs imports manuels concurrents)
2. **Connexion directe fournisseurs** (envoyer emails depuis app)
3. **Prédictions IA** (ML pour quoi/quand commander)
4. **Workflow réconciliation** (facile quand commande arrive)
5. **MOQ niveau produit** (gestion fine contraintes)

## 🎬 Animations

Toutes les sections utilisent **Framer Motion** :

```jsx
// Apparition au scroll
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
>
```

**Éléments animés :**
- Apparition sections (scroll)
- Badges flottants (floating)
- Accordéon FAQ (expand/collapse)
- Stats (count-up)

## 📋 Checklist avant déploiement

- [ ] Images optimisées (WebP)
- [ ] Screenshots dashboard réels
- [ ] Video demo Hero
- [ ] Témoignages clients réels
- [ ] Tests A/B H1 (3 variantes)
- [ ] Exit-intent popup
- [ ] Analytics setup (Plausible/GA4)
- [ ] Heatmaps (Hotjar)

## 🔗 Liens utiles

- [Prompt complet d'optimisation](../../docs/prompt_landing_page_stockeasy_FINAL.md)
- [Changelog détaillé](../../docs/changelogs/LANDING_PAGE_OPTIMIZATION_2025.md)
- [Stratégie SEO](../../docs/seo/)
- [Guide multilingue](../../docs/guides/i18n.md)

## 📞 Support

Pour toute question sur la landing page :
- **Email :** contact@stockeasy.app
- **Docs :** `/docs/`
- **Issues :** GitHub Issues

---

**Dernière mise à jour :** 7 décembre 2025  
**Version :** 2.0 (optimisée conversion)

