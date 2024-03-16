import { r } from '@/reflect';
import { useFeeds } from '@/reflect/subscriptions';
import { Card } from './Card';

export function FeedList() {
  const feeds = useFeeds(r);

  return (
    <>
      <title>Astro Podcasts</title>

      {feeds.map((feed) => (
        <Card key={feed.id} {...feed} />
      ))}
    </>
  );
}
