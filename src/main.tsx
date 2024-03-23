import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { r } from './reflect';

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
