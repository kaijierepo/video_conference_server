import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Response<T> {
  statusCode?: number;
  message?: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const responseData = data as any;
        if (responseData?.statusCode !== 10000) {
          return {
            statusCode: responseData.statusCode,
            message: responseData.message,
          };
        }

        return {
          statusCode: 10000,
          message: responseData?.message || 'Request successful',
          data: responseData?.data || responseData,
        };
      }),
    );
  }
}
