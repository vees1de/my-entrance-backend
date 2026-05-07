import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'manager' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  login!: string;

  @ApiProperty({ example: 'manager123' })
  @IsString()
  @MinLength(4)
  @MaxLength(128)
  password!: string;
}
