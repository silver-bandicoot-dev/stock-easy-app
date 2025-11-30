# Pages Légales StockEasy - Documentation Complète

## Vue d'ensemble

Ce document décrit le système complet de pages légales implémenté pour StockEasy, conforme aux meilleures pratiques des SaaS et aux réglementations RGPD/CNIL.

## Pages Créées

### 1. Mentions Légales (`/legal/notices`)

**Fichier**: `/src/pages/Legal/LegalNotices.jsx`

**Contenu**:
- ✅ Identification de l'éditeur (StockEasy SAS)
- ✅ Forme juridique, capital social, siège social
- ✅ Numéros RCS et TVA intracommunautaire
- ✅ Coordonnées de contact (email, site web)
- ✅ Informations sur l'hébergeur (Vercel)
- ✅ Délégué à la protection des données
- ✅ Propriété intellectuelle
- ✅ Crédits (design, développement, icônes)

**Caractéristiques**:
- Design moderne avec icônes Lucide
- Animations Framer Motion
- Responsive
- Multilingue (FR, EN, ES)
- SEO optimisé

### 2. Conditions Générales d'Utilisation (`/legal/terms`)

**Fichier**: `/src/pages/Legal/TermsOfService.jsx`

**Contenu**:
- ✅ **Section 1**: Objet des CGU
- ✅ **Section 2**: Accès aux services
  - Inscription via Shopify
  - Conditions d'éligibilité
  - Intégration Shopify
- ✅ **Section 3**: Description des services
  - Fonctionnalités principales
  - Disponibilité du service
- ✅ **Section 4**: Tarification et paiement
  - Plans d'abonnement (Basic, Pro, Plus)
  - Facturation mensuelle via Shopify
  - Période d'essai
- ✅ **Section 5**: Résiliation et remboursement
  - Droit de résiliation
  - Suspension par StockEasy
  - Conservation des données (30 jours)
- ✅ **Section 6**: Obligations de l'utilisateur
  - Usage conforme
  - Responsabilité des données
- ✅ **Section 7**: Limitation de responsabilité
  - Service fourni "en l'état"
  - Limitation des dommages
  - Dommages indirects
- ✅ **Section 8**: Propriété intellectuelle
- ✅ **Section 9**: Modifications des CGU
- ✅ **Section 10**: Droit applicable (Français) et juridiction

**Caractéristiques**:
- Bandeau d'avertissement important
- Navigation par sections avec icônes
- Sous-sections détaillées
- Section contact en fin de page
- Inspiré des meilleures pratiques SaaS (Shopify, Notion, Slack)

### 3. Politique de Confidentialité (`/legal/privacy`)

**Fichier**: `/src/pages/Legal/PrivacyPolicy.jsx`

**Contenu**:
- ✅ **Section 1**: Introduction
- ✅ **Section 2**: Responsable du traitement (StockEasy SAS)
- ✅ **Section 3**: Données collectées
  - Données de compte (Shopify, profil, facturation)
  - Données commerciales (produits, commandes, fournisseurs)
  - Données d'utilisation (logs, interactions, performance)
  - Cookies et technologies similaires
- ✅ **Section 4**: Finalités du traitement
  - Fourniture du service
  - Amélioration du service
  - Communication
  - Obligations légales
- ✅ **Section 5**: Base légale du traitement
  - Exécution du contrat
  - Intérêt légitime
  - Consentement
  - Obligations légales
- ✅ **Section 6**: Partage des données
  - Prestataires de services (Shopify, Vercel, Supabase, Sentry)
  - Transferts internationaux
  - Obligations légales
- ✅ **Section 7**: Sécurité des données
  - Chiffrement HTTPS/TLS
  - Contrôle d'accès strict
  - Surveillance continue
  - Sauvegardes régulières
  - Audits de sécurité
- ✅ **Section 8**: Durée de conservation
  - Compte actif
  - Compte clôturé (30 jours)
  - Obligations légales (5-10 ans)
