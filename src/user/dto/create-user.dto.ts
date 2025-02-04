export class CreateUserDto {
  readonly username: string;
  readonly mobile: string;
  readonly password: string;
  readonly avatar?: string; // 用户头像
  readonly email?: string; // 用户邮箱
  readonly role?: string; // 用户角色，如管理员、普通用户等
  readonly status?: string; // 用户状态，如在线、离线等
  readonly lastLoginTime?: Date; // 最后登录时间
  readonly deviceInfo?: string; // 设备信息，如浏览器、操作系统等
  readonly preferences?: {
    microphoneMuted?: boolean; // 麦克风是否静音
    cameraMuted?: boolean; // 摄像头是否关闭
    preferredLanguage?: string; // 偏好语言
    notificationEnabled?: boolean; // 是否开启通知
  };
}
