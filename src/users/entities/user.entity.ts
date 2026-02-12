import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/enum/userRole-enum';

export type UserDocument = User & Document;

// profile embebido
@Schema({ _id: false })
export class Profile {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  bio?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, trim: true })
  username!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: ProfileSchema, required: true })
  profile!: Profile;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ 'profile.name': 'text', 'profile.bio': 'text' });