- ✅ **Section 9**: Droits RGPD
  - Droit d'accès
  - Droit de rectification
  - Droit à l'effacement
  - Droit à la limitation
  - Droit à la portabilité
  - Droit d'opposition
  - Retrait du consentement
  - Exercice des droits (contact@stockeasy.app)
- ✅ **Section 10**: Données des mineurs
- ✅ **Section 11**: Modifications de la politique

**Caractéristiques**:
- Badge "Conformité RGPD" en haut
- Section contact avec icône email
- Informations CNIL pour réclamations
- Très détaillé et transparent
- Conforme aux exigences RGPD

## Architecture Technique

### Routing

Les routes sont configurées dans `/src/App.jsx`:

```javascript
{/* Pages Légales - Sans Sentry */}
<Route path="/legal/terms" element={<TermsOfService />} />
<Route path="/legal/privacy" element={<PrivacyPolicy />} />
<Route path="/legal/notices" element={<LegalNotices />} />
```

**Note**: Les pages légales sont publiques et n'utilisent pas Sentry pour éviter de tracker les visiteurs sans consentement.

### Composants Utilisés

1. **SEOUpdater**: Optimisation SEO pour chaque page
2. **Framer Motion**: Animations fluides et professionnelles
3. **Lucide Icons**: Icônes cohérentes avec le reste de l'application
4. **React Router**: Navigation entre les pages
5. **react-i18next**: Internationalisation (FR, EN, ES)

### Design System

**Couleurs**:
- Fond principal: `#FAFAF7` (crème doux)
- Texte principal: `#191919` (noir profond)
- Accent vert: `#1DB954` (vert Spotify, cohérent avec la marque)
- Bordures: `#E5E4DF` (beige clair)

**Typographie**:
- Titres: Police système, gras
- Corps: Police système, poids normal
- Hiérarchie claire (h1: 4xl/5xl, h2: 2xl, h3: lg)

**Espacement**:
- Sections: padding de 8 (32px)
- Entre sections: bordure diviseur
- Marges cohérentes

## Traductions

### Fichiers de Traduction

Les traductions sont stockées dans:
- `/src/locales/fr/translation.json` (Français - version complète)
- `/src/locales/en/translation.json` (Anglais)
- `/src/locales/es/translation.json` (Espagnol)

### Structure des Traductions

```json
{
  "legal": {
    "backToHome": "...",
    "lastUpdated": "...",
    "notices": { ... },
    "terms": { ... },
    "privacy": { ... }
  }
}
```

### Clés de Traduction Principales

- `legal.notices.*`: Mentions légales
- `legal.terms.*`: Conditions d'utilisation
- `legal.privacy.*`: Politique de confidentialité

## Intégration avec le Footer

Le footer (`/src/pages/Landing/components/Footer.jsx`) contient déjà les liens vers les pages légales:

```javascript
legal: {
  title: t('landing.footer.legal', "Légal"),
  links: [
    { name: t('landing.footer.links.privacy', "Confidentialité"), href: "/legal/privacy" },
    { name: t('landing.footer.links.terms', "CGU"), href: "/legal/terms" },
    { name: t('landing.footer.links.legalNotice', "Mentions légales"), href: "/legal/notices" },
    { name: t('landing.footer.links.cookies', "Cookies"), href: "/legal/cookies" }
  ]
}
```

## Conformité Légale

### RGPD / CNIL

✅ **Politique de confidentialité complète**:
- Identification du responsable de traitement
- Description détaillée des données collectées
- Finalités et bases légales du traitement
- Durées de conservation précises
- Droits des utilisateurs clairement énoncés
- Contact pour exercer ses droits
- Information sur les transferts internationaux
- Mesures de sécurité détaillées

✅ **Mentions légales obligatoires**:
- Identification complète de l'éditeur
- Numéros légaux (RCS, TVA)
- Hébergeur identifié
- Délégué à la protection des données

✅ **CGU claires et transparentes**:
- Conditions d'utilisation explicites
- Tarification transparente
- Droit de résiliation clairement énoncé
- Limitation de responsabilité appropriée
- Droit applicable précisé

### Bonnes Pratiques SaaS

