import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty()
  @IsUUID()
  streetId!: string;

  @ApiProperty({ example: '12А' })
  @IsString()
  @MaxLength(50)
  number!: string;

  @ApiProperty({ example: 9 })
  @IsInt()
  @Min(1)
  @Max(100)
  floorsTotal!: number;
}
