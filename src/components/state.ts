import { atom } from 'nanostores';

export type Track = {
  id: string;
  title: string;
  position: number;
  length: string;
};

export type PlayerTrack = Track & {
  albumId: string;
  albumName: string;
  artist: string;
  imageUrl: string;
};

export const $isPlaying = atom(false);
export const $currentTrack = atom<PlayerTrack | null>(null);
