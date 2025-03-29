import { types } from 'mediasoup';

export const mediaCodecs: types.RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    preferredPayloadType: 111,
    clockRate: 48000,
    channels: 2,
    parameters: {
      minptime: 10,
      useinbandfec: 1,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    preferredPayloadType: 96,
    clockRate: 90000,
  },
];
