import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type MosaicRevealParticipantInput = { id: string; label: string };

export type MosaicRevealConfig = {
  revealSeconds: number;
  participants: MosaicRevealParticipantInput[];
  questions: Question[];
  classId: string;
  className: string;
};

export type ParticipantRuntimeState = {
  id: string;
  label: string;
  score: number;
};

export type MosaicRevealResult = {
  participantId: string;
  correct: boolean;
  answerText: string;
};

export type MosaicRevealState = {
  config: MosaicRevealConfig;
  participants: ParticipantRuntimeState[];
  questionQueue: Question[];
  currentQuestion: Question | null;
  // 문제가 바뀔 때마다 값이 바뀌는 타이머 재시작 키.
  roundKey: number;
  status: 'inProgress' | 'finished';
  lastResult: MosaicRevealResult | null;
  answerHistory: SessionAnswerRecord[];
};
