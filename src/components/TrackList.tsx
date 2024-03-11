import { useStore } from '@nanostores/react';
import { $currentTrack, $isPlaying, type Track } from './state';

type Props = {
  tracks: Track[];
  albumName: string;
  albumId: string;
  artist: string;
  imageUrl: string;
};

const playIcon = (
  <svg
    className="w-6 h-6 ml-1 text-pink-600"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
      clipRule="evenodd"
    />
  </svg>
);

const pauseIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6 ml-1 text-pink-600"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM9 8.25a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h.75a.75.75 0 00.75-.75V9a.75.75 0 00-.75-.75H9zm5.25 0a.75.75 0 00-.75.75v6c0 .414.336.75.75.75H15a.75.75 0 00.75-.75V9a.75.75 0 00-.75-.75h-.75z"
      clipRule="evenodd"
    />
  </svg>
);

function renderIcon(icon: JSX.Element, position: number) {
  return (
    <span>
      {icon}
      <span className="sr-only">{position}</span>
    </span>
  );
}

export default function TrackList({
  tracks,
  albumId,
  albumName,
  artist,
  imageUrl,
}: Props) {
  const currentTrack = useStore($currentTrack);
  const isPlaying = useStore($isPlaying);

  return (
    <ul className="text-xl" aria-label="Tracklist">
      {tracks.map((track) => {
        const isCurrentTrack = track.id == currentTrack?.id;

        return (
          <li key={track.id} className="first:border-t border-b">
            <button
              type="button"
              className="hover:bg-gray-50 focus-visible:ring-2 focus:outline-none focus:ring-black cursor-pointer px-6 py-4 flex basis grow w-full items-center"
              aria-current={isCurrentTrack}
              onClick={() => {
                $currentTrack.set({
                  ...track,
                  albumName,
                  albumId,
                  artist,
                  imageUrl,
                });

                $isPlaying.set(isCurrentTrack ? !$isPlaying.value : true);
              }}
            >
              <span className="text-gray-500 w-8 mr-2">
                {isCurrentTrack && !$isPlaying.value
                  ? renderIcon(pauseIcon, track.position)
                  : isCurrentTrack && $isPlaying.value
                    ? renderIcon(playIcon, track.position)
                    : track.position}
              </span>
              <span className="sr-only"> - </span>
              <span className="font-medium">{track.title}</span>
              <span className="sr-only"> - </span>
              <span className="text-gray-500 ml-auto">{track.length}</span>

              <span className="sr-only">
                (press to {isCurrentTrack && isPlaying ? 'pause)' : 'play)'}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
