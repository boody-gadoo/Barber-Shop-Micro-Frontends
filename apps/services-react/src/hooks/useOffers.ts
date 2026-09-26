import { useState, useEffect } from 'react';
import { Offer } from '@api-contracts/core';
import { MOCK_OFFERS } from '../utils/mockData';

interface UseOffersResult {
  offers: Offer[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage offers
 * Currently uses mock data; easily replaceable with API calls
 */
export function useOffers(): UseOffersResult {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API call with delay
    const timer = setTimeout(() => {
      try {
        // Filter active offers
        const activeOffers = MOCK_OFFERS.filter((offer) => offer.status === 'active');
        setOffers(activeOffers);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load offers'));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return { offers, loading, error };
}
