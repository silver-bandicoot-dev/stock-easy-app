/**
 * Translations for Stockeasy Shopify Embedded App
 * Supports: French (fr), English (en), Spanish (es)
 */

export const translations = {
  fr: {
    // Common
    loading: "Chargement...",
    error: "Erreur",
    back: "Retour",
    sync: "Synchroniser",
    syncNow: "Synchroniser maintenant",
    
    // Connection status
    connected: "connecté",
    notConnected: "non connecté",
    
    // Location selection
    loadingLocations: "Chargement des emplacements...",
    noLocationsFound: "Aucun emplacement actif trouvé. Veuillez configurer au moins un emplacement dans Shopify.",
    singleLocationDetected: "Emplacement détecté",
    singleLocationInfo: "Votre boutique n'a qu'un seul emplacement actif. Il sera utilisé pour la synchronisation du stock.",
    selectLocation: "Choisissez votre emplacement",
    selectLocationDescription: "Sélectionnez l'emplacement à utiliser pour synchroniser votre stock avec Stockeasy.",
    confirmAndConnect: "Confirmer et connecter",
    confirmSelection: "Confirmer la sélection",
    basicPlanInfo: "💡 Plan Basic : 1 emplacement. Passez au plan Pro pour synchroniser plusieurs entrepôts.",
    currentLocation: "Emplacement actuel",
    changeLocation: "Changer d'emplacement",
    
    // Time
    never: "Jamais",
    justNow: "À l'instant",
    minutesAgo: "Il y a {{count}} min",
    hoursAgo: "Il y a {{count}}h",
    daysAgo: "Il y a {{count}} jour(s)",
    
    // Dashboard
    syncedSkus: "SKUs synchronisés",
    lastSkuSync: "dernière synchronisation des SKUs",
    shopNotFound: "Boutique non trouvée",
    connectionSuccess: "🎉 Connexion réussie !",
    connectionError: "Erreur de connexion",
    disconnectConfirm: "Êtes-vous sûr de vouloir déconnecter Stockeasy ? Vos données resteront sur Stockeasy mais ne seront plus synchronisées.",
    disconnectSuccess: "Déconnexion réussie",
    disconnectError: "Erreur lors de la déconnexion",
    syncStarted: "🔄 Synchronisation lancée !",
    syncError: "Erreur lors de la synchronisation",
    openStockeasy: "Ouvrir Stockeasy",
    disconnectStockeasy: "Déconnecter Stockeasy",
    connectToStockeasy: "Connecter à Stockeasy",
    autoSyncInfo: "Les modifications Shopify sont synchronisées automatiquement",
    allSynced: "✅ Tous vos SKUs Shopify sont synchronisés avec Stockeasy !",
    
    // Products to verify
    productsToVerify: "{{count}} produit(s) à vérifier",
    cannotSync: "Ces produits ne peuvent pas être synchronisés",
    viewDetails: "Voir les détails",
    noSku: "sans SKU",
    notTracked: "non suivi",
    toSync: "à synchroniser",
    
    // Help
    needHelp: "Besoin d'aide ?",
    docsAndSupport: "Documentation et support",
    docs: "Docs",
    support: "Support",
    language: "Langue",
    
    // Unsynced page
    unsyncedProducts: "Produits non synchronisés",
    toVerify: "À vérifier",
    totalShopify: "Total Shopify",
    products: "produit(s)",
    
    // Tabs
    withoutSku: "Sans SKU",
    notTrackedTab: "Non suivi",
    toSyncTab: "À synchroniser",
    
    // Solutions
    howToSolve: "💡 Comment résoudre",
    solutionNoSku: "Ajoutez un SKU unique à chaque variante dans Shopify → Produits → [Produit] → Variantes",
    solutionNotTracked: "Activez le suivi d'inventaire dans Shopify → Produits → [Produit] → Inventaire → \"Suivre la quantité\"",
    solutionToSync: "Ces produits ont un SKU valide. Cliquez sur \"Synchroniser\" pour les importer dans Stockeasy.",
    
    // Product details
    variant: "Variante",
    sku: "SKU",
    noSkuBadge: "Aucun SKU",
    status: "Statut",
    active: "Actif",
    draft: "Brouillon",
    editInShopify: "Modifier dans Shopify",
    
    // Success
    allProductsSynced: "🎉 Tous vos produits sont synchronisés avec Stockeasy !",
    
    // Navigation
    home: "Accueil",
    productsToCheck: "Produits à vérifier",
    
    // 404
    pageNotFound: "Page non trouvée. Redirection...",
    
    // Unauthenticated
    openFromShopify: "Veuillez ouvrir cette application depuis votre admin Shopify."
  },
  
  en: {
    // Common
    loading: "Loading...",
    error: "Error",
    back: "Back",
    sync: "Sync",
    syncNow: "Sync now",
    
    // Connection status
    connected: "connected",
    notConnected: "not connected",
    
    // Location selection
    loadingLocations: "Loading locations...",
    noLocationsFound: "No active locations found. Please configure at least one location in Shopify.",
    singleLocationDetected: "Location detected",
    singleLocationInfo: "Your store has only one active location. It will be used for stock synchronization.",
    selectLocation: "Choose your location",
    selectLocationDescription: "Select the location to use for syncing your stock with Stockeasy.",
    confirmAndConnect: "Confirm and connect",
    confirmSelection: "Confirm selection",
    basicPlanInfo: "💡 Basic Plan: 1 location. Upgrade to Pro to sync multiple warehouses.",
    currentLocation: "Current location",
    changeLocation: "Change location",
    
    // Time
    never: "Never",
    justNow: "Just now",
    minutesAgo: "{{count}} min ago",
    hoursAgo: "{{count}}h ago",
    daysAgo: "{{count}} day(s) ago",
    
    // Dashboard
    syncedSkus: "Synced SKUs",
    lastSkuSync: "last SKU sync",
    shopNotFound: "Store not found",
    connectionSuccess: "🎉 Connection successful!",
    connectionError: "Connection error",
    disconnectConfirm: "Are you sure you want to disconnect Stockeasy? Your data will remain on Stockeasy but will no longer sync.",
    disconnectSuccess: "Disconnection successful",
    disconnectError: "Error during disconnection",
    syncStarted: "🔄 Sync started!",
    syncError: "Error during sync",
    openStockeasy: "Open Stockeasy",
    disconnectStockeasy: "Disconnect Stockeasy",
    connectToStockeasy: "Connect to Stockeasy",
    autoSyncInfo: "Shopify changes are automatically synced",
    allSynced: "✅ All your Shopify SKUs are synced with Stockeasy!",
    
    // Products to verify
    productsToVerify: "{{count}} product(s) to verify",
    cannotSync: "These products cannot be synced",
    viewDetails: "View details",
    noSku: "without SKU",
    notTracked: "not tracked",
    toSync: "to sync",
    
    // Help
    needHelp: "Need help?",
    docsAndSupport: "Documentation and support",
    docs: "Docs",
    support: "Support",
    language: "Language",
    
    // Unsynced page
    unsyncedProducts: "Unsynced products",
    toVerify: "To verify",
    totalShopify: "Total Shopify",
    products: "product(s)",
    
    // Tabs
    withoutSku: "Without SKU",
    notTrackedTab: "Not tracked",
    toSyncTab: "To sync",
    
    // Solutions
    howToSolve: "💡 How to solve",
    solutionNoSku: "Add a unique SKU to each variant in Shopify → Products → [Product] → Variants",
    solutionNotTracked: "Enable inventory tracking in Shopify → Products → [Product] → Inventory → \"Track quantity\"",
    solutionToSync: "These products have a valid SKU. Click \"Sync\" to import them into Stockeasy.",
    
    // Product details
    variant: "Variant",
    sku: "SKU",
    noSkuBadge: "No SKU",
    status: "Status",
    active: "Active",
    draft: "Draft",
    editInShopify: "Edit in Shopify",
    
    // Success
    allProductsSynced: "🎉 All your products are synced with Stockeasy!",
    
    // Navigation
    home: "Home",
    productsToCheck: "Products to check",
    
    // 404
    pageNotFound: "Page not found. Redirecting...",
    
    // Unauthenticated
    openFromShopify: "Please open this application from your Shopify admin."
  },
  
  es: {
    // Common
    loading: "Cargando...",
    error: "Error",
    back: "Volver",
    sync: "Sincronizar",
    syncNow: "Sincronizar ahora",
    
    // Connection status
    connected: "conectado",
    notConnected: "no conectado",
    
    // Location selection
    loadingLocations: "Cargando ubicaciones...",
    noLocationsFound: "No se encontraron ubicaciones activas. Configura al menos una ubicación en Shopify.",
    singleLocationDetected: "Ubicación detectada",
    singleLocationInfo: "Tu tienda solo tiene una ubicación activa. Se utilizará para la sincronización del stock.",
    selectLocation: "Elige tu ubicación",
    selectLocationDescription: "Selecciona la ubicación para sincronizar tu stock con Stockeasy.",
    confirmAndConnect: "Confirmar y conectar",
    confirmSelection: "Confirmar selección",
    basicPlanInfo: "💡 Plan Básico: 1 ubicación. Actualiza a Pro para sincronizar múltiples almacenes.",
    currentLocation: "Ubicación actual",
    changeLocation: "Cambiar ubicación",
    
    // Time
    never: "Nunca",
    justNow: "Ahora mismo",
    minutesAgo: "Hace {{count}} min",
    hoursAgo: "Hace {{count}}h",
    daysAgo: "Hace {{count}} día(s)",
    
    // Dashboard
    syncedSkus: "SKUs sincronizados",
    lastSkuSync: "última sincronización de SKUs",
    shopNotFound: "Tienda no encontrada",
    connectionSuccess: "🎉 ¡Conexión exitosa!",
    connectionError: "Error de conexión",
    disconnectConfirm: "¿Estás seguro de que deseas desconectar Stockeasy? Tus datos permanecerán en Stockeasy pero ya no se sincronizarán.",
    disconnectSuccess: "Desconexión exitosa",
    disconnectError: "Error durante la desconexión",
    syncStarted: "🔄 ¡Sincronización iniciada!",
    syncError: "Error durante la sincronización",
    openStockeasy: "Abrir Stockeasy",
    disconnectStockeasy: "Desconectar Stockeasy",
    connectToStockeasy: "Conectar a Stockeasy",
    autoSyncInfo: "Los cambios de Shopify se sincronizan automáticamente",
    allSynced: "✅ ¡Todos tus SKUs de Shopify están sincronizados con Stockeasy!",
    
    // Products to verify
    productsToVerify: "{{count}} producto(s) a verificar",
    cannotSync: "Estos productos no se pueden sincronizar",
    viewDetails: "Ver detalles",
    noSku: "sin SKU",
    notTracked: "no rastreado",
    toSync: "para sincronizar",
    
    // Help
    needHelp: "¿Necesitas ayuda?",
    docsAndSupport: "Documentación y soporte",
    docs: "Docs",
    support: "Soporte",
    language: "Idioma",
    
    // Unsynced page
    unsyncedProducts: "Productos no sincronizados",
    toVerify: "Por verificar",
    totalShopify: "Total Shopify",
    products: "producto(s)",
    
    // Tabs
    withoutSku: "Sin SKU",
    notTrackedTab: "No rastreado",
    toSyncTab: "Para sincronizar",
    
    // Solutions
    howToSolve: "💡 Cómo resolver",
    solutionNoSku: "Añade un SKU único a cada variante en Shopify → Productos → [Producto] → Variantes",
    solutionNotTracked: "Activa el seguimiento de inventario en Shopify → Productos → [Producto] → Inventario → \"Rastrear cantidad\"",
    solutionToSync: "Estos productos tienen un SKU válido. Haz clic en \"Sincronizar\" para importarlos a Stockeasy.",
    
    // Product details
    variant: "Variante",
    sku: "SKU",
    noSkuBadge: "Sin SKU",
    status: "Estado",
    active: "Activo",
    draft: "Borrador",
    editInShopify: "Editar en Shopify",
    
    // Success
    allProductsSynced: "🎉 ¡Todos tus productos están sincronizados con Stockeasy!",
    
    // Navigation
    home: "Inicio",
    productsToCheck: "Productos a verificar",
    
    // 404
    pageNotFound: "Página no encontrada. Redirigiendo...",
    
    // Unauthenticated
    openFromShopify: "Por favor, abre esta aplicación desde tu admin de Shopify."
  }
};

export default translations;

