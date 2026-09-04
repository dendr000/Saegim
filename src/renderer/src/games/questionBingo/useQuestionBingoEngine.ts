import { useReducer } from 'react';
import type { Question } from '../../../../shared/types/question';
import type { Answer } from '../_shared/types';
import { gradeAnswer } from '../_shared/gradeAnswer';
import { generateCells, computeLines, findNewCompletedLines } from './gridUtils';
import type { QuestionBingoConfig, QuestionBingoState } from './types';

type Action =
  | { type: 'SELECT_CELL'; cellId: string }
  | { type: 'JUDGE_ANSWER'; answer: Answer }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'REASSIGN_CELL'; cellId: string; newOwnerTeamId: string | null };

function pickRandomQuestion(questions: Question[]): Question {
  return questions[Math.floor(Math.random() * questions.length)];
}

function createInitialState(config: QuestionBingoConfig): QuestionBingoState {
  const cells = generateCells(config.gridSize);
  const cellOwners: Record<string, string | null> = {};
  cells.forEach((cell) => {
    cellOwners[cell.id] = null;
  });
  const completedLines: Record<string, string[]> = {};
  config.teams.forEach((team) => {
    completedLines[team.id] = [];
  });

  return {
    config,
    cells,
    cellOwners,
    completedLines,
    currentTeamIndex: 0,
    pendingCellId: null,
    currentQuestion: null,
    blockedCellId: null,
    status: 'inProgress',
    lastResult: null,
    answerHistory: []
  };
}

function allCellsOwned(cellOwners: Record<string, string | null>): boolean {
  return Object.values(cellOwners).every((owner) => owner !== null);
}

function questionBingoReducer(state: QuestionBingoState, action: Action): QuestionBingoState {
  if (state.status === 'finished') return state;

  switch (action.type) {
    case 'SELECT_CELL': {
      if (state.pendingCellId) return state;
      if (state.cellOwners[action.cellId] !== null) return state;

      const cell = state.cells.find((candidate) => candidate.id === action.cellId);
      const eligibleQuestions = cell
        ? state.config.questions.filter((question) => question.difficulty === cell.difficulty)
        : [];

      if (eligibleQuestions.length === 0) {
        // 이 난이도로 태깅된 문제가 없다 — 다른 문제로 대체하지 않고 선택을 막는다.
        return { ...state, blockedCellId: action.cellId };
      }

      const question = pickRandomQuestion(eligibleQuestions);
      return {
        ...state,
        pendingCellId: action.cellId,
        currentQuestion: question,
        blockedCellId: null,
        lastResult: null
      };
    }

    case 'JUDGE_ANSWER': {
      if (!state.pendingCellId || !state.currentQuestion) return state;

      const { correct, answerText } = gradeAnswer(state.currentQuestion, action.answer.value);
      const participantId = action.answer.participantId;

      const cellOwners = { ...state.cellOwners };
      let completedLines = state.completedLines;
      if (correct) {
        cellOwners[state.pendingCellId] = participantId;
        const lines = computeLines(state.config.gridSize);
        const newLines = findNewCompletedLines(
          cellOwners,
          lines,
          participantId,
          state.completedLines[participantId] ?? []
        );
        if (newLines.length > 0) {
          completedLines = {
            ...state.completedLines,
            [participantId]: [...(state.completedLines[participantId] ?? []), ...newLines]
          };
        }
      }

      const nextTeamIndex = (state.currentTeamIndex + 1) % state.config.teams.length;
      const finished = allCellsOwned(cellOwners);
      const answerHistory = [
        ...state.answerHistory,
        { questionId: state.currentQuestion.id, participantId, correct }
      ];

      return {
        ...state,
        cellOwners,
        completedLines,
        currentTeamIndex: nextTeamIndex,
        pendingCellId: null,
        currentQuestion: null,
        status: finished ? 'finished' : 'inProgress',
        lastResult: { cellId: state.pendingCellId, teamId: participantId, correct, answerText },
        answerHistory
      };
    }

    case 'END_GAME_MANUALLY': {
      return { ...state, status: 'finished' };
    }

    case 'REASSIGN_CELL': {
      // 교사 수동 개입: 잘못 배정된 칸의 소유팀을 바로잡는다(다른 팀으로, 또는 미점령으로).
      // 줄 보너스는 재계산하지 않는다 — 이미 지급된 보너스를 취소하면 오히려 더
      // 혼란스러울 수 있어, 칸 소유만 되돌린다.
      return {
        ...state,
        cellOwners: { ...state.cellOwners, [action.cellId]: action.newOwnerTeamId }
      };
    }

    default:
      return state;
  }
}

export function useQuestionBingoEngine(config: QuestionBingoConfig) {
  const [state, dispatch] = useReducer(questionBingoReducer, config, createInitialState);

  function selectCell(cellId: string): void {
    dispatch({ type: 'SELECT_CELL', cellId });
  }

  function judgeAnswer(value: unknown): void {
    const currentTeam = state.config.teams[state.currentTeamIndex];
    dispatch({ type: 'JUDGE_ANSWER', answer: { participantId: currentTeam.id, value, submittedAt: Date.now() } });
  }

  function endGame(): void {
    dispatch({ type: 'END_GAME_MANUALLY' });
  }

  function reassignCell(cellId: string, newOwnerTeamId: string | null): void {
    dispatch({ type: 'REASSIGN_CELL', cellId, newOwnerTeamId });
  }

  return { state, selectCell, judgeAnswer, endGame, reassignCell };
}
