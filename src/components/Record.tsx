import type { CSSProperties } from 'react';
import { $isPlaying, $currentTrack } from './state';
import { useStore } from '@nanostores/react';

export default function Record({
  albumId,
  artist,
  title,
  imageUrl,
}: {
  albumId: string;
  artist: string;
  title: string;
  imageUrl: string;
}) {
  const currentTrack = useStore($currentTrack);
  const isPlaying = useStore($isPlaying);

  const isPlayingCurrentRecord = isPlaying && currentTrack.albumId === albumId;
  const className =
    'absolute top-0 opacity-0 vynil-image vynil-animation-in' +
    (isPlayingCurrentRecord ? '-spinning' : '');

  return (
    <div className="relative shadow-xl mr-32 w-72 md:w-auto">
      <img
        src={imageUrl}
        alt={`${artist} - ${title} album cover`}
        aria-hidden="true"
        width="400"
        height="400"
        className="block rounded-md tag-album-cover relative z-10 bg-white"
        style={{ viewTransitionName: `record-${albumId}` } as CSSProperties}
      />
      <img
        src="/vynil-lp.webp"
        alt=""
        width="400"
        height="400"
        className={className}
        style={{ viewTransitionName: `vinyl-${albumId}` } as CSSProperties}
        aria-hidden="true"
      />
    </div>
  );
}
