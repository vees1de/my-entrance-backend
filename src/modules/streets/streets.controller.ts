import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateStreetDto } from './dto/create-street.dto';
import { StreetsService } from './streets.service';

@ApiTags('streets')
@ApiBearerAuth()
@Controller('streets')
@Roles(Role.MANAGER)
export class StreetsController {
  constructor(private readonly service: StreetsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreateStreetDto) {
    return this.service.create(dto);
  }
}
