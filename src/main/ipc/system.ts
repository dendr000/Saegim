import { ipcMain } from 'electron';
import { DATA_DIR } from '../paths';

export function registerSystemIpc(): void {
  ipcMain.handle('system:get-data-dir', () => DATA_DIR);
}
