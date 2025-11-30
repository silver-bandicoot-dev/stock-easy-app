/**
 * Utilitaires pour améliorer la recherche avec gestion des accents, 
 * détection du type et traduction multilingue
 */

/**
 * Normalise un texte en supprimant les accents et en le mettant en minuscules
 * @param {string} text - Texte à normaliser
 * @returns {string} Texte normalisé
 */
export const normalizeText = (text = '') => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .trim();
};

/**
 * Dictionnaire de traduction des termes de recherche courants
 * Permet de traduire les termes EN/ES vers FR pour améliorer la recherche
 * (la base de données contient des données en français)
 */
export const SEARCH_TRANSLATIONS = {
  // === PRODUITS / PRODUCTS / PRODUCTOS ===
  // Anglais -> Français
  'product': 'produit',
  'products': 'produits',
  'item': 'article',
  'items': 'articles',
  'inventory': 'inventaire',
  'stock': 'stock',
  'stocks': 'stocks',
  'reference': 'reference',
  'ref': 'ref',
  'white': 'blanc',
  'black': 'noir',
  'red': 'rouge',
  'blue': 'bleu',
  'green': 'vert',
  'yellow': 'jaune',
  'orange': 'orange',
  'pink': 'rose',
  'purple': 'violet',
  'grey': 'gris',
  'gray': 'gris',
  'brown': 'marron',
  'shirt': 'chemise',
  't-shirt': 't-shirt',
  'tshirt': 't-shirt',
  'pants': 'pantalon',
  'trousers': 'pantalon',
  'dress': 'robe',
  'jacket': 'veste',
  'coat': 'manteau',
  'shoes': 'chaussures',
  'shoe': 'chaussure',
  'sneakers': 'baskets',
  'hat': 'chapeau',
  'cap': 'casquette',
  'bag': 'sac',
  'bags': 'sacs',
  'accessory': 'accessoire',
  'accessories': 'accessoires',
  'small': 'petit',
  'medium': 'moyen',
  'large': 'grand',
  'size': 'taille',
  'out of stock': 'rupture',
  'stockout': 'rupture',
  'overstock': 'surstock',
  'low stock': 'stock bas',
  
  // Espagnol -> Français  
  'producto': 'produit',
  'productos': 'produits',
  'articulo': 'article',
  'articulos': 'articles',
  'inventario': 'inventaire',
  'blanco': 'blanc',
  'negro': 'noir',
  'rojo': 'rouge',
  'azul': 'bleu',
  'verde': 'vert',
  'amarillo': 'jaune',
  'naranja': 'orange',
  'rosa': 'rose',
  'morado': 'violet',
  'gris': 'gris',
  'marron': 'marron',
  'camisa': 'chemise',
  'camiseta': 't-shirt',
  'pantalon': 'pantalon',
  'vestido': 'robe',
  'chaqueta': 'veste',
  'abrigo': 'manteau',
  'zapatos': 'chaussures',
  'zapato': 'chaussure',
  'sombrero': 'chapeau',
  'gorra': 'casquette',
  'bolso': 'sac',
  'bolsa': 'sac',
  'pequeno': 'petit',
  'mediano': 'moyen',
  'grande': 'grand',
  'talla': 'taille',
  'agotado': 'rupture',
  'exceso': 'surstock',

  // === FOURNISSEURS / SUPPLIERS / PROVEEDORES ===
  'supplier': 'fournisseur',
  'suppliers': 'fournisseurs',
  'vendor': 'fournisseur',
  'vendors': 'fournisseurs',
  'provider': 'fournisseur',
  'providers': 'fournisseurs',
  'manufacturer': 'fabricant',
  'manufacturers': 'fabricants',
  'distributor': 'distributeur',
  'distributors': 'distributeurs',
  'wholesaler': 'grossiste',
  'wholesalers': 'grossistes',
  'lead time': 'delai livraison',
  'delivery time': 'delai livraison',
  'contact': 'contact',
  
  // Espagnol
  'proveedor': 'fournisseur',
  'proveedores': 'fournisseurs',
  'fabricante': 'fabricant',
  'fabricantes': 'fabricants',
  'distribuidor': 'distributeur',
  'distribuidores': 'distributeurs',
  'mayorista': 'grossiste',
  'mayoristas': 'grossistes',
  'tiempo de entrega': 'delai livraison',
  'plazo de entrega': 'delai livraison',
  'contacto': 'contact',

  // === COMMANDES / ORDERS / PEDIDOS ===
  'order': 'commande',
  'orders': 'commandes',
  'purchase': 'achat',
  'purchases': 'achats',
  'purchase order': 'bon de commande',
  'po': 'commande',
  'pending': 'en attente',
  'preparing': 'preparation',
  'in transit': 'en transit',
  'shipped': 'expedie',
  'received': 'recu',
  'delivered': 'livre',
  'cancelled': 'annule',
  'tracking': 'suivi',
  'tracking number': 'numero de suivi',
  
  // Espagnol
  'pedido': 'commande',
  'pedidos': 'commandes',
  'compra': 'achat',
  'compras': 'achats',
  'orden de compra': 'bon de commande',
  'pendiente': 'en attente',
  'preparando': 'preparation',
  'en transito': 'en transit',
  'enviado': 'expedie',
  'recibido': 'recu',
  'entregado': 'livre',
  'cancelado': 'annule',
  'seguimiento': 'suivi',
  'numero de seguimiento': 'numero de suivi',

  // === ENTREPOTS / WAREHOUSES / ALMACENES ===
  'warehouse': 'entrepot',
  'warehouses': 'entrepots',
  'storage': 'stockage',
  'depot': 'depot',
  'location': 'emplacement',
  'locations': 'emplacements',
  'store': 'magasin',
  'stores': 'magasins',
  'facility': 'installation',
  'facilities': 'installations',
  'address': 'adresse',
  'city': 'ville',
  'country': 'pays',
  
  // Espagnol
  'almacen': 'entrepot',
  'almacenes': 'entrepots',
  'almacenamiento': 'stockage',
  'deposito': 'depot',
  'ubicacion': 'emplacement',
  'ubicaciones': 'emplacements',
  'tienda': 'magasin',
  'tiendas': 'magasins',
  'direccion': 'adresse',
  'ciudad': 'ville',
  'pais': 'pays',

  // === TERMES GÉNÉRAUX / GENERAL TERMS ===
  'search': 'recherche',
  'find': 'trouver',
  'show': 'afficher',
  'display': 'afficher',
  'all': 'tout',
  'new': 'nouveau',
  'old': 'ancien',
  'recent': 'recent',
  'today': 'aujourd hui',
  'yesterday': 'hier',
  'week': 'semaine',
  'month': 'mois',
  'year': 'annee',
  'price': 'prix',
  'cost': 'cout',
  'value': 'valeur',
  'total': 'total',
  'quantity': 'quantite',
  'qty': 'qte',
  'amount': 'montant',
  'urgent': 'urgent',
  'warning': 'attention',
  'alert': 'alerte',
  'healthy': 'sain',
  
  // Espagnol
  'buscar': 'recherche',
  'encontrar': 'trouver',
  'mostrar': 'afficher',
  'todo': 'tout',
  'nuevo': 'nouveau',
  'antiguo': 'ancien',
  'reciente': 'recent',
  'hoy': 'aujourd hui',
  'ayer': 'hier',
  'semana': 'semaine',
  'mes': 'mois',
  'ano': 'annee',
  'precio': 'prix',
  'costo': 'cout',
  'coste': 'cout',
  'valor': 'valeur',
  'cantidad': 'quantite',
  'monto': 'montant',
  'urgente': 'urgent',
  'atencion': 'attention',
  'alerta': 'alerte',
  'saludable': 'sain'
};

