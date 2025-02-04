import { Test, TestingModule } from '@nestjs/testing';
import { MediasoupSingalGateway } from './mediasoup_singal.gateway';
import { MediasoupSingalService } from './mediasoup_singal.service';

describe('MediasoupSingalGateway', () => {
  let gateway: MediasoupSingalGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediasoupSingalGateway, MediasoupSingalService],
    }).compile();

    gateway = module.get<MediasoupSingalGateway>(MediasoupSingalGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
