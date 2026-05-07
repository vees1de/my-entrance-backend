import { ApiPropertyOptional } from '@nestjs/swagger';
import { Rating } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListReviewsDto {
  @ApiPropertyOptional({ enum: Rating })
  @IsOptional()
  @IsEnum(Rating)
  rating?: Rating;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entranceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  streetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cleanerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasPhoto?: boolean;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
