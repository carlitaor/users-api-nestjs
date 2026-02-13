import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ required: false })
  bio?: string;

  @Prop({ required: false })
  phoneNumber?: string;

  @Prop({ required: false })
  country?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user!: Types.ObjectId;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

ProfileSchema.index({ firstName: 'text', lastName: 'text', bio: 'text' });
