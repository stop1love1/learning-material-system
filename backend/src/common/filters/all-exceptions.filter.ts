import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

/**
 * Catches every exception and returns a consistent envelope. Maps MongoDB
 * duplicate-key (11000) → 409 Conflict. Adapted from reference
 * `catch-everything.filter.ts` (uses Nest Logger instead of winston).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    let httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let error: string;
    let message: string | string[];

    if (isMongoDuplicateKeyError(exception)) {
      httpStatus = HttpStatus.CONFLICT;
      error = 'Conflict';
      const fields = exception.keyValue ? Object.keys(exception.keyValue) : [];
      message = fields.length
        ? `Duplicate value for unique field(s): ${fields.join(', ')}`
        : 'Duplicate value violates a unique constraint';
    } else if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const responseMessage =
        typeof response === 'object' && response !== null && 'message' in response
          ? (response as Record<string, unknown>).message
          : exception.message;
      message =
        typeof responseMessage === 'string'
          ? responseMessage
          : Array.isArray(responseMessage)
            ? (responseMessage as string[])
            : exception.message;
      error =
        typeof response === 'object' && response !== null && 'error' in response
          ? ((response as Record<string, unknown>).error as string)
          : exception.name;
    } else {
      error = 'Internal Server Error';
      message = exception instanceof Error ? exception.message : 'An unexpected error occurred';
    }

    const responseBody = {
      statusCode: httpStatus,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    if (httpStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const text = Array.isArray(message) ? message.join('; ') : message;
      this.logger.error(
        `${request.method} ${request.url} → ${text}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}

function isMongoDuplicateKeyError(e: unknown): e is { code: 11000; keyValue?: Record<string, unknown> } {
  return typeof e === 'object' && e !== null && (e as { code?: number }).code === 11000;
}
