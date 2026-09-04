# 남은 게임 모드 5개 구현 계획

작성일: 2026-09-05

이 문서는 **아직 구현하지 않은** 게임 모드의 상세 설계 초안이다. CLAUDE.md 절대
규칙 5("큰 기능을 시작하기 전에 구현 계획을 먼저 제시하고 확인을 받는다")에
따라, 실제 착수 전에는 이 문서를 바탕으로 모드별로 다시 한번 확인을 받는다 —
5개를 한 번에 승인받고 시작하지 않는다.

## 현재 상태 점검

CLAUDE.md "향후 추가" 목록(10개) 대비 [11-initial-letter-quiz.md](11-initial-letter-quiz.md)에서
정한 제작 난이도 순위와 실제 구현 여부:

| 순위 | 게임 모드 | 상태 | 폴더 |
|---|---|---|---|
| 1 | 초성 퀴즈 | ✅ 완료 | `games/initialLetter/` |
| 2 | 힌트 차감형 | ✅ 완료 | `games/hintDeduction/` |
| 3 | 보스 레이드 | ✅ 완료 | `games/bossRaid/` |
| 4 | 문제 빙고 | ✅ 완료 | `games/questionBingo/` |
| 5 | 폭탄 돌리기 | ✅ 완료 | `games/bombPass/` |
| 6 | **카드 매칭** | ❌ 미구현 | — |
| 7 | **골든벨 서바이벌** | ❌ 미구현 | — |
| 8 | **찬스카드** | ❌ 미구현 | — |
| 9 | **모자이크 공개** | ❌ 미구현 | — |
| 10 | **분류 드래그** | ❌ 미구현 | — |

이 문서는 아래 5개(6~10위)를 다룬다. 6~8위는 기존 문항 스키마(객관식/단답형)와
기존 셰어드 컴포넌트를 그대로 활용할 수 있어 상대적으로 작다. **9~10위는
문항 스키마·문제은행 CRUD 자체를 확장해야 하는 더 큰 작업**이라 별도로 범위를
좁혀 계획했다.

---

## 6. 카드 매칭 (개념 학습형)

### 배경

CLAUDE.md: "카드 매칭 — 용어와 정의를 짝짓기. 정답률보다 반복 노출이 목적."
지금까지 만든 모든 게임은 "교사가 정오답을 판정"하는 구조였지만, 카드 매칭은
카드 두 장이 짝인지 아닌지를 **앱이 스스로 판정**할 수 있어 교사의 판정 단계
자체가 없다 — 지금까지와 다른 첫 게임.

### 설계 결정

- **새 문항 타입을 만들지 않는다.** 기존 단답형(`shortAnswer`)만 사용 —
  `payload.answer`(정답/용어)와 `payload.question`(질문/정의에 가까운 텍스트)을
  그대로 카드 한 쌍으로 삼는다. 객관식은 제외(초성 퀴즈·힌트 차감형과 같은
  이유 — "정의" 역할을 할 단일 텍스트가 명확하지 않음).
- **정답 판정에 교사 개입이 없다.** 카드 두 장을 뒤집었을 때 같은 문항에서
  나온 쌍인지는 코드가 즉시 비교할 수 있다 — `AnswerConfirm`/`QuestionJudgePrompt`류의
  "정답 확인 → 정답/오답 처리" 흐름이 필요 없는 첫 게임.
