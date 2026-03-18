import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';

import { AppProviders } from './app/providers/AppProviders';
import { getRouter } from './app/router';

import './app/styles.css';

const router = getRouter();

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
