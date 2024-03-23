import { type Feed, type Episode } from '@/data';
import { atom } from 'nanostores';

export const $isPlaying = atom(false);
export const $currentEpisode = atom<Episode | null>(null);
export const $searchedFeeds = atom<Feed[] | null>(null);

export function togglePlay() {
  $isPlaying.set(!$isPlaying.get());
}

export function pause() {
  $isPlaying.set(false);
}

export function playEpisode(episode: Episode) {
  if (episode.enclosureType.startsWith('video/')) {
    console.log('skipping video play for episode:', episode);
    return;
  }

  $isPlaying.set(
    episode.id === $currentEpisode.get()?.id ? !$isPlaying.get() : true,
  );
  $currentEpisode.set(episode);
}

export function setSearchedFeeds(feeds: Feed[]) {
  $searchedFeeds.set(feeds);
}
