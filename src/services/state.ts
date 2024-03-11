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
  position: number;
  length: string;
};

export type PlayerEpisode = {
  id: string;
  title: string;
  author: string;
  image: string;
};

export const $isPlaying = atom(false);
export const $currentEpisode = atom<PlayerEpisode | null>(null);
