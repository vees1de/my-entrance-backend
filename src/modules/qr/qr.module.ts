import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
  controllers: [QrController],
  providers: [QrService, PdfService],
})
export class QrModule {}
