// This file defines our "mutators".
//
// Mutators are how you change data in Reflect apps.
//
// They are registered with Reflect at construction-time and callable like:
// `myReflect.mutate.setCursor()`.
//
// Reflect runs each mutation immediately (optimistically) on the client,
// against the local cache, and then later (usually moments later) sends a
// description of the mutation (its name and arguments) to the server, so that
// the server can *re-run* the mutation there against the authoritative
// datastore.
//
// This re-running of mutations is how Reflect handles conflicts: the
// mutators defensively check the database when they run and do the appropriate
// thing. The Reflect sync protocol ensures that the server-side result takes
// precedence over the client-side optimistic result.

import type { ApiEpisode, ApiFeed, Episode, Feed, StoredEpisode } from '@/data';
import { formatDuration } from '@/services/format-duration';
import type { MutatorDefs, WriteTransaction } from '@rocicorp/reflect';
import { mustGetFeed, setFeed, updateFeed } from './state';

export const mutators = {
  addFeed,
  addFeeds,
  subscribeToFeed,
  unsubscribeFromFeed,
  updateFeedLastAccessedAt,
  setCurrentEpisode,
  addEpisodesForFeed,
  updateProgressForEpisode,
  setPlayerSpeed,
} satisfies MutatorDefs;

export type Mutators = typeof mutators;

async function addFeed(
  tx: WriteTransaction,
  rawFeed: ApiFeed,
  fromSearch: boolean = false,
) {
  const feed = {
    ...rawFeed,
    _meta: {
      lastUpdatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      lastSubscribedAt: Date.now(),
      subscribed: false,
      fromSearch,
    },
  };
  console.log('Storing feed: ', feed);
  await setFeed(tx, feed);
}

async function addFeeds(
  tx: WriteTransaction,
  {
    feeds,
    fromSearch = false,
  }: {
    feeds: Feed[];
    fromSearch?: boolean;
  },
) {
  await Promise.all(
    feeds.map((feed) =>
      addFeed(
        tx,
        // Fixing a bug in podcast API by ensuring we parse JSON for occasional JSON strings
        typeof feed === 'string' ? JSON.parse(feed) : feed,
        fromSearch,
      ),
    ),
  );
}

async function updateFeedLastAccessedAt(
  tx: WriteTransaction,
  feedId: Feed['id'],
) {
  const existingFeed = await mustGetFeed(tx, feedId);
  const feed = {
    ...existingFeed,
    _meta: {
      ...existingFeed._meta,
      lastAccessedAt: Date.now(),
    },
  };
  console.log('Updating feed: ', feed);
  await updateFeed(tx, feed);
}

async function addEpisodesForFeed(
  tx: WriteTransaction,
  rawEpisodes: ApiEpisode[],
) {
  const episodes = rawEpisodes.map((episode) => ({
    ...episode,
    datePublished: new Date(episode.datePublished).toISOString(),
    durationFormatted: formatDuration(episode.duration),
    explicit: episode.explicit === 1,
    currentTime: 0,
  }));
  console.debug('Storing episodes: ', episodes);
  await Promise.all(
    episodes.map(
      async (episode) => await tx.set(`episode/${episode.id}`, episode),
    ),
  );
}

export async function setCurrentEpisode(
  tx: WriteTransaction,
  id: Episode['id'],
) {
  console.log('Setting current episode:', id);
  await tx.set(`/current-episode-id`, id);
}

async function updateProgressForEpisode(
  tx: WriteTransaction,
  {
    id,
    progress,
    played = false,
  }: {
    id: Episode['id'];
    progress: number;
    played?: boolean;
  },
) {
  console.debug('Updating progress for episode:', id, progress, played);
  const storedEpisode = (await tx.get(`episode/${id}`)) as StoredEpisode;
  if (storedEpisode) {
    await tx.set(`episode/${id}`, {
      ...storedEpisode,
      currentTime: progress,
      played,
      lastPlayedAt: Date.now(),
    });
  }
}

async function subscribeToFeed(tx: WriteTransaction, feedId: Feed['id']) {
  const storedFeed = await mustGetFeed(tx, feedId);
  const feed = {
    ...storedFeed,
    _meta: {
      ...storedFeed._meta,
      subscribed: true,
      lastSubscribedAt: Date.now(),
      lastAccessedAt: Date.now(),
    },
  };
  console.log('Subscribing to feed:', feed);
  await updateFeed(tx, feed);
}

async function unsubscribeFromFeed(tx: WriteTransaction, feedId: Feed['id']) {
  const storedFeed = await mustGetFeed(tx, feedId);
  const feed = {
    ...storedFeed,
    _meta: {
      ...storedFeed._meta,
      subscribed: false,
    },
  };
  console.log('Unsubscribing from feed:', feed);
  await updateFeed(tx, feed);
}

async function setPlayerSpeed(tx: WriteTransaction, speed: number) {
  console.log('Setting player speed:', speed);
  await tx.set(`/player-speed`, speed);
}
