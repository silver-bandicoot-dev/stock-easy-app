import { Router, Request, Response } from 'express';
import { shopify } from '../services/shopify.service';
import { logger } from '../utils/logger';
import { Queue } from 'bullmq';
import { config } from '../config';

const router = Router();

// Initialisation de la queue BullMQ
const syncQueue = new Queue('shopify-sync', {
  connection: {
    url: config.redis.url
  }
});

// Middleware de validation HMAC
const validateWebhook = async (req: Request, res: Response, next: Function) => {
  try {
    const hmac = req.header('x-shopify-hmac-sha256');
    const topic = req.header('x-shopify-topic');
    const shop = req.header('x-shopify-shop-domain');

    if (!hmac || !topic || !shop) {
      logger.warn('Missing webhook headers');
      return res.status(401).send('Missing headers');
    }

    // Note: req.body doit être un Buffer brut (configuré dans index.ts)
    const isValid = await shopify.webhooks.validate({
      rawBody: (req.body as Buffer).toString(),
      rawRequest: req,
    });

    if (!isValid.valid) {
      logger.warn(`Invalid HMAC for shop ${shop}`);
      return res.status(401).send('Invalid HMAC');
    }

    // Attacher les infos au request object pour le handler
    (req as any).webhookContext = { topic, shop };
    next();
  } catch (error) {
    logger.error('Webhook validation error', error);
    res.status(500).send('Internal Server Error');
  }
};

// Handler générique pour tous les webhooks
router.post('/:topic(*)', validateWebhook, async (req: Request, res: Response) => {
  const { topic, shop } = (req as any).webhookContext;
  const payload = JSON.parse((req.body as Buffer).toString());

  logger.info(`Received webhook ${topic} for shop ${shop}`);

  try {
    // Ajouter le job à la queue
    await syncQueue.add(topic, {
      shop,
      topic,
      payload,
      receivedAt: new Date().toISOString()
    }, {
      // Priorité basée sur le topic
      priority: topic === 'orders/create' ? 1 : 10, // 1 = High priority
      removeOnComplete: true,
      removeOnFail: 100 // Garder les 100 derniers échecs
    });

    res.status(200).send('Webhook received');
  } catch (error) {
    logger.error(`Error adding job to queue for ${topic}`, error);
    res.status(500).send('Error processing webhook');
  }
});

export { router as webhookRouter, syncQueue };


