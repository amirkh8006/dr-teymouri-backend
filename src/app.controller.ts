import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Application')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'Welcome Route',
    description: 'روت خوش آمد گویی',
  })
  welcome() {
    return {
      statusCode: 200,
      data: 'Welcome to Dr Teymouri API',
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'بررسی سلامت سرویس',
  })
  healthCheck() {
    return {
      statusCode: 200,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
