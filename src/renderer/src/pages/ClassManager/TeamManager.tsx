import { useState } from 'react';
import type { Student, Team } from '../../../../shared/types/schoolClass';
import { PlusIcon, ShuffleIcon, TrashIcon } from './icons';

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
      <div className="section-header">
        <h3>팀 구성</h3>
        {teams.length > 0 && <span className="section-count">{teams.length}개 팀</span>}
      </div>

      <div className="field-row">
        <input
          placeholder="팀 이름"
          value={newTeamName}
          onChange={(event) => setNewTeamName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAddTeam();
          }}
        />
        <button type="button" className="button-primary button-lg icon-button" onClick={handleAddTeam}>
          <PlusIcon /> 팀 추가
        </button>
        <input
          type="number"
          min={2}
          value={autoTeamCount}
          onChange={(event) => setAutoTeamCount(event.target.value)}
          style={{ width: '3rem' }}
        />
        <button
          type="button"
          className="icon-button"
          onClick={handleAutoSplit}
          disabled={students.length === 0}
        >
          <ShuffleIcon /> 팀으로 자동 나누기
        </button>
      </div>

      {teams.length > 0 && (
        <div className="team-grid">
          {teams.map((team, index) => (
            <div key={team.id} className="team-card" style={{ animationDelay: `${index * 0.05}s` }}>
              <span className="team-card-name">{team.name}</span>
              <span className="team-card-count">{team.studentIds.length}명</span>
              <button
                type="button"
                className="team-card-delete"
                onClick={() => handleRemoveTeam(team.id)}
                aria-label={`${team.name} 삭제`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="table-scroll">
        <table className="data-table roster-table">
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
