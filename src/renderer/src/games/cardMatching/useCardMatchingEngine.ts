import { useEffect, useReducer } from 'react';
import type { Question } from '../../../../shared/types/question';
import type { Answer } from '../_shared/types';
import { calculateScoreForCorrectAnswer } from '../timeAttack/scoring';
import type { CardInstance, CardMatchingConfig, CardMatchingResult, CardMatchingState } from './types';

type Action =
  | { type: 'FLIP_CARD'; answer: Answer }
  | { type: 'RESOLVE_MISMATCH' }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'ADJUST_SCORE'; participantId: string; newScore: number };

// 짝이 안 맞을 때 두 카드를 보여주는 시간 — 이 사이에 외워둘 기회를 준다.
const MISMATCH_REVEAL_MS = 1500;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 단답형 문제 하나당 용어 카드(정답)와 정의 카드(질문 텍스트) 한 쌍을 만든다.
function cardsFromQuestions(questions: Question[]): CardInstance[] {
  const cards: CardInstance[] = [];
  questions.forEach((question) => {
    if (question.type !== 'shortAnswer') return;
    cards.push({
      id: `${question.id}-term`,
      questionId: question.id,
      kind: 'term',
      text: question.payload.answer,
      difficulty: question.difficulty
    });
    cards.push({
      id: `${question.id}-def`,
      questionId: question.id,
      kind: 'definition',
      text: question.payload.question,
      difficulty: question.difficulty
    });
  });
  return shuffle(cards);
}

function createInitialState(config: CardMatchingConfig): CardMatchingState {
  const cards = cardsFromQuestions(config.questions);
  const turnOrder = config.participants.map((participant) => participant.id);

  return {
    config,
    participants: config.participants.map((participant) => ({
      id: participant.id,
      label: participant.label,
      score: 0,
      combo: 0
    })),
    cards,
    matchedQuestionIds: new Set(),
    flippedCardIds: [],
    pendingMismatch: false,
    turnOrder,
    turnIndex: 0,
    activeParticipantId: turnOrder[0],
    status: 'inProgress',
    lastResult: null,
    answerHistory: []
  };
}

function cardMatchingReducer(state: CardMatchingState, action: Action): CardMatchingState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'FLIP_CARD': {
      // 짝이 안 맞아 두 카드를 보여주는 중이면 새로 못 뒤집는다.
      if (state.pendingMismatch) return state;

      const { cardId } = action.answer.value as { cardId: string };
      const card = state.cards.find((candidate) => candidate.id === cardId);
      if (!card) return state;
      if (state.matchedQuestionIds.has(card.questionId)) return state;
      if (state.flippedCardIds.includes(cardId)) return state;

      const participantId = action.answer.participantId;

      if (state.flippedCardIds.length === 0) {
        return { ...state, flippedCardIds: [cardId] };
      }

      const firstCard = state.cards.find((candidate) => candidate.id === state.flippedCardIds[0])!;
      const flippedCardIds = [...state.flippedCardIds, cardId];

      if (firstCard.questionId === card.questionId) {
        // 짝을 맞혔다 — 같은 참가자가 턴을 유지하고 한 번 더 뒤집을 수 있다.
        const matchedQuestionIds = new Set(state.matchedQuestionIds);
        matchedQuestionIds.add(card.questionId);
        const participants = state.participants.map((participant) => {
          if (participant.id !== participantId) return participant;
          return {
            ...participant,
            combo: participant.combo + 1,
            score: participant.score + calculateScoreForCorrectAnswer(card.difficulty, participant.combo)
          };
        });
        const termCard = [firstCard, card].find((c) => c.kind === 'term');
        const definitionCard = [firstCard, card].find((c) => c.kind === 'definition');
        const lastResult: CardMatchingResult = {
          participantId,
          correct: true,
          answerText: `${termCard?.text ?? ''} — ${definitionCard?.text ?? ''}`
        };
        const answerHistory = [
          ...state.answerHistory,
          { questionId: card.questionId, participantId, correct: true }
        ];
        const finished = matchedQuestionIds.size === state.cards.length / 2;

        return {
          ...state,
          participants,
          matchedQuestionIds,
          flippedCardIds: [],
          lastResult,
          answerHistory,
          status: finished ? 'finished' : 'inProgress'
        };
      }

      // 짝이 안 맞았다 — 두 카드를 잠깐 보여준 뒤(useCardMatchingEngine의 useEffect가
      // RESOLVE_MISMATCH를 dispatch) 다음 참가자에게 턴이 넘어간다.
      const participants = state.participants.map((participant) =>
        participant.id === participantId ? { ...participant, combo: 0 } : participant
      );
      const lastResult: CardMatchingResult = { participantId, correct: false, answerText: '다시 도전하세요' };
      const answerHistory = [
        ...state.answerHistory,
        { questionId: card.questionId, participantId, correct: false }
      ];

      return { ...state, participants, flippedCardIds, pendingMismatch: true, lastResult, answerHistory };
    }

    case 'RESOLVE_MISMATCH': {
      if (!state.pendingMismatch) return state;
      const nextTurnIndex = (state.turnIndex + 1) % state.turnOrder.length;
      return {
        ...state,
        flippedCardIds: [],
        pendingMismatch: false,
        turnIndex: nextTurnIndex,
        activeParticipantId: state.turnOrder[nextTurnIndex]
      };
    }

    case 'END_GAME_MANUALLY': {
      return { ...state, status: 'finished' };
    }

    case 'ADJUST_SCORE': {
      const participants = state.participants.map((participant) =>
        participant.id === action.participantId ? { ...participant, score: action.newScore } : participant
      );
      return { ...state, participants };
    }

    default:
      return state;
  }
}

export function useCardMatchingEngine(config: CardMatchingConfig) {
  const [state, dispatch] = useReducer(cardMatchingReducer, config, createInitialState);

  useEffect(() => {
    if (!state.pendingMismatch) return;
    const timeoutId = setTimeout(() => dispatch({ type: 'RESOLVE_MISMATCH' }), MISMATCH_REVEAL_MS);
    return () => clearTimeout(timeoutId);
  }, [state.pendingMismatch]);

  function flipCard(cardId: string): void {
    dispatch({
      type: 'FLIP_CARD',
      answer: { participantId: state.activeParticipantId, value: { cardId }, submittedAt: Date.now() }
    });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  function adjustScore(participantId: string, newScore: number): void {
    dispatch({ type: 'ADJUST_SCORE', participantId, newScore });
  }

  return { state, flipCard, endGame, adjustScore };
}
