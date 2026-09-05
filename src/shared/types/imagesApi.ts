export type ImagesApi = {
  list: () => Promise<string[]>;
  // fileName으로 저장된 이미지를 base64 data URL로 읽어온다.
  get: (fileName: string) => Promise<string>;
  // originalFileName(확장자 판별용)과 data URL을 넘기면, 실제 저장된 파일명을 돌려준다.
  upload: (originalFileName: string, dataUrl: string) => Promise<string>;
};
