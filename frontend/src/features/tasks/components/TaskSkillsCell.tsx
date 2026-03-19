import { Tag } from 'antd';

import type { TaskSkill } from '@features/tasks/types/task';

type TaskSkillsCellProps = {
  skills: TaskSkill[];
};

export const TaskSkillsCell = ({ skills }: TaskSkillsCellProps) => {
  if (skills.length === 0) {
    return <span className="text-sm text-slate-500">No skills specified</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <Tag className="m-0 rounded-full px-2.5 py-1 text-sm font-medium" color="blue" key={skill.id}>
          {skill.name}
        </Tag>
      ))}
    </div>
  );
};
