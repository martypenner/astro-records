import PQueue from 'p-queue';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { r } from './reflect';
import { listExpiredEpisodes, listStaleFeeds } from './reflect/state';
import { episodesByPodcastId, podcastById } from './services/podcast-api';

import './styles/tailwind.css';
import './styles/transitions.css';

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./routes/Root'),
    children: [
      {
        index: true,
        lazy: () => import('./routes/Home'),
      },
      {
        path: '/podcast/:id',
        lazy: () => import('./routes/Podcast'),
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    // this makes sure that there is only one instance of the reflect client during hmr reloads
    await r.close();
    root.unmount();
  });
}

const fetchQueue = new PQueue({ concurrency: 1 });
const FIVE_MINUTES = 60 * 5 * 1000;

const startScheduledTasks = () => {
  requestIdleCallback(async () => {
    // Clean up completed episodes every 5 minutes 24 hours after the episode has last been played.
    const expiredEpisodes = await r.query(
      async (tx) => await listExpiredEpisodes(tx),
    );
    for (const episode of expiredEpisodes) {
      console.debug(
        'Clearing cached episode:',
        episode.id,
        new Date(episode.lastPlayedAt ?? ''),
      );
      const cache = await caches.open('podcast-episode-cache/v1');
      await cache.delete(episode.id);
    }

    // Check for new episodes and podcast info for frequently accessed podcasts.
    const staleFeeds = await r.query((tx) => listStaleFeeds(tx));
    const staleFeedsFetches = staleFeeds.map((feed) => () => {
      console.log('Fetching podcast info for podcast:', feed.id);
      return podcastById(feed.id);
    });
    const staleFeedsEpisodesFetches = staleFeeds.map((feed) => () => {
      console.log('Fetching episodes info for podcast:', feed.id);
      return episodesByPodcastId(feed.id);
    });
    fetchQueue.addAll(staleFeedsFetches);
    fetchQueue.addAll(staleFeedsEpisodesFetches);
    await fetchQueue.onEmpty();
    console.debug('Queue emptied; starting next timer');

    // Queue up the next one
    setTimeout(startScheduledTasks, FIVE_MINUTES);
  });
};
startScheduledTasks();
