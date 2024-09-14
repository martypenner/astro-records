import { type Episode } from '@/data';
import { r } from '@/services/data';
import { getCurrentEpisode } from '@/services/data/state';
import { atom } from 'nanostores';

export const $isPlaying = atom(false);

export function togglePlaying() {
  $isPlaying.set(!$isPlaying.get());

  r.query(async (tx) => {
    const currentEpisode = await getCurrentEpisode(tx);
    if (!currentEpisode) return;
    await r.mutate.updateFeed({
      id: currentEpisode.feedId,
      lastAccessedAt: Date.now(),
    });
  });
}

export function play() {
  $isPlaying.set(true);
}

export function pause() {
  $isPlaying.set(false);
}

export function playEpisode(
  episode: Pick<Episode, 'id' | 'feedId' | 'enclosureType'>,
) {
  if (episode.enclosureType.startsWith('video/')) {
    console.log('skipping video play for episode:', episode);
    return;
  }

  r.query(async (tx) => {
    const currentEpisode = await getCurrentEpisode(tx);
    const isPlaying =
      episode.id === currentEpisode?.id ? !$isPlaying.get() : true;
    $isPlaying.set(isPlaying);

    if (episode.id !== currentEpisode?.id) {
      r.mutate.setCurrentEpisode(episode.id);
    }

    r.mutate.updateFeed({
      id: episode.feedId,
      lastAccessedAt: Date.now(),
    });
  });
}
