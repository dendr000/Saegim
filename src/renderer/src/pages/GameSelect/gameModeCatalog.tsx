import type { ReactNode } from 'react';
import type { GameMode } from '../../../../shared/types/session';

// 게임 모드가 늘어나도(CLAUDE.md "향후 추가" 목록) 이 카탈로그에 항목만 추가하면
// 게임 선택 화면의 검색·분류가 자동으로 따라오게 하기 위한 데이터 정의.
export type GameModeCategory = 'solo' | 'team' | 'concept';

export type GameModeCatalogEntry = {
  id: GameMode;
  title: string;
  description: string;
  category: GameModeCategory;
  icon: ReactNode;
};

export const GAME_MODE_CATEGORY_LABELS: Record<GameModeCategory, string> = {
  solo: '개인전 · 전체 참여형',
  team: '팀 대항형',
  concept: '개념 학습형'
};

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

function StopwatchIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <circle cx="12" cy="13.5" r="8" />
      <path d="M12 13.5V9.5" />
      <path d="M9 3.5h6" />
      <path d="M18.5 6l1.2-1.2" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <path d="M4 6.5l5-2 6 2 5-2v13l-5 2-6-2-5 2v-13z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <ellipse cx="12" cy="7" rx="7.5" ry="3" />
      <path d="M4.5 7v5c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V7" />
      <path d="M4.5 12v5c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-5" />
    </svg>
  );
}

function SpeechBubbleIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-6z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.44.95 1.1 1 1.9l.1.7h4.8l.1-.7c.05-.8.4-1.46 1-1.9A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <path d="M12 3.5l7 3v5.2c0 4.6-3 7.6-7 8.8-4-1.2-7-4.2-7-8.8V6.5l7-3z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

function BombIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <circle cx="11" cy="14" r="7" />
      <path d="M15.5 8.5l2-2" />
      <path d="M17 4l2.5 1-1 2.5" />
    </svg>
  );
}

function CardMatchIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <rect x="3" y="6" width="8" height="12" rx="1.2" transform="rotate(-8 7 12)" />
      <rect x="13" y="6" width="8" height="12" rx="1.2" transform="rotate(8 17 12)" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <path d="M12 3.5c-1 0-1.8.8-1.8 1.8v.6C7.8 6.6 6 8.9 6 11.6v3.4l-1.5 2.5h15L18 15v-3.4c0-2.7-1.8-5-4.2-5.7v-.6c0-1-.8-1.8-1.8-1.8z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ChanceCardIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <rect x="5" y="4" width="14" height="16" rx="1.5" />
      <path d="M12 8.5l1.2 2.4 2.6.4-1.9 1.9.45 2.6-2.35-1.25-2.35 1.25.45-2.6-1.9-1.9 2.6-.4z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg {...iconProps} className="mode-card-icon">
      <rect x="3.5" y="3.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="3.5" width="5" height="5" rx="1" />
      <rect x="15.5" y="3.5" width="5" height="5" rx="1" />
      <rect x="3.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="15.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="3.5" y="15.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="15.5" width="5" height="5" rx="1" />
      <rect x="15.5" y="15.5" width="5" height="5" rx="1" />
    </svg>
  );
}

export const GAME_MODE_CATALOG: GameModeCatalogEntry[] = [
  {
    id: 'timeAttack',
    title: '타임어택 콤보',
    description: '제한시간 안에 연속 정답으로 배수를 쌓는 개인전.',
    category: 'solo',
    icon: <StopwatchIcon />
  },
  {
    id: 'initialLetter',
    title: '초성 퀴즈',
    description: '초성만 보고 용어를 맞히는 개인전.',
    category: 'solo',
    icon: <SpeechBubbleIcon />
  },
  {
    id: 'hintDeduction',
    title: '힌트 차감형',
    description: '힌트를 쓸 때마다 점수가 깎이는 개인전. 스스로 실력을 계산하게 만든다.',
    category: 'solo',
    icon: <LightbulbIcon />
  },
  {
    id: 'territory',
    title: '땅따먹기',
    description: '지도 위 지역을 골라 문제를 풀고 점령하는 팀 대항전.',
    category: 'team',
    icon: <MapIcon />
  },
  {
    id: 'betting',
    title: '베팅형',
    description: '문제 공개 전 점수를 걸고, 마지막 문제로 순위가 뒤집히는 팀 대항전.',
    category: 'team',
    icon: <CoinsIcon />
  },
  {
    id: 'bossRaid',
    title: '보스 레이드',
    description: '반 전체가 힘을 합쳐 체력을 가진 보스를 상대하는 협동전.',
    category: 'team',
    icon: <ShieldIcon />
  },
  {
    id: 'questionBingo',
    title: '문제 빙고',
    description: '난이도가 미리 보이는 격자에서 칸을 점령하고, 줄을 완성하면 보너스를 받는 팀 대항전.',
    category: 'team',
    icon: <GridIcon />
  },
  {
    id: 'bombPass',
    title: '폭탄 돌리기',
    description: '정답을 맞혀야 폭탄을 넘길 수 있는 대항전. 언제 터질지는 아무도 모른다.',
    category: 'team',
    icon: <BombIcon />
  },
  {
    id: 'cardMatching',
    title: '카드 매칭',
    description: '용어와 정의 카드를 뒤집어 짝을 맞히는 개념 학습형 게임.',
    category: 'concept',
    icon: <CardMatchIcon />
  },
  {
    id: 'goldenBell',
    title: '골든벨 서바이벌',
    description: '틀리면 탈락하는 전원 참여형 서바이벌. 부활권으로 한 번은 봐줄 수 있다.',
    category: 'solo',
    icon: <BellIcon />
  },
  {
    id: 'chanceCard',
    title: '찬스카드',
    description: '정답 시 점수 훔치기·순서 뒤집기·방어막 카드를 무작위로 얻는 팀 대항전.',
    category: 'team',
    icon: <ChanceCardIcon />
  }
];
