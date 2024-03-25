import { type Episode } from '@/data';
import { r } from '@/reflect';
import { getCurrentEpisode } from '@/reflect/state';
import { atom } from 'nanostores';

export const $isPlaying = atom(false);
export const $showSearchedFeeds = atom<boolean>(false);

export function togglePlaying() {
  $isPlaying.set(!$isPlaying.get());
}

export function play() {
  $isPlaying.set(true);
}

export function pause() {
  $isPlaying.set(false);
}

export function playEpisode(episode: Episode) {
  if (episode.enclosureType.startsWith('video/')) {
    console.log('skipping video play for episode:', episode);
    return;
  }

  r.query(async (tx) => {
    const currentEpisode = await getCurrentEpisode(tx);
    $isPlaying.set(
      episode.id === currentEpisode?.id ? !$isPlaying.get() : true,
    );
    if (episode.id !== currentEpisode?.id) {
      r.mutate.setCurrentEpisode(episode.id);
    }
  });
}

export function setShowSearchedFeeds(show: boolean) {
  $showSearchedFeeds.set(show);
}
