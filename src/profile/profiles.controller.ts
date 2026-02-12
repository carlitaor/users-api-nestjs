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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo perfil' })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de todos los perfiles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles obtenida exitosamente',
  })
  findAll() {
    return this.profilesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un perfil por su ID' })
  @ApiParam({ name: 'id', description: 'ID del perfil (MongoDB ObjectId)' })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido',
  })
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar información de un perfil' })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un perfil por su ID' })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({
    status: 200,
    description: 'Perfil eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
}
