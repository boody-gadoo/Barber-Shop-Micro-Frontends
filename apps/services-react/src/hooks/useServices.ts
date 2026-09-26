import { useState, useEffect } from 'react';
import { Service } from '@api-contracts/core';
import { MOCK_SERVICES } from '../utils/mockData';

interface UseServicesResult {
  services: Service[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage services
 * Currently uses mock data; easily replaceable with API calls
 */
export function useServices(): UseServicesResult {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API call with delay
    const timer = setTimeout(() => {
      try {
        setServices(MOCK_SERVICES);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load services'));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return { services, loading, error };
}

/**
 * Hook to fetch single service by ID
 */
export function useServiceById(id: string): UseServicesResult & { service: Service | null } {
  const { services, loading, error } = useServices();
  const service = services.find((s) => s.id === id) || null;

  return { services, service, loading, error };
}
