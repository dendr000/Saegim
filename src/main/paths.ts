import { app } from 'electron';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * 포터블 exe가 실제로 위치한 폴더를 찾는다.
 * - 개발 모드: 프로젝트 루트
 * - 포터블 실행: electron-builder가 심어주는 PORTABLE_EXECUTABLE_DIR
 *   (exe는 실행 시 %TEMP%에 압축이 풀려 거기서 구동되므로, execPath/getPath('exe')는
 *    임시 폴더를 가리켜 쓸 수 없다 — 이 환경변수가 원래 exe 폴더를 알려준다)
 * - 그 외 패키징된 실행(예: 압축 풀린 폴더 직접 실행): exe가 있는 폴더
 */
function resolveAppRootDir(): string {
  if (!app.isPackaged) {
    return app.getAppPath();
  }

  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  if (portableDir) {
    return portableDir;
  }

  return dirname(app.getPath('exe'));
}

export const APP_ROOT_DIR = resolveAppRootDir();
export const DATA_DIR = join(APP_ROOT_DIR, 'data');

export function initializePortablePaths(): void {
  mkdirSync(DATA_DIR, { recursive: true });
  app.setPath('userData', DATA_DIR);

  console.log('[paths] APP_ROOT_DIR =', APP_ROOT_DIR);
  console.log('[paths] DATA_DIR =', DATA_DIR);
}
