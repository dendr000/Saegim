export type MapRegion = { id: string; label: string };

/**
 * 지도 SVG 규격: `data-region-id`(필수)와 `data-region-label`(표시용)을 가진 요소가
 * 점령 가능한 한 칸이다. 이 규격만 지키면 어떤 SVG든 지도로 쓸 수 있다 —
 * 나중에 임시 지도를 실제 지도로 교체할 때 이 두 속성만 넣어주면 된다.
 */
export function parseRegionIdsFromSvg(svgContent: string): MapRegion[] {
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
  const elements = Array.from(doc.querySelectorAll('[data-region-id]'));

  return elements
    .map((element) => ({
      id: element.getAttribute('data-region-id') ?? '',
      label: element.getAttribute('data-region-label') ?? element.getAttribute('data-region-id') ?? ''
    }))
    .filter((region) => region.id.length > 0);
}

const TEAM_COLORS = ['#4285f4', '#ea4335', '#34a853', '#fbbc05', '#9c27b0', '#00acc1'];

export function colorForTeamIndex(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}
