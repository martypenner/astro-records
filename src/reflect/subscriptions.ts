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

import type { Episode, Feed } from '@/data';
import type { Reflect } from '@rocicorp/reflect/client';
import { useSubscribe } from '@rocicorp/reflect/react';
import type { Mutators } from './mutators';
import {
  getCurrentEpisode,
  getEpisodeById,
  getFeed,
  getPlayerSpeed,
  listEpisodesForFeed,
  listRegularFeeds,
  listSearchedFeeds,
} from './state';

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

export function useCurrentEpisode(reflect: Reflect<Mutators>): Episode | null {
  return useSubscribe(reflect, getCurrentEpisode, null);
}

export function useEpisodeById(
  reflect: Reflect<Mutators>,
  key: Episode['id'],
): Episode | null {
  return useSubscribe(reflect, (tx) => getEpisodeById(tx, key), null);
}

export function usePlayerSpeed(reflect: Reflect<Mutators>): number {
  return useSubscribe(reflect, getPlayerSpeed, 1);
}
