export const ORDER_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.DRAFT]: 'Brouillon',
  [ORDER_STATUS.CONFIRMED]: 'Confirmée',
  [ORDER_STATUS.PREPARING]: 'En préparation',
  [ORDER_STATUS.SHIPPED]: 'Expédiée',
  [ORDER_STATUS.DELIVERED]: 'Livrée',
  [ORDER_STATUS.CANCELLED]: 'Annulée',
};

export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  URGENT: 'urgent',
};

export const HEALTH_STATUS_COLORS = {
  [HEALTH_STATUS.HEALTHY]: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    border: 'border-success-200',
    dot: 'bg-success-500',
  },
  [HEALTH_STATUS.WARNING]: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    border: 'border-warning-200',
    dot: 'bg-warning-500',
  },
  [HEALTH_STATUS.URGENT]: {
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    border: 'border-danger-200',
    dot: 'bg-danger-500',
  },
};

export const TOOLTIPS = {
  toOrder: "Produits dont le stock actuel est en-dessous du point de commande. Il faut passer commande maintenant pour éviter une rupture de stock.",
  watch: "Produits dont le stock approche du point de commande (dans les 20% au-dessus). À surveiller de près pour anticiper la prochaine commande.",
  inTransit: "Commandes déjà passées auprès des fournisseurs et en cours d'acheminement. Le délai estimé est calculé selon les délais habituels du fournisseur.",
  received: "Commandes arrivées à l'entrepôt et en attente de validation. Vérifiez les quantités reçues avant de valider pour mettre à jour le stock.",
  multiplier: "Coefficient pour ajuster les prévisions selon la saisonnalité ou les événements (BFCM, soldes). 1 = normal, 0.5 = hors saison, 5 = pic majeur.",
  securityStock: "Nombre de jours de ventes supplémentaires à garder en stock pour absorber les imprévus (retards fournisseur, pics de ventes). Calculé automatiquement à 20% du délai fournisseur. La valeur stockée est en unités, mais peut être convertie en jours pour l'affichage.",
  reorderPoint: "Niveau de stock critique qui déclenche une alerte de commande. Calculé pour couvrir les ventes pendant le délai de réapprovisionnement + stock de sécurité.",
  stockHealth: "Indicateur visuel de la santé du stock. Vert = bon niveau, Orange = surveillance nécessaire, Rouge = urgent à commander.",
  skuAvailability: "Pourcentage de produits disponibles en stock par rapport au total des SKU actifs.",
  salesLost: "⚠️ ATTENTION : Différent du Dashboard ! Compte UNIQUEMENT les produits EN RUPTURE TOTALE (stock = 0). Mesure les pertes RÉELLES actuelles, pas les risques futurs. Pour voir les produits à risque, consultez le Dashboard.",
  salesLostDashboard: "⚠️ ATTENTION : Différent d'Analytics ! Inclut TOUS les produits à risque (ruptures actuelles + produits qui vont manquer bientôt). Permet d'anticiper les pertes avant la rupture totale. Pour voir uniquement les ruptures réelles, consultez Analytics.",
  deepOverstock: "Valeur financière des produits dont le stock dépasse largement la demande prévue."
};
