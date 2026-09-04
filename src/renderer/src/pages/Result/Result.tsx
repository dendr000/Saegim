import Scoreboard from '../../games/_shared/Scoreboard';
import type { ParticipantScore } from '../../games/_shared/types';

type ResultProps = {
  scores: ParticipantScore[];
  onDone: () => void;
};

function Result({ scores, onDone }: ResultProps) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>결과</h1>
      <Scoreboard entries={scores} />
      <button type="button" onClick={onDone} style={{ marginTop: '1rem' }}>
        확인
      </button>
    </div>
  );
}

export default Result;
