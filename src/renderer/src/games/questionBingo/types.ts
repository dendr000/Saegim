import type { Difficulty, Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type BingoGridSize = 5 | 7 | 9;

export type BingoTeam = { id: string; label: string };

export type BingoCell = {
  id: string;
  row: number;
  col: number;
  difficulty: Difficulty;
};

export type QuestionBingoConfig = {
  gridSize: BingoGridSize;
  teams: BingoTeam[];
  questions: Question[];
  classId: string;
  className: string;
};

export type QuestionBingoResult = {
  cellId: string;
  teamId: string;
  correct: boolean;
  answerText: string;
};

export type QuestionBingoState = {
  config: QuestionBingoConfig;
  cells: BingoCell[];
  // cellId -> 점령한 팀 id (null이면 미점령)
  cellOwners: Record<string, string | null>;
  // teamId -> 이미 보너스를 받은 줄 id 목록
  completedLines: Record<string, string[]>;
  currentTeamIndex: number;
  pendingCellId: string | null;
  currentQuestion: Question | null;
  // 이 난이도로 태깅된 문제가 하나도 없어서 방금 선택이 막힌 칸
  blockedCellId: string | null;
  status: 'inProgress' | 'finished';
  lastResult: QuestionBingoResult | null;
  answerHistory: SessionAnswerRecord[];
};
