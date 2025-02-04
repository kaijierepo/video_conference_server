import { Injectable } from '@nestjs/common';
import {
  MemberRole,
  MemberStatus,
  MeetingMember,
} from '../types/meeting.types';

@Injectable()
export class MeetingMemberService {
  private members: Map<string, MeetingMember> = new Map();

  // 添加新成员
  addMember(
    id: string,
    name: string,
    role: MemberRole = MemberRole.PARTICIPANT,
  ): MeetingMember {
    const member: MeetingMember = {
      id,
      name,
      role,
      status: [MemberStatus.ONLINE],
      joinTime: new Date(),
      mediaInfo: {
        audio: false,
        video: false,
        screen: false,
      },
      permissions: this.getDefaultPermissions(role),
    };

    this.members.set(id, member);
    return member;
  }

  // 获取默认权限
  private getDefaultPermissions(role: MemberRole) {
    switch (role) {
      case MemberRole.HOST:
      case MemberRole.CO_HOST:
        return {
          canSpeak: true,
          canShare: true,
          canChat: true,
        };
      case MemberRole.SPEAKER:
        return {
          canSpeak: true,
          canShare: true,
          canChat: true,
        };
      case MemberRole.PARTICIPANT:
        return {
          canSpeak: false,
          canShare: false,
          canChat: true,
        };
      case MemberRole.OBSERVER:
        return {
          canSpeak: false,
          canShare: false,
          canChat: false,
        };
    }
  }

  // 更新成员状态
  updateMemberStatus(id: string, status: MemberStatus) {
    const member = this.members.get(id);
    if (member) {
      if (!member.status.includes(status)) {
        member.status.push(status);
      }
    }
  }

  // 移除成员状态
  removeMemberStatus(id: string, status: MemberStatus) {
    const member = this.members.get(id);
    if (member) {
      member.status = member.status.filter((s) => s !== status);
    }
  }

  // 更改成员角色
  changeMemberRole(id: string, newRole: MemberRole) {
    const member = this.members.get(id);
    if (member) {
      member.role = newRole;
      member.permissions = this.getDefaultPermissions(newRole);
    }
  }

  // 获取所有发言者
  getSpeakers(): MeetingMember[] {
    return Array.from(this.members.values()).filter((member) =>
      member.status.includes(MemberStatus.SPEAKING),
    );
  }

  // 获取所有举手的成员
  getHandRaisedMembers(): MeetingMember[] {
    return Array.from(this.members.values()).filter((member) =>
      member.status.includes(MemberStatus.HAND_RAISED),
    );
  }

  // 移除成员
  removeMember(id: string) {
    this.members.delete(id);
  }
}
