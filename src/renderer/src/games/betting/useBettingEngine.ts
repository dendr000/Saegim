import { useReducer } from 'react';
import type { Question } from '../../../../shared/types/question';
import { gradeAnswer } from '../_shared/gradeAnswer';
import type { BettingConfig, BettingState, RoundResult } from './types';

type Action =
  | { type: 'SET_BET'; teamId: string; amount: number }
  | { type: 'LOCK_IN_BETS' }
  | { type: 'SET_TEAM_ANSWER'; teamId: string; value: unknown }
  | { type: 'SETTLE_ROUND' }
  | { type: 'END_GAME_MANUALLY' };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createInitialBets(config: BettingConfig): Record<string, number> {
  const bets: Record<string, number> = {};
  config.teams.forEach((team) => {
    bets[team.id] = 0;
  });
  return bets;
}

function createInitialState(config: BettingConfig): BettingState {
  return {
    config,
    teams: config.teams.map((team) => ({ id: team.id, label: team.label, score: config.startingScore })),
    shuffledQuestions: shuffle(config.questions),
    roundIndex: 0,
    phase: 'betting',
    bets: createInitialBets(config),
    currentQuestion: null,
    answers: {},
    lastRoundResults: null,
    status: 'inProgress'
  };
}

function bettingReducer(state: BettingState, action: Action): BettingState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'SET_BET': {
      if (state.phase !== 'betting') return state;
      const team = state.teams.find((candidate) => candidate.id === action.teamId);
      if (!team) return state;

      // 배팅액은 0 이상, 현재 점수 이하로만 (더 못 검). 점수가 이미 0 이하면 0으로 고정.
      const maxBet = Math.max(0, team.score);
      const amount = Math.min(Math.max(0, action.amount), maxBet);

      return { ...state, bets: { ...state.bets, [action.teamId]: amount } };
    }

    case 'LOCK_IN_BETS': {
      if (state.phase !== 'betting') return state;
      const question: Question = state.shuffledQuestions[state.roundIndex % state.shuffledQuestions.length];
      return { ...state, phase: 'judging', currentQuestion: question, answers: {} };
    }

    case 'SET_TEAM_ANSWER': {
      if (state.phase !== 'judging') return state;
      return { ...state, answers: { ...state.answers, [action.teamId]: action.value } };
    }

    case 'SETTLE_ROUND': {
      if (state.phase !== 'judging' || !state.currentQuestion) return state;
      const question = state.currentQuestion;

      const results: RoundResult[] = [];
      const teams = state.teams.map((team) => {
        const bet = state.bets[team.id] ?? 0;
        if (!(team.id in state.answers)) {
          // 아직 답이 입력 안 된 팀 — 정산에서 제외(변화 없음). UI가 "정산하기"를
          // 전 팀 입력 전엔 막아두므로 정상 흐름에서는 발생하지 않는다.
          results.push({ teamId: team.id, bet, correct: false, delta: 0 });
          return team;
        }
        const { correct } = gradeAnswer(question, state.answers[team.id]);
        const delta = correct ? bet : -bet;
        results.push({ teamId: team.id, bet, correct, delta });
        return { ...team, score: team.score + delta };
      });

      const nextRoundIndex = state.roundIndex + 1;
      const finished = nextRoundIndex >= state.config.totalRounds;

      return {
        ...state,
        teams,
        lastRoundResults: results,
        roundIndex: nextRoundIndex,
        phase: 'betting',
        bets: createInitialBets(state.config),
        currentQuestion: null,
        answers: {},
        status: finished ? 'finished' : 'inProgress'
      };
    }

    case 'END_GAME_MANUALLY': {
      return { ...state, status: 'finished' };
    }

    default:
      return state;
  }
}

export function useBettingEngine(config: BettingConfig) {
  const [state, dispatch] = useReducer(bettingReducer, config, createInitialState);

  function setBet(teamId: string, amount: number): void {
    dispatch({ type: 'SET_BET', teamId, amount });
  }

  function lockInBets(): void {
    dispatch({ type: 'LOCK_IN_BETS' });
  }

  function setTeamAnswer(teamId: string, value: unknown): void {
    dispatch({ type: 'SET_TEAM_ANSWER', teamId, value });
  }

  function settleRound(): void {
    dispatch({ type: 'SETTLE_ROUND' });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  return { state, setBet, lockInBets, setTeamAnswer, settleRound, endGame };
}
