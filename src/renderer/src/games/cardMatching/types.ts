import type { Difficulty, Question } from '../../../../shared/types/question';
import type { SessionAnswerRecord } from '../_shared/types';

export type CardMatchingParticipantInput = { id: string; label: string };

export type CardMatchingConfig = {
  // 이미 이번 판에 쓸 만큼만(카드 쌍 개수) 골라진 문제 목록 — Setup에서 표본을 뽑아 넘긴다.
  participants: CardMatchingParticipantInput[];
  questions: Question[];
  classId: string;
  className: string;
};

export type CardKind = 'term' | 'definition';

export type CardInstance = {
  id: string;
  questionId: string;
  kind: CardKind;
  text: string;
  difficulty: Difficulty;
};

export type ParticipantRuntimeState = {
  id: string;
  label: string;
  score: number;
  combo: number;
};

export type CardMatchingResult = {
  participantId: string;
  correct: boolean;
  answerText: string;
};

export type CardMatchingState = {
  config: CardMatchingConfig;
  participants: ParticipantRuntimeState[];
  // 셔플된 전체 카드(문제 하나당 용어 카드 1장 + 정의 카드 1장).
  cards: CardInstance[];
  matchedQuestionIds: Set<string>;
  // 현재 뒤집혀 있는 카드 id(0~2개).
  flippedCardIds: string[];
  // 짝이 안 맞아 두 카드를 잠깐 보여주고 있는 중 — 이 동안 새로 뒤집기를 막는다.
  pendingMismatch: boolean;
  // 원형으로 순환하는 턴 순서 — 짝을 맞히면 같은 참가자가 턴을 유지하고,
  // 못 맞히면 다음 참가자에게 넘어간다.
  turnOrder: string[];
  turnIndex: number;
  activeParticipantId: string;
  status: 'inProgress' | 'finished';
  lastResult: CardMatchingResult | null;
  answerHistory: SessionAnswerRecord[];
};