/**
 * Traduit et enrichit un terme de recherche pour améliorer les résultats
 * @param {string} query - Terme de recherche original
 * @returns {string} Terme de recherche enrichi avec traductions
 */
export const translateSearchTerm = (query) => {
  if (!query || query.length < 2) return query;
  
  const normalized = normalizeText(query);
  const words = normalized.split(/\s+/);
  const translatedWords = [];
  
  for (const word of words) {
    // Ajouter le mot original
    translatedWords.push(word);
    
    // Vérifier si une traduction existe
    const translation = SEARCH_TRANSLATIONS[word];
    if (translation && translation !== word) {
      translatedWords.push(translation);
    }
    
    // Vérifier aussi les expressions composées (2-3 mots)
    const remainingWords = words.slice(words.indexOf(word));
    for (let len = 2; len <= Math.min(3, remainingWords.length); len++) {
      const phrase = remainingWords.slice(0, len).join(' ');
      const phraseTranslation = SEARCH_TRANSLATIONS[phrase];
      if (phraseTranslation) {
        translatedWords.push(phraseTranslation);
      }
    }
  }
  
  // Retourner les mots uniques
  return [...new Set(translatedWords)].join(' ');
};

/**
 * Obtient les variantes de recherche possibles pour un terme
 * @param {string} query - Terme de recherche original
 * @returns {string[]} Liste de variantes de recherche
 */
