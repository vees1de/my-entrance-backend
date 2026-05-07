import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuildingDto } from './dto/create-building.dto';

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
}