- **턴은 원형 순환**(폭탄 돌리기와 동일한 `(turnIndex+1) % turnOrder.length`).
  맞추면(짝을 찾으면) **같은 참가자가 턴을 유지**하고 추가로 한 번 더 뒤집을
  기회를 얻는다(전통 카드 매칭 게임 규칙 — 폭탄 돌리기의 "정답이면 다음
  사람"과 정반대라는 점에 유의). 틀리면(짝이 안 맞으면) 두 카드를 잠깐 보여준
  뒤 다시 뒤집어 감추고, 다음 참가자로 턴이 넘어간다.
- **오답 공개 시간차가 새로 필요하다.** 짝이 안 맞으면 두 카드 내용을 잠깐
  보여줬다가(암기 기회) 다시 가려야 한다 — 기존 `useCountdownTimer`(화면에
  숫자를 보여주는 카운트다운용)를 억지로 쓰지 않고, `useEffect` + `setTimeout`
  기반의 단발성 지연 하나를 엔진 훅 안에 새로 만든다(약 1.5초).
- **전체 시간제한은 없다.** CLAUDE.md가 "정답률보다 반복 노출이 목적"이라고
  명시했으므로 속도 압박용 타이머를 붙이지 않는다 — 셀프 페이스.
- **참가자는 개인/모둠 둘 다 가능** — `ParticipantPicker` 재사용. 최소 인원
  제한 없음(혼자 복습용으로도 의미 있음).
- **점수 = 콤보 재사용.** 연속으로 짝을 맞히면(턴이 안 넘어가고 계속 이어지는
  구간) `timeAttack/scoring.ts`의 `calculateScoreForCorrectAnswer(difficulty, combo)`를
  그대로 재사용 — 짝을 못 맞히면 콤보 리셋.
- **오답 통계 연동**: 각 카드 쌍 판정(맞음/틀림)을 `answerHistory`에
  `{questionId, participantId, correct}`로 그대로 기록 — 기존 세션 기록·오답
  통계 파이프라인과 자연히 맞물린다.

### 새 파일 — `games/cardMatching/`

- `types.ts` — `CardMatchingConfig{participants, questions, classId, className}`,
  `CardInstance{id, questionId, kind:'term'|'definition', text, difficulty}`(문항
  하나당 카드 2장 생성), `ParticipantRuntimeState{id,label,score,combo}`,
  `CardMatchingState{config, participants, cards: CardInstance[](셔플됨),
  matchedQuestionIds: Set<string>, flippedCardIds: string[](0~2개), pendingMismatch:
  boolean, turnOrder, turnIndex, activeParticipantId, status, lastResult, answerHistory}`.
- `useCardMatchingEngine.ts` — `FLIP_CARD{answer}`(Answer.value=`{cardId}`):
  1장째면 그냥 뒤집어 기록. 2장째면 같은 `questionId`인지 비교 — 일치하면
  `matchedQuestionIds`에 추가, 점수·콤보 반영, 같은 참가자가 턴 유지, `flippedCardIds`
  비움. 불일치하면 `pendingMismatch: true`로 두 카드를 잠깐 보여준 채 대기.
  `RESOLVE_MISMATCH`(훅 내부에서 `pendingMismatch`가 true일 때 `useEffect`+
  `setTimeout`으로 자동 dispatch) — 카드 숨기고 다음 참가자로 턴 이동, 콤보 리셋.
  `END_GAME_MANUALLY`, `ADJUST_SCORE`. 모든 쌍이 맞춰지면 자동 종료.
- `CardGrid.tsx` — 카드 버튼 격자(문제 빙고의 `BingoGrid.tsx`와 비슷한 수준의
  단순 컴포넌트). 미공개 카드는 `?` 표시, `flippedCardIds`에 있으면 텍스트
  표시, `matchedQuestionIds`에 속하면 비활성화된 "맞춤" 스타일로 고정 표시.
- `CardMatchingSetup.tsx` — 학급 선택, `ParticipantPicker`(+ 저장된 선택
  복원), `QuestionFilterPicker`(+ 저장된 필터 복원, 단답형만), 이번 판에 쓸
  "카드 쌍 개수" 숫자 입력(기본값 `min(8, 사용 가능 문제 수)`, 격자가 너무
  커지지 않게 상한 안내).
- `CardMatchingPlay.tsx` — 현재 턴 표시, `CardGrid`, 판정 피드백(짝을
  찾았는지 여부를 `AnswerReveal`과 비슷하게 텍스트로), `Scoreboard`, "게임
  종료" 수동 버튼. 타이머 UI 없음.

### 수정 파일

`shared/types/session.ts`(`GameMode`+=`'cardMatching'`), `SessionHistory.tsx`
라벨 추가, `gameModeCatalog.tsx`(카드 모양 아이콘, `category:'concept'`),
`GameSelect.tsx` 플로우 연결 — 기존 8개 모드와 동일한 패턴.

### 검증 계획

리듀서 단위 테스트(짝 맞음/안 맞음, 같은 참가자 턴 유지 vs 다음으로 이동,
콤보 반영, 모든 쌍 완료 시 자동 종료), 브라우저 실제 플레이(카드 클릭 →
짝 확인 → 오답 시 잠깐 보였다가 다시 가려지는지), typecheck, 최종 Electron
부팅.

---

## 7. 골든벨 서바이벌 (개인전 · 전체 참여형)

### 배경

CLAUDE.md: "골든벨 서바이벌 — 틀리면 탈락, 단 부활 문제 1회. 탈락자는 심판이나
응원단 역할을 주면 이탈 방지." 지금까지 게임은 전부 "한 번에 한 참가자만
판정"하는 구조(핫시트의 활성 참가자 1명, 동시 진행의 검색-선택 1명)였지만,
골든벨은 **매 라운드 생존자 전원이 동시에 같은 문제에 답하고, 교사가 그
전원을 한 화면에서 한 명씩 판정**해야 한다 — 랭킹 문서가 지적한 "전원 정오답
체크리스트 UI"가 이번에 처음 필요하다.

### 설계 결정 — "부활" 규칙 단순화

CLAUDE.md 원문의 "부활 문제 1회"는 실제 TV 골든벨의 "위기의 학생 부활전"(여러
탈락자를 모아 별도 라운드로 구제)에 가깝지만, 이를 그대로 구현하면 상태
기계가 훨씬 복잡해진다(부활전 전용 라운드, 부활 대상자 집합 관리 등). 대신
**"첫 번째 오답은 자동으로 봐준다"** 로 단순화한다: 참가자마다 `hasRevival:
boolean`(기본 true)을 두고, 오답 시 `hasRevival`이 true면 소비만 하고
탈락시키지 않음(정확히 "부활 1회"라는 원문 의도를 지키되 별도 부활전 UI를
만들지 않음), 이미 소비했으면 그 다음 오답에 탈락. 이 단순화는 계획 확인
단계에서 사용자에게 명시적으로 다시 확인받는다.

### 설계 결정 — 그 외

- **라운드제, 턴 없음.** 매 라운드 하나의 문제를 생존자 전원에게 동시에
  낸다. 활성 참가자라는 개념이 없다 — 대신 "이번 라운드에 판정된 참가자
  집합"(`judgedThisRound: Set<participantId>`)을 추적한다.
- **판정은 기존 `Answer` 패턴을 그대로, 참가자마다 한 번씩 반복 호출한다.**
  체크리스트에서 참가자 행마다 "정답 처리"/"오답 처리" 버튼을 누르면 그
  즉시 `submitAnswer(participantId, {judgedCorrect})`를 호출한다 — 별도의
  "일괄 확정" 액션을 만들지 않는다. 이렇게 해야 나중에 학생 개인 기기가
  들어와도(각자 다른 시점에 개별적으로 응답이 들어옴) 리듀서 로직을 그대로
  쓸 수 있다. 판정된 행은 버튼 대신 "판정됨" 표시로 바뀐다. 라운드 시작
  시점의 생존자 목록(`roundParticipantIds`)을 상태에 고정해두고, 이 집합이
  전부 `judgedThisRound`에 들어오면 자동으로 다음 라운드로 넘어간다.
- **탈락자는 화면에서 사라지지 않는다.** CLAUDE.md의 "탈락자는 심판·응원단
  역할" 취지를 살려, 체크리스트 화면 하단에 "탈락자" 목록을 계속 보여준다
  (판정 버튼 없이 이름만). 교사가 실수로 탈락시켰을 경우를 위해 각 탈락자
  옆에 "부활시키기" 수동 개입 버튼을 둔다.
- **객관식 정답도 이번엔 `AnswerConfirm`으로 가려야 한다.** 지금까지 객관식은
  보기 버튼 자체를 클릭하는 방식이라 정답을 따로 감출 필요가 없었지만,
  골든벨은 학생이 직접 답을 말하고(또는 화이트보드로 들고) 교사가 "정답 처리/
  오답 처리"로 판정하는 방식이라 단답형과 동일하게 "정답: 보기 N번"을
  `AnswerConfirm` 뒤에 숨겨야 한다 — 기존 정답 노출 방지 규칙을 객관식까지
  확장하는 첫 사례.
- **시간제한 없음, 라운드 수 제한 없음.** 생존자 1명 이하가 되거나 문제
  큐가 소진되면 자동 종료. 교사가 "다음 라운드로 강제 진행"(판정 안 된
  참가자는 그대로 두고 넘어감) 버튼으로도 진행 가능.
- **점수 = 정답 라운드 수.** 콤보·난이도 배율을 쓰지 않는다 — "생존"
  자체가 보상이라 점수는 세션 기록 호환용 보조 지표로만 둔다(정답 시 +1).

### 새 파일 — `games/goldenBell/`

- `types.ts` — `GoldenBellConfig{participants, questions, classId, className}`,
  `ParticipantRuntimeState{id,label,status:'alive'|'eliminated',hasRevival:boolean,score}`,
  `GoldenBellState{config, participants, questionQueue, currentQuestion,
  roundParticipantIds: string[], judgedThisRound: Set<string>, status, lastResult,
  answerHistory}`.
- `useGoldenBellEngine.ts` — `SUBMIT_ANSWER{answer}`(1명씩 판정 — 정답이면
  점수+1·라운드 판정 집합에 추가, 오답이면 `hasRevival`에 따라 탈락 여부
  결정), `FORCE_NEXT_ROUND`, `END_GAME_MANUALLY`, `ADJUST_SCORE`,
  `REVIVE_MANUALLY{participantId}`(탈락 취소). 라운드 판정 집합이
  `roundParticipantIds`를 다 채우면 다음 문제로 자동 전환, 생존자 ≤1명이면
  종료.
- `GoldenBellChecklist.tsx` — 새 UI. 문제 표시(+`AnswerConfirm`으로 정답
  가림) 위에, 생존자 각 행마다 이름 + 정답/오답 버튼(판정 완료 시 상태
  텍스트로 교체), 하단에 탈락자 목록 + 부활 버튼.
- `GoldenBellSetup.tsx` — 학급 선택, `ParticipantPicker`(+ 저장된 선택
  복원, 최소 2명 검증 — 폭탄 돌리기와 동일 이유), `QuestionFilterPicker`
  (+ 저장된 필터, 객관식/단답형 지원).
- `GoldenBellPlay.tsx` — 생존자/탈락자 수 표시, `GoldenBellChecklist`,
  `Scoreboard`, "다음 라운드로 강제 진행"/"게임 종료" 버튼.

### 수정 파일

`session.ts`/`SessionHistory.tsx`/`gameModeCatalog.tsx`(종 모양 아이콘,
`category:'solo'`)/`GameSelect.tsx` — 기존 패턴 그대로.

### 검증 계획

리듀서 테스트(첫 오답은 생존, 두 번째 오답은 탈락, 라운드 전원 판정 시
자동 다음 문제, 생존자 1명 이하 시 종료, 강제 진행, 수동 부활), 브라우저
플레이(체크리스트에서 여러 명 순서대로 판정 → 자동 라운드 전환 확인,
탈락자 목록 유지 확인), typecheck, 최종 Electron 부팅.

---

## 8. 찬스카드 (팀 대항형)

### 배경

CLAUDE.md: "찬스카드 — 정답 시 랜덤 카드 획득(점수 훔치기, 순서 뒤집기,
방어막). 실력차를 흐리는 가장 강력한 장치." 랭킹 문서의 "여러 게임을
가로지르는 효과 시스템 필요"는 다른 게임에 얹는 애드온이라는 뜻이 아니라,
카드 하나하나의 효과가 팀 점수·턴 순서·보호 상태 등 상태의 여러 축을
동시에 건드린다는 뜻으로 해석했다 — CLAUDE.md 원문이 팀 대항형 아래 독립
항목으로 분류해뒀으므로 **독립된 새 게임 모드**로 만든다.

