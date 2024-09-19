import { plainToClass } from 'class-transformer';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Filter } from '../shared/apply-filters';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async findAll(@Query('filter') filter?: Filter) {
    return this.users
      .findAll(filter)
      .then((users) => users.map((user) => plainToClass(UserDto, user)));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.users.findOne({ id });
    if (!user) throw new NotFoundException();
    return plainToClass(UserDto, user);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateUserDto) {
    const user = await this.users.create(dto);
    return plainToClass(UserDto, user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.users.update(id, dto);
    if (!user) throw new NotFoundException();
    return plainToClass(UserDto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
