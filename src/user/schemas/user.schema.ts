import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends Document {
  @Prop()
  username: string;

  @Prop()
  mobile: string;

  @Prop()
  password: string;

  @Prop({ default: ['user'] })
  roles: string[];

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
