import { r } from '@/reflect';
import { useInitialized } from '@/reflect/subscriptions';
import type { ReactNode } from 'react';

export default function Guard({ children }: { children: ReactNode }) {
  const initialized = useInitialized(r);

  if (!initialized) {
    return null;
  }

  return children;
}
