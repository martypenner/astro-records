import type { CSSProperties } from 'react';
import { $isPlaying, $currentEpisode } from '../services/state';
import { useStore } from '@nanostores/react';

export default function Podcast({
  id,
  author,
  title,
  image,
}: {
  id: string;
  author: string;
  title: string;
  image: string;
}) {
  const currentEpisode = useStore($currentEpisode);
  const isPlaying = useStore($isPlaying);

  const isPlayingCurrent = isPlaying && currentEpisode.id === id;
  const className =
    'absolute top-0 opacity-0 vynil-image vynil-animation-in' +
    (isPlayingCurrent ? '-spinning' : '');

  return (
    <div className="relative shadow-xl mr-32 w-72 md:w-auto">
      <img
        src={image}
        alt={`${author} - ${title}`}
        aria-hidden="true"
        width="400"
        height="400"
        className="block rounded-md tag-album-cover relative z-10 bg-white"
        style={{ viewTransitionName: `podcast-${id}` } as CSSProperties}
      />
      <img
        src="/vynil-lp.webp"
        alt=""
        width="400"
        height="400"
        className={className}
        style={{ viewTransitionName: `vinyl-${id}` } as CSSProperties}
        aria-hidden="true"
      />
    </div>
  );
}
