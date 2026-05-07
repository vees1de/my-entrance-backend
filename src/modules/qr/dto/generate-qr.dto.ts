import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum QrLayout {
  ONE_PER_PAGE = 'one-per-page',
  GRID_2X3 = 'grid-2x3',
}

export class QrOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  footer?: string;

  @ApiPropertyOptional({ enum: QrLayout, default: QrLayout.ONE_PER_PAGE })
  @IsOptional()
  @IsEnum(QrLayout)
  layout?: QrLayout = QrLayout.ONE_PER_PAGE;
}

export class GenerateQrDto {
  @ApiProperty()
  @IsUUID()
  entranceId!: string;

  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  floors!: number[];

  @ApiPropertyOptional({ type: QrOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QrOptionsDto)
  options?: QrOptionsDto;
}

export class GenerateBuildingQrDto {
  @ApiProperty()
  @IsUUID()
  buildingId!: string;

  @ApiPropertyOptional({ type: QrOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QrOptionsDto)
  options?: QrOptionsDto;
}
