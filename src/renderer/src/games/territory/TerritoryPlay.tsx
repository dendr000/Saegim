import { useEffect, useMemo } from 'react';
import MapView from './MapView';
import QuestionJudgePrompt from './QuestionJudgePrompt';
import { colorForTeamIndex } from './mapSvg';
import { useTerritoryEngine } from './useTerritoryEngine';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { GameFinishPayload } from '../_shared/types';
import type { TerritoryConfig } from './types';

type TerritoryPlayProps = {
  config: TerritoryConfig;
  onFinish: (result: GameFinishPayload) => void;
};

function TerritoryPlay({ config, onFinish }: TerritoryPlayProps) {
  const { state, selectRegion, judgeAnswer, endGame, reassignRegion } = useTerritoryEngine(config);

  const teamColors = useMemo(() => {
    const colors: Record<string, string> = {};
    config.teams.forEach((team, index) => {
      colors[team.id] = colorForTeamIndex(index);
    });
    return colors;
  }, [config.teams]);

  useEffect(() => {
    if (state.status !== 'finished') return;
    const regionCounts: Record<string, number> = {};
    Object.values(state.regionOwners).forEach((teamId) => {
      if (teamId) regionCounts[teamId] = (regionCounts[teamId] ?? 0) + 1;
    });
    onFinish({
      scores: config.teams.map((team) => ({ id: team.id, label: team.label, score: regionCounts[team.id] ?? 0 })),
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
  const regionCounts = config.teams.map((team) => ({
    id: team.id,
    label: team.label,
    count: Object.values(state.regionOwners).filter((owner) => owner === team.id).length
  }));
  const ownedRegions = config.regions.filter((region) => state.regionOwners[region.id] !== null);

  return (
    <div className="stage">
      <div className="stage-inner">
        <h1 className="stage-title">땅따먹기</h1>
        <p className="stage-subtitle">
          지금 차례: <span style={{ color: teamColors[currentTeam.id] }}>{currentTeam.label}</span>
        </p>

        <ul className="stage-text">
          {regionCounts.map((team) => (
            <li key={team.id} style={{ color: teamColors[team.id] }}>
              {team.label}: {team.count}칸
            </li>
          ))}
        </ul>

        <div className="stage-map-frame">
          <MapView
            svgContent={config.mapSvgContent}
            regionOwners={state.regionOwners}
            teamColors={teamColors}
            pendingRegionId={state.pendingRegionId}
            onRegionClick={selectRegion}
          />
        </div>

        {state.blockedRegionId && (
          <p className="stage-text" style={{ color: 'var(--color-wrong)' }}>
            "{config.regions.find((region) => region.id === state.blockedRegionId)?.label}" 지역에는 태깅된
            문제가 없어 선택할 수 없습니다. 다른 지역을 골라주세요.
          </p>
        )}

        {state.currentQuestion && <QuestionJudgePrompt question={state.currentQuestion} onJudge={judgeAnswer} />}

        <button type="button" className="stage-button" onClick={endGame} style={{ marginTop: '1rem' }}>
          게임 종료
        </button>

        {ownedRegions.length > 0 && (
          <div className="stage-panel">
            <strong className="stage-text">지역 재배정 (판정 실수 등을 바로잡을 때)</strong>
            {ownedRegions.map((region) => (
              <div key={region.id} className="stage-text" style={{ margin: '0.5rem 0' }}>
                {region.label}:{' '}
                <select
                  value={state.regionOwners[region.id] ?? ''}
                  onChange={(event) => reassignRegion(region.id, event.target.value || null)}
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

export default TerritoryPlay;
