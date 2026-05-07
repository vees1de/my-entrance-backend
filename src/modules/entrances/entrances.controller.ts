import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AssignCleanerDto } from './dto/assign-cleaner.dto';
import { CreateEntranceDto } from './dto/create-entrance.dto';
import { UpdateEntranceDto } from './dto/update-entrance.dto';
import { EntrancesService } from './entrances.service';

@ApiTags('entrances')
@ApiBearerAuth()
@Controller('entrances')
export class EntrancesController {
  constructor(private readonly service: EntrancesService) {}

  @Get()
  @Roles(Role.MANAGER)
  list(@Query('buildingId', new ParseUUIDPipe({ optional: true })) buildingId?: string) {
    return this.service.list(buildingId);
  }

  @Get(':id')
  @Roles(Role.MANAGER)
  details(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getDetails(id);
  }

  @Post()
  @Roles(Role.MANAGER)
  create(@Body() dto: CreateEntranceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.MANAGER)
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateEntranceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/assignments')
  @Roles(Role.MANAGER)
  assign(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AssignCleanerDto) {
    return this.service.assignCleaner(id, dto.cleanerId);
  }

  @Delete(':id/assignments/:cleanerId')
  @Roles(Role.MANAGER)
  unassign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('cleanerId', new ParseUUIDPipe()) cleanerId: string,
  ) {
    return this.service.unassignCleaner(id, cleanerId);
  }
}
