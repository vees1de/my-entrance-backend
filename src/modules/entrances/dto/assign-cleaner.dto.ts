import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignCleanerDto {
  @ApiProperty()
  @IsUUID()
  cleanerId!: string;
}
