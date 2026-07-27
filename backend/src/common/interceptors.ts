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
 * 3. 序列化前将 BigInt 转字符串，避免 JSON.stringify 抛错
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
          data: normalizeBigInt(data) as any,
          requestId,
        };
        return body;
      }),
    );
  }
}

/**
 * 把对象里的 BigInt 全部转成字符串。
 * Express 默认 JSON.stringify 不支持 BigInt，统一在这里处理。
 */
function normalizeBigInt(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(normalizeBigInt);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalizeBigInt(v);
    }
    return out;
  }
  return value;
}