import type { ParticipantScore } from './types';

type ScoreboardProps = {
  entries: ParticipantScore[];
};

const cellStyle = { border: '1px solid #ddd', padding: '0.25rem 0.5rem', textAlign: 'left' as const };

function Scoreboard({ entries }: ScoreboardProps) {
  const sorted = [...entries].sort((a, b) => b.score - a.score);

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={cellStyle}>순위</th>
          <th style={cellStyle}>이름</th>
          <th style={cellStyle}>점수</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((entry, index) => (
          <tr key={entry.id}>
            <td style={cellStyle}>{index + 1}</td>
            <td style={cellStyle}>{entry.label}</td>
            <td style={cellStyle}>{entry.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Scoreboard;
