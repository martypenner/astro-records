import type { Feed } from '@/data';
import { r } from '@/reflect';
import { useEpisodesForFeed } from '@/reflect/subscriptions';
import { useStore } from '@nanostores/react';
import { $currentEpisode, $isPlaying, playEpisode } from '../services/state';

type Props = {
  podcastId: Feed['id'];
};

export default function EpisodeList({ podcastId }: Props) {
  const currentEpisode = useStore($currentEpisode);
  const isPlaying = useStore($isPlaying);

  const episodes = useEpisodesForFeed(r, podcastId);

  return (
    <ul className="text-xl" aria-label="Tracklist">
      {episodes.map((episode) => {
        const isCurrentEpisode = episode.id == currentEpisode?.id;

        return (
          <li key={episode.id} className="first:border-t border-b">
            <button
              type="button"
              className="hover:bg-gray-50 focus-visible:ring-2 focus:outline-none focus:ring-black cursor-pointer px-6 py-4 flex basis grow w-full items-center"
              aria-current={isCurrentEpisode}
              onClick={() => playEpisode(episode)}
            >
              <div className="flex basis grow w-full items-center gap-4">
                <span className="font-normal text-md">{episode.episode}</span>
                <div className="flex flex-col justify-start items-start">
                  <span className="text-sm mb-1">
                    {episode.datePublished.toLocaleDateString()}
                  </span>
                  <span className="font-medium text-left">{episode.title}</span>
                </div>
                <span className="sr-only"> - </span>
                <span className="text-gray-500 ml-auto">
                  {episode.durationFormatted}
                </span>

                <span className="sr-only">
                  (press to {isCurrentEpisode && isPlaying ? 'pause)' : 'play)'}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
