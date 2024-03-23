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

import type { Episode, Feed } from '@/data';
import type { MutatorDefs, WriteTransaction } from '@rocicorp/reflect';
import { mustGetFeed, setFeed, updateFeed } from './state';

export const mutators = {
  addFeed,
  addFeeds,
  addEpisodesForFeed,
  subscribeToFeed,
  unsubscribeFromFeed,
} satisfies MutatorDefs;

export type Mutators = typeof mutators;

async function addFeed(
  tx: WriteTransaction,
  rawFeed: Feed,
  fromSearch: boolean = false,
) {
  const feed = {
    ...rawFeed,
    _meta: {
      lastUpdatedAt: Date.now(),
      fromSearch,
      lastSubscribedAt: Date.now(),
      subscribed: false,
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

async function addEpisodesForFeed(tx: WriteTransaction, episodes: Episode[]) {
  console.log(
    'Storing episodes: ',
    episodes.map((episode) => episode),
  );
  await Promise.all(
    episodes.map(
      async (episode) =>
        await tx.set(`episode/${episode.feedId}/${episode.id}`, episode),
    ),
  );
}

async function subscribeToFeed(tx: WriteTransaction, feedId: Feed['id']) {
  const storedFeed = await mustGetFeed(tx, feedId);
  const feed = {
    ...storedFeed,
    _meta: {
      ...storedFeed._meta,
      subscribed: true,
      lastSubscribedAt: Date.now(),
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
