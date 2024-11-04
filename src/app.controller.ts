import { Controller, Get, Logger } from '@nestjs/common';

@Controller('app')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Get('test-logger')
  testLogger() {
    this.logger.verbose('Test verbose message');
    this.logger.debug('Test debug message');
    this.logger.log('Test log message');
    this.logger.warn('Test warn message');
    this.logger.error('Test error message');
    return 'Logger test complete';
  }
}
