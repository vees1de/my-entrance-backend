import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStreetDto {
  @ApiProperty({ example: 'ул. Ленина' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Якутск' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;
}
