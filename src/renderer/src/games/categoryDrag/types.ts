import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type CategorizeParticipantInput = { id: string; label: string };

export type CategorizeConfig = {
  durationSeconds: number;
  participants: CategorizeParticipantInput[];
  questions: Question[];
  classId: string;
  className: string;
};

export type ParticipantRuntimeState = {
  id: string;
  label: string;
  score: number;
};

export type CategorizeRoundResult = {
  participantId: string;
  label: string;
  correctCount: number;
  totalCount: number;
};

export type CategorizeState = {
  config: CategorizeConfig;
  participants: ParticipantRuntimeState[];
  // 원형으로 순환하는 턴 순서 — 정답 여부와 무관하게 라운드마다 다음 참가자로 넘어간다.
  turnOrder: string[];
  turnIndex: number;
  activeParticipantId: string;
  questionQueue: Question[];
  currentQuestion: Question | null;
  // 현재 문제에서 각 항목이 어느 카테고리에 놓였는지 — itemId -> categoryIndex.
  // -1은 "미배치"를 뜻하며 채점 시 항상 오답으로 처리된다.
  currentPlacements: Record<string, number>;
  status: 'inProgress' | 'finished';
  lastRoundResult: CategorizeRoundResult | null;
  answerHistory: SessionAnswerRecord[];
};
