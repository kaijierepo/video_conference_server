// 角色枚举
export enum MemberRole {
  HOST = 'HOST', // 主持人
  CO_HOST = 'CO_HOST', // 联合主持人
  SPEAKER = 'SPEAKER', // 发言人
  PARTICIPANT = 'PARTICIPANT', // 普通参会者
  OBSERVER = 'OBSERVER', // 观察者/旁听者
}

// 成员状态枚举
export enum MemberStatus {
  ONLINE = 'ONLINE', // 在线
  OFFLINE = 'OFFLINE', // 离线
  SPEAKING = 'SPEAKING', // 正在发言
  MUTED = 'MUTED', // 已静音
  VIDEO_ON = 'VIDEO_ON', // 视频开启
  VIDEO_OFF = 'VIDEO_OFF', // 视频关闭
  HAND_RAISED = 'HAND_RAISED', // 举手
  SHARING = 'SHARING', // 正在共享屏幕
}

export interface MeetingMember {
  id: string; // 成员唯一ID
  name: string; // 成员名称
  role: MemberRole; // 角色
  status: MemberStatus[]; // 状态（可以同时具有多个状态）
  joinTime: Date; // 加入时间
  mediaInfo: {
    audio: boolean; // 音频状态
    video: boolean; // 视频状态
    screen: boolean; // 屏幕共享状态
  };
  permissions: {
    // 权限控制
    canSpeak: boolean;
    canShare: boolean;
    canChat: boolean;
    // ... 其他权限
  };
}
