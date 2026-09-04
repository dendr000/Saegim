export type SessionAnswerRecord = {
  questionId: string;
  participantId: string;
  correct: boolean;
};

export type GameMode = 'timeAttack' | 'territory' | 'betting' | 'initialLetter' | 'hintDeduction';

export type SessionFinalScore = {
  participantId: string;
  label: string;
  score: number;
};

export type GameSessionDraft = {
  classId: string;
  className: string;
  gameMode: GameMode;
  playedAt: number;
  finalScores: SessionFinalScore[];
  answers: SessionAnswerRecord[];
};

export type GameSession = GameSessionDraft & { id: string };