### 설계 결정

- **기반 진행 방식은 땅따먹기에서 지도·칸 선택 부분만 뺀 버전.**
  `territory/useTerritoryEngine.ts`의 "판정 후 정답 여부와 무관하게 항상 다음
  팀 턴으로 넘어간다"는 규칙을 그대로 가져온다 — 칸(지역) 개념이 없으므로
  그냥 팀이 원형으로 돌며 문제를 푸는 릴레이 형식.
- **판정 UI는 `territory/QuestionJudgePrompt.tsx`를 그대로 재사용한다** —
  이미 완전히 범용적이라(질문/보기/판정 버튼만 있고 땅따먹기 상태에
  의존하지 않음) 문제 빙고가 그랬듯 그대로 import해서 쓴다.
- **카드 3종만 만든다**(CLAUDE.md가 예시로 든 것과 정확히 일치, 새로
  늘리지 않음):
  1. **점수 훔치기** — 정답 시 카드를 뽑으면, 뽑은 팀이 다른 팀 하나를
     골라(팀이 2개뿐이면 자동으로 그 팀) 고정 액수(`config.stealAmount`)를
     훔친다. 대상 팀 점수가 그보다 적으면 가진 만큼만(0 밑으로 안 내려감).
  2. **순서 뒤집기** — 턴 순서 배열을 즉시 반전시킨다.
  3. **방어막** — 뽑은 팀이 `hasShield: true`가 된다. 다른 팀의 "점수
     훔치기"가 이 팀을 노리면, 훔치기는 실패하고 방어막은 소모된다(1회용).
  카드는 정답 시 셋 중 하나를 균등 확률로 뽑는다(가중치 설정 없음, v1은
  단순하게).
