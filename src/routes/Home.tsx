import { FeedList } from '@/components/FeedList';
import { r } from '@/reflect';
import { listRegularFeeds } from '@/reflect/state';
import { useFeeds } from '@/reflect/subscriptions';
import { trending } from '@/services/podcast-api';
import { $showSearchedFeeds } from '@/services/state';
import { useStore } from '@nanostores/react';

export async function loader() {
  const feeds = await r.query(listRegularFeeds);
  if (feeds.length === 0) {
    // Don't await this so the UI can render right away
    trending().then((feeds) => {
      r.mutate.addFeeds({ feeds });
    });
  }
  return null;
}

export function Component() {
  const regularFeeds = useFeeds(r, false);
  const searchedFeeds = useFeeds(r, true);
  const showSearched = useStore($showSearchedFeeds);
  const feeds = showSearched ? searchedFeeds : regularFeeds;

  return <FeedList feeds={feeds} />;
}
