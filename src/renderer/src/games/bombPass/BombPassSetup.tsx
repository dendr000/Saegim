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
import type { BombPassConfig } from './types';

const GAME_MODE = 'bombPass';
const DEFAULT_MIN_ROUND_SECONDS = 5;
const DEFAULT_MAX_ROUND_SECONDS = 15;
const DEFAULT_BOMB_PENALTY = 20;

type BombPassSetupProps = {
  onStart: (config: BombPassConfig) => void;
  onCancel: () => void;
};

function BombPassSetup({ onStart, onCancel }: BombPassSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('student');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [minRoundSeconds, setMinRoundSeconds] = useState(DEFAULT_MIN_ROUND_SECONDS);
  const [maxRoundSeconds, setMaxRoundSeconds] = useState(DEFAULT_MAX_ROUND_SECONDS);
  const [bombPenalty, setBombPenalty] = useState(DEFAULT_BOMB_PENALTY);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilterState>(() => loadQuestionFilter(GAME_MODE));

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
  }, []);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;

  // 학급을 바꾸면 그 학급에서 지난번에 쓴 참가자 선택을 되살린다 — 저장된 값이
  // 없으면 기존처럼 전체 선택으로 시작한다.
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

  // 폭탄 돌리기는 타임어택/보스 레이드와 같은 범위(객관식/단답형)를 지원한다.
  const typeSupportedQuestions = questions.filter(
    (question) => question.type === 'multipleChoice' || question.type === 'shortAnswer'
  );
  const eligibleQuestions = applyQuestionFilter(typeSupportedQuestions, questionFilter);

  const roundRangeValid = minRoundSeconds > 0 && maxRoundSeconds >= minRoundSeconds;
  const canStart =
    Boolean(selectedClass) && selectedIds.size >= 2 && eligibleQuestions.length > 0 && roundRangeValid;

  function handleStart(): void {
    if (!canStart || !selectedClass) return;
    const participants = participantOptionsFor(selectedClass, participantMode).filter((option) =>
      selectedIds.has(option.id)
    );
    if (participants.length < 2) return;

    onStart({
      minRoundSeconds,
      maxRoundSeconds,
      bombPenalty,
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
      <h1>폭탄 돌리기 설정</h1>

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
        <p className="error-text">폭탄을 돌리려면 참가자가 2명 이상 필요합니다.</p>
      )}

      <div className="field-row">
        <label>
          폭탄 대기시간(초) 최소:{' '}
          <input
            type="number"
            min={1}
            value={minRoundSeconds}
            onChange={(event) => setMinRoundSeconds(Number(event.target.value))}
            style={{ width: '4rem' }}
          />
        </label>
        <label>
          최대:{' '}
          <input
            type="number"
            min={1}
            value={maxRoundSeconds}
            onChange={(event) => setMaxRoundSeconds(Number(event.target.value))}
            style={{ width: '4rem' }}
          />
        </label>
        <label>
          폭탄 페널티 점수:{' '}
          <input
            type="number"
            min={0}
            value={bombPenalty}
            onChange={(event) => setBombPenalty(Number(event.target.value))}
            style={{ width: '5rem' }}
          />
        </label>
      </div>
      {!roundRangeValid && <p className="error-text">최대 대기시간은 최소 대기시간보다 크거나 같아야 합니다.</p>}
      <p className="muted-text">
        실제로 몇 초 만에 터질지는 이 범위 안에서 매번 무작위로 정해지고 교사·학생 모두에게 숨겨집니다.
      </p>

      <QuestionFilterPicker
        questions={typeSupportedQuestions}
        filter={questionFilter}
        onChange={handleQuestionFilterChange}
      />
      <p className="muted-text">사용 가능한 문제 {eligibleQuestions.length}개 (객관식/단답형만)</p>

      <button type="button" className="button-primary" onClick={handleStart} disabled={!canStart}>
        시작
      </button>
    </div>
  );
}

export default BombPassSetup;
