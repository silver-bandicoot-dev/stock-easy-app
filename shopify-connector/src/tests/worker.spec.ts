import { startWorker } from '../worker';
import { prisma } from '../utils/database';
import { StockEasyService } from '../services/stockeasy.service';
import { MappingService } from '../services/mapping.service';

// Mocks
jest.mock('../services/stockeasy.service');
jest.mock('../services/mapping.service');

// On a besoin d'accéder aux méthodes mockées
const MockStockEasyService = StockEasyService as jest.MockedClass<typeof StockEasyService>;
const MockMappingService = MappingService as jest.MockedClass<typeof MappingService>;

describe('Worker Logic (E2E Simulation)', () => {
  let workerCallback: Function;

  beforeAll(() => {
    // Intercepter la callback du worker pour l'appeler manuellement
    // @ts-ignore
    require('bullmq').Worker.mockImplementation((queueName, callback) => {
      workerCallback = callback;
      return { on: jest.fn() };
    });
    
    startWorker();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks
    MockStockEasyService.prototype.syncProductFromShopify = jest.fn();
    MockMappingService.prototype.createOrUpdateMapping = jest.fn();
  });

  it('should process products/create job successfully', async () => {
    // 1. Setup DB Mock
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({
      id: 'shop-1',
      domain: 'test.myshopify.com',
      isActive: true,
      stockEasyCompanyId: 'company-123'
    });

    // 2. Create Job Payload
    const job = {
      id: 'job-1',
      data: {
        shop: 'test.myshopify.com',
        topic: 'products/create',
        payload: {
          id: 101,
          title: 'T-Shirt',
          variants: [
            { id: 201, sku: 'SKU-TSHIRT', price: '20.00', inventory_quantity: 50 }
          ]
        }
      }
    };

    // 3. Execute Worker Logic
    await workerCallback(job);

    // 4. Verify Flow
    // Check Mapping Service call
    expect(MockMappingService.prototype.createOrUpdateMapping).toHaveBeenCalledWith(
      'test.myshopify.com',
      '101',
      '201',
      'SKU-TSHIRT'
    );

    // Check StockEasy Sync call
    expect(MockStockEasyService.prototype.syncProductFromShopify).toHaveBeenCalledWith(
      'company-123',
      {
        sku: 'SKU-TSHIRT',
        name: 'T-Shirt - undefined', // undefined car variant.title manquant dans mock, c'est normal
        price: 20.00,
        stock: 50
      }
    );
  });

  it('should skip job if shop is not linked to company', async () => {
    (prisma.shop.findUnique as jest.Mock).mockResolvedValue({
      id: 'shop-2',
      domain: 'orphan.myshopify.com',
      isActive: true,
      stockEasyCompanyId: null // Pas de company ID
    });

    const job = {
      id: 'job-2',
      data: {
        shop: 'orphan.myshopify.com',
        topic: 'products/create',
        payload: {}
      }
    };

    await workerCallback(job);

    expect(MockStockEasyService.prototype.syncProductFromShopify).not.toHaveBeenCalled();
  });
});


