import { Module } from '@nestjs/common';
import { CleaningsController } from './cleanings.controller';
import { CleaningsService } from './cleanings.service';

@Module({
  controllers: [CleaningsController],
  providers: [CleaningsService],
})
export class CleaningsModule {}
