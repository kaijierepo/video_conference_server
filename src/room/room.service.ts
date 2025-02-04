import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtService } from '@nestjs/jwt';
import { PaginationParams } from '../common/interfaces/pagination.interface';
import { ApiResponse } from '../common/interfaces/response.interface';
import { RoomListData, RoomData } from './interfaces/room.interface';
import { DateUtil } from '../common/utils/date.util';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    private jwtService: JwtService,
  ) {}

  async create(createRoomDto: CreateRoomDto, userId: string) {
    const now = new Date();
    createRoomDto.hostId = userId;
    createRoomDto.createdAt = now;
    createRoomDto.updatedAt = now;
    createRoomDto.inviteCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const room = new this.roomModel(createRoomDto);
    return {
      statusCode: 10000,
      message: '创建房间成功',
      data: await room.save(),
    };
  }

  async getList(
    userId: string,
    paginationParams: PaginationParams,
  ): Promise<ApiResponse<RoomListData>> {
    const { page = 1, limit = 10 } = paginationParams;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.roomModel
        .find()
        .populate('hostId', 'mobile username')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.roomModel.countDocuments(),
    ]);

    const list = data.map((room) => ({
      ...room,
      createdAt: DateUtil.formatUTC(room.createdAt),
      updatedAt: DateUtil.formatUTC(room.updatedAt),
      startTime: DateUtil.formatUTC(room.startTime),
      endTime: DateUtil.formatUTC(room.endTime),
    }));

    return {
      statusCode: 10000,
      message: '获取房间列表成功',
      data: {
        list: list as unknown as RoomData[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const room = await this.roomModel.findById(id);
    if (!room) {
      throw new NotFoundException('房间不存在');
    }
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    return await this.roomModel.findByIdAndUpdate(id, updateRoomDto, {
      new: true,
    });
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    const deletedRoom = await this.roomModel.findByIdAndDelete(id);
    if (!deletedRoom) {
      return { statusCode: 10001, message: '房间不存在', data: null };
    }
    return { statusCode: 10000, message: '删除成功', data: null };
  }
}
