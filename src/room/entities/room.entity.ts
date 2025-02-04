import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DateUtil } from '../../common/utils/date.util';
import { Types, Document } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret.createdAt) {
        ret.createdAt = DateUtil.formatUTC(ret.createdAt);
      }
      if (ret.updatedAt) {
        ret.updatedAt = DateUtil.formatUTC(ret.updatedAt);
      }
      if (ret.startTime) {
        ret.startTime = DateUtil.formatUTC(ret.startTime);
      }
      if (ret.endTime) {
        ret.endTime = DateUtil.formatUTC(ret.endTime);
      }
      return ret;
    },
  },
})
export class Room extends Document {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop()
  type: string;

  @Prop()
  inviteCode: string;

  @Prop()
  startTime: Date;

  @Prop()
  endTime: Date;

  @Prop()
  routerId: string;

  @Prop()
  status: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  hostId: Types.ObjectId;

  @Prop()
  maxParticipants: number;

  @Prop()
  currentParticipants: number;

  @Prop()
  isRecording: boolean;

  @Prop()
  recordingUrl: string;

  @Prop()
  description: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
