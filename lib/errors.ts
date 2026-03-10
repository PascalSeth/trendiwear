export class HttpError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export const isHttpError = (err: unknown): err is HttpError => {
  return typeof err === 'object' && err !== null && 'status' in err
}
