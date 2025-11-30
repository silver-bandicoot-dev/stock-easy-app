/**
 * Données de test pour les tests E2E StockEasy
 */

// Utilisateurs de test (fictifs pour la démonstration)
export const testUsers = {
  valid: {
    email: 'test@stockeasy.app',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  invalid: {
    email: 'invalid@test.com',
    password: 'wrongpassword',
  },
  admin: {
    email: 'admin@stockeasy.app',
    password: 'AdminPassword123!',
    role: 'admin',
  },
};

// Données de waitlist
export const waitlistData = {
  validEmail: 'waitlist-test@example.com',
  invalidEmail: 'not-an-email',
  duplicateEmail: 'duplicate@example.com',
};

// URLs de test
export const testUrls = {
  public: {
    home: '/',
    preview: '/preview',
    login: '/login',
    forgotPassword: '/forgot-password',
    confirmEmail: '/confirm-email',
    legalTerms: '/legal/terms',
    legalPrivacy: '/legal/privacy',
    legalNotices: '/legal/notices',
    legalCookies: '/legal/cookies',
  },
  protected: {
    app: '/app',
    profile: '/profile',
    notifications: '/notifications',
    testSupabase: '/test-supabase',
    acceptInvitation: '/accept-invitation',
  },
};

// Onglets de l'application
export const appTabs = {
  dashboard: 'dashboard',
  actions: 'actions',
  orders: 'orders',
  stock: 'stock',
  inventory: 'inventory',
  analytics: 'analytics',
  settings: 'settings',
  profile: 'profile',
  help: 'help',
};

// Sous-onglets Analytics
export const analyticsSubTabs = {
  kpi: 'kpi',
  tendances: 'tendances',
  fournisseurs: 'fournisseurs',
  produits: 'produits',
};

// Sous-onglets Paramètres
export const settingsSubTabs = {
  general: 'general',
  fournisseurs: 'fournisseurs',
  entrepots: 'entrepots',
  mapping: 'mapping',
  multiplicateurs: 'multiplicateurs',
  integrations: 'integrations',
};

// Produits de test (mock)
export const mockProducts = [
  {
    id: 'prod_1',
    sku: 'SKU-001',
    nom: 'Produit Test 1',
    stock_actuel: 50,
    stock_securite: 10,
    prix_achat: 15.00,
    prix_vente: 29.99,
    fournisseur_id: 'supplier_1',
  },
  {
    id: 'prod_2',
    sku: 'SKU-002',
    nom: 'Produit Test 2 - Stock Bas',
    stock_actuel: 5,
    stock_securite: 10,
    prix_achat: 25.00,
    prix_vente: 49.99,
    fournisseur_id: 'supplier_1',
  },
  {
    id: 'prod_3',
    sku: 'SKU-003',
    nom: 'Produit Test 3 - Rupture',
    stock_actuel: 0,
    stock_securite: 5,
    prix_achat: 10.00,
    prix_vente: 19.99,
    fournisseur_id: 'supplier_2',
  },
];

// Fournisseurs de test (mock)
export const mockSuppliers = [
  {
    id: 'supplier_1',
    nom_fournisseur: 'Fournisseur Principal',
    email: 'supplier1@test.com',
    lead_time_days: 14,
    moq: 10,
  },
  {
    id: 'supplier_2',
    nom_fournisseur: 'Fournisseur Secondaire',
    email: 'supplier2@test.com',
    lead_time_days: 7,
    moq: 5,
  },
];

// Commandes de test (mock)
export const mockOrders = [
  {
    id: 'order_1',
    po_number: 'PO-2024-001',
    status: 'pending_confirmation',
    supplier_id: 'supplier_1',
    total: 500.00,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'order_2',
    po_number: 'PO-2024-002',
    status: 'in_transit',
    supplier_id: 'supplier_2',
    total: 250.00,
    created_at: '2024-01-14T14:30:00Z',
  },
];

// Entrepôts de test (mock)
export const mockWarehouses = [
  {
    id: 'warehouse_1',
    nom: 'Entrepôt Principal',
    adresse: '123 Rue du Commerce, Paris',
    is_default: true,
  },
  {
    id: 'warehouse_2',
    nom: 'Entrepôt Secondaire',
    adresse: '456 Avenue des Stocks, Lyon',
    is_default: false,
  },
];

// Timeouts et délais
export const timeouts = {
  short: 1000,
  medium: 3000,
  long: 10000,
  navigation: 30000,
};

// Breakpoints pour les tests responsive
export const breakpoints = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1280, height: 800 },
  desktopLarge: { width: 1920, height: 1080 },
};

