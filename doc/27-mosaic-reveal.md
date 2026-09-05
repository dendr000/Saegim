# 모자이크 공개 (개인전 · 전체 참여형)

완료일: 2026-09-05

## 목표

[23-remaining-game-modes-plan.md](23-remaining-game-modes-plan.md)에서 정한
9순위 게임. CLAUDE.md: "모자이크 공개 — 사진/그림이 서서히 선명해지고,
빨리 맞힐수록 고득점." 지금까지 만든 7개 게임은 전부 이미 있는 객관식/단답형
문항을 재사용했지만, 이번엔 스키마엔 정의돼 있었지만 CRUD·업로드 인프라가
전혀 없던 `imageIdentify` 타입을 처음으로 실제로 살렸다 — 이 앱 최초의
파일 업로드 기능.

## "이미지는 어떻게 넣지?"

문제은행의 문항 추가 화면에서 유형을 "이미지 판별"로 고르면 파일 선택
버튼이 나타난다. 교사가 자기 컴퓨터의 사진을 고르면 그 자리에서 미리보기가
뜨고, "추가"를 누르는 순간 `data/images/`에 실제 파일로 저장되며 문항에는
저장된 파일명만 기록된다 — `data/maps/`와 같은 결이지만, 지도는 교사가
파일 탐색기로 미리 넣어두는 것과 달리 이번엔 앱 안에서 직접 업로드한다.
CSV로는 이미지 문항을 만들 수 없다(이미지 바이너리를 CSV 행에 담을 방법이
없어서) — 폼으로만 추가/수정한다.

## 설계 결정 — 선행 인프라

- **`shared/types/question.ts`**: `SUPPORTED_QUESTION_TYPES`에
  `imageIdentify` 추가, `isQuestionDraft`에 검증 분기 추가.
- **`games/_shared/gradeAnswer.ts`를 확장해서 재사용**했다(새 채점 함수를
  안 만듦) — `imageIdentify`도 단답형처럼 교사가 `{judgedCorrect}`로
  판정하고 `payload.answer`가 정답 텍스트인 구조가 똑같아서, 기존 조건에
  `question.type === 'imageIdentify'`만 추가했다.
- **`shared/types/imagesApi.ts`(신규) + `db/repositories/imageRepository.ts`
  (신규) + `main/ipc/images.ts`(신규)**: `mapRepository.ts`(읽기 전용)
  구조를 본떴지만 **쓰기(업로드)가 추가된 이 앱 최초의 사례**다. 안전한
  파일명 검증(확장자 화이트리스트), 크기 제한(8MB), `randomUUID()` 파일명
  생성. 이미지 자체는 IPC로 못 넘기니 base64 data URL 문자열로 주고받는다.
- **`src/renderer/index.html`의 CSP를 고쳤다**: `img-src`가 명시돼 있지
  않아 `default-src 'self'`로 떨어져 `data:` 이미지가 차단되고 있었다 —
  `img-src 'self' data:` 추가로 해결. 이 앱이 이미지를 렌더링하는 첫 사례라
  지금까지 안 걸렸던 문제.
- **`pages/QuestionBank/QuestionForm.tsx`**: `type==='imageIdentify'`
  분기 추가 — 파일 선택은 즉시 업로드하지 않고 `FileReader`로 미리보기만
  만들어두고, 실제 `window.images.upload()`는 폼 제출 시점에만 호출한다
  (골랐다가 취소할 수도 있어서). 수정 모드에서 새 파일을 안 고르면 기존
  `imageFileName`을 그대로 유지.
- **탐색 중 발견한 기존 버그도 같이 고쳤다**: `QuestionBank.tsx`의 목록
  화면에서 "수정" 버튼이 `multipleChoice`/`shortAnswer`에만 열려 있어
  `imageIdentify` 문항을 한 번 만들면 수정할 방법이 없었다 — 조건에 추가.
  `answerSummary()`도 `imageIdentify`를 안 다뤄서 정답 칸에 안내 문구만
  뜨고 있었다 — 정답 텍스트가 뜨도록 고쳤다.
- CSV(`shared/questionCsv.ts`)는 `QUESTION_TYPE_LABELS`에 라벨만 추가하고
  `LABEL_TO_TYPE`/파서는 그대로 뒀다 — CSV는 여전히 객관식/단답형만
  지원하는 게 의도된 동작.

## 설계 결정 — 게임

