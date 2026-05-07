import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  private readonly frontendUrl: string;

  constructor(config: ConfigService) {
    this.frontendUrl = (config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173').replace(/\/$/, '');
  }

  buildReviewUrl(entranceId: string, floor: number): string {
    const url = new URL(this.frontendUrl);
    url.pathname = (url.pathname.replace(/\/$/, '') || '') + '/review';
    url.searchParams.set('entranceId', entranceId);
    url.searchParams.set('floor', String(floor));
    return url.toString();
  }

  async toBuffer(url: string, size = 600): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: size,
      type: 'png',
    });
  }
}
