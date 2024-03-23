import EpisodeList from '@/components/EpisodeList';
import PlayButton from '@/components/PlayButton';
import { r } from '@/reflect';
import {
  listEpisodesForFeed,
  useEpisodesForFeed,
  useFeedById,
} from '@/reflect/subscriptions';
import { episodesByPodcastId, podcastById } from '@/services/podcast-api';
import { useStore } from '@nanostores/react';
import { LoaderFunctionArgs, useParams } from 'react-router-dom';
import invariant from 'ts-invariant';
import { $currentEpisode, $isPlaying } from '../services/state';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id: feedId = '' } = params;
  // Fetch new episodes that aren't in the cache yet.
  const episodes = await r.query((tx) => listEpisodesForFeed(tx, feedId));
  if (episodes.length === 0) {
    try {
      // don't await this; let the UI render right away
      Promise.all([podcastById(feedId), episodesByPodcastId(feedId)]).then(
        ([podcast, episodes]) =>
          Promise.all([
            r.mutate.addFeed(podcast),
            r.mutate.addEpisodesForFeed(episodes),
          ]),
      );
    } catch (error) {
      console.error(error);
    }
  }

  return episodes;
}

export function Component() {
  const { id } = useParams();
  invariant(id, 'Id must be present');

  const currentEpisode = useStore($currentEpisode);
  const isPlaying = useStore($isPlaying);

  const isPlayingCurrent = isPlaying && currentEpisode?.id === id;
  const className =
    'absolute top-0 opacity-0 vynil-image vynil-animation-in' +
    (isPlayingCurrent ? '-spinning' : '');

  const feed = useFeedById(r, id);
  const episodes = useEpisodesForFeed(r, id);

  if (feed == null) {
    // TODO: throw error instead, since the loader pre-loads missing feeds
    return null;
  }

  return (
    <section aria-labelledby="page-heading">
      <div className="container mx-auto max-w-screen-lg px-6 lg:px-0 flex flex-col items-start md:items-center md:flex-row pt-8 pb-12">
        <div className="relative shadow-xl mr-32 w-72 md:w-auto">
          <img
            src={feed.image}
            alt={`${feed.author} - ${feed.title}`}
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
              {feed.title}
            </div>
            <div className="mt-3 text-3xl">{feed.author}</div>
          </h1>
          <div className="mt-2 text-lg">{feed.description}</div>
          <div className="mt-3 flex">
            {episodes.length > 0 && (
              <PlayButton episode={currentEpisode ?? episodes[0]} />
            )}

            {/* <svg */}
            {/*   className="w-6 h-6 mr-2 -ml-1 text-pink-600" */}
            {/*   fill="currentColor" */}
            {/*   viewBox="0 0 20 20" */}
            {/*   xmlns="http://www.w3.org/2000/svg" */}
            {/*   aria-hidden="true" */}
            {/*   focusable="false" */}
            {/* > */}
            {/*   <path */}
            {/*     fillRule="evenodd" */}
            {/*     d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" */}
            {/*     clipRule="evenodd" */}
            {/*   ></path> */}
            {/* </svg> */}

            <button
              type="button"
              className="text-pink-700 bg-gray-100 hover:bg-gray-200 focus-visible:ring-2 focus:outline-none focus:ring-black font-medium rounded-lg text-lg px-10 py-3 text-center inline-flex items-center dark:focus:ring-black mr-4"
              onClick={() =>
                feed._meta.subscribed
                  ? r.mutate.unsubscribeFromFeed(feed.id)
                  : r.mutate.subscribeToFeed(feed.id)
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="w-6 h-6 mr-2 -ml-1 text-pink-700"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              {feed._meta.subscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-screen-lg mb-10">
        <EpisodeList podcastId={id} />
      </div>
    </section>
  );
}
