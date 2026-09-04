type HomeProps = {
  onNavigateToQuestionBank: () => void;
  onNavigateToClassManager: () => void;
  onNavigateToGameSelect: () => void;
};

function Home({ onNavigateToQuestionBank, onNavigateToClassManager, onNavigateToGameSelect }: HomeProps) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>새김</h1>
      <p>중학교 역사 수업용 퀴즈 게임</p>
      <button onClick={onNavigateToQuestionBank} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
        문제은행 관리
      </button>{' '}
      <button onClick={onNavigateToClassManager} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
        학급 관리
      </button>{' '}
      <button onClick={onNavigateToGameSelect} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
        게임 시작
      </button>
    </div>
  );
}

export default Home;
