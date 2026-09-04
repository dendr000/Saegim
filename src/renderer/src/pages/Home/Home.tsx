type HomeProps = {
  onNavigateToQuestionBank: () => void;
  onNavigateToClassManager: () => void;
  onNavigateToGameSelect: () => void;
  onNavigateToSessionHistory: () => void;
};

// 액자 모서리 장식 하나를 그려두고, 위치별로 CSS transform(scaleX/scaleY)만 다르게 줘서
// 네 귀퉁이에 재사용한다.
function CornerOrnament({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M4 22V12a8 8 0 0 1 8-8h10" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="home-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5c0-1 .8-1.5 2-1.5h5.5v15H6c-1.2 0-2 .5-2 1.5V5.5z" />
      <path d="M20 5.5c0-1-.8-1.5-2-1.5h-5.5v15H18c1.2 0 2 .5 2 1.5V5.5z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg className="home-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M15 13.7c2.3.5 3.5 2.2 3.5 5.3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="home-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M10 8.3l6.2 3.7-6.2 3.7v-7.4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="home-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v5.2l3.6 2.1" />
    </svg>
  );
}

function Home({
  onNavigateToQuestionBank,
  onNavigateToClassManager,
  onNavigateToGameSelect,
  onNavigateToSessionHistory
}: HomeProps) {
  return (
    <div className="home">
      <CornerOrnament className="home-corner home-corner--tl" />
      <CornerOrnament className="home-corner home-corner--tr" />
      <CornerOrnament className="home-corner home-corner--bl" />
      <CornerOrnament className="home-corner home-corner--br" />

      <h1 className="home-title">새김</h1>
      <div className="home-divider" />
      <p className="home-tagline">중학교 역사 수업용 퀴즈 게임</p>

      <div className="home-menu">
        <button type="button" className="home-tile" onClick={onNavigateToQuestionBank}>
          <BookIcon />
          문제은행 관리
        </button>
        <button type="button" className="home-tile" onClick={onNavigateToClassManager}>
          <PeopleIcon />
          학급 관리
        </button>
        <button type="button" className="home-tile home-tile-primary" onClick={onNavigateToGameSelect}>
          <PlayIcon />
          게임 시작
        </button>
        <button type="button" className="home-tile" onClick={onNavigateToSessionHistory}>
          <ClockIcon />
          세션 기록
        </button>
      </div>
    </div>
  );
}

export default Home;
