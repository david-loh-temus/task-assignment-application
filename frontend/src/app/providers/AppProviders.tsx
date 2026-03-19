import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { createQueryClient } from '@lib/query/query-client';
import type { PropsWithChildren } from 'react';

type AppProvidersProps = PropsWithChildren;

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
