import { useEffect, useState } from 'react';
import type { SchoolClass } from '../../../../shared/types/schoolClass';
import ClassRoster from './ClassRoster';
import TeamManager from './TeamManager';
import { PeopleIcon, PlusIcon, TrashIcon } from './icons';

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
      <div className="page">
        <button type="button" className="page-back" onClick={() => setSelectedId(null)}>
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
    <div className="page">
      <button type="button" className="page-back" onClick={onBack}>
        ← 홈
      </button>
      <h1>학급 관리</h1>
      <p className="muted-text">학급을 추가하고, 카드를 눌러 학생·팀 명단을 관리하세요.</p>

      <div className="class-toolbar">
        <input
          placeholder="학급 이름"
          value={newClassName}
          onChange={(event) => setNewClassName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleCreateClass();
          }}
        />
        <button type="button" className="button-primary button-lg icon-button" onClick={handleCreateClass}>
          <PlusIcon /> 학급 추가
        </button>
      </div>

      {loading ? (
        <p className="muted-text">불러오는 중...</p>
      ) : classes.length === 0 ? (
        <div className="class-empty">
          <PeopleIcon />
          <p>아직 등록된 학급이 없습니다. 위에서 첫 학급을 추가해보세요.</p>
        </div>
      ) : (
        <div className="class-grid">
          {classes.map((schoolClass, index) => (
            <div
              key={schoolClass.id}
              className="class-card"
              role="button"
              tabIndex={0}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setSelectedId(schoolClass.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedId(schoolClass.id);
                }
              }}
            >
              <PeopleIcon className="class-card-icon" />
              <span className="class-card-name">{schoolClass.name}</span>
              <span className="class-card-count">{schoolClass.students.length}명</span>
              <button
                type="button"
                className="class-card-delete"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteClass(schoolClass.id);
                }}
              >
                <TrashIcon /> 삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClassManager;
