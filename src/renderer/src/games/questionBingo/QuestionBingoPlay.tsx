import { useEffect, useMemo } from 'react';
import BingoGrid from './BingoGrid';
import QuestionJudgePrompt from '../territory/QuestionJudgePrompt';
import { colorForTeamIndex } from '../territory/mapSvg';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import { useQuestionBingoEngine } from './useQuestionBingoEngine';
import type { QuestionBingoConfig } from './types';

type QuestionBingoPlayProps = {
  config: QuestionBingoConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function QuestionBingoPlay({ config, onFinish }: QuestionBingoPlayProps) {
  const { state, selectCell, judgeAnswer, endGame, reassignCell } = useQuestionBingoEngine(config);

  const teamColors = useMemo(() => {
    const colors: Record<string, string> = {};
    config.teams.forEach((team, index) => {
      colors[team.id] = colorForTeamIndex(index);
    });
    return colors;
  }, [config.teams]);

  useEffect(() => {
    if (state.status !== 'finished') return;
    const cellCounts: Record<string, number> = {};
    Object.values(state.cellOwners).forEach((teamId) => {
      if (teamId) cellCounts[teamId] = (cellCounts[teamId] ?? 0) + 1;
    });
    onFinish({
      scores: config.teams.map((team) => {
        const owned = cellCounts[team.id] ?? 0;
        const lineBonus = (state.completedLines[team.id]?.length ?? 0) * config.gridSize;
        return { id: team.id, label: team.label, score: owned + lineBonus };
      }),
      answers: state.answerHistory
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (!state.lastResult) return;
    if (state.lastResult.correct) playCorrectSound();
    else playWrongSound();
  }, [state.lastResult]);

  if (state.status === 'finished') {
    return (
      <div className="stage">
        <p className="stage-text">결과 화면으로 이동 중...</p>
      </div>
    );
  }

  const currentTeam = config.teams[state.currentTeamIndex];
  const teamStats = config.teams.map((team) => {
    const owned = state.cells.filter((cell) => state.cellOwners[cell.id] === team.id).length;
    const lines = state.completedLines[team.id]?.length ?? 0;
    return { id: team.id, label: team.label, owned, lines, score: owned + lines * config.gridSize };
  });
  const ownedCells = state.cells.filter((cell) => state.cellOwners[cell.id] !== null);

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">문제 빙고</h1>
        <p className="stage-subtitle">
          지금 차례: <span style={{ color: teamColors[currentTeam.id] }}>{currentTeam.label}</span>
        </p>

        <ul className="stage-text">
          {teamStats.map((team) => (
            <li key={team.id} style={{ color: teamColors[team.id] }}>
              {team.label}: {team.owned}칸{team.lines > 0 ? ` + 줄 완성 ${team.lines}회(+${team.lines * config.gridSize}점)` : ''} ={' '}
              {team.score}점
            </li>
          ))}
        </ul>

        <BingoGrid
          cells={state.cells}
          gridSize={config.gridSize}
          cellOwners={state.cellOwners}
          teamColors={teamColors}
          pendingCellId={state.pendingCellId}
          onCellClick={selectCell}
        />

        {state.blockedCellId && (
          <p className="stage-text" style={{ color: 'var(--color-wrong)' }}>
            이 칸은 난이도에 맞는 문제가 없어 선택할 수 없습니다. 다른 칸을 골라주세요.
          </p>
        )}

        {state.currentQuestion && <QuestionJudgePrompt question={state.currentQuestion} onJudge={judgeAnswer} />}

        <button type="button" className="stage-button" onClick={endGame} style={{ marginTop: '1rem' }}>
          게임 종료
        </button>

        {ownedCells.length > 0 && (
          <div className="stage-panel">
            <strong className="stage-text">칸 재배정 (판정 실수 등을 바로잡을 때)</strong>
            {ownedCells.map((cell) => (
              <div key={cell.id} className="stage-text" style={{ margin: '0.5rem 0' }}>
                {cell.row + 1}행 {cell.col + 1}열 (난이도 {cell.difficulty}):{' '}
                <select
                  value={state.cellOwners[cell.id] ?? ''}
                  onChange={(event) => reassignCell(cell.id, event.target.value || null)}
                >
                  <option value="">미점령으로</option>
                  {config.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionBingoPlay;
