import type { Difficulty, Question } from '../../../../shared/types/question';

export type QuestionFilterState = {
  eras: Set<string>;
  units: Set<string>;
  difficulties: Set<Difficulty>;
};

export function createEmptyQuestionFilter(): QuestionFilterState {
  return { eras: new Set(), units: new Set(), difficulties: new Set() };
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

function QuestionFilterPicker({ questions, filter, onChange }: QuestionFilterPickerProps) {
  const eras = Array.from(new Set(questions.map((question) => question.era))).sort();
  const units = Array.from(new Set(questions.map((question) => question.unit))).sort();

  return (
    <div className="field-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
      {eras.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span className="muted-text">시대: </span>
          {eras.map((era) => (
            <label key={era} style={{ marginRight: '0.75rem' }}>
              <input
                type="checkbox"
                checked={filter.eras.has(era)}
                onChange={() => onChange({ ...filter, eras: toggleInSet(filter.eras, era) })}
              />{' '}
              {era}
            </label>
          ))}
        </div>
      )}

      {units.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span className="muted-text">단원: </span>
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
