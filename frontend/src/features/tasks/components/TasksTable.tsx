import { Table, Typography } from 'antd';
import { useMemo } from 'react';

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
 * Tasks with no required skills can be assigned to anyone.
 */

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
        render: (displayId: Task['displayId']) => (
          <Typography.Text className="text-sm font-semibold text-slate-900">{displayId}</Typography.Text>
        ),
        title: 'ID',
        width: 88,
      },
      {
        dataIndex: 'title',
        key: 'title',
        render: (_title: Task['title'], task: Task) => (
          <div className="flex min-w-60 flex-col gap-2 whitespace-normal">
            <Typography.Text className="m-0 whitespace-normal text-sm font-semibold leading-6 text-slate-900">
              {task.title}
            </Typography.Text>
            {task.description ? (
              <Typography.Text className="m-0 whitespace-normal text-sm leading-6 text-slate-500">
                {task.description}
              </Typography.Text>
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
        render: (status: Task['status'], task: Task) => (
          <TaskStatusSelect
            disabled={isUpdatingTask && pendingTaskId === task.id}
            onChange={(nextStatus) => onStatusChange(task, nextStatus)}
            value={status}
          />
        ),
        title: 'Status',
        width: 160,
      },
      {
        dataIndex: 'assignedDeveloper',
        key: 'assignedDeveloper',
        render: (assignedDeveloper: Task['assignedDeveloper'], task: Task) => {
          const compatibleDevelopers = getCompatibleDevelopers(task, developers);
          const compatibleDeveloperIds = new Set(compatibleDevelopers.map((d) => d.id));
          const options = developers.map((developer) => ({
            label: developer.name,
            value: developer.id,
            disabled: !compatibleDeveloperIds.has(developer.id),
          }));

          return (
            <TaskAssigneeSelect
              disabled={isUpdatingTask && pendingTaskId === task.id}
              onChange={(nextAssigneeId) => {
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
              }}
              options={options}
              value={assignedDeveloper?.id ?? null}
            />
          );
        },
        title: 'Assignee',
        width: 200,
      },
    ],
    [developers, isUpdatingTask, onAssigneeChange, onStatusChange, pendingTaskId],
  );

  return <Table<Task> columns={columns} dataSource={tasks} pagination={false} rowKey="id" scroll={{ x: 980 }} />;
};
