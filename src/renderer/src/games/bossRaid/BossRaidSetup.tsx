import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import type { Question } from '../../../../shared/types/question';
import type { BossRaidConfig } from './types';

type BossRaidSetupProps = {
  onStart: (config: BossRaidConfig) => void;
  onCancel: () => void;
};

const DEFAULT_BOSS_NAME = '역사 시험의 수호자';
const HP_PER_QUESTION = 30;

function BossRaidSetup({ onStart, onCancel }: BossRaidSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [bossName, setBossName] = useState(DEFAULT_BOSS_NAME);
  const [bossMaxHp, setBossMaxHp] = useState(300);
  const [hpTouched, setHpTouched] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(300);
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

  // 보스 레이드는 타임어택과 같은 범위(객관식/단답형)를 지원한다 — 데미지 계산이
  // 문항 유형과 무관해서 좁힐 이유가 없다.
  const eligibleQuestions = questions.filter((question) => {
    if (question.type !== 'multipleChoice' && question.type !== 'shortAnswer') return false;
    if (eraFilter && !question.era.includes(eraFilter)) return false;
    if (unitFilter && !question.unit.includes(unitFilter)) return false;
    return true;
  });

  // 문제 풀 크기에 맞춰 보스 체력 기본값을 스스로 제안한다 — 교사가 직접 건드리면
  // 더는 자동으로 따라가지 않는다.
  useEffect(() => {
    if (hpTouched) return;
    setBossMaxHp(Math.max(30, eligibleQuestions.length * HP_PER_QUESTION));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleQuestions.length, hpTouched]);

  function handleStart(): void {
    if (!selectedClass) return;
    const participants = selectedClass.students
      .filter((student) => selectedStudentIds.has(student.id))
      .map((student) => ({ id: student.id, label: student.name }));

    if (participants.length === 0 || eligibleQuestions.length === 0) return;

    onStart({
      bossName: bossName.trim() || DEFAULT_BOSS_NAME,
      bossMaxHp,
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
      <h1>보스 레이드 설정</h1>

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
          보스 이름: <input value={bossName} onChange={(event) => setBossName(event.target.value)} style={{ width: '12rem' }} />
        </label>
        <label>
          보스 체력:{' '}
          <input
            type="number"
            min={30}
            value={bossMaxHp}
            onChange={(event) => {
              setHpTouched(true);
              setBossMaxHp(Number(event.target.value));
            }}
            style={{ width: '6rem' }}
          />
        </label>
        <label>
          제한시간(초):{' '}
          <input
            type="number"
            min={30}
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value))}
            style={{ width: '5rem' }}
          />
        </label>
      </div>

      <div className="field-row">
        <input placeholder="시대 필터" value={eraFilter} onChange={(event) => setEraFilter(event.target.value)} />
        <input placeholder="단원 필터" value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} />
        <span className="muted-text">사용 가능한 문제 {eligibleQuestions.length}개 (객관식/단답형)</span>
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

export default BossRaidSetup;
