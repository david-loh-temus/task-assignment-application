// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { developerCollectionFixture } from '@features/developers/__fixtures__/developer-fixtures';
import { SubtaskCreateModal } from '@features/tasks/components/SubtaskCreateModal';

const mutateAsync = vi.fn().mockResolvedValue(undefined);

const noop = () => {};

vi.mock('@features/tasks/mutations/use-create-task-mutation', () => ({
  useCreateTaskMutation: () => ({
    isPending: false,
    mutateAsync,
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

describe('SubtaskCreateModal', () => {
  it('renders and shows parent task display id in title', () => {
    const parentTask = {
      id: 'parent-1',
      displayId: 42,
      title: 'Parent task',
    } as any;

    render(
      <SubtaskCreateModal
        developers={developerCollectionFixture}
        skills={[]}
        parentTask={parentTask}
        isOpen={true}
        onClose={noop}
      />,
    );

    expect(screen.getByText('Add subtask to Task #42')).toBeInTheDocument();
    const titleInputs = screen.getAllByLabelText('Task title');
    expect(titleInputs.length).toBeGreaterThan(0);
  });

  it('submits the form, calls mutateAsync and then onClose', async () => {
    const parentTask = {
      id: 'parent-1',
      displayId: 99,
      title: 'Parent task',
    } as any;

    const onClose = vi.fn();

    render(
      <SubtaskCreateModal
        developers={developerCollectionFixture}
        skills={[]}
        parentTask={parentTask}
        isOpen={true}
        onClose={onClose}
      />,
    );

    // target the modal dialog that contains our title
    const dialogs = screen.getAllByRole('dialog');
    const dialog = dialogs.find((d) => within(d).queryByText('Add subtask to Task #99'));
    expect(dialog).toBeTruthy();

    const titleInput = within(dialog!).getByLabelText('Task title');
    fireEvent.change(titleInput, { target: { value: ' New subtask ' } });

    const saveButton = within(dialog!).getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });
});
