type HomeProps = {
  onNavigateToQuestionBank: () => void;
  onNavigateToClassManager: () => void;
  onNavigateToGameSelect: () => void;
  onNavigateToSessionHistory: () => void;
};

function Home({
  onNavigateToQuestionBank,
  onNavigateToClassManager,
  onNavigateToGameSelect,
  onNavigateToSessionHistory
}: HomeProps) {
  return (
    <div className="page">
      <h1>새김</h1>
      <p className="muted-text">중학교 역사 수업용 퀴즈 게임</p>
      <div className="button-row">
        <button type="button" onClick={onNavigateToQuestionBank}>
          문제은행 관리
        </button>
        <button type="button" onClick={onNavigateToClassManager}>
          학급 관리
        </button>
        <button type="button" className="button-primary" onClick={onNavigateToGameSelect}>
          게임 시작
        </button>
        <button type="button" onClick={onNavigateToSessionHistory}>
          세션 기록
        </button>
      </div>
    </div>
  );
}

export default Home;
