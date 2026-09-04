# 1단계: 프로젝트 초기 세팅 + 포터블 exe 빌드

완료일: 2026-09-04

## 목표

CLAUDE.md 구현 순서 1단계. 기능 없이 빈 화면만 띄우되, 포터블 exe가 자기 자신이
실제로 위치한 폴더를 찾아서 그 옆에 `data/`를 만들 수 있는지부터 검증한다.

## 한 일

- electron-vite 기반으로 Electron + React 19 + Vite + TypeScript 프로젝트 구성
  (`@electron-toolkit/utils`, `@electron-toolkit/tsconfig` 사용)
- [src/main/paths.ts](../src/main/paths.ts): 데이터 경로 재지정 로직
  - 개발 모드 → `app.getAppPath()` (프로젝트 루트)
  - 포터블 실행 → `process.env.PORTABLE_EXECUTABLE_DIR`
  - 그 외 패키징 실행 → `path.dirname(app.getPath('exe'))`
  - `app.setPath('userData', DATA_DIR)`를 `whenReady()` 이전에 호출해 Electron 내부
    캐시까지 전부 `data/` 밑으로 들어가게 함
- `system:get-data-dir` IPC로 메인 → preload(contextBridge) → 렌더러까지 경로를 전달,
  화면에 "빌드 성공" + 현재 데이터 경로 표시
- `electron-builder.yml`: `appId: com.saegim.quiz`, `productName: 새김`,
  `win.target: portable`, 산출물 이름 `saegim.exe` 고정

## 핵심 기술 포인트

electron-builder의 Windows `portable` 타겟은 실행 시 exe를 `%TEMP%`에 풀어서 그 안에서
구동한다. 그래서 `process.execPath`/`app.getPath('exe')`는 임시 폴더를 가리켜 못 쓴다.
electron-builder가 별도로 심어주는 `PORTABLE_EXECUTABLE_DIR` 환경변수만이 원래 exe가
있던 실제 폴더를 알려준다 — 이게 이 앱이 진짜로 포터블일 수 있는 이유다.

## 검증 결과

- `npm run dev`: 터미널에 `DATA_DIR = C:\dev\Saegim\data` 출력, 실제 폴더 생성 확인.
- `saegim.exe`만 한글+공백이 섞인 임의 폴더(`...\포터블 테스트 폴더\`)로 복사 후 실행
  → 그 폴더 옆에 `data/`가 생기고 Electron userData가 실제로 그 안에 기록됨.
  `%APPDATA%`에는 아무 흔적도 남지 않음.
- 사용자 실기기에서 `D:\dev\` 폴더로 옮겨 실행 → 화면에 "현재 데이터 경로: D:\dev\data"로
  정상 표시됨을 스크린샷으로 확인.

## 알게 된 것 / 다음에 주의할 점

- 첫 `npm install` 시 Electron 바이너리 다운로드가 postinstall에서 조용히 실패한 적이
  있었다. `npm run dev`가 "Electron uninstall" 에러를 내면
  `node node_modules/electron/install.js`를 수동으로 실행하면 된다.
- 빌드 로그의 "signing with signtool.exe"는 실제 코드 서명이 아니라 electron-builder
  내부 처리 단계 이름이었다. `Get-AuthenticodeSignature`로 대조해 `NotSigned` 확인함 —
  CLAUDE.md 규칙("코드 서명 하지 않음")과 충돌 없음.
- 이 시점 기준 `@vitejs/plugin-react` 최신(6.x)은 vite 8을 요구하지만 `electron-vite`는
  아직 vite 5~7까지만 지원한다. `vite@^7`, `@vitejs/plugin-react@^5`로 고정 설치함.
  나중에 electron-vite가 vite 8을 지원하면 재검토 가능.

## 다음 단계

CLAUDE.md 구현 순서 2단계: 문항 CRUD + CSV 일괄 가져오기.
