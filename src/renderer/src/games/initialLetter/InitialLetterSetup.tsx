import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import type { Question } from '../../../../shared/types/question';
import type { InitialLetterConfig, InitialLetterMode } from './types';

type InitialLetterSetupProps = {
  onStart: (config: InitialLetterConfig) => void;
  onCancel: () => void;
};

function InitialLetterSetup({ onStart, onCancel }: InitialLetterSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<InitialLetterMode>('hotSeat');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [eraFilter, setEraFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
  }, []);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;

  useEffect(() => {
    setSelectedStudentIds(new Set(selectedClass?.students.map((student) => student.id) ?? []));
  }, [selectedClassId]);

  function toggleStudent(id: string): void {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 초성 퀴즈는 단답형만 지원한다 — 객관식은 보기가 화면에 다 보여서 초성으로 맞히는
  // 게임이 성립하지 않는다.
  const eligibleQuestions = questions.filter((question) => {
    if (question.type !== 'shortAnswer') return false;
    if (eraFilter && !question.era.includes(eraFilter)) return false;
    if (unitFilter && !question.unit.includes(unitFilter)) return false;
    return true;
  });

  function handleStart(): void {
    if (!selectedClass) return;
    const participants = selectedClass.students
      .filter((student) => selectedStudentIds.has(student.id))
      .map((student) => ({ id: student.id, label: student.name }));

    if (participants.length === 0 || eligibleQuestions.length === 0) return;

    onStart({
      mode,
      durationSeconds,
      participants,
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
      <h1>초성 퀴즈 설정</h1>

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

      {selectedClass && (
        <div className="field-row">
          <p style={{ width: '100%', margin: 0 }}>참가 학생 ({selectedStudentIds.size}명 선택됨):</p>
          {selectedClass.students.map((student) => (
            <label key={student.id}>
              <input
                type="checkbox"
                checked={selectedStudentIds.has(student.id)}
                onChange={() => toggleStudent(student.id)}
              />{' '}
              {student.name}
            </label>
          ))}
        </div>
      )}

      <div className="field-row">
        <label>
          <input type="radio" checked={mode === 'hotSeat'} onChange={() => setMode('hotSeat')} /> 핫시트(한 명씩
          순서대로)
        </label>
        <label>
          <input type="radio" checked={mode === 'simultaneous'} onChange={() => setMode('simultaneous')} /> 동시
          진행(전체, 맞힌 사람이 점수)
        </label>
      </div>

      <div className="field-row">
        <label>
          제한시간(초, {mode === 'hotSeat' ? '학생별' : '전체'}):{' '}
          <input
            type="number"
            min={10}
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value))}
            style={{ width: '4rem' }}
          />
        </label>
      </div>

      <div className="field-row">
        <input placeholder="시대 필터" value={eraFilter} onChange={(event) => setEraFilter(event.target.value)} />
        <input placeholder="단원 필터" value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} />
        <span className="muted-text">사용 가능한 문제 {eligibleQuestions.length}개 (단답형만)</span>
      </div>

      <button
        type="button"
        className="button-primary"
        onClick={handleStart}
        disabled={!selectedClass || selectedStudentIds.size === 0 || eligibleQuestions.length === 0}
      >
        시작
      </button>
    </div>
  );
}

export default InitialLetterSetup;
