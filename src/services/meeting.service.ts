import { Injectable } from '@nestjs/common';
import { MeetingMemberService } from './meeting-member.service';
import { MemberStatus } from '../types/meeting.types';

@Injectable()
export class MeetingService {
  constructor(private memberService: MeetingMemberService) {}

  // 处理新成员加入
  handleMemberJoin(id: string, name: string) {
    const member = this.memberService.addMember(id, name);
    // 通知其他成员
    this.broadcastMemberJoin(member);
  }

  // 处理成员请求发言
  handleSpeakRequest(id: string) {
    const member = this.memberService.updateMemberStatus(
      id,
      MemberStatus.HAND_RAISED,
    );
    // 通知主持人
    this.notifyHost(member);
  }

  // 处理音视频状态变化
  handleMediaStateChange(
    id: string,
    type: 'audio' | 'video',
    enabled: boolean,
  ) {
    const status =
      type === 'audio'
        ? enabled
          ? MemberStatus.SPEAKING
          : MemberStatus.MUTED
        : enabled
          ? MemberStatus.VIDEO_ON
          : MemberStatus.VIDEO_OFF;

    if (enabled) {
      this.memberService.updateMemberStatus(id, status);
    } else {
      this.memberService.removeMemberStatus(id, status);
    }
  }

  private broadcastMemberJoin(member: any) {
    // TODO: Implement broadcasting logic
    console.log('New member joined:', member);
  }

  private notifyHost(member: any) {
    // TODO: Implement host notification logic
    console.log('Notifying host about:', member);
  }
}
