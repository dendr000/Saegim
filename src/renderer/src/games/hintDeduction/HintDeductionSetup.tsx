import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import type { Question } from '../../../../shared/types/question';
import ParticipantPicker, { participantOptionsFor, type ParticipantMode } from '../_shared/ParticipantPicker';
import QuestionFilterPicker, {
  applyQuestionFilter,
  createEmptyQuestionFilter,
  type QuestionFilterState
} from '../_shared/QuestionFilterPicker';
import type { HintDeductionConfig, HintDeductionMode } from './types';

type HintDeductionSetupProps = {
  onStart: (config: HintDeductionConfig) => void;
  onCancel: () => void;
};

function HintDeductionSetup({ onStart, onCancel }: HintDeductionSetupProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('student');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<HintDeductionMode>('hotSeat');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilterState>(createEmptyQuestionFilter());

  useEffect(() => {
    window.classes.list().then(setClasses);
    window.questions.list().then(setQuestions);
  }, []);

  const selectedClass = classes.find((schoolClass) => schoolClass.id === selectedClassId) ?? null;

  useEffect(() => {
    setSelectedIds(new Set(participantOptionsFor(selectedClass, participantMode).map((option) => option.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, participantMode]);

  function toggleParticipant(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 힌트 차감형은 단답형만 지원한다 — 객관식은 힌트로 보기를 지우는 등 다른 메커니즘이
  // 필요해져서, 우선 초성 퀴즈와 같은 범위(단답형)로 좁혀둔다.
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
      <h1>힌트 차감형 설정</h1>

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
          onModeChange={setParticipantMode}
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

      <QuestionFilterPicker questions={typeSupportedQuestions} filter={questionFilter} onChange={setQuestionFilter} />
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

export default HintDeductionSetup;
