import {
    IsEmail, IsOptional, IsString, validateOrReject
} from 'class-validator';

export class SendNotificationDto {
  constructor(
    title: string,
    longMessage: string,
    shortMessage: string,
    email: string,
    phone: string,
  ) {
    this.title = title;
    this.longMessage = longMessage;
    this.shortMessage = shortMessage;
    this.email = email;
    this.phone = phone;

    if (arguments.length) {
      validateOrReject(this);
    }
  }

  @IsString()
  title: string;

  @IsString()
  longMessage: string;

  @IsString()
  @IsOptional()
  shortMessage?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
