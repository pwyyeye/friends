import { HttpException, HttpStatus } from '@nestjs/common';
import { BizCode } from './constants';

/**
 * 业务异常：携带业务错误码和 HTTP 状态码
 * 默认 HTTP 400，由全局过滤器统一转换为统一响应格式
 */
export class BizException extends HttpException {
  constructor(
    public readonly bizCode: BizCode,
    message?: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ bizCode, message: message ?? null }, httpStatus);
  }
}