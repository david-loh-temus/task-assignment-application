import { Select } from 'antd';

const UNASSIGNED_OPTION_VALUE = '__UNASSIGNED__';

type AssigneeOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type TaskAssigneeSelectProps = {
  disabled?: boolean;
  onChange: (assigneeId: string | null) => void;
  options: AssigneeOption[];
  value: string | null;
};

export const TaskAssigneeSelect = ({ disabled = false, onChange, options, value }: TaskAssigneeSelectProps) => {
  return (
    <Select
      aria-label="Task assignee"
      className="w-full min-w-32"
      disabled={disabled}
      onChange={(nextValue) => onChange(nextValue === UNASSIGNED_OPTION_VALUE ? null : nextValue)}
      options={[
        {
          label: 'Unassigned',
          value: UNASSIGNED_OPTION_VALUE,
        },
        ...options,
      ]}
      popupMatchSelectWidth={false}
      value={value ?? UNASSIGNED_OPTION_VALUE}
    />
  );
};
