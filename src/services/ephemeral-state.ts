import { type Episode } from '@/data';
import {
  getCurrentEpisode,
  setCurrentEpisode,
  updateFeed,
} from '@/services/data';
import { atom } from 'nanostores';

export const $isPlaying = atom(false);

export async function togglePlaying() {
  $isPlaying.set(!$isPlaying.get());

  const currentEpisode = await getCurrentEpisode();
  if (!currentEpisode) return;
  await updateFeed({
    id: currentEpisode.feedId,
    lastAccessedAt: Date.now(),
  });
}

export function play() {
  $isPlaying.set(true);
}

export function pause() {
  $isPlaying.set(false);
}

export async function playEpisode(
  episode: Pick<Episode, 'id' | 'feedId' | 'enclosureType'>,
) {
  if (episode.enclosureType.startsWith('video/')) {
    console.log('skipping video play for episode:', episode);
    return;
  }

  const currentEpisode = await getCurrentEpisode();
  const isPlaying =
    episode.id === currentEpisode?.id ? !$isPlaying.get() : true;
  $isPlaying.set(isPlaying);

  if (episode.id !== currentEpisode?.id) {
    await setCurrentEpisode(episode.id);
  }

  await updateFeed({
    id: episode.feedId,
    lastAccessedAt: Date.now(),
  });
}
