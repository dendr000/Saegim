import { useState } from 'react';
import Home from './pages/Home/Home';
import QuestionBank from './pages/QuestionBank/QuestionBank';
import ClassManager from './pages/ClassManager/ClassManager';
import GameSelect from './pages/GameSelect/GameSelect';

type Page = 'home' | 'questionBank' | 'classManager' | 'gameSelect';

function App() {
  const [page, setPage] = useState<Page>('home');

  if (page === 'questionBank') {
    return <QuestionBank onBack={() => setPage('home')} />;
  }

  if (page === 'classManager') {
    return <ClassManager onBack={() => setPage('home')} />;
  }

  if (page === 'gameSelect') {
    return <GameSelect onBack={() => setPage('home')} />;
  }

  return (
    <Home
      onNavigateToQuestionBank={() => setPage('questionBank')}
      onNavigateToClassManager={() => setPage('classManager')}
      onNavigateToGameSelect={() => setPage('gameSelect')}
    />
  );
}

export default App;