export const getSearchVariants = (query) => {
  if (!query || query.length < 2) return [query];
  
  const variants = new Set([query]);
  const normalized = normalizeText(query);
  const words = normalized.split(/\s+/);
  
  // Ajouter la version normalisée
  variants.add(normalized);
  
  // Traduire chaque mot et ajouter les variantes
  for (const word of words) {
    const translation = SEARCH_TRANSLATIONS[word];
    if (translation) {
      variants.add(translation);
      // Remplacer le mot dans la query originale
      const translatedQuery = normalized.replace(word, translation);
      variants.add(translatedQuery);
    }
  }
  
  // Vérifier les expressions composées
  for (const [phrase, translation] of Object.entries(SEARCH_TRANSLATIONS)) {
    if (normalized.includes(phrase) && phrase.includes(' ')) {
      variants.add(translation);
      variants.add(normalized.replace(phrase, translation));
    }
  }
  
  return [...variants].filter(v => v && v.length >= 2);
};

/**
 * Détecte le type de recherche souhaité par l'utilisateur
 * Support multilingue : FR, EN, ES
 * @param {string} query - Terme de recherche
 * @returns {Object} Type de recherche détecté et termes associés
 */
export const detectSearchType = (query) => {
  const normalized = normalizeText(query);
  
  // Patterns multilingues améliorés (FR, EN, ES)
  const patterns = {
    product: /(?:produit|product|producto|article|articulo|item|sku|stock|inventaire|inventory|inventario|ref(?:erence|erencia)?|catalogue|catalog|catalogo)/i,
    supplier: /(?:fournisseur|supplier|proveedor|vendor|vendeur|vendedor|distributeur|distributor|distribuidor|grossiste|wholesaler|mayorista|fabricant|manufacturer|fabricante|@|mail|email)/i,
    order: /(?:commande|order|pedido|po|achat|purchase|compra|bon|tracking|suivi|seguimiento|livraison|delivery|entrega|^#)/i,
    warehouse: /(?:entrepot|warehouse|almacen|depot|deposito|stockage|storage|almacenamiento|magasin|store|tienda|emplacement|location|ubicacion|ville|city|ciudad|adresse|address|direccion)/i
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(query)) {
      return { type, priority: true, confidence: 'high' };
    }
  }
  
  // Détection format Commande explicite (commence par #)
  if (/^#\d+$/.test(normalized)) {
    return { type: 'order', priority: true, confidence: 'high' };
  }

  // Si tout chiffres (4+), ambigu -> produit (EAN) ou commande
  // On retourne 'all' pour chercher partout
  if (/^\d{4,}$/.test(normalized)) {
    return { type: 'all', priority: false, confidence: 'medium' };
  }

  // Détection format Email
  if (normalized.includes('@') || normalized.includes('.com') || normalized.includes('.fr') || normalized.includes('.es')) {
    return { type: 'supplier', priority: true, confidence: 'high' };
  }

  // Détection par format SKU (lettres + chiffres/tirets, min 3 chars)
  // Exemples: SKU-001, P123, REF-A
  if (/^[A-Z0-9-]{3,}$/i.test(normalized) && (/\d/.test(normalized) || /-/.test(normalized))) {
    return { type: 'product', priority: true, confidence: 'medium' };
  }
  
  // Par défaut, tout rechercher
  return { type: 'all', priority: false, confidence: 'low' };
};
