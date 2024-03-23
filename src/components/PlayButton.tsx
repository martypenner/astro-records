import { Episode } from '@/data';
import { useStore } from '@nanostores/react';
import { $isPlaying, playEpisode } from '../services/state';

export default function PlayButton({ episode }: { episode: Episode }) {
  const isPlaying = useStore($isPlaying);

  return (
    <button
      type="button"
      className="text-pink-700 bg-gray-100 hover:bg-gray-200 focus-visible:ring-2 focus:outline-none focus:ring-black font-medium rounded-lg text-lg px-10 py-3 text-center inline-flex items-center dark:focus:ring-black mr-4"
      onClick={() => playEpisode(episode)}
    >
      {isPlaying ? (
        <>
          <svg
            className="w-6 h-6 mr-2 -ml-1 text-pink-700"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
              clipRule="evenodd"
            />
          </svg>
          Pause
        </>
      ) : (
        <>
          <svg
            className="w-6 h-6 mr-2 -ml-1 text-pink-700"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Play
        </>
      )}
    </button>
  );
}
