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
import type { CardMatchingConfig } from './types';

const GAME_MODE = 'cardMatching';
const DEFAULT_PAIR_COUNT = 8;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type CardMatchingSetupProps = {
  onStart: (config: CardMatchingConfig) => void;
  onCancel: () => void;
};

function CardMatchingSetup({ onStart, onCancel }: CardMatchingSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('student');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pairCount, setPairCount] = useState(DEFAULT_PAIR_COUNT);
  const [pairCountTouched, setPairCountTouched] = useState(false);
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

  // 용어-정의 카드 쌍을 만들 수 있는 건 단답형뿐이다 — 객관식은 "정의"에 해당하는
  // 단일 텍스트가 명확하지 않다.
  const typeSupportedQuestions = questions.filter((question) => question.type === 'shortAnswer');
  const eligibleQuestions = applyQuestionFilter(typeSupportedQuestions, questionFilter);

  // 문제 풀 크기에 맞춰 카드 쌍 개수 기본값을 스스로 제안한다 — 교사가 직접
  // 건드리면 더는 자동으로 따라가지 않는다.
  useEffect(() => {
    if (pairCountTouched) return;
    setPairCount(Math.min(DEFAULT_PAIR_COUNT, eligibleQuestions.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleQuestions.length, pairCountTouched]);

  const canStart = Boolean(selectedClass) && selectedIds.size >= 1 && pairCount >= 1 && pairCount <= eligibleQuestions.length;

  function handleStart(): void {
    if (!canStart || !selectedClass) return;
    const participants = participantOptionsFor(selectedClass, participantMode).filter((option) =>
      selectedIds.has(option.id)
    );
    if (participants.length === 0) return;

    const sampledQuestions = shuffle(eligibleQuestions).slice(0, pairCount);

    onStart({
      participants,
      questions: sampledQuestions,
      classId: selectedClass.id,
      className: selectedClass.name
    });
  }

  return (
    <div className="page">
      <button type="button" className="page-back" onClick={onCancel}>
        ← 뒤로
      </button>
      <h1>카드 매칭 설정</h1>

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

      <QuestionFilterPicker
        questions={typeSupportedQuestions}
        filter={questionFilter}
        onChange={handleQuestionFilterChange}
      />
      <p className="muted-text">사용 가능한 문제 {eligibleQuestions.length}개 (단답형만)</p>

      <div className="field-row">
        <label>
          카드 쌍 개수:{' '}
          <input
            type="number"
            min={1}
            max={Math.max(1, eligibleQuestions.length)}
            value={pairCount}
            onChange={(event) => {
              setPairCountTouched(true);
              setPairCount(Number(event.target.value));
            }}
            style={{ width: '4rem' }}
          />
        </label>
      </div>
      {pairCount > eligibleQuestions.length && (
        <p className="error-text">카드 쌍 개수는 사용 가능한 문제 수({eligibleQuestions.length}개)보다 많을 수 없습니다.</p>
      )}

      <button type="button" className="button-primary" onClick={handleStart} disabled={!canStart}>
        시작
      </button>
    </div>
  );
}

export default CardMatchingSetup;
