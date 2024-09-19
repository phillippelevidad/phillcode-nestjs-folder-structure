import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {
  async send(to: string, body: string): Promise<void> {
    console.log(`Sending SMS to ${to} | Body: ${body}`);
    return Promise.resolve();
  }
}
