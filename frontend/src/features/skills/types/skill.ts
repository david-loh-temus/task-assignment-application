export type SkillSource = 'LLM' | 'HUMAN';

export type Skill = {
  id: string;
  name: string;
  source: SkillSource;
  createdAt: string;
  updatedAt: string;
};
