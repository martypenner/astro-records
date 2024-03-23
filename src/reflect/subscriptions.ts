// This file defines our "subscriptions". Subscriptions are how Reflect
// notifies you when data has changed. Subscriptions fire whenever the watched
// data changes, whether because the local client changed it, or because some
// other collaborating client changed it. The model is that you render your app
// reactively based on these subscriptions. This guarantees the UI always
// consistently shows the latest data.
//
// Subscriptions can be arbitrary computations of the data in Reflect. The
// subscription "query" is re-run whenever any of the data it depends on
// changes. The subscription "fires" when the result of the query changes.

import type { Episode, Feed, StoredEpisode } from '@/data';
import { generate } from '@rocicorp/rails';
import type { ReadTransaction } from '@rocicorp/reflect';
import type { Reflect } from '@rocicorp/reflect/client';
import { useSubscribe } from '@rocicorp/reflect/react';
import type { Mutators } from './mutators';

export const {
  get: getFeed,
  set: setFeed,
  update: updateFeed,
  delete: deleteFeed,
  list: listFeedsImpl,
  listIDs: listFeedIds,
} = generate<Feed>('feed');

export async function listAllFeeds(tx: ReadTransaction): Promise<Feed[]> {
  const feeds = await listFeedsImpl(tx);
  return feeds;
}

export async function listSearchedFeeds(tx: ReadTransaction): Promise<Feed[]> {
  const feeds = await listAllFeeds(tx);
  return feeds.filter((feed) => feed._meta.fromSearch);
}

export async function listRegularFeeds(tx: ReadTransaction): Promise<Feed[]> {
  const feeds = await listAllFeeds(tx);
  return feeds.filter((feed) => !feed._meta.fromSearch);
}

export function useFeeds(
  reflect: Reflect<Mutators>,
  fromSearch: boolean = false,
): Feed[] {
  return useSubscribe(
    reflect,
    fromSearch ? listSearchedFeeds : listRegularFeeds,
    [],
  );
}

export function useFeedById(
  reflect: Reflect<Mutators>,
  key: Feed['id'],
): Feed | null {
  return useSubscribe(reflect, (tx) => getFeed(tx, key), null);
}

export async function listEpisodesForFeed(
  tx: ReadTransaction,
  feedId: Feed['id'],
): Promise<Episode[]> {
  const list = (
    (await tx
      .scan({ prefix: `episode/${feedId}/` })
      .toArray()) as StoredEpisode[]
  ).map((episode) => ({
    ...episode,
    datePublished: new Date(episode.datePublished),
    explicit: !!episode.explicit,
  }));
  return list as Episode[];
}

export function useEpisodesForFeed(
  reflect: Reflect<Mutators>,
  feedId: Feed['id'],
): Episode[] {
  const episodes = useSubscribe(
    reflect,
    (tx) => listEpisodesForFeed(tx, feedId),
    [],
  );

  return episodes;
}
