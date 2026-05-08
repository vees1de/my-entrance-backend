import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AddressService } from '../address/address.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  GenerateBuildingQrDto,
  GenerateBuildingZipDto,
  GenerateQrDto,
  GenerateZipDto,
} from './dto/generate-qr.dto';
import { PdfService, QrItem } from './pdf.service';
import { QrService } from './qr.service';
import { buildZip, ZipEntry } from './zip.util';

function pad(n: number, width = 2) {
  return String(n).padStart(width, '0')
}

@ApiTags('qr')
@Controller('qr')
export class QrController {
  constructor(
    private readonly qr: QrService,
    private readonly pdf: PdfService,
    private readonly prisma: PrismaService,
    private readonly address: AddressService,
  ) {}

  @Public()
  @Get('resolve/:token')
  async resolve(@Param('token') token: string) {
    const qr = await this.qr.resolveToken(token);
    if (!qr) throw new NotFoundException('QR token not found');
    return qr;
  }

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Get(':entranceId/:floor')
  async preview(
    @Param('entranceId', new ParseUUIDPipe()) entranceId: string,
    @Param('floor', new ParseIntPipe()) floor: number,
    @Res() res: Response,
  ) {
    const entrance = await this.prisma.entrance.findUnique({
      where: { id: entranceId },
      include: { building: { include: { street: true } } },
    });
    if (!entrance) throw new NotFoundException('Entrance not found');
    if (floor < 1 || floor > entrance.building.floorsTotal) {
      throw new BadRequestException('Invalid floor');
    }
    const url = await this.qr.buildReviewUrl(entranceId, floor);
    const png = await this.qr.toBuffer(url);
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  }

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Post('generate')
  async generate(@Body() dto: GenerateQrDto, @Res() res: Response) {
    const entrance = await this.prisma.entrance.findUnique({
      where: { id: dto.entranceId },
      include: { building: { include: { street: true } } },
    });
    if (!entrance) throw new NotFoundException('Entrance not found');
    const invalid = dto.floors.find((f) => f < 1 || f > entrance.building.floorsTotal);
    if (invalid !== undefined) {
      throw new BadRequestException(
        `Floor ${invalid} is out of range (1..${entrance.building.floorsTotal})`,
      );
    }

    const opts = dto.options ?? {};
    const address = this.address.formatAddress(entrance);
    const items: QrItem[] = await Promise.all(
      dto.floors.map(async (floor) => ({
        qrPng: await this.qr.toBuffer(await this.qr.buildReviewUrl(dto.entranceId, floor)),
        title: opts.title ?? 'Оцените уборку',
        subtitle: opts.subtitle ?? `${address}\nПодъезд ${entrance.number}, этаж ${floor}`,
        footer: opts.footer ?? 'Сканируйте камерой телефона',
      })),
    );

    const buffer = await this.pdf.render(items, opts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qr-entrance-${entrance.number}.pdf"`,
    );
    res.send(buffer);
  }

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Post('generate-building')
  async generateBuilding(@Body() dto: GenerateBuildingQrDto, @Res() res: Response) {
    const building = await this.prisma.building.findUnique({
      where: { id: dto.buildingId },
      include: { street: true, entrances: { orderBy: { number: 'asc' } } },
    });
    if (!building) throw new NotFoundException('Building not found');

    const opts = dto.options ?? {};
    const address = `${building.street.name}, д. ${building.number}`;
    const items: QrItem[] = await Promise.all(
      building.entrances.flatMap((entrance) =>
        Array.from({ length: building.floorsTotal }, (_, idx) => idx + 1).map(async (floor) => ({
          qrPng: await this.qr.toBuffer(await this.qr.buildReviewUrl(entrance.id, floor)),
          title: opts.title ?? 'Оцените уборку',
          subtitle: opts.subtitle ?? `${address}\nПодъезд ${entrance.number}, этаж ${floor}`,
          footer: opts.footer ?? 'Сканируйте камерой телефона',
        })),
      ),
    );

    const buffer = await this.pdf.render(items, opts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qr-building-${building.number}.pdf"`,
    );
    res.send(buffer);
  }

  // ── ZIP endpoints ─────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Post('generate-zip')
  async generateZip(@Body() dto: GenerateZipDto, @Res() res: Response) {
    const entrance = await this.prisma.entrance.findUnique({
      where: { id: dto.entranceId },
      include: { building: { include: { street: true } } },
    });
    if (!entrance) throw new NotFoundException('Entrance not found');
    const invalid = dto.floors.find((f) => f < 1 || f > entrance.building.floorsTotal);
    if (invalid !== undefined) {
      throw new BadRequestException(
        `Floor ${invalid} is out of range (1..${entrance.building.floorsTotal})`,
      );
    }

    const entries: ZipEntry[] = await Promise.all(
      dto.floors.map(async (floor) => ({
        name: `podezd-${entrance.number}_etazh-${pad(floor)}.png`,
        data: await this.qr.toBuffer(await this.qr.buildReviewUrl(entrance.id, floor), 800),
      })),
    );

    const zip = buildZip(entries);
    const streetSlug = entrance.building.street.name
      .toLowerCase()
      .replace(/[^а-яa-z0-9]+/gi, '-')
      .slice(0, 30);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qr-${streetSlug}-${entrance.building.number}-pod${entrance.number}.zip"`,
    );
    res.send(zip);
  }

  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @Post('generate-building-zip')
  async generateBuildingZip(@Body() dto: GenerateBuildingZipDto, @Res() res: Response) {
    const building = await this.prisma.building.findUnique({
      where: { id: dto.buildingId },
      include: { street: true, entrances: { orderBy: { number: 'asc' } } },
    });
    if (!building) throw new NotFoundException('Building not found');

    const allEntries: ZipEntry[] = [];
    for (const entrance of building.entrances) {
      const floors = Array.from({ length: building.floorsTotal }, (_, i) => i + 1);
      const entranceEntries = await Promise.all(
        floors.map(async (floor) => ({
          name: `podezd-${entrance.number}/etazh-${pad(floor)}.png`,
          data: await this.qr.toBuffer(await this.qr.buildReviewUrl(entrance.id, floor), 800),
        })),
      );
      allEntries.push(...entranceEntries);
    }

    const zip = buildZip(allEntries);
    const streetSlug = building.street.name
      .toLowerCase()
      .replace(/[^а-яa-z0-9]+/gi, '-')
      .slice(0, 30);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qr-${streetSlug}-${building.number}.zip"`,
    );
    res.send(zip);
  }
}
