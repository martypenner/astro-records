import { r } from '@/reflect';
import { useInitialized } from '@/reflect/subscriptions';
import { useEffect, type ReactNode } from 'react';

export function Guard({ children }: { children: ReactNode }) {
  const initialized = useInitialized(r);
  useEffect(() => {
    r.mutate.initialize();
  }, []);

  if (initialized == null || !initialized) {
    return null;
  }

  return children;
}
