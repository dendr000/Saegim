const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;
const JUNGSEONG_COUNT = 21;
const JONGSEONG_COUNT = 28;

/**
 * 완성형 한글 음절마다 초성 자모만 뽑아낸다. 한글이 아닌 문자(공백·숫자·영문 등)는
 * 그대로 통과시킨다 — 초성 퀴즈에서 "668" 같은 숫자 정답은 그대로 보여줘야 한다.
 */
export function extractInitials(text: string): string {
  return Array.from(text)
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      if (code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) return char;
      const choseongIndex = Math.floor((code - HANGUL_SYLLABLE_START) / (JUNGSEONG_COUNT * JONGSEONG_COUNT));
      return CHOSEONG[choseongIndex];
    })
    .join('');
}
