import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AddressService } from '../address/address.service';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE } from '../storage/storage.interface';
import { CreateCleaningDto } from './dto/create-cleaning.dto';

@Injectable()
export class CleaningsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly address: AddressService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async create(dto: CreateCleaningDto, cleanerId: string, photo: Express.Multer.File) {
    const entrance = await this.prisma.entrance.findUnique({
      where: { id: dto.entranceId },
      include: { building: { include: { street: true } } },
    });
    if (!entrance) throw new BadRequestException('Entrance not found');
    if (dto.floor < 1 || dto.floor > entrance.building.floorsTotal) {
      throw new BadRequestException(`Floor must be between 1 and ${entrance.building.floorsTotal}`);
    }

    const photoPath = await this.storage.saveImage(photo.buffer, 'cleanings');

    const cleaning = await this.prisma.cleaning.create({
      data: { cleanerId, entranceId: dto.entranceId, floor: dto.floor, photoPath },
      include: {
        entrance: { include: { building: { include: { street: true } } } },
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
        entrance: { include: { building: { include: { street: true } } } },
        cleaner: { select: { id: true, name: true } },
      },
    });

    return items.map((c) => this.serialize(c));
  }

  private serialize(cleaning: Prisma.CleaningGetPayload<{
    include: {
      entrance: { include: { building: { include: { street: true } } } };
      cleaner: { select: { id: true; name: true } };
    };
  }>) {
    const entrance = this.address.serializeEntrance(cleaning.entrance);
    return {
      id: cleaning.id,
      cleaner: cleaning.cleaner,
      entrance,
      address: entrance.address,
      streetName: entrance.streetName,
      buildingNumber: entrance.buildingNumber,
      entranceNumber: entrance.entranceNumber,
      floorsTotal: entrance.floorsTotal,
      floor: cleaning.floor,
      photoUrl: this.storage.getUrl(cleaning.photoPath),
      createdAt: cleaning.createdAt,
    };
  }
}
