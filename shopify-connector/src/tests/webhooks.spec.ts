import request from 'supertest';
import express from 'express';
import { webhookRouter, syncQueue } from '../../routes/webhooks';
import { shopify } from '../../services/shopify.service';

// Mock express app
const app = express();
app.use(express.raw({ type: 'application/json' })); // Important pour webhook raw body
app.use('/webhooks', webhookRouter);

// Mock shopify validate
jest.mock('../../services/shopify.service', () => ({
  shopify: {
    webhooks: {
      validate: jest.fn(),
    },
  },
}));

describe('Webhook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject webhook with missing headers', async () => {
    const res = await request(app)
      .post('/webhooks/products/create')
      .send({ some: 'data' });

    expect(res.status).toBe(401);
    expect(res.text).toBe('Missing headers');
  });

  it('should reject webhook with invalid HMAC', async () => {
    (shopify.webhooks.validate as jest.Mock).mockResolvedValue({ valid: false });

    const res = await request(app)
      .post('/webhooks/products/create')
      .set('x-shopify-hmac-sha256', 'invalid-hmac')
      .set('x-shopify-topic', 'products/create')
      .set('x-shopify-shop-domain', 'test.myshopify.com')
      .send({ some: 'data' });

    expect(res.status).toBe(401);
    expect(res.text).toBe('Invalid HMAC');
  });

  it('should accept valid webhook and add to queue', async () => {
    (shopify.webhooks.validate as jest.Mock).mockResolvedValue({ valid: true });

    const res = await request(app)
      .post('/webhooks/products/create')
      .set('x-shopify-hmac-sha256', 'valid-hmac')
      .set('x-shopify-topic', 'products/create')
      .set('x-shopify-shop-domain', 'test.myshopify.com')
      .send(JSON.stringify({ id: 123, title: 'Test Product' })); // Send as string to match raw body expectation

    expect(res.status).toBe(200);
    expect(syncQueue.add).toHaveBeenCalledWith(
      'products/create',
      expect.objectContaining({
        shop: 'test.myshopify.com',
        topic: 'products/create',
        payload: expect.objectContaining({ id: 123 }),
      }),
      expect.any(Object)
    );
  });
});


