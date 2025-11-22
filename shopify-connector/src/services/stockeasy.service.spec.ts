import { StockEasyService } from '../services/stockeasy.service';
import { config } from '../config';

// Mock Supabase client
const mockFrom = jest.fn();
const mockUpsert = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

describe('StockEasyService', () => {
  let service: StockEasyService;

  beforeEach(() => {
    // Setup mocks chain
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      update: mockUpdate,
      insert: mockInsert,
    });
    mockUpsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockEq.mockReturnValue({ eq: mockEq, select: mockSelect }); // Chainable eq
    mockSelect.mockResolvedValue({ data: [], error: null });

    // Config mock
    config.stockEasy.supabaseUrl = 'https://mock.supabase.co';
    config.stockEasy.supabaseServiceRoleKey = 'mock-key';

    service = new StockEasyService();
    jest.clearAllMocks();
  });

  describe('syncProductFromShopify', () => {
    it('should upsert product to Supabase', async () => {
      const product = {
        sku: 'TEST-SKU',
        name: 'Test Product',
        stock: 10,
        price: 100,
      };
      const companyId = 'company-123';

      await service.syncProductFromShopify(companyId, product);

      expect(mockFrom).toHaveBeenCalledWith('produits');
      expect(mockUpsert).toHaveBeenCalledWith({
        sku: product.sku,
        company_id: companyId,
        nom: product.name,
        stock_actuel: product.stock,
        prix_vente: product.price,
      }, { onConflict: 'sku,company_id' });
    });
  });

  describe('processOrder', () => {
    it('should insert sales history', async () => {
      const orderData = {
        shopifyOrderId: '12345',
        total: 200,
        lineItems: [
          { sku: 'ITEM-1', quantity: 2, price: 50, variantId: 'v1' },
        ],
      };
      const companyId = 'company-123';

      await service.processOrder(companyId, orderData);

      expect(mockFrom).toHaveBeenCalledWith('sales_history');
      expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          sku: 'ITEM-1',
          quantity: 2,
          revenue: 100,
          source: 'shopify',
          company_id: companyId,
        })
      ]));
    });
  });
});


