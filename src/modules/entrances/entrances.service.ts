import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AddressService } from '../address/address.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntranceDto } from './dto/create-entrance.dto';
import { UpdateEntranceDto } from './dto/update-entrance.dto';

@Injectable()
export class EntrancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly address: AddressService,
  ) {}

  async list(buildingId?: string) {
    const entrances = await this.prisma.entrance.findMany({
      where: buildingId ? { buildingId } : undefined,
      orderBy: [
        { building: { street: { name: 'asc' } } },
        { building: { number: 'asc' } },
        { number: 'asc' },
      ],
      include: {
        building: { include: { street: true } },
        assignments: { include: { cleaner: { select: { id: true, name: true } } } },
      },
    });

    return entrances.map((entrance) => ({
      ...this.address.serializeEntrance(entrance),
      buildingId: entrance.buildingId,
      assignments: entrance.assignments,
      createdAt: entrance.createdAt,
    }));
  }

  async create(dto: CreateEntranceDto) {
    await this.ensureBuilding(dto.buildingId);
    try {
      const entrance = await this.prisma.entrance.create({
        data: dto,
        include: { building: { include: { street: true } } },
      });
      await this.refreshEntrancesCount(dto.buildingId);
      return this.address.serializeEntrance(entrance);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Entrance already exists in this building');
      }
      throw e;
    }
  }

  async findOrThrow(id: string) {
    const entrance = await this.prisma.entrance.findUnique({
      where: { id },
      include: { building: { include: { street: true } } },
    });
    if (!entrance) throw new NotFoundException('Entrance not found');
    return entrance;
  }

  async getDetails(id: string) {
    const entrance = await this.findOrThrow(id);
    return this.address.serializeEntrance(entrance);
  }

  async assignCleaner(entranceId: string, cleanerId: string) {
    const cleaner = await this.prisma.user.findUnique({ where: { id: cleanerId } });
    if (!cleaner) throw new NotFoundException('Cleaner not found');
    if (cleaner.role !== Role.CLEANER) throw new BadRequestException('User is not a cleaner');
    await this.findOrThrow(entranceId);

    return this.prisma.cleanerAssignment.upsert({
      where: { cleanerId_entranceId: { cleanerId, entranceId } },
      update: {},
      create: { cleanerId, entranceId },
    });
  }

  async unassignCleaner(entranceId: string, cleanerId: string) {
    await this.prisma.cleanerAssignment.deleteMany({ where: { entranceId, cleanerId } });
    return { ok: true };
  }

  async update(id: string, dto: UpdateEntranceDto) {
    const entrance = await this.findOrThrow(id);
    if (dto.buildingId) await this.ensureBuilding(dto.buildingId);

    try {
      const updated = await this.prisma.entrance.update({
        where: { id },
        data: {
          buildingId: dto.buildingId ?? entrance.buildingId,
          number: dto.number ?? entrance.number,
        },
        include: { building: { include: { street: true } } },
      });
      if (dto.buildingId && dto.buildingId !== entrance.buildingId) {
        await Promise.all([
          this.refreshEntrancesCount(entrance.buildingId),
          this.refreshEntrancesCount(dto.buildingId),
        ]);
      }
      return this.address.serializeEntrance(updated);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Entrance already exists in this building');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const entrance = await this.findOrThrow(id);
    try {
      await this.prisma.entrance.delete({ where: { id } });
      await this.refreshEntrancesCount(entrance.buildingId);
      return { ok: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException(
          'У подъезда есть отзывы или уборки — удалить нельзя. Удалите их или переименуйте подъезд.',
        );
      }
      throw e;
    }
  }

  private async ensureBuilding(buildingId: string) {
    const building = await this.prisma.building.findUnique({ where: { id: buildingId } });
    if (!building) throw new BadRequestException('Building not found');
    return building;
  }

  private async refreshEntrancesCount(buildingId: string) {
    const count = await this.prisma.entrance.count({ where: { buildingId } });
    await this.prisma.building.update({
      where: { id: buildingId },
      data: { entrancesCount: count },
    });
  }
}
