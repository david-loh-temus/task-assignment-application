import { useCallback } from 'react';
import { Typography } from 'antd';
import { useNavigate } from '@tanstack/react-router';

import { useCreateTaskMutation } from '@features/tasks/mutations/use-create-task-mutation';

import { TaskForm } from '../components/TaskForm';
import type { Developer } from '@features/developers/types/developer';
import type { Skill } from '@features/skills/types/skill';
import type { CreateTaskInput } from '@features/tasks/types/task';
import type { TaskFormOutput } from '../components/task-form.schema';

type CreateTaskPageProps = {
  developers: Developer[];
  skills: Skill[];
};

const toCreateTaskInput = (values: TaskFormOutput): CreateTaskInput => ({
  title: values.title,
  description: values.description,
  assignedDeveloperId: values.assignedDeveloperId,
  skillIds: values.skillIds,
  status: values.status,
});

export const CreateTaskPage = ({ developers, skills }: CreateTaskPageProps) => {
  const createTaskMutation = useCreateTaskMutation();
  const navigate = useNavigate();

  const handleFinish = useCallback(
    async (values: TaskFormOutput) => {
      await createTaskMutation.mutateAsync(toCreateTaskInput(values));
      await navigate({ to: '/' });
    },
    [createTaskMutation, navigate],
  );

  const handleCancel = useCallback(async () => {
    await navigate({ to: '/' });
  }, [navigate]);

  return (
    <div className="mx-auto flex h-full w-full max-w-[1120px] flex-col gap-6">
      <header className="flex flex-col">
        <Typography.Title level={1}>Create Task</Typography.Title>
        <Typography.Text>Add a new task and specify the skills required to complete it.</Typography.Text>
      </header>

      <section className="flex flex-1 flex-col border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <TaskForm
          developers={developers}
          isSubmitting={createTaskMutation.isPending}
          onCancel={handleCancel}
          onSubmit={handleFinish}
          skills={skills}
        />
      </section>
    </div>
  );
};
