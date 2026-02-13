import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del usuario. Entre 2 y 50 caracteres.',
    minLength: 2,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del usuario. Entre 2 y 50 caracteres.',
    minLength: 2,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50)
  lastName!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL de la imagen de perfil del usuario',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'Desarrollador apasionado por el backend',
    description: 'Biografía o descripción del usuario. Máximo 500 caracteres.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    example: '+34612345678',
    description: 'Número de teléfono del usuario',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'España',
    description: 'País de residencia del usuario',
  })
  @IsOptional()
  @IsString()
  country?: string;
}
