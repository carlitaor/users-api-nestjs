import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested, IsEmail, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateProfileDto } from '../../profile/dto/update-profile.dto';

// UpdateUserDto NO extiende PartialType(CreateUserDto) intencionalmente.
// Se define manualmente para excluir el campo password de las actualizaciones,
// ya que el cambio de contraseña debería ser un flujo separado con verificación adicional.

// Todos los campos son opcionales (@IsOptional) para permitir actualizaciones parciales.
export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Nuevo email del usuario. Debe ser único.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'johndoe123',
    description: 'Nuevo nombre de usuario. Debe ser único.',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    type: UpdateProfileDto,
    description: 'Datos del perfil a actualizar (parcial).',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  profile?: UpdateProfileDto;
}
