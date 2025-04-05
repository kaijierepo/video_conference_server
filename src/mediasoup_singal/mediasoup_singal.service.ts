import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  Router,
  Transport,
  Producer,
  Consumer,
} from 'mediasoup/node/lib/types';
import { createWorker, types } from 'mediasoup';
import { Server } from 'socket.io';
import { ApiProperty, ApiTags, ApiOperation } from '@nestjs/swagger';
import { mediaCodecs } from './config';

interface TransportData {
  transport: types.Transport;
  producers: Map<string, types.Producer>;
  consumers: Map<string, types.Consumer>;
}

interface RouterData {
  router: Router;
  clients: Map<string, ClientData>;
}

interface ClientData {
  producerTransport?: Transport;
  consumerTransport?: Transport;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

// Create a DTO for transport connection
class ConnectTransportDto {
  @ApiProperty({ description: 'Transport ID' })
  transportId: string;

  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'Room ID' })
  roomId: string;

  @ApiProperty({ description: 'DTLS parameters' })
  dtlsParameters: any; // Replace 'any' with proper type
}

@ApiTags('MediaSoup Signaling')
@Injectable()
export class MediasoupSingalService implements OnModuleInit {
  private readonly logger = new Logger(MediasoupSingalService.name);
  private worker: types.Worker;

  private routers = new Map<string, RouterData>();

  // 存储各种资源的 Map，可根据需要进行扩展
  private transports = new Map<string, any>();
  private producers = new Map<string, any>();
  private consumers = new Map<string, any>();
  private webrtcTransportOptions: any;
  private io: Server;

