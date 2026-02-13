import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID único del perfil',
  })
  _id?: Types.ObjectId;

  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @Prop({ required: true })
  firstName!: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  @Prop({ required: true })
  lastName!: string;

  // Campos opcionales del perfil: permiten un registro inicial rápido (solo firstName y lastName)
  // y que el usuario complete su información personal progresivamente.
  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL del avatar',
  })
  @Prop({ required: false })
  avatar?: string;

  @ApiPropertyOptional({
    example: 'Desarrollador apasionado por el backend',
    description: 'Biografía del usuario',
  })
  @Prop({ required: false })
  bio?: string;

  @ApiPropertyOptional({
    example: '+34612345678',
    description: 'Número de teléfono',
  })
  @Prop({ required: false })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'España',
    description: 'País de residencia',
  })
  @Prop({ required: false })
  country?: string;

  @ApiProperty({ description: 'ID del usuario asociado', type: () => String })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user!: Types.ObjectId;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

ProfileSchema.index({ firstName: 'text', lastName: 'text', bio: 'text' });
