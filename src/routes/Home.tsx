import { FeedList } from '@/components/FeedList';
import { r } from '@/reflect';
import { listFeeds } from '@/reflect/subscriptions';
import { trending } from '@/services/podcast-api';

export async function loader() {
  const feeds = await r.query(listFeeds);
  if (feeds.length === 0) {
    // don't await this so the UI can render right away
    trending().then((feeds) => {
      r.mutate.addFeeds(feeds);
    });
  }
  return null;
}

export function Component() {
  return <FeedList />;
}
