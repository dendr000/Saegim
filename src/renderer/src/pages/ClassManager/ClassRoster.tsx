import { useState } from 'react';
import type { Student, Team } from '../../../../shared/types/schoolClass';
import type { ParsedRosterEntry } from '../../../../shared/schoolClassRoster';
import RosterPasteImport from './RosterPasteImport';

type ClassRosterProps = {
  students: Student[];
  teams: Team[];
  onChange: (students: Student[]) => void;
};

function ClassRoster({ students, teams, onChange }: ClassRosterProps) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [showPasteImport, setShowPasteImport] = useState(false);

  function teamNameOf(studentId: string): string {
    const team = teams.find((candidate) => candidate.studentIds.includes(studentId));
    return team ? team.name : '미배정';
  }

  function handleAddOne(): void {
    if (!name.trim()) return;
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: name.trim(),
      ...(number.trim() ? { number: Number(number.trim()) } : {})
    };
    onChange([...students, newStudent]);
    setName('');
    setNumber('');
  }

  function handlePasteImport(entries: ParsedRosterEntry[]): void {
    const newStudents: Student[] = entries.map((entry) => ({
      id: crypto.randomUUID(),
      name: entry.name,
      ...(entry.number !== undefined ? { number: entry.number } : {})
    }));
    onChange([...students, ...newStudents]);
    setShowPasteImport(false);
  }

  function handleRemove(studentId: string): void {
    onChange(students.filter((student) => student.id !== studentId));
  }

  const sorted = [...students].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3>학생 명단 ({students.length}명)</h3>

      <div className="field-row">
        <input
          placeholder="번호"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          style={{ width: '4rem' }}
        />
        <input placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} />
        <button type="button" className="button-primary" onClick={handleAddOne}>
          학생 추가
        </button>
        <button type="button" onClick={() => setShowPasteImport((value) => !value)}>
          명단 붙여넣기
        </button>
      </div>

      {showPasteImport && (
        <RosterPasteImport onImport={handlePasteImport} onClose={() => setShowPasteImport(false)} />
      )}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>이름</th>
              <th>소속팀</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((student) => (
              <tr key={student.id}>
                <td>{student.number ?? '-'}</td>
                <td>{student.name}</td>
                <td>{teamNameOf(student.id)}</td>
                <td>
                  <button type="button" className="button-danger" onClick={() => handleRemove(student.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClassRoster;