- **훔치기 카드만 "대상 선택"이라는 별도 단계가 필요하다.** 뽑은 직후
  `pendingCard: 'steal'`로 두고 턴을 아직 안 넘긴 채, 팀 버튼들을 보여줘
  교사가 대상 팀을 고르게 한다 — 나머지 두 카드(순서 뒤집기/방어막)는
  즉시 적용되고 바로 다음 팀으로 넘어간다.
- **카드 발동 로그는 폭탄 돌리기의 "마지막으로 터진 사람" 표시와 같은
  패턴** — 다음 카드가 발동할 때까지 화면에 계속 보여준다(`lastCardEvent:
  string`).
- **점수는 콤보 없이 난이도 고정 배점**(`difficulty * 10`) — 카드가 이미
  "운" 요소를 강하게 담당하므로 콤보까지 겹치면 변수가 과해진다고 판단.

### 새 파일 — `games/chanceCard/`

- `types.ts` — `ChanceCardConfig{stealAmount, teams, questions, classId,
  className}`(팀 전용 — 땅따먹기·베팅형·문제빙고와 동일하게 `selectedClass.teams`를
  직접 씀, `ParticipantPicker` 안 씀), `TeamRuntimeState{id,label,score,hasShield}`,
  `DrawnCardType = 'steal'|'reverse'|'shield'`, `ChanceCardState{config, teams,
  turnOrder, turnIndex, activeTeamId, questionQueue, currentQuestion,
  pendingCard: DrawnCardType|null, lastResult, lastCardEvent: string|null,
  status, answerHistory}`.
