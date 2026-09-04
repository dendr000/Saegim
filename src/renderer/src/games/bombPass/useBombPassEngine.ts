import { useReducer } from 'react';
import type { Answer } from '../_shared/types';
import { useCountdownTimer } from '../_shared/useCountdownTimer';
import { gradeAnswer } from '../_shared/gradeAnswer';
import { calculateScoreForCorrectAnswer } from '../timeAttack/scoring';
import type { BombPassConfig, BombPassResult, BombPassState } from './types';

type Action =
  | { type: 'SUBMIT_ANSWER'; answer: Answer }
  | { type: 'BOMB_EXPLODED' }
  | { type: 'PASS_BOMB_MANUALLY' }
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

function randomRoundSeconds(config: BombPassConfig): number {
  const span = config.maxRoundSeconds - config.minRoundSeconds;
  return config.minRoundSeconds + Math.floor(Math.random() * (span + 1));
}

function createInitialState(config: BombPassConfig): BombPassState {
  const questionQueue = shuffle(config.questions);
  const turnOrder = config.participants.map((participant) => participant.id);

  return {
    config,
    participants: config.participants.map((participant) => ({
      id: participant.id,
      label: participant.label,
      score: 0,
      combo: 0,
      bombHitCount: 0
    })),
    questionQueue,
    currentQuestion: questionQueue[0] ?? null,
    turnOrder,
    turnIndex: 0,
    activeParticipantId: turnOrder[0],
    currentRoundSeconds: randomRoundSeconds(config),
    status: 'inProgress',
    lastResult: null,
    lastExplosion: null,
    answerHistory: []
  };
}

// 폭탄을 다음 참가자에게 넘긴다(원형 순환). 문제 큐를 하나 소비하고, 비어있으면
// 게임을 끝낸다 — 정답으로 넘어가는 경우와 폭발로 넘어가는 경우 둘 다 "이번 문제는
// 끝났고 다음 라운드로 간다"는 점이 같아서 이 헬퍼 하나로 처리한다.
function passToNextOrFinish(
  state: BombPassState
): Pick<
  BombPassState,
  'status' | 'turnIndex' | 'activeParticipantId' | 'questionQueue' | 'currentQuestion' | 'currentRoundSeconds'
> {
  const remaining = state.questionQueue.slice(1);
  if (remaining.length === 0) {
    return {
      status: 'finished',
      turnIndex: state.turnIndex,
      activeParticipantId: state.activeParticipantId,
      questionQueue: remaining,
      currentQuestion: null,
      currentRoundSeconds: state.currentRoundSeconds
    };
  }
  const nextTurnIndex = (state.turnIndex + 1) % state.turnOrder.length;
  return {
    status: 'inProgress',
    turnIndex: nextTurnIndex,
    activeParticipantId: state.turnOrder[nextTurnIndex],
    questionQueue: remaining,
    currentQuestion: remaining[0],
    currentRoundSeconds: randomRoundSeconds(state.config)
  };
}

function bombPassReducer(state: BombPassState, action: Action): BombPassState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'SUBMIT_ANSWER': {
      if (!state.currentQuestion) return state;
      const { correct, answerText } = gradeAnswer(state.currentQuestion, action.answer.value);
      const participantId = action.answer.participantId;
      const answerHistory = [
        ...state.answerHistory,
        { questionId: state.currentQuestion.id, participantId, correct }
      ];
      const lastResult: BombPassResult = { participantId, correct, answerText };

      if (!correct) {
        // 폭탄은 그대로 이 참가자가 들고 있다 — 숨겨진 타이머는 멈추지 않고 계속 흐른다.
        const participants = state.participants.map((participant) =>
          participant.id === participantId ? { ...participant, combo: 0 } : participant
        );
        return { ...state, participants, lastResult, answerHistory };
      }

      const difficulty = state.currentQuestion.difficulty;
      const participants = state.participants.map((participant) => {
        if (participant.id !== participantId) return participant;
        return {
          ...participant,
          combo: participant.combo + 1,
          score: participant.score + calculateScoreForCorrectAnswer(difficulty, participant.combo)
        };
      });

      return { ...state, participants, ...passToNextOrFinish(state), lastResult, answerHistory };
    }

    case 'BOMB_EXPLODED': {
      const activeId = state.activeParticipantId;
      const activeLabel = state.participants.find((participant) => participant.id === activeId)?.label ?? '';
      const participants = state.participants.map((participant) =>
        participant.id === activeId
          ? {
              ...participant,
              score: Math.max(0, participant.score - state.config.bombPenalty),
              combo: 0,
              bombHitCount: participant.bombHitCount + 1
            }
          : participant
      );

      return {
        ...state,
        participants,
        ...passToNextOrFinish(state),
        lastResult: null,
        lastExplosion: { participantId: activeId, label: activeLabel }
      };
    }

    case 'PASS_BOMB_MANUALLY': {
      // 교사 수동 개입: 문제가 애매하거나 진행이 막혔을 때 점수 변동 없이 다음 사람에게 넘긴다.
      return { ...state, ...passToNextOrFinish(state), lastResult: null };
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

export function useBombPassEngine(config: BombPassConfig) {
  const [state, dispatch] = useReducer(bombPassReducer, config, createInitialState);

  // 숨겨진 폭탄 타이머 — durationSeconds 자체가 라운드마다 리듀서 상태 안에서 새로
  // 뽑히고(state.currentRoundSeconds), resetKey(턴 인덱스)가 같이 바뀔 때마다 그
  // 새 값으로 재시작된다. 화면엔 남은 시간을 표시하지 않아야 "언제 터질지 모르는"
  // 긴장감이 유지된다.
  const timer = useCountdownTimer(state.currentRoundSeconds, {
    resetKey: state.turnIndex,
    onExpire: () => dispatch({ type: 'BOMB_EXPLODED' })
  });

  function submitAnswer(value: unknown): void {
    dispatch({
      type: 'SUBMIT_ANSWER',
      answer: { participantId: state.activeParticipantId, value, submittedAt: Date.now() }
    });
  }

  function passManually(): void {
    dispatch({ type: 'PASS_BOMB_MANUALLY' });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  function adjustScore(participantId: string, newScore: number): void {
    dispatch({ type: 'ADJUST_SCORE', participantId, newScore });
  }

  return {
    state,
    isTimerRunning: timer.isRunning,
    pauseTimer: timer.pause,
    resumeTimer: timer.resume,
    resetTimer: timer.reset,
    submitAnswer,
    passManually,
    endGame,
    adjustScore
  };
}
