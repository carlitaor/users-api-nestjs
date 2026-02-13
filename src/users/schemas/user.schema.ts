import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID único del usuario',
  })
  _id?: Types.ObjectId;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email único del usuario',
  })
  // trim y lowercase a nivel de schema: garantiza la normalización de datos
  // incluso si se insertan directamente en la base de datos sin pasar por el servicio.
  // Es una capa de defensa adicional a la normalización que se hace en el servicio.
  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @ApiProperty({
    example: 'johndoe123',
    description: 'Nombre de usuario único',
  })
  @Prop({ required: true, trim: true })
  username!: string;

  // El campo password no tiene decorador @ApiProperty intencionalmente
  // para que no aparezca en la documentación de Swagger y no se exponga en los esquemas de respuesta.
  @Prop({ required: true })
  password!: string;

  @ApiProperty({
    example: true,
    description: 'Estado activo del usuario',
  })
  @Prop({ default: true })
  isActive!: boolean;

  @ApiProperty({
    description: 'Perfil asociado al usuario',
    type: () => String,
  })
  // Relación 1:1 con Profile usando ObjectId y ref.
  // Decisión: separar User y Profile en colecciones distintas para respetar
  // el principio de responsabilidad única (datos de autenticación vs datos personales)
  // y permitir actualizar el perfil sin tocar el documento de usuario.
  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true })
  profile!: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
