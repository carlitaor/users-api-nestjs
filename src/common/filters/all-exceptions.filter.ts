import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  HttpExceptionResponse,
  MongoError,
} from '../interface/error-exception-interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const httpResponse = exceptionResponse as HttpExceptionResponse;
        message = httpResponse.message || exception.message;
        error = httpResponse.error || exception.name;
      } else {
        message = exceptionResponse;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      // MongoDB/Mongoose
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Error de validación';
        error = 'Validation Error';
      } else if (exception.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'ID inválido';
        error = 'Cast Error';
      } else if (
        exception.name === 'MongoError' ||
        (exception as MongoError).code === 11000
      ) {
        status = HttpStatus.CONFLICT;
        message = 'Valor duplicado en campo único';
        error = 'Duplicate Key Error';
      }
    }

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    });
  }
}
