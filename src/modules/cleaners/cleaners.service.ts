import { Inject, Injectable } from '@nestjs/common';
import { Rating, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE } from '../storage/storage.interface';

type CleanerStatus = 'not_started' | 'in_progress' | 'done';

@Injectable()
export class CleanersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async list() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const cleaners = await this.prisma.user.findMany({
      where: { role: Role.CLEANER },
      orderBy: { name: 'asc' },
      include: {
        assignments: { include: { entrance: { select: { id: true, number: true, address: true, floorsTotal: true } } } },
      },
    });

    if (cleaners.length === 0) return [];

    const ids = cleaners.map((c) => c.id);

    const [todayCleanings, lastCleanings, todayBadReviews, totalReviews] = await Promise.all([
      this.prisma.cleaning.findMany({
        where: { cleanerId: { in: ids }, createdAt: { gte: startOfDay } },
        select: { cleanerId: true, entranceId: true, floor: true, photoPath: true, createdAt: true },
      }),
      this.prisma.cleaning.findMany({
        where: { cleanerId: { in: ids } },
        orderBy: { createdAt: 'desc' },
        distinct: ['cleanerId'],
        select: { cleanerId: true, photoPath: true, createdAt: true },
      }),
      this.prisma.reviewCleaner.groupBy({
        by: ['cleanerId'],
        where: {
          cleanerId: { in: ids },
          review: { createdAt: { gte: startOfDay }, rating: { in: [Rating.BAD, Rating.OK] } },
        },
        _count: { _all: true },
      }),
      this.prisma.reviewCleaner.groupBy({
        by: ['cleanerId'],
        where: { cleanerId: { in: ids } },
        _count: { _all: true },
      }),
    ]);

    const todayByCleaner = new Map<string, Set<string>>();
    for (const c of todayCleanings) {
      const key = `${c.entranceId}:${c.floor}`;
      const set = todayByCleaner.get(c.cleanerId) ?? new Set();
      set.add(key);
      todayByCleaner.set(c.cleanerId, set);
    }

    const lastByCleaner = new Map(lastCleanings.map((c) => [c.cleanerId, c]));
    const badByCleaner = new Map(todayBadReviews.map((r) => [r.cleanerId, r._count._all]));
    const totalByCleaner = new Map(totalReviews.map((r) => [r.cleanerId, r._count._all]));

    return cleaners.map((c) => {
      const floorsPlanned = c.assignments.reduce((sum, a) => sum + a.entrance.floorsTotal, 0);
      const floorsCompleted = todayByCleaner.get(c.id)?.size ?? 0;
      const last = lastByCleaner.get(c.id);

      let status: CleanerStatus = 'not_started';
      if (floorsCompleted > 0 && floorsCompleted < floorsPlanned) status = 'in_progress';
      else if (floorsPlanned > 0 && floorsCompleted >= floorsPlanned) status = 'done';

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        shift: c.shift,
        entrances: c.assignments.map((a) => a.entrance),
        floorsPlanned,
        floorsCompleted,
        status,
        lastCleaningAt: last?.createdAt ?? null,
        lastPhotoUrl: this.storage.getUrl(last?.photoPath),
        badReviewsToday: badByCleaner.get(c.id) ?? 0,
        totalReviews: totalByCleaner.get(c.id) ?? 0,
      };
    });
  }
}
