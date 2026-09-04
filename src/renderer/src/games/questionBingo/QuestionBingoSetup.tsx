import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import type { Difficulty, Question } from '../../../../shared/types/question';
import QuestionFilterPicker, {
  applyQuestionFilter,
  createEmptyQuestionFilter,
  type QuestionFilterState
} from '../_shared/QuestionFilterPicker';
import type { BingoGridSize, QuestionBingoConfig } from './types';

type QuestionBingoSetupProps = {
  onStart: (config: QuestionBingoConfig) => void;
  onCancel: () => void;
};

const GRID_SIZES: BingoGridSize[] = [5, 7, 9];
const DIFFICULTIES: Difficulty[] = [1, 2, 3];

function QuestionBingoSetup({ onStart, onCancel }: QuestionBingoSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [gridSize, setGridSize] = useState<BingoGridSize>(5);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilterState>(createEmptyQuestionFilter());

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
  }, []);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;
  const teams = selectedClass?.teams ?? [];

  // 객관식/단답형만 지원(문제은행 CRUD와 같은 범위). 난이도별 매칭은 아래에서 계산.
  const typeSupportedQuestions = questions.filter(
    (question) => question.type === 'multipleChoice' || question.type === 'shortAnswer'
  );
  const eligibleQuestions = applyQuestionFilter(typeSupportedQuestions, questionFilter);

  const difficultyCounts = DIFFICULTIES.map((difficulty) => ({
    difficulty,
    count: eligibleQuestions.filter((question) => question.difficulty === difficulty).length
  }));
  const hasUnplayableDifficulty = difficultyCounts.some((entry) => entry.count === 0);

  const canStart = Boolean(selectedClass) && teams.length >= 2 && eligibleQuestions.length > 0;

  function handleStart(): void {
    if (!canStart || !selectedClass) return;
    onStart({
      gridSize,
      teams: teams.map((team) => ({ id: team.id, label: team.name })),
      questions: eligibleQuestions,
      classId: selectedClass.id,
      className: selectedClass.name
    });
  }

  return (
    <div className="page">
      <button type="button" className="page-back" onClick={onCancel}>
        ← 뒤로
      </button>
      <h1>문제 빙고 설정</h1>

      <div className="field-row">
        <label>
          학급:{' '}
          <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
            <option value="">선택</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedClass && teams.length < 2 && (
        <p className="error-text">
          이 학급에는 팀이 {teams.length}개뿐입니다. 학급 관리에서 팀을 2개 이상 만들어주세요.
        </p>
      )}
      {selectedClass && teams.length >= 2 && <p>참가 팀: {teams.map((team) => team.name).join(', ')}</p>}

      <div className="field-row">
        {GRID_SIZES.map((size) => (
          <label key={size}>
            <input type="radio" checked={gridSize === size} onChange={() => setGridSize(size)} /> {size}×{size}
          </label>
        ))}
      </div>

      <QuestionFilterPicker questions={typeSupportedQuestions} filter={questionFilter} onChange={setQuestionFilter} />

      <div className="field-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <p style={{ margin: 0 }}>난이도별 사용 가능한 문제 수:</p>
        <ul style={{ margin: '0.25rem 0' }}>
          {difficultyCounts.map(({ difficulty, count }) => (
            <li key={difficulty} className={count === 0 ? 'error-text' : undefined}>
              난이도 {difficulty}: {count}개{count === 0 ? ' — 이 난이도 칸은 점령할 수 없습니다' : ''}
            </li>
          ))}
        </ul>
        {hasUnplayableDifficulty && (
          <p className="error-text">
            위 난이도는 문제은행에 해당 난이도 문제를 추가해야 그 칸을 점령할 수 있습니다.
            지금 시작해도 되지만, 그 난이도가 나온 칸은 아무도 못 가져갑니다.
          </p>
        )}
      </div>

      <button type="button" className="button-primary" onClick={handleStart} disabled={!canStart}>
        시작
      </button>
    </div>
  );
}

export default QuestionBingoSetup;
