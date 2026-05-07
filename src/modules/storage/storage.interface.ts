export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface IStorageService {
  /** Save a buffer (already-validated image) and return relative path. */
  saveImage(buffer: Buffer, folder: string, ext?: string): Promise<string>;
  /** Build absolute URL for stored path. */
  getUrl(path: string | null | undefined): string | null;
  /** Remove file by relative path. */
  delete(path: string): Promise<void>;
}
