import { Injectable } from '@nestjs/common';
import { Rating, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const RATING_VALUE: Record<Rating, number> = { BAD: 1, OK: 3, GOOD: 5 };

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDayMetrics() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [todayCleanings, todayReviews, weekReviews, plannedAgg] = await Promise.all([
      this.prisma.cleaning.findMany({
        where: { createdAt: { gte: startOfDay } },
        select: { cleanerId: true, entranceId: true, floor: true },
      }),
      this.prisma.review.findMany({
        where: { createdAt: { gte: startOfDay } },
        select: { rating: true },
      }),
      this.prisma.review.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { rating: true },
      }),
      this.prisma.cleanerAssignment.findMany({
        select: { cleanerId: true, entrance: { select: { building: { select: { floorsTotal: true } } } } },
      }),
    ]);

    const cleaningsDoneSet = new Set(
      todayCleanings.map((c) => `${c.cleanerId}:${c.entranceId}:${c.floor}`),
    );
    const activeCleaners = new Set(todayCleanings.map((c) => c.cleanerId)).size;

    const cleaningsPlanned = plannedAgg.reduce(
      (sum, a) => sum + a.entrance.building.floorsTotal,
      0,
    );

    const reviewsBad = todayReviews.filter((r) => r.rating === Rating.BAD).length;

    const weeklyAvgRating = weekReviews.length
      ? weekReviews.reduce((sum, r) => sum + RATING_VALUE[r.rating], 0) / weekReviews.length
      : null;

    const totalCleaners = await this.prisma.user.count({ where: { role: Role.CLEANER } });

    return {
      cleaningsDone: cleaningsDoneSet.size,
      cleaningsPlanned,
      reviewsTotal: todayReviews.length,
      reviewsBad,
      activeCleaners,
      totalCleaners,
      weeklyAvgRating: weeklyAvgRating !== null ? Number(weeklyAvgRating.toFixed(2)) : null,
    };
  }
}
