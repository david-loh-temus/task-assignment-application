// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { AppProviders } from '../AppProviders';

const QueryClientProbe = () => {
  const queryClient = useQueryClient();

  queryClient.getDefaultOptions();

  return <div data-testid="query-client-ready">ready</div>;
};

describe('AppProviders', () => {
  it('renders children inside the QueryClientProvider context', () => {
    render(
      <AppProviders>
        <QueryClientProbe />
      </AppProviders>,
    );

    expect(screen.getByTestId('query-client-ready')).toHaveTextContent('ready');
  });
});
