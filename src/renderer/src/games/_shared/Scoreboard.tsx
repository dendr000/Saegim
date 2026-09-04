import { useState } from 'react';
import type { ParticipantScore } from './types';

type ScoreboardProps = {
  entries: ParticipantScore[];
  // 있으면 교사가 점수를 직접 고칠 수 있는 UI가 각 행에 붙는다.
  // (판정 실수·점수 오류 등 예외 상황에 교사가 수동 개입할 수 있어야 함)
  onAdjustScore?: (id: string, newScore: number) => void;
};

function Scoreboard({ entries, onAdjustScore }: ScoreboardProps) {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');

  function startEdit(entry: ParticipantScore): void {
    setEditingId(entry.id);
    setDraftValue(String(entry.score));
  }

  function saveEdit(id: string): void {
    const parsed = Number(draftValue);
    if (!Number.isNaN(parsed)) {
      onAdjustScore?.(id, parsed);
    }
    setEditingId(null);
  }

  return (
    <table className="stage-scoreboard">
      <thead>
        <tr>
          <th>순위</th>
          <th>이름</th>
          <th>점수</th>
          {onAdjustScore && <th>수정</th>}
        </tr>
      </thead>
      <tbody>
        {sorted.map((entry, index) => (
          <tr key={entry.id}>
            <td>{index + 1}</td>
            <td>{entry.label}</td>
            <td>
              {editingId === entry.id ? (
                <input
                  type="number"
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  style={{ width: '5rem' }}
                  autoFocus
                />
              ) : (
                entry.score
              )}
            </td>
            {onAdjustScore && (
              <td>
                {editingId === entry.id ? (
                  <>
                    <button type="button" className="stage-button stage-button-small" onClick={() => saveEdit(entry.id)}>
                      저장
                    </button>{' '}
                    <button
                      type="button"
                      className="stage-button stage-button-small"
                      onClick={() => setEditingId(null)}
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button type="button" className="stage-button stage-button-small" onClick={() => startEdit(entry)}>
                    수정
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Scoreboard;
