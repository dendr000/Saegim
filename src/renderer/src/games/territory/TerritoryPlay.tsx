import { useEffect, useMemo } from 'react';
import MapView from './MapView';
import QuestionJudgePrompt from './QuestionJudgePrompt';
import { colorForTeamIndex } from './mapSvg';
import { useTerritoryEngine } from './useTerritoryEngine';
import { playCorrectSound, playWrongSound } from '../_shared/sounds';
import type { ParticipantScore } from '../_shared/types';
import type { TerritoryConfig } from './types';

type TerritoryPlayProps = {
  config: TerritoryConfig;
  onFinish: (scores: ParticipantScore[]) => void;
};

function TerritoryPlay({ config, onFinish }: TerritoryPlayProps) {
  const { state, selectRegion, judgeAnswer, endGame } = useTerritoryEngine(config);

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
    onFinish(config.teams.map((team) => ({ id: team.id, label: team.label, score: regionCounts[team.id] ?? 0 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (!state.lastResult) return;
    if (state.lastResult.correct) playCorrectSound();
    else playWrongSound();
  }, [state.lastResult]);

  if (state.status === 'finished') {
    return <p>결과 화면으로 이동 중...</p>;
  }

  const currentTeam = config.teams[state.currentTeamIndex];
  const regionCounts = config.teams.map((team) => ({
    id: team.id,
    label: team.label,
    count: Object.values(state.regionOwners).filter((owner) => owner === team.id).length
  }));

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>땅따먹기</h1>
      <p style={{ fontSize: '1.5rem' }}>
        지금 차례: <span style={{ color: teamColors[currentTeam.id] }}>{currentTeam.label}</span>
      </p>

      <ul>
        {regionCounts.map((team) => (
          <li key={team.id} style={{ color: teamColors[team.id] }}>
            {team.label}: {team.count}칸
          </li>
        ))}
      </ul>

      <MapView
        svgContent={config.mapSvgContent}
        regionOwners={state.regionOwners}
        teamColors={teamColors}
        pendingRegionId={state.pendingRegionId}
        onRegionClick={selectRegion}
      />

      {state.blockedRegionId && (
        <p style={{ color: 'crimson' }}>
          "{config.regions.find((region) => region.id === state.blockedRegionId)?.label}" 지역에는 태깅된
          문제가 없어 선택할 수 없습니다. 다른 지역을 골라주세요.
        </p>
      )}

      {state.currentQuestion && <QuestionJudgePrompt question={state.currentQuestion} onJudge={judgeAnswer} />}

      <button type="button" onClick={endGame} style={{ marginTop: '1rem' }}>
        게임 종료
      </button>
    </div>
  );
}

export default TerritoryPlay;
