import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProfileDto } from '../../profile/dto/create-profile.dto';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email único del usuario. Se normaliza a minúsculas.',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email!: string;

  @ApiProperty({
    example: 'johndoe123',
    description: 'Nombre de usuario único. Se normaliza a minúsculas.',
  })
  @IsString({ message: 'El username debe ser un texto' })
  @IsNotEmpty({ message: 'El username es obligatorio' })
  username!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Contraseña del usuario. Mínimo 8 caracteres.',
    minLength: 8,
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @ApiProperty({
    type: CreateProfileDto,
    description: 'Datos del perfil del usuario. Se crea junto con el usuario.',
  })
  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile!: CreateProfileDto;
}
