import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.log(`Email to ${to} | Subject: ${subject} | Body: ${body}`);
    return Promise.resolve();
  }
}
