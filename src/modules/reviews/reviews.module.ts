import { Module } from '@nestjs/common';
import { AddressModule } from '../address/address.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [AddressModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
