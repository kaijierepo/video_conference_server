import { Types } from 'mongoose';

export interface RoomData {
  id: string;
  name: string;
  type: string;
  inviteCode: string;
  startTime: string;
  endTime: string;
  routerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  hostId: Types.ObjectId;
  maxParticipants: number;
  currentParticipants: number;
  isRecording: boolean;
  recordingUrl: string;
  description: string;
}

export interface RoomListData {
  list: RoomData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
