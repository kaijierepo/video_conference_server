import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  readonly mobile: string;

  @IsString()
  @MinLength(6)
  readonly password: string;
}
