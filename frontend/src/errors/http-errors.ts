export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'No autorizado') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Solicitud inválida') {
    super(message, 400)
    this.name = 'BadRequestError'
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500)
    this.name = 'InternalServerError'
  }
}
