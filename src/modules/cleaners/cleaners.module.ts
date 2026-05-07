import { Module } from '@nestjs/common';
import { AddressModule } from '../address/address.module';
import { CleanersController } from './cleaners.controller';
import { CleanersService } from './cleaners.service';

@Module({
  imports: [AddressModule],
  controllers: [CleanersController],
  providers: [CleanersService],
})
export class CleanersModule {}
