import { useEffect, useRef } from 'react';

type MapViewProps = {
  svgContent: string;
  regionOwners: Record<string, string | null>;
  teamColors: Record<string, string>;
  // 판정 대기 중인 칸 — 클릭 처리 중임을 흐리게 표시한다.
  pendingRegionId: string | null;
  onRegionClick: (regionId: string) => void;
};

const UNOWNED_COLOR = '#d9d9d9';

function MapView({ svgContent, regionOwners, teamColors, pendingRegionId, onRegionClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onRegionClickRef = useRef(onRegionClick);
  onRegionClickRef.current = onRegionClick;

  // 클릭은 컨테이너 하나에만 위임해서 받는다. dangerouslySetInnerHTML로 넣은 내부 SVG 요소는
  // React가 재렌더링할 때 새 DOM 노드로 다시 만들어질 수 있어(내용 문자열이 같아도),
  // 지역 요소 하나하나에 리스너를 직접 붙이면 재생성 후 리스너가 끊길 수 있다 —
  // 컨테이너 자체는 React가 관리하는 안정된 노드라 여기 한 번만 붙이면 안전하다.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleClick(event: MouseEvent): void {
      const target = event.target as Element | null;
      const regionElement = target?.closest('[data-region-id]');
      const regionId = regionElement?.getAttribute('data-region-id');
      if (regionId) onRegionClickRef.current(regionId);
    }

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, []);

  // 같은 이유로, 색칠도 매 렌더마다 다시 적용한다 (내부 DOM이 재생성됐을 가능성을 항상 고려).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const regionElements = container.querySelectorAll<SVGElement>('[data-region-id]');
    regionElements.forEach((element) => {
      const regionId = element.getAttribute('data-region-id') ?? '';
      const ownerTeamId = regionOwners[regionId];
      const color = ownerTeamId ? (teamColors[ownerTeamId] ?? UNOWNED_COLOR) : UNOWNED_COLOR;
      element.setAttribute('fill', color);
      element.style.cursor = 'pointer';
      element.style.opacity = regionId === pendingRegionId ? '0.5' : '1';
    });
  });

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svgContent }} />;
}

export default MapView;
