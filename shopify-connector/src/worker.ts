import { Worker, Job } from 'bullmq';
import { config } from './config';
import { logger } from './utils/logger';
import { StockEasyService } from './services/stockeasy.service';
import { MappingService } from './services/mapping.service';
import { prisma } from './utils/database';

const stockEasyService = new StockEasyService();
const mappingService = new MappingService();

// Définition du Worker
export const startWorker = () => {
  const worker = new Worker('shopify-sync', async (job: Job) => {
    const { shop, topic, payload } = job.data;
    logger.info(`Processing job ${job.id}: ${topic} for ${shop}`);

    try {
      // 1. Récupérer le Shop et son Company ID
      const shopEntity = await prisma.shop.findUnique({
        where: { domain: shop }
      });

      if (!shopEntity || !shopEntity.isActive) {
        logger.warn(`Shop ${shop} not found or inactive. Skipping job.`);
        return;
      }

      if (!shopEntity.stockEasyCompanyId) {
        logger.warn(`Shop ${shop} has no linked Company ID. Skipping job.`);
        return;
      }

      const companyId = shopEntity.stockEasyCompanyId;

      switch (topic) {
        case 'products/create':
        case 'products/update':
          await handleProductSync(shop, companyId, payload);
          break;
        
        case 'inventory_levels/update':
          await handleInventorySync(shop, companyId, payload);
          break;

        case 'orders/create':
          await handleOrderSync(shop, companyId, payload);
          break;

        default:
          logger.warn(`Unknown topic ${topic}, skipping.`);
      }
    } catch (error) {
      logger.error(`Job ${job.id} failed`, error);
      throw error; // BullMQ va réessayer selon la config
    }

  }, {
    connection: {
      url: config.redis.url
    },
    concurrency: 5, // Traiter 5 jobs en parallèle
    limiter: {
        max: 40, // Respecter rate limit Shopify (approximatif)
        duration: 1000
    }
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed with error ${err.message}`);
  });
  
  logger.info('🚀 Worker started and listening for jobs');
};

// Handlers spécifiques

async function handleProductSync(shopDomain: string, companyId: string, payload: any) {
  // Pour chaque variante
  for (const variant of payload.variants) {
     const sku = variant.sku;
     if (!sku) {
         logger.warn(`Skipping variant ${variant.id} without SKU`);
         continue;
     }
     
     // Sauvegarder le mapping
     await mappingService.createOrUpdateMapping(
         shopDomain, // Attention: mapping utilise le domain ici, à voir si on passe à l'ID interne plus tard
         payload.id.toString(),
         variant.id.toString(),
         sku
     );

     // Envoyer à StockEasy (Direct Supabase)
     await stockEasyService.syncProductFromShopify(companyId, {
         sku: sku,
         name: `${payload.title} - ${variant.title}`,
         price: parseFloat(variant.price),
         stock: variant.inventory_quantity
     });
  }
}

async function handleInventorySync(shopDomain: string, companyId: string, payload: any) {
  // Note: Payload inventory_level n'a pas le SKU.
  // Il faudrait une query supplémentaire ou un cache inventory_item_id -> SKU.
  // Pour l'instant, on log juste.
  logger.info(`Inventory sync received for ${payload.inventory_item_id} at ${payload.available}`);
  
  // TODO: Lookup SKU via inventory_item_id mapping table (à créer) ou API Shopify
  // Une fois le SKU trouvé :
  // await stockEasyService.updateInventory(companyId, sku, payload.available);
}

async function handleOrderSync(shopDomain: string, companyId: string, payload: any) {
    await stockEasyService.processOrder(companyId, {
        shopifyOrderId: payload.id,
        total: payload.total_price,
        lineItems: payload.line_items.map((item: any) => ({
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            variantId: item.variant_id
        }))
    });
}