- `useChanceCardEngine.ts` — `SUBMIT_ANSWER{answer}`(오답이면 그냥 다음 팀·
  다음 문제로. 정답이면 점수 반영 후 카드 뽑기 — steal이면 `pendingCard`
  설정하고 턴 유지, reverse/shield면 즉시 적용 후 다음 팀), `RESOLVE_STEAL
  {targetTeamId}`(방어막 여부 확인 후 훔치기 적용/차단, 다음 팀으로 진행),
  `END_GAME_MANUALLY`, `ADJUST_SCORE`.
- `ChanceCardSetup.tsx` — `TerritorySetup.tsx`/`QuestionBingoSetup.tsx` 기반
  (학급→팀 선택, 최소 2팀 검증), `stealAmount` 숫자 입력(기본값 20),
  `QuestionFilterPicker`(+ 저장된 필터, 객관식/단답형).
- `ChanceCardPlay.tsx` — 현재 팀 턴 표시, `pendingCard==='steal'`이면 대상
  팀 선택 버튼 패널, 아니면 재사용한 `QuestionJudgePrompt`, `lastCardEvent`
  지속 표시, 각 팀 옆에 방어막 보유 여부 아이콘/텍스트, `Scoreboard`.

### 수정 파일

`session.ts`/`SessionHistory.tsx`/`gameModeCatalog.tsx`(카드 모양 아이콘,
`category:'team'`)/`GameSelect.tsx` — 기존 패턴.

### 검증 계획

리듀서 테스트(오답 시 턴만 이동, 정답 시 카드 3종 각각의 효과, 방어막이
훔치기를 정확히 1회만 막는지, 훔친 금액이 대상 점수 이하로 클램프되는지,
순서 뒤집기 후 다음 팀 계산이 올바른지), 브라우저 플레이, typecheck,
최종 Electron 부팅.

---

## 9. 모자이크 공개 (개인전 · 전체 참여형) — ⚠️ 선행 작업 필요

### 배경

