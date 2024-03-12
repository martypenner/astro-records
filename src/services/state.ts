import { atom } from 'nanostores';

export type Feed = {
  id: string;
  author: string;
  title: string;
  description: string;
  url: string;
  image: string;
};

export type Episode = {
  id: string;
  title: string;
  description: string;
  author: string;
  image?: string;
  datePublished: Date;
  duration: number;
  durationFormatted: string;
  number: number;
};

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
