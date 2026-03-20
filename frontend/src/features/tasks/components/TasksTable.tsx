import { Table, Typography } from 'antd';
import { useCallback, useMemo } from 'react';

import { TaskAssigneeSelect } from '@features/tasks/components/TaskAssigneeSelect';
import { TaskSkillsCell } from '@features/tasks/components/TaskSkillsCell';
import { TaskStatusSelect } from '@features/tasks/components/TaskStatusSelect';
import type { Developer } from '@features/developers/types/developer';
import type { Task, TaskAssignedDeveloper, TaskStatus } from '@features/tasks/types/task';
import type { TableProps } from 'antd';

type TasksTableProps = {
  developers: Developer[];
  isUpdatingTask: boolean;
  onAssigneeChange: (task: Task, assignedDeveloper: TaskAssignedDeveloper | null) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  pendingTaskId?: string;
  tasks: Task[];
};

/**
 * Filters developers who possess ALL skills required by a task.
 * Tasks with no required skills can be assigned to anyone
 * @param task The task for which to find compatible developers.
 * @param developers The list of all developers to filter from.
 * @returns A list of developers compatible with the task's skill requirements.
 */
const getCompatibleDevelopers = (task: Task, developers: Developer[]) => {
  // Tasks with no skill requirements can be assigned to anyone
  if (task.skills.length === 0) {
    return developers;
  }

  const requiredSkillIds = new Set(task.skills.map((skill) => skill.id));

  // Filter to developers who have every required skill
  return developers.filter((developer) => {
    const developerSkillIds = new Set(developer.skills.map((skill) => skill.id));

    return [...requiredSkillIds].every((skillId) => developerSkillIds.has(skillId));
  });
};

type TaskStatusCellProps = {
  isUpdatingTask: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  pendingTaskId?: string;
  task: Task;
};

const TaskStatusCell = ({ isUpdatingTask, onStatusChange, pendingTaskId, task }: TaskStatusCellProps) => {
  const handleChange = useCallback(
    (nextStatus: TaskStatus) => {
      onStatusChange(task, nextStatus);
    },
    [onStatusChange, task],
  );

  return (
    <TaskStatusSelect
      disabled={isUpdatingTask && pendingTaskId === task.id}
      onChange={handleChange}
      value={task.status}
    />
  );
};

type TaskAssigneeCellProps = {
  developers: Developer[];
  isUpdatingTask: boolean;
  onAssigneeChange: (task: Task, assignedDeveloper: TaskAssignedDeveloper | null) => void;
  pendingTaskId?: string;
  task: Task;
};

const TaskAssigneeCell = ({
  developers,
  isUpdatingTask,
  onAssigneeChange,
  pendingTaskId,
  task,
}: TaskAssigneeCellProps) => {
  const options = useMemo(() => {
    const compatibleDevelopers = getCompatibleDevelopers(task, developers);
    const compatibleDeveloperIds = new Set(compatibleDevelopers.map((developer) => developer.id));

    return developers.map((developer) => ({
      label: developer.name,
      value: developer.id,
      disabled: !compatibleDeveloperIds.has(developer.id),
    }));
  }, [developers, task]);

  const handleChange = useCallback(
    (nextAssigneeId: string | null) => {
      const nextAssignee = developers.find((developer) => developer.id === nextAssigneeId);

      onAssigneeChange(
        task,
        nextAssignee
          ? {
              id: nextAssignee.id,
              name: nextAssignee.name,
            }
          : null,
      );
    },
    [developers, onAssigneeChange, task],
  );

  return (
    <TaskAssigneeSelect
      disabled={isUpdatingTask && pendingTaskId === task.id}
      onChange={handleChange}
      options={options}
      value={task.assignedDeveloper?.id ?? null}
    />
  );
};

export const TasksTable = ({
  developers,
  isUpdatingTask,
  onAssigneeChange,
  onStatusChange,
  pendingTaskId,
  tasks,
}: TasksTableProps) => {
  const columns = useMemo<NonNullable<TableProps<Task>['columns']>>(
    () => [
      {
        dataIndex: 'displayId',
        key: 'displayId',
        render: (displayId: Task['displayId']) => <Typography.Text strong>{displayId}</Typography.Text>,
        title: 'ID',
        width: 88,
      },
      {
        dataIndex: 'title',
        key: 'title',
        render: (_title: Task['title'], task: Task) => (
          <div>
            <Typography.Text strong>{task.title}</Typography.Text>
            {task.description ? (
              <div>
                <Typography.Text type="secondary">{task.description}</Typography.Text>
              </div>
            ) : null}
          </div>
        ),
        title: 'Task Title',
      },
      {
        dataIndex: 'skills',
        key: 'skills',
        render: (skills: Task['skills']) => <TaskSkillsCell skills={skills} />,
        title: 'Skills',
        width: 220,
      },
      {
        dataIndex: 'status',
        key: 'status',
        render: (_status: Task['status'], task: Task) => (
          <TaskStatusCell
            isUpdatingTask={isUpdatingTask}
            onStatusChange={onStatusChange}
            pendingTaskId={pendingTaskId}
            task={task}
          />
        ),
        title: 'Status',
        width: 160,
      },
      {
        dataIndex: 'assignedDeveloper',
        key: 'assignedDeveloper',
        render: (_assignedDeveloper: Task['assignedDeveloper'], task: Task) => (
          <TaskAssigneeCell
            developers={developers}
            isUpdatingTask={isUpdatingTask}
            onAssigneeChange={onAssigneeChange}
            pendingTaskId={pendingTaskId}
            task={task}
          />
        ),
        title: 'Assignee',
        width: 200,
      },
    ],
    [developers, isUpdatingTask, onAssigneeChange, onStatusChange, pendingTaskId],
  );

  const expandable = useMemo<TableProps<Task>['expandable']>(
    () => ({
      expandedRowRender: (task: Task) =>
        task.subtasks && task.subtasks.length > 0 ? (
          <TasksTable
            developers={developers}
            isUpdatingTask={isUpdatingTask}
            onAssigneeChange={onAssigneeChange}
            onStatusChange={onStatusChange}
            pendingTaskId={pendingTaskId}
            tasks={task.subtasks}
          />
        ) : null,
      rowExpandable: (task: Task) => (task.subtasks ? task.subtasks.length > 0 : false),
    }),
    [developers, isUpdatingTask, onAssigneeChange, onStatusChange, pendingTaskId],
  );

  return <Table<Task> columns={columns} dataSource={tasks} expandable={expandable} pagination={false} rowKey="id" />;
};
