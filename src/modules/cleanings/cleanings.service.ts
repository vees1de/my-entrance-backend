import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE } from '../storage/storage.interface';
import { CreateCleaningDto } from './dto/create-cleaning.dto';

@Injectable()
export class CleaningsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async create(dto: CreateCleaningDto, cleanerId: string, photo: Express.Multer.File) {
    const entrance = await this.prisma.entrance.findUnique({ where: { id: dto.entranceId } });
    if (!entrance) throw new BadRequestException('Entrance not found');
    if (dto.floor < 1 || dto.floor > entrance.floorsTotal) {
      throw new BadRequestException(`Floor must be between 1 and ${entrance.floorsTotal}`);
    }

    const assignment = await this.prisma.cleanerAssignment.findUnique({
      where: { cleanerId_entranceId: { cleanerId, entranceId: dto.entranceId } },
    });
    if (!assignment) throw new ForbiddenException('Not assigned to this entrance');

    const photoPath = await this.storage.saveImage(photo.buffer, 'cleanings');

    const cleaning = await this.prisma.cleaning.create({
      data: { cleanerId, entranceId: dto.entranceId, floor: dto.floor, photoPath },
      include: {
        entrance: { select: { id: true, number: true, address: true } },
        cleaner: { select: { id: true, name: true } },
      },
    });

    return this.serialize(cleaning);
  }

  async listToday(viewer: { userId: string; role: Role }, cleanerId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const where: Prisma.CleaningWhereInput = { createdAt: { gte: start } };
    if (viewer.role === Role.CLEANER) {
      where.cleanerId = viewer.userId;
    } else if (cleanerId) {
      where.cleanerId = cleanerId;
    }

    const items = await this.prisma.cleaning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        entrance: { select: { id: true, number: true, address: true } },
        cleaner: { select: { id: true, name: true } },
      },
    });

    return items.map((c) => this.serialize(c));
  }

  private serialize(cleaning: Prisma.CleaningGetPayload<{
    include: {
      entrance: { select: { id: true; number: true; address: true } };
      cleaner: { select: { id: true; name: true } };
    };
  }>) {
    return {
      id: cleaning.id,
      cleaner: cleaning.cleaner,
      entrance: cleaning.entrance,
      floor: cleaning.floor,
      photoUrl: this.storage.getUrl(cleaning.photoPath),
      createdAt: cleaning.createdAt,
    };
  }
}