  constructor() {
    this.webrtcTransportOptions = {
      listenInfos: [
        { ip: '0.0.0.0', announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
    };
  }

  async onModuleInit() {
    this.worker = await createWorker({
      logLevel: 'debug',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
      rtcMinPort: 20000,
      rtcMaxPort: 20100,
    });
    // await this.runMediasoup();
    // this.createRtpTransport = this.createRtpTransport.bind(this);
    // this.connectProducerToTransport =
    //   this.connectProducerToTransport.bind(this);
    this.logger.log('Initializing Mediasoup Signal Service...');
  }

  // 将 Gateway 传进来的 Server 保存起来
  @ApiOperation({ summary: 'Set Socket.IO server instance' })
  setServer(server: Server) {
    this.io = server;
  }

  @ApiOperation({ summary: 'Handle hello event' })
  onHello(data: any) {
    this.io.on('hello', (data) => {
      this.io.emit('hello', data);
    });
  }

  // 获取房间内所有的生产者
  @ApiOperation({ summary: '获取房间内所有的生产者' })
  async getProducers(data: any): Promise<any> {
    const routerData = this.routers.get(data.roomId);
    if (!routerData) {
      throw new Error('Router not found');
    }

    console.log(
      'Get producers',
      Array.from(routerData.clients.values()).map(
        (client) => client.producerTransport,
      ),
    );

    const producers = Array.from(routerData.clients.keys())
      .filter((clientId) => clientId !== data.clientId)
      .flatMap((clientId) =>
        Array.from(routerData.clients.get(clientId).producers.values()).map(
          (producer) => ({
            producerId: producer.id,
            kind: producer.kind,
            clientId: data.clientId,
          }),
        ),
      )
      .filter((producer) => producer.producerId);

    return producers;
  }

  // 暂停生产者
  async pauseProducer(data: any) {
    const routerData = this.routers.get(data.roomId);
    if (!routerData) {
      throw new Error('Router not found');
    }

    const clientData = routerData.clients.get(data.clientId);
    if (!clientData) {
      throw new Error('Client not found');
    }

    const producer = clientData.producers.get(data.producerId);
    if (!producer) {
      throw new Error('Producer not found');
    }

    await producer.pause();

    return { success: true };
  }

  // 恢复生产者
  async resumeProducer(data: any) {
    const routerData = this.routers.get(data.roomId);
    if (!routerData) {
      throw new Error('Router not found');
    }

    const clientData = routerData.clients.get(data.clientId);
    if (!clientData) {
      throw new Error('Client not found');
    }

    const producer = clientData.producers.get(data.producerId);
    if (!producer) {
      throw new Error('Producer not found');
    }

    await producer.resume();

    return { success: true };
  }

  // 消费生产者
  async consume(data: any) {
    const routerData = this.routers.get(data.roomId);
    if (!routerData) {
      throw new Error('Router not found');
    }

    const clientData = routerData.clients.get(data.clientId);
    if (!clientData) {
      throw new Error('Client not found');
    }

    const transport = clientData.consumerTransport;
    if (!transport) {
      throw new Error('Consumer transport not found');
    }

    const consumer = await transport.consume({
      producerId: data.producerId,
      rtpCapabilities: data.rtpCapabilities,
      paused: true,
    });

    // 存储消费者
    clientData.consumers.set(consumer.id, consumer);

    return {
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      producerId: consumer.producerId,
    };
  }

  // 连接生产者传输
  async connectProducerTransport(data: any) {
    const routerData = this.routers.get(data.roomId);
    if (!routerData) {
      throw new Error('Router not found');
    }

    const clientData = routerData.clients.get(data.clientId);
    if (!clientData) {
      throw new Error('Client not found');
    }

    const transport = clientData.producerTransport;
    if (!transport) {
      throw new Error('Producer transport not found');
    }

    // Add check for matching transport ID
    if (transport.id !== data.transportId) {
      throw new Error('Transport ID mismatch');
    }

    await transport.connect({ dtlsParameters: data.dtlsParameters });

    return { success: true };
  }

  @ApiOperation({ summary: 'Produce' })
  async produce(data: any) {
    try {
      const routerData = this.routers.get(data.roomId);
      if (!routerData) {
        throw new Error('Router not found');
      }

      const clientData = routerData.clients.get(data.clientId);
      if (!clientData) {
        throw new Error('Client not found');
      }

      const transport = clientData.producerTransport;
      if (!transport) {
        throw new Error('Producer transport not found');
      }

      // 创建 producer
      const producer = await transport.produce({
        kind: data.kind,
        rtpParameters: data.rtpParameters,
        appData: data.appData,
      });

      // 存储 producer
      clientData.producers.set(producer.id, producer);

      // 只通知同一房间的其他用户
      this.io.to(data.roomId).emit('newProducer', {
        clientId: data.clientId,
        producerId: producer.id,
      });

      return {
        id: producer.id,
      };
    } catch (error) {
      console.error('Error in produce:', error);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Connect WebRTC transport' })
  async connectTransport(data: ConnectTransportDto) {
    const clientData = this.routers.get(data.roomId).clients.get(data.clientId);
    const transport = clientData['producerTransport'];
    if (!transport) {
      throw new Error('Transport not found');
    }

    try {
      await transport.connect({ dtlsParameters: data.dtlsParameters });
    } catch (error) {
      console.error('Error connecting transport:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async createRtpTransport(router) {
    const plainTransport = await router.createPlainTransport(
      this.webrtcTransportOptions,
    );
    console.log('PlainTransport created:', plainTransport);

    return plainTransport;
  }

  // 初始化路由器数据
  private initRouterData(router: Router): RouterData {
    return {
      router,
      clients: new Map<string, ClientData>(),
    };
  }

  // 初始化传输数据
  private initTransportData(transport: Transport): TransportData {
    return {
      transport,
      producers: new Map<string, Producer>(),
      consumers: new Map<string, Consumer>(),
    };
  }

  async createProducerTransport(data: { roomId: string; clientId: string }) {
    // 获取房间的路由器数据
    const routerData = this.routers.get(data.roomId);
    if (!routerData) throw new Error('Room not found');

    // 获取或创建客户端数据
    let clientData = routerData.clients.get(data.clientId);
    if (!clientData) {
      clientData = {
        producers: new Map(),
        consumers: new Map(),
      };
      routerData.clients.set(data.clientId, clientData);
    }

    // 创建生产者传输
    const transport = await routerData.router.createWebRtcTransport({
      ...this.webrtcTransportOptions,
      forceTcp: false,
      producing: true,
      consuming: false,
      initialAvailableOutgoingBitrate: 1000000,
      // 确保这些参数正确
      listenIps: [
        {
          ip: '0.0.0.0', // 监听所有接口
          announcedIp: '192.168.110.130', // 重要：需要设置为你的服务器公网IP
        },
      ],
    });
    clientData.producerTransport = transport;

    // 正确处理 ICE candidates
    const validCandidates = transport.iceCandidates.map((candidate) => {
      // 基础候选项属性
      const baseCandidate = {
        foundation: candidate.foundation,
        component: 1,
        protocol: candidate.protocol.toLowerCase(),
        port: candidate.port,
        ip: candidate.ip,
        type: candidate.type,
        priority: candidate.priority,
      };

      // 根据协议类型返回不同的候选项
      if (candidate.protocol.toLowerCase() === 'tcp') {
        // TCP 候选项包含 tcptype
        return {
          ...baseCandidate,
          tcptype: 'passive',
        };
      } else {
        // UDP 候选项不包含 tcptype
        return baseCandidate;
      }
    });

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: validCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  async resume(data: any) {
    const routerData = this.routers.get(data.roomId);
    if (!routerData) throw new Error('Room not found');

    const clientData = routerData.clients.get(data.clientId);
    if (!clientData) throw new Error('Client not found');

    const consumer = clientData.consumers.get(data.consumerId);
    if (!consumer) throw new Error('Consumer not found');

    await consumer.resume();

    return { success: true };
  }

  async connectConsumerTransport(data: any) {
    const routerData = this.routers.get(data.roomId);
    if (!routerData) throw new Error('Room not found');

    const clientData = routerData.clients.get(data.clientId);
    if (!clientData) throw new Error('Client not found');

    const transport = clientData.consumerTransport;
    if (!transport) throw new Error('Consumer transport not found');

    await transport.connect({ dtlsParameters: data.dtlsParameters });

    return { success: true };
  }

  async createConsumerTransport(data: { roomId: string; clientId: string }) {
    try {
      const routerData = this.routers.get(data.roomId);
      if (!routerData) throw new Error('Room not found');

      const clientData = routerData.clients.get(data.clientId);
      if (!clientData) throw new Error('Client not found');

      // 创建消费者传输，添加更多选项
      const transport = await routerData.router.createWebRtcTransport({
        ...this.webrtcTransportOptions,
        forceTcp: false,
        producing: false,
        consuming: true,
        initialAvailableOutgoingBitrate: 1000000,
        // 确保这些参数正确
        listenIps: [
          {
            ip: '0.0.0.0', // 监听所有接口
            announcedIp: '192.168.110.130', // 重要：需要设置为你的服务器公网IP
          },
        ],
      });

      // 监听传输事件
      transport.on('icestatechange', (iceState) => {
        console.log('Consumer transport ICE state changed to', iceState);
      });

      transport.on('dtlsstatechange', (dtlsState) => {
        console.log('Consumer transport DTLS state changed to', dtlsState);
      });

      // Remove the incorrect connectionstatechange event
      // Instead monitor iceselectedtuplechange for connection state
      transport.on('iceselectedtuplechange', (iceState) => {
        console.log('Consumer transport connection tuple changed:', iceState);
      });

      clientData.consumerTransport = transport;

      // 正确处理 ICE candidates
      const validCandidates = transport.iceCandidates.map((candidate) => {
        // 基础候选项属性
        const baseCandidate = {
          foundation: candidate.foundation,
          component: 1,
          protocol: candidate.protocol.toLowerCase(),
          port: candidate.port,
          ip: candidate.ip,
          type: candidate.type,
          priority: candidate.priority,
        };

        // 根据协议类型返回不同的候选项
        if (candidate.protocol.toLowerCase() === 'tcp') {
          // TCP 候选项包含 tcptype
          return {
            ...baseCandidate,
            tcptype: 'passive',
          };
        } else {
          // UDP 候选项不包含 tcptype
          return baseCandidate;
        }
      });

      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: validCandidates,
        dtlsParameters: {
          ...transport.dtlsParameters,
          role: 'server', // 明确指定 DTLS 角色
        },
      };
    } catch (error) {
      console.error('Error creating consumer transport:', error);
      throw new Error(`Failed to create consumer transport: ${error.message}`);
    }
  }

  async connectProducerToTransport(producer, transport, recordRouter) {
    if (producer.kind === 'video') {
      await transport.connect({
        ip: '127.0.0.1',
        port: 5006,
        rtcpPort: 5007,
      });

      const rtpParameters = producer.rtpParameters;

      const rtpConsumer = await transport.consume({
        producerId: producer.id,
        rtpCapabilities: recordRouter.rtpCapabilities, // Assume the recorder supports same formats as mediasoup's router
        paused: true,
      });

      global.rtpConsumer = rtpConsumer;

      console.log('getState', JSON.stringify(await transport.getStats()));

      console.log('Producer connected to transport, 我是转发的流', {
        kind: producer.kind,
        rtpParameters,
      });
    }
  }

  async getRouterRtpCapability(data: any) {
    if (this.routers.has(data.roomId)) {
      return this.routers.get(data.roomId).router.rtpCapabilities;
    } else {
      const router = await this.worker.createRouter({ mediaCodecs });
      const routerData = this.initRouterData(router);
      this.routers.set(data.roomId, routerData); // 存储路由器数据
      // console.log('-----------routerData', data.roomId, routerData);
      return routerData.router.rtpCapabilities;
    }
  }

  @ApiOperation({ summary: 'Get router by room ID' })
  getRouter(roomId: string): types.Router {
    return this.routers.get(roomId).router;
  }

  async runMediasoup() {
    try {
      const worker = await createWorker({
        logLevel: 'debug',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: 20000,
        rtcMaxPort: 20100,
      });

      worker.on('died', () => {
        console.error('mediasoup worker died', worker.pid);
      });

      this.worker = worker;

      const router = await worker.createRouter({
        mediaCodecs: [
          {
            kind: 'audio',
            mimeType: 'audio/opus',
            preferredPayloadType: 111,
            clockRate: 48000,
            channels: 2,
            parameters: {
              minptime: 10,
              useinbandfec: 1,
            },
          },
          {
            kind: 'video',
            mimeType: 'video/VP8',
            preferredPayloadType: 96,
            clockRate: 90000,
          },
        ],
      });

      console.log('---------------router', router);

      global.router = router;

      console.log('Router created with id:', router.id);

      this.io.on('connection', (socket) => {
        console.log('我刚连接上');
        socket.on('getRouterRtpCapability', (data, callback) => {
          console.log('我进来了吗?');
          callback(router.rtpCapabilities);
        });

        socket.on('createWebRtcTransport', async (data, callback) => {
          const transport = await router.createWebRtcTransport(
            this.webrtcTransportOptions,
          );

          const transportParams = {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          };
          console.log('新通道' + transport.id);
          this.transports.set(transport.id, transport); // 存储传输对象
          callback(transportParams);
        });

        socket.on(
          'connectTransport',
          async ({ transportId, dtlsParameters }, callback) => {
            try {
              console.log(
                '-----------callback----connectTransport',
                { transportId, dtlsParameters },
                callback,
              );

              if (!callback) {
                console.error('没有回调方法--------------');
                return;
              }

              if (!this.transports.get(transportId)) {
                console.error(transportId, '没有该通道！！！！！');
                return;
              }

              const transport = this.transports.get(transportId);
              await transport.connect({ dtlsParameters });
              console.log('我创建成功了吗');
              callback();
            } catch (error) {
              console.error('Error connecting transport:', error);
              callback({ error: error.message });
            }
          },
        );

        // 新增 createConsumerTransport 方法
        socket.on('createConsumerTransport', async (data, callback) => {
          try {
            const transport = await router.createWebRtcTransport(
              this.webrtcTransportOptions,
            );

            // 存储传输对象到内存
            this.transports.set(transport.id, transport);

            console.log(
              'Consumer WebRtcTransport created with id:',
              transport.id,
            );

            callback({
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
            });
          } catch (error) {
            console.error('Error creating Consumer WebRtcTransport:', error);
            callback({ error: error.message });
          }
        });

        socket.on('getProducerId', async (data, callback) => {
          const producerIds = Array.from(this.producers.keys());
          console.log('###producerIds####', Array.from(this.producers.keys()));
          if (producerIds.length > 0) {
            callback({ producerId: producerIds[producerIds.length - 2] });
          } else {
            callback({ error: 'No producer found' });
          }
        });

        socket.on(
          'produce',
          async ({ transportId, kind, rtpParameters }, callback) => {
            try {
              console.log('--------------callback', callback);

              if (!this.transports.get(transportId)) {
                console.error(transportId, '没有该通道！！！！！');
                return;
              }

              const recordRouter = global.router;

              const transport = this.transports.get(transportId);
              const producer = await transport.produce({ kind, rtpParameters });

              if (kind === 'video') {
                const plainTransport =
                  await this.createRtpTransport(recordRouter);
                await this.connectProducerToTransport(
                  producer,
                  plainTransport,
                  recordRouter,
                );
                // startRecording(plainTransport);
              }

              // console.log('-------------producer', plainTransport, producer.id)

              // 存储生产者对象到内存
              this.producers.set(producer.id, producer);

              callback({ id: producer.id });
            } catch (error) {
              console.error('Error connecting transport:', error);
              callback({ error: error.message });
            }
          },
        );

        socket.on(
          'consume',
          async ({ transportId, producerId, rtpCapabilities }, callback) => {
            try {
              const transport = this.transports.get(transportId);
              if (!transport) {
                throw new Error(`Transport with id ${transportId} not found`);
              }

              const consumer = await transport.consume({
                producerId,
                rtpCapabilities,
                paused: true,
              });

              // 存储消费者对象到内存
              this.consumers.set(consumer.id, consumer);

              console.log('-------------consumer', consumer.id, consumer.kind);

              callback({
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
              });
            } catch (error) {
              console.error('Error consuming:', error);
              callback({ error: error.message });
            }
          },
        );

        socket.on('resumeConsumer', async ({ consumerId }, callback) => {
          const consumer = this.consumers.get(consumerId);
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@consumerId', consumerId);
          await consumer.resume();
          callback();
        });

        // 处理 trickle ICE 候选者
        socket.on('iceCandidate', ({ transportId, candidate }) => {
          const transport = this.transports.get(transportId);
          if (transport) {
            transport.addIceCandidate(candidate);
          }
        });

        // socket.on('getProducerId', async (data, callback) => {
        //   const producerIds = await redisClient.hKeys('producers');
        //   if (producerIds.length > 0) {
        //     callback({ producerId: producerIds[0] });
        //   } else {
        //     callback({ error: 'No producer found' });
        //   }
        // });
      });
    } catch (error) {
      console.error('Error creating mediasoup worker:', error);
    }
  }

  async handleClientLeave(roomId: string, clientId: string) {
    try {
      const routerData = this.routers.get(roomId);
      if (!routerData) {
        throw new Error('Router not found');
      }

      const clientData = routerData.clients.get(clientId);
      if (!clientData) {
        return; // 客户端已经不存在
      }

      // 关闭所有 producers
      for (const producer of clientData.producers.values()) {
        producer.close();
      }

      // 关闭所有 consumers
      for (const consumer of clientData.consumers.values()) {
        consumer.close();
      }

      // 关闭 transport
      if (clientData.producerTransport) {
        clientData.producerTransport.close();
      }
      if (clientData.consumerTransport) {
        clientData.consumerTransport.close();
      }

      // 从 RouterData 中删除客户端数据
      routerData.clients.delete(clientId);

      // 通知房间内其他用户
      this.io.to(roomId).emit('clientLeft', {
        clientId,
        roomId,
      });

      // 如果房间没有用户了，可以考虑清理房间
      if (routerData.clients.size === 0) {
        routerData.router.close();
        this.routers.delete(roomId);
      }
    } catch (error) {
      console.error('Error handling client leave:', error);
      throw error;
    }
  }
}
