import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

export class MappingService {
  
  /**
   * Crée ou met à jour un mapping entre un produit Shopify et un SKU StockEasy
   */
  async createOrUpdateMapping(
    shopId: string,
    shopifyProductId: string,
    shopifyVariantId: string,
    stockEasySku: string
  ) {
    try {
      return await prisma.productMapping.upsert({
        where: {
          shopId_shopifyVariantId: {
            shopId,
            shopifyVariantId,
          },
        },
        update: {
          shopifyProductId,
          stockEasySku,
          lastSyncedAt: new Date(),
        },
        create: {
          shopId,
          shopifyProductId,
          shopifyVariantId,
          stockEasySku,
        },
      });
    } catch (error) {
      logger.error('Error creating mapping', error);
      throw error;
    }
  }

  /**
   * Récupère le SKU StockEasy à partir de l'ID variant Shopify
   */
  async getSkuFromShopifyId(shopId: string, shopifyVariantId: string): Promise<string | null> {
    const mapping = await prisma.productMapping.findUnique({
      where: {
        shopId_shopifyVariantId: {
          shopId,
          shopifyVariantId,
        },
      },
    });
    return mapping ? mapping.stockEasySku : null;
  }

  /**
   * Récupère l'ID variant Shopify à partir du SKU StockEasy
   * Note: Cela peut retourner plusieurs résultats si le même SKU est vendu dans plusieurs shops,
   * donc on filtre souvent par shopId
   */
  async getShopifyIdFromSku(shopId: string, sku: string): Promise<string | null> {
    const mapping = await prisma.productMapping.findFirst({
      where: {
        shopId,
        stockEasySku: sku,
      },
    });
    return mapping ? mapping.shopifyVariantId : null;
  }
}


