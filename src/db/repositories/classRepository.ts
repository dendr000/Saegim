import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { DATA_DIR } from '../../main/paths';
import { isSchoolClassDraft } from '../../shared/types/schoolClass';
import type { SchoolClass, SchoolClassDraft } from '../../shared/types/schoolClass';
import { readJsonFile, writeJsonFile } from './jsonFile';

const CLASSES_FILE = join(DATA_DIR, 'classes.json');

function loadAll(): SchoolClass[] {
  return readJsonFile<SchoolClass[]>(CLASSES_FILE, []);
}

function saveAll(classes: SchoolClass[]): void {
  writeJsonFile(CLASSES_FILE, classes);
}

export function getAllClasses(): SchoolClass[] {
  return loadAll();
}

export function createClass(draft: SchoolClassDraft): SchoolClass {
  if (!isSchoolClassDraft(draft)) {
    throw new Error('올바르지 않은 학급 데이터입니다.');
  }
  const schoolClass: SchoolClass = { ...draft, id: randomUUID() };
  const all = loadAll();
  all.push(schoolClass);
  saveAll(all);
  return schoolClass;
}

export function updateClass(id: string, draft: SchoolClassDraft): SchoolClass {
  if (!isSchoolClassDraft(draft)) {
    throw new Error('올바르지 않은 학급 데이터입니다.');
  }
  const all = loadAll();
  const index = all.findIndex((schoolClass) => schoolClass.id === id);
  if (index === -1) {
    throw new Error(`학급을 찾을 수 없습니다: ${id}`);
  }
  const updated: SchoolClass = { ...draft, id };
  all[index] = updated;
  saveAll(all);
  return updated;
}

export function deleteClass(id: string): void {
  const all = loadAll();
  saveAll(all.filter((schoolClass) => schoolClass.id !== id));
}
