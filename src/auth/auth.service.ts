import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }

  async create(createAuthDto: CreateUserDto) {
    try {

      const { password, ...userProps } = createAuthDto;

      const user = this.userRepository.create({
        ...userProps,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);
      const { password: _, ...userWithoutPassword } = user;


      return {
        ...userWithoutPassword,
        token: this.getJWTToken({ id: user.id }),
      }


    } catch (error) {
      this.handleDBError(error);
    }
  }

  async login(loginAuthDto: LoginUserDto) {
    try {
      const { email, password } = loginAuthDto;

      const user = await this.userRepository.findOne({
        where: { email },
        select: { email: true, password: true, id: true },
      });

      if (!user) { throw new UnauthorizedException('User or password is incorrect'); }

      if (!bcrypt.compareSync(password, user.password)) { throw new UnauthorizedException('User or password is incorrect'); }


      return {
        ...user,
        token: this.getJWTToken({ id: user.id }),
      };

    } catch (error) {
      this.handleDBError(error);
    }
  }

  private getJWTToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBError(error: any) {
    if (error) {
      console.log(error)
      throw new Error('Please check your logs');
    }
    throw error;
  }

}