✅ **Inspiré de leaders du secteur**:
- Shopify: Structure de tarification et CGU
- Notion: Design et présentation
- Slack: Clarté et accessibilité
- Stripe: Transparence sur les données

✅ **Accessibilité**:
- Navigation claire avec bouton "Retour à l'accueil"
- Hiérarchie de contenu logique
- Liens internes entre les pages légales
- Date de dernière mise à jour visible

✅ **SEO**:
- Meta titres optimisés
- Meta descriptions uniques
- URLs propres et explicites
- Contenu structuré avec balises sémantiques

## Points à Compléter (À Faire)

### Informations Légales Réelles

Les pages légales contiennent actuellement des informations placeholder qui doivent être mises à jour:

1. **Mentions Légales**:
   - [ ] Capital social exact
   - [ ] Numéro RCS complet
   - [ ] Numéro TVA intracommunautaire exact
   - [ ] Adresse précise du siège social

2. **Politique de Cookies**:
   - [ ] Page dédiée aux cookies (géré par un autre agent)
   - [ ] Banner de consentement cookies (déjà implémenté dans le contexte)

3. **Liens Externes**:
   - [ ] Lien LinkedIn (actuellement "#")
   - [ ] Autres liens sociaux si nécessaire

## Maintenance

### Mise à Jour des Pages

1. **Quand mettre à jour**:
   - Changement de tarification
   - Modification des conditions de service
   - Ajout/retrait de fonctionnalités importantes
   - Changement de prestataires (hébergement, etc.)
   - Évolution réglementaire

2. **Comment mettre à jour**:
   - Modifier les fichiers JSX dans `/src/pages/Legal/`
   - Mettre à jour les traductions dans `/src/locales/*/translation.json`
   - **IMPORTANT**: Changer la date de dernière mise à jour (automatique via `new Date()`)
   - Notifier les utilisateurs par email des changements majeurs

3. **Versioning**:
   - Conserver l'historique Git des CGU pour prouver les versions acceptées
   - En cas de litige, pouvoir retrouver la version acceptée par l'utilisateur

## Ressources de Référence

### Documentation Consultée

1. **CNIL** (Commission Nationale de l'Informatique et des Libertés):
   - Guides sur les mentions légales
   - Obligations RGPD pour les SaaS
   - Modèles de politique de confidentialité

2. **Service-public.fr**:
   - Obligations légales pour les sites professionnels
   - Informations obligatoires pour les e-commerçants

3. **Exemples SaaS Analysés**:
   - Shopify Terms of Service
   - Notion Privacy Policy
   - Slack Terms of Service
   - Stripe Legal Documentation

### Liens Utiles

- CNIL: https://www.cnil.fr
- RGPD (texte officiel): https://www.cnil.fr/fr/reglement-europeen-protection-donnees
- Guide CNIL pour les SaaS: https://www.cnil.fr/fr/professionnels

## Checklist de Déploiement

Avant de mettre en production:

- [x] Pages légales créées et fonctionnelles
- [x] Traductions FR, EN, ES complètes
- [x] Routing configuré dans App.jsx
- [x] Liens dans le footer opérationnels
- [x] Design responsive testé
- [x] SEO optimisé
- [ ] Informations légales réelles à jour (capital, RCS, TVA, adresse)
- [ ] Validation juridique par un avocat (recommandé)
- [ ] Système de cookies opérationnel (autre agent)
- [ ] Email de notification des utilisateurs préparé (pour changements futurs)

## Notes Techniques

### Performance

- Les pages légales sont statiques et légères
- Pas de requêtes API nécessaires
- Chargement rapide même sans cache

### SEO

- Chaque page a son propre titre et description
- URLs sémantiques (`/legal/terms`, `/legal/privacy`, `/legal/notices`)
- Contenu textuel riche pour l'indexation

### Accessibilité

- Contraste suffisant (ratio WCAG AA respecté)
- Navigation au clavier possible
- Structure HTML sémantique
- Textes lisibles et clairs

---

**Date de création**: 30 novembre 2025  
**Auteur**: Agent IA StockEasy  
**Version**: 1.0

