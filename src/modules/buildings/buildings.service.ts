import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: PrismaService) {}

  list(streetId?: string) {
    return this.prisma.building.findMany({
      where: streetId ? { streetId } : undefined,
      orderBy: [{ street: { name: 'asc' } }, { number: 'asc' }],
      include: { street: true },
    });
  }

  async create(dto: CreateBuildingDto) {
    const street = await this.prisma.street.findUnique({ where: { id: dto.streetId } });
    if (!street) throw new BadRequestException('Street not found');

    try {
      return await this.prisma.building.create({
        data: { ...dto, entrancesCount: 0 },
        include: { street: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Building already exists on this street');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateBuildingDto) {
    try {
      return await this.prisma.building.update({
        where: { id },
        data: dto,
        include: { street: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new BadRequestException('Building not found');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const entrances = await this.prisma.entrance.count({ where: { buildingId: id } });
    if (entrances > 0) {
      throw new BadRequestException(`Cannot delete building: it has ${entrances} entrance(s). Remove them first.`);
    }
    try {
      await this.prisma.building.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new BadRequestException('Building not found');
      }
      throw e;
    }
    return { ok: true };
  }
}
