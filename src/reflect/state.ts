import { Episode, Feed, StoredEpisode, StoredFeed } from '@/data';
import { generate } from '@rocicorp/rails';
import { ReadTransaction } from '@rocicorp/reflect';

const TEN_DAYS = 60 * 60 * 24 * 10 * 1000;
const SIX_HOURS = 60 * 60 * 6 * 1000;

export const {
  get: getFeed,
  mustGet: mustGetFeed,
  set: setFeed,
  update: updateFeed,
  delete: deleteFeed,
  list: listFeeds,
  listIDs: listFeedIds,
} = generate<Feed>('feed');

export async function listAllFeeds(tx: ReadTransaction): Promise<Feed[]> {
  const feeds = await listFeeds(tx);
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

/**
 * List active feeds (have been accessed in the last 10 days) that have not been refreshed within the last 6 hours.
 */
export async function listStaleFeeds(
  tx: ReadTransaction,
): Promise<StoredFeed[]> {
  const feeds = (await listRegularFeeds(tx)).filter((feed) => {
    return (
      feed._meta.lastAccessedAt > Date.now() - TEN_DAYS &&
      feed._meta.lastUpdatedAt < Date.now() - SIX_HOURS
    );
  });
  return feeds;
}

export async function listSubscribedFeeds(
  tx: ReadTransaction,
): Promise<Feed[]> {
  const feeds = await listAllFeeds(tx);
  return feeds.filter((feed) => feed._meta.subscribed);
}

export async function listEpisodesForFeed(
  tx: ReadTransaction,
  feedId: Feed['id'],
): Promise<Episode[]> {
  const list = (
    (await tx.scan({ prefix: `episode/` }).toArray()) as StoredEpisode[]
  )
    .filter((episode) => episode.feedId === feedId)
    .sort((a, b) => b.datePublished - a.datePublished);
  return list as Episode[];
}

export async function getCurrentEpisode(
  tx: ReadTransaction,
): Promise<Episode | null> {
  const id = (await tx.get('/current-episode-id')) as unknown as Episode['id'];
  if (id != null) {
    const episode = (await tx.get(`episode/${id}`)) as Episode;
    return episode;
  }
  return null;
}

export async function getEpisodeById(
  tx: ReadTransaction,
  id: Episode['id'],
): Promise<Episode | null> {
  const episode = (await tx.get(`episode/${id}`)) as unknown as Episode;
  return episode;
}

export async function getPlayerSpeed(tx: ReadTransaction): Promise<number> {
  return ((await tx.get('/player-speed')) ?? 1) as number;
}
