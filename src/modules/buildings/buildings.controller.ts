import { Body, Controller, Get, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';

@ApiTags('buildings')
@ApiBearerAuth()
@Controller('buildings')
@Roles(Role.MANAGER)
export class BuildingsController {
  constructor(private readonly service: BuildingsService) {}

  @Get()
  list(@Query('streetId', new ParseUUIDPipe({ optional: true })) streetId?: string) {
    return this.service.list(streetId);
  }

  @Post()
  create(@Body() dto: CreateBuildingDto) {
    return this.service.create(dto);
  }
}
