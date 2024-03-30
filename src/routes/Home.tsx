import { FeedList } from '@/components/FeedList';
import { r } from '@/reflect';
import { listAllFeeds } from '@/reflect/state';
import { useFeeds } from '@/reflect/subscriptions';
import { trending } from '@/services/podcast-api';

export async function loader() {
  const feeds = await r.query(listAllFeeds);
  if (feeds.length === 0) {
    // Don't await this so the UI can render right away
    trending().then((feeds) => {
      r.mutate.addFeeds({ feeds });
    });
  }
  return null;
}

export function Component() {
  const feeds = useFeeds(r);
  return <FeedList feeds={feeds} />;
}
