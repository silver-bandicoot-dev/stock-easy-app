import { useState, useEffect } from 'react';

/**
 * Hook pour debounce une valeur
 * @param {any} value - Valeur à debounce
 * @param {number} delay - Délai en ms (défaut: 500ms)
 * @returns {any} Valeur debouncée
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
