import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

interface RespBody<T = unknown> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

/**
 * 全局响应拦截器：
 * 1. 自动注入 X-Request-Id（请求头不存在则生成）
 * 2. 统一包装响应为 { code, message, data, requestId }
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    let requestId = req.headers['x-request-id'] as string | undefined;
    if (!requestId) {
      requestId = uuidv4();
      req.headers['x-request-id'] = requestId;
    }
    res.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      map((data: unknown) => {
        const body: RespBody = {
          code: 0,
          message: 'ok',
          data: data ?? null,
          requestId,
        };
        return body;
      }),
    );
  }
}