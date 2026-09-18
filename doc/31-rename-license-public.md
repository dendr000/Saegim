# 이름 표기 통일(Saegim) + MIT 라이선스 + 저장소 공개 전환

완료일: 2026-09-18

## 한 일

- **식별자 표기를 `saegim` → `Saegim`으로 통일.**
  - `electron-builder.yml`: `win.executableName`, `portable.artifactName`을
    `Saegim`/`Saegim.exe`로 변경. 빌드 산출물 이름이 이제 `dist/Saegim.exe`가 된다.
  - `package.json`: `author`를 `Saegim`으로, `license`를 `MIT`로 명시.
  - GitHub 저장소명: `dendr000/saegim` → `dendr000/Saegim`으로 변경(`gh repo
    rename`). 기존 URL은 GitHub가 자동으로 새 이름으로 리다이렉트한다. 로컬
    `origin` 리모트 URL도 새 이름으로 갱신.
  - **예외로 남긴 것 두 가지**: `package.json`의 `name` 필드(`saegim`)는 npm이
    패키지명에 대문자를 허용하지 않는 강제 규칙이라 그대로 뒀고, `appId:
    com.saegim.quiz`는 역방향 도메인 표기 관례상 소문자를 유지하는 게 자연스러워
    브랜드 표기와 무관한 기술 식별자로 보고 남겨뒀다. `CLAUDE.md`의 "이름 표기
    규칙" 절에 두 예외 사유를 명시해뒀다.
  - `doc/` 아래 이미 작성된 과거 진행 기록(01, 08, 20, 30 등)의 `saegim.exe`
    표기는 그 시점의 사실을 남긴 로그라 소급 수정하지 않았다. `doc/CLAUDE.md`도
    원래 규칙대로("1단계 종료 시점의 스냅샷 사본, 갱신하지 않는다") 건드리지
    않았다.

- **MIT 라이선스 추가.** 루트에 `LICENSE` 파일 생성(저작권자: `dendr000`,
  2026). 별다른 라이선스 지정 없이 "무료 라이선스"라고만 요청받아, 개인 프로젝트
  공개에 가장 흔히 쓰이는 permissive 라이선스인 MIT를 기본값으로 선택했다. 다른
  라이선스(Apache 2.0, GPL 등)를 원하면 교체 가능.

- **GitHub 저장소를 공개(public)로 전환.** 전환 전에 커밋 이력 전체를 대상으로
  `.env`/자격증명 파일명, API 키·비밀번호 패턴을 검색해 노출될 만한 민감 정보가
  없음을 확인한 뒤 `gh repo edit --visibility public`으로 전환했다.

## 다음에 주의할 점

- 빌드 산출물 파일명이 `saegim.exe`에서 `Saegim.exe`로 바뀌었다. 바탕화면
  바로가기나 USB에 이미 복사해둔 구버전 `saegim.exe`가 있다면, 새로 빌드한
  `Saegim.exe`로 바꿔줘야 한다.
- 저장소가 이제 공개 상태이므로, 앞으로 커밋 시 `data/`(gitignore로 이미 제외
  중)뿐 아니라 실수로라도 개인정보·자격증명이 섞여 들어가지 않도록 한 번 더
  주의한다.
