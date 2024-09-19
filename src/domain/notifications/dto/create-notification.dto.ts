import { IsNotEmpty, IsString, validateOrReject } from 'class-validator';

export class CreateNotificationDto {
  constructor(
    userId: string,
    title: string,
    longMessage: string,
    shortMessage: string,
  ) {
    this.userId = userId;
    this.title = title;
    this.longMessage = longMessage;
    this.shortMessage = shortMessage;

    if (arguments.length) {
      validateOrReject(this);
    }
  }

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  longMessage: string;

  @IsString()
  @IsNotEmpty()
  shortMessage: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
