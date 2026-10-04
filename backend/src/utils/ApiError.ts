/**
 * An error that carries an HTTP status code.
 * Throw it anywhere in a request handler; the global error middleware
 * turns it into a consistent JSON response.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
