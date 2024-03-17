import React from 'react';
import ReactDOM from 'react-dom/client';
import { Component as Root } from './routes/Root';
import ErrorPage from './error-page';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './styles/tailwind.css';
import './styles/transitions.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        lazy: () => import('./routes/Home'),
      },
      {
        path: '/podcast/:id',
        lazy: () => import('./routes/Podcast'),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
