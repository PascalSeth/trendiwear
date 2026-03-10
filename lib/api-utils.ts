export function mapErrorToResponse(error: unknown, context?: { route?: string }) {
  const isHttp = typeof error === 'object' && error !== null && 'status' in error
  // Safely extract a numeric status if present on the error object
  let status = 500
  if (isHttp) {
    const maybeStatus = (error as { status?: unknown }).status
    status = typeof maybeStatus === 'number' ? maybeStatus : 500
  }

  const message = error instanceof Error ? error.message : 'An unknown error occurred'

  // In production log minimal info; in dev include full error for debugging
  if (process.env.NODE_ENV === 'production') {
    console.error(`[api:${context?.route || 'unknown'}] Error: ${message}`)
  } else {
    console.error(`[api:${context?.route || 'unknown'}]`, error)
  }

  return { status, message }
}
