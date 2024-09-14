import type { ApiEpisode, ApiFeed, Episode, Feed, StoredFeed } from '@/data';
import { r } from '@/services/reflect';
import * as queries from '@/services/reflect/queries';
import { Update } from '@rocicorp/rails';

export async function listAllFeeds(): Promise<Feed[]> {
  return await r.query((tx) => queries.listAllFeeds(tx));
}

/**
 * List active feeds (have been accessed in the last 10 days) that have not been refreshed within the last 6 hours.
 */
export async function listStaleFeeds(): Promise<StoredFeed[]> {
  return await r.query((tx) => queries.listStaleFeeds(tx));
}

/**
 * List old podcasts, i.e. ones that haven't been accessed in 30 days.
 * This is mainly useful to clean up old cached searched feeds.
 */
export async function listOldFeeds(): Promise<StoredFeed[]> {
  return await r.query((tx) => queries.listOldFeeds(tx));
}

export async function listSubscribedFeeds(): Promise<Feed[]> {
  return await r.query((tx) => queries.listSubscribedFeeds(tx));
}

export async function listEpisodesForFeed(
  feedId: Feed['id'],
): Promise<Episode[]> {
  return await r.query((tx) => queries.listEpisodesForFeed(tx, feedId));
}

export async function getCurrentEpisode(): Promise<Episode | null> {
  return await r.query((tx) => queries.getCurrentEpisode(tx));
}

export async function getEpisodeById(
  id: Episode['id'],
): Promise<Episode | null> {
  return await r.query((tx) => queries.getEpisodeById(tx, id));
}

export async function getPlayerSpeed(): Promise<number> {
  return await r.query((tx) => queries.getPlayerSpeed(tx));
}

export async function getVolume(): Promise<number> {
  return await r.query((tx) => queries.getVolume(tx));
}

export const getFeedById = async (feedId: Feed['id']) =>
  await r.query((tx) => queries.getFeedById(tx, feedId));

export const addFeed = (rawFeed: ApiFeed) => r.mutate.addFeed(rawFeed);

export const addFeeds = ({ feeds }: { feeds: Feed[] }) =>
  r.mutate.addFeeds({ feeds });

export const subscribeToFeed = (feedId: Feed['id']) =>
  r.mutate.subscribeToFeed(feedId);

export const unsubscribeFromFeed = (feedId: Feed['id']) =>
  r.mutate.unsubscribeFromFeed(feedId);

export const updateFeed = (entity: Update<Feed>) => r.mutate.updateFeed(entity);

export const deleteFeed = (feedId: Feed['id']) => r.mutate.deleteFeed(feedId);

export const setCurrentEpisode = (id: Episode['id']) =>
  r.mutate.setCurrentEpisode(id);

export const addEpisodesForFeed = (rawEpisodes: ApiEpisode[]) =>
  r.mutate.addEpisodesForFeed(rawEpisodes);

export const updateEpisodesForFeed = (
  rawEpisodes: Update<Pick<ApiEpisode, 'id' | 'feedId'>>[],
) => r.mutate.updateEpisodesForFeed(rawEpisodes);

export const updateEpisode = (episode: Update<Episode>) =>
  r.mutate.updateEpisode(episode);

export const updateProgressForEpisode = ({
  id,
  progress,
}: {
  id: Episode['id'];
  progress: number;
}) => r.mutate.updateProgressForEpisode({ id, progress });

export const setPlayerSpeed = (speed: number) => r.mutate.setPlayerSpeed(speed);

export const setAudioVolume = (volume: number) =>
  r.mutate.setAudioVolume(volume);

// If you still need the Mutators type, you can define it like this:
export type Mutators = {
  addFeed: typeof addFeed;
  addFeeds: typeof addFeeds;
  subscribeToFeed: typeof subscribeToFeed;
  unsubscribeFromFeed: typeof unsubscribeFromFeed;
  updateFeed: typeof updateFeed;
  deleteFeed: typeof deleteFeed;
  setCurrentEpisode: typeof setCurrentEpisode;
  addEpisodesForFeed: typeof addEpisodesForFeed;
  updateEpisodesForFeed: typeof updateEpisodesForFeed;
  updateEpisode: typeof updateEpisode;
  updateProgressForEpisode: typeof updateProgressForEpisode;
  setPlayerSpeed: typeof setPlayerSpeed;
  setAudioVolume: typeof setAudioVolume;
};
