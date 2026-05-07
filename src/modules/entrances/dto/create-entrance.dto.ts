import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateEntranceDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  number!: number;

  @ApiProperty({ example: 'ул. Ленина, 5' })
  @IsString()
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: 9 })
  @IsInt()
  @Min(1)
  @Max(100)
  floorsTotal!: number;
}
