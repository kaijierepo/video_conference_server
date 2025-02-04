// filepath: /d:/workspace/video_conference_server/src/hash/hash.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HashService {
  md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }
}
