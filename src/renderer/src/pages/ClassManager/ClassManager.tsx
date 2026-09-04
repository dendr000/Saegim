import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import ClassRoster from './ClassRoster';
import TeamManager from './TeamManager';

type ClassManagerProps = {
  onBack: () => void;
};

function ClassManager({ onBack }: ClassManagerProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh(): Promise<void> {
    setLoading(true);
    const all = await window.classes.list();
    setClasses(all);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = classes.find((schoolClass) => schoolClass.id === selectedId) ?? null;

  async function handleCreateClass(): Promise<void> {
    if (!newClassName.trim()) return;
    const created = await window.classes.create({ name: newClassName.trim(), students: [], teams: [] });
    setNewClassName('');
    await refresh();
    setSelectedId(created.id);
  }

  async function handleDeleteClass(id: string): Promise<void> {
    const confirmed = window.confirm('이 학급을 삭제할까요? 학생·팀 정보도 함께 삭제됩니다.');
    if (!confirmed) return;
    await window.classes.remove(id);
    if (selectedId === id) setSelectedId(null);
    await refresh();
  }

  async function persist(patch: Partial<Pick<SchoolClass, 'students' | 'teams'>>): Promise<void> {
    if (!selected) return;
    await window.classes.update(selected.id, {
      name: selected.name,
      students: selected.students,
      teams: selected.teams,
      ...patch
    });
    await refresh();
  }

  if (selected) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <button type="button" onClick={() => setSelectedId(null)}>
          ← 학급 목록
        </button>
        <h1>{selected.name}</h1>
        <ClassRoster
          students={selected.students}
          teams={selected.teams}
          onChange={(students) => persist({ students })}
        />
        <TeamManager students={selected.students} teams={selected.teams} onChange={(teams) => persist({ teams })} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <button type="button" onClick={onBack}>
        ← 홈
      </button>
      <h1>학급 관리</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="학급 이름 (예: 1학년 3반)"
          value={newClassName}
          onChange={(event) => setNewClassName(event.target.value)}
        />{' '}
        <button type="button" onClick={handleCreateClass}>
          학급 추가
        </button>
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <ul>
          {classes.map((schoolClass) => (
            <li key={schoolClass.id}>
              <button type="button" onClick={() => setSelectedId(schoolClass.id)}>
                {schoolClass.name}
              </button>{' '}
              ({schoolClass.students.length}명){' '}
              <button type="button" onClick={() => handleDeleteClass(schoolClass.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ClassManager;
