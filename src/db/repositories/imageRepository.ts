import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DATA_DIR } from '../../main/paths';

const IMAGES_DIR = join(DATA_DIR, 'images');
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.webp': 'webp'
};

function isSafeImageFileName(fileName: string): boolean {
  return /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

export function listImageFiles(): string[] {
  try {
    return readdirSync(IMAGES_DIR);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export function getImageDataUrl(fileName: string): string {
  if (!isSafeImageFileName(fileName)) {
    throw new Error(`올바르지 않은 이미지 파일명: ${fileName}`);
  }
  const buffer = readFileSync(join(IMAGES_DIR, fileName));
  const ext = extname(fileName).toLowerCase();
  const mime = MIME_BY_EXTENSION[ext] ?? 'png';
  return `data:image/${mime};base64,${buffer.toString('base64')}`;
}

/**
 * 렌더러에서 FileReader로 읽은 data URL을 받아 data/images/에 실제 파일로 저장한다.
 * 원본 파일명은 확장자 판별에만 쓰고, 저장 파일명은 randomUUID로 새로 만든다
 * (원본 파일명에 한글·공백 등이 섞여 있어도 안전한 파일명 규칙을 지키기 위함).
 */
export function saveImage(originalFileName: string, dataUrl: string): string {
  const ext = extname(originalFileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('지원하지 않는 이미지 형식입니다 (jpg, png, gif, webp만 가능).');
  }

  const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('올바르지 않은 이미지 데이터입니다.');
  }
  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('이미지 파일이 너무 큽니다 (최대 8MB).');
  }

  mkdirSync(IMAGES_DIR, { recursive: true });
  const fileName = `${randomUUID()}${ext}`;
  writeFileSync(join(IMAGES_DIR, fileName), buffer);
  return fileName;
}
