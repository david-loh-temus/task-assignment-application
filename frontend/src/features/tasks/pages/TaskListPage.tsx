import { useCallback } from 'react';

import { TasksTable } from '@features/tasks/components/TasksTable';
import { useUpdateTaskMutation } from '@features/tasks/mutations/use-update-task-mutation';
import type { Developer } from '@features/developers/types/developer';
import type { Task, TaskAssignedDeveloper, TaskStatus } from '@features/tasks/types/task';

type TaskListPageProps = {
  developers: Developer[];
  tasks: Task[];
};

export const TaskListPage = ({ developers, tasks }: TaskListPageProps) => {
  const updateTaskMutation = useUpdateTaskMutation();

  const handleStatusChange = useCallback(
    (task: Task, status: TaskStatus) => {
      updateTaskMutation.mutate({
        id: task.id,
        input: { status },
      });
    },
    [updateTaskMutation],
  );

  const handleAssigneeChange = useCallback(
    (task: Task, assignedDeveloper: TaskAssignedDeveloper | null) => {
      updateTaskMutation.mutate({
        id: task.id,
        input: {
          assignedDeveloperId: assignedDeveloper?.id ?? null,
        },
      });
    },
    [updateTaskMutation],
  );

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 h-full">
      <header className="flex flex-col gap-2 flex-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-semibold leading-tight text-slate-900 md:text-[32px]">Tasks</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-500 md:text-[15px]">
            Review task requirements, update progress, and assign compatible developers.
          </p>
        </div>
      </header>

      <section aria-label="tasks table" className="flex-1 overflow-auto border border-slate-200 bg-white shadow-sm">
        <TasksTable
          developers={developers}
          isUpdatingTask={updateTaskMutation.isPending}
          onAssigneeChange={handleAssigneeChange}
          onStatusChange={handleStatusChange}
          pendingTaskId={updateTaskMutation.variables?.id}
          tasks={tasks}
        />
      </section>
    </main>
  );
};
