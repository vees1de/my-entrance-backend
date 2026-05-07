import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntranceDto } from './dto/create-entrance.dto';

@Injectable()
export class EntrancesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.entrance.findMany({
      orderBy: [{ address: 'asc' }, { number: 'asc' }],
      include: {
        assignments: { include: { cleaner: { select: { id: true, name: true } } } },
      },
    });
  }

  async create(dto: CreateEntranceDto) {
    return this.prisma.entrance.create({ data: dto });
  }

  async findOrThrow(id: string) {
    const entrance = await this.prisma.entrance.findUnique({ where: { id } });
    if (!entrance) throw new NotFoundException('Entrance not found');
    return entrance;
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
}
