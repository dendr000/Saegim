import type { Difficulty, Question } from '../../../../shared/types/question';
import { loadPreference, savePreference } from './localPreferences';

export type QuestionFilterState = {
  eras: Set<string>;
  units: Set<string>;
  difficulties: Set<Difficulty>;
};

export function createEmptyQuestionFilter(): QuestionFilterState {
  return { eras: new Set(), units: new Set(), difficulties: new Set() };
}

type StoredQuestionFilter = { eras: string[]; units: string[]; difficulties: Difficulty[] };

// 게임 모드별로 기억한다(학급과 무관 — "지난번에 쓴 시대/단원/난이도"는 문제은행
// 내용에 대한 선택이지 학급에 대한 선택이 아니라서).
function storageKeyFor(gameMode: string): string {
  return `saegim:questionFilter:${gameMode}`;
}

export function loadQuestionFilter(gameMode: string): QuestionFilterState {
  const stored = loadPreference<StoredQuestionFilter>(storageKeyFor(gameMode));
  if (!stored) return createEmptyQuestionFilter();
  return {
    eras: new Set(stored.eras ?? []),
    units: new Set(stored.units ?? []),
    difficulties: new Set(stored.difficulties ?? [])
  };
}

export function saveQuestionFilter(gameMode: string, filter: QuestionFilterState): void {
  savePreference<StoredQuestionFilter>(storageKeyFor(gameMode), {
    eras: Array.from(filter.eras),
    units: Array.from(filter.units),
    difficulties: Array.from(filter.difficulties)
  });
}

// 각 목록이 비어있으면 "필터 없음"(전체 포함)으로 취급한다 — 아무것도 체크 안 한
// 상태가 "전부 제외"가 아니라 기존 자유 텍스트 필터의 빈 문자열과 같은 의미가 되도록.
export function applyQuestionFilter(questions: Question[], filter: QuestionFilterState): Question[] {
  return questions.filter((question) => {
    if (filter.eras.size > 0 && !filter.eras.has(question.era)) return false;
    if (filter.units.size > 0 && !filter.units.has(question.unit)) return false;
    if (filter.difficulties.size > 0 && !filter.difficulties.has(question.difficulty)) return false;
    return true;
  });
}

type QuestionFilterPickerProps = {
  // 필터 적용 전, 유형만 걸러진 풀 — 여기서 선택 가능한 시대/단원 값 목록을 뽑는다.
  questions: Question[];
  filter: QuestionFilterState;
  onChange: (filter: QuestionFilterState) => void;
};

const DIFFICULTIES: Difficulty[] = [1, 2, 3];

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

// 선택된 시대(들)에 실제로 존재하는 단원만 뽑는다. 시대를 하나도 안 골랐으면
// "제한 없음"이니 전체 단원을 대상으로 한다.
function unitsForEras(questions: Question[], eras: Set<string>): string[] {
  const source = eras.size > 0 ? questions.filter((question) => eras.has(question.era)) : questions;
  return Array.from(new Set(source.map((question) => question.unit))).sort();
}

function QuestionFilterPicker({ questions, filter, onChange }: QuestionFilterPickerProps) {
  const eras = Array.from(new Set(questions.map((question) => question.era))).sort();
  const units = unitsForEras(questions, filter.eras);

  // 시대 선택이 바뀌면 단원 목록도 자동으로 그 시대에 있는 것만 남기고 전부 선택한다 —
  // 역사 지식이 없어도 "이 시대엔 이런 단원이 있구나"를 바로 알 수 있고, 존재하지 않는
  // 시대·단원 조합을 실수로 골라 사용 가능한 문제가 0개가 되는 상황도 막는다. 시대를
  // 다시 다 해제하면 단원도 "제한 없음"으로 함께 풀린다.
  function handleEraToggle(era: string): void {
    const nextEras = toggleInSet(filter.eras, era);
    const nextUnits = nextEras.size > 0 ? new Set(unitsForEras(questions, nextEras)) : new Set<string>();
    onChange({ ...filter, eras: nextEras, units: nextUnits });
  }

  return (
    <div className="field-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
      {eras.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span className="muted-text">시대: </span>
          {eras.map((era) => (
            <label key={era} style={{ marginRight: '0.75rem' }}>
              <input type="checkbox" checked={filter.eras.has(era)} onChange={() => handleEraToggle(era)} />{' '}
              {era}
            </label>
          ))}
        </div>
      )}

      {units.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span className="muted-text">단원{filter.eras.size > 0 ? '(선택한 시대 안에서)' : ''}: </span>
          {units.map((unit) => (
            <label key={unit} style={{ marginRight: '0.75rem' }}>
              <input
                type="checkbox"
                checked={filter.units.has(unit)}
                onChange={() => onChange({ ...filter, units: toggleInSet(filter.units, unit) })}
              />{' '}
              {unit}
            </label>
          ))}
        </div>
      )}

      <div>
        <span className="muted-text">난이도: </span>
        {DIFFICULTIES.map((difficulty) => (
          <label key={difficulty} style={{ marginRight: '0.75rem' }}>
            <input
              type="checkbox"
              checked={filter.difficulties.has(difficulty)}
              onChange={() => onChange({ ...filter, difficulties: toggleInSet(filter.difficulties, difficulty) })}
            />{' '}
            난이도 {difficulty}
          </label>
        ))}
      </div>
    </div>
  );
}

export default QuestionFilterPicker;
