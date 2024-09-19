import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: string) {
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException('Invalid JSON string');
    }
  }
}