- **타임어택 "동시 진행" 모드 구조를 그대로 따랐다**: 활성 참가자 없이
  이미지 하나를 띄우고, 아무나 답을 외치면 교사가 검색-선택 UI로 판정.
  `imageIdentify`는 객관식 변형이 없어(늘 주관식처럼 판정) `SimultaneousControls`
  보다 분기가 단순한 `MosaicRevealControls`를 새로 만들었다.
- **점수는 시간 기반이라 새 공식이 필요했다**: `calculateMosaicScore
  (difficulty, remainingSeconds, totalSeconds) = difficulty*10 +
  round((remainingSeconds/totalSeconds) * 50)`. 판정 시점의 남은 시간을
  리듀서까지 전달해야 해서, `SUBMIT_ANSWER` 액션에 정규화된 `Answer`
  객체와 별개로 `remainingSecondsAtAnswer` 필드를 뒀다 — "누가 답했는지"가
  아니라 "그 순간 게임 시계가 몇 초였는지"라는 이 게임 고유의 타이밍
  정보라 `Answer` 밖에 둔 것.
- **블러는 `<img>`에 인라인 `filter: blur()`**, 남은 시간 비율에 선형
  비례(24px→0px). 남은 시간 숫자는 폭탄 돌리기와 반대로 화면에 그대로
  보여준다(급박함이 재미 요소). 이 시각적 공개 자체가 게임의 본질이라
  "CSS는 게임 모드 다 만든 뒤에"라는 방침의 예외로 지금 넣었다 — 나머지
  버튼·레이아웃은 여전히 기존 클래스만 썼다.
- 오답이면 문제 유지(동시 진행과 같은 이유), 시간 초과 시 아무도 못
  맞힌 채 다음 문제로 자동 전환, 문제 큐 소진 시 종료.

## 한 일

- 선행 인프라 전체(위 목록) + `games/mosaicReveal/` 신규: `types.ts`,
  `scoring.ts`, `useMosaicRevealEngine.ts`, `MosaicRevealControls.tsx`,
  `MosaicRevealSetup.tsx`, `MosaicRevealPlay.tsx`(이미지 로드 + 블러 렌더링).
- `shared/types/session.ts`, `SessionHistory.tsx`, `gameModeCatalog.tsx`
  (사진 모양 아이콘, `category:'solo'`), `GameSelect.tsx` 플로우 연결.

## 검증 결과

- `npm run typecheck` 통과.
- `calculateMosaicScore`를 `tsx`로 직접 실행(8개 케이스): 남은 시간이
  많을수록 점수가 높은지, 시간 소진 시 기본 점수만, 난이도별 기본 점수,
  `totalSeconds`가 0이어도 안전한지.
- 리듀서를 `tsx`로 직접 실행(임시 export 후 삭제, 15개 케이스): 오답 시
  문제 유지, 정답 시 그 시점 남은 시간 기준 점수·다음 문제 전환, 스킵,
  시간 초과, 문제 큐 소진 시 종료, 수동 종료·점수 수정, 종료 후 액션 무시.
- 브라우저로(fixture mock 디버그 하네스, `window.images` 목도 함께 구현)
  실제 검증: **게임 플레이** — CSP 수정 후 `<img>`가 실제로 렌더링되는지
  (`naturalWidth`로 디코딩 성공 확인), 시간에 따라 blur가 실제로 줄어드는지,
  판정 시점의 남은 시간이 정확히 점수에 반영되는지(58점 등 실측), 세션
  기록에 `gameMode: "mosaicReveal"`로 저장되는지. **문제은행 업로드** —
  기존 이미지 문항의 "수정" 진입 시 미리보기가 로드되는지, 새 문항 추가 시
  `<input type="file">`에 프로그래밍적으로 파일을 주입해(`DataTransfer`)
  실제로 미리보기가 뜨는지, 제출 시 `window.images.upload()`가 호출되어
  저장된 파일명으로 문항이 생성되고 그 파일명으로 다시 `get()` 조회가
  되는지까지 end-to-end 확인.
- 탐색 중 `QuestionBank.tsx`의 기존 버그(이미지 문항 수정 버튼 누락,
  정답 요약 미표시) 발견 후 같이 수정.
- 최종 `npm run dev`(Electron) 재부팅: 에러 없이 정상 기동 확인(main
  프로세스에 새 IPC 파일이 포함돼 빌드됨을 로그로 확인).

## 다음 단계

10순위 분류 드래그가 마지막 남은 게임 — 새 `QuestionType`(`categorize`)
스키마 추가와 네이티브 드래그 앤 드롭 UI가 필요해([23번](23-remaining-game-modes-plan.md)
참고) 가장 큰 작업으로 남아있다. 사용자 지시가 있을 때 진행.
