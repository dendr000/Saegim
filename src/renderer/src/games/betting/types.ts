import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type BettingTeam = { id: string; label: string };

export type BettingConfig = {
  teams: BettingTeam[];
  totalRounds: number;
  startingScore: number;
  questions: Question[];
  classId: string;
  className: string;
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
  // 세션 기록·오답 통계용으로 이번 게임에서 나온 모든 판정을 쌓아둔다.
  answerHistory: SessionAnswerRecord[];
};
