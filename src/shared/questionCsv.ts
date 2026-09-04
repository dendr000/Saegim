import type { Difficulty, QuestionDraft, SupportedQuestionType } from './types/question';

export const QUESTION_CSV_HEADERS = [
  '시대',
  '단원',
  '난이도',
  '유형',
  '질문',
  '보기1',
  '보기2',
  '보기3',
  '보기4',
  '정답'
] as const;

export const QUESTION_TYPE_LABELS: Record<SupportedQuestionType, string> = {
  multipleChoice: '객관식',
  shortAnswer: '단답형'
};

const LABEL_TO_TYPE: Record<string, SupportedQuestionType> = {
  객관식: 'multipleChoice',
  단답형: 'shortAnswer'
};

export type CsvRowResult = { ok: true; draft: QuestionDraft } | { ok: false; error: string };

function cell(row: Record<string, string>, key: string): string {
  return (row[key] ?? '').trim();
}

export function parseCsvRowToDraft(row: Record<string, string>): CsvRowResult {
  const era = cell(row, '시대');
  const unit = cell(row, '단원');
  const difficultyRaw = cell(row, '난이도');
  const typeLabel = cell(row, '유형');
  const question = cell(row, '질문');

  if (!era) return { ok: false, error: '시대가 비어있음' };
  if (!unit) return { ok: false, error: '단원이 비어있음' };

  const difficultyNum = Number(difficultyRaw);
  if (![1, 2, 3].includes(difficultyNum)) {
    return { ok: false, error: `난이도는 1~3만 가능 (입력값: "${difficultyRaw}")` };
  }
  const difficulty = difficultyNum as Difficulty;

  const type = LABEL_TO_TYPE[typeLabel];
  if (!type) {
    return { ok: false, error: `유형은 "객관식" 또는 "단답형"만 지원 (입력값: "${typeLabel}")` };
  }

  if (!question) return { ok: false, error: '질문이 비어있음' };

  if (type === 'multipleChoice') {
    const choices = ['보기1', '보기2', '보기3', '보기4']
      .map((key) => cell(row, key))
      .filter((choice) => choice.length > 0);

    if (choices.length < 2) {
      return { ok: false, error: '객관식은 보기가 2개 이상 필요' };
    }

    const answerRaw = cell(row, '정답');
    const answerIndex = choices.findIndex((choice) => choice === answerRaw);
    if (answerIndex === -1) {
      return { ok: false, error: `정답 "${answerRaw}"이(가) 보기 중에 없음` };
    }

    return {
      ok: true,
      draft: {
        era,
        unit,
        difficulty,
        type: 'multipleChoice',
        payload: { question, choices, answerIndex }
      }
    };
  }

  const answerRaw = cell(row, '정답');
  const [answer, ...rest] = answerRaw
    .split(';')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (!answer) return { ok: false, error: '정답이 비어있음' };

  return {
    ok: true,
    draft: {
      era,
      unit,
      difficulty,
      type: 'shortAnswer',
      payload: {
        question,
        answer,
        ...(rest.length > 0 ? { acceptableAnswers: rest } : {})
      }
    }
  };
}
