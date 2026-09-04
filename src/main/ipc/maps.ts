import { ipcMain } from 'electron';
import { getMapContent, listMapFiles } from '../../db/repositories/mapRepository';

export function registerMapsIpc(): void {
  ipcMain.handle('maps:list', () => listMapFiles());
  ipcMain.handle('maps:get', (_event, fileName: string) => getMapContent(fileName));
}
