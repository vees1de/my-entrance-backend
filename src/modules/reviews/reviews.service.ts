import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { AddressService } from '../address/address.service';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE } from '../storage/storage.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly address: AddressService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async create(dto: CreateReviewDto, photo: Express.Multer.File | undefined, ip: string | undefined) {
    const entrance = await this.prisma.entrance.findUnique({
      where: { id: dto.entranceId },
      include: { building: { include: { street: true } } },
    });
    if (!entrance) throw new BadRequestException('Entrance not found');
    if (dto.floor < 1 || dto.floor > entrance.building.floorsTotal) {
      throw new BadRequestException(`Floor must be between 1 and ${entrance.building.floorsTotal}`);
    }

    let photoPath: string | null = null;
    if (photo) {
      photoPath = await this.storage.saveImage(photo.buffer, 'reviews');
    }

    const assignedCleaners = await this.prisma.cleanerAssignment.findMany({
      where: { entranceId: dto.entranceId },
      select: { cleanerId: true },
    });

    const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 32) : null;

    const review = await this.prisma.review.create({
      data: {
        entranceId: dto.entranceId,
        floor: dto.floor,
        rating: dto.rating,
        comment: dto.comment,
        photoPath,
        ipHash,
        cleaners: {
          create: assignedCleaners.map((a) => ({ cleanerId: a.cleanerId })),
        },
      },
      include: {
        cleaners: { include: { cleaner: { select: { id: true, name: true } } } },
        entrance: { include: { building: { include: { street: true } } } },
      },
    });

    return this.serialize(review);
  }

  async list(query: ListReviewsDto) {
    const where: Prisma.ReviewWhereInput = {};
    if (query.rating) where.rating = query.rating;
    if (query.entranceId) where.entranceId = query.entranceId;
    if (query.buildingId || query.streetId) {
      where.entrance = {
        building: {
          ...(query.buildingId ? { id: query.buildingId } : {}),
          ...(query.streetId ? { streetId: query.streetId } : {}),
        },
      };
    }
    if (query.hasPhoto !== undefined) where.photoPath = query.hasPhoto ? { not: null } : null;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }
    if (query.cleanerId) {
      where.cleaners = { some: { cleanerId: query.cleanerId } };
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
        include: {
          cleaners: { include: { cleaner: { select: { id: true, name: true } } } },
          entrance: { include: { building: { include: { street: true } } } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      items: items.map((r) => this.serialize(r)),
    };
  }

  private serialize(review: Prisma.ReviewGetPayload<{
    include: {
      cleaners: { include: { cleaner: { select: { id: true; name: true } } } };
      entrance: { include: { building: { include: { street: true } } } };
    };
  }>) {
    const entrance = this.address.serializeEntrance(review.entrance);
    return {
      id: review.id,
      entranceId: review.entranceId,
      entrance,
      address: entrance.address,
      streetName: entrance.streetName,
      buildingNumber: entrance.buildingNumber,
      entranceNumber: entrance.entranceNumber,
      floorsTotal: entrance.floorsTotal,
      floor: review.floor,
      rating: review.rating,
      comment: review.comment,
      photoUrl: this.storage.getUrl(review.photoPath),
      cleaners: review.cleaners.map((rc) => rc.cleaner),
      createdAt: review.createdAt,
    };
  }
}
