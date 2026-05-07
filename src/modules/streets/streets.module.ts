import { Module } from '@nestjs/common';
import { StreetsController } from './streets.controller';
import { StreetsService } from './streets.service';

@Module({
  controllers: [StreetsController],
  providers: [StreetsService],
})
export class StreetsModule {}
