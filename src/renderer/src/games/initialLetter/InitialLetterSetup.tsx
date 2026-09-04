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
import type { InitialLetterConfig, InitialLetterMode } from './types';

const GAME_MODE = 'initialLetter';

type InitialLetterSetupProps = {
  onStart: (config: InitialLetterConfig) => void;
  onCancel: () => void;
};

function InitialLetterSetup({ onStart, onCancel }: InitialLetterSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('student');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<InitialLetterMode>('hotSeat');
  const [durationSeconds, setDurationSeconds] = useState(60);
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

  // 초성 퀴즈는 단답형만 지원한다 — 객관식은 보기가 화면에 다 보여서 초성으로 맞히는
  // 게임이 성립하지 않는다.
  const typeSupportedQuestions = questions.filter((question) => question.type === 'shortAnswer');
  const eligibleQuestions = applyQuestionFilter(typeSupportedQuestions, questionFilter);

  function handleStart(): void {
    if (!selectedClass) return;
    const participants = participantOptionsFor(selectedClass, participantMode).filter((option) =>
      selectedIds.has(option.id)
    );

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

      <QuestionFilterPicker
        questions={typeSupportedQuestions}
        filter={questionFilter}
        onChange={handleQuestionFilterChange}
      />
      <p className="muted-text">사용 가능한 문제 {eligibleQuestions.length}개 (단답형만)</p>

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

export default InitialLetterSetup;
