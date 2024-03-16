import type { Feed } from '@/data';
import { r } from '@/reflect';
import { useEpisodesForFeed, useFeedById } from '@/reflect/subscriptions';
import { episodesByPodcastId, podcastById } from '@/services/podcast-api';
import { useStore } from '@nanostores/react';
import { useEffect, type CSSProperties } from 'react';
import { $currentEpisode, $isPlaying } from '../services/state';
import EpisodeList from './EpisodeList';
import PlayButton from './PlayButton';

export default function Podcast({ id }: { id: Feed['id'] }) {
  const currentEpisode = useStore($currentEpisode);
  const isPlaying = useStore($isPlaying);

  const isPlayingCurrent = isPlaying && currentEpisode.id === id;
  const className =
    'absolute top-0 opacity-0 vynil-image vynil-animation-in' +
    (isPlayingCurrent ? '-spinning' : '');

  const feed = useFeedById(r, id);
  const episodes = useEpisodesForFeed(r, id);

  // Fetch new podcasts that aren't in the cache yet.
  useEffect(() => {
    const doIt = async () => {
      try {
        const podcast = await podcastById(id.toString());
        const episodes = await episodesByPodcastId(podcast.id);
        await Promise.all([
          r.mutate.addFeed(podcast),
          r.mutate.addEpisodesForFeed(episodes),
        ]);
      } catch (error) {
        console.error(error);
      }
    };

    if (feed == null) {
      doIt();
    }
  }, [id, feed]);

  if (feed == null) {
    return <title>Loading feed... - Astro Podcasts</title>;
  }

  return (
    <>
      <title>
        {feed.title} by {feed.author} - Astro Podcasts
      </title>

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

          <div className="flex-1 flex flex-col justify-end pt-8">
            <h1 id="page-heading">
              <div className="text-5xl font-bold tracking-tight text-gray-900">
                {feed.title}
              </div>
              <div className="mt-3 text-3xl">{feed.author}</div>
            </h1>
            <div className="mt-2 text-lg">{feed.description}</div>
            <div className="mt-3 flex">
              {episodes.length > 0 && <PlayButton />}
              <button
                disabled
                type="button"
                className="opacity-50 text-pink-600 bg-gray-100 font-medium rounded-lg text-lg px-10 py-3 text-center inline-flex items-center dark:focus:ring-gray-500 mr-4"
              >
                <svg
                  className="w-6 h-6 mr-2 -ml-1 text-pink-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Shuffle
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-screen-lg mb-10">
          <EpisodeList podcastId={id} />
        </div>
      </section>
    </>
  );
}
