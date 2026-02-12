export interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
}

export interface MongoError extends Error {
  code?: number;
}
