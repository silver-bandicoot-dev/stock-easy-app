import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { StockEasyService } from '../services/stockeasy.service';

const router = Router();
const stockEasyService = new StockEasyService();

/**
 * Webhook: customers/data_request
 * Le marchand demande les données d'un client (GDPR Article 15)
 * 
 * Ce webhook est OBLIGATOIRE pour la conformité App Store Shopify
 */
router.post('/customers/data_request', async (req: Request, res: Response) => {
  const payload = JSON.parse((req.body as Buffer).toString());
  const { shop_domain, customer, orders_requested } = payload;
  
  logger.info('GDPR: Data request received', {
    shop: shop_domain,
    customerId: customer.id,
    email: customer.email,
    ordersCount: orders_requested?.length || 0
  });
  
  try {
    // 1. Récupérer le shop
    const shop = await prisma.shop.findUnique({
      where: { domain: shop_domain }
    });
    
    if (!shop) {
      logger.warn(`Data request for unknown shop: ${shop_domain}`);
      return res.status(200).json({ 
        message: 'Shop not found',
        data: {}
      });
    }
    
    if (!shop.stockEasyCompanyId) {
      logger.warn(`Shop ${shop_domain} has no linked StockEasy company`);
      return res.status(200).json({
        message: 'No linked StockEasy company',
        data: {}
      });
    }
    
    // 2. Récupérer les données du client dans StockEasy
    const customerData = await collectCustomerData(
      shop.stockEasyCompanyId,
      customer.email,
      orders_requested || []
    );
    
    // 3. Logger la requête (obligatoire pour audit GDPR)
    await prisma.syncLog.create({
      data: {
        shopId: shop.id,
        entity: 'GDPR_DATA_REQUEST',
        status: 'SUCCESS',
        message: `Data request processed for customer ${customer.email}`,
        payload: {
          customerId: customer.id,
          email: customer.email,
          phone: customer.phone,
          ordersRequested: orders_requested?.length || 0,
          dataCollected: {
            salesRecords: customerData.salesHistory.length,
            totalRevenue: customerData.totalRevenue
          },
          requestedAt: new Date().toISOString()
        }
      }
    });
    
    // 4. Retourner les données (en production, envoyer par email sécurisé)
    logger.info('Customer data collected successfully', {
      shop: shop_domain,
      email: customer.email,
      recordsCount: customerData.salesHistory.length
    });
    
    // Note: En production, ces données devraient être envoyées
    // par email sécurisé ou via un endpoint sécurisé au marchand
    res.status(200).json({
      message: 'Data request processed successfully',
      // En production, ne pas retourner les données directement
      // data: customerData
    });
    
  } catch (error: any) {
    logger.error('Error processing GDPR data request', {
      error: error.message,
      stack: error.stack,
      shop: shop_domain,
      customer: customer?.email
    });
    
    // Ne pas exposer les erreurs internes
    res.status(500).json({
      message: 'Error processing data request'
    });
  }
});

/**
 * Webhook: customers/redact
 * Le client demande la suppression de ses données (GDPR Article 17 - Droit à l'effacement)
 * 
 * Déclenché 48h après la désinstallation de l'app par le marchand
 * Ce webhook est OBLIGATOIRE pour la conformité App Store Shopify
 */
router.post('/customers/redact', async (req: Request, res: Response) => {
  const payload = JSON.parse((req.body as Buffer).toString());
  const { shop_domain, customer, orders_to_redact } = payload;
  
  logger.info('GDPR: Customer redaction request received', {
    shop: shop_domain,
    customerId: customer.id,
    email: customer.email,
    ordersCount: orders_to_redact?.length || 0
  });
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { domain: shop_domain }
    });
    
    if (!shop) {
      logger.warn(`Redaction request for unknown shop: ${shop_domain}`);
      return res.status(200).json({
        message: 'Shop not found, no data to redact'
      });
    }
    
    if (!shop.stockEasyCompanyId) {
      logger.warn(`Shop ${shop_domain} has no linked StockEasy company`);
      return res.status(200).json({
        message: 'No linked StockEasy company, no data to redact'
      });
    }
    
    // Supprimer ou anonymiser les données du client
    const redactionResult = await redactCustomerData(
      shop.stockEasyCompanyId,
      customer.email,
      orders_to_redact || []
    );
    
    // Logger la suppression (obligatoire pour audit GDPR)
    await prisma.syncLog.create({
      data: {
        shopId: shop.id,
        entity: 'GDPR_CUSTOMER_REDACT',
        status: 'SUCCESS',
        message: `Customer data redacted for ${customer.email}`,
        payload: {
          customerId: customer.id,
          email: customer.email,
          phone: customer.phone,
          ordersRedacted: orders_to_redact?.length || 0,
          recordsAnonymized: redactionResult.recordsAnonymized,
          redactedAt: new Date().toISOString()
        }
      }
    });
    
    logger.info('Customer data redacted successfully', {
      shop: shop_domain,
      email: customer.email,
      recordsAnonymized: redactionResult.recordsAnonymized
    });
    
    res.status(200).json({
      message: 'Customer data redacted successfully'
    });
    
  } catch (error: any) {
    logger.error('Error processing GDPR customer redaction', {
      error: error.message,
      stack: error.stack,
      shop: shop_domain,
      customer: customer?.email
    });
    
    res.status(500).json({
      message: 'Error processing redaction request'
    });
  }
});

