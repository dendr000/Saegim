import { ipcMain } from 'electron';
import { getAllSessions, saveSession } from '../../db/repositories/sessionRepository';
import type { GameSessionDraft } from '../../shared/types/session';

export function registerSessionsIpc(): void {
  ipcMain.handle('sessions:save', (_event, draft: GameSessionDraft) => saveSession(draft));
  ipcMain.handle('sessions:list', () => getAllSessions());
}
