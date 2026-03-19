// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { developerCollectionFixture } from '@features/developers/__fixtures__/developer-fixtures';
import { TaskListPage } from '@features/tasks/pages/TaskListPage';
import { taskCollectionFixture } from '@features/tasks/__fixtures__/task-fixtures';

const mutate = vi.fn();
const frontendSkill = {
  id: '29f35936-dbdc-4c7e-ad79-52aacb8a5911',
  name: 'Frontend',
};
const compatibleTask = {
  ...taskCollectionFixture[0],
  assignedDeveloper: {
    id: developerCollectionFixture[0].id,
    name: developerCollectionFixture[0].name,
  },
  skills: [frontendSkill],
};

vi.mock('@features/tasks/mutations/use-update-task-mutation', () => ({
  useUpdateTaskMutation: () => ({
    isPending: false,
    mutate,
    variables: undefined,
  }),
}));

beforeAll(() => {
  class ResizeObserverMock {
    disconnect() {}

    observe() {}

    unobserve() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverMock,
    writable: true,
  });

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
    writable: true,
  });
});

describe('TaskListPage', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('renders the task table with the expected task attributes', () => {
    render(<TaskListPage developers={developerCollectionFixture} tasks={[compatibleTask]} />);

    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Task Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Assignee' })).toBeInTheDocument();
    expect(screen.getByText('Build tasks page')).toBeInTheDocument();
    expect(screen.getByText('Implement the read path')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('shows a fallback when a task has no required skills', () => {
    render(
      <TaskListPage
        developers={developerCollectionFixture}
        tasks={[
          {
            ...compatibleTask,
            skills: [],
          },
        ]}
      />,
    );

    expect(screen.getByText('No skills specified')).toBeInTheDocument();
  });

  it('sends an inline status update when the status dropdown changes', () => {
    render(<TaskListPage developers={developerCollectionFixture} tasks={[compatibleTask]} />);

    const statusComboboxes = screen.getAllByRole('combobox', { name: 'Task status' });

    fireEvent.mouseDown(statusComboboxes[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Done' }));

    expect(mutate).toHaveBeenCalledWith({
      id: compatibleTask.id,
      input: { status: 'DONE' },
    });
  });

  it('limits assignee options to compatible developers and supports unassigning', () => {
    render(
      <TaskListPage
        developers={[
          developerCollectionFixture[0],
          {
            ...developerCollectionFixture[0],
            id: 'developer-2',
            name: 'Bob',
            skills: [
              {
                id: 'backend-skill',
                name: 'Backend',
              },
            ],
            tasks: [],
          },
        ]}
        tasks={[compatibleTask]}
      />,
    );

    const assigneeComboboxes = screen.getAllByRole('combobox', { name: 'Task assignee' });

    fireEvent.mouseDown(assigneeComboboxes[0]);

    expect(screen.getByRole('option', { name: 'Unassigned' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Bob' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'Unassigned' }));

    expect(mutate).toHaveBeenCalledWith({
      id: compatibleTask.id,
      input: { assignedDeveloperId: null },
    });
  });
});
