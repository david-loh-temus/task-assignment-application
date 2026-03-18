import { TanStackDevtools } from '@tanstack/react-devtools';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import { AppShell } from '@app/layout/AppShell';

const RootLayout = () => {
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>

      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
