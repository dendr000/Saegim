import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import type { Question } from '../../../../shared/types/question';
import QuestionFilterPicker, {
  applyQuestionFilter,
  loadQuestionFilter,
  saveQuestionFilter,
  type QuestionFilterState
} from '../_shared/QuestionFilterPicker';
import type { ChanceCardConfig } from './types';

const GAME_MODE = 'chanceCard';
const DEFAULT_STEAL_AMOUNT = 20;

type ChanceCardSetupProps = {
  onStart: (config: ChanceCardConfig) => void;
  onCancel: () => void;
};

function ChanceCardSetup({ onStart, onCancel }: ChanceCardSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [stealAmount, setStealAmount] = useState(DEFAULT_STEAL_AMOUNT);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilterState>(() => loadQuestionFilter(GAME_MODE));

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
  }, []);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;
  const teams = selectedClass?.teams ?? [];

  function handleQuestionFilterChange(nextFilter: QuestionFilterState): void {
    setQuestionFilter(nextFilter);
    saveQuestionFilter(GAME_MODE, nextFilter);
  }

  // 찬스카드는 타임어택과 같은 범위(객관식/단답형)를 지원한다.
  const typeSupportedQuestions = questions.filter(
    (question) => question.type === 'multipleChoice' || question.type === 'shortAnswer'
  );
  const eligibleQuestions = applyQuestionFilter(typeSupportedQuestions, questionFilter);

  const canStart = Boolean(selectedClass) && teams.length >= 2 && eligibleQuestions.length > 0;

  function handleStart(): void {
    if (!canStart || !selectedClass) return;
    onStart({
      stealAmount,
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
      <h1>찬스카드 설정</h1>

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
        <label>
          점수 훔치기 액수:{' '}
          <input
            type="number"
            min={0}
            value={stealAmount}
            onChange={(event) => setStealAmount(Number(event.target.value))}
            style={{ width: '5rem' }}
          />
        </label>
      </div>
      <p className="muted-text">
        정답을 맞히면 점수 훔치기 / 순서 뒤집기 / 방어막 카드 중 하나를 무작위로 획득합니다.
      </p>

      <QuestionFilterPicker
        questions={typeSupportedQuestions}
        filter={questionFilter}
        onChange={handleQuestionFilterChange}
      />
      <p className="muted-text">사용 가능한 문제 {eligibleQuestions.length}개 (객관식/단답형)</p>

      <button type="button" className="button-primary" onClick={handleStart} disabled={!canStart}>
        시작
      </button>
    </div>
  );
}

export default ChanceCardSetup;
