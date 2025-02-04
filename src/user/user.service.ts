import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { HashService } from '../hash/hash.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.userModel.findOne({
      mobile: createUserDto.mobile,
    });
    if (user) {
      return { statusCode: 10001, message: '用户已存在' }; // 409 Conflict
    }
    const hashedPassword = this.hashService.md5(createUserDto.password);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async login(createUserDto: CreateUserDto) {
    const hashedPassword = this.hashService.md5(createUserDto.password);
    const user = await this.userModel.findOne({
      mobile: createUserDto.mobile,
      password: hashedPassword,
    });

    if (!user) {
      return { statusCode: 10001, message: '用户不存在或密码错误' };
    }

    const payload = {
      sub: user._id,
      mobile: user.mobile,
      roles: user.roles || ['user'],
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '240h',
    });

    return {
      statusCode: 10000,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          mobile: user.mobile,
          roles: user.roles || ['user'],
        },
      },
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
