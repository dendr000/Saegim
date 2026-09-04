import type { SystemApi } from '../shared/types/system';
import type { QuestionsApi } from '../shared/types/questionsApi';
import type { ClassesApi } from '../shared/types/classesApi';
import type { MapsApi } from '../shared/types/mapsApi';
import type { SessionsApi } from '../shared/types/sessionsApi';

declare global {
  interface Window {
    system: SystemApi;
    questions: QuestionsApi;
    classes: ClassesApi;
    maps: MapsApi;
    sessions: SessionsApi;
  }
}

export {};
