import { useReducer } from 'react';
import type { Question } from '../../../../shared/types/question';
import type { Answer } from '../_shared/types';
import { gradeAnswer } from '../_shared/gradeAnswer';
import type { ChanceCardConfig, ChanceCardResult, ChanceCardState, DrawnCardType } from './types';

type Action =
  | { type: 'SUBMIT_ANSWER'; answer: Answer }
  | { type: 'RESOLVE_STEAL'; targetTeamId: string }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'ADJUST_SCORE'; teamId: string; newScore: number };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const CARD_TYPES: DrawnCardType[] = ['steal', 'reverse', 'shield'];

function drawRandomCard(): DrawnCardType {
  return CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
}

function createInitialState(config: ChanceCardConfig): ChanceCardState {
  const questionQueue = shuffle(config.questions);
  const turnOrder = config.teams.map((team) => team.id);

  return {
    config,
    teams: config.teams.map((team) => ({ id: team.id, label: team.label, score: 0, hasShield: false })),
    turnOrder,
    turnIndex: 0,
    activeTeamId: turnOrder[0],
    questionQueue,
    currentQuestion: questionQueue[0] ?? null,
    pendingCard: null,
    lastResult: null,
    lastCardEvent: null,
    status: 'inProgress',
    answerHistory: []
  };
}

function advanceTurn(turnOrder: string[], turnIndex: number): { turnIndex: number; activeTeamId: string } {
  const nextTurnIndex = (turnIndex + 1) % turnOrder.length;
  return { turnIndex: nextTurnIndex, activeTeamId: turnOrder[nextTurnIndex] };
}

function nextQuestionOrFinish(
  questionQueue: Question[]
): Pick<ChanceCardState, 'status' | 'questionQueue' | 'currentQuestion'> {
  const remaining = questionQueue.slice(1);
  if (remaining.length === 0) {
    return { status: 'finished', questionQueue: remaining, currentQuestion: null };
  }
  return { status: 'inProgress', questionQueue: remaining, currentQuestion: remaining[0] };
}

function chanceCardReducer(state: ChanceCardState, action: Action): ChanceCardState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'SUBMIT_ANSWER': {
      // 훔치기 카드의 대상 선택을 기다리는 중엔 새 판정을 받지 않는다.
      if (!state.currentQuestion || state.pendingCard) return state;

      const { correct, answerText } = gradeAnswer(state.currentQuestion, action.answer.value);
      const teamId = action.answer.participantId;
      const answerHistory = [
        ...state.answerHistory,
        { questionId: state.currentQuestion.id, participantId: teamId, correct }
      ];
      const lastResult: ChanceCardResult = { teamId, correct, answerText };

      if (!correct) {
        // 오답이어도(땅따먹기와 같은 이유로) 턴은 항상 다음 팀으로 넘어간다.
        return {
          ...state,
          ...advanceTurn(state.turnOrder, state.turnIndex),
          ...nextQuestionOrFinish(state.questionQueue),
          lastResult,
          answerHistory,
          lastCardEvent: state.lastCardEvent
        };
      }

      const difficulty = state.currentQuestion.difficulty;
      const teams = state.teams.map((team) =>
        team.id === teamId ? { ...team, score: team.score + difficulty * 10 } : team
      );
      const card = drawRandomCard();
      const drawerLabel = state.teams.find((team) => team.id === teamId)?.label ?? '';

      if (card === 'steal') {
        // 대상 팀을 고를 때까지 턴을 넘기지 않고 대기한다.
        return { ...state, teams, pendingCard: 'steal', lastResult, answerHistory };
      }

      if (card === 'reverse') {
        const turnOrder = [...state.turnOrder].reverse();
        const drawerIndexInReversed = turnOrder.indexOf(teamId);
        return {
          ...state,
          teams,
          turnOrder,
          ...advanceTurn(turnOrder, drawerIndexInReversed),
          ...nextQuestionOrFinish(state.questionQueue),
          lastResult,
          answerHistory,
          lastCardEvent: `${drawerLabel}이(가) 순서 뒤집기 카드를 뽑았습니다! 턴 순서가 반전되었습니다.`
        };
      }

      // shield
      const teamsWithShield = teams.map((team) => (team.id === teamId ? { ...team, hasShield: true } : team));
      return {
        ...state,
        teams: teamsWithShield,
        ...advanceTurn(state.turnOrder, state.turnIndex),
        ...nextQuestionOrFinish(state.questionQueue),
        lastResult,
        answerHistory,
        lastCardEvent: `${drawerLabel}이(가) 방어막 카드를 뽑았습니다! 다음 한 번의 훔치기를 막아줍니다.`
      };
    }

    case 'RESOLVE_STEAL': {
      if (state.pendingCard !== 'steal' || !state.lastResult) return state;
      const drawerTeamId = state.lastResult.teamId;
      const drawerLabel = state.teams.find((team) => team.id === drawerTeamId)?.label ?? '';
      const targetTeam = state.teams.find((team) => team.id === action.targetTeamId);
      const targetLabel = targetTeam?.label ?? '';

      let teams = state.teams;
      let lastCardEvent: string;

      if (targetTeam?.hasShield) {
        teams = state.teams.map((team) =>
          team.id === action.targetTeamId ? { ...team, hasShield: false } : team
        );
        lastCardEvent = `${drawerLabel}이(가) ${targetLabel}의 점수를 노렸지만 방어막에 막혔습니다!`;
      } else {
        const stolen = Math.min(state.config.stealAmount, targetTeam?.score ?? 0);
        teams = state.teams.map((team) => {
          if (team.id === action.targetTeamId) return { ...team, score: team.score - stolen };
          if (team.id === drawerTeamId) return { ...team, score: team.score + stolen };
          return team;
        });
        lastCardEvent = `${drawerLabel}이(가) ${targetLabel}에게서 ${stolen}점을 훔쳤습니다!`;
      }

      return {
        ...state,
        teams,
        pendingCard: null,
        ...advanceTurn(state.turnOrder, state.turnIndex),
        ...nextQuestionOrFinish(state.questionQueue),
        lastCardEvent
      };
    }

    case 'END_GAME_MANUALLY': {
      return { ...state, status: 'finished' };
    }

    case 'ADJUST_SCORE': {
      const teams = state.teams.map((team) => (team.id === action.teamId ? { ...team, score: action.newScore } : team));
      return { ...state, teams };
    }

    default:
      return state;
  }
}

export function useChanceCardEngine(config: ChanceCardConfig) {
  const [state, dispatch] = useReducer(chanceCardReducer, config, createInitialState);

  function judgeAnswer(value: unknown): void {
    dispatch({
      type: 'SUBMIT_ANSWER',
      answer: { participantId: state.activeTeamId, value, submittedAt: Date.now() }
    });
  }

  function resolveSteal(targetTeamId: string): void {
    dispatch({ type: 'RESOLVE_STEAL', targetTeamId });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  function adjustScore(teamId: string, newScore: number): void {
    dispatch({ type: 'ADJUST_SCORE', teamId, newScore });
  }

  return { state, judgeAnswer, resolveSteal, endGame, adjustScore };
}
