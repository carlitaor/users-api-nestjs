import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crea un nuevo usuario con su perfil asociado y devuelve un token JWT para autenticación inmediata.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description:
      'Usuario registrado exitosamente. Retorna usuario sin contraseña y token JWT.',
    schema: {
      example: {
        user: {
          _id: '507f1f77bcf86cd799439011',
          email: 'john.doe@example.com',
          username: 'johndoe123',
          isActive: true,
          profile: {
            _id: '507f1f77bcf86cd799439012',
            firstName: 'Juan',
            lastName: 'Pérez',
            avatar: 'https://example.com/avatar.jpg',
            bio: 'Desarrollador apasionado por el backend',
            phoneNumber: '+34612345678',
            country: 'España',
          },
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message: 'Usuario registrado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'El email ya está registrado.',
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/auth/signup',
        method: 'POST',
        error: 'Unauthorized',
        message: 'El usuario ya existe',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos (validación fallida).',
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/auth/signup',
        method: 'POST',
        error: 'Bad Request',
        message: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ],
      },
    },
  })
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica al usuario con email y contraseña. Retorna un token JWT que debe usarse en el header Authorization como Bearer Token para acceder a endpoints protegidos.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso. Retorna usuario sin contraseña y token JWT.',
    schema: {
      example: {
        user: {
          _id: '507f1f77bcf86cd799439011',
          email: 'john.doe@example.com',
          username: 'johndoe123',
          isActive: true,
          profile: '507f1f77bcf86cd799439012',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message: 'Sesión iniciada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Credenciales inválidas (email no encontrado o contraseña incorrecta).',
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/auth/signin',
        method: 'POST',
        error: 'Unauthorized',
        message: 'Credenciales inválidas',
      },
    },
  })
  async signIn(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }
}
