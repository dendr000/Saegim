import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from '../../main/paths';

const MAPS_DIR = join(DATA_DIR, 'maps');

function isSafeMapFileName(fileName: string): boolean {
  return /^[a-zA-Z0-9_-]+\.svg$/.test(fileName);
}

export function listMapFiles(): string[] {
  try {
    return readdirSync(MAPS_DIR).filter((name) => name.toLowerCase().endsWith('.svg'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export function getMapContent(fileName: string): string {
  if (!isSafeMapFileName(fileName)) {
    throw new Error(`올바르지 않은 지도 파일명: ${fileName}`);
  }
  return readFileSync(join(MAPS_DIR, fileName), 'utf-8');
}
