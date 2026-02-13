import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryUsersDto {
  @ApiPropertyOptional({
    example: 'carla',
    description:
      'Texto de búsqueda. Filtra por email, username, nombre, apellido o biografía del perfil.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
    description: 'Número de página para la paginación. Mínimo 1.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Cantidad de resultados por página. Entre 1 y 100.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'email', 'username'],
    description: 'Campo por el cual ordenar los resultados.',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'email', 'username'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Dirección del ordenamiento: ascendente o descendente.',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
