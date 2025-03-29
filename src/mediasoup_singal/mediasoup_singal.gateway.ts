import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MediasoupSingalService } from './mediasoup_singal.service';

@WebSocketGateway({
  transports: ['websocket'], // 根据需要配置传输方式
  cors: {
    origin: '*', // 根据需要配置跨域
    methods: ['GET', 'POST'],
  },
})
export class MediasoupSingalGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly mediasoupSingalService: MediasoupSingalService,
  ) {}

  @SubscribeMessage('produce')
  produce(@MessageBody() data: any): Promise<any> {
    return this.mediasoupSingalService.produce(data);
  }

  @SubscribeMessage('consume')
  consume(@MessageBody() data: any): Promise<any> {
    return this.mediasoupSingalService.consume(data);
  }

  // 创建消费者传输
  @SubscribeMessage('createConsumerTransport')
  async createConsumerTransport(@MessageBody() data: any): Promise<any> {
    console.log('Received createProducerTransport:', data);
    const result =
      await this.mediasoupSingalService.createConsumerTransport(data);
    return result;
  }

  @SubscribeMessage('resumeProducer')
  resumeProducer(@MessageBody() data: any): Promise<any> {
    return this.mediasoupSingalService.resumeProducer(data);
  }

  @SubscribeMessage('pauseProducer')
  pauseProducer(@MessageBody() data: any): Promise<any> {
    return this.mediasoupSingalService.pauseProducer(data);
  }

  // 连接传输
  @SubscribeMessage('connectTransport')
  connectTransport(@MessageBody() data: any): Promise<any> {
    console.log('Received connectTransport:', data);
    const result = this.mediasoupSingalService.connectTransport(data);
    return result;
  }

  // 获取房价内所有的生产者
  @SubscribeMessage('getProducers')
  async getProducers(@MessageBody() data: any): Promise<any> {
    return this.mediasoupSingalService.getProducers(data);
  }

  // 创建生产者传输
  @SubscribeMessage('createProducerTransport')
  createProducerTransport(@MessageBody() data: any): Promise<any> {
    console.log('Received createProducerTransport:', data);
    const result = this.mediasoupSingalService.createProducerTransport(data);

    return result;
  }

  //连接消费者传输
  @SubscribeMessage('connectConsumerTransport')
  connectConsumerTransport(@MessageBody() data: any): Promise<any> {
    console.log('Received connectConsumerTransport:', data);
    const result = this.mediasoupSingalService.connectConsumerTransport(data);
    return result;
  }

  // 连接生产者传输
  @SubscribeMessage('connectProducerTransport')
  async connectProducerTransport(
    @MessageBody()
    data: {
      transportId: string;
      dtlsParameters: any;
      roomId: string;
      clientId: string;
    },
  ): Promise<any> {
    try {
      console.log('Connecting producer transport:', data);
      const result =
        await this.mediasoupSingalService.connectProducerTransport(data);

      return result;
    } catch (error) {
      console.error('Error connecting producer transport:', error);
      return {
        event: 'connectProducerTransport',
        data: { error: error.message },
      };
    }
  }

  // 使用 @SubscribeMessage 装饰器来处理 'getRouterRtpCapability' 事件
  @SubscribeMessage('getRouterRtpCapability')
  async getRouterRtpCapability(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    try {
      const routerRtpCapability =
        await this.mediasoupSingalService.getRouterRtpCapability(data);

      return routerRtpCapability; // 如果没有回调，直接返回结果
    } catch (error) {
      const errorResult = {
        event: 'error',
        data: { message: error.message },
      };
      return errorResult;
    }
  }

  @SubscribeMessage('resume')
  resume(@MessageBody() data: any): Promise<any> {
    return this.mediasoupSingalService.resume(data);
  }

  // 使用 @SubscribeMessage 装饰器来处理 'message' 事件
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log('Received message:', data);
    // 处理消息并响应客户端
    client.emit('messageResponse', { msg: 'Message received', data });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 加入特定的房间
    client.join(data.roomId);

    // 可以在这里处理其他加入房间的逻辑
    return {
      event: 'joinRoom',
      data: { message: `Joined room ${data.roomId}` },
    };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string; clientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // 离开 socket.io 房间
      client.leave(data.roomId);

      // 清理资源
      await this.mediasoupSingalService.handleClientLeave(
        data.roomId,
        data.clientId,
      );

      return {
        event: 'leaveRoom',
        data: { message: `Left room ${data.roomId}` },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  // 处理客户端断开连接
  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);

    // 获取客户端所在的房间
    const rooms = Array.from(client.rooms.values());

    // 清理每个房间中的资源
    rooms.forEach(async (roomId) => {
      if (roomId !== client.id) {
        // socket.io 会自动创建以客户端 ID 为名的房间
        await this.mediasoupSingalService.handleClientLeave(roomId, client.id);
      }
    });
  }

  afterInit(server: Server) {
    console.log('Gateway initialized');
    this.mediasoupSingalService.setServer(server);
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  // 自定义事件示例
  sendMsgToClient(data: any) {
    this.server.emit('msgToClient', data);
  }
}
