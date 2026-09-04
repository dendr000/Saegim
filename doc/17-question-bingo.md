# 문제 빙고

완료일: 2026-09-04

## 목표

랭킹 4순위. "위와 비슷하지만(땅따먹기) 문제 난이도를 칸에 미리 배치해서 보이게
함."(CLAUDE.md) [doc/ideas.md](ideas.md)에 미리 적어둔 "땅따먹기 격자 변형 방식
B"(홀수 격자 + 빙고 보너스) 아이디어를 실제로 구현했다.

땅따먹기와 게임 흐름(팀이 돌아가며 칸 선택 → 문제 → 판정 → 점령)은 같지만: (1)
SVG 지도가 아니라 추상 N×N 격자를 쓰고 각 칸에 미리 배정된 난이도가 선택 전부터
보이며, (2) 홀수 격자라 가로/세로/대각선 "줄"이 명확히 존재하고 한 줄을 다 채우면
보너스 점수를 받는다(전통 빙고의 "줄 완성" 개념).

## 설계 결정

- **격자 크기 5×5/7×7/9×9 중 선택**(홀수만 — 대각선 줄이 명확히 존재하도록).
- **칸 난이도는 게임 시작 시 한 번 무작위 배정되고 고정** — `createInitialState`에서
  생성해 선택 전부터 화면에 보인다.
- **문제 매칭은 난이도 기준** — 땅따먹기의 지역 이름 매칭 대신
  `questions.filter(q => q.difficulty === cell.difficulty)`. 특정 난이도에 문제가
  없으면 그 난이도의 칸은 땅따먹기의 `blockedRegionId`와 같은 방식으로 막힌다.
- **줄 보너스 = 그 줄의 칸 수(격자 크기)만큼 추가 점수.** 칸을 점령할 때마다 이
  팀이 새로 완성한 줄이 있는지 확인해서, 이미 보너스를 받은 줄이 아니면 추가.
  최종 점수 = 점령 칸 수 + (완성한 줄 수 × 격자 크기).
- **게임 종료 조건은 땅따먹기와 동일**(전체 점령 또는 교사 수동 종료) — 9×9=81칸은
  수업 시간 안에 다 채우기 어려울 수 있어 수동 종료를 더 자주 쓸 것으로 예상, 별도
  "라운드 수" 개념은 만들지 않았다.
- **판정 UI·팀 색상은 새로 안 만들고 그대로 재사용** — `territory/QuestionJudgePrompt.tsx`
  (완전히 범용적이라 땅따먹기 상태에 의존하지 않음)와 `territory/mapSvg.ts`의
  `colorForTeamIndex`를 import해서 그대로 씀. 새로 만든 건 격자를 그리는
  `BingoGrid.tsx`뿐(SVG 파싱 불필요, 땅따먹기의 `MapView.tsx`보다 단순).
- **교사 수동 개입 = 칸 재배정**(땅따먹기의 "지역 재배정" 패널과 같은 방식).
- 엔진은 새로 작성하되 땅따먹기 리듀서 구조를 그대로 본뜸.

## 한 일

- `games/questionBingo/gridUtils.ts` — `generateCells`, `computeLines`,
  `findNewCompletedLines`.
- `games/questionBingo/types.ts`, `useQuestionBingoEngine.ts`(`SELECT_CELL`,
  `JUDGE_ANSWER`, `END_GAME_MANUALLY`, `REASSIGN_CELL`), `BingoGrid.tsx`,
  `QuestionBingoSetup.tsx`(학급→팀 선택 + 격자 크기 + 난이도별 문제 수 표시),
  `QuestionBingoPlay.tsx`(격자 + 재사용한 판정 UI + 칸 재배정 패널 + 팀별
  칸수·줄보너스·합계 점수 표시).
- `styles/global.css`에 `.bingo-grid`/`.bingo-cell` 추가.
- `GameMode`/`SessionHistory`/`gameModeCatalog`(3×3 격자 아이콘)/`GameSelect` 연결.

## 검증 결과

- `npm run typecheck` 통과.
- `gridUtils.ts`를 `tsx`로 직접 실행해 11개 항목 검증: 격자 크기별 칸 수, 줄 개수
  (5×5=12줄), 대각선 좌표 정확성, 줄 완성 감지(중복 방지 포함).
- 리듀서를 `tsx`로 직접 실행해 19개 항목 검증: 난이도별 매칭, 특정 난이도 문제
  없을 때 blocked, 정답/오답 처리(오답도 턴은 넘어감 — 땅따먹기와 동일), 칸
  재배정, 줄 완성 시 보너스 기록, 전체 칸 점령 시 자동 종료.
- 브라우저로(fixture mock 디버그 하네스) 실제 플레이: 격자에 난이도가 미리
  표시되는지, 칸 선택 시 해당 난이도 문제가 정확히 나오는지, 정답 처리 시 칸이
  팀 색으로 칠해지고 턴이 넘어가는지 확인.
- 최종 `npm run dev`(Electron)로 재부팅 확인.

## 다음 단계

CLAUDE.md "향후 추가" 목록 중 4개(초성 퀴즈/힌트차감형/보스레이드/문제빙고)가
끝났다. 남은 건 폭탄 돌리기/카드 매칭(2티어), 골든벨 서바이벌/찬스카드/모자이크
공개/분류 드래그(3티어).
