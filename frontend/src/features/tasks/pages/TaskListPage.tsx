import { useCallback, useState } from 'react';
import { Typography } from 'antd';

import { TasksTable } from '@features/tasks/components/TasksTable';
import { SubtaskCreateModal } from '@features/tasks/components/SubtaskCreateModal';
import { useUpdateTaskMutation } from '@features/tasks/mutations/use-update-task-mutation';
import type { Developer } from '@features/developers/types/developer';
import type { Skill } from '@features/skills/types/skill';
import type { Task, TaskAssignedDeveloper, TaskStatus } from '@features/tasks/types/task';

type TaskListPageProps = {
  developers: Developer[];
  skills: Skill[];
  tasks: Task[];
};

export const TaskListPage = ({ developers, skills, tasks }: TaskListPageProps) => {
  const updateTaskMutation = useUpdateTaskMutation();
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [parentTask, setParentTask] = useState<Task | null>(null);

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

  const handleAddSubtask = useCallback((task: Task) => {
    setParentTask(task);
    setIsSubtaskModalOpen(true);
  }, []);

  const handleSubtaskCancel = useCallback(() => {
    setIsSubtaskModalOpen(false);
    setParentTask(null);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 h-full">
      <header className="flex flex-col flex-none">
        <Typography.Title level={1}>Tasks</Typography.Title>
        <Typography.Text>Review task requirements, update progress, and assign compatible developers.</Typography.Text>
      </header>

      <section aria-label="tasks table" className="flex-1 overflow-auto border border-slate-200 bg-white shadow-sm">
        <TasksTable
          developers={developers}
          isUpdatingTask={updateTaskMutation.isPending}
          onAddSubtask={handleAddSubtask}
          onAssigneeChange={handleAssigneeChange}
          onStatusChange={handleStatusChange}
          pendingTaskId={updateTaskMutation.variables?.id}
          tasks={tasks}
        />
      </section>

      <SubtaskCreateModal
        developers={developers}
        isOpen={isSubtaskModalOpen}
        onClose={handleSubtaskCancel}
        parentTask={parentTask}
        skills={skills}
      />
    </div>
  );
};
