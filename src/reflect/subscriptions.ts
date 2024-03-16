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
import { trending } from '@/services/podcast-api';
import type { Reflect } from '@rocicorp/reflect/client';
import { useSubscribe } from '@rocicorp/reflect/react';
import { useEffect } from 'react';
import type { Mutators } from './mutators';

export function useFeeds(reflect: Reflect<Mutators>): Feed[] {
  const feeds = useSubscribe(
    reflect,
    async (tx) => {
      return (await tx
        .scan({
          prefix: 'feed/',
        })
        .toArray()) as Feed[];
    },
    [],
  );

  useEffect(() => {
    const doIt = async () => {
      const feeds = await trending();
      await reflect.mutate.addFeeds(
        feeds.map((feed) =>
          typeof feed === 'string' ? JSON.parse(feed) : feed,
        ),
      );
    };

    if (feeds.length === 0) {
      doIt();
    }
  }, [reflect.mutate, feeds.length]);

  return feeds;
}

export function useFeedById(
  reflect: Reflect<Mutators>,
  key: Feed['id'],
): Feed | null {
  return useSubscribe(
    reflect,
    async (tx) => {
      return (await tx.get(`feed/${key}`)) as Feed | null;
    },
    null,
  );
}

export function useEpisodesForFeed(
  reflect: Reflect<Mutators>,
  feedId: Feed['id'] | null,
): Episode[] {
  return useSubscribe(
    reflect,
    async (tx) => {
      if (feedId == null) {
        return [];
      }

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
    },
    [] as Episode[],
  );
}
