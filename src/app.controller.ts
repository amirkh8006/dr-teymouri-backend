import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Application')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'مسیر خوش آمدگویی',
    description: 'روت خوش آمدگویی',
  })
  welcome() {
    return {
      statusCode: 200,
      data: 'Welcome to Dr Teymouri API',
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'بررسی سلامت',
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
