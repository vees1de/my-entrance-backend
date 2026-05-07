import { Module } from '@nestjs/common';
import { AddressModule } from '../address/address.module';
import { EntrancesController } from './entrances.controller';
import { EntrancesService } from './entrances.service';

@Module({
  imports: [AddressModule],
  controllers: [EntrancesController],
  providers: [EntrancesService],
  exports: [EntrancesService],
})
export class EntrancesModule {}
