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
  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @ApiProperty({
    example: 'johndoe123',
    description: 'Nombre de usuario único',
  })
  @Prop({ required: true, trim: true })
  username!: string;

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
  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true })
  profile!: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
