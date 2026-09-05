import { useReducer } from 'react';
import type { Answer } from '../_shared/types';
import { useCountdownTimer } from '../_shared/useCountdownTimer';
import type { CategorizeConfig, CategorizeRoundResult, CategorizeState } from './types';

type Action =
  | { type: 'PLACE_ITEM'; answer: Answer }
  | { type: 'SUBMIT_PLACEMENTS' }
  | { type: 'TURN_TIME_EXPIRED' }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'ADJUST_SCORE'; participantId: string; newScore: number };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createInitialState(config: CategorizeConfig): CategorizeState {
  const questionQueue = shuffle(config.questions);
  const turnOrder = config.participants.map((participant) => participant.id);

  return {
    config,
    participants: config.participants.map((participant) => ({
      id: participant.id,
      label: participant.label,
      score: 0
    })),
    turnOrder,
    turnIndex: 0,
    activeParticipantId: turnOrder[0],
    questionQueue,
    currentQuestion: questionQueue[0] ?? null,
    currentPlacements: {},
    status: 'inProgress',
    lastRoundResult: null,
    answerHistory: []
  };
}

// 제출(수동 또는 시간 초과) 시 그 시점 배치 상태를 정답과 비교해 채점하고,
// 정답 여부와 무관하게 다음 참가자 + 다음 문제로 넘어간다.
function finalizeRound(state: CategorizeState): CategorizeState {
  if (!state.currentQuestion || state.currentQuestion.type !== 'categorize') return state;
  const question = state.currentQuestion;
  const items = question.payload.items;

  const correctCount = items.filter((item) => state.currentPlacements[item.id] === item.categoryIndex).length;
  const pointsPerItem = question.difficulty * 5;
  const roundScore = correctCount * pointsPerItem;

  const participants = state.participants.map((participant) =>
    participant.id === state.activeParticipantId
      ? { ...participant, score: participant.score + roundScore }
      : participant
  );
  const activeLabel = state.participants.find((participant) => participant.id === state.activeParticipantId)?.label ?? '';
  const lastRoundResult: CategorizeRoundResult = {
    participantId: state.activeParticipantId,
    label: activeLabel,
    correctCount,
    totalCount: items.length
  };
  const answerHistory = [
    ...state.answerHistory,
    { questionId: question.id, participantId: state.activeParticipantId, correct: correctCount === items.length }
  ];

  const remaining = state.questionQueue.slice(1);
  if (remaining.length === 0) {
    return {
      ...state,
      participants,
      answerHistory,
      lastRoundResult,
      status: 'finished',
      questionQueue: remaining,
      currentQuestion: null,
      currentPlacements: {}
    };
  }

  const nextTurnIndex = (state.turnIndex + 1) % state.turnOrder.length;
  return {
    ...state,
    participants,
    answerHistory,
    lastRoundResult,
    turnIndex: nextTurnIndex,
    activeParticipantId: state.turnOrder[nextTurnIndex],
    questionQueue: remaining,
    currentQuestion: remaining[0],
    currentPlacements: {}
  };
}

function categorizeReducer(state: CategorizeState, action: Action): CategorizeState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'PLACE_ITEM': {
      if (!state.currentQuestion) return state;
      const { itemId, categoryIndex } = action.answer.value as { itemId: string; categoryIndex: number };
      return { ...state, currentPlacements: { ...state.currentPlacements, [itemId]: categoryIndex } };
    }

    case 'SUBMIT_PLACEMENTS': {
      return finalizeRound(state);
    }

    case 'TURN_TIME_EXPIRED': {
      return finalizeRound(state);
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

export function useCategorizeEngine(config: CategorizeConfig) {
  const [state, dispatch] = useReducer(categorizeReducer, config, createInitialState);

  const timer = useCountdownTimer(config.durationSeconds, {
    resetKey: state.turnIndex,
    onExpire: () => dispatch({ type: 'TURN_TIME_EXPIRED' })
  });

  function placeItem(itemId: string, categoryIndex: number): void {
    dispatch({
      type: 'PLACE_ITEM',
      answer: { participantId: state.activeParticipantId, value: { itemId, categoryIndex }, submittedAt: Date.now() }
    });
  }

  function submitPlacements(): void {
    dispatch({ type: 'SUBMIT_PLACEMENTS' });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  function adjustScore(participantId: string, newScore: number): void {
    dispatch({ type: 'ADJUST_SCORE', participantId, newScore });
  }

  return {
    state,
    remainingSeconds: timer.remainingSeconds,
    isTimerRunning: timer.isRunning,
    pauseTimer: timer.pause,
    resumeTimer: timer.resume,
    resetTimer: timer.reset,
    placeItem,
    submitPlacements,
    endGame,
    adjustScore
  };
}
