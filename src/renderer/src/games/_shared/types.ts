// 게임 로직이 응답의 출처를 몰라도 되게 하는 정규화된 입력 객체.
// 교사 키보드/클릭에서 왔는지, 나중에 학생 기기(WebSocket)에서 왔는지 이 타입만 봐서는 알 수 없다.
export type Answer = {
  participantId: string;
  value: unknown;
  submittedAt: number;
};

// 점수판이 개인전/팀전을 구분하지 않고 그리기 위한 공통 표시 단위.
export type ParticipantScore = {
  id: string;
  label: string;
  score: number;
};
