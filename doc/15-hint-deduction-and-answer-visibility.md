# 힌트 차감형 + 정답 노출 방지

완료일: 2026-09-04

## 목표

랭킹 2순위 힌트 차감형을 만드는 도중, 사용자가 중요한 구조적 문제를 지적했다:
교사 1기기 단독 진행 구조상 **교사가 판정하는 화면이 곧 TV/빔프로젝터로 학생들에게
보이는 화면과 동일**한데, 지금까지 만든 4개 게임(타임어택, 초성 퀴즈, 땅따먹기,
베팅형) 전부 단답형 문제를 판정할 때 "정답: X"를 화면에 그대로 띄워두고 있었다 —
학생이 답하기도 전에 화면만 봐도 정답이 보이는 셈. "지금 있는 4개 게임 전부 한
번에 같이 고치자"를 선택해서, 힌트 차감형을 만들면서 기존 게임들의 정답 노출
문제도 함께 고쳤다.

완전히 분리된 교사 전용 화면(별도 창/모니터)이 정석이지만, 멀티 윈도우·화면 간
IPC 등 훨씬 큰 작업이라 이번엔 하지 않았다. 대신 **정답 텍스트를 기본적으로
숨기고 교사가 눌러야만 나타나게** 하는 가벼운 수정으로 막았다.

## 설계 결정

### 정답 노출 방지

- `games/_shared/AnswerConfirm.tsx`(신규) — children(정답 텍스트)을 기본적으로
  숨기고 "정답 확인" 버튼만 보여주다가, 클릭하면 그 자리에 드러내는 얇은 래퍼.
  판정 버튼(정답 처리/오답 처리)은 감싸지 않아 항상 바로 누를 수 있다 — 교사는
  이미 정답을 알고 있으므로, 숨기는 건 화면에 뜨는 "텍스트"뿐이다. 문제가 바뀔
  때마다 `key={question.id}`로 다시 마운트시켜 매번 숨김 상태로 리셋한다.
- 객관식은 애초에 "정답: X" 같은 별도 텍스트를 띄우지 않아(보기 자체가 정답을
  안 드러냄) 손댈 필요가 없었다.
- 기존 5개 파일에 적용: `timeAttack/HotSeatControls.tsx`,
  `timeAttack/SimultaneousControls.tsx`, `initialLetter/HotSeatInitialsControls.tsx`,
  `initialLetter/SimultaneousInitialsControls.tsx`, `territory/QuestionJudgePrompt.tsx`,
  `betting/BettingPlay.tsx`(계획 당시엔 `TeamAnswerRow.tsx`로 예상했지만, 실제로는
  베팅형의 정답 텍스트가 라운드당 한 번 `BettingPlay.tsx`에서 렌더링되고 있어
  거기에 적용). 초성 퀴즈의 "초성" 힌트 자체는 원래 의도대로 계속 노출.

### 힌트 차감형 게임

- 단답형만 지원(초성 퀴즈와 같은 이유 — 객관식까지 지원하면 힌트 메커니즘이
  두 갈래로 갈라져 범위가 커짐).
- 힌트 = 정답 앞글자부터 순서대로 공개, 나머지는 빈칸. 최대 힌트 횟수 = 글자 수
  − 1(항상 최소 한 글자는 가려진 채로 남김).
- 점수 차감 = 힌트 1회당 25%. 기존 타임어택의 `calculateScoreForCorrectAnswer`
  (난이도×10×콤보단계)를 그대로 가져다 쓰고 배율만 곱한다.
- 엔진은 타임어택 리듀서 구조를 복사해서 새로 만들었다(이번엔 초성 퀴즈처럼
  `useTimeAttackEngine`을 그대로 재사용하지 않음) — 힌트 개수라는 새 상태·액션이
  필요해서, 억지로 얹으면 힌트와 무관한 타임어택이 오염되기 때문.
- 힌트 버튼 옆에 "지금 정답 처리 시 점수 -N%" 표시를 둬서 차감률을 바로 보이게
  했다 — "자기 실력을 스스로 계산하게" 만든다는 원래 취지.

## 한 일

- `games/_shared/AnswerConfirm.tsx`(신규).
- `games/hintDeduction/`(신규 폴더): `hints.ts`(`maxHintsFor`, `revealHintText`),
  `scoring.ts`(`calculateHintDeductedScore`), `types.ts`, `useHintDeductionEngine.ts`,
  `HotSeatHintControls.tsx`, `SimultaneousHintControls.tsx`, `HintDeductionSetup.tsx`,
  `HintDeductionPlay.tsx`.
- `shared/types/session.ts`의 `GameMode`에 `'hintDeduction'` 추가,
  `SessionHistory.tsx`에 라벨 추가.
- `pages/GameSelect/gameModeCatalog.tsx`에 전구 아이콘(SVG) + 항목 추가.
- `pages/GameSelect/GameSelect.tsx`에 플로우 단계 추가.
- 기존 5개 파일에 `AnswerConfirm` 적용(위 목록).

## 검증 결과

- `npm run typecheck` 통과.
- `hints.ts`/`scoring.ts`를 `tsx`로 직접 실행해 14개 항목 검증(초성 개수별
  최대 힌트, 빈칸 표시, 점수 차감 공식 — 힌트 4회 이상이면 0점 하한 포함).
- `useHintDeductionEngine`도 같은 방식으로 12개 항목 검증(힌트 최대치 초과 시
  no-op, 힌트 사용 후 정답 점수 차감, hotSeat 턴 전환 시 힌트 리셋, simultaneous
  오답 시 힌트 유지·정답 시 리셋).
- 브라우저로(fixture mock 디버그 하네스) 실제 플레이: 힌트 차감형에서 힌트 보기
  누를 때마다 글자가 하나씩 더 보이는지, 차감률 표시가 맞는지, "정답 확인" 누르기
  전엔 텍스트가 안 보이는지, 최종 점수(20점 기준 힌트 1회 사용 시 15점)가 공식대로
  나오는지 확인.
- **기존 4개 게임 전부 재검증**: 타임어택(단답형 숨김 확인, 객관식은 원래도 노출
  없음 확인), 초성 퀴즈(초성은 계속 보이고 정답 텍스트만 숨김 확인), 땅따먹기,
  베팅형(정답 확인 버튼이 라운드마다 정상적으로 다시 숨겨지는 것 확인) 모두
  "정답 확인" 버튼이 정상 동작.
- 최종 `npm run dev`(Electron)로 재부팅 확인.

## 다음 단계

랭킹 3순위 보스 레이드(협동형)로 이어갈 수 있다.
