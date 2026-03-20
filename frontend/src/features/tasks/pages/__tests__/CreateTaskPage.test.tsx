// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTaskPage } from '@features/tasks/pages/CreateTaskPage';

const mutateAsync = vi.fn();
const navigate = vi.fn();
const developerCollectionFixture = [
  {
    id: 'b9b00ae8-5a42-4f8e-9fc2-3fef7f8c0b3d',
    name: 'Taylor Chan',
    skills: [
      {
        id: '29f35936-dbdc-4c7e-ad79-52aacb8a5911',
        name: 'Frontend',
      },
    ],
    tasks: [],
    createdAt: '2026-03-17T18:02:08.028Z',
    updatedAt: '2026-03-17T18:02:08.028Z',
  },
  {
    id: 'b82d9f5f-1f8d-4d6f-b3f4-5bb6526f3d1f',
    name: 'Jordan Lee',
    skills: [],
    tasks: [],
    createdAt: '2026-03-17T18:02:08.028Z',
    updatedAt: '2026-03-17T18:02:08.028Z',
  },
];
const skillCollectionFixture = [
  {
    id: 'b345ca84-f9bf-4093-b33e-43556d502458',
    name: 'Backend',
    source: 'HUMAN' as const,
    createdAt: '2026-03-17T18:02:08.028Z',
    updatedAt: '2026-03-17T18:02:08.028Z',
  },
  {
    id: '29f35936-dbdc-4c7e-ad79-52aacb8a5911',
    name: 'Frontend',
    source: 'HUMAN' as const,
    createdAt: '2026-03-17T18:02:08.013Z',
    updatedAt: '2026-03-17T18:02:08.013Z',
  },
];

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

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

afterEach(() => {
  cleanup();
});

describe('CreateTaskPage', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    navigate.mockReset();
    mutateAsync.mockResolvedValue(undefined);
    navigate.mockResolvedValue(undefined);
  });

  it('renders the create task form', () => {
    render(<CreateTaskPage developers={developerCollectionFixture} skills={skillCollectionFixture} />);

    expect(screen.getByRole('heading', { name: 'Create Task' })).toBeInTheDocument();
    expect(screen.getByLabelText('Task title')).toBeInTheDocument();
    expect(screen.getByLabelText('Task description')).toBeInTheDocument();
    expect(screen.getByText('Required skills')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('submits the title, description, and selected skill ids', async () => {
    const user = userEvent.setup();

    render(<CreateTaskPage developers={developerCollectionFixture} skills={skillCollectionFixture} />);

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Create onboarding flow' },
    });
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'Build a simple signup experience' },
    });

    await user.click(screen.getByLabelText('Required skills'));
    await user.click(await screen.findByText('Frontend'));
    await user.click(screen.getByLabelText('Task assignee'));
    await user.click(await screen.findByText('Taylor Chan'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        title: 'Create onboarding flow',
        description: 'Build a simple signup experience',
        assignedDeveloperId: 'b9b00ae8-5a42-4f8e-9fc2-3fef7f8c0b3d',
        skillIds: ['29f35936-dbdc-4c7e-ad79-52aacb8a5911'],
        status: 'TODO',
      });
    });
    expect(navigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('normalizes blank optional fields before submit', async () => {
    const user = userEvent.setup();

    render(<CreateTaskPage developers={developerCollectionFixture} skills={skillCollectionFixture} />);

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Document release checklist' },
    });
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: '   ' },
    });
    await user.click(screen.getByLabelText('Task assignee'));
    await user.click(await screen.findByText('Jordan Lee'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        title: 'Document release checklist',
        description: null,
        assignedDeveloperId: 'b82d9f5f-1f8d-4d6f-b3f4-5bb6526f3d1f',
        skillIds: undefined,
        status: 'TODO',
      });
    });
  });

  it('allows submitting without skills or assignee', async () => {
    const user = userEvent.setup();

    render(<CreateTaskPage developers={developerCollectionFixture} skills={skillCollectionFixture} />);

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Draft onboarding guide' },
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        title: 'Draft onboarding guide',
        description: null,
        assignedDeveloperId: null,
        skillIds: undefined,
        status: 'TODO',
      });
    });
  });

  it('blocks submission when the assigned developer lacks required skills', async () => {
    const user = userEvent.setup();

    render(<CreateTaskPage developers={developerCollectionFixture} skills={skillCollectionFixture} />);

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Prepare API release' },
    });

    await user.click(screen.getByLabelText('Task assignee'));
    await user.click(await screen.findByText('Taylor Chan'));

    await user.click(screen.getByLabelText('Required skills'));
    await user.click(await screen.findByText('Backend'));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('Selected developer does not have all required skills.')).toBeInTheDocument();
    });

    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
