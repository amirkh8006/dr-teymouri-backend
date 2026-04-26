import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((res: any) => {
        this.responseHandler(res, context, next);
      }),
      catchError((err: HttpException) => {
        this.errorHandler(err, context);
        return throwError(() => err);
      }),
    );
  }

  responseHandler(res: any, context: ExecutionContext, next: CallHandler) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    const newResponse = {
      success: res.statusCode && res.statusCode.toString().startsWith('2') ? true : false,
      ...res,
      error: res.error ? res.error : undefined,
      data: res.data ? res.data : undefined,
    };

    delete newResponse.statusCode;

    return response.status(+res.statusCode).json(newResponse);
  }

  errorHandler(err: HttpException, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    let status: number;
    if (err instanceof HttpException) {
      status = err.getStatus();
    } else {
      this.logger.log('Exception Error => ', err);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    const newError = {
      success: false,
      message: err.message,
      error:
        status != HttpStatus.INTERNAL_SERVER_ERROR &&
        err &&
        err.getResponse() &&
        err.getResponse()['error'] &&
        err.getResponse()['error'].includes('VALIDATION')
          ? JSON.parse(err.getResponse()['error'].split('VALIDATION')[1])
          : undefined,
    };

    response.status(status).json(newError);
  }
}
