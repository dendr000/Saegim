# 포터블 exe 재검증

완료일: 2026-09-04

## 목표

1단계 이후(문항 CRUD, 학급 관리, 게임 3종, 세션 기록까지) 코드가 크게 늘어난 상태에서,
`paths.ts`의 포터블 경로 재지정이 실제 빌드된 exe에서 여전히 정상 작동하는지 재확인.
CLAUDE.md가 "기능 다 만들고 빌드하려다 막히는 것이 최악의 시나리오"라고 명시한 만큼,
6단계까지 끝난 지금 시점에 다시 한번 실제 빌드로 확인해야 했다.

## 한 일 / 검증 결과

- `npm run build:win` (typecheck → electron-vite build → electron-builder --win) 실행,
  `dist\saegim.exe` 생성 확인.
- `Get-AuthenticodeSignature`로 `NotSigned` 재확인 — 1단계 때와 동일하게, 빌드 로그의
  "signing with signtool.exe"는 내부 처리 단계명일 뿐 실제 서명이 아님.
- **격리된 테스트 폴더**(`C:\dev\Saegim-exe-test`, 프로젝트 밖)에 exe만 복사하고
  `data\maps\samguk-placeholder.svg` 하나만 미리 넣어둔 뒤 실행:
  - 실행 후 그 폴더 옆에 `data\`가 생성되고, Electron 내부 캐시(Cache, Preferences,
    Local Storage 등)가 전부 그 안에 기록됨 → `userData` 리다이렉션이 실제 빌드된
    exe에서 정상 작동.
  - `%APPDATA%`에는 `saegim`/`새김` 관련 폴더가 전혀 생기지 않음 확인.
  - 메인 윈도우 타이틀이 "새김"으로 정상 표시됨(`Get-Process`로 `MainWindowTitle` 확인).
  - 여러 electron.exe/saegim.exe 하위 프로세스(브라우저/렌더러/GPU 등)가 정상적인
    멀티프로세스 구조로 뜨고, 크래시 없이 안정적으로 유지됨.
- **한글+공백 폴더 경로 재확인** (`C:\dev\새김 포터블 테스트 폴더\`) — 1단계 때 확인했던
  엣지 케이스를 다시 실행: 정상적으로 창이 뜨고 그 폴더 옆에 `data\`가 생성됨. 한글
  경로에서도 `PORTABLE_EXECUTABLE_DIR` 기반 경로 재지정이 깨지지 않음을 재확인.
- 테스트 후 두 격리 폴더와 잔여 `saegim.exe` 프로세스 모두 정리, `git status`로 저장소에
  영향 없음(추적 파일 변경 없음, `dist/`는 `.gitignore` 대상) 확인.

## 알게 된 것

- 6단계까지 쌓인 IPC(`system`/`questions`/`classes`/`maps`/`sessions`)와 리듀서
  코드량이 늘었지만, 포터블 경로 재지정 로직 자체([src/main/paths.ts](../src/main/paths.ts))는
  1단계 이후 손대지 않아 그대로 안정적으로 동작함.
- 이번엔 네이티브 창이라 브라우저 자동화 도구로 화면 클릭까지는 확인하지 못했다 —
  경로 재지정·타이틀·서명 여부·안정성(크래시 없음)까지가 이 재검증의 범위였고,
  화면별 기능 동작은 각 단계별 문서(01~07)에서 Vite 단독 브라우저 검증으로 이미
  확인된 것으로 갈음한다.

## 다음 단계

- `Answer` 타입 통일 (낮은 우선순위).
- UI 스타일링(교실 TV/프로젝터 가독성) — 기능이 다 끝난 지금 시점에 한 번에 착수 가능.
