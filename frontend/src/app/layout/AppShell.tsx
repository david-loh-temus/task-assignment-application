import { HomeOutlined, ProfileOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useRouterState } from '@tanstack/react-router';
import { Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

import './app-shell.css';

const { Content, Header, Sider } = Layout;

// eslint-disable-next-line no-magic-numbers
const SIDEBAR_WIDTH = 220;

const navigationItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: <Link to="/">Tasks</Link>,
  },
  {
    key: '/create-task',
    icon: <ProfileOutlined />,
    disabled: true,
    label: 'Create Task',
  },
  {
    key: '/team',
    icon: <TeamOutlined />,
    disabled: true,
    label: 'Team',
  },
];

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <Layout className="app-shell">
      <Sider breakpoint="lg" className="app-shell__sider" collapsedWidth="0" theme="light" width={SIDEBAR_WIDTH}>
        <div className="app-shell__brand">
          <Typography.Text className="app-shell__eyebrow">Task Assignment</Typography.Text>
          <Typography.Text className="app-shell__brand-title">Frontend</Typography.Text>
        </div>

        <Menu className="app-shell__menu" items={navigationItems} mode="inline" selectedKeys={[pathname]} />
      </Sider>

      <Layout>
        <Header className="app-shell__header">
          <Typography.Text className="app-shell__header-title">Task Assignment</Typography.Text>
        </Header>

        <Content className="app-shell__content">{children}</Content>
      </Layout>
    </Layout>
  );
};
