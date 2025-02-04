export class CreateRoomDto {
  id: string;

  name: string;

  type: string;

  inviteCode: string;

  startTime: Date;

  endTime: Date;

  routerId: string;

  status: string;

  createdAt: Date;

  updatedAt: Date;

  hostId: string;

  maxParticipants: number;

  currentParticipants: number;

  isRecording: boolean;

  recordingUrl: string;

  description: string;
}
