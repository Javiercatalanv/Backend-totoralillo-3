import {ExceptionFilter,Catch,ArgumentsHost,HttpException,HttpStatus,Logger} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
/**
 * Global exception filter that catches all exceptions and transforms them into consistent HTTP responses.
 * 
 * This filter handles both HTTP and non-HTTP exceptions, extracting the appropriate status code
 * and error message. It logs the error details internally and returns a formatted JSON response
 * to the client.
 * 
 * @implements {ExceptionFilter}
 * 
 * @example
 * // Register as a global filter in main.ts
 * app.useGlobalFilters(new AllExceptionsFilter());
 * 
 * @method catch
 * @param {unknown} exception - The caught exception, either HttpException or any other error
 * @param {ArgumentsHost} host - The arguments host providing access to the request/response context
 * 
 * @returns {void} Sends a JSON response with statusCode, message, timestamp, and path
 * 
 * @remarks
 * - HTTP exceptions return their own status code and response message
 * - Non-HTTP exceptions default to 500 Internal Server Error status
 * - All errors are logged with timestamp, method, URL, and stack trace
 * - Response format includes: statusCode, message, timestamp (ISO string), and request path
 */
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = isHttpException
      ? (exception as HttpException).getResponse()
      : { message: 'Error interno del servidor' };

    const message =
      typeof errorResponse === 'string'
        ? errorResponse
        : (errorResponse as any).message ?? 'Error inesperado';

    // Log interno 
    this.logger.error(
      `Status ${status} | ${request.method} ${request.url} | ${JSON.stringify(
        message,
      )}`,
      (exception as any)?.stack,
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
