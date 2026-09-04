import type { Question } from '../../../../shared/types/question';

export type BettingTeam = { id: string; label: string };

export type BettingConfig = {
  teams: BettingTeam[];
  totalRounds: number;
  startingScore: number;
  questions: Question[];
};

export type BettingTeamState = {
  id: string;
  label: string;
  score: number;
};

export type RoundResult = {
  teamId: string;
  bet: number;
  correct: boolean;
  delta: number;
};

export type BettingPhase = 'betting' | 'judging';

export type BettingState = {
  config: BettingConfig;
  teams: BettingTeamState[];
  shuffledQuestions: Question[];
  roundIndex: number; // 0-based
  phase: BettingPhase;
  bets: Record<string, number>;
  currentQuestion: Question | null;
  answers: Record<string, unknown>;
  lastRoundResults: RoundResult[] | null;
  status: 'inProgress' | 'finished';
};
