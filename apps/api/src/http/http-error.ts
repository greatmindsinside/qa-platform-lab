/**
 * @fileoverview Typed HTTP errors for consistent API responses.
 *
 * **What:** Error subclass carrying `statusCode` (+ optional code).
 * **Why:** Application services throw these; the Fastify error handler maps
 * them to JSON without leaking stack traces to clients.
 */

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    if (code !== undefined) this.code = code;
  }
}
