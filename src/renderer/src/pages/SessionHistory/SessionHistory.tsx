import { useEffect, useState } from 'react';
import type { GameSession } from '../../../../shared/types/session';
import type { Question } from '../../../../shared/types/question';

type SessionHistoryProps = {
  onBack: () => void;
};

const GAME_MODE_LABELS: Record<string, string> = {
  timeAttack: '타임어택 콤보',
  territory: '땅따먹기',
  betting: '베팅형',
  initialLetter: '초성 퀴즈',
  hintDeduction: '힌트 차감형',
  bossRaid: '보스 레이드',
  questionBingo: '문제 빙고',
  bombPass: '폭탄 돌리기',
  cardMatching: '카드 매칭',
  goldenBell: '골든벨 서바이벌',
  chanceCard: '찬스카드',
  mosaicReveal: '모자이크 공개'
};

function SessionHistory({ onBack }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    window.sessions.list().then(setSessions);
    window.questions.list().then(setQuestions);
  }, []);

  const questionStats = questions
    .map((question) => {
      let correctCount = 0;
      let wrongCount = 0;
      sessions.forEach((session) => {
        session.answers.forEach((answer) => {
          if (answer.questionId !== question.id) return;
          if (answer.correct) correctCount += 1;
          else wrongCount += 1;
        });
      });
      const total = correctCount + wrongCount;
      return { question, correctCount, wrongCount, total, wrongRate: total > 0 ? wrongCount / total : 0 };
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.wrongRate - a.wrongRate);

  const sortedSessions = [...sessions].sort((a, b) => b.playedAt - a.playedAt);

  return (
    <div className="page">
      <button type="button" className="page-back" onClick={onBack}>
        ← 홈
      </button>
      <h1>세션 기록</h1>

      <h2>지난 세션</h2>
      {sortedSessions.length === 0 ? (
        <p className="muted-text">아직 기록된 세션이 없습니다.</p>
      ) : (
        <div className="table-scroll" style={{ marginBottom: '2rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>학급</th>
                <th>게임</th>
                <th>최종 점수</th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((session) => (
                <tr key={session.id}>
                  <td>{new Date(session.playedAt).toLocaleString('ko-KR')}</td>
                  <td>{session.className}</td>
                  <td>{GAME_MODE_LABELS[session.gameMode] ?? session.gameMode}</td>
                  <td className="wrap-text">
                    {[...session.finalScores]
                      .sort((a, b) => b.score - a.score)
                      .map((score) => `${score.label} ${score.score}점`)
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>문항별 오답 통계</h2>
      {questionStats.length === 0 ? (
        <p className="muted-text">아직 게임에서 나온 문제가 없습니다.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>질문</th>
                <th>시대/단원</th>
                <th>정답</th>
                <th>오답</th>
                <th>오답률</th>
              </tr>
            </thead>
            <tbody>
              {questionStats.map((entry) => (
                <tr key={entry.question.id}>
                  <td className="wrap-text">{entry.question.payload.question}</td>
                  <td>
                    {entry.question.era} / {entry.question.unit}
                  </td>
                  <td>{entry.correctCount}</td>
                  <td>{entry.wrongCount}</td>
                  <td>{Math.round(entry.wrongRate * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SessionHistory;
