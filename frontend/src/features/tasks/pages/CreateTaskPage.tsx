import { useCallback } from 'react';
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
    <main className="mx-auto flex h-full w-full max-w-[1120px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-semibold leading-tight text-slate-900">Create Task</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-500 md:text-[15px]">
            Add a new task and specify the skills required to complete it.
          </p>
        </div>
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
    </main>
  );
};
