import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '../useFetch';

describe('useFetch', () => {
  it('should fetch data successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });
    
    const { result } = renderHook(() => useFetch(mockFetch));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ data: 'test' });
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useFetch(mockFetch));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Fetch failed');
    expect(result.current.data).toBeNull();
  });

  it('should allow manual refetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useFetch(mockFetch));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Refetch manually
    result.current.refetch();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

