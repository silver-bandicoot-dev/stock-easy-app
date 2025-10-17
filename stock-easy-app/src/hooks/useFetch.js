import { useState, useEffect, useCallback } from 'react';

/**
 * Hook générique pour fetch avec loading et error states
 * @param {Function} fetchFn - Fonction async qui retourne une Promise
 * @param {Array} dependencies - Dépendances pour re-fetch
 * @returns {Object} { data, loading, error, refetch }
 */
export function useFetch(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetch();
  }, [fetch, ...dependencies]);

  return { data, loading, error, refetch: fetch };
}

