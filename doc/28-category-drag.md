# 분류 드래그 (개념 학습형) — 마지막 게임 모드

완료일: 2026-09-05

## 목표

[23-remaining-game-modes-plan.md](23-remaining-game-modes-plan.md)에서 정한
10순위이자 CLAUDE.md "향후 추가" 목록의 마지막 게임. CLAUDE.md: "분류 드래그
— 항목을 카테고리 박스로 끌어놓기." 지금까지 만든 9개 게임 중 유일하게
완전히 새로운 문항 타입(`categorize`)을 스키마에 추가했고, 드래그 앤 드롭도
처음이었다.

## 설계 결정

- **문항 스키마**: `payload.question`(지시문)/`categories: string[]`/
  `items: {id,label,categoryIndex}[]`. **`question` 필드명을 다른 5개
  타입과 통일**했다(`instruction`처럼 새 이름을 안 씀) — `QuestionForm.tsx`
  최상단 "질문" textarea가 이미 모든 타입 공용이라, 이름만 맞추면 새 분기
  없이 그대로 재사용된다.
- **CRUD 폼은 별도 컴포넌트로 안 뺐다** — 지금까지 `QuestionForm.tsx`가
  모든 유형의 전용 필드를 인라인 분기로 처리해온 것과 같은 결.
  - 카테고리 삭제 시 **항목 인덱스를 재정렬**한다: 삭제된 카테고리를
    가리키던 항목은 0번으로, 그 뒤 카테고리를 가리키던 항목은 인덱스를
    하나씩 당긴다 — 안 하면 삭제로 인덱스가 밀리면서 항목이 엉뚱한
    카테고리를 가리키게 된다.
  - CSV는 지원하지 않는다(이미지 판별과 같은 이유 — 가변 길이 중첩
    구조를 CSV 행에 담기 어려움). 라벨만 추가.
- **턴 기반, 폭탄 돌리기·카드 매칭과 같은 원형 순환.** 참가자 한 명이
  한 문제를 통째로 담당해 제한시간 안에 항목을 옮기고, 라운드가 끝나면
  (제출 또는 시간 초과) 정답 여부와 무관하게 다음 참가자 + 다음 문제로
  넘어간다.
- **판정은 완전 자동이다** — 카드 매칭처럼 교사 개입 없이 채점. 점수 =
  맞은 항목 수 × (난이도 × 5), 문제 전체가 아니라 항목 단위 배점(항목
  수가 문제마다 달라서).
- **드래그 앤 드롭은 네이티브 HTML5 API**(`draggable`, `dataTransfer`,
  `onDragOver`+`onDrop`)로 구현 — 새 npm 의존성 없음. "미배치" 칸도
  하나의 드롭존으로 취급해(`categoryIndex: -1`) 되돌리기가 가능하고,
  이 값은 채점 시 항상 오답으로 처리돼 별도 액션이 필요 없다.
- **배치 상태는 리듀서 상태로 관리**한다 — 드래그마다
  `Answer{participantId, value:{itemId,categoryIndex}, submittedAt}`를
  그대로 dispatch(다른 게임과 동일한 Answer 패턴). 채점은 "제출"/시간
  초과 두 액션이 `finalizeRound` 헬퍼를 공유해서 처리한다.

## 한 일

- `shared/types/question.ts`(`CategorizeQuestion` 타입 + `isQuestionDraft`
  분기 + `SUPPORTED_QUESTION_TYPES`), `shared/questionCsv.ts`(라벨),
  `pages/QuestionBank/QuestionForm.tsx`(카테고리/항목 동적 목록 UI —
  추가/삭제 + 재정렬), `pages/QuestionBank/QuestionBank.tsx`(목록 정답
  요약·수정 버튼 분기에 처음부터 `categorize` 포함 — 모자이크 공개 때
  놓쳤다가 나중에 고친 실수를 이번엔 처음부터 방지).
- `games/categoryDrag/` 신규: `types.ts`, `useCategorizeEngine.ts`
  (`PLACE_ITEM`/`SUBMIT_PLACEMENTS`/`TURN_TIME_EXPIRED`/
  `END_GAME_MANUALLY`/`ADJUST_SCORE`), `DraggableItem.tsx`,
  `CategoryDropZone.tsx`, `CategorizeSetup.tsx`(참가자·문항 필터
  저장/복원, 최소 2명 검증), `CategorizePlay.tsx`(미배치 트레이 +
  카테고리 박스 + 제출 버튼).
- `shared/types/session.ts`, `SessionHistory.tsx`, `gameModeCatalog.tsx`
  (분류 박스 모양 아이콘, `category:'concept'`), `GameSelect.tsx` 플로우
  연결.

## 검증 결과

- `isQuestionDraft`의 `categorize` 분기를 `tsx`로 직접 실행(7개 케이스):
  유효 draft 통과, 카테고리/항목 부족, categoryIndex 범위 밖, 빈 문자열
  각각 실패.
- 리듀서를 `tsx`로 직접 실행(임시 export 후 삭제, 20개 케이스): 항목
  배치 갱신, 제출 시 정답 개수·점수 정확히 채점, 미배치 항목 오답 처리,
  시간 초과 시 동일 로직 적용, 원형 순환(참가자 수만큼 라운드 진행),
  문제 큐 소진 시 종료, 수동 종료·점수 수정, 종료 후 액션 무시.
- 브라우저로(fixture mock 디버그 하네스) 실제 검증: **게임 플레이** —
  `dispatchEvent`로 `dragstart`/`dragover`/`drop`을 직접 발생시켜 실제
  드래그 앤 드롭이 항목을 미배치→카테고리, 카테고리→카테고리로 정확히
  옮기는지 확인, 일부러 하나를 오답 위치에 놓고 제출해 "3/4개 정답"·
  30점(3×난이도2×5)이 정확히 나오는지, 다음 참가자로 원형 전환되는지,
  세션 기록에 `gameMode: "categoryDrag"`로 저장되는지(`correct:false` —
  전부 맞지 않았으므로). **문제은행 CRUD** — 분류 유형 폼에서 카테고리
  3개 중 가운데(B그룹)를 삭제했을 때 그 카테고리를 가리키던 항목은
  0번으로, 뒤 카테고리(C그룹, 2번→1번)를 가리키던 항목은 인덱스가
  정확히 당겨지는지 select 값으로 직접 확인 후 저장까지 end-to-end 검증.
- 최종 `npm run dev`(Electron) 재부팅: 에러 없이 정상 기동 확인.

## 다음 단계

CLAUDE.md "향후 추가" 목록 10개 게임 모드를 전부 구현 완료했다. 이제
CLAUDE.md 구현 순서 6단계("세션 기록 저장 + 문항별 오답 통계")까지 이미
갖춰진 상태이고, 사용자가 초기에 미뤄둔 "게임 모드 다 만든 뒤에" CSS
정리 작업이 다음 후보로 남아있다.
