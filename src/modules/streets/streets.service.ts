import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStreetDto } from './dto/create-street.dto';

@Injectable()
export class StreetsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.street.findMany({
      orderBy: [{ name: 'asc' }, { city: 'asc' }],
    });
  }

  async create(dto: CreateStreetDto) {
    try {
      return await this.prisma.street.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Street already exists');
      }
      throw e;
    }
  }
}
