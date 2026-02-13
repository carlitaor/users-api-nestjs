import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo perfil',
    description:
      'Crea un perfil independiente. Nota: normalmente los perfiles se crean junto con el usuario en POST /auth/signup o POST /users.',
  })
  @ApiBody({ type: CreateProfileDto })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado exitosamente.',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439012',
        firstName: 'Juan',
        lastName: 'Pérez',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Desarrollador apasionado por el backend',
        phoneNumber: '+34612345678',
        country: 'España',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos.',
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/profiles',
        method: 'POST',
        error: 'Bad Request',
        message: [
          'El nombre es obligatorio',
          'El apellido debe tener al menos 2 caracteres',
        ],
      },
    },
  })
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de todos los perfiles',
    description: 'Retorna todos los perfiles registrados en la base de datos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles obtenida exitosamente.',
    schema: {
      example: [
        {
          _id: '507f1f77bcf86cd799439012',
          firstName: 'Juan',
          lastName: 'Pérez',
          bio: 'Desarrollador backend',
          country: 'España',
          user: '507f1f77bcf86cd799439011',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          _id: '507f1f77bcf86cd799439013',
          firstName: 'María',
          lastName: 'García',
          bio: 'Frontend developer',
          country: 'México',
          user: '507f1f77bcf86cd799439014',
          createdAt: '2024-01-16T08:00:00.000Z',
          updatedAt: '2024-01-16T08:00:00.000Z',
        },
      ],
    },
  })
  findAll() {
    return this.profilesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un perfil por su ID',
    description: 'Retorna un perfil específico por su ObjectId.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado.',
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
    description: 'Perfil no encontrado.',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/profiles/507f1f77bcf86cd799439012',
        method: 'GET',
        error: 'Not Found',
        message: 'Perfil con ID 507f1f77bcf86cd799439012 no encontrado',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido.',
  })
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar información de un perfil',
    description:
      'Actualiza los campos proporcionados del perfil. Todos los campos son opcionales.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil a actualizar',
    example: '507f1f77bcf86cd799439012',
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
    description: 'Perfil no encontrado.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos.',
  })
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un perfil por su ID',
    description:
      'Elimina un perfil de la base de datos. Cuidado: puede dejar al usuario sin perfil asociado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil a eliminar',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil eliminado exitosamente.',
    schema: {
      example: {
        message: 'Perfil eliminado exitosamente',
        id: '507f1f77bcf86cd799439012',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado.',
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido.',
  })
  remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
}
