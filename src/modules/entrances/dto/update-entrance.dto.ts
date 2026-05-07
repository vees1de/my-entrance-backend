import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateEntranceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  number?: number;
}
