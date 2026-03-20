import { useCallback } from 'react';
import { Modal } from 'antd';

import { TaskForm } from '@features/tasks/components/TaskForm';
import { useCreateTaskMutation } from '@features/tasks/mutations/use-create-task-mutation';
import type { Developer } from '@features/developers/types/developer';
import type { Skill } from '@features/skills/types/skill';
import type { CreateTaskInput, Task } from '@features/tasks/types/task';
import type { TaskFormOutput } from '@features/tasks/components/task-form.schema';

type SubtaskCreateModalProps = {
  developers: Developer[];
  skills: Skill[];
  parentTask: Task | null;
  isOpen: boolean;
  onClose: () => void;
};

const toCreateTaskInput = (values: TaskFormOutput, parentTaskId?: string | null): CreateTaskInput => ({
  title: values.title,
  description: values.description,
  assignedDeveloperId: values.assignedDeveloperId,
  skillIds: values.skillIds,
  status: values.status,
  parentTaskId: parentTaskId ?? null,
});

const MODAL_WIDTH = {
  xs: '90%',
  sm: '80%',
  md: '70%',
  lg: '60%',
  xl: '50%',
  xxl: '40%',
};

export const SubtaskCreateModal = ({ developers, skills, parentTask, isOpen, onClose }: SubtaskCreateModalProps) => {
  const createTaskMutation = useCreateTaskMutation();

  const handleSubmit = useCallback(
    async (values: TaskFormOutput) => {
      if (!parentTask) {
        return;
      }

      await createTaskMutation.mutateAsync(toCreateTaskInput(values, parentTask.id));
      onClose();
    },
    [createTaskMutation, onClose, parentTask],
  );

  return (
    <Modal
      destroyOnHidden
      centered
      footer={null}
      onCancel={onClose}
      open={isOpen}
      title={parentTask ? `Add subtask to Task #${parentTask.displayId}` : 'Add subtask'}
      width={MODAL_WIDTH}
    >
      <TaskForm
        developers={developers}
        isSubmitting={createTaskMutation.isPending}
        onCancel={onClose}
        onSubmit={handleSubmit}
        skills={skills}
      />
    </Modal>
  );
};
