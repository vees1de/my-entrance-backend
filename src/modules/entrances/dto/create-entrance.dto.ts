import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateEntranceDto {
  @ApiProperty()
  @IsUUID()
  buildingId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  number!: number;
}
