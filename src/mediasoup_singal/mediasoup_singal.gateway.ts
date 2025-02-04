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

  // 创建消费者传输
  @SubscribeMessage('createConsumerTransport')
  createConsumerTransport(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
    callback: (result: any) => void,
  ): void {
    console.log('Received createProducerTransport:', data);
    const result = this.mediasoupSingalService.createConsumerTransport(data);
    callback(result);
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

  afterInit(server: Server) {
    console.log('Gateway initialized');
    this.mediasoupSingalService.setServer(server);
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  // 自定义事件示例
  sendMsgToClient(data: any) {
    this.server.emit('msgToClient', data);
  }
}
