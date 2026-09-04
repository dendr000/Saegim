import { contextBridge, ipcRenderer } from 'electron';
import type { SystemApi } from '../shared/types/system';
import type { QuestionDraft } from '../shared/types/question';
import type { QuestionsApi } from '../shared/types/questionsApi';
import type { SchoolClassDraft } from '../shared/types/schoolClass';
import type { ClassesApi } from '../shared/types/classesApi';
import type { MapsApi } from '../shared/types/mapsApi';

const systemApi: SystemApi = {
  getDataDir: () => ipcRenderer.invoke('system:get-data-dir')
};

const questionsApi: QuestionsApi = {
  list: () => ipcRenderer.invoke('questions:list'),
  create: (draft: QuestionDraft) => ipcRenderer.invoke('questions:create', draft),
  update: (id: string, draft: QuestionDraft) => ipcRenderer.invoke('questions:update', id, draft),
  remove: (id: string) => ipcRenderer.invoke('questions:delete', id),
  bulkCreate: (drafts: QuestionDraft[]) => ipcRenderer.invoke('questions:bulkCreate', drafts)
};

const classesApi: ClassesApi = {
  list: () => ipcRenderer.invoke('classes:list'),
  create: (draft: SchoolClassDraft) => ipcRenderer.invoke('classes:create', draft),
  update: (id: string, draft: SchoolClassDraft) => ipcRenderer.invoke('classes:update', id, draft),
  remove: (id: string) => ipcRenderer.invoke('classes:delete', id)
};

const mapsApi: MapsApi = {
  list: () => ipcRenderer.invoke('maps:list'),
  get: (fileName: string) => ipcRenderer.invoke('maps:get', fileName)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('system', systemApi);
    contextBridge.exposeInMainWorld('questions', questionsApi);
    contextBridge.exposeInMainWorld('classes', classesApi);
    contextBridge.exposeInMainWorld('maps', mapsApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error contextIsolation이 꺼진 경우의 폴백
  window.system = systemApi;
  // @ts-expect-error contextIsolation이 꺼진 경우의 폴백
  window.questions = questionsApi;
  // @ts-expect-error contextIsolation이 꺼진 경우의 폴백
  window.classes = classesApi;
  // @ts-expect-error contextIsolation이 꺼진 경우의 폴백
  window.maps = mapsApi;
}
