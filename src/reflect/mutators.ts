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
import { Update } from '@rocicorp/rails';
import type { MutatorDefs, WriteTransaction } from '@rocicorp/reflect';
import {
  deleteFeed,
  getEpisodeById,
  getFeed,
  mustGetFeed,
  setFeed,
  updateFeed,
} from './state';

export const mutators = {
  addFeed,
  addFeeds,
  subscribeToFeed,
  unsubscribeFromFeed,
  updateFeed: updateFeedImpl,
  deleteFeed,
  setCurrentEpisode,
  addEpisodesForFeed,
  updateEpisodesForFeed,
  updateEpisode,
  updateProgressForEpisode,
  setPlayerSpeed,
  setAudioVolume,
} satisfies MutatorDefs;

export type Mutators = typeof mutators;

async function addFeed(
  tx: WriteTransaction,
  rawFeed: ApiFeed,
  fromSearch: boolean = false,
) {
  const existingFeed = await getFeed(tx, rawFeed.id);
  const feed = {
    ...existingFeed,
    ...rawFeed,
    _meta: {
      lastUpdatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      lastSubscribedAt: Date.now(),
      subscribed: false,
      ...existingFeed,
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

async function updateFeedImpl(
  tx: WriteTransaction,
  entity: Update<ApiFeed | Feed>,
) {
  const existingFeed = await mustGetFeed(tx, entity.id);
  const feed = {
    ...existingFeed,
    _meta: {
      ...existingFeed._meta,
      lastUpdatedAt: existingFeed._meta.lastUpdatedAt ?? Date.now(),
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
    datePublished: Number(episode.datePublished) * 1000,
    durationFormatted: formatDuration(episode.duration),
    explicit: episode.explicit === 1,
    currentTime: 0,
    downloaded: false,
  }));
  console.info('Storing episodes: ', episodes);
  await Promise.all(
    episodes.map(
      async (episode) => await tx.set(`episode/${episode.id}`, episode),
    ),
  );
}

async function updateEpisode(tx: WriteTransaction, episode: Update<Episode>) {
  const existingEpisode = await getEpisodeById(tx, episode.id);
  console.debug('Storing episode:', existingEpisode);
  return await tx.set(`episode/${episode.id}`, {
    ...existingEpisode,
    ...episode,
  });
}

async function updateEpisodesForFeed(
  tx: WriteTransaction,
  rawEpisodes: Update<ApiEpisode>[],
) {
  const episodes = rawEpisodes.map(async (episode) => {
    const existingEpisode = await getEpisodeById(tx, episode.id);
    return {
      ...existingEpisode,
      ...episode,
      datePublished:
        episode.datePublished != null
          ? episode.datePublished * 1000
          : existingEpisode?.datePublished,
      durationFormatted:
        episode.duration != null
          ? formatDuration(episode.duration)
          : existingEpisode?.durationFormatted,
      explicit: episode.explicit === 1,
      currentTime: existingEpisode?.currentTime,
    };
  });
  await Promise.all(
    episodes.map(async (episodePromise) => {
      const episode = await episodePromise;
      console.debug('Storing episode:', episode);
      return await tx.set(`episode/${episode.id}`, episode);
    }),
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

export async function setAudioVolume(tx: WriteTransaction, volume: number) {
  console.log('Updating volume:', volume);
  await tx.set(`/volume`, volume);
}
