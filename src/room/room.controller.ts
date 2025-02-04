import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaginationParams } from '../common/interfaces/pagination.interface';
import { ApiResponse } from '../common/interfaces/response.interface';
import { RoomListData } from './interfaces/room.interface';

@Controller('api/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('/create')
  create(@Body() createRoomDto: CreateRoomDto, @CurrentUser() user: any) {
    return this.roomService.create(createRoomDto, user.sub);
  }

  @Post('/list')
  getList(
    @CurrentUser() user: any,
    @Body() paginationParams: PaginationParams = { page: 1, limit: 10 },
  ): Promise<ApiResponse<RoomListData>> {
    return this.roomService.getList(user.sub, paginationParams);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  @Post('/update')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomService.update(id, updateRoomDto);
  }

  @Post('/delete')
  remove(@Body('id') id: string) {
    return this.roomService.remove(id);
  }

  @Public()
  @Get('/public')
  publicRoute() {
    return 'This is a public route';
  }
}
