import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email del usuario registrado',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Contraseña del usuario. Mínimo 8 caracteres.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
