import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop()
  username: string;

  @Prop()
  mobile: string;

  @Prop()
  password: string;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;

  @Prop()
  avatar?: string;

  id: number;
  email?: string;
  role?: string;
  status?: string;
  lastLoginTime?: Date;
  deviceInfo?: string;
  preferences?: {
    microphoneMuted?: boolean;
    cameraMuted?: boolean;
    preferredLanguage?: string;
    notificationEnabled?: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
