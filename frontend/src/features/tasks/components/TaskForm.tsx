import { useCallback, useMemo } from 'react';
import { Button, Form, Input, Select } from 'antd';

import { TaskAssigneeSelect } from '@features/tasks/components/TaskAssigneeSelect';
import { TaskStatusSelect } from '@features/tasks/components/TaskStatusSelect';
import { normalizeTaskFormValues } from '@features/tasks/components/task-form.schema';
import type { TaskFormOutput, TaskFormValues } from '@features/tasks/components/task-form.schema';
import type { Developer } from '@features/developers/types/developer';
import type { Skill } from '@features/skills/types/skill';

type TaskFormProps = {
  developers?: Developer[];
  skills: Skill[];
  isSubmitting: boolean;
  onSubmit: (values: TaskFormOutput) => void | Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<TaskFormValues>;
};

const TEXT_AREA_AUTO_SIZE = { minRows: 8, maxRows: 20 };

const TITLE_RULES = [
  { required: true, message: 'Please enter a task title.' },
  { whitespace: true, message: 'Task title cannot be blank.' },
];

const SKILL_MISMATCH_ERROR = [
  {
    name: 'assignedDeveloperId' as const,
    errors: ['Selected developer does not have all required skills.'],
  },
];

const CLEAR_ASSIGNEE_ERROR = [
  {
    name: 'assignedDeveloperId' as const,
    errors: [],
  },
];

// Normalize watched skill ids to a stable array for memo usage.
const useSelectedSkillIds = (form: ReturnType<typeof Form.useForm<TaskFormValues>>[0]) => {
  return Form.useWatch('skillIds', form) ?? [];
};

// Build assignee options with skill compatibility applied when developers are available.
const useAssigneeOptions = (
  developers: Developer[] | undefined,
  developerSkillsMap: Map<string, Set<string>>,
  selectedSkillIds: string[],
) =>
  useMemo(() => {
    if (!developers) {
      return [];
    }

    // Disable developers that do not have all selected skills.
    return developers.map((developer) => {
      const developerSkills = developerSkillsMap.get(developer.id);
      const hasAllSkills =
        selectedSkillIds.length === 0 || selectedSkillIds.every((skillId) => developerSkills?.has(skillId));

      return {
        label: developer.name,
        value: developer.id,
        disabled: !hasAllSkills,
      };
    });
  }, [developerSkillsMap, developers, selectedSkillIds]);

export const TaskForm = ({ developers, skills, isSubmitting, onSubmit, onCancel, initialValues }: TaskFormProps) => {
  const [form] = Form.useForm<TaskFormValues>();
  const selectedSkillIds = useSelectedSkillIds(form);
  const skillOptions = useMemo(
    () =>
      skills.map((skill) => ({
        label: skill.name,
        value: skill.id,
      })),
    [skills],
  );

  const developerSkillsMap = useMemo(() => {
    if (!developers) {
      return new Map<string, Set<string>>();
    }

    return new Map(developers.map((developer) => [developer.id, new Set(developer.skills.map((skill) => skill.id))]));
  }, [developers]);
  const assigneeSelectOptions = useAssigneeOptions(developers, developerSkillsMap, selectedSkillIds);

  const formInitialValues = useMemo(
    () => ({
      skillIds: [],
      assignedDeveloperId: null,
      status: 'TODO' as const,
      ...initialValues,
    }),
    [initialValues],
  );

  const handleFinish = useCallback(
    async (values: TaskFormValues) => {
      if (values.assignedDeveloperId && values.skillIds?.length && developerSkillsMap.size > 0) {
        const developerSkills = developerSkillsMap.get(values.assignedDeveloperId);
        const hasAllSkills = values.skillIds.every((skillId) => developerSkills?.has(skillId));

        if (!hasAllSkills) {
          form.setFields(SKILL_MISMATCH_ERROR);
          return;
        }
      }

      form.setFields(CLEAR_ASSIGNEE_ERROR);
      await onSubmit(normalizeTaskFormValues(values));
    },
    [developerSkillsMap, form, onSubmit],
  );

  return (
    <Form
      className="flex flex-col"
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={formInitialValues}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="col-span-1 flex flex-col md:col-span-2">
          <Form.Item className="mb-0" label="Task title" name="title" rules={TITLE_RULES}>
            <Input aria-label="Task title" placeholder="Enter a short, clear title" />
          </Form.Item>

          <Form.Item className="mb-0" label="Task description" name="description">
            <Input.TextArea
              aria-label="Task description"
              autoSize={TEXT_AREA_AUTO_SIZE}
              placeholder="Describe what needs to be done"
            />
          </Form.Item>
        </div>

        <div className="col-span-1 flex flex-col">
          <Form.Item className="mb-0" label="Required skills" name="skillIds">
            <Select
              aria-label="Required skills"
              mode="multiple"
              options={skillOptions}
              placeholder="Select one or more skills"
              popupMatchSelectWidth={false}
            />
          </Form.Item>

          <Form.Item className="mb-0" label="Assigned developer" name="assignedDeveloperId">
            <TaskAssigneeSelect options={assigneeSelectOptions} />
          </Form.Item>

          <Form.Item className="mb-0" label="Status" name="status">
            <TaskStatusSelect />
          </Form.Item>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1 border-t border-slate-200 pt-6">
        {onCancel ? (
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button htmlType="submit" loading={isSubmitting} type="primary">
          Save
        </Button>
      </div>
    </Form>
  );
};
