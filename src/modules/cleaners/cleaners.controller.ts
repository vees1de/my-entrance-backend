import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CleanersService } from './cleaners.service';

@ApiTags('cleaners')
@ApiBearerAuth()
@Controller('cleaners')
export class CleanersController {
  constructor(private readonly service: CleanersService) {}

  @Get()
  @Roles(Role.MANAGER)
  list() {
    return this.service.list();
  }
}
