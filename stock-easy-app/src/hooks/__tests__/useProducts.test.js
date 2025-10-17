import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '../useProducts';
import api from '../../services/apiService';

vi.mock('../../services/apiService');

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch products on mount', async () => {
    const mockProducts = [
      { sku: 'TEST-001', name: 'Test Product', stock: 100 },
    ];
    
    api.getAllData.mockResolvedValue({ products: mockProducts });

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors', async () => {
    api.getAllData.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.products).toEqual([]);
  });

  it('should allow refetch', async () => {
    const mockProducts = [{ sku: 'TEST-001' }];
    api.getAllData.mockResolvedValue({ products: mockProducts });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.getAllData).toHaveBeenCalledTimes(1);

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(api.getAllData).toHaveBeenCalledTimes(2);
    });
  });
});

