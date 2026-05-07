import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateCleaningDto {
  @ApiProperty()
  @IsUUID()
  entranceId!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  floor!: number;
}
