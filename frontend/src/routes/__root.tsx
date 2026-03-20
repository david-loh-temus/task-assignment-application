import { TanStackDevtools } from '@tanstack/react-devtools';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import { AppShell } from '@app/layout/AppShell';

import type { QueryClient } from '@tanstack/react-query';

const DEV_TOOLS_CONFIG = {
  position: 'bottom-right' as const,
};

const DEV_TOOLS_PLUGINS = [
  {
    name: 'Tanstack Router',
    render: <TanStackRouterDevtoolsPanel />,
  },
];

const RootLayout = () => {
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>

      <TanStackDevtools config={DEV_TOOLS_CONFIG} plugins={DEV_TOOLS_PLUGINS} />
    </>
  );
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
});
