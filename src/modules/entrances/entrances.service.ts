import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntranceDto } from './dto/create-entrance.dto';
import { UpdateEntranceDto } from './dto/update-entrance.dto';

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

  async update(id: string, dto: UpdateEntranceDto) {
    const entrance = await this.findOrThrow(id);
    const next = { ...entrance, ...dto };

    // If shrinking floor count, refuse if existing reviews/cleanings reference higher floors.
    if (dto.floorsTotal !== undefined && dto.floorsTotal < entrance.floorsTotal) {
      const [r, c] = await Promise.all([
        this.prisma.review.count({ where: { entranceId: id, floor: { gt: dto.floorsTotal } } }),
        this.prisma.cleaning.count({ where: { entranceId: id, floor: { gt: dto.floorsTotal } } }),
      ]);
      if (r + c > 0) {
        throw new ConflictException(
          `Нельзя уменьшить число этажей: есть записи на этажах выше ${dto.floorsTotal}`,
        );
      }
    }

    return this.prisma.entrance.update({
      where: { id },
      data: {
        number: next.number,
        address: next.address,
        floorsTotal: next.floorsTotal,
      },
    });
  }

  async remove(id: string) {
    await this.findOrThrow(id);
    try {
      await this.prisma.entrance.delete({ where: { id } });
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
}
