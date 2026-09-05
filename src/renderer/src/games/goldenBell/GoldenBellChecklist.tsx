import type { Question } from '../../../../shared/types/question';
import AnswerConfirm from '../_shared/AnswerConfirm';
import { correctAnswerText } from './answerText';
import type { ParticipantRuntimeState } from './types';

type GoldenBellChecklistProps = {
  question: Question;
  participants: ParticipantRuntimeState[];
  judgedThisRound: Set<string>;
  onJudge: (participantId: string, judgedCorrect: boolean) => void;
  onGrantRevival: (participantId: string) => void;
  onReviveManually: (participantId: string) => void;
};

function GoldenBellChecklist({
  question,
  participants,
  judgedThisRound,
  onJudge,
  onGrantRevival,
  onReviveManually
}: GoldenBellChecklistProps) {
  const alive = participants.filter((participant) => participant.status === 'alive');
  const eliminated = participants.filter((participant) => participant.status === 'eliminated');

  return (
    <div>
      <p className="stage-question">{question.payload.question}</p>

      {question.type === 'multipleChoice' && (
        <ul>
          {question.payload.choices.map((choice, index) => (
            <li key={index} className="stage-text">
              {index + 1}. {choice}
            </li>
          ))}
        </ul>
      )}

      {/* 학생이 화이트보드 등으로 답을 보이는 방식이라, 객관식도 단답형과 마찬가지로
          정답을 먼저 가려둔다 — 교사가 버튼을 눌러야만 드러난다. */}
      <AnswerConfirm key={question.id}>
        <p className="stage-text">
          정답: <strong>{correctAnswerText(question)}</strong>
        </p>
      </AnswerConfirm>

      <table className="stage-scoreboard">
        <thead>
          <tr>
            <th>이름</th>
            <th>부활권</th>
            <th>판정</th>
          </tr>
        </thead>
        <tbody>
          {alive.map((participant) => {
            const judged = judgedThisRound.has(participant.id);
            return (
              <tr key={participant.id}>
                <td>{participant.label}</td>
                <td>
                  {participant.hasRevival ? '보유' : '없음'}{' '}
                  <button
                    type="button"
                    className="stage-button stage-button-small"
                    disabled={participant.hasRevival}
                    onClick={() => onGrantRevival(participant.id)}
                  >
                    부활권 부여
                  </button>
                </td>
                <td>
                  {judged ? (
                    <span className="stage-text">판정됨</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="stage-button stage-button-primary stage-button-small"
                        onClick={() => onJudge(participant.id, true)}
                      >
                        정답 처리
                      </button>{' '}
                      <button
                        type="button"
                        className="stage-button stage-button-small"
                        onClick={() => onJudge(participant.id, false)}
                      >
                        오답 처리
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {eliminated.length > 0 && (
        <div className="stage-panel">
          <strong className="stage-text">탈락자</strong>
          <ul>
            {eliminated.map((participant) => (
              <li key={participant.id} className="stage-text">
                {participant.label}{' '}
                <button
                  type="button"
                  className="stage-button stage-button-small"
                  onClick={() => onReviveManually(participant.id)}
                >
                  부활시키기
                </button>{' '}
                <button
                  type="button"
                  className="stage-button stage-button-small"
                  disabled={participant.hasRevival}
                  onClick={() => onGrantRevival(participant.id)}
                >
                  부활권 부여
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GoldenBellChecklist;
