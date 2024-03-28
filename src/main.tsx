import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { r } from './reflect';
import { listExpiredEpisodes } from './reflect/state';

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
    // Clean up completed episodes every 5 minutes 24 hours after the episode has last been played.
    await r.query(async (tx) => {
      const expiredEpisodes = await listExpiredEpisodes(tx);
      for (const episode of expiredEpisodes) {
        console.debug(
          'Clearing cached episode:',
          episode.id,
          new Date(episode.lastPlayedAt ?? ''),
        );
        const cache = await caches.open('podcast-episode-cache/v1');
        await cache.delete(episode.id);
      }
    });

    // Queue up the next one
    setTimeout(startScheduledTasks, FIVE_MINUTES);

    // TODO: Check for new episodes and podcast info for frequently accessed podcasts once every hour.
  });
};
startScheduledTasks();
