import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { CleaningsModule } from './modules/cleanings/cleanings.module';
import { CleanersModule } from './modules/cleaners/cleaners.module';
import { EntrancesModule } from './modules/entrances/entrances.module';
import { HealthController } from './modules/health/health.controller';
import { MetricsModule } from './modules/metrics/metrics.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { QrModule } from './modules/qr/qr.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { StorageModule } from './modules/storage/storage.module';
import { StreetsModule } from './modules/streets/streets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Default: generous global cap so dashboard/list endpoints aren't blocked.
    // Tight per-IP anti-spam for POST /reviews lives on the controller via @Throttle.
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
        },
      ],
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    StreetsModule,
    BuildingsModule,
    EntrancesModule,
    ReviewsModule,
    CleaningsModule,
    CleanersModule,
    MetricsModule,
    QrModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
