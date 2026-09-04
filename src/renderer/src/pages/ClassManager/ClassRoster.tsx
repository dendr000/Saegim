import { useState } from 'react';
import type { Student, Team } from '../../../../shared/types/schoolClass';
import type { ParsedRosterEntry } from '../../../../shared/schoolClassRoster';
import RosterPasteImport from './RosterPasteImport';

type ClassRosterProps = {
  students: Student[];
  teams: Team[];
  onChange: (students: Student[]) => void;
};

const cellStyle = { border: '1px solid #ddd', padding: '0.25rem 0.5rem', textAlign: 'left' as const };

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

      <div style={{ marginBottom: '0.5rem' }}>
        <input
          placeholder="번호"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          style={{ width: '4rem' }}
        />{' '}
        <input placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} />{' '}
        <button type="button" onClick={handleAddOne}>
          학생 추가
        </button>{' '}
        <button type="button" onClick={() => setShowPasteImport((value) => !value)}>
          명단 붙여넣기
        </button>
      </div>

      {showPasteImport && (
        <RosterPasteImport onImport={handlePasteImport} onClose={() => setShowPasteImport(false)} />
      )}

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={cellStyle}>번호</th>
            <th style={cellStyle}>이름</th>
            <th style={cellStyle}>소속팀</th>
            <th style={cellStyle}>작업</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((student) => (
            <tr key={student.id}>
              <td style={cellStyle}>{student.number ?? '-'}</td>
              <td style={cellStyle}>{student.name}</td>
              <td style={cellStyle}>{teamNameOf(student.id)}</td>
              <td style={cellStyle}>
                <button type="button" onClick={() => handleRemove(student.id)}>
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClassRoster;
