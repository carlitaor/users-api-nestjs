import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  @Prop()
  firstName!: string;

  @Prop()
  lastName!: string;

  @Prop()
  avatar!: string;

  @Prop()
  bio!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  country!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user!: Types.ObjectId;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

ProfileSchema.index({ firstName: 'text', lastName: 'text', bio: 'text' });
