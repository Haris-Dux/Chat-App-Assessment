import type { ApiErrorBody } from '@concierge/contracts';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';

interface HttpExceptionPayload {
  message?: string | string[];
  details?: ApiErrorBody['details'];
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toBody(exception);

    if (body.statusCode >= 500) {
      this.logger.error(exception);
    }

    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: 500,
        error: STATUS_CODES[500] ?? 'Error',
        message: 'Something went wrong on our side',
      };
    }

    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    const payload: HttpExceptionPayload =
      typeof response === 'string' ? { message: response } : response;

    return {
      statusCode,
      error: STATUS_CODES[statusCode] ?? 'Error',
      message: [payload.message ?? exception.message].flat().join(', '),
      ...(payload.details && { details: payload.details }),
    };
  }
}