CLAUDE.md: "모자이크 공개 — 사진/그림이 서서히 선명해지고, 빨리 맞힐수록
고득점." 문항 스키마엔 `imageIdentify` 타입이 이미 정의돼 있지만(`payload:
{imageFileName, question, answer}`), **CRUD 폼·CSV·이미지 저장 인프라가
전혀 없다.** 지금까지 6개 게임은 전부 기존 객관식/단답형 데이터만 재사용해서
게임 엔진만 새로 만들면 됐지만, 이번엔 **문제은행 자체를 먼저 확장**해야
한다 — 랭킹 문서가 정확히 짚어둔 지점.

### 선행 작업 — 이미지 문항 CRUD

지금까지 `data/maps/`(SVG)는 교사가 직접 폴더에 파일을 넣어두는 방식이라
**앱에 파일 업로드 기능 자체가 없었다.** 이번이 첫 업로드 기능이라, 단순히
`mapsApi`(list/get만 있음)를 흉내 내는 게 아니라 **쓰기(저장) IPC를 새로
만들어야 한다.**

- `shared/types/question.ts` — `SUPPORTED_QUESTION_TYPES`에 `'imageIdentify'`
  추가, `isQuestionDraft`에 imageIdentify 분기 추가(`imageFileName`/`question`/
  `answer` 비어있지 않은 문자열인지).
- `shared/types/imagesApi.ts`(신규, `mapsApi.ts` 구조를 본뜨되 쓰기 추가) —
  `{ list(): Promise<string[]>; get(fileName): Promise<string>; upload(fileName,
  dataUrl: string): Promise<string> }`. 렌더러에서 `FileReader`로 이미지를
  data URL로 읽어 넘기면, 메인 프로세스가 디코드해서 `data/images/`에 파일로
  저장하고 실제 저장된 파일명(중복 시 접미사 처리)을 돌려준다.
- `src/main/ipc/images.ts`(신규, `maps.ts` 구조 재사용) — `images:list`,
  `images:get`, `images:upload` 핸들러.
- `src/db/repositories/imageRepository.ts`(신규, `mapRepository.ts` 구조
  재사용 + 쓰기 함수 추가) — `data/images/` 디렉터리 생성(`mkdirSync`
  recursive), 파일명 검증(맵과 동일하게 안전한 파일명 정규식), 저장.
- `src/preload/index.ts` — `window.images` 노출.
- `pages/QuestionBank/QuestionForm.tsx` — 유형 선택지에 "이미지 판별" 추가,
  `<input type="file" accept="image/*">`로 이미지 선택 → 미리보기 → 저장
  시 `window.images.upload(...)` 호출 → 반환된 파일명을 `payload.imageFileName`에
  저장. `question`(예: "이 인물은 누구인가?")/`answer` 텍스트 필드는 기존
  단답형 폼과 동일한 위젯 재사용.
- **CSV 일괄 가져오기는 이 유형에서 지원하지 않는다** — 이미지 바이너리를
  CSV 행에 담을 합리적인 방법이 없다. CRUD 폼으로만 추가/수정 가능하다고
  명시하고 넘어간다.

### 게임 설계

- **구조는 타임어택 "동시 진행" 모드와 거의 같다.** 활성 참가자 개념 없이,
  화면에 이미지 하나를 띄우고 아무나 답을 외치면 교사가 `SimultaneousControls`와
  같은 검색-선택 UI로 판정한다. 다른 점은 두 가지뿐: (1) 이미지가 시간에
  따라 점점 선명해진다, (2) 점수 공식이 콤보가 아니라 "얼마나 빨리(흐릴 때)
  맞혔는가"에 따라 달라진다.
- **모자이크 표현**: `<img>`에 `style={{ filter: \`blur(${blurPx}px)\` }}`를
  인라인으로 직접 준다. `blurPx`는 `useCountdownTimer`의 `remainingSeconds`를
  `config.revealSeconds`로 나눈 비율로 선형 보간(시작 시 24px → 0px). 이번
  모드는 시각적 공개 자체가 게임의 본질이라 "CSS는 게임 모드 다 만든 뒤에"
  라는 기존 방침의 예외로 둔다 — 버튼·레이아웃 등 장식적인 부분은 여전히
  기존 클래스만 쓰고, 블러 필터만 지금 넣는다.
- **점수 공식은 새로 만든다**(콤보 공식 재사용 불가 — 시간 기반이라 형태가
  다름): `games/mosaicReveal/scoring.ts`에
  `calculateMosaicScore(difficulty, remainingSeconds, totalSeconds)` =
  `difficulty * 10 + round((remainingSeconds / totalSeconds) * MAX_SPEED_BONUS)`.
  이번엔 `useCountdownTimer`의 남은 시간을 화면에 그대로 보여준다(폭탄
  돌리기와 반대 — 여기선 숫자를 숨길 이유가 없고, 오히려 급박함이 재미
  요소).
- **문제 필터는 `type === 'imageIdentify'`만.** 새 유형이라 이 게임
  전용이다.
- **시간 만료 시**: 아무도 못 맞히면 모자이크가 완전히 풀린 상태(선명한
  원본)로 잠깐 보여준 뒤 다음 문제로 자동 전환.

### 새 파일 — `games/mosaicReveal/`

- `types.ts`, `scoring.ts`(위 공식), `useMosaicRevealEngine.ts`(타임어택
  "동시 진행" 리듀서 구조를 본뜨되 시간 기반 점수 계산으로 교체),
  `MosaicRevealControls.tsx`(`SimultaneousControls.tsx` 기반, 판정 시
  현재 `remainingSeconds`를 함께 넘겨 점수 계산에 반영),
  `MosaicRevealSetup.tsx`(학급 선택, `ParticipantPicker`, `QuestionFilterPicker`
  — imageIdentify만, 공개 시간(초) 설정), `MosaicRevealPlay.tsx`(`<img>`
  블러 렌더링 + 위 Controls 조립).

### 수정 파일

위 "선행 작업" 섹션 전체 + `session.ts`/`SessionHistory.tsx`/
`gameModeCatalog.tsx`(사진 모양 아이콘, `category:'solo'`)/`GameSelect.tsx`.

### 검증 계획

1. 선행 작업: 이미지 업로드 → `data/images/`에 실제 파일 저장되는지,
   문제은행 목록에서 이미지 문항이 CRUD 되는지(생성/수정/삭제) 별도 검증.
2. `calculateMosaicScore`를 여러 `remainingSeconds` 값으로 직접 실행해
   시간이 많이 남았을수록 점수가 높은지 확인.
3. 브라우저 플레이: blur 값이 시간에 따라 줄어드는지(`getComputedStyle`로
   확인), 판정 시 그 시점의 남은 시간이 점수에 반영되는지, 시간 만료 시
   원본이 잠깐 보이는지.
4. typecheck, 최종 Electron 부팅.

---

## 10. 분류 드래그 (개념 학습형) — ⚠️ 가장 큰 작업, 새 문항 스키마 필요

### 배경

CLAUDE.md: "분류 드래그 — 항목을 카테고리 박스로 끌어놓기. 생물 분류, 문학
갈래, 화학 반응 종류 등." 랭킹 문서: "드래그 앤 드롭 + 새 문항 스키마,
가장 큼." 기존 6개 문항 유형(`multipleChoice`/`shortAnswer`/`initialLetter`/
`sourceReading`/`imageIdentify`/`timelineOrder`) 중 "여러 항목을 여러
카테고리로 분류"에 맞는 게 하나도 없다 — **완전히 새로운 문항 타입을
스키마에 추가**해야 하는 유일한 모드.

### 선행 작업 — 새 문항 타입 + CRUD

- `shared/types/question.ts` — `QuestionType` 유니온에 `'categorize'` 추가.
  ```ts
  export type CategorizeQuestion = QuestionBase & {
    type: 'categorize';
    payload: {
      instruction: string;               // 예: "다음 왕조를 시대별로 분류하세요"
      categories: string[];              // 예: ['삼국시대', '고려시대', '조선시대']
      items: { id: string; label: string; categoryIndex: number }[]; // 정답 카테고리 인덱스 포함
    };
  };
  ```
  `Question` 유니온과 `SUPPORTED_QUESTION_TYPES`에 추가, `isQuestionDraft`에
  분기 추가(카테고리 2개 이상, 항목 2개 이상, 모든 항목의 `categoryIndex`가
  범위 안인지).
- `pages/QuestionBank/QuestionForm.tsx` — 기존 폼보다 확실히 복잡해진다.
  가변 길이 카테고리 목록(추가/삭제 가능한 텍스트 입력 여러 개)과 가변
  길이 항목 목록(각 항목마다 라벨 입력 + "어느 카테고리인지" select)이
  필요 — 이 모드를 위한 전용 하위 컴포넌트(`CategorizeFields.tsx` 같은
  이름)로 분리하는 편이 `QuestionForm.tsx` 자체의 복잡도를 덜 키운다.
- **CSV 일괄 가져오기는 이 유형도 지원하지 않는다** — 가변 길이 중첩
  구조(카테고리 N개 × 항목 M개)를 평평한 CSV 행에 담기 어렵다. CRUD 폼
  전용.

### 게임 설계

- **드래그 앤 드롭은 외부 라이브러리 없이 네이티브 HTML5 Drag and Drop
  API로 구현한다**(`draggable`, `onDragStart`, `onDragOver`, `onDrop`) —
  CLAUDE.md가 SQLite처럼 불필요한 의존성 추가를 경계하는 기조와 일치, 이미
  다른 게임에서도 새 npm 패키지를 추가한 적이 없다. 데스크톱 마우스
  조작만 지원하면 충분(v1은 교사 기기 단독 진행이라 터치 호환은 불필요).
- **턴 기반, 참가자 한 명이 한 문제를 통째로 담당.** 타임어택 핫시트와
  같은 구조로 활성 참가자를 정하고, 제한시간 안에 모든 항목을 각 카테고리
  박스로 옮긴다.
- **판정은 자동이다.** 카드 매칭과 마찬가지로 교사의 정오답 판정이 필요
  없다 — "제출" 버튼을 누르면(또는 시간 만료 시) 각 항목의 현재 위치를
  정답(`categoryIndex`)과 비교해 자동 채점한다. 맞은 항목 수 × 배점
  (난이도 반영)이 이번 라운드 점수.
- **항목 배치 상태는 로컬 UI 상태가 아니라 리듀서 상태로 관리한다** —
  드래그로 항목을 옮길 때마다 `Answer{participantId, value:{itemId,
  categoryIndex}, submittedAt}`를 그대로 dispatch한다(다른 모드와 동일한
  Answer 패턴 유지 — 나중에 학생 개인 기기에서 각자 자기 항목을 옮기는
  것으로 교체될 여지를 남겨둔다). 리듀서는 `currentPlacements:
  Record<itemId, categoryIndex>`를 갱신만 하고, 채점은 "제출" 액션에서
  한 번에 수행한다.
- **시간 만료 시**: 그때까지 배치된 상태 그대로 자동 제출·채점.
- **점수**: 맞은 항목 수 × `difficulty * 5`(가안 — 항목 수가 문제마다
  다르므로 문제 전체가 아니라 항목 단위로 배점).

### 새 파일 — `games/categorize/`

- `types.ts` — `CategorizeConfig{durationSeconds, participants, questions,
  classId, className}`, `ParticipantRuntimeState{id,label,score}`,
  `CategorizeState{config, participants, turnOrder, turnIndex,
  activeParticipantId, questionQueue, currentQuestion, currentPlacements:
  Record<string,number>, status, lastRoundResult:{correctCount,totalCount}|null,
  answerHistory}`.
- `useCategorizeEngine.ts` — `PLACE_ITEM{answer}`(value=`{itemId,
  categoryIndex}` — `currentPlacements` 갱신만), `SUBMIT_PLACEMENTS`(전체
  비교해 채점, 점수 반영, 다음 참가자·다음 문제로 — 타임어택 핫시트의
  `startNextTurnOrFinish`와 같은 구조), `TURN_TIME_EXPIRED`(그 시점
  배치로 자동 제출), `END_GAME_MANUALLY`, `ADJUST_SCORE`.
- `DraggableItem.tsx`, `CategoryDropZone.tsx` — 네이티브 HTML5 DnD 이벤트를
  담당하는 순수 프레젠테이션 컴포넌트 한 쌍.
- `CategorizeSetup.tsx` — 학급 선택, `ParticipantPicker`(+ 저장된 선택
  복원), `QuestionFilterPicker`(+ 저장된 필터, `categorize`만), 제한시간(초).
- `CategorizePlay.tsx` — 현재 참가자 턴 표시, 미배치 항목 목록(드래그
  시작점) + 카테고리 박스들(드롭 대상), "제출" 버튼, 지난 라운드 결과
  (`N/M개 정답`), `Scoreboard`, `TimerControls`.

### 수정 파일

위 "선행 작업" 섹션 전체 + `session.ts`/`SessionHistory.tsx`/
`gameModeCatalog.tsx`(분류 박스 모양 아이콘, `category:'concept'`)/
`GameSelect.tsx`.

### 검증 계획

1. 선행 작업: `isQuestionDraft`의 categorize 분기를 여러 유효/무효
   케이스로 직접 실행, 문제은행에서 실제로 카테고리·항목을 추가/수정/삭제
   해보기.
2. 리듀서 테스트: 항목 배치 갱신, 제출 시 정답 개수 채점이 정확한지,
   시간 만료 시 자동 제출, 다음 참가자로 턴 이동.
3. 브라우저 플레이: 실제 마우스 드래그로 항목을 카테고리 박스에 놓기 →
   제출 → 채점 결과 확인. (Playwright/브라우저 자동화 도구의 네이티브
   드래그 이벤트 시뮬레이션이 제한적일 수 있어, 필요하면 `dispatchEvent`로
   `dragstart`/`dragover`/`drop`을 직접 발생시켜 검증한다.)
4. typecheck, 최종 Electron 부팅.

---

## 다음 단계

이 문서는 계획일 뿐 착수 승인이 아니다. CLAUDE.md 규칙대로, 실제로 어느
모드부터 만들지 사용자가 지정하면 그 모드의 계획을 다시 한번 확인받고
시작한다. 9번(모자이크 공개)·10번(분류 드래그)은 특히 선행 작업(이미지
업로드 인프라, 새 문항 스키마)이 본체 게임 로직보다 더 클 수 있어, 착수
전에 범위를 좁히는 대화가 한 번 더 필요할 가능성이 높다.
