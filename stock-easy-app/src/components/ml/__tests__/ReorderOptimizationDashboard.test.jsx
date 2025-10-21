import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReorderOptimizationDashboard } from '../ReorderOptimizationDashboard';

// Mock du hook
vi.mock('../../../hooks/ml/useReorderOptimization', () => ({
  useReorderOptimization: vi.fn(() => ({
    optimizations: new Map(),
    summary: null,
    isAnalyzing: false,
    isReady: false,
    error: null,
    progress: 0,
    analyze: vi.fn(),
    applyOptimization: vi.fn(),
    applyAll: vi.fn(),
    rejectOptimization: vi.fn(),
    getTotalSavings: vi.fn(() => 0),
    getTopProblems: vi.fn(() => [])
  }))
}));

describe('ReorderOptimizationDashboard', () => {
  const mockProducts = [
    {
      sku: 'TEST-001',
      name: 'Produit Test',
      stock: 50,
      salesPerDay: 5,
      reorderPoint: 60,
      securityStock: 10
    }
  ];

  it('devrait afficher le dashboard', () => {
    render(<ReorderOptimizationDashboard products={mockProducts} />);
    
    expect(screen.getByText(/Optimisation des Points de Commande/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyser/i)).toBeInTheDocument();
  });

  it('devrait afficher le message initial', () => {
    render(<ReorderOptimizationDashboard products={mockProducts} />);
    
    expect(screen.getByText(/Prêt à optimiser vos stocks/i)).toBeInTheDocument();
  });
});

