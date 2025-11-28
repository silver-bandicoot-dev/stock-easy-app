/**
 * Contenu du Centre d'Aide Stockeasy
 * Documentation complète pour les marchands
 */

import {
  Rocket,
  ShoppingBag,
  RefreshCw,
  Package,
  Truck,
  Activity,
  ClipboardList,
  TrendingUp,
  Settings,
  AlertTriangle,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';

// Catégories du centre d'aide
export const HELP_CATEGORIES = [
  {
    id: 'onboarding',
    title: 'Guide de démarrage',
    description: 'Premiers pas avec Stockeasy',
    icon: Rocket,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    description: 'Vue d\'ensemble de votre activité',
    icon: LayoutDashboard,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    id: 'orders',
    title: 'Passer Commande',
    description: 'Créer et gérer vos commandes fournisseurs',
    icon: ShoppingBag,
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
  },
  {
    id: 'tracking',
    title: 'Mes Commandes',
    description: 'Suivre vos commandes en cours',
    icon: Truck,
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
  },
  {
    id: 'stock',
    title: 'Niveaux de Stock',
    description: 'Santé et analyse de votre inventaire',
    icon: Activity,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600'
  },
  {
    id: 'inventory',
    title: 'Inventaire',
    description: 'Source de vérité de votre stock',
    icon: ClipboardList,
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'KPIs et prévisions IA',
    icon: TrendingUp,
    color: 'bg-gradient-to-br from-pink-500 to-pink-600'
  },
  {
    id: 'settings',
    title: 'Paramètres',
    description: 'Configuration complète de l\'application',
    icon: Settings,
    color: 'bg-gradient-to-br from-slate-600 to-slate-700'
  },
  {
    id: 'troubleshooting',
    title: 'Résolution de problèmes',
    description: 'FAQ et aide au dépannage',
    icon: AlertTriangle,
    color: 'bg-gradient-to-br from-red-500 to-red-600'
  }
];

// Articles de documentation
export const HELP_ARTICLES = {
  // ============================================
  // ONBOARDING (5 articles)
  // ============================================
  onboarding: [
    {
      id: 'welcome',
      title: 'Bienvenue sur Stockeasy',
      summary: 'Découvrez l\'application et ses fonctionnalités principales',
      content: `
## Bienvenue sur Stockeasy !

Stockeasy est votre assistant intelligent de gestion des stocks. Notre mission est de vous aider à :

- **Éviter les ruptures de stock** grâce aux alertes proactives
- **Optimiser vos commandes** avec des recommandations intelligentes
- **Suivre vos commandes** fournisseurs en temps réel
- **Analyser vos performances** avec des KPIs détaillés

### Les 7 onglets principaux

| Onglet | Description |
|--------|-------------|
| **Tableau de bord** | Vue d'ensemble de votre activité avec KPIs clés |
| **Passer Commande** | Recommandations et création de commandes fournisseurs |
| **Mes Commandes** | Suivi complet de vos commandes en cours |
| **Niveaux de Stock** | Analyse de la santé de votre inventaire |
| **Inventaire** | Source de vérité avec valorisation complète |
| **Analytics** | KPIs avancés et prévisions IA |
| **Paramètres** | Configuration de l'application |

### Prochaine étape

Commencez par connecter votre boutique Shopify pour synchroniser vos produits !
      `
    },
    {
      id: 'shopify-connection',
      title: 'Connexion de votre boutique Shopify',
      summary: 'Comment connecter et synchroniser votre boutique',
      content: `
## Connecter votre boutique Shopify

### Étape 1 : Autorisation OAuth

Lorsque vous installez Stockeasy depuis l'App Store Shopify, vous serez redirigé vers une page d'autorisation. Acceptez les permissions demandées pour permettre la synchronisation.

### Permissions requises

Stockeasy a besoin d'accéder à :
- **Produits** : lecture des informations produits et stocks
- **Commandes** : lecture de l'historique de ventes
- **Emplacements** : gestion multi-entrepôts

### Première synchronisation

Une fois connecté, Stockeasy synchronise automatiquement :
- Tous vos produits actifs
- Les niveaux de stock actuels
- L'historique des ventes (90 derniers jours)

> **Note** : La première synchronisation peut prendre quelques minutes selon le nombre de produits.

### Vérifier la connexion

Allez dans **Paramètres > Intégrations** pour voir le statut de votre connexion Shopify et le nombre de produits synchronisés.
      `
    },
    {
      id: 'initial-setup',
      title: 'Configuration initiale essentielle',
      summary: 'Les premiers réglages importants à effectuer',
      content: `
## Configuration initiale

Après avoir connecté votre boutique, configurez ces paramètres essentiels dans **Paramètres > Généraux**.

### 1. Devise par défaut

Choisissez la devise pour l'affichage des prix :
- **EUR** - Euro
- **USD** - Dollar américain
- **GBP** - Livre sterling
- **CAD** - Dollar canadien

### 2. Seuil de Surstock Profond

Ce paramètre définit à partir de combien de jours d'autonomie un produit est considéré en surstock :

| Valeur | Type d'activité | Recommandation |
|--------|-----------------|----------------|
| 60 jours | Fashion/Mode | Produits saisonniers |
| **90 jours** | Standard | **Recommandé pour la plupart** |
| 120 jours | Durable | Produits longue durée |
| 180 jours | B2B | Cycles de vente longs |

Vous pouvez aussi définir une valeur personnalisée (1-365 jours).

### 3. Multiplicateur par défaut

Le multiplicateur ajuste les prévisions de ventes. Par défaut à **1.2**, il ajoute une marge de sécurité de 20% aux prévisions.

- **< 1.0** : Prévisions conservatrices
- **1.0** : Prévisions exactes
- **> 1.0** : Marge de sécurité ajoutée
      `
    },
    {
      id: 'create-suppliers',
      title: 'Créer vos premiers fournisseurs',
      summary: 'Ajouter et configurer vos fournisseurs',
      content: `
## Créer vos fournisseurs

Les fournisseurs sont essentiels pour organiser vos commandes. Allez dans **Paramètres > Fournisseurs**.

### Informations à renseigner

Pour chaque fournisseur, indiquez :

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Nom** | Nom du fournisseur | "Grossiste Paris" |
| **Email** | Adresse pour les commandes | "commandes@grossiste.fr" |
| **Délai de livraison** | Temps moyen en jours | 14 jours |
| **MOQ** | Quantité minimum de commande | 50 unités |
| **Notes** | Informations complémentaires | "Fermé le lundi" |

### Pourquoi c'est important ?

- **Délai de livraison** : Utilisé pour calculer quand commander (point de réapprovisionnement)
- **MOQ** : Garantit des commandes conformes aux exigences du fournisseur
- **Email** : Permet d'envoyer les commandes directement depuis l'application

### Assigner des produits

Une fois vos fournisseurs créés, allez dans **Paramètres > Mapping** pour assigner vos produits à leurs fournisseurs respectifs.
      `
    },
    {
      id: 'interface-tour',
      title: 'Tour de l\'interface',
      summary: 'Découvrez les fonctionnalités de navigation',
      content: `
## Tour de l'interface Stockeasy

### Barre de recherche globale

Accédez rapidement à n'importe quel produit, fournisseur ou paramètre :
- **Raccourci clavier** : \`Cmd+K\` (Mac) ou \`Ctrl+K\` (Windows)
- Recherchez par nom, SKU ou fournisseur
- Résultats instantanés avec aperçu

### Notifications

La cloche de notification vous alerte sur :
- Produits en rupture de stock
- Commandes nécessitant une action
- Livraisons en attente de réception

### Navigation Desktop vs Mobile

**Sur ordinateur :**
- Menu latéral (sidebar) toujours visible
- Sous-menus dépliables pour Analytics et Paramètres

**Sur mobile :**
- Barre de navigation en bas de l'écran
- Menu "Plus" pour accéder à toutes les fonctionnalités
- Interface optimisée tactile

### Synchronisation

Le bouton de synchronisation (icône de rafraîchissement) permet de :
- Forcer une mise à jour des données Shopify
- Voir le statut de synchronisation en temps réel
      `
    }
  ],

  // ============================================
  // TABLEAU DE BORD (2 articles)
  // ============================================
  dashboard: [
    {
      id: 'dashboard-overview',
      title: 'Comprendre le Tableau de bord',
      summary: 'Vue d\'ensemble de votre activité quotidienne',
      content: `
## Le Tableau de bord

Le tableau de bord est votre point d'entrée quotidien dans Stockeasy. Il vous donne une vue synthétique de la santé de votre inventaire.

### Message de bienvenue

Stockeasy vous accueille avec un message personnalisé qui varie selon :
- L'heure de la journée
- Le jour de la semaine
- Si vous revenez dans la journée
- Le nombre de produits urgents à commander

### KPIs principaux

| KPI | Description |
|-----|-------------|
| **Produits à commander** | Nombre de produits nécessitant un réapprovisionnement |
| **Commandes actives** | Commandes en cours (en attente, préparation, transit) |

### Graphique CA vs Objectifs

Ce graphique compare votre chiffre d'affaires réel avec vos objectifs, vous permettant de suivre votre performance commerciale.

### Indicateur de synchronisation

- **Point vert** : Données synchronisées
- **Icône tournante** : Synchronisation en cours
      `
    },
    {
      id: 'dashboard-kpis',
      title: 'Analyser les indicateurs clés',
      summary: 'Interpréter les KPIs du tableau de bord',
      content: `
## Analyser vos indicateurs

### Produits à commander

Ce badge rouge indique le nombre de produits qui ont atteint leur point de réapprovisionnement. 

**Action recommandée** : Cliquez dessus ou allez dans "Passer Commande" pour voir les détails et créer vos commandes.

### Commandes actives

Affiche le nombre total de commandes en cours :
- En attente de confirmation
- En préparation chez le fournisseur
- En transit
- Reçues (en attente de réconciliation)

### Sections du dashboard

| Section | Contenu |
|---------|---------|
| **Indicateurs clés** | KPIs de santé de l'inventaire |
| **Analyses** | Graphiques de tendance |

### Liens rapides

Depuis le tableau de bord, vous pouvez accéder directement aux :
- Produits urgents à commander
- Commandes nécessitant une action
- Produits en surstock
      `
    }
  ],

  // ============================================
  // PASSER COMMANDE (3 articles)
  // ============================================
  orders: [
    {
      id: 'order-recommendations',
      title: 'Recommandations de commande',
      summary: 'Comprendre et utiliser les recommandations automatiques',
      content: `
## Recommandations de commande

L'onglet "Passer Commande" vous présente les produits à réapprovisionner, organisés par fournisseur.

### Comment ça fonctionne ?

Stockeasy analyse automatiquement :
1. Votre **stock actuel**
2. Vos **ventes moyennes** par jour
3. Le **délai de livraison** du fournisseur
4. Le **multiplicateur** de sécurité

Et calcule la **quantité optimale** à commander.

### KPIs de la page

| KPI | Description |
|-----|-------------|
| **Produits à commander** | Nombre total de produits |
| **Urgents** | Produits en rupture ou critique |
| **Investissement** | Montant total des commandes |
| **Fournisseurs** | Nombre de fournisseurs concernés |

### Créer une commande

1. Sélectionnez un fournisseur
2. Vérifiez/ajustez les quantités recommandées
3. Choisissez l'entrepôt de destination
4. Cliquez sur "Créer la commande"
5. Optionnel : Envoyez l'email au fournisseur

### Exporter en CSV

Le bouton "Exporter" génère un fichier CSV avec tous les produits à commander, utile pour vos propres analyses ou votre comptabilité.
      `
    },
    {
      id: 'custom-order',
      title: 'Commande personnalisée',
      summary: 'Créer une commande avec sélection manuelle',
      content: `
## Commande personnalisée

L'onglet "Personnalisée" permet de créer une commande en sélectionnant manuellement les produits.

### Quand l'utiliser ?

- Commande exceptionnelle hors recommandations
- Réapprovisionnement anticipé
- Produits spécifiques à commander

### Comment procéder ?

1. **Sélectionnez les produits** en cochant les cases
2. **Ajustez les quantités** pour chaque produit
3. Cliquez sur **"Créer commande"**

### Contraintes

- Tous les produits sélectionnés doivent avoir le **même fournisseur**
- Les quantités doivent être **positives**

### Options de création

Lors de la création, vous pouvez :
- Créer la commande **sans email** (enregistrement interne)
- Créer **avec email** au fournisseur (génération automatique)
      `
    },
    {
      id: 'export-orders',
      title: 'Export des produits à commander',
      summary: 'Générer un fichier CSV des recommandations',
      content: `
## Export CSV des recommandations

### Contenu du fichier

Le fichier CSV exporté contient :

| Colonne | Description |
|---------|-------------|
| SKU | Identifiant unique du produit |
| Nom | Nom du produit |
| Fournisseur | Fournisseur assigné |
| Stock Actuel | Quantité en stock |
| Quantité à Commander | Recommandation Stockeasy |
| Prix Unitaire | Prix d'achat HT |
| Total | Montant de la ligne |
| Autonomie (jours) | Jours de stock restants |
| Statut | État de santé du produit |

### Utilisation

Ce fichier peut être utilisé pour :
- Partager avec votre équipe achat
- Importer dans votre ERP
- Analyser dans Excel
- Envoyer manuellement à vos fournisseurs
      `
    }
  ],

  // ============================================
  // MES COMMANDES (3 articles)
  // ============================================
  tracking: [
    {
      id: 'order-lifecycle',
      title: 'Cycle de vie d\'une commande',
      summary: 'Comprendre les différents statuts de commande',
      content: `
## Cycle de vie d'une commande

Chaque commande passe par plusieurs étapes, du brouillon à l'archivage.

### Les statuts

| Statut | Description | Action possible |
|--------|-------------|-----------------|
| **En attente** | Commande créée, non confirmée | Confirmer |
| **En préparation** | Confirmée, en traitement chez le fournisseur | Marquer expédiée |
| **En transit** | Expédiée, en cours de livraison | Marquer reçue |
| **Reçue** | Livrée, en attente de vérification | Démarrer réconciliation |
| **Réconciliation** | Vérification des quantités | Confirmer/Signaler écart |
| **Archivée** | Commande terminée | - |

### Flux typique

\`\`\`
En attente → En préparation → En transit → Reçue → Réconciliation → Archivée
\`\`\`

### Actions à chaque étape

- **Confirmer** : Valide la commande et notifie le fournisseur
- **Expédier** : Ajoute les informations de tracking
- **Recevoir** : Indique que la livraison est arrivée
- **Réconcilier** : Vérifie les quantités et met à jour le stock
      `
    },
    {
      id: 'filter-orders',
      title: 'Suivre et filtrer les commandes',
      summary: 'Utiliser les filtres et la recherche',
      content: `
## Suivre vos commandes

### Onglets de statut

Les onglets en haut de la page filtrent par statut :
- **Toutes** : Vue complète
- **En Cours** : Commandes en attente
- **Préparation** : Chez le fournisseur
- **Transit** : En livraison
- **Reçues** : À vérifier
- **Réconciliation** : Écarts à traiter
- **Archivées** : Historique

### KPIs cliquables

Les KPIs en haut de page sont cliquables et filtrent automatiquement la liste.

### Filtres avancés

| Filtre | Utilisation |
|--------|-------------|
| **Recherche** | Par numéro PO ou fournisseur |
| **Fournisseur** | Liste déroulante |
| **Date** | Plage de dates |

### Panel de détail

Cliquez sur une commande pour afficher :
- Détails complets
- Liste des produits
- Historique des actions
- Boutons d'action contextuel
      `
    },
    {
      id: 'reconciliation',
      title: 'Réconciliation des écarts',
      summary: 'Gérer les différences entre commande et livraison',
      content: `
## Réconciliation des commandes

Après réception d'une commande, la réconciliation permet de vérifier que tout est conforme.

### Processus

1. Cliquez sur **"Démarrer réconciliation"** sur une commande reçue
2. Pour chaque produit, indiquez la **quantité réellement reçue**
3. Si écart : précisez le type (manquant, endommagé)
4. Validez la réconciliation

### Types d'écarts

| Type | Description | Action |
|------|-------------|--------|
| **Manquant** | Quantité inférieure | Email réclamation |
| **Endommagé** | Produits abîmés | Email réclamation |
| **Excédent** | Quantité supérieure | Ajustement stock |

### Email de réclamation

En cas d'écart, Stockeasy peut générer automatiquement un email de réclamation incluant :
- Détail des écarts constatés
- Photos si ajoutées
- Demande d'action corrective

### Impact sur le stock

Après réconciliation, le stock est automatiquement mis à jour avec les quantités **réellement reçues**.
      `
    }
  ],

  // ============================================
  // NIVEAUX DE STOCK (3 articles)
  // ============================================
  stock: [
    {
      id: 'stock-health',
      title: 'Comprendre la santé du stock',
      summary: 'Les indicateurs de santé de vos produits',
      content: `
## Santé de votre stock

L'onglet "Niveaux de Stock" analyse la santé de chaque produit de votre inventaire.

### Les 3 statuts de santé

| Statut | Couleur | Signification |
|--------|---------|---------------|
| **Urgent** | Rouge | Stock critique, risque de rupture |
| **À surveiller** | Orange | Stock faible, à réapprovisionner bientôt |
| **En bonne santé** | Vert | Stock suffisant |

### Calcul du pourcentage de santé

Le pourcentage de santé est calculé selon :
- Jours d'autonomie restants
- Point de réapprovisionnement
- Ventes moyennes par jour

### Barre de santé visuelle

Chaque produit affiche une barre de progression colorée indiquant visuellement son niveau de santé.

### KPIs de la page

| KPI | Description |
|-----|-------------|
| **Urgents** | Produits nécessitant une action immédiate |
| **À surveiller** | Produits à commander prochainement |
| **En bonne santé** | Produits avec stock suffisant |
| **Total** | Nombre total de références |
      `
    },
    {
      id: 'autonomy-rotation',
      title: 'Analyser l\'autonomie et la rotation',
      summary: 'Comprendre les métriques clés de votre inventaire',
      content: `
## Autonomie et Rotation

### Jours d'autonomie

L'autonomie indique **combien de jours** votre stock actuel peut couvrir les ventes, basé sur vos ventes moyennes.

**Formule** : Stock actuel ÷ Ventes par jour

**Exemple** : 100 unités ÷ 5 ventes/jour = 20 jours d'autonomie

### Point de réapprovisionnement

Le seuil en dessous duquel vous devriez commander :

**Formule** : (Ventes/jour × Délai livraison) × Multiplicateur

### Taux de rotation

Indique combien de fois votre stock se renouvelle par an :

| Rotation | Interprétation |
|----------|----------------|
| > 6x/an | Excellente rotation |
| 2-6x/an | Rotation normale |
| < 2x/an | Rotation lente, attention surstock |

### Surstock profond

Un produit est en surstock profond quand son autonomie dépasse votre seuil configuré (par défaut 90 jours).

Ces produits :
- Immobilisent du capital
- Risquent l'obsolescence
- Prennent de la place en entrepôt
      `
    },
    {
      id: 'in-transit',
      title: 'Quantités en transit et commandées',
      summary: 'Suivre les réapprovisionnements en cours',
      content: `
## Quantités en transit

### Distinction transit vs commandé

| Type | Statut commande | Signification |
|------|-----------------|---------------|
| **En transit** | In transit | Expédié, en route |
| **Commandé** | En attente/Préparation | Pas encore expédié |

### Affichage dans le tableau

Pour chaque produit, vous voyez :
- Quantité actuellement **en transit** (avec ETA si disponible)
- Quantité **commandée** mais pas encore expédiée

### ETA (Estimated Time of Arrival)

L'ETA indique la date d'arrivée prévue, calculée depuis :
- Date d'expédition
- Délai de livraison du fournisseur

### Impact sur les recommandations

Stockeasy prend en compte les quantités en transit pour ses recommandations, évitant ainsi les doubles commandes.
      `
    }
  ],

  // ============================================
  // INVENTAIRE (2 articles)
  // ============================================
  inventory: [
    {
      id: 'inventory-overview',
      title: 'Source de vérité de votre stock',
      summary: 'Le tableau complet de votre inventaire',
      content: `
## L'onglet Inventaire

L'inventaire est la **source de vérité** de votre stock. Il présente un tableau complet avec toutes les informations essentielles.

### Colonnes du tableau

| Colonne | Description |
|---------|-------------|
| **SKU** | Identifiant unique du produit |
| **Nom** | Désignation du produit |
| **Fournisseur** | Fournisseur assigné |
| **Quantité** | Stock actuel |
| **Prix achat HT** | Coût unitaire |
| **Prix vente HT** | Prix de vente |
| **Valeur stock (coût)** | Quantité × Prix achat |
| **Valeur stock (vente)** | Quantité × Prix vente |

### KPIs de l'inventaire

| KPI | Description |
|-----|-------------|
| **Total Références** | Nombre de produits (dont en rupture) |
| **Unités en Stock** | Quantité totale |
| **Valeur du Stock (coût)** | Valorisation au prix d'achat |
| **Valeur du Stock (vente)** | Valorisation au prix de vente |

### Marge potentielle

La différence entre valeur vente et valeur coût représente votre marge brute potentielle si tout le stock était vendu.

### Fonctionnalités

- **Recherche** par SKU, nom ou fournisseur
- **Filtrage** par fournisseur
- **Tri** sur toutes les colonnes (cliquez sur l'en-tête)
- **Ligne de total** en bas du tableau
      `
    },
    {
      id: 'inventory-export',
      title: 'Export comptable de l\'inventaire',
      summary: 'Générer un rapport d\'inventaire',
      content: `
## Export de l'inventaire

### Télécharger l'inventaire

Le bouton **"Télécharger l'inventaire"** génère un fichier CSV complet.

### Contenu de l'export

Le fichier inclut :
- Toutes les colonnes du tableau
- Les totaux de valorisation
- La date d'export

### Filtres avant export

L'export respecte les filtres actifs :
- Si vous filtrez par fournisseur, seuls ces produits sont exportés
- La recherche filtre également les résultats

### Compatibilité

Le fichier CSV est compatible avec :
- Microsoft Excel
- Google Sheets
- Logiciels comptables (Sage, QuickBooks, etc.)
- Systèmes ERP

### Utilisation recommandée

Exportez régulièrement votre inventaire pour :
- Inventaires comptables
- Audits
- Analyses externes
- Sauvegarde des données
      `
    }
  ],

  // ============================================
  // ANALYTICS (3 articles)
  // ============================================
  analytics: [
    {
      id: 'main-kpis',
      title: 'KPIs principaux',
      summary: 'Les 4 indicateurs clés de performance',
      content: `
## KPIs Principaux

L'onglet Analytics présente les indicateurs clés de votre inventaire.

### Les 4 KPIs principaux

| KPI | Description | Objectif |
|-----|-------------|----------|
| **Taux de Disponibilité SKU** | % de produits en stock | > 80% |
| **Valeur de l'Inventaire** | Valorisation totale | Optimiser |
| **Ventes Perdues** | CA manqué (ruptures) | < 5% du CA |
| **Valeur Surstocks** | Capital immobilisé | Minimiser |

### Taux de Disponibilité SKU

Calcule le pourcentage de produits avec du stock disponible.

- **> 90%** : Excellent
- **80-90%** : Bon
- **< 80%** : À améliorer

### Ventes Perdues

Estime le chiffre d'affaires perdu à cause des ruptures de stock, basé sur :
- Historique de ventes
- Jours de rupture

### Valeur des Surstocks

Montant immobilisé dans les produits en surstock profond. Un indicateur à minimiser pour optimiser votre trésorerie.

### Comparaison temporelle

Chaque KPI affiche :
- Valeur actuelle
- Évolution vs période précédente
- Tendance (hausse/baisse)
      `
    },
    {
      id: 'advanced-analytics',
      title: 'Analyse approfondie',
      summary: 'KPIs secondaires et métriques avancées',
      content: `
## Analyse Approfondie

### KPIs supplémentaires

| KPI | Description |
|-----|-------------|
| **Mapping Produits-Fournisseurs** | % de produits assignés à un fournisseur |
| **Total Produits** | Nombre de références actives |
| **En Bonne Santé** | % de produits avec stock sain |
| **Marge Brute Totale** | Potentiel de marge sur le stock |
| **Revenu Potentiel (ML)** | Prévision de CA basée sur l'IA |
| **Rotation Rapide** | Produits à forte rotation |

### Revenu Potentiel (ML)

Ce KPI utilise le Machine Learning pour estimer le chiffre d'affaires potentiel sur les 90 prochains jours.

Il prend en compte :
- Historique des ventes
- Saisonnalité
- Taux de rotation
- Tendances

### Insights Actionnables

En bas de page, des recommandations personnalisées basées sur vos KPIs :

- **Alertes** (rouge) : Actions urgentes requises
- **Performance** (bleu) : État de vos métriques
- **Financier** (vert) : Informations financières
      `
    },
    {
      id: 'ai-forecasts',
      title: 'Prévisions IA',
      summary: 'Machine Learning pour anticiper la demande',
      content: `
## Prévisions IA

L'onglet "Prévisions IA" utilise le Machine Learning pour anticiper la demande.

### Sélectionner un produit

Choisissez un produit avec historique de ventes pour voir ses prévisions. Les produits sont groupés :
- **Avec historique** : Prévisions ML disponibles
- **Sans historique** : Prévisions limitées

### Graphique de demande

Le graphique affiche :
- **Historique réel** des ventes (ligne pleine)
- **Prévisions** sur 30-90 jours (ligne pointillée)
- **Intervalle de confiance** (zone ombrée)

### Interprétation

| Confiance | Signification |
|-----------|---------------|
| > 70% | Prévision fiable |
| 50-70% | Prévision indicative |
| < 50% | Données insuffisantes |

### Améliorer les prévisions

Pour de meilleures prévisions :
- Maintenez un historique de ventes régulier
- Évitez les ruptures prolongées
- Entraînez le modèle ML périodiquement
      `
    }
  ],

  // ============================================
  // PARAMÈTRES (7 articles)
  // ============================================
  settings: [
    {
      id: 'general-settings',
      title: 'Paramètres Généraux',
      summary: 'Devise, seuils et multiplicateur par défaut',
      content: `
## Paramètres Généraux

Accédez via **Paramètres > Généraux** pour configurer les paramètres globaux.

### Devise par défaut

Choisissez parmi : **EUR**, **USD**, **GBP**, **CAD**

Cette devise est utilisée pour :
- Affichage des prix
- Calcul des valorisations
- Export des rapports

### Seuil Surstock Profond

Définit quand un produit est considéré en surstock.

| Valeur | Type | Description |
|--------|------|-------------|
| 60 jours | Fashion | Rotation rapide, mode saisonnière |
| **90 jours** | Standard | **Recommandé** |
| 120 jours | Durable | Produits longue durée |
| 180 jours | B2B | Cycles de vente longs |
| Personnalisé | - | 1 à 365 jours |

### Multiplicateur par défaut

Coefficient appliqué aux prévisions de ventes (0.1 à 5.0).

**Exemple** : Avec un multiplicateur de 1.2, si vous vendez 10 unités/jour, Stockeasy calculera sur une base de 12 unités/jour.

### Sauvegarde

Les modifications doivent être sauvegardées explicitement. Un bandeau jaune apparaît quand vous avez des changements non sauvegardés.
      `
    },
    {
      id: 'multipliers',
      title: 'Gestion des Multiplicateurs',
      summary: 'Ajuster les prévisions produit par produit',
      content: `
## Gestion des Multiplicateurs

Accédez via **Paramètres > Multiplicateurs**.

### Qu'est-ce qu'un multiplicateur ?

Le multiplicateur ajuste les prévisions de ventes pour un produit. Il impacte :
- Le **point de commande** (quand commander)
- Les **quantités recommandées** (combien commander)

### Modification individuelle

1. Trouvez le produit (recherche ou liste)
2. Cliquez sur "Modifier"
3. Ajustez le multiplicateur
4. Sauvegardez

### Modification en masse

1. Cochez les produits à modifier
2. Définissez le nouveau multiplicateur
3. Cliquez sur "Appliquer"

### Analyse ML automatique

Stockeasy peut suggérer des multiplicateurs optimaux basés sur l'historique :

1. Sélectionnez les produits
2. Cliquez sur **"Analyser avec ML"**
3. Consultez les suggestions
4. Appliquez celles qui vous conviennent

### Réinitialiser

Le bouton "Réinitialiser au défaut" remet le multiplicateur global sur les produits sélectionnés.
      `
    },
    {
      id: 'suppliers-management',
      title: 'Gestion des Fournisseurs',
      summary: 'Créer et gérer vos fournisseurs',
      content: `
## Gestion des Fournisseurs

Accédez via **Paramètres > Fournisseurs**.

### Créer un fournisseur

Cliquez sur "Nouveau fournisseur" et renseignez :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Nom | Oui | Nom unique du fournisseur |
| Email | Oui | Adresse pour les commandes |
| Délai de livraison | Oui | Temps moyen en jours |
| MOQ | Non | Quantité minimum de commande |
| Notes | Non | Informations complémentaires |

### Modifier un fournisseur

Cliquez sur l'icône crayon pour éditer les informations.

### Supprimer un fournisseur

Cliquez sur l'icône X. **Attention** : Les produits assignés devront être réassignés.

### Informations affichées

Pour chaque fournisseur, vous voyez :
- Coordonnées
- Délai et MOQ
- Nombre de produits assignés
      `
    },
    {
      id: 'product-mapping',
      title: 'Mapping Produits-Fournisseurs',
      summary: 'Assigner vos produits aux fournisseurs',
      content: `
## Mapping Produits-Fournisseurs

Accédez via **Paramètres > Mapping**.

### Interface de mapping

L'écran est divisé en :
- **Gauche** : Liste des fournisseurs
- **Droite** : Produits assignés / disponibles

### Assigner un produit

Deux méthodes :
1. **Glisser-déposer** : Faites glisser un produit vers le fournisseur
2. **Bouton** : Cliquez sur "Assigner" à côté du produit

### Retirer un produit

Cliquez sur "Retirer" ou glissez le produit vers la liste "Disponibles".

### MOQ par produit

Pour chaque produit assigné, vous pouvez définir un MOQ spécifique (différent du MOQ fournisseur).

### Synchroniser les MOQ

Le bouton **"Synchroniser les MOQ depuis le fournisseur"** applique le MOQ du fournisseur aux produits qui n'ont pas de MOQ personnalisé.

### Sauvegarder

Les modifications sont sauvegardées **par fournisseur**. Cliquez sur "Sauvegarder" après vos modifications.
      `
    },
    {
      id: 'warehouses',
      title: 'Gestion des Entrepôts',
      summary: 'Configurer vos emplacements de stockage',
      content: `
## Gestion des Entrepôts

Accédez via **Paramètres > Entrepôts**.

### Créer un entrepôt

Renseignez :
- **Nom** : Identifiant de l'entrepôt
- **Adresse** : Localisation
- **Capacité** : Nombre de références maximum (optionnel)

### Entrepôt par défaut

L'entrepôt par défaut est présélectionné lors de la création de commandes.

### Modifier / Supprimer

- **Modifier** : Icône crayon
- **Supprimer** : Icône X (seulement si aucune commande active)

### Multi-emplacements (Phase 2)

La gestion avancée des multi-emplacements sera disponible dans une prochaine version, avec :
- Synchronisation par emplacement Shopify
- Répartition du stock
- Plans d'abonnement dédiés
      `
    },
    {
      id: 'integrations',
      title: 'Intégrations',
      summary: 'Connecter vos outils externes',
      content: `
## Intégrations

Accédez via **Paramètres > Intégrations**.

### Intégrations Mail

| Service | Statut | Description |
|---------|--------|-------------|
| Gmail | Bientôt | Envoi direct depuis Gmail |
| Outlook | Bientôt | Envoi direct depuis Outlook |

Ces intégrations permettront d'envoyer les emails de commande directement depuis vos comptes mail.

### Intégrations Commerce

| Plateforme | Statut | Description |
|------------|--------|-------------|
| **Shopify** | Connecté | Synchronisation complète |
| WooCommerce | Bientôt | Support prévu |
| BigCommerce | Bientôt | Support prévu |

### Statut Shopify

Si connecté, vous voyez :
- Badge "Connecté" vert
- Nombre de produits synchronisés

### Liens vers les stores

Les cartes non connectées redirigent vers les stores officiels pour préparer l'installation future.
      `
    },
    {
      id: 'advanced-settings',
      title: 'Paramètres avancés',
      summary: 'Configuration fine des calculs',
      content: `
## Paramètres avancés

### Comprendre les calculs

Stockeasy utilise des formules éprouvées pour ses recommandations :

**Point de commande** :
\`\`\`
(Ventes/jour × Délai livraison) × Multiplicateur
\`\`\`

**Quantité à commander** :
\`\`\`
Point de commande - Stock actuel + Stock sécurité
\`\`\`

**Jours d'autonomie** :
\`\`\`
Stock actuel ÷ Ventes par jour
\`\`\`

### Ajuster les seuils

Pour personnaliser le comportement :
1. Modifiez le **seuil de surstock** selon votre activité
2. Ajustez les **multiplicateurs** par produit
3. Vérifiez les **délais fournisseurs**

### Notifications

Les alertes sont déclenchées quand :
- Un produit atteint son point de commande
- Une commande nécessite une action
- Un écart de livraison est détecté
      `
    }
  ],

  // ============================================
  // RÉSOLUTION DE PROBLÈMES (2 articles)
  // ============================================
  troubleshooting: [
    {
      id: 'faq',
      title: 'FAQ - Questions fréquentes',
      summary: 'Réponses aux questions les plus courantes',
      content: `
## Questions Fréquentes

### Synchronisation

**Q: Mes produits ne se synchronisent pas**
R: Vérifiez votre connexion Shopify dans Paramètres > Intégrations. Essayez de forcer une synchronisation avec le bouton de rafraîchissement.

**Q: Le stock affiché ne correspond pas à Shopify**
R: La synchronisation n'est pas instantanée. Attendez quelques minutes ou forcez une synchronisation.

**Q: Certains produits sont manquants**
R: Seuls les produits actifs sont synchronisés. Vérifiez le statut du produit dans Shopify.

### Commandes

**Q: Je ne peux pas créer de commande**
R: Vérifiez qu'un fournisseur est assigné aux produits sélectionnés.

**Q: L'email n'est pas envoyé**
R: L'envoi d'email nécessite une intégration mail (Gmail/Outlook). En attendant, copiez le contenu généré.

**Q: Comment annuler une commande ?**
R: Les commandes en attente peuvent être supprimées. Les commandes confirmées doivent être traitées avec le fournisseur.

### Calculs

**Q: Les quantités recommandées semblent trop élevées/basses**
R: Ajustez le multiplicateur du produit concerné ou vérifiez l'historique de ventes.

**Q: Le point de commande ne correspond pas à mes attentes**
R: Vérifiez le délai de livraison du fournisseur et le multiplicateur.

### Compte

**Q: Comment changer mon mot de passe ?**
R: Allez dans votre Profil > Sécurité.

**Q: Comment inviter un collaborateur ?**
R: Fonction disponible dans le Profil > Équipe (si votre plan le permet).
      `
    },
    {
      id: 'contact-support',
      title: 'Contacter le support',
      summary: 'Comment obtenir de l\'aide',
      content: `
## Contacter le Support

### Avant de nous contacter

1. Consultez cette **documentation**
2. Vérifiez la **FAQ**
3. Tentez une **synchronisation** forcée

### Quand nous contacter ?

- Bug technique non résolu
- Erreur de données persistante
- Question sur votre abonnement
- Demande de fonctionnalité

### Informations à fournir

Pour un traitement rapide, préparez :

| Information | Exemple |
|-------------|---------|
| Votre email | contact@votreboutique.com |
| URL de votre boutique | votreboutique.myshopify.com |
| Description du problème | "Les stocks ne se synchronisent plus depuis..." |
| Captures d'écran | Si erreur visible |
| Étapes pour reproduire | "1. J'ouvre... 2. Je clique..." |

### Délais de réponse

| Type de demande | Délai |
|-----------------|-------|
| Bug bloquant | < 4h |
| Bug non bloquant | < 24h |
| Question générale | < 48h |
| Demande de fonctionnalité | Suivi mensuel |

### Canaux de contact

- **Email** : support@stockeasy.app
- **Chat in-app** : Bouton aide en bas à droite (si disponible)
      `
    }
  ]
};

// Fonction utilitaire pour rechercher dans les articles
export const searchArticles = (query) => {
  if (!query || query.trim().length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  const results = [];
  
  Object.entries(HELP_ARTICLES).forEach(([categoryId, articles]) => {
    articles.forEach(article => {
      const titleMatch = article.title.toLowerCase().includes(normalizedQuery);
      const summaryMatch = article.summary.toLowerCase().includes(normalizedQuery);
      const contentMatch = article.content.toLowerCase().includes(normalizedQuery);
      
      if (titleMatch || summaryMatch || contentMatch) {
        results.push({
          ...article,
          categoryId,
          relevance: titleMatch ? 3 : summaryMatch ? 2 : 1
        });
      }
    });
  });
  
  // Trier par pertinence
  return results.sort((a, b) => b.relevance - a.relevance);
};

// Fonction pour obtenir un article par son ID
export const getArticleById = (articleId) => {
  for (const [categoryId, articles] of Object.entries(HELP_ARTICLES)) {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      return { ...article, categoryId };
    }
  }
  return null;
};

// Fonction pour obtenir la catégorie par ID
export const getCategoryById = (categoryId) => {
  return HELP_CATEGORIES.find(c => c.id === categoryId);
};

