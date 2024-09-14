import type { ApiEpisode, Feed } from '@/data';
import { r } from '@/reflect';
import { useCurrentEpisode } from '@/reflect/subscriptions';
import { formatDuration } from '@/lib/format-duration';
import { episodesByPodcastId } from '@/services/podcast-api';
import { useStore } from '@nanostores/react';
import { useQuery } from '@tanstack/react-query';
import { ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { $isPlaying } from '@/services/ephemeral-state';
import { DownloadEpisode } from './DownloadEpisode';

type Props = {
  feedId: Feed['id'];
};

export default function EpisodeList({ feedId }: Props) {
  const currentEpisode = useCurrentEpisode(r);
  const isPlaying = useStore($isPlaying);

  const {
    isPending,
    isError,
    data: episodes,
    error,
  } = useQuery({
    queryKey: ['podcast', 'episodes', feedId],
    queryFn: async () => {
      const episodes = await episodesByPodcastId(feedId);
      await r.mutate.addEpisodesForFeed(episodes);
      return episodes;
    },
  });

  const Wrapper = useMemo(() => {
    return ({
      episode,
      isCurrentEpisode,
      children,
    }: {
      episode: ApiEpisode;
      isCurrentEpisode: boolean;
      children: ReactNode;
    }) =>
      // Videos can't be played here
      episode.enclosureType.startsWith('video/') ? (
        <div className="focus-visible:ring-2 px-6 py-4 flex basis grow w-full items-center">
          {children}
        </div>
      ) : (
        <Link
          to={`/podcast/${feedId}/episode/${episode.id}`}
          className={`hover:bg-gray-200 ${isCurrentEpisode ? 'bg-pink-200' : ''} focus-visible:ring-2 focus:outline-none focus:ring-black cursor-pointer px-6 py-4 flex basis grow w-full items-center`}
          aria-current={isCurrentEpisode}
        >
          {children}
        </Link>
      );
  }, [feedId]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

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
                    {new Date(episode.datePublished).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-left">
                    {episode.episode != null ? episode.episode + ': ' : ''}
                    {episode.title}
                  </span>
                </div>
                <span className="sr-only"> - </span>
                <span className="text-gray-500 ml-auto">
                  {formatDuration(episode.duration)}
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
