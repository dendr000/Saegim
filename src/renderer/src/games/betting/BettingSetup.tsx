import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import type { Question } from '../../../../shared/types/question';
import type { BettingConfig } from './types';

type BettingSetupProps = {
  onStart: (config: BettingConfig) => void;
  onCancel: () => void;
};

function BettingSetup({ onStart, onCancel }: BettingSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [totalRounds, setTotalRounds] = useState(5);
  const [startingScore, setStartingScore] = useState(1000);
  const [eraFilter, setEraFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
  }, []);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;
  const teams = selectedClass?.teams ?? [];

  const eligibleQuestions = questions.filter((question) => {
    if (question.type !== 'multipleChoice' && question.type !== 'shortAnswer') return false;
    if (eraFilter && !question.era.includes(eraFilter)) return false;
    if (unitFilter && !question.unit.includes(unitFilter)) return false;
    return true;
  });

  const canStart = Boolean(selectedClass) && teams.length >= 2 && totalRounds >= 1 && eligibleQuestions.length > 0;

  function handleStart(): void {
    if (!canStart || !selectedClass) return;
    onStart({
      teams: teams.map((team) => ({ id: team.id, label: team.name })),
      totalRounds,
      startingScore,
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
      <h1>베팅형 설정</h1>

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
          라운드 수:{' '}
          <input
            type="number"
            min={1}
            value={totalRounds}
            onChange={(event) => setTotalRounds(Number(event.target.value))}
            style={{ width: '4rem' }}
          />
        </label>
        <label>
          시작 점수:{' '}
          <input
            type="number"
            min={0}
            value={startingScore}
            onChange={(event) => setStartingScore(Number(event.target.value))}
            style={{ width: '6rem' }}
          />
        </label>
      </div>

      <div className="field-row">
        <input placeholder="시대 필터" value={eraFilter} onChange={(event) => setEraFilter(event.target.value)} />
        <input placeholder="단원 필터" value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} />
        <span className="muted-text">
          사용 가능한 문제 {eligibleQuestions.length}개 (객관식/단답형만)
          {eligibleQuestions.length > 0 && eligibleQuestions.length < totalRounds
            ? ` — 라운드 수(${totalRounds})보다 적어 일부 문제가 반복됩니다`
            : ''}
        </span>
      </div>

      <button type="button" className="button-primary" onClick={handleStart} disabled={!canStart}>
        시작
      </button>
    </div>
  );
}

export default BettingSetup;
