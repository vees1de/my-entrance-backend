import { Module } from '@nestjs/common';
import { AddressModule } from '../address/address.module';
import { PdfService } from './pdf.service';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
  imports: [AddressModule],
  controllers: [QrController],
  providers: [QrService, PdfService],
})
export class QrModule {}
