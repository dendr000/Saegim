import { useState } from 'react';
import type { Question } from '../../../../shared/types/question';
import AnswerConfirm from '../_shared/AnswerConfirm';
import type { ParticipantRuntimeState } from './types';
import { maxHintsFor, revealHintText } from './hints';
import { HINT_PENALTY_RATIO } from './scoring';

type SimultaneousHintControlsProps = {
  question: Question;
  participants: ParticipantRuntimeState[];
  hintsRevealed: number;
  onRevealHint: () => void;
  onSubmit: (participantId: string, value: unknown) => void;
  onSkip: () => void;
  onEndSession: () => void;
};

function SimultaneousHintControls({
  question,
  participants,
  hintsRevealed,
  onRevealHint,
  onSubmit,
  onSkip,
  onEndSession
}: SimultaneousHintControlsProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');

  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId);
  const trimmedSearch = searchText.trim();
  const searchResults = trimmedSearch
    ? participants.filter((participant) => participant.label.includes(trimmedSearch))
    : [];

  function selectParticipant(id: string): void {
    setSelectedParticipantId(id);
    setSearchText('');
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' && searchResults.length > 0) {
      event.preventDefault();
      selectParticipant(searchResults[0].id);
    }
  }

  if (question.type !== 'shortAnswer') {
    return <p className="stage-text">이 유형은 힌트 차감형에서 지원하지 않습니다.</p>;
  }

  const maxHints = maxHintsFor(question.payload.answer);
  const hintExhausted = hintsRevealed >= maxHints;
  const deductionPercent = Math.round(Math.min(1, hintsRevealed * HINT_PENALTY_RATIO) * 100);

  return (
    <div>
      <p className="stage-question">{question.payload.question}</p>

      {hintsRevealed > 0 && (
        <p className="stage-question" style={{ fontSize: '1.5rem' }}>
          {revealHintText(question.payload.answer, hintsRevealed)}
        </p>
      )}

      <div className="button-row">
        <button type="button" className="stage-button" onClick={onRevealHint} disabled={hintExhausted}>
          힌트 보기 ({hintsRevealed}/{maxHints}회 사용)
        </button>
        <span className="stage-text stage-muted">
          {hintsRevealed > 0 ? `지금 정답 처리 시 점수 -${deductionPercent}%` : '아직 힌트를 쓰지 않았습니다'}
        </span>
      </div>

      <div className="stage-panel">
        <p className="stage-text">
          답한 학생:{' '}
          {selectedParticipant ? <strong>{selectedParticipant.label}</strong> : <em>선택 안 됨</em>}
        </p>
        <input
          type="text"
          placeholder="이름 검색 (학생이 많을 때)"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {trimmedSearch && (
          <div
            style={{
              border: '1px solid var(--stage-border)',
              maxHeight: '180px',
              overflowY: 'auto',
              marginTop: '0.5rem',
              borderRadius: '0.5rem'
            }}
          >
            {searchResults.length === 0 && (
              <p className="stage-text" style={{ padding: '0.25rem 0.75rem' }}>
                일치하는 학생 없음
              </p>
            )}
            {searchResults.map((participant) => (
              <button
                key={participant.id}
                type="button"
                className="stage-button"
                onClick={() => selectParticipant(participant.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', margin: 0, borderRadius: 0 }}
              >
                {participant.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnswerConfirm key={question.id}>
        <p className="stage-text">
          정답: <strong>{question.payload.answer}</strong>
          {question.payload.acceptableAnswers && question.payload.acceptableAnswers.length > 0
            ? ` (${question.payload.acceptableAnswers.join(', ')}도 정답)`
            : ''}
        </p>
      </AnswerConfirm>
      <p className="stage-text">학생이 말한 답이 위 정답과 같나요?</p>
      <button
        type="button"
        className="stage-button stage-button-primary"
        disabled={!selectedParticipantId}
        onClick={() => onSubmit(selectedParticipantId, { judgedCorrect: true })}
      >
        정답 처리
      </button>
      <button
        type="button"
        className="stage-button"
        disabled={!selectedParticipantId}
        onClick={() => onSubmit(selectedParticipantId, { judgedCorrect: false })}
      >
        오답 처리
      </button>

      <div style={{ marginTop: '1rem' }}>
        <button type="button" className="stage-button stage-button-small" onClick={onSkip}>
          다음 문제 (스킵)
        </button>{' '}
        <button type="button" className="stage-button stage-button-small" onClick={onEndSession}>
          게임 종료
        </button>
      </div>
    </div>
  );
}

export default SimultaneousHintControls;
