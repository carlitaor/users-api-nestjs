import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested, IsEmail, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateProfileDto } from '../../profile/dto/update-profile.dto';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'johndoe123' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ type: UpdateProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  profile?: UpdateProfileDto;
}
