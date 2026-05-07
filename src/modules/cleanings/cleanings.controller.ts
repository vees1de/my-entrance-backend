import {
  Body,
  Controller,
  Get,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CleaningsService } from './cleanings.service';
import { CreateCleaningDto } from './dto/create-cleaning.dto';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10);

@ApiTags('cleanings')
@ApiBearerAuth()
@Controller('cleanings')
export class CleaningsController {
  constructor(private readonly service: CleaningsService) {}

  @Post()
  @Roles(Role.CLEANER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @Body() dto: CreateCleaningDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE })
        .build({ fileIsRequired: true }),
    )
    photo: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.userId, photo);
  }

  @Get('today')
  @Roles(Role.CLEANER, Role.MANAGER)
  today(
    @CurrentUser() user: AuthUser,
    @Query('cleanerId', new ParseUUIDPipe({ optional: true })) cleanerId?: string,
  ) {
    return this.service.listToday(user, cleanerId);
  }
}
