import { r } from '@/reflect';
import { useFeeds } from '@/reflect/subscriptions';
import { Card } from './Card';
import { trending } from '@/services/podcast-api';
import { useEffect } from 'react';

export interface Props {}

export function FeedList(_props: Props) {
  const feeds = useFeeds(r);
  console.log(feeds);

  return (
    <>
      {feeds.map((feed) => (
        <Card key={feed.id} {...feed} />
      ))}
    </>
  );
}
