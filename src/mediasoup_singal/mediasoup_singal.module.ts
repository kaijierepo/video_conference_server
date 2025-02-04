import { Module } from '@nestjs/common';
import { MediasoupSingalService } from './mediasoup_singal.service';
import { MediasoupSingalGateway } from './mediasoup_singal.gateway';

@Module({
  providers: [MediasoupSingalGateway, MediasoupSingalService],
})
export class MediasoupSingalModule {}
