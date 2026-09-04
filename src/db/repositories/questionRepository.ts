import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { DATA_DIR } from '../../main/paths';
import { isQuestionDraft } from '../../shared/types/question';
import type { Question, QuestionDraft } from '../../shared/types/question';
import type { BulkCreateResult } from '../../shared/types/questionsApi';
import { readJsonFile, writeJsonFile } from './jsonFile';

const QUESTIONS_FILE = join(DATA_DIR, 'questions.json');

function loadAll(): Question[] {
  return readJsonFile<Question[]>(QUESTIONS_FILE, []);
}

function saveAll(questions: Question[]): void {
  writeJsonFile(QUESTIONS_FILE, questions);
}

export function getAllQuestions(): Question[] {
  return loadAll();
}

export function createQuestion(draft: QuestionDraft): Question {
  if (!isQuestionDraft(draft)) {
    throw new Error('올바르지 않은 문항 데이터입니다.');
  }
  const question = { ...draft, id: randomUUID() } as Question;
  const all = loadAll();
  all.push(question);
  saveAll(all);
  return question;
}

export function updateQuestion(id: string, draft: QuestionDraft): Question {
  if (!isQuestionDraft(draft)) {
    throw new Error('올바르지 않은 문항 데이터입니다.');
  }
  const all = loadAll();
  const index = all.findIndex((question) => question.id === id);
  if (index === -1) {
    throw new Error(`문항을 찾을 수 없습니다: ${id}`);
  }
  const updated = { ...draft, id } as Question;
  all[index] = updated;
  saveAll(all);
  return updated;
}

export function deleteQuestion(id: string): void {
  const all = loadAll();
  saveAll(all.filter((question) => question.id !== id));
}

export function bulkCreateQuestions(drafts: QuestionDraft[]): BulkCreateResult {
  const all = loadAll();
  const created: Question[] = [];
  const errors: { index: number; error: string }[] = [];

  drafts.forEach((draft, index) => {
    if (!isQuestionDraft(draft)) {
      errors.push({ index, error: '올바르지 않은 문항 데이터입니다.' });
      return;
    }
    const question = { ...draft, id: randomUUID() } as Question;
    all.push(question);
    created.push(question);
  });

  if (created.length > 0) {
    saveAll(all);
  }

  return { created, errors };
}
