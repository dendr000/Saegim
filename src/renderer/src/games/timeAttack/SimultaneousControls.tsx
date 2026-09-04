import { useState } from 'react';
import type { Question } from '../../../../shared/types/question';
import type { ParticipantRuntimeState } from './types';

type SimultaneousControlsProps = {
  question: Question;
  participants: ParticipantRuntimeState[];
  onSubmit: (participantId: string, value: unknown) => void;
  onSkip: () => void;
  onEndSession: () => void;
};

function SimultaneousControls({ question, participants, onSubmit, onSkip, onEndSession }: SimultaneousControlsProps) {
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

  return (
    <div>
      <p style={{ fontSize: '1.5rem' }}>{question.payload.question}</p>

      <div style={{ marginBottom: '0.5rem' }}>
        <p>
          답한 학생:{' '}
          {selectedParticipant ? <strong>{selectedParticipant.label}</strong> : <em>선택 안 됨</em>}
        </p>
        <input
          type="text"
          placeholder="이름 검색 (학생이 많을 때)"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        {trimmedSearch && (
          <div style={{ border: '1px solid #ccc', maxHeight: '150px', overflowY: 'auto', marginTop: '0.25rem' }}>
            {searchResults.length === 0 && <p style={{ padding: '0.25rem 0.5rem' }}>일치하는 학생 없음</p>}
            {searchResults.map((participant) => (
              <button
                key={participant.id}
                type="button"
                onClick={() => selectParticipant(participant.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.25rem 0.5rem' }}
              >
                {participant.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {question.type === 'multipleChoice' ? (
        <div>
          {question.payload.choices.map((choice, index) => (
            <button
              key={index}
              type="button"
              disabled={!selectedParticipantId}
              onClick={() => onSubmit(selectedParticipantId, { choiceIndex: index })}
              style={{ margin: '0.25rem', padding: '0.5rem 1rem' }}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : question.type === 'shortAnswer' ? (
        <div>
          <p>
            정답: <strong>{question.payload.answer}</strong>
            {question.payload.acceptableAnswers && question.payload.acceptableAnswers.length > 0
              ? ` (${question.payload.acceptableAnswers.join(', ')}도 정답)`
              : ''}
          </p>
          <p>학생이 말한 답이 위 정답과 같나요?</p>
          <button
            type="button"
            disabled={!selectedParticipantId}
            onClick={() => onSubmit(selectedParticipantId, { judgedCorrect: true })}
            style={{ margin: '0.25rem', padding: '0.5rem 1rem' }}
          >
            정답 처리
          </button>
          <button
            type="button"
            disabled={!selectedParticipantId}
            onClick={() => onSubmit(selectedParticipantId, { judgedCorrect: false })}
            style={{ margin: '0.25rem', padding: '0.5rem 1rem' }}
          >
            오답 처리
          </button>
        </div>
      ) : (
        <p>이 유형은 아직 타임어택에서 지원하지 않습니다.</p>
      )}

      <div style={{ marginTop: '0.5rem' }}>
        <button type="button" onClick={onSkip}>
          다음 문제 (스킵)
        </button>{' '}
        <button type="button" onClick={onEndSession}>
          게임 종료
        </button>
      </div>
    </div>
  );
}

export default SimultaneousControls;
