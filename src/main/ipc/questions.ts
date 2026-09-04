import { ipcMain } from 'electron';
import {
  bulkCreateQuestions,
  createQuestion,
  deleteQuestion,
  getAllQuestions,
  updateQuestion
} from '../../db/repositories/questionRepository';
import type { QuestionDraft } from '../../shared/types/question';

export function registerQuestionsIpc(): void {
  ipcMain.handle('questions:list', () => getAllQuestions());

  ipcMain.handle('questions:create', (_event, draft: QuestionDraft) => createQuestion(draft));

  ipcMain.handle('questions:update', (_event, id: string, draft: QuestionDraft) =>
    updateQuestion(id, draft)
  );

  ipcMain.handle('questions:delete', (_event, id: string) => {
    deleteQuestion(id);
  });

  ipcMain.handle('questions:bulkCreate', (_event, drafts: QuestionDraft[]) =>
    bulkCreateQuestions(drafts)
  );
}
