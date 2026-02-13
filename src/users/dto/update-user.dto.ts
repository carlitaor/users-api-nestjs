import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested, IsEmail, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateProfileDto } from '../../profile/dto/update-profile.dto';

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
