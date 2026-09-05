export type Difficulty = 1 | 2 | 3;

type QuestionBase = {
  id: string;
  era: string;
  unit: string;
  difficulty: Difficulty;
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: 'multipleChoice';
  payload: {
    question: string;
    choices: string[];
    answerIndex: number;
  };
};

export type ShortAnswerQuestion = QuestionBase & {
  type: 'shortAnswer';
  payload: {
    question: string;
    answer: string;
    acceptableAnswers?: string[];
  };
};

// 아래 네 유형은 해당 게임 모드를 만들 때 전용 입력 폼이 추가된다.
// 스키마만 지금 확정해서 나중에 문제은행 전체를 마이그레이션하는 상황을 피한다.
export type InitialLetterQuestion = QuestionBase & {
  type: 'initialLetter';
  payload: {
    question: string;
    initials: string;
    answer: string;
  };
};

export type SourceReadingQuestion = QuestionBase & {
  type: 'sourceReading';
  payload: {
    sourceText: string;
    question: string;
    answer: string;
  };
};

export type ImageIdentifyQuestion = QuestionBase & {
  type: 'imageIdentify';
  payload: {
    imageFileName: string;
    question: string;
    answer: string;
  };
};

export type TimelineOrderQuestion = QuestionBase & {
  type: 'timelineOrder';
  payload: {
    question: string;
    events: string[];
  };
};

export type Question =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | InitialLetterQuestion
  | SourceReadingQuestion
  | ImageIdentifyQuestion
  | TimelineOrderQuestion;

export type QuestionType = Question['type'];

export type QuestionDraft = Omit<Question, 'id'>;

// 폼이 지원하는 유형(CSV 일괄가져오기는 이 중 객관식/단답형만 지원 —
// 나머지는 구조가 CSV 한 행에 담기 어려워 폼으로만 추가한다).
export type SupportedQuestionType = 'multipleChoice' | 'shortAnswer' | 'imageIdentify';

export const SUPPORTED_QUESTION_TYPES: SupportedQuestionType[] = [
  'multipleChoice',
  'shortAnswer',
  'imageIdentify'
];

function isDifficulty(value: unknown): value is Difficulty {
  return value === 1 || value === 2 || value === 3;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * IPC로 들어온 값이 구조적으로 올바른 QuestionDraft인지 확인한다.
 * CSV/폼 단계에서 이미 검증된 값이 다시 들어오는 경로지만, 메인 프로세스는
 * 렌더러가 보낸 값을 그대로 신뢰하지 않고 한 번 더 구조를 확인한다.
 */
export function isQuestionDraft(value: unknown): value is QuestionDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Record<string, unknown>;

  if (!isNonEmptyString(draft.era)) return false;
  if (!isNonEmptyString(draft.unit)) return false;
  if (!isDifficulty(draft.difficulty)) return false;

  const payload = draft.payload as Record<string, unknown> | undefined;
  if (typeof payload !== 'object' || payload === null) return false;

  switch (draft.type) {
    case 'multipleChoice': {
      const choices = payload.choices;
      return (
        isNonEmptyString(payload.question) &&
        Array.isArray(choices) &&
        choices.length >= 2 &&
        choices.every((choice) => isNonEmptyString(choice)) &&
        typeof payload.answerIndex === 'number' &&
        payload.answerIndex >= 0 &&
        payload.answerIndex < choices.length
      );
    }
    case 'shortAnswer': {
      return isNonEmptyString(payload.question) && isNonEmptyString(payload.answer);
    }
    case 'imageIdentify': {
      return (
        isNonEmptyString(payload.imageFileName) &&
        isNonEmptyString(payload.question) &&
        isNonEmptyString(payload.answer)
      );
    }
    default:
      // 이번 단계에서는 아직 폼/CSV가 없는 유형이므로 저장을 허용하지 않는다.
      return false;
  }
}
