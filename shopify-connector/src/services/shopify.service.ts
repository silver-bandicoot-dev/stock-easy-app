import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialisation de la librairie Shopify
const shopify = shopifyApi({
  apiKey: config.shopify.apiKey,
  apiSecretKey: config.shopify.apiSecret,
  scopes: config.shopify.scopes,
  hostName: config.shopify.host.replace(/^https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

export class ShopifyService {
  
  /**
   * Met à jour l'inventaire d'un produit sur Shopify
   */
  async updateInventory(
    session: Session,
    inventoryItemId: string,
    locationId: string,
    quantity: number
  ) {
    const client = new shopify.clients.Graphql({ session });
    
    const query = `
      mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
        inventorySetQuantities(input: $input) {
          inventoryAdjustmentGroup {
            reason
            changes {
              name
              delta
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      await client.query({
        data: {
          query,
          variables: {
            input: {
              reason: 'correction',
              ignoreCompareQuantity: true,
              setQuantities: [
                {
                  inventoryItemId,
                  locationId,
                  quantity,
                },
              ],
            },
          },
        },
      });
      logger.info(`Updated inventory for item ${inventoryItemId} to ${quantity}`);
    } catch (error) {
      logger.error('Error updating Shopify inventory', error);
      throw error;
    }
  }

  /**
   * Récupère un produit Shopify par ID
   */
  async getProduct(session: Session, productId: string) {
    const client = new shopify.clients.Graphql({ session });
    
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          variants(first: 10) {
            edges {
              node {
                id
                sku
                price
                inventoryQuantity
                inventoryItem {
                  id
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await client.query({
        data: {
          query,
          variables: { id: productId },
        },
      });
      return response.body.data; // Adapter selon le type de retour réel
    } catch (error) {
      logger.error(`Error fetching product ${productId}`, error);
      throw error;
    }
  }
  
  // Helper pour valider les webhooks
  async validateWebhook(rawBody: Buffer, hmacHeader: string) {
     return shopify.webhooks.validate({
        rawBody: rawBody.toString(),
        rawRequest: {
            headers: {
                'x-shopify-hmac-sha256': hmacHeader
            }
        } as any // Casting partiel pour satisfaire l'interface AdapterRequest
     });
  }
}

export { shopify };


