import { ipcMain } from 'electron';
import { createClass, deleteClass, getAllClasses, updateClass } from '../../db/repositories/classRepository';
import type { SchoolClassDraft } from '../../shared/types/schoolClass';

export function registerClassesIpc(): void {
  ipcMain.handle('classes:list', () => getAllClasses());

  ipcMain.handle('classes:create', (_event, draft: SchoolClassDraft) => createClass(draft));

  ipcMain.handle('classes:update', (_event, id: string, draft: SchoolClassDraft) => updateClass(id, draft));

  ipcMain.handle('classes:delete', (_event, id: string) => {
    deleteClass(id);
  });
}
