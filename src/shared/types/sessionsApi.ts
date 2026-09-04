import type { GameSession, GameSessionDraft } from './session';

export type SessionsApi = {
  save: (draft: GameSessionDraft) => Promise<GameSession>;
  list: () => Promise<GameSession[]>;
};
