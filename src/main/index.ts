import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { initializePortablePaths } from './paths';
import { registerSystemIpc } from './ipc/system';
import { registerQuestionsIpc } from './ipc/questions';
import { registerClassesIpc } from './ipc/classes';
import { registerMapsIpc } from './ipc/maps';
import { registerImagesIpc } from './ipc/images';
import { registerSessionsIpc } from './ipc/sessions';

// userData 경로 재지정은 whenReady 이전에 끝나야 한다.
initializePortablePaths();

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.saegim.quiz');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerSystemIpc();
  registerQuestionsIpc();
  registerClassesIpc();
  registerMapsIpc();
  registerImagesIpc();
  registerSessionsIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
