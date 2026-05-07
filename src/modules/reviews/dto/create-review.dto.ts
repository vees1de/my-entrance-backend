import { ApiProperty } from '@nestjs/swagger';
import { Rating } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  entranceId!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  floor!: number;

  @ApiProperty({ enum: Rating })
  @IsEnum(Rating)
  rating!: Rating;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
