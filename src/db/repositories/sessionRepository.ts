import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { DATA_DIR } from '../../main/paths';
import type { GameSession, GameSessionDraft } from '../../shared/types/session';
import { readJsonFile, writeJsonFile } from './jsonFile';

const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');

function loadAll(): GameSession[] {
  return readJsonFile<GameSession[]>(SESSIONS_FILE, []);
}

function saveAll(sessions: GameSession[]): void {
  writeJsonFile(SESSIONS_FILE, sessions);
}

export function saveSession(draft: GameSessionDraft): GameSession {
  const session: GameSession = { ...draft, id: randomUUID() };
  const all = loadAll();
  all.push(session);
  saveAll(all);
  return session;
}

export function getAllSessions(): GameSession[] {
  return loadAll();
}
