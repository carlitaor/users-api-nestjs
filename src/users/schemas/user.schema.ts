import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../common/enum/userRole-enum';

export type UserDocument = User & Document;
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

  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true })
  profile!: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
