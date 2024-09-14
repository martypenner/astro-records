import type { Episode, Feed } from '@/data';
import { r } from '@/services/reflect';
import * as subscriptions from '@/services/reflect/subscriptions';

export function useFeeds(): Feed[] {
  return subscriptions.useFeeds(r);
}

export function useFeedById(key: Feed['id']): Feed | null {
  return subscriptions.useFeedById(r, key);
}

export function useEpisodeForFeed(episodeId: Episode['id']): Episode | null {
  return subscriptions.useEpisodeForFeed(r, episodeId);
}

export function useEpisodesForFeed(feedId: Feed['id']): Episode[] {
  return subscriptions.useEpisodesForFeed(r, feedId);
}

export function useCurrentEpisode(): Episode | null {
  return subscriptions.useCurrentEpisode(r);
}

export function useEpisodeById(key: Episode['id']): Episode | null {
  return subscriptions.useEpisodeById(r, key);
}

export function usePlayerSpeed(): number {
  return subscriptions.usePlayerSpeed(r);
}
