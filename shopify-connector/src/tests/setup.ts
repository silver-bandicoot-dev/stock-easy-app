// Setup global pour Jest
import { jest } from '@jest/globals';

// Mock global pour Logger pour éviter de polluer la console pendant les tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock global pour Prisma
jest.mock('../utils/database', () => ({
  prisma: {
    shop: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productMapping: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// Mock global pour Redis/BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));


