/**
 * Contenu du Centre d'Aide Stockeasy
 * Documentation complète pour les marchands - Version 2.0 (Audit & Refonte)
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
  LayoutDashboard,
  Lightbulb,
  Zap
} from 'lucide-react';

// Catégories du centre d'aide
export const HELP_CATEGORIES = [
  {
    id: 'onboarding',
    title: 'Démarrage Rapide',
    description: 'Vos premiers succès en 5 minutes',
    icon: Rocket,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    id: 'dashboard',
    title: 'Pilotage Quotidien',
    description: 'Votre routine matinale efficace',
    icon: LayoutDashboard,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    id: 'orders',
    title: 'Réapprovisionner',
    description: 'Commander au bon moment',
    icon: ShoppingBag,
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
  },
  {
    id: 'tracking',
    title: 'Suivi & Réception',
    description: 'De la commande à l\'entrepôt',
    icon: Truck,
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
  },
  {
    id: 'stock',
    title: 'Santé du Stock',
    description: 'Éviter ruptures et surstocks',
    icon: Activity,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600'
  },
  {
    id: 'inventory',
    title: 'Grand Livre d\'Inventaire',
    description: 'Votre source de vérité comptable',
    icon: ClipboardList,
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600'
  },
  {
    id: 'analytics',
    title: 'Analyse & IA',
    description: 'Comprendre pour mieux décider',
    icon: TrendingUp,
    color: 'bg-gradient-to-br from-pink-500 to-pink-600'
  },
  {
    id: 'settings',
    title: 'Configuration',
    description: 'Personnaliser votre expérience',
    icon: Settings,
    color: 'bg-gradient-to-br from-slate-600 to-slate-700'
  },
  {
    id: 'troubleshooting',
    title: 'Aide & Support',
    description: 'Solutions aux problèmes courants',
    icon: AlertTriangle,
    color: 'bg-gradient-to-br from-red-500 to-red-600'
  }
];

// Articles de documentation
export const HELP_ARTICLES = {
  // ============================================
  // ONBOARDING (DÉMARRAGE RAPIDE)
  // ============================================
  onboarding: [
    {
      id: 'welcome',
      title: 'Bienvenue : Votre mission commence ici',
      summary: 'Pourquoi Stockeasy va changer votre quotidien de marchand.',
      content: `
## Bienvenue dans l'aventure Stockeasy !

Gérer un stock, c'est un peu comme jongler : vous devez maintenir l'équilibre entre **avoir assez de produits** pour vendre, et **ne pas en avoir trop** pour ne pas bloquer votre trésorerie. Stockeasy est là pour attraper les balles avant qu'elles ne tombent.

### Ce que vous allez accomplir

Avec Stockeasy, vous passez du mode "Réaction" au mode "Anticipation" :

1.  **Fini les fichiers Excel** : Tout est automatisé et synchronisé avec Shopify.
2.  **Fini les "Je pense qu'il en reste"** : Vous saurez exactement quand commander.
3.  **Fini l'argent qui dort** : Identifiez les stocks morts qui plombent votre rentabilité.

> **Le saviez-vous ?**
> Un marchand moyen perd **15% de son CA annuel** à cause des ruptures de stock. Notre objectif est de réduire ce chiffre à 0%.

### Votre parcours de succès en 3 étapes

1.  **Connectez** votre boutique (C'est fait ?)
2.  **Paramétrez** vos fournisseurs (La clé d'un bon calcul !)
3.  **Suivez** nos recommandations de commande.

Prêt ? Lisez l'article suivant pour connecter votre boutique.
      `
    },
    {
      id: 'shopify-connection',
      title: 'Synchronisation Shopify : Le cœur du système',
      summary: 'Comment nous récupérons vos données pour travailler.',
      content: `
## Connecter votre boutique : La première pierre

Pour que Stockeasy soit intelligent, il a besoin de données. En connectant Shopify, vous nous donnez accès à l'historique de votre activité.

### Ce que nous synchronisons (et pourquoi)

| Donnée | Pourquoi c'est crucial ? |
|--------|--------------------------|
| **Produits** | Pour savoir ce que vous vendez, vos prix et vos SKU. |
| **Commandes** | Pour analyser votre rythme de vente et prédire l'avenir. |
| **Stocks** | Pour connaître votre point de départ actuel. |

### FAQ Synchronisation

**"Est-ce que ça va ralentir mon site ?"**
Non. Nous utilisons les APIs officielles de Shopify en arrière-plan. Votre site client reste rapide comme l'éclair.

**"Combien de temps ça prend ?"**
La première fois, cela peut prendre quelques minutes si vous avez des milliers de produits. Ensuite, c'est quasi-instantané.

> **Conseil de Pro** : 
> Si vous ajoutez un nouveau produit sur Shopify, il apparaîtra dans Stockeasy lors de la prochaine synchro automatique (toutes les heures) ou si vous cliquez sur le bouton "Rafraîchir" en haut à droite.
      `
    },
    {
      id: 'create-suppliers',
      title: 'Fournisseurs : Le secret des bons calculs',
      summary: 'Pourquoi configurer vos fournisseurs est l\'étape la plus importante.',
      content: `
## Pas de fournisseurs, pas de magie !

C'est l'erreur n°1 des nouveaux utilisateurs : négliger la configuration des fournisseurs.
Pour que Stockeasy vous dise **"Commandez maintenant !"**, il doit savoir **"Combien de temps ça met pour arriver ?"**.

### L'anatomie d'un fournisseur bien configuré

Allez dans **Paramètres > Fournisseurs** et créez vos partenaires.

#### 1. Le Délai de Livraison (Lead Time)
C'est le temps entre votre clic sur "Envoyer commande" et la réception des cartons.
*   *Exemple :* Si votre fournisseur chinois met 30 jours à produire + 15 jours de bateau = **45 jours**.
*   *Impact :* Si vous mettez 5 jours au lieu de 45, vous serez en rupture de stock pendant 40 jours !

#### 2. Les Jours de Stock (Safety Stock)
C'est votre matelas de sécurité. Combien de jours voulez-vous "tenir" en cas de retard ?

### Lier les produits (Le Mapping)

Une fois le fournisseur créé, allez dans **Paramètres > Mapping**.
Vous devez dire à Stockeasy : *"Ce T-shirt Bleu vient de chez Grossiste Paris"*.

> **Astuce Rapide**
> Vous pouvez assigner des produits en masse ! Sélectionnez 50 produits d'un coup et assignez-les au même fournisseur en 2 clics.
      `
    },
    {
      id: 'initial-setup',
      title: 'Réglages Initiaux : Votre boussole',
      summary: 'Devise, seuils et sécurité.',
      content: `
## Ajustez Stockeasy à votre réalité

Chaque business est unique. Un vendeur de produits frais ne gère pas son stock comme un vendeur de meubles.

Rendez-vous dans **Paramètres > Généraux**.

### 1. Le Seuil de Surstock (La zone rouge financière)
À partir de quand considérez-vous qu'un produit "dort" trop longtemps ?
*   **Mode / Tendance** : 60 jours (Ça tourne vite !)
*   **Standard** : 90 jours (Recommandé)
*   **Pièces détachées / Meubles** : 180 jours

### 2. Le Multiplicateur de Sécurité (Votre assurance)
C'est un petit coefficient qu'on applique à vos ventes prévues pour ne jamais manquer.
*   **1.0** : Vous êtes joueur. On commande exactement ce qu'on prévoit de vendre.
*   **1.2 (Défaut)** : On prévoit 20% de plus "au cas où". C'est la norme.
*   **1.5** : Vous détestez les ruptures et avez de la place en entrepôt.

> **Conseil d'Expert**
> Commencez avec les réglages par défaut (**90 jours** et **1.2**). Laissez tourner un mois, puis ajustez si vous trouvez que vous stockez trop ou pas assez.
      `
    }
  ],

  // ============================================
  // DASHBOARD (PILOTAGE QUOTIDIEN)
  // ============================================
  dashboard: [
    {
      id: 'dashboard-routine',
      title: 'Votre routine matinale en 30 secondes',
      summary: 'Comment lire votre tableau de bord efficacement.',
      content: `
## Le café du matin avec Stockeasy

Votre tableau de bord n'est pas là pour faire joli. Il est conçu pour répondre à une seule question : **"Qu'est-ce qui brûle aujourd'hui ?"**

### L'ordre de lecture prioritaire

1.  **Badge Rouge "À Commander"** : C'est l'urgence absolue. Ces produits vont bientôt être en rupture (ou le sont déjà).
    *   *Action :* Cliquez dessus pour créer les commandes fournisseurs.

2.  **Commandes Actives** : Où en sont mes arrivages ?
    *   *Action :* Vérifiez s'il y a des retards de livraison.

3.  **Santé du Stock** : La météo globale.
    *   Si la barre verte grandit : Bravo, votre gestion s'améliore.
    *   Si le rouge gagne du terrain : Attention, vos paramètres de réapprovisionnement sont peut-être trop justes.

### Le Graphique de Performance

Il compare votre CA réel vs vos Objectifs. C'est votre motivation quotidienne !
      `
    }
  ],

  // ============================================
  // ORDERS (RÉAPPROVISIONNER)
  // ============================================
  orders: [
    {
      id: 'order-logic',
      title: 'La magie du calcul de commande',
      summary: 'Comment nous décidons QUAND et COMBIEN commander.',
      content: `
## "Comment avez-vous su qu'il fallait commander ça ?"

C'est la question qu'on nous pose le plus. Voici les coulisses de notre algorithme, expliqué simplement.

### L'exemple du T-shirt Blanc

Imaginons :
*   Vous vendez en moyenne **2 T-shirts par jour**.
*   Votre fournisseur met **10 jours** à livrer.
*   Vous voulez **5 jours** de sécurité.

#### 1. Quand commander ? (Le Point de Commande)
Il faut commander quand il vous reste assez de stock pour tenir pendant la livraison + la sécurité.
*   Besoin pendant livraison : 10 jours × 2 ventes = 20 T-shirts.
*   Sécurité : 5 jours × 2 ventes = 10 T-shirts.
*   **Résultat** : Dès que votre stock tombe à **30 T-shirts**, Stockeasy sonne l'alarme ! 🚨

#### 2. Combien commander ?
L'objectif est de remonter le stock à un niveau confortable (par exemple pour tenir 60 jours).
*   Objectif : 60 jours × 2 ventes = 120 T-shirts.
*   Si vous en avez 30, Stockeasy vous suggérera d'en commander **90**.

> **Le saviez-vous ?**
> Notre algorithme lisse les pics exceptionnels. Si un influenceur parle de vous et que vous vendez 50 T-shirts un mardi (alors que d'habitude c'est 2), on ne va pas vous demander d'en commander 5000 le lendemain. On analyse la tendance long terme.
      `
    },
    {
      id: 'create-po',
      title: 'Créer et envoyer une commande (PO)',
      summary: 'Le processus de A à Z pour réapprovisionner.',
      content: `
## De la recommandation au bon de commande

Dans l'onglet "Passer Commande", Stockeasy a déjà fait le travail de tri pour vous.

### Étape 1 : Vérification (Le "Sanity Check")
Stockeasy suggère, mais VOUS décidez.
*   Regardez la colonne "Qte Rec" (Quantité Recommandée).
*   Vous savez quelque chose qu'on ignore ? (Ex: "Ce produit va être arrêté").
*   Modifiez le chiffre manuellement si besoin.

### Étape 2 : Validation
Cliquez sur **"Créer la commande"**.
*   Une fenêtre s'ouvre avec le récapitulatif.
*   Choisissez l'entrepôt de destination (Important pour la réception !).

### Étape 3 : Envoi au fournisseur
Deux options s'offrent à vous :
1.  **Envoi par Email** : Si vous avez connecté Gmail/Outlook, un brouillon propre est prêt à partir avec le PDF joint.
2.  **Export CSV/PDF** : Téléchargez le bon de commande pour l'envoyer via WhatsApp, Wechat ou votre propre système mail.

> **Note Importante**
> Tant que vous n'avez pas cliqué sur "Confirmer", la commande reste en "Brouillon". Le stock "Commandé" (On Order) n'est mis à jour qu'après confirmation.
      `
    }
  ],

  // ============================================
  // TRACKING (SUIVI & RÉCEPTION)
  // ============================================
  tracking: [
    {
      id: 'receiving',
      title: 'Réceptionner une commande (Check-in)',
      summary: 'Transformer les cartons reçus en stock vendable.',
      content: `
## Le moment de vérité : La livraison est arrivée

Le camion est parti, les cartons sont dans l'entrepôt. Il faut maintenant dire à Stockeasy (et à Shopify) que le stock est là.

### Pourquoi utiliser la Réconciliation ?
Ne modifiez pas juste le stock manuellement dans Shopify !
La fonction "Réconciliation" permet de :
1.  Vérifier s'il manque des produits.
2.  Tracer qui a reçu quoi et quand.
3.  Mettre à jour le "Coût moyen pondéré" (si vos prix d'achat changent).

### La procédure en 3 clics

1.  Allez dans **Mes Commandes** > Onglet **En Transit**.
2.  Ouvrez la commande concernée et cliquez sur **"Réceptionner"**.
3.  **Comptez !**
    *   Si tout est parfait : Cliquez sur "Tout recevoir".
    *   S'il y a des écarts : Entrez la quantité réelle reçue.

### Gérer les problèmes (Manquants/Cassés)
Si vous attendiez 100 pièces et n'en recevez que 90 :
*   Entrez "90" dans la case "Reçu".
*   Stockeasy va marquer la commande comme "Partiellement reçue".
*   Vous pouvez soit **clore** la commande (et demander un remboursement), soit laisser le reste **en attente** (Backorder) si le fournisseur va envoyer la suite plus tard.
      `
    }
  ],

  // ============================================
  // STOCK & INVENTORY (SANTÉ & INVENTAIRE)
  // ============================================
  stock: [
    {
      id: 'stock-health-colors',
      title: 'Comprendre les couleurs de santé',
      summary: 'Vert, Orange, Rouge : Que faire ?',
      content: `
## Le Feu Tricolore de votre Stock

Nous avons simplifié l'analyse complexe en un code couleur simple.

### 🔴 Rouge : URGENT (Rupture imminente)
*   **Situation** : Il vous reste moins de jours de stock que le délai de livraison de votre fournisseur.
*   **Traduction** : Même si vous commandez *maintenant*, vous risquez d'être en rupture avant que ça n'arrive.
*   **Action** : Commandez immédiatement ! Envisagez une livraison express si possible.

### 🟠 Orange : À SURVEILLER (Zone d'attention)
*   **Situation** : Vous approchez du point de commande.
*   **Traduction** : Vous avez encore du stock, mais il faut préparer la prochaine commande cette semaine.
*   **Action** : Vérifiez si vous pouvez grouper avec d'autres produits pour atteindre le Franco de port (Minimum de commande).

### 🟢 Vert : SAIN (Zone de confort)
*   **Situation** : Vous avez assez de stock pour voir venir.
*   **Action** : Rien à faire. Dormez tranquille.

### 🔵 Bleu : SURSTOCK (Trop de gras)
*   **Situation** : Vous avez pour plus de 90 jours (ou votre seuil personnalisé) de stock.
*   **Risque** : Votre argent est bloqué sur des étagères.
*   **Action** : Prévoyez une promotion, un bundle ou une mise en avant marketing pour écouler ce surplus et récupérer du cash.
      `
    },
    {
      id: 'abc-analysis',
      title: 'L\'Inventaire Expert (ABC)',
      summary: 'Tous les produits ne se valent pas.',
      content: `
## La loi de Pareto (80/20) dans votre stock

Dans l'onglet Inventaire, ne traitez pas tous les produits à égalité.

### Classe A : Les Stars 🌟
Ce sont vos 20% de produits qui font 80% de votre chiffre d'affaires.
*   **Stratégie** : Zéro tolérance pour la rupture. Sur-stockez légèrement s'il le faut. Surveillez-les comme le lait sur le feu.

### Classe B : Les Classiques 👔
Produits réguliers, ventes stables.
*   **Stratégie** : Automatisez au maximum avec les réglages standards.

### Classe C : Les "Traîne-savates" 🐌
Produits qui se vendent peu, accessoires, vieilles collections.
*   **Stratégie** : Attention au surstock ! Ne recommandez que si vous avez une commande client ferme. N'hésitez pas à déstocker pour faire de la place.

> **Conseil** : Utilisez les filtres de colonnes dans l'onglet Inventaire pour trier par "Valeur Stock (Vente)" et identifier vos classes A, B, C.
      `
    }
  ],

  // ============================================
  // ANALYTICS & IA
  // ============================================
  analytics: [
    {
      id: 'forecast-explained',
      title: 'Comment l\'IA prédit l\'avenir ?',
      summary: 'Saisonnalité, tendance et bruit.',
      content: `
## Pas de boule de cristal, juste des mathématiques

Stockeasy utilise des modèles statistiques avancés pour tracer la ligne pointillée du futur.

### Ce que l'IA détecte

1.  **La Tendance (Trend)** : "Vos ventes de bonnets augmentent de 10% chaque mois depuis 3 mois."
2.  **La Saisonnalité** : "Chaque année en novembre, les ventes doublent." (Nous avons besoin d'au moins 12 mois d'historique pour être précis ici).
3.  **Les événements exceptionnels** : Si vous avez fait une grosse promo "1 acheté = 1 offert" l'an dernier, l'IA essaie de comprendre que ce n'est pas la demande "normale".

### Aider l'IA à être meilleure

L'IA apprend de votre passé.
*   **Si vous êtes souvent en rupture** : L'IA voit 0 vente et peut croire que la demande a baissé. Stockeasy corrige cela en regardant si le stock était à 0.
*   **Soyez réguliers** : Plus vos données sont propres (stocks à jour, réceptions validées), plus la prédiction sera fine.
      `
    }
  ],

  // ============================================
  // SETTINGS (CONFIGURATION)
  // ============================================
  settings: [
    {
      id: 'integrations-setup',
      title: 'Connecter vos emails (Gmail / Outlook)',
      summary: 'Envoyez vos commandes fournisseurs directement depuis Stockeasy.',
      content: `
## Simplifiez vos envois de commandes

Stockeasy peut se connecter à votre compte Gmail ou Outlook pour envoyer les Purchase Orders (PO) sans quitter l'application.

### Pourquoi connecter ?
*   **Gain de temps** : Plus besoin de télécharger le PDF, ouvrir votre mail, créer un nouveau message, attacher la pièce jointe...
*   **Professionnalisme** : Les emails partent de VOTRE adresse, avec votre signature habituelle.
*   **Traçabilité** : Vous retrouvez les emails envoyés dans votre dossier "Messages envoyés".

### Comment faire ?
1.  Allez dans **Paramètres > Intégrations**.
2.  Choisissez votre fournisseur (Google ou Microsoft).
3.  Cliquez sur "Connecter" et validez les autorisations.
4.  C'est tout ! La prochaine fois que vous créez une commande, l'option "Envoyer par email" sera active.
      `
    },
    {
      id: 'advanced-params',
      title: 'Paramètres de Calcul Avancés',
      summary: 'Ajustez la sensibilité de l\'algorithme.',
      content: `
## Devenez le maître de l'algorithme

Dans **Paramètres > Généraux**, vous pouvez affiner le comportement de Stockeasy.

### Les leviers principaux

#### 1. Période d'analyse (Historique)
Par défaut, nous regardons les **90 derniers jours** de ventes pour calculer votre moyenne quotidienne.
*   *Vous vendez des produits très saisonniers ?* Réduisez à 30 jours pour être plus réactif.
*   *Vous avez des ventes très stables ?* Augmentez à 180 jours pour lisser les pics.

#### 2. Jours de Stock de Sécurité (Par défaut)
C'est la valeur appliquée aux nouveaux fournisseurs si vous ne précisez rien.
*   Augmentez cette valeur si vos fournisseurs sont peu fiables.
*   Diminuez-la si vous voulez fonctionner en flux tendu (Just-in-Time).

#### 3. Fréquence de commande
À quelle fréquence aimez-vous passer commande ?
*   Si vous commandez **toutes les semaines**, Stockeasy vous proposera de plus petites quantités.
*   Si vous commandez **tous les mois**, les quantités recommandées seront plus importantes pour tenir la durée.
      `
    }
  ],

  // ============================================
  // TROUBLESHOOTING & FAQ
  // ============================================
  troubleshooting: [
    {
      id: 'faq-top',
      title: 'Top 5 des questions fréquentes',
      summary: 'Réponses rapides pour vous débloquer.',
      content: `
## SOS Stockeasy

### 1. "Mes stocks ne correspondent pas à Shopify !"
C'est souvent un délai de synchronisation.
*   **Solution** : Cliquez sur le bouton "Rafraîchir" (les deux flèches) en haut à droite. Attendez 30 secondes. Toujours pareil ? Vérifiez si vous n'avez pas des commandes "non remplies" (Unfulfilled) qui réservent du stock.

### 2. "Pourquoi on me demande de commander 1000 pièces ?"
*   **Cause probable** : Une erreur de configuration fournisseur.
*   **Vérification** : Allez voir le **Délai de Livraison** (Lead Time) de ce fournisseur. Avez-vous mis 100 jours au lieu de 10 ? Ou alors le **MOQ** (Minimum de commande) est fixé à 1000 ?

### 3. "Je ne reçois pas les emails de commande"
*   **Vérification** : Avez-vous vérifié vos spams ? Avez-vous configuré l'adresse "Expéditeur" dans les paramètres ?
*   **Solution temporaire** : Téléchargez le PDF de la commande et envoyez-le manuellement depuis votre boîte mail perso.

### 4. "Comment gérer plusieurs entrepôts ?"
Pour l'instant, Stockeasy ne gère qu'un seul emplacement de stock (la somme de tous vos emplacements Shopify).
La gestion multi-sites (entrepôts distincts) est une fonctionnalité prévue pour une prochaine mise à jour majeure.

### 5. "Puis-je annuler une réception de commande ?"
Aïe, c'est délicat car cela a déjà modifié vos stocks Shopify.
*   Non, on ne peut pas "annuler" en un clic car les produits ont peut-être déjà été vendus entre temps.
*   **Solution** : Vous devez faire un ajustement de stock manuel dans Shopify pour corriger l'erreur.
      `
    },
    {
      id: 'support',
      title: 'Contacter le Support Humain',
      summary: 'Quand l\'IA ne suffit plus.',
      content: `
## On est là pour vous !

Vous êtes bloqué ? Vous avez une idée de génie pour une nouvelle fonctionnalité ?

### Les canaux

*   📧 **Email** : support@stockeasy.app (Réponse sous 24h)
*   💬 **Chat** : Bulle en bas à droite (9h-18h CET)

### Pour nous aider à vous aider
Si vous signalez un bug, donnez-nous le **SKU** du produit qui pose problème ou le **numéro de la commande** (PO-xxxx). "Ça ne marche pas" est difficile à diagnostiquer. "Le produit TSHIRT-BLUE affiche 0 stock alors que j'en ai 10" est une enquête que nous pouvons résoudre en 5 minutes !
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
