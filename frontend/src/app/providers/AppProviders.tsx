import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { isDev } from '@config/config';

import type { QueryClient } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

type AppProvidersProps = PropsWithChildren<{
  queryClient: QueryClient;
}>;

export const AppProviders = ({ children, queryClient }: AppProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
