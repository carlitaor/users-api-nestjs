import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  ValidateNested,
  IsEmail,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateProfileDto } from '../../profile/dto/update-profile.dto';
import { UserRole } from '../../common/enum/userRole-enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'johndoe123' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ type: UpdateProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  profile?: UpdateProfileDto;
}
