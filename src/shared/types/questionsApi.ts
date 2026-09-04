import type { Question, QuestionDraft } from './question';

export type BulkCreateError = { index: number; error: string };

export type BulkCreateResult = {
  created: Question[];
  errors: BulkCreateError[];
};

export type QuestionsApi = {
  list: () => Promise<Question[]>;
  create: (draft: QuestionDraft) => Promise<Question>;
  update: (id: string, draft: QuestionDraft) => Promise<Question>;
  remove: (id: string) => Promise<void>;
  bulkCreate: (drafts: QuestionDraft[]) => Promise<BulkCreateResult>;
};
