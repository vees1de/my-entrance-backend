import { Module } from '@nestjs/common';
import { AddressModule } from '../address/address.module';
import { CleaningsController } from './cleanings.controller';
import { CleaningsService } from './cleanings.service';

@Module({
  imports: [AddressModule],
  controllers: [CleaningsController],
  providers: [CleaningsService],
})
export class CleaningsModule {}
