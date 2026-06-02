import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@core/lib/api/client';

export type Me = {
  email: string;
  platformAdmin: boolean;
  role: 'manager' | 'staff' | 'viewer' | null;
};

export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: () => apiRequest<Me>('/api/v1/me/'),
    staleTime: 5 * 60_000,
  });
}
