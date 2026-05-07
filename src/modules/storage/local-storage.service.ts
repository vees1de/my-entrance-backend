import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { IStorageService } from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    this.uploadDir = config.get<string>('UPLOAD_DIR') ?? './uploads';
    this.appUrl = (config.get<string>('APP_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async saveImage(buffer: Buffer, folder: string): Promise<string> {
    const date = new Date().toISOString().slice(0, 10);
    const dir = join(this.uploadDir, folder, date);
    await fs.mkdir(dir, { recursive: true });

    const filename = `${randomUUID()}.jpg`;
    const fullPath = join(dir, filename);

    await sharp(buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(fullPath);

    return join(folder, date, filename).replace(/\\/g, '/');
  }

  getUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return `${this.appUrl}/static/${path}`;
  }

  async delete(path: string): Promise<void> {
    try {
      await fs.unlink(join(this.uploadDir, path));
    } catch (err) {
      this.logger.warn(`Failed to delete file ${path}: ${(err as Error).message}`);
    }
  }
}
