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
import type { GoldenBellConfig } from './types';

const GAME_MODE = 'goldenBell';

type GoldenBellSetupProps = {
  onStart: (config: GoldenBellConfig) => void;
  onCancel: () => void;
};

function GoldenBellSetup({ onStart, onCancel }: GoldenBellSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('student');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // 시작 시점에 미리 부활권을 줄 참가자 — 전원에게 자동으로 주지 않고 교사가
  // 상황에 따라 고른다(기본값: 아무도 없음).
  const [revivalGrantedIds, setRevivalGrantedIds] = useState<Set<string>>(new Set());
  const [questionFilter, setQuestionFilter] = useState<QuestionFilterState>(() => loadQuestionFilter(GAME_MODE));

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
  }, []);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;

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
    setRevivalGrantedIds(new Set());
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

  function toggleRevivalGrant(id: string): void {
    setRevivalGrantedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleQuestionFilterChange(nextFilter: QuestionFilterState): void {
    setQuestionFilter(nextFilter);
    saveQuestionFilter(GAME_MODE, nextFilter);
  }

  // 골든벨은 타임어택과 같은 범위(객관식/단답형)를 지원한다.
  const typeSupportedQuestions = questions.filter(
    (question) => question.type === 'multipleChoice' || question.type === 'shortAnswer'
  );
  const eligibleQuestions = applyQuestionFilter(typeSupportedQuestions, questionFilter);

  const selectedParticipantOptions = selectedClass
    ? participantOptionsFor(selectedClass, participantMode).filter((option) => selectedIds.has(option.id))
    : [];

  const canStart = Boolean(selectedClass) && selectedIds.size >= 2 && eligibleQuestions.length > 0;

  function handleStart(): void {
    if (!canStart || !selectedClass) return;
    if (selectedParticipantOptions.length < 2) return;

    onStart({
      participants: selectedParticipantOptions,
      initialRevivalParticipantIds: Array.from(revivalGrantedIds).filter((id) => selectedIds.has(id)),
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
      <h1>골든벨 서바이벌 설정</h1>

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

      {selectedClass && selectedIds.size < 2 && (
        <p className="error-text">골든벨은 참가자가 2명 이상 필요합니다.</p>
      )}

      {selectedParticipantOptions.length > 0 && (
        <div className="field-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <p className="muted-text">부활권을 미리 줄 참가자(선택, 첫 오답을 봐줍니다):</p>
          {selectedParticipantOptions.map((option) => (
            <label key={option.id} style={{ marginRight: '0.75rem' }}>
              <input
                type="checkbox"
                checked={revivalGrantedIds.has(option.id)}
                onChange={() => toggleRevivalGrant(option.id)}
              />{' '}
              {option.label}
            </label>
          ))}
          <p className="muted-text">게임 중에도 언제든 특정 참가자에게 부활권을 추가로 줄 수 있습니다.</p>
        </div>
      )}

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

export default GoldenBellSetup;
