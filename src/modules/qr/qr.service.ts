import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QrService {
  private readonly tokenBytes = 8;
  private readonly frontendUrl: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.frontendUrl = this.normalizeFrontendUrl(
      config.get<string>('QR_BASE_URL') ?? config.get<string>('FRONTEND_URL'),
    );
  }

  async buildReviewUrl(entranceId: string, floor: number): Promise<string> {
    const token = await this.getOrCreateToken(entranceId, floor);
    const url = new URL(this.frontendUrl);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/r/${token}`;
    url.search = '';
    return url.toString();
  }

  async resolveToken(token: string) {
    return this.prisma.qrCode.findUnique({
      where: { token },
      select: { entranceId: true, floor: true },
    });
  }

  async toBuffer(url: string, size = 600): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      type: 'png',
    });
  }

  private normalizeFrontendUrl(value: string | undefined): string {
    const first = value?.split(',')[0]?.trim();
    const raw = first && /^https?:\/\//i.test(first) ? first : 'https://bims.su';
    const url = new URL(raw);
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) {
      return 'https://bims.su';
    }
    url.pathname = url.pathname.replace(/\/$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  }

  private async getOrCreateToken(entranceId: string, floor: number): Promise<string> {
    const existing = await this.prisma.qrCode.findUnique({
      where: { entranceId_floor: { entranceId, floor } },
      select: { token: true },
    });
    if (existing) return existing.token;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = randomBytes(this.tokenBytes).toString('base64url');
      try {
        const created = await this.prisma.qrCode.create({
          data: { entranceId, floor, token },
          select: { token: true },
        });
        return created.token;
      } catch {
        // Retry on rare token collision or concurrent creation of the same QR row.
        const concurrent = await this.prisma.qrCode.findUnique({
          where: { entranceId_floor: { entranceId, floor } },
          select: { token: true },
        });
        if (concurrent) return concurrent.token;
      }
    }

    throw new Error('Could not create QR token');
  }
}
