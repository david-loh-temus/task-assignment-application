// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import type { ReactNode } from 'react';

type LinkProps = {
  children: ReactNode;
  to: string;
};

type RouterStateSelector = (state: { location: { pathname: string } }) => string;

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: LinkProps) => <a href={to}>{children}</a>,
  useRouterState: ({ select }: { select: RouterStateSelector }) =>
    select({
      location: {
        pathname: '/',
      },
    }),
}));

describe('AppShell', () => {
  it('renders the shell navigation and page content', () => {
    render(
      <AppShell>
        <div>Page content</div>
      </AppShell>,
    );

    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getAllByText('Task Assignment')).toHaveLength(2);
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });
});
