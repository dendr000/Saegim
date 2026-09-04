import Scoreboard from '../../games/_shared/Scoreboard';
import type { ParticipantScore } from '../../games/_shared/types';

type ResultProps = {
  scores: ParticipantScore[];
  onDone: () => void;
};

function Result({ scores, onDone }: ResultProps) {
  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">결과</h1>
        <Scoreboard entries={scores} />
        <button type="button" className="stage-button stage-button-primary" onClick={onDone} style={{ marginTop: '1.5rem' }}>
          확인
        </button>
      </div>
    </div>
  );
}

export default Result;
