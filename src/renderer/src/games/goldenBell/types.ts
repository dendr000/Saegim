import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type GoldenBellParticipantInput = { id: string; label: string };

export type GoldenBellConfig = {
  participants: GoldenBellParticipantInput[];
  // Setup에서 교사가 미리 부활권을 준 참가자 id 목록 — 전원에게 자동으로 주지
  // 않고, 교사가 상황에 따라 고른 사람에게만 시작 시점에 준다.
  initialRevivalParticipantIds: string[];
  questions: Question[];
  classId: string;
  className: string;
};

export type ParticipantStatus = 'alive' | 'eliminated';

export type ParticipantRuntimeState = {
  id: string;
  label: string;
  status: ParticipantStatus;
  hasRevival: boolean;
  score: number;
};

export type GoldenBellResult = {
  participantId: string;
  correct: boolean;
  answerText: string;
  eliminated: boolean;
  revivalUsed: boolean;
};

export type GoldenBellState = {
  config: GoldenBellConfig;
  participants: ParticipantRuntimeState[];
  questionQueue: Question[];
  currentQuestion: Question | null;
  // 이번 라운드 시작 시점의 생존자 id 목록(고정) — 이 집합이 전부 판정되면
  // 다음 라운드로 자동 전환한다.
  roundParticipantIds: string[];
  judgedThisRound: Set<string>;
  status: 'inProgress' | 'finished';
  lastResult: GoldenBellResult | null;
  answerHistory: SessionAnswerRecord[];
};
