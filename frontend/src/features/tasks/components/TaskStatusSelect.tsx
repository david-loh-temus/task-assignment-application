import { Select } from 'antd';

import type { TaskStatus } from '@features/tasks/types/task';

const statusOptions = [
  {
    label: 'To-do',
    value: 'TODO',
  },
  {
    label: 'In progress',
    value: 'IN_PROGRESS',
  },
  {
    label: 'Done',
    value: 'DONE',
  },
] as const satisfies Array<{ label: string; value: TaskStatus }>;

type TaskStatusSelectProps = {
  disabled?: boolean;
  onChange?: (status: TaskStatus) => void;
  value?: TaskStatus;
};

export const TaskStatusSelect = ({ disabled = false, onChange, value = 'TODO' }: TaskStatusSelectProps) => {
  return (
    <Select
      aria-label="Task status"
      className="w-full min-w-32"
      disabled={disabled}
      onChange={onChange}
      options={statusOptions}
      popupMatchSelectWidth={false}
      value={value}
    />
  );
};
