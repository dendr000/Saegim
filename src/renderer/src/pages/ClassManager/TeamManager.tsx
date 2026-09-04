import { useState } from 'react';
import type { Student, Team } from '../../../../shared/types/schoolClass';

type TeamManagerProps = {
  students: Student[];
  teams: Team[];
  onChange: (teams: Team[]) => void;
};

function TeamManager({ students, teams, onChange }: TeamManagerProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [autoTeamCount, setAutoTeamCount] = useState('2');

  function handleAddTeam(): void {
    if (!newTeamName.trim()) return;
    onChange([...teams, { id: crypto.randomUUID(), name: newTeamName.trim(), studentIds: [] }]);
    setNewTeamName('');
  }

  function handleRemoveTeam(teamId: string): void {
    onChange(teams.filter((team) => team.id !== teamId));
  }

  function handleAssign(studentId: string, teamId: string): void {
    const next = teams.map((team) => ({
      ...team,
      studentIds: team.studentIds.filter((id) => id !== studentId)
    }));
    const target = next.find((team) => team.id === teamId);
    if (target) {
      target.studentIds.push(studentId);
    }
    onChange(next);
  }

  function handleAutoSplit(): void {
    const count = Number(autoTeamCount);
    if (!Number.isInteger(count) || count < 2 || students.length === 0) return;

    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newTeams: Team[] = Array.from({ length: count }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `${index + 1}팀`,
      studentIds: []
    }));

    shuffled.forEach((student, index) => {
      newTeams[index % count].studentIds.push(student.id);
    });

    onChange(newTeams);
  }

  return (
    <div>
      <h3>팀 구성</h3>

      <div className="field-row">
        <input placeholder="팀 이름" value={newTeamName} onChange={(event) => setNewTeamName(event.target.value)} />
        <button type="button" className="button-primary" onClick={handleAddTeam}>
          팀 추가
        </button>
        <input
          type="number"
          min={2}
          value={autoTeamCount}
          onChange={(event) => setAutoTeamCount(event.target.value)}
          style={{ width: '3rem' }}
        />
        <button type="button" onClick={handleAutoSplit} disabled={students.length === 0}>
          팀으로 자동 나누기
        </button>
      </div>

      {teams.length > 0 && (
        <ul>
          {teams.map((team) => (
            <li key={team.id}>
              {team.name} ({team.studentIds.length}명){' '}
              <button type="button" className="button-danger" onClick={() => handleRemoveTeam(team.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>학생</th>
              <th>소속팀</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const currentTeam = teams.find((team) => team.studentIds.includes(student.id));
              return (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>
                    <select
                      value={currentTeam?.id ?? ''}
                      onChange={(event) => handleAssign(student.id, event.target.value)}
                    >
                      <option value="">미배정</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeamManager;
