import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { BizCode, BizCodeMessages } from "./constants";
import { BizException } from "./exceptions";

interface RespBody<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  requestId: string;
}

/**
 * 全局异常过滤器：把异常统一映射为 { code, message, data, requestId }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("GlobalExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId =
      (req.headers["x-request-id"] as string) ||
      (res.getHeader("x-request-id") as string) ||
      "";

    let code: number = BizCode.INTERNAL_ERROR;
    let message = "服务内部异常";
    let httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let data: unknown = null;

    if (exception instanceof BizException) {
      const body = exception.getResponse() as {
        bizCode: BizCode;
        message?: string;
      };
      code = body.bizCode;
      message = body.message || BizCodeMessages[code] || message;
      httpStatus = exception.getStatus();
    } else if (exception instanceof HttpException) {
      const resp = exception.getResponse() as
        | string
        | { message?: string | string[]; error?: string; statusCode?: number };
      httpStatus = exception.getStatus();
      if (typeof resp === "string") {
        message = resp;
      } else if (resp && Array.isArray(resp.message)) {
        message = resp.message.join("; ");
      } else if (resp?.message) {
        message = String(resp.message);
      }
      // 401 -> TOKEN_EXPIRED/UNAUTHORIZED 友好映射
      if (httpStatus === HttpStatus.UNAUTHORIZED) code = BizCode.UNAUTHORIZED;
      else if (httpStatus === HttpStatus.FORBIDDEN) code = BizCode.FORBIDDEN;
      else if (httpStatus === HttpStatus.NOT_FOUND) code = BizCode.NOT_FOUND;
      else if (httpStatus === HttpStatus.TOO_MANY_REQUESTS)
        code = BizCode.RATE_LIMITED;
      else if (httpStatus >= 400 && httpStatus < 500)
        code = BizCode.BAD_REQUEST;
      if (!/[\u4e00-\u9fff]/.test(message))
        message = BizCodeMessages[code] || '请求失败，请稍后重试';
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error("Unknown exception", String(exception));
    }

    const body: RespBody = {
      code,
      message,
      data,
      requestId,
    };

    res.status(httpStatus).json(body);
  }
}
