import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo usuario con su perfil',
    description:
      'Crea un usuario y su perfil asociado dentro de una transacción atómica. Requiere autenticación JWT.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente.',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        email: 'john.doe@example.com',
        username: 'johndoe123',
        isActive: true,
        profile: {
          _id: '507f1f77bcf86cd799439012',
          firstName: 'Juan',
          lastName: 'Pérez',
          bio: 'Desarrollador apasionado por el backend',
          phoneNumber: '+34612345678',
          country: 'España',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email o username ya existe.',
    schema: {
      example: {
        statusCode: 409,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/users',
        method: 'POST',
        error: 'Conflict',
        message: 'El email ya está registrado',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o no proporcionado.',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de usuarios con filtros, paginación y ordenamiento',
    description:
      'Retorna una lista paginada de usuarios. Permite buscar por texto (email, username, nombre, apellido, bio) y ordenar por diferentes campos. Requiere autenticación JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente.',
    schema: {
      example: {
        users: [
          {
            _id: '507f1f77bcf86cd799439011',
            email: 'john.doe@example.com',
            username: 'johndoe123',
            isActive: true,
            profile: {
              _id: '507f1f77bcf86cd799439012',
              firstName: 'Juan',
              lastName: 'Pérez',
              bio: 'Desarrollador backend',
              country: 'España',
            },
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        total: 25,
        page: 1,
        totalPages: 3,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o no proporcionado.',
  })
  findAll(@Query() queryDto: QueryUsersDto) {
    return this.usersService.findAll(
      queryDto.page,
      queryDto.limit,
      queryDto.search,
      queryDto.sortBy,
      queryDto.sortOrder,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un usuario por su ID',
    description:
      'Retorna un usuario con su perfil poblado. Requiere autenticación JWT.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado.',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        email: 'john.doe@example.com',
        username: 'johndoe123',
        isActive: true,
        profile: {
          _id: '507f1f77bcf86cd799439012',
          firstName: 'Juan',
          lastName: 'Pérez',
          bio: 'Desarrollador backend',
          country: 'España',
        },
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/users/507f1f77bcf86cd799439011',
        method: 'GET',
        error: 'Not Found',
        message: 'Usuario con ID 507f1f77bcf86cd799439011 no encontrado',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido (no es un ObjectId válido).',
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/users/invalid-id',
        method: 'GET',
        error: 'Bad Request',
        message: 'ID inválido',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o no proporcionado.',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar información de un usuario',
    description:
      'Actualiza datos del usuario y/o su perfil. Todos los campos son opcionales. Requiere autenticación JWT.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a actualizar',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente.',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        email: 'nuevo.email@example.com',
        username: 'nuevousername',
        isActive: true,
        profile: {
          _id: '507f1f77bcf86cd799439012',
          firstName: 'Juan Carlos',
          lastName: 'Pérez',
          bio: 'Bio actualizada',
          country: 'México',
        },
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'Email o username ya existe en otro usuario.',
    schema: {
      example: {
        statusCode: 409,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/users/507f1f77bcf86cd799439011',
        method: 'PATCH',
        error: 'Conflict',
        message: 'El email ya está registrado',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido o datos de entrada inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o no proporcionado.',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un usuario por su ID',
    description:
      'Elimina el usuario y su perfil asociado de la base de datos. Requiere autenticación JWT.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a eliminar',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente.',
    schema: {
      example: {
        message: 'Usuario eliminado exitosamente',
        id: '507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o no proporcionado.',
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get(':id/profile')
  @ApiOperation({
    summary: 'Obtener el perfil de un usuario',
    description:
      'Retorna únicamente los datos del perfil asociado al usuario. Requiere autenticación JWT.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario encontrado.',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439012',
        firstName: 'Juan',
        lastName: 'Pérez',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Desarrollador apasionado por el backend',
        phoneNumber: '+34612345678',
        country: 'España',
        user: '507f1f77bcf86cd799439011',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o no proporcionado.',
  })
  async getUserProfile(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return user.profile;
  }

  @Patch(':id/profile')
  @ApiOperation({
    summary: 'Actualizar el perfil de un usuario',
    description:
      'Actualiza solo los datos del perfil. Todos los campos son opcionales. Requiere autenticación JWT.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario cuyo perfil se va a actualizar',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente.',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439012',
        firstName: 'Juan Carlos',
        lastName: 'Pérez López',
        avatar: 'https://example.com/new-avatar.jpg',
        bio: 'Biografía actualizada',
        phoneNumber: '+34698765432',
        country: 'México',
        user: '507f1f77bcf86cd799439011',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o perfil no encontrado.',
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido o datos de entrada inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o no proporcionado.',
  })
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(id, updateProfileDto);
  }
}
