import PlayButton from '@/components/PlayButton';
import { ApiFeed } from '@/data';
import { r } from '@/data';
import { getFeed, listEpisodesForFeed } from '@/services/data/state';
import {
  useCurrentEpisode,
  useEpisodeForFeed,
  useEpisodesForFeed,
  useFeedById,
} from '@/services/data/subscriptions';
import { episodesByPodcastId, podcastById } from '@/services/podcast-api';
import { feedApiQueue } from '@/services/queue';
import { apiThrottle } from '@/services/throttle';
import { useStore } from '@nanostores/react';
import { LoaderFunctionArgs, useParams } from 'react-router-dom';
import invariant from 'ts-invariant';
import { $isPlaying } from '@/services/ephemeral-state';

export async function loader({ params }: LoaderFunctionArgs) {
  const { feedId = '' } = params;
  const feed = await r.query((tx) => getFeed(tx, feedId));
  if (feed == null) {
    const newFeed = (await feedApiQueue.add(
      apiThrottle(() => podcastById(feedId)),
    )) as ApiFeed;
    r.mutate.addFeed(newFeed);
  } else {
    r.mutate.updateFeed({ id: feedId, lastAccessedAt: Date.now() });
  }

  // Fetch new episodes that aren't in the cache yet.
  const episodes = await r.query((tx) => listEpisodesForFeed(tx, feedId));
  if (episodes.length === 0) {
    try {
      feedApiQueue.add(
        apiThrottle(() =>
          // Don't await this; let the UI render right away
          episodesByPodcastId(feedId).then((episodes) =>
            r.mutate.addEpisodesForFeed(episodes),
          ),
        ),
      );
    } catch (error) {
      console.error(error);
    }
  }

  return episodes;
}

export function Component() {
  const { episodeId } = useParams();
  invariant(episodeId, 'Episode id must be present');

  const currentEpisode = useCurrentEpisode(r);
  const isPlaying = useStore($isPlaying);

  const isPlayingCurrent = isPlaying && currentEpisode?.id === episodeId;
  const className =
    'absolute top-0 opacity-0 vynil-image vynil-animation-in' +
    (isPlayingCurrent ? '-spinning' : '');

  const episode = useEpisodeForFeed(r, episodeId);

  if (episode == null) {
    // TODO: throw error or show suspense instead, since the loader pre-loads missing feeds
    return null;
  }

  return (
    <section aria-labelledby="page-heading">
      <div className="container mx-auto max-w-screen-lg px-6 lg:px-0 flex flex-col items-start md:flex-row pt-8 pb-12">
        <div className="relative shadow-xl mr-32 w-72 md:w-auto">
          <img
            src={episode.image}
            alt={episode.title}
            aria-hidden="true"
            width="400"
            height="400"
            className="block rounded-md tag-album-cover relative z-10 bg-white"
            data-podcast-expand
          />
          <img
            src="/vynil-lp.webp"
            alt=""
            width="400"
            height="400"
            className={className}
            aria-hidden="true"
            data-vinyl-expand
          />
        </div>

        <div className="flex-1 flex flex-col justify-end pt-8">
          <h1 id="page-heading">
            <div className="text-5xl font-bold tracking-tight text-gray-900">
              {episode.title}
            </div>
            <div className="mt-3 text-3xl">{episode.author}</div>
          </h1>
          <div className="mt-2 text-lg">{episode.description}</div>
          <div className="mt-3 flex">
            <PlayButton episode={episode} />
          </div>
        </div>
      </div>
    </section>
  );
}
