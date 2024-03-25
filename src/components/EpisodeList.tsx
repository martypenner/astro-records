import type { Episode, Feed } from '@/data';
import { r } from '@/reflect';
import { useCurrentEpisode, useEpisodesForFeed } from '@/reflect/subscriptions';
import { useStore } from '@nanostores/react';
import { ReactNode, useMemo } from 'react';
import { $isPlaying, playEpisode } from '../services/state';
import { DownloadEpisode } from './DownloadEpisode';

type Props = {
  podcastId: Feed['id'];
};

export default function EpisodeList({ podcastId }: Props) {
  const currentEpisode = useCurrentEpisode(r);
  const isPlaying = useStore($isPlaying);
  const episodes = useEpisodesForFeed(r, podcastId);

  const Wrapper = useMemo(() => {
    return ({
      episode,
      isCurrentEpisode,
      children,
    }: {
      episode: Episode;
      isCurrentEpisode: boolean;
      children: ReactNode;
    }) =>
      // Videos can't be played here
      episode.enclosureType.startsWith('video/') ? (
        <div className="focus-visible:ring-2 px-6 py-4 flex basis grow w-full items-center">
          {children}
        </div>
      ) : (
        <button
          type="button"
          className={`hover:bg-gray-200 ${isCurrentEpisode ? 'bg-pink-200' : ''} focus-visible:ring-2 focus:outline-none focus:ring-black cursor-pointer px-6 py-4 flex basis grow w-full items-center`}
          aria-current={isCurrentEpisode}
          onClick={() => playEpisode(episode)}
        >
          {children}
        </button>
      );
  }, []);

  return (
    <ul className="text-xl" aria-label="Episode list">
      {episodes.map((episode) => {
        const isCurrentEpisode = episode.id == currentEpisode?.id;

        return (
          <li key={episode.id} className="first:border-t border-b">
            <DownloadEpisode id={episode.id} />

            <Wrapper episode={episode} isCurrentEpisode={isCurrentEpisode}>
              <div className="flex basis grow w-full items-center gap-4">
                <div className="flex flex-col justify-start items-start">
                  <span className="text-sm mb-1">
                    {episode.episode}
                    {new Date(episode.datePublished).toLocaleDateString()}
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
            </Wrapper>
          </li>
        );
      })}
    </ul>
  );
}
