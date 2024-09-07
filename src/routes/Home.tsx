import { FeedList } from '@/components/FeedList';
import { trending } from '@/services/podcast-api';
import { useQuery } from '@tanstack/react-query';

export function Component() {
  const {
    isPending,
    isError,
    data: feeds,
    error,
  } = useQuery({
    queryKey: ['trending'],
    queryFn: () => trending(),
  });

  if (isPending) {
    return null;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  return <FeedList feeds={feeds} />;
}
