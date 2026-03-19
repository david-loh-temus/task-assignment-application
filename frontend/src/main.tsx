import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';

import { AppProviders } from './app/providers/AppProviders';
import { getRouter } from './app/router';
import { createQueryClient } from './lib/query/query-client';

import './app/styles.css';

const queryClient = createQueryClient();
const router = getRouter(queryClient);

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
