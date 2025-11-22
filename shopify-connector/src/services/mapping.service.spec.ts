import { MappingService } from '../services/mapping.service';
import { prisma } from '../utils/database';

describe('MappingService', () => {
  let service: MappingService;

  beforeEach(() => {
    service = new MappingService();
    jest.clearAllMocks();
  });

  describe('createOrUpdateMapping', () => {
    it('should upsert a mapping correctly', async () => {
      const mockData = {
        shopId: 'shop-123',
        shopifyProductId: 'gid://shopify/Product/1',
        shopifyVariantId: 'gid://shopify/ProductVariant/1',
        stockEasySku: 'SKU-123',
      };

      (prisma.productMapping.upsert as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
        ...mockData,
        lastSyncedAt: new Date(),
      });

      await service.createOrUpdateMapping(
        mockData.shopId,
        mockData.shopifyProductId,
        mockData.shopifyVariantId,
        mockData.stockEasySku
      );

      expect(prisma.productMapping.upsert).toHaveBeenCalledWith({
        where: {
          shopId_shopifyVariantId: {
            shopId: mockData.shopId,
            shopifyVariantId: mockData.shopifyVariantId,
          },
        },
        update: expect.any(Object),
        create: mockData,
      });
    });
  });

  describe('getSkuFromShopifyId', () => {
    it('should return SKU if mapping exists', async () => {
      (prisma.productMapping.findUnique as jest.Mock).mockResolvedValue({
        stockEasySku: 'FOUND-SKU',
      });

      const sku = await service.getSkuFromShopifyId('shop-1', 'variant-1');
      expect(sku).toBe('FOUND-SKU');
    });

    it('should return null if mapping does not exist', async () => {
      (prisma.productMapping.findUnique as jest.Mock).mockResolvedValue(null);

      const sku = await service.getSkuFromShopifyId('shop-1', 'variant-unknown');
      expect(sku).toBeNull();
    });
  });
});


