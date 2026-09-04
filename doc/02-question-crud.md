# 2단계: 문항 CRUD + CSV 일괄 가져오기

완료일: 2026-09-04

## 목표

CLAUDE.md 구현 순서 2단계. 문항을 만들고 관리할 수 있어야 하고, "CSV 붙여넣기는
최우선 기능"이므로 엑셀/구글시트에서 복사한 표를 그대로 붙여넣어 여러 문항을
한 번에 넣을 수 있어야 한다.

## 스키마 결정 (CLAUDE.md 원안에서 보강한 부분)

CLAUDE.md의 `Question` 타입은 `payload: unknown`이었고 질문 텍스트를 넣을 자리가
없었다. [src/shared/types/question.ts](../src/shared/types/question.ts)에서:
- `payload: unknown` → 유형별 discriminated union으로 구체화.
- 모든 유형의 payload에 `question`(질문 텍스트) 필드를 공통으로 추가.
- 6개 유형 스키마를 전부 지금 확정했지만, 이번 단계에서 폼과 CSV를 지원하는 건
  `multipleChoice`(객관식)·`shortAnswer`(단답형) 둘뿐이다. 나머지 4개
  (`initialLetter`, `sourceReading`, `imageIdentify`, `timelineOrder`)는 해당
  게임 모드를 만들 때 전용 폼을 추가한다.

## 한 일

- **데이터 계층**: [src/db/repositories/jsonFile.ts](../src/db/repositories/jsonFile.ts)
  (공통 JSON 읽기/쓰기), [questionRepository.ts](../src/db/repositories/questionRepository.ts)
  (`getAll/create/update/remove/bulkCreate`, `data/questions.json`에 저장).
- **IPC**: `src/main/ipc/questions.ts`에 `questions:list/create/update/delete/bulkCreate`
  등록. `bulkCreate`는 렌더러가 보낸 값을 다시 한번 구조 검증(`isQuestionDraft`)한 뒤
  저장하고, 행별 성공/실패를 반환한다.
- **CSV 형식**: `시대,단원,난이도,유형,질문,보기1,보기2,보기3,보기4,정답` — 유형은
  "객관식"/"단답형" 한글로 입력. 구분자는 쉼표/탭 자동 인식(엑셀 셀 복사는 탭으로
  붙여넣기 때문). 파싱은 `papaparse` 사용 — 순수 JS라 네이티브 빌드 리스크 없음.
  검증 로직은 [src/shared/questionCsv.ts](../src/shared/questionCsv.ts)에 있어
  렌더러(미리보기)와 향후 다른 진입점에서 재사용 가능.
- **화면**: `App.tsx`가 이제 Home ↔ QuestionBank를 전환한다(react-router 없이
  단순 상태 스위처). 1단계의 "빌드 성공" 화면은 역할이 끝나 제거함.
  `pages/QuestionBank/`에 목록+필터, 추가/수정 폼, CSV 가져오기 패널을 파일별로 분리.

## 검증 결과

- `npm run typecheck` 통과.
- **자동 검증(직접 수행)**: 메인 프로세스에 임시 자가진단 코드를 넣어 `npm run dev`로
  실행 → 저장소 계층의 생성(객관식/단답형)·수정·삭제·bulkCreate(정상 1건 + 잘못된
  난이도 1건)가 모두 기대대로 동작함을 로그와 `data/questions.json` 파일로 직접
  확인. 검증 후 임시 코드와 테스트 데이터는 제거함 (`data/questions.json`은 `[]`로 초기화).
- **화면 조작**: 사용자가 실기기에서 직접 확인함 — 문항 추가, CSV 예시 붙여넣기→
  미리보기(2건 모두 성공)→가져오기("2개 추가됨, 0개 실패"), 목록 반영까지 스크린샷으로
  확인됨. "모든 단계 모두 정상적으로 확인됨."

## 확인해 주세요

`npm run dev`로 실행한 뒤:
1. 홈 화면 → "문제은행 관리" 클릭 → 문제은행 화면으로 이동하는지.
2. "문항 추가" → 객관식 하나, 단답형 하나 만들어서 목록에 뜨는지.
3. 방금 만든 문항 "수정" → 값 바꾸고 저장 → 목록에 반영되는지.
4. "CSV로 가져오기" 클릭 → 패널에 보이는 예시를 그대로 붙여넣고 "미리보기" →
   두 행 다 "성공"으로 뜨는지 → "가져오기" → 목록에 2개 추가되는지.
5. 일부러 이상한 CSV(예: 난이도를 4로, 정답을 보기에 없는 값으로) 붙여넣고
   미리보기에서 "실패"와 에러 메시지가 뜨는지.
6. 문항 하나 "삭제" → 목록에서 사라지는지.

## 다음 단계

CLAUDE.md 구현 순서 3단계: 학급/학생·팀 관리.
