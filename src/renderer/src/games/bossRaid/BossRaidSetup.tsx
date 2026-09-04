import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import type { Question } from '../../../../shared/types/question';
import ParticipantPicker, {
  loadParticipantSelection,
  participantOptionsFor,
  saveParticipantSelection,
  type ParticipantMode
} from '../_shared/ParticipantPicker';
import QuestionFilterPicker, {
  applyQuestionFilter,
  loadQuestionFilter,
  saveQuestionFilter,
  type QuestionFilterState
} from '../_shared/QuestionFilterPicker';
import type { BossRaidConfig } from './types';

const GAME_MODE = 'bossRaid';

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
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('student');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bossName, setBossName] = useState(DEFAULT_BOSS_NAME);
  const [bossMaxHp, setBossMaxHp] = useState(300);
  const [hpTouched, setHpTouched] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilterState>(() => loadQuestionFilter(GAME_MODE));

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
  }, []);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;

  // 학급을 바꾸면 그 학급에서 지난번에 쓴 참가자 선택을 되살린다("같은 배열로 다시
  // 할 수도 있으니") — 저장된 값이 없으면 기존처럼 전체 선택으로 시작한다.
  useEffect(() => {
    if (!selectedClassId) {
      setSelectedIds(new Set());
      return;
    }
    const persisted = loadParticipantSelection(GAME_MODE, selectedClassId);
    if (persisted) {
      const validIds = new Set(participantOptionsFor(selectedClass, persisted.mode).map((option) => option.id));
      const restoredIds = persisted.selectedIds.filter((id) => validIds.has(id));
      setParticipantMode(persisted.mode);
      setSelectedIds(restoredIds.length > 0 ? new Set(restoredIds) : validIds);
      return;
    }
    setParticipantMode('student');
    setSelectedIds(new Set(participantOptionsFor(selectedClass, 'student').map((option) => option.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  function handleParticipantModeChange(nextMode: ParticipantMode): void {
    setParticipantMode(nextMode);
    const ids = new Set(participantOptionsFor(selectedClass, nextMode).map((option) => option.id));
    setSelectedIds(ids);
    if (selectedClassId) {
      saveParticipantSelection(GAME_MODE, selectedClassId, { mode: nextMode, selectedIds: Array.from(ids) });
    }
  }

  function toggleParticipant(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (selectedClassId) {
        saveParticipantSelection(GAME_MODE, selectedClassId, {
          mode: participantMode,
          selectedIds: Array.from(next)
        });
      }
      return next;
    });
  }

  function handleQuestionFilterChange(nextFilter: QuestionFilterState): void {
    setQuestionFilter(nextFilter);
    saveQuestionFilter(GAME_MODE, nextFilter);
  }

  // 보스 레이드는 타임어택과 같은 범위(객관식/단답형)를 지원한다 — 데미지 계산이
  // 문항 유형과 무관해서 좁힐 이유가 없다.
  const typeSupportedQuestions = questions.filter(
    (question) => question.type === 'multipleChoice' || question.type === 'shortAnswer'
  );
  const eligibleQuestions = applyQuestionFilter(typeSupportedQuestions, questionFilter);

  // 문제 풀 크기에 맞춰 보스 체력 기본값을 스스로 제안한다 — 교사가 직접 건드리면
  // 더는 자동으로 따라가지 않는다.
  useEffect(() => {
    if (hpTouched) return;
    setBossMaxHp(Math.max(30, eligibleQuestions.length * HP_PER_QUESTION));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleQuestions.length, hpTouched]);

  function handleStart(): void {
    if (!selectedClass) return;
    const participants = participantOptionsFor(selectedClass, participantMode).filter((option) =>
      selectedIds.has(option.id)
    );

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
        <ParticipantPicker
          schoolClass={selectedClass}
          mode={participantMode}
          onModeChange={handleParticipantModeChange}
          selectedIds={selectedIds}
          onToggle={toggleParticipant}
        />
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

      <QuestionFilterPicker
        questions={typeSupportedQuestions}
        filter={questionFilter}
        onChange={handleQuestionFilterChange}
      />
      <p className="muted-text">사용 가능한 문제 {eligibleQuestions.length}개 (객관식/단답형)</p>

      <button
        type="button"
        className="button-primary"
        onClick={handleStart}
        disabled={!selectedClass || selectedIds.size === 0 || eligibleQuestions.length === 0}
      >
        시작
      </button>
    </div>
  );
}

export default BossRaidSetup;
