import type { Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type HintDeductionMode = 'hotSeat' | 'simultaneous';

export type HintDeductionParticipantInput = { id: string; label: string };

export type HintDeductionConfig = {
  mode: HintDeductionMode;
  durationSeconds: number;
  participants: HintDeductionParticipantInput[];
  questions: Question[];
  classId: string;
  className: string;
};

export type ParticipantRuntimeState = {
  id: string;
  label: string;
  score: number;
  combo: number;
};

export type HintDeductionResult = {
  participantId: string;
  correct: boolean;
  answerText: string;
};

export type HintDeductionState = {
  config: HintDeductionConfig;
  participants: ParticipantRuntimeState[];
  turnQuestionQueue: Question[];
  currentQuestion: Question;
  // 지금 문제에서 공개한 힌트 횟수. 문제가 바뀌면(정답 제출·스킵·턴 전환) 0으로 리셋된다.
  hintsRevealed: number;
  turnOrder: string[];
  turnIndex: number;
  activeParticipantId: string | null;
  status: 'inProgress' | 'finished';
  lastResult: HintDeductionResult | null;
  answerHistory: SessionAnswerRecord[];
};