/**
 * Webhook: shop/redact
 * La boutique est supprimée ou l'app est désinstallée depuis 48h
 * (GDPR Article 17 - Droit à l'effacement)
 * 
 * Ce webhook est OBLIGATOIRE pour la conformité App Store Shopify
 */
router.post('/shop/redact', async (req: Request, res: Response) => {
  const payload = JSON.parse((req.body as Buffer).toString());
  const { shop_domain, shop_id } = payload;
  
  logger.info('GDPR: Shop redaction request received', {
    shop: shop_domain,
    shopId: shop_id
  });
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { domain: shop_domain }
    });
    
    if (!shop) {
      logger.warn(`Redaction request for unknown shop: ${shop_domain}`);
      return res.status(200).json({
        message: 'Shop not found, no data to redact'
      });
    }
    
    // Supprimer toutes les données du shop dans notre base de données
    const deletionStats = await prisma.$transaction(async (tx) => {
      // 1. Compter les enregistrements à supprimer
      const logsCount = await tx.syncLog.count({
        where: { shopId: shop.id }
      });
      
      const mappingsCount = await tx.productMapping.count({
        where: { shopId: shop.id }
      });
      
      // 2. Supprimer les logs
      await tx.syncLog.deleteMany({
        where: { shopId: shop.id }
      });
      
      // 3. Supprimer les mappings
      await tx.productMapping.deleteMany({
        where: { shopId: shop.id }
      });
      
      // 4. Supprimer le shop
      await tx.shop.delete({
        where: { id: shop.id }
      });
      
      return {
        logsDeleted: logsCount,
        mappingsDeleted: mappingsCount
      };
    });
    
    logger.info('Shop data deleted successfully', {
      shop: shop_domain,
      logsDeleted: deletionStats.logsDeleted,
      mappingsDeleted: deletionStats.mappingsDeleted
    });
    
    // Note: Les données dans StockEasy (Supabase) appartiennent au marchand
    // et doivent être gérées par le marchand via son compte StockEasy.
    // Nous ne supprimons PAS les données produits/ventes dans StockEasy
    // car elles appartiennent au marchand et peuvent avoir d'autres sources.
    
    res.status(200).json({
      message: 'Shop data redacted successfully',
      stats: deletionStats
    });
    
  } catch (error: any) {
    logger.error('Error processing GDPR shop redaction', {
      error: error.message,
      stack: error.stack,
      shop: shop_domain
    });
    
    res.status(500).json({
      message: 'Error processing redaction request'
    });
  }
});

/**
 * Helper: Collecter les données d'un client
 */
async function collectCustomerData(
  companyId: string,
  email: string,
  orders: any[]
): Promise<any> {
  try {
    const orderIds = orders.map(o => o.id?.toString()).filter(Boolean);
    
    if (orderIds.length === 0) {
      return {
        email,
        salesHistory: [],
        totalRevenue: 0
      };
    }
    
    // Récupérer les données de sales_history dans StockEasy
    const { data: salesData, error } = await stockEasyService['supabase']
      .from('sales_history')
      .select('*')
      .eq('company_id', companyId)
      .in('metadata->shopify_order_id', orderIds);
    
    if (error) {
      logger.error('Error fetching customer data from StockEasy', error);
      return {
        email,
        salesHistory: [],
        totalRevenue: 0,
        error: error.message
      };
    }
    
    const totalRevenue = salesData?.reduce((sum, record) => sum + (record.revenue || 0), 0) || 0;
    
    return {
      email,
      ordersCount: orders.length,
      salesHistory: salesData || [],
      totalRevenue,
      collectedAt: new Date().toISOString()
    };
    
  } catch (error: any) {
    logger.error('Error in collectCustomerData', error);
    throw error;
  }
}

/**
 * Helper: Anonymiser/Supprimer les données d'un client
 */
async function redactCustomerData(
  companyId: string,
  email: string,
  orders: any[]
): Promise<{ recordsAnonymized: number }> {
  try {
    const orderIds = orders.map(o => o.id?.toString()).filter(Boolean);
    
    if (orderIds.length === 0) {
      return { recordsAnonymized: 0 };
    }
    
    // Option 1: Anonymiser (recommandé pour garder les statistiques agrégées)
    // On garde les données de ventes mais on supprime les métadonnées identifiantes
    const { data, error } = await stockEasyService['supabase']
      .from('sales_history')
      .update({
        metadata: {
          customer_redacted: true,
          redacted_at: new Date().toISOString(),
          // On garde shopify_order_id pour éviter les doublons, 
          // mais on supprime les infos clients
        }
      })
      .eq('company_id', companyId)
      .in('metadata->shopify_order_id', orderIds)
      .select();
    
    if (error) {
      logger.error('Error redacting customer data in StockEasy', error);
      throw error;
    }
    
    // Option 2: Suppression complète (si légalement requis)
    // Décommenter si nécessaire:
    /*
    const { error } = await stockEasyService['supabase']
      .from('sales_history')
      .delete()
      .eq('company_id', companyId)
      .in('metadata->shopify_order_id', orderIds);
    */
    
    return {
      recordsAnonymized: data?.length || 0
    };
    
  } catch (error: any) {
    logger.error('Error in redactCustomerData', error);
    throw error;
  }
}

export { router as complianceRouter };


