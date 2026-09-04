import type { SchoolClass, SchoolClassDraft } from './schoolClass';

export type ClassesApi = {
  list: () => Promise<SchoolClass[]>;
  create: (draft: SchoolClassDraft) => Promise<SchoolClass>;
  update: (id: string, draft: SchoolClassDraft) => Promise<SchoolClass>;
  remove: (id: string) => Promise<void>;
};
