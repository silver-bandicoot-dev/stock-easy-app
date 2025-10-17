import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Mock localStorage for tests
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock;
  });

  it('should initialize with default value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(result.current[0]).toBe('default');
  });

  it('should read existing value from localStorage', () => {
    global.localStorage.getItem.mockReturnValue(JSON.stringify('existing'));
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(result.current[0]).toBe('existing');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(global.localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('updated'));
  });

  it('should handle complex objects', () => {
    const obj = { name: 'test', count: 42 };
    const { result } = renderHook(() => useLocalStorage('test-key', obj));
    
    expect(result.current[0]).toEqual(obj);
    expect(global.localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(obj));
  });

  it('should handle parse errors gracefully', () => {
    global.localStorage.getItem.mockReturnValue('invalid json');
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    
    // Should fall back to initial value
    expect(result.current[0]).toBe('fallback');
  });
});

