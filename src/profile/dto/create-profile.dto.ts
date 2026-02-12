import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50)
  lastName!: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Desarrollador apasionado por el backend' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: '+34612345678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'España' })
  @IsOptional()
  @IsString()
  country?: string;
}
