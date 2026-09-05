import { ipcMain } from 'electron';
import { getImageDataUrl, listImageFiles, saveImage } from '../../db/repositories/imageRepository';

export function registerImagesIpc(): void {
  ipcMain.handle('images:list', () => listImageFiles());
  ipcMain.handle('images:get', (_event, fileName: string) => getImageDataUrl(fileName));
  ipcMain.handle('images:upload', (_event, originalFileName: string, dataUrl: string) =>
    saveImage(originalFileName, dataUrl)
  );
}
