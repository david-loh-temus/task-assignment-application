import type { Developer } from '@features/developers/types/developer';

export const developerFixture: Developer = {
  id: '0f1919ca-c313-4880-b225-0039256dc47d',
  name: 'Alice',
  skills: [
    {
      id: '29f35936-dbdc-4c7e-ad79-52aacb8a5911',
      name: 'Frontend',
    },
  ],
  tasks: [
    {
      displayId: 1,
      id: '1c4ae6f7-3010-41d0-b5e0-901891f6bbb5',
      status: 'TODO',
      title:
        'As a visitor, I want to see a responsive homepage so that I can easily navigate on both desktop and mobile devices.',
    },
  ],
  createdAt: '2026-03-17T18:02:08.039Z',
  updatedAt: '2026-03-17T18:02:08.039Z',
};

export const developerCollectionFixture: Developer[] = [developerFixture];
