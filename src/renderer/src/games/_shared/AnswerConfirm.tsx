import { useState, type ReactNode } from 'react';

type AnswerConfirmProps = {
  children: ReactNode;
};

// 판정 화면이 곧 TV·프로젝터로 학생들에게 보이는 화면이라, 정답 텍스트를 기본적으로
// 숨겨두고 교사가 "정답 확인"을 눌러야만 그 자리에 나타나게 한다. 판정 버튼(정답
// 처리/오답 처리)은 이 컴포넌트가 감싸지 않으므로 항상 그대로 누를 수 있다 —
// 숨기는 건 오직 화면에 뜨는 정답 "텍스트"뿐이다.
// 문제가 바뀔 때마다 부모가 key={question.id}를 줘서 다시 마운트시키면, 매번
// 숨김 상태로 리셋된다.
function AnswerConfirm({ children }: AnswerConfirmProps) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <button type="button" className="stage-button stage-button-small" onClick={() => setRevealed(true)}>
        정답 확인
      </button>
    );
  }

  return <>{children}</>;
}

export default AnswerConfirm;
