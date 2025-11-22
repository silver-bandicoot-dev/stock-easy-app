import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { logger } from './utils/logger';
import { webhookRouter } from './routes/webhooks';
import { complianceRouter } from './routes/compliance';
import { legalRouter } from './routes/legal';
import { startWorker } from './worker';
import { prisma } from './utils/database';

const app = express();

// Middlewares de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(cors());
app.use(morgan('dev'));

// Routes légales (publiques, pas de raw body)
app.use(legalRouter);

// Routes Webhooks GDPR (Raw Body pour validation HMAC)
app.use('/webhooks/compliance', express.raw({ type: 'application/json' }), complianceRouter);

// Routes Webhooks standard (Raw Body pour validation HMAC)
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

// Autres routes (JSON)
app.use(express.json());

// Health Check amélioré
app.get('/health', async (req, res) => {
  try {
    // Vérifier la connexion DB
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error: any) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Start Server
const startServer = async () => {
  try {
    // Démarrer le serveur Express
    app.listen(config.port, () => {
      logger.info(`🚀 Shopify Connector running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });

    // Démarrer le Worker BullMQ
    startWorker();

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
