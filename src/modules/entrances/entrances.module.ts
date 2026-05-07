import { Module } from '@nestjs/common';
import { EntrancesController } from './entrances.controller';
import { EntrancesService } from './entrances.service';

@Module({
  controllers: [EntrancesController],
  providers: [EntrancesService],
  exports: [EntrancesService],
})
export class EntrancesModule {}
