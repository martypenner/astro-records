import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { r } from '@/services/data';
import {
  getEpisodeById,
  listOldFeeds,
  listStaleFeeds,
} from '@/services/data/state';
import { episodesByPodcastId, podcastById } from '@/services/podcast-api';
import { feedApiQueue } from '@/services/queue';
import { apiThrottle } from '@/services/throttle';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

import './styles/tailwind.css';
import './styles/transitions.css';

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;

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
        path: '/podcast/:feedId',
        lazy: () => import('./routes/Podcast'),
      },
      {
        path: '/podcast/:feedId/episode/:episodeId',
        lazy: () => import('./routes/Episode'),
      },
      {
        path: '/search',
        lazy: () => import('./routes/Search'),
      },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      gcTime: 30 * DAYS,
      staleTime: 10 * MINUTES,
    },
    mutations: {
      networkMode: 'offlineFirst',
      gcTime: 30 * DAYS,
    },
  },
});

if (typeof document !== 'undefined') {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
  });
  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
  });
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    // this makes sure that there is only one instance of the reflect client during hmr reloads
    await r.close();
    root.unmount();
  });
}

const startScheduledTasks = () => {
  requestIdleCallback(async () => {
    // Clean up completed episodes every 5 minutes 24 hours after the
    // episode has last been played, and expired episodes 10 days after
    // it was last played.
    const cache = await caches.open('podcast-episode-cache/v1');
    const episodeIds = await cache.keys();
    for (const request of episodeIds) {
      const episodeId = new URL(request.url).pathname.split('/').at(-1);
      if (!episodeId) continue;

      const episode = await r.query((tx) => getEpisodeById(tx, episodeId));
      try {
        if (!episode) {
          console.debug('Clearing orphaned cached episode:', episodeId);
          await cache.delete(request);
        } else if (
          episode.lastPlayedAt &&
          episode.lastPlayedAt < Date.now() - 10 * DAYS
        ) {
          console.debug(
            'Clearing cached episode:',
            episodeId,
            new Date(episode.lastPlayedAt),
          );
          await cache.delete(request);
          await r.mutate.updateEpisode({ id: episodeId, downloaded: false });
        }
      } catch (error) {
        console.error('Error deleting cached episode:', episodeId, error);
      }
    }

    // // Check for new episodes and podcast info for frequently accessed podcasts.
    // const staleFeeds = await r.query((tx) => listStaleFeeds(tx));
    // for (const feed of staleFeeds) {
    //   feedApiQueue.add(
    //     apiThrottle(async () => {
    //       console.log('Fetching podcast info for podcast:', feed.id);
    //       const updatedFeed = await podcastById(feed.id);
    //       await r.mutate.updateFeed(updatedFeed);
    //     }),
    //   );
    //   feedApiQueue.add(
    //     apiThrottle(async () => {
    //       console.log('Fetching episodes info for podcast:', feed.id);
    //       const episodes = await episodesByPodcastId(feed.id);
    //       console.log('e', episodes.length);
    //       await r.mutate.updateEpisodesForFeed(episodes);
    //     }),
    //   );
    // }

    // Clean old podcasts out of the store.
    // const oldFeeds = await r.query((tx) => listOldFeeds(tx));
    // for (const feed of oldFeeds) {
    //   feedApiQueue.add(async () => {
    //     console.log('Clearing store data for podcast:', feed.id);
    //     await r.mutate.deleteFeed(feed.id);
    //   });
    // }

    await feedApiQueue.onEmpty();
    console.debug('Queue emptied; starting next timer');

    // Queue up the next one
    setTimeout(startScheduledTasks, 5 * MINUTES);
  });
};
startScheduledTasks();
