import { atom } from 'nanostores';

export const $isPlaying = atom(false);
export const $currentEpisode = atom<Episode | null>(null);

export function togglePlay() {
  $isPlaying.set(!$isPlaying.get());
}

export function pause() {
  $isPlaying.set(false);
}

export function playEpisode(episode: Episode) {
  $isPlaying.set(
    episode.id === $currentEpisode.get()?.id ? !$isPlaying.get() : true,
  );
  $currentEpisode.set(episode);
}
