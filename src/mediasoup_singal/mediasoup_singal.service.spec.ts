import { Test, TestingModule } from '@nestjs/testing';
import { MediasoupSingalService } from './mediasoup_singal.service';

describe('MediasoupSingalService', () => {
  let service: MediasoupSingalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediasoupSingalService],
    }).compile();

    service = module.get<MediasoupSingalService>(MediasoupSingalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
