import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { r } from './reflect';
import {
  listCompletedEpisodes,
  listExpiredEpisodes,
  listStaleFeeds,
} from './reflect/state';
import { episodesByPodcastId, podcastById } from './services/podcast-api';
import { feedApiQueue } from './services/queue';
import { apiThrottle } from './services/throttle';

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

const FIVE_MINUTES = 60 * 5 * 1000;

const startScheduledTasks = () => {
  requestIdleCallback(async () => {
    // Clean up completed /expired episodes every 5 minutes 24 hours after the
    // episode has last been played.
    const expiredEpisodes = await r.query(
      async (tx) => await listExpiredEpisodes(tx),
    );
    const completedEpisodes = await r.query(
      async (tx) => await listCompletedEpisodes(tx),
    );
    // TODO: this list will grow unbounded over time. Find a way to intelligently and performantly delete only the episodes that exist in the cache.
    for (const episode of expiredEpisodes.concat(completedEpisodes)) {
      console.debug(
        'Clearing cached episode:',
        episode.id,
        new Date(episode.lastPlayedAt ?? ''),
      );
      try {
        const cache = await caches.open('podcast-episode-cache/v1');
        await cache.delete(episode.id);
      } catch (error) {
        console.error('Error deleting cached episode:', episode.id, error);
      }
    }

    // Check for new episodes and podcast info for frequently accessed podcasts.
    const staleFeeds = await r.query((tx) => listStaleFeeds(tx));
    for (const feed of staleFeeds) {
      feedApiQueue.add(
        apiThrottle(async () => {
          console.log('Fetching podcast info for podcast:', feed.id);
          const updatedFeed = await podcastById(feed.id);
          await r.mutate.updateFeed(updatedFeed);
        }),
      );
      feedApiQueue.add(
        apiThrottle(async () => {
          console.log('Fetching episodes info for podcast:', feed.id);
          const episodes = await episodesByPodcastId(feed.id);
          console.log('e', episodes.length);
          await r.mutate.updateEpisodesForFeed(episodes);
        }),
      );
    }
    await feedApiQueue.onEmpty();
    console.debug('Queue emptied; starting next timer');

    // Queue up the next one
    setTimeout(startScheduledTasks, FIVE_MINUTES);
  });
};
startScheduledTasks();
